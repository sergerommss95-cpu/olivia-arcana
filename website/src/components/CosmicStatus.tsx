/**
 * CosmicStatus.tsx — Real-time moon phase + planetary status bar
 *
 * Shows at the top of the page (below navbar):
 *   - Current moon phase with emoji + name
 *   - Mercury retrograde status
 *   - Today's dominant cosmic energy
 *
 * All computed client-side from astronomical algorithms (no API).
 */

"use client";

import React, { useState, useEffect } from "react";

// ── Moon phase calculator ──
function getMoonPhase(date: Date): { phase: string; emoji: string; illumination: number } {
  // Synodic month = 29.53059 days
  const SYNODIC = 29.53059;
  // Known new moon: Jan 6, 2000 18:14 UTC
  const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();
  const diff = date.getTime() - KNOWN_NEW_MOON;
  const days = diff / 86400000;
  const phase = ((days % SYNODIC) + SYNODIC) % SYNODIC;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase / SYNODIC)) / 2 * 100);

  if (phase < 1.85) return { phase: "New Moon", emoji: "🌑", illumination };
  if (phase < 7.38) return { phase: "Waxing Crescent", emoji: "🌒", illumination };
  if (phase < 9.23) return { phase: "First Quarter", emoji: "🌓", illumination };
  if (phase < 14.77) return { phase: "Waxing Gibbous", emoji: "🌔", illumination };
  if (phase < 16.61) return { phase: "Full Moon", emoji: "🌕", illumination };
  if (phase < 22.15) return { phase: "Waning Gibbous", emoji: "🌖", illumination };
  if (phase < 23.99) return { phase: "Last Quarter", emoji: "🌗", illumination };
  if (phase < 27.68) return { phase: "Waning Crescent", emoji: "🌘", illumination };
  return { phase: "New Moon", emoji: "🌑", illumination };
}

// ── Mercury retrograde periods (2026 approximations) ──
function isMercuryRetrograde(date: Date): boolean {
  const retrogrades = [
    ["2026-01-26", "2026-02-16"],
    ["2026-05-22", "2026-06-14"],
    ["2026-09-17", "2026-10-08"],
  ];
  const d = date.toISOString().slice(0, 10);
  return retrogrades.some(([start, end]) => d >= start && d <= end);
}

// ── Dominant cosmic energy ──
function getCosmicWeather(date: Date): { energy: string; description: string } {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const energies = [
    { energy: "Transformative", description: "Pluto's influence invites deep change" },
    { energy: "Expansive", description: "Jupiter opens doors to growth" },
    { energy: "Reflective", description: "Saturn asks for discipline and patience" },
    { energy: "Creative", description: "Venus inspires beauty and connection" },
    { energy: "Dynamic", description: "Mars fuels action and ambition" },
    { energy: "Intuitive", description: "Neptune heightens sensitivity" },
    { energy: "Revolutionary", description: "Uranus sparks unexpected shifts" },
  ];
  return energies[dayOfYear % energies.length];
}

export default function CosmicStatus() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const now = new Date();
  const moon = getMoonPhase(now);
  const retrograde = isMercuryRetrograde(now);
  const weather = getCosmicWeather(now);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "0.6rem 1.5rem",
        flexWrap: "wrap",
        borderBottom: "1px solid rgba(200,185,255,0.04)",
      }}
    >
      {/* Moon phase */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "0.9rem" }}>{moon.emoji}</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 400,
          color: "rgba(200,190,235,0.5)", letterSpacing: "0.06em",
        }}>
          {moon.phase} &middot; {moon.illumination}%
        </span>
      </div>

      {/* Mercury retrograde */}
      {retrograde && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(232,82,74,0.6)" }}>☿</span>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 500,
            color: "rgba(232,82,74,0.5)", letterSpacing: "0.06em",
          }}>
            Retrograde
          </span>
        </div>
      )}

      {/* Cosmic weather */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.75rem", color: "rgba(212,175,55,0.5)" }}>✦</span>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: "0.65rem", fontWeight: 400,
          color: "rgba(180,170,210,0.45)", letterSpacing: "0.06em",
        }}>
          {weather.energy} &middot; {weather.description}
        </span>
      </div>
    </div>
  );
}
