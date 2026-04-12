"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { tierLabel, statusLabel } from "@/lib/payments";
import CheckoutButton from "@/components/CheckoutButton";
import MagneticButton from "@/components/MagneticButton";
import VipBadge from "@/components/VipBadge";

export default function BillingPage() {
  const { data, isLoading, isVip, tier, manageSubscription, refresh } = useSubscription();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-celestial-gold" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-warm-ivory mb-8">
            Billing & Subscription
          </h1>

          {/* Current Plan */}
          <div className="glass-card p-6 mb-6" style={isVip ? { border: "1px solid rgba(212,175,55,0.3)" } : {}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory">
                Current Plan
              </h2>
              <VipBadge showFree />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-lavender">Tier</span>
                <span className="text-warm-ivory">{tierLabel(tier)}</span>
              </div>
              {data && data.status !== "none" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-lavender">Status</span>
                    <span className={data.status === "active" || data.status === "trialing" ? "text-cosmic-teal" : "text-red-400"}>
                      {statusLabel(data.status)}
                    </span>
                  </div>
                  {data.period_end && (
                    <div className="flex justify-between">
                      <span className="text-muted-lavender">
                        {data.cancel_at_period_end ? "Access until" : "Next billing"}
                      </span>
                      <span className="text-warm-ivory">
                        {new Date(data.period_end).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {data.cancel_at_period_end && (
                    <p className="text-red-400/80 text-xs mt-2">
                      Your subscription will end at the end of the current period.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-6">
              {isVip ? (
                <MagneticButton
                  variant="glass"
                  size="md"
                  className="w-full justify-center"
                  onClick={manageSubscription}
                >
                  Manage Subscription
                </MagneticButton>
              ) : (
                <CheckoutButton priceKey="vip_monthly" variant="gold" size="md" className="w-full justify-center">
                  Upgrade to VIP &mdash; $6.50/mo
                </CheckoutButton>
              )}
            </div>
          </div>

          {/* Purchase History */}
          {data && data.purchases.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory mb-4">
                Reading Purchases
              </h2>
              <div className="space-y-3">
                {data.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-warm-ivory text-sm capitalize">
                        {purchase.reading_type.replace(/_/g, " ")}
                      </p>
                      {purchase.created_at && (
                        <p className="text-muted-lavender/60 text-xs">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {purchase.has_content ? (
                      <span className="text-cosmic-teal text-xs">&#10003; Ready</span>
                    ) : (
                      <span className="text-muted-lavender/40 text-xs">Processing...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8 text-center">
            <MagneticButton href="/profile" variant="glass" size="sm">
              Back to Profile
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
