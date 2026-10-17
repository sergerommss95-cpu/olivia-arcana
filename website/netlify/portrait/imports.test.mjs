// The portrait API runs on Netlify Functions, where bare packages are loaded by Node from the
// function's node_modules. astronomy-engine ships CommonJS and a named import of it failed there
// (502 on every request). The server never needs the ephemeris, so keep it out of the graph.
import test from "node:test";
import assert from "node:assert/strict";
import { builtinModules } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const website = resolve(here, "../..");
const ENTRIES = [
  ...["api.ts", "run.ts"].map((name) => resolve(here, name)),
  ...["portrait.mts", "portrait-background.mts", "portrait-cleanup.mts"].map((name) => resolve(here, "../functions", name)),
];
const ALLOWED_PACKAGES = new Set(["@anthropic-ai/sdk", "@netlify/blobs"]);
const SOURCE = /\.(?:ts|mts|js|mjs)$/;

/** Module specifiers a source file loads at run time. Type-only imports are erased and skipped. */
function specifiersOf(text) {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const found = [];
  // import … from "x" / export … from "x" (the clause may span lines)
  for (const m of code.matchAll(/^\s*(?:import|export)\b([^;'"]*?)\bfrom\s*(["'])([^"']+)\2/gm)) {
    if (!/^\s*type\b/.test(m[1])) found.push(m[3]);
  }
  for (const m of code.matchAll(/^\s*import\s*(["'])([^"']+)\1/gm)) found.push(m[2]);
  for (const m of code.matchAll(/\bimport\(\s*(["'])([^"']+)\1\s*\)/g)) found.push(m[2]);
  return found;
}

/** The package a bare specifier names: "@scope/name/sub" is "@scope/name", "name/sub" is "name". */
function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

const isBuiltin = (specifier) => specifier.startsWith("node:") || builtinModules.includes(packageOf(specifier));

/** Follows relative specifiers from the entries; records who imported each file and each package. */
function walk(entries) {
  const files = new Map(); // absolute path → the file that first reached it (null for an entry)
  const packages = new Map(); // package name → [{ from, specifier }]
  const queue = entries.map((file) => [file, null]);
  while (queue.length) {
    const [file, parent] = queue.shift();
    if (files.has(file)) continue;
    assert.ok(existsSync(file), `${parent ? relative(website, parent) : "entry"} imports ${relative(website, file)}, which does not exist`);
    files.set(file, parent);
    if (!SOURCE.test(file)) continue;
    for (const specifier of specifiersOf(readFileSync(file, "utf8"))) {
      if (specifier.startsWith(".")) queue.push([resolve(dirname(file), specifier), file]);
      else if (!isBuiltin(specifier)) {
        const name = packageOf(specifier);
        packages.set(name, [...(packages.get(name) ?? []), { from: file, specifier }]);
      }
    }
  }
  return { files, packages };
}

/** "api.ts → packet.js → chart.js" */
function chain(files, file) {
  const path = [];
  for (let at = file; at; at = files.get(at)) path.unshift(relative(website, at));
  return path.join(" → ");
}

const graph = walk(ENTRIES);

test("the walk reaches the whole server graph, so the checks below are not vacuous", () => {
  const reached = new Set([...graph.files.keys()].map((file) => relative(website, file)));
  for (const expected of ["netlify/portrait/store.ts", "netlify/portrait/claude.ts", "netlify/portrait/validate.ts", "netlify/portrait/cleanup.ts", "src/lib/portrait/packet.js", "src/lib/portrait/arkan.js"]) {
    assert.ok(reached.has(expected), `${expected} should be reachable from the portrait functions`);
  }
  assert.ok(graph.packages.has("@anthropic-ai/sdk"), "claude.ts imports the Anthropic SDK");
});

test("no file reachable from the portrait API or writer imports astronomy-engine", () => {
  const offenders = (graph.packages.get("astronomy-engine") ?? []).map(({ from }) => chain(graph.files, from) + " → astronomy-engine");
  assert.deepEqual(offenders, [], "astronomy-engine is CommonJS and breaks the Netlify function; import constants from src/lib/astrology/constants.js, not chart.js");
});

test("the only packages reached are the SDK and blobs, plus node builtins", () => {
  const extra = [...graph.packages].filter(([name]) => !ALLOWED_PACKAGES.has(name)).map(([name, uses]) => `${name} (via ${chain(graph.files, uses[0].from)})`);
  assert.deepEqual(extra, []);
});
