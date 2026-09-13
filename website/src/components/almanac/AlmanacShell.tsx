"use client";

/**
 * AlmanacShell — the shared chrome of every light Personal-Almanac page:
 * compact masthead (hairline / wordmark + nav / PERSONAL ALMANAC / Oxford
 * rule), bone-paper ground with grain, and the colophon. Pages provide
 * their own content; LegalShell layers the article/prose treatment on top.
 *
 * Design tokens (--paper/--ink/--ink-soft/--ink-faint/--hairline/--ox)
 * are defined here and available to all children.
 */

import { useEffect, useState } from "react";
import TransitionLink from "@/components/transitions/TransitionLink";
import InkCursor from "@/components/almanac/InkCursor";
import MagnetRig from "@/components/almanac/MagnetRig";
import ShaderBackdrop from "@/components/almanac/ShaderBackdrop";
import { useLocale } from "@/lib/i18n/useLocale";

interface AlmanacShellProps {
  children: React.ReactNode;
  /** Constrain content to article width (44rem). Default false = full width. */
  narrow?: boolean;
}

const CHROME = {
  en: {
    nav: [
      { label: "Almanac", href: "/" },
      { label: "Daily card", href: "/daily" },
      { label: "Academy", href: "/academy" },
      { label: "Tariff", href: "/pricing" },
    ],
    cta: "Ask the Oracle",
    mastTitle: "Personal Almanac",
    colophonLinks: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Disclaimer", "/disclaimer"],
    ] as Array<[string, string]>,
    line: "© MMXXVI Olivia Arcana LLC — The stars guide, you decide.",
  },
  uk: {
    nav: [
      { label: "Альманах", href: "/" },
      { label: "Карта дня", href: "/daily" },
      { label: "Академія", href: "/academy" },
      { label: "Тариф", href: "/pricing" },
    ],
    cta: "Запитати Оракула",
    mastTitle: "Особистий альманах",
    colophonLinks: [
      ["Про нас", "/about"],
      ["Контакт", "/contact"],
      ["Умови", "/terms"],
      ["Приватність", "/privacy"],
      ["Застереження", "/disclaimer"],
    ] as Array<[string, string]>,
    line: "© MMXXVI Olivia Arcana LLC — Зорі підказують, вирішуєте ви.",
  },
};

const ZODIAC = ["\u2648\uFE0E", "\u2649\uFE0E", "\u264A\uFE0E", "\u264B\uFE0E", "\u264C\uFE0E", "\u264D\uFE0E", "\u264E\uFE0E", "\u264F\uFE0E", "\u2650\uFE0E", "\u2651\uFE0E", "\u2652\uFE0E", "\u2653\uFE0E"];
const SIGN_SLUGS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

