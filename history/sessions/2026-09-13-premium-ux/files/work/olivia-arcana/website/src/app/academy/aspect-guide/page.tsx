/**
 * Aspect Guide — Personal-Almanac print register.
 *
 * The aspect reference set as an almanac plate: hairline tab row of the
 * six aspects, an ink-line diagram of the selected angle, dot-labeled
 * commentary sections, and the interactive AspectVisualizer instrument.
 * Tense aspects carry the one oxblood accent; everything else is ink.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/useLocale";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import AspectVisualizer from "@/components/academy/AspectVisualizer";

interface Aspect {
  name: string;
  symbol: string;
  angle: number;
  orb: number;
  harmony: "harmonious" | "tense" | "neutral";
  keywords: string[];
  meaning: string;
  inYourChart: string;
  examples: string[];
}

const ASPECTS: Aspect[] = [
  {
    name: "Conjunction", symbol: "☌", angle: 0, orb: 8, harmony: "neutral",
    keywords: ["fusion", "intensity", "amplification", "unity"],
    meaning: "Two planets occupy the same degree of the zodiac, merging their energies into a single, amplified force. A conjunction is neither inherently good nor bad — it depends entirely on which planets are involved. Sun conjunct Venus radiates warmth and charm. Mars conjunct Pluto radiates volcanic power. The key is that the energies cannot be separated — they operate as one.",
    inYourChart: "Conjunctions show where you have concentrated power. These are your signature themes — the energies that define you most strongly. They can be your greatest gifts or your biggest blind spots, because the planets are so fused you may not even notice them as separate forces.",
    examples: ["Sun ☌ Moon = unified identity and emotions, wholeness", "Venus ☌ Mars = passion and attraction fused, magnetic presence", "Mercury ☌ Jupiter = expansive mind, big ideas, gifted communicator"],
  },
  {
    name: "Sextile", symbol: "⚹", angle: 60, orb: 5, harmony: "harmonious",
    keywords: ["opportunity", "talent", "cooperation", "ease"],
    meaning: "Two planets are 60 degrees apart, creating a gentle, cooperative flow of energy. Sextiles represent talents and opportunities that are available but require conscious effort to activate. Unlike trines (which flow automatically), sextiles are like doors that are unlocked but not open — you still need to turn the handle.",
    inYourChart: "Sextiles show where you have natural aptitude that can be developed into real skill. These are your 'easy wins' — areas where a little effort produces disproportionate results. Don't take them for granted; actively work with these energies to unlock their potential.",
    examples: ["Moon ⚹ Venus = emotional grace, easy charm, artistic sensitivity", "Mercury ⚹ Uranus = inventive thinking, quick wit, original ideas", "Jupiter ⚹ Saturn = balanced growth, disciplined expansion"],
  },
  {
    name: "Square", symbol: "□", angle: 90, orb: 7, harmony: "tense",
    keywords: ["tension", "challenge", "growth", "drive", "friction"],
    meaning: "Two planets are 90 degrees apart, creating persistent friction that demands action. Squares are the engine of your chart — they create the internal pressure that forces growth, achievement, and change. They are uncomfortable, but without them, nothing would ever move. The greatest accomplishments in history were fueled by squares.",
    inYourChart: "Squares show where you experience ongoing tension that you can never fully resolve — only manage and channel. These are your growth edges. The areas where you struggle most are also the areas where you develop the most strength. Lean into squares rather than avoiding them.",
    examples: ["Moon □ Saturn = emotional restriction that builds resilience", "Venus □ Pluto = intense, transformative love that demands authenticity", "Mars □ Uranus = sudden bursts of rebellious energy, accident-prone but innovative"],
  },
  {
    name: "Trine", symbol: "△", angle: 120, orb: 7, harmony: "harmonious",
    keywords: ["flow", "natural talent", "ease", "grace", "gift"],
    meaning: "Two planets are 120 degrees apart (usually in the same element), creating an effortless flow of complementary energy. Trines are your innate gifts — abilities so natural you may not even recognize them as special. They represent areas of life where things come easily, where you're 'a natural.'",
    inYourChart: "Trines show where you have been given cosmic gifts. The danger is complacency — because these areas feel easy, you may never push to develop them fully. A trine without effort becomes wasted potential. The most successful people are those who build on their trines rather than resting on them.",
    examples: ["Sun △ Jupiter = natural confidence, optimism, luck that expands", "Venus △ Neptune = artistic vision, romantic idealism, aesthetic beauty", "Mars △ Saturn = disciplined energy, stamina, ability to work tirelessly"],
  },
  {
    name: "Opposition", symbol: "☍", angle: 180, orb: 8, harmony: "tense",
    keywords: ["awareness", "polarity", "projection", "balance", "relationship"],
    meaning: "Two planets sit directly across from each other on the zodiac wheel, creating a seesaw dynamic between two valid but competing needs. Oppositions often manifest through relationships — you may project one end of the opposition onto partners, friends, or rivals. The goal is not to choose one side, but to integrate both.",
    inYourChart: "Oppositions show where you swing between extremes and often attract people who embody the qualities you've disowned in yourself. These are your relationship patterns. The person who triggers you most is usually carrying the other end of your opposition. Integration means owning BOTH sides.",
    examples: ["Sun ☍ Moon = head vs heart, public self vs private self", "Venus ☍ Saturn = desire for love vs fear of commitment", "Mars ☍ Neptune = assertive action vs passive surrender, motivation vs escapism"],
  },
  {
    name: "Quincunx", symbol: "⚻", angle: 150, orb: 3, harmony: "tense",
    keywords: ["adjustment", "disconnect", "irritation", "health", "recalibration"],
    meaning: "Two planets are 150 degrees apart — close enough to affect each other but with nothing in common (different element, different modality). This creates a persistent, low-grade sense that something is 'off.' Quincunxes require constant adjustment, like wearing shoes that almost fit. They are associated with health issues because the body often expresses what the psyche cannot resolve.",
    inYourChart: "Quincunxes show where you experience a nagging disconnect that can never be fully reconciled — only managed through ongoing adjustment. These are your 'splinters' — small enough to ignore, painful enough to notice. Pay attention to health signals in these areas.",
    examples: ["Sun ⚻ Neptune = identity confusion, difficulty seeing yourself clearly", "Moon ⚻ Uranus = emotional disruptions, need for independence clashing with need for security", "Venus ⚻ Saturn = love that requires constant compromise and recalibration"],
  },
];

// ── Local UI copy (EN/UK) for strings without translation keys ─────────
const UI = {
  en: {
    kicker: "Reference",
    chooseAspect: "Choose an aspect",
    orb: "Orb",
    harmony: { harmonious: "Harmonious", tense: "Tense", neutral: "Neutral" } as Record<Aspect["harmony"], string>,
    meaningLabel: "What it means",
    chartLabel: "In your chart",
    examplesLabel: "Examples",
    instrumentKicker: "The instrument",
    instrumentLead: "Set any two planets at any angle and watch the nature of their relationship change.",
    courseCta: "Take the full aspects course",
  },
  uk: {
    kicker: "Довідник",
    chooseAspect: "Оберіть аспект",
    orb: "Орб",
    harmony: { harmonious: "Гармонійний", tense: "Напружений", neutral: "Нейтральний" } as Record<Aspect["harmony"], string>,
    meaningLabel: "Що це означає",
    chartLabel: "У вашій карті",
    examplesLabel: "Приклади",
    instrumentKicker: "Інструмент",
    instrumentLead: "Розташуйте будь-які дві планети під будь-яким кутом і спостерігайте, як змінюється характер їхніх стосунків.",
    courseCta: "Пройти повний курс про аспекти",
  },
};

// Round to 3 decimal places so SSR + client emit identical strings.
// Without this, JS float serialization differs across runtimes and React 19
// throws hydration mismatch warnings on every <line> coord.
const r3 = (n: number) => Number(n.toFixed(3));

// ── Ink-line diagram of the selected angle ─────────────────────────────
function AspectSVG({ angle, tense }: { angle: number; tense: boolean }) {
  const cx = 80, cy = 80, r = 65;
  const rad1 = (-90) * Math.PI / 180;
  const rad2 = (angle - 90) * Math.PI / 180;
  const x1 = r3(cx + r * Math.cos(rad1));
  const y1 = r3(cy + r * Math.sin(rad1));
  const x2 = r3(cx + r * Math.cos(rad2));
  const y2 = r3(cy + r * Math.sin(rad2));
  const lineColor = tense ? "#e0b768" : "#e8dcc8";

  return (
    <svg viewBox="0 0 160 160" style={{ width: "140px", height: "140px" }} aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(232,233,255,0.25)" strokeWidth="1" />
      {/* Zodiac ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const inner = r - 4;
        const outer = r;
        return <line key={i}
          x1={r3(cx + inner * Math.cos(a))} y1={r3(cy + inner * Math.sin(a))}
          x2={r3(cx + outer * Math.cos(a))} y2={r3(cy + outer * Math.sin(a))}
          stroke="rgba(232,233,255,0.3)" strokeWidth="0.5" />;
      })}
      {/* Aspect line */}
      {angle > 0 && (
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={lineColor}
          strokeWidth={1.5}
          strokeDasharray={tense ? "4 3" : "none"}
        />
      )}
      {/* Planet dots */}
      <circle cx={x1} cy={y1} r={5} fill="#e8dcc8" />
      <circle cx={x2} cy={y2} r={5} fill={lineColor} />
      {/* Angle label */}
      <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="central"
        fill="rgba(232,233,255,0.55)"
        fontSize="11" style={{ fontFamily: "var(--font-mono, ui-monospace), monospace" }}>{angle}°</text>
    </svg>
  );
}

