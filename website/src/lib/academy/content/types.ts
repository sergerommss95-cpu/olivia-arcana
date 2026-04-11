/**
 * Content section types for the academy lesson engine.
 * Each lesson is composed of an array of these sections.
 */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ExerciseStep {
  instruction: string;
  hint?: string;
  type: "reflect" | "lookup" | "draw-card" | "journal" | "observe";
}

export type ContentSection =
  | { type: "text"; title?: string; body: string }
  | { type: "callout"; style: "insight" | "warning" | "tip"; body: string }
  | { type: "sign-profile"; sign: string }
  | { type: "planet-profile"; planet: string }
  | { type: "house-profile"; house: number }
  | { type: "card-display"; cardName: string; showReversed?: boolean }
  | { type: "card-grid"; cards: string[] }
  | { type: "quiz"; questions: QuizQuestion[] }
  | { type: "exercise"; steps: ExerciseStep[] }
  | { type: "comparison-table"; headers: string[]; rows: string[][] }
  | { type: "keyword-map"; items: { term: string; definition: string }[] };

export interface LessonContent {
  sections: ContentSection[];
  estimatedMinutes: number;
  keyTakeaway?: string;
}
