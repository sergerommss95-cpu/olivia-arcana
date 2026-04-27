/**
 * Celestial Portrait — Full natal chart generative artwork + decode
 *
 * Full birth data: year, month, day, hour, minute, city.
 * Computes real natal chart → maps to generative art + personality decode.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { build3DPortraitConfig, type Portrait3DConfig } from "../../lib/portrait-v4";
import RelicScene from "../../components/cosmos/RelicScene";
import { computeNatalChart, type NatalChart, type BirthInput } from "../../lib/natal-chart";
import { saveUser } from "../../lib/user-store";
import BirthDatePicker from "../../components/BirthDatePicker";
import CityAutocomplete from "../../components/CityAutocomplete";
import CosmicField from "../../components/CosmicField";
import { type CityData } from "../../lib/cities";
import { getPlanetInSign, PLANET_MEANING, HOUSE_MEANING, LIFE_AREAS, PLANET_LIFE_AREA } from "../../lib/planet-interpretations";

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
  const [relicConfig, setRelicConfig] = useState<Portrait3DConfig | null>(null);
  const [phase, setPhase] = useState<"input" | "generating" | "revealed">("input");
  const [showDecode, setShowDecode] = useState(false);

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
    saveUser(input, natalChart); // persist for other pages
    setChart(natalChart);
    setRelicConfig(build3DPortraitConfig(natalChart));
    setPhase("generating");

    // Fire the Cosmic Identity Panel reveal — ConstellationOverlay listens
    // for `zodiac:click` and renders the CosmicProfile (element/modality/
    // ruler trio, traits, energy, compatibility, lucky stats, share card).
    // 1.4s delay so the user sees their portrait paint first; the panel
    // then layers on top as the "who you are" reveal.
    {
      const ZODIAC_NAMES = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
      ];
      const idx = ZODIAC_NAMES.findIndex(
        (n) => n.toLowerCase() === (natalChart.sunSign || "").toLowerCase(),
      );
      const glyph = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"][idx] || "✦";
      if (idx >= 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("zodiac:click", {
            detail: { name: ZODIAC_NAMES[idx], glyph, index: idx },
          }));
        }, 1400);
      }
    }

    // Fade out form
    overlayRef.current?.animate(
      [{ opacity: "1" }, { opacity: "0" }],
      { duration: 600, easing: EASE, fill: "forwards" }
    );

    // Start art
    setTimeout(() => {
      setPhase("revealed");
    }, 800);
  }, [name, date, time, timeUnknown, cityData]);

  const download = useCallback(() => {
    alert("Portrait rendering for export...");
  }, []);

  const reset = useCallback(() => {
    setChart(null);
    setRelicConfig(null);
    setPhase("input");
    setShowDecode(false);
  }, []);

  useEffect(() => {
    // Component lifecycle cleanup
  }, []);

  const canGenerate = !!date && (timeUnknown || !!time);

  return (
    <div style={{ position: "relative", width: "100vw", minHeight: "100vh", overflow: "hidden" }}>
      {/* 3D Relic Canvas */}
      {relicConfig && <RelicScene config={relicConfig} />}

      {/* ── INPUT FORM ── */}
      <div ref={overlayRef} style={{
        position: phase === "revealed" ? "absolute" : "fixed", inset: 0,
        display: phase === "revealed" ? "none" : "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "1.5rem", zIndex: 10, background: "rgba(4,2,13,0.4)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        padding: "2rem 1.5rem", overflowY: "auto",
      }}>
        <Link href="/" style={{ position: "absolute", top: "1.5rem", left: "1.5rem", ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>&larr; Home</Link>

        <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.5)", textShadow: "0 0 40px rgba(212,175,55,0.2)" }}>✦</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 400, textAlign: "center" }}>
          <span className="text-gold-gradient">Your Celestial Portrait</span>
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(196,185,228,0.5)", textAlign: "center", maxWidth: "400px" }}>
          Enter your complete birth data for a mathematically unique cosmic artwork with full natal chart decode.
        </p>

        <div style={{
          display: "flex", flexDirection: "column", gap: "1rem",
          width: "100%", maxWidth: "400px",
          padding: "2rem",
          background: "rgba(8,6,20,0.45)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          border: "1px solid rgba(200,185,255,0.08)",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          {/* Name */}
          <CosmicField
            label="Your Name (optional)"
            placeholder="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Date */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Birth Date *</span>
            <BirthDatePicker value={date} onChange={setDate} />
          </div>

          {/* Time */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {!timeUnknown && (
              <CosmicField
                label={`Birth Time ${timeUnknown ? "(using noon)" : "*"}`}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            )}
            <button
              onClick={() => {
                setTimeUnknown(!timeUnknown);
                setTime("");
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.68rem",
                color: timeUnknown ? "rgba(212,175,55,0.6)" : "rgba(180,170,210,0.45)",
                transition: "color 0.2s",
                textAlign: "left",
                alignSelf: "flex-start",
              }}
            >
              {timeUnknown ? "✓ Using noon — Ascendant will be approximate" : "I don't know my birth time"}
            </button>
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
            <Link href="/" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.35)" }}>&larr; Home</Link>
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

              {/* Full decode panel — Co-Star inspired, 10x more readable */}
              {showDecode && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                  {/* ── THE BIG THREE — most important, most readable ── */}
                  {[
                    { glyph: "☉", planet: "Sun", sign: chart.sunSign, label: "Core Identity", sub: PLANET_MEANING.Sun, text: chart.interpretation.coreIdentity, interp: getPlanetInSign("Sun", chart.sunSign) },
                    { glyph: "☽", planet: "Moon", sign: chart.moonSign, label: "Emotional Nature", sub: PLANET_MEANING.Moon, text: chart.interpretation.emotionalNature, interp: getPlanetInSign("Moon", chart.moonSign) },
                    { glyph: "↑", planet: "Rising", sign: chart.risingSign, label: "How Others See You", sub: "Your mask. The energy you project before people know you.", text: chart.interpretation.outerPersona, interp: "" },
                  ].map(({ glyph, planet, sign, label, sub, text, interp }) => (
                    <div key={planet} style={{
                      padding: "1.5rem", borderRadius: "1rem",
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,185,255,0.06)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                        <span style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.6)" }}>{glyph}</span>
                        <div>
                          <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 500, color: "rgba(240,236,255,0.9)" }}>
                            {planet} in {sign}
                          </div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(180,170,210,0.4)" }}>{label}</div>
                        </div>
                      </div>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.35)", margin: "0 0 0.5rem", fontStyle: "italic" }}>{sub}</p>
                      {interp && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 400, lineHeight: 1.7, color: "rgba(240,236,255,0.8)", margin: "0 0 0.6rem" }}>{interp}</p>}
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, lineHeight: 1.75, color: "rgba(196,185,228,0.65)", margin: 0 }}>{text}</p>
                    </div>
                  ))}

                  {/* ── YOUR PLANETS — each one explained ── */}
                  <div>
                    <div style={{ ...labelSt, marginBottom: "0.75rem", fontSize: "0.65rem" }}>Your Planets</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {chart.planets.slice(2).map(p => {
                        const interp = getPlanetInSign(p.name, p.sign);
                        const meaning = PLANET_MEANING[p.name] || "";
                        const houseMeaning = HOUSE_MEANING[p.house];
                        return (
                          <div key={p.name} style={{
                            padding: "1.25rem", borderRadius: "1rem",
                            background: "rgba(255,255,255,0.015)", border: "1px solid rgba(200,185,255,0.04)",
                          }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                              <span style={{ fontSize: "1.2rem", marginTop: "0.1rem", opacity: 0.6 }}>{p.glyph}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                                  <span style={{ fontFamily: "var(--font-accent)", fontSize: "0.95rem", fontWeight: 500, color: "rgba(230,220,255,0.88)" }}>
                                    {p.name} in {p.sign}
                                  </span>
                                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.35)" }}>
                                    {p.degree}° · House {p.house}
                                    {p.retrograde && " · ℞ Retrograde"}
                                  </span>
                                  <DignityBadge dignity={p.dignity} />
                                </div>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.3)", margin: "0 0 0.3rem", fontStyle: "italic" }}>{meaning}</p>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 400, lineHeight: 1.65, color: "rgba(220,210,240,0.75)", margin: "0 0 0.3rem" }}>{interp}</p>
                                {houseMeaning && (
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "rgba(180,170,210,0.4)", margin: 0 }}>
                                    In your {houseMeaning.area} house — {houseMeaning.rules.toLowerCase()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── CHART BALANCE — visual bars ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ ...glass, padding: "1.25rem" }}>
                      <div style={{ ...labelSt, marginBottom: "0.6rem" }}>Element Balance</div>
                      {(["Fire", "Earth", "Air", "Water"] as const).map(el => {
                        const val = chart.elementBalance[el];
                        const max = Math.max(chart.elementBalance.Fire, chart.elementBalance.Earth, chart.elementBalance.Air, chart.elementBalance.Water);
                        const colors = { Fire: "#FF6B35", Earth: "#7CB342", Air: "#B0BEC5", Water: "#4FC3F7" };
                        return (
                          <div key={el} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "rgba(200,190,235,0.6)", width: "42px" }}>{el}</span>
                            <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.04)" }}>
                              <div style={{ width: `${(val / max) * 100}%`, height: "100%", borderRadius: "2px", background: colors[el] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ ...glass, padding: "1.25rem" }}>
                      <div style={{ ...labelSt, marginBottom: "0.6rem" }}>Modality Balance</div>
                      {(["Cardinal", "Fixed", "Mutable"] as const).map(mod => {
                        const val = chart.modalityBalance[mod] as number;
                        const max = Math.max(chart.modalityBalance.Cardinal as number, chart.modalityBalance.Fixed as number, chart.modalityBalance.Mutable as number);
                        const colors = { Cardinal: "#E8524A", Fixed: "#FFD700", Mutable: "#7B68EE" };
                        return (
                          <div key={mod} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.72rem", color: "rgba(200,190,235,0.6)", width: "58px" }}>{mod}</span>
                            <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.04)" }}>
                              <div style={{ width: `${(val / max) * 100}%`, height: "100%", borderRadius: "2px", background: colors[mod] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── ASPECTS — simplified, readable ── */}
                  <div style={{ ...glass, padding: "1.25rem" }}>
                    <div style={{ ...labelSt, marginBottom: "0.6rem" }}>Key Aspects</div>
                    {chart.aspects.slice(0, 10).map((a, i) => {
                      const symbol = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍", quincunx: "⚻" }[a.type] || "·";
                      const isHarmonious = a.harmony === "harmonious";
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.4rem 0", borderBottom: i < 9 ? "1px solid rgba(200,185,255,0.03)" : "none",
                        }}>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(220,210,240,0.7)", minWidth: "60px" }}>{a.planet1}</span>
                          <span style={{ fontSize: "0.85rem", color: isHarmonious ? "rgba(78,205,196,0.6)" : "rgba(232,82,74,0.5)" }}>{symbol}</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(220,210,240,0.7)", flex: 1 }}>{a.planet2}</span>
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.3)" }}>{a.type}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── LIFE THEME ── */}
                  <div style={{ ...glass, padding: "1.5rem", textAlign: "center" }}>
                    <div style={{ ...labelSt, marginBottom: "0.6rem" }}>Your Life Theme</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300, lineHeight: 1.8, color: "rgba(196,185,228,0.75)", margin: "0 0 1rem", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                      {chart.interpretation.lifeTheme}
                    </p>
                    <div style={{ ...labelSt, marginBottom: "0.4rem" }}>Soul Direction</div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, lineHeight: 1.75, color: "rgba(196,185,228,0.65)", margin: 0, fontStyle: "italic", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                      {chart.interpretation.soulPurpose}
                    </p>
                  </div>

                  {/* Link to full chart */}
                  <div style={{ textAlign: "center" }}>
                    <Link href="/chart" style={{
                      display: "inline-block", padding: "0.65rem 1.5rem", borderRadius: "100px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,185,255,0.1)",
                      color: "rgba(200,185,240,0.7)", fontSize: "0.72rem", fontWeight: 400,
                      letterSpacing: "0.06em", textTransform: "uppercase" as const, textDecoration: "none",
                    }}>View Interactive Chart Wheel &rarr;</Link>
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
