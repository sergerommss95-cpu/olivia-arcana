/**
 * search/index.ts — Global search index + scorer for the Cmd+K palette
 *
 * Aggregates every navigable concept on the site into a flat list of
 * `SearchItem`s, then scores them against a user query.
 *
 * Categories indexed:
 *   - page        (top-level pages: /academy, /daily, /cosmos, etc.)
 *   - sign        (12 zodiac signs → /signs/[sign])
 *   - card        (78 tarot cards → /academy/tarot-encyclopedia/?card=<slug>)
 *   - course      (14 courses → /academy/[course])
 *   - lesson      (all lessons → /academy/[course]/#lesson-<slug>)
 *   - planet      (10 planets → /academy/celestial-players)
 *   - house       (12 houses → /academy/the-twelve-houses)
 *   - aspect      (entry point → /academy/aspect-guide)
 *
 * The index is built once per locale and memoized. Scoring is a lightweight
 * subsequence match with exact/prefix/word-start boosts — no fuzzy dep.
 */

import { SIGN_PAGES } from "@/lib/sign-data";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { COURSES } from "@/lib/academy/courses";
import { PLANET_MEANING, HOUSE_MEANING } from "@/lib/planet-interpretations";
import { translateCourses } from "@/lib/academy/translate-courses";
import type { Locale, Translations } from "@/lib/i18n/translations";

export type SearchCategory =
  | "page"
  | "sign"
  | "card"
  | "course"
  | "lesson"
  | "planet"
  | "house"
  | "aspect";

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  haystack: string; // lowercase concatenated text used for matching
  href: string;
  category: SearchCategory;
  icon?: string;
  meta?: string; // short tag (e.g. "Major Arcana", "Fire · Cardinal")
}

// Keys for primary pages — each entry resolves label via t() at build time.
// The t() helper falls back gracefully to English for missing keys.
type TFn = (key: keyof Translations) => string;

function slugifyCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the /, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugifySignName(name: string): string {
  return name.toLowerCase();
}

function lower(s: string): string {
  return s.toLowerCase();
}

function pagesIndex(t: TFn): SearchItem[] {
  // Tuples: [id, titleKey, fallbackTitle, subtitle, href, icon]
  const entries: [string, string, string, string, string, string][] = [
    ["home", "", "Home", "Olivia Arcana — the cosmic home", "/", "\u2726"],
    ["academy", "nav_academy", "Academy", "Courses, lessons, and encyclopedia", "/academy", "\u2699"],
    ["portrait", "nav_portrait", "Portrait", "Your celestial portrait", "/portrait", "\u2605"],
    ["cosmos", "nav_cosmos", "Cosmos", "Live cosmic sky", "/cosmos", "\u2734"],
    ["daily", "nav_daily", "Daily", "Today's horoscope", "/daily", "\u263D"],
    ["signs", "", "Zodiac Signs", "Browse all 12 signs", "/signs", "\u2648"],
    ["chart", "", "Birth Chart", "Your natal chart", "/chart", "\u2641"],
    ["transits", "", "Transits", "Current planetary transits", "/transits", "\u260A"],
    ["synastry", "", "Synastry", "Relationship compatibility", "/synastry", "\u269A"],
    ["timing", "", "Life Timing", "Personal timing and cycles", "/timing", "\u23F3"],
    ["journal", "", "Journal", "Cosmic journal and prompts", "/journal", "\u270E"],
    ["ask", "", "Ask the Stars", "Ask a cosmic question", "/ask", "\u2753"],
    ["oracle", "", "Oracle", "Oracle readings", "/oracle", "\u265E"],
    ["card-of-day", "", "Card of the Day", "Daily tarot draw", "/academy/card-of-the-day", "\u2726"],
    ["encyclopedia", "", "Tarot Encyclopedia", "Browse all 78 cards", "/academy/tarot-encyclopedia", "\u2605"],
    ["aspect-guide", "", "Aspect Guide", "Planetary aspects explained", "/academy/aspect-guide", "\u269B"],
    ["story", "", "Story", "Olivia's story", "/story", "\u2735"],
    ["profile", "nav_profile", "My Profile", "Your account", "/profile", "\u25C6"],
  ];

  return entries.map(([id, titleKey, fallback, subtitle, href, icon]) => {
    const title = titleKey ? t(titleKey as keyof Translations) || fallback : fallback;
    return {
      id: `page:${id}`,
      title,
      subtitle,
      haystack: lower(`${title} ${fallback} ${subtitle} ${href}`),
      href,
      category: "page",
      icon,
    } as SearchItem;
  });
}

