/**
 * transit-calculator.ts — Compute upcoming transits hitting a natal chart
 *
 * Scans future planet positions against natal planet positions to find
 * major aspects (conjunction, opposition, square, trine, sextile).
 * Groups consecutive days of the same transit into a single Transit object.
 */

import { getAllPositions } from "./celestial";
import type { NatalChart } from "./natal-chart";

// ── Types ──

export type AspectType = "conjunction" | "opposition" | "square" | "trine" | "sextile";
export type Significance = "high" | "medium" | "low";

export interface Transit {
  transitPlanet: string;
  transitGlyph: string;
  natalPlanet: string;
  natalGlyph: string;
  aspectType: AspectType;
  startDate: Date;
  exactDate: Date;
  endDate: Date;
  minOrb: number;
  significance: Significance;
  description: string;
}

// ── Constants ──

const ASPECT_DEFS: { type: AspectType; angle: number; label: string }[] = [
  { type: "conjunction", angle: 0, label: "conjunct" },
  { type: "opposition", angle: 180, label: "opposite" },
  { type: "square", angle: 90, label: "square" },
  { type: "trine", angle: 120, label: "trine" },
  { type: "sextile", angle: 60, label: "sextile" },
];

/** Orbs per aspect for outer planets (Jupiter-Pluto) */
const OUTER_ORBS: Record<AspectType, number> = {
  conjunction: 8,
  opposition: 8,
  square: 7,
  trine: 7,
  sextile: 6,
};

/** Orbs for Mars transits (tighter) */
const MARS_ORBS: Record<AspectType, number> = {
  conjunction: 5,
  opposition: 5,
  square: 5,
  trine: 5,
  sextile: 4,
};

const OUTER_PLANETS = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const PERSONAL_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars"];

// ── Descriptions ──

const TRANSIT_DESCRIPTIONS: Record<string, Record<AspectType, string>> = {
  "Saturn": {
    conjunction: "Saturn conjunct natal {natal} — restructuring, discipline, and maturation in this area of life",
    opposition: "Saturn opposite natal {natal} — confronting limitations, balancing responsibility with desire",
    square: "Saturn square natal {natal} — tension and testing, forcing you to build stronger foundations",
    trine: "Saturn trine natal {natal} — steady progress, earned rewards, and structural support",
    sextile: "Saturn sextile natal {natal} — opportunities for disciplined growth and practical achievement",
  },
  "Jupiter": {
    conjunction: "Jupiter conjunct natal {natal} — expansion, luck, and new opportunities flowing in",
    opposition: "Jupiter opposite natal {natal} — growth through relationships, balancing excess with wisdom",
    square: "Jupiter square natal {natal} — overexpansion risk, but powerful drive for growth and meaning",
    trine: "Jupiter trine natal {natal} — effortless blessings, natural growth, and abundant flow",
    sextile: "Jupiter sextile natal {natal} — gentle openings, optimism, and opportunities worth seizing",
  },
  "Uranus": {
    conjunction: "Uranus conjunct natal {natal} — sudden awakening, liberation, and radical change",
    opposition: "Uranus opposite natal {natal} — external disruptions forcing authentic self-expression",
    square: "Uranus square natal {natal} — restless tension, breakthroughs through breaking free",
    trine: "Uranus trine natal {natal} — exciting innovations, positive surprises, and creative freedom",
    sextile: "Uranus sextile natal {natal} — inventive opportunities, subtle shifts toward authenticity",
  },
  "Neptune": {
    conjunction: "Neptune conjunct natal {natal} — dissolving boundaries, spiritual awakening, heightened intuition",
    opposition: "Neptune opposite natal {natal} — confusion or idealization in relationships, seek clarity",
    square: "Neptune square natal {natal} — fog and disillusionment clearing the way for deeper truth",
    trine: "Neptune trine natal {natal} — creative inspiration, compassion, and spiritual flow",
    sextile: "Neptune sextile natal {natal} — subtle intuitive gifts, imaginative openings, gentle grace",
  },
  "Pluto": {
    conjunction: "Pluto conjunct natal {natal} — profound transformation, death and rebirth of identity",
    opposition: "Pluto opposite natal {natal} — power dynamics surfacing, deep psychological confrontation",
    square: "Pluto square natal {natal} — intense pressure for transformation, crisis as catalyst",
    trine: "Pluto trine natal {natal} — empowering evolution, deep inner strength emerging naturally",
    sextile: "Pluto sextile natal {natal} — subtle but potent opportunities for psychological growth",
  },
  "Mars": {
    conjunction: "Mars conjunct natal {natal} — surge of energy, motivation, and assertive action",
    opposition: "Mars opposite natal {natal} — conflicts revealing where boundaries need to be set",
    square: "Mars square natal {natal} — friction and frustration, channeling anger into productive drive",
    trine: "Mars trine natal {natal} — confident action, physical vitality, and courageous initiative",
    sextile: "Mars sextile natal {natal} — motivation boost, cooperative energy for getting things done",
  },
};

// ── Helpers ──

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function getDescription(transitPlanet: string, natalPlanet: string, aspect: AspectType): string {
  const templates = TRANSIT_DESCRIPTIONS[transitPlanet];
  if (!templates) return `${transitPlanet} ${aspect} natal ${natalPlanet}`;
  const template = templates[aspect];
  return template.replace("{natal}", natalPlanet);
}

