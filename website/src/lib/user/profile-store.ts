/**
 * profile-store.ts — lightweight client-only profile persistence
 *
 * We intentionally avoid pulling in Zustand or Jotai for this.  The amount
 * of persistent state we need (birthday, sun sign, streak) is small and
 * we already ship our own event bus via `window.dispatchEvent`.  A custom
 * `useSyncExternalStore` hook here keeps the bundle light and matches
 * the pattern established in useLocale.
 *
 * localStorage keys:
 *   olivia:profile  — { month, day, signSlug, signName, signGlyph, createdAt }
 *   olivia:streak   — { count, lastVisitISO, recordCount }
 *
 * Events:
 *   olivia:profile-change  — dispatched after profile update/clear
 *   olivia:streak-change   — dispatched after streak tick
 */

"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  month: number; // 1-12
  day: number; // 1-31
  signSlug: string; // e.g. "aries"
  signName: string; // e.g. "Aries"
  signGlyph: string; // e.g. "♈"
  createdAt: string; // ISO string
}

export interface Streak {
  count: number;
  lastVisitISO: string;
  recordCount: number;
}

// ── localStorage helpers ──────────────────────────────────────────────────

const PROFILE_KEY = "olivia:profile";
const STREAK_KEY = "olivia:streak";
const PROFILE_EVENT = "olivia:profile-change";
const STREAK_EVENT = "olivia:streak-change";

// ── Cached JSON reader ──────────────────────────────────────────────────
// useSyncExternalStore calls getSnapshot on every render. If we returned a
// freshly-parsed object each time, React would bail with "getSnapshot
// should be cached" and loop.  We keep one cached (raw, value) pair per
// key. Only when the raw localStorage string changes do we parse again
// and hand out a new reference.

// Module-scoped caches — one per key. Re-parse only when the raw string
// changes (this is what makes useSyncExternalStore stable).
let profileRaw: string | null | undefined = undefined; // undefined = not yet read
let profileValue: UserProfile | null = null;
let streakRaw: string | null | undefined = undefined;
let streakValue: Streak | null = null;

function readProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try { raw = localStorage.getItem(PROFILE_KEY); } catch { return null; }
  if (raw === profileRaw) return profileValue;
  profileRaw = raw;
  profileValue = null;
  if (raw !== null) {
    try { profileValue = JSON.parse(raw) as UserProfile; } catch { profileValue = null; }
  }
  return profileValue;
}
function readStreak(): Streak | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try { raw = localStorage.getItem(STREAK_KEY); } catch { return null; }
  if (raw === streakRaw) return streakValue;
  streakRaw = raw;
  streakValue = null;
  if (raw !== null) {
    try { streakValue = JSON.parse(raw) as Streak; } catch { streakValue = null; }
  }
  return streakValue;
}
function invalidateProfileCache() { profileRaw = undefined; profileValue = null; }
function invalidateStreakCache() { streakRaw = undefined; streakValue = null; }

function writeProfile(value: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) localStorage.removeItem(PROFILE_KEY);
    else localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
    invalidateProfileCache();
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: value }));
  } catch {}
}
function writeStreak(value: Streak | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value === null) localStorage.removeItem(STREAK_KEY);
    else localStorage.setItem(STREAK_KEY, JSON.stringify(value));
    invalidateStreakCache();
    window.dispatchEvent(new CustomEvent(STREAK_EVENT, { detail: value }));
  } catch {}
}

// ── Profile ───────────────────────────────────────────────────────────────

const SIGN_BOUNDARIES: [number, number, string, string][] = [
  // [month, day, slug, glyph] — boundary date (inclusive from). Last sign wraps.
  [3, 21, "aries", "\u2648"],
  [4, 20, "taurus", "\u2649"],
  [5, 21, "gemini", "\u264A"],
  [6, 21, "cancer", "\u264B"],
  [7, 23, "leo", "\u264C"],
  [8, 23, "virgo", "\u264D"],
  [9, 23, "libra", "\u264E"],
  [10, 23, "scorpio", "\u264F"],
  [11, 22, "sagittarius", "\u2650"],
  [12, 22, "capricorn", "\u2651"],
  [1, 20, "aquarius", "\u2652"],
  [2, 19, "pisces", "\u2653"],
];
const SIGN_NAMES: Record<string, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

/** Resolve (month, day) → { slug, name, glyph }. */
export function resolveSunSign(month: number, day: number): { slug: string; name: string; glyph: string } {
  // Iterate; find the most recent boundary that the date has passed.
  const key = month * 100 + day;
  // Bounds table sorted by boundary day key
  const sortedBoundaries = [...SIGN_BOUNDARIES].sort((a, b) => a[0] * 100 + a[1] - (b[0] * 100 + b[1]));
  let current = SIGN_BOUNDARIES[SIGN_BOUNDARIES.length - 1]; // pisces wraps by default
  for (const b of sortedBoundaries) {
    const bk = b[0] * 100 + b[1];
    if (key >= bk) current = b;
  }
  return { slug: current[2], name: SIGN_NAMES[current[2]] || current[2], glyph: current[3] };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Sync once on mount (reads localStorage), then subscribe to changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mirror of localStorage
    setProfile(readProfile());
    const onChange = () => {
      invalidateProfileCache();
      setProfile(readProfile());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY) onChange();
    };
    window.addEventListener(PROFILE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROFILE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const saveFromBirthday = useCallback((month: number, day: number) => {
    const { slug, name, glyph } = resolveSunSign(month, day);
    const next: UserProfile = {
      month,
      day,
      signSlug: slug,
      signName: name,
      signGlyph: glyph,
      createdAt: new Date().toISOString(),
    };
    writeProfile(next);
    return next;
  }, []);

  const clear = useCallback(() => {
    writeProfile(null);
  }, []);

  return { profile, saveFromBirthday, clear };
}

// ── Streak ────────────────────────────────────────────────────────────────

function localISODate(d = new Date()): string {
  // YYYY-MM-DD in the local timezone — avoids UTC edge cases on streak math.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Compute yesterday/today relationship between two ISO local-date strings. */
function daysBetween(prev: string, curr: string): number {
  const [py, pm, pd] = prev.split("-").map(Number);
  const [cy, cm, cd] = curr.split("-").map(Number);
  const a = Date.UTC(py, pm - 1, pd);
  const b = Date.UTC(cy, cm - 1, cd);
  return Math.round((b - a) / 86400000);
}

export function useStreak() {
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mirror of localStorage
    setStreak(readStreak());
    const onChange = () => {
      invalidateStreakCache();
      setStreak(readStreak());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STREAK_KEY) onChange();
    };
    window.addEventListener(STREAK_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STREAK_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /** Called on /daily visit. Advances or resets the streak. */
  const tick = useCallback(() => {
    const today = localISODate();
    const prev = readStreak();
    if (!prev) {
      const next: Streak = { count: 1, lastVisitISO: today, recordCount: 1 };
      writeStreak(next);
      return next;
    }
    const delta = daysBetween(prev.lastVisitISO, today);
    if (delta === 0) return prev; // already visited today — no change
    const nextCount = delta === 1 ? prev.count + 1 : 1;
    const next: Streak = {
      count: nextCount,
      lastVisitISO: today,
      recordCount: Math.max(prev.recordCount, nextCount),
    };
    writeStreak(next);
    return next;
  }, []);

  return { streak, tick };
}
