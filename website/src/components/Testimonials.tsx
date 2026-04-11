"use client";

import TiltCard from "./TiltCard";
import ScrollFloat from "@/components/ScrollFloat";
import { useLocale } from "../lib/i18n/useLocale";

export default function Testimonials() {
  const { t } = useLocale();

  const testimonials = [
    {
      quote: t("test_1_quote"),
      name: t("test_1_name"),
      sign: t("test_1_sign"),
      avatar: "#7B68EE",
    },
    {
      quote: t("test_2_quote"),
      name: t("test_2_name"),
      sign: t("test_2_sign"),
      avatar: "#D4AF37",
    },
    {
      quote: t("test_3_quote"),
      name: t("test_3_name"),
      sign: t("test_3_sign"),
      avatar: "#4ECDC4",
    },
  ];
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("test_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("test_title")}
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <ScrollFloat key={item.name} index={i} intensity="subtle">
            <TiltCard maxTilt={3}>
            <div className="glass-card p-8">
              {/* Stars rating */}
              <div className="text-celestial-gold text-sm mb-4 tracking-wider">
                &#10022; &#10022; &#10022; &#10022; &#10022;
              </div>

              {/* Quote */}
              <p className="text-warm-ivory/90 text-sm leading-relaxed mb-6 font-[family-name:var(--font-accent)] italic">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-void-black font-semibold text-sm"
                  style={{ background: item.avatar }}
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-warm-ivory text-sm font-medium">{item.name}</p>
                  <p className="text-muted-lavender text-xs">{item.sign}</p>
                </div>
              </div>
            </div>
            </TiltCard>
            </ScrollFloat>
          ))}
        </div>
      </div>
    </section>
  );
}
