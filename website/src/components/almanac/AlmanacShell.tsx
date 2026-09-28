"use client";

/**
 * Shared Olivia chrome: lapis, ivory, a restrained gold accent, and the
 * same tarot navigation used by the reading experience. LegalShell layers
 * the article/prose treatment on top.
 *
 * Design tokens (--paper/--ink/--ink-soft/--ink-faint/--hairline/--ox)
 * are defined here and available to all children.
 */

import TransitionLink from "@/components/transitions/TransitionLink";
import AlmanacMasthead from "@/components/almanac/AlmanacMasthead";
import InkCursor from "@/components/almanac/InkCursor";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MagnetRig from "@/components/almanac/MagnetRig";
import { useLocale } from "@/lib/i18n/useLocale";

interface AlmanacShellProps {
  children: React.ReactNode;
  /** Constrain content to article width (44rem). Default false = full width. */
  narrow?: boolean;
}

const CHROME = {
  en: {
    colophonLinks: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Refund", "/refund"],
      ["Cookies", "/cookies"],
      ["Disclaimer", "/disclaimer"],
    ] as Array<[string, string]>,
    line: "© 2026 Olivia Arcana — Tarot, thoughtfully personal.",
  },
  uk: {
    colophonLinks: [
      ["Про нас", "/about"],
      ["Контакт", "/contact"],
      ["Умови", "/terms"],
      ["Приватність", "/privacy"],
      ["Повернення", "/refund"],
      ["Cookies", "/cookies"],
      ["Застереження", "/disclaimer"],
    ] as Array<[string, string]>,
    line: "© 2026 Olivia Arcana — Таро для особистих роздумів.",
  },
};

export default function AlmanacShell({ children, narrow = false }: AlmanacShellProps) {
  const { locale } = useLocale();
  const chrome = locale === "uk" ? CHROME.uk : CHROME.en;

  return (
    <div className="almanac alm-page">
      <InkCursor />
      <MagnetRig />
      <div className="alm-atmosphere" aria-hidden="true" />
      <AlmanacMasthead />

      <main id="main-content" className={`alm-main ${narrow ? "alm-narrow" : ""}`}>
        {children}
      </main>

      <footer className="alm-colophon">
        <div className="alm-rule oxford" aria-hidden />

        <p className="alm-colophon-verse">
          {locale === "uk" ? "Для запитань, що залишаються з вами." : "For the questions that stay with you."}
        </p>

        <nav className="alm-colophon-links" aria-label={locale === "uk" ? "Правове та про нас" : "Legal and about"}>
          {chrome.colophonLinks.map(([label, href]) => (
            <TransitionLink key={href} href={href} className="alm-colophon-link">
              {label}
            </TransitionLink>
          ))}
        </nav>
        <p className="alm-colophon-line">{chrome.line}</p>

        {/* The edition's tongue — appended below the closing line so the
            colophon above never reflows; the list opens upward. */}
        <div className="alm-colophon-lang">
          <LanguageSwitcher openUp />
        </div>
      </footer>

      <style jsx global>{`
        .alm-page {
          --paper: #0b1c2c;
          --paper-deep: #071522;
          --ink: #eee6d4;
          --ink-soft: rgba(238, 230, 212, 0.78);
          --ink-faint: rgba(181, 196, 199, 0.66);
          --hairline: rgba(181, 196, 199, 0.2);
          --ox: #c1ab7c;
          --ox-fill: #bfa776;
          --ink-body: rgba(238, 230, 212, 0.86);
          --verdis: #adbec3;
          --paper-bone: #153045;
          --paper-shade: #071522;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 100svh;
          /* Keep inner pages in the same lapis room as the reading experience. */
          background: #0b1c2c;
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
          background: rgba(193, 171, 124, 0.16);
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
            rgba(181, 196, 199, 0.34) 0 1px, transparent 1px 4.5px,
            rgba(181, 196, 199, 0.24) 4.5px 5.5px, transparent 5.5px
          );
        }

        .alm-page > .alm-atmosphere {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 20% 0%, rgba(84, 113, 135, 0.2), transparent 48%), radial-gradient(ellipse at 100% 35%, rgba(164, 144, 105, 0.06), transparent 45%);
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
          background: var(--ink);
          color: var(--paper);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: box-shadow 320ms var(--ease), color 240ms var(--ease);
        }

        /* the light rises through the pane — the ink-flood, in glass */
        .alm-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(to top, rgba(193, 171, 124, 0.6), rgba(240, 214, 160, 0.26) 62%, transparent);
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
          border-color: rgba(238, 230, 212, 0.5);
        }

        .alm-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .alm-btn:hover:not(:disabled),
        .alm-btn:focus-visible {
          color: #0b1c2c;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
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
          border-bottom: 1px solid rgba(193, 171, 124, 0.3);
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
          border: 1px solid var(--hairline);
          border-radius: 4px;
          background: rgba(16, 40, 56, 0.48);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
          padding: clamp(1.3rem, 2.8vw, 1.9rem);
        }

        .alm-input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: rgba(7, 21, 34, 0.6);
          border: 1px solid rgba(238, 230, 212, 0.16);
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

        .alm-colophon-lang {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
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

        /* the twelve glyphs stay ONE unbroken row at every width —
           tighter set on narrow leaves, never an orphaned sign */
        @media (max-width: 420px) {
          .alm-zodiac-index {
            gap: 0.32rem;
          }
          .alm-zodiac-link {
            min-width: 1.3rem;
            font-size: 0.76rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alm-btn,
          .alm-link {
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
          .alm-btn,
          .alm-colophon-lang {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
