/**
 * Synastry — Full compatibility analysis between two birth charts.
 *
 * Night plate register: two ledger sheets on near-black paper, bone ink,
 * hairlines, one ember accent, an engraved vesica as the header figure.
 *
 * Person A auto-fills from stored user data.
 * Person B: name + BirthDatePicker + time + CityAutocomplete.
 * Results: animated score ring, sub-score bars, top aspects list.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import NightShell from "@/components/almanac/NightShell";
import Link from "next/link";
import { computeNatalChart, type BirthInput } from "../../lib/natal-chart";
import { computeSynastry, type SynastryResult } from "../../lib/synastry-engine";
import { loadUser } from "../../lib/user-store";
import BirthDatePicker from "../../components/BirthDatePicker";
import CityAutocomplete from "../../components/CityAutocomplete";
import Paywall from "../../components/Paywall";
import { type CityData } from "../../lib/cities";
import { useLocale } from "../../lib/i18n/useLocale";
import { readInviteFromUrl, buildInviteUrl } from "../../lib/compatibility-invite";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mono ledger caption — inline for the small components below.
const capSt: React.CSSProperties = {
  fontFamily: "var(--font-mono, ui-monospace), monospace",
  fontSize: "0.6rem",
  fontWeight: 500,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--bone-faint)",
};

// ── Engraved vesica — two overlapping bone circles, hatched lens ──
function VesicaFigure() {
  return (
    <svg
      viewBox="0 0 320 220"
      width="170"
      aria-hidden="true"
      style={{ display: "block", margin: "0 auto 1.4rem", color: "var(--bone)", maxWidth: "100%" }}
    >
      <defs>
        <clipPath id="syn-lens">
          <path d="M160 47.6 A72 72 0 0 1 160 172.4 A72 72 0 0 1 160 47.6 Z" />
        </clipPath>
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="124" cy="110" r="72" strokeWidth="1" opacity="0.55" />
        <circle cx="196" cy="110" r="72" strokeWidth="1" opacity="0.55" />
        <circle cx="124" cy="110" r="52" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
        <circle cx="196" cy="110" r="52" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
        {/* hatching inside the lens — engraver's shade */}
        <g clipPath="url(#syn-lens)" strokeWidth="0.4" opacity="0.28">
          {Array.from({ length: 16 }, (_, i) => (
            <line key={i} x1="118" y1={44 + i * 8.4} x2="202" y2={36 + i * 8.4} />
          ))}
        </g>
      </g>
      <g fill="currentColor" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        <text x="100" y="110" fontSize="16" opacity="0.75">&#x2609;</text>
        <text x="220" y="110" fontSize="16" opacity="0.75">&#x263D;</text>
        <text x="160" y="110" fontSize="12" fill="var(--ember)">&#x2726;</text>
      </g>
    </svg>
  );
}

// ── Animated SVG score ring ──
function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const f = requestAnimationFrame(() => setAnimated(score));
      return () => cancelAnimationFrame(f);
    }
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

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(238,242,255,0.12)" strokeWidth="1"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--ember)" strokeWidth="3"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
          fontSize: "2.8rem", fontWeight: 400,
          color: "var(--bone)", lineHeight: 1,
        }}>{animated}</span>
        <span style={{ ...capSt, fontSize: "0.5rem", marginTop: "0.45rem" }}>Compatibility score</span>
      </div>
    </div>
  );
}