export default function AlmanacShell({ children, narrow = false }: AlmanacShellProps) {
  const { locale } = useLocale();
  const chrome = locale === "uk" ? CHROME.uk : CHROME.en;

  // The edition number — computed after mount so the static export never
  // ships a stale day. Every leaf closes with the same colophon as the
  // front page: the twelve-glyph index, the edition, the closing line.
  const [edition, setEdition] = useState<number | null>(null);
  useEffect(() => {
    const now = new Date();
    setEdition(Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000));
  }, []);

  return (
    <div className="almanac alm-page">
      <InkCursor />
      <MagnetRig />
      <ShaderBackdrop />
      <header className="alm-masthead">
        <div className="alm-rule" aria-hidden />
        <div className="alm-mast-row">
          <TransitionLink href="/" className="alm-wordmark">
            Olivia Arcana
          </TransitionLink>
          <nav className="alm-mast-nav" aria-label={locale === "uk" ? "Головна навігація" : "Primary"}>
            {chrome.nav.map((item) => (
              <TransitionLink key={item.href} href={item.href} className="alm-mast-link">
                {item.label}
              </TransitionLink>
            ))}
            <TransitionLink href="/oracle" className="alm-mast-cta">
              {chrome.cta}
            </TransitionLink>
          </nav>
        </div>
        <p className="alm-mast-title">{chrome.mastTitle}</p>
        <div className="alm-rule oxford" aria-hidden />
      </header>

      <main id="main-content" className={`alm-main ${narrow ? "alm-narrow" : ""}`}>
        {children}
      </main>

      <footer className="alm-colophon">
        <div className="alm-rule oxford" aria-hidden />

        <nav className="alm-zodiac-index" aria-label={locale === "uk" ? "Знаки зодіаку" : "The twelve signs"}>
          {ZODIAC.map((glyph, i) => (
            <TransitionLink key={SIGN_SLUGS[i]} href={`/signs/${SIGN_SLUGS[i]}`} className="alm-zodiac-link">
              <span aria-hidden>{glyph}</span>
              <span className="alm-sr">{SIGN_SLUGS[i]}</span>
            </TransitionLink>
          ))}
        </nav>

        <p className="alm-colophon-verse">
          {locale === "uk" ? "Тут закінчується цей лист альманаху." : "Here ends this leaf of the almanac."}
          {edition !== null && (
            <span className="alm-colophon-edition"> № {edition}</span>
          )}
        </p>

        <nav className="alm-colophon-links" aria-label={locale === "uk" ? "Правове та про нас" : "Legal and about"}>
          {chrome.colophonLinks.map(([label, href]) => (
            <TransitionLink key={href} href={href} className="alm-colophon-link">
              {label}
            </TransitionLink>
          ))}
        </nav>
        <p className="alm-colophon-line">{chrome.line}</p>
      </footer>

      <style jsx global>{`
        .alm-page {
          --paper: #10134d;
          --paper-deep: #10134d;
          --ink: #e8e9ff;
          --ink-soft: rgba(232, 233, 255, 0.78);
          --ink-faint: rgba(183, 188, 233, 0.66);
          --hairline: rgba(183, 188, 233, 0.2);
          --ox: #e0b768;
          --ox-fill: #8d97ff;
          --ink-body: rgba(232, 233, 255, 0.86);
          --verdis: #b7bce9;
          --paper-bone: #181d7a;
          --paper-shade: #0a0d38;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 100svh;
          /* CARTA COELI — a near-opaque veil over the voyage canvas: the
             stars whisper through at ~12% while text contrast stays AA.
             The body beneath carries the solid base colour. */
          background: rgba(16, 19, 77, 0.8);
          color: var(--ink);
          font-family: var(--font-body, system-ui), sans-serif;
          font-variant-numeric: oldstyle-nums;
          overflow-x: clip;
        }

        .alm-page::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.05;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .alm-page > * {
          position: relative;
          z-index: 1;
        }

        .alm-page ::selection {
          background: rgba(224, 183, 104, 0.16);
        }

        .alm-rule {
          height: 1px;
          background: var(--hairline);
        }

        /* The Oxford rule at engraving weight — a double hairline, not
           the brightest object on the page. */
        .alm-rule.oxford {
          height: 6px;
          background: linear-gradient(
            180deg,
            rgba(183, 188, 233, 0.34) 0 1px, transparent 1px 4.5px,
            rgba(183, 188, 233, 0.24) 4.5px 5.5px, transparent 5.5px
          );
        }

        .alm-masthead {
          padding: 1.1rem clamp(1.1rem, 4vw, 3rem) 0;
        }

        .alm-mast-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 0.85rem 0;
        }

        .alm-wordmark {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.28rem;
          font-weight: 600;
          color: var(--ink);
          text-decoration: none;
          white-space: nowrap;
        }

        .alm-mast-nav {
          display: flex;
          align-items: center;
          gap: clamp(0.9rem, 2.5vw, 1.8rem);
        }

        .alm-mast-link {
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .alm-mast-link:hover {
          color: var(--ox);
        }

        .alm-mast-cta {
          color: var(--ox);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(224, 183, 104, 0.45);
          border-radius: 999px;
          padding: 0.5rem 1.05rem;
          transition: all 250ms var(--ease);
          white-space: nowrap;
        }

        .alm-mast-cta:hover {
          background: var(--ox);
          color: #f6f1e5;
          border-color: var(--ox);
        }

        .alm-mast-title {
          margin: 0 0 0.6rem;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.5em;
          text-transform: uppercase;
        }

        .alm-main {
          padding: clamp(2.2rem, 5vw, 4rem) clamp(1.1rem, 4vw, 3rem) clamp(3rem, 7vw, 5rem);
        }

        .alm-main.alm-narrow > * {
          max-width: 44rem;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Shared almanac vocabulary for converted pages ──────── */
        .alm-kicker {
          margin: 0 0 1rem;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .alm-kicker span {
          margin-right: 0.4rem;
        }

        .alm-h1 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 400;
          line-height: 1.04;
          color: var(--ink);
          text-wrap: balance;
        }

        .alm-h2 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.6rem, 3.4vw, 2.3rem);
          font-weight: 500;
          line-height: 1.1;
          color: var(--ink);
        }

        .alm-lead {
          color: var(--ink-soft);
          font-size: clamp(0.98rem, 1.5vw, 1.1rem);
          line-height: 1.68;
        }

        .alm-caption {
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .alm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.75rem 1.9rem;
          position: relative;
          overflow: hidden;
          color: var(--ink);
          background: linear-gradient(160deg, rgba(158, 188, 255, 0.3) 0%, rgba(38, 72, 152, 0.5) 100%);
          -webkit-backdrop-filter: blur(18px) saturate(170%);
          backdrop-filter: blur(18px) saturate(170%);
          box-shadow:
            inset 0 1px 0 rgba(226, 230, 255, 0.32),
            inset 0 -1px 0 rgba(120, 130, 220, 0.14),
            0 0.7rem 1.6rem rgba(10, 13, 56, 0.5);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: box-shadow 320ms var(--ease), color 240ms var(--ease);
        }

        /* the light rises through the pane — the ink-flood, in glass */
        .alm-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(to top, rgba(224, 183, 104, 0.6), rgba(240, 214, 160, 0.26) 62%, transparent);
          transform: translateY(101%);
          transition: transform 460ms cubic-bezier(0.3, 1.25, 0.4, 1);
          z-index: 0;
        }

        .alm-btn > * {
          position: relative;
          z-index: 1;
        }

        .alm-btn:hover:not(:disabled)::before,
        .alm-btn:focus-visible::before {
          transform: translateY(0);
        }

        .alm-input:focus {
          outline: none;
          border-color: rgba(232, 233, 255, 0.5);
        }

        .alm-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .alm-btn:hover:not(:disabled),
        .alm-btn:focus-visible {
          color: #10134d;
          box-shadow:
            inset 0 1px 0 rgba(255, 240, 210, 0.45),
            0 0.9rem 2.2rem rgba(12, 20, 95, 0.55),
            0 0 2.2rem rgba(224, 183, 104, 0.2);
        }

        .alm-btn:hover,
        .alm-btn:focus-visible {
          background: var(--ox);
          transform: translateY(-1px);
          box-shadow: 0 0.45rem 1rem rgba(10, 13, 56, 0.22);
        }

        /* Press physics: the stamp meets the paper. */
        .alm-btn:active {
          transform: translateY(1px) scale(0.985);
          box-shadow: 0 0.1rem 0.25rem rgba(10, 13, 56, 0.25);
          transition-duration: 80ms;
        }

        .alm-btn:disabled {
          opacity: 0.45;
          cursor: default;
          transform: none;
        }

        .alm-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--ox);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.3);
          padding-bottom: 0.25rem;
          background: none;
          cursor: pointer;
          transition: border-color 250ms var(--ease);
        }

        .alm-link:hover,
        .alm-link:focus-visible {
          border-color: var(--ox);
        }

        /* A pane, not a panel: it refracts the aurora behind it and
           catches a rim of light along its top edge. */
        .alm-card {
          position: relative;
          border: 0;
          border-radius: 16px;
          background: var(--lg-tint);
          -webkit-backdrop-filter: var(--lg-blur);
          backdrop-filter: var(--lg-blur);
          box-shadow: var(--lg-rim), var(--lg-cast);
          padding: clamp(1.3rem, 2.8vw, 1.9rem);
        }

        .alm-input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: rgba(16, 19, 77, 0.6);
          border: 1px solid rgba(232, 233, 255, 0.16);
          border-radius: 4px;
          color: var(--ink);
          transition: border-color 0.3s var(--ease);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
        }

        .alm-input:focus-visible {
          outline: 2px solid var(--ox);
          outline-offset: 2px;
        }

        .alm-hairline-row {
          border-bottom: 1px solid var(--hairline);
        }

        .alm-page a:focus-visible,
        .alm-page button:focus-visible,
        .alm-page summary:focus-visible {
          outline: 2px solid var(--ox);
          outline-offset: 4px;
        }

        .alm-colophon {
          padding: 0 clamp(1.1rem, 4vw, 3rem) 2rem;
        }

        .alm-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .alm-zodiac-index {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: clamp(0.5rem, 2.4vw, 1.35rem);
          padding: 1.5rem 0 0.2rem;
        }

        .alm-zodiac-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.5rem;
          min-height: 2.75rem;
          color: var(--ink-faint);
          font-size: clamp(0.78rem, 2.6vw, 0.95rem);
          text-decoration: none;
          transition: color 220ms var(--ease);
        }

        .alm-zodiac-link:hover,
        .alm-zodiac-link:focus-visible {
          color: var(--ox);
        }

        .alm-colophon-verse {
          margin: 0.5rem 0 0;
          text-align: center;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.02rem;
          color: var(--ink-soft);
        }

        .alm-colophon-edition {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-style: normal;
          font-size: 0.66rem;
          letter-spacing: 0.2em;
          color: var(--ox);
          margin-left: 0.35rem;
        }

        .alm-colophon-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.8rem 1.6rem;
          padding: 1.3rem 0 0.4rem;
        }

        .alm-colophon-link {
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .alm-colophon-link:hover {
          color: var(--ox);
        }

        .alm-colophon-line {
          margin: 0.8rem auto 0;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          /* the four links survive as a compact second row — a site
             with no navigation is not a site (audit: mobile/high) */
          .alm-mast-row {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }
          .alm-mast-nav {
            flex-basis: 100%;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.15rem clamp(0.7rem, 4vw, 1.2rem);
            padding-bottom: 0.55rem;
          }
          .alm-mast-nav .alm-mast-link {
            font-size: 0.66rem;
            padding: 0.45rem 0;
            white-space: nowrap;
          }
          .alm-mast-nav .alm-mast-cta {
            font-size: 0.66rem;
            padding: 0.4rem 0.75rem;
            white-space: nowrap;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alm-btn,
          .alm-link,
          .alm-mast-link,
          .alm-mast-cta {
            transition: none !important;
          }
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }
          .alm-page {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .alm-page::before {
            display: none !important;
          }
          .alm-page nav,
          .alm-mast-cta,
          .alm-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