function getSignificance(transitPlanet: string, natalPlanet: string): Significance {
  const isOuter = OUTER_PLANETS.includes(transitPlanet);
  const isPersonal = PERSONAL_PLANETS.includes(natalPlanet);

  if (isOuter && isPersonal) return "high";
  if (isOuter && !isPersonal) return "medium";
  // Mars → personal
  return "low";
}

/** Unique key for grouping consecutive hits of the same transit */
function transitKey(transitPlanet: string, natalPlanet: string, aspect: AspectType): string {
  return `${transitPlanet}|${natalPlanet}|${aspect}`;
}

// ── Main computation ──

interface RawHit {
  transitPlanet: string;
  transitGlyph: string;
  natalPlanet: string;
  natalGlyph: string;
  aspectType: AspectType;
  date: Date;
  orb: number;
}

/**
 * Compute upcoming transits for a natal chart over the next N months.
 * Samples every 3 days for outer planets, every day for Mars.
 */
export function computeTransits(natalChart: NatalChart, months: number = 6): Transit[] {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);

  const natalPlanets = natalChart.planets;

  // Collect all raw hits
  const allHits: RawHit[] = [];

  // --- Outer planet transits (sample every 3 days) ---
  const outerDate = new Date(now);
  while (outerDate <= endDate) {
    const positions = getAllPositions(outerDate);
    const outerBodies = positions.filter(b => OUTER_PLANETS.includes(b.name));

    for (const transit of outerBodies) {
      for (const natal of natalPlanets) {
        for (const aspectDef of ASPECT_DEFS) {
          const orb = angleDiff(transit.longitude, natal.longitude) - aspectDef.angle;
          const absOrb = Math.abs(orb);
          const maxOrb = OUTER_ORBS[aspectDef.type];
          if (absOrb <= maxOrb) {
            allHits.push({
              transitPlanet: transit.name,
              transitGlyph: transit.glyph,
              natalPlanet: natal.name,
              natalGlyph: natal.glyph,
              aspectType: aspectDef.type,
              date: new Date(outerDate),
              orb: absOrb,
            });
          }
        }
      }
    }

    outerDate.setDate(outerDate.getDate() + 3);
  }

  // --- Mars transits (sample every day) ---
  const marsDate = new Date(now);
  while (marsDate <= endDate) {
    const positions = getAllPositions(marsDate);
    const mars = positions.find(b => b.name === "Mars");
    if (mars) {
      for (const natal of natalPlanets) {
        // Skip Mars transiting natal Mars (less interesting)
        if (natal.name === "Mars") continue;
        for (const aspectDef of ASPECT_DEFS) {
          const orb = angleDiff(mars.longitude, natal.longitude) - aspectDef.angle;
          const absOrb = Math.abs(orb);
          const maxOrb = MARS_ORBS[aspectDef.type];
          if (absOrb <= maxOrb) {
            allHits.push({
              transitPlanet: "Mars",
              transitGlyph: "♂",
              natalPlanet: natal.name,
              natalGlyph: natal.glyph,
              aspectType: aspectDef.type,
              date: new Date(marsDate),
              orb: absOrb,
            });
          }
        }
      }
    }

    marsDate.setDate(marsDate.getDate() + 1);
  }

  // --- Group consecutive hits into Transit objects ---
  // Sort by key then date
  allHits.sort((a, b) => {
    const ka = transitKey(a.transitPlanet, a.natalPlanet, a.aspectType);
    const kb = transitKey(b.transitPlanet, b.natalPlanet, b.aspectType);
    if (ka < kb) return -1;
    if (ka > kb) return 1;
    return a.date.getTime() - b.date.getTime();
  });

  const transits: Transit[] = [];
  let i = 0;

  while (i < allHits.length) {
    const current = allHits[i];
    const key = transitKey(current.transitPlanet, current.natalPlanet, current.aspectType);

    const startDate = current.date;
    let endDateHit = current.date;
    let exactDate = current.date;
    let minOrb = current.orb;

    // Advance through consecutive hits with same key (gap tolerance: 5 days for outer, 2 for Mars)
    let j = i + 1;
    while (j < allHits.length) {
      const next = allHits[j];
      const nextKey = transitKey(next.transitPlanet, next.natalPlanet, next.aspectType);
      if (nextKey !== key) break;

      const gapDays = (next.date.getTime() - endDateHit.getTime()) / (1000 * 60 * 60 * 24);
      const maxGap = current.transitPlanet === "Mars" ? 2 : 5;
      if (gapDays > maxGap) break;

      endDateHit = next.date;
      if (next.orb < minOrb) {
        minOrb = next.orb;
        exactDate = next.date;
      }
      j++;
    }

    transits.push({
      transitPlanet: current.transitPlanet,
      transitGlyph: current.transitGlyph,
      natalPlanet: current.natalPlanet,
      natalGlyph: current.natalGlyph,
      aspectType: current.aspectType,
      startDate,
      exactDate,
      endDate: endDateHit,
      minOrb: Math.round(minOrb * 10) / 10,
      significance: getSignificance(current.transitPlanet, current.natalPlanet),
      description: getDescription(current.transitPlanet, current.natalPlanet, current.aspectType),
    });

    i = j;
  }

  // Sort by exactDate
  transits.sort((a, b) => a.exactDate.getTime() - b.exactDate.getTime());

  return transits;
}
