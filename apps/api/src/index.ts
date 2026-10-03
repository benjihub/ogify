/**
 * Ogify API — Cloudflare Worker
 *
 * Routes
 * ──────
 * POST /render/template          Render an SVG template to PNG
 * POST /render/url               Screenshot a public URL to PNG
 * GET  /me/usage                 Current month usage stats
 * POST /webhooks/paddle          Paddle subscription / transaction events
 * GET  /health                   Healthcheck (no auth)
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { MiddlewareHandler } from "hono";
import type {
  Env,
  AuthContext,
  TemplateRenderRequest,
  ScreenshotRequest,
} from "./types/index.js";
import { makeSupabase } from "./lib/supabase.js";
import {
  validateApiKey,
  incrementUsage,
  markApiKeyUsed,
  nextResetDate,
} from "./lib/auth.js";
import { renderTemplateSvg, TEMPLATE_IDS } from "./lib/svg-templates/index.js";
import { svgToPng, cacheKey } from "./lib/renderers/template.js";
import { screenshotUrl } from "./lib/renderers/screenshot.js";
import { verifyPaddleWebhook, processPaddleEvent } from "./lib/paddle.js";

// ── Hono app types ────────────────────────────────────────────────────────

type HonoEnv = {
  Bindings: Env;
  Variables: { auth: AuthContext };
};

const app = new Hono<HonoEnv>();

// ── Global middleware ─────────────────────────────────────────────────────

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: [
      "https://www.ogify.online",
      "https://ogify.online",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-api-key"],
    exposeHeaders: ["X-Renders-Used", "X-Renders-Limit", "X-Cache"],
    maxAge: 86_400,
  })
);

// ── Auth middleware ───────────────────────────────────────────────────────

const requireApiKey: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const rawKey = c.req.header("x-api-key") ?? "";
  const supabase = makeSupabase(c.env);
  const result = await validateApiKey(rawKey, supabase);

  if ("error" in result) {
    return c.json({ error: result.error, code: "AUTH_ERROR" }, result.status);
  }

  c.set("auth", result.ctx);
  await next();
};

// ── Response helpers ──────────────────────────────────────────────────────

function pngResponse(
  png: Uint8Array,
  cacheStatus: "HIT" | "MISS",
  auth: AuthContext
): Response {
  return new Response(png.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Cache": cacheStatus,
      "X-Renders-Used": String(auth.rendersUsed),
      "X-Renders-Limit": String(auth.rendersLimit),
    },
  });
}

async function getCachedPng(
  kv: KVNamespace,
  key: string
): Promise<Uint8Array | null> {
  const buf = await kv.get(key, "arrayBuffer");
  return buf ? new Uint8Array(buf) : null;
}

async function cachePng(
  kv: KVNamespace,
  key: string,
  png: Uint8Array
): Promise<void> {
  await kv.put(key, png.buffer as ArrayBuffer, {
    expirationTtl: 60 * 60 * 24 * 365,
  });
}

function recordSuccessfulRender(
  c: { executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  auth: AuthContext,
  supabase: ReturnType<typeof makeSupabase>,
  log: {
    type: "template" | "url";
    templateId: string | null;
    durationMs: number | null;
  }
) {
  c.executionCtx.waitUntil(
    Promise.all([
      incrementUsage(auth.userId, supabase),
      markApiKeyUsed(auth.apiKeyId, supabase),
      insertRenderLog(auth.userId, supabase, {
        ...log,
        status: "success",
      }),
    ]).then(() => undefined)
  );
}

async function insertRenderLog(
  userId: string,
  supabase: ReturnType<typeof makeSupabase>,
  log: {
    type: "template" | "url";
    templateId: string | null;
    status: "success" | "error" | "rate_limited";
    durationMs: number | null;
  }
): Promise<void> {
  const { error } = await supabase.from("render_logs").insert({
    user_id: userId,
    type: log.type,
    template_id: log.templateId,
    status: log.status,
    duration_ms: log.durationMs,
  });

  if (error) {
    console.error("[render_logs] Failed to insert render log:", error.message);
  }
}

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /health
 */
app.get("/health", (c) =>
  c.json({ status: "ok", env: c.env.OGIFY_ENV, ts: new Date().toISOString() })
);

/**
 * POST /render/template
 *
 * Body: { template, title, author?, tag?, width?, height? }
 * Returns: image/png
 */
