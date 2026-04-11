/**
 * micro-typography.ts — Micro-Typography Ritual
 *
 * Compute unique word-spacing for reading text based on content hash.
 * Each paragraph feels slightly differently weighted.
 * The Tower sits differently than The Star.
 */

/**
 * Generate a subtle, deterministic word-spacing value from text content.
 *
 * Range: -0.01em to +0.03em — imperceptible individually but creates
 * a unique typographic rhythm per card/paragraph.
 */
export function textWordSpacing(text: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(text.length, 64); i++) {
    hash = (hash * 31 + text.charCodeAt(i)) & 0xffffffff;
  }
  const normalized = (hash >>> 0) / 0xffffffff;
  const spacing = -0.01 + normalized * 0.04; // -0.01em to +0.03em
  return `${spacing.toFixed(3)}em`;
}
