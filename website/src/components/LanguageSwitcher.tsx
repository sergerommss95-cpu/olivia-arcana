/**
 * LanguageSwitcher.tsx — Dropdown language selector
 *
 * Shows the current language flag + ISO code. Click opens a listbox with
 * all 8 languages. Selecting one persists via useLocale() — no full page
 * reload needed; the hook updates the external store and all consumers
 * re-render.
 *
 * Set in the engraved-almanac register: mono type, hairline border, ink
 * colors, one gilt accent. Token fallbacks let it stand outside .alm-page.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "../lib/i18n/translations";
import { useLocale } from "../lib/i18n/useLocale";

const LOCALES: Locale[] = ["en", "uk", "ru", "de", "fr", "ar", "es", "pt"];

interface Props {
  /** Open the list above the trigger — for mounts near the page foot. */
  openUp?: boolean;
}

export default function LanguageSwitcher({ openUp = false }: Props) {
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
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current language: ${LOCALE_NAMES[current]}. Click to change.`}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          padding: "0.35rem 0.7rem", borderRadius: 0,
          background: "transparent",
          border: "1px solid var(--hairline, rgba(183,188,233,0.2))",
          cursor: "pointer",
          fontFamily: "var(--font-mono, ui-monospace), monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--ink-faint, rgba(183,188,233,0.66))",
          transition: "color 200ms ease, border-color 200ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--ox, #e0b768)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--ink-faint, rgba(183,188,233,0.66))";
        }}
      >
        <span aria-hidden>{LOCALE_FLAGS[current]}</span>
        <span>{current.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            ...(openUp
              ? { bottom: "calc(100% + 6px)" }
              : { top: "calc(100% + 6px)" }),
            left: "50%", transform: "translateX(-50%)",
            zIndex: 100, minWidth: "172px",
            background: "#0f1240",
            border: "1px solid var(--hairline, rgba(183,188,233,0.2))",
            boxShadow: "0 18px 44px rgba(4, 6, 32, 0.45)",
            padding: "0.3rem",
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
                width: "100%", padding: "0.5rem 0.65rem",
                background: locale === current ? "rgba(224,183,104,0.10)" : "transparent",
                border: "none", borderRadius: 0,
                cursor: "pointer", transition: "background 160ms ease",
                textAlign: "left",
              }}
            >
              <span aria-hidden style={{ fontSize: "0.9rem" }}>{LOCALE_FLAGS[locale]}</span>
              <span
                style={{
                  fontFamily: "var(--font-body, system-ui), sans-serif",
                  fontSize: "0.78rem",
                  color: locale === current
                    ? "var(--ink, #e8e9ff)"
                    : "var(--ink-soft, rgba(232,233,255,0.72))",
                  fontWeight: locale === current ? 600 : 400,
                }}
              >
                {LOCALE_NAMES[locale]}
              </span>
              {locale === current && (
                <span aria-hidden style={{ marginLeft: "auto", color: "var(--ox, #e0b768)", fontSize: "0.7rem" }}>
                  ✦
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
