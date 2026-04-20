/**
 * SkyTicker.tsx — thin editorial strip of the sky, right now.
 *
 * Computes live from lib/celestial.ts — Sun / Moon / Mercury / Venus /
 * Mars positions, Moon phase + illumination, nearest notable aspect.
 * Refreshes every 60s.
 *
 * Purpose: prove the "real NASA ephemeris data" claim on page 1 in
 * three seconds, without asking the user to sign up, enter a birthday,
 * or click into a subsection.
 */

"use client";

import React, { useEffect, useState } from "react";
import { getAllPositions, getMoonPhase, type CelestialBody, type MoonPhaseData } from "@/lib/celestial";

interface SkyState {
  bodies: CelestialBody[];
  moon: MoonPhaseData;
  aspect: { a: CelestialBody; b: CelestialBody; type: string; orb: number } | null;
  asOf: Date;
}

const ASPECTS: { angle: number; label: string }[] = [
  { angle: 0,   label: "conjunct" },
  { angle: 60,  label: "sextile" },
  { angle: 90,  label: "square" },
  { angle: 120, label: "trine" },
  { angle: 180, label: "opposite" },
];

function nearestAspect(bodies: CelestialBody[]) {
  // Consider Sun, Moon, Mercury, Venus, Mars only — the inner "weather"
  // Saturn/Jupiter move slowly, less meaningful for an hourly ticker.
  const inner = bodies.filter((b) => ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(b.name));
  let best: { a: CelestialBody; b: CelestialBody; type: string; orb: number } | null = null;

  for (let i = 0; i < inner.length; i++) {
    for (let j = i + 1; j < inner.length; j++) {
      const a = inner[i];
      const b = inner[j];
      let diff = Math.abs(a.longitude - b.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        const orb = Math.abs(diff - asp.angle);
        if (orb < 4 && (!best || orb < best.orb)) {
          best = { a, b, type: asp.label, orb };
        }
      }
    }
  }
  return best;
}

function formatAsOf(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SkyTicker() {
  const [state, setState] = useState<SkyState | null>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const bodies = getAllPositions(now);
      const moon = getMoonPhase(now);
      const aspect = nearestAspect(bodies);
      setState({ bodies, moon, aspect, asOf: now });
    };
    compute();
    const id = window.setInterval(compute, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!state) {
    return (
      <section className="skyT" aria-label="Live sky">
        <div className="skyT-inner" aria-live="polite" aria-busy="true">
          <span className="skyT-label">The sky, right now</span>
          <span className="skyT-dash" aria-hidden>—</span>
          <span className="skyT-loading">computing…</span>
        </div>
        <style>{tickerStyles}</style>
      </section>
    );
  }

  const sun = state.bodies.find((b) => b.name === "Sun");
  const moonBody = state.bodies.find((b) => b.name === "Moon");

  return (
    <section className="skyT" aria-label="Live sky">
      <div className="skyT-inner" aria-live="polite">
        <span className="skyT-label">
          <span aria-hidden className="skyT-dot" />
          The sky, right now
        </span>

        <span className="skyT-dash" aria-hidden>—</span>

        {moonBody && (
          <span className="skyT-item">
            <span className="skyT-glyph" aria-hidden>{moonBody.signGlyph}</span>
            Moon in <em>{moonBody.sign}</em>
            <span className="skyT-sub">{state.moon.illumination}% {state.moon.phase.toLowerCase()}</span>
          </span>
        )}

        {sun && (
          <span className="skyT-item">
            <span className="skyT-glyph" aria-hidden>{sun.signGlyph}</span>
            Sun at <em>{Math.round(sun.degree)}°</em>
            <span className="skyT-sub">{sun.sign}</span>
          </span>
        )}

        {state.aspect && (
          <span className="skyT-item skyT-item-aspect">
            <span aria-hidden className="skyT-spark">✦</span>
            <em>{state.aspect.a.name}</em>{" "}
            {state.aspect.type}{" "}
            <em>{state.aspect.b.name}</em>
            <span className="skyT-sub">{state.aspect.orb.toFixed(1)}° orb</span>
          </span>
        )}

        <span className="skyT-asof" aria-hidden>as of {formatAsOf(state.asOf)}</span>
      </div>

      <style>{tickerStyles}</style>
    </section>
  );
}

const tickerStyles = `
  .skyT {
    padding: clamp(1.5rem, 2.5vw, 2rem) clamp(1.25rem, 5vw, 5rem);
    border-top: 1px solid var(--c-border, rgba(200,185,255,0.10));
    border-bottom: 1px solid var(--c-border, rgba(200,185,255,0.10));
    background: linear-gradient(180deg, rgba(11, 8, 30, 0.55), rgba(11, 8, 30, 0.25));
    -webkit-backdrop-filter: blur(10px) saturate(1.2);
    backdrop-filter: blur(10px) saturate(1.2);
    position: relative;
    z-index: 1;
  }
  .skyT-inner {
    max-width: 1280px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.5rem;
    font-family: var(--font-body, system-ui), sans-serif;
    font-size: 0.9rem;
    color: var(--c-text-mid, rgba(196, 185, 228, 0.85));
    line-height: 1.5;
  }
  .skyT-label {
    font-family: var(--font-body, system-ui), sans-serif;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(232, 201, 106, 0.85);
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    white-space: nowrap;
  }
  .skyT-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(78, 205, 196, 1);
    box-shadow: 0 0 10px rgba(78, 205, 196, 0.85);
    animation: skyTPulse 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  }
  .skyT-dash {
    color: rgba(200, 185, 255, 0.3);
    margin: 0 0.25rem;
  }
  .skyT-item {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    font-size: 0.92rem;
    color: rgba(238, 232, 220, 0.85);
    white-space: nowrap;
  }
  .skyT-item em {
    font-family: var(--font-heading, "Cormorant Garamond"), serif;
    font-style: italic;
    color: rgba(245, 240, 232, 0.98);
    font-size: 1.05rem;
    padding: 0 0.05em;
  }
  .skyT-item-aspect em {
    color: rgba(232, 201, 106, 0.95);
  }
  .skyT-glyph {
    color: rgba(232, 201, 106, 0.92);
    font-size: 1.05rem;
    line-height: 1;
    margin-right: 0.1em;
  }
  .skyT-spark {
    color: rgba(232, 201, 106, 0.7);
    font-size: 0.85rem;
    margin-right: 0.1em;
  }
  .skyT-sub {
    color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
    font-size: 0.78rem;
    letter-spacing: 0.04em;
  }
  .skyT-asof {
    margin-left: auto;
    font-size: 0.7rem;
    font-family: var(--font-mono, "IBM Plex Mono"), monospace;
    letter-spacing: 0.1em;
    color: var(--c-text-muted, rgba(190, 180, 225, 0.55));
    white-space: nowrap;
  }
  .skyT-loading {
    font-style: italic;
    color: var(--c-text-muted);
  }
  @keyframes skyTPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.5; transform: scale(0.75); }
  }
  @media (prefers-reduced-motion: reduce) {
    .skyT-dot { animation: none; }
  }
  @media (max-width: 720px) {
    .skyT-asof { margin-left: 0; }
    .skyT-dash { display: none; }
    .skyT-inner { gap: 0.4rem 1rem; font-size: 0.82rem; }
    .skyT-item em { font-size: 1rem; }
  }
`;
