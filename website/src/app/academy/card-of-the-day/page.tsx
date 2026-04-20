/**
 * Card of the Day — Three.js veil reveal ceremony.
 *
 * Flow:
 *  1. Full-viewport PBD cloth veil with nebula shaders
 *  2. Hold (desktop) or touch-hold (mobile) to lift the veil
 *  3. Card revealed via top-to-bottom wipe shader with bloom + filmic grading
 *  4. Info panel slides in below with meaning, advice, correspondences
 *  5. "Draw Again" resets the veil for a new card
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VeilRevealWrapper from "../../../components/veil-reveal/VeilRevealWrapper";
import CardInfoPanel from "../../../components/veil-reveal/CardInfoPanel";
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
  const [revealed, setRevealed] = useState(false);
  const infoPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const daily = getDailyCard();
    setCard(daily.card);
    setReversed(daily.reversed);
    setMounted(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
    recordDraw(card.name);
    setTimeout(() => {
      infoPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 1000);
  }, [card.name]);

  const handleDrawAgain = useCallback(() => {
    setRevealed(false);
    let newIdx: number;
    const currentIdx = ALL_CARDS.indexOf(card);
    do {
      newIdx = Math.floor(Math.random() * ALL_CARDS.length);
    } while (newIdx === currentIdx);
    setCard(ALL_CARDS[newIdx]);
    setReversed(Math.random() < 0.33);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [card]);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--c-void, #06041a)" }} />;
  }

  const imagePath = getCardImagePath(card);
  const numeral = getCardNumeral(card);

  return (
    <div style={{ background: "var(--c-void, #06041a)" }}>
      <VeilRevealWrapper
        cardImagePath={imagePath}
        cardName={card.name}
        cardNumeral={numeral}
        onRevealComplete={handleRevealComplete}
        onDrawAgain={handleDrawAgain}
      />

      <AnimatePresence>
        {revealed && (
          <motion.div
            ref={infoPanelRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
            style={{
              padding: "2rem 1rem 6rem",
              position: "relative",
              zIndex: 5,
              background: "var(--c-void, #06041a)",
            }}
          >
            <CardInfoPanel card={card} reversed={reversed} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
