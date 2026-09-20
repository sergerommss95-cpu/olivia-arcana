/**
 * card-pages.ts — lib helper for the /cards/ encyclopedia pages.
 *
 * Owns: the exact slug list for all 78 cards, slug↔card lookup, the
 * deterministic Love / Career / Yes-or-No prose composers, related-card
 * selection, and per-card display metadata. Reads tarot-cards.ts only.
 */

import {
  ALL_CARDS,
  MAJOR_ARCANA,
  getMinorBySuit,
  type TarotCard,
} from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

// ── Slugs ────────────────────────────────────────────────────────────

/** Kebab-case a card name: "Wheel of Fortune" → "wheel-of-fortune". */
export function cardSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * The exact slug list, in ALL_CARDS order (majors 0–21, then wands,
 * cups, swords, pentacles). Kept literal so the URL surface is explicit
 * and diff-reviewable; the invariant below guards against drift.
 */
export const CARD_SLUGS = [
  // Major Arcana
  "the-fool", "the-magician", "the-high-priestess", "the-empress",
  "the-emperor", "the-hierophant", "the-lovers", "the-chariot",
  "strength", "the-hermit", "wheel-of-fortune", "justice",
  "the-hanged-man", "death", "temperance", "the-devil",
  "the-tower", "the-star", "the-moon", "the-sun",
  "judgement", "the-world",
  // Wands
  "ace-of-wands", "two-of-wands", "three-of-wands", "four-of-wands",
  "five-of-wands", "six-of-wands", "seven-of-wands", "eight-of-wands",
  "nine-of-wands", "ten-of-wands", "page-of-wands", "knight-of-wands",
  "queen-of-wands", "king-of-wands",
  // Cups
  "ace-of-cups", "two-of-cups", "three-of-cups", "four-of-cups",
  "five-of-cups", "six-of-cups", "seven-of-cups", "eight-of-cups",
  "nine-of-cups", "ten-of-cups", "page-of-cups", "knight-of-cups",
  "queen-of-cups", "king-of-cups",
  // Swords
  "ace-of-swords", "two-of-swords", "three-of-swords", "four-of-swords",
  "five-of-swords", "six-of-swords", "seven-of-swords", "eight-of-swords",
  "nine-of-swords", "ten-of-swords", "page-of-swords", "knight-of-swords",
  "queen-of-swords", "king-of-swords",
  // Pentacles
  "ace-of-pentacles", "two-of-pentacles", "three-of-pentacles",
  "four-of-pentacles", "five-of-pentacles", "six-of-pentacles",
  "seven-of-pentacles", "eight-of-pentacles", "nine-of-pentacles",
  "ten-of-pentacles", "page-of-pentacles", "knight-of-pentacles",
  "queen-of-pentacles", "king-of-pentacles",
] as const;

// Build-time invariant: the literal list must match the data file.
// A mismatch fails the static export loudly instead of 404-ing quietly.
ALL_CARDS.forEach((card, i) => {
  if (cardSlug(card.name) !== CARD_SLUGS[i]) {
    throw new Error(
      `card-pages.ts slug drift at index ${i}: data says "${cardSlug(card.name)}", list says "${CARD_SLUGS[i]}"`,
    );
  }
});

const BY_SLUG = new Map<string, TarotCard>(
  ALL_CARDS.map((card) => [cardSlug(card.name), card]),
);

export function getCardBySlug(slug: string): TarotCard | undefined {
  return BY_SLUG.get(slug);
}

export { getCardImagePath };

// ── Rank & suit vocabulary ───────────────────────────────────────────

type Elem = "Fire" | "Water" | "Air" | "Earth";
type Rank =
  | "major"
  | "ace"
  | "early"
  | "middle"
  | "late"
  | "page"
  | "knight"
  | "queen"
  | "king";

const RANK_WORDS = [
  "", "Ace", "Two", "Three", "Four", "Five", "Six", "Seven",
  "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King",
] as const;

export function rankOf(card: TarotCard): Rank {
  if (card.arcana === "major") return "major";
  switch (card.number) {
    case 1: return "ace";
    case 11: return "page";
    case 12: return "knight";
    case 13: return "queen";
    case 14: return "king";
    default:
      return card.number <= 4 ? "early" : card.number <= 7 ? "middle" : "late";
  }
}

