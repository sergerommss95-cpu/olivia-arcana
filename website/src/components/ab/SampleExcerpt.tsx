/**
 * SampleExcerpt.tsx — typeset preview of /sample on the homepage.
 *
 * The point of this section is to show the reader what a reading
 * actually looks like — not describe it, show it. Typography is the
 * product. Restrained marginalia (sidenotes, drop cap, small caps
 * quote attribution) signal editorial care.
 *
 * Excerpt is clipped with a soft fade at the bottom + a "Read the full
 * reading →" CTA linking to /sample. That page contains the same
 * content, fully typeset, signed.
 */

"use client";

import React from "react";
import Link from "next/link";

export default function SampleExcerpt() {
  return (
    <section
      aria-labelledby="sample-excerpt-heading"
      style={{
        padding: "clamp(5rem, 10vw, 9rem) clamp(1.25rem, 6vw, 6rem)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="sx-wrap">
        {/* Eyebrow + headline */}
        <div className="sx-head">
          <p className="sx-eyebrow">
            <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
            A reading, worked end to end
          </p>
          <h2 id="sample-excerpt-heading" className="sx-headline">
            What you get, <em>word by word.</em>
          </h2>
          <p className="sx-sub">
            This is an excerpt from a full natal reading for Eleanor —
            Pisces sun, March 14 1994, 3:47am, Edinburgh. Typeset,
            handwritten, signed.
          </p>
        </div>

        {/* Reading card */}
        <article className="sx-card" aria-label="Reading excerpt">
          <header className="sx-card-head">
            <div className="sx-subject">
              <span className="sx-subject-label">For</span>
              <span className="sx-subject-name">Eleanor M.</span>
            </div>
            <div className="sx-natal">
              <span>14.03.1994</span>
              <span aria-hidden className="sx-dot">·</span>
              <span>03:47 <span className="sx-asc">GMT</span></span>
              <span aria-hidden className="sx-dot">·</span>
              <span>Edinburgh</span>
            </div>
          </header>

          <div className="sx-body">
            <h3 className="sx-section-title">
              <span className="sx-section-numeral">I.</span>
              Your Sun in Pisces, 12th house
            </h3>

            <p>
              <span className="sx-drop">E</span>leanor, you were born with
              the Sun in its most private room — the twelfth house, the
              chamber behind the chamber, the place astrologers
              traditionally call the house of what we do not see
              ourselves doing. In Pisces, too, the water sign most
              inclined to lose its own edges. This is a specific kind of
              beginning.
            </p>

            <p>
              What it does <em>not</em> mean: that you&rsquo;re destined
              for monastic withdrawal, or that your contribution to the
              world will go unseen. Those are the horoscope-column
              readings of a Pisces twelfth, and they&rsquo;re too easy.
              What it <em>does</em> mean is that your identity does
              genuinely belong to something larger than the body you
              occupy, and you&rsquo;ve known this since before you could
              say it.
            </p>

            <p>
              There is a <em>specific</em> consequence: you will feel
              most yourself when you are making things for others and
              taking very little credit for it. Not because you&rsquo;re
              self-effacing — plenty of Pisces suns are self-effacing
              for the wrong reasons — but because the signature of this
              placement is a solved kind of anonymity. You ghost-write,
              you produce, you hand-tune, you edit, you caretake.
              You&rsquo;re the reason something works, and the <em>last
              thing</em> you want is for anyone to stop and point to
              you doing it.
            </p>

            <aside className="sx-sidenote" aria-hidden>
              <span className="sx-sidenote-mark">✦</span>
              <span>
                <strong>Sun in 12th.</strong> The placement favors
                vocations with privacy of execution: writing, therapy,
                archival work, midwifery, night-shift ICU.
              </span>
            </aside>
          </div>

          <div className="sx-fade" aria-hidden />

          <Link href="/sample" className="sx-cta">
            Read the full reading ({"\u00A0"}~2,000 words{"\u00A0"})
            <span aria-hidden className="sx-cta-arrow">→</span>
          </Link>
        </article>
      </div>

      <style>{`
        .sx-wrap {
          max-width: 840px;
          margin: 0 auto;
        }
        .sx-head {
          text-align: center;
          margin-bottom: clamp(2.5rem, 5vw, 4rem);
          display: grid;
          gap: 0.75rem;
        }
        .sx-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.78);
          margin: 0;
        }
        .sx-headline {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2rem, 4.4vw, 2.9rem);
          font-weight: 500;
          color: rgba(245, 240, 232, 0.98);
          margin: 0;
          line-height: 1.1;
        }
        .sx-headline em {
          font-style: italic;
          color: rgba(232, 201, 106, 0.95);
        }
        .sx-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.8));
          max-width: 560px;
          margin: 0 auto;
        }

        /* ── Reading card ─────────────────────────────────────────── */
        .sx-card {
          position: relative;
          background: rgba(11, 8, 30, 0.7);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          backdrop-filter: blur(20px) saturate(1.2);
          border: 1px solid rgba(200, 185, 255, 0.1);
          border-radius: 1.5rem;
          padding: clamp(2rem, 4vw, 3.5rem);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          overflow: hidden;
        }
        .sx-card-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(200, 185, 255, 0.12);
        }
        .sx-subject {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .sx-subject-label {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.6));
        }
        .sx-subject-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.5rem;
          color: rgba(245, 240, 232, 0.98);
        }
        .sx-natal {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.4em;
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.8));
        }
        .sx-dot { opacity: 0.5; }
        .sx-asc {
          color: var(--c-text-muted, rgba(190, 180, 225, 0.6));
          font-size: 0.62rem;
        }

        .sx-body {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.05rem;
          line-height: 1.8;
          color: rgba(238, 232, 220, 0.9);
          max-width: 62ch;
          position: relative;
        }
        .sx-body p + p {
          margin-top: 1.2rem;
        }
        .sx-body em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.98);
          font-size: 1.08em;
          padding: 0 0.04em;
        }
        .sx-section-title {
          display: flex;
          align-items: baseline;
          gap: 0.6em;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-style: italic;
          font-size: clamp(1.25rem, 2.2vw, 1.6rem);
          color: rgba(232, 201, 106, 0.95);
          margin: 0 0 1.5rem;
          line-height: 1.2;
        }
        .sx-section-numeral {
          font-size: 0.88em;
          color: rgba(232, 201, 106, 0.7);
          font-style: normal;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
        }
        .sx-drop {
          float: left;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 3.8rem;
          line-height: 0.86;
          color: rgba(232, 201, 106, 0.92);
          padding: 0.1rem 0.35rem 0 0;
          margin-top: 0.1rem;
        }

        /* ── Sidenote — appears right-aligned on wide, inline on narrow ─ */
        .sx-sidenote {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem;
          line-height: 1.6;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.8));
          border-left: 1px solid rgba(232, 201, 106, 0.35);
          padding: 0.5rem 0 0.5rem 1rem;
          margin: 1.5rem 0 0;
          display: flex;
          gap: 0.7rem;
          align-items: flex-start;
        }
        .sx-sidenote strong {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          color: rgba(232, 201, 106, 0.9);
          margin-right: 0.3em;
        }
        .sx-sidenote-mark {
          color: rgba(232, 201, 106, 0.8);
          font-size: 0.85rem;
          line-height: 1.3;
        }

        /* Fade to void at the bottom of the excerpt */
        .sx-fade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 60px;
          height: 140px;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(11, 8, 30, 0), rgba(11, 8, 30, 1));
        }

        .sx-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          margin-top: 2.5rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.15rem;
          color: rgba(232, 201, 106, 0.95);
          text-decoration: none;
          border-bottom: 1px solid rgba(232, 201, 106, 0.42);
          padding-bottom: 3px;
          transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 2;
        }
        .sx-cta:hover {
          color: rgba(255, 230, 150, 1);
          border-color: rgba(255, 230, 150, 0.7);
        }
        .sx-cta:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        .sx-cta-arrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-style: normal;
        }

        @media (max-width: 620px) {
          .sx-drop {
            font-size: 3rem;
          }
          .sx-body {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
