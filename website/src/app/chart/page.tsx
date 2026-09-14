/**
 * Birth Chart — the wheel of houses, printed in the Personal-Almanac register.
 *
 * One composed page:
 *   1. No data → engraved ghost wheel + the shared BirthDataForm plate
 *   2. Computing → a quiet beat while the ephemeris is read
 *   3. With data → a fixed atlas, guided planetary stories and linked aspects
 *
 * Computes real natal chart from birth data.
 * Click any planet → see what it means in YOUR chart.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import NatalAtlas from "@/components/chart/NatalAtlas";
import { computeNatalChart, type NatalChart, type BirthInput } from "@/lib/natal-chart";
import { saveUser, loadChart } from "@/lib/user-store";
import BirthDataForm, { type BirthFormValue } from "@/components/birth/BirthDataForm";
import Paywall from "@/components/Paywall";
import { utcOffsetHours } from "@/lib/cities";

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  // Round to 3 decimals — trig results differ in the last bits between the
  // server and the browser, which trips React hydration on the SSR'd ghost.
  return {
    x: Math.round((cx + r * Math.cos(rad)) * 1000) / 1000,
    y: Math.round((cy + r * Math.sin(rad)) * 1000) / 1000,
  };
}

// U+FE0E variation selectors force text presentation — engraved ink, not emoji.
const SIGN_GLYPHS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];

/** The empty state: a faint engraved wheel, waiting for its data. */
function GhostWheel({ caption, waiting }: { caption: string; waiting?: boolean }) {
  return (
    <figure className={`gw ${waiting ? "gw-wait" : ""}`}>
      <svg viewBox="0 0 440 440" aria-hidden className="gw-svg">
        <g fill="none" stroke="currentColor">
          <circle cx={220} cy={220} r={214} strokeWidth="1" />
          <circle cx={220} cy={220} r={208} strokeWidth="0.5" opacity={0.5} />
          <circle cx={220} cy={220} r={176} strokeWidth="0.6" />
          <circle cx={220} cy={220} r={148} strokeWidth="0.5" opacity={0.7} />
          <circle cx={220} cy={220} r={80} strokeWidth="0.5" opacity={0.5} />
          {Array.from({ length: 12 }, (_, i) => {
            const s = polarToCart(220, 220, 176, i * 30);
            const e = polarToCart(220, 220, 208, i * 30);
            return <line key={i} x1={s.x} y1={s.y} x2={e.x} y2={e.y} strokeWidth="0.5" opacity={0.6} />;
          })}
          {Array.from({ length: 36 }, (_, i) => {
            if (i % 3 === 0) return null;
            const s = polarToCart(220, 220, 176, i * 10);
            const e = polarToCart(220, 220, 170, i * 10);
            return <line key={`t-${i}`} x1={s.x} y1={s.y} x2={e.x} y2={e.y} strokeWidth="0.5" opacity={0.4} />;
          })}
        </g>
        <g className="gw-ring" style={{ transformOrigin: "220px 220px" }}>
          {SIGN_GLYPHS.map((glyph, i) => {
            const pos = polarToCart(220, 220, 192, i * 30 + 15);
            return (
              <text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="currentColor"
                opacity={0.6}
                fontSize="15"
                style={{ fontFamily: "serif" }}
              >
                {glyph}
              </text>
            );
          })}
        </g>
        <text
          x={220}
          y={221}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--ox, #e0b768)"
          fontSize="13"
          className={waiting ? "gw-star" : undefined}
          style={{ fontFamily: "serif" }}
        >
          ✦
        </text>
      </svg>
      <figcaption className="alm-caption gw-cap">{caption}</figcaption>
    </figure>
  );
}

