"use client";

import MagneticButton from "@/components/MagneticButton";
import { useLocale } from "../lib/i18n/useLocale";

export default function CTA() {
  const { t } = useLocale();

  return (
    <section className="relative py-32 px-6">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="text-5xl mb-6 animate-float">☽</div>

        <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold mb-6">
          <span className="text-gold-gradient">{t("cta_title")}</span>
        </h2>

        <p className="font-[family-name:var(--font-accent)] text-xl text-muted-lavender mb-10 max-w-xl mx-auto">
          {t("cta_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton href="/portrait" variant="gold" size="lg">
            {t("cta_button")}
          </MagneticButton>
        </div>

        <p className="mt-6 text-xs text-muted-lavender/40">
          {t("cta_note")}
        </p>
      </div>
    </section>
  );
}
