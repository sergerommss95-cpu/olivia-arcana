/**
 * Faq.tsx — homepage FAQ section
 *
 * Six <details> rows, plus-to-x toggle glyph that rotates 45° on [open].
 * Italic Cormorant 1.2rem summary, body copy in DM Sans.
 *
 * Uses native <details>/<summary> for zero-JS keyboard accessibility:
 * space/enter toggles, focus ring inherits from globals.css.
 */

"use client";

import React from "react";

const ROWS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is this actually astrology, or just generic horoscopes?",
    a: (
      <>
        It uses your birth data when you provide it, then reads chart patterns,
        current timing, and tarot symbols together. It is reflective guidance,
        not a fixed prediction.
      </>
    ),
  },
  {
    q: "What is free?",
    a: (
      <>
        You can start with the Card of the Day, basic chart context, starter
        lessons, and a few Oracle questions. No payment is required to try it.
      </>
    ),
  },
  {
    q: "What changes when I pay?",
    a: (
      <>
        Paid plans add more Oracle questions, fuller natal chart readings,
        compatibility, transit timing, deeper tarot spreads, and saved context
        depending on the plan you choose.
      </>
    ),
  },
  {
    q: "Is this a prediction?",
    a: (
      <>
        No. Olivia Arcana does not promise outcomes or tell you what must happen.
        The readings are symbolic prompts for self-reflection and decision-making.
      </>
    ),
  },
  {
    q: "Is my information private?",
    a: (
      <>
        Your birth data and Oracle conversations stay private to your account.
        We do not sell your personal readings to advertisers.
      </>
    ),
  },
  {
    q: "Can I cancel my plan?",
    a: (
      <>
        Yes. You can cancel from your billing dashboard and keep access until
        the end of the current billing period.
      </>
    ),
  },
];

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      style={{
        padding: "clamp(4rem, 9vw, 7rem) clamp(1.25rem, 6vw, 6rem)",
        maxWidth: "820px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "clamp(2.5rem, 5vw, 4rem)" }}>
        <p
          className="readable-label"
          style={{
            fontSize: "0.72rem",
            color: "var(--c-gold)",
            opacity: 1,
            marginBottom: "1rem",
          }}
        >
          <span aria-hidden style={{ marginRight: "0.6em" }}>✦</span>
          Questions before you start
        </p>
        <h2
          id="faq-heading"
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontSize: "clamp(2.2rem, 4.4vw, 3.2rem)",
            fontWeight: 500,
            fontStyle: "italic",
            color: "#f5f2e1",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-0.01em"
          }}
        >
          Simple answers before you choose.
        </h2>
      </div>

      <div role="list">
        {ROWS.map((row, i) => (
          <details key={i} role="listitem" className="faq-row">
            <summary className="hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded-lg">
              <span className="faq-q">{row.q}</span>
              <span aria-hidden className="faq-plus">+</span>
            </summary>
            <div className="faq-a readable-secondary text-scrim">{row.a}</div>
          </details>
        ))}
      </div>

      <style>{`
        .faq-row {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem 0.25rem;
        }
        .faq-row:last-of-type {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .faq-row summary {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          cursor: pointer;
          min-height: 48px;
        }
        .faq-row summary::-webkit-details-marker {
          display: none;
        }
        .faq-q {
          font-family: var(--font-heading, 'Cormorant Garamond'), serif;
          font-style: italic;
          font-weight: 600;
          font-size: 1.35rem;
          line-height: 1.35;
          color: #f5f2e1;
          letter-spacing: 0.01em;
        }
        .faq-plus {
          flex: 0 0 auto;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.6rem;
          font-weight: 300;
          color: var(--c-gold);
          line-height: 1;
          transform: rotate(0deg);
          transition: transform 300ms ${EASE}, color 200ms ${EASE};
          will-change: transform;
        }
        .faq-row[open] .faq-plus {
          transform: rotate(45deg); /* plus → x */
          color: #fff;
        }
        .faq-a {
          margin-top: 1.25rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.05rem;
          line-height: 1.65;
          max-width: 65ch;
          padding-bottom: 0.5rem;
        }
        .faq-row summary:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 4px;
        }
        @media (hover: hover) {
          .faq-row summary:hover .faq-q {
            color: rgba(245, 240, 232, 1);
          }
          .faq-row summary:hover .faq-plus {
            color: rgba(255, 215, 130, 1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .faq-plus {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
