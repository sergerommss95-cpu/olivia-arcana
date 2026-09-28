// Look at the whole: the structural facts of a spread (Majors, suits, numbers,
// courts, reversals, shared symbols) with honest odds for a random draw from the
// 78-card deck. Patterns become questions, never signs. Shared by the reading
// experience, the lessons and the reading service's prompt.
import { cardFacts, SUITS, COMMON_SYMBOL_KEYS } from "./card-facts.js";

const NOTABLE = 1 / 8;
const MAX_NOTABLE = 2;

const binomial = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

/** Number of ways to pick `n` cards where each group of `size` cards contributes at most `cap`. */
function boundedWays(groups, n) {
  // groups: [{size, cap}]; returns count of n-subsets respecting caps.
  let ways = new Array(n + 1).fill(0);
  ways[0] = 1;
  for (const { size, cap } of groups) {
    const next = new Array(n + 1).fill(0);
    for (let taken = 0; taken <= n; taken++) {
      if (!ways[taken]) continue;
      for (let j = 0; j <= Math.min(cap, size) && taken + j <= n; j++) next[taken + j] += ways[taken] * binomial(size, j);
    }
    ways = next;
  }
  return ways[n];
}

/** Probabilities for a random n-card draw (no replacement). */
export function baseRates(n) {
  const total = binomial(78, n);
  const atLeast = (k, of) => { let p = 0; for (let j = k; j <= n; j++) p += binomial(of, j) * binomial(78 - of, n - j); return p / total; };
  const atMost = (k, of) => { let p = 0; for (let j = 0; j <= Math.min(k, n); j++) p += binomial(of, j) * binomial(78 - of, n - j); return p / total; };
  return {
    majorsExpected: (n * 22) / 78,
    majorsAtLeast: (k) => atLeast(k, 22),
    majorsAtMost: (k) => atMost(k, 22),
    courtsAtLeast: (k) => atLeast(k, 16),
    /** Some suit shows at least k cards. */
    anySuitAtLeast: (k) => 1 - boundedWays([...SUITS.map(() => ({ size: 14, cap: k - 1 })), { size: 22, cap: 22 }], n) / total,
    /** A particular suit is missing. */
    namedSuitAbsent: binomial(64, n) / total,
    /** Some number (Ace–Ten) appears on at least k number cards. */
    anyNumberAtLeast: (k) => 1 - boundedWays([...Array.from({ length: 10 }, () => ({ size: 4, cap: k - 1 })), { size: 38, cap: 38 }], n) / total,
    reversedAtLeast: (k) => { let p = 0; for (let j = k; j <= n; j++) p += binomial(n, j); return p / 2 ** n; },
  };
}

const ONE_IN = (p) => Math.max(2, Math.round(1 / p));