app.post("/render/template", requireApiKey, async (c) => {
  const startedAt = Date.now();
  let body: Partial<TemplateRenderRequest>;
  try {
    body = await c.req.json<Partial<TemplateRenderRequest>>();
  } catch {
    return c.json({ error: "Request body must be valid JSON.", code: "BAD_REQUEST" }, 400);
  }

  const { template, title, author, tag, width = 1200, height = 630 } = body;

  if (!template || !TEMPLATE_IDS.includes(template)) {
    return c.json(
      { error: `"template" must be one of: ${TEMPLATE_IDS.join(", ")}.`, code: "VALIDATION_ERROR" },
      400
    );
  }
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return c.json({ error: '"title" is required.', code: "VALIDATION_ERROR" }, 400);
  }
  if (
    (width !== undefined && (width < 200 || width > 2400)) ||
    (height !== undefined && (height < 100 || height > 1400))
  ) {
    return c.json(
      { error: "Width must be 200–2400 and height 100–1400.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const req: TemplateRenderRequest = {
    template,
    title: title.trim(),
    author: author?.trim(),
    tag: tag?.trim(),
    width,
    height,
  };

  // KV cache check
  const key = await cacheKey(req);
  const cached = await getCachedPng(c.env.CACHE, key);
  if (cached) {
    const auth = c.get("auth");
    const supabase = makeSupabase(c.env);
    recordSuccessfulRender(c, auth, supabase, {
      type: "template",
      templateId: template,
      durationMs: Date.now() - startedAt,
    });
    return pngResponse(cached, "HIT", auth);
  }

  // Render
  let png: Uint8Array;
  try {
    const svg = renderTemplateSvg(req);
    png = await svgToPng(svg, { width, height });
  } catch (err) {
    console.error("[render/template] Error:", err);
    return c.json({ error: "Render failed.", code: "RENDER_ERROR" }, 500);
  }

  // Fire-and-forget: cache + usage increment
  const auth = c.get("auth");
  const supabase = makeSupabase(c.env);
  c.executionCtx.waitUntil(cachePng(c.env.CACHE, key, png));
  recordSuccessfulRender(c, auth, supabase, {
    type: "template",
    templateId: template,
    durationMs: Date.now() - startedAt,
  });

  return pngResponse(png, "MISS", auth);
});

/**
 * POST /render/url
 *
 * Body: { url, viewport_width?, viewport_height?, delay? }
 * Returns: image/png
 */
app.post("/render/url", requireApiKey, async (c) => {
  const startedAt = Date.now();
  let body: Partial<ScreenshotRequest>;
  try {
    body = await c.req.json<Partial<ScreenshotRequest>>();
  } catch {
    return c.json({ error: "Request body must be valid JSON.", code: "BAD_REQUEST" }, 400);
  }

  const { url, viewport_width = 1200, viewport_height = 630, delay = 0 } = body;

  if (!url || typeof url !== "string") {
    return c.json({ error: '"url" is required.', code: "VALIDATION_ERROR" }, 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return c.json({ error: "Invalid URL.", code: "VALIDATION_ERROR" }, 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return c.json(
      { error: "Only http and https URLs are supported.", code: "VALIDATION_ERROR" },
      400
    );
  }

  if (isPrivateHost(parsed.hostname)) {
    return c.json({ error: "URL resolves to a private address.", code: "FORBIDDEN" }, 403);
  }

  let png: Uint8Array;
  try {
    png = await screenshotUrl(c.env, {
      url,
      viewportWidth: viewport_width,
      viewportHeight: viewport_height,
      delay,
    });
  } catch (err) {
    console.error("[render/url] Screenshot failed:", err);
    return c.json(
      { error: "Screenshot failed. Check the URL is publicly accessible.", code: "SCREENSHOT_ERROR" },
      500
    );
  }

  const auth = c.get("auth");
  const supabase = makeSupabase(c.env);
  recordSuccessfulRender(c, auth, supabase, {
    type: "url",
    templateId: null,
    durationMs: Date.now() - startedAt,
  });

  return pngResponse(png, "MISS", auth);
});

/**
 * GET /me/usage
 */
app.get("/me/usage", requireApiKey, async (c) => {
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
});

/**
 * POST /webhooks/paddle
 */
app.post("/webhooks/paddle", async (c) => {
  let payload;
  try {
    payload = await verifyPaddleWebhook(
      c.req.raw.clone() as unknown as Request,
      c.env.PADDLE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.warn("[webhook/paddle] Verification failed:", (err as Error).message);
    return c.json({ error: "Invalid signature." }, 401);
  }

  const supabase = makeSupabase(c.env);
  try {
    await processPaddleEvent(payload, supabase, c.env);
  } catch (err) {
    console.error("[webhook/paddle] Processing error:", err);
    return c.json({ error: "Processing failed." }, 500);
  }

  return c.json({ received: true });
});

// ── Catch-all ─────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not found.", code: "NOT_FOUND" }, 404));

app.onError((err, c) => {
  console.error("[unhandled]", err);
  return c.json({ error: "Internal server error.", code: "INTERNAL_ERROR" }, 500);
});

export default app;

// ── Helpers ───────────────────────────────────────────────────────────────

function isPrivateHost(hostname: string): boolean {
  const PRIVATE_PATTERNS = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^0\.0\.0\.0$/,
    /\.internal$/i,
    /\.local$/i,
  ];
  return PRIVATE_PATTERNS.some((re) => re.test(hostname));
}
