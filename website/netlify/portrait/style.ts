// website/netlify/portrait/style.ts
/** Voice checks: the reading speaks plainly, commits to its first sentence, and never repeats itself. */

const HEDGES = {
  en: "\\b(?:may|might|perhaps|probably|possibly|likely|maybe|tend(?:s)? to|seem(?:s)? to|could be)\\b",
  // «схоже» and «здається» also mean "similar" and "appears to be", so they hedge only as «що»-clauses or a parenthetical; «якщо можливо» is "if you can", not a doubt.
  uk: "(?<![\\p{L}])(?:мабуть|ймовірно|(?<!якщо\\s+)можливо|напевно|схоже,?\\s+що|здається,?\\s+що|(?<=,\\s*)здається(?=\\s*,)|либонь)(?![\\p{L}])",
};
const PHRASES = {
  en: [/\bsymbolic\b/i, /\bsupplied\b/i, /\bthis (?:position|placement|card|number) (?:suggests|indicates|shows)\b/i, /\btradition(?:s|al)? (?:says|suggests|holds)\b/i,
       /\bjourney\b/i, /\bauthentic self\b/i, /\bself-care\b/i, /\binner child\b/i, /\bhealing\b/i, /\bthe universe\b/i, /\bunique blend\b/i, /\btapestry\b/i,
       /\bdelve\b/i, /\brealm\b/i, /\bnavigat(?:e|ing) the\b/i, /\bit(?:'|’)s important to\b/i, /\bembrace\b/i, /\bnot (?:simply|just|merely) [^.,;]{1,40}, but\b/i],
  uk: [/символічн/iu, /традиці(?:я|ї|ю|єю)(?![\p{L}])\s+(?:каже|свідчить|вважає|радить)/iu, /енергі[яїюй] (?:всесвіту|космосу|карти|карт|числа|чисел)/iu, /всесвіт/iu, /подорож[іу]? до себе/iu, /важливо пам[’']ятати/iu,
       /унікальн[еийа] поєднання/iu, /зцілення/iu,
       // «не просто X, а Y»: the same contrast tic as the English "not just X, but Y".
       /(?<![\p{L}])не\s+(?:просто|лише|тільки)\s+[^.,;]{1,40},\s*(?:а|але)(?![\p{L}])/iu],
};
const GENDERED = /(?<![\p{L}])(?:ви\s+(?:\p{L}+\s+)?(?:сама|готова|готовий|впевнена|впевнений|рада|радий|повинна|повинен|змушена|змушений|здатна|здатний|певна|певен)|самій собі|самому собі)(?![\p{L}])/giu;

/** A sentence ends at . ! ? or …, even when a closing quote follows it. */
const firstSentence = (text: string) => text.split(/(?<=[.!?…]["»”’']?)\s/u)[0] ?? text;

/** Problems with how a passage sounds. `lede` passages are one sentence, so the whole text counts as their first. */
export function styleProblems(where: string, text: string, locale: "en" | "uk", opts: { lede?: boolean }) {
  const out: string[] = [];
  const lead = opts.lede ? text : firstSentence(text);
  if (new RegExp(HEDGES[locale], "iu").test(lead)) out.push(`hedge-lead:${where}`);
  const count = (text.match(new RegExp(HEDGES[locale], "giu")) ?? []).length;
  if (count > 1) out.push(`hedges:${where}:${count}`);
  for (const re of PHRASES[locale]) {
    const m = text.match(re);
    if (m) out.push(`phrase:${where}:"${m[0].slice(0, 40)}"`);
  }
  if (locale === "uk") for (const m of text.matchAll(GENDERED)) out.push(`gender:${where}:"${m[0].slice(0, 40)}"`);
  return out;
}

const words = (text: string) => text.toLowerCase().normalize("NFC").match(/\p{L}+/gu) ?? [];
const shingles = (text: string, n = 6) => {
  const w = words(text);
  const s = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(" "));
  return s;
};

/** The first run of six words in `text` that already appears in any of the `against` texts. */
export function repetition(where: string, text: string, against: string[]) {
  const seen = new Set<string>();
  for (const other of against) for (const s of shingles(other)) seen.add(s);
  for (const s of shingles(text)) if (seen.has(s)) return [`repeat:${where}:"${s.slice(0, 60)}"`];
  return [];
}
