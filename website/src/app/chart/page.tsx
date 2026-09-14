/**
 * Birth Chart — the wheel of houses, printed in the Personal-Almanac register.
 *
 * One composed page:
 *   1. No data → engraved ghost wheel + the shared BirthDataForm plate
 *   2. Computing → a quiet beat while the ephemeris is read
 *   3. With data → the wheel draws itself in, the big-three plates ink in
 *      staggered, then aspects, houses, table and legend
 *
 * Computes real natal chart from birth data.
 * Click any planet → see what it means in YOUR chart.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { computeNatalChart, type NatalChart, type BirthInput } from "@/lib/natal-chart";
import { saveUser, loadChart } from "@/lib/user-store";
import { getPlanetInSign, PLANET_MEANING, HOUSE_MEANING } from "@/lib/planet-interpretations";
import BirthDataForm, { type BirthFormValue } from "@/components/birth/BirthDataForm";
import FlattenedSky from "./FlattenedSky";
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

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻",
};

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
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<"sky" | "wheel" | "table">("sky");
  // How the sky view is entered: cold, or raised back up from the plate.
  const [skyEntry, setSkyEntry] = useState<"sky" | "raise">("sky");

  // Staged reveal: true for the first beats after a chart arrives.
  const [intro, setIntro] = useState(false);
  const introTimer = useRef<number | null>(null);

  const beginIntro = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIntro(true);
    if (introTimer.current) window.clearTimeout(introTimer.current);
    introTimer.current = window.setTimeout(() => setIntro(false), 2900);
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
    };
  }, [beginIntro]);

  const generate = useCallback((v: BirthFormValue) => {
    setPhase("computing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A quiet beat while the ephemeris is read.
    window.setTimeout(() => {
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
        setSelected(null);
        setView("sky");
        setSkyEntry("sky");
        beginIntro();
        setChart(computed);
        setPhase("form");
      } catch {
        setPhase("error");
      }
    }, reduced ? 150 : 1300);
  }, [beginIntro]);

  const hasAsc = !!chart?.ascendant;
  const selectedPlanet = selected !== null ? chart?.planets[selected] : null;

  // Big-three plates — honest when the birth hour is unknown.
  const threePlates = chart
    ? [
        { glyph: "☉", title: `Sun in ${chart.sunSign}`, label: "Core identity" },
        { glyph: "☽", title: `Moon in ${chart.moonSign}`, label: "Emotional nature" },
        hasAsc
          ? { glyph: "↑", title: `${chart.risingSign} rising`, label: "How others see you" }
          : { glyph: "↑", title: "Rising unmarked", label: "birth hour unknown" },
      ]
    : [];

  // Intro helpers — animation class + delay while the reveal is staged.
  // (styled-jsx rewrites className props it can see, so classes must be
  // passed as direct attributes, never through prop spreads.)
  const stCls = intro ? "st" : "";
  const dly = (d: number): React.CSSProperties | undefined =>
    intro ? ({ "--d": `${d}s` } as React.CSSProperties) : undefined;

  return (
    <AlmanacShell>
      <div className="chart">
        {/* Header */}
        <header className="ch-head">
          <p className="alm-kicker">The wheel of houses</p>
          <h1 className="alm-h1">Your Birth Chart</h1>
          <p className="alm-lead ch-sub">
            {chart ? chart.bigThree : "Three marks — date, hour, place — and the wheel draws itself."}
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
                  copy={{ fig: "Fig. 1 — the birth data", submit: "Compute my chart" }}
                />
              )}
            </div>
          </div>
        )}

        {/* ── ERROR — in the house voice ── */}
        {!chart && phase === "error" && (
          <div className="ch-error" role="alert">
            <p className="alm-kicker">The press jammed</p>
            <p className="ch-error-line">
              The heavens would not resolve for that date and place.
              Check the marks and press again.
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
              {/* The big three — ink in after the wheel draws */}
              <div className="ch-three">
                {threePlates.map((pl, i) => (
                  <div key={pl.label} className={`ch-plate ${stCls}`} style={dly(1.5 + i * 0.16)}>
                    <span className="ch-plate-glyph" aria-hidden>{pl.glyph}</span>
                    <div className="ch-plate-title">{pl.title}</div>
                    <div className="alm-caption ch-plate-label">{pl.label}</div>
                  </div>
                ))}
              </div>

              {/* View toggle + reset */}
              <div className={stCls} style={dly(2.15)}>
                <div className="ch-toggle">
                  {(["sky", "wheel", "table"] as const).map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => {
                        if (v === "sky") setSkyEntry("sky");
                        setView(v);
                      }}
                      aria-pressed={view === v}
                      className={`ch-tab ${view === v ? "on" : ""}`}
                    >
                      {v === "sky" ? "The Sky That Night" : v === "wheel" ? "The Wheel" : "Table View"}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setChart(null); setSelected(null); setPhase("form"); }}
                    className="ch-reset"
                  >
                    New Chart
                  </button>
                </div>
              </div>

              <div className="ch-grid">
                {/* ── THE SKY THAT NIGHT — the wheel revealed as the birth sky ── */}
                {view === "sky" && (
                  <FlattenedSky
                    chart={chart}
                    selected={selected}
                    onSelect={setSelected}
                    entry={skyEntry}
                    onFoldedToPlate={() => {
                      setSkyEntry("sky");
                      setView("wheel");
                    }}
                  />
                )}

                {/* ── WHEEL VIEW — a plate engraving that draws itself in ── */}
                {view === "wheel" && (
                  <figure className="ch-wheel alm-card">
                    <button
                      type="button"
                      className="ch-raise"
                      onClick={() => {
                        setSkyEntry("raise");
                        setView("sky");
                      }}
                    >
                      ✦ RAISE THE SKY
                    </button>
                    <svg viewBox="0 0 500 500" className="ch-svg" role="img" aria-label="Natal chart wheel">
                      {/* Outer frame — first strokes of the engraving */}
                      <circle className={intro ? "cwe" : ""} pathLength={1} cx={250} cy={250} r={244} fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle className={intro ? "cwe" : ""} style={dly(0.15)} pathLength={1} cx={250} cy={250} r={238} fill="none" stroke="currentColor" strokeWidth="0.5" opacity={0.5} />

                      {/* 1. Zodiac ring (outer, slowly turning) */}
                      <g className={`ch-zring ${intro ? "cwf" : ""}`} style={{ transformOrigin: "250px 250px", ...(intro ? { "--d": "0.35s" } : {}) } as React.CSSProperties}>
                        <circle cx={250} cy={250} r={200} fill="none" stroke="currentColor" strokeWidth="0.6" />
                        {SIGN_GLYPHS.map((_, i) => {
                          const a = i * 30;
                          const s = polarToCart(250, 250, 200, a);
                          const e = polarToCart(250, 250, 238, a);
                          return (
                            <line key={`d-${i}`} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="currentColor" strokeWidth="0.5" opacity={0.6} />
                          );
                        })}
                        {SIGN_GLYPHS.map((glyph, i) => {
                          const angle = i * 30 + 15;
                          const pos = polarToCart(250, 250, 219, angle);
                          return (
                            <text
                              key={i}
                              x={pos.x}
                              y={pos.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="currentColor"
                              opacity={0.75}
                              fontSize="16"
                              style={{ fontFamily: "serif", pointerEvents: "none" }}
                            >
                              {glyph}
                            </text>
                          );
                        })}
                      </g>

                      {/* 2. House ring (inner) — houses need a known birth time */}
                      <g className={intro ? "cwf" : ""} style={dly(1.9)}>
                        <circle cx={250} cy={250} r={180} fill="none" stroke="currentColor" strokeWidth="0.6" opacity={0.6} />
                        {hasAsc && chart.houses.map((h, i) => {
                          const angle = h.cusp;
                          const s = polarToCart(250, 250, 60, angle);
                          const e = polarToCart(250, 250, 180, angle);
                          const labelPos = polarToCart(250, 250, 191, angle + 15);
                          return (
                            <g key={i}>
                              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" opacity={0.45} />
                              <text
                                x={labelPos.x}
                                y={labelPos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="currentColor"
                                opacity={0.45}
                                fontSize="8"
                                style={{ fontFamily: "var(--font-mono, monospace)" }}
                              >
                                {i + 1}
                              </text>
                            </g>
                          );
                        })}
                      </g>

                      {/* 3. Aspect lines — selecting a planet lights its
                          own aspects and hushes the rest of the web */}
                      <g className={intro ? "cwf" : ""} style={dly(1.75)}>
                        {chart.aspects.slice(0, 15).map((a, i) => {
                          const p1 = chart.planets.find((p) => p.name === a.planet1);
                          const p2 = chart.planets.find((p) => p.name === a.planet2);
                          if (!p1 || !p2) return null;
                          const pos1 = polarToCart(250, 250, 140, p1.longitude);
                          const pos2 = polarToCart(250, 250, 140, p2.longitude);
                          const tense = a.harmony === "tense";
                          const strength = Math.max(0.2, 1 - a.orb / 10);
                          const selName = selected !== null ? chart.planets[selected]?.name : null;
                          const involves = selName !== null && (a.planet1 === selName || a.planet2 === selName);
                          const opacity = selName
                            ? involves
                              ? tense
                                ? 0.85
                                : 0.62
                              : 0.05
                            : tense
                              ? 0.4
                              : 0.22;
                          return (
                            <path
                              key={i}
                              d={`M ${pos1.x} ${pos1.y} Q 250 250 ${pos2.x} ${pos2.y}`}
                              fill="none"
                              stroke={involves && !tense ? "var(--ox, #e0b768)" : tense ? "var(--ox, #e0b768)" : "currentColor"}
                              strokeWidth={involves ? strength * 2.1 : strength * 1.4}
                              strokeDasharray={tense ? "3 3" : "none"}
                              opacity={opacity}
                              style={{ transition: "opacity 380ms cubic-bezier(0.16,1,0.3,1), stroke-width 380ms cubic-bezier(0.16,1,0.3,1)" }}
                            />
                          );
                        })}
                      </g>

                      {/* 4. Planet nodes */}
                      {chart.planets.map((p, i) => {
                        const pos = polarToCart(250, 250, 140, p.longitude);
                        const isSel = selected === i;
                        return (
                          <g
                            key={p.name}
                            onClick={() => setSelected(isSel ? null : i)}
                            className={intro ? "cwf" : ""}
                            style={{ cursor: "pointer", ...(dly(1.05 + i * 0.07) ?? {}) }}
                          >
                            <line
                              x1={250}
                              y1={250}
                              x2={pos.x}
                              y2={pos.y}
                              stroke={isSel ? "var(--ox, #e0b768)" : "currentColor"}
                              strokeWidth="0.6"
                              opacity={isSel ? 0.55 : 0.1}
                            />
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={isSel ? 15 : 10}
                              fill="var(--paper, #e8dcc8)"
                              stroke={isSel ? "var(--ox, #e0b768)" : "currentColor"}
                              strokeWidth={isSel ? 1.6 : 1}
                              style={{ transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)" }}
                            />
                            <text
                              x={pos.x}
                              y={pos.y + 1}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={isSel ? "var(--ox, #e0b768)" : "currentColor"}
                              fontSize={isSel ? 13 : 10}
                              style={{ pointerEvents: "none", fontFamily: "serif" }}
                            >
                              {p.glyph}
                            </text>
                          </g>
                        );
                      })}

                      {/* Center */}
                      <g className={intro ? "cwf" : ""} style={dly(0.9)}>
                        <circle cx={250} cy={250} r="20" fill="var(--paper, #e8dcc8)" stroke="currentColor" strokeWidth="1" />
                        <text
                          x={250}
                          y={251}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="var(--ox, #e0b768)"
                          fontSize="13"
                          style={{ fontFamily: "serif", pointerEvents: "none" }}
                        >
                          ✦
                        </text>
                      </g>
                    </svg>
                    <figcaption className="alm-caption ch-fig">
                      Fig. 2 — the wheel of houses. Click a planet to read it.
                    </figcaption>
                  </figure>
                )}

                {/* ── TABLE VIEW ── */}
                {view === "table" && (
                  <div className="ch-table alm-card">
                    <span className="alm-caption">Planetary positions</span>
                    <div className="ch-table-rows">
                      {chart.planets.map((p, i) => {
                        const isSel = selected === i;
                        return (
                          <button
                            type="button"
                            key={p.name}
                            onClick={() => setSelected(isSel ? null : i)}
                            aria-pressed={isSel}
                            className={`ch-row ${isSel ? "sel" : ""}`}
                          >
                            <span className="ch-row-glyph" aria-hidden>{p.glyph}</span>
                            <span className="ch-row-name">{p.name}</span>
                            <span className="ch-row-sign" aria-hidden>{p.signGlyph}{"︎"}</span>
                            <span className="ch-row-pos">{p.sign} {p.degree}&deg;</span>
                            <span className="ch-row-house">{hasAsc ? `H${p.house}` : "—"}</span>
                            {p.retrograde && <span className="ch-row-rx">℞</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── DETAIL PANEL ── */}
                <aside className={`ch-panel alm-card ${stCls}`} style={dly(2.3)}>
                  {selectedPlanet ? (
                    <div>
                      <div className="ch-panel-head">
                        <span className="ch-panel-glyph" aria-hidden>{selectedPlanet.glyph}</span>
                        <div>
                          <div className="ch-panel-title">
                            {selectedPlanet.name} in {selectedPlanet.sign}
                          </div>
                          <div className="alm-caption">
                            {selectedPlanet.degree}&deg;
                            {hasAsc && <> &middot; House {selectedPlanet.house}</>}
                            {selectedPlanet.retrograde && " · ℞ Retrograde"}
                          </div>
                        </div>
                      </div>

                      {/* What this planet governs */}
                      <p className="ch-meaning">{PLANET_MEANING[selectedPlanet.name]}</p>

                      {/* Personal interpretation */}
                      <p className="ch-interp">{getPlanetInSign(selectedPlanet.name, selectedPlanet.sign)}</p>

                      {/* House context — silent when the birth hour is unknown */}
                      {hasAsc && HOUSE_MEANING[selectedPlanet.house] && (
                        <div className="ch-house">
                          <div className="ch-house-label alm-caption">
                            House {selectedPlanet.house}: {HOUSE_MEANING[selectedPlanet.house].area}
                          </div>
                          <p className="ch-house-rules">{HOUSE_MEANING[selectedPlanet.house].rules}</p>
                        </div>
                      )}

                      {/* Aspects involving this planet */}
                      {chart.aspects.filter((a) => a.planet1 === selectedPlanet.name || a.planet2 === selectedPlanet.name).length > 0 && (
                        <div className="ch-aspects">
                          <div className="alm-caption">Aspects</div>
                          {chart.aspects
                            .filter((a) => a.planet1 === selectedPlanet.name || a.planet2 === selectedPlanet.name)
                            .slice(0, 5)
                            .map((a, i) => {
                              const other = a.planet1 === selectedPlanet.name ? a.planet2 : a.planet1;
                              const sym = ASPECT_SYMBOLS[a.type] || "·";
                              return (
                                <div key={i} className="ch-aspect-row">
                                  <span className={`ch-aspect-sym ${a.harmony === "tense" ? "tense" : ""}`} aria-hidden>
                                    {sym}
                                  </span>
                                  <span className="ch-aspect-name">{a.type} {other}</span>
                                  <span className="ch-aspect-orb">orb {a.orb}&deg;</span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ch-panel-empty">
                      <span className="ch-panel-star" aria-hidden>✦</span>
                      <p>Click a planet to explore<br />its meaning in your chart</p>
                    </div>
                  )}
                </aside>
              </div>

              {/* Planet legend */}
              <div className={stCls} style={dly(2.45)}>
                <div className="ch-legend">
                  {chart.planets.map((p, i) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => setSelected(selected === i ? null : i)}
                      aria-pressed={selected === i}
                      className={`ch-chip ${selected === i ? "on" : ""}`}
                    >
                      <span aria-hidden>{p.glyph}</span> {p.name}
                    </button>
                  ))}
                </div>

                {/* CTA to portrait */}
                <div className="ch-cta">
                  <TransitionLink href="/portrait" className="alm-link">
                    Get Your Celestial Portrait &rarr;
                  </TransitionLink>
                </div>
              </div>
            </Paywall>
          </div>
        )}
      </div>

      <style jsx>{`
        .chart {
          max-width: 56rem;
          margin: 0 auto;
        }

        /* ── One composed page: everything hangs on the center axis ── */
        .ch-head {
          margin-bottom: clamp(2rem, 5vw, 3rem);
          text-align: center;
        }

        .ch-sub {
          margin: 1rem auto 0;
          max-width: 48ch;
        }

        /* ── The composed band: ghost wheel + plate ─────────────── */
        .ch-compose {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 27rem);
          gap: clamp(2rem, 5vw, 3.5rem);
          align-items: center;
          justify-items: center;
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

        :global(.gw-ring) {
          animation: gw-turn 240s linear infinite;
        }

        :global(.gw-wait .gw-ring) {
          animation-duration: 36s;
        }

        :global(.gw-star) {
          animation: gw-pulse 1.8s var(--ease) infinite;
        }

        :global(.gw-cap) {
          display: block;
          margin-top: 0.9rem;
        }

        @keyframes gw-turn {
          to {
            transform: rotate(360deg);
          }
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

        /* ── The big three, as plates ────────────────────────────── */
        .ch-three {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.9rem;
          max-width: 44rem;
          margin: 0 auto 1.8rem;
        }

        :global(.ch-plate) {
          padding: 1.05rem 0.8rem 0.95rem;
          border: 1px solid var(--hairline);
          background: rgba(10, 13, 56, 0.28);
          text-align: center;
        }

        :global(.ch-plate-glyph) {
          display: block;
          margin-bottom: 0.35rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.4rem;
          line-height: 1;
          color: var(--ox);
        }

        :global(.ch-plate-title) {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.12rem;
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 0.3rem;
        }

        @media (max-width: 560px) {
          .ch-three {
            gap: 0.55rem;
          }

          :global(.ch-plate) {
            padding: 0.8rem 0.4rem 0.7rem;
          }

          :global(.ch-plate-title) {
            font-size: 0.95rem;
          }

          :global(.ch-plate-label) {
            font-size: 0.52rem;
            letter-spacing: 0.14em;
          }
        }

        /* ── Staged reveal ───────────────────────────────────────── */
        :global(.chart .st) {
          opacity: 0;
          transform: translateY(6px);
          animation: ch-rise 650ms var(--ease) forwards;
          animation-delay: var(--d, 0s);
        }

        :global(.ch-svg .cwe) {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: ch-drawon 1.2s var(--ease) forwards;
          animation-delay: var(--d, 0s);
        }

        :global(.ch-svg .cwf) {
          opacity: 0;
          animation: ch-inkfade 700ms var(--ease) forwards;
          animation-delay: var(--d, 0s);
        }

        @keyframes ch-rise {
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes ch-drawon {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes ch-inkfade {
          to {
            opacity: 1;
          }
        }

        /* ── View toggle ────────────────────────────────────── */
        .ch-toggle {
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 1.6rem;
          margin-bottom: 1.6rem;
          border-bottom: 1px solid var(--hairline);
        }

        .ch-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          padding: 0.4rem 0.1rem 0.55rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint);
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .ch-tab:hover {
          color: var(--ink);
        }

        .ch-tab.on {
          color: var(--ox);
          border-bottom-color: var(--ox);
        }

        .ch-reset {
          background: none;
          border: none;
          padding: 0.4rem 0.1rem 0.55rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          transition: color 200ms var(--ease);
        }

        .ch-reset:hover {
          color: var(--ox);
        }

        /* ── Layout ─────────────────────────────────────────── */
        .ch-grid {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-start;
        }

        .ch-wheel {
          margin: 0;
          text-align: center;
          color: var(--ink);
        }

        .ch-svg {
          width: min(86vw, 440px);
          height: auto;
          color: var(--ink);
        }

        .ch-zring {
          animation: ch-turn 240s linear infinite;
        }

        @keyframes ch-turn {
          to {
            transform: rotate(360deg);
          }
        }

        .ch-fig {
          display: block;
          margin-top: 0.9rem;
        }

        /* ── Raise the sky — the wheel remembers what it was ── */
        .ch-raise {
          display: inline-block;
          margin-bottom: 0.8rem;
          background: none;
          border: 1px solid var(--hairline);
          padding: 0.34rem 0.8rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.54rem;
          letter-spacing: 0.18em;
          color: var(--ink-soft);
          transition: color 250ms var(--ease), border-color 250ms var(--ease);
        }

        .ch-raise:hover {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        /* ── Table ──────────────────────────────────────────── */
        .ch-table {
          width: min(90vw, 430px);
        }

        .ch-table-rows {
          margin-top: 0.75rem;
          border-top: 1px solid var(--hairline);
        }

        .ch-row {
          display: flex;
          align-items: baseline;
          gap: 0.55rem;
          width: 100%;
          padding: 0.6rem 0.4rem;
          background: none;
          border: none;
          border-bottom: 1px solid var(--hairline);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 200ms var(--ease);
        }

        .ch-row:hover {
          background: rgba(232, 233, 255, 0.06);
        }

        .ch-row.sel {
          background: rgba(232, 233, 255, 0.08);
          box-shadow: inset 2px 0 0 var(--ox);
        }

        .ch-row-glyph {
          width: 1.4rem;
          text-align: center;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.05rem;
          color: var(--ink);
        }

        .ch-row-name {
          width: 4.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.02rem;
          font-weight: 600;
          color: var(--ink);
        }

        .ch-row-sign {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.8rem;
          color: var(--ink-faint);
        }

        .ch-row-pos {
          flex: 1;
          font-size: 0.82rem;
          color: var(--ink-soft);
        }

        .ch-row-house {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
        }

        .ch-row-rx {
          color: var(--ox);
          font-size: 0.7rem;
        }

        /* ── Detail panel ───────────────────────────────────── */
        .ch-panel {
          width: min(90vw, 320px);
          min-height: 200px;
        }

        .ch-panel-head {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 0.85rem;
        }

        .ch-panel-glyph {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          color: var(--ink);
        }

        .ch-panel-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--ink);
        }

        .ch-meaning {
          margin: 0 0 0.7rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.95rem;
          font-style: italic;
          color: var(--ink-faint);
          line-height: 1.5;
        }

        .ch-interp {
          margin: 0 0 0.9rem;
          font-size: 0.92rem;
          line-height: 1.68;
          color: var(--ink-soft);
        }

        .ch-house {
          padding: 0.7rem 0 0;
          border-top: 1px solid var(--hairline);
        }

        .ch-house-label {
          color: var(--ox);
        }

        .ch-house-rules {
          margin: 0.35rem 0 0;
          font-size: 0.8rem;
          line-height: 1.55;
          color: var(--ink-soft);
        }

        .ch-aspects {
          margin-top: 0.9rem;
          padding-top: 0.7rem;
          border-top: 1px solid var(--hairline);
        }

        .ch-aspect-row {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
          padding: 0.28rem 0;
          font-size: 0.8rem;
        }

        .ch-aspect-sym {
          color: var(--ink-soft);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
        }

        .ch-aspect-sym.tense {
          color: var(--ox);
        }

        .ch-aspect-name {
          color: var(--ink-soft);
        }

        .ch-aspect-orb {
          margin-left: auto;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: var(--ink-faint);
        }

        .ch-panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 180px;
          text-align: center;
        }

        .ch-panel-star {
          margin-bottom: 0.75rem;
          color: var(--ox);
          font-size: 1.3rem;
        }

        .ch-panel-empty p {
          margin: 0;
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--ink-faint);
        }

        /* ── Legend ─────────────────────────────────────────── */
        .ch-legend {
          margin: 1.6rem auto 0;
          max-width: 40rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: center;
        }

        .ch-chip {
          display: inline-flex;
          align-items: baseline;
          gap: 0.3rem;
          padding: 0.3rem 0.7rem;
          background: none;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .ch-chip:hover {
          color: var(--ink);
          border-color: var(--ink-faint);
        }

        .ch-chip.on {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        .ch-cta {
          margin-top: 2rem;
          text-align: center;
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
          .ch-zring,
          :global(.gw-ring),
          :global(.gw-star),
          .ch-wait-star {
            animation: none;
          }

          :global(.chart .st),
          :global(.ch-svg .cwe),
          :global(.ch-svg .cwf) {
            animation: none;
            opacity: 1;
            transform: none;
            stroke-dashoffset: 0;
          }

          .ch-tab,
          .ch-reset,
          .ch-row,
          .ch-chip {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
