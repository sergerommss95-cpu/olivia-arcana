"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import type { PriceKey } from "@/lib/payments";
import MagneticButton from "@/components/MagneticButton";

interface CheckoutButtonProps {
  priceKey: PriceKey;
  variant?: "gold" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export default function CheckoutButton({
  priceKey,
  variant = "gold",
  size = "md",
  className = "",
  children,
}: CheckoutButtonProps) {
  const { subscribe, isVip, manageSubscription, error } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("olivia_token");
    if (!token) {
      // Redirect to onboarding/login first
      window.location.href = `/onboarding/?redirect=checkout&price=${priceKey}`;
      return;
    }

    setLoading(true);
    try {
      await subscribe(priceKey);
    } finally {
      setLoading(false);
    }
  };

  // If already VIP and this is a subscription product, show manage button
  if (isVip && (priceKey === "vip_monthly" || priceKey === "vip_annual")) {
    return (
      <MagneticButton
        variant={variant}
        size={size}
        className={className}
        onClick={() => manageSubscription()}
      >
        Manage Subscription
      </MagneticButton>
    );
  }

  return (
    <>
      <MagneticButton
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </MagneticButton>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </>
  );
}
