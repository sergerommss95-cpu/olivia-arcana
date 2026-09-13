/**
 * spreads.ts — the shapes a reading can take.
 *
 * A spread is a set of positions, and a position is a question. The same
 * card means something different in "what crosses you" than it does in
 * "what crowns you" — so a full reading is the card's own meaning bent
 * through the question its position asks.
 *
 * Layout is given in card-widths from the centre so the dealing table
 * can arrange any spread without knowing which one it is.
 */

import type { TarotCard } from "@/lib/academy/tarot-cards";
import type { FeatureId } from "@/lib/plans";

export interface SpreadPosition {
  /** Short label printed under the plate. */
  label: string;
  /** The question this position asks. */
  asks: string;
  /** Column offset in card-widths from centre (may be fractional). */
  col: number;
  /** Row offset in card-heights from centre. */
  row: number;
  /** Laid across the card beneath it (the Celtic crossing card). */
  rotated?: boolean;
}

export interface Spread {
  id: string;
  name: string;
  nameUk: string;
  /** One line in the house voice. */
  line: string;
  lineUk: string;
  /** How many cards it draws. */
  count: number;
  /** The plan gate this spread sits behind. */
  feature: FeatureId;
  positions: SpreadPosition[];
}

export const SPREADS: Spread[] = [
  {
    id: "three-card",
    name: "Past · Now · Next",
    nameUk: "Минуле · Тепер · Далі",
    line: "Three cards, one clear pattern to reflect on.",
    lineUk: "Три карти — один ясний візерунок для роздуму.",
    count: 3,
    feature: "oracle-three-card",
    positions: [
      { label: "What led here", asks: "the ground this stands on", col: -1.15, row: 0 },
      { label: "What is present", asks: "the thing actually in front of you", col: 0, row: 0 },
      { label: "Where to move", asks: "the step that follows honestly", col: 1.15, row: 0 },
    ],
  },
  {
    id: "celtic-cross",
    name: "The Celtic Cross",
    nameUk: "Кельтський хрест",
    line: "Ten cards: the situation, what crosses it, the crown, the root, and the staff that reads the outcome.",
    lineUk: "Десять карт: ситуація, що її перетинає, вінець, корінь — і стовп, що читає підсумок.",
    count: 10,
    feature: "spread-celtic-cross",
    positions: [
      { label: "The situation", asks: "the heart of the matter", col: -0.9, row: 0 },
      { label: "What crosses it", asks: "the force working against or with it", col: -0.9, row: 0, rotated: true },
      { label: "The crown", asks: "what you know consciously", col: -0.9, row: -1.15 },
      { label: "The root", asks: "what sits beneath, unspoken", col: -0.9, row: 1.15 },
      { label: "What is passing", asks: "what is already leaving", col: -2.05, row: 0 },
      { label: "What approaches", asks: "what is arriving next", col: 0.25, row: 0 },
      { label: "Yourself", asks: "how you stand in it", col: 1.5, row: 1.7 },
      { label: "Your house", asks: "what surrounds you — people, place", col: 1.5, row: 0.55 },
      { label: "Hopes and fears", asks: "what you want and dread, often the same", col: 1.5, row: -0.6 },
      { label: "The outcome", asks: "where this tends, if nothing turns", col: 1.5, row: -1.75 },
    ],
  },
  {
    id: "relationship",
    name: "The Relationship Cross",
    nameUk: "Хрест стосунків",
    line: "Seven cards read as two people and what stands between them.",
    lineUk: "Сім карт — двоє людей і те, що стоїть між ними.",
    count: 7,
    feature: "spread-relationship",
    positions: [
      { label: "You", asks: "what you bring", col: -1.2, row: -0.6 },
      { label: "Them", asks: "what they bring", col: 1.2, row: -0.6 },
      { label: "The bond", asks: "what actually holds you", col: 0, row: -0.6 },
      { label: "What you give", asks: "what flows out from you", col: -1.2, row: 0.6 },
      { label: "What they give", asks: "what flows back", col: 1.2, row: 0.6 },
      { label: "What stands between", asks: "the obstacle neither names", col: 0, row: 0.6 },
      { label: "Where it tends", asks: "the direction of travel", col: 0, row: 1.8 },
    ],
  },
  {
    id: "year-ahead",
    name: "The Year Ahead",
    nameUk: "Рік попереду",
    line: "Twelve cards, one for each month to come.",
    lineUk: "Дванадцять карт — по одній на кожен місяць, що надходить.",
    count: 12,
    feature: "spread-year-ahead",
    positions: Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return {
        label: `Month ${i + 1}`,
        asks: `the ${i + 1}${i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"} month from now`,
        col: Math.cos(angle) * 2.1,
        row: Math.sin(angle) * 1.75,
      };
    }),
  },
];

export function spreadById(id: string): Spread {
  return SPREADS.find((s) => s.id === id) ?? SPREADS[0];
}

/* ── The full reading ─────────────────────────────────────────────
   A card's meaning, bent through the question its position asks, plus
   the pattern the whole spread makes. Written locally — no model call,
   no waiting, and it never says anything the deck itself doesn't. */

export interface ReadCard {
  card: TarotCard;
  position: SpreadPosition;
  reversed: boolean;
  /** The card read in this position. */
  passage: string;
}

export interface FullReading {
  spread: Spread;
  cards: ReadCard[];
  /** What the spread says taken together. */
  synthesis: string;
  /** The single line to carry away. */
  counsel: string;
  /** Which card the counsel speaks from (EN name — translation key). */
  counselFrom: string;
}

function passageFor(card: TarotCard, _position: SpreadPosition, reversed: boolean): string {
  // The position and its question are already set beside this passage —
  // repeating them here made the reading say everything three times.
  return reversed ? card.reversed : card.upright;
}

