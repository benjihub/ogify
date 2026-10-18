/**
 * Ogify API — Cloudflare Worker
 *
 * Stable binary endpoints:
 *   POST /render/template
 *   POST /render/url
 *
 * Versioned developer platform:
 *   POST /v1/render/template      template -> public PNG
 *   POST /v1/render/url           URL -> PNG/JPEG/WebP
 *   POST /v1/render/html          HTML/CSS -> image
 *   POST /v1/render/pdf           URL/HTML -> PDF
 *   POST /v1/render/composite     URL screenshot + branded card
 *   POST /v1/render/social        URL metadata + screenshot + branded card
 *   POST /v1/render/multi         multiple social sizes
 *   POST /v1/render/batch         mixed render batch
 *   POST /v1/extract/metadata     rendered page metadata
 *   POST /v1/extract/content      hydrated HTML/text/links
 *   CRUD /v1/templates            reusable HTML templates
 *   POST /v1/jobs                 async rendering + signed webhooks
 *   POST /v1/render-links         on-demand public render links
 *   GET  /a/:asset                public hosted assets
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
  HtmlRenderRequest,
  PdfRenderRequest,
  MetadataExtractRequest,
  ContentExtractRequest,
  SocialRenderRequest,
  MultiSizeRenderRequest,
  BatchRenderRequest,
  BatchOperation,
  StoredHtmlTemplateInput,
  StoredTemplateRenderRequest,
  AsyncJobRequest,
  AsyncJobRecord,
  JobKind,
  RenderLinkRequest,
  ImageFormat,
  PublicAssetResponse,
  BrowserCustomization,
} from "./types/index.js";
import { makeSupabase } from "./lib/supabase.js";
import {
  validateApiKey,
  loadAuthContextForUser,
  incrementUsage,
  markApiKeyUsed,
  nextResetDate,
} from "./lib/auth.js";
import { renderTemplateSvg, TEMPLATE_IDS } from "./lib/svg-templates/index.js";
import { svgToPng, cacheKey } from "./lib/renderers/template.js";
import { captureUrl, screenshotUrl } from "./lib/renderers/screenshot.js";
import { renderHtmlImage } from "./lib/renderers/html.js";
import { renderPdf } from "./lib/renderers/pdf.js";
import { extractPageMetadata } from "./lib/renderers/metadata.js";
import { extractPageContent } from "./lib/renderers/content.js";
import { renderCompositeSvg } from "./lib/renderers/composite.js";
import { verifyPaddleWebhook, processPaddleEvent } from "./lib/paddle.js";
import { checkApiRateLimit, checkDemoRateLimit } from "./lib/rate-limit.js";
import { isSafeHexColor, parsePublicHttpUrl } from "./lib/security.js";
import { getPublicImage } from "./lib/public-images.js";
import { assetContentId, getPublicAsset, makePublicAssetUrl, persistPublicAsset } from "./lib/public-assets.js";
import {
  applyTemplateData,
  createStoredTemplate,
  deleteStoredTemplate,
  getStoredTemplate,
  listStoredTemplates,
  updateStoredTemplate,
} from "./lib/stored-templates.js";
import { createJob, getJob, sendJobWebhook, updateJob } from "./lib/jobs.js";
import { createRenderLink, getRenderLink, getRenderLinkResult, saveRenderLinkResult, signRenderLink, verifyRenderLinkSignature } from "./lib/render-links.js";

type HonoEnv = {
  Bindings: Env;
  Variables: { auth: AuthContext; requestId: string };
};

const app = new Hono<HonoEnv>();

// ── Global middleware ─────────────────────────────────────────────────────
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
    allowMethods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    allowHeaders: ["Content-Type", "x-api-key", "Authorization"],
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
  const rawKey = c.req.header("x-api-key") ?? bearerToken(c.req.header("Authorization")) ?? "";
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

// ── Health / discovery ────────────────────────────────────────────────────
app.get("/", (c) => c.json({
  name: "Ogify API",
  status: "ok",
  version: "2026.10-developer-platform",
  docs: "https://ogify.online/docs",
  openapi: `${new URL(c.req.url).origin}/openapi.json`,
  health: `${new URL(c.req.url).origin}/health`,
}));

app.get("/health", (c) => c.json({
  status: "ok",
  env: c.env.OGIFY_ENV,
  version: "2026.10-developer-platform",
  ts: new Date().toISOString(),
}));

app.get("/openapi.json", (c) => c.json(openApiDocument(new URL(c.req.url).origin)));

// ── Public hosted assets ──────────────────────────────────────────────────
app.get("/i/:id.png", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[a-f0-9]{24,64}$/i.test(id)) return jsonError(c, 404, "NOT_FOUND", "Image not found.");
  const etag = `"${id}"`;
  if (c.req.header("If-None-Match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  const edgeCached = await caches.default.match(c.req.raw);
  if (edgeCached) return edgeCached;
  const png = await getPublicImage(c.env.CACHE, id);
  if (!png) return jsonError(c, 404, "NOT_FOUND", "Image not found or expired.");
  const response = binaryResponse(png, "image/png", { etag, cacheControl: "public, max-age=31536000, immutable" });
  await putEdgeAsset(c.req.url, response);
  return response;
});

app.on("HEAD", "/i/:id.png", async (c) => {
  const id = c.req.param("id");
  if (!id || !/^[a-f0-9]{24,64}$/i.test(id)) return new Response(null, { status: 404 });
  const png = await getPublicImage(c.env.CACHE, id);
  if (!png) return new Response(null, { status: 404 });
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

app.get("/a/:asset", async (c) => {
  const name = c.req.param("asset") ?? "";
  const match = /^([a-f0-9]{24,80})\.([a-z0-9]{2,5})$/i.exec(name);
  if (!match) return jsonError(c, 404, "NOT_FOUND", "Asset not found.");
  const [, id, ext] = match;
  const edgeCached = await caches.default.match(c.req.raw);
  if (edgeCached) return edgeCached;
  const asset = await getPublicAsset(c.env.CACHE, id);
  if (!asset || asset.meta.extension !== ext.toLowerCase()) return jsonError(c, 404, "NOT_FOUND", "Asset not found or expired.");
  const etag = `"${id}"`;
  if (c.req.header("If-None-Match") === etag) return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=2592000, immutable" } });
  const response = binaryResponse(asset.bytes, asset.meta.content_type, { etag, cacheControl: "public, max-age=2592000, immutable" });
  await putEdgeAsset(c.req.url, response);
  return response;
});

app.on("HEAD", "/a/:asset", async (c) => {
  const name = c.req.param("asset") ?? "";
  const match = /^([a-f0-9]{24,80})\.([a-z0-9]{2,5})$/i.exec(name);
  if (!match) return new Response(null, { status: 404 });
  const asset = await getPublicAsset(c.env.CACHE, match[1]);
  if (!asset || asset.meta.extension !== match[2].toLowerCase()) return new Response(null, { status: 404 });
  return new Response(null, { status: 200, headers: { "Content-Type": asset.meta.content_type, "Content-Length": String(asset.bytes.byteLength), "Cache-Control": "public, max-age=2592000, immutable", ETag: `"${match[1]}"` } });
});

// ── Public demo ───────────────────────────────────────────────────────────
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
  const validation = validateScreenshotBody(body.value, true);
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

// ── Versioned rendering endpoints ─────────────────────────────────────────
app.post("/v1/render/template", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<TemplateRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateTemplateBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");

  try {
    const result = await renderTemplatePng(c.env, validation.value, auth);
    const asset = await persistGenericAsset(c, result.png, "image/png", "png", validation.value.width ?? 1200, validation.value.height ?? 630, auth, result.cache);
    recordSuccessfulRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
    return c.json(imageAssetResponse(asset));
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
    const capture = await captureUrl(c.env, toCaptureOptions(validation.value));
    const response = await persistGenericAsset(c, capture.bytes, capture.contentType, capture.extension, capture.width, capture.height, auth, "MISS");
    recordSuccessfulRender(c, auth, "url", null, Date.now() - startedAt);
    return c.json(response);
  } catch (error) {
    await recordFailedRender(c, auth, "url", null, Date.now() - startedAt);
    console.error("[v1/render/url]", error);
    return jsonError(c, 500, "SCREENSHOT_ERROR", "Screenshot failed. The target may block automated browsers or be unavailable.");
  }
});

app.post("/v1/render/html", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<HtmlRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateHtmlBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");
  try {
    const result = await renderHtmlImage(c.env, validation.value);
    const response = await persistGenericAsset(c, result.bytes, result.contentType, result.extension, result.width, result.height, auth, "MISS");
    recordSuccessfulRender(c, auth, "template", "html", Date.now() - startedAt);
    return c.json(response);
  } catch (error) {
    await recordFailedRender(c, auth, "template", "html", Date.now() - startedAt);
    console.error("[v1/render/html]", error);
    return jsonError(c, 500, "HTML_RENDER_ERROR", "HTML render failed.");
  }
});

app.post("/v1/render/pdf", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<PdfRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validatePdfBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");
  try {
    const pdf = await renderPdf(c.env, validation.value);
    if (pdf.byteLength > 20 * 1024 * 1024) return jsonError(c, 500, "PDF_TOO_LARGE", "Generated PDF exceeds the hosted asset size limit.");
    const response = await persistGenericAsset(c, pdf, "application/pdf", "pdf", undefined, undefined, auth, "MISS");
    recordSuccessfulRender(c, auth, validation.value.url ? "url" : "template", "pdf", Date.now() - startedAt);
    return c.json(response);
  } catch (error) {
    await recordFailedRender(c, auth, body.value.url ? "url" : "template", "pdf", Date.now() - startedAt);
    console.error("[v1/render/pdf]", error);
    return jsonError(c, 500, "PDF_RENDER_ERROR", "PDF render failed.");
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
    const asset = await persistGenericAsset(c, result.png, "image/png", "png", validation.value.width ?? 1200, validation.value.height ?? 630, auth, result.cache);
    recordSuccessfulRender(c, auth, "template", "composite", Date.now() - startedAt);
    return c.json(imageAssetResponse(asset));
  } catch (error) {
    await recordFailedRender(c, auth, "template", "composite", Date.now() - startedAt);
    console.error("[v1/render/composite]", error);
    return jsonError(c, 500, "COMPOSITE_RENDER_ERROR", "Composite render failed.");
  }
});

app.post("/v1/extract/metadata", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<MetadataExtractRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateMetadataBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");
  try {
    const metadata = await extractPageMetadata(c.env, validation.value);
    recordSuccessfulRender(c, auth, "url", "metadata", Date.now() - startedAt);
    return c.json({ metadata, renders_used: Math.min(auth.rendersLimit, auth.rendersUsed + 1), renders_limit: auth.rendersLimit });
  } catch (error) {
    await recordFailedRender(c, auth, "url", "metadata", Date.now() - startedAt);
    console.error("[v1/extract/metadata]", error);
    return jsonError(c, 500, "METADATA_ERROR", "Could not extract page metadata.");
  }
});

app.post("/v1/extract/content", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<ContentExtractRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateContentBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");
  try {
    const content = await extractPageContent(c.env, validation.value);
    recordSuccessfulRender(c, auth, "url", "content", Date.now() - startedAt);
    return c.json({ content, renders_used: Math.min(auth.rendersLimit, auth.rendersUsed + 1), renders_limit: auth.rendersLimit });
  } catch (error) {
    await recordFailedRender(c, auth, "url", "content", Date.now() - startedAt);
    console.error("[v1/extract/content]", error);
    return jsonError(c, 500, "CONTENT_EXTRACTION_ERROR", "Could not extract page content.");
  }
});

app.post("/v1/render/social", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<SocialRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateSocialBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");
  try {
    const response = await renderSocialAsset(c, validation.value, auth);
    recordSuccessfulRender(c, auth, "template", "social", Date.now() - startedAt);
    return c.json(response);
  } catch (error) {
    await recordFailedRender(c, auth, "template", "social", Date.now() - startedAt);
    console.error("[v1/render/social]", error);
    return jsonError(c, 500, "SOCIAL_RENDER_ERROR", "Automatic social card rendering failed.");
  }
});

app.post("/v1/render/multi", requireApiKey, async (c) => {
  const body = await readJson<Partial<MultiSizeRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateMultiBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");
  if (!hasCredits(auth, validation.value.variants.length)) return jsonError(c, 429, "MONTHLY_QUOTA_EXCEEDED", "Not enough remaining render credits for all requested variants.");

  const results: Array<{ name?: string; width: number; height: number; result?: unknown; error?: string }> = [];
  for (const variant of validation.value.variants) {
    try {
      if (validation.value.kind === "template") {
        const payload = { ...(validation.value.payload as TemplateRenderRequest), width: variant.width, height: variant.height };
        const result = await renderTemplatePng(c.env, payload, auth);
        const asset = await persistGenericAsset(c, result.png, "image/png", "png", variant.width, variant.height, auth, result.cache);
        recordSuccessfulRender(c, auth, "template", payload.template, 0);
        results.push({ ...variant, result: imageAssetResponse(asset) });
      } else {
        const payload = { ...(validation.value.payload as SocialRenderRequest), width: variant.width, height: variant.height };
        const result = await renderSocialAsset(c, payload, auth);
        recordSuccessfulRender(c, auth, "template", "social", 0);
        results.push({ ...variant, result });
      }
    } catch (error) {
      results.push({ ...variant, error: error instanceof Error ? error.message : "Render failed" });
    }
  }
  return c.json({ kind: validation.value.kind, results });
});

app.post("/v1/render/batch", requireApiKey, async (c) => {
  const body = await readJson<Partial<BatchRenderRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateBatchBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");
  if (!hasCredits(auth, validation.value.operations.length)) return jsonError(c, 429, "MONTHLY_QUOTA_EXCEEDED", "Not enough remaining render credits for this batch.");

  const results = [] as Array<{ id?: string; kind: string; ok: boolean; result?: unknown; error?: string }>;
  for (const operation of validation.value.operations) {
    try {
      const result = await executeOperation(c, operation, auth, true);
      results.push({ id: operation.id, kind: operation.kind, ok: true, result });
    } catch (error) {
      results.push({ id: operation.id, kind: operation.kind, ok: false, error: error instanceof Error ? error.message : "Render failed" });
    }
  }
  return c.json({ results });
});

// ── Reusable HTML templates (developer-first template API) ────────────────
app.post("/v1/templates", requireApiKey, async (c) => {
  const body = await readJson<Partial<StoredHtmlTemplateInput>>(c);
  if (!body.ok) return body.response;
  const validation = validateStoredTemplateInput(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const item = await createStoredTemplate(c.env.CACHE, c.get("auth").userId, validation.value);
  return c.json({ template: withoutTemplateSource(item) }, 201);
});

app.get("/v1/templates", requireApiKey, async (c) => {
  const items = await listStoredTemplates(c.env.CACHE, c.get("auth").userId);
  return c.json({ templates: items.map(withoutTemplateSource) });
});

app.get("/v1/templates/:id", requireApiKey, async (c) => {
  const item = await getStoredTemplate(c.env.CACHE, c.get("auth").userId, c.req.param("id"));
  if (!item) return jsonError(c, 404, "NOT_FOUND", "Template not found.");
  return c.json({ template: item });
});

app.put("/v1/templates/:id", requireApiKey, async (c) => {
  const body = await readJson<Partial<StoredHtmlTemplateInput>>(c);
  if (!body.ok) return body.response;
  const patchValidation = validateStoredTemplatePatch(body.value);
  if (!patchValidation.ok) return jsonError(c, 400, "VALIDATION_ERROR", patchValidation.error);
  const item = await updateStoredTemplate(c.env.CACHE, c.get("auth").userId, c.req.param("id"), patchValidation.value);
  if (!item) return jsonError(c, 404, "NOT_FOUND", "Template not found.");
  return c.json({ template: withoutTemplateSource(item) });
});

app.delete("/v1/templates/:id", requireApiKey, async (c) => {
  const deleted = await deleteStoredTemplate(c.env.CACHE, c.get("auth").userId, c.req.param("id"));
  if (!deleted) return jsonError(c, 404, "NOT_FOUND", "Template not found.");
  return c.json({ deleted: true });
});

app.post("/v1/templates/:id/render", requireApiKey, async (c) => {
  const startedAt = Date.now();
  const body = await readJson<Partial<StoredTemplateRenderRequest>>(c);
  if (!body.ok) return body.response;
  const auth = c.get("auth");
  const item = await getStoredTemplate(c.env.CACHE, auth.userId, c.req.param("id"));
  if (!item) return jsonError(c, 404, "NOT_FOUND", "Template not found.");
  const data = isPlainObject(body.value.data) ? body.value.data as Record<string, string | number | boolean | null> : {};
  const request: HtmlRenderRequest = {
    html: applyTemplateData(item.html, data),
    css: applyTemplateData(item.css ?? "", data),
    width: body.value.width ?? item.width,
    height: body.value.height ?? item.height,
    format: body.value.format ?? item.format,
  };
  const validation = validateHtmlBody(request);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  try {
    const result = await renderHtmlImage(c.env, validation.value);
    const response = await persistGenericAsset(c, result.bytes, result.contentType, result.extension, result.width, result.height, auth, "MISS");
    recordSuccessfulRender(c, auth, "template", item.id, Date.now() - startedAt);
    return c.json(response);
  } catch (error) {
    await recordFailedRender(c, auth, "template", item.id, Date.now() - startedAt);
    console.error("[stored-template/render]", error);
    return jsonError(c, 500, "TEMPLATE_RENDER_ERROR", "Stored template render failed.");
  }
});

// ── Async jobs + webhooks ─────────────────────────────────────────────────
app.post("/v1/jobs", requireApiKey, async (c) => {
  const body = await readJson<Partial<AsyncJobRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateJobBody(body.value);
  if (!validation.ok) return jsonError(c, validation.status, validation.code, validation.error);
  const auth = c.get("auth");
  const job = await createJob(c.env.CACHE, {
    user_id: auth.userId,
    api_key_id: auth.apiKeyId,
    kind: validation.value.kind,
    webhook_url: validation.value.webhook_url,
    webhook_secret: validation.value.webhook_secret,
  });

  // payload is intentionally stored with the job in KV even though it is not exposed by the public type.
  await c.env.CACHE.put(`job-payload:${job.id}`, JSON.stringify(validation.value.payload), { expirationTtl: 60 * 60 * 24 * 7 });
  c.executionCtx.waitUntil(processAsyncJob(c.env, job.id));
  return c.json({ job: publicJob(job) }, 202);
});

app.get("/v1/jobs/:id", requireApiKey, async (c) => {
  const job = await getJob(c.env.CACHE, c.req.param("id"));
  if (!job || job.user_id !== c.get("auth").userId) return jsonError(c, 404, "NOT_FOUND", "Job not found.");
  return c.json({ job: publicJob(job) });
});

// ── On-demand render links ────────────────────────────────────────────────
app.post("/v1/render-links", requireApiKey, async (c) => {
  const body = await readJson<Partial<RenderLinkRequest>>(c);
  if (!body.ok) return body.response;
  const validation = validateRenderLinkBody(body.value);
  if (!validation.ok) return jsonError(c, 400, "VALIDATION_ERROR", validation.error);
  const auth = c.get("auth");
  const link = await createRenderLink(c.env.CACHE, {
    ...validation.value,
    user_id: auth.userId,
    api_key_id: auth.apiKeyId,
  });
  const signed = await signRenderLink(link.id, link.expires_at, c.env.CACHE_SIGNING_KEY);
  const origin = new URL(c.req.url).origin;
  return c.json({
    id: link.id,
    url: `${origin}/r/${link.id}?exp=${signed.exp}&sig=${signed.signature}`,
    expires_at: link.expires_at,
    signed: true,
  }, 201);
});

app.get("/r/:id", async (c) => {
  const id = c.req.param("id");
  const exp = Number(c.req.query("exp"));
  const sig = c.req.query("sig") ?? "";
  if (!await verifyRenderLinkSignature(id, exp, sig, c.env.CACHE_SIGNING_KEY)) return jsonError(c, 403, "INVALID_SIGNATURE", "Render link signature is invalid or expired.");
  const cached = await getRenderLinkResult(c.env.CACHE, id);
  if (cached) return c.redirect(cached, 302);
  const link = await getRenderLink(c.env.CACHE, id);
  if (!link || new Date(link.expires_at).getTime() <= Date.now()) return jsonError(c, 404, "NOT_FOUND", "Render link expired or does not exist.");

  const authResult = await loadAuthContextForUser(link.user_id, link.api_key_id, makeSupabase(c.env));
  if ("error" in authResult) return jsonError(c, authResult.status, authResult.code, authResult.error);
  const auth = authResult.ctx;

  try {
    const operation = renderLinkToOperation(link.kind, link.payload);
    const result = await executeOperation(c, operation, auth, true);
    const url = extractResultUrl(result);
    if (!url) return jsonError(c, 500, "RENDER_LINK_ERROR", "Render link did not produce a public asset URL.");
    await saveRenderLinkResult(c.env.CACHE, id, url, link.expires_at);
    return c.redirect(url, 302);
  } catch (error) {
    console.error("[render-link]", error);
    return jsonError(c, 500, "RENDER_LINK_ERROR", "On-demand render failed.");
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

// ── Async job processor ───────────────────────────────────────────────────
async function processAsyncJob(env: Env, jobId: string): Promise<void> {
  const job = await getJob(env.CACHE, jobId);
  if (!job) return;
  const payloadText = await env.CACHE.get(`job-payload:${job.id}`);
  if (!payloadText) {
    await updateJob(env.CACHE, job.id, { status: "failed", error: { code: "JOB_PAYLOAD_MISSING", message: "Job payload expired." } });
    return;
  }

  const authResult = await loadAuthContextForUser(job.user_id, job.api_key_id, makeSupabase(env));
  if ("error" in authResult) {
    const failed = await updateJob(env.CACHE, job.id, { status: "failed", error: { code: authResult.code, message: authResult.error } });
    if (failed) await safeWebhook(failed);
    return;
  }

  await updateJob(env.CACHE, job.id, { status: "processing" });
  try {
    const payload = JSON.parse(payloadText) as unknown;
    const fakeContext = createBackgroundContext(env, authResult.ctx);
    const operation = jobToOperation(job.kind, payload);
    const result = job.kind === "batch"
      ? await executeBatchBackground(fakeContext, payload as BatchRenderRequest, authResult.ctx)
      : await executeOperation(fakeContext, operation, authResult.ctx, true);
    const completed = await updateJob(env.CACHE, job.id, { status: "completed", result });
    if (completed) await safeWebhook(completed);
  } catch (error) {
    const failed = await updateJob(env.CACHE, job.id, { status: "failed", error: { code: "JOB_FAILED", message: error instanceof Error ? error.message : "Render job failed." } });
    if (failed) await safeWebhook(failed);
  }
}

async function safeWebhook(job: AsyncJobRecord): Promise<void> {
  try { await sendJobWebhook(job); }
  catch (error) { console.error("[job/webhook]", job.id, error); }
}

// A minimal Context-like adapter for internal background processing. Only the
// properties used by render helpers are provided.
function createBackgroundContext(env: Env, auth: AuthContext): Context<HonoEnv> {
  const origin = "https://api.ogify.online";
  const waitUntil = (promise: Promise<unknown>) => { void promise.catch((error) => console.error("[background]", error)); };
  return {
    env,
    req: { url: origin } as Context<HonoEnv>["req"],
    get: ((key: string) => key === "auth" ? auth : crypto.randomUUID()) as Context<HonoEnv>["get"],
    executionCtx: { waitUntil } as Context<HonoEnv>["executionCtx"],
  } as Context<HonoEnv>;
}

// ── Render helpers ────────────────────────────────────────────────────────
type RenderedPng = { png: Uint8Array; cache: "HIT" | "MISS"; key: string };

async function renderTemplatePng(env: Env, request: TemplateRenderRequest, auth: AuthContext): Promise<RenderedPng> {
  const showOgifyMark = auth.plan === "free";
  const key = await cacheKey({ kind: "template-v3", ...request, showOgifyMark });
  const cached = await getCachedPng(env.CACHE, `template:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const svg = renderTemplateSvg(request, { showOgifyMark });
  const png = await svgToPng(svg, { width: request.width ?? 1200, height: request.height ?? 630 });
  await cachePng(env.CACHE, `template:${key}`, png, 60 * 60 * 24 * 365);
  return { png, cache: "MISS", key };
}

async function renderScreenshotPng(env: Env, request: ScreenshotRequest): Promise<RenderedPng> {
  const key = await cacheKey({ kind: "screenshot-v3", ...request, format: "png" });
  const cached = await getCachedPng(env.CACHE, `screenshot:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const png = await screenshotUrl(env, toCaptureOptions({ ...request, format: "png" }));
  await cachePng(env.CACHE, `screenshot:${key}`, png, 300);
  return { png, cache: "MISS", key };
}

async function renderCompositePng(env: Env, request: CompositeRenderRequest, auth: AuthContext): Promise<RenderedPng> {
  const key = await cacheKey({ kind: "composite-v2", ...request, mark: auth.plan === "free" });
  const cached = await getCachedPng(env.CACHE, `composite:${key}`);
  if (cached) return { png: cached, cache: "HIT", key };
  const screenshot = await screenshotUrl(env, {
    ...toCaptureOptions(request),
    viewportWidth: request.viewport_width ?? 1280,
    viewportHeight: request.viewport_height ?? 800,
    format: "png",
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

async function renderSocialAsset(c: Context<HonoEnv>, request: SocialRenderRequest, auth: AuthContext): Promise<PublicAssetResponse> {
  let metadata: Awaited<ReturnType<typeof extractPageMetadata>>;
  try {
    metadata = await extractPageMetadata(c.env, {
      url: request.url,
      delay: Math.min(request.delay ?? 0, 2_000),
      wait_until: request.wait_until ?? "domcontentloaded",
      wait_for_selector: request.wait_for_selector,
      custom_css: request.custom_css,
      custom_js: request.custom_js,
      user_agent: request.user_agent,
      headers: request.headers,
      dark_mode: request.dark_mode,
      cookies: request.cookies,
      locale: request.locale,
      timezone: request.timezone,
      click_selector: request.click_selector,
      scroll_to: request.scroll_to,
      block_resources: request.block_resources,
    });
  } catch (error) {
    if (!request.title) throw error;
    console.warn("[v1/render/social] metadata unavailable; using request fallback", error);
    metadata = { url: request.url, title: "", description: "", canonical_url: request.url };
  }
  const title = request.title || metadata.title || new URL(request.url).hostname;
  const tag = request.tag || metadata.site_name || "Website";
  const author = request.author || metadata.canonical_url || metadata.url;
  const composite: CompositeRenderRequest = {
    url: request.url,
    title,
    tag,
    author,
    brand: request.brand || metadata.site_name,
    accent_color: request.accent_color,
    background_color: request.background_color,
    width: request.width ?? 1200,
    height: request.height ?? 630,
    viewport_width: request.viewport_width ?? 1280,
    viewport_height: request.viewport_height ?? 800,
    delay: request.delay ?? 300,
    wait_until: request.wait_until ?? "networkidle0",
    wait_for_selector: request.wait_for_selector,
    custom_css: request.custom_css,
    custom_js: request.custom_js,
    user_agent: request.user_agent,
    headers: request.headers,
    dark_mode: request.dark_mode,
    cookies: request.cookies,
    locale: request.locale,
    timezone: request.timezone,
    click_selector: request.click_selector,
    scroll_to: request.scroll_to,
    block_resources: request.block_resources,
  };
  try {
    const result = await renderCompositePng(c.env, composite, auth);
    return persistGenericAsset(c, result.png, "image/png", "png", composite.width, composite.height, auth, result.cache);
  } catch (error) {
    console.warn("[v1/render/social] branded composition failed; returning screenshot fallback", error);
    const screenshot = await captureUrl(c.env, toCaptureOptions(composite));
    return persistGenericAsset(c, screenshot.bytes, screenshot.contentType, screenshot.extension, screenshot.width, screenshot.height, auth, "MISS");
  }
}

async function executeOperation(c: Context<HonoEnv>, operation: BatchOperation, auth: AuthContext, account: boolean): Promise<unknown> {
  const startedAt = Date.now();
  switch (operation.kind) {
    case "template": {
      const validation = validateTemplateBody(operation.payload);
      if (!validation.ok) throw new Error(validation.error);
      const result = await renderTemplatePng(c.env, validation.value, auth);
      const asset = await persistGenericAsset(c, result.png, "image/png", "png", validation.value.width ?? 1200, validation.value.height ?? 630, auth, result.cache);
      if (account) recordSuccessfulRender(c, auth, "template", validation.value.template, Date.now() - startedAt);
      return imageAssetResponse(asset);
    }
    case "url": {
      const validation = validateScreenshotBody(operation.payload);
      if (!validation.ok) throw new Error(validation.error);
      const result = await captureUrl(c.env, toCaptureOptions(validation.value));
      const response = await persistGenericAsset(c, result.bytes, result.contentType, result.extension, result.width, result.height, auth, "MISS");
      if (account) recordSuccessfulRender(c, auth, "url", null, Date.now() - startedAt);
      return response;
    }
    case "html": {
      const validation = validateHtmlBody(operation.payload);
      if (!validation.ok) throw new Error(validation.error);
      const result = await renderHtmlImage(c.env, validation.value);
      const response = await persistGenericAsset(c, result.bytes, result.contentType, result.extension, result.width, result.height, auth, "MISS");
      if (account) recordSuccessfulRender(c, auth, "template", "html", Date.now() - startedAt);
      return response;
    }
    case "social": {
      const validation = validateSocialBody(operation.payload);
      if (!validation.ok) throw new Error(validation.error);
      const response = await renderSocialAsset(c, validation.value, auth);
      if (account) recordSuccessfulRender(c, auth, "template", "social", Date.now() - startedAt);
      return response;
    }
    case "pdf": {
      const validation = validatePdfBody(operation.payload);
      if (!validation.ok) throw new Error(validation.error);
      const result = await renderPdf(c.env, validation.value);
      const response = await persistGenericAsset(c, result, "application/pdf", "pdf", undefined, undefined, auth, "MISS");
      if (account) recordSuccessfulRender(c, auth, validation.value.url ? "url" : "template", "pdf", Date.now() - startedAt);
      return response;
    }
  }
}

async function executeBatchBackground(c: Context<HonoEnv>, payload: BatchRenderRequest, auth: AuthContext): Promise<unknown> {
  const validation = validateBatchBody(payload);
  if (!validation.ok) throw new Error(validation.error);
  const results: Array<Record<string, unknown>> = [];
  for (const operation of validation.value.operations) {
    try { results.push({ id: operation.id, kind: operation.kind, ok: true, result: await executeOperation(c, operation, auth, true) }); }
    catch (error) { results.push({ id: operation.id, kind: operation.kind, ok: false, error: error instanceof Error ? error.message : "Render failed" }); }
  }
  return { results };
}

async function persistGenericAsset(
  c: Context<HonoEnv>,
  bytes: Uint8Array,
  contentType: string,
  extension: string,
  width: number | undefined,
  height: number | undefined,
  auth: AuthContext,
  cache: "HIT" | "MISS",
): Promise<PublicAssetResponse> {
  const id = await assetContentId(bytes, extension);
  const meta = await persistPublicAsset(c.env.CACHE, id, bytes, { content_type: contentType, extension, width, height });
  const url = makePublicAssetUrl(c.req.url, id, extension);
  await putEdgeAsset(url, binaryResponse(bytes, contentType, { etag: `"${id}"`, cacheControl: "public, max-age=2592000, immutable" }));
  return {
    id,
    url,
    content_type: contentType,
    extension,
    bytes: meta.bytes,
    width,
    height,
    cache,
    renders_used: Math.min(auth.rendersLimit, auth.rendersUsed + 1),
    renders_limit: auth.rendersLimit,
  };
}

async function getCachedPng(kv: KVNamespace, key: string): Promise<Uint8Array | null> {
  const buffer = await kv.get(key, "arrayBuffer");
  return buffer ? new Uint8Array(buffer) : null;
}

async function cachePng(kv: KVNamespace, key: string, png: Uint8Array, expirationTtl: number): Promise<void> {
  await kv.put(key, png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer, { expirationTtl });
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
  return new Response(png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer, { headers });
}

function binaryResponse(bytes: Uint8Array, contentType: string, options: { etag?: string; cacheControl?: string } = {}): Response {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": options.cacheControl ?? "public, max-age=2592000, immutable",
    "Cross-Origin-Resource-Policy": "cross-origin",
  };
  if (options.etag) headers.ETag = options.etag;
  return new Response(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, { headers });
}

async function putEdgeAsset(url: string, response: Response): Promise<void> {
  try {
    await caches.default.put(new Request(url, { method: "GET" }), response.clone());
  } catch (error) {
    console.warn("[edge-cache] public asset cache write failed", error);
  }
}

function imageAssetResponse(asset: PublicAssetResponse): PublicAssetResponse & { image_url: string } {
  return { ...asset, image_url: asset.url };
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
  if (!validDimension(width, 200, 2400) || !validDimension(height, 100, 1800)) return { ok: false, error: "Width must be 200–2400 and height 100–1800." };
  if (body.accent_color && !isSafeHexColor(body.accent_color)) return { ok: false, error: '"accent_color" must be a #RRGGBB color.' };
  if (body.background_color && !isSafeHexColor(body.background_color)) return { ok: false, error: '"background_color" must be a #RRGGBB color.' };
  return { ok: true, value: { template, title: title.trim().slice(0, 100), author: cleanOptional(body.author, 80), tag: cleanOptional(body.tag, 50), brand: cleanOptional(body.brand, 32), accent_color: body.accent_color, background_color: body.background_color, width, height } };
}

function validateScreenshotBody(body: Partial<ScreenshotRequest>, legacy = false): { ok: true; value: ScreenshotRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const urlResult = validatePublicUrl(body.url);
  if (!urlResult.ok) return urlResult;
  const browserError = validateBrowserCustomization(body);
  if (browserError) return badValidation(browserError);
  const viewport_width = body.viewport_width ?? 1200;
  const viewport_height = body.viewport_height ?? 630;
  const delay = body.delay ?? 0;
  if (!validDimension(viewport_width, 320, 2400)) return badValidation("viewport_width must be 320–2400.");
  if (!validDimension(viewport_height, 240, 3000)) return badValidation("viewport_height must be 240–3000.");
  if (!Number.isFinite(delay) || delay < 0 || delay > 10_000) return badValidation("delay must be 0–10000 milliseconds.");
  const wait_until = body.wait_until ?? "networkidle0";
  if (!["load", "domcontentloaded", "networkidle0"].includes(wait_until)) return badValidation("wait_until must be load, domcontentloaded, or networkidle0.");
  if (body.full_page && body.selector) return badValidation("full_page and selector cannot be used together.");
  if ((body.full_page || body.selector) && body.clip) return badValidation("clip cannot be combined with full_page or selector.");
  if (body.selector && !validSelectorString(body.selector)) return badValidation("selector is too long or invalid.");
  if (body.clip) {
    const { x, y, width: clipWidth, height: clipHeight } = body.clip;
    if (![x, y, clipWidth, clipHeight].every(Number.isFinite) || x < 0 || y < 0 || clipWidth < 1 || clipHeight < 1 || clipWidth > 2400 || clipHeight > 3000) return badValidation("clip must contain non-negative x/y and width/height within render limits.");
  }
  if (body.omit_background !== undefined && typeof body.omit_background !== "boolean") return badValidation("omit_background must be boolean.");
  const format: ImageFormat = legacy ? "png" : body.format ?? "png";
  if (!["png", "jpeg", "webp"].includes(format)) return badValidation("format must be png, jpeg, or webp.");
  if (body.quality !== undefined && (!Number.isInteger(body.quality) || body.quality < 1 || body.quality > 100)) return badValidation("quality must be 1–100.");
  if (body.custom_css && body.custom_css.length > 100_000) return badValidation("custom_css is limited to 100 KB.");
  if (body.custom_js && body.custom_js.length > 50_000) return badValidation("custom_js is limited to 50 KB.");
  if (body.wait_for_selector && !validSelectorString(body.wait_for_selector)) return badValidation("wait_for_selector is too long or invalid.");
  if (body.hide_selectors && (!Array.isArray(body.hide_selectors) || body.hide_selectors.length > 25 || body.hide_selectors.some((s) => !validSelectorString(s)))) return badValidation("hide_selectors accepts up to 25 CSS selectors.");
  if (body.device_scale_factor !== undefined && (!Number.isFinite(body.device_scale_factor) || body.device_scale_factor < 1 || body.device_scale_factor > 3)) return badValidation("device_scale_factor must be 1–3.");
  const headers = sanitizeHeaders(body.headers);
  if (body.headers && !headers) return badValidation("headers contains unsupported values.");
  return { ok: true, value: { ...body, url: urlResult.url, viewport_width, viewport_height, delay, wait_until, format, headers: headers ?? undefined } as ScreenshotRequest };
}

function validateHtmlBody(body: Partial<HtmlRenderRequest>): { ok: true; value: HtmlRenderRequest } | { ok: false; error: string } {
  if (!body.html || typeof body.html !== "string" || !body.html.trim()) return { ok: false, error: '"html" is required.' };
  if (body.html.length > 500_000) return { ok: false, error: "html is limited to 500 KB." };
  if (body.css && body.css.length > 100_000) return { ok: false, error: "css is limited to 100 KB." };
  const browserError = validateBrowserCustomization(body);
  if (browserError) return { ok: false, error: browserError };
  const width = body.width ?? 1200, height = body.height ?? 630;
  if (!validDimension(width, 200, 2400) || !validDimension(height, 100, 3000)) return { ok: false, error: "width must be 200–2400 and height 100–3000." };
  if (body.full_page && body.selector) return { ok: false, error: "full_page and selector cannot be used together." };
  const format = body.format ?? "png";
  if (!["png", "jpeg", "webp"].includes(format)) return { ok: false, error: "format must be png, jpeg, or webp." };
  if (body.custom_js && body.custom_js.length > 50_000) return { ok: false, error: "custom_js is limited to 50 KB." };
  if (body.custom_css && body.custom_css.length > 100_000) return { ok: false, error: "custom_css is limited to 100 KB." };
  return { ok: true, value: { ...body, html: body.html, width, height, format } as HtmlRenderRequest };
}

function validatePdfBody(body: Partial<PdfRenderRequest>): { ok: true; value: PdfRenderRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const browserError = validateBrowserCustomization(body);
  if (browserError) return badValidation(browserError);
  const hasUrl = typeof body.url === "string" && body.url.length > 0;
  const hasHtml = typeof body.html === "string" && body.html.length > 0;
  if (hasUrl === hasHtml) return badValidation("Provide exactly one of url or html.");
  if (hasUrl) {
    const urlResult = validatePublicUrl(body.url);
    if (!urlResult.ok) return urlResult;
    body.url = urlResult.url;
  }
  if (hasHtml && body.html!.length > 750_000) return badValidation("html is limited to 750 KB for PDF rendering.");
  if (body.css && body.css.length > 100_000) return badValidation("css is limited to 100 KB.");
  if (body.format && !["A4", "Letter", "Legal", "A3"].includes(body.format)) return badValidation("format must be A4, Letter, Legal, or A3.");
  return { ok: true, value: { ...body, format: body.format ?? "A4", print_background: body.print_background ?? true } as PdfRenderRequest };
}

function validateMetadataBody(body: Partial<MetadataExtractRequest>): { ok: true; value: MetadataExtractRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const browserError = validateBrowserCustomization(body);
  if (browserError) return badValidation(browserError);
  const urlResult = validatePublicUrl(body.url);
  if (!urlResult.ok) return urlResult;
  return { ok: true, value: { ...body, url: urlResult.url } as MetadataExtractRequest };
}

function validateContentBody(body: Partial<ContentExtractRequest>): { ok: true; value: ContentExtractRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const base = validateMetadataBody(body);
  if (!base.ok) return base;
  if (body.selector && !validSelectorString(body.selector)) return badValidation("selector is too long or invalid.");
  if (body.include_links !== undefined && typeof body.include_links !== "boolean") return badValidation("include_links must be boolean.");
  return { ok: true, value: { ...base.value, selector: body.selector, include_links: body.include_links ?? false } as ContentExtractRequest };
}

function validateCompositeBody(body: Partial<CompositeRenderRequest>): { ok: true; value: CompositeRenderRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const screen = validateScreenshotBody({ ...body, format: "png", full_page: false, selector: undefined });
  if (!screen.ok) return screen;
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) return badValidation('"title" is required.');
  const width = body.width ?? 1200, height = body.height ?? 630;
  if (!validDimension(width, 600, 2400) || !validDimension(height, 315, 1800)) return badValidation("Composite output width must be 600–2400 and height 315–1800.");
  if (body.accent_color && !isSafeHexColor(body.accent_color)) return badValidation('"accent_color" must be a #RRGGBB color.');
  if (body.background_color && !isSafeHexColor(body.background_color)) return badValidation('"background_color" must be a #RRGGBB color.');
  return { ok: true, value: { ...screen.value, title: body.title.trim().slice(0, 100), author: cleanOptional(body.author, 80), tag: cleanOptional(body.tag, 50), brand: cleanOptional(body.brand, 32), accent_color: body.accent_color, background_color: body.background_color, width, height } };
}

function validateSocialBody(body: Partial<SocialRenderRequest>): { ok: true; value: SocialRenderRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const screen = validateScreenshotBody({ ...body, format: "png", full_page: false, selector: undefined });
  if (!screen.ok) return screen;
  const width = body.width ?? 1200, height = body.height ?? 630;
  if (!validDimension(width, 600, 2400) || !validDimension(height, 315, 1800)) return badValidation("width must be 600–2400 and height 315–1800.");
  if (body.accent_color && !isSafeHexColor(body.accent_color)) return badValidation('"accent_color" must be a #RRGGBB color.');
  if (body.background_color && !isSafeHexColor(body.background_color)) return badValidation('"background_color" must be a #RRGGBB color.');
  return { ok: true, value: { ...screen.value, title: cleanOptional(body.title, 100), author: cleanOptional(body.author, 120), tag: cleanOptional(body.tag, 50), brand: cleanOptional(body.brand, 32), accent_color: body.accent_color, background_color: body.background_color, width, height } as SocialRenderRequest };
}

function validateMultiBody(body: Partial<MultiSizeRenderRequest>): { ok: true; value: MultiSizeRenderRequest } | { ok: false; error: string } {
  if (body.kind !== "template" && body.kind !== "social") return { ok: false, error: "kind must be template or social." };
  if (!Array.isArray(body.variants) || body.variants.length < 1 || body.variants.length > 6) return { ok: false, error: "variants must contain 1–6 sizes." };
  for (const variant of body.variants) {
    if (!variant || !validDimension(variant.width, 320, 2400) || !validDimension(variant.height, 240, 2400)) return { ok: false, error: "Each variant width/height must be 320–2400." };
  }
  if (!isPlainObject(body.payload)) return { ok: false, error: "payload is required." };
  return { ok: true, value: body as MultiSizeRenderRequest };
}

function validateBatchBody(body: Partial<BatchRenderRequest>): { ok: true; value: BatchRenderRequest } | { ok: false; error: string } {
  if (!Array.isArray(body.operations) || body.operations.length < 1 || body.operations.length > 10) return { ok: false, error: "operations must contain 1–10 render operations." };
  const kinds = new Set(["template", "url", "html", "social", "pdf"]);
  for (const operation of body.operations) {
    if (!operation || !kinds.has(operation.kind) || !isPlainObject(operation.payload)) return { ok: false, error: "Each operation must have a supported kind and payload." };
  }
  return { ok: true, value: body as BatchRenderRequest };
}

function validateStoredTemplateInput(body: Partial<StoredHtmlTemplateInput>): { ok: true; value: StoredHtmlTemplateInput } | { ok: false; error: string } {
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) return { ok: false, error: "name is required." };
  const html = validateHtmlBody({ html: body.html, css: body.css, width: body.width, height: body.height, format: body.format });
  if (!html.ok) return html;
  return { ok: true, value: { name: body.name.trim().slice(0, 80), html: html.value.html, css: html.value.css, width: html.value.width, height: html.value.height, format: html.value.format } };
}

function validateStoredTemplatePatch(body: Partial<StoredHtmlTemplateInput>): { ok: true; value: Partial<StoredHtmlTemplateInput> } | { ok: false; error: string } {
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) return { ok: false, error: "name cannot be empty." };
  if (body.html !== undefined && (typeof body.html !== "string" || body.html.length > 500_000)) return { ok: false, error: "html must be a string under 500 KB." };
  if (body.css !== undefined && (typeof body.css !== "string" || body.css.length > 100_000)) return { ok: false, error: "css must be a string under 100 KB." };
  if (body.width !== undefined && !validDimension(body.width, 200, 2400)) return { ok: false, error: "width must be 200–2400." };
  if (body.height !== undefined && !validDimension(body.height, 100, 3000)) return { ok: false, error: "height must be 100–3000." };
  if (body.format !== undefined && !["png", "jpeg", "webp"].includes(body.format)) return { ok: false, error: "format must be png, jpeg, or webp." };
  return { ok: true, value: body };
}

function validateJobBody(body: Partial<AsyncJobRequest>): { ok: true; value: AsyncJobRequest } | { ok: false; status: 400 | 403; code: string; error: string } {
  const kinds: JobKind[] = ["template", "url", "html", "pdf", "social", "batch"];
  if (!body.kind || !kinds.includes(body.kind)) return badValidation("Unsupported job kind.");
  if (!isPlainObject(body.payload)) return badValidation("payload is required.");
  if (body.webhook_url) {
    const parsed = validatePublicUrl(body.webhook_url);
    if (!parsed.ok) return parsed;
    body.webhook_url = parsed.url;
  }
  if (body.webhook_secret && (typeof body.webhook_secret !== "string" || body.webhook_secret.length > 200)) return badValidation("webhook_secret is too long.");
  return { ok: true, value: body as AsyncJobRequest };
}

function validateRenderLinkBody(body: Partial<RenderLinkRequest>): { ok: true; value: RenderLinkRequest } | { ok: false; error: string } {
  if (!body.kind || !["template", "url", "html", "social"].includes(body.kind)) return { ok: false, error: "kind must be template, url, html, or social." };
  if (!isPlainObject(body.payload)) return { ok: false, error: "payload is required." };
  const ttl = body.expires_in_seconds ?? 60 * 60 * 24 * 7;
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 60 * 60 * 24 * 30) return { ok: false, error: "expires_in_seconds must be between 60 seconds and 30 days." };
  return { ok: true, value: { kind: body.kind, payload: body.payload, expires_in_seconds: ttl } as RenderLinkRequest };
}

function validatePublicUrl(value: unknown): { ok: true; url: string } | { ok: false; status: 400 | 403; code: string; error: string } {
  if (!value || typeof value !== "string") return badValidation('"url" is required.');
  try { return { ok: true, url: parsePublicHttpUrl(value).toString() }; }
  catch (error) {
    if ((error as Error).message === "PRIVATE_HOST") return { ok: false, status: 403, code: "FORBIDDEN", error: "Private/local URLs are not allowed." };
    return badValidation("A valid public http/https URL is required.");
  }
}

function badValidation(error: string): { ok: false; status: 400; code: string; error: string } {
  return { ok: false, status: 400, code: "VALIDATION_ERROR", error };
}

function toCaptureOptions(request: ScreenshotRequest) {
  return {
    url: request.url,
    viewportWidth: request.viewport_width ?? 1200,
    viewportHeight: request.viewport_height ?? 630,
    delay: request.delay ?? 0,
    waitUntil: request.wait_until ?? "networkidle0",
    waitForSelector: request.wait_for_selector,
    customCss: request.custom_css,
    customJs: request.custom_js,
    userAgent: request.user_agent,
    headers: request.headers,
    darkMode: request.dark_mode,
    fullPage: request.full_page,
    selector: request.selector,
    format: request.format,
    quality: request.quality,
    hideSelectors: request.hide_selectors,
    deviceScaleFactor: request.device_scale_factor,
    cookies: request.cookies,
    locale: request.locale,
    timezone: request.timezone,
    clickSelector: request.click_selector,
    scrollTo: request.scroll_to,
    blockResources: request.block_resources,
    clip: request.clip,
    omitBackground: request.omit_background,
  };
}

function renderLinkToOperation(kind: RenderLinkRequest["kind"], payload: unknown): BatchOperation {
  return { kind, payload } as BatchOperation;
}

function jobToOperation(kind: JobKind, payload: unknown): BatchOperation {
  if (kind === "batch") throw new Error("Batch jobs are handled separately.");
  return { kind, payload } as BatchOperation;
}

function extractResultUrl(result: unknown): string | undefined {
  if (!isPlainObject(result)) return undefined;
  if (typeof result.url === "string") return result.url;
  if (typeof result.image_url === "string") return result.image_url;
  return undefined;
}

function publicJob(job: AsyncJobRecord) {
  const { webhook_secret: _secret, ...safe } = job;
  return safe;
}

function withoutTemplateSource<T extends { html: string; css?: string }>(item: T) {
  const { html: _html, css: _css, ...rest } = item;
  return rest;
}

function validateBrowserCustomization(body: Partial<BrowserCustomization>): string | null {
  if (body.custom_css && body.custom_css.length > 100_000) return "custom_css is limited to 100 KB.";
  if (body.custom_js && body.custom_js.length > 50_000) return "custom_js is limited to 50 KB.";
  if (body.wait_for_selector && !validSelectorString(body.wait_for_selector)) return "wait_for_selector is too long or invalid.";
  if (body.click_selector && !validSelectorString(body.click_selector)) return "click_selector is too long or invalid.";
  if (body.locale !== undefined && (typeof body.locale !== "string" || body.locale.length > 100 || !/^[A-Za-z0-9,;=. _*-]+$/.test(body.locale))) return "locale is invalid.";
  if (body.timezone !== undefined && (typeof body.timezone !== "string" || body.timezone.length > 100 || !/^[A-Za-z0-9_+\-/]+$/.test(body.timezone))) return "timezone is invalid.";
  if (body.scroll_to !== undefined && body.scroll_to !== "bottom" && (!Number.isFinite(body.scroll_to) || Number(body.scroll_to) < 0 || Number(body.scroll_to) > 1_000_000)) return "scroll_to must be bottom or a Y coordinate between 0 and 1000000.";
  if (body.block_resources !== undefined) {
    const allowed = new Set(["image", "stylesheet", "font", "media", "script"]);
    if (!Array.isArray(body.block_resources) || body.block_resources.length > 5 || body.block_resources.some((item) => !allowed.has(item))) return "block_resources contains an unsupported resource type.";
  }
  if (body.cookies !== undefined) {
    if (!Array.isArray(body.cookies) || body.cookies.length > 50) return "cookies accepts up to 50 entries.";
    for (const cookie of body.cookies) {
      if (!isPlainObject(cookie) || typeof cookie.name !== "string" || !cookie.name || cookie.name.length > 256 || typeof cookie.value !== "string" || cookie.value.length > 4096) return "cookies contains an invalid name or value.";
      if (cookie.domain !== undefined && (typeof cookie.domain !== "string" || cookie.domain.length > 255)) return "cookie domain is invalid.";
      if (cookie.path !== undefined && (typeof cookie.path !== "string" || cookie.path.length > 1024)) return "cookie path is invalid.";
      if (cookie.sameSite !== undefined && !["Strict", "Lax", "None"].includes(String(cookie.sameSite))) return "cookie sameSite must be Strict, Lax, or None.";
    }
  }
  const headers = sanitizeHeaders(body.headers);
  if (body.headers && !headers) return "headers contains unsupported values.";
  return null;
}

function sanitizeHeaders(value: unknown): Record<string, string> | null {
  if (value === undefined) return {};
  if (!isPlainObject(value)) return null;
  const forbidden = new Set(["host", "connection", "content-length", "transfer-encoding", "cf-connecting-ip", "x-forwarded-for"]);
  const out: Record<string, string> = {};
  const entries = Object.entries(value);
  if (entries.length > 20) return null;
  for (const [key, raw] of entries) {
    if (!/^[a-z0-9-]{1,64}$/i.test(key) || forbidden.has(key.toLowerCase()) || typeof raw !== "string" || raw.length > 2_000) return null;
    out[key] = raw;
  }
  return out;
}

function validSelectorString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 500 && !/[\u0000-\u001f]/.test(value);
}

function validDimension(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasCredits(auth: AuthContext, count: number): boolean {
  return auth.rendersUsed + count <= auth.rendersLimit;
}

function cleanOptional(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function bearerToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1];
}

function secondsUntilNextMonth(): number {
  const now = new Date();
  return Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - now.getTime()) / 1000));
}

function jsonError(c: Context<HonoEnv>, status: 400 | 401 | 403 | 404 | 429 | 500, code: string, error: string) {
  c.header("Cache-Control", "no-store");
  return c.json({ error, code, request_id: c.get("requestId") }, status);
}

function openApiDocument(origin: string) {
  const auth = [{ ApiKey: [] }];
  return {
    openapi: "3.1.0",
    info: {
      title: "Ogify API",
      version: "1.6.0",
      description: "Developer rendering infrastructure for screenshots, HTML-to-image, PDFs, page extraction, social cards, reusable templates, signed render links, async jobs, batches, and hosted render assets.",
    },
    servers: [{ url: origin }],
    components: { securitySchemes: { ApiKey: { type: "apiKey", in: "header", name: "x-api-key" }, Bearer: { type: "http", scheme: "bearer" } } },
    paths: {
      "/v1/render/template": { post: { summary: "Render a built-in social template", security: auth } },
      "/v1/render/url": { post: { summary: "Capture a URL as PNG/JPEG/WebP", security: auth } },
      "/v1/render/html": { post: { summary: "Render HTML/CSS to an image", security: auth } },
      "/v1/render/pdf": { post: { summary: "Render a URL or HTML to PDF", security: auth } },
      "/v1/render/composite": { post: { summary: "Combine a website capture with a branded social card", security: auth } },
      "/v1/render/social": { post: { summary: "Extract page metadata and create a branded social card", security: auth } },
      "/v1/render/multi": { post: { summary: "Render up to six size variants", security: auth } },
      "/v1/render/batch": { post: { summary: "Run up to ten mixed render operations", security: auth } },
      "/v1/extract/metadata": { post: { summary: "Extract metadata from a rendered webpage", security: auth } },
      "/v1/extract/content": { post: { summary: "Extract hydrated HTML, visible text, and optional links", security: auth } },
      "/v1/templates": { get: { summary: "List reusable HTML templates", security: auth }, post: { summary: "Create a reusable HTML template", security: auth } },
      "/v1/templates/{id}/render": { post: { summary: "Render a saved HTML template with variable data", security: auth } },
      "/v1/jobs": { post: { summary: "Create an asynchronous render job with optional webhook", security: auth } },
      "/v1/jobs/{id}": { get: { summary: "Read an async job", security: auth } },
      "/v1/render-links": { post: { summary: "Create a signed on-demand public render link", security: auth } },
      "/v1/me/usage": { get: { summary: "Get monthly usage", security: auth } },
      "/i/{id}.png": { get: { summary: "Fetch a generated public PNG" } },
      "/a/{asset}": { get: { summary: "Fetch a hosted render asset" } },
      "/r/{id}": { get: { summary: "Resolve an on-demand render link" } },
    },
  };
}
