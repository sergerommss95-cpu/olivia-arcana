/**
 * Onboarding — Multi-step birth data collection
 *
 * Steps:
 *   1. Name (optional — for personalized readings)
 *   2. Birth date (YYYY/MM/DD)
 *   3. Birth time (HH:MM with "I don't know" option)
 *   4. Birth city (text input — will use geocode API when backend is ready)
 *   5. Result — shows computed sun sign + redirect to chart
 *
 * Glass morphism cards, smooth step transitions, luxury motion.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { getSunSign, getCosmicProfile, type CosmicProfile as CosmicProfileData } from "../../lib/zodiac-utils";
import BirthDatePicker from "../../components/BirthDatePicker";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Step = "name" | "date" | "time" | "city" | "result";
const STEPS: Step[] = ["name", "date", "time", "city", "result"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "320px",
  padding: "0.75rem 1.2rem",
  textAlign: "center",
  fontFamily: "var(--font-accent)",
  fontSize: "1.1rem",
  letterSpacing: "0.06em",
  color: "rgba(240,236,255,0.9)",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)",
  borderRadius: "9999px",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  outline: "none",
  transition: "border-color 0.3s, box-shadow 0.3s",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: "0.6rem",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(180,170,210,0.45)",
  marginBottom: "0.5rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 2.5rem",
  borderRadius: "100px",
  background: "linear-gradient(135deg, rgba(160,120,255,0.22), rgba(100,80,220,0.18))",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(200,180,255,0.22)",
  color: "rgba(240,235,255,0.95)",
  fontSize: "0.82rem",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: `all 300ms ${EASE}`,
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [city, setCity] = useState("");
  const [profile, setProfile] = useState<CosmicProfileData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  // Animate card on step change
  useEffect(() => {
    if (!cardRef.current) return;
    cardRef.current.animate(
      [
        { opacity: "0", transform: "translateX(20px)", filter: "blur(4px)" },
        { opacity: "1", transform: "translateX(0)", filter: "blur(0px)" },
      ],
      { duration: 500, easing: EASE, fill: "forwards" }
    );
  }, [step]);

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) {
      const nextStep = STEPS[i + 1];
      if (nextStep === "result") computeResult();
      setStep(nextStep);
    }
  };

  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  const computeResult = () => {
    const match = date.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (!match) return;
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    const sign = getSunSign(month, day);
    if (sign) {
      setProfile(getCosmicProfile(sign.name, sign.glyph, sign.index));
    }
  };

  const canAdvance = () => {
    switch (step) {
      case "name": return true; // optional
      case "date": return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(date);
      case "time": return timeUnknown || /^\d{1,2}:\d{2}$/.test(time);
      case "city": return city.trim().length > 1;
      default: return false;
    }
  };

  return (
    <div style={{
      minHeight: "100svh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      position: "relative",
      zIndex: 1,
    }}>
      {/* Progress bar */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 20,
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: "linear-gradient(90deg, rgba(160,120,255,0.5), rgba(212,175,55,0.6))",
          transition: `width 0.6s ${EASE}`,
        }} />
      </div>

      {/* Step counter */}
      <div style={{
        ...labelStyle,
        marginBottom: "2rem",
      }}>
        Step {stepIndex + 1} of {STEPS.length}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          opacity: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
          maxWidth: "420px",
          width: "100%",
          padding: "2.5rem 2rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(200,185,255,0.1)",
          borderRadius: "1.5rem",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {step === "name" && (
          <>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.92)",
              textAlign: "center",
              margin: 0,
            }}>What shall we call you?</h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.6)",
              textAlign: "center",
              margin: 0,
            }}>Optional — for personalized readings</p>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </>
        )}

        {step === "date" && (
          <>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.92)",
              textAlign: "center",
              margin: 0,
            }}>When were you born?</h2>
            <BirthDatePicker
              value={date}
              onChange={setDate}
            />
          </>
        )}

        {step === "time" && (
          <>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.92)",
              textAlign: "center",
              margin: 0,
            }}>What time were you born?</h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.6)",
              textAlign: "center",
              margin: 0,
            }}>For accurate house placements</p>
            {!timeUnknown && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
                autoFocus
              />
            )}
            <button
              onClick={() => { setTimeUnknown(!timeUnknown); setTime(""); }}
              style={{
                background: "none",
                border: "none",
                color: timeUnknown ? "rgba(212,175,55,0.7)" : "rgba(180,170,210,0.45)",
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {timeUnknown ? "✓ Using noon as default" : "I don't know my birth time"}
            </button>
          </>
        )}

        {step === "city" && (
          <>
            <h2 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "rgba(240,236,255,0.92)",
              textAlign: "center",
              margin: 0,
            }}>Where were you born?</h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              fontWeight: 300,
              color: "rgba(196,185,228,0.6)",
              textAlign: "center",
              margin: 0,
            }}>City name — for precise planetary positions</p>
            <input
              type="text"
              placeholder="e.g. New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
              autoFocus
            />
          </>
        )}

        {step === "result" && profile && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{profile.glyph}</div>
            <h2 style={{
              fontFamily: "var(--font-accent)",
              fontSize: "1.8rem",
              fontWeight: 400,
              letterSpacing: "0.12em",
              color: "rgba(240,236,255,0.92)",
              textTransform: "uppercase",
              margin: "0 0 0.3rem",
            }}>{profile.name}</h2>
            <p style={{
              ...labelStyle,
              marginBottom: "1.5rem",
            }}>{profile.dateRange}</p>
            {name && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                fontWeight: 300,
                color: "rgba(196,185,228,0.75)",
                margin: "0 0 1.5rem",
              }}>
                Welcome, {name}. Your stars are aligned.
              </p>
            )}
            <a
              href="/chart"
              style={{
                ...btnPrimary,
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              View Your Birth Chart
            </a>
          </div>
        )}

        {/* Navigation */}
        {step !== "result" && (
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            {stepIndex > 0 && (
              <button onClick={back} style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(200,185,255,0.1)",
                color: "rgba(200,185,240,0.6)",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: `all 200ms ${EASE}`,
              }}>Back</button>
            )}
            <button
              onClick={next}
              disabled={!canAdvance()}
              style={{
                ...btnPrimary,
                opacity: canAdvance() ? 1 : 0.3,
                cursor: canAdvance() ? "pointer" : "not-allowed",
              }}
            >
              {step === "name" && !name ? "Skip" : step === "city" ? "Reveal My Chart" : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
