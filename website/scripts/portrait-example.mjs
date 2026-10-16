// website/scripts/portrait-example.mjs
// Builds the example portraits the entry screen offers ("Read an example
// portrait") from two finished M2 eval readings of a fictional person:
//   public/portrait/example-en.json  ← m1-en-olena (timed)
//   public/portrait/example-uk.json  ← m1-uk-olena (unknown time, Moon in two signs)
// Each file is { example: true, locale, packet, stages, teachings }: the derived
// packet (no birth details), the written stages with stage A's outline removed,
// and the teachings those stages cite, chosen exactly as the server chooses them.
// Provisional: the owner rates both readings before launch.
//
//   NODE_OPTIONS="--disable-warning=MODULE_TYPELESS_PACKAGE_JSON" node scripts/portrait-example.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { citedTeachings, selectTeachings } from "../netlify/portrait/teachings.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const SOURCES = { en: "m1-en-olena", uk: "m1-uk-olena" };
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const bank = readJson(path.join(here, "../netlify/portrait/knowledge/bank.json"));
const out = path.join(here, "../public/portrait");
mkdirSync(out, { recursive: true });

for (const [locale, name] of Object.entries(SOURCES)) {
  const run = readJson(path.join(repo, `docs/superpowers/evidence/2026-10-16-m2/m2-medium/${name}.json`));
  if (run.status !== "done" || run.locale !== locale || run.packet?.locale !== locale) throw new Error(`${name}: not a finished ${locale} reading`);
  const a = { ...run.stages.a };
  delete a.outline;
  const stages = { a, b: run.stages.b, c: run.stages.c };
  const teachings = citedTeachings(selectTeachings(run.packet, bank), bank, stages);
  const file = path.join(out, `example-${locale}.json`);
  writeFileSync(file, `${JSON.stringify({ example: true, locale, packet: run.packet, stages, teachings })}\n`);
  console.log(`${path.relative(process.cwd(), file)}  ${a.title} · ${Object.keys(teachings).length} teachings`);
}
