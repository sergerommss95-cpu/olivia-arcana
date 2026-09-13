/**
 * /sample — Representative worked reading for a Pisces sun / Cancer moon.
 *
 * A specimen letter from the Personal Almanac: static data showcasing
 * the Olivia Arcana editorial tone before a reader creates an account.
 * Set in the print register — bone paper, ink, one oxblood accent,
 * roman-numeral chapters, and a line-engraved "resonance figure".
 */

"use client";

import React from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";

/* The relic, redrawn as a plate engraving: hatched crescent, dashed
   axes, a water bowl of wave lines, and the chart's three anchors. */
function RelicEngraving({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 280" className={className} aria-hidden="true">
      <defs>
        <pattern
          id="relic-hatch"
          width="2.6"
          height="2.6"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="2.6" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="140" cy="140" r="118" strokeWidth="1" />
        <circle cx="140" cy="140" r="104" strokeWidth="0.5" />
        <circle cx="140" cy="140" r="70" strokeWidth="0.6" strokeDasharray="2 4" />
        <line x1="22" y1="140" x2="258" y2="140" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1="140" y1="22" x2="140" y2="258" strokeWidth="0.5" strokeDasharray="2 4" />
        {/* water: three engraved wave lines in the lower bowl */}
        <path d="M62 190 q13 -9 26 0 t26 0 t26 0 t26 0 t26 0 t26 0" strokeWidth="0.7" />
        <path d="M74 206 q11 -8 22 0 t22 0 t22 0 t22 0 t22 0 t22 0" strokeWidth="0.6" />
        <path d="M92 221 q9 -7 18 0 t18 0 t18 0 t18 0 t18 0" strokeWidth="0.5" />
      </g>
      <path
        d="M140 22 A118 118 0 0 1 258 140 L244 140 A104 104 0 0 0 140 36 Z"
        fill="url(#relic-hatch)"
        opacity="0.5"
      />
      <g stroke="currentColor" fill="var(--paper, #e8dcc8)">
        <circle cx="140" cy="96" r="17" strokeWidth="1" />
        <circle cx="97" cy="164" r="14" strokeWidth="0.8" />
        <circle cx="183" cy="164" r="14" strokeWidth="0.8" />
      </g>
      <g fill="currentColor" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        <text x="140" y="96" fontSize="15">
          ☉
        </text>
        <text x="97" y="164" fontSize="12">
          ☽
        </text>
        <text x="183" y="164" fontSize="12">
          ♏
        </text>
      </g>
      <circle cx="140" cy="140" r="2.4" fill="currentColor" />
    </svg>
  );
}