function suitTitle(card: TarotCard): string {
  return card.suit ? card.suit[0].toUpperCase() + card.suit.slice(1) : "";
}

function elem(card: TarotCard): Elem {
  return card.element as Elem;
}

// ── Love composer ────────────────────────────────────────────────────
// Deterministic: rank frame (card-specific keywords) + element lens
// (variant picked by card number parity) + yes/no-keyed closer. Every
// card contributes its own keyword pair, so no two pages share a body.

const LOVE_ELEMENT: Record<Elem, [string, string]> = {
  Fire: [
    "Wands are the suit of desire, and in romance they burn the way they burn everywhere else — fast, visible, and honest about what they want.",
    "This is Fire's territory: attraction that announces itself, and a courtship that would rather risk embarrassment than settle for lukewarm.",
  ],
  Water: [
    "Cups are the suit of the heart, so in love this card speaks its native tongue — feeling first, explanation afterward.",
    "Water rules here: intimacy, empathy, and the slow tidal work of two people learning each other's depths.",
  ],
  Air: [
    "Swords bring the love question into daylight: what is actually being said, what is being left unsaid, and which of the two is steering the relationship.",
    "This is Air's domain — love examined, named, and negotiated. Romance under Swords survives on honesty or not at all.",
  ],
  Earth: [
    "Pentacles court slowly and mean it. In love, this suit measures devotion in kept promises, shared tables, and time actually spent.",
    "Earth grounds the romance here: fewer declarations, more proof — the kind of love a household can be built on.",
  ],
};

const LOVE_MAJOR_ELEMENT: Record<Elem, string> = {
  Fire: "Because it carries the Fire current, the lesson arrives with heat — through desire, impulse, or a spark that refuses to be scheduled.",
  Water: "Because it carries the Water current, the lesson moves through feeling — dreams, longing, and the parts of love that never quite fit into words.",
  Air: "Because it carries the Air current, the lesson comes as clarity — a conversation, a realization, a truth about the bond that cannot be unthought.",
  Earth: "Because it carries the Earth current, the lesson takes physical form — commitments, households, bodies, and what love does when it has to last.",
};

const LOVE_CLOSER: Record<TarotCard["yesNo"], string> = {
  yes: "The card's grain runs toward openness here: say the true thing, make the move, and let the connection grow in daylight.",
  no: "Treat this as the deck's caution flag for the heart: name what hurts before deciding anything permanent, and do not mistake intensity for intimacy.",
  maybe: "Read it as conditional: the connection can go either way, and the deciding vote belongs to whichever of you is willing to be honest first.",
};

export function loveMeaning(card: TarotCard): string {
  const [kw0, kw1] = card.keywords;
  const e = elem(card);
  const closer = LOVE_CLOSER[card.yesNo];

  if (card.arcana === "major") {
    return [
      `In love, ${card.name} is a season rather than a person. It marks a passage where ${kw0} and ${kw1} move to the center of your relationships — whatever was background becomes the plot.`,
      LOVE_MAJOR_ELEMENT[e],
      closer,
    ].join(" ");
  }

  const suit = suitTitle(card);
  const rankWord = RANK_WORDS[card.number];
  const lens = LOVE_ELEMENT[e][card.number % 2];

  const frames: Record<Exclude<Rank, "major">, string> = {
    ace: `For matters of the heart, the Ace deals the suit's first and purest card: ${kw0} before it has a history. Something in your love life is at the very beginning — a meeting, a thaw, a reopening.`,
    early: `Drawn for love, the ${rankWord} of ${suit} describes a bond in its building phase, where ${kw0} and ${kw1} decide what the foundation will hold.`,
    middle: `In a love reading, the ${rankWord} of ${suit} lands in the testing chapter: ${kw0} enters the story, and the relationship shows what it is made of.`,
    late: `For romance, the ${rankWord} of ${suit} belongs to the suit's final act — ${kw0} arriving at its full weight, for better or worse.`,
    page: `In love, the Page of ${suit} is young weather: ${kw0}, ${kw1}, and the willingness to feel something new without knowing where it leads. It can be a person entering your romantic life or a fresh mood inside an old bond.`,
    knight: `The Knight of ${suit} rides into a love reading as pursuit in motion — ${kw0} with momentum behind it. Expect movement: an advance, a declaration, a change of pace.`,
    queen: `As a lover or an influence, the Queen of ${suit} embodies ${kw0} mastered from within — she gives from fullness, not from need. In your reading she may be you, a partner, or the standard the relationship is being measured against.`,
    king: `The King of ${suit} brings ${kw0} to love in its most settled form — a partner, or a version of yourself, who leads the relationship rather than merely riding along in it.`,
  };

  return [frames[rankOf(card) as Exclude<Rank, "major">], lens, closer].join(" ");
}

