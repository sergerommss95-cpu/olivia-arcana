// Gentle checks for a question and for a one-sentence synthesis, driven by the
// shared EN/UK phrase bank (./phrase-bank.json). They only ever suggest; nothing
// here blocks a reading.

const compiled = new Map();
function regex(source) {
  if (!compiled.has(source)) compiled.set(source, new RegExp(source, "iu"));
  return compiled.get(source);
}

const matches = (entries = [], text) => entries.filter((entry) => entry.pattern && regex(entry.pattern).test(text));

/**
 * @param {string} text
 * @param {"en"|"uk"} locale
 * @param {object} bank  the parsed phrase-bank.json
 */
export function checkQuestion(text, locale, bank) {
  const b = bank?.[locale === "uk" ? "uk" : "en"] ?? {};
  const value = (text || "").trim();
  if (!value) return { closed: [], thirdParty: [], sensitive: [] };
  return {
    closed: matches(b.closed, value),
    thirdParty: matches(b.thirdParty, value),
    sensitive: matches(b.sensitive, value),
  };
}

const words = (text) => (text || "").trim().split(/\s+/u).filter(Boolean).length;

/**
 * @param {string} text the reader's sentence
 * @param {"en"|"uk"} locale
 * @param {object} bank
 * @param {string[]} cardNames names of the cards in the spread, in the reader's language
 */
export function sentenceHelp(text, locale, bank, cardNames = []) {
  const b = bank?.[locale === "uk" ? "uk" : "en"] ?? {};
  const value = (text || "").trim();
  const lower = value.toLocaleLowerCase(locale);
  const named = cardNames.filter((name) => {
    const core = name.toLocaleLowerCase(locale).replace(/^the\s+/, "");
    return core && lower.includes(core);
  });
  const swaps = (b.swaps || []).filter((swap) => swap.pattern ? regex(swap.pattern).test(value) : lower.includes(String(swap.from).toLocaleLowerCase(locale)));
  return { words: words(value), limit: 35, named, swaps };
}
