/**
 * InlineVeilReveal.tsx — the flagship veil ceremony, mounted inline.
 *
 * Same VeilRevealScene that powers /academy/card-of-the-day, constrained
 * to a fixed-size container. Everything (the hold-progress ring, the
 * card name reveal, the "draw another" action) stays scoped to the
 * component — no fixed-positioned overlays, no navigation, no side
 * effects outside the box.
 *
 * The ceremony happens in place:
 *   1. Cloth hangs over today's card
 *   2. User presses and holds (mouse or touch) anywhere on the card
 *   3. Hold progress ring fills in-place over the card
 *   4. After 1.3s hold, pins release, cloth falls, card wipes in
 *   5. Card stays revealed, name + numeral appears below
 *   6. Optional "Draw another" action picks a new card
 *
 * No <Link>, no router push. If the owner wants the full room-filling
 * version, they can still navigate to /academy/card-of-the-day via
 * the "✦ Full ceremony" link that appears after reveal.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

interface InlineVeilRevealProps {
  card: TarotCard;
  numeral?: string;
  /** Called on reveal complete */
  onRevealComplete?: () => void;
  /** Called when user clicks "draw another" — caller should pick a new card */
  onDrawAgain?: () => void;
  /** Width of the veil card in px. Default 360. */
  width?: number;
  /** Height of the veil card in px. Default 540 (2:3 tarot aspect). */
  height?: number;
  /** Show the "Full ceremony →" link after reveal. Default true. */
  showFullCeremonyLink?: boolean;
}

