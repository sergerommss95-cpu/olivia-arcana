"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "../lib/i18n/useLocale";

const signKeys = [
  { key: "sign_aries" as const, glyph: "♈", dates: "Mar 21 – Apr 19", elKey: "el_fire" as const, color: "#E8524A" },
  { key: "sign_taurus" as const, glyph: "♉", dates: "Apr 20 – May 20", elKey: "el_earth" as const, color: "#4ECDC4" },
  { key: "sign_gemini" as const, glyph: "♊", dates: "May 21 – Jun 20", elKey: "el_air" as const, color: "#7B68EE" },
  { key: "sign_cancer" as const, glyph: "♋", dates: "Jun 21 – Jul 22", elKey: "el_water" as const, color: "#6B8DD6" },
  { key: "sign_leo" as const, glyph: "♌", dates: "Jul 23 – Aug 22", elKey: "el_fire" as const, color: "#E8524A" },
  { key: "sign_virgo" as const, glyph: "♍", dates: "Aug 23 – Sep 22", elKey: "el_earth" as const, color: "#4ECDC4" },
  { key: "sign_libra" as const, glyph: "♎", dates: "Sep 23 – Oct 22", elKey: "el_air" as const, color: "#7B68EE" },
  { key: "sign_scorpio" as const, glyph: "♏", dates: "Oct 23 – Nov 21", elKey: "el_water" as const, color: "#6B8DD6" },
  { key: "sign_sagittarius" as const, glyph: "♐", dates: "Nov 22 – Dec 21", elKey: "el_fire" as const, color: "#E8524A" },
  { key: "sign_capricorn" as const, glyph: "♑", dates: "Dec 22 – Jan 19", elKey: "el_earth" as const, color: "#4ECDC4" },
  { key: "sign_aquarius" as const, glyph: "♒", dates: "Jan 20 – Feb 18", elKey: "el_air" as const, color: "#7B68EE" },
  { key: "sign_pisces" as const, glyph: "♓", dates: "Feb 19 – Mar 20", elKey: "el_water" as const, color: "#6B8DD6" },
];

export default function DailyHoroscope() {
  const { t } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section id="daily" className="relative py-16 md:py-32 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-[0.65rem] md:text-sm tracking-[0.3em] uppercase mb-3 md:mb-4">
            {t("dh_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl font-bold text-warm-ivory mb-3 md:mb-4">
            {t("dh_title")}
          </h2>
          <p className="text-muted-lavender text-xs md:text-sm">{today}</p>
          <div className="star-divider max-w-xs mx-auto mt-6">&#10022;</div>
        </div>

        {/* Zodiac wheel / grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {signKeys.map((sign, i) => (
            <button
              key={sign.key}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`glass-card p-4 text-center transition-all duration-500 hover:scale-105 cursor-pointer ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              } ${
                selected === i
                  ? "ring-1 ring-celestial-gold/50 scale-105"
                  : ""
              }`}
              style={{
                transitionDelay: `${i * 50}ms`,
                borderColor: selected === i ? sign.color + "50" : undefined,
              }}
            >
              <div
                className="text-3xl md:text-4xl mb-2 transition-transform duration-300"
                style={{ color: sign.color }}
              >
                {sign.glyph}
              </div>
              <div className="font-[family-name:var(--font-heading)] text-sm font-semibold text-warm-ivory">
                {t(sign.key)}
              </div>
              <div className="text-xs text-muted-lavender/60 mt-1">
                {sign.dates}
              </div>
            </button>
          ))}
        </div>

        {/* Selected sign reading preview */}
        {selected !== null && (
          <div className="mt-8 glass-card p-8 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl" style={{ color: signKeys[selected].color }}>
                {signKeys[selected].glyph}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-warm-ivory">
                  {t(signKeys[selected].key)}
                </h3>
                <p className="text-xs text-muted-lavender">
                  {t(signKeys[selected].elKey)} {t("dh_sign_tag")} &middot; {signKeys[selected].dates}
                </p>
              </div>
            </div>

            <p className="text-muted-lavender leading-relaxed mb-6">
              {t("dh_reading_text")}
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/daily`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold text-sm font-medium hover:bg-celestial-gold/20 transition-all"
              >
                {t("dh_full_reading")} &rarr;
              </Link>
              <Link
                href={`/signs/${t(signKeys[selected].key).toLowerCase()}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/4 border border-white/10 text-muted-lavender text-sm hover:text-celestial-gold transition-all"
              >
                {t("dh_about")} {t(signKeys[selected].key)}
              </Link>
            </div>
          </div>
        )}

        {/* Teaser CTA */}
        {selected === null && (
          <div className="mt-12 text-center">
            <p className="text-muted-lavender/60 text-sm">
              {t("dh_select")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
