/**
 * life-timing-engine.ts — Detect major life transits approaching the user
 *
 * Scans the next 3 years for landmark astrological events:
 * Saturn Return, Jupiter Return, Uranus Opposition, and key squares/oppositions.
 * Uses orbital periods for rough estimation, then refines with day-by-day
 * position sampling via getAllPositions().
 */

import { getAllPositions } from "./celestial";
import type { NatalChart } from "./natal-chart";

// ── Types ──

export interface LifeTransit {
  name: string;
  description: string;
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  estimatedDate: string;  // YYYY-MM-DD
  daysUntil: number;
  significance: "life-changing" | "major" | "significant";
  lifeArea: string;
  advice: string;
}

// ── Orbital periods in years ──

const ORBITAL_PERIODS: Record<string, number> = {
  Jupiter: 11.862,
  Saturn: 29.457,
  Uranus: 84.01,
  Neptune: 164.8,
  Pluto: 247.94,
};

// ── Transit definitions ──

interface TransitDef {
  name: string;
  transitPlanet: string;
  natalPlanet: string;
  aspectType: "conjunction" | "opposition" | "square";
  targetAngle: number;     // 0 = conjunction, 180 = opposition, 90 = square
  orbitalPeriod: number;   // years per full cycle
  cycleMultiplier: number; // fraction of cycle at which this aspect occurs
  significance: "life-changing" | "major" | "significant";
  lifeArea: string;
  description: string;
  advice: string;
}

const TRANSIT_DEFS: TransitDef[] = [
  {
    name: "Saturn Return",
    transitPlanet: "Saturn",
    natalPlanet: "Saturn",
    aspectType: "conjunction",
    targetAngle: 0,
    orbitalPeriod: 29.457,
    cycleMultiplier: 1,
    significance: "life-changing",
    lifeArea: "identity & life structure",
    description:
      "The defining passage of adulthood. Transiting Saturn returns to its natal position, demanding you confront whether the life you've built is truly yours. Structures that lack integrity crumble; those built on authenticity are cemented for the next 29-year cycle.",
    advice:
      "Audit every commitment — career, relationships, beliefs. Release what you've outgrown. This isn't punishment; it's the universe asking you to grow up on your own terms. The foundations you lay now will hold for decades.",
  },
  {
    name: "Jupiter Return",
    transitPlanet: "Jupiter",
    natalPlanet: "Jupiter",
    aspectType: "conjunction",
    targetAngle: 0,
    orbitalPeriod: 11.862,
    cycleMultiplier: 1,
    significance: "major",
    lifeArea: "growth & opportunity",
    description:
      "Jupiter returns to its birth position, reigniting your innate sense of possibility. A fresh 12-year cycle of expansion begins — new philosophies, adventures, and lucky breaks arrive as the cosmos resets your growth trajectory.",
    advice:
      "Say yes to the big opportunity that appears. Start the course, book the trip, pitch the idea. Jupiter rewards faith and forward motion. Plant seeds now — they'll bear fruit for the next 12 years.",
  },
  {
    name: "Uranus Opposition",
    transitPlanet: "Uranus",
    natalPlanet: "Uranus",
    aspectType: "opposition",
    targetAngle: 180,
    orbitalPeriod: 84.01,
    cycleMultiplier: 0.5,
    significance: "life-changing",
    lifeArea: "authenticity & freedom",
    description:
      "The quintessential midlife awakening. Transiting Uranus opposes its natal position around age 42, electrifying everything that feels stale. This is the cosmic permission slip to become who you actually are, not who you were told to be.",
    advice:
      "Don't resist the restlessness — it's your authentic self demanding expression. Make the bold change consciously rather than letting it erupt destructively. The people and paths that survive this transit are the real ones.",
  },
  {
    name: "Saturn Square Saturn",
    transitPlanet: "Saturn",
    natalPlanet: "Saturn",
    aspectType: "square",
    targetAngle: 90,
    orbitalPeriod: 29.457,
    cycleMultiplier: 0.25,
    significance: "significant",
    lifeArea: "career & ambition",
    description:
      "A critical checkpoint in your Saturn cycle, occurring roughly every 7 years. Tension builds between where you are and where you're supposed to be. External pressures force you to prove your commitment to your path — or change course.",
    advice:
      "Expect friction, but don't run from it. Saturn squares are growth disguised as obstacles. Ask: Am I building what matters, or maintaining what's comfortable? Adjust course with discipline, not panic.",
  },
  {
    name: "Pluto Square Pluto",
    transitPlanet: "Pluto",
    natalPlanet: "Pluto",
    aspectType: "square",
    targetAngle: 90,
    orbitalPeriod: 247.94,
    cycleMultiplier: 0.25,
    significance: "life-changing",
    lifeArea: "power & transformation",
    description:
      "A generational transit that typically arrives in your late 30s to mid-40s. Pluto squares its natal position, forcing a confrontation with power — yours and others'. Deep psychological material surfaces, demanding transformation.",
    advice:
      "This transit strips away everything that isn't essential. Let it. Therapy, shadow work, and radical honesty are your allies. What dies now was already dead — you're just finally burying it so something real can grow.",
  },
  {
    name: "Neptune Square Neptune",
    transitPlanet: "Neptune",
    natalPlanet: "Neptune",
    aspectType: "square",
    targetAngle: 90,
    orbitalPeriod: 164.8,
    cycleMultiplier: 0.25,
    significance: "major",
    lifeArea: "spirituality & dreams",
    description:
      "Around age 41, Neptune squares its natal position, dissolving the boundaries between who you thought you were and who you're becoming. Ideals are tested. Illusions shatter. Spiritual hunger intensifies.",
    advice:
      "Avoid escapism — alcohol, fantasy, denial. Instead, channel the dissolution into creativity, meditation, or compassionate service. What feels confusing now is actually your old self making room for a more authentic vision.",
  },
  {
    name: "Jupiter Opposition Jupiter",
    transitPlanet: "Jupiter",
    natalPlanet: "Jupiter",
    aspectType: "opposition",
    targetAngle: 180,
    orbitalPeriod: 11.862,
    cycleMultiplier: 0.5,
    significance: "significant",
    lifeArea: "relationships & balance",
    description:
      "The midpoint of your Jupiter cycle, arriving roughly every 6 years. Growth comes through others — partnerships, collaborations, and opposing viewpoints reveal where your philosophy needs expansion.",
    advice:
      "Seek perspectives that challenge your assumptions. This is a time of fruitful tension in relationships. The person who disagrees with you most may be your greatest teacher right now.",
  },
];

