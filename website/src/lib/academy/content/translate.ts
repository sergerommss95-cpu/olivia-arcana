/**
 * translate.ts — Post-processing translation for lesson content
 *
 * Translates a LessonContent object from English to the target locale
 * using hash-based dictionary lookup. Untranslated strings pass through as English.
 *
 * Usage:
 *   const translated = translateContent(content, "uk");
 *
 * Adding a new language:
 *   1. Create locales/{code}.ts exporting `dict: Record<string, string>`
 *   2. Import it below and add to DICTIONARIES
 */

import type { LessonContent, ContentSection } from "./types";
import { dict as uk } from "./locales/uk";
import { dict as ru } from "./locales/ru";
import { dict as de } from "./locales/de";
import { dict as fr } from "./locales/fr";
import { dict as ar } from "./locales/ar";
import { dict as es } from "./locales/es";
import { dict as zh } from "./locales/zh";
import { dict as pt } from "./locales/pt";

const DICTIONARIES: Record<string, Record<string, string>> = { uk, ru, de, fr, ar, es, zh, pt };

/**
 * Translates a LessonContent object from English to the target locale.
 * Uses a hash-based dictionary lookup. Untranslated strings pass through as English.
 */
export function translateContent(
  content: LessonContent,
  locale: string,
): LessonContent {
  if (locale === "en") return content;

  const dict = DICTIONARIES[locale];
  if (!dict) return content; // unsupported locale, return English

  const t = (s: string): string => dict[s] ?? s; // lookup or passthrough

  return {
    ...content,
    keyTakeaway: content.keyTakeaway ? t(content.keyTakeaway) : undefined,
    sections: content.sections.map((section) =>
      translateSection(section, t),
    ),
  };
}

function translateSection(
  section: ContentSection,
  t: (s: string) => string,
): ContentSection {
  switch (section.type) {
    case "text":
      return {
        ...section,
        title: section.title ? t(section.title) : undefined,
        body: t(section.body),
      };
    case "callout":
      return { ...section, body: t(section.body) };
    case "quiz":
      return {
        ...section,
        questions: section.questions.map((q) => ({
          ...q,
          question: t(q.question),
          options: q.options.map(t),
          explanation: t(q.explanation),
        })),
      };
    case "exercise":
      return {
        ...section,
        steps: section.steps.map((s) => ({
          ...s,
          instruction: t(s.instruction),
          hint: s.hint ? t(s.hint) : undefined,
        })),
      };
    case "comparison-table":
      return {
        ...section,
        headers: section.headers.map(t),
        rows: section.rows.map((r) => r.map(t)),
      };
    case "keyword-map":
      return {
        ...section,
        items: section.items.map((i) => ({
          term: t(i.term),
          definition: t(i.definition),
        })),
      };
    case "secret-reveal":
      return {
        ...section,
        question: t(section.question),
        options: section.options.map(t),
        explanation: t(section.explanation),
        hint: section.hint ? t(section.hint) : undefined,
      };
    default:
      return section;
  }
}
