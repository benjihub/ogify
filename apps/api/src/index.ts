/**
 * Ogify API — Cloudflare Worker
 *
 * Stable binary endpoints:
 *   POST /render/template
 *   POST /render/url
 *
 * Production JSON/public-image endpoints:
 *   POST /v1/render/template
 *   POST /v1/render/url
 *   POST /v1/render/composite
 *   GET  /i/:id.png
 *   GET  /me/usage and /v1/me/usage
 */
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { MiddlewareHandler } from "hono";
import type {
  Env,
  AuthContext,
  TemplateRenderRequest,
  ScreenshotRequest,
  CompositeRenderRequest,
  PublicRenderResponse,
} from "./types/index.js";
import { makeSupabase } from "./lib/supabase.js";
import { validateApiKey, incrementUsage, markApiKeyUsed, nextResetDate } from "./lib/auth.js";
import { renderTemplateSvg, TEMPLATE_IDS } from "./lib/svg-templates/index.js";
import { svgToPng, cacheKey } from "./lib/renderers/template.js";
import { screenshotUrl } from "./lib/renderers/screenshot.js";
import { renderCompositeSvg } from "./lib/renderers/composite.js";
import { verifyPaddleWebhook, processPaddleEvent } from "./lib/paddle.js";
import { checkApiRateLimit, checkDemoRateLimit } from "./lib/rate-limit.js";
import { isSafeHexColor, parsePublicHttpUrl } from "./lib/security.js";
import { getPublicImage, imageContentId, makePublicImageUrl, persistPublicImage } from "./lib/public-images.js";

type HonoEnv = {
  Bindings: Env;
  Variables: { auth: AuthContext; requestId: string };
};

const app = new Hono<HonoEnv>();

app.use("*", logger());
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  c.header("X-Request-Id", requestId);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "no-referrer");
});
app.use(
  "*",
  cors({
    origin: ["https://www.ogify.online", "https://ogify.online", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-api-key"],
    exposeHeaders: [
      "X-Renders-Used",
      "X-Renders-Limit",
      "X-Cache",
      "X-Request-Id",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86_400,
  })
);

const requireApiKey: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const rawKey = c.req.header("x-api-key") ?? "";
  const supabase = makeSupabase(c.env);
  const result = await validateApiKey(rawKey, supabase);

  if ("error" in result) {
    if (result.status === 429) c.header("Retry-After", String(secondsUntilNextMonth()));
    return jsonError(c, result.status, result.code, result.error);
  }

  const rate = await checkApiRateLimit(c.env.CACHE, result.ctx.apiKeyId, result.ctx.plan);
  c.header("X-RateLimit-Limit", String(rate.limit));
  c.header("X-RateLimit-Remaining", String(rate.remaining));
  c.header("X-RateLimit-Reset", String(rate.resetSeconds));
  if (!rate.allowed) {
    c.header("Retry-After", String(rate.resetSeconds));
    return jsonError(c, 429, "RATE_LIMITED", "Too many requests. Retry after the current rate-limit window resets.");
  }

  c.set("auth", result.ctx);
  await next();
};

// ── Health, discovery and public image delivery ───────────────────────────
app.get("/", (c) => c.json({
  name: "Ogify API",
  status: "ok",
  docs: "https://ogify.online/docs",
  health: `${new URL(c.req.url).origin}/health`,
}));

app.get("/health", (c) => c.json({
  status: "ok",
  env: c.env.OGIFY_ENV,
  version: "2026.10-production",
  ts: new Date().toISOString(),
}));

app.get("/openapi.json", (c) => c.json(openApiDocument(new URL(c.req.url).origin)));

app.get("/i/:id.png", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[a-f0-9]{24,64}$/i.test(id)) {
    return jsonError(c, 404, "NOT_FOUND", "Image not found.");
  }
  const etag = `"${id}"`;
  if (c.req.header("If-None-Match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  const png = await getPublicImage(c.env.CACHE, id);
  if (!png) return jsonError(c, 404, "NOT_FOUND", "Image not found or expired.");
  return new Response(png.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
      ETag: etag,
      "X-Cache": "HIT",
    },
  });
});

app.on("HEAD", "/i/:id.png", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[a-f0-9]{24,64}$/i.test(id)) {
    return new Response(null, { status: 404 });
  }

  const png = await getPublicImage(c.env.CACHE, id);

  if (!png) {
    return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(png.byteLength),
      ETag: `"${id}"`,
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
});