// ── Helpers ──

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Estimate when a transit planet will next form a given aspect to a natal longitude.
 * Returns an approximate date based on current position + orbital speed.
 */
function estimateNextAspect(
  transitPlanetName: string,
  natalLongitude: number,
  targetAngle: number,
  now: Date,
): Date | null {
  const positions = getAllPositions(now);
  const transit = positions.find((b) => b.name === transitPlanetName);
  if (!transit) return null;

  const period = ORBITAL_PERIODS[transitPlanetName];
  if (!period) return null;

  // Current distance to target aspect
  const currentLon = transit.longitude;
  const targetLon = (natalLongitude + targetAngle) % 360;

  // How many degrees does the planet need to travel?
  let degreesToGo = ((targetLon - currentLon) % 360 + 360) % 360;
  // If very close (< 5 degrees), it might be happening now or just passed — look for next occurrence
  if (degreesToGo < 5) {
    degreesToGo += 360;
  }

  // Degrees per day for this planet
  const degreesPerDay = 360 / (period * 365.25);
  const daysToGo = degreesToGo / degreesPerDay;

  const estimated = new Date(now);
  estimated.setDate(estimated.getDate() + Math.round(daysToGo));
  return estimated;
}

/**
 * Refine an estimated date by sampling day-by-day in a window around it.
 * Returns the date with the smallest orb to the target aspect.
 */
function refineDate(
  transitPlanetName: string,
  natalLongitude: number,
  targetAngle: number,
  roughDate: Date,
  windowDays: number = 90,
): { date: Date; orb: number } {
  let bestDate = roughDate;
  let bestOrb = 999;

  const start = new Date(roughDate);
  start.setDate(start.getDate() - windowDays);
  const end = new Date(roughDate);
  end.setDate(end.getDate() + windowDays);

  // Sample every 3 days for speed, then narrow
  const cursor = new Date(start);
  while (cursor <= end) {
    const positions = getAllPositions(cursor);
    const transit = positions.find((b) => b.name === transitPlanetName);
    if (transit) {
      const orb = Math.abs(angleDiff(transit.longitude, natalLongitude) - targetAngle);
      if (orb < bestOrb) {
        bestOrb = orb;
        bestDate = new Date(cursor);
      }
    }
    cursor.setDate(cursor.getDate() + 3);
  }

  // Fine pass: +/- 5 days around best, daily
  const fineStart = new Date(bestDate);
  fineStart.setDate(fineStart.getDate() - 5);
  const fineEnd = new Date(bestDate);
  fineEnd.setDate(fineEnd.getDate() + 5);

  const fineCursor = new Date(fineStart);
  while (fineCursor <= fineEnd) {
    const positions = getAllPositions(fineCursor);
    const transit = positions.find((b) => b.name === transitPlanetName);
    if (transit) {
      const orb = Math.abs(angleDiff(transit.longitude, natalLongitude) - targetAngle);
      if (orb < bestOrb) {
        bestOrb = orb;
        bestDate = new Date(fineCursor);
      }
    }
    fineCursor.setDate(fineCursor.getDate() + 1);
  }

  return { date: bestDate, orb: bestOrb };
}

// ── Main computation ──

export function computeLifeTransits(natalChart: NatalChart): LifeTransit[] {
  const now = new Date();
  const threeYearsFromNow = new Date(now);
  threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3);

  const results: LifeTransit[] = [];

  for (const def of TRANSIT_DEFS) {
    // Find the natal planet longitude
    const natalPlanet = natalChart.planets.find((p) => p.name === def.natalPlanet);
    if (!natalPlanet) continue;

    const natalLon = natalPlanet.longitude;

    // Estimate the next occurrence
    const roughDate = estimateNextAspect(def.transitPlanet, natalLon, def.targetAngle, now);
    if (!roughDate) continue;

    // Only consider transits within 3 years
    if (roughDate.getTime() > threeYearsFromNow.getTime() + 90 * 86400000) continue;

    // Refine the date
    const { date: exactDate, orb } = refineDate(
      def.transitPlanet,
      natalLon,
      def.targetAngle,
      roughDate,
      90,
    );

    // Only include if within the 3-year window and orb is reasonable (< 15 degrees)
    if (exactDate.getTime() > threeYearsFromNow.getTime()) continue;
    if (exactDate.getTime() < now.getTime() - 30 * 86400000) continue;
    if (orb > 15) continue;

    const daysUntil = daysBetween(now, exactDate);

    results.push({
      name: def.name,
      description: def.description,
      transitPlanet: def.transitPlanet,
      natalPlanet: def.natalPlanet,
      aspectType: def.aspectType,
      estimatedDate: formatDate(exactDate),
      daysUntil: Math.max(0, daysUntil),
      significance: def.significance,
      lifeArea: def.lifeArea,
      advice: def.advice,
    });
  }

  // Sort by date ascending
  results.sort((a, b) => a.daysUntil - b.daysUntil);

  return results;
}
