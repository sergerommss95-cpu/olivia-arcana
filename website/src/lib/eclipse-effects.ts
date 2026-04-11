/**
 * eclipse-effects.ts — Detect special astronomical dates and return visual effect configuration
 *
 * Checks today's date against eclipses, full/new moons, Mercury retrograde periods,
 * solstices, and equinoxes. Returns effect config consumed by EclipseOverlay.
 */

import { EVENTS_2026, type AstroEvent } from "./astro-events";
import { getMoonPhase } from "./celestial";

// ── Effect types ──

export type EventEffect =
  | { type: "eclipse_solar"; description: string }
  | { type: "eclipse_lunar"; description: string }
  | { type: "full_moon"; description: string }
  | { type: "new_moon"; description: string }
  | { type: "mercury_retrograde"; description: string }
  | { type: "solstice"; season: "winter" | "summer"; description: string }
  | { type: "equinox"; season: "spring" | "fall"; description: string }
  | null;

// ── Mercury retrograde windows for 2026 ──

const MERCURY_RETROGRADE_2026: Array<{ start: string; end: string; description: string }> = [
  {
    start: "2026-02-26",
    end: "2026-03-20",
    description: "Mercury is in retrograde. Communications may twist. Read between the lines.",
  },
  {
    start: "2026-06-27",
    end: "2026-07-21",
    description: "Mercury retrograde returns. Technology falters. Patience is your shield.",
  },
  {
    start: "2026-10-21",
    end: "2026-11-10",
    description: "The final Mercury retrograde of the year. Review, revise, release.",
  },
];

// ── Solstice / Equinox exact dates ──

const SOLSTICE_EQUINOX: Array<{
  date: string;
  type: "solstice" | "equinox";
  season: "winter" | "summer" | "spring" | "fall";
  description: string;
}> = [
  { date: "2026-03-20", type: "equinox", season: "spring", description: "The vernal equinox. Day and night stand in perfect balance. New cycles awaken." },
  { date: "2026-06-21", type: "solstice", season: "summer", description: "The summer solstice. Light reaches its zenith. The longest day illuminates all." },
  { date: "2026-09-22", type: "equinox", season: "fall", description: "The autumnal equinox. Balance returns as the wheel turns toward shadow." },
  { date: "2026-12-21", type: "solstice", season: "winter", description: "The winter solstice. The longest night yields to returning light. Rebirth begins in darkness." },
];

/**
 * Check today's date and return the active visual effect (if any).
 * Priority: Eclipse > Solstice/Equinox > Mercury Retrograde > Full Moon > New Moon
 */
export function getActiveEffect(now?: Date): EventEffect {
  const date = now ?? new Date();
  const today = date.toISOString().slice(0, 10);

  // 1. Check eclipses from EVENTS_2026 (exact date match, +/- 1 day buffer)
  const eclipseEvents = EVENTS_2026.filter(
    (e) => e.type === "eclipse_solar" || e.type === "eclipse_lunar"
  );
  for (const event of eclipseEvents) {
    if (isWithinDays(today, event.date, 1)) {
      if (event.type === "eclipse_solar") {
        return { type: "eclipse_solar", description: event.title };
      }
      return { type: "eclipse_lunar", description: event.title };
    }
  }

  // 2. Check solstices and equinoxes (exact date)
  for (const se of SOLSTICE_EQUINOX) {
    if (today === se.date) {
      if (se.type === "solstice") {
        return { type: "solstice", season: se.season as "winter" | "summer", description: se.description };
      }
      return { type: "equinox", season: se.season as "spring" | "fall", description: se.description };
    }
  }

  // 3. Check Mercury retrograde windows
  for (const retro of MERCURY_RETROGRADE_2026) {
    if (today >= retro.start && today <= retro.end) {
      return { type: "mercury_retrograde", description: retro.description };
    }
  }

  // 4. Check moon phase via calculation
  const moon = getMoonPhase(date);
  if (moon.illumination >= 98) {
    return { type: "full_moon", description: `Full Moon — ${moon.illumination}% illumination. The veil is thin.` };
  }
  if (moon.illumination <= 2) {
    return { type: "new_moon", description: `New Moon — darkness invites intention. Plant seeds in the void.` };
  }

  return null;
}

/** Check if dateA is within N days of dateB */
function isWithinDays(dateA: string, dateB: string, days: number): boolean {
  const a = new Date(dateA + "T00:00:00Z").getTime();
  const b = new Date(dateB + "T00:00:00Z").getTime();
  return Math.abs(a - b) <= days * 86400000;
}
