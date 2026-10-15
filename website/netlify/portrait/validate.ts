// website/netlify/portrait/validate.ts
/** Checks a stage before anyone sees it. Failing text is withheld, never patched with stock prose. */
import { focusFor, SECTIONS, type Stage } from "./plan.ts";
import { repetition, styleProblems } from "./style.ts";

type Factor = { id: string; kind: string; alternatives?: string[] | null };
type Packet = { locale: "en" | "uk"; factors: Factor[] };
type Teaching = { id: string };
type Passage = { text: string; refs: string[]; teachings: string[] };

export const LIMITS = {
  title: [6, 80], epigraph: [20, 160], overview: [380, 1300], facet: [220, 1000], heading: [3, 60],
  lede: [30, 240], paragraph: [200, 1150], paragraphs: [2, 3], practice: [40, 320], keep: [20, 180], outline: [20, 200],
} as const;

/** Stems per language, as regex source. Ukrainian forms inflect (Овен / в Овні, Телець / в Тельці), so a sign counts as named if any stem appears. */
const SIGN_NAMES: Record<string, [string[], string[]]> = {
  aries: [["Aries"], ["Овен", "Овн"]], taurus: [["Taurus"], ["Телець", "Тельц"]], gemini: [["Gemini"], ["Близнюк", "Близнят"]],
  cancer: [["Cancer"], ["Ра(?:к(?:а|у|ом|ові|і)?|ці)(?![\\p{L}])"]], leo: [["Leo"], ["Лев"]], virgo: [["Virgo"], ["Дів"]],
  libra: [["Libra"], ["Терез"]], scorpio: [["Scorpio"], ["Скорпіон"]], sagittarius: [["Sagittarius"], ["Стріл"]],
  capricorn: [["Capricorn"], ["Козер"]], aquarius: [["Aquarius"], ["Водолі"]], pisces: [["Pisces"], ["Риб"]],
};
/** English names must be whole words; Ukrainian names only need a word start, because their endings inflect. */
const SIGN_RE: Record<string, [RegExp[], RegExp[]]> = Object.fromEntries(
  Object.entries(SIGN_NAMES).map(([sign, [en, uk]]) => [
    sign,
    [en.map((stem) => new RegExp(`(?<![\\p{L}])${stem}(?![\\p{L}])`, "iu")), uk.map((stem) => new RegExp(`(?<![\\p{L}])${stem}`, "iu"))],
  ]),
);

const APOS = "(?:'|’)";
const UNSAFE: RegExp[] = [
  new RegExp(`\\byou${APOS}?(?:ll| will| are going to|${APOS}re going to) (?:die|marry|divorce|fall ill|get sick|become (?:rich|wealthy)|be (?:rich|wealthy)|get (?:rich|wealthy)|win the lottery|never be short of money)(?![\\p{L}])`, "iu"),
  /\byour death\b/iu, /\bdie (?:young|soon|early|alone)\b/iu,
  /\bdiagnos/iu, /(?<!ordered )\bdisorder(?:s)?\b/iu, /\btraumat/iu, /\btrauma\b/iu, /\bdepress(?:ion|ive|ed)\b/iu,
  /\badhd\b/iu, /\bautis/iu, /\billness\b/iu, /\bdisease\b/iu,
  /\bdestined\b/iu, /\bfated\b/iu, /\bdoomed\b/iu, /\byour (?:fate|destiny) (?:is|was) (?:set|sealed|written)/iu, /\byour (?:fate|destiny)\b/iu,
  /\bi guarantee\b/iu, /\bguaranteed to\b/iu,
  /діагноз/iu, /розлад(?:и|ом|у)?(?![\p{L}])/iu, /депрес/iu, /травм(?:а|и|у|ою|ований|ована)/iu, /хвороб/iu, /захворієт/iu,
  /приречен/iu, /(?:це|така) ваша доля/iu, /доля вирішен/iu, /помрет/iu, /помреш/iu, /ваша смерть/iu, /одружите(?:ся|сь)/iu,
  /розлучите(?:ся|сь)/iu, /розбагатієт/iu, /станете багат/iu, /гарантован/iu, /гарантую/iu,
];

/** Snippets (up to 40 characters) of each unsafe claim in the text. */
export function unsafeMatches(text: string): string[] {
  const hits: string[] = [];
  for (const re of UNSAFE) {
    const m = re.exec(text);
    if (m) hits.push(m[0].slice(0, 40));
  }
  return hits;
}

/** The six chapters the opening plans an angle for. */
const CHAPTERS = [...SECTIONS.b, ...SECTIONS.c];

const within = (value: unknown, [min, max]: readonly [number, number]) => typeof value === "string" && value.length >= min && value.length <= max;
const str = (value: unknown): string => (typeof value === "string" ? value : "");
const list = (value: unknown): any[] => (Array.isArray(value) ? value : []);

/** What the reader sees of the opening: the overview and each facet's text. The outline is hidden planning text and is left out. */
const openingText = (opening: any): string[] => [str(opening?.overview?.text), ...SECTIONS.a.slice(1).map((key) => str(opening?.facets?.[key]?.text))].filter(Boolean);

