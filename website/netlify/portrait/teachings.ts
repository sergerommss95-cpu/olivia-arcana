// website/netlify/portrait/teachings.ts
/** Picks the passages of the knowledge bank that fit each calculated factor's role. */
import positions from "./knowledge/positions.json" with { type: "json" };

type Text = { en: string; uk: string };
type Factor = { id: string; kind: string; [key: string]: unknown };
type Packet = { locale: "en" | "uk"; factors: Factor[] };
export type Teaching = { id: string; factors: string[]; label: string; text: string; sources: string[] };
export type Bank = Record<string, any>;

/** Card fields that fit each Arkan position: V18's role table (portrait-profile-knowledge-v18.js) without the per-position `lead` framing, in this bank's field names. */
export const ARKAN_FIELDS: Record<number, string[]> = {
  1: ["character", "growth"], 2: ["character", "growth"], 3: ["character", "growth"],
  4: ["risk", "inner"], 5: ["character", "growth"], 6: ["strength", "work"],
  7: ["strength", "work"], 8: ["strength", "inner"], 12: ["inner", "growth"],
  13: ["character", "inner"], 14: ["character", "relationship"],
};
export const NUMBER_FIELDS: Record<string, string[]> = {
  lifePath: ["essence", "strengths", "blindSpots", "development"],
  expression: ["essence", "traits", "strengths", "blindSpots", "work"],
  soulUrge: ["essence", "innerWorld", "relationships"],
  personality: ["essence", "relationships"],
};
const POSITION_NAMES: Record<number, Text> = {
  1: { en: "Early foundation", uk: "Ранні основи" }, 2: { en: "Adult development", uk: "Дорослий розвиток" },
  3: { en: "Longer perspective", uk: "Довша перспектива" }, 4: { en: "Inner tension", uk: "Внутрішня напруга" },
  5: { en: "Conscious aim", uk: "Усвідомлена мета" }, 6: { en: "Integrating potential", uk: "Інтеграційний потенціал" },
  7: { en: "Contribution", uk: "Внесок" }, 8: { en: "Resource", uk: "Ресурс" },
  12: { en: "Restoration", uk: "Відновлення" }, 13: { en: "Self-image", uk: "Образ себе" },
  14: { en: "Outward presence", uk: "Зовнішній прояв" },
};
const ANGLE_NAMES: Record<string, Text> = { asc: { en: "Ascendant", uk: "Асцендент" }, mc: { en: "Midheaven", uk: "Середина неба" } };
/** Reader-facing role names, from V18's `numberTitles` (portrait-ai-knowledge-v15.js). */
const NUMBER_TITLES: Record<string, Text> = {
  lifePath: { en: "Life path", uk: "Життєвий шлях" },
  expression: { en: "Expression", uk: "Вираження" },
  soulUrge: { en: "Inner motivation", uk: "Внутрішній мотив" },
  personality: { en: "Outward personality", uk: "Зовнішній прояв" },
};
/** Mirrors V18's `sourceIdsFor` (portrait-numbers-v15.js) for one number. */
const NUMBER_SOURCES = (value: number) => ["v15-num-roles", "v15-num-check-roles", `v15-num-${value}`, ...(value > 9 ? ["v15-num-check-masters"] : [])];

