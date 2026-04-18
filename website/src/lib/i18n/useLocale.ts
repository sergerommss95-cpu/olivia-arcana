/**
 * useLocale.ts — React hook for accessing current locale + translations
 *
 * Usage in any client component:
 *   const { locale, t, setLocale } = useLocale();
 *   <h1>{t("hero_title")}</h1>
 *
 * Design notes
 * ────────────
 *  - We use `useSyncExternalStore` so the locale is read *synchronously* on
 *    first render (from localStorage + navigator.language), eliminating the
 *    "English flash" that happened with the old useEffect-based hook.
 *  - On SSR we return "en" (deterministic) so the server-rendered HTML is
 *    stable across all locales; the client immediately reconciles to the
 *    right locale on hydration without a visible re-render for users whose
 *    locale happens to be English (the vast majority of SSR'd pages).
 *  - When the locale changes we also sync <html lang=""> and dispatch a
 *    CustomEvent so components that don't use the hook can still react.
 */

"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  type Locale,
  type Translations,
  TRANSLATIONS,
  detectLocale,
  setLocale as persistLocale,
} from "./translations";

const LOCALE_CHANGE_EVENT = "olivia:locale-change";
const STORAGE_KEY = "olivia-locale";

// ── External store plumbing ────────────────────────────────────────────────

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => callback();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };

  window.addEventListener(LOCALE_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Locale {
  return detectLocale();
}

function getServerSnapshot(): Locale {
  return "en";
}

// ── Public hook ────────────────────────────────────────────────────────────

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale: next } }));
    }
  }, []);

  return { locale, t, setLocale };
}
