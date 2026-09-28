/**
 * Five ways to read two cards together (canon Unit 8), phrased for one pair.
 * Card names stay in the nominative in Ukrainian (after a dash or a colon) so
 * no template has to decline a card's name.
 */

import type { pairFacts } from "./card-facts";

type Facts = ReturnType<typeof pairFacts>;
type Locale = "en" | "uk";

export interface PairLens {
  id: "story" | "contrast" | "colour" | "bridge" | "structure";
  title: string;
  prompt: string;
}

const SUIT = {
  en: { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" },
  uk: { wands: "Жезли", cups: "Кубки", swords: "Мечі", pentacles: "Пентаклі" },
} as const;
const ELEMENT = {
  en: { fire: "Fire", water: "Water", air: "Air", earth: "Earth" },
  uk: { fire: "Вогонь", water: "Вода", air: "Повітря", earth: "Земля" },
} as const;

export interface PairContext {
  nameA: string;
  nameB: string;
  suitA?: string | null;
  elementA?: string | null;
  elementB?: string | null;
  number?: number | null;
  sharedNames: string[];
}

export function structureLine(facts: Facts, ctx: PairContext, locale: Locale): string {
  const en = locale === "en";
  if (facts.sameNumber) return en
    ? `Both cards carry the number ${ctx.number}: one idea met in two suits. What does each suit do with it?`
    : `Обидві карти мають число ${ctx.number}: одна ідея в двох мастях. Що кожна масть робить із нею?`;
  if (facts.sameCourt) return en
    ? "The same court rank in two elements: one way of acting, two temperaments."
    : "Один придворний ранг у двох стихіях: той самий спосіб діяти, два різні темпераменти.";
  if (facts.sameSuit && ctx.suitA) return en
    ? `Both are ${SUIT.en[ctx.suitA as keyof typeof SUIT.en]}: two steps of one suit. Which comes first in the sequence, and what lies between them?`
    : `Обидві карти — ${SUIT.uk[ctx.suitA as keyof typeof SUIT.uk]}: два кроки однієї масті. Яка з них раніша в послідовності і що лежить між ними?`;
  if (facts.bothMajor) return en
    ? "Two Major Arcana: two large themes side by side. Which one is the ground, and which the movement?"
    : "Дві карти Старших Арканів: дві великі теми поруч. Яка з них — ґрунт, а яка — рух?";
  if (facts.majorWithMinor) return en
    ? "A Major and a Minor: the Major can name the theme, the Minor shows where it turns up in ordinary days."
    : "Старший і Молодший аркан: Старший може назвати тему, а Молодший — показати, де вона з’являється в буденних днях.";
  if (facts.elements === "contrary" && ctx.elementA && ctx.elementB) return en
    ? `${ELEMENT.en[ctx.elementA as keyof typeof ELEMENT.en]} and ${ELEMENT.en[ctx.elementB as keyof typeof ELEMENT.en]}: contrary elements in the Golden Dawn lens, often read as friction worth working with.`
    : `${ELEMENT.uk[ctx.elementA as keyof typeof ELEMENT.uk]} і ${ELEMENT.uk[ctx.elementB as keyof typeof ELEMENT.uk]}: протилежні стихії в системі Золотої Зорі; це тертя часто читають як таке, з яким варто працювати.`;
  return en
    ? "Different suits and numbers: here the link lives in the images and in your question."
    : "Різні масті й числа: тут зв’язок живе в зображеннях і у вашому запитанні.";
}

export function pairLenses(facts: Facts, ctx: PairContext, locale: Locale): PairLens[] {
  const { nameA: A, nameB: B } = ctx;
  const en = locale === "en";
  const shared = ctx.sharedNames.join("; ");
  return [
    { id: "story", title: en ? "Story" : "Історія", prompt: en
      ? `Read ${A} first, then ${B}, as two scenes of one story. What changes between them?`
      : `Прочитайте їх як дві сцени однієї історії: спершу — ${A}, потім — ${B}. Що змінюється між ними?` },
    { id: "contrast", title: en ? "Contrast" : "Контраст", prompt: en
      ? `Where do ${A} and ${B} pull in different directions, and what does each ask of you?`
      : `Де ці дві карти тягнуть у різні боки — ${A} і ${B}? Чого просить кожна з них?` },
    { id: "colour", title: en ? "One colours the other" : "Одна забарвлює іншу", prompt: en
      ? `Let ${B} describe the way of ${A}, as an adjective describes a noun. Then swap them.`
      : `Нехай одна карта описує, яким чином діє інша, як прикметник описує іменник: ${B} — про те, як проявляється ${A}. Потім поміняйте їх місцями.` },
    { id: "bridge", title: en ? "A shared symbol" : "Спільний символ", prompt: shared
      ? (en ? `The same symbol is carved on both: ${shared}. Follow it from one image to the other: what stays the same, what changes?` : `Той самий символ вирізьблено на обох картах: ${shared}. Простежте його від одного зображення до іншого: що лишається, а що змінюється?`)
      : (en ? "No carved symbol is shared here. Look for a gesture, a direction or a colour the two images have in common." : "Спільного вирізьбленого символу тут немає. Пошукайте жест, напрям руху чи колір, спільний для обох зображень.") },
    { id: "structure", title: en ? "Number, suit and element" : "Число, масть і стихія", prompt: structureLine(facts, ctx, locale) },
  ];
}
