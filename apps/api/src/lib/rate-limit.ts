import type { PlanId } from "../types/index.js";
import { PLAN_RATE_LIMITS_PER_MINUTE } from "../types/index.js";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Best-effort edge rate limit using the existing CACHE KV binding.
 * Monthly quota remains authoritative in Supabase; this protects browser/API
 * resources from bursts without requiring a new production binding.
 */
export async function checkApiRateLimit(
  kv: KVNamespace,
  apiKeyId: string,
  plan: PlanId
): Promise<RateLimitResult> {
  const limit = PLAN_RATE_LIMITS_PER_MINUTE[plan];
  return checkWindow(kv, `api:${apiKeyId}`, limit, 60);
}

export async function checkDemoRateLimit(
  kv: KVNamespace,
  clientId: string
): Promise<RateLimitResult> {
  return checkWindow(kv, `demo:${clientId}`, 12, 3600);
}

async function checkWindow(
  kv: KVNamespace,
  identity: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(nowSeconds / windowSeconds);
  const key = `ratelimit:${identity}:${bucket}`;
  const currentRaw = await kv.get(key);
  const current = Number.parseInt(currentRaw ?? "0", 10) || 0;
  const resetSeconds = windowSeconds - (nowSeconds % windowSeconds);

  if (current >= limit) {
    return { allowed: false, limit, remaining: 0, resetSeconds };
  }

  await kv.put(key, String(current + 1), {
    expirationTtl: Math.max(60, windowSeconds * 2),
  });

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current - 1),
    resetSeconds,
  };
}
