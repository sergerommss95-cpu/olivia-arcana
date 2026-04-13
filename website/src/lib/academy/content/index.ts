/**
 * Academy Content Engine — Entry Point
 *
 * generateFullLessonContent(courseSlug, lessonSlug, title, description, duration)
 * Returns structured LessonContent with real educational sections.
 */

import type { LessonContent } from "./types";
import { resolveContent } from "./mapping";
import { translateContent } from "./translate";

export type { LessonContent, ContentSection, QuizQuestion, ExerciseStep } from "./types";

export function generateFullLessonContent(
  courseSlug: string,
  lessonSlug: string,
  lessonTitle: string,
  lessonDescription: string,
  lessonDuration: number,
  locale: string = "en",
): LessonContent {
  const content = resolveContent(courseSlug, lessonSlug, lessonTitle, lessonDescription, lessonDuration, locale);
  return translateContent(content, locale);
}
