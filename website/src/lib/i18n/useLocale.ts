/**
 * useLocale.ts — React hook for accessing current locale + translations
 *
 * Usage in any client component:
 *   const { locale, t } = useLocale();
 *   <h1>{t("hero_title")}</h1>
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { type Locale, type Translations, TRANSLATIONS, detectLocale } from "./translations";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || String(key);
    },
    [locale]
  );

  return { locale, t };
}
