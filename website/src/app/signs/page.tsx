/**
 * /signs — Zodiac sign index page
 * The almanac's index of plates: all twelve signs, one ruled line each,
 * dot leaders running out to the dates.
 */

import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { SIGN_PAGES } from "../../lib/sign-data";

export const metadata = {
  title: "All 12 Zodiac Signs — Complete Guide | Olivia Arcana",
  description: "Explore all 12 zodiac signs with detailed personality profiles, compatibility, career guidance, and more. Aries through Pisces — your complete astrological reference.",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export default function SignsIndex() {
  const signs = Object.values(SIGN_PAGES);

  return (
    <AlmanacShell>
      <div className="signs-index">
        <header className="signs-head">
          <p className="alm-kicker">
            <span>Plates I–XII</span>· The Zodiac
          </p>
          <h1 className="alm-h1">The 12 Zodiac Signs</h1>
          <p className="alm-lead signs-lead">Your complete astrological reference</p>
        </header>

        <p className="alm-kicker signs-archive">
          <span lang="en">THE PLATE ARCHIVE — twelve engravings, kept in the order of the year</span>
          <span lang="uk">АРХІВ ГРАВЮР — дванадцять відбитків, у порядку року</span>
        </p>

        <ol className="signs-list">
          {signs.map((sign, i) => (
            <li key={sign.name} className="signs-row">
              <Link href={`/signs/${sign.name.toLowerCase()}`} className="signs-link">
                <span className="signs-numeral">{ROMAN[i]}</span>
                <span className="signs-glyph" aria-hidden>
                  {sign.glyph + "\uFE0E"}
                </span>
                <span className="signs-name">{sign.name}</span>
                <span className="signs-meta">
                  {sign.element} · {sign.modality}
                </span>
                <span className="signs-leader" aria-hidden />
                <span className="signs-dates">{sign.dateRange}</span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="alm-caption signs-foot">Fig. 1–12 — the wheel, taken apart</p>
      </div>

      <style>{`
        .signs-index {
          width: min(100%, 56rem);
          margin: 0 auto;
        }

        .signs-head {
          text-align: center;
          margin-bottom: clamp(2rem, 5vw, 3.2rem);
        }

        .signs-lead {
          max-width: 44ch;
          margin: 0.9rem auto 0;
        }

        /* Archive kicker — EN by default; html[lang] is synced by the shell. */
        .signs-archive {
          margin: 0 0 0.9rem;
        }

        .signs-archive [lang="uk"] {
          display: none;
        }

        html[lang="uk"] .signs-archive [lang="en"] {
          display: none;
        }

        html[lang="uk"] .signs-archive [lang="uk"] {
          display: inline;
        }

        .signs-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 3px solid var(--ink);
        }

        .signs-row {
          border-bottom: 1px solid var(--hairline);
        }

        .signs-link {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 1.05rem 0.2rem;
          text-decoration: none;
          color: var(--ink);
        }

        .signs-numeral {
          flex: 0 0 2.2rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.18em;
          color: var(--ink-faint);
        }

        .signs-glyph {
          flex: 0 0 auto;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.15rem;
          color: var(--ink-soft);
        }

        .signs-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.4rem;
          font-weight: 600;
          line-height: 1.1;
          transition: color 200ms var(--ease);
        }

        .signs-link:hover .signs-name,
        .signs-link:focus-visible .signs-name {
          color: var(--ox);
          font-style: italic;
        }

        .signs-meta {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .signs-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .signs-dates {
          flex: 0 0 auto;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          font-variant-numeric: lining-nums tabular-nums;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .signs-foot {
          text-align: center;
          margin-top: 2.2rem;
        }

        @media (max-width: 640px) {
          .signs-link {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }

          .signs-leader {
            display: none;
          }

          .signs-meta {
            margin-left: auto;
          }

          .signs-dates {
            flex: 1 1 100%;
            order: 5;
            padding-left: 3.2rem;
            color: var(--ink-faint);
            white-space: normal;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signs-name {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
