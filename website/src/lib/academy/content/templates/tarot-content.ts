/**
 * tarot-content.ts — Lesson content templates for tarot card lessons
 *
 * Generates data-driven sections for card pairs, card groups, court cards,
 * suit overviews, and tarot concepts. Pulls from ALL_CARDS for real card data.
 */

import type { LessonContent, ContentSection } from "../types";
import { ALL_CARDS, type TarotCard } from "@/lib/academy/tarot-cards";

// ── Helpers ──

function text(title: string, body: string): ContentSection {
  return { type: "text", title, body };
}

function callout(style: "insight" | "warning" | "tip", body: string): ContentSection {
  return { type: "callout", style, body };
}

function cardDisplay(cardName: string, showReversed?: boolean): ContentSection {
  return { type: "card-display", cardName, showReversed };
}

function cardGrid(cards: string[]): ContentSection {
  return { type: "card-grid", cards };
}

function findCard(name: string): TarotCard | undefined {
  return ALL_CARDS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

function romanNumeral(n: number): string {
  const map: [number, string][] = [
    [21, "XXI"], [20, "XX"], [19, "XIX"], [18, "XVIII"], [17, "XVII"],
    [16, "XVI"], [15, "XV"], [14, "XIV"], [13, "XIII"], [12, "XII"],
    [11, "XI"], [10, "X"], [9, "IX"], [8, "VIII"], [7, "VII"],
    [6, "VI"], [5, "V"], [4, "IV"], [3, "III"], [2, "II"], [1, "I"], [0, "0"],
  ];
  for (const [val, numeral] of map) {
    if (n >= val) return numeral;
  }
  return String(n);
}

// ── Card pair generator ──

function buildPairLesson(
  cardA: string,
  cardB: string,
  intro: string,
  comparisonRows: string[][],
  closingInsight: string,
  minutes: number,
): LessonContent {
  const a = findCard(cardA);
  const b = findCard(cardB);
  const numA = a ? romanNumeral(a.number) : "";
  const numB = b ? romanNumeral(b.number) : "";

  const sections: ContentSection[] = [
    text(`${numA} -- ${cardA} & ${numB} -- ${cardB}`, intro),
    { type: "tarot-reveal", cardName: cardA },
    cardDisplay(cardA),
    cardDisplay(cardB, true),
    {
      type: "comparison-table",
      headers: ["", cardA, cardB],
      rows: comparisonRows,
    },
    callout("insight", closingInsight),
  ];

  return { sections, estimatedMinutes: minutes, keyTakeaway: closingInsight.split(". ")[0] + "." };
}

// ── Card pair data ──

const CARD_PAIRS: Record<string, { a: string; b: string; intro: string; rows: string[][]; insight: string }> = {
  "fool-magician": {
    a: "The Fool",
    b: "The Magician",
    intro:
      "The Major Arcana begins with two complementary forces: innocence and intention. The Fool steps off " +
      "the cliff with nothing but trust — no plan, no skill, no fear. The Magician stands at a table with " +
      "every tool available, channeling infinite potential into focused creation. Together they represent the " +
      "full spectrum of beginning: the courage to start without knowing, and the skill to shape what follows.",
    rows: [
      ["Number", "0 — Before the journey", "I — The first step"],
      ["Energy", "Limitless potential, openness", "Focused will, manifestation"],
      ["Element", "Air — freedom and spirit", "Air — thought and communication"],
      ["Lesson", "Trust the leap", "Direct your power"],
      ["Shadow", "Recklessness, naivety", "Manipulation, scattered energy"],
    ],
    insight:
      "The Fool without the Magician wanders forever. The Magician without the Fool calculates too much to " +
      "ever truly begin. The healthiest creative process starts with Fool energy (say yes to the unknown) and " +
      "then shifts to Magician energy (channel that yes into something real).",
  },
  "high-priestess-empress": {
    a: "The High Priestess",
    b: "The Empress",
    intro:
      "These two cards represent the feminine divine in its two primary expressions. The High Priestess is " +
      "the inner feminine — quiet, receptive, and connected to the subconscious and the mysteries that cannot " +
      "be spoken. The Empress is the outer feminine — abundant, creative, and connected to the physical world " +
      "of beauty, birth, and nourishment. One goes inward to know; the other goes outward to create.",
    rows: [
      ["Number", "II — The hidden", "III — The manifest"],
      ["Energy", "Intuition, mystery, stillness", "Abundance, fertility, sensuality"],
      ["Element", "Water — the subconscious", "Earth — the material world"],
      ["Lesson", "Trust your inner knowing", "Create and nurture with abandon"],
      ["Shadow", "Secrecy, disconnection", "Smothering, over-attachment"],
    ],
    insight:
      "The High Priestess knows what should be created. The Empress creates it. Intuition without action " +
      "remains a whisper; creation without intuition lacks soul. When these two energies work together, " +
      "what you make carries the depth of genuine vision.",
  },
  "emperor-hierophant": {
    a: "The Emperor",
    b: "The Hierophant",
    intro:
      "These cards represent two forms of authority: temporal and spiritual. The Emperor commands through " +
      "structure, discipline, and the force of personal will — he builds empires and defends borders. The " +
      "Hierophant teaches through tradition, lineage, and the transmission of sacred knowledge — he preserves " +
      "wisdom and guides communities. One rules; the other teaches.",
    rows: [
      ["Number", "IV — Structure and order", "V — Tradition and wisdom"],
      ["Energy", "Authority, discipline, control", "Spiritual teaching, conformity, lineage"],
      ["Element", "Fire — willpower (Aries)", "Earth — endurance (Taurus)"],
      ["Lesson", "Build with strength and fairness", "Learn from those who came before"],
      ["Shadow", "Tyranny, rigidity", "Dogma, blind conformity"],
    ],
    insight:
      "The Emperor creates the structure that civilization requires. The Hierophant fills that structure with " +
      "meaning. A society with Emperor energy but no Hierophant is powerful but soulless. A society with " +
      "Hierophant energy but no Emperor has wisdom but no vehicle to implement it.",
  },
  "lovers-chariot": {
    a: "The Lovers",
    b: "The Chariot",
    intro:
      "The Lovers presents a choice between paths — a moment where values must be examined and a commitment " +
      "must be made. The Chariot takes that commitment and drives it forward with absolute determination. " +
      "One asks you to choose wisely; the other demands you pursue your choice with everything you have.",
    rows: [
      ["Number", "VI — Choice and alignment", "VII — Willpower and victory"],
      ["Energy", "Love, union, moral choice", "Determination, direction, triumph"],
      ["Element", "Air — rational discernment (Gemini)", "Water — emotional drive (Cancer)"],
      ["Lesson", "Choose with your whole heart", "Move forward without hesitation"],
      ["Shadow", "Indecision, misalignment", "Aggression, loss of control"],
    ],
    insight:
      "The Lovers teaches that meaningful progress requires choosing one path over another — you cannot " +
      "go everywhere at once. The Chariot teaches that once the choice is made, ambivalence must end. " +
      "The most powerful moments in life combine a deeply considered choice with unwavering execution.",
  },
  "hermit-wheel": {
    a: "The Hermit",
    b: "Wheel of Fortune",
    intro:
      "A striking contrast: the Hermit withdraws from the world to seek inner truth in solitude, while the " +
      "Wheel of Fortune spins with the chaos and momentum of fate itself. One is stillness; the other is " +
      "motion. One requires you to stop; the other is happening whether you participate or not.",
    rows: [
      ["Number", "IX — Inner wisdom", "X — Cycles and fate"],
      ["Energy", "Solitude, introspection, guidance", "Change, luck, karma, turning points"],
      ["Element", "Earth — grounded wisdom (Virgo)", "Fire — dynamic change (Jupiter)"],
      ["Lesson", "The truth is found within", "Accept the turning of the wheel"],
      ["Shadow", "Isolation, avoidance", "Helplessness, resistance to change"],
    ],
    insight:
      "The Hermit's lantern is the only reliable light when the Wheel spins you into darkness. External " +
      "circumstances will always change — that is the Wheel's unchangeable law. But the wisdom you cultivate " +
      "in solitude becomes an inner compass that works regardless of where the Wheel deposits you.",
  },
  "justice-hanged-man": {
    a: "Justice",
    b: "The Hanged Man",
    intro:
      "Justice weighs actions and consequences with rational precision — cause and effect, accountability, " +
      "the law of the harvest. The Hanged Man suspends all rational categories and asks you to see the " +
      "world upside down. One demands you be accountable; the other asks you to surrender the very framework " +
      "that accountability requires.",
    rows: [
      ["Number", "XI — Truth and fairness", "XII — Surrender and perspective"],
      ["Energy", "Objectivity, law, consequences", "Letting go, sacrifice, new vision"],
      ["Element", "Air — rational balance (Libra)", "Water — emotional surrender (Neptune)"],
      ["Lesson", "Be honest and accept consequences", "Stop fighting and see differently"],
      ["Shadow", "Harshness, cold judgment", "Martyrdom, stalling"],
    ],
    insight:
      "Justice without the Hanged Man's willingness to question assumptions becomes rigid and merciless. " +
      "The Hanged Man without Justice's grounding in consequence becomes passive and aimless. The deepest " +
      "wisdom holds both: the clarity to see what is fair and the humility to know that your perspective " +
      "might be incomplete.",
  },
  "death-temperance": {
    a: "Death",
    b: "Temperance",
    intro:
      "Death and Temperance are neighbors for a reason: transformation must be followed by integration. " +
      "Death clears the ground — burning away what has served its purpose with no negotiation. Temperance " +
      "then gently blends what remains into a new, more harmonious whole. One destroys; the other heals. " +
      "Neither works without the other.",
    rows: [
      ["Number", "XIII — Endings and rebirth", "XIV — Balance and healing"],
      ["Energy", "Transformation, release, finality", "Moderation, patience, alchemy"],
      ["Element", "Water — deep emotional change (Scorpio)", "Fire — purposeful transformation (Sagittarius)"],
      ["Lesson", "Let go of what has ended", "Find the middle path"],
      ["Shadow", "Resistance to necessary endings", "Imbalance, impatience"],
    ],
    insight:
      "Death without Temperance is destruction without healing — trauma without resolution. Temperance without " +
      "Death is shallow harmony that never addresses root causes. The most profound personal growth follows " +
      "this exact sequence: something must fully end before something new and balanced can be alchemized.",
  },
  "devil-tower": {
    a: "The Devil",
    b: "The Tower",
    intro:
      "The Devil and the Tower represent the two stages of liberation from illusion. The Devil shows you the " +
      "chains — the addictions, attachments, and false beliefs that keep you imprisoned. The Tower smashes " +
      "the entire structure those chains are bolted to. One is the recognition of bondage; the other is its " +
      "violent but necessary demolition.",
    rows: [
      ["Number", "XV — Bondage and shadow", "XVI — Upheaval and revelation"],
      ["Energy", "Attachment, materialism, illusion", "Sudden change, breakthrough, destruction"],
      ["Element", "Earth — material bondage (Capricorn)", "Fire — explosive liberation (Mars)"],
      ["Lesson", "Name what controls you", "Let the false structures fall"],
      ["Shadow", "Denial, addiction deepening", "Avoidance of the inevitable"],
    ],
    insight:
      "The Devil's chains are always loose — you could remove them if you chose to. But most people do not " +
      "choose, which is why the Tower eventually arrives to remove the choice from your hands. If you can " +
      "muster the honesty the Devil demands, the Tower becomes unnecessary. If you cannot, the Tower becomes " +
      "inevitable.",
  },
  "judgement-world": {
    a: "Judgement",
    b: "The World",
    intro:
      "The Major Arcana concludes with a call to rise and a celebration of completion. Judgement sounds the " +
      "trumpet — a moment of reckoning where everything you have been, done, and learned converges into " +
      "a single question: will you answer the call to your highest self? The World is the answer: yes. " +
      "Integration, fulfillment, and the completion of a great cycle. One calls; the other arrives.",
    rows: [
      ["Number", "XX — Resurrection and calling", "XXI — Completion and wholeness"],
      ["Energy", "Self-evaluation, reckoning, rebirth", "Integration, achievement, cosmic dance"],
      ["Element", "Fire — transformative fire (Pluto)", "Earth — manifest wholeness (Saturn)"],
      ["Lesson", "Answer the call to your highest self", "Celebrate and prepare to begin again"],
      ["Shadow", "Self-doubt, avoidance of growth", "Incomplete closure, fear of endings"],
    ],
    insight:
      "The Fool began with nothing and trusted the journey. The World arrives with everything and trusts " +
      "the next cycle. Between card 0 and card 21, the entire human experience has been traveled. Every " +
      "ending contains a new beginning — the World does not close the story but rather completes one chapter " +
      "so the next can open from higher ground.",
  },

  // ── Course-aligned pairings (fools-journey lesson slugs) ──

  "strength-hermit": {
    a: "Strength",
    b: "The Hermit",
    intro:
      "After the Chariot's outward victory, the journey turns inward. Strength shows you a figure gently " +
      "closing a lion's jaws — not with force, but with patience and compassion. This is power that tames " +
      "rather than breaks. The Hermit takes that inner mastery one step further: he leaves the world entirely, " +
      "climbing the mountain with a single lantern to find the truth that noise drowns out. One card teaches " +
      "you to master your instincts; the other teaches you to listen to your own wisdom.",
    rows: [
      ["Number", "VIII — Inner power", "IX — Inner light"],
      ["Energy", "Courage, patience, gentle mastery", "Solitude, introspection, guidance"],
      ["Element", "Fire — heart-led courage (Leo)", "Earth — grounded wisdom (Virgo)"],
      ["Lesson", "Tame the lion without breaking it", "Withdraw to find your own light"],
      ["Shadow", "Self-doubt, raw aggression", "Isolation, avoidance"],
    ],
    insight:
      "Strength masters the wild parts of you; the Hermit listens to the wise parts. You cannot hear your " +
      "inner voice while wrestling your inner lion — which is why Strength comes first. Tame your impulses " +
      "with compassion, and the solitude the Hermit asks for becomes peaceful rather than restless. Together " +
      "these cards teach the quietest form of power: self-command followed by self-knowledge.",
  },
  "wheel-justice": {
    a: "Wheel of Fortune",
    b: "Justice",
    intro:
      "These two cards frame the great question of fate versus accountability. The Wheel of Fortune spins " +
      "beyond your control — luck, timing, cycles, the turning points you did not choose. Justice answers " +
      "with the sword and scales: whatever the Wheel deals, your choices still carry consequences, and truth " +
      "still cuts through. One card shows what happens to you; the other shows what you do about it.",
    rows: [
      ["Number", "X — Cycles and fate", "XI — Truth and fairness"],
      ["Energy", "Change, luck, karma, turning points", "Objectivity, law, cause and effect"],
      ["Element", "Fire — dynamic change (Jupiter)", "Air — rational balance (Libra)"],
      ["Lesson", "Accept the turning of the wheel", "Own your choices and their consequences"],
      ["Shadow", "Helplessness, resistance to change", "Harshness, cold judgment"],
    ],
    insight:
      "The Wheel governs what you cannot control; Justice governs what you can. Blaming fate for the results " +
      "of your own choices is a Justice failure. Punishing yourself for what the Wheel dealt you is a Wheel " +
      "failure. Wisdom is knowing which is which: accept the spin you were given, then answer for how you " +
      "played it.",
  },
  "hanged-man-death": {
    a: "The Hanged Man",
    b: "Death",
    intro:
      "The two hardest lessons of the Major Arcana arrive back to back. The Hanged Man suspends you upside " +
      "down — voluntarily — until the world looks different and the grip you had on your old certainties " +
      "loosens. Death then completes what the surrender began: the old form ends, fully and without " +
      "negotiation, so that something new can be born. One asks you to let go of your perspective; the other " +
      "asks you to let go of the thing itself.",
    rows: [
      ["Number", "XII — Surrender and perspective", "XIII — Endings and rebirth"],
      ["Energy", "Letting go, pause, new vision", "Transformation, release, finality"],
      ["Element", "Water — dissolving certainty (Neptune)", "Water — deep emotional change (Scorpio)"],
      ["Lesson", "Stop fighting and see differently", "Let what has ended actually end"],
      ["Shadow", "Martyrdom, stalling", "Resistance to necessary endings"],
    ],
    insight:
      "The Hanged Man is the rehearsal; Death is the performance. Surrendering your perspective prepares " +
      "you to surrender the thing itself. People who skip the Hanged Man's pause meet Death as a catastrophe; " +
      "people who have already loosened their grip meet it as a release. Neither card is punishment — both " +
      "are the price of becoming someone new, and you are allowed to pay it willingly.",
  },
  "temperance-devil": {
    a: "Temperance",
    b: "The Devil",
    intro:
      "A study in opposites: mastery of appetite versus enslavement to it. Temperance stands with one foot " +
      "on land and one in water, pouring between two cups — blending, moderating, finding the living middle " +
      "path. The Devil chains two figures to his pedestal with links loose enough to lift off — addiction, " +
      "obsession, the excess that promised pleasure and delivered bondage. One card integrates your desires; " +
      "the other is what happens when a desire integrates you.",
    rows: [
      ["Number", "XIV — Balance and healing", "XV — Bondage and shadow"],
      ["Energy", "Moderation, patience, alchemy", "Attachment, materialism, illusion"],
      ["Element", "Fire — purposeful blending (Sagittarius)", "Earth — material bondage (Capricorn)"],
      ["Lesson", "Find the middle path", "Name what controls you"],
      ["Shadow", "Imbalance, impatience", "Denial, deepening addiction"],
    ],
    insight:
      "Temperance and the Devil rule the same territory — desire — with opposite outcomes. Every appetite " +
      "you moderate stays a pleasure; every appetite you let rule becomes a chain. The Devil's chains are " +
      "always loose, and Temperance shows you exactly how to lift them off: not by renouncing what you want, " +
      "but by refusing to let any single want own you.",
  },
  "tower-star": {
    a: "The Tower",
    b: "The Star",
    intro:
      "Destruction and hope, in that order. The Tower is the lightning strike that demolishes what was built " +
      "on false foundations — sudden, shocking, and non-negotiable. The Star is what you see once the dust " +
      "settles: an open night sky, clear water, and a quiet light that says healing is possible. The Tower " +
      "clears the ground; the Star shows you it was worth clearing.",
    rows: [
      ["Number", "XVI — Upheaval and revelation", "XVII — Hope and renewal"],
      ["Energy", "Sudden change, breakthrough, collapse", "Healing, faith, quiet guidance"],
      ["Element", "Fire — explosive liberation (Mars)", "Air — visionary calm (Aquarius)"],
      ["Lesson", "Let the false structures fall", "Trust that renewal follows ruin"],
      ["Shadow", "Avoidance of the inevitable", "Despair, lost faith"],
    ],
    insight:
      "The Tower only destroys what was false; the Star only illuminates what is true. That is why they are " +
      "neighbors. If you are standing in rubble right now, look up — the Star is already out. And if life " +
      "feels suspiciously stable atop something you know is hollow, understand that the lightning is not " +
      "cruelty. It is the fastest route to the open sky.",
  },
  "moon-sun": {
    a: "The Moon",
    b: "The Sun",
    intro:
      "The final night and the full day of the Fool's Journey. The Moon pulls you through the landscape of " +
      "the subconscious — illusions, fears, half-seen shapes on a winding path between two towers. Nothing " +
      "here is quite what it seems, and that is the point: you must learn to walk without perfect visibility. " +
      "The Sun then rises on the other side with total clarity — joy, vitality, and success so unambiguous " +
      "that no interpretation is needed. One card tests your nerve in the dark; the other rewards it in full light.",
    rows: [
      ["Number", "XVIII — Illusion and the deep", "XIX — Joy and vitality"],
      ["Energy", "Fear, intuition, the subconscious", "Clarity, success, radiant confidence"],
      ["Element", "Water — the dream realm (Pisces)", "Fire — life force (the Sun)"],
      ["Lesson", "Walk through fear without full sight", "Receive joy without suspicion"],
      ["Shadow", "Anxiety, self-deception", "Naive optimism, burnout from shining"],
    ],
    insight:
      "The Moon's darkness is the tollgate to the Sun's light — there is no road around it. Everything the " +
      "Moon shows you is yours: your fears, your projections, your buried truths. Face them honestly and " +
      "the Sun that follows is unshakeable, because nothing hidden is left to eclipse it. Skip the Moon's " +
      "work and even the brightest success will feel like it could vanish at any moment.",
  },
};

// ── Three-card group ──

const THREE_CARD_GROUPS: Record<string, { cards: string[]; intro: string; insight: string }> = {
  "star-moon-sun": {
    cards: ["The Star", "The Moon", "The Sun"],
    intro:
      "After the Tower demolishes false structures, the celestial trio restores the soul. The Star offers " +
      "hope — a quiet, persistent light that says healing is possible. The Moon plunges through the " +
      "subconscious landscape of fears, illusions, and hidden truths that must be faced before clarity " +
      "can arrive. The Sun then blazes with unambiguous joy, success, and vitality. These three cards " +
      "map the complete arc of recovery: hope, shadow-work, and radiant emergence.",
    insight:
      "The Star heals, the Moon challenges, the Sun rewards. This sequence teaches that genuine happiness " +
      "(The Sun) is not cheap — it requires the patience of The Star and the courage to face The Moon's " +
      "darkness. People who skip the Moon's lessons arrive at a Sun that is shallow. Those who do the " +
      "inner work arrive at a Sun that is unshakeable.",
  },
};

// ── Suit data ──

const SUIT_INFO: Record<string, { element: string; domain: string; intro: string; cards: string[] }> = {
  wands: {
    element: "Fire",
    domain: "passion, creativity, ambition, and spiritual energy",
    intro:
      "The Suit of Wands is the fire of the tarot — it burns with passion, creativity, ambition, and raw " +
      "spiritual energy. Wands represent what drives you, what excites you, and where your creative fire " +
      "is directed. In readings, Wands often point to career ambitions, creative projects, personal growth, " +
      "and the spark of inspiration that initiates action. When Wands dominate a reading, the question is " +
      "about energy, motivation, and the will to create something meaningful.",
    cards: Array.from({ length: 14 }, (_, i) => {
      const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
      return `${names[i]} of Wands`;
    }),
  },
  cups: {
    element: "Water",
    domain: "emotions, relationships, intuition, and the inner world",
    intro:
      "The Suit of Cups is the water of the tarot — it flows through emotions, relationships, intuition, and " +
      "the depths of the inner world. Cups represent how you feel, who you love, and how your emotional life " +
      "shapes your experience. In readings, Cups often point to romantic relationships, creative inspiration " +
      "that comes from the heart, spiritual connections, and the full spectrum of human emotion from ecstasy " +
      "to grief. When Cups dominate a reading, the question is fundamentally about feelings.",
    cards: (() => {
      const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
      const courts = ["Page", "Knight", "Queen", "King"];
      return [...names.map((n) => `${n} of Cups`), ...courts.map((c) => `${c} of Cups`)];
    })(),
  },
  swords: {
    element: "Air",
    domain: "thought, conflict, truth, and the power of the mind",
    intro:
      "The Suit of Swords is the air of the tarot — it cuts through with thought, truth, conflict, and the " +
      "double-edged power of the intellect. Swords represent how you think, how you communicate, and how you " +
      "navigate conflict and difficult truths. In readings, Swords often point to mental challenges, arguments, " +
      "decisions that require clear thinking, and the pain that comes from seeing reality too clearly. Swords " +
      "are the most intense suit because the mind can be both a liberator and a tormentor.",
    cards: Array.from({ length: 14 }, (_, i) => {
      const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
      return `${names[i]} of Swords`;
    }),
  },
  pentacles: {
    element: "Earth",
    domain: "material reality, money, health, and craftsmanship",
    intro:
      "The Suit of Pentacles is the earth of the tarot — it grounds you in material reality, financial matters, " +
      "physical health, and the patient craft of building something tangible. Pentacles represent what you " +
      "have, what you are building, and how you relate to the physical world of money, work, and the body. " +
      "In readings, Pentacles often point to career developments, financial questions, health concerns, and " +
      "the slow but rewarding process of manifesting your values in the material world.",
    cards: Array.from({ length: 14 }, (_, i) => {
      const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
      return `${names[i]} of Pentacles`;
    }),
  },
};

// ── Court card ranks ──

const COURT_RANKS: Record<string, { rank: string; intro: string; insight: string; cards: string[] }> = {
  pages: {
    rank: "Page",
    intro:
      "Pages are the youngest court cards — the students, the messengers, the beginners. They carry fresh " +
      "energy and represent new starts in their suit's domain. A Page of Wands is a spark of creative " +
      "enthusiasm; a Page of Cups is a budding emotional awareness; a Page of Swords is a sharp new idea; " +
      "a Page of Pentacles is an ambitious first step in the material world. Pages can also represent " +
      "literal messages arriving in your life, or a young person who embodies the suit's energy.",
    insight:
      "Pages remind you that expertise is not required to begin. Every master was once a student, every " +
      "visionary started with one unpolished idea. When a Page appears, embrace the beginner's mind.",
    cards: ["Page of Wands", "Page of Cups", "Page of Swords", "Page of Pentacles"],
  },
  knights: {
    rank: "Knight",
    intro:
      "Knights are the action figures of the tarot — they charge forward with the energy of their suit, " +
      "sometimes brilliantly and sometimes recklessly. A Knight of Wands pursues passion with fiery " +
      "impulsiveness; a Knight of Cups follows the heart on romantic quests; a Knight of Swords charges " +
      "into intellectual battles with sharp determination; a Knight of Pentacles moves steadily and " +
      "reliably toward material goals. Knights represent the period of life when idealism meets action, " +
      "when you have energy but not yet wisdom.",
    insight:
      "Knights teach that energy without direction is chaos, and direction without energy is stagnation. " +
      "The challenge of every Knight is to harness passion with purpose — to ride hard in the right direction.",
    cards: ["Knight of Wands", "Knight of Cups", "Knight of Swords", "Knight of Pentacles"],
  },
  queens: {
    rank: "Queen",
    intro:
      "Queens represent the inward mastery of their element — they have integrated the suit's energy into " +
      "their being and wield it with confidence and grace. The Queen of Wands radiates creative confidence; " +
      "the Queen of Cups embodies emotional depth and intuitive wisdom; the Queen of Swords speaks truth " +
      "with clarity and independence; the Queen of Pentacles creates abundance and nurtures the physical " +
      "world with practical devotion. Queens do not need to prove their power — they simply embody it.",
    insight:
      "Queens teach that true mastery is not loud. It is the quiet confidence of someone who knows " +
      "their own worth, who has turned raw potential into mature capability, and who leads by presence " +
      "rather than force.",
    cards: ["Queen of Wands", "Queen of Cups", "Queen of Swords", "Queen of Pentacles"],
  },
  kings: {
    rank: "King",
    intro:
      "Kings represent the outward mastery of their element — they have not only internalized the suit's " +
      "energy but learned to direct it in the world with authority and responsibility. The King of Wands " +
      "leads with visionary ambition; the King of Cups governs the emotional realm with calm wisdom; the " +
      "King of Swords judges with intellectual authority and ethical clarity; the King of Pentacles commands " +
      "the material world with disciplined abundance. Kings represent the culmination of their suit's " +
      "developmental arc — from Page (beginner) through Knight (warrior) and Queen (inner master) to King " +
      "(outer authority).",
    insight:
      "Kings remind you that authority comes with responsibility. Every gift of power demands " +
      "corresponding accountability. The best King is the one who serves the kingdom, not the one " +
      "who serves himself.",
    cards: ["King of Wands", "King of Cups", "King of Swords", "King of Pentacles"],
  },
};

// ── Number range card grids ──

const NUMBER_RANGES: Record<string, { suit: string; range: [number, number]; title: string; intro: string }> = {
  "wands-ace-to-five": {
    suit: "Wands", range: [1, 5],
    title: "Wands: Ace through Five",
    intro: "The first five Wands trace the arc of creative fire from its initial spark to its first real test. The Ace ignites pure potential, the Two plans its direction, the Three sees early success and expansion, the Four celebrates a foundation, and the Five introduces the friction and competition that forges raw inspiration into something stronger.",
  },
  "wands-six-to-ten": {
    suit: "Wands", range: [6, 10],
    title: "Wands: Six through Ten",
    intro: "The second half of the Wands' journey moves from public recognition through struggle to the edge of completion. The Six brings victory and pride, the Seven demands you defend your position, the Eight accelerates with momentum, the Nine tests your resilience, and the Ten asks whether you can carry the weight of everything you have created.",
  },
  "cups-ace-to-five": {
    suit: "Cups", range: [1, 5],
    title: "Cups: Ace through Five",
    intro: "The first five Cups map the emotional journey from an open heart to a grieving one. The Ace overflows with new love and emotional potential, the Two deepens into partnership, the Three celebrates communal joy, the Four withdraws into contemplation, and the Five confronts loss and the pain of what has been spilled.",
  },
  "cups-six-to-ten": {
    suit: "Cups", range: [6, 10],
    title: "Cups: Six through Ten",
    intro: "The second half of the Cups' journey navigates from nostalgia through disillusionment to fulfillment. The Six revisits the past with tender memory, the Seven tempts with illusions and choices, the Eight walks away from what no longer nourishes, the Nine achieves deep contentment, and the Ten completes the emotional cycle with enduring love and harmony.",
  },
  "swords-ace-to-five": {
    suit: "Swords", range: [1, 5],
    title: "Swords: Ace through Five",
    intro: "The first five Swords cut from clarity to conflict. The Ace is a breakthrough of mental power, the Two faces an impossible decision, the Three pierces the heart with truth, the Four finds rest after mental battle, and the Five encounters the dishonorable side of conflict where winning comes at a cost.",
  },
  "swords-six-to-ten": {
    suit: "Swords", range: [6, 10],
    title: "Swords: Six through Ten",
    intro: "The second half of the Swords' journey moves from healing toward the mind's darkest territory and back out again. The Six transitions toward calmer waters, the Seven navigates deception and strategy, the Eight confronts the prison of limiting beliefs, the Nine spirals through anxiety and nightmare, and the Ten strikes rock bottom — the moment of total release that can only mean renewal.",
  },
  "pentacles-ace-to-five": {
    suit: "Pentacles", range: [1, 5],
    title: "Pentacles: Ace through Five",
    intro: "The first five Pentacles trace the material journey from golden opportunity to scarcity. The Ace plants a seed of material potential, the Two juggles resources, the Three earns recognition for craftsmanship, the Four secures what has been built, and the Five faces material hardship and the vulnerability of being without.",
  },
  "pentacles-six-to-ten": {
    suit: "Pentacles", range: [6, 10],
    title: "Pentacles: Six through Ten",
    intro: "The second half of the Pentacles' journey builds from generosity to lasting legacy. The Six shares wealth and restores balance, the Seven waits patiently for the harvest, the Eight dedicates itself to mastering a craft, the Nine luxuriates in well-earned abundance, and the Ten establishes a legacy that endures across generations.",
  },
};

// ── Main generator ──

export function generateTarotContent(lessonSlug: string, locale: string = "en"): LessonContent | null {
  // Card pairs
  const pair = CARD_PAIRS[lessonSlug];
  if (pair) {
    return buildPairLesson(pair.a, pair.b, pair.intro, pair.rows, pair.insight, 10);
  }

  // Three-card groups
  const group = THREE_CARD_GROUPS[lessonSlug];
  if (group) {
    const sections: ContentSection[] = [
      text("The Celestial Trio", group.intro),
      ...group.cards.map((c) => cardDisplay(c)),
      callout("insight", group.insight),
    ];
    return { sections, estimatedMinutes: 12, keyTakeaway: group.insight.split(". ")[0] + "." };
  }

  // Major Arcana journey overview
  if (lessonSlug === "major-arcana-journey") {
    const majorNames = ALL_CARDS.filter((c) => c.arcana === "major").map((c) => c.name);
    const sections: ContentSection[] = [
      text(
        "The Fool's Journey: 22 Steps of the Soul",
        "The 22 Major Arcana cards tell a single, coherent story — the journey of the human soul from " +
        "innocent potential (The Fool) through every fundamental life experience to integrated wholeness " +
        "(The World). This narrative is sometimes called the Fool's Journey because it follows card 0 (The " +
        "Fool) as it encounters each archetype in sequence. Every human life walks some version of this " +
        "path: from innocence to experience, through crisis and transformation, toward wisdom and completion. " +
        "The Major Arcana are the big themes of life — the cards that appear when something truly significant " +
        "is at work."
      ),
      { type: "fools-journey" },
      cardGrid(majorNames),
      text(
        "Three Acts of the Journey",
        "The Major Arcana can be divided into three acts. Cards 0-7 (The Fool through The Chariot) cover " +
        "the development of the conscious self — identity, authority, choice, and willpower. Cards 8-14 " +
        "(Strength through Temperance) cover the development of the soul — inner power, solitude, surrender, " +
        "transformation, and balance. Cards 15-21 (The Devil through The World) cover the encounter with " +
        "cosmic forces — bondage, destruction, hope, illusion, clarity, resurrection, and wholeness."
      ),
      { type: "tarot-reveal", cardName: "The Fool" },
      callout(
        "insight",
        "When multiple Major Arcana appear in a reading, pay close attention. These are not everyday " +
        "concerns — they are the soul's deep curriculum. The Minor Arcana handle the details of daily " +
        "life; the Majors handle the meaning of that life.",
      ),
    ];
    return {
      sections,
      estimatedMinutes: 10,
      keyTakeaway: "The 22 Major Arcana map the complete journey of the soul from innocence to wholeness.",
    };
  }

  // Number range grids
  const range = NUMBER_RANGES[lessonSlug];
  if (range) {
    const suitLower = range.suit.toLowerCase();
    const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
    const cards = [];
    for (let i = range.range[0]; i <= range.range[1]; i++) {
      cards.push(`${names[i - 1]} of ${range.suit}`);
    }
    const sections: ContentSection[] = [
      text(range.title, range.intro),
      cardGrid(cards),
      callout(
        "tip",
        `As you study each card, notice the narrative progression. The ${suitLower} tell a story — ` +
        "each card builds on the one before it, and the tension rises through the numbered sequence " +
        "just as it would in a well-crafted novel.",
      ),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: `The ${range.suit} ${names[range.range[0] - 1]} through ${names[range.range[1] - 1]} trace a narrative arc within the suit's element.`,
    };
  }

  // Court card ranks
  const court = COURT_RANKS[lessonSlug];
  if (court) {
    const sections: ContentSection[] = [
      text(`The Four ${court.rank}s`, court.intro),
      cardGrid(court.cards),
      callout("insight", court.insight),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: court.insight.split(". ")[0] + ".",
    };
  }

  // Full suit overviews
  const suitSlugMatch = lessonSlug.match(/^suit-of-(wands|cups|swords|pentacles)$/);
  if (suitSlugMatch) {
    const suitKey = suitSlugMatch[1];
    const suit = SUIT_INFO[suitKey];
    if (suit) {
      const sections: ContentSection[] = [
        text(
          `The Suit of ${suitKey.charAt(0).toUpperCase() + suitKey.slice(1)}`,
          suit.intro,
        ),
        cardGrid(suit.cards),
        callout(
          "tip",
          `${suit.element} energy runs through every card in this suit. As you study them, notice how ` +
          `the element of ${suit.element} manifests differently at each stage — from the raw potential ` +
          "of the Ace through the mastery of the King.",
        ),
      ];
      return {
        sections,
        estimatedMinutes: 8,
        keyTakeaway: `The Suit of ${suitKey.charAt(0).toUpperCase() + suitKey.slice(1)} (${suit.element}) governs ${suit.domain}.`,
      };
    }
  }

  // Upright vs. reversed concept
  if (lessonSlug === "upright-vs-reversed") {
    const sections: ContentSection[] = [
      text(
        "Upright vs. Reversed: Two Sides of Every Card",
        "When a tarot card appears upside down in a reading, it is called 'reversed.' Reversed cards are " +
        "one of the most debated topics in tarot. Some readers use them; others do not. Neither approach is " +
        "wrong — it is a matter of personal practice. But for those who do use reversals, they add a crucial " +
        "dimension of nuance to every reading."
      ),
      text(
        "What a Reversal Does NOT Mean",
        "A reversed card is not simply the opposite of its upright meaning. Death reversed does not mean " +
        "'no transformation.' The Sun reversed does not mean misery. A reversal is better understood as the " +
        "card's energy turned inward, blocked, excessive, or delayed. It is the same archetype operating " +
        "under different conditions — like a lamp that is still plugged in but covered with a cloth."
      ),
      text(
        "Common Reversal Interpretations",
        "There are several valid ways to read a reversed card. The energy may be internalized — The Emperor " +
        "reversed could mean you are being authoritative with yourself rather than in the world. The energy " +
        "may be blocked — the Three of Cups reversed could mean celebration is being prevented by " +
        "circumstances. The energy may be excessive — the Seven of Wands reversed could mean you are being " +
        "too defensive. Or the energy may be in its early or declining phase — just beginning to manifest or " +
        "just finishing its expression."
      ),
      callout(
        "tip",
        "If you are new to tarot, consider learning the upright meanings thoroughly before adding reversals. " +
        "A solid foundation in the 78 upright meanings gives you the depth needed to interpret reversals " +
        "intuitively rather than mechanically.",
      ),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: "Reversed cards represent the same energy turned inward, blocked, excessive, or delayed — not simply the opposite.",
    };
  }

  return null;
}
