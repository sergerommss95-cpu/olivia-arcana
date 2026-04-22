"use client";

import SmoothReveal from "@/components/SmoothReveal";
import { useLocale } from "../lib/i18n/useLocale";

export default function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    {
      number: "01",
      title: t("how_1_title"),
      description: t("how_1_desc"),
    },
    {
      number: "02",
      title: t("how_2_title"),
      description: t("how_2_desc"),
    },
    {
      number: "03",
      title: t("how_3_title"),
      description: t("how_3_desc"),
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

        <SmoothReveal stagger={150} duration={800} direction="up" distance={40} blur className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
            <div key={step.number} className="text-center">
              {/* Step number — the sole visual anchor, italic Cormorant in gold */}
              <div className="relative inline-block mb-6">
                <span className="text-6xl md:text-7xl font-[family-name:var(--font-heading)] italic font-medium text-celestial-gold/60">
                  {step.number}
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
          ))}
        </SmoothReveal>
      </div>
    </section>
  );
}
