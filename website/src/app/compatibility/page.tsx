/**
 * /compatibility — index of all 144 sun-sign pairings.
 * A 12×12 engraved concordance table: rows and columns are the signs in
 * zodiac order, every cell links to its pair page and carries the
 * deterministic score from lib/compatibility-pairs.ts.
 */

import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { SIGNS, pairSlug, pairScore } from "@/lib/compatibility-pairs";

export const metadata = {
  title: "Zodiac Compatibility — All 144 Sign Pairings | Olivia Arcana",
  description:
    "The complete concordance of sun-sign compatibility: every pairing of the 12 zodiac signs scored and read — element, modality, ruling planets, and the aspect between the suns.",
  alternates: { canonical: "https://oliviaarcana.com/compatibility/" },
};

export default function CompatibilityIndex() {
  return (
    <AlmanacShell>
      <div className="compat-index">
        <header className="compat-head">
          <p className="alm-kicker">
            <span>The Concordance</span>· 144 pairings
          </p>
          <h1 className="alm-h1">Zodiac Compatibility</h1>
          <p className="alm-lead compat-lead">
            Every pairing of the twelve signs, scored from element, modality, ruling planets,
            and the aspect between the suns. Find your row, read across.
          </p>
        </header>

        <div className="compat-scroll" role="region" aria-label="Compatibility table" tabIndex={0}>
          <table className="compat-grid">
            <caption className="alm-caption compat-caption">
              Fig. 1 — the concordance of the twelve, read row to column
            </caption>
            <thead>
              <tr>
                <th scope="col" className="compat-corner" aria-label="Sign" />
                {SIGNS.map((s) => (
                  <th key={s.slug} scope="col" className="compat-col">
                    <span aria-hidden>{s.glyph + "︎"}</span>
                    <span className="compat-col-name">{s.name.slice(0, 3)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNS.map((row) => (
                <tr key={row.slug}>
                  <th scope="row" className="compat-row-head">
                    <span aria-hidden>{row.glyph + "︎"}</span> {row.name}
                  </th>
                  {SIGNS.map((col) => {
                    const score = pairScore(row, col);
                    return (
                      <td key={col.slug} className="compat-cell">
                        <Link
                          href={`/compatibility/${pairSlug(row.slug, col.slug)}/`}
                          className={`compat-cell-link${score >= 75 ? " is-high" : ""}`}
                          aria-label={`${row.name} and ${col.name}: ${score} percent`}
                        >
                          {score}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="compat-foot alm-caption">
          Scores are sun-sign weather, not a verdict.{" "}
          <Link href="/synastry/" className="alm-link">
            Two full charts say more →
          </Link>
        </p>
      </div>

      <style>{`
        .compat-index {
          width: min(100%, 64rem);
          margin: 0 auto;
        }

        .compat-head {
          text-align: center;
          margin-bottom: clamp(2rem, 5vw, 3.2rem);
        }

        .compat-lead {
          max-width: 52ch;
          margin: 0.9rem auto 0;
        }

        .compat-scroll {
          overflow-x: auto;
          border: 1px solid var(--hairline);
          outline: 1px solid var(--hairline);
          outline-offset: 4px;
          -webkit-overflow-scrolling: touch;
        }

        .compat-grid {
          width: 100%;
          min-width: 46rem;
          border-collapse: collapse;
          font-variant-numeric: lining-nums tabular-nums;
        }

        .compat-caption {
          caption-side: bottom;
          padding: 0.9rem 0.5rem;
          text-align: center;
        }

        .compat-corner {
          border-bottom: 3px solid var(--ink);
        }

        .compat-col {
          padding: 0.7rem 0.2rem 0.55rem;
          border-bottom: 3px solid var(--ink);
          font-weight: 400;
          text-align: center;
        }

        .compat-col span[aria-hidden] {
          display: block;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.05rem;
          color: var(--ink-soft);
        }

        .compat-col-name {
          display: block;
          margin-top: 0.2rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .compat-row-head {
          position: sticky;
          left: 0;
          z-index: 1;
          padding: 0.5rem 0.9rem 0.5rem 0.6rem;
          border-bottom: 1px solid var(--hairline);
          background: var(--paper, #10134d);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.98rem;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
          color: var(--ink);
        }

        .compat-row-head span[aria-hidden] {
          color: var(--ink-soft);
          margin-right: 0.3rem;
        }

        .compat-cell {
          padding: 0;
          border-bottom: 1px solid var(--hairline);
          border-left: 1px solid var(--hairline);
          text-align: center;
        }

        .compat-cell-link {
          display: block;
          padding: 0.55rem 0.2rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 200ms var(--ease), background 200ms var(--ease);
        }

        .compat-cell-link.is-high {
          color: var(--ox);
        }

        .compat-cell-link:hover,
        .compat-cell-link:focus-visible {
          color: var(--ox);
          background: rgba(232, 233, 255, 0.05);
        }

        .compat-foot {
          text-align: center;
          margin-top: 2.2rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .compat-cell-link {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
