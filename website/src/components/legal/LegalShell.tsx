"use client";

/**
 * LegalShell — inner pages of the Personal Almanac.
 *
 * Same Arrival register as the homepage: ultramarine night ground,
 * moonstone type, one gilt accent, hairline rules. Carries its own compact
 * masthead and colophon because the dark site chrome is switched off for
 * these routes in ClientShell. Serves about/contact and the legal set.
 */

import TransitionLink from "@/components/transitions/TransitionLink";

interface LegalShellProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export default function LegalShell({ title, updated, children }: LegalShellProps) {
  return (
    <div className="almanac alm-page">
      <div className="alm-atmosphere" aria-hidden="true" />
      <header className="alm-masthead">
        <div className="alm-rule" aria-hidden />
        <div className="alm-mast-row">
          <TransitionLink href="/" className="alm-wordmark">
            Olivia <span>Arcana</span>
          </TransitionLink>
          <nav className="alm-mast-nav" aria-label="Primary">
            <TransitionLink href="/?experience=journal" className="alm-mast-link">
              My almanac
            </TransitionLink>
            <TransitionLink href="/?experience=spreads" className="alm-mast-link">
              Spreads
            </TransitionLink>
            <TransitionLink href="/cards" className="alm-mast-link">
              The cards
            </TransitionLink>
            <TransitionLink href="/pricing" className="alm-mast-link">
              Membership
            </TransitionLink>
            <TransitionLink href="/?experience=question" className="alm-mast-cta">
              Begin a reading
            </TransitionLink>
          </nav>
        </div>
        <p className="alm-mast-title">A personal practice of tarot</p>
        <div className="alm-rule oxford" aria-hidden />
      </header>

      <main id="main-content" className="alm-main">
        <article className="alm-article">
          <header className="alm-article-head">
            <p className="alm-kicker">
              <span aria-hidden>✦</span> Olivia Arcana
            </p>
            <h1>{title}</h1>
            <p className="alm-updated">Last updated: {updated}</p>
          </header>
          <div className="legal-prose">{children}</div>
        </article>
      </main>

      <footer className="alm-colophon">
        <div className="alm-rule oxford" aria-hidden />
        <nav className="alm-colophon-links" aria-label="Legal and about">
          {[
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Terms", "/terms"],
            ["Privacy", "/privacy"],
            ["Disclaimer", "/disclaimer"],
          ].map(([label, href]) => (
            <TransitionLink key={href} href={href} className="alm-colophon-link">
              {label}
            </TransitionLink>
          ))}
        </nav>
        <p className="alm-colophon-line">© 2026 Olivia Arcana — Tarot, thoughtfully personal.</p>
      </footer>

      <style jsx global>{`
        .alm-page {
          --paper: #0b1c2c;
          --paper-bone: #153045;
          --ink: #eee6d4;
          --ink-soft: rgba(238, 230, 212, 0.72);
          --ink-faint: rgba(181, 196, 199, 0.66);
          --hairline: rgba(238, 230, 212, 0.16);
          --ox: #c1ab7c;
          --ox-fill: #c1ab7c;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 100svh;
          /* Continue the reading experience’s lapis and ivory palette. */
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
          opacity: 0.06;
          mix-blend-mode: screen;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .alm-page > * {
          position: relative;
          z-index: 1;
        }

        .alm-page ::selection {
          background: rgba(193, 171, 124, 0.28);
        }

        .alm-rule {
          height: 1px;
          background: var(--hairline);
        }

        .alm-rule.oxford {
          height: 1px;
          background: var(--hairline);
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
          font-size: 2rem;
          font-weight: 400;
          color: var(--ink);
          text-decoration: none;
          white-space: nowrap;
        }

        .alm-wordmark span {
          margin-left: 0.55rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }
        .alm-page > .alm-atmosphere {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at 20% 0%, rgba(84, 113, 135, 0.2), transparent 48%), radial-gradient(ellipse at 100% 35%, rgba(164, 144, 105, 0.06), transparent 45%);
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
          border: 1px solid rgba(193, 171, 124, 0.45);
          border-radius: 2px;
          padding: 0.5rem 1.05rem;
          white-space: nowrap;
          /* the house ink-flood: gilt rises from the baseline with a
             darker meniscus at its crest — never an instant swap */
          background-image: linear-gradient(to top, #eee6d4 0%, #eee6d4 calc(100% - 3px), #c1ab7c 100%);
          background-repeat: no-repeat;
          background-position: 0 100%;
          background-size: 100% 0%;
          transition:
            background-size 300ms var(--ease),
            color 200ms var(--ease),
            border-color 200ms var(--ease);
        }

        .alm-mast-cta:hover,
        .alm-mast-cta:focus-visible {
          background-size: 100% 100%;
          color: #0b1c2c;
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
          padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.1rem, 4vw, 3rem) clamp(3rem, 7vw, 5rem);
        }

        .alm-article {
          max-width: 44rem;
          margin: 0 auto;
        }

        .alm-article-head {
          text-align: center;
          margin-bottom: clamp(2rem, 5vw, 3rem);
        }

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

        .alm-article-head h1 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2.2rem, 5vw, 3.2rem);
          font-weight: 400;
          line-height: 1.05;
          color: var(--ink);
          text-wrap: balance;
        }

        .alm-updated {
          margin: 0.9rem 0 0;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .legal-prose {
          color: var(--ink-soft);
          line-height: 1.75;
        }

        .legal-prose h2 {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.55rem;
          font-weight: 500;
          color: var(--ink);
          margin: 2.6rem 0 0.9rem;
        }

        .legal-prose h3 {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.18rem;
          font-weight: 600;
          color: var(--ink);
          margin: 1.8rem 0 0.6rem;
        }

        .legal-prose p {
          margin: 0.85rem 0;
        }

        .legal-prose a {
          color: var(--ox);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(193, 171, 124, 0.4);
          transition: text-decoration-color 200ms var(--ease);
        }

        .legal-prose a.alm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.8rem 1.6rem;
          background: var(--ink);
          color: var(--paper);
          border: 1px solid var(--ink);
          border-radius: 4px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .legal-prose a.alm-btn:hover {
          background: var(--ox);
          border-color: var(--ox);
        }
        .legal-prose a.alm-link {
          display: inline-flex;
          min-height: 2.75rem;
          align-items: center;
          padding: 0.4rem 0;
          font-weight: 600;
        }
        .legal-prose a:hover {
          text-decoration-color: var(--ox);
        }

        .legal-prose ul,
        .legal-prose ol {
          padding-left: 1.4rem;
          margin: 0.8rem 0;
        }

        .legal-prose li {
          margin: 0.35rem 0;
        }

        .legal-prose strong {
          color: var(--ink);
          font-weight: 600;
        }

        .legal-prose hr {
          border: none;
          border-top: 1px solid var(--hairline);
          margin: 2.5rem 0;
        }

        .legal-prose blockquote {
          border-left: 2px solid rgba(193, 171, 124, 0.45);
          padding: 0.4rem 1rem;
          margin: 1.2rem 0;
          color: var(--ink-soft);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.08rem;
        }

        .alm-colophon {
          padding: 0 clamp(1.1rem, 4vw, 3rem) 2rem;
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

        .alm-page a:focus-visible,
        .alm-page summary:focus-visible {
          outline: 2px solid var(--ox);
          outline-offset: 4px;
        }

        /* ── page-load reveal: identical to AlmanacShell, so every
           room of the edition opens the same way. Hidden states only
           under no-preference: reduced motion renders instantly. */
        @media (prefers-reduced-motion: no-preference) {
          .alm-masthead .alm-rule {
            transform: scaleX(0);
            transform-origin: 50% 50%;
            animation: alm-rule-draw 700ms var(--ease) 60ms forwards;
          }
          .alm-masthead .alm-rule.oxford {
            animation-delay: 180ms;
          }
          .alm-mast-row {
            opacity: 0;
            animation: alm-ink-in 520ms var(--ease) 140ms forwards;
          }
          .alm-mast-title {
            opacity: 0;
            animation: alm-track-in 640ms var(--ease) 240ms forwards;
          }
        }
        @keyframes alm-rule-draw {
          to {
            transform: scaleX(1);
          }
        }
        @keyframes alm-ink-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes alm-track-in {
          from {
            opacity: 0;
            letter-spacing: 0.62em;
          }
          to {
            opacity: 1;
            letter-spacing: 0.5em;
          }
        }

        @media (max-width: 640px) {
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
          .alm-mast-cta {
            display: none !important;
          }
          .legal-prose a {
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
