import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext, ApiKeyRow, SubscriptionRow, UsageRow, PlanId } from "../types/index.js";
import { PLAN_LIMITS } from "../types/index.js";

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * SHA-256 hex digest of a UTF-8 string.
 * Uses the Web Crypto API — available in both Workers and browsers.
 */
async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns the current usage period string, e.g. "2024-11" */
function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/** ISO date string of the first day of next month (when usage resets) */
export function nextResetDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);
}

// ── Core auth/usage logic ─────────────────────────────────────────────────

/**
 * Validates the raw API key from the request, checks usage limits, and
 * returns an AuthContext if the key is valid and the user has remaining
 * renders this month.
 *
 * Throws (returns null + reason string) on any failure so the route
 * handler can return a clean 401/403 response.
 */
export async function validateApiKey(
  rawKey: string,
  supabase: SupabaseClient
): Promise<{ ctx: AuthContext } | { error: string; status: 401 | 403 | 429; code: string }> {
  if (!rawKey || rawKey.length < 10) {
    return { error: "Missing or malformed API key.", status: 401, code: "INVALID_API_KEY" };
  }

  const keyHash = await sha256(rawKey);

  // 1. Look up the key
  const { data: keyRow, error: keyErr } = await supabase
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", keyHash)
    .single<ApiKeyRow>();

  if (keyErr || !keyRow) {
    return { error: "Invalid API key.", status: 401, code: "INVALID_API_KEY" };
  }

  if (keyRow.revoked_at !== null) {
    return { error: "API key has been revoked.", status: 401, code: "REVOKED_API_KEY" };
  }

  const userId = keyRow.user_id;

  // 2. Fetch the user's subscription (defaults to free if not found)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, renders_limit, status")
    .eq("user_id", userId)
    .single<Pick<SubscriptionRow, "plan" | "renders_limit" | "status">>();

  const subscriptionActive = sub?.status === "active";
  const plan: PlanId = subscriptionActive ? (sub.plan as PlanId) : "free";
  const rendersLimit = subscriptionActive ? (sub?.renders_limit ?? PLAN_LIMITS.free) : PLAN_LIMITS.free;

  // 3. Fetch current-month usage (upsert the row if first use this period)
  const period = currentPeriod();
  const { data: usageRow, error: usageErr } = await supabase
    .from("usage")
    .select("renders_used")
    .eq("user_id", userId)
    .eq("period", period)
    .single<Pick<UsageRow, "renders_used">>();

  if (usageErr && usageErr.code !== "PGRST116") {
    // PGRST116 = "Row not found" — fine for a new period, anything else is a DB error
    return { error: "Could not retrieve usage data.", status: 403, code: "USAGE_LOOKUP_FAILED" };
  }

  const rendersUsed = usageRow?.renders_used ?? 0;

  if (rendersUsed >= rendersLimit) {
    return {
      error: `Monthly render limit reached (${rendersUsed}/${rendersLimit}). Upgrade your plan to continue.`,
      status: 429,
      code: "MONTHLY_QUOTA_EXCEEDED",
    };
  }

  return {
    ctx: {
      userId,
      apiKeyId: keyRow.id,
      plan,
      rendersLimit,
      rendersUsed,
    },
  };
}

/**
 * Atomically increments the render count for the current month.
 * Uses an upsert so the first render of the month creates the row.
 * Called AFTER a successful render — we only charge for completed renders.
 */
export async function incrementUsage(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  const period = currentPeriod();

  // Upsert approach: insert with 1 on first render, increment on conflict
  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_period: period,
  });

  if (error) {
    // Non-fatal — we've already returned the image. Log and move on.
    console.error("[usage] Failed to increment usage:", error.message);
  }
}

export async function markApiKeyUsed(
  apiKeyId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyId);

  if (error) {
    console.error("[api_keys] Failed to update last_used_at:", error.message);
  }
}

/**
 * SQL function expected in Supabase (run once in the SQL editor):
 *
 * create or replace function increment_usage(p_user_id uuid, p_period text)
 * returns void language plpgsql as $$
 * begin
 *   insert into usage (user_id, period, renders_used)
 *   values (p_user_id, p_period, 1)
 *   on conflict (user_id, period)
 *   do update set renders_used = usage.renders_used + 1;
 * end;
 * $$;
 */