const COPY = {
  en: {
    suit: { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" },
    suitQuality: { wands: "desire, energy and initiative", cups: "feeling and connection", swords: "thought, words and decisions", pentacles: "body, work, money and time" },
    ordinary: "ordinary in a random draw",
    rare: (p) => `about 1 in ${ONE_IN(p)} random draws`,
    majors: (k, n, e) => `Major Arcana: ${k} of ${n} (about ${e.toFixed(1)} expected)`,
    majorsMany: "Several large themes: what is this question really about?",
    majorsNone: "No Major Arcana: the question lives at the scale of choices within direct reach.",
    majorsSome: "The large themes sit beside the everyday ones.",
    suitStrong: (s, k) => `${s}: ${k} cards`,
    suitStrongAsk: (quality) => `Much of this is being lived through ${quality}. Is that where the question really sits?`,
    absent: (list) => `No ${list}`,
    absentAsk: (s, quality) => s === "cups" ? "Where are feelings in how you are thinking about this?" : `Where do ${quality} come into this?`,
    number: (num, k) => `The number ${num} on ${k} cards`,
    numberAsk: "One idea met in several suits: what do these cards share?",
    courts: (k) => `Court cards: ${k}`,
    courtsAsk: "Several ways of acting are in play: which do you use most, and which is missing?",
    reversed: (k, n) => `Reversed: ${k} of ${n}`,
    reversedAsk: "Much of this may be inward, held back or still forming.",
    echo: (name) => `A shared symbol: ${name}`,
    echoAsk: "Follow it from card to card: what stays, what changes?",
    and: "or",
  },
  uk: {
    suit: { wands: "Жезлів", cups: "Кубків", swords: "Мечів", pentacles: "Пентаклів" },
    suitName: { wands: "Жезли", cups: "Кубки", swords: "Мечі", pentacles: "Пентаклі" },
    suitQuality: { wands: "бажання, енергія й ініціатива", cups: "почуття й близькість", swords: "думки, слова й рішення", pentacles: "тіло, робота, гроші й час" },
    ordinary: "звичайно для випадкового розкладу",
    rare: (p) => `приблизно 1 з ${ONE_IN(p)} випадкових розкладів`,
    majors: (k, n, e) => `Старші Аркани: ${k} з ${n} (очікувано близько ${e.toFixed(1).replace(".", ",")})`,
    majorsMany: "Кілька великих тем: про що насправді це запитання?",
    majorsNone: "Жодного Старшого аркана: запитання живе на рівні рішень, які у вас під рукою.",
    majorsSome: "Великі теми стоять поруч із буденними.",
    suitStrong: (s, k) => `${s}: карт — ${k}`,
    suitStrongAsk: (quality) => `Багато з цього проживається через таке: ${quality}. Чи справді запитання саме там?`,
    absent: (list) => `Немає ${list}`,
    absentAsk: (s, quality) => s === "cups" ? "Де почуття в тому, як ви думаєте про це?" : `Де в цьому місце для такого: ${quality}?`,
    number: (num, k) => `Число ${num} на картах: ${k}`,
    numberAsk: "Одна ідея в кількох мастях: що спільного в цих карт?",
    courts: (k) => `Придворних карт: ${k}`,
    courtsAsk: "Тут діє кілька способів поводитися: яким ви користуєтеся найчастіше, а якого бракує?",
    reversed: (k, n) => `У перевернутому положенні: ${k} з ${n}`,
    reversedAsk: "Можливо, багато з цього звернене всередину, стримане або ще формується.",
    echo: (name) => `Спільний символ: ${name}`,
    echoAsk: "Простежте його від карти до карти: що лишається, а що змінюється?",
    and: "чи",
  },
};

/**
 * @param {{id:number, reversed?:boolean}[]} cards  in spread order
 * @param {{locale?:"en"|"uk", reversals?:boolean, symbols?:(id:number)=>{key:string,name:string}[]}} options
 * @returns {{facts:{id:string, label:string, odds:string, notable:boolean, ask:string, p:number}[], counts:object}}
 */
export function surveySpread(cards, { locale = "en", reversals = false, symbols } = {}) {
  const c = COPY[locale === "uk" ? "uk" : "en"];
  const n = cards.length;
  if (n < 2) return { facts: [], counts: {} };
  const rates = baseRates(n);
  const facts = cards.map((card) => ({ ...cardFacts(card.id), reversed: Boolean(card.reversed) }));
  const majors = facts.filter((f) => f.arcana === "major").length;
  const suitCounts = Object.fromEntries(SUITS.map((s) => [s, facts.filter((f) => f.suit === s).length]));
  const courts = facts.filter((f) => f.court).length;
  const numberCounts = {};
  for (const f of facts) if (f.number !== null && f.arcana === "minor") numberCounts[f.number] = (numberCounts[f.number] || 0) + 1;
  const reversed = facts.filter((f) => f.reversed).length;
  const out = [];
  const odds = (p) => (p <= NOTABLE ? c.rare(p) : c.ordinary);

  // Majors: judge the tail the count sits in.
  const expected = rates.majorsExpected;
  const pMajors = majors >= expected ? rates.majorsAtLeast(majors) : rates.majorsAtMost(majors);
  out.push({ id: "majors", label: c.majors(majors, n, expected), p: pMajors, odds: odds(pMajors),
    ask: majors === 0 ? c.majorsNone : majors >= Math.max(2, expected * 1.6) ? c.majorsMany : c.majorsSome });

  // A dominant suit.
  const top = SUITS.reduce((a, b) => (suitCounts[b] > suitCounts[a] ? b : a));
  if (suitCounts[top] >= 2 && suitCounts[top] >= Math.ceil(n / 3)) {
    const p = rates.anySuitAtLeast(suitCounts[top]);
    out.push({ id: "suit", label: c.suitStrong(locale === "uk" ? c.suitName[top] : c.suit[top], suitCounts[top]), p, odds: odds(p), ask: c.suitStrongAsk(c.suitQuality[top]) });
  }

  // Missing suits (only worth a line in larger spreads, where absence is less expected).
  if (n >= 5) {
    const missing = SUITS.filter((s) => suitCounts[s] === 0);
    if (missing.length) {
      const p = rates.namedSuitAbsent;
      out.push({ id: "absent", label: c.absent(missing.map((s) => c.suit[s]).join(` ${c.and} `)), p, odds: odds(p), ask: c.absentAsk(missing[0], c.suitQuality[missing[0]]) });
    }
  }

  // Repeated numbers.
  const repeated = Object.entries(numberCounts).filter(([, k]) => k >= 2).sort((a, b) => b[1] - a[1]);
  if (repeated.length) {
    const [num, k] = repeated[0];
    const p = rates.anyNumberAtLeast(k);
    out.push({ id: "number", label: c.number(num, k), p, odds: odds(p), ask: c.numberAsk });
  }

  // Courts.
  if (courts >= 2) {
    const p = rates.courtsAtLeast(courts);
    out.push({ id: "courts", label: c.courts(courts), p, odds: odds(p), ask: c.courtsAsk });
  }

  // Reversals (only when the reader draws them).
  if (reversals && reversed > n / 2) {
    const p = rates.reversedAtLeast(reversed);
    out.push({ id: "reversed", label: c.reversed(reversed, n), p, odds: odds(p), ask: c.reversedAsk });
  }

  // Echoes: a carved symbol on two or more cards (rare symbols only).
  if (symbols) {
    const seen = new Map();
    cards.forEach((card) => {
      for (const s of symbols(card.id)) {
        if (COMMON_SYMBOL_KEYS.has(s.key)) continue;
        if (!seen.has(s.key)) seen.set(s.key, { key: s.key, name: s.name, cards: new Set() });
        seen.get(s.key).cards.add(card.id);
      }
    });
    const echo = [...seen.values()].filter((v) => v.cards.size >= 2).sort((a, b) => b.cards.size - a.cards.size)[0];
    if (echo) out.push({ id: "echo", key: echo.key, label: c.echo(echo.name.toLowerCase()), p: 1, odds: "", ask: c.echoAsk, cards: [...echo.cards] });
  }

  // At most two patterns are called out as worth noticing; the rest read as ordinary.
  const notable = out.filter((f) => f.p <= NOTABLE).sort((a, b) => a.p - b.p).slice(0, MAX_NOTABLE);
  for (const f of out) {
    f.notable = notable.includes(f);
    if (f.p <= NOTABLE && !f.notable) f.odds = c.ordinary;
  }
  return { facts: out, counts: { n, majors, suitCounts, courts, numberCounts, reversed } };
}
