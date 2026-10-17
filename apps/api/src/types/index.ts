// ── Cloudflare Worker environment bindings ────────────────────────────────
export interface Env {
  // Secrets (set via wrangler secret put or .dev.vars)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  CACHE_SIGNING_KEY: string;

  // Non-secret vars (wrangler.jsonc vars or Cloudflare dashboard)
  OGIFY_ENV: "development" | "staging" | "production";
  PADDLE_PRICE_STARTER_MONTHLY: string;
  PADDLE_PRICE_STARTER_YEARLY: string;
  PADDLE_PRICE_PRO_MONTHLY: string;
  PADDLE_PRICE_PRO_YEARLY: string;
  PADDLE_PRICE_BUSINESS_MONTHLY: string;
  PADDLE_PRICE_BUSINESS_YEARLY: string;
  PADDLE_PRICE_LIFETIME: string;

  // Cloudflare bindings
  CACHE: KVNamespace;
  /** Optional persistent storage binding. Current production can run on KV only. */
  RENDERS?: R2Bucket;
  BROWSER: Fetcher;
}

// ── Supabase row shapes ───────────────────────────────────────────────────
export interface ApiKeyRow {
  id: string;
  user_id: string;
  key_hash: string;
  created_at: string;
  revoked_at: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: PlanId;
  renders_limit: number;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  status: "active" | "cancelled" | "paused";
  current_period_end: string | null;
  updated_at: string;
}

export interface UsageRow {
  id: string;
  user_id: string;
  period: string;
  renders_used: number;
}

// ── Domain types ──────────────────────────────────────────────────────────
export type PlanId = "free" | "starter" | "pro" | "business" | "lifetime";

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: 100,
  starter: 500,
  pro: 2_000,
  business: 10_000,
  lifetime: 5_000,
};

export const PLAN_RATE_LIMITS_PER_MINUTE: Record<PlanId, number> = {
  free: 30,
  starter: 60,
  pro: 180,
  business: 600,
  lifetime: 180,
};

export type TemplateId = "blog" | "product" | "saas";
export type ScreenshotWaitUntil = "load" | "domcontentloaded" | "networkidle0";
export type ImageFormat = "png" | "jpeg" | "webp";
export type PdfPageFormat = "A4" | "Letter" | "Legal" | "A3";
export type BlockableResource = "image" | "stylesheet" | "font" | "media" | "script";

export interface BrowserCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface BrowserCustomization {
  /** Additional delay after navigation/content load. */
  delay?: number;
  wait_until?: ScreenshotWaitUntil;
  wait_for_selector?: string;
  custom_css?: string;
  custom_js?: string;
  user_agent?: string;
  headers?: Record<string, string>;
  dark_mode?: boolean;
  /** Cookies to set before navigation. */
  cookies?: BrowserCookie[];
  /** Accept-Language value such as en-US or fr-FR. */
  locale?: string;
  /** IANA timezone such as America/New_York. */
  timezone?: string;
  /** Click this selector after the page is ready. */
  click_selector?: string;
  /** Scroll to a Y coordinate or the bottom before capture/extraction. */
  scroll_to?: number | "bottom";
  /** Optional resource types to block for faster captures. */
  block_resources?: BlockableResource[];
}

// ── Request / response bodies ─────────────────────────────────────────────
export interface TemplateRenderRequest {
  template: TemplateId;
  title: string;
  author?: string;
  tag?: string;
  /** Optional brand label used in template marks on paid plans. */
  brand?: string;
  /** Optional #RRGGBB accent override. */
  accent_color?: string;
  /** Optional #RRGGBB background override. */
  background_color?: string;
  /** Output dimensions — default 1200 × 630. */
  width?: number;
  height?: number;
}

export interface ScreenshotRequest extends BrowserCustomization {
  /** Fully-qualified public URL to capture. */
  url: string;
  /** Viewport width — default 1200, range 320–2400. */
  viewport_width?: number;
  /** Viewport height — default 630, range 240–3000. */
  viewport_height?: number;
  /** Capture the complete page instead of only the viewport. */
  full_page?: boolean;
  /** Capture only one element. Cannot be combined with full_page. */
  selector?: string;
  /** Output image format. */
  format?: ImageFormat;
  /** JPEG/WebP quality, 1–100. */
  quality?: number;
  /** CSS selectors to hide before capture. */
  hide_selectors?: string[];
  /** Device scale factor, 1–3. */
  device_scale_factor?: number;
  /** Capture a rectangular region. Cannot be combined with selector/full_page. */
  clip?: { x: number; y: number; width: number; height: number };
  /** Keep page transparency when supported. */
  omit_background?: boolean;
}

export interface HtmlRenderRequest extends BrowserCustomization {
  html: string;
  css?: string;
  width?: number;
  height?: number;
  full_page?: boolean;
  selector?: string;
  format?: ImageFormat;
  quality?: number;
  device_scale_factor?: number;
  omit_background?: boolean;
}

