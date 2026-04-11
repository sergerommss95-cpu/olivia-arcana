"use client";

import ScrollFloat from "@/components/ScrollFloat";
import MagneticButton from "@/components/MagneticButton";
import { useLocale } from "../lib/i18n/useLocale";

export default function Pricing() {
  const { t } = useLocale();

  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("price_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("price_title")}
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <ScrollFloat index={0} intensity="subtle">
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

          {/* VIP Tier */}
          <ScrollFloat index={1} intensity="subtle">
          <div
            className="relative glass-card p-4 md:p-8 animate-pulse-glow"
            style={{ border: "1px solid rgba(212, 175, 55, 0.3)" }}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-celestial-gold text-void-black text-xs font-semibold">
              {t("price_popular")}
            </div>

            <div className="mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-celestial-gold mb-2">
                {t("price_vip")}
              </h3>
              <p className="text-muted-lavender text-sm">{t("price_vip_desc")}</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold">$6.50</span>
              <span className="text-muted-lavender text-sm ml-2">{t("price_month")}</span>
              <p className="text-xs text-muted-lavender/60 mt-1">
                {t("price_annual")}
              </p>
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

            <MagneticButton href="/portrait" variant="gold" size="md" className="w-full justify-center">
              {t("price_start_vip")}
            </MagneticButton>

            <p className="text-center text-xs text-muted-lavender/60 mt-3">
              {t("price_pay")}
            </p>
          </div>
          </ScrollFloat>
        </div>

        {/* One-time purchases */}
        <div className="mt-16 text-center">
          <p className="text-muted-lavender text-sm mb-6">
            {t("price_individual")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: t("price_i1"), price: "$3.90" },
              { name: t("price_i2"), price: "$3.90" },
              { name: t("price_i3"), price: "$1.95" },
              { name: t("price_i4"), price: "$6.50" },
              { name: t("price_i5"), price: "$39.99" },
            ].map((item) => (
              <span
                key={item.name}
                className="px-4 py-2 rounded-full glass-card text-sm text-muted-lavender"
              >
                {item.name}{" "}
                <span className="text-celestial-gold">{item.price}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
