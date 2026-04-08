/**
 * user-store.ts — Persistent user birth data across all pages
 *
 * Stores birth data in localStorage so users only enter it once.
 * Every page can read the stored chart without re-entering data.
 * Also stores the computed natal chart for instant access.
 */

import { computeNatalChart, type NatalChart, type BirthInput } from "./natal-chart";

const STORAGE_KEY = "olivia-arcana-user";

export interface StoredUser {
  name?: string;
  input: BirthInput;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  bigThree: string;
  savedAt: number; // timestamp
}

/** Save user birth data + basic chart info to localStorage */
export function saveUser(input: BirthInput, chart: NatalChart): void {
  const data: StoredUser = {
    name: input.name,
    input,
    sunSign: chart.sunSign,
    moonSign: chart.moonSign,
    risingSign: chart.risingSign,
    bigThree: chart.bigThree,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/** Load stored user data (null if none) */
export function loadUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

/** Load and recompute the full natal chart from stored data */
export function loadChart(): NatalChart | null {
  const user = loadUser();
  if (!user) return null;
  try {
    return computeNatalChart(user.input);
  } catch {
    return null;
  }
}

/** Clear stored user data */
export function clearUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Check if user has saved data */
export function hasUser(): boolean {
  return loadUser() !== null;
}