// ── Career composer ──────────────────────────────────────────────────

const WORK_ELEMENT: Record<Elem, [string, string]> = {
  Fire: [
    "Wands govern the part of work that runs on conviction — launches, pitches, leadership, and the projects you would do unpaid.",
    "Fire's professional gift is ignition: it starts things, rallies people, and makes momentum look easy. Its bill arrives as burnout when nothing is delegated.",
  ],
  Water: [
    "Cups govern the human layer of work — morale, loyalty, creative instinct, and the colleagues who make a hard week survivable.",
    "Water's professional gift is reading the room: intuition about clients, teams, and timing that no spreadsheet can supply.",
  ],
  Air: [
    "Swords govern the strategic layer of work — analysis, negotiation, the memo that names the real problem.",
    "Air's professional gift is precision: it cuts scope, settles disputes, and tells the truth in meetings where nobody else will.",
  ],
  Earth: [
    "Pentacles govern the material ledger — salary, craft, savings, and the slow compounding of skill into security.",
    "Earth's professional gift is follow-through: the discipline that turns talent into a trade and a trade into a livelihood.",
  ],
};

const WORK_CLOSER: Record<TarotCard["yesNo"], string> = {
  yes: "Professionally, the current is with you — commit your effort while the window stands open.",
  no: "Professionally, this is a card to respect rather than push against: repair, renegotiate, or cut the loss cleanly.",
  maybe: "Professionally, it asks for one more data point before you commit — test small, then scale what survives the test.",
};

function astroClause(card: TarotCard): string {
  if (card.arcana === "major") {
    return `Astrologers file this card under ${card.astrology}, which is a fair one-word summary of the mood it brings to a career question.`;
  }
  if (card.astrology.startsWith("Root")) {
    return `The Golden Dawn names the Ace the ${card.astrology} — the element's undiluted source, before circumstance has shaped it.`;
  }
  if (card.astrology.includes("°")) {
    return `Its Golden Dawn title, ${card.astrology}, seats this court card across a span of the zodiac rather than a single decan.`;
  }
  return `On the Golden Dawn's wheel this card answers to the decan of ${card.astrology} — a correspondence worth carrying into questions of timing.`;
}

