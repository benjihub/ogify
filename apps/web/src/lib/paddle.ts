import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

export async function getPaddleInstance(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;

  paddleInstance = await initializePaddle({
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    environment:
      (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") ??
      "sandbox",
  });

  return paddleInstance;
}

export const PADDLE_PRICE_IDS = {
  starterMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY ?? "",
  starterYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY ?? "",
  proMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ?? "",
  proYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY ?? "",
  businessMonthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY ?? "",
  businessYearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY ?? "",
  lifetime: process.env.NEXT_PUBLIC_PADDLE_PRICE_LIFETIME ?? "",
} as const;

export type CheckoutPlanId = keyof typeof PADDLE_PRICE_IDS;

export type PlanId = "free" | "starter" | "pro" | "business" | "lifetime";

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: 100,
  starter: 500,
  pro: 2_000,
  business: 10_000,
  lifetime: 5_000,
};

export const PLAN_PRICES: Record<PlanId, string> = {
  free: "$0 / mo",
  starter: "$10 / mo",
  pro: "$29 / mo",
  business: "$99 / mo",
  lifetime: "$99 one-time",
};
