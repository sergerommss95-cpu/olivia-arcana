/**
 * The forward ephemerides — honest, day-level only. The approximate
 * astronomy in almanac-today is good to the day for lunations and
 * ingresses; we never print an hour we cannot stand behind.
 */

import { getAlmanacToday } from "@/lib/almanac-today";

export interface AheadEntry {
  /** Days from today (1-based). */
  inDays: number;
  date: Date;
}

function fracAt(base: Date, plusDays: number, locale: string): number {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + plusDays, 12);
  return getAlmanacToday(locale, d).moonFraction;
}

function signAt(base: Date, plusDays: number, locale: string): number {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + plusDays, 12);
  return Math.floor((((getAlmanacToday(locale, d).sunLongitude % 360) + 360) % 360) / 30);
}

/** Next local maximum of the lit fraction — the full moon's day. */
export function nextFullMoon(now: Date, locale: string): AheadEntry | null {
  for (let d = 1; d <= 32; d++) {
    const a = fracAt(now, d - 1, locale);
    const b = fracAt(now, d, locale);
    const c = fracAt(now, d + 1, locale);
    if (b >= a && b > c && b > 0.9) {
      return { inDays: d, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12) };
    }
  }
  return null;
}

/** Next local minimum — the new moon's day. */
export function nextNewMoon(now: Date, locale: string): AheadEntry | null {
  for (let d = 1; d <= 32; d++) {
    const a = fracAt(now, d - 1, locale);
    const b = fracAt(now, d, locale);
    const c = fracAt(now, d + 1, locale);
    if (b <= a && b < c && b < 0.1) {
      return { inDays: d, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12) };
    }
  }
  return null;
}

/** The sun's next sign ingress (day it first stands in the new sign). */
export function nextIngress(now: Date, locale: string): (AheadEntry & { signIndex: number }) | null {
  const s0 = signAt(now, 0, locale);
  for (let d = 1; d <= 35; d++) {
    const s = signAt(now, d, locale);
    if (s !== s0) {
      return { inDays: d, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12), signIndex: s };
    }
  }
  return null;
}

/** The reader's next solar return, from a stored YYYY-MM-DD birth. */
export function solarReturn(now: Date, birth: string): AheadEntry | null {
  const m = birth.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const mo = Number(m[1]) - 1;
  const da = Number(m[2]);
  let d = new Date(now.getFullYear(), mo, da, 12);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (d.getTime() <= today.getTime()) d = new Date(now.getFullYear() + 1, mo, da, 12);
  const inDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  return { inDays, date: d };
}

/* ── Cutting the page ─────────────────────────────────────────── */

const CUT_KEY = "olivia-cut";

/** Last cut leaf as {year, editionNo}, or null. */
export function getLastCut(): { year: number; no: number } | null {
  try {
    const v = localStorage.getItem(CUT_KEY);
    const m = v?.match(/^(\d{4}):(\d{1,3})$/);
    return m ? { year: Number(m[1]), no: Number(m[2]) } : null;
  } catch {
    return null;
  }
}

export function cutToday(year: number, editionNo: number): void {
  try {
    localStorage.setItem(CUT_KEY, `${year}:${editionNo}`);
  } catch {
    /* incognito — the knife leaves no mark */
  }
}
