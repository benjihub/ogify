"use client";

import { useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { PaddleCheckout } from "@/components/PaddleCheckout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CheckoutPlanId } from "@/lib/paddle";

type BillingInterval = "monthly" | "yearly";

const PAID_PLAN_IDS: Record<
  Exclude<PlanSlug, "free">,
  Record<BillingInterval, CheckoutPlanId>
> = {
  starter: {
    monthly: "starterMonthly",
    yearly: "starterYearly",
  },
  pro: {
    monthly: "proMonthly",
    yearly: "proYearly",
  },
  business: {
    monthly: "businessMonthly",
    yearly: "businessYearly",
  },
};

type PlanSlug = "free" | "starter" | "pro" | "business";

const PLANS: {
  slug: PlanSlug;
  name: string;
  price: Record<BillingInterval, string>;
  renders: string;
  features: string[];
  cta: string;
  popular?: boolean;
}[] = [
  {
    slug: "free",
    name: "Free",
    price: {
      monthly: "$0",
      yearly: "$0",
    },
    renders: "100 renders/month",
    features: [
      "All templates",
      "URL screenshot mode",
      "Ogify watermark",
      "Community support",
    ],
    cta: "Get started",
  },
  {
    slug: "starter",
    name: "Starter",
    price: {
      monthly: "$10",
      yearly: "$8.33",
    },
    renders: "500 renders/month",
    features: [
      "No watermark",
      "Priority support",
      "URL screenshot mode",
      "Higher rate limit",
    ],
    cta: "Upgrade",
  },
  {
    slug: "pro",
    name: "Pro",
    price: {
      monthly: "$29",
      yearly: "$24.17",
    },
    renders: "2,000 renders/month",
    features: [
      "No watermark",
      "White-label option",
      "Custom templates",
      "Higher rate limit",
    ],
    cta: "Upgrade",
    popular: true,
  },
  {
    slug: "business",
    name: "Business",
    price: {
      monthly: "$99",
      yearly: "$82.50",
    },
    renders: "10,000 renders/month",
    features: [
      "No watermark",
      "White-label option",
      "Custom templates",
      "Dedicated support",
    ],
    cta: "Upgrade",
  },
];

const INCLUDED = [
  "All templates: Blog, Product, SaaS, and more",
  "URL screenshot mode",
  "Fast edge caching with Cloudflare CDN",
  "Paddle-handled billing and global tax",
  "API key management and usage dashboard",
  "Open-source <OgImage> React component",
];

const FAQS = [
  {
    question: "Do I need a credit card to start?",
    answer: "No. The free tier only requires an email address.",
  },
  {
    question: "How do you handle tax/VAT?",
    answer:
      "Paddle acts as the Merchant of Record. They collect and remit all applicable taxes, and Ogify never sees your payment details.",
  },
  {
    question: "What happens when I hit my render limit?",
    answer:
      "Ogify returns a 429 status and notifies you. You can upgrade instantly, or wait until the next monthly reset.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There is no lock-in. Your plan stays active until the end of the current billing period.",
  },
  {
    question: "Can I use Ogify with static sites?",
    answer:
      "Absolutely. It is just an HTTP API, so it works with Hugo, Astro, Jekyll, 11ty, and any CI/CD pipeline.",
  },
  {
    question: "Is there a white-label / agency plan?",
    answer:
      "Pro and Business support white-label use cases, including custom watermark and CNAME options. For bigger needs, contact us.",
  },
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");
  const isYearly = billingInterval === "yearly";

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-7 py-24">
          <div className="mx-auto mb-10 max-w-[720px] text-center">
            <div className="mb-3.5 flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold">
              <span className="h-px w-[18px] bg-gold" />
              Pricing
              <span className="h-px w-[18px] bg-gold" />
            </div>
            <h1 className="text-[34px] leading-tight text-paper md:text-[42px]">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Start with 100 renders/month free. Upgrade when you need more.
              All plans include Paddle-handled global tax compliance, so there
              are no VAT headaches.
            </p>
          </div>

          <div className="mb-8 flex flex-col items-center justify-center gap-3">
            <div className="inline-flex rounded border border-line-dim bg-ink-soft p-1">
              {(["monthly", "yearly"] as BillingInterval[]).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setBillingInterval(interval)}
                  className={cn(
                    "h-9 rounded px-4 font-mono text-[11.5px] uppercase tracking-wide transition",
                    billingInterval === interval
                      ? "bg-paper text-ink"
                      : "text-muted hover:text-paper"
                  )}
                >
                  {interval}
                </button>
              ))}
            </div>
            <p className="font-mono text-xs text-line">
              Yearly plans include 2 months free.
            </p>
          </div>

          <FounderLicenseCard />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.slug}
                plan={plan}
                billingInterval={billingInterval}
                isYearly={isYearly}
              />
            ))}
          </div>

          <div className="mt-10 rounded border border-line-dim bg-ink-soft p-5">
            <p className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-gold">
              Open Graph implementation
            </p>
            <pre className="code-card mt-3 text-[12px]">
              {`<meta property="og:image" content="https://api.ogify.online/render/template?template=blog&title=Launch" />`}
            </pre>
          </div>
        </section>

        <section className="border-t border-line-dim py-20">
          <div className="mx-auto max-w-6xl px-7">
            <h2 className="text-[28px] leading-tight text-paper">
              Included in every plan
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INCLUDED.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded border border-line-dim bg-ink-soft p-4 text-sm text-muted"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-cinnabar" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line-dim py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-7 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <div className="mb-3.5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-gold">
                <span className="h-px w-[18px] bg-gold" />
                FAQ
              </div>
              <h2 className="text-[28px] leading-tight text-paper">
                Practical answers before checkout
              </h2>
            </div>
            <PricingFaq />
          </div>
        </section>

        <section className="border-t border-line-dim py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-7 md:flex-row md:items-center md:justify-between">
            <p className="text-lg text-paper">
              Need more than 10,000 renders?
            </p>
            <Link
              href="mailto:hello@ogify.dev"
              className="font-mono text-[12.5px] uppercase tracking-wide text-cinnabar hover:underline"
            >
              Contact us for custom Enterprise pricing
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PricingCard({
  plan,
  billingInterval,
  isYearly,
}: {
  plan: (typeof PLANS)[number];
  billingInterval: BillingInterval;
  isYearly: boolean;
}) {
  const isFree = plan.slug === "free";
  const planId = isFree
    ? undefined
    : PAID_PLAN_IDS[plan.slug as Exclude<PlanSlug, "free">][billingInterval];

  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col rounded border border-line-dim bg-ink-soft p-5 text-paper",
        plan.popular && "border-cinnabar"
      )}
    >
      {plan.popular && (
        <span className="absolute right-4 top-4 rounded border border-cinnabar bg-cinnabar/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-paper">
          Most popular
        </span>
      )}

      <div className="font-mono text-[11.5px] uppercase tracking-wider text-cinnabar">
        {plan.name}
      </div>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="font-display text-[42px] leading-none text-paper">
          {plan.price[billingInterval]}
        </span>
        <span className="pb-1.5 font-mono text-[12px] text-muted">/mo</span>
      </div>
      {isYearly && !isFree && (
        <p className="mt-2 font-mono text-[11px] text-line">
          Billed yearly, 2 months free
        </p>
      )}
      <p className="mt-3 font-mono text-xs text-gold">{plan.renders}</p>
      <p className="mt-2 text-xs text-muted">Paddle handles all taxes.</p>

      <ul className="mt-6 flex flex-1 flex-col gap-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-cinnabar" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isFree ? (
        <Button asChild href="/signup" className="mt-7 w-full">
          {plan.cta}
        </Button>
      ) : (
        <PaddleCheckout plan={planId!} className="mt-7 w-full">
          {plan.cta}
        </PaddleCheckout>
      )}
    </div>
  );
}

function FounderLicenseCard() {
  return (
    <div className="rounded border border-gold bg-ink-soft p-6 text-paper">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 w-fit rounded border border-gold bg-gold/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
            Founder&apos;s License · Only 50 available
          </div>
          <h2 className="text-[28px] leading-tight text-paper">
            $99 once · lifetime access
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            5,000 renders/month forever, all Pro features included, and public
            launch pricing locked in.
          </p>
        </div>
        <PaddleCheckout plan="lifetime" className="w-full md:w-auto">
          Get Lifetime Access
        </PaddleCheckout>
      </div>
    </div>
  );
}

function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="rounded border border-line-dim bg-ink-soft">
      {FAQS.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="border-b border-line-dim last:border-b-0">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-body text-base font-semibold normal-case tracking-normal text-paper"
            >
              {item.question}
              <span
                className={cn(
                  "shrink-0 font-mono text-lg text-cinnabar transition-transform",
                  isOpen && "rotate-45"
                )}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: isOpen ? "180px" : "0px" }}
            >
              <p className="px-5 pb-5 text-sm leading-7 text-muted">
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
