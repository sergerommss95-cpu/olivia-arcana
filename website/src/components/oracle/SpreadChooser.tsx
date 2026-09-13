"use client";

/**
 * SpreadChooser — choosing the shape of the reading.
 *
 * Each spread is shown as its own small plate: the actual arrangement of
 * its positions drawn to scale, the name, how many cards it takes, and
 * the line that says what it is for. The diagram is generated from the
 * same coordinates the dealing table uses, so what you pick is literally
 * what gets dealt.
 */

import React from "react";
import { motion } from "framer-motion";
import { SPREADS, type Spread } from "@/lib/spreads";
import { entitlementFor } from "@/lib/plans";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  value: Spread;
  onChange: (s: Spread) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** The spread's own coordinates, drawn small. */
function ShapeDiagram({ spread }: { spread: Spread }) {
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
            transform={p.rotated ? `rotate(90 ${cx} ${cy})` : undefined}
            className={`sc-plate ${i === 0 ? "is-first" : ""}`}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        );
      })}
    </svg>
  );
}

export default function SpreadChooser({ value, onChange }: Props) {
  const { tier } = useSubscription();

  return (
    <div className="sc" role="radiogroup" aria-label="Choose the shape of the reading">
      {SPREADS.map((s, i) => {
        const ent = entitlementFor(s.feature, tier);
        const active = s.id === value.id;
        return (
          <motion.button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`sc-card glass ${active ? "is-on" : ""}`}
            onClick={() => onChange(s)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.06 * i }}
            whileHover={{ y: -4 }}
          >
            <ShapeDiagram spread={s} />
            <span className="sc-name">{s.name}</span>
            <span className="sc-count">{s.count} cards</span>
            <span className="sc-line">{s.line}</span>
            {ent.requiredPlan.rank > 0 && (
              <span className={`sc-plan ${ent.openWhilePaused ? "is-open" : ""}`}>
                {ent.openWhilePaused ? `${ent.requiredPlan.name} · open now` : ent.requiredPlan.name}
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

        .sc-card {
          position: relative;
          display: grid;
          justify-items: center;
          align-content: start;
          gap: 0.42rem;
          padding: 1.3rem 1.1rem 1.5rem;
          border: 0;
          cursor: pointer;
          text-align: center;
          color: inherit;
          font: inherit;
          transition: box-shadow 340ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sc-card.is-on {
          box-shadow:
            inset 0 0 0 1px rgba(224, 183, 104, 0.5),
            0 1.2rem 2.8rem rgba(5, 7, 32, 0.35);
        }

        .sc-shape {
          width: 100%;
          height: 4.6rem;
          margin-bottom: 0.35rem;
        }

        .sc-plate {
          fill: rgba(183, 188, 233, 0.16);
          stroke: rgba(232, 233, 255, 0.4);
          stroke-width: 0.9;
          transition: fill 300ms cubic-bezier(0.16, 1, 0.3, 1), stroke 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sc-card.is-on .sc-plate {
          fill: rgba(183, 188, 233, 0.26);
          stroke: rgba(232, 233, 255, 0.6);
        }

        .sc-card.is-on .sc-plate.is-first {
          fill: rgba(224, 183, 104, 0.4);
          stroke: rgba(224, 183, 104, 0.85);
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
      `}</style>
    </div>
  );
}
