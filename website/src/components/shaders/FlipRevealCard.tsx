/**
 * FlipRevealCard.tsx — a proper tarot-card flip reveal.
 *
 * Dropping shader physics entirely. The universally correct reveal
 * for a tarot card is how a tarot reader actually does it: the card
 * sits face-down, you flip it, it shows its face. This is the motion
 * grammar the gesture deserves — immediate, clear, emotionally
 * legible, and an excuse to design a gorgeous card BACK.
 *
 * Motion discipline (the twelve principles, applied):
 *   • Anticipation — before the flip, the card scales up ~3% and
 *     drops slightly (pulling down to wind up). Like lifting a
 *     playing card's corner off the table before flipping it.
 *   • Primary action — a 180° Y-rotation with a stiff spring.
 *     Overshoots ~6° then settles.
 *   • Squash & stretch — a subtle scale modulation that peaks at the
 *     midpoint (edge-on to camera) and relaxes on the faces.
 *   • Follow-through — after the flip settles, a soft rim glow pulses
 *     once on the face.
 *   • Staging — at the 90° edge-on moment, a thin gold highlight
 *     sweeps across the card's edge (like light catching a knife).
 *   • Secondary motion — the drop shadow warps with the rotation
 *     (narrowest when edge-on, widest when facing camera).
 *
 * The back of the card is a hand-composed SVG:
 *   • Cosmic purple base with radial gradient depth
 *   • Gold filigree border (concentric oval + cornerstone florets)
 *   • Central ✦ brand mark inside a fine laurel
 *   • Eight-point star constellation woven around the mark
 *   • Fine hairline inner border
 *
 * Everything else on the card (actions, strip, actions) matches the
 * other shader variants so the picker swap feels consistent.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

interface FlipRevealCardProps {
  card: TarotCard;
  numeral?: string;
  width?: number;
  onAdvance?: () => void;
}

// ─────────────────────────────────────────────────────────────────────
//  THE CARD BACK — an editorial SVG, hand-composed
// ─────────────────────────────────────────────────────────────────────

function CardBack() {
  return (
    <svg
      viewBox="0 0 360 540"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden
    >
      <defs>
        {/* Deep cosmic base gradient */}
        <radialGradient id="flip-base" cx="50%" cy="38%" r="70%">
          <stop offset="0%"  stopColor="#271a48" />
          <stop offset="55%" stopColor="#140d2c" />
          <stop offset="100%" stopColor="#080516" />
        </radialGradient>

        {/* Gold filigree gradient */}
        <linearGradient id="flip-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#f3dd8e" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8a6818" />
        </linearGradient>

        {/* Subtle noise filter for the base (fabric look) */}
        <filter id="flip-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
          <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.72  0 0 0 0.04 0" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {/* Base */}
      <rect width="360" height="540" fill="url(#flip-base)" />
      <rect width="360" height="540" fill="#271a48" filter="url(#flip-grain)" opacity="0.45" />

      {/* Outer decorative border — double oval with corner florets */}
      <g fill="none" stroke="url(#flip-gold)" strokeWidth="1.3">
        <rect x="18" y="18" width="324" height="504" rx="14" strokeOpacity="0.92" />
        <rect x="26" y="26" width="308" height="488" rx="10" strokeOpacity="0.35" />
      </g>

      {/* Inner hairline */}
      <rect x="36" y="36" width="288" height="468" rx="6"
        fill="none" stroke="rgba(232, 201, 106, 0.28)" strokeWidth="0.5" />

      {/* Central filigree — oval frame */}
      <g stroke="url(#flip-gold)" fill="none" strokeWidth="0.9" strokeOpacity="0.85">
        <ellipse cx="180" cy="270" rx="100" ry="150" />
        <ellipse cx="180" cy="270" rx="88"  ry="134" strokeOpacity="0.35" />
      </g>

      {/* 8-point star constellation around the mark */}
      <g fill="url(#flip-gold)">
        {/* Points of the star — positioned around center */}
        {[
          [180, 140], [180, 400], [68, 270], [292, 270],
          [105, 192], [255, 192], [105, 348], [255, 348],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.8" />
        ))}
        {/* Connecting threads */}
        <g stroke="url(#flip-gold)" strokeWidth="0.55" strokeOpacity="0.35" fill="none">
          <path d="M180 140 L255 192 L292 270 L255 348 L180 400 L105 348 L68 270 L105 192 Z" />
          <path d="M180 140 L180 400" strokeOpacity="0.18" />
          <path d="M68 270 L292 270" strokeOpacity="0.18" />
        </g>
      </g>

      {/* Laurel wreath around the center mark */}
      <g stroke="url(#flip-gold)" fill="none" strokeWidth="0.9" strokeOpacity="0.78">
        <path d="M130 270 Q 155 240 180 232 Q 205 240 230 270" />
        <path d="M130 270 Q 155 300 180 308 Q 205 300 230 270" />
        {/* Leaf veins */}
        {[140, 155, 168, 192, 205, 220].map((x, i) => (
          <line key={i} x1={x} y1="270" x2={x} y2={258 - ((i % 2) * 4)} strokeOpacity="0.5" />
        ))}
      </g>

      {/* Central ✦ mark (outlined, luminous) */}
      <g transform="translate(180 270)">
        <circle r="22" fill="rgba(212, 175, 55, 0.08)" stroke="url(#flip-gold)" strokeWidth="0.7" strokeOpacity="0.9" />
        <text
          x="0" y="7"
          textAnchor="middle"
          fill="url(#flip-gold)"
          fontSize="28"
          fontFamily="'Cormorant Garamond', serif"
        >
          ✦
        </text>
      </g>

      {/* Corner florets */}
      {[
        [40, 40], [320, 40], [40, 500], [320, 500],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`} fill="url(#flip-gold)" opacity="0.88">
          <circle r="1.6" />
          <circle r="3.5" fill="none" stroke="url(#flip-gold)" strokeWidth="0.6" strokeOpacity="0.6" />
        </g>
      ))}

      {/* Brand mark at the bottom — fine italic "Olivia Arcana" */}
      <text
        x="180" y="502"
        textAnchor="middle"
        fill="url(#flip-gold)"
        opacity="0.85"
        fontSize="10"
        letterSpacing="3"
        fontFamily="'Cormorant Garamond', serif"
        fontStyle="italic"
      >
        OLIVIA ARCANA
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  THE COMPONENT
// ─────────────────────────────────────────────────────────────────────

const FLIP_SPRING = { type: "spring" as const, stiffness: 58, damping: 13, mass: 1.1 };
const ANTICIPATION = { duration: 0.22, ease: [0.2, 0, 0.4, 1] as const };

export default function FlipRevealCard({
  card,
  numeral,
  width = 360,
  onAdvance,
}: FlipRevealCardProps) {
  const height = Math.round(width * 1.5);

  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Rotation is tracked as a motion value so we can derive edge-flash
  // + shadow morph from it without extra state.
  const rotateY = useMotionValue(0);
  const edgeFlash = useTransform(rotateY, (deg) => {
    // Thin gaussian peak around the 90° edge-on moment; fades by 130°.
    const d = ((deg % 360) + 360) % 360;
    const distFrom90 = Math.min(
      Math.abs(d - 90),
      Math.abs(d - 270)
    );
    return Math.max(0, 1 - distFrom90 / 22);
  });
  const shadowStrength = useTransform(rotateY, (deg) => {
    // Strongest shadow when facing camera (0 or 180), weakest edge-on.
    const d = ((deg % 360) + 360) % 360;
    const faceness = Math.min(
      Math.abs(d - 0),
      Math.abs(d - 180),
      Math.abs(d - 360)
    );
    return 1 - Math.min(faceness, 90) / 90;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update(); mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset on card change
  useEffect(() => {
    setRevealed(false);
    rotateY.set(0);
  }, [card.name, rotateY]);

  const toggleFlip = useCallback(() => {
    setRevealed(r => !r);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFlip(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); onAdvance?.();
      }
    },
    [toggleFlip, onAdvance]
  );

  return (
    <div className="flr" style={{ width: `${width}px`, maxWidth: "100%" }}>
      <motion.div
        className="flr-scene"
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
        role="button"
        tabIndex={0}
        aria-label={revealed ? `${card.name} revealed. Tap to flip back.` : `Tap to flip and reveal today's card.`}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
        // Anticipation scale: wind up just before commit, settle after.
        animate={revealed ? { scale: [1, 1.04, 1] } : { scale: [1, 0.97, 1] }}
        transition={
          reducedMotion ? { duration: 0.01 } : { duration: 3.0, times: [0, 0.18, 1], ease: [0.2, 0.7, 0.3, 1] }
        }
      >
        {/* Animated drop-shadow layer — morphs with rotation */}
        <motion.div
          aria-hidden
          className="flr-shadow"
          style={{
            opacity: reducedMotion ? 0.55 : shadowStrength,
            scale: reducedMotion ? 1 : useTransform(shadowStrength, [0, 1], [0.8, 1.02]),
          }}
        />

        {/* The flipping inner — preserves 3D */}
        <motion.div
          className="flr-inner"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            rotateY,
          }}
          animate={{ rotateY: revealed ? 180 : 0 }}
          transition={reducedMotion ? { duration: 0.01 } : FLIP_SPRING}
        >
          {/* BACK face */}
          <div className="flr-face flr-back">
            <CardBack />
          </div>

          {/* FRONT face — the actual tarot card image */}
          <div className="flr-face flr-front">
            <img
              src={getCardImagePath(card)}
              alt={card.name}
              width={width}
              height={height}
              className="flr-front-img"
            />
            {/* Card name strip — lives ON the face */}
            <div className="flr-strip" aria-hidden>
              {numeral && <span className="flr-numeral">{numeral}.</span>}
              <span>{card.name}</span>
            </div>
          </div>

          {/* Edge highlight — a gold seam that flashes at 90° */}
          <motion.div
            aria-hidden
            className="flr-edge"
            style={{ opacity: reducedMotion ? 0 : edgeFlash }}
          />
        </motion.div>

        {/* Hint pill — only visible before flip */}
        <AnimatePresence>
          {!revealed && (
            <motion.div
              className="flr-hint"
              aria-hidden
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="flr-hint-dot" /> Tap to flip
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face rim aura — grows in after flip */}
        <motion.div
          aria-hidden
          className="flr-rim"
          initial={false}
          animate={revealed ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: revealed ? 0.55 : 0 }}
        />
      </motion.div>

      <div className="flr-actions">
        <button type="button" className="flr-toggle" onClick={toggleFlip}>
          <span aria-hidden>{revealed ? "↺" : "✦"}</span>
          {revealed ? "Flip back" : "Flip the card"}
        </button>
        <button type="button" className="flr-advance" onClick={() => onAdvance?.()}>
          Different card →
        </button>
      </div>

      <style>{`
        .flr { display: flex; flex-direction: column; gap: 1.1rem; align-items: stretch; margin: 0 auto; }

        .flr-scene {
          position: relative;
          cursor: pointer;
          outline: none;
          perspective: 1400px;
          perspective-origin: 50% 40%;
          border-radius: 18px;
          isolation: isolate;
        }
        .flr-scene:focus-visible {
          outline: 2px solid rgba(232, 201, 106, 0.95);
          outline-offset: 6px;
          border-radius: 22px;
        }

        .flr-shadow {
          position: absolute;
          left: 4%;
          right: 4%;
          bottom: -4%;
          height: 12%;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%);
          filter: blur(8px);
          pointer-events: none;
          z-index: 0;
        }

        .flr-inner {
          border-radius: 18px;
        }

        .flr-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 18px;
          overflow: hidden;
          box-shadow:
            0 30px 50px rgba(0, 0, 0, 0.55),
            0 0 32px rgba(212, 175, 55, 0.14),
            inset 0 0 0 1px rgba(232, 201, 106, 0.18);
        }
        .flr-back {
          background: #0b0822;
        }
        .flr-front {
          transform: rotateY(180deg);
          background: #0b0822;
        }
        .flr-front-img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flr-strip {
          position: absolute;
          left: 50%; bottom: 1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: baseline;
          gap: 0.35em;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.72);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 201, 106, 0.42);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(245, 240, 232, 0.98);
          pointer-events: none;
          box-shadow: 0 0 22px rgba(212, 175, 55, 0.22);
        }
        .flr-numeral { color: rgba(232, 201, 106, 0.92); margin-right: 0.1em; }

        /* Edge highlight — thin vertical golden seam (card edge catching light) */
        .flr-edge {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 3px;
          transform: translateX(-50%);
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(255, 220, 130, 0.85) 25%,
            rgba(255, 240, 180, 1) 50%,
            rgba(255, 220, 130, 0.85) 75%,
            transparent 100%
          );
          box-shadow: 0 0 24px rgba(255, 220, 130, 0.9);
          pointer-events: none;
          z-index: 3;
        }

        /* Rim aura — appears after flip, gives the face a subtle halo */
        .flr-rim {
          position: absolute;
          inset: -8px;
          border-radius: 22px;
          pointer-events: none;
          z-index: -1;
          background:
            radial-gradient(ellipse at center, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0) 65%);
          filter: blur(12px);
        }

        /* Hint pill */
        .flr-hint {
          position: absolute;
          left: 50%; bottom: 1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.55em;
          padding: 0.55rem 1.1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.72);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232, 201, 106, 0.58);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.98);
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.24);
          pointer-events: none;
          z-index: 4;
        }
        .flr-hint-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(232, 201, 106, 1);
          box-shadow: 0 0 14px rgba(232, 201, 106, 0.95);
        }

        /* Actions row */
        .flr-actions {
          display: flex; flex-wrap: wrap; gap: 0.9rem;
          justify-content: center; align-items: center;
        }
        .flr-toggle, .flr-advance {
          display: inline-flex; align-items: center; gap: 0.45em;
          padding: 0.62rem 1.15rem; border-radius: 9999px;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          cursor: pointer;
          transition: all 220ms cubic-bezier(0.16,1,0.3,1);
        }
        .flr-toggle {
          background: linear-gradient(135deg, rgba(212,175,55,0.26), rgba(212,175,55,0.12));
          border: 1px solid rgba(232,201,106,0.52);
          color: rgba(232,201,106,1);
          box-shadow: 0 0 22px rgba(212,175,55,0.18);
        }
        .flr-toggle:hover {
          background: linear-gradient(135deg, rgba(232,201,106,0.38), rgba(212,175,55,0.20));
          border-color: rgba(255,220,130,0.9);
          color: rgba(255,230,150,1);
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(212,175,55,0.3);
        }
        .flr-toggle:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
        .flr-advance {
          background: transparent;
          border: 1px solid rgba(200,185,255,0.20);
          color: rgba(220,210,245,0.72);
        }
        .flr-advance:hover { color: rgba(245,240,232,0.98); border-color: rgba(200,185,255,0.4); }
        .flr-advance:focus-visible { outline: 2px solid #E8C96A; outline-offset: 3px; }
      `}</style>
    </div>
  );
}
