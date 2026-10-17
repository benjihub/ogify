"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PLAN_PRICES } from "@/lib/paddle";
import type { SubscriptionDisplay, ApiKeyDisplay } from "@/app/dashboard/page";

interface StatCardsProps {
  subscription: SubscriptionDisplay;
  rendersUsed: number;
  period: string;
  apiKeys: ApiKeyDisplay[];
}

export function StatCards({
  subscription,
  rendersUsed,
  period,
  apiKeys,
}: StatCardsProps) {
  const pct = Math.round((rendersUsed / subscription.rendersLimit) * 100);
  const primaryKey = apiKeys[0] ?? null;

  // Usage bar colour
  const barColor =
    pct >= 80 ? "bg-cinnabar" : pct >= 50 ? "bg-gold" : "bg-[#4ade80]";

  // Next reset: first day of next month
  const [y, m] = period.split("-").map(Number);
  const resetDate = new Date(y, m, 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Billing date
  const billingDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isUpgradeable = !["business", "lifetime"].includes(subscription.plan);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* ── Card 1: Plan ── */}
      <div className="flex flex-col justify-between rounded-2xl border border-line-dim bg-ink-soft/75 p-5 shadow-sm transition hover:border-line sm:p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
              Plan
            </span>
            <PlanBadge plan={subscription.plan} />
          </div>
          <div className="font-display text-2xl capitalize tracking-tight text-fg">
            {subscription.plan}
          </div>
          <div className="mt-1 font-mono text-sm text-muted">
            {PLAN_PRICES[subscription.plan]}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            {subscription.plan === "lifetime"
              ? "Never expires"
              : billingDate
              ? `Next bill ${billingDate}`
              : "No billing"}
          </span>
          {isUpgradeable && (
            <Link
              href="/pricing"
              className="font-mono text-[11px] text-cinnabar hover:underline"
            >
              Upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* ── Card 2: Usage ── */}
      <div className="flex flex-col justify-between rounded-2xl border border-line-dim bg-ink-soft/75 p-5 shadow-sm transition hover:border-line sm:p-6">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
            Usage this month
          </span>
          <div className="mt-3 font-display text-2xl tracking-tight text-fg">
            {rendersUsed.toLocaleString()}
            <span className="font-mono text-base font-normal text-muted">
              {" "}/ {subscription.rendersLimit.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="mt-1.5 font-mono text-[11px] text-muted">
            {pct}% used
          </div>
        </div>
        <div className="mt-4">
          {pct >= 100 ? (
            <Link
              href="/pricing"
              className="font-mono text-xs text-cinnabar hover:underline"
            >
              Limit reached — Upgrade →
            </Link>
          ) : (
            <span className="font-mono text-xs text-muted">
              Resets {resetDate}
            </span>
          )}
        </div>
      </div>

      {/* ── Card 3: API Key ── */}
      <div className="flex flex-col justify-between rounded-2xl border border-line-dim bg-ink-soft/75 p-5 shadow-sm transition hover:border-line sm:p-6">
        <div>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-gold">
            API Key
          </span>
          {primaryKey ? (
            <>
              <div className="mt-3 font-mono text-sm text-fg">
                {primaryKey.keyPreview
                  ? `${primaryKey.keyPreview}••••••••••••`
                  : "ogfy_live_••••••••••••••••"}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted">
                {primaryKey.lastUsedAt
                  ? `Last used ${timeAgo(primaryKey.lastUsedAt)}`
                  : "Never used"}
              </div>
            </>
          ) : (
            <div className="mt-3 font-mono text-sm text-muted">
              No key generated yet
            </div>
          )}
        </div>
        <div className="mt-4">
          <a
            href="#api-keys"
            className="font-mono text-[11px] text-cinnabar hover:underline"
          >
            {primaryKey ? "Manage keys ↓" : "Generate a key ↓"}
          </a>
        </div>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free:     "border-line text-muted",
    starter:  "border-gold text-gold",
    pro:      "border-[#60a5fa] text-[#60a5fa]",
    business: "border-[#a78bfa] text-[#a78bfa]",
    lifetime: "border-cinnabar text-cinnabar",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        colors[plan] ?? colors.free
      )}
    >
      {plan}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