export function careerMeaning(card: TarotCard): string {
  const [kw0, kw1] = card.keywords;
  const e = elem(card);
  const closer = WORK_CLOSER[card.yesNo];

  if (card.arcana === "major") {
    return [
      `At work, ${card.name} rarely describes a single task; it names a structural turn in the working life itself. Themes of ${kw0} and ${kw1} stop being private and start showing up in your projects, your role, or your sense of what the job is for.`,
      astroClause(card),
      closer,
    ].join(" ");
  }

  const suit = suitTitle(card);
  const rankWord = RANK_WORDS[card.number];
  const lens = WORK_ELEMENT[e][(card.number + 1) % 2];

  const frames: Record<Exclude<Rank, "major">, string> = {
    ace: `In a career spread, the Ace of ${suit} is an opening: an offer, a role, a venture still small enough to fit in one hand. ${kw0[0].toUpperCase() + kw0.slice(1)} is the raw material — what you build from it is the reading's real question.`,
    early: `Drawn for work, the ${rankWord} of ${suit} sits in the planning-and-building stretch of the suit, where ${kw0} and ${kw1} determine whether the venture gets a skeleton or stays a sketch.`,
    middle: `For career questions, the ${rankWord} of ${suit} marks the friction chapter: ${kw0} tests the plan against reality, and the workplace shows you exactly where the weak joints are.`,
    late: `Professionally, the ${rankWord} of ${suit} is harvest-country — the suit near its end, with ${kw0} arriving as consequence rather than possibility.`,
    page: `In a career reading, the Page of ${suit} is the apprentice's card: ${kw0} paired with ${kw1}, a study posture, a new skill or a junior voice worth hearing. It favors learning in public over waiting to feel qualified.`,
    knight: `The Knight of ${suit} turns a career question into a delivery question — ${kw0} put on schedule. Progress comes fast under this card; so do the errors of speed, so aim before accelerating.`,
    queen: `For work, the Queen of ${suit} is stewardship: ${kw0} applied to people and process rather than personal glory. She runs the room by making everyone in it more capable.`,
    king: `The King of ${suit} answers a career question with ownership — ${kw0} matured into direction. This is the card of running the operation: setting terms, carrying weight, being the person others plan around.`,
  };

  return [frames[rankOf(card) as Exclude<Rank, "major">], lens, astroClause(card), closer].join(" ");
}

// ── Yes / No composer ────────────────────────────────────────────────

export function yesNoProse(card: TarotCard): string {
  const kw = card.keywords[0];
  switch (card.yesNo) {
    case "yes":
      return `In a one-card yes-or-no draw, ${card.name} reads as a yes. Its center of gravity — ${kw} — tips the scales toward action and affirmation. Take the yes, but take it the way the card gives it: as permission, not a guarantee.`;
    case "no":
      return `Drawn for a yes-or-no question, ${card.name} answers no. A card of ${kw} rarely blesses the direct path; it says the timing, the framing, or the question itself needs to change before this door opens.`;
    default:
      return `As a yes-or-no card, ${card.name} refuses to be pinned: the honest answer is maybe. Its theme of ${kw} makes the outcome conditional — the deck is handing the decision back to you, along with the information you need to make it.`;
  }
}

/** Short, capitalized verdict for tables and meta. */
export function yesNoVerdict(card: TarotCard): string {
  return card.yesNo === "yes" ? "Yes" : card.yesNo === "no" ? "No" : "Maybe";
}

// ── Relations & grouping ─────────────────────────────────────────────

/** Three related cards: nearest neighbors within the same group. */
export function relatedCards(card: TarotCard): TarotCard[] {
  const group =
    card.arcana === "major" ? MAJOR_ARCANA : getMinorBySuit(card.suit!);
  const i = group.indexOf(card);
  const n = group.length;
  const picks = [i + 1, i - 1, i + 2]
    .map((j) => group[((j % n) + n) % n])
    .filter((c) => c !== card);
  return [...new Set(picks)].slice(0, 3);
}

/** Academy course that covers this card's arcana. */
export function courseFor(card: TarotCard): { href: string; title: string } {
  return card.arcana === "major"
    ? { href: "/academy/fools-journey/", title: "The Fool's Journey Begins" }
    : { href: "/academy/world-in-four-suits/", title: "The World in Four Suits" };
}

/** Index-page groups, in deck order. */
export function cardGroups(): { title: string; note: string; cards: TarotCard[] }[] {
  return [
    { title: "Major Arcana", note: "Plates 0–XXI · The Fool's Journey", cards: MAJOR_ARCANA },
    { title: "Wands", note: "Fire · Will, work, desire", cards: getMinorBySuit("wands") },
    { title: "Cups", note: "Water · Feeling, love, memory", cards: getMinorBySuit("cups") },
    { title: "Swords", note: "Air · Thought, truth, conflict", cards: getMinorBySuit("swords") },
    { title: "Pentacles", note: "Earth · Craft, money, ground", cards: getMinorBySuit("pentacles") },
  ];
}

const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
] as const;

/** Ledger numeral: roman for majors, rank numeral for minors. */
export function cardNumeral(card: TarotCard): string {
  if (card.arcana === "major") return ROMAN[card.number] ?? String(card.number);
  return String(card.number).padStart(2, "0");
}
