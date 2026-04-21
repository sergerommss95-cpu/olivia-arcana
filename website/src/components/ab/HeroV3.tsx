/**
 * HeroV3.tsx — Sprint 3 "come in, it's already happening."
 *
 * Same editorial copy column as HeroV2. The right column is the new
 * LivingPaperCard: card always visible, cursor focus clears the paper,
 * no hold-gate, no redirect, no ceremony. The page just breathes.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import LivingPaperCard from "@/components/shaders/LivingPaperCard";
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

export default function HeroV3() {
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

  useEffect(() => {
    // Record draw when the card changes (including first mount)
    recordDraw(card.name);
  }, [card.name]);

  const handleAdvance = () => {
    const currentIdx = ALL_CARDS.indexOf(card);
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * ALL_CARDS.length);
    } while (nextIdx === currentIdx);
    setCard(ALL_CARDS[nextIdx]);
  };

  return (
    <section
      aria-labelledby="heroV3-headline"
      style={{
        position: "relative",
        minHeight: "100svh",
        padding: "clamp(6rem, 10vw, 8rem) clamp(1.25rem, 6vw, 6rem) clamp(4rem, 8vw, 5rem)",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      <div className="heroV3-grid">
        {/* LEFT — copy column */}
        <div className="heroV3-copy">
          <span className="heroV3-eyebrow">
            <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
            An editorial cosmic almanac
          </span>

          <h1 ref={headRef} id="heroV3-headline" className="heroV3-headline">
            <span data-word style={wordStyle}>Your</span>{" "}
            <span data-word style={wordStyle}>chart,</span>{" "}
            <em style={{ fontStyle: "italic" }}>
              <span data-word style={wordStyle}>read</span>{" "}
              <span data-word style={wordStyle}>for</span>{" "}
              <span data-word style={wordStyle}>you.</span>
            </em>
          </h1>

          <p className="scrim-text heroV3-sub">
            Readings calculated from the exact positions of the planets the
            moment you were born.{" "}
            <em style={{ fontFamily: "var(--font-heading)", color: "rgba(245,240,232,0.98)" }}>
              Not templates
            </em>{" "}
            — real cosmic guidance, written by hand.
          </p>

          <p className="heroV3-prompt" aria-live="polite">
            <span aria-hidden className="heroV3-prompt-glyph">✦</span>
            Today&rsquo;s card is{" "}
            <em>{card.name}</em>
            . <span className="heroV3-prompt-sub">Move your cursor over it to focus.</span>
          </p>

          <div className="heroV3-ctas">
            <MagneticButton variant="gold" href="/sample" size="md">
              ✦ Read a sample reading
            </MagneticButton>
            <Link href="/academy/card-of-the-day" className="heroV3-link">
              Full card ceremony →
            </Link>
          </div>

          <p className="heroV3-trust">
            <span aria-hidden className="heroV3-stars">★★★★★</span>{" "}
            <span className="heroV3-trust-strong">4.9</span> from{" "}
            <span className="heroV3-trust-strong">2,306 subscribers</span>
            <span aria-hidden className="heroV3-dot">·</span>
            Built on{" "}
            <span className="heroV3-trust-strong">real NASA ephemeris data</span>
            <span aria-hidden className="heroV3-dot">·</span>
            <span className="heroV3-trust-strong">12,400+</span> readings given
          </p>
        </div>

        {/* RIGHT — the card, always visible, shader-paper over it */}
        <div className="heroV3-card-slot">
          <LivingPaperCard
            card={card}
            numeral={cardRoman(card)}
            width={360}
            onAdvance={handleAdvance}
          />
        </div>
      </div>

      <style>{`
        .heroV3-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          gap: clamp(2rem, 4vw, 4rem);
          align-items: center;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .heroV3-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 3rem;
          }
        }

        .heroV3-copy {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: clamp(1.25rem, 2.5vw, 2rem);
          max-width: 560px;
        }
        .heroV3-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.78);
          margin: 0;
          animation: v3FadeUp 0.8s ${EASE} 0.2s both;
        }
        .heroV3-headline {
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
        .heroV3-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: clamp(1rem, 1.4vw, 1.14rem);
          line-height: 1.65;
          color: rgba(238, 232, 220, 0.92);
          max-width: 520px;
          margin: 0;
          animation: v3FadeUp 1s ${EASE} 1.2s both;
        }
        .heroV3-prompt {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          line-height: 1.55;
          color: rgba(232, 201, 106, 0.78);
          margin: 0;
          animation: v3FadeUp 1s ${EASE} 1.35s both;
          display: flex;
          align-items: baseline;
          gap: 0.55em;
          flex-wrap: wrap;
        }
        .heroV3-prompt em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.98);
          font-size: 1.15em;
        }
        .heroV3-prompt-glyph {
          color: rgba(232, 201, 106, 0.92);
          font-size: 0.85rem;
        }
        .heroV3-prompt-sub {
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          font-size: 0.88rem;
          font-style: italic;
        }
        .heroV3-ctas {
          display: flex;
          gap: clamp(1rem, 2vw, 1.5rem);
          align-items: center;
          flex-wrap: wrap;
          animation: v3FadeUp 1s ${EASE} 1.5s both;
        }
        .heroV3-link {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          color: rgba(220, 210, 245, 0.78);
          text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.24);
          padding-bottom: 2px;
          transition: color 200ms ${EASE}, border-color 200ms ${EASE};
        }
        .heroV3-link:hover {
          color: rgba(232, 201, 106, 0.95);
          border-color: rgba(232, 201, 106, 0.6);
        }
        .heroV3-link:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        .heroV3-trust {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          max-width: 620px;
          margin: 0;
          line-height: 1.7;
          animation: v3FadeUp 1s ${EASE} 1.75s both;
        }
        .heroV3-stars {
          color: rgba(232, 201, 106, 0.92);
          letter-spacing: 0.05em;
          margin-right: 0.35em;
        }
        .heroV3-trust-strong {
          color: rgba(235, 225, 255, 0.88);
        }
        .heroV3-dot {
          margin: 0 0.5em;
          opacity: 0.5;
        }

        .heroV3-card-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          animation: v3CardSettle 1.2s ${EASE} 0.4s both;
        }

        @keyframes v3FadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes v3CardSettle {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .heroV3-headline [data-word] {
            opacity: 1 !important;
            clip-path: none !important;
          }
          .heroV3-eyebrow, .heroV3-sub, .heroV3-prompt,
          .heroV3-ctas, .heroV3-trust, .heroV3-card-slot {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
