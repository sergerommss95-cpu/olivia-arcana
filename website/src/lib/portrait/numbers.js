// website/src/lib/portrait/numbers.js
/**
 * Pythagorean name and date numbers, as in the V18 portrait
 * (birth-engine-v11.js, calculateNumerology): A–Z only, each name part reduced
 * on its own, master numbers 11, 22 and 33 kept, Y read by Hans Decoz's
 * published surrounding-letter rules. A non-Latin name needs a Latin spelling
 * from the reader; nothing is transliterated here.
 */

export const NUMBER_ROLES = ["lifePath", "expression", "soulUrge", "personality", "birthday"];
const MASTERS = new Set([11, 22, 33]);
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const digitSum = (n) => [...String(n)].reduce((sum, digit) => sum + Number(digit), 0);

/** @param {number} value */
export function reduceNumber(value) {
  const steps = [value];
  let number = value;
  while (number > 9 && !MASTERS.has(number)) {
    number = digitSum(number);
    steps.push(number);
  }
  return { number, master: MASTERS.has(number), steps };
}

/** Each part reduced on its own (masters kept), then the parts summed and reduced. */
const fromParts = (totals) => reduceNumber(totals.reduce((sum, total) => sum + reduceNumber(total).number, 0));

/**
 * @param {string} component  one name part, upper case A–Z
 * @param {number} index      position of the Y within the part
 * @param {"vowel" | "consonant" | null} [override]
 */
export function classifyY(component, index, override = null) {
  if (override) return { vowel: override === "vowel", rule: "reader-pronunciation" };
  const before = component[index - 1] ?? null;
  const after = component[index + 1] ?? null;
  if (component === "BRYAN" || component === "WYATT") return { vowel: true, rule: "published-name-exception" };
  if (!before && !after) return { vowel: true, rule: "only-letter" };
  if (!before) return VOWELS.has(after) ? { vowel: false, rule: "initial-before-vowel" } : { vowel: true, rule: "initial-before-consonant" };
  if (!after) return VOWELS.has(before) ? { vowel: false, rule: "final-after-vowel" } : { vowel: true, rule: "final-after-consonant" };
  return !VOWELS.has(before) && !VOWELS.has(after) ? { vowel: true, rule: "between-consonants" } : { vowel: false, rule: "mixed-or-vowel-neighbours" };
}

/**
 * @param {{ date: string, name: string, latin?: string, yOverrides?: Record<number, "vowel" | "consonant"> }} input
 */
export function nameNumbers({ date, name, latin = "", yOverrides = {} }) {
  const [year, month, day] = date.split("-").map(Number);
  const result = {
    lifePath: fromParts([month, day, year]),
    birthday: reduceNumber(day),
    expression: null,
    soulUrge: null,
    personality: null,
    status: "missing",
    spelling: "",
    /** @type {{ index: number, component: string, vowel: boolean, rule: string }[]} */
    yLetters: [],
  };
  const original = String(latin || name || "").trim();
  if (!original) return result;
  const folded = original.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if ([...folded].some((c) => !/[A-Za-z\s.'’\-]/.test(c))) return { ...result, status: "needs-latin" };
  const spelling = folded.replace(/[.'’\-]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!/[A-Z]/.test(spelling)) return result;

  let flat = 0;
  const parts = spelling.split(" ").map((component) => {
    const letters = [...component].map((letter, i) => {
      const index = flat++;
      let vowel = VOWELS.has(letter);
      if (letter === "Y") {
        const y = classifyY(component, i, yOverrides[index] ?? null);
        vowel = y.vowel;
        result.yLetters.push({ index, component, vowel, rule: y.rule });
      }
      return { value: ((letter.charCodeAt(0) - 65) % 9) + 1, vowel };
    });
    const sum = (pick) => letters.filter(pick).reduce((total, l) => total + l.value, 0);
    return { all: sum(() => true), vowels: sum((l) => l.vowel), consonants: sum((l) => !l.vowel) };
  });
  const roleOf = (key) => (parts.some((p) => p[key] > 0) ? fromParts(parts.map((p) => p[key])) : null);
  return { ...result, status: "calculated", spelling, expression: roleOf("all"), soulUrge: roleOf("vowels"), personality: roleOf("consonants") };
}
