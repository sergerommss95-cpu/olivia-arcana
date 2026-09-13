/**
 * Birth Chart — the wheel of houses, printed in the Personal-Almanac register.
 *
 * Two modes:
 *   1. No data → birth data input form (same as portrait)
 *   2. With data → engraved SVG wheel + planet detail panel + interpretations
 *
 * Computes real natal chart from birth data.
 * Click any planet → see what it means in YOUR chart.
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { computeNatalChart, type NatalChart, type BirthInput } from "@/lib/natal-chart";
import { saveUser, loadChart } from "@/lib/user-store";
import { getPlanetInSign, PLANET_MEANING, HOUSE_MEANING } from "@/lib/planet-interpretations";
import BirthDatePicker from "@/components/BirthDatePicker";
import CityAutocomplete from "@/components/CityAutocomplete";
import Paywall from "@/components/Paywall";
import { type CityData, utcOffsetHours, fmtUtcOffset, isSummerTime } from "@/lib/cities";

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// U+FE0E variation selectors force text presentation — engraved ink, not emoji.
const SIGN_GLYPHS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻",
};

export default function ChartPage() {
  // Form
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [cityData, setCityData] = useState<CityData | null>(null);

  // Chart
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [view, setView] = useState<"wheel" | "table">("wheel");

  // Auto-load from localStorage if user already entered data elsewhere
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = loadChart();
      if (saved) setChart(saved);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const generate = useCallback(() => {
    if (!date || !cityData) return;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return;
    const hour = timeUnknown ? 12 : parseInt(time.split(":")[0] || "12");
    const minute = timeUnknown ? 0 : parseInt(time.split(":")[1] || "0");

    // Historical offset for that wall-clock instant (DST, zone reforms);
    // the fixed city offset stands in only if the runtime lacks the zone.
    const zoneOff = utcOffsetHours(cityData.zone, y, m, d, hour, minute);
    const timezone = Number.isFinite(zoneOff) ? zoneOff : cityData.tz;

    const input = {
      year: y, month: m, day: d, hour, minute,
      latitude: cityData.lat, longitude: cityData.lon, timezone,
      timeKnown: !timeUnknown,
    } as BirthInput;
    const computed = computeNatalChart(input);
    saveUser(input, computed);
    setChart(computed);
    setSelected(null);
  }, [date, time, timeUnknown, cityData]);

  const canGenerate = !!date && (timeUnknown || !!time) && !!cityData;

  // Resolved place + offset, shown under the form as soon as it can be known.
  const tzLine = useMemo(() => {
    if (!cityData || !date) return null;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const hh = timeUnknown ? 12 : parseInt(time.split(":")[0] || "12");
    const mi = timeUnknown ? 0 : parseInt(time.split(":")[1] || "0");
    const off = utcOffsetHours(cityData.zone, y, m, d, hh, mi);
    if (!Number.isFinite(off)) return null;
    const summer = isSummerTime(cityData.zone, y, m, d, hh, mi);
    return `computed for ${cityData.name.toUpperCase()} · ${fmtUtcOffset(off)}${summer ? " (summer time)" : ""}`;
  }, [cityData, date, time, timeUnknown]);

  const hasAsc = !!chart?.ascendant;
  const selectedPlanet = selected !== null ? chart?.planets[selected] : null;

  return (
    <AlmanacShell>
      <div className="chart">
        {/* Header */}
        <header className="ch-head">
          <p className="alm-kicker">The wheel of houses</p>
          <h1 className="alm-h1">Your Birth Chart</h1>
          <p className="alm-lead ch-sub">
            {chart ? chart.bigThree : "Enter your birth data to see your natal chart."}
          </p>
        </header>

        {/* ── INPUT FORM (when no chart) ── */}
        {!chart && (
          <div className="ch-form alm-card">
            <div className="ch-field">
              <span className="alm-caption">Birth Date *</span>
              <div className="alm-dates">
                <BirthDatePicker value={date} onChange={setDate} />
              </div>
            </div>

            <div className="ch-field">
              <span className="alm-caption">Birth Time {timeUnknown ? "(using noon)" : "*"}</span>
              {!timeUnknown && (
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="alm-input"
                  style={{ colorScheme: "light" }}
                />
              )}
              <button
                type="button"
                onClick={() => { setTimeUnknown(!timeUnknown); setTime(""); }}
                className={`ch-noon ${timeUnknown ? "on" : ""}`}
              >
                {timeUnknown ? "✓ Using noon" : "I don't know my birth time"}
              </button>
            </div>

            <div className="ch-field">
              <span className="alm-caption">Birth City *</span>
              <div className={`alm-city ${cityData ? "" : "miss"}`}>
                <CityAutocomplete onSelect={setCityData} />
              </div>
              {tzLine && <span className="alm-caption ch-tzline">{tzLine}</span>}
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate}
              className="alm-btn ch-generate"
            >
              Compute My Chart
            </button>
          </div>
        )}

        {/* ── CHART VIEW (Insight tier and above) ── */}
        {chart && (
          <div className="alm-gate">
            <Paywall requires="insight" priceKey="insight_monthly" featureName="your full natal chart">
              {/* View toggle + reset */}
              <div className="ch-toggle">
                {(["wheel", "table"] as const).map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`ch-tab ${view === v ? "on" : ""}`}
                  >
                    {v === "wheel" ? "Chart Wheel" : "Table View"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setChart(null); setSelected(null); }}
                  className="ch-reset"
                >
                  New Chart
                </button>
              </div>

              <div className="ch-grid">
                {/* ── WHEEL VIEW — a plate engraving ── */}
                {view === "wheel" && (
                  <figure className="ch-wheel alm-card">
                    <svg viewBox="0 0 500 500" className="ch-svg" role="img" aria-label="Natal chart wheel">
                      {/* Outer frame */}
                      <circle cx={250} cy={250} r={244} fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx={250} cy={250} r={238} fill="none" stroke="currentColor" strokeWidth="0.5" opacity={0.5} />

                      {/* 1. Zodiac ring (outer, slowly turning) */}
                      <g className="ch-zring" style={{ transformOrigin: "250px 250px" }}>
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
                      <g>
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

                      {/* 3. Aspect lines */}
                      <g>
                        {chart.aspects.slice(0, 15).map((a, i) => {
                          const p1 = chart.planets.find((p) => p.name === a.planet1);
                          const p2 = chart.planets.find((p) => p.name === a.planet2);
                          if (!p1 || !p2) return null;
                          const pos1 = polarToCart(250, 250, 140, p1.longitude);
                          const pos2 = polarToCart(250, 250, 140, p2.longitude);
                          const tense = a.harmony === "tense";
                          const strength = Math.max(0.2, 1 - a.orb / 10);
                          return (
                            <path
                              key={i}
                              d={`M ${pos1.x} ${pos1.y} Q 250 250 ${pos2.x} ${pos2.y}`}
                              fill="none"
                              stroke={tense ? "var(--ox, #e0b768)" : "currentColor"}
                              strokeWidth={strength * 1.4}
                              strokeDasharray={tense ? "3 3" : "none"}
                              opacity={tense ? 0.4 : 0.22}
                            />
                          );
                        })}
                      </g>

                      {/* 4. Planet nodes */}
                      {chart.planets.map((p, i) => {
                        const pos = polarToCart(250, 250, 140, p.longitude);
                        const isSel = selected === i;
                        return (
                          <g key={p.name} onClick={() => setSelected(isSel ? null : i)} style={{ cursor: "pointer" }}>
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
                    </svg>
                    <figcaption className="alm-caption ch-fig">
                      Fig. 1 — the wheel of houses. Click a planet to read it.
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
                <aside className="ch-panel alm-card">
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
            </Paywall>
          </div>
        )}
      </div>

      <style jsx>{`
        .chart {
          max-width: 56rem;
          margin: 0 auto;
        }

        .ch-head {
          margin-bottom: 2rem;
        }

        .ch-sub {
          margin: 1rem 0 0;
          max-width: 48ch;
        }

        /* ── Form ───────────────────────────────────────────── */
        .ch-form {
          max-width: 26rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .ch-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .ch-noon {
          align-self: flex-start;
          background: none;
          border: none;
          padding: 0.15rem 0;
          cursor: pointer;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          color: var(--ink-faint);
          border-bottom: 1px solid transparent;
          transition: color 200ms var(--ease);
        }

        .ch-noon:hover {
          color: var(--ink);
        }

        .ch-noon.on {
          color: var(--ox);
        }

        .ch-generate {
          margin-top: 0.4rem;
        }

        .ch-tzline {
          margin-top: 0.15rem;
          color: var(--ox);
          letter-spacing: 0.14em;
        }

        /* City is required — hold the field lit until one is chosen */
        .alm-city.miss :global(input) {
          outline: 1px solid rgba(224, 183, 104, 0.55);
          outline-offset: 2px;
        }

        /* Re-ink the shared date picker (inline dark styles → paper) */
        .alm-dates :global(select) {
          background-color: transparent !important;
          background: linear-gradient(160deg, rgba(183, 188, 233, 0.1) 0%, rgba(10, 16, 36, 0.42) 100%) !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(232,233,255,0.55)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.75rem center !important;
          border: 0 !important;
          border-radius: 11px !important;
          box-shadow:
            inset 0 1px 0 rgba(226, 230, 255, 0.16),
            inset 0 0 0 1px rgba(183, 188, 233, 0.14) !important;
          color: var(--ink) !important;
          font-family: var(--font-body, system-ui), sans-serif !important;
          backdrop-filter: blur(14px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(140%) !important;
        }

        .alm-dates :global(select:focus-visible) {
          outline: 2px solid var(--ox);
          outline-offset: 2px;
        }

        .alm-dates :global(option) {
          background: #181d7a !important;
          color: var(--ink) !important;
        }

        .alm-dates :global(span) {
          color: var(--ink-faint) !important;
          font-family: var(--font-mono, ui-monospace), monospace !important;
          letter-spacing: 0.18em !important;
        }

        /* Re-ink the shared city autocomplete */
        .alm-city :global(input) {
          background: linear-gradient(160deg, rgba(183, 188, 233, 0.1) 0%, rgba(10, 16, 36, 0.42) 100%) !important;
          border: 0 !important;
          border-radius: 11px !important;
          box-shadow:
            inset 0 1px 0 rgba(226, 230, 255, 0.16),
            inset 0 0 0 1px rgba(183, 188, 233, 0.14) !important;
          color: var(--ink) !important;
          font-family: var(--font-body, system-ui), sans-serif !important;
          backdrop-filter: blur(14px) saturate(140%) !important;
          -webkit-backdrop-filter: blur(14px) saturate(140%) !important;
        }

        .alm-city :global(input::placeholder) {
          color: var(--ink-faint);
        }

        .alm-city :global(input:focus-visible) {
          outline: 2px solid var(--ox);
          outline-offset: 2px;
        }

        .alm-city :global(div div) {
          background: linear-gradient(160deg, rgba(183, 188, 233, 0.1) 0%, rgba(10, 16, 36, 0.42) 100%) !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0.35rem !important;
          box-shadow: 0 0.8rem 1.6rem rgba(4, 6, 32, 0.14) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .alm-city :global(button span:first-child) {
          color: var(--ink) !important;
          font-family: var(--font-body, system-ui), sans-serif !important;
        }

        .alm-city :global(button span:last-child) {
          color: var(--ink-faint) !important;
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
          width: min(90vw, 440px);
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
          background: rgba(250, 246, 236, 0.9);
        }

        .ch-row.sel {
          background: rgba(250, 246, 236, 0.9);
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
          .ch-zring {
            animation: none;
          }

          .ch-tab,
          .ch-reset,
          .ch-row,
          .ch-chip,
          .ch-noon {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
