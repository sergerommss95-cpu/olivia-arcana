// website/src/lib/portrait/saved.js
/**
 * Portraits the reader chose to keep, in this browser only. A saved portrait
 * holds the derived packet, the written stages and the cited teachings, never
 * the name, date, time or place. Every storage access is guarded: a blocked
 * or full storage yields [] / null and never throws.
 * Plain JS with JSDoc for the node test runner.
 */

export const KEY = "olivia:portraits:v1";
export const MAX = 20;

/**
 * @typedef {{ getItem(k: string): string | null, setItem(k: string, v: string): void, removeItem(k: string): void }} Storage
 * @typedef {{ storage?: Storage, now?: () => number }} Opts
 * @typedef {{ id: string, locale: "en" | "uk", packet: unknown, stages: any, teachings: unknown, savedAt: number }} Saved
 * @typedef {{ id: string, savedAt: number, locale: "en" | "uk", title: string }} Summary
 */

const isEntry = (e) => Boolean(e) && typeof e === "object" && typeof e.id === "string";

/**
 * The stored list, newest first. Missing or unparsable → []; storage that
 * throws on read → null, so a save never overwrites a list it could not read.
 * @param {Storage} storage
 * @returns {Saved[] | null}
 */
function read(storage) {
  let raw;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return null;
  }
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(isEntry).sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

/** @param {Saved} e @returns {Summary} */
const summary = (e) => ({ id: e.id, savedAt: e.savedAt, locale: e.locale, title: e.stages?.a?.title ?? "" });

/** @param {Opts} [opts] @returns {Summary[]} */
export function listSaved({ storage = globalThis.localStorage } = {}) {
  return (read(storage) ?? []).map(summary);
}

/** @param {string} id @param {Opts} [opts] @returns {Saved | null} */
export function loadSaved(id, { storage = globalThis.localStorage } = {}) {
  return read(storage)?.find((e) => e.id === id) ?? null;
}

/**
 * Keeps only the derived reading; any other field on `reading` is dropped.
 * The same id replaces its earlier save; past MAX the oldest go.
 * @param {{ id: string, locale: "en" | "uk", packet: unknown, stages: any, teachings: unknown }} reading
 * @param {Opts} [opts]
 * @returns {Summary | null}
 */
export function savePortrait({ id, locale, packet, stages, teachings }, { storage = globalThis.localStorage, now = Date.now } = {}) {
  const list = read(storage);
  if (!list) return null;
  /** @type {Saved} */
  const entry = { id, locale, packet, stages, teachings, savedAt: now() };
  try {
    storage.setItem(KEY, JSON.stringify([entry, ...list.filter((e) => e.id !== id)].slice(0, MAX)));
    return summary(entry);
  } catch {
    return null;
  }
}

/** @param {string} id @param {Opts} [opts] */
export function forgetSaved(id, { storage = globalThis.localStorage } = {}) {
  const list = read(storage);
  if (!list) return;
  const rest = list.filter((e) => e.id !== id);
  try {
    if (rest.length) storage.setItem(KEY, JSON.stringify(rest));
    else storage.removeItem(KEY);
  } catch {
    // Blocked storage: nothing to forget.
  }
}
