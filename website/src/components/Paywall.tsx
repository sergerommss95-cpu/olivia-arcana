"use client";

import { useSubscription } from "@/hooks/useSubscription";
import CheckoutButton from "@/components/CheckoutButton";
import { type PriceKey, PRICING } from "@/lib/payments";

interface PaywallProps {
  /** Content shown to paid users. */
  children: React.ReactNode;
  /** What free users see as a teaser (optional). If omitted, shows a blurred overlay. */
  teaser?: React.ReactNode;
  /** Which product unlocks this content. Defaults to "premium_monthly". */
  priceKey?: PriceKey;
  /** Feature name shown in the upgrade CTA. */
  featureName?: string;
  /** Minimum tier required. Defaults to "premium". */
  requires?: "insight" | "premium" | "vip";
}

export default function Paywall({
  children,
  teaser,
  priceKey = "premium_monthly",
  featureName = "this feature",
  requires = "premium",
}: PaywallProps) {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-32 bg-white/5 rounded" />
      </div>
    );
  }

  const tierRank: Record<string, number> = { free: 0, insight: 1, premium: 2, vip: 3 };
  const hasAccess = tierRank[tier] >= tierRank[requires];
  if (hasAccess) return <>{children}</>;

  const upsellTier = requires === "insight" ? "Insight" : requires === "vip" ? "VIP" : "Premium";
  const upsellPrice = PRICING[requires].monthly;
  const isAddon = !priceKey.endsWith("_monthly") && !priceKey.endsWith("_annual");

  return (
    <div className="relative">
      {teaser ? (
        <div>{teaser}</div>
      ) : (
        <div className="relative overflow-hidden rounded-xl">
          <div className="blur-md pointer-events-none select-none opacity-50" aria-hidden="true">
            {children}
          </div>
        </div>
      )}

      <div className="mt-6 glass-card p-6 text-center">
        <div className="text-2xl mb-2">&#10022;</div>
        <h3 className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory mb-2">
          Unlock {featureName}
        </h3>
        <p className="text-muted-lavender text-sm mb-5 max-w-sm mx-auto">
          {upsellTier} members get unlimited access to chart readings, transit alerts, and personalized insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CheckoutButton priceKey={`${requires}_monthly` as PriceKey} variant="gold" size="md">
            Start {upsellTier} &mdash; ${upsellPrice}/mo
          </CheckoutButton>
          {isAddon && (
            <CheckoutButton priceKey={priceKey} variant="glass" size="md">
              Buy this reading
            </CheckoutButton>
          )}
        </div>
        <p className="text-muted-lavender/50 text-xs mt-3">14-day refund · cancel any time</p>
      </div>
    </div>
  );
}
