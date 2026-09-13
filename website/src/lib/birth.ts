/**
 * The Inscription — the almanac's single question, kept in this
 * browser and never sent. One birthday; everything derived from it is
 * computed client-side from the same astronomy that sets the chart.
 */

import { getAlmanacToday } from "@/lib/almanac-today";

export const BIRTH_KEY = "olivia-birth";

export function getStoredBirth(): string | null {
  try {
    const v = localStorage.getItem(BIRTH_KEY);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function storeBirth(dateStr: string): void {
  try {
    localStorage.setItem(BIRTH_KEY, dateStr);
  } catch {
    /* incognito; the almanac simply won't remember */
  }
}

export interface BirthInfo {
  /** 0..11, Aries first — index into the zodiac tables. */
  signIndex: number;
  /** Localized phase name of the moon on the birth night. */
  moonPhaseName: string;
  /** The date, re-parsed (noon local — sign boundaries are day-level). */
  date: Date;
}

export function birthInfo(dateStr: string, locale: string): BirthInfo | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  if (Number.isNaN(date.getTime()) || Number(m[1]) < 1900 || Number(m[1]) > 2035) return null;
  const alm = getAlmanacToday(locale, date);
  return {
    signIndex: Math.floor((((alm.sunLongitude % 360) + 360) % 360) / 30),
    moonPhaseName: alm.moonPhaseName,
    date,
  };
}
