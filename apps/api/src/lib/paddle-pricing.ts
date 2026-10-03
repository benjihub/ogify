import type { Env, PlanId } from "../types/index.js";

export interface PaddlePricingConfig {
  starterMonthly: string;
  starterYearly: string;
  proMonthly: string;
  proYearly: string;
  businessMonthly: string;
  businessYearly: string;
  lifetime: string;
}

type PaidPlanId = Exclude<PlanId, "free">;

export function paddlePricingFromEnv(env: Env): PaddlePricingConfig {
  return {
    starterMonthly: env.PADDLE_PRICE_STARTER_MONTHLY,
    starterYearly: env.PADDLE_PRICE_STARTER_YEARLY,
    proMonthly: env.PADDLE_PRICE_PRO_MONTHLY,
    proYearly: env.PADDLE_PRICE_PRO_YEARLY,
    businessMonthly: env.PADDLE_PRICE_BUSINESS_MONTHLY,
    businessYearly: env.PADDLE_PRICE_BUSINESS_YEARLY,
    lifetime: env.PADDLE_PRICE_LIFETIME,
  };
}

/**
 * Maps a Paddle price ID to a paid plan using exact configured IDs only.
 * Returns null for unknown, missing, or ambiguously configured price IDs.
 */
export function planFromPaddlePriceId(
  priceId: string,
  pricing: PaddlePricingConfig
): PaidPlanId | null {
  if (!priceId) return null;

  const matches: PaidPlanId[] = [
    [pricing.starterMonthly, "starter"],
    [pricing.starterYearly, "starter"],
    [pricing.proMonthly, "pro"],
    [pricing.proYearly, "pro"],
    [pricing.businessMonthly, "business"],
    [pricing.businessYearly, "business"],
  ].flatMap(([configuredPriceId, plan]) =>
    configuredPriceId && configuredPriceId === priceId ? [plan as PaidPlanId] : []
  );

  return matches.length === 1 ? matches[0] : null;
}

export function isLifetimePaddlePriceId(
  priceId: string,
  pricing: PaddlePricingConfig
): boolean {
  return Boolean(pricing.lifetime) && priceId === pricing.lifetime;
}

export function paddleUserIdFromCustomData(
  customData: { user_id?: string } | undefined
): string | null {
  const userId = customData?.user_id?.trim();
  return userId || null;
}