function signsIndex(): SearchItem[] {
  return Object.entries(SIGN_PAGES).map(([slug, sign]) => {
    const meta = `${sign.element} \u00B7 ${sign.modality}`;
    const subtitle = `${sign.dateRange} \u00B7 ${sign.motto}`;
    return {
      id: `sign:${slug}`,
      title: sign.name,
      subtitle,
      haystack: lower(
        `${sign.name} ${slug} ${sign.glyph} ${sign.element} ${sign.modality} ${sign.ruler} ${sign.motto} ${sign.dateRange} ${sign.tarotCard}`,
      ),
      href: `/signs/${slugifySignName(sign.name)}`,
      category: "sign",
      icon: sign.glyph,
      meta,
    } as SearchItem;
  });
}

function cardsIndex(): SearchItem[] {
  return ALL_CARDS.map((card) => {
    const slug = slugifyCardName(card.name);
    const meta =
      card.arcana === "major"
        ? `Major Arcana \u00B7 ${card.number}`
        : `${(card.suit ?? "").charAt(0).toUpperCase() + (card.suit ?? "").slice(1)} \u00B7 ${card.element}`;
    return {
      id: `card:${slug}`,
      title: card.name,
      subtitle: card.keywords.slice(0, 3).join(" \u00B7 "),
      haystack: lower(
        `${card.name} ${slug} ${card.arcana} ${card.suit ?? ""} ${card.keywords.join(" ")} ${card.astrology} ${card.element}`,
      ),
      href: `/academy/tarot-encyclopedia/?card=${slug}`,
      category: "card",
      icon: card.arcana === "major" ? "\u2726" : "\u2605",
      meta,
    } as SearchItem;
  });
}

function coursesAndLessonsIndex(locale: Locale): { courses: SearchItem[]; lessons: SearchItem[] } {
  const localized = translateCourses(COURSES, locale);
  const courses: SearchItem[] = [];
  const lessons: SearchItem[] = [];

  for (const c of localized) {
    courses.push({
      id: `course:${c.slug}`,
      title: c.title,
      subtitle: c.subtitle || c.description.slice(0, 80),
      haystack: lower(`${c.title} ${c.subtitle} ${c.description} ${c.track} ${c.level} ${c.topics.join(" ")}`),
      href: `/academy/${c.slug}`,
      category: "course",
      icon: c.icon,
      meta: `${c.track.charAt(0).toUpperCase() + c.track.slice(1)} \u00B7 ${c.level}`,
    });

    for (const l of c.lessons) {
      lessons.push({
        id: `lesson:${c.slug}:${l.slug}`,
        title: l.title,
        subtitle: l.description,
        haystack: lower(`${l.title} ${l.description} ${l.type} ${c.title} ${c.topics.join(" ")}`),
        href: `/academy/${c.slug}/#lesson-${l.slug}`,
        category: "lesson",
        icon: "\u25C7",
        meta: `${c.title} \u00B7 ${l.duration}m`,
      });
    }
  }

  return { courses, lessons };
}

function planetsIndex(): SearchItem[] {
  const glyph: Record<string, string> = {
    Sun: "\u2609", Moon: "\u263D", Mercury: "\u263F", Venus: "\u2640",
    Mars: "\u2642", Jupiter: "\u2643", Saturn: "\u2644", Uranus: "\u2645",
    Neptune: "\u2646", Pluto: "\u2647",
  };
  return Object.entries(PLANET_MEANING).map(([planet, meaning]) => ({
    id: `planet:${planet.toLowerCase()}`,
    title: planet,
    subtitle: meaning,
    haystack: lower(`${planet} ${meaning}`),
    href: `/academy/celestial-players`,
    category: "planet",
    icon: glyph[planet] ?? "\u26AB",
  }));
}

