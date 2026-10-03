"use client";

import Link from "next/link";
import { PaddleCheckout } from "@/components/PaddleCheckout";
import { PLAN_PRICES, PLAN_LIMITS } from "@/lib/paddle";
import type { CheckoutPlanId, PlanId } from "@/lib/paddle";
import type { SubscriptionDisplay } from "@/app/dashboard/page";

interface BillingPanelProps {
  subscription: SubscriptionDisplay;
  userEmail: string;
}

type UpgradePlan = {
  checkoutId: Extract<
    CheckoutPlanId,
    "starterMonthly" | "proMonthly" | "businessMonthly"
  >;
  displayPlan: Extract<PlanId, "starter" | "pro" | "business">;
};

const NEXT_PLAN: Partial<Record<PlanId, UpgradePlan>> = {
  free: { checkoutId: "starterMonthly", displayPlan: "starter" },
  starter: { checkoutId: "proMonthly", displayPlan: "pro" },
  pro: { checkoutId: "businessMonthly", displayPlan: "business" },
};

const PLAN_LABEL: Record<PlanId, string> = {
  free:     "Free",
  starter:  "Starter",
  pro:      "Pro",
  business: "Business",
  lifetime: "Founder's Lifetime",
};

export function BillingPanel({ subscription, userEmail }: BillingPanelProps) {
  const { plan, rendersLimit, currentPeriodEnd } = subscription;
  const nextPlan = NEXT_PLAN[plan];
  const isLifetime = plan === "lifetime";

  const billingDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="flex flex-col justify-between rounded border border-line-dim bg-ink-soft p-6">
      {/* Header */}
      <div>
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
          Plan &amp; Billing
        </span>

        {/* Plan summary */}
        <div className="mt-4 rounded border border-line-dim bg-ink p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg uppercase tracking-wide text-fg">
                {PLAN_LABEL[plan]}
              </div>
              <div className="mt-0.5 font-mono text-sm text-muted">
                {PLAN_PRICES[plan]}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[11px] text-muted">Renders / mo</div>
              <div className="font-mono text-sm text-fg">
                {rendersLimit.toLocaleString()}
              </div>
            </div>
          </div>

          {billingDate && (
            <div className="mt-3 border-t border-line-dim pt-3 font-mono text-[11px] text-muted">
              Next renewal: <span className="text-fg">{billingDate}</span>
            </div>
          )}

          {isLifetime && (
            <div className="mt-3 border-t border-line-dim pt-3">
              <p className="font-mono text-[11px] leading-relaxed text-gold">
                You&apos;re on the Founder&apos;s Lifetime plan.
                Thank you for supporting Ogify early. ❤️
              </p>
            </div>
          )}
        </div>

        {/* Feature list */}
        <ul className="mt-4 space-y-2">
          {getPlanFeatures(plan).map((f) => (
            <li key={f} className="flex items-center gap-2.5 font-mono text-xs text-muted">
              <span className="text-[#4ade80]">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        {!isLifetime && nextPlan && (
          <PaddleCheckout
            plan={nextPlan.checkoutId}
            email={userEmail}
            variant="primary"
          >
            Upgrade to {PLAN_LABEL[nextPlan.displayPlan]} — {PLAN_PRICES[nextPlan.displayPlan]}
          </PaddleCheckout>
        )}

        {plan === "free" && (
          <PaddleCheckout plan="lifetime" email={userEmail} variant="ghost">
            Lifetime license — $99 one-time
          </PaddleCheckout>
        )}

        {plan !== "free" && !isLifetime && (
          <a
            href="https://customer.paddle.com/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded border border-line py-2.5 font-mono text-xs uppercase tracking-wide text-muted hover:border-fg hover:text-fg"
          >
            Manage billing →
            <span className="font-mono text-[10px] text-line">(Paddle portal)</span>
          </a>
        )}

        {plan === "free" && (
          <Link
            href="/pricing"
            className="text-center font-mono text-[11px] text-muted hover:text-fg"
          >
            Compare all plans →
          </Link>
        )}
      </div>
    </section>
  );
}

function getPlanFeatures(plan: PlanId): string[] {
  const base = ["All templates", "URL screenshot mode", "Edge caching"];
  const map: Record<PlanId, string[]> = {
    free:     [...base, "Ogify watermark", "100 renders / month"],
    starter:  [...base, "No watermark", "Priority support", "500 renders / month"],
    pro:      [...base, "No watermark", "White-label option", "Priority support", "2,000 renders / month"],
    business: [...base, "No watermark", "Custom templates", "Dedicated support", "10,000 renders / month"],
    lifetime: [...base, "No watermark", "White-label option", "5,000 renders / month", "All future templates"],
  };
  return map[plan] ?? base;
}
