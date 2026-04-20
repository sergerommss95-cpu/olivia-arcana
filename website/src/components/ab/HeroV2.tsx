/**
 * HeroV2.tsx — Sprint 3 hero (B side of the A/B).
 *
 * Two-column editorial layout:
 *   LEFT  — eyebrow, italic-emphasized headline, subcopy, gold CTA,
 *           text-link secondary, trust row (same pattern as HeroV1 so
 *           the delta you feel is structural, not cosmetic).
 *   RIGHT — a "veil poster": the day's card hanging behind a
 *           translucent cloth with an animated shimmer. Tapping it
 *           navigates to /academy/card-of-the-day for the full
 *           room-filling ceremony.
 *
 * The poster is a stylized SVG+CSS composition — it's NOT the full
 * Three.js scene (that stays in its protected flagship role). The job
 * here is to signal: "there's a ceremony waiting, it lives here on
 * page 1, not behind a click." If Sprint 3 ships we'll decide whether
 * to swap the poster for a miniaturized version of VeilRevealScene.
 */

"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import MagneticButton from "@/components/MagneticButton";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function getDailyCard(): TarotCard {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear * 2654435761;
  const idx = Math.abs(seed) % ALL_CARDS.length;
  return ALL_CARDS[idx];
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
  const card = getDailyCard();
  const cardImage = getCardImagePath(card);
  const numeral = cardRoman(card);

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
              ✦ Draw today&rsquo;s card
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

        {/* RIGHT — veil poster */}
        <Link
          href="/academy/card-of-the-day"
          className="heroV2-veil"
          aria-label={`Reveal today's card — ${card.name}. Opens the full veil ceremony.`}
        >
          <div className="heroV2-veil-frame">
            {/* Card face — partially visible through the cloth */}
            <div
              className="heroV2-card"
              style={{ backgroundImage: `url(${cardImage})` }}
            />

            {/* The cloth — a layered SVG veil with fabric noise + fold shadows */}
            <svg
              className="heroV2-cloth"
              viewBox="0 0 360 540"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <defs>
                <linearGradient id="veil-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b081e" stopOpacity="0.92" />
                  <stop offset="28%" stopColor="#1a1030" stopOpacity="0.88" />
                  <stop offset="62%" stopColor="#2a1a50" stopOpacity="0.82" />
                  <stop offset="100%" stopColor="#06041a" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="veil-shimmer" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(212,175,55,0)" />
                  <stop offset="45%" stopColor="rgba(232,201,106,0.22)" />
                  <stop offset="55%" stopColor="rgba(232,201,106,0.22)" />
                  <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                </linearGradient>
                <filter id="veil-noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                  <feColorMatrix values="0 0 0 0 0.92  0 0 0 0 0.88  0 0 0 0 1  0 0 0 0.08 0" />
                </filter>
              </defs>

              {/* Base cloth fill */}
              <rect width="360" height="540" fill="url(#veil-grad)" />
              {/* Fabric noise */}
              <rect width="360" height="540" filter="url(#veil-noise)" opacity="0.35" />
              {/* Vertical folds — suggest cloth hanging */}
              <g opacity="0.35">
                <path d="M60 0 L68 540" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
                <path d="M120 0 L130 540" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
                <path d="M182 0 L188 540" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <path d="M240 0 L232 540" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6" />
                <path d="M300 0 L305 540" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
              </g>
              {/* Golden shimmer sweep (animated via CSS) */}
              <rect
                className="heroV2-cloth-shimmer"
                x="-180"
                y="0"
                width="180"
                height="540"
                fill="url(#veil-shimmer)"
                style={{ mixBlendMode: "screen" }}
              />
              {/* Bottom hem */}
              <path d="M0 520 L360 528" stroke="rgba(212,175,55,0.28)" strokeWidth="1" />
            </svg>

            {/* Card badge — peeks out of the top */}
            <div className="heroV2-badge">
              <span className="heroV2-badge-label">Today&rsquo;s card</span>
              <span className="heroV2-badge-name">
                {numeral && <em className="heroV2-numeral">{numeral}.</em>}
                {card.name}
              </span>
            </div>

            {/* Hold-to-reveal prompt at the bottom */}
            <div className="heroV2-prompt">
              <span className="heroV2-prompt-dot" aria-hidden />
              Hold to reveal
              <span className="heroV2-prompt-arrow" aria-hidden>→</span>
            </div>
          </div>
        </Link>
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

        /* ── Veil poster ─────────────────────────────────────────────── */
        .heroV2-veil {
          display: block;
          position: relative;
          width: min(380px, 100%);
          aspect-ratio: 360 / 540;
          margin: 0 auto;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          filter: drop-shadow(0 36px 60px rgba(0, 0, 0, 0.5));
          animation: v2VeilDrop 1s ${EASE} 0.5s both;
          cursor: pointer;
          transform-origin: 50% 15%;
          transition: transform 400ms ${EASE};
        }
        .heroV2-veil:hover {
          transform: rotate(-0.4deg) translateY(-4px);
        }
        .heroV2-veil:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 8px;
          border-radius: 16px;
        }
        .heroV2-veil-frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #06041a;
        }
        .heroV2-card {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-color: #1a0e2e;
          filter: brightness(0.9) saturate(1.08);
        }
        .heroV2-cloth {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .heroV2-cloth-shimmer {
          animation: v2Shimmer 5.5s ${EASE} infinite;
        }
        .heroV2-badge {
          position: absolute;
          top: 1.15rem;
          left: 1.15rem;
          right: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          z-index: 2;
          padding: 0.7rem 1rem;
          border-radius: 10px;
          background: rgba(6, 4, 26, 0.55);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(212, 175, 55, 0.22);
        }
        .heroV2-badge-label {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.85);
        }
        .heroV2-badge-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.15rem;
          font-weight: 500;
          color: rgba(245, 240, 232, 0.96);
          line-height: 1.15;
        }
        .heroV2-numeral {
          font-style: italic;
          color: rgba(232, 201, 106, 0.82);
          margin-right: 0.3em;
        }
        .heroV2-prompt {
          position: absolute;
          left: 50%;
          bottom: 1.15rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.6em;
          padding: 0.55rem 1.1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.7);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232, 201, 106, 0.55);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.95);
          z-index: 2;
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.25);
          animation: v2PromptPulse 3.6s ${EASE} infinite;
        }
        .heroV2-prompt-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(232, 201, 106, 1);
          box-shadow: 0 0 14px rgba(232, 201, 106, 0.95);
        }
        .heroV2-prompt-arrow {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          text-transform: none;
          letter-spacing: 0;
          font-size: 0.85rem;
          color: rgba(232, 201, 106, 0.9);
        }

        /* ── Motion ──────────────────────────────────────────────────── */
        @keyframes v2FadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes v2VeilDrop {
          from { opacity: 0; transform: translateY(-24px) rotate(-0.8deg); }
          to   { opacity: 1; transform: translateY(0) rotate(0); }
        }
        @keyframes v2Shimmer {
          0%   { transform: translateX(0); }
          55%  { transform: translateX(540px); }
          100% { transform: translateX(540px); }
        }
        @keyframes v2PromptPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(212, 175, 55, 0.25); transform: translateX(-50%) translateY(0); }
          50%      { box-shadow: 0 0 34px rgba(212, 175, 55, 0.45); transform: translateX(-50%) translateY(-2px); }
        }

        /* Reduced motion: strip animations, keep everything visible */
        @media (prefers-reduced-motion: reduce) {
          .heroV2-headline [data-word] {
            opacity: 1 !important;
            clip-path: none !important;
          }
          .heroV2-eyebrow,
          .heroV2-sub,
          .heroV2-ctas,
          .heroV2-trust,
          .heroV2-veil {
            animation: none !important;
          }
          .heroV2-cloth-shimmer,
          .heroV2-prompt {
            animation: none !important;
          }
          .heroV2-veil:hover {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
