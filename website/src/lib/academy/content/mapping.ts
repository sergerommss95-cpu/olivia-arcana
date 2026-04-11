/**
 * mapping.ts — Routes lesson slugs to the correct content template
 *
 * Priority: exact template match → pattern match → conceptual fallback
 */

import type { LessonContent } from "./types";
import { generateSignContent } from "./templates/sign-group";
import { generatePlanetContent } from "./templates/planet-profile";
import { generateHouseContent } from "./templates/house-profile";
import { generateTarotContent } from "./templates/tarot-content";
import { generateQuizContent } from "./templates/quiz-generator";
import { generatePracticeContent } from "./templates/practice";
import { generateAspectTransitContent } from "./templates/aspect-transit";
import { generateSynastrySpreadContent } from "./templates/synastry-spread";
import { generateConceptualContent } from "./templates/conceptual";

export function resolveContent(
  courseSlug: string,
  lessonSlug: string,
  lessonTitle: string,
  lessonDescription: string,
  lessonDuration: number,
): LessonContent {
  // Try each template in order of specificity

  // 1. Quiz lessons
  const quiz = generateQuizContent(courseSlug, lessonSlug);
  if (quiz) return quiz;

  // 2. Practice/exercise lessons
  const practice = generatePracticeContent(courseSlug, lessonSlug);
  if (practice) return practice;

  // 3. Sign-based lessons
  const sign = generateSignContent(lessonSlug);
  if (sign) return sign;

  // 4. Planet-based lessons
  const planet = generatePlanetContent(lessonSlug);
  if (planet) return planet;

  // 5. House-based lessons
  const house = generateHouseContent(lessonSlug);
  if (house) return house;

  // 6. Tarot card lessons
  const tarot = generateTarotContent(lessonSlug);
  if (tarot) return tarot;

  // 7. Aspect and transit lessons
  const aspectTransit = generateAspectTransitContent(lessonSlug);
  if (aspectTransit) return aspectTransit;

  // 8. Synastry and spread lessons
  const synastrySpread = generateSynastrySpreadContent(lessonSlug);
  if (synastrySpread) return synastrySpread;

  // 9. Conceptual fallback (always returns content)
  return generateConceptualContent(courseSlug, lessonSlug, lessonTitle, lessonDescription);
}
