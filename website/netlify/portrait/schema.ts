// website/netlify/portrait/schema.ts
/** Structured-output schemas for each stage. They are constant: ids are plain strings and `validateStage` holds them to the packet and selection, so the provider's schema cache is reused across jobs. */
import { SECTIONS, type Stage } from "./plan.ts";

const str = { type: "string" };
const strings = { type: "array", items: str };
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });

export function stageSchema(stage: Stage) {
  const passage = obj({ text: str, refs: strings, teachings: strings });
  const facet = obj({ heading: str, text: str, refs: strings, teachings: strings });
  const chapter = obj({ title: str, lede: str, paragraphs: strings, practice: str, refs: strings, teachings: strings });
  if (stage === "a") {
    const facets = Object.fromEntries(SECTIONS.a.slice(1).map((key) => [key, facet]));
    const outline = obj(Object.fromEntries([...SECTIONS.b, ...SECTIONS.c].map((key) => [key, str])));
    return obj({ title: str, epigraph: str, outline, overview: passage, facets: obj(facets) });
  }
  const chapters = obj(Object.fromEntries(SECTIONS[stage].map((key) => [key, chapter])));
  return stage === "b" ? obj({ chapters }) : obj({ chapters, keep: strings });
}
