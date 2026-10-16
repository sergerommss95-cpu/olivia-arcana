// website/src/lib/portrait/digest.js
/**
 * The short way into a portrait: the cards it returns to most, one card per
 * facet, first sentences, a pull quote per chapter and the reading time.
 * Plain JS with JSDoc so the node test runner can import it directly.
 */

import { READING_ORDER } from "./lattice.js";

/**
 * @typedef {{ text: string, refs: string[], teachings: string[] }} Passage
 * @typedef {Passage & { heading: string }} Facet
 * @typedef {{ title: string, lede: string, paragraphs: string[], practice: string, refs: string[], teachings: string[] }} Chapter
 * @typedef {{ title: string, epigraph: string, overview: Passage, facets: Record<FacetKey, Facet> }} StageA
 * @typedef {"temperament" | "inner" | "gifts" | "bonds" | "direction"} FacetKey
 * @typedef {{ factors: { id: string, kind: string, position?: number, card?: number }[] }} Packet
 */

/** @type {FacetKey[]} */
const FACETS = ["temperament", "inner", "gifts", "bonds", "direction"];
const CHAPTERS = ["mind", "heart", "work", "shadow", "love", "becoming"];
const WORDS_PER_MINUTE = 220;
/** Sentence openers a pull quote may not lean on. */
const CONJUNCTIONS = new Set(["And", "But", "So", "І", "А", "Але", "Тож"]);

const rank = (pos) => READING_ORDER.indexOf(pos);

/** @param {Packet} packet @returns {Map<number, number>} position → card */
function cardsByPosition(packet) {
  return new Map((packet?.factors ?? []).filter((f) => f.kind === "arkan").map((f) => [f.position, f.card]));
}

/**
 * The Arkan positions a passage cites, in the order it cites them, once each.
 * Refs to positions the packet does not hold are ignored.
 * @param {string[] | undefined} refs
 * @param {Map<number, number>} cardAt
 */
function citedPositions(refs, cardAt) {
  /** @type {number[]} */
  const out = [];
  for (const ref of refs ?? []) {
    const m = /^arkan-(\d+)$/.exec(ref);
    const pos = m ? Number(m[1]) : NaN;
    if (cardAt.has(pos) && !out.includes(pos)) out.push(pos);
  }
  return out;
}

/**
 * The cards the opening and the five facets return to most. Chapters are left
 * out so the answer holds from the moment stage A lands.
 * @param {StageA} stageA
 * @param {Packet} packet
 * @param {number} [n]
 * @returns {{ card: number, positions: number[], count: number }[]}
 */
export function definingCards(stageA, packet, n = 4) {
  const cardAt = cardsByPosition(packet);
  const opening = new Set(citedPositions(stageA?.overview?.refs, cardAt).map((pos) => cardAt.get(pos)));
  /** @type {Map<number, { card: number, positions: number[], count: number }>} */
  const tally = new Map();
  for (const passage of [stageA?.overview, ...FACETS.map((k) => stageA?.facets?.[k])]) {
    for (const pos of citedPositions(passage?.refs, cardAt)) {
      const card = /** @type {number} */ (cardAt.get(pos));
      const t = tally.get(card) ?? { card, positions: [], count: 0 };
      t.count += 1;
      if (!t.positions.includes(pos)) t.positions.push(pos);
      tally.set(card, t);
    }
  }
  const all = [...tally.values()].map((t) => ({ ...t, positions: t.positions.sort((x, y) => rank(x) - rank(y)) }));
  const first = (t) => rank(t.positions[0]);
  all.sort((x, y) => y.count - x.count || Number(opening.has(y.card)) - Number(opening.has(x.card)) || first(x) - first(y));
  return all.slice(0, n).sort((x, y) => first(x) - first(y));
}

/**
 * One position per facet. Facets citing the fewest cards choose first; each
 * takes its first-cited card no other facet holds yet, else its first-cited.
 * @param {StageA} stageA
 * @param {Packet} packet
 * @returns {Record<FacetKey, number | null>}
 */
export function facetCards(stageA, packet) {
  const cardAt = cardsByPosition(packet);
  const cited = Object.fromEntries(FACETS.map((k) => [k, citedPositions(stageA?.facets?.[k]?.refs, cardAt)]));
  const taken = new Set();
  /** @type {Record<string, number | null>} */
  const picked = {};
  for (const key of [...FACETS].sort((x, y) => cited[x].length - cited[y].length)) {
    const pos = cited[key].find((p) => !taken.has(cardAt.get(p))) ?? cited[key][0] ?? null;
    if (pos !== null) taken.add(cardAt.get(pos));
    picked[key] = pos;
  }
  return /** @type {Record<FacetKey, number | null>} */ (Object.fromEntries(FACETS.map((k) => [k, picked[k]])));
}

/**
 * Sentences, split after . ! ? or …, an optional closing quote, then whitespace.
 * @param {string} text
 */
function sentences(text) {
  return (text ?? "").trim().split(/(?<=[.!?…][»”’"]?)\s+/u).filter(Boolean);
}

/** @param {string} text */
export function firstSentence(text) {
  return sentences(text)[0] ?? "";
}

/**
 * The shortest calm sentence of a chapter (8–20 words, ending in . or !, not
 * opening on a conjunction), never its very first, and the paragraph it is in.
 * @param {Chapter} chapter
 * @returns {{ sentence: string, after: number } | null}
 */
export function pullQuote(chapter) {
  /** @type {{ sentence: string, after: number, words: number } | null} */
  let best = null;
  (chapter?.paragraphs ?? []).forEach((paragraph, after) => {
    sentences(paragraph).forEach((sentence, i) => {
      if (after === 0 && i === 0) return;
      const words = sentence.split(/\s+/);
      if (words.length < 8 || words.length > 20 || !/[.!]$/.test(sentence)) return;
      if (CONJUNCTIONS.has(words[0].replace(/^[«“"‘'(]+|[,;:]+$/g, ""))) return;
      if (!best || words.length < best.words) best = { sentence, after, words: words.length };
    });
  });
  return best && { sentence: best.sentence, after: best.after };
}

/** @param {unknown} text */
const wordCount = (text) => (typeof text === "string" ? text.split(/\s+/).filter(Boolean).length : 0);

/**
 * Minutes to read what has landed so far, at 220 words a minute, at least 1.
 * @param {{ a?: StageA, b?: { chapters: Record<string, Chapter> }, c?: { chapters: Record<string, Chapter>, keep: string[] } }} stages
 */
export function readingMinutes(stages) {
  const a = stages?.a;
  /** @type {unknown[]} */
  const texts = [a?.title, a?.epigraph, a?.overview?.text];
  for (const k of FACETS) texts.push(a?.facets?.[k]?.heading, a?.facets?.[k]?.text);
  for (const k of CHAPTERS) {
    const ch = stages?.b?.chapters?.[k] ?? stages?.c?.chapters?.[k];
    if (ch) texts.push(ch.title, ch.lede, ...(ch.paragraphs ?? []), ch.practice);
  }
  texts.push(...(stages?.c?.keep ?? []));
  const words = texts.reduce((n, t) => n + wordCount(t), 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
