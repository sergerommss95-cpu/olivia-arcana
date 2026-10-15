// website/src/lib/portrait/packet.js
/**
 * The only thing a portrait sends to the server: calculated factors, never the
 * birth details they came from. No name, date, time, place, coordinates,
 * letters or degrees. The server validates the same shape before use.
 */

import { SIGNS } from "../astrology/chart.js";
import { POSITIONS } from "./arkan.js";
import { NUMBER_ROLES } from "./numbers.js";

export { SIGNS };
export const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
export const ASPECT_KEYS = ["conjunction", "sextile", "square", "trine", "opposition"];
const ASPECT_POINTS = [...PLANETS, "ascendant", "midheaven"];
const MAX_ASPECTS = 12;
const MAX_BYTES = 8000;

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

const isSign = (s) => SIGNS.includes(s);
const POINT_IDS = [...PLANETS, "asc", "mc"];
const CHECK = {
  arkan: (f) => POSITIONS.includes(f.position) && Number.isInteger(f.card) && f.card >= 0 && f.card <= 21 && f.id === `arkan-${f.position}`,
  number: (f) => NUMBER_ROLES.includes(f.role) && Number.isInteger(f.value) && ((f.value >= 1 && f.value <= 9) || [11, 22, 33].includes(f.value)) && typeof f.master === "boolean" && f.id === `num-${f.role}`,
  planet: (f) => PLANETS.includes(f.body) && isSign(f.sign) && (f.house === null || (Number.isInteger(f.house) && f.house >= 1 && f.house <= 12)) && typeof f.retrograde === "boolean"
    && (f.alternatives === null || (Array.isArray(f.alternatives) && f.alternatives.length >= 2 && f.alternatives.length <= 3 && f.alternatives.every(isSign))) && f.id === `natal-${f.body}`,
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

/** @param {unknown} value */
export function validatePacket(value) {
  const fail = (error) => ({ ok: false, error });
  if (!value || typeof value !== "object") return fail("not_object");
  const packet = /** @type {any} */ (value);
  if (JSON.stringify(packet).length > MAX_BYTES) return fail("too_large");
  if (packet.v !== 1 || !["en", "uk"].includes(packet.locale) || typeof packet.timeKnown !== "boolean" || !Array.isArray(packet.factors)) return fail("shape");
  const ids = new Set();
  for (const f of packet.factors) {
    if (!f || !CHECK[f.kind] || !CHECK[f.kind](f)) return fail(`factor:${f?.id ?? "?"}`);
    if (Object.keys(f).sort().join() !== [...KEYS[f.kind]].sort().join()) return fail(`keys:${f.id}`);
    if (ids.has(f.id)) return fail(`duplicate:${f.id}`);
    ids.add(f.id);
  }
  if (!POSITIONS.every((p) => ids.has(`arkan-${p}`))) return fail("arkan_incomplete");
  if (!["sun", "moon", "mercury", "venus", "mars"].every((b) => ids.has(`natal-${b}`))) return fail("natal_incomplete");
  if (!ids.has("num-lifePath")) return fail("numbers_incomplete");
  if (packet.timeKnown !== ids.has("natal-asc")) return fail("angles_mismatch");
  return { ok: true, packet };
}