// ── Public demo — tightly limited, no account required ────────────────────
app.post("/demo/render/template", async (c) => {
  const clientId = c.req.header("CF-Connecting-IP") ?? "anonymous";
  const rate = await checkDemoRateLimit(c.env.CACHE, clientId);
  c.header("X-RateLimit-Limit", String(rate.limit));
  c.header("X-RateLimit-Remaining", String(rate.remaining));
  if (!rate.allowed) {
    c.header("Retry-After", String(rate.resetSeconds));
    return jsonError(c, 429, "DEMO_RATE_LIMITED", "Demo render limit reached. Create a free account for API access.");
  }

  const body = await readJson<Partial<TemplateRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateTemplateBody(body.value, true);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);

  try {
    const request: TemplateRenderRequest = { ...validation.value, width: 1200, height: 630 };
    const svg = renderTemplateSvg(request, { showOgifyMark: true });
    const png = await svgToPng(svg, { width: 1200, height: 630 });
    return pngResponse(png, "MISS", undefined, "public, max-age=300");
  } catch (error) {
    console.error("[demo/template]", error);
    return jsonError(c, 500, "RENDER_ERROR", "Demo render failed.");
  }
});

// ── Backward-compatible binary endpoints ──────────────────────────────────
app.post("/render/template", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<TemplateRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateTemplateBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);

  const auth = c.get("auth");
  try {
    const result = await renderTemplatePng(c.env, validation.value, auth);
    recordSuccessfulRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
    return pngResponse(result.png, result.cache, auth, "public, max-age=31536000, immutable");
  } catch (error) {
    await recordFailedRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
    console.error("[render/template]", error);
    return jsonError(c, 500, "RENDER_ERROR", "Template render failed.");
  }
});

app.post("/render/url", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<ScreenshotRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateScreenshotBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);

  const auth = c.get("auth");
  try {
    const result = await renderScreenshotPng(c.env, validation.value);
    recordSuccessfulRender(c, auth, "url", null, Date.now() - startedAt);
    return pngResponse(result.png, result.cache, auth, "public, max-age=300, stale-while-revalidate=300");
  } catch (error) {
    await recordFailedRender(c, auth, "url", null, Date.now() - startedAt);
    console.error("[render/url]", error);
    return jsonError(c, 500, "SCREENSHOT_ERROR", "Screenshot failed. The target may block automated browsers or be unavailable.");
  }
});

// ── Versioned JSON endpoints — return immutable public image URLs ─────────
app.post("/v1/render/template", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<TemplateRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateTemplateBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");

  try {
    const result = await renderTemplatePng(c.env, validation.value, auth);
    const id = await imageContentId(result.png);
    await persistPublicImage(c.env.CACHE, id, result.png);
    recordSuccessfulRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
    return c.json(publicRenderResponse(c, id, result.cache, validation.value.width ?? 1200, validation.value.height ?? 630, auth));
  } catch (error) {
    await recordFailedRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
    console.error("[v1/render/template]", error);
    return jsonError(c, 500, "RENDER_ERROR", "Template render failed.");
  }
});

app.post("/v1/render/url", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<ScreenshotRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateScreenshotBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");

  try {
    const result = await renderScreenshotPng(c.env, validation.value);
    const id = await imageContentId(result.png);
    await persistPublicImage(c.env.CACHE, id, result.png);
    recordSuccessfulRender(c, auth, "url", null, Date.now() - startedAt);
    return c.json(publicRenderResponse(c, id, result.cache, validation.value.viewport_width ?? 1200, validation.value.viewport_height ?? 630, auth));
  } catch (error) {
    await recordFailedRender(c, auth, "url", null, Date.now() - startedAt);
    console.error("[v1/render/url]", error);
    return jsonError(c, 500, "SCREENSHOT_ERROR", "Screenshot failed. The target may block automated browsers or be unavailable.");
  }
});

app.post("/v1/render/composite", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<CompositeRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateCompositeBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");

  try {
    const result = await renderCompositePng(c.env, validation.value, auth);
    const id = await imageContentId(result.png);
    await persistPublicImage(c.env.CACHE, id, result.png);
    recordSuccessfulRender(c, auth, "template", "composite", Date.now() - startedAt);
    return c.json(publicRenderResponse(c, id, result.cache, validation.value.width ?? 1200, validation.value.height ?? 630, auth));
  } catch (error) {
    await recordFailedRender(c, auth, "template", "composite", Date.now() - startedAt);
    console.error("[v1/render/composite]", error);
    return jsonError(c, 500, "COMPOSITE_RENDER_ERROR", "Composite render failed.");
  }
});

