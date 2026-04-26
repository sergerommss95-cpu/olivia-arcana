"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import { tierLabel, statusLabel } from "@/lib/payments";
import { getSession } from "@/lib/supabase";
import CheckoutButton from "@/components/CheckoutButton";
import MagneticButton from "@/components/MagneticButton";
import VipBadge from "@/components/VipBadge";

export default function BillingPage() {
  const { data, isLoading, isVip, tier, manageSubscription, refresh } = useSubscription();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setSignedIn(!!session);
      setAuthChecked(true);
    })();
    refresh();
  }, [refresh]);

  if (isLoading || !authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-celestial-gold" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </main>
    );
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-20">
        <div style={{ maxWidth: "440px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", color: "rgba(232,201,106,0.55)", marginBottom: "1rem" }}>✦</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 400, color: "rgba(245,240,232,0.96)", margin: 0 }}>
            Manage your billing
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", fontWeight: 300, color: "rgba(220,212,240,0.72)", marginTop: "1rem", lineHeight: 1.6 }}>
            Sign in to see your plan, change tier, or download invoices. Your subscription lives with your Google account.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.75rem", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              display: "inline-block", padding: "0.75rem 1.75rem", borderRadius: "100px",
              background: "linear-gradient(135deg, #E8C96A, #D4AF37)",
              color: "#06041a", fontSize: "0.78rem", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            }}>Sign in</Link>
            <Link href="/#pricing" style={{
              display: "inline-block", padding: "0.75rem 1.75rem", borderRadius: "100px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,185,255,0.12)",
              color: "rgba(220,210,240,0.85)", fontSize: "0.78rem", fontWeight: 500,
              letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
            }}>See pricing</Link>
          </div>
          <Link href="/" style={{
            display: "inline-block", marginTop: "1.5rem",
            fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "rgba(180,170,210,0.5)",
            textDecoration: "none", letterSpacing: "0.16em", textTransform: "uppercase",
          }}>← Back home</Link>
        </div>
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
                <CheckoutButton priceKey="premium_monthly" variant="gold" size="md" className="w-full justify-center">
                  Upgrade to Premium &mdash; $14.99/mo
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
