"use client";

import { useState, type ReactNode } from "react";
import {
  getPaddleInstance,
  PADDLE_PRICE_IDS,
  type CheckoutPlanId,
} from "@/lib/paddle";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

interface PaddleCheckoutProps {
  plan: CheckoutPlanId;
  email?: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "paper";
  className?: string;
}

export function PaddleCheckout({
  plan,
  email,
  children,
  variant = "primary",
  className,
}: PaddleCheckoutProps) {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    if (!user?.id) {
      setError("Please sign in before starting checkout.");
      return;
    }

    const priceId = PADDLE_PRICE_IDS[plan];
    if (!priceId) {
      setError("This plan is not configured for checkout yet.");
      return;
    }

    setLoading(true);
    try {
      const paddle = await getPaddleInstance();
      if (!paddle) {
        setError("Checkout is unavailable. Please try again shortly.");
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: email ? { email } : undefined,
        customData: { user_id: user.id },
      });
    } catch {
      setError("Could not open checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={loading || userLoading}
        variant={variant}
        className={className}
      >
        {loading ? "Opening checkout…" : children}
      </Button>
      {error && (
        <p className="mt-2 font-mono text-xs text-cinnabar" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
