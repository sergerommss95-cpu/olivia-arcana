/**
 * LanguageSwitcher.tsx — Dropdown language selector
 *
 * Shows the current language flag + ISO code. Click opens a dropdown with
 * all 8 languages. Selecting one persists via useLocale() — no full page
 * reload needed; the hook updates the external store and all consumers
 * re-render.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "../lib/i18n/translations";
import { useLocale } from "../lib/i18n/useLocale";

const LOCALES: Locale[] = ["en", "uk", "ru", "de", "fr", "ar", "es", "pt"];

export default function LanguageSwitcher() {
  const { locale: current, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${LOCALE_NAMES[current]}. Click to change.`}
        style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: "0.3rem 0.55rem", borderRadius: "0.5rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,185,255,0.10)",
          cursor: "pointer", fontSize: "0.75rem",
          color: "rgba(220,210,245,0.82)",
          transition: "background 200ms ease, border-color 200ms ease",
        }}
      >
        <span aria-hidden>{LOCALE_FLAGS[current]}</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
          {current.toUpperCase()}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0,
            zIndex: 100, minWidth: "172px",
            background: "rgba(10,8,21,0.96)",
            border: "1px solid rgba(200,185,255,0.12)",
            borderRadius: "0.85rem",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
            padding: "0.35rem",
          }}
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              role="option"
              aria-selected={locale === current}
              onClick={() => handleSelect(locale)}
              style={{
                display: "flex", alignItems: "center", gap: "0.55rem",
                width: "100%", padding: "0.55rem 0.65rem",
                background: locale === current ? "rgba(212,175,55,0.10)" : "transparent",
                border: "none", borderRadius: "0.55rem",
                cursor: "pointer", transition: "background 160ms ease",
                textAlign: "left",
              }}
            >
              <span aria-hidden style={{ fontSize: "0.95rem" }}>{LOCALE_FLAGS[locale]}</span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: locale === current ? "rgba(245,240,255,0.95)" : "rgba(200,190,235,0.68)",
                  fontWeight: locale === current ? 500 : 400,
                }}
              >
                {LOCALE_NAMES[locale]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