export interface PdfRenderRequest extends BrowserCustomization {
  /** Exactly one of url or html is required. */
  url?: string;
  html?: string;
  css?: string;
  /** CSS selectors to hide before PDF capture. */
  hide_selectors?: string[];
  format?: PdfPageFormat;
  landscape?: boolean;
  print_background?: boolean;
  margin_top?: string;
  margin_right?: string;
  margin_bottom?: string;
  margin_left?: string;
}

export interface MetadataExtractRequest extends BrowserCustomization {
  url: string;
}

export interface ContentExtractRequest extends BrowserCustomization {
  url: string;
  /** Optional element to scope extraction to. */
  selector?: string;
  /** Include up to 200 resolved links from the selected document scope. */
  include_links?: boolean;
}

export interface PageContent {
  url: string;
  title: string;
  text: string;
  html: string;
  links?: Array<{ text: string; url: string }>;
}

export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  canonical_url?: string;
  site_name?: string;
  image_url?: string;
  favicon_url?: string;
  theme_color?: string;
  locale?: string;
}

export interface CompositeRenderRequest extends ScreenshotRequest {
  /** Headline displayed with the live website capture. */
  title: string;
  author?: string;
  tag?: string;
  brand?: string;
  accent_color?: string;
  background_color?: string;
  /** Final output size. Defaults to 1200 × 630. */
  width?: number;
  height?: number;
}

export interface SocialRenderRequest extends Omit<ScreenshotRequest, "selector" | "full_page" | "format" | "quality"> {
  /** Public page to inspect and capture. */
  url: string;
  /** Optional overrides; otherwise Ogify extracts page metadata. */
  title?: string;
  author?: string;
  tag?: string;
  brand?: string;
  accent_color?: string;
  background_color?: string;
  width?: number;
  height?: number;
}

export interface MultiSizeVariant {
  name?: string;
  width: number;
  height: number;
}

export interface MultiSizeRenderRequest {
  kind: "template" | "social";
  variants: MultiSizeVariant[];
  payload: TemplateRenderRequest | SocialRenderRequest;
}

export type BatchOperation =
  | { id?: string; kind: "template"; payload: TemplateRenderRequest }
  | { id?: string; kind: "url"; payload: ScreenshotRequest }
  | { id?: string; kind: "html"; payload: HtmlRenderRequest }
  | { id?: string; kind: "social"; payload: SocialRenderRequest }
  | { id?: string; kind: "pdf"; payload: PdfRenderRequest };

export interface BatchRenderRequest {
  operations: BatchOperation[];
}

export interface StoredHtmlTemplateInput {
  name: string;
  html: string;
  css?: string;
  width?: number;
  height?: number;
  format?: ImageFormat;
}

export interface StoredHtmlTemplate extends StoredHtmlTemplateInput {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface StoredTemplateRenderRequest {
  data?: Record<string, string | number | boolean | null>;
  width?: number;
  height?: number;
  format?: ImageFormat;
}

export type JobKind = "template" | "url" | "html" | "pdf" | "social" | "batch";

export interface AsyncJobRequest {
  kind: JobKind;
  payload: unknown;
  webhook_url?: string;
  /** Optional secret used to HMAC-sign webhook payloads. Ogify never returns it. */
  webhook_secret?: string;
}

export interface AsyncJobRecord {
  id: string;
  user_id: string;
  api_key_id: string;
  kind: JobKind;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  result?: unknown;
  error?: { code: string; message: string };
  webhook_url?: string;
  webhook_secret?: string;
}

export interface RenderLinkRequest {
  kind: "template" | "url" | "html" | "social";
  payload: unknown;
  expires_in_seconds?: number;
}

export interface RenderLinkRecord extends RenderLinkRequest {
  id: string;
  user_id: string;
  api_key_id: string;
  created_at: string;
  expires_at: string;
  result_url?: string;
}

export interface UsageResponse {
  plan: PlanId;
  renders_used: number;
  renders_limit: number;
  renders_remaining: number;
  period: string;
  resets_on: string;
}

export interface PublicRenderResponse {
  id: string;
  image_url: string;
  content_type: "image/png";
  width: number;
  height: number;
  cache: "HIT" | "MISS";
  renders_used: number;
  renders_limit: number;
}

export interface PublicAssetResponse {
  id: string;
  url: string;
  content_type: string;
  extension: string;
  bytes: number;
  width?: number;
  height?: number;
  cache?: "HIT" | "MISS";
  renders_used?: number;
  renders_limit?: number;
}

// ── Internal ──────────────────────────────────────────────────────────────
export interface AuthContext {
  userId: string;
  apiKeyId: string;
  plan: PlanId;
  rendersLimit: number;
  rendersUsed: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  request_id?: string;
}