// ── Usage ─────────────────────────────────────────────────────────────────
const usageHandler = async (c: Context<HonoEnv>) => {
  const { userId, plan, rendersUsed, rendersLimit } = c.get("auth");
  return c.json({
    plan,
    renders_used: rendersUsed,
    renders_limit: rendersLimit,
    renders_remaining: Math.max(0, rendersLimit - rendersUsed),
    period: new Date().toISOString().slice(0, 7),
    resets_on: nextResetDate(),
    user_id: userId,
  });
};
app.get("/me/usage", requireApiKey, usageHandler);
app.get("/v1/me/usage", requireApiKey, usageHandler);

// ── Paddle ────────────────────────────────────────────────────────────────
app.post("/webhooks/paddle", async (c) => {
  let payload;
  try {
    payload = await verifyPaddleWebhook(c.req.raw.clone() as unknown as Request, c.env.PADDLE_WEBHOOK_SECRET);
  } catch (error) {
    console.warn("[webhook/paddle] Verification failed:", (error as Error).message);
    return jsonError(c, 401, "INVALID_WEBHOOK_SIGNATURE", "Invalid signature.");
  }

  const eventId = (payload as { event_id?: string }).event_id;
  if (eventId) {
    const idempotencyKey = `paddle-event:${eventId}`;
    const eventState = await c.env.CACHE.get(idempotencyKey);
    if (eventState === "processed") return c.json({ received: true, duplicate: true });
    if (eventState === "processing") return c.json({ received: true, processing: true }, 202);
    await c.env.CACHE.put(idempotencyKey, "processing", { expirationTtl: 120 });
    try {
      await processPaddleEvent(payload, makeSupabase(c.env), c.env);
      await c.env.CACHE.put(idempotencyKey, "processed", { expirationTtl: 60 * 60 * 24 * 30 });
    } catch (error) {
      await c.env.CACHE.delete(idempotencyKey);
      console.error("[webhook/paddle] Processing error:", error);
      return jsonError(c, 500, "WEBHOOK_PROCESSING_FAILED", "Processing failed.");
    }
    return c.json({ received: true });
  }

  try {
    await processPaddleEvent(payload, makeSupabase(c.env), c.env);
  } catch (error) {
    console.error("[webhook/paddle] Processing error:", error);
    return jsonError(c, 500, "WEBHOOK_PROCESSING_FAILED", "Processing failed.");
  }
  return c.json({ received: true });
});

app.notFound((c) => jsonError(c, 404, "NOT_FOUND", "Not found."));
app.onError((error, c) => {
  console.error("[unhandled]", { requestId: c.get("requestId"), error });
  return jsonError(c, 500, "INTERNAL_ERROR", "Internal server error.");
});

export default app;

// ── Render helpers ────────────────────────────────────────────────────────
type RenderedPng = { png: Uint8Array; cache: "HIT" | "MISS"; key: string };

