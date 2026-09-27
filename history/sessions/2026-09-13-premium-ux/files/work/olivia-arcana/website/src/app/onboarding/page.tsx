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
 * Set in the Personal Almanac print register: paper card, hairline
 * progress rule, mono step counter, ink inputs.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { getSunSign, getCosmicProfile, type CosmicProfile as CosmicProfileData } from "../../lib/zodiac-utils";
import BirthDatePicker from "../../components/BirthDatePicker";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Step = "name" | "date" | "time" | "city" | "result";
const STEPS: Step[] = ["name", "date", "time", "city", "result"];

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cardRef.current.style.opacity = "1";
      return;
    }
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
    <AlmanacShell narrow>
      <div className="onb">
        {/* Visually hidden h1 — every route needs one for a11y + SEO */}
        <h1 style={{
          position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
          overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
        }}>Onboarding — set up your cosmic profile</h1>

        {/* Step counter + progress rule */}
        <div className="onb-progress">
          <p className="alm-caption onb-step">Step {stepIndex + 1} of {STEPS.length}</p>
          <div className="onb-bar" aria-hidden>
            <div className="onb-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div ref={cardRef} className="onb-card alm-card">
          {step === "name" && (
            <>
              <h2 className="onb-title">What shall we call you?</h2>
              <p className="onb-hint">Optional — for personalized readings</p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="alm-input onb-input"
                autoFocus
              />
            </>
          )}

          {step === "date" && (
            <>
              <h2 className="onb-title">When were you born?</h2>
              <div className="onb-date">
                <BirthDatePicker
                  value={date}
                  onChange={setDate}
                />
              </div>
            </>
          )}

          {step === "time" && (
            <>
              <h2 className="onb-title">What time were you born?</h2>
              <p className="onb-hint">For accurate house placements</p>
              {!timeUnknown && (
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="alm-input onb-input"
                  style={{ colorScheme: "light" }}
                  autoFocus
                />
              )}
              <button
                type="button"
                onClick={() => { setTimeUnknown(!timeUnknown); setTime(""); }}
                className={`onb-toggle ${timeUnknown ? "is-on" : ""}`}
              >
                {timeUnknown ? "✓ Using noon as default" : "I don't know my birth time"}
              </button>
            </>
          )}

          {step === "city" && (
            <>
              <h2 className="onb-title">Where were you born?</h2>
              <p className="onb-hint">City name — for precise planetary positions</p>
              <input
                type="text"
                placeholder="e.g. New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="alm-input onb-input"
                autoFocus
              />
            </>
          )}

          {step === "result" && profile && (
            <div className="onb-result">
              <div className="onb-glyph" aria-hidden>{profile.glyph}</div>
              <h2 className="onb-sign">{profile.name}</h2>
              <p className="alm-caption onb-range">{profile.dateRange}</p>
              {name && (
                <p className="onb-welcome">
                  Welcome, {name}. Your stars are aligned.
                </p>
              )}
              <a href="/chart" className="alm-btn">
                View Your Birth Chart
              </a>
            </div>
          )}

          {/* Navigation */}
          {step !== "result" && (
            <div className="onb-nav">
              {stepIndex > 0 && (
                <button type="button" onClick={back} className="onb-back">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance()}
                className="alm-btn"
              >
                {step === "name" && !name ? "Skip" : step === "city" ? "Reveal My Chart" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .onb {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 58svh;
          justify-content: center;
        }

        .onb-progress {
          width: 100%;
          max-width: 27rem;
          margin-bottom: 1.6rem;
          text-align: center;
        }

        .onb-step {
          margin: 0 0 0.65rem;
        }

        .onb-bar {
          height: 2px;
          background: var(--hairline);
        }

        .onb-bar-fill {
          height: 100%;
          background: var(--ox);
          transition: width 0.6s ${EASE};
        }

        .onb-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          width: 100%;
          max-width: 27rem;
          padding: clamp(1.8rem, 4vw, 2.5rem) clamp(1.4rem, 3vw, 2rem);
          background: #0f1240;
          opacity: 0;
        }

        .onb-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.6rem;
          font-weight: 500;
          color: var(--ink);
          text-align: center;
          text-wrap: balance;
        }

        .onb-hint {
          margin: -0.7rem 0 0;
          color: var(--ink-faint);
          font-size: 0.82rem;
          text-align: center;
        }

        .onb :global(.onb-input) {
          max-width: 20rem;
          text-align: center;
        }

        .onb-date {
          width: 100%;
        }

        /* BirthDatePicker ships its own dark inline styles — re-ink it
           for paper. !important is required to outrank inline styles. */
        .onb-date :global(select) {
          appearance: none !important;
          -webkit-appearance: none !important;
          background-color: #e8dcc8 !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(232,233,255,0.55)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.75rem center !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0.35rem !important;
          color: var(--ink) !important;
          font-family: var(--font-body, system-ui), sans-serif !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .onb-date :global(select:focus-visible) {
          outline: 2px solid var(--ox) !important;
          outline-offset: 2px !important;
        }

        .onb-date :global(option) {
          background: #0f1240 !important;
          color: var(--ink) !important;
        }

        .onb-date :global(span) {
          color: var(--ink-faint) !important;
          font-family: var(--font-mono, ui-monospace), monospace !important;
        }

        .onb-toggle {
          background: none;
          border: none;
          padding: 0;
          color: var(--ink-faint);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: color 0.2s;
        }

        .onb-toggle:hover {
          color: var(--ink-soft);
        }

        .onb-toggle.is-on {
          color: var(--ox);
        }

        .onb-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.4rem;
        }

        .onb-back {
          min-height: 3rem;
          padding: 0.6rem 1.5rem;
          border-radius: 999px;
          background: transparent;
          border: 1px solid var(--hairline);
          color: var(--ink-soft);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 200ms ${EASE}, color 200ms ${EASE};
        }

        .onb-back:hover {
          border-color: var(--ox);
          color: var(--ox);
        }

        .onb-result {
          text-align: center;
        }

        .onb-glyph {
          margin-bottom: 0.5rem;
          font-size: 3rem;
          color: var(--ox);
        }

        .onb-sign {
          margin: 0 0 0.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--ink);
        }

        .onb-range {
          margin: 0 0 1.5rem;
        }

        .onb-welcome {
          margin: 0 0 1.5rem;
          color: var(--ink-soft);
          font-size: 0.92rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .onb-bar-fill,
          .onb-toggle,
          .onb-back {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
