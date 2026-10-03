// ── Cloudflare Worker environment bindings ────────────────────────────────
export interface Env {
  // Secrets (set via wrangler secret put or .dev.vars)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  CACHE_SIGNING_KEY: string;

  // Non-secret vars (wrangler.jsonc [vars] or Cloudflare dashboard)
  OGIFY_ENV: "development" | "staging" | "production";
  PADDLE_PRICE_STARTER_MONTHLY: string;
  PADDLE_PRICE_STARTER_YEARLY: string;
  PADDLE_PRICE_PRO_MONTHLY: string;
  PADDLE_PRICE_PRO_YEARLY: string;
  PADDLE_PRICE_BUSINESS_MONTHLY: string;
  PADDLE_PRICE_BUSINESS_YEARLY: string;
  PADDLE_PRICE_LIFETIME: string;

  // Cloudflare bindings
  CACHE: KVNamespace;     // render cache
  RENDERS: R2Bucket;      // persistent image storage
  BROWSER: Fetcher;       // Browser Rendering (Puppeteer)
}

// ── Supabase row shapes ───────────────────────────────────────────────────

/**
 * Table: api_keys
 * id            uuid primary key default gen_random_uuid()
 * user_id       uuid references auth.users(id)
 * key_hash      text unique not null          -- SHA-256 hex of the raw key
 * created_at    timestamptz default now()
 * revoked_at    timestamptz                   -- null = active
 */
export interface ApiKeyRow {
  id: string;
  user_id: string;
  key_hash: string;
  created_at: string;
  revoked_at: string | null;
}

/**
 * Table: subscriptions
 * id                    uuid primary key default gen_random_uuid()
 * user_id               uuid unique references auth.users(id)
 * plan                  text not null default 'free'
 * renders_limit         int  not null default 100
 * paddle_subscription_id text
 * paddle_customer_id    text
 * status                text not null default 'active'  -- active | cancelled | paused
 * current_period_end    timestamptz
 * updated_at            timestamptz default now()
 */
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

/**
 * Table: usage
 * id            uuid primary key default gen_random_uuid()
 * user_id       uuid references auth.users(id)
 * period        text not null    -- format: YYYY-MM
 * renders_used  int  not null default 0
 * unique(user_id, period)
 */
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

export type TemplateId = "blog" | "product" | "saas";

// ── Request / response bodies ─────────────────────────────────────────────

export interface TemplateRenderRequest {
  template: TemplateId;
  title: string;
  author?: string;
  tag?: string;
  /** Public image URL to embed in the card (optional) */
  image_url?: string;
  /** Output dimensions — default 1200 × 630 */
  width?: number;
  height?: number;
}

export interface ScreenshotRequest {
  /** Fully-qualified public URL to capture */
  url: string;
  /** Viewport width for the browser — default 1200 */
  viewport_width?: number;
  /** Viewport height for the browser — default 630 */
  viewport_height?: number;
  /** Milliseconds to wait after navigation before capture — default 500 */
  delay?: number;
}

export interface UsageResponse {
  plan: PlanId;
  renders_used: number;
  renders_limit: number;
  renders_remaining: number;
  period: string;
  resets_on: string; // ISO date of the first day of next month
}

// ── Internal ──────────────────────────────────────────────────────────────

/** Attached to Hono context after auth middleware validates an API key */
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
  status: number;
}
