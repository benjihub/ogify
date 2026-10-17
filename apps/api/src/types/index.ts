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
  /** Optional future persistent storage binding. Production does not require it. */
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

export interface ScreenshotRequest {
  /** Fully-qualified public URL to capture. */
  url: string;
  /** Viewport width — default 1200, range 320–2400. */
  viewport_width?: number;
  /** Viewport height — default 630, range 240–1800. */
  viewport_height?: number;
  /** Milliseconds to wait after navigation — default 0, max 5000. */
  delay?: number;
  /** Browser navigation strategy. */
  wait_until?: ScreenshotWaitUntil;
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