export default function SamplePage() {
  return (
    <AlmanacShell narrow>
      <article className="sample">
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="sample-masthead">
          <p className="alm-kicker">
            <span aria-hidden>⁂</span>
            A worked reading
          </p>
          <h1 className="alm-h1">
            For Eleanor, born <em>into water.</em>
          </h1>
          <div className="sample-data">
            <span>Eleanor&nbsp;M.</span>
            <span aria-hidden className="sample-dot">·</span>
            <span>14.03.1994</span>
            <span aria-hidden className="sample-dot">·</span>
            <span>03:47&nbsp;GMT</span>
            <span aria-hidden className="sample-dot">·</span>
            <span>London, UK</span>
          </div>
          <div className="sample-summary alm-lead">
            <p>
              Eleanor&rsquo;s chart is defined by a rare cluster in Pisces — a
              profoundly intuitive alignment that requires an equally
              profound container.
            </p>
          </div>
        </header>

        {/* ── Section I ────────────────────────────────────────── */}
        <section className="sample-section">
          <h2 className="alm-h2 sample-section-title">
            <span className="sample-numeral">I.</span> The Core Essence
          </h2>
          <p className="sample-chart-data">
            <span>Sun in Pisces</span>
            <span className="sample-chart-sep" aria-hidden>·</span>
            <span>Moon in Cancer</span>
            <span className="sample-chart-sep" aria-hidden>·</span>
            <span>Scorpio Rising</span>
          </p>
          <div className="sample-copy">
            <p>
              You are a being of pure resonance. With the luminaries in water
              signs and a Scorpio ascendant, your boundary between self and
              world is semi-permeable. You don&rsquo;t just observe environments;
              you absorb them.
            </p>
            <p>
              This sensitivity is your greatest power and your most
              significant challenge. Pisces Sun gives you the vision of a
              mystic, but your Cancer Moon demands the safety of a home.
              You are a voyager who needs an anchor.
            </p>
          </div>
        </section>

        {/* ── Visual plate ─────────────────────────────────────── */}
        <figure className="sample-visual">
          <RelicEngraving className="sample-relic" />
          <figcaption className="alm-caption sample-caption">
            Fig. 1 — the <em>Resonance Figure</em> engraved for Eleanor:
            luminaries in water, a fixed sign upon the rim.
          </figcaption>
        </figure>

        {/* ── Section II ───────────────────────────────────────── */}
        <section className="sample-section">
          <h2 className="alm-h2 sample-section-title">
            <span className="sample-numeral">II.</span> Intellectual Temperament
          </h2>
          <p className="sample-chart-data">
            <span>Mercury in Aquarius</span>
            <span className="sample-chart-sep" aria-hidden>·</span>
            <span>3rd House</span>
          </p>
          <div className="sample-copy">
            <p>
              While your heart is fluid, your mind is architectural.
              Mercury in Aquarius grants you a detached, almost scientific
              clarity when analyzing systems. You have the ability to step
              back from your own intense emotions and see the logical
              scaffolding of any situation.
            </p>
            <p>
              This creates a fascinating internal tension: a mystical heart
              paired with a modern, technological mind. You are the bridge
              between ancient wisdom and future logic.
            </p>
          </div>
        </section>

        {/* ── Section III ──────────────────────────────────────── */}
        <section className="sample-section">
          <h2 className="alm-h2 sample-section-title">
            <span className="sample-numeral">III.</span> The Saturn Return
          </h2>
          <p className="sample-chart-data">
            <span>Current Cycle</span>
            <span className="sample-chart-sep" aria-hidden>·</span>
            <span>Critical Integration</span>
          </p>
          <div className="sample-copy">
            <p>
              Eleanor is currently navigating the heart of her Saturn
              Return. This is the celestial &ldquo;coming of age&rdquo; where the
              fantasies of youth are tested against the weight of
              reality.
            </p>
            <p>
              For a Pisces Sun, this period often feels like being asked
              to build a cathedral on water. The task is to find a
              structure that respects your fluidity without trying to
              freeze it into stone.
            </p>
          </div>
        </section>

        {/* ── Midpoint break — the reader pauses here ───────────── */}
        <div className="sample-break" role="separator" aria-hidden>
          <span className="sample-break-rule" />
          <span className="sample-break-mark">✦</span>
          <span className="sample-break-rule" />
        </div>

        {/* ── Section IV ───────────────────────────────────────── */}
        <section className="sample-section">
          <h2 className="alm-h2 sample-section-title">
            <span className="sample-numeral">IV.</span> The Saturn–Mercury square
          </h2>
          <p className="sample-chart-data">
            <span>Saturn</span>
            <span className="sample-chart-sep" aria-hidden>·</span>
            <span className="zodiac-glyph">♓</span>
            <span>2°</span>
          </p>
          <div className="sample-copy">
            <p>
              In your specific chart, Saturn is applying pressure to your
              Mercury. This can manifest as a fear of being misunderstood
              or a tendency toward self-censorship. You feel the weight
              of your words.
            </p>
            <p>
              The remedy is precision. When you describe your internal
              ocean, use the most accurate language possible. Poetry is
              not an escape for you; it is a discipline.
            </p>
          </div>
        </section>

        {/* ── Call to Action ───────────────────────────────────── */}
        <section className="alm-card sample-cta">
          <h2 className="alm-h2">Your own stars await.</h2>
          <p className="sample-cta-text">
            This is approximately 4% of a full Olivia analysis. Your
            complete portrait includes a 40-page natal guide, daily
            personalized transits, and unlimited access to the
            AI Oracle.
          </p>
          <TransitionLink href="/portrait" className="alm-btn">
            Generate My Portrait
          </TransitionLink>
        </section>

        {/* ── Footer / Signature ────────────────────────────────── */}
        <footer className="sample-footer">
          <p className="sample-disclaimer">
            The full version of this reading for Eleanor M. includes 12
            additional sections covering Mars in Aquarius, the
            Venus-Neptune conjunction, and a year-ahead outlook.
          </p>
          <p className="sample-signature">
            <span className="sample-signature-mark" aria-hidden>⁂</span>
            Olivia
            <span className="sample-signature-sub">
              Written for Eleanor M. · Pisces sun · Cancer moon · Scorpio rising · London
            </span>
          </p>

          <div className="sample-final-ctas">
            <TransitionLink href="/academy/card-of-the-day" className="alm-btn">
              ✦ Start with today&rsquo;s card
            </TransitionLink>
            <TransitionLink href="/" className="alm-link">
              &larr; Back to home
            </TransitionLink>
          </div>
        </footer>
      </article>

      <style jsx>{`
        .sample-masthead {
          text-align: center;
          margin-bottom: clamp(3rem, 7vw, 4.5rem);
        }

        .sample-data {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          margin: 1.4rem 0 2rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-variant-numeric: lining-nums tabular-nums;
        }

        .sample-dot {
          color: var(--hairline);
        }

        .sample-summary {
          max-width: 34rem;
          margin: 0 auto;
        }

        .sample-summary p {
          margin: 0;
        }

        .sample-section {
          margin: clamp(2.8rem, 6vw, 4.2rem) 0;
        }

        .sample-numeral {
          color: var(--ox);
          font-weight: 400;
          margin-right: 0.35rem;
        }

        .sample-chart-data {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          margin: 0.9rem 0 1.4rem;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-variant-numeric: lining-nums;
        }

        .sample-chart-sep {
          color: var(--ink-faint);
        }

        .zodiac-glyph {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.85rem;
        }

        .sample-copy p {
          margin: 0 0 1.3rem;
          color: var(--ink-soft);
          font-size: 1.02rem;
          line-height: 1.7;
        }

        .sample-copy p:last-child {
          margin-bottom: 0;
        }

        .sample-visual {
          margin: clamp(3.2rem, 7vw, 4.8rem) auto;
          text-align: center;
          color: var(--ink);
        }

        .sample-relic {
          width: min(19rem, 68vw);
          height: auto;
        }

        .sample-caption {
          display: block;
          margin-top: 1.1rem;
        }

        .sample-caption em {
          font-style: italic;
        }

        .sample-break {
          display: flex;
          align-items: center;
          gap: 1.6rem;
          margin: clamp(3.5rem, 8vw, 5.5rem) 0;
          color: var(--ink-faint);
        }

        .sample-break-rule {
          height: 1px;
          flex: 1;
          background: var(--hairline);
        }

        .sample-break-mark {
          font-size: 0.85rem;
        }

        .sample-cta {
          margin: clamp(3.5rem, 8vw, 5.5rem) 0;
          padding: clamp(2rem, 5vw, 3rem) clamp(1.4rem, 4vw, 2.5rem);
          text-align: center;
        }

        .sample-cta-text {
          max-width: 34rem;
          margin: 1.1rem auto 2rem;
          color: var(--ink-soft);
          line-height: 1.65;
        }

        .sample-footer {
          margin-top: clamp(3.5rem, 8vw, 5.5rem);
          padding-top: clamp(2.4rem, 5vw, 3.5rem);
          border-top: 1px solid var(--hairline);
        }

        .sample-disclaimer {
          margin: 0 0 2.4rem;
          max-width: 32rem;
          color: var(--ink-faint);
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .sample-signature {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin: 0 0 2.6rem;
          color: var(--ink);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          font-style: italic;
        }

        .sample-signature-mark {
          color: var(--ox);
          font-size: 1rem;
          font-style: normal;
        }

        .sample-signature-sub {
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          font-style: normal;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .sample-final-ctas {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.2rem 1.8rem;
        }
      `}</style>
    </AlmanacShell>
  );
}
