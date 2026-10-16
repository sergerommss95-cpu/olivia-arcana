// One-off: converts the V18 portrait's bilingual knowledge into netlify/portrait/knowledge/bank.json.
// Usage: node scripts/portrait-knowledge-import.mjs <V18 workspace root>
import { writeFile, mkdir } from "node:fs/promises";

const root = process.argv[2];
if (!root) throw new Error("Pass the V18 workspace root");
const web = (file) => import(`${root}/portrait-prototype/web/${file}`);
const both = (fn) => ({ en: fn("en"), uk: fn("uk") });
const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];

const arkan = await web("portrait-arkan-v15.js");
const CARD_FIELDS = ["name", "character", "strength", "risk", "inner", "relationship", "work", "choice", "growth"];
const cards = {};
for (let i = 0; i <= 21; i++) {
  const en = arkan.arkanSemanticProfileV15(`arcana-${i}`, "en");
  const uk = arkan.arkanSemanticProfileV15(`arcana-${i}`, "uk");
  cards[i] = Object.fromEntries(CARD_FIELDS.map((f) => [f, { en: en[f], uk: uk[f] }]));
}

const nums = await web("portrait-numbers-v15.js");
const ROLES = ["lifePath", "expression", "soulUrge", "personality"];
const NUMBER_FIELDS = ["name", "essence", "traits", "strengths", "blindSpots", "innerWorld", "relationships", "work", "choices", "development"];
const numbers = Object.fromEntries(ROLES.map((r) => [r, {}]));
for (const value of nums.NUMBER_VALUES) {
  const report = { numbers: ROLES.map((id) => ({ id, calculation: { number: value } })) };
  const out = both((lang) => nums.buildNumerologyPortrait(report, lang));
  // The role profiles are the array whose entries carry `essence` and a role `id`.
  const profilesOf = (portrait) => Object.values(portrait).find((v) => Array.isArray(v) && v[0]?.essence && ROLES.includes(v[0]?.id));
  const en = profilesOf(out.en), uk = profilesOf(out.uk);
  if (!en || !uk) throw new Error(`No role profiles found for ${value}; inspect Object.keys(buildNumerologyPortrait(...))`);
  for (const role of ROLES) {
    const e = en.find((p) => p.id === role), u = uk.find((p) => p.id === role);
    numbers[role][value] = Object.fromEntries(NUMBER_FIELDS.map((f) => [f, { en: e[f], uk: u[f] }]));
  }
}

const personalMod = await web("portrait-natal-personal-v18.js");
const personal = {};
for (const planet of ["mercury", "venus", "mars"]) {
  personal[planet] = {};
  for (const sign of SIGNS) {
    const p = personalMod.NATAL_PERSONAL_PROFILES_V18[planet][sign];
    personal[planet][sign] = { disposition: p.disposition, satisfaction: p.satisfaction, strain: p.strain };
  }
}

const { NATAL_KNOWLEDGE_V15: natal } = await web("portrait-natal-knowledge-v15.js");
const pairsMod = await web("natal-pairs-v12.js");
const pairs = Object.fromEntries(pairsMod.PLANET_PAIR_CONTENT.map((p) => [p.id, p]));

const sourceList = [...nums.NUMEROLOGY_PORTRAIT_SOURCES, ...personalMod.NATAL_PERSONAL_SOURCES_V18];
const sources = Object.fromEntries(sourceList.map((s) => [s.id, { title: s.title, url: s.url }]));
sources["arkan-chrzanowska"] = { title: "Alla Alicja Chrzanowska · Public individual portrait", url: "https://as2.com.pl/content/31-sposob-obliczania-i-interpretacji-indywidualnego-tarotowego-portretu-psychologicznego" };
sources["astrodienst-intro"] = { title: "Astrodienst · A Brief Introduction to Astrology", url: "https://www.astro.com/astrology/in_intro_e.htm" };
sources["v18-core-role-architecture"] = { title: "Hans Decoz · Core numbers and their distinct roles", url: "https://www.worldnumerology.com/numerology-articles/numerology-core-numbers.html" };

// Role notes are short and stable; copied from V18 portrait-profile-knowledge-v18.js (roleNotes).
const profileSrc = await (await import("node:fs/promises")).readFile(`${root}/portrait-prototype/web/portrait-profile-knowledge-v18.js`, "utf8");
const roleNotes = Function(`return (${/const roleNotes=(\{[\s\S]*?\n\});/.exec(profileSrc)[1]})`)();

const bank = { edition: "portrait-1", cards, numbers, roleNotes, personal, signs: natal.signs, planets: natal.planets, houses: natal.houses, aspects: natal.aspect_types, pairs, sources };
await mkdir(new URL("../netlify/portrait/knowledge/", import.meta.url), { recursive: true });
await writeFile(new URL("../netlify/portrait/knowledge/bank.json", import.meta.url), JSON.stringify(bank));
console.log("bank.json", JSON.stringify(bank).length, "bytes");
