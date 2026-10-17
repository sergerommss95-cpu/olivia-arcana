/**
 * The day's leading event as card art, for the frontispiece plate. It reads the composer's own ranking
 * (COMPOSE.ranked()[0], read-only and free of the text library, so the art can be requested before the
 * 285–513KB library arrives) rather than re-implementing its filters, then checks it against the reading's
 * topSignal once that exists. Cards follow the Golden Dawn planet correspondences (BODY_CARDS).
 */

import COMPOSE from "@/lib/daily/compose.js";
import { BODY_CARDS } from "@/lib/astrology/chart.js";

export type LeadEvent = {
  kind: string;
  /** One or two Major Arcana ids, card A first. */
  cards: number[];
  /** The planet key behind each card, in the same order. */
  roles: string[];
  /** The aspect between a pair ("trine", "opposition"…), when there is one. */
  aspect?: string;
  /** The exact instant, only when it falls inside the leaf's Kyiv day. */
  at?: number;
};

type Day = { dayStart: number; dayEnd: number };
type Signal = {
  kind: string; planet: string; other?: string; phase?: string; at?: number;
  aspect?: { key: string; exactAt?: number }; contact?: { key: string; at: number };
};

const CARDS = BODY_CARDS as Record<string, number>;
/* A lunation is a real Sun–Moon angle, so the chord carries that aspect's glyph. */
const LUNATION_ASPECT: Record<string, string> = { new: "conjunction", full: "opposition", firstQuarter: "square", lastQuarter: "square" };

const single = (kind: string, planet: string): LeadEvent => ({ kind, cards: [CARDS[planet] ?? CARDS.sun], roles: [planet] });

export function leadEvent(days: { today: Day; history: Day[] }, sign: string, top?: { kind: string; planet: string } | null): LeadEvent {
  const ranked = COMPOSE.ranked(days.today, sign, days.history) as Signal[];
  const s = ranked[0];
  if (!s) return single(top?.kind ?? "placement", top?.planet ?? "sun");
  // the composer leads with the same signal; if they ever disagree, trust the reading's planet alone
  if (top && (s.kind !== top.kind || s.planet !== top.planet)) return single(top.kind, top.planet);

  const inDay = (t?: number) => (t != null && t >= days.today.dayStart && t <= days.today.dayEnd ? t : undefined);
  if (s.kind === "aspect" && s.aspect && s.other) {
    return { kind: s.kind, cards: [CARDS[s.planet], CARDS[s.other]], roles: [s.planet, s.other], aspect: s.aspect.key, at: inDay(s.aspect.exactAt) };
  }
  if (s.kind === "moonhit" && s.contact) {
    return { kind: s.kind, cards: [CARDS.moon, CARDS[s.planet]], roles: ["moon", s.planet], aspect: s.contact.key, at: inDay(s.contact.at) };
  }
  if (s.kind === "lunation") {
    return { kind: s.kind, cards: [CARDS.moon, CARDS.sun], roles: ["moon", "sun"], aspect: s.phase ? LUNATION_ASPECT[s.phase] : undefined, at: inDay(s.at) };
  }
  // moon, placement, ingress, station, retro: the planet's own card
  return { ...single(s.kind, s.planet), at: s.kind === "station" || s.kind === "ingress" ? inDay(s.at) : undefined };
}
