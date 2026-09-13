/**
 * /story — The brand story, set as a chapter of the Personal Almanac.
 *
 * Print register: bone paper, ink, one oxblood accent, hairlines,
 * numbered archival motifs. The former scroll-theatre sections are now
 * a quiet, readable article — headline, contents, philosophy epigraph,
 * numbered principles, and a closing invitation.
 */

"use client";

import React from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";

const SUBTITLES = [
  "Personal readings from your birth chart",
  "Astrology and tarot, translated clearly",
  "Your questions, held with context",
  "Reflective guidance, not fixed predictions",
];

const PRINCIPLES = [
  {
    numeral: "I",
    title: "Chart Context",
    description:
      "Readings begin with your birth details when you share them, so the guidance is not reduced to a generic sun-sign paragraph.",
    glyph: "◎",
  },
  {
    numeral: "II",
    title: "Current Timing",
    description:
      "Transits and moon phases add timing cues, while the reading stays clear that your choices remain yours.",
    glyph: "◑",
  },
  {
    numeral: "III",
    title: "Ritual Ease",
    description:
      "The interface keeps the celestial feeling, but the copy and actions stay direct enough to help you decide what to do next.",
    glyph: "✦",
  },
];

export default function StoryPage() {
  return (
    <AlmanacShell narrow>
      <article className="story">
        {/* ── Chapter head ── */}
        <header className="story-head">
          <p className="alm-kicker">The Story Behind the Stars</p>
          <h1 className="alm-h1">We read the cosmos so you can understand yourself</h1>
          <ol className="story-contents" aria-label="In brief">
            {SUBTITLES.map((line, i) => (
              <li key={line} className="alm-hairline-row">
                <span className="story-contents-no">{["i", "ii", "iii", "iv"][i]}.</span>
                <span className="story-contents-line">{line}</span>
              </li>
            ))}
          </ol>
        </header>

        <div className="story-rule" aria-hidden>
          <span>✦</span>
        </div>

        {/* ── Philosophy ── */}
        <section className="story-philosophy">
          <p>
            Every person brings a different chart, question, and moment in time. Olivia Arcana uses
            that context to make astrology and tarot feel personal without turning mystery into
            noise.
          </p>
        </section>

        <div className="story-rule" aria-hidden>
          <span>✦</span>
        </div>

        {/* ── Principles ── */}
        <section className="story-principles" aria-label="Our Principles">
          <p className="alm-kicker">Our Principles</p>
          <h2 className="alm-h2">What Makes This Different</h2>
          <div className="principle-list">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="principle">
                <p className="principle-no">
                  {p.numeral} <span aria-hidden>{p.glyph}</span>
                </p>
                <div>
                  <h3 className="principle-title">{p.title}</h3>
                  <p className="principle-body">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="story-rule" aria-hidden>
          <span>✦</span>
        </div>

        {/* ── Closing invitation ── */}
        <section className="story-cta">
          <h2 className="alm-h2">Start with one clear question</h2>
          <p className="alm-lead">
            Begin with a free daily card or ask the Oracle when you want a more personal reading.
          </p>
          <div className="story-actions">
            <TransitionLink href="/" className="alm-btn">
              Begin Your Reading
            </TransitionLink>
            <TransitionLink href="/academy" className="alm-link">
              Explore the Academy →
            </TransitionLink>
          </div>
        </section>
      </article>

      <style jsx>{`
        .story {
          padding-bottom: 1rem;
        }

        .story-head {
          padding-top: 0.5rem;
        }

        .story-contents {
          list-style: none;
          margin: 2.2rem 0 0;
          padding: 0;
          border-top: 1px solid var(--hairline);
        }

        .story-contents li {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.75rem 0.2rem;
        }

        .story-contents-no {
          flex: 0 0 2rem;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
        }

        .story-contents-line {
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .story-rule {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin: clamp(2.2rem, 5vw, 3.6rem) 0;
          color: var(--ink-faint);
        }

        .story-rule::before,
        .story-rule::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--hairline);
        }

        .story-rule span {
          font-size: 0.8rem;
        }

        .story-philosophy p {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 400;
          line-height: 1.5;
          color: var(--ink);
          text-wrap: balance;
        }

        .story-principles :global(.alm-h2) {
          margin-top: 0.4rem;
        }

        .principle-list {
          margin-top: 1.8rem;
          border-top: 1px solid var(--hairline);
        }

        .principle {
          display: flex;
          gap: 1.4rem;
          padding: 1.4rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .principle-no {
          flex: 0 0 3.4rem;
          margin: 0.25rem 0 0;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
        }

        .principle-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.35rem;
          font-weight: 500;
          color: var(--ink);
        }

        .principle-body {
          margin: 0.5rem 0 0;
          max-width: 52ch;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.7;
        }

        .story-cta :global(.alm-lead) {
          margin: 1rem 0 0;
          max-width: 48ch;
        }

        .story-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.2rem 1.8rem;
          margin-top: 1.8rem;
        }
      `}</style>
    </AlmanacShell>
  );
}
