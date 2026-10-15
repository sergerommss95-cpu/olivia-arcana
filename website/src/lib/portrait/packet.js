// website/src/lib/portrait/packet.js
/**
 * The only thing a portrait sends to the server: calculated factors, never the
 * birth details they came from. No name, date, time, place, coordinates,
 * letters or degrees. The server validates the same shape before use.
 */

import { ASPECTS, SIGNS } from "../astrology/constants.js";
import { POSITIONS } from "./arkan.js";
import { NUMBER_ROLES } from "./numbers.js";

export { SIGNS };
export const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
export const ASPECT_KEYS = ASPECTS.map((a) => a.key);
const ASPECT_POINTS = [...PLANETS, "ascendant", "midheaven"];
const MAX_ASPECTS = 12;
const MAX_BYTES = 8000;
const MAX_LABEL = 40;
const PERSONAL_BODIES = ["sun", "moon", "mercury", "venus", "mars"];
const MASTERS = [11, 22, 33];
/** Without a birth time these points are too uncertain to appear in an aspect. */
const UNTIMED_HIDDEN = ["moon", "asc", "mc"];
const TOP_KEYS = ["v", "locale", "timeKnown", "factors"];

/**
 * @param {{ locale: "en" | "uk", chart: any, arkan: ReturnType<typeof import("./arkan.js").arkanPortrait>,
 *   numbers: ReturnType<typeof import("./numbers.js").nameNumbers>, daySigns: Record<string, string[]> | null }} input
 */
export function buildPacket({ locale, chart, arkan, numbers, daySigns }) {
  const timeKnown = chart.moment.timeKnown;
  const factors = [];
  for (const p of arkan.positions) factors.push({ id: `arkan-${p.position}`, kind: "arkan", position: p.position, card: p.card });
  for (const role of NUMBER_ROLES) {
    const n = numbers[role];
    if (n) factors.push({ id: `num-${role}`, kind: "number", role, value: n.number, master: n.master });
  }
  for (const body of chart.bodies) {
    if (!PLANETS.includes(body.key)) continue;
    const signs = !timeKnown && daySigns?.[body.key];
    factors.push({
      id: `natal-${body.key}`, kind: "planet", body: body.key, sign: body.sign,
      house: timeKnown ? body.house ?? null : null,
      retrograde: Boolean(body.retrograde),
      alternatives: signs && signs.length > 1 ? [...signs] : null,
    });
  }
  if (timeKnown && chart.ascendant) {
    factors.push({ id: "natal-asc", kind: "angle", angle: "asc", sign: chart.ascendant.sign });
    factors.push({ id: "natal-mc", kind: "angle", angle: "mc", sign: chart.midheaven.sign });
  }
  const short = (key) => (key === "ascendant" ? "asc" : key === "midheaven" ? "mc" : key);
  for (const found of chart.aspects.filter((x) => ASPECT_POINTS.includes(x.a) && ASPECT_POINTS.includes(x.b)).slice(0, MAX_ASPECTS)) {
    const a = short(found.a), b = short(found.b);
    factors.push({ id: `aspect-${a}-${found.aspect}-${b}`, kind: "aspect", a, b, aspect: found.aspect });
  }
  return { v: 1, locale, timeKnown, factors };
}

const isObject = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const sameKeys = (obj, keys) => Object.keys(obj).length === keys.length && keys.every((k) => Object.hasOwn(obj, k));
const label = (f) => (typeof f?.id === "string" ? f.id.slice(0, MAX_LABEL) : "?");
const copy = (v) => (Array.isArray(v) ? [...v] : v);
const pick = (source, keys) => Object.fromEntries(keys.map((k) => [k, copy(source[k])]));

