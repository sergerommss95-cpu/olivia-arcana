"use client";

import { useSubscription } from "@/hooks/useSubscription";
import CheckoutButton from "@/components/CheckoutButton";
import type { PriceKey } from "@/lib/payments";

interface PaywallProps {
  /** Content shown to VIP users. */
  children: React.ReactNode;
  /** What free users see as a teaser (optional). If omitted, shows a blurred overlay. */
  teaser?: React.ReactNode;
  /** Which product unlocks this content. Defaults to "vip_monthly". */
  priceKey?: PriceKey;
  /** Feature name shown in the upgrade CTA. */
  featureName?: string;
}

export default function Paywall({
  children,
  teaser,
  priceKey = "vip_monthly",
  featureName = "this feature",
}: PaywallProps) {
  const { isVip, isLoading } = useSubscription();

  // Loading state — show skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-32 bg-white/5 rounded" />
      </div>
    );
  }

  // VIP users see the full content
  if (isVip) {
    return <>{children}</>;
  }

  // Free users see teaser or blurred content + upgrade CTA
  return (
    <div className="relative">
      {teaser ? (
        <div>{teaser}</div>
      ) : (
        <div className="relative overflow-hidden rounded-xl">
          {/* Blurred preview of the actual content */}
          <div className="blur-md pointer-events-none select-none opacity-50" aria-hidden="true">
            {children}
          </div>
        </div>
      )}

      {/* Upgrade overlay */}
      <div className="mt-6 glass-card p-6 text-center">
        <div className="text-2xl mb-2">&#10022;</div>
        <h3 className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory mb-2">
          Unlock {featureName}
        </h3>
        <p className="text-muted-lavender text-sm mb-5 max-w-sm mx-auto">
          VIP members get unlimited access to all premium readings, transit alerts, and personalized insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CheckoutButton priceKey={priceKey} variant="gold" size="md">
            Start VIP &mdash; $6.50/mo
          </CheckoutButton>
          {priceKey !== "vip_monthly" && priceKey !== "vip_annual" && (
            <CheckoutButton priceKey={priceKey} variant="glass" size="md">
              Buy This Reading
            </CheckoutButton>
          )}
        </div>
        <p className="text-muted-lavender/50 text-xs mt-3">3-day free trial included</p>
      </div>
    </div>
  );
}
