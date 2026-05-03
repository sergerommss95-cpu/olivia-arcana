"use client";

import MagneticButton from "@/components/MagneticButton";
import { useLocale } from "../lib/i18n/useLocale";

export default function CTA() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden py-32 px-6">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 h-[min(600px,calc(100vw-2rem))] w-[min(600px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto text-center z-10">
        <div className="text-5xl mb-8 animate-float drop-shadow-lg">☽</div>

        <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl font-bold mb-8 text-[#f5f2e1]">
          {t("cta_title")}
        </h2>

        <p className="font-[family-name:var(--font-body)] text-xl md:text-2xl readable-secondary mb-12 max-w-xl mx-auto font-medium leading-relaxed">
          {t("cta_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton href="/portrait" variant="gold" size="lg" className="shadow-2xl font-bold">
            {t("cta_button")}
          </MagneticButton>
        </div>

        <p className="mt-10 text-[0.7rem] readable-muted font-medium tracking-wide">
          {t("cta_note")}
        </p>
      </div>
    </section>
  );
}
