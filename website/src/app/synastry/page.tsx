/**
 * Synastry — Full compatibility analysis between two birth charts.
 *
 * Person A auto-fills from stored user data.
 * Person B: name + BirthDatePicker + time + CityAutocomplete.
 * Results: animated score ring, sub-score bars, top aspects list.
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { computeNatalChart, type BirthInput } from "../../lib/natal-chart";
import { computeSynastry, type SynastryResult } from "../../lib/synastry-engine";
import { loadUser, loadChart } from "../../lib/user-store";
import BirthDatePicker from "../../components/BirthDatePicker";
import CityAutocomplete from "../../components/CityAutocomplete";
import { type CityData } from "../../lib/cities";
import { useLocale } from "../../lib/i18n/useLocale";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

const inputStyle: React.CSSProperties = {
  padding: "0.65rem 1rem", textAlign: "left",
  fontFamily: "var(--font-accent)", fontSize: "0.95rem", letterSpacing: "0.04em",
  color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)", borderRadius: "0.75rem",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
  outline: "none", transition: "border-color 0.3s", width: "100%",
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1rem", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
};

const formCard: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.8rem",
  padding: "1.5rem",
  background: "rgba(8,6,20,0.45)",
  backdropFilter: "blur(20px) saturate(1.2)",
  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
  border: "1px solid rgba(200,185,255,0.08)",
  borderRadius: "1.25rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
};

// ── Animated SVG score ring ──
function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);
  const ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;
  const color = animated >= 70 ? "#4ECDC4" : animated >= 45 ? "#FFD700" : "#E8524A";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8"
        />
        <circle
          ref={ref}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-accent)", fontSize: "2.5rem", fontWeight: 400,
          color: "rgba(240,236,255,0.95)", letterSpacing: "0.02em",
        }}>{animated}</span>
        <span style={{ ...labelSt, fontSize: "0.5rem" }}>COSMIC COMPATIBILITY</span>
      </div>
    </div>
  );
}

// ── Sub-score bar ──
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.5rem" }}>
      <span style={{
        fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(200,190,235,0.7)",
        width: "100px", textAlign: "right",
      }}>{label}</span>
      <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.04)" }}>
        <div style={{
          width: `${width}%`, height: "100%", borderRadius: "3px",
          background: color, transition: `width 1s ${EASE}`,
        }} />
      </div>
      <span style={{
        fontFamily: "var(--font-accent)", fontSize: "0.82rem", color: "rgba(240,236,255,0.8)",
        width: "32px",
      }}>{value}</span>
    </div>
  );
}

// ── Aspect harmony symbols ──
const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "\u260C", trine: "\u25B3", square: "\u25A1",
  opposition: "\u260D", sextile: "\u2739",
};

export default function SynastryPage() {
  const { t } = useLocale();

  // Person A — auto-fill from stored data
  const [nameA, setNameA] = useState("");
  const [dateA, setDateA] = useState("");
  const [timeA, setTimeA] = useState("");
  const [timeUnknownA, setTimeUnknownA] = useState(false);
  const [cityA, setCityA] = useState<CityData | null>(null);
  const [prefilledA, setPrefilledA] = useState(false);

  // Person B
  const [nameB, setNameB] = useState("");
  const [dateB, setDateB] = useState("");
  const [timeB, setTimeB] = useState("");
  const [timeUnknownB, setTimeUnknownB] = useState(false);
  const [cityB, setCityB] = useState<CityData | null>(null);

  const [result, setResult] = useState<SynastryResult | null>(null);
  const [computing, setComputing] = useState(false);

  // Auto-fill Person A from localStorage
  useEffect(() => {
    const user = loadUser();
    if (user) {
      setNameA(user.name || "");
      const inp = user.input;
      setDateA(`${inp.year}-${String(inp.month).padStart(2, "0")}-${String(inp.day).padStart(2, "0")}`);
      if (inp.hour !== 12 || inp.minute !== 0) {
        setTimeA(`${String(inp.hour).padStart(2, "0")}:${String(inp.minute).padStart(2, "0")}`);
      } else {
        setTimeUnknownA(true);
      }
      setCityA({ name: inp.city || "Unknown", country: "", lat: inp.latitude, lon: inp.longitude, tz: inp.timezone });
      setPrefilledA(true);
    }
  }, []);

  const canCompute = !!dateA && (timeUnknownA || !!timeA) && !!dateB && (timeUnknownB || !!timeB);

  const compute = useCallback(() => {
    if (!canCompute) return;
    setComputing(true);

    // Build input A
    const [yA, mA, dA] = dateA.split("-").map(Number);
    const locA = cityA || { lat: 40.71, lon: -74.01, tz: -5 };
    const hourA = timeUnknownA ? 12 : parseInt(timeA.split(":")[0] || "12");
    const minA = timeUnknownA ? 0 : parseInt(timeA.split(":")[1] || "0");
    const inputA: BirthInput = {
      year: yA, month: mA, day: dA, hour: hourA, minute: minA,
      latitude: locA.lat, longitude: locA.lon, timezone: locA.tz,
      name: nameA || undefined,
    };

    // Build input B
    const [yB, mB, dB] = dateB.split("-").map(Number);
    const locB = cityB || { lat: 40.71, lon: -74.01, tz: -5 };
    const hourB = timeUnknownB ? 12 : parseInt(timeB.split(":")[0] || "12");
    const minB = timeUnknownB ? 0 : parseInt(timeB.split(":")[1] || "0");
    const inputB: BirthInput = {
      year: yB, month: mB, day: dB, hour: hourB, minute: minB,
      latitude: locB.lat, longitude: locB.lon, timezone: locB.tz,
      name: nameB || undefined,
    };

    const chartA = computeNatalChart(inputA);
    const chartB = computeNatalChart(inputB);
    const synastry = computeSynastry(chartA, chartB);

    setResult(synastry);
    setComputing(false);
  }, [canCompute, dateA, timeA, timeUnknownA, cityA, nameA, dateB, timeB, timeUnknownB, cityB, nameB]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2rem 1.5rem 4rem", position: "relative", zIndex: 1,
    }}>
      <a href="/" style={{
        position: "absolute", top: "1.5rem", left: "1.5rem",
        ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)",
      }}>{"\u2190"} {t("common_home")}</a>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem", marginTop: "1rem" }}>
        <div style={{ fontSize: "2rem", color: "rgba(212,175,55,0.5)", textShadow: "0 0 40px rgba(212,175,55,0.2)", marginBottom: "0.5rem" }}>
          {"\u2727"}
        </div>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 400,
        }}>
          <span className="text-gold-gradient">Cosmic Synastry</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", maxWidth: "450px", margin: "0.5rem auto 0",
        }}>
          Compare two birth charts to reveal the cosmic chemistry between souls
        </p>
      </div>

      {!result ? (
        /* ── INPUT FORMS ── */
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
          width: "100%", maxWidth: "820px",
        }}>
          {/* Person A */}
          <div style={formCard}>
            <div style={{ ...labelSt, marginBottom: "0.2rem", fontSize: "0.65rem", color: "rgba(78,205,196,0.6)" }}>
              Person A {prefilledA && "(auto-filled)"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Name</span>
              <input type="text" placeholder="Name" value={nameA} onChange={e => setNameA(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Date *</span>
              <BirthDatePicker value={dateA} onChange={setDateA} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Time {timeUnknownA ? "(using noon)" : "*"}</span>
              {!timeUnknownA && (
                <input type="time" value={timeA} onChange={e => setTimeA(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              )}
              <button onClick={() => { setTimeUnknownA(!timeUnknownA); setTimeA(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: "0.65rem",
                color: timeUnknownA ? "rgba(212,175,55,0.6)" : "rgba(180,170,210,0.35)",
                transition: "color 0.2s", textAlign: "left",
              }}>{timeUnknownA ? "\u2713 Using noon" : "I don\u2019t know the time"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth City</span>
              <CityAutocomplete onSelect={setCityA} />
            </div>
          </div>

          {/* Person B */}
          <div style={formCard}>
            <div style={{ ...labelSt, marginBottom: "0.2rem", fontSize: "0.65rem", color: "rgba(232,82,74,0.6)" }}>
              Person B
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Name</span>
              <input type="text" placeholder="Name" value={nameB} onChange={e => setNameB(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Date *</span>
              <BirthDatePicker value={dateB} onChange={setDateB} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth Time {timeUnknownB ? "(using noon)" : "*"}</span>
              {!timeUnknownB && (
                <input type="time" value={timeB} onChange={e => setTimeB(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              )}
              <button onClick={() => { setTimeUnknownB(!timeUnknownB); setTimeB(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: "0.65rem",
                color: timeUnknownB ? "rgba(212,175,55,0.6)" : "rgba(180,170,210,0.35)",
                transition: "color 0.2s", textAlign: "left",
              }}>{timeUnknownB ? "\u2713 Using noon" : "I don\u2019t know the time"}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={labelSt}>Birth City</span>
              <CityAutocomplete onSelect={setCityB} />
            </div>
          </div>

          {/* Calculate button — full width */}
          <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: "0.5rem" }}>
            <button onClick={compute} disabled={!canCompute || computing} style={{
              padding: "0.8rem 3rem", borderRadius: "100px",
              background: "linear-gradient(135deg, rgba(160,120,255,0.22), rgba(100,80,220,0.18))",
              border: "1px solid rgba(200,180,255,0.22)",
              color: "rgba(240,235,255,0.95)", fontSize: "0.85rem", fontWeight: 500,
              letterSpacing: "0.06em", textTransform: "uppercase",
              cursor: canCompute && !computing ? "pointer" : "not-allowed",
              opacity: canCompute && !computing ? 1 : 0.3,
              transition: `all 0.3s ${EASE}`,
            }}>
              {computing ? "Calculating..." : "Calculate Synastry"}
            </button>
          </div>
        </div>
      ) : (
        /* ── RESULTS ── */
        <div style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header with names */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.1rem", color: "rgba(240,236,255,0.9)" }}>
                  {result.personA.name || result.personA.sunSign}
                </div>
                <div style={{ ...labelSt, fontSize: "0.5rem" }}>
                  {result.personA.sunSign} / {result.personA.moonSign} / {result.personA.risingSign}
                </div>
              </div>
              <span style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.4)" }}>{"\u2727"}</span>
              <div>
                <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.1rem", color: "rgba(240,236,255,0.9)" }}>
                  {result.personB.name || result.personB.sunSign}
                </div>
                <div style={{ ...labelSt, fontSize: "0.5rem" }}>
                  {result.personB.sunSign} / {result.personB.moonSign} / {result.personB.risingSign}
                </div>
              </div>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScoreRing score={result.overall} />
          </div>

          {/* Verdict */}
          <div style={{ ...glass, padding: "1.5rem", textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
              lineHeight: 1.8, color: "rgba(196,185,228,0.75)", margin: 0,
            }}>{result.verdict}</p>
          </div>

          {/* Sub-scores */}
          <div style={{ ...glass, padding: "1.5rem" }}>
            <div style={{ ...labelSt, marginBottom: "0.8rem" }}>Compatibility Breakdown</div>
            <ScoreBar label="Love & Passion" value={result.scores.love} color="#E8524A" />
            <ScoreBar label="Emotion" value={result.scores.emotion} color="#4FC3F7" />
            <ScoreBar label="Communication" value={result.scores.communication} color="#FFD700" />
            <ScoreBar label="Growth" value={result.scores.growth} color="#4ECDC4" />
            <ScoreBar label="Challenge" value={result.scores.challenge} color="#7B68EE" />
          </div>

          {/* Top aspects */}
          <div style={{ ...glass, padding: "1.5rem" }}>
            <div style={{ ...labelSt, marginBottom: "0.8rem" }}>Key Cross-Chart Aspects</div>
            {result.topAspects.map((asp, i) => (
              <div key={i} style={{
                padding: "0.8rem 0",
                borderBottom: i < result.topAspects.length - 1 ? "1px solid rgba(200,185,255,0.04)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <span style={{
                    fontFamily: "var(--font-accent)", fontSize: "0.88rem", color: "rgba(240,236,255,0.85)",
                  }}>
                    {asp.planetA} in {asp.signA}
                  </span>
                  <span style={{
                    fontSize: "0.9rem",
                    color: asp.harmony === "harmonious" ? "rgba(78,205,196,0.7)" : asp.harmony === "tense" ? "rgba(232,82,74,0.6)" : "rgba(212,175,55,0.5)",
                  }}>
                    {ASPECT_SYMBOL[asp.aspectType] || "\u00B7"}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-accent)", fontSize: "0.88rem", color: "rgba(240,236,255,0.85)",
                  }}>
                    {asp.planetB} in {asp.signB}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-body)", fontSize: "0.55rem", color: "rgba(180,170,210,0.35)",
                    marginLeft: "auto",
                  }}>
                    {asp.aspectType} ({asp.orb}{"\u00B0"})
                  </span>
                </div>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
                  lineHeight: 1.7, color: "rgba(196,185,228,0.6)", margin: 0,
                }}>{asp.interpretation}</p>
              </div>
            ))}
          </div>

          {/* Reset */}
          <div style={{ textAlign: "center" }}>
            <button onClick={reset} style={{
              padding: "0.65rem 2rem", borderRadius: "100px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,185,255,0.1)",
              color: "rgba(200,185,240,0.7)", fontSize: "0.72rem", fontWeight: 400,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
              transition: `all 0.3s ${EASE}`,
            }}>Compare New Pair</button>
          </div>
        </div>
      )}
    </div>
  );
}
