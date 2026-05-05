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
import { useLocale } from "../lib/i18n/useLocale";
import { type Translations } from "../lib/i18n/translations";

export default function Faq() {
  const { t } = useLocale();

  const ROWS = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
    { q: t("faq_q5"), a: t("faq_a5") },
    { q: t("faq_q6"), a: t("faq_a6") },
  ];

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      style={{
        padding: "clamp(6rem, 12vw, 10rem) clamp(1.5rem, 6vw, 6rem)",
        maxWidth: "860px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
        <p
          className="readable-label"
          style={{
            fontSize: "0.7rem",
            color: "var(--c-gold)",
            opacity: 1,
            marginBottom: "1.2rem",
            letterSpacing: "0.4em"
          }}
        >
          <span aria-hidden style={{ marginRight: "0.8em" }}>✦</span>
          {t("faq_eyebrow")}
        </p>
        <h2
          id="faq-heading"
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#f5f2e1",
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "-0.02em"
          }}
        >
          {t("faq_title")}
        </h2>
      </div>

      <div role="list">
        {ROWS.map((row, i) => (
          <details key={i} role="listitem" className="faq-row group">
            <summary className="hover:bg-white/[0.03] transition-all duration-500 px-4 -mx-4 rounded-xl">
              <span className="faq-q">{row.q}</span>
              <span aria-hidden className="faq-plus">✦</span>
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
          font-size: 1.2rem;
          font-weight: 300;
          color: var(--c-gold);
          line-height: 1;
          transform: rotate(0deg) scale(0.8);
          transition: all 400ms ${EASE};
          will-change: transform;
          opacity: 0.4;
        }
        .faq-row[open] .faq-plus {
          transform: rotate(180deg) scale(1.1);
          color: #fff;
          opacity: 1;
        }
        .group:hover .faq-plus {
          opacity: 0.8;
          transform: scale(1);
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
