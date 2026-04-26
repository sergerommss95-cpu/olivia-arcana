"use client";

import TransitionLink from "@/components/transitions/TransitionLink";
import LivingOliveMark from "./LivingOliveMark";
import { useLocale } from "../lib/i18n/useLocale";

export default function Footer() {
  const { t } = useLocale();
  const zodiacSigns = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <footer className="relative py-12 sm:py-20 px-4 sm:px-6 border-t border-celestial-gold/10" style={{ paddingBottom: "calc(3rem + env(safe-area-inset-bottom))" }}>
      <div className="max-w-6xl mx-auto">
        {/* Zodiac strip */}
        <div className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-12 text-celestial-gold/30 text-base sm:text-lg">
          {zodiacSigns.map((sign, i) => (
            <span key={i} className="hover:text-celestial-gold transition-colors cursor-default">
              {sign}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <LivingOliveMark size={24} className="shrink-0" />
              <span className="font-[family-name:var(--font-heading)] text-xl font-semibold text-celestial-gold">
                Olivia Arcana
              </span>
            </div>
            <p className="text-muted-lavender text-sm leading-relaxed max-w-md">
              {t("foot_desc")}
            </p>
            <p className="text-muted-lavender/40 text-xs mt-4 leading-relaxed">
              Astrology and tarot for entertainment & self-reflection. <a href="/disclaimer" className="hover:text-celestial-gold/70 transition-colors">Read the full disclaimer</a>.
            </p>
          </div>

          {/* Explore */}
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
                { label: t("profile_celestial_portrait"), href: "/portrait" },
                { label: t("ask_title"), href: "/ask" },
              ].map((item) => (
                <li key={item.href}>
                  <TransitionLink href={item.href} className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              {t("foot_connect")}
            </h4>
            <ul className="space-y-3">
              <li><a href="https://t.me/OliviaArcanaBot" target="_blank" rel="noopener noreferrer" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">{t("foot_tg_bot")}</a></li>
              <li><a href="https://t.me/OliviaArcanaDaily" target="_blank" rel="noopener noreferrer" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">{t("foot_tg_channel")}</a></li>
              <li><TransitionLink href="/about" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">About</TransitionLink></li>
              <li><TransitionLink href="/contact" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Contact</TransitionLink></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-wider uppercase mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              <li><TransitionLink href="/terms" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Terms of Service</TransitionLink></li>
              <li><TransitionLink href="/privacy" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Privacy Policy</TransitionLink></li>
              <li><TransitionLink href="/cookies" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Cookies</TransitionLink></li>
              <li><TransitionLink href="/refund" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Refund Policy</TransitionLink></li>
              <li><TransitionLink href="/disclaimer" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">Disclaimer</TransitionLink></li>
              <li><TransitionLink href="/dmca" className="text-muted-lavender text-sm hover:text-celestial-gold transition-colors">DMCA</TransitionLink></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-celestial-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-lavender/50 text-xs">
            &copy; {new Date().getFullYear()} Olivia Arcana LLC. {t("foot_copyright")}
          </p>
          <p className="text-muted-lavender/30 text-xs">
            {t("foot_data")}
          </p>
        </div>
      </div>
    </footer>
  );
}
