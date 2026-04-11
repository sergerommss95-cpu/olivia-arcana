/**
 * CosmicIndicators — Moon Phase + Planetary Hour live display
 *
 * Persistent indicators in the top-right corner of every page.
 * Moon phase: SVG glyph with phase name on hover.
 * Planetary hour: Current ruling planet with associations on hover.
 *
 * Pure JavaScript math — no API calls.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { getMoonPhase } from "../lib/celestial";
import { sunriseHour } from "../lib/sunrise";

// Planetary hours: the Chaldean order of planets
const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿",
  Jupiter: "♃", Venus: "♀", Saturn: "♄",
};
const PLANET_COLORS: Record<string, string> = {
  Sun: "#C8A84B", Moon: "#C0C0C0", Mars: "#8B5A6B", Mercury: "#7B68EE",
  Jupiter: "#4ECDC4", Venus: "#B4A0D4", Saturn: "#8B7355",
};

// Day rulers in Chaldean order (Sunday=Sun, Monday=Moon, etc.)
const DAY_RULERS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

function getPlanetaryHour(): { planet: string; hourNum: number } {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday
  const dayRuler = DAY_RULERS[day];
  const dayStartIdx = CHALDEAN_ORDER.indexOf(dayRuler);

  // Hours from actual sunrise (Odessa, Ukraine coordinates)
  const sunrise = sunriseHour(now, 46.48, 30.73);
  const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
  const hoursSinceSunrise = Math.floor((currentDecimalHour - sunrise + 24) % 24);
  const planetIdx = (dayStartIdx + hoursSinceSunrise) % 7;

  return {
    planet: CHALDEAN_ORDER[planetIdx],
    hourNum: hoursSinceSunrise + 1,
  };
}

export default function CosmicIndicators() {
  const [mounted, setMounted] = useState(false);
  const [moonHover, setMoonHover] = useState(false);
  const [planetHover, setPlanetHover] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const moonPhase = getMoonPhase(new Date());
  const { planet, hourNum } = getPlanetaryHour();
  const planetGlyph = PLANET_GLYPHS[planet] || "✦";
  const planetColor = PLANET_COLORS[planet] || "#C8A84B";

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.35rem",
        pointerEvents: "auto",
      }}
    >
      {/* Moon Phase */}
      <div
        onMouseEnter={() => setMoonHover(true)}
        onMouseLeave={() => setMoonHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "100px",
          background: moonHover ? "rgba(12,13,24,0.8)" : "transparent",
          border: moonHover ? "1px solid rgba(200,168,75,0.15)" : "1px solid transparent",
          backdropFilter: moonHover ? "blur(12px)" : "none",
          transition: "all 0.3s var(--ease-ritual)",
          cursor: "default",
        }}
      >
        <span style={{ fontSize: "1rem", lineHeight: 1 }}>{moonPhase.emoji}</span>
        {moonHover && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--c-text-muted)",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}>
            {moonPhase.phase} · {moonPhase.illumination}%
          </div>
        )}
      </div>

      {/* Planetary Hour */}
      <div
        onMouseEnter={() => setPlanetHover(true)}
        onMouseLeave={() => setPlanetHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "100px",
          background: planetHover ? "rgba(12,13,24,0.8)" : "transparent",
          border: planetHover ? `1px solid ${planetColor}25` : "1px solid transparent",
          backdropFilter: planetHover ? "blur(12px)" : "none",
          transition: "all 0.3s var(--ease-ritual)",
          cursor: "default",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: planetColor, lineHeight: 1 }}>
          {planetGlyph}
        </span>
        {planetHover && (
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.65rem",
            color: "var(--c-text-muted)",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}>
            Hour of {planet}
          </div>
        )}
      </div>
    </div>
  );
}
