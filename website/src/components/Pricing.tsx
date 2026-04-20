"use client";

import { useState } from "react";
import ScrollFloat from "@/components/ScrollFloat";
import CheckoutButton from "@/components/CheckoutButton";
import MagneticButton from "@/components/MagneticButton";
import { useSubscription } from "@/hooks/useSubscription";
import VipBadge from "@/components/VipBadge";
import { useLocale } from "../lib/i18n/useLocale";
import type { PriceKey } from "@/lib/payments";

export default function Pricing() {
  const { t } = useLocale();
  const { isVip, manageSubscription } = useSubscription();
  // Annual-first — most subscribers end up here anyway and it anchors perceived value
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");

  const aLaCarteItems: { name: string; price: string; priceKey: PriceKey }[] = [
    { name: t("price_i1"), price: "$3.90", priceKey: "birth_chart" },
    { name: t("price_i2"), price: "$3.90", priceKey: "compatibility" },
    { name: t("price_i3"), price: "$1.95", priceKey: "celtic_cross" },
    { name: t("price_i4"), price: "$6.50", priceKey: "year_ahead" },
    { name: t("price_i5"), price: "$39.99", priceKey: "video_reading" },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-32 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("price_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("price_title")}
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>

          {/* Billing period toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`text-sm px-4 py-1.5 rounded-full transition-all ${
                billingPeriod === "monthly"
                  ? "bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30"
                  : "text-muted-lavender hover:text-warm-ivory"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30"
                  : "text-muted-lavender hover:text-warm-ivory"
              }`}
            >
              Annual
              <span className="text-xs bg-cosmic-teal/20 text-cosmic-teal px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* VIP-first, larger on the left. On mobile both cards stack normally */}
        <div
          className="grid gap-8 max-w-4xl mx-auto md:grid-cols-[1.15fr_0.85fr]"
        >
          {/* VIP Tier — the highlight */}
          <ScrollFloat index={0} intensity="subtle">
          <div
            className="relative glass-card p-4 md:p-8 animate-pulse-glow"
            style={{ border: "1px solid rgba(212, 175, 55, 0.45)" }}
          >
            {/* Most-chosen chip */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-celestial-gold text-void-black text-xs font-semibold">
              ✦ Most chosen
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-celestial-gold">
                  {t("price_vip")}
                </h3>
                {isVip && <VipBadge />}
              </div>
              <p className="text-muted-lavender text-sm">{t("price_vip_desc")}</p>
            </div>

            <div className="mb-8">
              {billingPeriod === "annual" ? (
                <>
                  <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold">$65</span>
                  <span className="text-muted-lavender text-sm ml-2">/ year</span>
                  <p className="text-xs text-muted-lavender/80 mt-1">
                    <span className="text-cosmic-teal">$5.42 per month</span>{" "}
                    <span aria-hidden>·</span> billed annually <span aria-hidden>·</span>{" "}
                    2 months free
                  </p>
                </>
              ) : (
                <>
                  <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold">$6.50</span>
                  <span className="text-muted-lavender text-sm ml-2">{t("price_month")}</span>
                  <p className="text-xs text-muted-lavender/80 mt-1">
                    Billed monthly <span aria-hidden>·</span> switch to annual any time to save 17%
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {[
                t("price_vip_f1"),
                t("price_vip_f2"),
                t("price_vip_f3"),
                t("price_vip_f4"),
                t("price_vip_f5"),
                t("price_vip_f6"),
                t("price_vip_f7"),
                t("price_vip_f8"),
                t("price_vip_f9"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-warm-ivory">
                  <span className="text-celestial-gold mt-0.5">&#10022;</span>
                  {item}
                </li>
              ))}
            </ul>

            {isVip ? (
              <MagneticButton
                variant="gold"
                size="md"
                className="w-full justify-center"
                onClick={manageSubscription}
              >
                Manage Subscription
              </MagneticButton>
            ) : (
              <CheckoutButton
                priceKey={billingPeriod === "monthly" ? "vip_monthly" : "vip_annual"}
                variant="gold"
                size="md"
                className="w-full justify-center"
              >
                {t("price_start_vip")}
              </CheckoutButton>
            )}

            {/* Refund + cancellation microcopy under the gold CTA */}
            <p className="text-center text-xs text-muted-lavender/80 mt-3">
              14-day refund <span aria-hidden>·</span> cancel any time <span aria-hidden>·</span> no questions.
            </p>
          </div>
          </ScrollFloat>

          {/* Free Tier — secondary */}
          <ScrollFloat index={1} intensity="subtle">
          <div className="glass-card p-4 md:p-8">
            <div className="mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-warm-ivory mb-2">
                {t("price_free")}
              </h3>
              <p className="text-muted-lavender text-sm">{t("price_free_desc")}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-warm-ivory">$0</span>
              <span className="text-muted-lavender text-sm ml-2">{t("price_forever")}</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                t("price_free_f1"),
                t("price_free_f2"),
                t("price_free_f3"),
                t("price_free_f4"),
                t("price_free_f5"),
                t("price_free_f6"),
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-lavender">
                  <span className="text-cosmic-teal mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <MagneticButton href="/onboarding" variant="glass" size="md" className="w-full justify-center">
              {t("price_start_free")}
            </MagneticButton>
          </div>
          </ScrollFloat>
        </div>

        {/* Side-by-side feature comparison */}
        <ComparisonTable />

        {/* One-time purchases */}
        <div className="mt-16 text-center">
          <p className="text-muted-lavender text-sm mb-6">
            {t("price_individual")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {aLaCarteItems.map((item) => (
              <button
                key={item.name}
                onClick={async () => {
                  const token = typeof window !== "undefined" ? localStorage.getItem("olivia_token") : null;
                  if (!token) {
                    window.location.href = `/onboarding/?redirect=checkout&price=${item.priceKey}`;
                    return;
                  }
                  const { createCheckoutSession } = await import("@/lib/payments");
                  const url = await createCheckoutSession(item.priceKey);
                  window.location.href = url;
                }}
                className="px-4 py-2 rounded-full glass-card text-sm text-muted-lavender hover:text-warm-ivory hover:border-celestial-gold/30 transition-all cursor-pointer group"
              >
                {item.name}{" "}
                <span className="text-celestial-gold group-hover:underline">{item.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 *  ComparisonTable
 *
 *  3-col grid: feature / free / VIP. Checks + dashes render as gold-soft
 *  (yes) or muted-lavender (no). On <sm we collapse to two columns
 *  (feature + VIP only — free is implied to be the lesser) so the table
 *  stays readable on phones.
 *
 *  TODO: swap ROWS verbatim from the prototype's
 *  <section id="pricing"> .compare-row — this is placeholder copy, but the
 *  row data is the only thing to change.
 * ─────────────────────────────────────────────────────────────────── */
const COMPARE_ROWS: { feature: string; free: boolean | string; vip: boolean | string }[] = [
  { feature: "Daily Card of the Day (veil reveal)", free: true, vip: true },
  { feature: "Basic sun-sign profile", free: true, vip: true },
  { feature: "Academy — first lessons", free: true, vip: true },
  { feature: "Full natal chart reading", free: false, vip: true },
  { feature: "Unlimited AI oracle conversations", free: "3 / month", vip: "Unlimited" },
  { feature: "Transit alerts tuned to your chart", free: false, vip: true },
  { feature: "Synastry / compatibility reports", free: false, vip: true },
  { feature: "Full academy — all 207 lessons", free: false, vip: true },
  { feature: "Moon-phase journal prompts", free: false, vip: true },
  { feature: "Priority access to new features", free: false, vip: true },
];

function ComparisonTable() {
  return (
    <div className="mt-16 sm:mt-20">
      <p className="text-center text-xs tracking-[0.28em] uppercase text-celestial-gold/75 mb-6">
        <span aria-hidden className="mr-2">✦</span>
        Compared side by side
      </p>

      <div
        className="glass-card overflow-hidden"
        style={{ border: "1px solid var(--c-border, rgba(200,185,255,0.10))" }}
      >
        {/* Header row */}
        <div className="compare-row compare-head" role="row">
          <div className="compare-cell compare-cell-feature" role="columnheader">
            Feature
          </div>
          <div className="compare-cell compare-cell-center compare-cell-free" role="columnheader">
            Free
          </div>
          <div className="compare-cell compare-cell-center compare-cell-vip" role="columnheader">
            <span className="text-celestial-gold font-[family-name:var(--font-heading)] italic">
              VIP
            </span>
          </div>
        </div>

        {/* Body rows */}
        {COMPARE_ROWS.map((row, i) => (
          <div key={i} className="compare-row" role="row">
            <div className="compare-cell compare-cell-feature" role="cell">
              {row.feature}
            </div>
            <div className="compare-cell compare-cell-center compare-cell-free" role="cell">
              {typeof row.free === "string" ? (
                <span className="compare-text-muted">{row.free}</span>
              ) : row.free ? (
                <span className="compare-yes" aria-label="Included">✓</span>
              ) : (
                <span className="compare-no" aria-label="Not included">—</span>
              )}
            </div>
            <div className="compare-cell compare-cell-center compare-cell-vip" role="cell">
              {typeof row.vip === "string" ? (
                <span className="compare-text-vip">{row.vip}</span>
              ) : row.vip ? (
                <span className="compare-yes compare-yes-gold" aria-label="Included">✓</span>
              ) : (
                <span className="compare-no" aria-label="Not included">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .compare-row {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          border-bottom: 1px solid var(--c-border, rgba(200,185,255,0.10));
        }
        .compare-row:last-of-type {
          border-bottom: none;
        }
        .compare-head {
          background: rgba(255,255,255,0.02);
        }
        .compare-head .compare-cell {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(196,185,228,0.75);
          padding: 1rem 1.25rem;
        }
        .compare-cell {
          padding: 0.95rem 1.25rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.92rem;
          line-height: 1.5;
          color: var(--c-text-mid, rgba(196,185,228,0.85));
        }
        .compare-cell-feature {
          color: var(--c-text-primary, rgba(240,236,255,0.95));
        }
        .compare-cell-center {
          text-align: center;
        }
        .compare-cell-vip {
          background: rgba(212, 175, 55, 0.035);
        }
        .compare-yes {
          display: inline-block;
          font-size: 1.05rem;
          color: rgba(78, 205, 196, 0.9);
          font-weight: 600;
        }
        .compare-yes-gold {
          color: rgba(232, 201, 106, 0.95);
          text-shadow: 0 0 12px rgba(212, 175, 55, 0.28);
        }
        .compare-no {
          color: var(--c-text-muted, rgba(190,180,225,0.45));
          opacity: 0.7;
        }
        .compare-text-muted {
          font-size: 0.82rem;
          color: var(--c-text-muted, rgba(190,180,225,0.72));
        }
        .compare-text-vip {
          font-size: 0.88rem;
          color: rgba(232, 201, 106, 0.95);
          font-family: var(--font-heading, 'Cormorant Garamond'), serif;
          font-style: italic;
        }
        @media (max-width: 640px) {
          .compare-row {
            grid-template-columns: minmax(0, 1.5fr) minmax(0, 0.75fr) minmax(0, 0.75fr);
          }
          .compare-cell,
          .compare-head .compare-cell {
            padding: 0.75rem 0.75rem;
            font-size: 0.82rem;
          }
          .compare-head .compare-cell {
            font-size: 0.62rem;
          }
        }
      `}</style>
    </div>
  );
}
