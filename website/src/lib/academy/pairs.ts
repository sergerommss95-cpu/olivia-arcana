/**
 * Card pairs: every pairing written on a card page, gathered so each pair has
 * one page and appears on both cards' pages.
 */

import { allLeaves, leafById, type LeafLocale } from "./leaf";
import { pairFacts } from "@/lib/learn/card-facts";

export interface PairReading {
  /** The card whose page this text was written for. */
  from: number;
  en: string;
  uk: string;
}

export interface CardPair {
  a: number;
  b: number;
  slug: string;
  readings: PairReading[];
}

const slugOf = (id: number) => leafById(id)!.slug;
export const pairSlug = (a: number, b: number) => {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${slugOf(x)}-and-${slugOf(y)}`;
};

const PAIRS: CardPair[] = (() => {
  const byKey = new Map<string, CardPair>();
  for (const leaf of allLeaves()) {
    leaf.en.pairs.forEach((pair, index) => {
      const [a, b] = leaf.id < pair.with ? [leaf.id, pair.with] : [pair.with, leaf.id];
      const key = `${a}-${b}`;
      if (!byKey.has(key)) byKey.set(key, { a, b, slug: pairSlug(a, b), readings: [] });
      byKey.get(key)!.readings.push({ from: leaf.id, en: pair.text, uk: leaf.uk.pairs[index]?.text ?? "" });
    });
  }
  return [...byKey.values()].sort((x, y) => x.a - y.a || x.b - y.b);
})();
const BY_SLUG = new Map(PAIRS.map((pair) => [pair.slug, pair]));

export function allPairs(): readonly CardPair[] {
  return PAIRS;
}

export function pairBySlug(slug: string): CardPair | undefined {
  return BY_SLUG.get(slug);
}

/** Every pair a card belongs to, its own pages' pairs first. */
export function pairsForCard(id: number): CardPair[] {
  return PAIRS.filter((pair) => pair.a === id || pair.b === id).sort((x, y) => {
    const own = (p: CardPair) => (p.readings.some((r) => r.from === id) ? 0 : 1);
    return own(x) - own(y) || x.a - y.a || x.b - y.b;
  });
}

export function pairHref(pair: CardPair, locale: LeafLocale): string {
  return `${locale === "uk" ? "/uk" : ""}/cards/pairs/${pair.slug}/`;
}

/** Structural facts plus the names of shared carved symbols, for the pair page. */
export function describePair(pair: CardPair) {
  const A = leafById(pair.a)!, B = leafById(pair.b)!;
  const facts = pairFacts(pair.a, pair.b, A.symbols.map((s) => s.key), B.symbols.map((s) => s.key));
  const shared = facts.sharedSymbols.map((key) => ({
    key,
    a: A.symbols.find((s) => s.key === key)!,
    b: B.symbols.find((s) => s.key === key)!,
  }));
  return { facts, shared };
}