export default function ChartPage() {
  // Chart + page phase
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [phase, setPhase] = useState<"form" | "computing" | "error">("form");
  const computeTimer = useRef<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusResult = useRef(false);

  // Staged reveal: true for the first beats after a chart arrives.
  const [intro, setIntro] = useState(false);
  const introTimer = useRef<number | null>(null);

  const beginIntro = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIntro(true);
    if (introTimer.current) window.clearTimeout(introTimer.current);
    introTimer.current = window.setTimeout(() => setIntro(false), 1000);
  }, []);

  // Auto-load from localStorage if user already entered data elsewhere
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadChart();
      if (saved) {
        beginIntro();
        setChart(saved);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      if (introTimer.current) window.clearTimeout(introTimer.current);
      if (computeTimer.current) window.clearTimeout(computeTimer.current);
    };
  }, [beginIntro]);

  const generate = useCallback((v: BirthFormValue) => {
    setPhase("computing");
    // Let the busy state paint, then compute without an artificial ritual delay.
    if (computeTimer.current) window.clearTimeout(computeTimer.current);
    computeTimer.current = window.setTimeout(() => {
      try {
        const [y, m, d] = v.date.split("-").map(Number);
        const hour = v.timeUnknown ? 12 : parseInt(v.time.split(":")[0] || "12", 10);
        const minute = v.timeUnknown ? 0 : parseInt(v.time.split(":")[1] || "0", 10);

        // Historical offset for that wall-clock instant (DST, zone reforms);
        // the fixed city offset stands in only if the runtime lacks the zone.
        const zoneOff = utcOffsetHours(v.city.zone, y, m, d, hour, minute);
        const timezone = Number.isFinite(zoneOff) ? zoneOff : v.city.tz;

        const input = {
          year: y, month: m, day: d, hour, minute,
          latitude: v.city.lat, longitude: v.city.lon, timezone,
          timeKnown: !v.timeUnknown,
          name: v.name,
          city: v.city.name,
        } as BirthInput;
        const computed = computeNatalChart(input);
        saveUser(input, computed);
        focusResult.current = true;
        beginIntro();
        setChart(computed);
        setPhase("form");
      } catch {
        setPhase("error");
      }
    }, 80);
  }, [beginIntro]);

  useEffect(() => {
    if (chart && focusResult.current) {
      focusResult.current = false;
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [chart]);

  return (
    <AlmanacShell>
      <div className="chart">
        {/* Header */}
        <header className="ch-head">
          <p className="alm-kicker">Your personal atlas · Plate 01</p>
          <h1 className="alm-h1" ref={heading} tabIndex={-1}>{chart ? "The sky you arrived under." : "A sky, entirely yours."}</h1>
          <p className="alm-lead ch-sub">
            {chart ? "Start with your Sun. Follow a planet, trace a relationship, find the story in the geometry." : "Your birth chart places the planets at the moment you arrived. Bring your date, place and, if you know it, your time."}
          </p>
        </header>

        {/* ── ONE COMPOSED BAND: ghost wheel + the shared plate ── */}
        {!chart && phase !== "error" && (
          <div className="ch-compose">
            <div className="ch-compose-fig">
              <GhostWheel
                caption={phase === "computing" ? "Fig. 1 — reading the ephemeris" : "Fig. 1 — awaiting birth data"}
                waiting={phase === "computing"}
              />
            </div>
            <div className="ch-compose-form">
              {phase === "computing" ? (
                <div className="ch-wait" role="status">
                  <span className="ch-wait-star" aria-hidden>✦</span>
                  <p className="ch-wait-line">Reading the ephemeris</p>
                  <p className="alm-caption">houses · aspects · dignities</p>
                </div>
              ) : (
                <BirthDataForm
                  onSubmit={generate}
                  copy={{ fig: "Fig. 1 — the birth data", submit: "Draw my birth chart" }}
                />
              )}
            </div>
          </div>
        )}

        {/* ── ERROR — in the house voice ── */}
        {!chart && phase === "error" && (
          <div className="ch-error" role="alert">
            <p className="alm-kicker">We couldn’t draw your chart</p>
            <p className="ch-error-line">
              Check your birth date and choose a place from the suggestions, then try again.
            </p>
            <button type="button" className="alm-link ch-error-btn" onClick={() => setPhase("form")}>
              Return to the form →
            </button>
          </div>
        )}

        {/* ── CHART VIEW (Insight tier and above) ── */}
        {chart && (
          <div className="alm-gate">
            <Paywall requires="insight" priceKey="insight_monthly" featureName="your full natal chart">
              <NatalAtlas chart={chart} intro={intro} onNewChart={() => { setChart(null); setPhase("form"); }} />
            </Paywall>
          </div>
        )}
      </div>

      <style jsx>{`
        .chart {
          max-width: 74rem;
          margin: 0 auto;
        }

        /* ── Editorial title and the engraved birth-data band ── */
        .ch-head {
          margin-bottom: clamp(2rem, 5vw, 3rem);
          text-align: left;
        }

        .ch-head h1 {
          max-width: 16ch;
          font-size: clamp(3rem, 6.4vw, 5.5rem);
          line-height: .98;
          scroll-margin-top: 6rem;
        }

        .ch-head h1:focus { outline: none; }

        .ch-sub {
          margin: 1.2rem 0 0;
          max-width: 50ch;
        }

        /* ── The composed band: ghost wheel + plate ─────────────── */
        .ch-compose {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 27rem);
          gap: clamp(2rem, 5vw, 3.5rem);
          align-items: center;
          justify-items: center;
          max-width: 58rem;
          margin: 0 auto;
        }

        .ch-compose-fig,
        .ch-compose-form {
          width: 100%;
          min-width: 0;
        }

        @media (max-width: 880px) {
          .ch-compose {
            grid-template-columns: minmax(0, 1fr);
            gap: 2.4rem;
          }

          /* form first on small screens; the ghost fills the tail */
          .ch-compose-form {
            order: 1;
          }

          .ch-compose-fig {
            order: 2;
          }
        }

        /* ── Ghost wheel — the empty state, engraved faint ───────── */
        :global(.gw) {
          margin: 0;
          width: 100%;
          text-align: center;
          color: var(--ink);
        }

        :global(.gw-svg) {
          width: min(100%, 27rem);
          height: auto;
          opacity: 0.3;
          transition: opacity 700ms var(--ease);
        }

        :global(.gw-wait .gw-svg) {
          opacity: 0.55;
        }

        :global(.gw-wait .gw-ring) {
          opacity: .75;
        }

        :global(.gw-star) {
          animation: gw-pulse 1.8s var(--ease) infinite;
        }

        :global(.gw-cap) {
          display: block;
          margin-top: 0.9rem;
        }

        @keyframes gw-pulse {
          50% {
            opacity: 0.35;
          }
        }

        /* ── The computing beat ──────────────────────────────────── */
        .ch-wait {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
          padding: 3rem 1.5rem;
          border: 1px solid var(--hairline);
          outline: 1px solid rgba(232, 233, 255, 0.08);
          outline-offset: 6px;
          background: rgba(10, 13, 56, 0.28);
          max-width: 26rem;
          margin: 0 auto;
          text-align: center;
        }

        .ch-wait-star {
          color: var(--ox);
          font-size: 1.3rem;
          animation: gw-pulse 1.8s var(--ease) infinite;
        }

        .ch-wait-line {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.3rem;
          font-style: italic;
          color: var(--ink);
        }

        /* ── Error, in the house voice ───────────────────────────── */
        .ch-error {
          max-width: 30rem;
          margin: 0 auto;
          padding: 2.6rem 1.8rem;
          border: 1px solid var(--hairline);
          outline: 1px solid rgba(232, 233, 255, 0.08);
          outline-offset: 6px;
          background: rgba(10, 13, 56, 0.28);
          text-align: center;
        }

        .ch-error-line {
          margin: 0 0 1.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.2rem;
          font-style: italic;
          line-height: 1.5;
          color: var(--ink-soft);
        }

        .ch-error-btn {
          border: none;
        }

        /* ── Paywall gate, re-inked ─────────────────────────── */
        .alm-gate :global(.glass-card) {
          background: linear-gradient(160deg, rgba(183, 188, 233, 0.1) 0%, rgba(10, 16, 36, 0.42) 100%) !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          color: var(--ink);
        }

        .alm-gate :global(.glass-card h3) {
          color: var(--ink) !important;
          font-family: var(--font-heading, "Cormorant Garamond"), serif !important;
          font-weight: 500;
        }

        .alm-gate :global([class*="text-muted-lavender"]) {
          color: var(--ink-soft) !important;
        }

        .alm-gate :global(.glass-card button) {
          background: var(--ink) !important;
          color: #f6f1e5 !important;
          border: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          border-radius: 999px;
        }

        .alm-gate :global(.glass-card button:hover) {
          background: var(--ox) !important;
        }

        .alm-gate :global(.glass-card [class*="mb-"]) {
          display: none !important;
        }

        .alm-gate :global(.animate-pulse div) {
          background: rgba(232, 233, 255, 0.07) !important;
        }

        .alm-gate :global(.text-red-400) {
          color: var(--ox) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.gw-ring),
          :global(.gw-star),
          .ch-wait-star {
            animation: none;
          }


        }
      `}</style>
    </AlmanacShell>
  );
}
