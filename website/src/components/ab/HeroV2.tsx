/**
 * HeroV2.tsx — Sprint 3 hero (B side of the A/B).
 *
 * Two-column editorial layout:
 *   LEFT  — eyebrow, italic-emphasized headline, subcopy, gold CTA,
 *           text-link secondary, trust row.
 *   RIGHT — the actual interactive veil, mounted INLINE (no redirect).
 *           Uses the same VeilRevealScene that powers the full-screen
 *           ceremony, constrained to a 360×540 card.
 *
 * Gesture: press-and-hold anywhere on the veil to lift it. No
 * navigation — the ceremony happens in place, the card stays revealed
 * for the session, and a "draw another" action lets the user cycle
 * through the deck without leaving the hero.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import InlineVeilReveal from "@/components/veil-reveal/InlineVeilReveal";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";
import { recordDraw } from "@/lib/deck-memory";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function dailyCardIndex(): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear * 2654435761;
  return Math.abs(seed) % ALL_CARDS.length;
}

function cardRoman(card: TarotCard): string {
  if (card.arcana !== "major") return "";
  const n = [
    "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
  ];
  return n[card.number] ?? "";
}

const wordStyle: React.CSSProperties = {
  display: "inline-block",
  opacity: 0,
  marginRight: "0.34em",
  clipPath: "inset(0 0 100% 0)",
};

export default function HeroV2() {
  const headRef = useRef<HTMLHeadingElement>(null);
  const [card, setCard] = useState<TarotCard>(() => ALL_CARDS[dailyCardIndex()]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const words = headRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    words?.forEach((w, i) => {
      w.animate(
        [
          { opacity: "0", transform: "translateY(22px)", clipPath: "inset(0 0 100% 0)" },
          { opacity: "1", transform: "translateY(0)", clipPath: "inset(0 0 0% 0)" },
        ],
        { duration: 900, delay: 320 + i * 120, easing: EASE, fill: "forwards" }
      );
    });
  }, []);

  const handleRevealComplete = () => {
    recordDraw(card.name);
  };

  const handleDrawAnother = () => {
    const currentIdx = ALL_CARDS.indexOf(card);
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * ALL_CARDS.length);
    } while (nextIdx === currentIdx);
    setCard(ALL_CARDS[nextIdx]);
  };

  return (
    <section
      className="heroV2"
      aria-labelledby="heroV2-headline"
      style={{
        position: "relative",
        minHeight: "100svh",
        padding: "clamp(6rem, 10vw, 8rem) clamp(1.25rem, 6vw, 6rem) clamp(4rem, 8vw, 5rem)",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <div className="heroV2-grid">
        {/* LEFT — copy column */}
        <div className="heroV2-copy">
          <span className="heroV2-eyebrow">
            <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
            An editorial cosmic almanac
          </span>

          <h1 ref={headRef} id="heroV2-headline" className="heroV2-headline">
            <span data-word style={wordStyle}>Your</span>{" "}
            <span data-word style={wordStyle}>chart,</span>{" "}
            <em style={{ fontStyle: "italic" }}>
              <span data-word style={wordStyle}>read</span>{" "}
              <span data-word style={wordStyle}>for</span>{" "}
              <span data-word style={wordStyle}>you.</span>
            </em>
          </h1>

          <p className="scrim-text heroV2-sub">
            Readings calculated from the exact positions of the planets the
            moment you were born.{" "}
            <em style={{ fontFamily: "var(--font-heading)", color: "rgba(245,240,232,0.98)" }}>
              Not templates
            </em>{" "}
            — real cosmic guidance, written by hand.
          </p>

          <div className="heroV2-ctas">
            <MagneticButton variant="gold" href="/academy/card-of-the-day" size="md">
              ✦ Full-screen card ceremony
            </MagneticButton>
            <Link href="/sample" className="heroV2-link">
              See a sample reading
            </Link>
          </div>

          <p className="heroV2-trust">
            <span aria-hidden className="heroV2-stars">★★★★★</span>{" "}
            <span className="heroV2-trust-strong">4.9</span> from{" "}
            <span className="heroV2-trust-strong">2,306 subscribers</span>
            <span aria-hidden className="heroV2-dot">·</span>
            Built on{" "}
            <span className="heroV2-trust-strong">real NASA ephemeris data</span>
            <span aria-hidden className="heroV2-dot">·</span>
            <span className="heroV2-trust-strong">12,400+</span> readings given
          </p>
        </div>

        {/* RIGHT — the actual veil, in place */}
        <div className="heroV2-veil-slot">
          <InlineVeilReveal
            card={card}
            numeral={cardRoman(card)}
            onRevealComplete={handleRevealComplete}
            onDrawAgain={handleDrawAnother}
            width={360}
            height={540}
          />
        </div>
      </div>

      <style>{`
        .heroV2-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          gap: clamp(2rem, 4vw, 4rem);
          align-items: center;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .heroV2-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 3rem;
          }
        }

        /* ── Copy column ─────────────────────────────────────────────── */
        .heroV2-copy {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: clamp(1.5rem, 3vw, 2.25rem);
          max-width: 560px;
        }
        .heroV2-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.78);
          margin: 0;
          animation: v2FadeUp 0.8s ${EASE} 0.2s both;
        }
        .heroV2-headline {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 400;
          font-style: normal;
          font-size: clamp(2.6rem, 5.6vw, 4.8rem);
          line-height: 1.02;
          letter-spacing: 0;
          word-spacing: 0.15em;
          color: #F5F0E8;
          margin: 0;
          text-shadow: 0 2px 24px rgba(4, 2, 13, 0.55);
        }
        .heroV2-sub {
          position: relative;
          z-index: 2;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: clamp(1rem, 1.4vw, 1.14rem);
          line-height: 1.65;
          color: rgba(238, 232, 220, 0.92);
          max-width: 520px;
          margin: 0;
          animation: v2FadeUp 1s ${EASE} 1.2s both;
        }
        .heroV2-ctas {
          display: flex;
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: center;
          flex-wrap: wrap;
          margin-top: clamp(0.5rem, 1vw, 1rem);
          animation: v2FadeUp 1s ${EASE} 1.45s both;
        }
        .heroV2-link {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          color: rgba(220, 210, 245, 0.78);
          text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.24);
          padding-bottom: 2px;
          transition: color 200ms ${EASE}, border-color 200ms ${EASE};
        }
        .heroV2-link:hover {
          color: rgba(232, 201, 106, 0.95);
          border-color: rgba(232, 201, 106, 0.6);
        }
        .heroV2-link:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        .heroV2-trust {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          max-width: 620px;
          margin: 0;
          line-height: 1.7;
          animation: v2FadeUp 1s ${EASE} 1.7s both;
        }
        .heroV2-stars {
          color: rgba(232, 201, 106, 0.92);
          letter-spacing: 0.05em;
          margin-right: 0.35em;
        }
        .heroV2-trust-strong {
          color: rgba(235, 225, 255, 0.88);
        }
        .heroV2-dot {
          margin: 0 0.5em;
          opacity: 0.5;
        }

        /* ── Veil slot ────────────────────────────────────────────── */
        .heroV2-veil-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: v2VeilDrop 1s ${EASE} 0.5s both;
        }

        /* ── Motion ──────────────────────────────────────────────────── */
        @keyframes v2FadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes v2VeilDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .heroV2-headline [data-word] {
            opacity: 1 !important;
            clip-path: none !important;
          }
          .heroV2-eyebrow,
          .heroV2-sub,
          .heroV2-ctas,
          .heroV2-trust,
          .heroV2-veil-slot {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
