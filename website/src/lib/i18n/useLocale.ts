/**
 * useLocale.ts — React hook for accessing current locale + translations
 *
 * Usage in any client component:
 *   const { locale, t, setLocale } = useLocale();
 *   <h1>{t("hero_title")}</h1>
 *
 * Implementation notes
 *  - We mirror localStorage into local React state via useState + useEffect.
 *    Authored EN/UK routes are authoritative on SSR and after hydration.
 *    Other routes read localStorage/navigator only after mounting.
 *  - Changes from LanguageSwitcher / other components propagate via a
 *    CustomEvent (olivia:locale-change) and cross-tab "storage" events.
 *  - `<html lang="">` is synced whenever the locale changes.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type Locale,
  type Translations,
  TRANSLATIONS,
  detectLocale,
  setLocale as persistLocale,
} from "./translations";

import { routeLocale as localeForRoute } from "./route-locale";

const LOCALE_CHANGE_EVENT = "olivia:locale-change";
const STORAGE_KEY = "olivia-locale";

// RTL locales — set <html dir="rtl"> so the entire layout flips bidi.
const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"] as Locale[]);

function applyDocumentLocale(next: Locale): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.lang !== next) {
    document.documentElement.lang = next;
  }
  const dir = RTL_LOCALES.has(next) ? "rtl" : "ltr";
  if (document.documentElement.dir !== dir) {
    document.documentElement.dir = dir;
  }
}

export function useLocale() {
  // Initialize from authored route language. Browser preferences are deferred
  // until mount on routes without an explicit language edition.
  const pathname = usePathname();
  const routeLocale = localeForRoute(pathname);
  const [preferredLocale, setLocaleState] = useState<Locale>(routeLocale || "en");
  // Derive immediately during navigation too; effects must never render stale chrome.
  const locale = routeLocale || preferredLocale;

  useEffect(() => {
    // Sync document attributes on mount/change
    applyDocumentLocale(locale);

    const syncFromStorage = () => {
      const next = routeLocale || detectLocale();
      if (next !== locale) {
        setLocaleState(next);
        applyDocumentLocale(next);
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
  }, [locale, routeLocale]);

  const t = useCallback(
    <K extends keyof Translations>(key: K): Translations[K] => {
      return (TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || String(key)) as Translations[K];
    },
    [locale],
  );

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    applyDocumentLocale(routeLocale || next);
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale: next } }));
    }
  }, [routeLocale]);

  return { locale, t, setLocale };
}
