// Structural facts about the 78 cards, shared by the website and the reading
// experience (plain ES module so both can import it). Ids follow the deck order:
// 0–21 Major Arcana, then Wands, Cups, Swords and Pentacles, Ace to King.

export const SUITS = ["wands", "cups", "swords", "pentacles"];
export const ELEMENT_OF_SUIT = { wands: "fire", cups: "water", swords: "air", pentacles: "earth" };
export const COURT_RANKS = ["page", "knight", "queen", "king"];

/** Fire and Water, Air and Earth are the contrary pairs of the Golden Dawn lens. */
const CONTRARY = { fire: "water", water: "fire", air: "earth", earth: "air" };

/**
 * @param {number} id 0–77
 * @returns {{id:number, arcana:"major"|"minor", suit:string|null, element:string|null, rank:number|null, number:number|null, court:string|null}}
 */
export function cardFacts(id) {
  if (!Number.isInteger(id) || id < 0 || id > 77) throw new TypeError("A card id is 0–77.");
  if (id < 22) return { id, arcana: "major", suit: null, element: null, rank: null, number: id, court: null };
  const suit = SUITS[Math.floor((id - 22) / 14)];
  const rank = ((id - 22) % 14) + 1;
  return {
    id,
    arcana: "minor",
    suit,
    element: ELEMENT_OF_SUIT[suit],
    rank,
    number: rank <= 10 ? rank : null,
    court: rank > 10 ? COURT_RANKS[rank - 11] : null,
  };
}

/** How two elements meet: "same", "contrary" or "neutral"; null when either card has none. */
export function elementRelation(a, b) {
  if (!a || !b) return null;
  if (a === b) return "same";
  return CONTRARY[a] === b ? "contrary" : "neutral";
}

/**
 * Observable links between two cards, as data for a lesson or a drill to phrase.
 * `symbolsA`/`symbolsB` are the symbol keys carved on each card.
 */
export function pairFacts(a, b, symbolsA = [], symbolsB = [], commonKeys = COMMON_SYMBOL_KEYS) {
  const fa = cardFacts(a), fb = cardFacts(b);
  const shared = [...new Set(symbolsA)].filter((key) => !commonKeys.has(key) && symbolsB.includes(key));
  return {
    bothMajor: fa.arcana === "major" && fb.arcana === "major",
    majorWithMinor: fa.arcana !== fb.arcana,
    sameSuit: Boolean(fa.suit) && fa.suit === fb.suit,
    sameNumber: fa.number !== null && fa.number === fb.number,
    sameCourt: Boolean(fa.court) && fa.court === fb.court,
    elements: elementRelation(fa.element, fb.element),
    sharedSymbols: shared,
  };
}

/** Symbols on so many cards that sharing them says little. */
export const COMMON_SYMBOL_KEYS = new Set(["milky-way", "hand", "face", "robe", "other", "wand", "cup", "sword", "pentacle", "staff", "cloud", "leaves", "rock"]);
