/**
 * haptics.ts — Haptic Ritual Language
 *
 * Uses the Vibration API to give each tarot interaction a unique
 * tactile signature. Each pattern is designed as a "haptic glyph" —
 * a distinct rhythm the body learns to associate with a moment.
 *
 * Patterns are arrays of [vibrate, pause, vibrate, pause, ...] in ms.
 * Single numbers are a single sustained vibration.
 *
 * Falls back silently on devices without Vibration API (desktop, iOS Safari).
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export const haptics = {
  /** Card touched -- single soft pulse */
  touch: () => vibrate(40),

  /** Hold progress 25% -- rising triple beat */
  progress25: () => vibrate([30, 20, 40, 20, 60]),

  /** Hold threshold reached -- strong sustained */
  threshold: () => vibrate(200),

  /** Card face appearing -- rapid decreasing flutter */
  cardAppear: () => vibrate([50, 30, 40, 30, 30, 30, 20]),

  /** Card fully revealed -- single resonant pulse */
  revealed: () => vibrate(150),

  /** Draw again -- sweeping fade-out */
  drawAgain: () => vibrate([80, 20, 60, 20, 40, 20, 20]),

  /** Button press -- light tap */
  tap: () => vibrate(15),

  /** Error/warning -- double pulse */
  warn: () => vibrate([60, 40, 60]),

  /** Success/completion */
  success: () => vibrate([30, 30, 80]),
};
