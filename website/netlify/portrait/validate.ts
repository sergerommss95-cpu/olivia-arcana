// website/netlify/portrait/validate.ts
/** Checks a stage before anyone sees it. Failing text is withheld, never patched with stock prose. */
import { focusFor, SECTIONS, type Stage } from "./plan.ts";

type Factor = { id: string; kind: string; alternatives?: string[] | null };
type Packet = { locale: "en" | "uk"; factors: Factor[] };
type Teaching = { id: string };
type Passage = { text: string; refs: string[]; teachings: string[] };

export const LIMITS = {
  title: [6, 80], epigraph: [20, 160], overview: [380, 1200], facet: [220, 900], heading: [3, 60],
  lede: [30, 240], paragraph: [200, 1000], paragraphs: [2, 3], practice: [40, 320], keep: [20, 180],
} as const;

/** Stems per language: Ukrainian forms inflect (Овен / в Овні, Телець / в Тельці), so a sign counts as named if any stem appears. */
const SIGN_NAMES: Record<string, [string[], string[]]> = {
  aries: [["Aries"], ["Овен", "Овн"]], taurus: [["Taurus"], ["Телець", "Тельц"]], gemini: [["Gemini"], ["Близнюк"]],
  cancer: [["Cancer"], ["Рак"]], leo: [["Leo"], ["Лев"]], virgo: [["Virgo"], ["Дів"]],
  libra: [["Libra"], ["Терез"]], scorpio: [["Scorpio"], ["Скорпіон"]], sagittarius: [["Sagittarius"], ["Стріл"]],
  capricorn: [["Capricorn"], ["Козер"]], aquarius: [["Aquarius"], ["Водолі"]], pisces: [["Pisces"], ["Риб"]],
};
const UNSAFE = [
  /\bdiagnos/i, /\bdisorder\b/i, /\bdepress(ion|ive)\b/i, /\btrauma\b/i, /\badhd\b|\bautis/i, /\billness\b|\bdisease\b/i,
  /\bdestined\b|\bfated\b|\byour fate\b/i, /\byou will (die|marry|divorce|become rich|get rich|be rich)/i, /\bguarantee/i,
  /діагноз|розлад|депрес|травм[аиу]|хвороб|приречен|доля вам|гарантую|ви помрете|ви одружитеся|розлучите/i,
];
const within = (value: string, [min, max]: readonly [number, number]) => value.length >= min && value.length <= max;

export function validateStage(stage: Stage, data: any, packet: Packet, teachings: Teaching[]) {
  const errors: string[] = [];
  const factorIds = new Set(packet.factors.map((f) => f.id));
  const teachingIds = new Set(teachings.map((t) => t.id));
  const uncertain = packet.factors.filter((f) => f.alternatives && f.alternatives.length > 1);
  const lang = packet.locale === "uk" ? 1 : 0;

  const checkText = (where: string, text: string) => {
    if (UNSAFE.some((re) => re.test(text))) errors.push(`unsafe:${where}`);
  };
  const checkPassage = (where: string, p: Passage, text: string, limit: readonly [number, number]) => {
    if (!p || typeof text !== "string") { errors.push(`missing:${where}`); return; }
    if (!within(text, limit)) errors.push(`length:${where}:${text.length}`);
    if (!Array.isArray(p.refs) || p.refs.length === 0) errors.push(`refs:${where}:empty`);
    for (const id of p.refs ?? []) if (!factorIds.has(id)) errors.push(`refs:${where}:${id}`);
    for (const id of p.teachings ?? []) if (!teachingIds.has(id)) errors.push(`teachings:${where}:${id}`);
    const focus = focusFor(where, packet);
    if (focus.length && !(p.refs ?? []).some((id) => focus.includes(id))) errors.push(`focus:${where}`);
    const lower = text.toLowerCase();
    for (const f of uncertain) {
      if (!(p.refs ?? []).includes(f.id)) continue;
      const named = f.alternatives!.filter((sign) => SIGN_NAMES[sign][lang].some((stem) => lower.includes(stem.toLowerCase())));
      if (named.length < 2) errors.push(`uncertain:${where}:${f.id}`);
    }
    checkText(where, text);
  };

  if (stage === "a") {
    if (!within(data?.title ?? "", LIMITS.title)) errors.push("length:title");
    if (!within(data?.epigraph ?? "", LIMITS.epigraph)) errors.push("length:epigraph");
    checkText("title", `${data?.title} ${data?.epigraph}`);
    checkPassage("overview", data?.overview, data?.overview?.text, LIMITS.overview);
    for (const key of SECTIONS.a.slice(1)) {
      const facet = data?.facets?.[key];
      if (!within(facet?.heading ?? "", LIMITS.heading)) errors.push(`length:${key}:heading`);
      checkPassage(key, facet, facet?.text, LIMITS.facet);
    }
  } else {
    for (const key of SECTIONS[stage]) {
      const ch = data?.chapters?.[key];
      if (!ch) { errors.push(`missing:${key}`); continue; }
      if (!within(ch.title ?? "", LIMITS.title)) errors.push(`length:${key}:title`);
      if (!within(ch.lede ?? "", LIMITS.lede)) errors.push(`length:${key}:lede`);
      if (!within(ch.practice ?? "", LIMITS.practice)) errors.push(`length:${key}:practice`);
      const paragraphs: string[] = Array.isArray(ch.paragraphs) ? ch.paragraphs : [];
      if (paragraphs.length < LIMITS.paragraphs[0] || paragraphs.length > LIMITS.paragraphs[1]) errors.push(`count:${key}:paragraphs`);
      paragraphs.forEach((text, i) => { if (!within(text, LIMITS.paragraph)) errors.push(`length:${key}:p${i}:${text.length}`); });
      checkPassage(key, ch, [ch.lede, ...paragraphs, ch.practice].join(" "), [0, 100_000]);
    }
    if (stage === "c") {
      const keep: string[] = Array.isArray(data?.keep) ? data.keep : [];
      if (keep.length !== 3) errors.push("count:keep");
      keep.forEach((line, i) => { if (!within(line, LIMITS.keep)) errors.push(`length:keep:${i}`); checkText(`keep${i}`, line); });
    }
  }
  return errors.length ? { ok: false as const, errors } : { ok: true as const };
}