// ── Sub-score bar — one bone rule against a hairline track ──
function ScoreBar({ label, value }: { label: string; value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.6rem" }}>
      <span style={{
        fontFamily: "var(--font-body, system-ui), sans-serif", fontSize: "0.72rem",
        color: "var(--bone-soft)",
        width: "100px", textAlign: "right", flexShrink: 0,
      }}>{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${width}%` }} />
      </div>
      <span style={{
        fontFamily: "var(--font-mono, ui-monospace), monospace", fontSize: "0.72rem",
        color: "var(--bone)", width: "32px", flexShrink: 0,
      }}>{value}</span>
      <style jsx>{`
        .bar-track {
          flex: 1;
          height: 3px;
          background: rgba(232, 233, 255, 0.1);
        }
        .bar-fill {
          height: 100%;
          background: var(--bone);
          transition: width 1s ${EASE};
        }
        @media (prefers-reduced-motion: reduce) {
          .bar-fill {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

// ── Aspect harmony symbols ──
const ASPECT_SYMBOL: Record<string, string> = {
  conjunction: "☌", trine: "△", square: "□",
  opposition: "☍", sextile: "✹",
};

export default function SynastryPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";

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
  const [fromInvite, setFromInvite] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Auto-fill Person A — first try the URL invite (?invite=...), then localStorage.
  useEffect(() => {
    const invited = readInviteFromUrl();
    if (invited) {
      setTimeout(() => {
        setNameA(invited.name || "");
        setInviterName(invited.name || "Someone");
        setDateA(`${invited.year}-${String(invited.month).padStart(2, "0")}-${String(invited.day).padStart(2, "0")}`);
        if (invited.hour !== 12 || invited.minute !== 0) {
          setTimeA(`${String(invited.hour).padStart(2, "0")}:${String(invited.minute).padStart(2, "0")}`);
        } else {
          setTimeUnknownA(true);
        }
        setCityA({ name: invited.city || "Unknown", country: "", lat: invited.latitude, lon: invited.longitude, tz: invited.timezone });
        setPrefilledA(true);
        setFromInvite(true);
      }, 0);
      return;
    }
    const user = loadUser();
    if (!user) {
      // Third fallback: the Inscription — the almanac's own single ask.
      try {
        const b = localStorage.getItem("olivia-birth");
        if (b && /^\d{4}-\d{2}-\d{2}$/.test(b)) {
          setTimeout(() => {
            setDateA(b);
            setTimeUnknownA(true);
            setPrefilledA(true);
          }, 0);
        }
      } catch {
        /* unlettered */
      }
      return;
    }
    if (user) {
      setTimeout(() => {
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
      }, 0);
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

  // One ledger sheet — shared by Person A / Person B.
  const renderSheet = (opts: {
    heading: React.ReactNode;
    name: string; setName: (v: string) => void;
    date: string; setDate: (v: string) => void;
    time: string; setTime: (v: string) => void;
    timeUnknown: boolean; setTimeUnknown: (v: boolean) => void;
    setCity: (c: CityData | null) => void;
  }) => (
    <div className="night-card syn-sheet">
      <div className="syn-sheet-head night-caption">{opts.heading}</div>

      <div className="syn-row">
        <span className="syn-label">Name</span>
        <input
          type="text" placeholder="Optional" value={opts.name}
          onChange={e => opts.setName(e.target.value)}
          className="night-input"
        />
      </div>

      <div className="syn-row syn-field syn-picker">
        <span className="syn-label">Birth Date</span>
        <BirthDatePicker value={opts.date} onChange={opts.setDate} />
      </div>

      <div className="syn-row">
        <span className="syn-label">Birth Time {opts.timeUnknown && "(Noon)"}</span>
        {!opts.timeUnknown && (
          <input
            type="time" value={opts.time}
            onChange={e => opts.setTime(e.target.value)}
            className="night-input"
            style={{ colorScheme: "dark" }}
          />
        )}
        <button
          type="button"
          onClick={() => { opts.setTimeUnknown(!opts.timeUnknown); opts.setTime(""); }}
          className={`syn-time-toggle${opts.timeUnknown ? " is-on" : ""}`}
        >
          {opts.timeUnknown ? "✦ Known time" : "Don't know exact time?"}
        </button>
      </div>

      <div className="syn-row syn-field syn-city">
        <span className="syn-label">Birth City</span>
        <CityAutocomplete onSelect={opts.setCity} />
      </div>
    </div>
  );

  return (
    <NightShell room={locale === "uk" ? "Кімната порівнянь" : "The Comparing Room"}>
      <div className="syn-page">
        {/* Header */}
        <header className="syn-header">
          <VesicaFigure />
          <p className="night-kicker">{isUk ? "Дві карти · одне читання" : "Two charts · one reading"}</p>
          <h1 className="night-h1">Check compatibility</h1>
          <p className="night-lead syn-lead">
            Enter two birth dates to explore relationship dynamics in plain, actionable language.
          </p>
          <Link href="/#faq" className="night-link">How it works</Link>

          {/* Inviter banner — shown when arriving via ?invite=... */}
          {fromInvite && inviterName && (
            <div className="night-card syn-invite-banner">
              <span aria-hidden className="syn-invite-star">&#x2726;</span>
              <div>
                <div className="syn-invite-title">
                  {inviterName} wants to compare charts with you.
                </div>
                <div className="syn-invite-body">
                  Their birth data is already filled in. Add yours below to see the compatibility reading.
                </div>
              </div>
            </div>
          )}
        </header>

        {!result ? (
          /* ── INPUT FORMS — two ledger sheets side by side ── */
          <div className="syn-forms">
            {renderSheet({
              heading: <>First Person {prefilledA && "(You)"}</>,
              name: nameA, setName: setNameA,
              date: dateA, setDate: setDateA,
              time: timeA, setTime: setTimeA,
              timeUnknown: timeUnknownA, setTimeUnknown: setTimeUnknownA,
              setCity: setCityA,
            })}
            {renderSheet({
              heading: <>Second Person</>,
              name: nameB, setName: setNameB,
              date: dateB, setDate: setDateB,
              time: timeB, setTime: setTimeB,
              timeUnknown: timeUnknownB, setTimeUnknown: setTimeUnknownB,
              setCity: setCityB,
            })}

            {/* Calculate button — full width */}
            <div className="syn-submit">
              <button
                type="button"
                onClick={compute}
                disabled={!canCompute || computing}
                className="night-btn"
              >
                {computing ? "Comparing..." : "Check compatibility"}
              </button>
            </div>
          </div>
        ) : (
          /* ── RESULTS ── */
          <div className="syn-results">
            {/* Header with names */}
            <div className="syn-pair">
              <div className="syn-person">
                <div className="syn-person-name">{result.personA.name || result.personA.sunSign}</div>
                <div className="syn-person-signs">
                  {result.personA.sunSign} / {result.personA.moonSign} / {result.personA.risingSign}
                </div>
              </div>
              <span className="syn-pair-star" aria-hidden>&#x2726;</span>
              <div className="syn-person">
                <div className="syn-person-name">{result.personB.name || result.personB.sunSign}</div>
                <div className="syn-person-signs">
                  {result.personB.sunSign} / {result.personB.moonSign} / {result.personB.risingSign}
                </div>
              </div>
            </div>

            {/* Score ring */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ScoreRing score={result.overall} />
            </div>

            {/* Verdict */}
            <div className="night-card syn-verdict">
              <p>{result.verdict}</p>
            </div>

            {/* Premium-gated: detailed breakdown + cross-chart aspects */}
            <div className="syn-paywall">
              <Paywall requires="premium" priceKey="premium_monthly" featureName="the full synastry breakdown">
                {/* Sub-scores */}
                <div className="night-card">
                  <div className="night-caption syn-card-head">Compatibility Breakdown</div>
                  <ScoreBar label="Love & Passion" value={result.scores.love} />
                  <ScoreBar label="Emotion" value={result.scores.emotion} />
                  <ScoreBar label="Communication" value={result.scores.communication} />
                  <ScoreBar label="Growth" value={result.scores.growth} />
                  <ScoreBar label="Challenge" value={result.scores.challenge} />
                </div>

                {/* Top aspects */}
                <div className="night-card" style={{ marginTop: "1.5rem" }}>
                  <div className="night-caption syn-card-head">Key Cross-Chart Aspects</div>
                  {result.topAspects.map((asp, i) => (
                    <div
                      key={i}
                      className={i < result.topAspects.length - 1 ? "syn-aspect night-hairline-row" : "syn-aspect"}
                    >
                      <div className="syn-aspect-line">
                        <span className="syn-aspect-body">{asp.planetA} in {asp.signA}</span>
                        <span
                          className="syn-aspect-symbol"
                          data-harmony={asp.harmony}
                        >
                          {ASPECT_SYMBOL[asp.aspectType] || "·"}
                        </span>
                        <span className="syn-aspect-body">{asp.planetB} in {asp.signB}</span>
                        <span className="syn-aspect-orb">
                          {asp.aspectType} ({asp.orb}{"°"})
                        </span>
                      </div>
                      <p className="syn-aspect-text">{asp.interpretation}</p>
                    </div>
                  ))}
                </div>
              </Paywall>
            </div>

            {/* Cosmic Compatibility Link — viral mechanic.
                Person A generates a shareable URL; Person B opens it, sees the
                inviter banner, and is auto-filled. */}
            {!fromInvite && (
              <div className="night-card syn-share">
                <p className="syn-share-title">Want them to see this too?</p>
                <p className="syn-share-body">
                  Send a private link. Your half is filled in, and they only need to add their own birth details.
                </p>
                <button
                  type="button"
                  className="night-btn"
                  onClick={async () => {
                    const [yA, mA, dA] = dateA.split("-").map(Number);
                    const locA = cityA || { lat: 40.71, lon: -74.01, tz: -5, name: "Unknown" };
                    const inputA: BirthInput = {
                      year: yA, month: mA, day: dA,
                      hour: timeUnknownA ? 12 : parseInt(timeA.split(":")[0] || "12"),
                      minute: timeUnknownA ? 0 : parseInt(timeA.split(":")[1] || "0"),
                      latitude: locA.lat, longitude: locA.lon, timezone: locA.tz,
                      name: nameA || undefined,
                      city: cityA?.name,
                    };
                    const url = buildInviteUrl(inputA);
                    setInviteUrl(url);
                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: "Compare our charts",
                          text: `${nameA || "Someone"} wants to compare charts with you. Open the link to add your birth details.`,
                          url,
                        });
                      } else {
                        await navigator.clipboard.writeText(url);
                        setInviteCopied(true);
                        setTimeout(() => setInviteCopied(false), 2400);
                      }
                    } catch { /* user dismissed share sheet */ }
                  }}
                >
                  {inviteCopied ? "Link copied" : "Generate share link"}
                </button>
                {inviteUrl && !inviteCopied && (
                  <div className="syn-share-url">{inviteUrl}</div>
                )}
              </div>
            )}

            {/* Reset */}
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={reset} className="night-btn ghost">
                Compare New Pair
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .syn-page {
          max-width: 60rem;
          margin: 0 auto;
        }

        .syn-header {
          text-align: center;
          margin-bottom: clamp(2.4rem, 5vw, 3.6rem);
        }

        .syn-lead {
          max-width: 30em;
          margin: 0.9rem auto 1.3rem;
        }

        /* ── Inviter banner ── */
        .syn-invite-banner {
          margin: 1.6rem auto 0;
          max-width: 30rem;
          border-left: 2px solid var(--ember);
          text-align: left;
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .syn-invite-star {
          color: var(--ember);
          font-size: 1.2rem;
          line-height: 1;
        }

        .syn-invite-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--bone);
        }

        .syn-invite-body {
          font-size: 0.78rem;
          color: var(--bone-soft);
          margin-top: 0.3rem;
          line-height: 1.5;
        }

        /* ── Ledger sheets ── */
        .syn-forms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
          gap: clamp(1.2rem, 3vw, 2rem);
          width: 100%;
          max-width: 54rem;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .syn-sheet {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .syn-sheet-head {
          color: var(--bone-soft);
          padding-bottom: 0.7rem;
          border-bottom: 1px solid var(--hairline);
        }

        .syn-row {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .syn-label {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--bone-faint);
        }

        .syn-time-toggle {
          align-self: flex-start;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--bone-faint);
          transition: color 200ms var(--ease);
        }

        .syn-time-toggle:hover {
          color: var(--bone);
        }

        .syn-time-toggle.is-on {
          color: var(--ember);
        }

        .syn-submit {
          grid-column: 1 / -1;
          text-align: center;
          margin-top: 0.6rem;
        }

        /* ── Re-ink shared form children (inline-styled) ─────────
           BirthDatePicker selects + CityAutocomplete input carry the
           old cosmic inline styles; night tokens win via !important. */
        .syn-field input,
        .syn-field select {
          background-color: var(--night-deep) !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0.35rem !important;
          color: var(--bone) !important;
          font-family: var(--font-body, system-ui), sans-serif !important;
          letter-spacing: 0.01em !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .syn-field input:focus-visible,
        .syn-field select:focus-visible {
          outline: 2px solid var(--ember);
          outline-offset: 2px;
        }

        .syn-picker select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(238,242,255,0.45)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.75rem center !important;
        }

        .syn-picker option {
          background: var(--night-deep) !important;
          color: var(--bone) !important;
        }

        /* Month/Day/Year micro-labels inside BirthDatePicker */
        .syn-picker span {
          font-family: var(--font-mono, ui-monospace), monospace !important;
          font-size: 0.52rem !important;
          letter-spacing: 0.2em !important;
          color: var(--bone-faint) !important;
        }

        /* CityAutocomplete dropdown panel */
        .syn-city input + div {
          background: var(--sheet) !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0.35rem !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: 0 0.6rem 1.6rem rgba(0, 0, 0, 0.5) !important;
        }

        .syn-city button {
          border-bottom-color: var(--hairline) !important;
        }

        .syn-city button:hover,
        .syn-city button:focus-visible {
          background: rgba(232, 233, 255, 0.07) !important;
        }

        .syn-city button span:first-child {
          font-family: var(--font-body, system-ui), sans-serif !important;
          color: var(--bone) !important;
        }

        .syn-city button span:last-child {
          font-family: var(--font-mono, ui-monospace), monospace !important;
          font-size: 0.58rem !important;
          letter-spacing: 0.16em !important;
          text-transform: uppercase;
          color: var(--bone-faint) !important;
        }

        /* ── Results ── */
        .syn-results {
          width: 100%;
          max-width: 44rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .syn-pair {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.4rem;
          text-align: center;
        }

        .syn-person-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.4rem;
          color: var(--bone);
          line-height: 1.15;
        }

        .syn-person-signs {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--bone-faint);
          margin-top: 0.35rem;
        }

        .syn-pair-star {
          color: var(--ember);
          font-size: 1.1rem;
        }

        .syn-verdict {
          text-align: center;
        }

        .syn-verdict p {
          margin: 0;
          font-size: 0.92rem;
          line-height: 1.75;
          color: var(--bone-soft);
        }

        .syn-card-head {
          margin-bottom: 1rem;
        }

        /* ── Aspects ledger ── */
        .syn-aspect {
          padding: 0.8rem 0;
        }

        .syn-aspect-line {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }

        .syn-aspect-body {
          font-size: 0.86rem;
          color: var(--bone);
        }

        .syn-aspect-symbol {
          font-size: 0.9rem;
          color: var(--bone-faint);
        }

        .syn-aspect-symbol[data-harmony="harmonious"] {
          color: var(--bone);
        }

        .syn-aspect-symbol[data-harmony="tense"] {
          color: var(--ember);
        }

        .syn-aspect-orb {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--bone-faint);
          margin-left: auto;
        }

        .syn-aspect-text {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.65;
          color: var(--bone-soft);
        }

        /* ── Paywall re-ink (shared component, scoped overrides) ── */
        .syn-paywall .glass-card {
          background: var(--sheet) !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0 !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          box-shadow: none !important;
        }

        .syn-paywall .text-warm-ivory {
          color: var(--bone) !important;
        }

        .syn-paywall [class*="text-muted-lavender"] {
          color: var(--bone-soft) !important;
        }

        .syn-paywall .glass-card button,
        .syn-paywall .glass-card a {
          background: var(--bone) !important;
          color: var(--night) !important;
          border: none !important;
          border-radius: 999px !important;
          box-shadow: none !important;
          font-size: 0.8rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase;
        }

        .syn-paywall .glass-card button:hover,
        .syn-paywall .glass-card a:hover {
          background: var(--ember) !important;
          color: var(--bone) !important;
        }

        /* kill the holo/foil/glow veil layers inside checkout buttons */
        .syn-paywall .glass-card button span[aria-hidden],
        .syn-paywall .glass-card a span[aria-hidden] {
          display: none !important;
        }

        /* ── Share card ── */
        .syn-share {
          text-align: center;
        }

        .syn-share-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.3rem;
          color: var(--bone);
          margin: 0 0 0.6rem;
        }

        .syn-share-body {
          font-size: 0.82rem;
          color: var(--bone-soft);
          margin: 0 auto 1.2rem;
          max-width: 32em;
          line-height: 1.55;
        }

        .syn-share-url {
          margin-top: 0.9rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.68rem;
          color: var(--bone-faint);
          word-break: break-all;
        }

        @media (prefers-reduced-motion: reduce) {
          .syn-time-toggle {
            transition: none !important;
          }
        }
      `}</style>
    </NightShell>
  );
}
