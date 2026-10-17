/**
 * Display-only typesetting for the leaf's composed and long strings. The frozen writing (src/lib/daily) is
 * never changed: this only swaps in no-break characters where a line must not break.
 * - "11-й", "7-й": the hyphen after a numeral becomes a non-breaking hyphen (U+2011, in Cormorant and DM Sans).
 * - " — ", " – ": the space before a dash becomes a no-break space, so a line never starts with the dash.
 * - " · ": the space after a separator dot becomes a no-break space, so a line never ends on the dot.
 * - "16 жовтня", "7 days": a numeral is bound to the word after it.
 * - Ukrainian one-letter words («і», «в», «з», «у», «й», «а», «о», «я»…) are bound to the word after them
 *   (twice, so «і в» binds through).
 */
export function typeset(s: string, locale: "en" | "uk"): string {
  let t = s.replace(/(\d)-(?=\p{L})/gu, "$1‑").replace(/ ([—–]) /g, " $1 ").replace(/ · /g, " · ").replace(/(\d) (?=\p{L})/gu, "$1 ");
  if (locale === "uk") for (let i = 0; i < 2; i++) t = t.replace(/(^|[\s(«])([абвзійоуяАБВЗІЙОУЯ]) /gu, "$1$2 ");
  return t;
}
