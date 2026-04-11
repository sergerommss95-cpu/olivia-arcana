"use client";

import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "../lib/i18n/useLocale";

export default function Footer() {
  const { t } = useLocale();
  const zodiacSigns = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <footer className="relative py-20 px-6 border-t border-celestial-gold/10">
      <div className="max-w-6xl mx-auto">
        {/* Zodiac strip */}
        <div className="flex justify-center gap-4 mb-12 text-celestial-gold/30 text-lg">
          {zodiacSigns.map((sign, i) => (
            <span key={i} className="hover:text-celestial-gold transition-colors cursor-default">
              {sign}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-celestial-gold text-xl">&#10022;</span>
              <span className="font-[family-name:var(--font-heading)] text-xl font-semibold text-celestial-gold">
                Olivia Arcana
              </span>
            </div>
            <p className="text-muted-lavender text-sm leading-relaxed max-w-md">
              {t("foot_desc")}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              {t("foot_explore")}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t("nav_academy"), href: "/academy" },
                { label: t("academy_tarot_encyclopedia"), href: "/academy/tarot-encyclopedia" },
                { label: t("academy_card_of_day"), href: "/academy/card-of-the-day" },
                { label: t("academy_aspect_guide"), href: "/academy/aspect-guide" },
              ].map((item) => (
                <li key={item.label}>
                  <TransitionLink href={item.href} className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              {t("foot_connect")}
            </h4>
            <ul className="space-y-3">
              {[
                { label: t("foot_tg_bot"), href: "https://t.me/OliviaArcanaBot" },
                { label: t("foot_tg_channel"), href: "https://t.me/OliviaArcanaDaily" },
                { label: t("profile_celestial_portrait"), href: "/portrait", internal: true },
                { label: t("ask_title"), href: "/ask", internal: true },
              ].map((item) => (
                <li key={item.label}>
                  {"internal" in item && item.internal ? (
                    <TransitionLink
                      href={item.href}
                      className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors"
                    >
                      {item.label}
                    </TransitionLink>
                  ) : (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-celestial-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-lavender/50 text-xs">
            &copy; {new Date().getFullYear()} Olivia Arcana. {t("foot_copyright")}
          </p>
          <p className="text-muted-lavender/30 text-xs">
            {t("foot_data")}
          </p>
        </div>
      </div>
    </footer>
  );
}
