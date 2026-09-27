/**
 * Card of the Day — Personal-Almanac print register.
 *
 * Flow (all draw/persistence logic intact):
 *  1. Daily-seeded card (same for all users on a given day)
 *  2. FlipRevealCard kept mounted — the reveal interaction is the ritual;
 *     the dark card art reads as a printed plate on the bone paper
 *  3. Info panel (re-inked CardInfoPanel) slides in below on reveal
 *  4. "Draw again" resets for a new card; recordDraw persists each draw
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import FlipRevealCard from "../../../components/shaders/FlipRevealCard";
import CardInfoPanel from "../../../components/daily/CardInfoPanel";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { getDailyCard, getCardNumeral } from "@/lib/daily-card";
import { recordDraw } from "../../../lib/deck-memory";
import { useLocale } from "@/lib/i18n/useLocale";
import AlmanacShell from "@/components/almanac/AlmanacShell";

const EASE = [0.16, 1, 0.3, 1] as const;

// ── Local UI copy (EN/UK) for strings without translation keys ────────
const UI = {
  en: { kicker: "Ritual of the day", drawAgain: "Draw again" },
  uk: { kicker: "Ритуал дня", drawAgain: "Витягнути ще раз" },
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ════════════════════════════════════════════════════════════════════ */

export default function CardOfTheDayPage() {
  const { t, locale } = useLocale();
  const ui = locale === "uk" ? UI.uk : UI.en;
  const [mounted, setMounted] = useState(false);
  const [card, setCard] = useState<TarotCard>(ALL_CARDS[0]);
  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const infoPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Defer to avoid synchronous cascading render warning
    const timer = setTimeout(() => {
      const daily = getDailyCard();
      setCard(daily.card);
      setReversed(daily.reversed);
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
    recordDraw(card.name);
    setTimeout(() => {
      infoPanelRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
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
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [card]);

  const numeral = getCardNumeral(card);
  // Rendered only after mount, so the client-local date never mismatches SSR.
  const today = mounted
    ? new Date().toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <AlmanacShell narrow>
      <div className="cotd">
        {/* ── Header ── */}
        <header className="cotd-head">
          <Link href="/academy" className="cotd-back">
            ← {t("academy_back")}
          </Link>
          <p className="alm-kicker">
            <span aria-hidden>✦</span>
            {ui.kicker}
          </p>
          <h1 className="alm-h1">{t("academy_card_of_day")}</h1>
          <p className="alm-lead cotd-lead">{t("academy_card_of_day_desc")}</p>
          {today && <p className="alm-caption cotd-date">{today}</p>}
        </header>

        {/* ── The plate — reveal ceremony kept intact ── */}
        <div className="cotd-stage">
          {mounted && (
            <FlipRevealCard
              card={card}
              numeral={numeral}
              width={340}
              onFlip={(rev) => {
                if (rev) handleRevealComplete();
              }}
            />
          )}
        </div>

        <MotionConfig reducedMotion="user">
          <AnimatePresence>
            {revealed && (
              <motion.div
                ref={infoPanelRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
                style={{
                  padding: "2rem 0 2rem",
                  position: "relative",
                  zIndex: 5,
                  background: "var(--paper, #e8dcc8)",
                  width: "100%",
                }}
              >
                <CardInfoPanel card={card} reversed={reversed} />

                <div className="cotd-again">
                  <button onClick={handleDrawAgain} className="alm-btn">
                    ↺ {ui.drawAgain}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </MotionConfig>
      </div>

      <style jsx>{`
        .cotd-head {
          text-align: center;
          padding-bottom: clamp(1.4rem, 3vw, 2rem);
          border-bottom: 1px solid var(--hairline);
          margin-bottom: clamp(1.6rem, 4vw, 2.6rem);
        }

        .cotd :global(.cotd-back) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 0.6rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .cotd :global(.cotd-back:hover) {
          color: var(--ox);
        }

        .cotd-lead {
          margin: 1rem auto 0;
          max-width: 48ch;
        }

        .cotd-date {
          margin: 0.9rem 0 0;
        }

        .cotd-stage {
          display: flex;
          justify-content: center;
          min-height: 24rem;
        }

        .cotd-again {
          text-align: center;
          margin-top: 3rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .cotd :global(.cotd-back) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
