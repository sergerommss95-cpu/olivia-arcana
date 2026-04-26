"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ScrollFloat from "@/components/ScrollFloat";
import CheckoutButton from "@/components/CheckoutButton";
import MagneticButton from "@/components/MagneticButton";
import { useSubscription } from "@/hooks/useSubscription";
import VipBadge from "@/components/VipBadge";
import { useLocale } from "../lib/i18n/useLocale";
import { PRICING, ADDONS, type PriceKey, type Tier, telegramStarsLink } from "@/lib/payments";

type BillingPeriod = "monthly" | "annual";

interface TierDef {
  id: Tier;
  name: string;
  tagline: string;
  monthlyKey: PriceKey | null;
  annualKey: PriceKey | null;
  features: string[];
  highlight?: boolean;
}

const TIERS: TierDef[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Begin the journey",
    monthlyKey: null,
    annualKey: null,
    features: [
      "Daily Card of the Day (veil reveal)",
      "Basic sun-sign profile",
      "Academy — first 12 lessons",
      "3 AI oracle questions / month",
      "Live cosmic weather (current sky)",
    ],
  },
  {
    id: "insight",
    name: "Insight",
    tagline: "Daily companionship",
    monthlyKey: "insight_monthly",
    annualKey: "insight_annual",
    features: [
      "Everything in Free",
      "Personalized daily horoscope from your chart",
      "Full natal chart breakdown (Sun/Moon/Rising + houses)",
      "30 AI oracle questions / month",
      "Transit alerts for major aspects",
      "Tarot encyclopedia (full 78-card)",
      "Cosmic journal with moon-phase prompts",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "The full chart, the full story",
    monthlyKey: "premium_monthly",
    annualKey: "premium_annual",
    highlight: true,
    features: [
      "Everything in Insight",
      "Unlimited AI oracle (Claude Haiku-powered)",
      "Synastry / compatibility reports (unlimited)",
      "Year-ahead forecast & solar return",
      "Full Academy — all 207 lessons + quizzes",
      "Celtic Cross & advanced tarot spreads",
      "Weekly transit briefing (audio + text)",
      "Priority access to new features",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    tagline: "A real astrologer in your pocket",
    monthlyKey: "vip_monthly",
    annualKey: "vip_annual",
    features: [
      "Everything in Premium",
      "Unlimited AI oracle on Claude Sonnet (deeper synthesis)",
      "Voice readings — ElevenLabs narration of your chart",
      "Live planetary hour notifications",
      "Custom video reading (30-min, monthly)",
      "Direct line: priority email to a human astrologer",
      "Early access to new decks & rituals",
      "VIP-only constellation events & livestreams",
    ],
  },
];

type AddonKey = keyof typeof ADDONS;
const ADDON_KEYS: AddonKey[] = [
  "addon_birth_chart",
  "addon_compatibility",
  "addon_celtic_cross",
  "addon_year_ahead",
  "addon_solar_return",
  "addon_video_reading",
];

function fmtPrice(n: number): string {
  return n === Math.floor(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

export default function Pricing() {
  const { t } = useLocale();
  const { isVip, manageSubscription, tier: currentTier } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");

  return (
    <section id="pricing" className="relative py-16 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-16">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("price_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            Choose your orbit
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>

          {/* Billing toggle */}
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
                Save up to 35%
              </span>
            </button>
          </div>
        </div>

        {/* 4-tier grid */}
        <div className="grid gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, idx) => {
            const price = PRICING[tier.id][billingPeriod];
            const monthlyEquivalent = billingPeriod === "annual" && price > 0
              ? (price / 12).toFixed(2)
              : null;
            const isCurrent = currentTier === tier.id;
            const priceKey = billingPeriod === "monthly" ? tier.monthlyKey : tier.annualKey;

            return (
              <ScrollFloat key={tier.id} index={idx} intensity="subtle">
                <motion.div
                  whileHover={{ 
                    y: -8, 
                    rotateY: idx % 2 === 0 ? 1.5 : -1.5, 
                    rotateX: 1,
                    z: 20 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative h-full"
                  style={{ perspective: "1200px" }}
                >
                  <div
                    className="relative glass-card p-5 md:p-6 h-full flex flex-col"
                    style={{
                      border: tier.highlight
                        ? "1px solid rgba(212, 175, 55, 0.5)"
                        : "1px solid rgba(200,185,255,0.10)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-celestial-gold text-void-black text-[10px] tracking-[0.18em] uppercase font-semibold whitespace-nowrap">
                      ✦ Most chosen
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-celestial-gold">
                        {tier.name}
                      </h3>
                      {tier.id === "vip" && isVip && <VipBadge />}
                    </div>
                    <p className="text-muted-lavender text-xs leading-relaxed">{tier.tagline}</p>
                  </div>

                  <div className="mb-5">
                    {price === 0 ? (
                      <>
                        <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-warm-ivory">$0</span>
                        <span className="text-muted-lavender text-sm ml-2">forever</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold">
                          {fmtPrice(price)}
                        </span>
                        <span className="text-muted-lavender text-sm ml-2">
                          / {billingPeriod === "annual" ? "year" : "month"}
                        </span>
                        {monthlyEquivalent && (
                          <p className="text-xs text-cosmic-teal/90 mt-1">
                            ${monthlyEquivalent} / month · billed annually
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[0.82rem] text-warm-ivory/90 leading-snug">
                        <span className="text-celestial-gold mt-0.5 shrink-0">&#10022;</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {tier.id === "free" ? (
                    <MagneticButton href="/onboarding" variant="glass" size="md" className="w-full justify-center">
                      Start free
                    </MagneticButton>
                  ) : isCurrent ? (
                    <MagneticButton variant="gold" size="md" className="w-full justify-center" onClick={manageSubscription}>
                      Manage plan
                    </MagneticButton>
                  ) : priceKey ? (
                    <>
                      <CheckoutButton
                        priceKey={priceKey}
                        variant={tier.highlight ? "gold" : "glass"}
                        size="md"
                        className="w-full justify-center"
                      >
                        Choose {tier.name}
                      </CheckoutButton>
                      <a
                        href={telegramStarsLink(priceKey)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center mt-2 text-[0.7rem] text-muted-lavender/70 hover:text-celestial-gold transition-colors"
                      >
                        or pay with Telegram Stars ↗
                      </a>
                    </>
                  ) : null}
                </div>
              </motion.div>
            </ScrollFloat>
          );
        })}
        </div>

        {/* Refund note */}
        <p className="text-center text-xs text-muted-lavender/70 mt-8">
          14-day refund · cancel any time · pricing in USD · billed via Paddle (your local currency, taxes included)
        </p>

        {/* Full feature matrix */}
        <FeatureMatrix />

        {/* Addons */}
        <Addons />
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Feature comparison matrix — 4 tiers, full breakdown
 * ─────────────────────────────────────────────────────────────────── */

interface MatrixRow {
  category?: string;
  feature: string;
  free: string | boolean;
  insight: string | boolean;
  premium: string | boolean;
  vip: string | boolean;
}

const MATRIX: MatrixRow[] = [
  // — Daily ritual
  { category: "Daily ritual", feature: "Card of the Day (veil reveal)", free: true, insight: true, premium: true, vip: true },
  { feature: "Personalized daily horoscope", free: false, insight: true, premium: true, vip: true },
  { feature: "Live planetary hour notifications", free: false, insight: false, premium: false, vip: true },
  { feature: "Weekly audio briefing", free: false, insight: false, premium: true, vip: true },

  // — Charts
  { category: "Your chart", feature: "Basic sun-sign profile", free: true, insight: true, premium: true, vip: true },
  { feature: "Full natal chart (Sun/Moon/Rising + houses)", free: false, insight: true, premium: true, vip: true },
  { feature: "Synastry / compatibility reports", free: false, insight: "1 / month", premium: "Unlimited", vip: "Unlimited" },
  { feature: "Solar return reading", free: false, insight: false, premium: true, vip: true },
  { feature: "Year-ahead forecast", free: false, insight: false, premium: true, vip: true },

  // — Oracle (AI)
  { category: "Olivia AI oracle", feature: "AI oracle questions", free: "3 / mo", insight: "30 / mo", premium: "Unlimited", vip: "Unlimited" },
  { feature: "Model used", free: "Haiku", insight: "Haiku", premium: "Haiku (deep)", vip: "Sonnet" },
  { feature: "Voice readings (ElevenLabs)", free: false, insight: false, premium: false, vip: true },

  // — Academy
  { category: "Academy", feature: "First-track lessons", free: "12 lessons", insight: true, premium: true, vip: true },
  { feature: "Full 207-lesson curriculum", free: false, insight: false, premium: true, vip: true },
  { feature: "Tarot encyclopedia (78 cards)", free: false, insight: true, premium: true, vip: true },
  { feature: "Quizzes + progress tracking", free: false, insight: true, premium: true, vip: true },

  // — Tarot
  { category: "Tarot", feature: "Single-card draws", free: true, insight: true, premium: true, vip: true },
  { feature: "Three-card spread", free: false, insight: true, premium: true, vip: true },
  { feature: "Celtic Cross (10-card)", free: false, insight: false, premium: true, vip: true },

  // — Transits
  { category: "Transits", feature: "Major-aspect alerts", free: false, insight: true, premium: true, vip: true },
  { feature: "Custom transit timeline", free: false, insight: false, premium: true, vip: true },

  // — Human touch
  { category: "Human touch", feature: "Custom video reading (monthly)", free: false, insight: false, premium: false, vip: "30 min" },
  { feature: "Priority human astrologer line", free: false, insight: false, premium: false, vip: true },

  // — Other
  { category: "Other", feature: "Cosmic journal", free: false, insight: true, premium: true, vip: true },
  { feature: "Early access to new features", free: false, insight: false, premium: true, vip: true },
  { feature: "VIP-only events & livestreams", free: false, insight: false, premium: false, vip: true },
];

function Cell({ value, gold = false }: { value: string | boolean; gold?: boolean }) {
  if (typeof value === "string") {
    return <span className={`compare-text ${gold ? "compare-text-vip" : "compare-text-muted"}`}>{value}</span>;
  }
  if (value) return <span className={`compare-yes ${gold ? "compare-yes-gold" : ""}`} aria-label="Included">✓</span>;
  return <span className="compare-no" aria-label="Not included">—</span>;
}

function FeatureMatrix() {
  return (
    <div className="mt-20 sm:mt-24">
      <p className="text-center text-xs tracking-[0.28em] uppercase text-celestial-gold/75 mb-6">
        <span aria-hidden className="mr-2">✦</span>
        Full feature matrix
      </p>

      <div
        className="glass-card overflow-x-auto"
        style={{ border: "1px solid var(--c-border, rgba(200,185,255,0.10))" }}
      >
        <div className="matrix" role="table" aria-label="Plan feature comparison">
          {/* Header */}
          <div className="matrix-row matrix-head" role="row">
            <div className="matrix-cell matrix-cell-feature" role="columnheader">Feature</div>
            <div className="matrix-cell matrix-cell-center" role="columnheader">Free</div>
            <div className="matrix-cell matrix-cell-center" role="columnheader">Ins.</div>
            <div className="matrix-cell matrix-cell-center matrix-cell-vip" role="columnheader">
              <span className="text-celestial-gold font-[family-name:var(--font-heading)] italic">Pre.</span>
            </div>
            <div className="matrix-cell matrix-cell-center" role="columnheader">VIP</div>
          </div>

          {MATRIX.map((row, i) => (
            <div key={i} style={{ display: "contents" }}>
              {row.category && (
                <div className="matrix-row matrix-category" role="row">
                  <div className="matrix-cell" role="cell" style={{ gridColumn: "1 / -1" }}>
                    {row.category}
                  </div>
                </div>
              )}
              <div className="matrix-row" role="row">
                <div className="matrix-cell matrix-cell-feature" role="cell">{row.feature}</div>
                <div className="matrix-cell matrix-cell-center" role="cell"><Cell value={row.free} /></div>
                <div className="matrix-cell matrix-cell-center" role="cell"><Cell value={row.insight} /></div>
                <div className="matrix-cell matrix-cell-center matrix-cell-vip" role="cell"><Cell value={row.premium} gold /></div>
                <div className="matrix-cell matrix-cell-center" role="cell"><Cell value={row.vip} gold /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .matrix {
          width: 100%;
          font-family: var(--font-body, system-ui), sans-serif;
        }
        .matrix-row {
          display: grid;
          grid-template-columns: 2.2fr repeat(4, 1fr);
          align-items: center;
          border-bottom: 1px solid var(--c-border, rgba(200,185,255,0.10));
        }
        .matrix-row:last-of-type { border-bottom: none; }
        .matrix-head {
          background: rgba(255,255,255,0.02);
        }
        .matrix-head .matrix-cell {
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(196,185,228,0.75);
          padding: 1rem 0.75rem;
        }
        .matrix-category .matrix-cell {
          padding: 1.1rem 1rem 0.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          color: rgba(232, 201, 106, 0.85);
        }
        .matrix-cell {
          padding: 0.85rem 0.75rem;
          font-size: 0.78rem;
          line-height: 1.35;
          color: var(--c-text-mid, rgba(196,185,228,0.85));
        }
        .matrix-cell-feature {
          color: var(--c-text-primary, rgba(240,236,255,0.95));
        }
        .matrix-cell-center { text-align: center; }
        .matrix-cell-vip { background: rgba(212, 175, 55, 0.04); }

        .compare-yes {
          display: inline-block;
          font-size: 1rem;
          color: rgba(78, 205, 196, 0.9);
          font-weight: 600;
        }
        .compare-yes-gold {
          color: rgba(232, 201, 106, 0.95);
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.28);
        }
        .compare-no {
          color: var(--c-text-muted, rgba(190,180,225,0.42));
          opacity: 0.7;
        }
        .compare-text { font-size: 0.72rem; }
        .compare-text-muted { color: var(--c-text-muted, rgba(190,180,225,0.78)); }
        .compare-text-vip {
          color: rgba(232, 201, 106, 0.95);
          font-family: var(--font-heading, 'Cormorant Garamond'), serif;
          font-style: italic;
        }
        @media (max-width: 640px) {
          .matrix-head .matrix-cell { font-size: 0.55rem; padding: 0.8rem 0.4rem; }
          .matrix-cell { font-size: 0.7rem; padding: 0.7rem 0.4rem; }
          .matrix-cell-feature { font-size: 0.68rem; }
        }
        @media (max-width: 720px) {
          .matrix-cell, .matrix-head .matrix-cell { padding: 0.7rem 0.7rem; font-size: 0.78rem; }
          .matrix-head .matrix-cell { font-size: 0.6rem; }
          .matrix-category .matrix-cell { font-size: 0.72rem; }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * À-la-carte addons — buy without subscribing
 * ─────────────────────────────────────────────────────────────────── */
function Addons() {
  return (
    <div className="mt-16 sm:mt-20">
      <p className="text-center text-xs tracking-[0.28em] uppercase text-celestial-gold/75 mb-3">
        <span aria-hidden className="mr-2">✦</span>
        One-time readings
      </p>
      <p className="text-center text-muted-lavender/80 text-sm mb-8 max-w-xl mx-auto">
        No subscription? Buy individual readings as you need them. Each is yours forever once purchased.
      </p>
      <div className="addons-grid">
        {ADDON_KEYS.map((key) => {
          const addon = ADDONS[key];
          return (
            <div
              key={key}
              className="glass-card p-5 flex flex-col gap-3 addon-card"
              style={{ border: "1px solid rgba(200,185,255,0.10)" }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-[family-name:var(--font-heading)] text-lg text-warm-ivory">
                  {addon.name}
                </h4>
                <span className="text-celestial-gold font-semibold whitespace-nowrap">
                  {fmtPrice(addon.price)}
                </span>
              </div>
              <CheckoutButton priceKey={key} variant="glass" size="sm" className="w-full justify-center">
                Buy reading
              </CheckoutButton>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .addons-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .addons-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .addons-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 540px) {
          .addons-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding: 0 1.5rem 1.5rem;
            margin: 0 -1.5rem;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .addons-grid::-webkit-scrollbar { display: none; }
          .addon-card {
            flex: 0 0 85%;
            scroll-snap-align: center;
          }
        }
      `}</style>
    </div>
  );
}