async function renderTemplatePng(env: Env, request: TemplateRenderRequest, auth: AuthContext): Promise<RenderedPng> {
  const showOgifyMark = auth.plan === "free";
  const key = await cacheKey({ kind: "template-v2", ...request, showOgifyMark });
  const cached = await getCachedPng(env.CACHE, `template:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const svg = renderTemplateSvg(request, { showOgifyMark });
  const png = await svgToPng(svg, { width: request.width ?? 1200, height: request.height ?? 630 });
  await cachePng(env.CACHE, `template:${key}`, png, 60 * 60 * 24 * 365);
  return { png, cache: "MISS", key };
}

async function renderScreenshotPng(env: Env, request: ScreenshotRequest): Promise<RenderedPng> {
  const key = await cacheKey({ kind: "screenshot-v2", ...request });
  const cached = await getCachedPng(env.CACHE, `screenshot:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const png = await screenshotUrl(env, {
    url: request.url,
    viewportWidth: request.viewport_width ?? 1200,
    viewportHeight: request.viewport_height ?? 630,
    delay: request.delay ?? 0,
    waitUntil: request.wait_until ?? "networkidle0",
  });
  await cachePng(env.CACHE, `screenshot:${key}`, png, 300);
  return { png, cache: "MISS", key };
}

async function renderCompositePng(env: Env, request: CompositeRenderRequest, auth: AuthContext): Promise<RenderedPng> {
  const key = await cacheKey({ kind: "composite-v1", ...request, mark: auth.plan === "free" });
  const cached = await getCachedPng(env.CACHE, `composite:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const screenshot = await screenshotUrl(env, {
    url: request.url,
    viewportWidth: request.viewport_width ?? 1280,
    viewportHeight: request.viewport_height ?? 800,
    delay: request.delay ?? 0,
    waitUntil: request.wait_until ?? "networkidle0",
  });
  const width = request.width ?? 1200;
  const height = request.height ?? 630;
  const svg = renderCompositeSvg({
    screenshot,
    title: request.title,
    author: request.author,
    tag: request.tag,
    brand: request.brand,
    accentColor: request.accent_color,
    backgroundColor: request.background_color,
    width,
    height,
    showOgifyMark: auth.plan === "free",
  });
  const png = await svgToPng(svg, { width, height });
  await cachePng(env.CACHE, `composite:${key}`, png, 600);
  return { png, cache: "MISS", key };
}

async function getCachedPng(kv: KVNamespace, key: string): Promise<Uint8Array | null> {
  const buffer = await kv.get(key, "arrayBuffer");
  return buffer ? new Uint8Array(buffer) : null;
}

async function cachePng(kv: KVNamespace, key: string, png: Uint8Array, expirationTtl: number): Promise<void> {
  await kv.put(key, png.buffer as ArrayBuffer, { expirationTtl });
}

function pngResponse(png: Uint8Array, cache: "HIT" | "MISS", auth?: AuthContext, cacheControl = "public, max-age=31536000, immutable"): Response {
  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Content-Length": String(png.byteLength),
    "Cache-Control": cacheControl,
    "X-Cache": cache,
  };
  if (auth) {
    headers["X-Renders-Used"] = String(Math.min(auth.rendersLimit, auth.rendersUsed + 1));
    headers["X-Renders-Limit"] = String(auth.rendersLimit);
  }
  return new Response(png.buffer as ArrayBuffer, { headers });
}

function publicRenderResponse(c: Context<HonoEnv>, id: string, cache: "HIT" | "MISS", width: number, height: number, auth: AuthContext): PublicRenderResponse {
  return {
    id,
    image_url: makePublicImageUrl(c.req.url, id),
    content_type: "image/png",
    width,
    height,
    cache,
    renders_used: Math.min(auth.rendersLimit, auth.rendersUsed + 1),
    renders_limit: auth.rendersLimit,
  };
}

// ── Accounting/logs ───────────────────────────────────────────────────────
function recordSuccessfulRender(c: Context<HonoEnv>, auth: AuthContext, type: "template" | "url", templateId: string | null, durationMs: number) {
  const supabase = makeSupabase(c.env);
  c.executionCtx.waitUntil(Promise.all([
    incrementUsage(auth.userId, supabase),
    markApiKeyUsed(auth.apiKeyId, supabase),
    insertRenderLog(auth.userId, supabase, { type, templateId, status: "success", durationMs }),
  ]).then(() => undefined));
}

async function recordFailedRender(c: Context<HonoEnv>, auth: AuthContext, type: "template" | "url", templateId: string | null, durationMs: number) {
  await insertRenderLog(auth.userId, makeSupabase(c.env), { type, templateId, status: "error", durationMs });
}

async function insertRenderLog(userId: string, supabase: ReturnType<typeof makeSupabase>, log: { type: "template" | "url"; templateId: string | null; status: "success" | "error" | "rate_limited"; durationMs: number | null }) {
  const { error } = await supabase.from("render_logs").insert({
    user_id: userId,
    type: log.type,
    template_id: log.templateId,
    status: log.status,
    duration_ms: log.durationMs,
  });
  if (error) console.error("[render_logs]", error.message);
}

// ── Validation ────────────────────────────────────────────────────────────
async function readJson<T>(c: Context<HonoEnv>): Promise<{ ok: true; value: T } | { ok: false; response: Response }> {
  try { return { ok: true, value: await c.req.json<T>() }; }
  catch { return { ok: false, response: jsonError(c, 400, "BAD_REQUEST", "Request body must be valid JSON.") }; }
}

function validateTemplateBody(body: Partial<TemplateRenderRequest>, demo = false): { ok: true; value: TemplateRenderRequest } | { ok: false; error: string } {
  const { template, title } = body;
  if (!template || !TEMPLATE_IDS.includes(template)) return { ok: false, error: `"template" must be one of: ${TEMPLATE_IDS.join(", ")}.` };
  if (!title || typeof title !== "string" || !title.trim()) return { ok: false, error: '"title" is required.' };
  const width = demo ? 1200 : body.width ?? 1200;
  const height = demo ? 630 : body.height ?? 630;
  if (!Number.isInteger(width) || width < 200 || width > 2400 || !Number.isInteger(height) || height < 100 || height > 1400) return { ok: false, error: "Width must be 200–2400 and height 100–1400." };
  if (body.accent_color && !isSafeHexColor(body.accent_color)) return { ok: false, error: '"accent_color" must be a #RRGGBB color.' };
  if (body.background_color && !isSafeHexColor(body.background_color)) return { ok: false, error: '"background_color" must be a #RRGGBB color.' };
  return { ok: true, value: { template, title: title.trim().slice(0, 100), author: cleanOptional(body.author, 80), tag: cleanOptional(body.tag, 50), brand: cleanOptional(body.brand, 32), accent_color: body.accent_color, background_color: body.background_color, width, height } };
}

function validateScreenshotBody(body: Partial<ScreenshotRequest>): { ok: true; value: ScreenshotRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  if (!body.url || typeof body.url !== "string") return { ok: false, status: 400, code: "VALIDATION_ERROR", error: '"url" is required.' };
  try { parsePublicHttpUrl(body.url); }
  catch (error) {
    const message = (error as Error).message;
    if (message === "PRIVATE_HOST") return { ok: false, status: 403, code: "FORBIDDEN", error: "Private/local URLs are not allowed." };
    return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "A valid public http/https URL is required." };
  }
  const viewport_width = body.viewport_width ?? 1200;
  const viewport_height = body.viewport_height ?? 630;
  const delay = body.delay ?? 0;
  if (!Number.isInteger(viewport_width) || viewport_width < 320 || viewport_width > 2400) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "viewport_width must be 320–2400." };
  if (!Number.isInteger(viewport_height) || viewport_height < 240 || viewport_height > 1800) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "viewport_height must be 240–1800." };
  if (!Number.isFinite(delay) || delay < 0 || delay > 5000) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "delay must be 0–5000 milliseconds." };
  const wait_until = body.wait_until ?? "networkidle0";
  if (!["load", "domcontentloaded", "networkidle0"].includes(wait_until)) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "wait_until must be load, domcontentloaded, or networkidle0." };
  return { ok: true, value: { url: body.url, viewport_width, viewport_height, delay, wait_until } };
}

function validateCompositeBody(body: Partial<CompositeRenderRequest>): { ok: true; value: CompositeRenderRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const screen = validateScreenshotBody(body);
  if (!screen.ok) return screen;
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: '"title" is required.' };
  const width = body.width ?? 1200, height = body.height ?? 630;
  if (!Number.isInteger(width) || width < 600 || width > 2400 || !Number.isInteger(height) || height < 315 || height > 1400) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: "Composite output width must be 600–2400 and height 315–1400." };
  if (body.accent_color && !isSafeHexColor(body.accent_color)) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: '"accent_color" must be a #RRGGBB color.' };
  if (body.background_color && !isSafeHexColor(body.background_color)) return { ok: false, status: 400, code: "VALIDATION_ERROR", error: '"background_color" must be a #RRGGBB color.' };
  return { ok: true, value: { ...screen.value, title: body.title.trim().slice(0, 100), author: cleanOptional(body.author, 80), tag: cleanOptional(body.tag, 50), brand: cleanOptional(body.brand, 32), accent_color: body.accent_color, background_color: body.background_color, width, height } };
}

function cleanOptional(value: unknown, max: number): string | undefined { return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined; }
function secondsUntilNextMonth(): number { const now = new Date(); return Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - now.getTime()) / 1000)); }
function jsonError(c: Context<HonoEnv>, status: 400 | 401 | 403 | 404 | 429 | 500, code: string, error: string) { c.header("Cache-Control", "no-store"); return c.json({ error, code, request_id: c.get("requestId") }, status); }

function openApiDocument(origin: string) {
  return {
    openapi: "3.1.0",
    info: { title: "Ogify API", version: "1.0.0", description: "Render social cards, website screenshots, and branded screenshot composites." },
    servers: [{ url: origin }],
    components: { securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "x-api-key" } } },
    paths: {
      "/v1/render/template": { post: { summary: "Render a template and return a public image URL", security: [{ ApiKey: [] }] } },
      "/v1/render/url": { post: { summary: "Capture a website and return a public image URL", security: [{ ApiKey: [] }] } },
      "/v1/render/composite": { post: { summary: "Combine a live website capture with Ogify branding", security: [{ ApiKey: [] }] } },
      "/v1/me/usage": { get: { summary: "Get monthly usage", security: [{ ApiKey: [] }] } },
      "/i/{id}.png": { get: { summary: "Fetch a generated public PNG" } },
    },
  };
}
