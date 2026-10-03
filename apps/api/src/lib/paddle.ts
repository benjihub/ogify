/**
 * Paddle webhook handler.
 *
 * Paddle signs every webhook request with a secret you set in the dashboard.
 * We verify the `Paddle-Signature` header before trusting any payload.
 *
 * Docs: https://developer.paddle.com/webhooks/signature-verification
 *
 * Relevant events we handle:
 *   subscription.activated  → create / activate subscription row
 *   subscription.updated    → update plan / limit
 *   subscription.cancelled  → mark subscription as cancelled
 *   subscription.paused     → mark subscription as paused
 *   transaction.completed   → one-time (lifetime) purchases
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Env, SubscriptionRow } from "../types/index.js";
import { PLAN_LIMITS } from "../types/index.js";
import {
  isLifetimePaddlePriceId,
  paddlePricingFromEnv,
  paddleUserIdFromCustomData,
  planFromPaddlePriceId,
  type PaddlePricingConfig,
} from "./paddle-pricing.js";

// ── Signature verification ────────────────────────────────────────────────

/**
 * Parses and verifies a Paddle webhook request.
 *
 * Paddle sends:
 *   Paddle-Signature: ts=<timestamp>;h1=<hmac-sha256-hex>
 *
 * We reconstruct the signed payload as `ts:body` and compare HMAC-SHA256
 * using the secret stored in `env.PADDLE_WEBHOOK_SECRET`.
 *
 * Returns the parsed JSON body if valid, throws otherwise.
 */
export async function verifyPaddleWebhook(
  request: Request,
  secret: string
): Promise<PaddleWebhookPayload> {
  const signatureHeader = request.headers.get("paddle-signature");
  if (!signatureHeader) {
    throw new Error("Missing Paddle-Signature header.");
  }

  const body = await request.text();

  // Parse ts= and h1= from the header
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [k, v] = part.split("=");
      return [k, v];
    })
  );

  const ts = parts["ts"];
  const receivedHmac = parts["h1"];
  if (!ts || !receivedHmac) {
    throw new Error("Malformed Paddle-Signature header.");
  }

  // Replay-attack guard — reject webhooks older than 5 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(ts, 10)) > 300) {
    throw new Error("Webhook timestamp is too old.");
  }

  // HMAC-SHA256 of `${ts}:${body}`
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${ts}:${body}`)
  );
  const expectedHmac = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(expectedHmac, receivedHmac)) {
    throw new Error("Invalid Paddle webhook signature.");
  }

  return JSON.parse(body) as PaddleWebhookPayload;
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Event processing ──────────────────────────────────────────────────────

/**
 * Dispatches a verified Paddle event to the appropriate handler.
 * Silently ignores events we don't care about.
 */
export async function processPaddleEvent(
  payload: PaddleWebhookPayload,
  supabase: SupabaseClient,
  env: Env
): Promise<void> {
  const { event_type, data } = payload;
  const pricing = paddlePricingFromEnv(env);

  switch (event_type) {
    case "subscription.activated":
    case "subscription.updated":
      await handleSubscriptionChange(
        data as PaddleSubscriptionData,
        supabase,
        pricing
      );
      break;

    case "subscription.cancelled":
      await handleSubscriptionCancelled(
        data as PaddleSubscriptionData,
        supabase
      );
      break;

    case "subscription.paused":
      await handleSubscriptionPaused(data as PaddleSubscriptionData, supabase);
      break;

    case "transaction.completed":
      await handleTransactionCompleted(
        data as PaddleTransactionData,
        supabase,
        pricing
      );
      break;

    default:
      // Log and ignore — don't throw, Paddle expects a 200 for any valid signature
      console.info(`[paddle] Ignoring unhandled event: ${event_type}`);
  }
}

async function handleSubscriptionChange(
  data: PaddleSubscriptionData,
  supabase: SupabaseClient,
  pricing: PaddlePricingConfig
): Promise<void> {
  const userId = paddleUserIdFromCustomData(data.custom_data);
  if (!userId) {
    console.warn("[paddle] subscription event missing custom_data.user_id");
    return;
  }

  const priceId = data.items?.[0]?.price?.id ?? "";
  const plan = planFromPaddlePriceId(priceId, pricing);
  if (!plan) {
    console.warn(
      `[paddle] Ignoring subscription event with unknown or unconfigured price ID: ${priceId || "(missing)"}`
    );
    return;
  }

  const limit = PLAN_LIMITS[plan];

  const row: Partial<SubscriptionRow> = {
    user_id: userId,
    plan,
    renders_limit: limit,
    paddle_subscription_id: data.id,
    paddle_customer_id: data.customer_id,
    status: "active",
    current_period_end: data.current_billing_period?.ends_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.error("[paddle] Failed to upsert subscription:", error.message);
    throw error;
  }
}

async function handleSubscriptionCancelled(
  data: PaddleSubscriptionData,
  supabase: SupabaseClient
): Promise<void> {
  const userId = paddleUserIdFromCustomData(data.custom_data);
  if (!userId) {
    console.warn("[paddle] cancellation event missing custom_data.user_id");
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) console.error("[paddle] Failed to cancel subscription:", error.message);
}

async function handleSubscriptionPaused(
  data: PaddleSubscriptionData,
  supabase: SupabaseClient
): Promise<void> {
  const userId = paddleUserIdFromCustomData(data.custom_data);
  if (!userId) {
    console.warn("[paddle] pause event missing custom_data.user_id");
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) console.error("[paddle] Failed to pause subscription:", error.message);
}

async function handleTransactionCompleted(
  data: PaddleTransactionData,
  supabase: SupabaseClient,
  pricing: PaddlePricingConfig
): Promise<void> {
  // Lifetime one-time purchase — identify by the price ID
  const userId = paddleUserIdFromCustomData(data.custom_data);
  if (!userId) {
    console.warn("[paddle] transaction.completed missing custom_data.user_id");
    return;
  }

  const isLifetime = data.items?.some((item) =>
    isLifetimePaddlePriceId(item.price?.id ?? "", pricing)
  );

  if (!isLifetime) {
    const priceIds = data.items?.map((item) => item.price?.id ?? "(missing)") ?? [];
    console.warn(
      `[paddle] Ignoring transaction.completed without configured lifetime price ID: ${priceIds.join(", ") || "(missing)"}`
    );
    return;
  }

  const row: Partial<SubscriptionRow> = {
    user_id: userId,
    plan: "lifetime",
    renders_limit: PLAN_LIMITS.lifetime,
    paddle_customer_id: data.customer_id,
    paddle_subscription_id: null, // one-time purchase
    status: "active",
    current_period_end: null, // never expires
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "user_id" });

  if (error) console.error("[paddle] Failed to upsert lifetime sub:", error.message);
}

// ── Paddle payload types (minimal — extend as needed) ─────────────────────

interface PaddleWebhookPayload {
  event_type: string;
  data: PaddleSubscriptionData | PaddleTransactionData;
}

interface PaddleSubscriptionData {
  id: string;
  customer_id: string;
  status: string;
  custom_data?: { user_id?: string };
  items?: { price?: { id: string } }[];
  current_billing_period?: { ends_at: string };
}

interface PaddleTransactionData {
  id: string;
  customer_id: string;
  status: string;
  custom_data?: { user_id?: string };
  items?: { price?: { id: string } }[];
}
