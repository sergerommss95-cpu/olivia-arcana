/**
 * Birth Chart — Interactive natal chart with real data
 *
 * Two modes:
 *   1. No data → birth data input form (same as portrait)
 *   2. With data → interactive SVG wheel + planet detail panel + interpretations
 *
 * Computes real natal chart from birth data.
 * Click any planet → see what it means in YOUR chart.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { computeNatalChart, type NatalChart, type BirthInput } from "../../lib/natal-chart";
import { saveUser, loadChart } from "../../lib/user-store";
import { getPlanetInSign, PLANET_MEANING, HOUSE_MEANING } from "../../lib/planet-interpretations";
import BirthDatePicker from "../../components/BirthDatePicker";
import CityAutocomplete from "../../components/CityAutocomplete";
import Paywall from "../../components/Paywall";
import { type CityData } from "../../lib/cities";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const glass: React.CSSProperties = {
  background: "rgba(8,6,20,0.45)",
  backdropFilter: "blur(20px) saturate(1.2)",
  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1.25rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
};

const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.65rem 1rem",
  fontFamily: "var(--font-accent)", fontSize: "0.95rem", letterSpacing: "0.04em",
  color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)", borderRadius: "0.75rem",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  outline: "none",
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
    if (!date) return;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return;
    const loc = cityData || { lat: 40.71, lon: -74.01, tz: -5 };
    const hour = timeUnknown ? 12 : parseInt(time.split(":")[0] || "12");
    const minute = timeUnknown ? 0 : parseInt(time.split(":")[1] || "0");

    const input: BirthInput = {
      year: y, month: m, day: d, hour, minute,
      latitude: loc.lat, longitude: loc.lon, timezone: loc.tz,
    };
    const computed = computeNatalChart(input);
    saveUser(input, computed);
    setChart(computed);
    setSelected(null);
  }, [date, time, timeUnknown, cityData]);

  const canGenerate = !!date && (timeUnknown || !!time);
  const cx = 220, cy = 220, outerR = 195, innerR = 155, planetR = 130;
  const selectedPlanet = selected !== null ? chart?.planets[selected] : null;

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "2rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>&larr; Home</Link>
          <h1 style={{
            fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 400, marginTop: "0.75rem",
          }}>
            <span className="text-gold-gradient">Your Birth Chart</span>
          </h1>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
            color: "rgba(196,185,228,0.5)", marginTop: "0.3rem",
          }}>{chart ? chart.bigThree : "Enter your birth data to see your natal chart"}</p>
        </div>

        {/* ── INPUT FORM (when no chart) ── */}
        {!chart && (
          <div style={{
            ...glass, padding: "2rem", maxWidth: "400px", margin: "0 auto",
            display: "flex", flexDirection: "column", gap: "1rem",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Date *</span>
              <BirthDatePicker value={date} onChange={setDate} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Time {timeUnknown ? "(using noon)" : "*"}</span>
              {!timeUnknown && <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />}
              <button onClick={() => { setTimeUnknown(!timeUnknown); setTime(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: "0.65rem",
                color: timeUnknown ? "rgba(212,175,55,0.6)" : "rgba(180,170,210,0.3)",
                textAlign: "left",
              }}>{timeUnknown ? "✓ Using noon" : "I don't know my birth time"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth City</span>
              <CityAutocomplete onSelect={setCityData} />
            </div>
            <button onClick={generate} disabled={!canGenerate} style={{
              padding: "0.75rem 2rem", borderRadius: "100px", marginTop: "0.5rem",
              background: "linear-gradient(135deg, rgba(160,120,255,0.22), rgba(100,80,220,0.18))",
              border: "1px solid rgba(200,180,255,0.22)",
              color: "rgba(240,235,255,0.95)", fontSize: "0.82rem", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: canGenerate ? "pointer" : "not-allowed",
              opacity: canGenerate ? 1 : 0.3, transition: `all 0.3s ${EASE}`,
            }}>Compute My Chart</button>
          </div>
        )}

        {/* ── CHART VIEW (Insight tier and above) ── */}
        {chart && (
          <Paywall requires="insight" priceKey="insight_monthly" featureName="your full natal chart">
            {/* View toggle + reset */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {(["wheel", "table"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "0.4rem 1.2rem", borderRadius: "100px",
                  background: view === v ? "rgba(200,185,255,0.1)" : "transparent",
                  border: `1px solid ${view === v ? "rgba(200,185,255,0.15)" : "rgba(200,185,255,0.05)"}`,
                  color: view === v ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.4)",
                  fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 500,
                  letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
                  transition: `all 0.2s ${EASE}`,
                }}>{v === "wheel" ? "Chart Wheel" : "Table View"}</button>
              ))}
              <button onClick={() => { setChart(null); setSelected(null); }} style={{
                padding: "0.4rem 1rem", borderRadius: "100px",
                background: "transparent", border: "1px solid rgba(200,185,255,0.05)",
                color: "rgba(180,170,210,0.3)", fontFamily: "var(--font-body)", fontSize: "0.65rem",
                cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>New Chart</button>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>

              {/* ── WHEEL VIEW — reimagined as a 3D-feeling Astrolabe ── */}
              {view === "wheel" && (
                <div style={{ ...glass, padding: "2rem", overflow: "hidden" }}>
                  <svg viewBox="0 0 500 500" style={{ width: "min(90vw, 460px)", height: "min(90vw, 460px)" }}>
                    <defs>
                      <filter id="astrolabe-glow">
                        <feGaussianBlur stdDeviation="2.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="50%" stopColor="#F5E6A3" />
                        <stop offset="100%" stopColor="#D4AF37" />
                      </linearGradient>
                    </defs>

                    {/* Outer frame */}
                    <circle cx={250} cy={250} r={240} fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="0.5" />
                    <circle cx={250} cy={250} r={232} fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="1" />

                    {/* 1. Zodiac Ring (Outer) */}
                    <g className="animate-spin-astrolabe" style={{ transformOrigin: "250px 250px" }}>
                      <circle cx={250} cy={250} r={220} fill="rgba(8,6,20,0.3)" stroke="rgba(212,175,55,0.15)" strokeWidth="40" />
                      {SIGN_GLYPHS.map((glyph, i) => {
                        const angle = i * 30 + 15;
                        const pos = polarToCart(250, 250, 220, angle);
                        return (
                          <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                            fill="rgba(212,175,55,0.6)" fontSize="16" style={{ fontFamily: "serif", pointerEvents: "none" }}>{glyph}</text>
                        );
                      })}
                    </g>

                    {/* 2. House Ring (Inner) */}
                    <g style={{ opacity: 0.8 }}>
                      <circle cx={250} cy={250} r={180} fill="none" stroke="rgba(200,185,255,0.08)" strokeWidth="1" />
                      {chart.houses.map((h, i) => {
                        const angle = h.cusp;
                        const s = polarToCart(250, 250, 60, angle);
                        const e = polarToCart(250, 250, 180, angle);
                        const labelPos = polarToCart(250, 250, 195, angle + 15);
                        return (
                          <g key={i}>
                            <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="rgba(200,185,255,0.06)" strokeWidth="0.5" strokeDasharray="2 4" />
                            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="central"
                              fill="rgba(180,170,210,0.3)" fontSize="8" style={{ fontFamily: "var(--font-mono)" }}>{i + 1}</text>
                          </g>
                        );
                      })}
                    </g>

                    {/* 3. The Physical Aspects (The Machine) */}
                    <g opacity={0.6}>
                      {chart.aspects.slice(0, 15).map((a, i) => {
                        const p1 = chart.planets.find(p => p.name === a.planet1);
                        const p2 = chart.planets.find(p => p.name === a.planet2);
                        if (!p1 || !p2) return null;
                        const pos1 = polarToCart(250, 250, 140, p1.longitude);
                        const pos2 = polarToCart(250, 250, 140, p2.longitude);
                        const tense = a.harmony === "tense";
                        const strength = Math.max(0.2, 1 - a.orb / 10);
                        return (
                          <path key={i} d={`M ${pos1.x} ${pos1.y} Q 250 250 ${pos2.x} ${pos2.y}`} 
                            fill="none" 
                            stroke={tense ? "rgba(232,82,74,0.15)" : "rgba(78,205,196,0.15)"} 
                            strokeWidth={strength * 2} 
                            strokeDasharray={tense ? "2 2" : "none"} 
                          />
                        );
                      })}
                    </g>

                    {/* 4. Planet Interaction Nodes */}
                    {chart.planets.map((p, i) => {
                      const pos = polarToCart(250, 250, 140, p.longitude);
                      const isSel = selected === i;
                      const colors: Record<string, string> = {
                        Sun: "#FFD700", Moon: "#C0C0C0", Mercury: "#7B68EE", Venus: "#FF69B4",
                        Mars: "#E8524A", Jupiter: "#4ECDC4", Saturn: "#8B7355", Uranus: "#00BFFF",
                        Neptune: "#9370DB", Pluto: "#800020",
                      };
                      const col = colors[p.name] || "#D4AF37";
                      
                      return (
                        <g key={p.name} onClick={() => setSelected(isSel ? null : i)} style={{ cursor: "pointer" }}>
                          {/* Laser focal line */}
                          <line x1={250} y1={250} x2={pos.x} y2={pos.y} stroke={col} strokeWidth="0.5" opacity={isSel ? 0.4 : 0.05} />
                          
                          {/* The Node */}
                          <circle cx={pos.x} cy={pos.y} r={isSel ? 16 : 10} 
                            fill="rgba(4,2,13,0.9)" 
                            stroke={col} 
                            strokeWidth={isSel ? 2 : 1}
                            style={{ filter: isSel ? "url(#astrolabe-glow)" : "none", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)" }}
                          />
                          <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central"
                            fill={col} fontSize={isSel ? 14 : 10} style={{ pointerEvents: "none" }}>{p.glyph}</text>
                        </g>
                      );
                    })}

                    {/* Center Core */}
                    <circle cx={250} cy={250} r="20" fill="rgba(8,6,20,0.95)" stroke="url(#gold-gradient)" strokeWidth="1" />
                    <text x={250} y={251} textAnchor="middle" dominantBaseline="central"
                      fill="#F5E6A3" fontSize="14" style={{ fontFamily: "serif", filter: "url(#astrolabe-glow)" }}>✦</text>
                  </svg>
                  
                  <style jsx>{`
                    @keyframes spin-astrolabe {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                    .animate-spin-astrolabe {
                      animation: spin-astrolabe 120s linear infinite;
                    }
                  `}</style>
                </div>
              )}

              {/* ── TABLE VIEW ── */}
              {view === "table" && (
                <div style={{ ...glass, padding: "1.5rem", width: "min(90vw, 450px)" }}>
                  <div style={{ ...labelSt, marginBottom: "0.75rem" }}>Planetary Positions</div>
                  {chart.planets.map((p, i) => {
                    const isSel = selected === i;
                    return (
                      <button key={p.name} onClick={() => setSelected(isSel ? null : i)} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
                        padding: "0.6rem 0.5rem", background: isSel ? "rgba(200,185,255,0.05)" : "transparent",
                        border: "none", borderBottom: "1px solid rgba(200,185,255,0.03)",
                        borderRadius: isSel ? "0.5rem" : 0, cursor: "pointer", textAlign: "left",
                        transition: `background 0.2s ${EASE}`,
                      }}>
                        <span style={{ fontSize: "1.1rem", width: "24px", textAlign: "center" }}>{p.glyph}</span>
                        <span style={{ fontFamily: "var(--font-accent)", fontSize: "0.85rem", fontWeight: 500, color: "rgba(230,220,255,0.85)", width: "65px" }}>{p.name}</span>
                        <span style={{ fontSize: "0.75rem", opacity: 0.4 }}>{p.signGlyph}</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(200,190,235,0.6)", flex: 1 }}>{p.sign} {p.degree}°</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.3)" }}>H{p.house}</span>
                        {p.retrograde && <span style={{ color: "rgba(232,82,74,0.5)", fontSize: "0.6rem" }}>℞</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── DETAIL PANEL ── */}
              <div style={{ ...glass, padding: "1.5rem", width: "min(90vw, 320px)", minHeight: "200px" }}>
                {selectedPlanet ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "2rem" }}>{selectedPlanet.glyph}</span>
                      <div>
                        <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 500, color: "rgba(240,236,255,0.9)" }}>
                          {selectedPlanet.name} in {selectedPlanet.sign}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.4)" }}>
                          {selectedPlanet.degree}° · House {selectedPlanet.house}
                          {selectedPlanet.retrograde && " · ℞ Retrograde"}
                        </div>
                      </div>
                    </div>

                    {/* What this planet governs */}
                    <p style={{
                      fontFamily: "var(--font-body)", fontSize: "0.65rem", fontStyle: "italic",
                      color: "rgba(180,170,210,0.35)", margin: "0 0 0.6rem",
                    }}>{PLANET_MEANING[selectedPlanet.name]}</p>

                    {/* Personal interpretation */}
                    <p style={{
                      fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 400,
                      lineHeight: 1.7, color: "rgba(220,210,240,0.8)", margin: "0 0 0.75rem",
                    }}>{getPlanetInSign(selectedPlanet.name, selectedPlanet.sign)}</p>

                    {/* House context */}
                    {HOUSE_MEANING[selectedPlanet.house] && (
                      <div style={{
                        padding: "0.6rem 0.75rem", borderRadius: "0.6rem",
                        background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.06)",
                      }}>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(212,175,55,0.4)", marginBottom: "0.2rem" }}>
                          House {selectedPlanet.house}: {HOUSE_MEANING[selectedPlanet.house].area}
                        </div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(180,170,210,0.5)", margin: 0, lineHeight: 1.5 }}>
                          {HOUSE_MEANING[selectedPlanet.house].rules}
                        </p>
                      </div>
                    )}

                    {/* Aspects involving this planet */}
                    {chart.aspects.filter(a => a.planet1 === selectedPlanet.name || a.planet2 === selectedPlanet.name).length > 0 && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div style={{ ...labelSt, marginBottom: "0.4rem" }}>Aspects</div>
                        {chart.aspects
                          .filter(a => a.planet1 === selectedPlanet.name || a.planet2 === selectedPlanet.name)
                          .slice(0, 5)
                          .map((a, i) => {
                            const other = a.planet1 === selectedPlanet.name ? a.planet2 : a.planet1;
                            const sym = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻" }[a.type] || "·";
                            return (
                              <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "0.4rem",
                                padding: "0.25rem 0", fontSize: "0.72rem",
                              }}>
                                <span style={{ color: a.harmony === "harmonious" ? "rgba(78,205,196,0.6)" : a.harmony === "tense" ? "rgba(232,82,74,0.5)" : "rgba(200,185,255,0.4)" }}>{sym}</span>
                                <span style={{ color: "rgba(200,190,235,0.6)" }}>{a.type} {other}</span>
                                <span style={{ color: "rgba(180,170,210,0.25)", fontSize: "0.6rem" }}>orb {a.orb}°</span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "180px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.15)", marginBottom: "0.75rem" }}>✦</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(180,170,210,0.35)" }}>
                      Click a planet to explore<br/>its meaning in your chart
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Planet legend */}
            <div style={{
              marginTop: "1.5rem", display: "flex", flexWrap: "wrap",
              gap: "0.4rem", justifyContent: "center", maxWidth: "600px", margin: "1.5rem auto 0",
            }}>
              {chart.planets.map((p, i) => (
                <button key={p.name} onClick={() => setSelected(selected === i ? null : i)} style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.3rem 0.6rem", borderRadius: "100px",
                  background: selected === i ? "rgba(200,185,255,0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selected === i ? "rgba(200,185,255,0.15)" : "rgba(200,185,255,0.04)"}`,
                  cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.65rem",
                  color: selected === i ? "rgba(240,236,255,0.85)" : "rgba(180,170,210,0.4)",
                  transition: `all 0.2s ${EASE}`,
                }}>
                  <span style={{ fontSize: "0.8rem" }}>{p.glyph}</span> {p.name}
                </button>
              ))}
            </div>

            {/* CTA to portrait */}
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link href="/portrait" style={{
                display: "inline-block", padding: "0.65rem 1.5rem", borderRadius: "100px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
                color: "rgba(200,185,240,0.6)", fontSize: "0.72rem",
                letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
              }}>Get Your Celestial Portrait &rarr;</Link>
            </div>
          </Paywall>
        )}
      </div>
    </div>
  );
}
