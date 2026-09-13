/**
 * plans.ts — the Tariff, as the code understands it.
 *
 * One source of truth for what each plan opens. Prices come from
 * lib/payments (which checkout also reads), the names and the register
 * live here, and every gate in the app asks THIS file whether a reader
 * may pass — never a hardcoded tier comparison.
 *
 * ── The press is still warming ──
 * PAYWALL is off while the paid leaves are being set. Every feature is
 * open to every reader; the plan model underneath is complete, so the
 * day the press turns we flip one flag and the gates close correctly.
 */

import { PRICING, type Tier } from "@/lib/payments";

/** The master switch. Off = the whole almanac is open. */
export const PAYWALL_ENABLED =
  process.env.NEXT_PUBLIC_PAYWALL_ENABLED === "true";

/* ── The plans, in the almanac's own lexicon ─────────────────────── */

export interface Plan {
  /** Internal tier id — matches checkout and the subscription record. */
  tier: Tier;
  /** The name a reader sees. */
  name: string;
  /** One line, in the house voice. */
  line: string;
  /** Rank for comparisons; higher opens more. */
  rank: number;
  monthly: number;
  annual: number;
}

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    line: "The daily leaf: one card, the sky above you, the academy.",
    rank: 0,
    monthly: 0,
    annual: 0,
  },
  {
    tier: "insight",
    name: "Insight",
    line: "The full reading, written out — and a book to keep it in.",
    rank: 1,
    monthly: PRICING.insight.monthly,
    annual: PRICING.insight.annual,
  },
  {
    tier: "premium",
    name: "Astronomer",
    line: "Two charts compared, the years ahead timed, the deeper spreads.",
    rank: 2,
    monthly: PRICING.premium.monthly,
    annual: PRICING.premium.annual,
  },
  {
    tier: "vip",
    name: "Patron",
    line: "Every leaf of the edition, and the first impression of each.",
    rank: 3,
    monthly: PRICING.vip.monthly,
    annual: PRICING.vip.annual,
  },
];

/** The wire ids ("vip") differ from the names on the page ("Patron"). */
export function normalizeTier(tier: string | null | undefined): Tier {
  if (!tier) return "free";
  if (tier === "patron") return "vip";
  return tier as Tier;
}

export function planFor(tier: string | null | undefined): Plan {
  const t = normalizeTier(tier);
  return PLANS.find((p) => p.tier === t) ?? PLANS[0];
}

export function rankOf(tier: string | null | undefined): number {
  return planFor(tier).rank;
}

/* ── What the plans actually open ────────────────────────────────── */

export type FeatureId =
  // free — the daily almanac
  | "card-of-the-day"
  | "sky-today"
  | "academy"
  | "chart-basic"
  | "oracle-three-card"
  // insight — the reading written out
  | "reading-full"
  | "journal"
  | "back-numbers"
  | "oracle-unlimited"
  // astronomer — the instruments
  | "compatibility"
  | "transits"
  | "life-timing"
  | "spread-celtic-cross"
  | "spread-relationship"
  | "spread-year-ahead"
  // patron — the whole edition
  | "voice-reading"
  | "first-impression";

export interface Feature {
  id: FeatureId;
  /** The plan a reader must hold. */
  requires: Tier;
  /** Name shown when a gate explains itself. */
  name: string;
  /** Why it is worth holding, in one line. */
  note: string;
}

export const FEATURES: Record<FeatureId, Feature> = {
  "card-of-the-day": { id: "card-of-the-day", requires: "free", name: "The Card of the Day", note: "One card, drawn for everyone, every day." },
  "sky-today": { id: "sky-today", requires: "free", name: "The sky today", note: "Sun, moon and hour, computed for your place." },
  academy: { id: "academy", requires: "free", name: "The Academy", note: "Every course, free for as long as it stands." },
  "chart-basic": { id: "chart-basic", requires: "free", name: "Your chart", note: "The wheel, the placements, the houses." },
  "oracle-three-card": { id: "oracle-three-card", requires: "free", name: "The three-card reading", note: "Past, now, next — drawn against the hour." },

  "reading-full": { id: "reading-full", requires: "insight", name: "The full reading", note: "Each card read in place, then the pattern the three make together." },
  journal: { id: "journal", requires: "insight", name: "The commonplace book", note: "Keep what the cards said, and what came of it." },
  "back-numbers": { id: "back-numbers", requires: "insight", name: "Back numbers", note: "Every leaf you have cut, kept in the edition." },
  "oracle-unlimited": { id: "oracle-unlimited", requires: "insight", name: "Unlimited draws", note: "Ask as often as the question is honest." },

  compatibility: { id: "compatibility", requires: "premium", name: "Compatibility", note: "Two charts laid over one another, aspect by aspect." },
  transits: { id: "transits", requires: "premium", name: "Transits", note: "What the sky is doing to your chart, now." },
  "life-timing": { id: "life-timing", requires: "premium", name: "The table of years", note: "The slow transits approaching, dated." },
  "spread-celtic-cross": { id: "spread-celtic-cross", requires: "premium", name: "The Celtic Cross", note: "Ten cards: the situation, the crossing, the crown, the root." },
  "spread-relationship": { id: "spread-relationship", requires: "premium", name: "The Relationship Cross", note: "Seven cards read as two people and what stands between." },
  "spread-year-ahead": { id: "spread-year-ahead", requires: "premium", name: "The Year Ahead", note: "Twelve cards, one for each month to come." },

  "voice-reading": { id: "voice-reading", requires: "vip", name: "The spoken reading", note: "The reading read aloud, in Olivia's voice." },
  "first-impression": { id: "first-impression", requires: "vip", name: "First impression", note: "New leaves reach Patrons before the edition goes out." },
};

/** Features a plan opens, in order — used by the Tariff. */
export function featuresOf(tier: Tier): Feature[] {
  return Object.values(FEATURES).filter((f) => f.requires === tier);
}

/* ── The gate ────────────────────────────────────────────────────── */

export interface Entitlement {
  /** May the reader use it right now? */
  allowed: boolean;
  /** True when it is open only because the press has not started. */
  openWhilePaused: boolean;
  /** The plan that will be required once the press turns. */
  requiredPlan: Plan;
  feature: Feature;
}

/**
 * The single question every gate asks. While PAYWALL_ENABLED is false
 * this always allows — but it still reports which plan WILL be needed,
 * so a page can show an honest "this will belong to Insight" note
 * instead of pretending the feature is free forever.
 */
export function entitlementFor(featureId: FeatureId, tier: string | null | undefined): Entitlement {
  const feature = FEATURES[featureId];
  const requiredPlan = planFor(feature.requires);
  if (!PAYWALL_ENABLED) {
    return { allowed: true, openWhilePaused: requiredPlan.rank > 0, requiredPlan, feature };
  }
  return {
    allowed: rankOf(tier) >= requiredPlan.rank,
    openWhilePaused: false,
    requiredPlan,
    feature,
  };
}