/** `opening` is the accepted stage A; stages B and C may not repeat six words of its visible text. */
export function validateStage(stage: Stage, data: any, packet: Packet, teachings: Teaching[], opening?: unknown) {
  const errors: string[] = [];
  const factorIds = new Set(packet.factors.map((f) => f.id));
  const teachingIds = new Set(teachings.map((t) => t.id));
  const uncertain = packet.factors.filter((f) => Array.isArray(f.alternatives) && f.alternatives.length > 1);
  const lang = packet.locale === "uk" ? 1 : 0;
  const locale = packet.locale === "uk" ? "uk" : "en";

  const checkText = (where: string, text: string) => {
    for (const snippet of unsafeMatches(text)) errors.push(`unsafe:${where}:"${snippet}"`);
  };
  const checkStyle = (where: string, text: unknown, opts: { lede?: boolean } = {}) => {
    errors.push(...styleProblems(where, str(text), locale, opts));
  };
  const checkPassage = (where: string, p: Passage, text: string, limit: readonly [number, number]) => {
    if (!p || typeof text !== "string") { errors.push(`missing:${where}`); return; }
    const refs = list(p.refs), teach = list(p.teachings);
    if (!within(text, limit)) errors.push(`length:${where}:${text.length}`);
    if (refs.length === 0) errors.push(`refs:${where}:empty`);
    for (const id of refs) if (!factorIds.has(id)) errors.push(`refs:${where}:${id}`);
    for (const id of teach) if (!teachingIds.has(id)) errors.push(`teachings:${where}:${id}`);
    const focus = focusFor(where, packet);
    if (focus.length && !refs.some((id) => focus.includes(id))) errors.push(`focus:${where}`);
    for (const f of uncertain) {
      if (!refs.includes(f.id)) continue;
      const signs = (f.alternatives ?? []).filter((sign) => Object.hasOwn(SIGN_RE, sign));
      const named = signs.filter((sign) => SIGN_RE[sign][lang].some((re) => re.test(text)));
      if (named.length < signs.length) errors.push(`uncertain:${where}:${f.id}`);
    }
    checkText(where, text);
  };

  if (stage === "a") {
    if (!within(data?.title, LIMITS.title)) errors.push("length:title");
    if (!within(data?.epigraph, LIMITS.epigraph)) errors.push("length:epigraph");
    checkText("title", `${str(data?.title)} ${str(data?.epigraph)}`);
    checkStyle("title", data?.title);
    checkStyle("epigraph", data?.epigraph);
    // The outline is planning text for the later stages, never shown: no refs, teachings or focus, only length, distinctness and safety.
    if (typeof data?.outline !== "object" || data.outline === null) errors.push("missing:outline");
    else {
      const lines: string[] = [];
      for (const key of CHAPTERS) {
        const line = data.outline[key];
        if (typeof line !== "string") { errors.push(`missing:outline:${key}`); continue; }
        if (!within(line, LIMITS.outline)) errors.push(`length:outline:${key}`);
        checkText(`outline:${key}`, line);
        lines.push(line.trim().toLowerCase());
      }
      if (new Set(lines).size < lines.length) errors.push("outline:duplicate");
    }
    checkPassage("overview", data?.overview, data?.overview?.text, LIMITS.overview);
    checkStyle("overview", data?.overview?.text);
    for (const key of SECTIONS.a.slice(1)) {
      const facet = data?.facets?.[key];
      if (!within(facet?.heading, LIMITS.heading)) errors.push(`length:${key}:heading`);
      checkText(`${key}:heading`, str(facet?.heading));
      checkStyle(`${key}:heading`, facet?.heading);
      checkPassage(key, facet, facet?.text, LIMITS.facet);
      checkStyle(key, facet?.text);
    }
  } else {
    const seen = openingText(opening);
    for (const key of SECTIONS[stage]) {
      const ch = data?.chapters?.[key];
      if (!ch) { errors.push(`missing:${key}`); continue; }
      if (!within(ch.title, LIMITS.title)) errors.push(`length:${key}:title`);
      checkText(`${key}:title`, str(ch.title));
      checkStyle(`${key}:title`, ch.title);
      if (!within(ch.lede, LIMITS.lede)) errors.push(`length:${key}:lede`);
      if (!within(ch.practice, LIMITS.practice)) errors.push(`length:${key}:practice`);
      const paragraphs = list(ch.paragraphs);
      if (paragraphs.length < LIMITS.paragraphs[0] || paragraphs.length > LIMITS.paragraphs[1]) errors.push(`count:${key}:paragraphs`);
      paragraphs.forEach((text, i) => { if (!within(text, LIMITS.paragraph)) errors.push(`length:${key}:p${i}:${str(text).length}`); });
      const text = [str(ch.lede), ...paragraphs.map(str), str(ch.practice)].join(" ");
      checkPassage(key, ch, text, [0, 100_000]);
      checkStyle(`${key}:lede`, ch.lede, { lede: true });
      paragraphs.forEach((paragraph, i) => checkStyle(`${key}:p${i}`, paragraph));
      checkStyle(`${key}:practice`, ch.practice);
      // Stages B and C are written side by side, so each is held against the opening only.
      errors.push(...repetition(key, text, seen));
    }
    if (stage === "c") {
      const keep = list(data?.keep);
      if (keep.length !== 3) errors.push("count:keep");
      keep.forEach((line, i) => { if (!within(line, LIMITS.keep)) errors.push(`length:keep:${i}`); checkText(`keep${i}`, str(line)); });
    }
  }
  return errors.length ? { ok: false as const, errors } : { ok: true as const };
}
