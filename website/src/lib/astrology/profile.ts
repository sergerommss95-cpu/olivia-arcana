/**
 * The reader's birth details, kept only in this browser.
 * One versioned key; the older chart pages' key is read once as a fallback.
 */

import type { Place } from "./places";

export type BirthProfile = {
  v: 1;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM, or null when unknown
  place: Place;
};

const KEY = "olivia:birth-profile";
const LEGACY_KEY = "olivia-arcana-user";

export function loadProfile(): BirthProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const profile = JSON.parse(raw);
      if (profile?.v === 1 && profile.date && profile.place?.zone) return profile;
    }
  } catch { /* storage blocked or malformed: start empty */ }
  return null;
}

export function saveProfile(profile: BirthProfile): void {
  // Search spellings belong to the list, not to the reader's details.
  const place = { ...profile.place };
  delete place.aliases;
  try { localStorage.setItem(KEY, JSON.stringify({ ...profile, place })); } catch { /* private mode */ }
}

export function forgetProfile(): void {
  try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ }
}

/**
 * Birth details saved by the older /chart and /portrait pages, if any.
 * They stored a fixed UTC offset rather than a zone, so the place is
 * looked up by name first and otherwise pinned to that fixed offset.
 */
export function legacyBirth(): { date: string; time: string | null; city: string | null; latitude: number; longitude: number; offsetHours: number } | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const input = raw ? JSON.parse(raw)?.input : null;
    if (!input || !Number.isFinite(input.year) || !Number.isFinite(input.latitude)) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      date: `${String(input.year).padStart(4, "0")}-${pad(input.month)}-${pad(input.day)}`,
      time: input.timeKnown === false ? null : `${pad(input.hour)}:${pad(input.minute)}`,
      city: typeof input.city === "string" ? input.city : null,
      latitude: input.latitude,
      longitude: input.longitude,
      offsetHours: Number(input.timezone) || 0,
    };
  } catch {
    return null;
  }
}
