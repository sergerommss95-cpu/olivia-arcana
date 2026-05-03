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
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Readability Backing */}
      <div className="absolute inset-0 section-scrim pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <p className="readable-label mb-4">
            {t("how_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("how_title")}
          </h2>
          <div className="star-divider max-w-xs mx-auto text-celestial-gold">&#10022;</div>
        </div>

        <SmoothReveal stagger={150} duration={800} direction="up" distance={40} blur className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
            <div key={step.number} className="text-center relative">
              {/* Step number — the sole visual anchor, italic Cormorant in gold */}
              <div className="relative inline-block mb-6">
                <span className="text-6xl md:text-7xl font-[family-name:var(--font-heading)] italic font-medium text-celestial-gold/75 drop-shadow-sm">
                  {step.number}
                </span>
              </div>

              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-warm-ivory mb-4">
                {step.title}
              </h3>

              <p className="readable-secondary text-base leading-relaxed max-w-xs mx-auto font-medium">
                {step.description}
              </p>

              {/* Connecting line (not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 -right-6 w-1/2 h-px bg-gradient-to-r from-transparent via-celestial-gold/30 to-transparent z-0" />
              )}
            </div>
          ))}
        </SmoothReveal>
      </div>
    </section>
  );
}