const isSign = (s) => SIGNS.includes(s);
const POINT_IDS = [...PLANETS, "asc", "mc"];
const CHECK = {
  arkan: (f) => POSITIONS.includes(f.position) && Number.isInteger(f.card) && f.card >= 0 && f.card <= 21 && f.id === `arkan-${f.position}`,
  number: (f) => NUMBER_ROLES.includes(f.role) && Number.isInteger(f.value) && ((f.value >= 1 && f.value <= 9) || MASTERS.includes(f.value)) && f.master === MASTERS.includes(f.value) && f.id === `num-${f.role}`,
  planet: (f) => PLANETS.includes(f.body) && isSign(f.sign) && (f.house === null || (Number.isInteger(f.house) && f.house >= 1 && f.house <= 12)) && typeof f.retrograde === "boolean"
    && (f.alternatives === null || (PERSONAL_BODIES.includes(f.body) && Array.isArray(f.alternatives) && f.alternatives.length >= 2 && f.alternatives.length <= 3
      && f.alternatives.every(isSign) && new Set(f.alternatives).size === f.alternatives.length && f.alternatives.includes(f.sign))) && f.id === `natal-${f.body}`,
  angle: (f) => (f.angle === "asc" || f.angle === "mc") && isSign(f.sign) && f.id === `natal-${f.angle}`,
  aspect: (f) => POINT_IDS.includes(f.a) && POINT_IDS.includes(f.b) && f.a !== f.b && ASPECT_KEYS.includes(f.aspect) && f.id === `aspect-${f.a}-${f.aspect}-${f.b}`,
};
const KEYS = {
  arkan: ["id", "kind", "position", "card"],
  number: ["id", "kind", "role", "value", "master"],
  planet: ["id", "kind", "body", "sign", "house", "retrograde", "alternatives"],
  angle: ["id", "kind", "angle", "sign"],
  aspect: ["id", "kind", "a", "b", "aspect"],
};

/**
 * Server-side gate for untrusted JSON. Never throws; returns a fresh packet
 * built from the validated fields only.
 * @param {unknown} value
 */
export function validatePacket(value) {
  const fail = (error) => ({ ok: false, error });
  if (!isObject(value)) return fail("not_object");
  const packet = /** @type {any} */ (value);
  if (!sameKeys(packet, TOP_KEYS)) return fail("top_keys");
  let size;
  try {
    size = JSON.stringify(packet).length;
  } catch {
    return fail("not_serialisable");
  }
  if (size > MAX_BYTES) return fail("too_large");
  if (packet.v !== 1 || !["en", "uk"].includes(packet.locale) || typeof packet.timeKnown !== "boolean" || !Array.isArray(packet.factors)) return fail("shape");
  const ids = new Set();
  for (const f of packet.factors) {
    if (!isObject(f) || typeof f.kind !== "string" || !Object.hasOwn(CHECK, f.kind)) return fail(`kind:${label(f)}`);
    if (!CHECK[f.kind](f)) return fail(`factor:${label(f)}`);
    if (!sameKeys(f, KEYS[f.kind])) return fail(`keys:${label(f)}`);
    if (ids.has(f.id)) return fail(`duplicate:${label(f)}`);
    ids.add(f.id);
  }
  if (packet.factors.filter((f) => f.kind === "aspect").length > MAX_ASPECTS) return fail("too_many_aspects");
  if (!POSITIONS.every((p) => ids.has(`arkan-${p}`))) return fail("arkan_incomplete");
  if (!PERSONAL_BODIES.every((b) => ids.has(`natal-${b}`))) return fail("natal_incomplete");
  if (!ids.has("num-lifePath")) return fail("numbers_incomplete");
  if (packet.timeKnown) {
    if (!(ids.has("natal-asc") && ids.has("natal-mc"))) return fail("angles_missing");
    if (packet.factors.some((f) => f.kind === "planet" && f.alternatives !== null)) return fail("alternatives_with_time");
  } else {
    if (packet.factors.some((f) => f.kind === "angle")) return fail("angles_without_time");
    if (packet.factors.some((f) => f.kind === "planet" && f.house !== null)) return fail("house_without_time");
    if (packet.factors.some((f) => f.kind === "aspect" && (UNTIMED_HIDDEN.includes(f.a) || UNTIMED_HIDDEN.includes(f.b)))) return fail("aspect_without_time");
  }
  return {
    ok: true,
    packet: { v: 1, locale: packet.locale, timeKnown: packet.timeKnown, factors: packet.factors.map((f) => pick(f, KEYS[f.kind])) },
  };
}
