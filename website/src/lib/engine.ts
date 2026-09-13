/**
 * engine.ts — client for olivia-engine, the press's own computer.
 *
 * The engine is the precision tier: true ephemeris positions, the
 * ascendant and midheaven, house cusps, retrogrades. The site never
 * DEPENDS on it — every page keeps its client-side approximation —
 * but when the engine answers, the figures are "set by the press."
 *
 * NEXT_PUBLIC_ENGINE_URL unset → this module is quietly disabled.
 */

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "";

export interface EngineBody {
  longitude: number;
  sign: string;
  house: number;
  retrograde: boolean;
  degree_in_sign?: number;
  speed?: number;
}

export interface EngineChart {
  asc: number | null;
  mc: number | null;
  house_cusps: number[] | null;
  day_chart: boolean;
  bodies: Record<string, EngineBody>;
}

export function engineEnabled(): boolean {
  return Boolean(ENGINE_URL);
}

/** ±HH:MM offset string from an hours-east-of-UTC number (5.5 → +05:30). */
function offsetStr(tzHours: number): string {
  const sign = tzHours < 0 ? "-" : "+";
  const abs = Math.abs(tzHours);
  const hh = String(Math.floor(abs)).padStart(2, "0");
  const mm = String(Math.round((abs % 1) * 60)).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

/**
 * The natal chart as the press computes it. Null on any failure —
 * disabled, unreachable, slow (3.5s budget), or a bad response; the
 * caller falls back to its provisional client figures.
 */
export async function engineChart(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone: number;
}): Promise<EngineChart | null> {
  if (!ENGINE_URL) return null;
  const when =
    `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}` +
    `T${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}:00` +
    offsetStr(input.timezone);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`${ENGINE_URL}/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        when,
        lat: input.latitude,
        lon: input.longitude,
        house_system: "whole_sign",
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d || typeof d !== "object" || !d.bodies) return null;
    return {
      asc: typeof d.asc === "number" ? d.asc : null,
      mc: typeof d.mc === "number" ? d.mc : null,
      house_cusps: Array.isArray(d.house_cusps) ? d.house_cusps : null,
      day_chart: Boolean(d.day_chart),
      bodies: d.bodies as Record<string, EngineBody>,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** "17° Leo" from an ecliptic longitude. */
export function fmtLongitude(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  return `${Math.floor(norm % 30)}° ${SIGNS[Math.floor(norm / 30)]}`;
}
