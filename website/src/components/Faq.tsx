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
        Real astrology. Every reading is calculated from NASA ephemeris data
        for the exact minute and location of your birth — planets, houses,
        aspects, dignities, the full chart. Nothing is pulled from a
        pre-written template.
      </>
    ),
  },
  {
    q: "Do I need to know my birth time?",
    a: (
      <>
        You&rsquo;ll get the most accurate reading with birth time down to the
        hour. Without it, your Sun, Moon, and planetary placements are still
        correct — only the houses and rising sign are unknown. We&rsquo;ll
        note the uncertainty in your portrait and skip claims we can&rsquo;t
        stand behind.
      </>
    ),
  },
  {
    q: "What\u2019s on each plan?",
    a: (
      <>
        Four tiers. <strong>Free</strong> ($0){" "}{"\u2014"} daily Card of the Day,
        basic sun-sign profile, first 12 academy lessons.{" "}
        <strong>Insight</strong> ($4.99/mo){" "}{"\u2014"} personalized daily horoscope
        from your chart, full natal breakdown, 30 oracle questions a month.{" "}
        <strong>Premium</strong> ($14.99/mo){" "}{"\u2014"} unlimited oracle, synastry,
        year-ahead forecast, full 207-lesson academy, weekly audio briefing.{" "}
        <strong>VIP</strong> ($34.99/mo){" "}{"\u2014"} voice readings, monthly video
        reading, priority human astrologer line. See the{" "}
        <a href="/#pricing" style={{ color: "var(--c-gold, #D4AF37)" }}>
          full feature matrix
        </a>{" "}
        for the side-by-side.
      </>
    ),
  },
  {
    q: "Is the AI oracle just ChatGPT with a costume?",
    a: (
      <>
        No. The oracle is given your actual chart data as context — current
        transits, natal placements, aspects — so answers are grounded in your
        astrology, not vibes. If it can&rsquo;t answer from the chart, it
        says so instead of making things up.
      </>
    ),
  },
  {
    q: "How do cancellations and refunds work?",
    a: (
      <>
        Cancel any time from{" "}
        <a href="/account/billing" style={{ color: "var(--c-gold, #D4AF37)" }}>
          Account &rarr; Billing
        </a>
        . Your tier stays active until the end of the current billing period.
        Within 14 days of your first charge you can request a full refund —{" "}
        <a href="/refund" style={{ color: "var(--c-gold, #D4AF37)" }}>
          refund policy
        </a>
        . Web payments are billed by Paddle (Merchant of Record); in-Telegram
        purchases use Stars. No retention calls, no dark patterns.
      </>
    ),
  },
  {
    q: "What about my data?",
    a: (
      <>
        Your birth data lives in your account and is used only to generate
        your readings. We never sell it and never share it with advertisers.
        You can export or permanently delete everything from your profile
        page.
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
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.72rem",
            fontWeight: 500,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(232, 201, 106, 0.78)",
            margin: 0,
            marginBottom: "0.75rem",
          }}
        >
          <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
          Questions asked in advance
        </p>
        <h2
          id="faq-heading"
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontSize: "clamp(2rem, 4.4vw, 2.9rem)",
            fontWeight: 500,
            fontStyle: "italic",
            color: "var(--c-text-primary, #F5F0E8)",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          Things people want to know before they stay.
        </h2>
      </div>

      <div role="list">
        {ROWS.map((row, i) => (
          <details key={i} role="listitem" className="faq-row">
            <summary>
              <span className="faq-q">{row.q}</span>
              <span aria-hidden className="faq-plus">+</span>
            </summary>
            <div className="faq-a">{row.a}</div>
          </details>
        ))}
      </div>

      <style>{`
        .faq-row {
          border-top: 1px solid var(--c-border, rgba(200,185,255,0.10));
          padding: 1.25rem 0.25rem;
        }
        .faq-row:last-of-type {
          border-bottom: 1px solid var(--c-border, rgba(200,185,255,0.10));
        }
        .faq-row summary {
          list-style: none;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1.5rem;
          cursor: pointer;
          padding: 0.25rem 0;
          min-height: 44px;
        }
        .faq-row summary::-webkit-details-marker {
          display: none;
        }
        .faq-q {
          font-family: var(--font-heading, 'Cormorant Garamond'), serif;
          font-style: italic;
          font-weight: 500;
          font-size: 1.2rem;
          line-height: 1.35;
          color: var(--c-text-primary, #F5F0E8);
          letter-spacing: 0.002em;
        }
        .faq-plus {
          flex: 0 0 auto;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.4rem;
          font-weight: 300;
          color: rgba(232, 201, 106, 0.85);
          line-height: 1;
          transform: rotate(0deg);
          transition: transform 300ms ${EASE}, color 200ms ${EASE};
          will-change: transform;
        }
        .faq-row[open] .faq-plus {
          transform: rotate(45deg); /* plus → x */
          color: rgba(232, 201, 106, 1);
        }
        .faq-a {
          margin-top: 0.9rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.98rem;
          line-height: 1.7;
          color: var(--c-text-mid, rgba(196,185,228,0.85));
          max-width: 62ch;
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
