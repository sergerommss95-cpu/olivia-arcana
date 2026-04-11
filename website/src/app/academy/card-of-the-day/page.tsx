/**
 * Card of the Day — Cosmic veil reveal experience
 *
 * Press & hold to drop a PBD cloth veil, revealing today's tarot card
 * underneath with a top-to-bottom wipe, glass shine, and ascending chimes.
 * After reveal, a CardInfoPanel slides in with the full interpretation.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { getCardImagePath } from "../../../lib/academy/card-images";
import { recordDraw } from "../../../lib/deck-memory";
import VeilRevealWrapper from "../../../components/veil-reveal/VeilRevealWrapper";
import CardInfoPanel from "../../../components/veil-reveal/CardInfoPanel";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Daily-seeded card selection — same card for all users on the same day. */
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

/** Get the roman numeral or rank for the eyebrow display. */
function getCardNumeral(card: TarotCard): string {
  if (card.arcana === "major") {
    const numerals = [
      "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
      "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
    ];
    return numerals[card.number] ?? String(card.number);
  }
  // Minor arcana: Ace, Two, Three... or Page, Knight, Queen, King
  const ranks = ["", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
  return ranks[card.number] ?? String(card.number);
}

export default function CardOfTheDayPage() {
  const [mounted, setMounted] = useState(false);
  const [card, setCard] = useState<TarotCard>(ALL_CARDS[0]);
  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [cardKey, setCardKey] = useState(0); // forces VeilRevealWrapper remount on draw again

  // Hydration-safe: pick daily card after mount
  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (cancelled) return;
      const daily = getDailyCard();
      setCard(daily.card);
      setReversed(daily.reversed);
      setMounted(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const handleRevealComplete = useCallback(() => {
    recordDraw(card.name);
    setRevealed(true);
  }, [card.name]);

  const handleDrawAgain = useCallback(() => {
    // Pick a truly random card (not daily-seeded)
    let newIdx: number;
    const currentIdx = ALL_CARDS.indexOf(card);
    do {
      newIdx = Math.floor(Math.random() * ALL_CARDS.length);
    } while (newIdx === currentIdx);
    const newReversed = Math.random() < 0.33;

    setCard(ALL_CARDS[newIdx]);
    setReversed(newReversed);
    setRevealed(false);
    setCardKey((k) => k + 1); // remount the scene
  }, [card]);

  if (!mounted) {
    // SSR / hydration placeholder — dark void matching the site bg
    return (
      <div
        style={{ minHeight: "100vh", background: "var(--c-void, #04020d)" }}
      />
    );
  }

  const imagePath = getCardImagePath(card);
  const numeral = getCardNumeral(card);

  return (
    <div className="relative" style={{ minHeight: "100vh", zIndex: 1 }}>
      {/* Veil reveal experience — fills the viewport */}
      <VeilRevealWrapper
        key={cardKey}
        cardImagePath={imagePath}
        cardName={card.name}
        cardNumeral={numeral}
        onRevealComplete={handleRevealComplete}
        onDrawAgain={handleDrawAgain}
      />

      {/* Card info panel — slides in after reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="relative z-10 px-6 pt-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
          >
            <CardInfoPanel card={card} reversed={reversed} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
