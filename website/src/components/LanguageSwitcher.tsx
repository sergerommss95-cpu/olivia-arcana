/**
 * LanguageSwitcher.tsx — Dropdown language selector
 *
 * Shows current language flag, click to open dropdown with all 9 languages.
 * Saves preference to localStorage, reloads page to apply.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale, detectLocale, setLocale } from "../lib/i18n/translations";

const LOCALES: Locale[] = ["en", "uk", "ru", "de", "fr", "ar", "es", "zh", "pt"];

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<Locale>("en");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(detectLocale());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setCurrent(locale);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: "0.3rem",
          padding: "0.3rem 0.5rem", borderRadius: "0.5rem",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,185,255,0.08)",
          cursor: "pointer", fontSize: "0.75rem",
          color: "rgba(200,190,235,0.7)",
          transition: "all 0.2s",
        }}
      >
        <span>{LOCALE_FLAGS[current]}</span>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", letterSpacing: "0.04em" }}>
          {current.toUpperCase()}
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          zIndex: 100, minWidth: "160px",
          background: "rgba(10,8,21,0.95)",
          border: "1px solid rgba(200,185,255,0.1)",
          borderRadius: "0.75rem",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          padding: "0.3rem",
        }}>
          {LOCALES.map(locale => (
            <button
              key={locale}
              onClick={() => handleSelect(locale)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                width: "100%", padding: "0.5rem 0.6rem",
                background: locale === current ? "rgba(200,185,255,0.06)" : "transparent",
                border: "none", borderRadius: "0.5rem",
                cursor: "pointer", transition: "background 0.15s",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>{LOCALE_FLAGS[locale]}</span>
              <span style={{
                fontFamily: "var(--font-body)", fontSize: "0.75rem",
                color: locale === current ? "rgba(240,236,255,0.9)" : "rgba(200,190,235,0.6)",
                fontWeight: locale === current ? 500 : 400,
              }}>{LOCALE_NAMES[locale]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