export default function InlineVeilReveal({
  card,
  numeral,
  onRevealComplete,
  onDrawAgain,
  width = 360,
  height = 540,
  showFullCeremonyLink = true,
}: InlineVeilRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("./VeilRevealScene").VeilRevealScene | null>(null);

  const [holdRingProgress, setHoldRingProgress] = useState(0);
  const [revealProgress, setRevealProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
    onRevealComplete?.();
  }, [onRevealComplete]);

  // Mount the scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const mobile = "ontouchstart" in window || window.innerWidth < 768;
    setIsMobile(mobile);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const imagePath = getCardImagePath(card);

    let scene: import("./VeilRevealScene").VeilRevealScene | null = null;

    import("./VeilRevealScene").then(({ VeilRevealScene }) => {
      if (!containerRef.current) return;
      try {
        scene = new VeilRevealScene({
          container: containerRef.current,
          cardImagePath: imagePath,
          isMobile: mobile,
          reducedMotion,
          onRevealComplete: handleRevealComplete,
          onProgress: (p) => setRevealProgress(p),
          onHoldProgress: (p) => setHoldRingProgress(p),
        });
        scene.start();
        sceneRef.current = scene;
        setSceneReady(true);
      } catch (err) {
        console.error("[InlineVeilReveal] failed to create scene", err);
      }
    });

    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
    // card change triggers scene.reset below, not re-mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset scene when caller picks a new card
  useEffect(() => {
    if (!sceneRef.current || !revealed) return;
    // Only reset on a new card *after* a reveal — matches the pattern
    // used by VeilRevealWrapper.
  }, [card.name, revealed]);

  const handleDrawAnother = () => {
    if (!sceneRef.current) return;
    // Notify parent to pick a new card
    onDrawAgain?.();
    // Reset visual state — the parent's card prop change will trigger
    // the next effect to reset the scene with the new image.
    setRevealed(false);
    setRevealProgress(0);
    setHoldRingProgress(0);
    const newPath = getCardImagePath(card);
    sceneRef.current.reset(newPath);
  };

  const RING_CIRC = 138.23;

  return (
    <div className="ivr" style={{ width: `${width}px`, maxWidth: "100%" }}>
      {/* The veil box — constrained, not fixed */}
      <div
        className="ivr-frame"
        style={{
          width: "100%",
          aspectRatio: `${width} / ${height}`,
          cursor: isMobile ? "auto" : sceneReady && !revealed ? "none" : "auto",
        }}
      >
        <div
          ref={containerRef}
          className="ivr-canvas"
          aria-label={`Hold to reveal today's tarot card: ${card.name}`}
          role="button"
          tabIndex={0}
        />

        {/* Loading state */}
        {!sceneReady && (
          <div className="ivr-loading" aria-hidden>
            <span className="ivr-loading-glyph">✦</span>
            <span className="ivr-loading-text">Weaving the veil</span>
          </div>
        )}

        {/* Hold-progress ring — positioned at container center while holding */}
        {!isMobile && sceneReady && !revealed && holdRingProgress > 0 && (
          <svg
            className="ivr-ring"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            aria-hidden
          >
            <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <circle
              cx="32"
              cy="32"
              r="22"
              fill="none"
              stroke="rgba(240, 207, 120, 0.85)"
              strokeWidth="2.2"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - holdRingProgress)}
              strokeLinecap="round"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                transition: holdRingProgress > 0 ? "none" : "stroke-dashoffset 0.25s ease",
              }}
            />
            <circle cx="32" cy="32" r="3" fill="rgba(240, 207, 120, 0.92)" />
          </svg>
        )}

        {/* Hint pill — sits inside the card, fades out as cloth lifts */}
        {sceneReady && !revealed && (
          <div
            className="ivr-hint"
            aria-hidden
            style={{ opacity: Math.max(0, 1 - revealProgress * 2) }}
          >
            <span className="ivr-hint-dot" />
            {isMobile ? "Touch & hold to reveal" : "Press & hold to reveal"}
          </div>
        )}

        {/* Card name — fades in with the card itself */}
        {revealProgress > 0.55 && (
          <div
            className="ivr-card-name"
            style={{ opacity: Math.min(1, (revealProgress - 0.55) / 0.35) }}
          >
            {numeral && <span className="ivr-numeral">{numeral}.</span>}
            <span className="ivr-card-title">{card.name}</span>
          </div>
        )}
      </div>

      {/* Post-reveal actions — live BELOW the card, scoped, no navigation */}
      <div className="ivr-actions" aria-live="polite">
        {revealed ? (
          <>
            <button
              type="button"
              className="ivr-action ivr-action-primary"
              onClick={handleDrawAnother}
            >
              <span aria-hidden>↻</span> Draw another
            </button>
            {showFullCeremonyLink && (
              <Link href="/academy/card-of-the-day" className="ivr-action ivr-action-secondary">
                Full-screen ceremony →
              </Link>
            )}
          </>
        ) : (
          <p className="ivr-action-placeholder" aria-hidden>
            Today&rsquo;s card is beneath the veil. Hold to see it.
          </p>
        )}
      </div>

      <style>{`
        .ivr {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          align-items: stretch;
          margin: 0 auto;
        }
        .ivr-frame {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: #06041a;
          box-shadow:
            0 36px 60px rgba(0, 0, 0, 0.5),
            0 0 36px rgba(212, 175, 55, 0.08);
          isolation: isolate;
        }
        .ivr-canvas {
          position: absolute;
          inset: 0;
          outline: none;
        }
        .ivr-canvas:focus-visible {
          outline: 2px solid rgba(232, 201, 106, 0.85);
          outline-offset: 3px;
          border-radius: 18px;
        }

        /* Loading ─────────────────────────────────────────────────── */
        .ivr-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          pointer-events: none;
          z-index: 4;
        }
        .ivr-loading-glyph {
          font-size: 2rem;
          color: rgba(212, 175, 55, 0.55);
          animation: ivrFloat 4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .ivr-loading-text {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(212, 175, 55, 0.6);
        }

        /* Progress ring — centered over the card while holding ────── */
        .ivr-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 3;
          filter: drop-shadow(0 0 14px rgba(240, 207, 120, 0.45));
        }

        /* Hint pill — inside the card, bottom-center ──────────────── */
        .ivr-hint {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 0.55em;
          padding: 0.55rem 1.05rem;
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
          pointer-events: none;
          z-index: 2;
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.25);
          transition: opacity 400ms cubic-bezier(0.16, 1, 0.3, 1);
          animation: ivrPulse 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .ivr-hint-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(232, 201, 106, 1);
          box-shadow: 0 0 12px rgba(232, 201, 106, 0.9);
        }

        /* Card name — small caps overlay on the revealed card ─────── */
        .ivr-card-name {
          position: absolute;
          left: 50%;
          bottom: 1.1rem;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: baseline;
          gap: 0.4em;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.7);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232, 201, 106, 0.42);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.1rem;
          color: rgba(245, 240, 232, 0.98);
          pointer-events: none;
          z-index: 2;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ivr-numeral {
          color: rgba(232, 201, 106, 0.92);
          font-style: italic;
          margin-right: 0.15em;
        }
        .ivr-card-title {
          color: rgba(245, 240, 232, 0.98);
        }

        /* Actions below the card ──────────────────────────────────── */
        .ivr-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
          justify-content: center;
          align-items: center;
          min-height: 2.25rem;
        }
        .ivr-action-placeholder {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          margin: 0;
          text-align: center;
          letter-spacing: 0.02em;
        }
        .ivr-action {
          display: inline-flex;
          align-items: center;
          gap: 0.45em;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), background 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ivr-action-primary {
          padding: 0.7rem 1.25rem;
          border-radius: 9999px;
          background: rgba(212, 175, 55, 0.1);
          border: 1px solid rgba(232, 201, 106, 0.42);
          color: rgba(232, 201, 106, 0.95);
        }
        .ivr-action-primary:hover {
          background: rgba(232, 201, 106, 0.2);
          border-color: rgba(255, 220, 130, 0.8);
          color: rgba(255, 230, 150, 1);
        }
        .ivr-action-primary:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        .ivr-action-secondary {
          color: rgba(220, 210, 245, 0.75);
          border-bottom: 1px solid rgba(220, 210, 245, 0.24);
          padding-bottom: 2px;
          letter-spacing: 0.08em;
          text-transform: none;
          font-size: 0.82rem;
        }
        .ivr-action-secondary:hover {
          color: rgba(232, 201, 106, 0.95);
          border-color: rgba(232, 201, 106, 0.6);
        }
        .ivr-action-secondary:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }

        /* Motion ──────────────────────────────────────────────────── */
        @keyframes ivrFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes ivrPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(212, 175, 55, 0.22); transform: translateX(-50%) translateY(0); }
          50%      { box-shadow: 0 0 32px rgba(212, 175, 55, 0.42); transform: translateX(-50%) translateY(-2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ivr-loading-glyph,
          .ivr-hint {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