function housesIndex(): SearchItem[] {
  return Object.entries(HOUSE_MEANING).map(([num, h]) => ({
    id: `house:${num}`,
    title: `House ${num} \u2014 ${h.area}`,
    subtitle: h.rules,
    haystack: lower(`house ${num} ${h.area} ${h.rules}`),
    href: `/chart`,
    category: "house",
    icon: "\u2302",
    meta: `${num}th house`,
  }));
}

// ─── Public API ───────────────────────────────────────────────────────────

const INDEX_CACHE: Partial<Record<Locale, SearchItem[]>> = {};

export function buildSearchIndex(t: TFn, locale: Locale): SearchItem[] {
  const cached = INDEX_CACHE[locale];
  if (cached) return cached;

  const { courses, lessons } = coursesAndLessonsIndex(locale);
  const all = [
    ...pagesIndex(t),
    ...signsIndex(),
    ...cardsIndex(),
    ...courses,
    ...lessons,
    ...planetsIndex(),
    ...housesIndex(),
  ];
  INDEX_CACHE[locale] = all;
  return all;
}

export function invalidateSearchCache(): void {
  (Object.keys(INDEX_CACHE) as Locale[]).forEach((k) => delete INDEX_CACHE[k]);
}

/**
 * Score a single item against a query.
 * Higher = better. 0 means no match.
 * Heuristic: title matches beat haystack matches; prefix beats mid-word; word-start
 * beats mid-word; exact beats prefix beats substring.
 */
function scoreItem(item: SearchItem, query: string, terms: string[]): number {
  const title = item.title.toLowerCase();
  const haystack = item.haystack;
  let score = 0;

  // Every term must hit somewhere.
  for (const term of terms) {
    if (!haystack.includes(term) && !title.includes(term)) return 0;
  }

  // Whole-query boosts
  if (title === query) score += 400;
  else if (title.startsWith(query)) score += 220;
  else if (new RegExp(`\\b${escapeRegExp(query)}`).test(title)) score += 140;
  else if (title.includes(query)) score += 80;

  // Per-term title / haystack boosts
  for (const term of terms) {
    if (title.includes(term)) {
      score += 40;
      if (new RegExp(`\\b${escapeRegExp(term)}`).test(title)) score += 20;
      if (title.startsWith(term)) score += 15;
    }
    if (haystack.includes(term)) score += 8;
  }

  // Category priors — pages and signs ranked slightly above deep content
  const categoryPrior: Record<SearchCategory, number> = {
    page: 12, sign: 10, card: 8, course: 8, lesson: 4, planet: 10, house: 8, aspect: 8,
  };
  score += categoryPrior[item.category] ?? 0;

  return score;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface SearchResult {
  item: SearchItem;
  score: number;
}

export function searchIndex(
  index: SearchItem[],
  rawQuery: string,
  limit = 40,
): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const terms = query.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];
  for (const item of index) {
    const score = scoreItem(item, query, terms);
    if (score > 0) results.push({ item, score });
  }
  results.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));
  return results.slice(0, limit);
}

/**
 * Default items shown when the input is empty.
 * Curated high-signal shortcuts from each major area.
 */
export function defaultSuggestions(index: SearchItem[]): SearchItem[] {
  const want: string[] = [
    "page:academy",
    "page:daily",
    "page:cosmos",
    "page:card-of-day",
    "page:encyclopedia",
    "page:portrait",
    "page:signs",
    "page:chart",
  ];
  const map = new Map(index.map((i) => [i.id, i]));
  return want.map((id) => map.get(id)).filter((x): x is SearchItem => !!x);
}

export const CATEGORY_LABEL_KEY: Record<SearchCategory, string> = {
  page: "search_cat_pages",
  sign: "search_cat_signs",
  card: "search_cat_cards",
  course: "search_cat_courses",
  lesson: "search_cat_lessons",
  planet: "search_cat_planets",
  house: "search_cat_houses",
  aspect: "search_cat_aspects",
};

export const CATEGORY_LABEL_FALLBACK: Record<SearchCategory, string> = {
  page: "Pages",
  sign: "Zodiac Signs",
  card: "Tarot Cards",
  course: "Courses",
  lesson: "Lessons",
  planet: "Planets",
  house: "Houses",
  aspect: "Aspects",
};

export const CATEGORY_ORDER: SearchCategory[] = [
  "page", "sign", "card", "planet", "house", "course", "lesson", "aspect",
];
