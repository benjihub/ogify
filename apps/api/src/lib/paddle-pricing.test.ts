import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isLifetimePaddlePriceId,
  paddleUserIdFromCustomData,
  planFromPaddlePriceId,
  type PaddlePricingConfig,
} from "./paddle-pricing.js";

const pricing: PaddlePricingConfig = {
  starterMonthly: "pri_starter_monthly",
  starterYearly: "pri_starter_yearly",
  proMonthly: "pri_pro_monthly",
  proYearly: "pri_pro_yearly",
  businessMonthly: "pri_business_monthly",
  businessYearly: "pri_business_yearly",
  lifetime: "pri_lifetime",
};

test("maps configured monthly and yearly Paddle price IDs exactly", () => {
  assert.equal(planFromPaddlePriceId("pri_starter_monthly", pricing), "starter");
  assert.equal(planFromPaddlePriceId("pri_starter_yearly", pricing), "starter");
  assert.equal(planFromPaddlePriceId("pri_pro_monthly", pricing), "pro");
  assert.equal(planFromPaddlePriceId("pri_pro_yearly", pricing), "pro");
  assert.equal(planFromPaddlePriceId("pri_business_monthly", pricing), "business");
  assert.equal(planFromPaddlePriceId("pri_business_yearly", pricing), "business");
});

test("does not downgrade an unknown Paddle price to the free plan", () => {
  assert.equal(planFromPaddlePriceId("pri_unknown", pricing), null);
  assert.equal(planFromPaddlePriceId("", pricing), null);
});

test("recognizes the lifetime price only by exact configured ID", () => {
  assert.equal(isLifetimePaddlePriceId("pri_lifetime", pricing), true);
  assert.equal(isLifetimePaddlePriceId("pri_lifetime_extra", pricing), false);
  assert.equal(isLifetimePaddlePriceId("lifetime", pricing), false);
});

test("requires a non-empty user ID in Paddle custom data", () => {
  assert.equal(paddleUserIdFromCustomData({ user_id: "user-123" }), "user-123");
  assert.equal(paddleUserIdFromCustomData({ user_id: "  " }), null);
  assert.equal(paddleUserIdFromCustomData(undefined), null);
});
