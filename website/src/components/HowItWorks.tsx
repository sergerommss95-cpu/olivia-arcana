"use client";

import ScrollFloat from "@/components/ScrollFloat";
import { useLocale } from "../lib/i18n/useLocale";

export default function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    {
      number: "01",
      title: t("how_1_title"),
      description: t("how_1_desc"),
      icon: "🔭",
    },
    {
      number: "02",
      title: t("how_2_title"),
      description: t("how_2_desc"),
      icon: "✨",
    },
    {
      number: "03",
      title: t("how_3_title"),
      description: t("how_3_desc"),
      icon: "🌙",
    },
  ];

  return (
    <section className="relative py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("how_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("how_title")}
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
            <ScrollFloat key={step.number} index={i} intensity="subtle">
            <div className="text-center">
              {/* Step number */}
              <div className="relative inline-block mb-6">
                <span className="text-6xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold/10">
                  {step.number}
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                  {step.icon}
                </span>
              </div>

              <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-warm-ivory mb-3">
                {step.title}
              </h3>

              <p className="text-muted-lavender text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Connecting line (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 right-0 w-full h-px bg-gradient-to-r from-transparent via-celestial-gold/20 to-transparent" />
              )}
            </div>
            </ScrollFloat>
          ))}
        </div>
      </div>
    </section>
  );
}
