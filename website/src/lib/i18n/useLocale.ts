/**
 * useLocale.ts — React hook for accessing current locale + translations
 *
 * Usage in any client component:
 *   const { locale, t, setLocale } = useLocale();
 *   <h1>{t("hero_title")}</h1>
 *
 * Implementation notes
 *  - We mirror localStorage into local React state via useState + useEffect.
 *    On SSR we return "en". On first client mount we read localStorage +
 *    navigator.language and update.
 *  - Changes from LanguageSwitcher / other components propagate via a
 *    CustomEvent (olivia:locale-change) and cross-tab "storage" events.
 *  - `<html lang="">` is synced whenever the locale changes.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type Locale,
  type Translations,
  TRANSLATIONS,
  detectLocale,
  setLocale as persistLocale,
} from "./translations";

const LOCALE_CHANGE_EVENT = "olivia:locale-change";
const STORAGE_KEY = "olivia-locale";

export function useLocale() {
  // MARKER_V2_NEW_IMPL_USE_STATE
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const syncFromStorage = () => {
      const next = detectLocale();
      setLocaleState((prev) => (prev === next ? prev : next));
      if (typeof document !== "undefined" && document.documentElement.lang !== next) {
        document.documentElement.lang = next;
      }
    };

    // Initial sync
    syncFromStorage();

    const onCustom = () => syncFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromStorage();
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const t = useCallback(
    (key: keyof Translations): string => {
      return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || String(key);
    },
    [locale],
  );

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale: next } }));
    }
  }, []);

  return { locale, t, setLocale };
}
