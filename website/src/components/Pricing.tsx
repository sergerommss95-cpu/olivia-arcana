"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ScrollFloat from "@/components/ScrollFloat";
import CheckoutButton from "@/components/CheckoutButton";
import MagneticButton from "@/components/MagneticButton";
import { useSubscription } from "@/hooks/useSubscription";
import VipBadge from "@/components/VipBadge";
import { useLocale } from "../lib/i18n/useLocale";
import { TRANSLATIONS, type Translations } from "../lib/i18n/translations";
import { PRICING, ADDONS, type PriceKey, type Tier, telegramStarsLink } from "@/lib/payments";

type BillingPeriod = "monthly" | "annual";

interface TierDef {
  id: Tier;
  name: string;
  tagline: string;
  monthlyKey: PriceKey | null;
  annualKey: PriceKey | null;
  features: string; // Key to the string array
  highlight?: boolean;
}

const TIERS: TierDef[] = [
  {
    id: "free",
    name: "price_free",
    tagline: "price_free_desc",
    monthlyKey: null,
    annualKey: null,
    features: "price_f_free",
  },
  {
    id: "insight",
    name: "price_insight",
    tagline: "price_insight_desc",
    monthlyKey: "insight_monthly",
    annualKey: "insight_annual",
    features: "price_f_insight",
  },
  {
    id: "premium",
    name: "price_premium",
    tagline: "price_premium_desc",
    monthlyKey: "premium_monthly",
    annualKey: "premium_annual",
    highlight: true,
    features: "price_f_premium",
  },
  {
    id: "vip",
    name: "price_vip",
    tagline: "price_vip_desc",
    monthlyKey: "vip_monthly",
    annualKey: "vip_annual",
    features: "price_f_vip",
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
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const fromOracle = searchParams.get("from") === "oracle";
  const { isVip, manageSubscription, tier: currentTier } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");

  const getTierTagline = (id: Tier) => {
    if (id === "free") return t("price_free_desc");
    if (id === "insight") return t("price_insight_desc");
    if (id === "premium") return t("price_premium_desc");
    if (id === "vip") return t("price_vip_desc");
    return "";
  };

  return (
    <section id="pricing" className="relative py-16 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Readability Scrims — Deeper for a high-end sanctuary feel */}
      <div className="absolute inset-0 bg-void-black/60 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.08),transparent_50%)] pointer-events-none z-0" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-20">
          <AnimatePresence mode="wait">
            {fromOracle ? (
              <motion.div
                key="oracle-header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <p className="readable-label mb-4 tracking-[0.2em]">The Next Step</p>
                <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl lg:text-6xl font-normal text-warm-ivory italic leading-[1.1]">
                  Continue your Oracle reading
                </h2>
                <p className="mt-6 text-warm-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                  Free readings provide a starting point. Paid plans add the full context of your birth chart, 
                  compatibility, and deeper patterns.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="readable-label mb-4 tracking-[0.2em]">
                  {t("price_eyebrow")}
                </p>
                <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl lg:text-6xl font-normal text-warm-ivory mb-6 leading-[1.1]">
                  Choose your level of insight
                </h2>
                <p className="text-warm-ivory/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                  Start free. Step into deeper pattern recognition only when you seek fuller clarity
                  on your chart, transits, or compatibility.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="star-divider max-w-xs mx-auto text-celestial-gold opacity-40 my-8">&#10022;</div>

          {/* Billing toggle — More subtle, minimal */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`text-sm tracking-[0.15em] uppercase transition-all font-bold ${
                billingPeriod === "monthly"
                  ? "text-celestial-gold border-b border-celestial-gold"
                  : "text-warm-ivory/40 hover:text-warm-ivory/60"
              } pb-2`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`text-sm tracking-[0.15em] uppercase transition-all flex items-center gap-2 font-bold ${
                billingPeriod === "annual"
                  ? "text-celestial-gold border-b border-celestial-gold shadow-[0_4px_12px_-4px_rgba(212,175,55,0.4)]"
                  : "text-warm-ivory/40 hover:text-warm-ivory/60"
              } pb-2`}
            >
              Annual
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-celestial-gold/10 text-celestial-gold ml-1">
                -35%
              </span>
            </button>
          </div>
        </div>

        {/* 4-tier grid — Increased contrast and spacing */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, idx) => {
            const price = PRICING[tier.id][billingPeriod];
            const monthlyEquivalent = billingPeriod === "annual" && price > 0
              ? (price / 12).toFixed(2)
              : null;
            const isCurrent = currentTier === tier.id;
            const priceKey = billingPeriod === "monthly" ? tier.monthlyKey : tier.annualKey;
            
            const isHighlighted = tier.highlight || (fromOracle && tier.id === "premium");

            return (
              <ScrollFloat key={tier.id} index={idx} intensity="subtle">
                <motion.div
                  whileHover={{ 
                    y: -8, 
                    z: 20 
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative h-full"
                >
                  <div
                    className={`relative bg-void-black/80 backdrop-blur-xl border ${isHighlighted ? 'border-celestial-gold/40 ring-1 ring-celestial-gold/20' : 'border-white/10'} p-6 sm:p-8 h-full flex flex-col transition-all duration-700 rounded-3xl`}
                    style={{
                      boxShadow: isHighlighted ? "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(212, 175, 55, 0.05)" : "0 20px 40px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-celestial-gold text-void-black text-[9px] tracking-[0.2em] uppercase font-black whitespace-nowrap shadow-xl z-20">
                      Recommended
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-[family-name:var(--font-heading)] text-2xl font-normal text-warm-ivory italic">
                        {t(tier.name as keyof Translations)}
                      </h3>
                      {tier.id === "vip" && isVip && <VipBadge />}
                    </div>
                    <p className="text-[0.65rem] font-bold text-celestial-gold/60 uppercase tracking-[0.15em]">{getTierTagline(tier.id)}</p>
                  </div>

                  <div className="mb-8">
                    {price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-[family-name:var(--font-heading)] font-normal text-warm-ivory">$0</span>
                        <span className="text-warm-ivory/40 text-[0.65rem] uppercase tracking-widest font-bold ml-2">Free</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-[family-name:var(--font-heading)] font-normal text-warm-ivory">
                            {fmtPrice(price)}
                          </span>
                          <span className="text-warm-ivory/40 text-[0.65rem] uppercase tracking-widest font-bold ml-2">
                            / {billingPeriod === "annual" ? "yr" : "mo"}
                          </span>
                        </div>
                        {monthlyEquivalent && (
                          <p className="text-[0.65rem] text-cosmic-teal font-bold uppercase tracking-widest mt-2">
                            ${monthlyEquivalent} / month
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {((TRANSLATIONS[locale as keyof typeof TRANSLATIONS] || TRANSLATIONS.en)[tier.features as keyof Translations] as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-warm-ivory/90 leading-relaxed font-medium">
                        <span className="text-celestial-gold shrink-0 mt-1">✦</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA — Minimal, high-quality button */}
                  {tier.id === "free" ? (
                    <MagneticButton href="/onboarding" variant="glass" size="md" className="w-full justify-center shadow-lg border-white/10 rounded-2xl hover:bg-white/5">
                      {t("price_start_free")}
                    </MagneticButton>
                  ) : isCurrent ? (
                    <MagneticButton variant="gold" size="md" className="w-full justify-center shadow-lg rounded-2xl" onClick={manageSubscription}>
                      Manage plan
                    </MagneticButton>
                  ) : priceKey ? (
                    <div className="flex flex-col gap-4">
                      <CheckoutButton
                        priceKey={priceKey}
                        variant={isHighlighted ? "gold" : "glass"}
                        size="md"
                        className="w-full justify-center shadow-lg rounded-2xl"
                      >
                        {t(`price_start_${tier.id}` as keyof Translations)}
                      </CheckoutButton>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </ScrollFloat>
          );
        })}
        </div>

        {/* Trust markers & Disclaimer — Streamlined */}
        <div className="mt-20 flex flex-col items-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-16 py-10 border-y border-white/5 w-full max-w-4xl px-4 mb-12">
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-celestial-gold text-2xl opacity-60">✦</span>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] font-bold text-warm-ivory/80">Secure Checkout</p>
                <p className="text-[0.6rem] text-warm-ivory/40 mt-1">Encrypted encryption via Paddle</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-celestial-gold text-2xl opacity-60">✦</span>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] font-bold text-warm-ivory/80">Privacy First</p>
                <p className="text-[0.6rem] text-warm-ivory/40 mt-1">Your data is never sold or shared</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-celestial-gold text-2xl opacity-60">✦</span>
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] font-bold text-warm-ivory/80">Precise Ephemeris</p>
                <p className="text-[0.6rem] text-warm-ivory/40 mt-1">Real-time astronomical data</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[0.65rem] text-warm-ivory/30 max-w-2xl leading-relaxed italic px-4">
            Readings are for symbolic reflection and self-understanding. They are not predictive and do not substitute for professional medical, legal, or financial advice. Olivia Arcana is an independent application; astronomical data is sourced from open ephemerides and is not endorsed by any government agency.
          </p>
        </div>

        {/* Individual Addons — Renamed for clarity */}
        <div className="mt-24">
          <p className="text-center readable-label mb-4 tracking-[0.2em]">Individual Reports</p>
          <h3 className="text-center font-[family-name:var(--font-heading)] text-3xl text-warm-ivory italic mb-12">Try a single reading</h3>
          <Addons />
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * À-la-carte addons — buy without subscribing
 * ─────────────────────────────────────────────────────────────────── */
function Addons() {
  const { t } = useLocale();

  const getAddonName = (key: string) => {
    const map: Record<string, string> = {
      addon_birth_chart: "price_i1",
      addon_compatibility: "price_i2",
      addon_celtic_cross: "price_i3",
      addon_year_ahead: "price_i4",
      addon_solar_return: "price_i4", 
      addon_video_reading: "price_i5",
    };
    return t(map[key] as keyof Translations);
  };

  return (
    <>
      <div className="addons-grid">
        {ADDON_KEYS.map((key) => {
          const addon = ADDONS[key];
          return (
            <div
              key={key}
              className="bg-void-black/40 border border-white/5 rounded-2xl p-6 flex flex-col gap-5 hover:border-celestial-gold/30 transition-all duration-500"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-[family-name:var(--font-heading)] text-xl text-warm-ivory font-medium italic">
                  {getAddonName(key)}
                </h4>
                <span className="text-celestial-gold font-bold text-lg whitespace-nowrap">
                  {fmtPrice(addon.price)}
                </span>
              </div>
              <CheckoutButton priceKey={key} variant="glass" size="md" className="w-full justify-center shadow-md border-white/10 rounded-xl hover:bg-white/5">
                Get {getAddonName(key)}
              </CheckoutButton>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .addons-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .addons-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .addons-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </>
  );
}
