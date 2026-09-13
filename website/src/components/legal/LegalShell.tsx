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
import ShaderBackdrop from "@/components/almanac/ShaderBackdrop";

interface LegalShellProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export default function LegalShell({ title, updated, children }: LegalShellProps) {
  return (
    <div className="almanac alm-page">
      <ShaderBackdrop />
      <header className="alm-masthead">
        <div className="alm-rule" aria-hidden />
        <div className="alm-mast-row">
          <TransitionLink href="/" className="alm-wordmark">
            Olivia Arcana
          </TransitionLink>
          <nav className="alm-mast-nav" aria-label="Primary">
            <TransitionLink href="/" className="alm-mast-link">
              Almanac
            </TransitionLink>
            <TransitionLink href="/daily" className="alm-mast-link">
              Card of the Day
            </TransitionLink>
            <TransitionLink href="/academy" className="alm-mast-link">
              Academy
            </TransitionLink>
            <TransitionLink href="/pricing" className="alm-mast-link">
              Tariff
            </TransitionLink>
            <TransitionLink href="/oracle" className="alm-mast-cta">
              Ask the Oracle
            </TransitionLink>
          </nav>
        </div>
        <p className="alm-mast-title">Personal Almanac</p>
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
        <p className="alm-colophon-line">© MMXXVI Olivia Arcana LLC — The stars guide, you decide.</p>
      </footer>

      <style jsx global>{`
        .alm-page {
          --paper: #10134d;
          --paper-bone: #181d7a;
          --ink: #e8e9ff;
          --ink-soft: rgba(232, 233, 255, 0.72);
          --ink-faint: rgba(183, 188, 233, 0.66);
          --hairline: rgba(232, 233, 255, 0.16);
          --ox: #e0b768;
          --ox-fill: #8d97ff;
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
          opacity: 0.06;
          mix-blend-mode: screen;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .alm-page > * {
          position: relative;
          z-index: 1;
        }

        .alm-page ::selection {
          background: rgba(224, 183, 104, 0.28);
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
          border-radius: 2px;
          padding: 0.5rem 1.05rem;
          white-space: nowrap;
          /* the house ink-flood: gilt rises from the baseline with a
             darker meniscus at its crest — never an instant swap */
          background-image: linear-gradient(to top, #edca8b 0%, #edca8b calc(100% - 3px), #e0b768 100%);
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
          color: #15174c;
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
          text-decoration-color: rgba(224, 183, 104, 0.4);
          transition: text-decoration-color 200ms var(--ease);
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
          border-left: 2px solid rgba(224, 183, 104, 0.45);
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

        @media (max-width: 640px) {
          .alm-mast-row {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }
          .alm-mast-nav {
            flex-basis: 100%;
            justify-content: center;
            gap: clamp(0.7rem, 4vw, 1.2rem);
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