const ELEMENT_NOTE: Record<string, string> = {
  Fire: "wants motion, and will take it badly if made to wait",
  Water: "is being felt before it is understood",
  Air: "is a matter of what gets said, and how precisely",
  Earth: "is asking for something practical, not something felt",
};

/* Rank repetition — the oldest combination rule in the book: when the
   same number falls more than once, that number is the message. */
const RANK_NAME: Record<number, [string, string]> = {
  1: ["Ace", "beginnings arriving from more than one direction"],
  2: ["Two", "choices and pairings asking to be weighed"],
  3: ["Three", "first growth showing in several houses at once"],
  4: ["Four", "consolidation — things wanting to be kept, not chased"],
  5: ["Five", "friction surfacing wherever it was postponed"],
  6: ["Six", "recovery and exchange after strain"],
  7: ["Seven", "assessment — standing back before the next move"],
  8: ["Eight", "craft and momentum gathering speed"],
  9: ["Nine", "culmination — matters nearly at their fullest"],
  10: ["Ten", "completion, with the weight completion carries"],
  11: ["Page", "messages and beginners' eyes"],
  12: ["Knight", "pursuit — energies already on the road"],
  13: ["Queen", "inward mastery holding the room"],
  14: ["King", "settled authority taking charge"],
};

/* Elemental dignities, the classical triads: kin strengthen, opposites
   check each other, the rest stand neutral. */
const FRIENDLY: Record<string, string> = { Fire: "Air", Air: "Fire", Water: "Earth", Earth: "Water" };
const OPPOSED: Record<string, string> = { Fire: "Water", Water: "Fire", Air: "Earth", Earth: "Air" };

export function readSpread(
  spread: Spread,
  draws: Array<{ card: TarotCard; reversed: boolean }>
): FullReading {
  const cards: ReadCard[] = draws.slice(0, spread.count).map((d, i) => ({
    card: d.card,
    position: spread.positions[i],
    reversed: d.reversed,
    passage: passageFor(d.card, spread.positions[i], d.reversed),
  }));

  // The pattern: what the draw is weighted toward.
  const majors = cards.filter((c) => c.card.arcana === "major").length;
  const reversals = cards.filter((c) => c.reversed).length;
  const elements = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.card.element] = (acc[c.card.element] ?? 0) + 1;
    return acc;
  }, {});
  const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];

  const parts: string[] = [];
  if (majors >= Math.ceil(cards.length / 2)) {
    parts.push(
      `${majors} of ${cards.length} cards are Major Arcana: this is not a week's weather, it is a season turning.`
    );
  } else if (majors === 0) {
    parts.push(
      "No Major Arcana fell here — everything in this spread is yours to move, and none of it is fate."
    );
  } else {
    parts.push(
      `${majors} of ${cards.length} cards are Major: the matter is partly yours to steer and partly already in motion.`
    );
  }

  if (dominant && dominant[1] >= 2 && ELEMENT_NOTE[dominant[0]]) {
    parts.push(`${dominant[0]} runs through the draw — what is at stake ${ELEMENT_NOTE[dominant[0]]}.`);
  }

  // Rank echoes among the minors: the same number falling twice or more.
  const rankCount = cards.reduce<Record<number, number>>((acc, c) => {
    if (c.card.arcana === "minor") acc[c.card.number] = (acc[c.card.number] ?? 0) + 1;
    return acc;
  }, {});
  const echo = Object.entries(rankCount)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])[0];
  if (echo && RANK_NAME[Number(echo[0])]) {
    const [rank, theme] = RANK_NAME[Number(echo[0])];
    parts.push(
      `${echo[1] === 2 ? "Two" : echo[1] === 3 ? "Three" : "Four"} ${rank}s fell in one draw — ${theme}; a number repeated is a number underlined.`
    );
  }

  // Court density: when the faces outnumber the events.
  const courts = cards.filter((c) => c.card.arcana === "minor" && c.card.number >= 11).length;
  if (courts >= 2) {
    parts.push(
      `${courts} court cards stand here — this matter moves through people and their tempers more than through circumstance.`
    );
  }

  // Elemental dignity of a three-card line: the centre judged by its
  // flanks, the way the old schools weighed a triad.
  if (cards.length === 3) {
    const [l, m, r] = cards.map((c) => c.card.element);
    const kin = (a: string, b: string) => a === b || FRIENDLY[a] === b;
    const foe = (a: string, b: string) => OPPOSED[a] === b;
    if (kin(m, l) && kin(m, r)) {
      parts.push(`The centre card stands well-dignified — ${l} and ${r} both feed it, so its promise arrives at full strength.`);
    } else if (foe(m, l) && foe(m, r)) {
      parts.push(`The centre card stands ill-dignified — checked from both sides, its force is real but arrives muted; read it as tendency, not verdict.`);
    }
  }

  // Reversals are only worth a sentence when the deal actually uses them.
  if (reversals > 0) {
    if (reversals >= Math.ceil(cards.length / 2)) {
      parts.push(
        `${reversals} cards fell turned — much of this is working underground, and pushing harder will not surface it faster.`
      );
    } else {
      parts.push(`${reversals} turned, the rest upright: some of this is blocked, most of it is not.`);
    }
  }

  // The counsel: if a trump presides over the draw, its lesson closes the
  // reading (the one nearest the final position speaks); otherwise the
  // card the spread was built to arrive at.
  const majorsDrawn = cards.filter((c) => c.card.arcana === "major");
  const presiding = majorsDrawn.length ? majorsDrawn[majorsDrawn.length - 1] : cards[cards.length - 1];
  const counsel = presiding ? presiding.card.advice : "";

  return { spread, cards, synthesis: parts.join(" "), counsel, counselFrom: presiding?.card.name ?? "" };
}
