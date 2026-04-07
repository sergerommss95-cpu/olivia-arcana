/**
 * Celestial Portrait — Full natal chart generative artwork + decode
 *
 * Full birth data: year, month, day, hour, minute, city.
 * Computes real natal chart → maps to generative art + personality decode.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { buildPortraitConfig, PortraitRenderer } from "../../lib/portrait-engine";
import { computeNatalChart, type NatalChart, type BirthInput } from "../../lib/natal-chart";
import BirthDatePicker from "../../components/BirthDatePicker";
import CityAutocomplete from "../../components/CityAutocomplete";
import { type CityData } from "../../lib/cities";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 1rem", textAlign: "center",
  fontFamily: "var(--font-accent)", fontSize: "1rem", letterSpacing: "0.06em",
  color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)", borderRadius: "9999px",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  outline: "none", transition: "border-color 0.3s",
};
const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
};

function DignityBadge({ dignity }: { dignity: string }) {
  const colors: Record<string, string> = {
    domicile: "#4ECDC4", exaltation: "#FFD700", detriment: "#E8524A", fall: "#E8524A", peregrine: "rgba(180,170,210,0.3)",
  };
  if (dignity === "peregrine") return null;
  return (
    <span style={{
      fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
      color: colors[dignity] || "#999", padding: "0.1rem 0.4rem",
      border: `1px solid ${colors[dignity]}33`, borderRadius: "100px",
    }}>{dignity}</span>
  );
}

export default function PortraitPage() {
  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [cityData, setCityData] = useState<CityData | null>(null);

  // Result state
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [phase, setPhase] = useState<"input" | "generating" | "revealed">("input");
  const [showDecode, setShowDecode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PortraitRenderer | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(() => {
    if (!date) return;
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return;

    const loc = cityData || { lat: 40.71, lon: -74.01, tz: -5 };

    const hour = timeUnknown ? 12 : parseInt(time.split(":")[0] || "12");
    const minute = timeUnknown ? 0 : parseInt(time.split(":")[1] || "0");

    const input: BirthInput = {
      year: y, month: m, day: d,
      hour, minute,
      latitude: loc.lat, longitude: loc.lon, timezone: loc.tz,
      name: name || undefined,
      city: cityData?.name || undefined,
    };

    const natalChart = computeNatalChart(input);
    setChart(natalChart);
    setPhase("generating");

    // Fade out form
    overlayRef.current?.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: 600, easing: EASE, fill: "forwards" }
    );

    // Start art
    setTimeout(() => {
      if (!canvasRef.current) return;
      rendererRef.current?.stop();
      const cfg = buildPortraitConfig({ month: m, day: d, year: y });
      if (cfg) {
        const renderer = new PortraitRenderer(canvasRef.current, cfg);
        rendererRef.current = renderer;
        renderer.init();
        renderer.start();
      }
      setPhase("revealed");
    }, 800);
  }, [name, date, time, timeUnknown, cityData]);

  const download = useCallback(() => {
    if (!rendererRef.current) return;
    const url = rendererRef.current.toDataURL();
    const a = document.createElement("a");
    a.href = url;
    a.download = `celestial-portrait-${chart?.sunSign?.toLowerCase() || "cosmic"}.png`;
    a.click();
  }, [chart]);

  const reset = useCallback(() => {
    rendererRef.current?.stop();
    rendererRef.current = null;
    setChart(null);
    setPhase("input");
    setShowDecode(false);
  }, []);

  useEffect(() => () => { rendererRef.current?.stop(); }, []);
  useEffect(() => {
    const h = () => { if (rendererRef.current && canvasRef.current) { rendererRef.current.stop(); rendererRef.current.init(); rendererRef.current.start(); } };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const canGenerate = !!date && (timeUnknown || !!time);

  return (
    <div style={{ position: "relative", width: "100vw", minHeight: "100vh", overflow: "hidden", background: "#04020d" }}>
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }} />

      {/* ── INPUT FORM ── */}
      <div ref={overlayRef} style={{
        position: phase === "revealed" ? "absolute" : "fixed", inset: 0,
        display: phase === "revealed" ? "none" : "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1.5rem", zIndex: 10, background: "rgba(4,2,13,0.92)",
        padding: "2rem 1.5rem", overflowY: "auto",
      }}>
        <a href="/" style={{ position: "absolute", top: "1.5rem", left: "1.5rem", ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>← Home</a>

        <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.5)", textShadow: "0 0 40px rgba(212,175,55,0.2)" }}>✦</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 400, textAlign: "center" }}>
          <span className="text-gold-gradient">Your Celestial Portrait</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(196,185,228,0.5)", textAlign: "center", maxWidth: "400px" }}>
          Enter your complete birth data for a mathematically unique cosmic artwork with full natal chart decode.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "360px" }}>
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Your Name (optional)</span>
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, textAlign: "left" }} />
          </div>

          {/* Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Birth Date *</span>
            <BirthDatePicker value={date} onChange={setDate} />
          </div>

          {/* Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Birth Time {timeUnknown ? "(using noon)" : "*"}</span>
            {!timeUnknown && (
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            )}
            <button onClick={() => { setTimeUnknown(!timeUnknown); setTime(""); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "0.68rem",
              color: timeUnknown ? "rgba(212,175,55,0.6)" : "rgba(180,170,210,0.35)",
              transition: "color 0.2s", textAlign: "left",
            }}>{timeUnknown ? "✓ Using noon — Ascendant will be approximate" : "I don't know my birth time"}</button>
          </div>

          {/* City */}
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
          }}>Generate My Portrait</button>
        </div>
      </div>

      {/* ── REVEALED STATE ── */}
      {phase === "revealed" && chart && (
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5rem", pointerEvents: "auto" }}>
            <a href="/" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.35)" }}>← Home</a>
            <button onClick={reset} style={{ ...labelSt, background: "none", border: "none", cursor: "pointer", color: "rgba(180,170,210,0.35)" }}>New Portrait</button>
          </div>

          {/* Spacer for canvas area */}
          <div style={{ height: "70vh" }} />

          {/* Bottom info */}
          <div style={{
            background: "linear-gradient(to top, rgba(4,2,13,0.95) 60%, transparent 100%)",
            padding: "3rem 1.5rem 2rem",
          }}>
            <div style={{ maxWidth: "700px", margin: "0 auto" }}>
              {/* Big Three */}
              <div style={{ ...labelSt, marginBottom: "0.4rem" }}>
                {chart.input.name ? `${chart.input.name}'s` : "Your"} Celestial Portrait
              </div>
              <h2 style={{
                fontFamily: "var(--font-accent)", fontSize: "1.6rem", fontWeight: 400,
                letterSpacing: "0.08em", color: "rgba(240,236,255,0.92)",
                margin: "0 0 0.3rem",
              }}>{chart.bigThree}</h2>
              <div style={{
                fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 300,
                color: "rgba(196,185,228,0.5)", marginBottom: "1.5rem",
                display: "flex", gap: "0.6rem", flexWrap: "wrap",
              }}>
                <span>{chart.elementBalance.dominant} Dominant</span>
                <span>&middot;</span>
                <span>{chart.modalityBalance.dominant} Energy</span>
                <span>&middot;</span>
                <span>{chart.chartPattern} Pattern</span>
                <span>&middot;</span>
                <span>{chart.moonPhase.emoji} {chart.moonPhase.phase} at Birth</span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <button onClick={download} style={{
                  padding: "0.6rem 1.5rem", borderRadius: "100px",
                  background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
                  border: "1px solid rgba(200,180,255,0.2)", backdropFilter: "blur(12px)",
                  color: "rgba(240,235,255,0.9)", fontSize: "0.72rem", fontWeight: 500,
                  letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                  transition: `all 0.3s ${EASE}`,
                }}>Download Portrait</button>
                <button onClick={() => setShowDecode(!showDecode)} style={{
                  padding: "0.6rem 1.5rem", borderRadius: "100px",
                  background: showDecode ? "rgba(160,120,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showDecode ? "rgba(200,180,255,0.2)" : "rgba(200,185,255,0.1)"}`,
                  backdropFilter: "blur(12px)",
                  color: "rgba(200,185,240,0.8)", fontSize: "0.72rem", fontWeight: 400,
                  letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                  transition: `all 0.3s ${EASE}`,
                }}>{showDecode ? "Hide" : "Full"} Chart Decode</button>
              </div>

              {/* Full decode panel */}
              {showDecode && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Summary */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Chart Summary</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(196,185,228,0.75)", margin: 0 }}>
                      {chart.interpretation.summary}
                    </p>
                  </div>

                  {/* Core Identity / Emotional / Persona */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
                    {[
                      { title: `☉ Sun in ${chart.sunSign}`, subtitle: "Core Identity", text: chart.interpretation.coreIdentity },
                      { title: `☽ Moon in ${chart.moonSign}`, subtitle: "Emotional Nature", text: chart.interpretation.emotionalNature },
                      { title: `↑ ${chart.risingSign} Rising`, subtitle: "Outer Persona", text: chart.interpretation.outerPersona },
                    ].map(({ title, subtitle, text }) => (
                      <div key={title} style={{ ...glass, padding: "1.25rem" }}>
                        <div style={{ fontFamily: "var(--font-accent)", fontSize: "1rem", fontWeight: 500, color: "rgba(240,236,255,0.88)", marginBottom: "0.15rem" }}>{title}</div>
                        <div style={{ ...labelSt, marginBottom: "0.5rem" }}>{subtitle}</div>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: 0 }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Planet positions table */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Planetary Positions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {chart.planets.map(p => (
                        <div key={p.name} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.4rem 0", borderBottom: "1px solid rgba(200,185,255,0.04)",
                          fontSize: "0.78rem",
                        }}>
                          <span style={{ width: "22px", textAlign: "center", fontSize: "1rem" }}>{p.glyph}</span>
                          <span style={{ width: "70px", fontFamily: "var(--font-accent)", fontWeight: 500, color: "rgba(230,220,255,0.85)" }}>{p.name}</span>
                          <span style={{ width: "20px", opacity: 0.5 }}>{p.signGlyph}</span>
                          <span style={{ flex: 1, color: "rgba(200,190,235,0.65)" }}>{p.sign} {p.degree}°</span>
                          <span style={{ color: "rgba(180,170,210,0.4)", fontSize: "0.65rem" }}>House {p.house}</span>
                          {p.retrograde && <span style={{ color: "rgba(232,82,74,0.6)", fontSize: "0.6rem" }}>℞</span>}
                          <DignityBadge dignity={p.dignity} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aspects */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Major Aspects ({chart.aspects.length})</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {chart.aspects.slice(0, 15).map((a, i) => {
                        const symbol = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻" }[a.type] || "?";
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.3rem 0", borderBottom: "1px solid rgba(200,185,255,0.03)",
                            fontSize: "0.72rem",
                          }}>
                            <span style={{ width: "18px", textAlign: "center" }}>{a.planet1Glyph}</span>
                            <span style={{ color: "rgba(200,190,235,0.5)", width: "60px" }}>{a.planet1}</span>
                            <span style={{ color: a.harmony === "harmonious" ? "rgba(78,205,196,0.6)" : a.harmony === "tense" ? "rgba(232,82,74,0.5)" : "rgba(200,185,255,0.4)" }}>{symbol}</span>
                            <span style={{ width: "18px", textAlign: "center" }}>{a.planet2Glyph}</span>
                            <span style={{ color: "rgba(200,190,235,0.5)", flex: 1 }}>{a.planet2}</span>
                            <span style={{ color: "rgba(180,170,210,0.35)", fontSize: "0.6rem" }}>{a.type} · orb {a.orb}°</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Houses */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.5rem" }}>House Cusps</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.4rem" }}>
                      {chart.houses.map(h => (
                        <div key={h.number} style={{
                          display: "flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.35rem 0.5rem", borderRadius: "0.5rem",
                          background: h.number === 1 ? "rgba(212,175,55,0.06)" : "transparent",
                          border: h.number === 1 ? "1px solid rgba(212,175,55,0.1)" : "none",
                        }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600, color: "rgba(180,170,210,0.4)", width: "18px" }}>{h.number}</span>
                          <span style={{ fontSize: "0.8rem", opacity: 0.5 }}>{h.signGlyph}</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(200,190,235,0.65)" }}>{h.sign} {h.degree}°</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Element + Modality balance */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ ...glass, padding: "1.25rem" }}>
                      <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Element Balance</div>
                      {(["Fire", "Earth", "Air", "Water"] as const).map(el => {
                        const val = chart.elementBalance[el];
                        const max = Math.max(chart.elementBalance.Fire, chart.elementBalance.Earth, chart.elementBalance.Air, chart.elementBalance.Water);
                        const colors = { Fire: "#FF6B35", Earth: "#7CB342", Air: "#B0BEC5", Water: "#4FC3F7" };
                        return (
                          <div key={el} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                            <span style={{ fontSize: "0.7rem", color: "rgba(200,190,235,0.5)", width: "40px" }}>{el}</span>
                            <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.04)" }}>
                              <div style={{ width: `${(val / max) * 100}%`, height: "100%", borderRadius: "2px", background: colors[el], transition: "width 1s ease" }} />
                            </div>
                            <span style={{ fontSize: "0.6rem", color: "rgba(180,170,210,0.4)", width: "24px", textAlign: "right" }}>{Math.round(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ ...glass, padding: "1.25rem" }}>
                      <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Modality Balance</div>
                      {(["Cardinal", "Fixed", "Mutable"] as const).map(mod => {
                        const val = chart.modalityBalance[mod] as number;
                        const max = Math.max(chart.modalityBalance.Cardinal as number, chart.modalityBalance.Fixed as number, chart.modalityBalance.Mutable as number);
                        const colors = { Cardinal: "#E8524A", Fixed: "#FFD700", Mutable: "#7B68EE" };
                        return (
                          <div key={mod} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                            <span style={{ fontSize: "0.7rem", color: "rgba(200,190,235,0.5)", width: "55px" }}>{mod}</span>
                            <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.04)" }}>
                              <div style={{ width: `${(val / max) * 100}%`, height: "100%", borderRadius: "2px", background: colors[mod], transition: "width 1s ease" }} />
                            </div>
                            <span style={{ fontSize: "0.6rem", color: "rgba(180,170,210,0.4)", width: "24px", textAlign: "right" }}>{Math.round(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths + Challenges + Soul Purpose */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.5rem" }}>Life Theme</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: "0 0 1rem" }}>{chart.interpretation.lifeTheme}</p>

                    <div style={{ ...labelSt, marginBottom: "0.4rem" }}>Strengths</div>
                    {chart.interpretation.strengths.map((s, i) => (
                      <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300, color: "rgba(78,205,196,0.65)", padding: "0.2rem 0 0.2rem 0.8rem", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "rgba(78,205,196,0.4)", fontSize: "0.55rem", top: "0.25em" }}>▸</span>{s}
                      </div>
                    ))}

                    <div style={{ ...labelSt, marginTop: "0.75rem", marginBottom: "0.4rem" }}>Growth Edges</div>
                    {chart.interpretation.challenges.map((c, i) => (
                      <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300, color: "rgba(232,82,74,0.55)", padding: "0.2rem 0 0.2rem 0.8rem", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: "rgba(232,82,74,0.4)", fontSize: "0.55rem", top: "0.25em" }}>▸</span>{c}
                      </div>
                    ))}

                    <div style={{ ...labelSt, marginTop: "0.75rem", marginBottom: "0.4rem" }}>Soul Purpose</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300, lineHeight: 1.7, color: "rgba(196,185,228,0.7)", margin: 0, fontStyle: "italic" }}>
                      {chart.interpretation.soulPurpose}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
