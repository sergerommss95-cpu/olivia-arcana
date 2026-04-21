/**
 * HeroV3.tsx — Sprint 3 hero with a card-shader variant picker.
 *
 * The copy column is identical across variants. The right column
 * swaps between four card-shader implementations so the owner can
 * A/B/C/D-compare them in one session:
 *
 *   Paper    — gold-ink living page over the card (ambient)
 *   Caustics — candlelight caustics across the card (ambient)
 *   Smoke    — smoke cover, hold to dissipate (ceremony)
 *   Edge     — card untouched, aurora ring around it (conservative)
 *
 * The variant choice is local state; persists in sessionStorage so
 * refresh keeps your pick. Default is Caustics (my recommendation).
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import FlipRevealCard from "@/components/shaders/FlipRevealCard";
import LivingPaperCard from "@/components/shaders/LivingPaperCard";
import CausticsCard from "@/components/shaders/CausticsCard";
import SmokeRevealCard from "@/components/shaders/SmokeRevealCard";
import EdgeLitCard from "@/components/shaders/EdgeLitCard";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";
import { recordDraw } from "@/lib/deck-memory";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Variant = "curtain" | "paper" | "caustics" | "smoke" | "edge";

const VARIANT_LABELS: Record<Variant, string> = {
  curtain: "Flip",
  caustics: "Caustics",
  paper: "Paper",
  smoke: "Smoke",
  edge: "Edge",
};

const VARIANT_BLURBS: Record<Variant, string> = {
  curtain: "Today's card sits face-down. Tap to flip it — the card rotates on its axis and reveals itself.",
  caustics: "Candlelight across a card on a reading table. Cursor shifts the light.",
  paper: "Gold-ink paper drifts over the card. Cursor clears it locally.",
  smoke: "Smoke covers the card. Press and hold to dissipate it.",
  edge: "Card untouched. An aurora ribbon plays around its edges.",
};

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
  const [variant, setVariant] = useState<Variant>("curtain");

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

  const cardProps = {
    card,
    numeral: cardRoman(card),
    width: 360,
    onAdvance: handleAdvance,
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
            Today&rsquo;s card is <em>{card.name}</em>.
            <span className="heroV3-prompt-sub"> {VARIANT_BLURBS[variant]}</span>
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

        {/* RIGHT — the card */}
        <div className="heroV3-card-slot">
          {/* Active card. Each component has its own key so only that one
              mounts/unmounts when the variant changes (no wrapper-div
              remount → smoother switch). */}
          <div className="heroV3-card-wrap">
            {variant === "curtain"  && <FlipRevealCard    key="curtain"  {...cardProps} />}
            {variant === "paper"    && <LivingPaperCard   key="paper"    {...cardProps} />}
            {variant === "caustics" && <CausticsCard      key="caustics" {...cardProps} />}
            {variant === "smoke"    && <SmokeRevealCard   key="smoke"    {...cardProps} />}
            {variant === "edge"     && <EdgeLitCard       key="edge"     {...cardProps} />}
          </div>
        </div>
      </div>

      {/* Variant picker — mounted OUTSIDE the hero grid, centered above
          the layout so it's never obscured by any card component's
          visual overflow (e.g. EdgeLit's aurora ring). */}
      <div className="heroV3-picker-bar">
        <div className="heroV3-picker" role="tablist" aria-label="Card shader variant">
          <span className="heroV3-picker-eyebrow" aria-hidden>Shader</span>
          <div className="heroV3-picker-cells">
            {(Object.keys(VARIANT_LABELS) as Variant[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`heroV3-picker-cell${v === variant ? " heroV3-picker-cell-active" : ""}`}
                onClick={() => setVariant(v)}
                role="tab"
                aria-selected={v === variant}
                title={VARIANT_BLURBS[v]}
              >
                {VARIANT_LABELS[v]}
              </button>
            ))}
          </div>
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
          .heroV3-grid { grid-template-columns: minmax(0, 1fr); gap: 3rem; }
        }

        .heroV3-copy {
          display: grid; grid-template-columns: minmax(0, 1fr);
          gap: clamp(1.25rem, 2.5vw, 2rem);
          max-width: 560px;
        }
        .heroV3-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem; font-weight: 500; letter-spacing: 0.28em;
          text-transform: uppercase; color: rgba(232, 201, 106, 0.78);
          margin: 0; animation: v3FadeUp 0.8s ${EASE} 0.2s both;
        }
        .heroV3-headline {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 400; font-style: normal;
          font-size: clamp(2.6rem, 5.6vw, 4.8rem);
          line-height: 1.02; letter-spacing: 0; word-spacing: 0.15em;
          color: #F5F0E8; margin: 0;
          text-shadow: 0 2px 24px rgba(4, 2, 13, 0.55);
        }
        .heroV3-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: clamp(1rem, 1.4vw, 1.14rem);
          line-height: 1.65; color: rgba(238, 232, 220, 0.92);
          max-width: 520px; margin: 0;
          animation: v3FadeUp 1s ${EASE} 1.2s both;
        }
        .heroV3-prompt {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem; line-height: 1.55;
          color: rgba(232, 201, 106, 0.78);
          margin: 0; animation: v3FadeUp 1s ${EASE} 1.35s both;
          display: flex; align-items: baseline; gap: 0.55em; flex-wrap: wrap;
        }
        .heroV3-prompt em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic; color: rgba(245, 240, 232, 0.98);
          font-size: 1.15em;
        }
        .heroV3-prompt-glyph { color: rgba(232, 201, 106, 0.92); font-size: 0.85rem; }
        .heroV3-prompt-sub {
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          font-size: 0.88rem; font-style: italic;
          width: 100%;
        }
        .heroV3-ctas {
          display: flex; gap: clamp(1rem, 2vw, 1.5rem);
          align-items: center; flex-wrap: wrap;
          animation: v3FadeUp 1s ${EASE} 1.5s both;
        }
        .heroV3-link {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem; color: rgba(220, 210, 245, 0.78);
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
          outline: 2px solid #E8C96A; outline-offset: 4px; border-radius: 3px;
        }
        .heroV3-trust {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem; color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          max-width: 620px; margin: 0; line-height: 1.7;
          animation: v3FadeUp 1s ${EASE} 1.75s both;
        }
        .heroV3-stars { color: rgba(232, 201, 106, 0.92); letter-spacing: 0.05em; margin-right: 0.35em; }
        .heroV3-trust-strong { color: rgba(235, 225, 255, 0.88); }
        .heroV3-dot { margin: 0 0.5em; opacity: 0.5; }

        .heroV3-card-slot {
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          animation: v3CardSettle 1.2s ${EASE} 0.4s both;
        }
        .heroV3-card-wrap {
          width: 100%; display: flex; justify-content: center;
        }

        /* Picker bar — sits OUTSIDE the hero grid, above the layout.
           Sticky-top positioning keeps it accessible as the hero
           scrolls too; high z-index so no card overflow can cover it. */
        .heroV3-picker-bar {
          position: sticky;
          top: calc(var(--nav-height, 5rem) + 0.5rem);
          z-index: 40;
          display: flex;
          justify-content: center;
          padding: 0 1rem;
          margin-top: -2rem;
          pointer-events: none; /* bar itself is transparent; only picker inside is interactive */
        }
        .heroV3-picker {
          pointer-events: auto;
          display: inline-flex; align-items: center; gap: 0.55rem;
          padding: 0.35rem 0.55rem; border-radius: 9999px;
          background: rgba(6, 4, 26, 0.82);
          -webkit-backdrop-filter: blur(14px) saturate(1.3);
          backdrop-filter: blur(14px) saturate(1.3);
          border: 1px solid rgba(232, 201, 106, 0.28);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 0 20px rgba(212, 175, 55, 0.1);
        }
        .heroV3-picker-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem; font-weight: 600; letter-spacing: 0.24em;
          text-transform: uppercase; color: rgba(232, 201, 106, 0.8);
          padding-left: 0.25rem;
        }
        .heroV3-picker-cells {
          display: inline-flex; gap: 0.15rem;
          padding: 0.12rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(200, 185, 255, 0.08);
        }
        .heroV3-picker-cell {
          position: relative; /* make sure no stacking surprises */
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.74rem; font-weight: 500;
          letter-spacing: 0.08em;
          padding: 0.4rem 0.85rem;
          border-radius: 9999px;
          background: transparent; border: none;
          color: rgba(220, 210, 245, 0.7);
          cursor: pointer;
          transition: background 180ms ${EASE}, color 180ms ${EASE};
          /* ensure the button's click-zone is well-defined */
          min-height: 32px;
        }
        .heroV3-picker-cell:hover {
          color: rgba(245, 240, 232, 1);
          background: rgba(255, 255, 255, 0.06);
        }
        .heroV3-picker-cell-active {
          background: linear-gradient(135deg, #E8C96A, #D4AF37);
          color: var(--c-void, #06041a);
          font-weight: 600;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.45);
        }
        .heroV3-picker-cell:focus-visible {
          outline: 2px solid #E8C96A; outline-offset: 2px;
        }

        @media (max-width: 520px) {
          .heroV3-picker { gap: 0.4rem; padding: 0.3rem 0.4rem; }
          .heroV3-picker-eyebrow { display: none; }
          .heroV3-picker-cell { padding: 0.35rem 0.6rem; font-size: 0.68rem; }
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
            opacity: 1 !important; clip-path: none !important;
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
