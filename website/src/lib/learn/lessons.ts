/**
 * "Learn to read": five paths of lessons in reading craft, after single card
 * meanings. Lessons are JSON files in ./lessons (indexed by
 * scripts/academy-leaves-index.mjs); the paths and their order live here.
 */

import { LESSON_FILES } from "./lessons/index";

export type Locale = "en" | "uk";

export type ToolId =
  | "question-lab" | "pin-walk" | "position-prism" | "survey-demo" | "sentence"
  | "worked-readings" | "pair-drill" | "deck-table" | "court-council" | "return";

export interface LessonText {
  title: string;
  dek: string;
  minutes: number;
  sections: { heading: string; body: string[] }[];
  example: { heading: string; cards: number[]; body: string[] };
  tryThis: { heading: string; steps: string[] };
  remember: string[];
}

export interface Lesson {
  slug: string;
  path: PathId;
  order: number;
  tool: ToolId | null;
  cards: number[];
  en: LessonText;
  uk: LessonText;
}

export type PathId = "asking" | "spreads" | "combinations" | "practice" | "history";

export interface LearnPath {
  id: PathId;
  en: { title: string; lead: string };
  uk: { title: string; lead: string };
}

export const PATHS: LearnPath[] = [
  { id: "asking",
    en: { title: "Asking and looking", lead: "Before any spread: how to ask a question the cards can meet, and how to look at an image before deciding what it means." },
    uk: { title: "Запитувати й дивитися", lead: "Перед будь-яким розкладом: як поставити запитання, на яке карти можуть відповісти, і як роздивитися зображення, перш ніж вирішувати, що воно означає." } },
  { id: "spreads",
    en: { title: "Reading a spread", lead: "How a position changes a card, how to see the whole before the parts, and how to say what a spread is about in one sentence." },
    uk: { title: "Як читати розклад", lead: "Як позиція змінює карту, як побачити ціле раніше за частини і як одним реченням сказати, про що розклад." } },
  { id: "combinations",
    en: { title: "Cards in conversation", lead: "Pairs, numbers, suits, courts and elements: the ways cards speak to each other." },
    uk: { title: "Карти в розмові", lead: "Пари, числа, масті, придворні карти й стихії: як карти говорять між собою." } },
  { id: "practice",
    en: { title: "Your practice", lead: "Returning to readings, noticing repeats, reading for others with care, and designing your own spreads." },
    uk: { title: "Ваша практика", lead: "Як повертатися до читань, помічати повтори, читати для інших із турботою та складати власні розклади." } },
  { id: "history",
    en: { title: "Where tarot comes from", lead: "An honest history: a Renaissance card game, the occult revival, the Golden Dawn, and the decks that shaped modern reading." },
    uk: { title: "Звідки походить Таро", lead: "Чесна історія: карткова гра доби Відродження, окультне відродження, Золота Зоря та колоди, що сформували сучасне читання." } },
];

const LESSONS: Lesson[] = (LESSON_FILES as unknown as Lesson[])
  .filter((lesson) => lesson.en)
  .sort((a, b) => PATHS.findIndex((p) => p.id === a.path) - PATHS.findIndex((p) => p.id === b.path) || a.order - b.order);

/** Lessons written in this language, in path order. */
export function allLessons(locale: Locale): Lesson[] {
  return LESSONS.filter((lesson) => lesson[locale]);
}

export function lessonsInPath(path: PathId, locale: Locale): Lesson[] {
  return allLessons(locale).filter((lesson) => lesson.path === path);
}

export function findLesson(path: string, slug: string, locale: Locale): Lesson | undefined {
  return allLessons(locale).find((lesson) => lesson.path === path && lesson.slug === slug);
}

export function lessonHref(lesson: Pick<Lesson, "path" | "slug">, locale: Locale): string {
  return `${locale === "uk" ? "/uk" : ""}/learn/${lesson.path}/${lesson.slug}/`;
}

export function learnHome(locale: Locale): string {
  return locale === "uk" ? "/uk/learn/" : "/learn/";
}
