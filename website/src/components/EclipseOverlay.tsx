/**
 * EclipseOverlay.tsx — Global visual overlay for astronomical events
 *
 * Pure CSS effects layer. Activates on eclipses, full/new moons,
 * Mercury retrograde, solstices, and equinoxes. Atmospheric, never intrusive.
 */

"use client";

import React, { useEffect, useState } from "react";
import { getActiveEffect, type EventEffect } from "@/lib/eclipse-effects";

export default function EclipseOverlay() {
  const [effect, setEffect] = useState<EventEffect>(null);

  useEffect(() => {
    setEffect(getActiveEffect());
  }, []);

  if (!effect) return null;

  return (
    <>
      {effect.type === "eclipse_solar" && <SolarEclipseEffect />}
      {effect.type === "eclipse_lunar" && <LunarEclipseEffect />}
      {effect.type === "full_moon" && <FullMoonEffect />}
      {effect.type === "new_moon" && <NewMoonEffect />}
      {effect.type === "mercury_retrograde" && <MercuryRetrogradeEffect />}
      {effect.type === "solstice" && <SolsticeEffect season={effect.season} />}
      {effect.type === "equinox" && <EquinoxEffect season={effect.season} />}
    </>
  );
}

/* ── Solar Eclipse: Corona ring on black ── */
function SolarEclipseEffect() {
  return (
    <div
      className="eclipse-overlay"
      style={{
        background: `
          radial-gradient(circle at 50% 35%,
            transparent 80px,
            rgba(200, 168, 75, 0.12) 82px,
            rgba(200, 168, 75, 0.08) 100px,
            rgba(200, 168, 75, 0.03) 140px,
            transparent 200px
          )
        `,
        animation: "eclipse-pulse 6s var(--ease-breathe) infinite",
      }}
    >
      <style>{`
        @keyframes eclipse-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Lunar Eclipse: Reddish tint ── */
function LunarEclipseEffect() {
  return (
    <div
      className="eclipse-overlay"
      style={{
        background: `
          radial-gradient(circle at 50% 30%,
            rgba(200, 80, 60, 0.06) 0%,
            rgba(200, 80, 60, 0.03) 40%,
            transparent 70%
          )
        `,
      }}
    />
  );
}

/* ── Full Moon: Subtle lunar glow top-center ── */
function FullMoonEffect() {
  return (
    <div
      className="eclipse-overlay"
      style={{
        background: `
          radial-gradient(ellipse 400px 300px at 50% 8%,
            rgba(230, 230, 255, 0.06) 0%,
            rgba(230, 230, 255, 0.02) 50%,
            transparent 100%
          )
        `,
      }}
    />
  );
}

/* ── New Moon: Darken everything ── */
function NewMoonEffect() {
  return (
    <div
      className="eclipse-overlay"
      style={{
        background: "rgba(0, 0, 0, 0.15)",
      }}
    />
  );
}

/* ── Mercury Retrograde: RGB split on headings ── */
function MercuryRetrogradeEffect() {
  return (
    <style>{`
      h1, h2, h3 {
        text-shadow:
          0.5px 0 0 rgba(255, 80, 80, 0.18),
          -0.5px 0 0 rgba(80, 220, 255, 0.18) !important;
      }
    `}</style>
  );
}

/* ── Solstice: Color temperature shift ── */
function SolsticeEffect({ season }: { season: "winter" | "summer" }) {
  const filter =
    season === "winter"
      ? "saturate(0.95) brightness(0.97) hue-rotate(-5deg)"
      : "saturate(1.05) brightness(1.02) sepia(0.04)";

  return (
    <style>{`
      body { filter: ${filter}; }
    `}</style>
  );
}

/* ── Equinox: Subtle balanced tint ── */
function EquinoxEffect({ season }: { season: "spring" | "fall" }) {
  const filter =
    season === "spring"
      ? "saturate(1.03) brightness(1.01)"
      : "saturate(0.97) brightness(0.99) sepia(0.02)";

  return (
    <style>{`
      body { filter: ${filter}; }
    `}</style>
  );
}
