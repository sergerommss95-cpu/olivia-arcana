// website/src/lib/portrait/typography.js
/**
 * The reading's text as it is set on the page: straight quotes and
 * apostrophes turned, and a dash kept to the word before it so no line starts
 * with one. English takes ‘ ’ and “ ”; Ukrainian takes « » for a quotation
 * („ “ for one inside it) and ’ for the apostrophe. Applied where the text is
 * shown (the reader, the Why drawer, the export), never to what is stored.
 * Plain JS for the node test runner.
 */

const WORD = /[\p{L}\p{N}]/u;
/** What may stand before an opening quote: the start, a space, an opening bracket or quote, a dash or a slash. */
const OPENS_AFTER = /[\s([{—–\-/«„“‘]/u;

/**
 * @param {string} text
 * @param {"en" | "uk" | string} [locale]
 * @returns {string}
 */
export function typeset(text, locale = "en") {
  if (typeof text !== "string" || !/['"]| [—–]/.test(text)) return text;
  const uk = locale === "uk";
  let out = "";
  /** Inside a quotation opened with a single quote. */
  let single = false;
  /** Ukrainian: how many quotations are open, those the text already sets in « » or „ “ included. */
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const before = i === 0 ? " " : text[i - 1];
    const after = i + 1 < text.length ? text[i + 1] : " ";
    const opening = OPENS_AFTER.test(before) && !/\s/u.test(after);
    if (ch === "'") {
      if (WORD.test(before) && WORD.test(after)) out += "’";
      // An elided century ('90s) is an apostrophe, not a quotation.
      else if (opening && /^\d\ds\b/.test(text.slice(i + 1))) out += "’";
      else if (opening) { single = true; out += uk ? (depth++ ? "„" : "«") : "‘"; }
      else if (single) { single = false; out += uk ? (depth > 0 && --depth ? "“" : "»") : "’"; }
      else out += "’";
    } else if (ch === '"') {
      if (opening) out += uk ? (depth++ ? "„" : "«") : "“";
      else out += uk ? (depth > 0 && --depth ? "“" : "»") : "”";
    } else {
      if (uk && (ch === "«" || ch === "„")) depth++;
      else if (uk && (ch === "»" || ch === "“")) depth = Math.max(0, depth - 1);
      out += ch;
    }
  }
  return out.replace(/ ([—–])/g, " $1");
}

/**
 * @typedef {{ title: string, lede: string, paragraphs: string[], practice: string }} Chapter
 * @typedef {{ a?: { title: string, epigraph: string, overview: { text: string }, facets: Record<string, { heading: string, text: string }> }, b?: { chapters: Record<string, Chapter> }, c?: { chapters: Record<string, Chapter>, keep: string[] } }} Stages
 */

/**
 * The stages with every passage of reading text typeset, ids and refs untouched.
 * @template {Stages} T
 * @param {T} stages
 * @param {string} locale
 * @returns {T}
 */
export function typesetStages(stages, locale) {
  if (!stages) return stages;
  /** @param {string} s */
  const t = (s) => typeset(s, locale);
  /** @param {Record<string, Chapter> | undefined} chapters */
  const chapters = (chapters) => chapters && Object.fromEntries(Object.entries(chapters).map(([key, ch]) => [key, ch && {
    ...ch, title: t(ch.title), lede: t(ch.lede), paragraphs: ch.paragraphs?.map(t), practice: t(ch.practice),
  }]));
  const { a, b, c } = stages;
  return {
    ...stages,
    ...(a && { a: {
      ...a,
      title: t(a.title),
      epigraph: t(a.epigraph),
      overview: a.overview && { ...a.overview, text: t(a.overview.text) },
      facets: a.facets && Object.fromEntries(Object.entries(a.facets).map(([key, f]) => [key, f && { ...f, heading: t(f.heading), text: t(f.text) }])),
    } }),
    ...(b && { b: { ...b, chapters: chapters(b.chapters) } }),
    ...(c && { c: { ...c, chapters: chapters(c.chapters), keep: c.keep?.map(t) } }),
  };
}
