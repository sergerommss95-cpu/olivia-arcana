/**
 * Responsive sources for the card faces. scripts/card-sizes.mjs writes 448- and 640-wide copies of
 * every /cards/NN_slug.webp master (896 wide) under /cards/w448/ and /cards/w640/ with the same name,
 * so a figure can let the browser pick the smallest file that stays sharp at its rendered width.
 * Anything else (the card back, thumbs, portal art) has no smaller copies and passes through untouched.
 */

export type CardWidth = 448 | 640 | 896;

const FACE = /^\/cards\/(\d{2}_[a-z0-9_]+\.webp)$/;

/** The face at one width; 896 is the master itself. Unknown paths come back unchanged. */
export function cardSrc(image: string, w: CardWidth): string {
  const file = FACE.exec(image)?.[1];
  if (!file || w === 896) return image;
  return `/cards/w${w}/${file}`;
}

/**
 * A srcset up to `max` wide (all three widths by default; 640 leaves out the 896 master for figures that never
 * need it), or "" when the path is not a card face (leave srcset off then).
 */
export function cardSrcSet(image: string, { max = 896 }: { max?: 640 | 896 } = {}): string {
  if (!FACE.test(image)) return "";
  const set = `${cardSrc(image, 448)} 448w, ${cardSrc(image, 640)} 640w`;
  return max === 640 ? set : `${set}, ${image} 896w`;
}
