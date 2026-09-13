"use client";

/**
 * SpreadChooser — choosing the shape of the reading.
 *
 * Each spread is its own engraved plate: a stroke-drawn diagram of the
 * actual arrangement (inked in on arrival), the name, how many cards it
 * takes, and the line that says what it is for. The diagram is generated
 * from the same coordinates the dealing table uses, so what you pick is
 * literally what gets dealt.
 *
 * Keyboard: a roving radiogroup — arrows walk the plates, the focused
 * plate is the chosen one.
 */

import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPREADS, type Spread } from "@/lib/spreads";
import { entitlementFor } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale } from "@/lib/i18n/useLocale";

interface Props {
  value: Spread;
  onChange: (s: Spread) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** The spread's own coordinates, drawn small — each plate inked on. */
function ShapeDiagram({ spread, active }: { spread: Spread; active: boolean }) {
  const cols = spread.positions.map((p) => p.col);
  const rows = spread.positions.map((p) => p.row);
  const minC = Math.min(...cols) - 0.5;
  const maxC = Math.max(...cols) + 0.5;
  const minR = Math.min(...rows) - 0.7;
  const maxR = Math.max(...rows) + 0.7;
  const w = maxC - minC;
  const h = maxR - minR;
  const scale = 26;

  return (
    <svg
      className="sc-shape"
      viewBox={`0 0 ${w * scale} ${h * scale}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {spread.positions.map((p, i) => {
        const cx = (p.col - minC) * scale;
        const cy = (p.row - minR) * scale;
        const cw = scale * 0.56;
        const ch = scale * 0.92;
        return (
          <rect
            key={i}
            x={cx - cw / 2}
            y={cy - ch / 2}
            width={cw}
            height={ch}
            rx={2.2}
            pathLength={100}
            transform={p.rotated ? `rotate(90 ${cx} ${cy})` : undefined}
            className={`sc-plate ${i === 0 ? "is-first" : ""}`}
            style={{ animationDelay: `${140 + i * 70}ms` }}
          />
        );
      })}
      {active && (
        <circle
          className="sc-seal"
          cx={(0 - minC) * scale}
          cy={(0 - minR) * scale}
          r={1.6}
        />
      )}
    </svg>
  );
}

export default function SpreadChooser({ value, onChange }: Props) {
  const { tier } = useSubscription();
  const { locale } = useLocale();
  const uk = locale === "uk";
  const reduced = useReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const ukCards = (n: number) => (n >= 2 && n <= 4 ? "карти" : "карт");

  const step = (e: React.KeyboardEvent, i: number) => {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!dir) return;
    e.preventDefault();
    const j = (i + dir + SPREADS.length) % SPREADS.length;
    onChange(SPREADS[j]);
    refs.current[j]?.focus();
  };

  return (
    <div
      className="sc"
      role="radiogroup"
      aria-label={uk ? "Оберіть форму читання" : "Choose the shape of the reading"}
    >
      {SPREADS.map((s, i) => {
        const ent = entitlementFor(s.feature, tier);
        const active = s.id === value.id;
        return (
          <motion.button
            key={s.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`sc-card ${active ? "is-on" : ""}`}
            onClick={() => onChange(s)}
            onKeyDown={(e) => step(e, i)}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: reduced ? 0 : 0.07 * i }}
            whileHover={reduced ? undefined : { y: -3 }}
          >
            <ShapeDiagram spread={s} active={active} />
            <span className="sc-name">{uk ? s.nameUk : s.name}</span>
            <span className="sc-count" aria-hidden="false">
              <i aria-hidden>✦</i> {uk ? `${s.count} ${ukCards(s.count)}` : `${s.count} cards`} <i aria-hidden>✦</i>
            </span>
            <span className="sc-line">{uk ? s.lineUk : s.line}</span>
            {ent.requiredPlan.rank > 0 && (
              <span className={`sc-plan ${ent.openWhilePaused ? "is-open" : ""}`}>
                {ent.openWhilePaused
                  ? `${ent.requiredPlan.name} · ${uk ? "відкрито зараз" : "open now"}`
                  : ent.requiredPlan.name}
              </span>
            )}
          </motion.button>
        );
      })}

      <style jsx global>{`
        .sc {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(13.5rem, 1fr));
          gap: 0.9rem;
          width: min(58rem, 92vw);
          margin: 0 auto;
        }

        /* ── The engraved plate ─────────────────────────────── */
        .sc-card {
          position: relative;
          display: grid;
          justify-items: center;
          align-content: start;
          gap: 0.42rem;
          padding: 1.35rem 1.1rem 1.5rem;
          border: 1px solid rgba(232, 233, 255, 0.16);
          border-radius: 4px;
          /* opaque enough that the resting deck never bleeds through */
          background: rgba(14, 17, 68, 0.92);
          cursor: pointer;
          text-align: center;
          color: inherit;
          font: inherit;
          transition:
            border-color 340ms cubic-bezier(0.16, 1, 0.3, 1),
            background 340ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 340ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* inner hairline — the double frame of the almanac plates */
        .sc-card::after {
          content: "";
          position: absolute;
          inset: 5px;
          border: 1px solid rgba(232, 233, 255, 0.09);
          border-radius: 2px;
          pointer-events: none;
          transition: border-color 340ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sc-card:hover {
          border-color: rgba(224, 183, 104, 0.45);
          background: rgba(17, 20, 82, 0.95);
        }

        .sc-card:hover::after {
          border-color: rgba(224, 183, 104, 0.16);
        }

        .sc-card.is-on {
          border-color: rgba(224, 183, 104, 0.62);
          background: rgba(21, 25, 100, 0.94);
          box-shadow: 0 1.1rem 2.6rem rgba(5, 7, 32, 0.4);
        }

        .sc-card.is-on::after {
          border-color: rgba(224, 183, 104, 0.24);
        }

        .sc-card:focus-visible {
          outline: 1px solid #e0b768;
          outline-offset: 3px;
        }

        .sc-shape {
          width: 100%;
          height: 4.6rem;
          margin-bottom: 0.35rem;
        }

        /* stroke-drawn plates — each rect inks its outline on, then fills */
        .sc-plate {
          fill: rgba(183, 188, 233, 0.16);
          stroke: rgba(232, 233, 255, 0.42);
          stroke-width: 1;
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
          animation: sc-draw 900ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
          transition:
            fill 300ms cubic-bezier(0.16, 1, 0.3, 1),
            stroke 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes sc-draw {
          from {
            stroke-dashoffset: 100;
            fill-opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            fill-opacity: 1;
          }
        }

        .sc-card.is-on .sc-plate {
          fill: rgba(183, 188, 233, 0.26);
          stroke: rgba(232, 233, 255, 0.6);
        }

        .sc-card.is-on .sc-plate.is-first {
          fill: rgba(224, 183, 104, 0.4);
          stroke: rgba(224, 183, 104, 0.85);
        }

        .sc-seal {
          fill: #e0b768;
          opacity: 0.85;
        }

        .sc-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.24rem;
          line-height: 1.15;
          color: var(--ink, #e8e9ff);
        }

        .sc-count {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
        }

        .sc-count i {
          font-style: normal;
          opacity: 0.55;
          font-size: 0.5rem;
        }

        .sc-line {
          max-width: 24ch;
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--ink-faint, rgba(183, 188, 233, 0.66));
        }

        .sc-plan {
          margin-top: 0.3rem;
          padding: 0.24rem 0.6rem;
          border-radius: 2px;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.5rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(183, 188, 233, 0.66));
          background: rgba(183, 188, 233, 0.12);
        }

        .sc-plan.is-open {
          color: #15174c;
          background: #e0b768;
        }

        @media (max-width: 640px) {
          .sc {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.6rem;
          }
          .sc-card {
            padding: 1rem 0.7rem 1.1rem;
          }
          .sc-shape {
            height: 3.4rem;
          }
          .sc-name {
            font-size: 1.02rem;
          }
          .sc-line {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sc-plate {
            animation: none;
          }
          .sc-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
