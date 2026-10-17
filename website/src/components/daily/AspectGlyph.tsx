/**
 * The five aspect symbols drawn as one family on a 16-unit square, so ☌ and ☍ stand as tall as △ (the symbol
 * fonts set them at about half its size). Drawn at 15px, where the 4/3-unit stroke is 1.25px. Decorative: the
 * aspect's name is given as text beside it wherever it carries meaning.
 */

import type { ReactNode } from "react";

const SHAPES: Record<string, ReactNode> = {
  // a small circle with a short stem up and to the right
  conjunction: <><circle cx="6.5" cy="9.5" r="3.6" /><path d="M9.05 6.95 13 3" /></>,
  // two small circles joined by a line
  opposition: <><circle cx="4" cy="12" r="2.4" /><circle cx="12" cy="4" r="2.4" /><path d="M5.7 10.3 10.3 5.7" /></>,
  trine: <path d="M8 2.6 13.9 12.9H2.1Z" />,
  square: <rect x="3.25" y="3.25" width="9.5" height="9.5" />,
  // three lines crossing at the centre
  sextile: <path d="M8 2v12M2.8 5l10.4 6M2.8 11l10.4-6" />,
};

export default function AspectGlyph({ aspect, className }: { aspect: string; className?: string }) {
  const shape = SHAPES[aspect];
  if (!shape) return null;
  return (
    <svg className={className} viewBox="0 0 16 16" width="15" height="15" aria-hidden focusable="false"
      fill="none" stroke="currentColor" strokeWidth={4 / 3} strokeLinecap="round" strokeLinejoin="round">
      {shape}
    </svg>
  );
}
