/**
 * Footer — the Arrival colophon.
 *
 * A hairline-topped band on deep ultramarine: mono note with the gilt
 * diamond, a serif italic breath in the center, and below it a quiet
 * mono directory. The mega-footer grid is retired.
 */

"use client";

import TransitionLink from "@/components/transitions/TransitionLink";
import LivingOliveMark from "./LivingOliveMark";
import { useLocale } from "../lib/i18n/useLocale";

export default function Footer() {
  const { t, locale } = useLocale();
  const isUk = locale === "uk";

  const directory: Array<{ head: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
    {
      head: t("foot_explore") as string,
      links: [
        { label: t("nav_academy") as string, href: "/academy" },
        { label: t("academy_card_of_day") as string, href: "/academy/card-of-the-day" },
        { label: t("profile_celestial_portrait") as string, href: "/portrait" },
        { label: t("ask_title") as string, href: "/ask" },
      ],
    },
    {
      head: t("foot_connect") as string,
      links: [
        { label: t("foot_tg_bot") as string, href: "https://t.me/OliviaArcanaBot", external: true },
        { label: t("foot_tg_channel") as string, href: "https://t.me/OliviaArcanaDaily", external: true },
        { label: t("common_about") as string, href: "/about" },
        { label: t("common_contact") as string, href: "/contact" },
      ],
    },
    {
      head: t("legal_title") as string,
      links: [
        { label: t("legal_terms") as string, href: "/terms" },
        { label: t("legal_privacy") as string, href: "/privacy" },
        { label: t("legal_refund") as string, href: "/refund" },
        { label: t("legal_disclaimer") as string, href: "/disclaimer" },
        { label: t("legal_dmca") as string, href: "/dmca" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-[rgba(232,233,255,0.16)] bg-[#121656]">
      {/* ── The band ── */}
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 items-center gap-5 px-6 py-6 sm:grid-cols-[1fr_auto_1fr] sm:px-[clamp(24px,5.25vw,104px)]">
        <p className="m-0 flex items-center gap-3 font-[family-name:var(--font-mono)] text-[11px] uppercase leading-relaxed tracking-[0.12em] text-[#b7bce9]">
          <span aria-hidden className="text-[13px] text-[#e0b768]">✦</span>
          {isUk ? "Астрологія й таро — особисто для вас" : "Astrology & tarot, made personal"}
        </p>
        <p className="m-0 hidden text-center font-[family-name:var(--font-heading)] text-lg italic text-[#c4caed] sm:block">
          {isUk ? "Трохи тиші. Трохи ясності." : "A little stillness. A little clarity."}
        </p>
        <div className="flex items-center justify-start gap-3 sm:justify-end">
          <LivingOliveMark size={20} className="shrink-0 text-[#b7bce9]" />
          <span className="font-[family-name:var(--font-heading)] text-base tracking-[0.105em] text-[#e8e9ff]">
            OLIVIA ARCANA
          </span>
        </div>
      </div>

      {/* ── The directory ── */}
      <div className="border-t border-[rgba(232,233,255,0.08)]">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-10 px-6 py-12 sm:grid-cols-4 sm:px-[clamp(24px,5.25vw,104px)]">
          <div className="col-span-2 sm:col-span-1">
            <p className="m-0 max-w-xs text-sm leading-relaxed text-[rgba(206,210,245,0.85)]">{t("foot_desc")}</p>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-[rgba(183,188,233,0.66)]">
              Astrology and tarot for entertainment & self-reflection.{" "}
              <TransitionLink href="/disclaimer" className="text-[#e0b768] underline decoration-[rgba(224,183,104,0.35)] underline-offset-4 hover:decoration-[#e0b768]">
                {t("legal_disclaimer")}
              </TransitionLink>
            </p>
          </div>
          {directory.map((col) => (
            <div key={col.head}>
              <h4 className="mb-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-[#b7bce9]">
                {col.head}
              </h4>
              <ul className="m-0 list-none space-y-3 p-0">
                {col.links.map((item) =>
                  item.external ? (
                    <li key={item.href}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-[rgba(232,233,255,0.75)] transition-colors hover:text-[#e8e9ff]">
                        {item.label}
                      </a>
                    </li>
                  ) : (
                    <li key={item.href}>
                      <TransitionLink href={item.href} className="text-sm text-[rgba(232,233,255,0.75)] transition-colors hover:text-[#e8e9ff]">
                        {item.label}
                      </TransitionLink>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto flex max-w-screen-2xl flex-col items-start justify-between gap-2 px-6 pb-8 sm:flex-row sm:items-center sm:px-[clamp(24px,5.25vw,104px)]" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
          <p className="m-0 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[rgba(183,188,233,0.6)]">
            © {new Date().getFullYear()} Olivia Arcana LLC · {t("foot_copyright")}
          </p>
          <p className="m-0 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[rgba(183,188,233,0.45)]">
            {t("foot_data")}
          </p>
        </div>
      </div>
    </footer>
  );
}
