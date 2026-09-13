"use client";

/**
 * ReadingScroll — the reading written out.
 *
 * The three names on the table are the headline; this is the article.
 * Each card read in the position it fell in, then the pattern the whole
 * draw makes, then one line of counsel taken from the card the spread
 * was built to arrive at.
 *
 * Sits behind the "reading-full" plan gate — open to everyone while the
 * press is stopped, which is exactly what PlanGate handles.
 */

import React from "react";
import { motion } from "framer-motion";
import PlanGate from "@/components/almanac/PlanGate";
import { readSpread, type Spread } from "@/lib/spreads";
import type { TarotCard } from "@/lib/academy/tarot-cards";
import { ukCard } from "@/lib/academy/tarot-cards-uk";
import { useLocale } from "@/lib/i18n/useLocale";

interface Props {
  spread: Spread;
  draws: Array<{ card: TarotCard; reversed: boolean }>;
  onInspect?: (index: number) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ReadingScroll({ spread, draws, onInspect }: Props) {
  const { locale } = useLocale();
  const uk = locale === "uk";
  if (!draws.length) return null;
  const reading = readSpread(spread, draws);
  const counselUk = uk ? ukCard(reading.counselFrom)?.advice : null;

  return (
    <PlanGate feature="reading-full">
      <section className="rs" aria-label={uk ? "Повне читання" : "The full reading"}>
        <header className="rs-head">
          <p className="rs-kicker">
            <span aria-hidden>✦</span> {uk ? "Читання, записане повністю" : "The reading, written out"}
          </p>
          <p className="rs-lead">{uk ? spread.lineUk : spread.line}</p>
        </header>

        <ol className="rs-list">
          {reading.cards.map((c, i) => {
            const t = uk ? ukCard(c.card.name) : null;
            const shownName = t?.name ?? c.card.name;
            const passage = t ? (c.reversed ? t.reversed : t.upright) : c.passage;
            const keys = (t?.keywords ?? c.card.keywords).slice(0, 4).join(" · ");
            return (
            <motion.li
              key={c.card.name + i}
              className="rs-entry glass-thin"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              transition={{ duration: 0.55, ease: EASE, delay: Math.min(i, 5) * 0.06 }}
            >
              <div className="rs-rail">
                <span className="rs-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="rs-pos">{c.position.label}</span>
              </div>
              <div className="rs-body">
                <h3 className="rs-name">
                  {onInspect ? (
                    <button type="button" className="rs-namebtn" onClick={() => onInspect(i)}>
                      {shownName}
                    </button>
                  ) : (
                    shownName
                  )}
                  {c.reversed && <span className="rs-rev"> · {uk ? "перевернута" : "turned"}</span>}
                </h3>
                <p className="rs-asks">{c.position.asks}</p>
                <p className="rs-passage">{passage}</p>
                <p className="rs-keys">{keys}</p>
              </div>
            </motion.li>
            );
          })}
        </ol>

        <motion.div
          className="rs-synth glass"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="rs-synth-kicker">{uk ? "Що складає розклад разом" : "What the draw makes together"}</p>
          <p className="rs-synth-body">{reading.synthesis}</p>
          {reading.counsel && (
            <p className="rs-counsel">
              <span className="rs-mark" aria-hidden>✦</span>
              {counselUk ?? reading.counsel}
            </p>
          )}
        </motion.div>

        <style jsx global>{`
          /* One measure for the whole reading, centred in the pane. Text
             that runs the full width of a 64rem panel cannot be read;
             this holds the column at a page's width and lets the glass
             be the room around it. */
          .rs {
            width: min(46rem, 100%);
            margin: 2.6rem auto 0;
            display: grid;
            gap: 1.6rem;
          }

          .rs-head {
            text-align: center;
            display: grid;
            gap: 0.5rem;
            padding-bottom: 0.4rem;
          }

          .rs-kicker {
            margin: 0;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.6rem;
            letter-spacing: 0.34em;
            text-indent: 0.34em;
            text-transform: uppercase;
            color: var(--ox, #e0b768);
          }

          .rs-lead {
            margin: 0 auto;
            max-width: 34ch;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-style: italic;
            font-size: 1.15rem;
            line-height: 1.5;
            color: var(--ink-soft, rgba(232, 233, 255, 0.78));
          }

          .rs-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: grid;
            gap: 1.5rem;
          }

          /* Each entry: a numbered rail, then the passage. On a phone the
             rail folds above the card name instead of squeezing it. */
          .rs-entry {
            display: grid;
            grid-template-columns: 4.6rem 1fr;
            gap: 0 1.6rem;
            padding: clamp(1.2rem, 2.4vw, 1.7rem) clamp(1.2rem, 2.4vw, 1.8rem);
          }

          .rs-rail {
            display: grid;
            align-content: start;
            gap: 0.3rem;
            justify-items: end;
            text-align: right;
            padding-top: 0.42rem;
            border-right: 1px solid rgba(183, 188, 233, 0.16);
            padding-right: 1.1rem;
            margin-right: -0.5rem;
          }

          .rs-num {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.78rem;
            letter-spacing: 0.06em;
            color: var(--ox, #e0b768);
          }

          .rs-pos {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.53rem;
            letter-spacing: 0.2em;
            line-height: 1.5;
            text-transform: uppercase;
            color: var(--ink-faint, rgba(183, 188, 233, 0.66));
          }

          .rs-body {
            display: grid;
            gap: 0.5rem;
          }

          .rs-name {
            margin: 0;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-weight: 500;
            font-size: clamp(1.5rem, 3vw, 1.95rem);
            line-height: 1.05;
            color: var(--ink, #e8e9ff);
          }

          .rs-name .rs-namebtn {
            background: none;
            border: 0;
            padding: 0;
            font: inherit;
            color: inherit;
            cursor: pointer;
            border-bottom: 1px solid rgba(183, 188, 233, 0.28);
            transition: border-color 220ms ease, color 220ms ease;
          }

          .rs-name .rs-namebtn:hover,
          .rs-name .rs-namebtn:focus-visible {
            color: #ffffff;
            border-bottom-color: var(--ox, #e0b768);
          }

          .rs-rev {
            font-size: 0.6em;
            font-style: italic;
            color: var(--ink-faint, rgba(183, 188, 233, 0.66));
          }

          /* The question, set as an epigraph under the name — it carries
             the position's meaning without repeating it in the passage. */
          .rs-asks {
            margin: 0 0 0.15rem;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-style: italic;
            font-size: 1.02rem;
            line-height: 1.4;
            color: var(--ink-faint, rgba(183, 188, 233, 0.7));
          }

          .rs-passage {
            margin: 0;
            max-width: 56ch;
            color: var(--ink-soft, rgba(232, 233, 255, 0.8));
            font-size: 1rem;
            line-height: 1.72;
          }

          .rs-keys {
            margin: 0.35rem 0 0;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.55rem;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--ink-faint, rgba(183, 188, 233, 0.58));
          }

          /* The closing pane: centred, because it speaks about the whole
             draw rather than any one card. */
          .rs-synth {
            padding: clamp(1.6rem, 3.4vw, 2.4rem) clamp(1.3rem, 3vw, 2.2rem);
            display: grid;
            gap: 0.9rem;
            justify-items: center;
            text-align: center;
          }

          .rs-synth-kicker {
            margin: 0;
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 0.55rem;
            letter-spacing: 0.32em;
            text-indent: 0.32em;
            text-transform: uppercase;
            color: var(--ink-faint, rgba(183, 188, 233, 0.66));
          }

          .rs-synth-body {
            margin: 0;
            max-width: 52ch;
            color: var(--ink-soft, rgba(232, 233, 255, 0.82));
            font-size: 1rem;
            line-height: 1.75;
            text-align: left;
          }

          .rs-counsel {
            margin: 0.5rem 0 0;
            max-width: 30ch;
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-style: italic;
            font-size: clamp(1.3rem, 2.8vw, 1.6rem);
            line-height: 1.45;
            color: var(--ink, #e8e9ff);
            text-align: center;
          }

          .rs-mark {
            display: block;
            color: var(--ox, #e0b768);
            font-style: normal;
            font-size: 0.85rem;
            margin-bottom: 0.7rem;
          }

          @media (max-width: 640px) {
            .rs-entry {
              grid-template-columns: 1fr;
              gap: 0.7rem;
            }
            .rs-rail {
              grid-auto-flow: column;
              justify-content: start;
              justify-items: start;
              align-items: baseline;
              gap: 0.7rem;
              text-align: left;
              padding: 0 0 0.5rem;
              margin: 0;
              border-right: 0;
              border-bottom: 1px solid rgba(183, 188, 233, 0.16);
            }
          }
        `}</style>
      </section>
    </PlanGate>
  );
}