export function selectTeachings(packet: Packet, bank: Bank): Teaching[] {
  const lang = packet.locale;
  const pick = (t: Text | string[] | { en: string[]; uk: string[] }) => {
    const value = (t as any)[lang];
    return Array.isArray(value) ? value.join(", ") : String(value ?? "");
  };
  const out: Teaching[] = [];
  const add = (t: Teaching) => {
    for (const id of t.sources) if (!Object.hasOwn(bank.sources, id)) throw new Error(`unknown_source:${id}`);
    if (t.text.trim().length > 20) out.push(t);
  };

  for (const f of packet.factors) {
    if (f.kind === "arkan") {
      const position = f.position as number, card = bank.cards[String(f.card)];
      add({ id: `card-${position}-frame`, factors: [f.id], label: pick(POSITION_NAMES[position]), text: pick((positions as Record<string, Text>)[String(position)]), sources: ["arkan-chrzanowska"] });
      for (const field of ARKAN_FIELDS[position]) {
        add({ id: `card-${position}-${field}`, factors: [f.id], label: `${pick(POSITION_NAMES[position])} · ${pick(card.name)}`, text: pick(card[field]), sources: ["arkan-chrzanowska"] });
      }
    } else if (f.kind === "number" && NUMBER_FIELDS[f.role as string]) {
      const role = f.role as string, entry = bank.numbers[role][String(f.value)], roleName = pick(NUMBER_TITLES[role]);
      add({ id: `num-${role}-role`, factors: [f.id], label: `${roleName} · ${pick(entry.name)}`, text: pick(bank.roleNotes[role]), sources: ["v18-core-role-architecture"] });
      for (const field of NUMBER_FIELDS[role]) add({ id: `num-${role}-${field}`, factors: [f.id], label: `${roleName} ${f.value} · ${pick(entry.name)}`, text: pick(entry[field]), sources: NUMBER_SOURCES(f.value as number) });
    } else if (f.kind === "planet") {
      const body = f.body as string;
      const signs = (f.alternatives as string[] | null) ?? [f.sign as string];
      for (const sign of signs) {
        const id = signs.length > 1 ? `natal-${body}-sign-${sign}` : `natal-${body}-sign`;
        const personal = bank.personal[body]?.[sign];
        const text = personal
          ? [personal.disposition, personal.satisfaction, personal.strain].map(pick).join(" ")
          : body === "sun" || body === "moon"
            ? pick(bank.signs[sign][body])
            : `${pick(bank.planets[body].function)} ${pick(bank.signs[sign].style)} ${pick(bank.signs[sign].gift)}`;
        const sources = personal ? [`v18-natal-function-${body}`, `v18-natal-style-${sign}`] : ["astrodienst-intro"];
        add({ id, factors: [f.id], label: `${pick(bank.planets[body].name)} · ${pick(bank.signs[sign].name)}`, text, sources });
      }
      if (f.house) {
        const house = bank.houses[String(f.house)];
        add({ id: `natal-${body}-house`, factors: [f.id], label: `${pick(bank.planets[body].name)} · ${pick(house.name)}`, text: pick(house.meaning), sources: ["astrodienst-intro"] });
      }
    } else if (f.kind === "angle") {
      const sign = bank.signs[f.sign as string];
      add({ id: `natal-${f.angle}-sign`, factors: [f.id], label: `${pick(ANGLE_NAMES[f.angle as string])} · ${pick(sign.name)}`, text: f.angle === "asc" ? pick(sign.ascendant) : `${pick(sign.style)} ${pick(sign.gift)}`, sources: ["astrodienst-intro"] });
    } else if (f.kind === "aspect") {
      const type = bank.aspects[f.aspect as string];
      const angle = [f.a, f.b].find((x) => Object.hasOwn(ANGLE_NAMES, x as string)) as string | undefined;
      const planet = [f.a, f.b].find((x) => !Object.hasOwn(ANGLE_NAMES, x as string)) as string | undefined;
      const pair = bank.pairs[`${f.a}:${f.b}`] ?? bank.pairs[`${f.b}:${f.a}`];
      if (planet && angle) {
        add({ id: f.id, factors: [f.id], label: [bank.planets[planet].name, ANGLE_NAMES[angle], type.name].map(pick).join(" · "), text: [bank.planets[planet].function, type.meaning].map(pick).join(" "), sources: ["astrodienst-intro"] });
      } else if (pair) {
        add({ id: f.id, factors: [f.id], label: `${pick(pair.title)} · ${pick(type.name)}`, text: [pair.relationship, pair.tension, pair.integration, type.meaning].map(pick).join(" "), sources: ["astrodienst-intro"] });
      }
    }
  }
  return out;
}

/** The teachings the written stages cite, as the status endpoint returns them: id → label, text and source links. */
export function citedTeachings(selected: Teaching[], bank: Bank, stages: unknown): Record<string, { label: string; text: string; sources: { title: string; url: string }[] }> {
  const cited = new Set<string>();
  const collect = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) k === "teachings" && Array.isArray(v) ? v.forEach((t) => cited.add(String(t))) : collect(v);
  };
  collect(stages);
  return Object.fromEntries(selected.filter((t) => cited.has(t.id)).map((t) => [t.id, { label: t.label, text: t.text, sources: t.sources.map((s) => bank.sources[s]) }]));
}
