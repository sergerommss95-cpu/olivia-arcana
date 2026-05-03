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
import Link from "next/link";

const ROWS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is this actually astrology, or just generic horoscopes?",
    a: (
      <>
        Real astrology. Every reading is calculated from precise astronomical 
        ephemeris data for the exact minute and location of your birth — planets, 
        houses, aspects, and dignities. Nothing is pulled from a pre-written template.
      </>
    ),
  },
  {
    q: "What do I get in a deeper reading?",
    a: (
      <>
        Your free reading shows the &ldquo;Surface Pattern.&rdquo; A deeper resonance 
        unlocks your full natal chart synthesis, personal transit overlays, and 
        unlimited AI Oracle access that remembers your history and connects your 
        questions to your specific planetary cycles.
      </>
    ),
  },
  {
    q: "Is this a prediction?",
    a: (
      <>
        No. We do not provide &ldquo;fortunes&rdquo; or fixed predictions. Astrology 
        is a symbolic language for self-reflection. We show you the celestial 
        weather and the quality of the time, but the decisions and outcomes are 
        always yours.
      </>
    ),
  },
  {
    q: "Is my information private?",
    a: (
      <>
        Yes. Your birth data and Oracle conversations are private to your account. 
        We use secure encryption in transit and at rest. We never sell your data 
        and never share your personal readings with third-party advertisers.
      </>
    ),
  },
  {
    q: "Can I cancel my plan?",
    a: (
      <>
        Yes, you can cancel any time with one click from your billing dashboard. 
        You will retain access until the end of your current period. No hidden fees, 
        no retention calls, and no dark patterns.
      </>
    ),
  },
  {
    q: "Is the free reading still useful?",
    a: (
      <>
        Absolutely. We believe everyone should have access to their basic celestial 
        blueprint. The free tier includes the daily Card of the Day, sun-sign 
        insights, and the first tracks of our Academy. It is built to be helpful, 
        not just a teaser.
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
          Questions asked in advance
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
          Things people want to know before they stay.
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
