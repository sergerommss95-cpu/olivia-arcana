"use client";

import { LOCALE_NAMES, type Locale } from "@/lib/i18n/translations";
import { useLocale } from "@/lib/i18n/useLocale";

const LOCALES: Locale[] = ["en", "uk", "ru", "de", "fr", "ar", "es", "pt"];

/** Native selection gives touch, keyboard and assistive technology one control. */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <>
    <select aria-label={locale === "uk" ? "Мова" : "Language"} value={locale} onChange={event => setLocale(event.target.value as Locale)} className="edition-language">
      {LOCALES.map(value => <option key={value} value={value} lang={value}>{LOCALE_NAMES[value]}</option>)}
    </select>
      <style jsx>{`
        .edition-language { min-height: 44px; max-width: 136px; padding: 0 24px 0 10px; color: #e8e9ff; background: #111542; border: 1px solid #66708e; border-radius: 0; font: 12px var(--font-body), sans-serif; cursor: pointer; }
        .edition-language:focus-visible { outline: 2px solid #e0b768; outline-offset: 3px; }
      `}</style>
    </>
  );
}
