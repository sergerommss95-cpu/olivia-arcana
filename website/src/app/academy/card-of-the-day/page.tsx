/**
 * Card of the Day — Tap-to-reveal tarot experience.
 *
 * No Three.js, no WebGL, no cloth physics.
 * Pure CSS 3D card flip + Framer Motion choreography.
 *
 * Flow:
 *  1. Card face-down with mystical back design, pulsing "Tap to reveal"
 *  2. Tap → 3D flip with golden glow burst
 *  3. Card image + name revealed
 *  4. Info panel slides in below with meaning, advice, correspondences
 *  5. "Draw Again" shuffles to a random card
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { getCardImagePath } from "../../../lib/academy/card-images";
import { recordDraw } from "../../../lib/deck-memory";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Daily-seeded card (same for all users on a given day) ─────────── */
function getDailyCard(): { card: TarotCard; reversed: boolean } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear * 2654435761;
  const idx = Math.abs(seed) % ALL_CARDS.length;
  const reversed = (Math.abs(seed >> 8) % 3) === 0;
  return { card: ALL_CARDS[idx], reversed };
}

/* ── Numeral helper ─────────────────────────────────────────────────── */
function getCardNumeral(card: TarotCard): string {
  if (card.arcana === "major") {
    const n = [
      "0","I","II","III","IV","V","VI","VII","VIII","IX","X",
      "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI",
    ];
    return n[card.number] ?? String(card.number);
  }
  const ranks = ["","Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
  return ranks[card.number] ?? String(card.number);
}

/* ════════════════════════════════════════════════════════════════════ */

export default function CardOfTheDayPage() {
  const [mounted, setMounted] = useState(false);
  const [card, setCard] = useState<TarotCard>(ALL_CARDS[0]);
  const [reversed, setReversed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const daily = getDailyCard();
    setCard(daily.card);
    setReversed(daily.reversed);
    setMounted(true);
  }, []);

  const handleFlip = useCallback(() => {
    if (flipped || shuffling) return;
    setFlipped(true);
    recordDraw(card.name);
    // Show info panel after flip animation completes
    setTimeout(() => setShowInfo(true), 700);
  }, [flipped, shuffling, card.name]);

  const handleDrawAgain = useCallback(() => {
    setShuffling(true);
    setShowInfo(false);
    setFlipped(false);

    setTimeout(() => {
      let newIdx: number;
      const currentIdx = ALL_CARDS.indexOf(card);
      do {
        newIdx = Math.floor(Math.random() * ALL_CARDS.length);
      } while (newIdx === currentIdx);

      setCard(ALL_CARDS[newIdx]);
      setReversed(Math.random() < 0.33);
      setShuffling(false);
    }, 600);
  }, [card]);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--c-void, #04020d)" }} />;
  }

  const imagePath = getCardImagePath(card);
  const numeral = getCardNumeral(card);
  const isMajor = card.arcana === "major";

  return (
    <div style={{ minHeight: "100vh", paddingTop: "5rem", paddingBottom: "4rem", position: "relative", zIndex: 1 }}>
      <style>{`
        .card-scene {
          perspective: 1200px;
          width: min(320px, 75vw);
          aspect-ratio: 2/3;
          margin: 0 auto;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-inner.shuffling {
          transform: rotateY(0deg) scale(0.92);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 1rem;
          overflow: hidden;
        }
        .card-front { transform: rotateY(180deg); }
        .card-back-design {
          width: 100%; height: 100%;
          background: linear-gradient(160deg, #0d0820 0%, #1a0f35 40%, #0d0820 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 1rem;
          position: relative;
          overflow: hidden;
        }
        .card-back-design::before {
          content: '';
          position: absolute; inset: 8%;
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 0.5rem;
        }
        .card-back-design::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 30%, rgba(160,120,255,0.06) 0%, transparent 70%);
        }
        @keyframes gentlePulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        @keyframes glowBurst {
          0% { box-shadow: 0 0 0 rgba(212,175,55,0), 0 8px 32px rgba(0,0,0,0.5); }
          40% { box-shadow: 0 0 60px rgba(212,175,55,0.3), 0 0 120px rgba(160,120,255,0.15), 0 8px 32px rgba(0,0,0,0.5); }
          100% { box-shadow: 0 0 20px rgba(212,175,55,0.08), 0 8px 32px rgba(0,0,0,0.4); }
        }
        .card-scene.revealed .card-face.card-front {
          animation: glowBurst 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-front img {
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 1rem;
        }
        @keyframes floatStar {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        .hint-pulse {
          animation: gentlePulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── Header ── */}
      <motion.div
        style={{ textAlign: "center", marginBottom: "clamp(1.5rem, 4vw, 2.5rem)", padding: "0 1.5rem" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
      >
        <div style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(212,175,55,0.4)", marginBottom: "0.5rem",
        }}>
          Daily Oracle
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 400,
          letterSpacing: "0.04em",
          color: "rgba(240,236,255,0.92)", margin: 0,
        }}>
          Card of the Day
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
          color: "rgba(180,170,210,0.45)", marginTop: "0.4rem",
        }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
      >
        <div
          className={`card-scene ${flipped ? "revealed" : ""}`}
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `${card.name} revealed` : "Tap to reveal your card"}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleFlip(); }}
        >
          <div className={`card-inner ${flipped ? "flipped" : ""} ${shuffling ? "shuffling" : ""}`}>
            {/* Back (visible first) */}
            <div className="card-face card-back">
              <div className="card-back-design">
                <div style={{
                  fontSize: "2.5rem", color: "rgba(212,175,55,0.25)",
                  animation: "floatStar 6s ease-in-out infinite",
                  marginBottom: "0.75rem",
                }}>
                  ✦
                </div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.85rem", fontWeight: 400,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  color: "rgba(212,175,55,0.2)",
                }}>
                  Olivia Arcana
                </div>
                {/* Corner glyphs */}
                {["top: 12%; left: 12%", "top: 12%; right: 12%", "bottom: 12%; left: 12%", "bottom: 12%; right: 12%"].map((pos, i) => (
                  <div key={i} style={{
                    position: "absolute", ...Object.fromEntries(pos.split("; ").map(p => p.split(": "))),
                    fontSize: "0.7rem", color: "rgba(212,175,55,0.1)",
                  }}>✦</div>
                ))}
              </div>
            </div>

            {/* Front (card image) */}
            <div className="card-face card-front">
              <img
                ref={imgRef}
                src={imagePath}
                alt={card.name}
                loading="eager"
                style={{ transform: reversed ? "rotate(180deg)" : "none" }}
              />
            </div>
          </div>
        </div>

        {/* Tap hint */}
        <AnimatePresence>
          {!flipped && !shuffling && (
            <motion.div
              className="hint-pulse"
              style={{
                textAlign: "center", marginTop: "1.25rem",
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(0.7rem, 2.5vw, 0.8rem)",
                letterSpacing: "0.3em", textTransform: "uppercase",
                color: "rgba(212,175,55,0.4)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Tap to Reveal
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card name after flip */}
        <AnimatePresence>
          {flipped && !shuffling && (
            <motion.div
              style={{ textAlign: "center", marginTop: "1.25rem" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            >
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: isMajor ? "rgba(212,175,55,0.45)" : "rgba(180,170,210,0.35)",
                marginBottom: "0.25rem",
              }}>
                {isMajor ? `Major Arcana · ${numeral}` : `${card.suit} · ${numeral}`}
                {reversed && " · Reversed"}
              </div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 400,
                letterSpacing: "0.06em", margin: 0,
                background: isMajor
                  ? "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)"
                  : "linear-gradient(135deg, #c4b4f0 0%, #f0ecff 50%, #c4b4f0 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {card.name}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Info Panel ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            style={{ maxWidth: "480px", margin: "0 auto", padding: "0 1rem" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Keywords */}
            <motion.div
              style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "1.5rem" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            >
              {card.keywords.map(k => (
                <span key={k} style={{
                  padding: "0.35rem 0.75rem", borderRadius: "100px",
                  fontSize: "0.68rem", fontWeight: 400,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(200,185,255,0.06)",
                  color: "rgba(200,190,235,0.55)",
                }}>{k}</span>
              ))}
            </motion.div>

            {/* Meaning */}
            <motion.div
              className="glass-card"
              style={{ padding: "1.5rem", marginTop: "1.25rem" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: reversed ? "rgba(232,82,74,0.5)" : "rgba(78,205,196,0.5)",
                marginBottom: "0.6rem",
              }}>
                {reversed ? "Reversed Meaning" : "Upright Meaning"}
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
                lineHeight: 1.8, color: "rgba(220,210,240,0.75)", margin: 0,
              }}>
                {reversed ? card.reversed : card.upright}
              </p>
            </motion.div>

            {/* Advice */}
            <motion.div
              className="glass-card"
              style={{
                padding: "1.5rem", marginTop: "0.75rem", textAlign: "center",
                borderColor: "rgba(212,175,55,0.08)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
            >
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(212,175,55,0.4)", marginBottom: "0.5rem",
              }}>
                Today&apos;s Guidance
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1rem, 3vw, 1.15rem)", fontWeight: 400,
                lineHeight: 1.7, fontStyle: "italic",
                color: "rgba(230,220,250,0.8)", margin: 0,
              }}>
                &ldquo;{card.advice}&rdquo;
              </p>
            </motion.div>

            {/* Correspondences */}
            <motion.div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.75rem" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
            >
              {[
                { label: "Astrology", value: card.astrology },
                { label: "Element", value: card.element },
                { label: "Yes / No", value: card.yesNo.charAt(0).toUpperCase() + card.yesNo.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="glass-card" style={{ padding: "0.85rem 0.5rem", textAlign: "center" }}>
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: "0.5rem", fontWeight: 600,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "rgba(180,170,210,0.35)", marginBottom: "0.3rem",
                  }}>{label}</div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.9rem", fontWeight: 500,
                    color: "rgba(230,220,255,0.8)",
                  }}>{value}</div>
                </div>
              ))}
            </motion.div>

            {/* Journal prompt */}
            <motion.div
              className="glass-card"
              style={{ padding: "1.25rem", marginTop: "0.75rem" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
            >
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
                letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(180,170,210,0.35)", marginBottom: "0.5rem",
              }}>
                Reflect
              </div>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
                lineHeight: 1.7, color: "rgba(196,185,228,0.6)", margin: 0,
              }}>
                How does the energy of <em>{card.name}</em>{reversed ? " (reversed)" : ""} show
                up in your life right now? What is it asking you to notice today?
              </p>
            </motion.div>

            {/* Draw Again */}
            <motion.div
              style={{ textAlign: "center", marginTop: "1.5rem" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <button
                onClick={handleDrawAgain}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(200,185,255,0.12)",
                  color: "rgba(200,190,235,0.5)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.72rem", fontWeight: 400,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "0.85rem 2rem",
                  borderRadius: "100px",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  minHeight: "44px",
                }}
                className="draw-again-btn"
              >
                Draw Another Card
              </button>
              <style>{`
                @media (hover: hover) {
                  .draw-again-btn:hover {
                    border-color: rgba(212,175,55,0.3) !important;
                    color: rgba(212,175,55,0.7) !important;
                    background: rgba(212,175,55,0.04) !important;
                  }
                }
                .draw-again-btn:active {
                  transform: scale(0.97);
                  opacity: 0.8;
                }
              `}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