export default function AspectGuidePage() {
  const { t, locale } = useLocale();
  const ui = locale === "uk" ? UI.uk : UI.en;
  const [selected, setSelected] = useState<number>(0);
  const aspect = ASPECTS[selected];

  return (
    <AlmanacShell>
      <div className="asp">
        {/* ── Header ── */}
        <header className="asp-head">
          <Link href="/academy" className="asp-back">
            ← {t("academy_back")}
          </Link>
          <p className="alm-kicker">
            <span aria-hidden>✦</span>
            {ui.kicker}
          </p>
          <h1 className="alm-h1">{t("academy_aspect_guide")}</h1>
          <p className="alm-lead asp-lead">{t("academy_aspect_guide_desc")}</p>
        </header>

        {/* ── Aspect tab row ── */}
        <div className="asp-tabs" role="group" aria-label={ui.chooseAspect}>
          {ASPECTS.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setSelected(i)}
              className={`asp-tab ${selected === i ? "on" : ""}`}
              aria-pressed={selected === i}
            >
              <span className="asp-tab-symbol" aria-hidden>{a.symbol}</span>
              <span className="asp-tab-name">{a.name}</span>
              <span className="asp-tab-deg">{a.angle}°</span>
            </button>
          ))}
        </div>

        {/* ── Selected aspect plate ── */}
        <article className="asp-detail alm-card">
          <div className="asp-top">
            <AspectSVG angle={aspect.angle} tense={aspect.harmony === "tense"} />
            <div className="asp-id">
              <h2 className="alm-h2 asp-name">
                <span className="asp-glyph" aria-hidden>{aspect.symbol}</span>
                {aspect.name}
              </h2>
              <p className="alm-caption asp-meta">
                {aspect.angle}° · {ui.orb} ±{aspect.orb}° ·{" "}
                <span className={aspect.harmony === "tense" ? "asp-meta-ox" : undefined}>
                  {ui.harmony[aspect.harmony]}
                </span>
              </p>
              <div className="asp-keys">
                {aspect.keywords.map((k) => (
                  <span key={k} className="asp-key">{k}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="asp-section">
            <p className="alm-caption asp-label">{ui.meaningLabel}</p>
            <p className="asp-body">{aspect.meaning}</p>
          </div>

          <div className="asp-section">
            <p className="alm-caption asp-label">{ui.chartLabel}</p>
            <p className="asp-body">{aspect.inYourChart}</p>
          </div>

          <div className="asp-section">
            <p className="alm-caption asp-label">{ui.examplesLabel}</p>
            <ul className="asp-ex">
              {aspect.examples.map((ex) => (
                <li key={ex} className="asp-ex-row">{ex}</li>
              ))}
            </ul>
          </div>
        </article>

        {/* ── Interactive instrument ── */}
        <section className="asp-instrument">
          <p className="alm-kicker">
            <span aria-hidden>✦</span>
            {ui.instrumentKicker}
          </p>
          <p className="asp-instrument-lead">{ui.instrumentLead}</p>
          <div className="alm-card">
            <AspectVisualizer />
          </div>
        </section>

        {/* ── Course link ── */}
        <div className="asp-cta">
          <Link href="/academy/conversation-between-planets" className="alm-link">
            {ui.courseCta} →
          </Link>
        </div>
      </div>

      <style jsx>{`
        .asp {
          width: min(100%, 52rem);
          margin: 0 auto;
        }

        .asp-head {
          margin-bottom: clamp(1.8rem, 4vw, 2.8rem);
        }

        .asp :global(.asp-back) {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          margin-bottom: 0.9rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .asp :global(.asp-back:hover) {
          color: var(--ox);
        }

        .asp-lead {
          margin: 1.1rem 0 0;
          max-width: 58ch;
        }

        /* ── Tab row ─────────────────────────────────────────── */
        .asp-tabs {
          display: flex;
          flex-wrap: wrap;
          border-top: 3px solid var(--ink);
          border-bottom: 1px solid var(--hairline);
          margin-bottom: clamp(1.4rem, 3vw, 2rem);
        }

        .asp-tab {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          min-width: 6.5rem;
          padding: 0.85rem 0.6rem 0.7rem;
          background: none;
          border: none;
          border-right: 1px solid var(--hairline);
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: background 200ms var(--ease), border-color 200ms var(--ease);
        }

        .asp-tab:last-child {
          border-right: none;
        }

        .asp-tab:hover {
          background: rgba(232, 233, 255, 0.04);
        }

        .asp-tab.on {
          border-bottom-color: var(--ox);
        }

        .asp-tab-symbol {
          font-size: 1.15rem;
          line-height: 1;
          color: var(--ink-soft);
        }

        .asp-tab.on .asp-tab-symbol {
          color: var(--ox);
        }

        .asp-tab-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--ink);
        }

        .asp-tab-deg {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: var(--ink-faint);
        }

        /* ── Detail plate ────────────────────────────────────── */
        .asp-top {
          display: flex;
          gap: 1.4rem;
          align-items: center;
          flex-wrap: wrap;
          padding-bottom: 1.1rem;
          border-bottom: 1px solid var(--hairline);
        }

        .asp-id {
          flex: 1 1 16rem;
          min-width: 0;
        }

        .asp-name {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
        }

        .asp-glyph {
          color: var(--ox);
          font-size: 1.4rem;
        }

        .asp-meta {
          margin: 0.5rem 0 0.8rem;
        }

        .asp-meta-ox {
          color: var(--ox);
        }

        .asp-keys {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .asp-key {
          padding: 0.22rem 0.6rem;
          border: 1px solid var(--hairline);
          background: rgba(232, 233, 255, 0.03);
          font-size: 0.72rem;
          color: var(--ink-soft);
        }

        .asp-section {
          margin-top: 1.4rem;
        }

        .asp-label {
          margin: 0 0 0.5rem;
        }

        .asp-body {
          margin: 0;
          max-width: 64ch;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .asp-ex {
          margin: 0;
          padding: 0;
          list-style: none;
          border-top: 1px solid var(--hairline);
        }

        .asp-ex-row {
          padding: 0.65rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          color: var(--ink-soft);
          font-size: 0.84rem;
          line-height: 1.55;
        }

        /* ── Instrument ──────────────────────────────────────── */
        .asp-instrument {
          margin-top: clamp(2.2rem, 5vw, 3.4rem);
        }

        .asp-instrument-lead {
          margin: 0 0 1.1rem;
          max-width: 58ch;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        /* ── Course link ─────────────────────────────────────── */
        .asp-cta {
          margin-top: clamp(1.8rem, 4vw, 2.6rem);
          text-align: center;
        }

        @media (max-width: 560px) {
          .asp-tab {
            min-width: 5rem;
          }

          .asp-top {
            justify-content: center;
            text-align: center;
          }

          .asp-name {
            justify-content: center;
          }

          .asp-keys {
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .asp :global(.asp-back),
          .asp-tab {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
