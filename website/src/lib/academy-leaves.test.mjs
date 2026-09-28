import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dir = new URL("./academy/leaves/", import.meta.url);
const files = readdirSync(dir).filter((f) => /^\d\d\.json$/.test(f)).sort();
const leaves = files.map((f) => ({ file: f, leaf: JSON.parse(readFileSync(new URL(f, dir), "utf8")) }));
const isCourt = (id) => id >= 22 && (id - 22) % 14 >= 10;
const TEXT_KEYS = ["essence", "number", "tradition", "practice"];
const EN_BANNED = /\b(destin(y|ed)|fated?|luck(y)?|the universe|will happen|is going to|karma)\b/i;
const UK_INFORMAL = /(^|[^А-Яа-яІіЇїЄєҐґ’'])(ти|тебе|тобі|тобою|твій|твоя|твоє|твої|твого|твоєї|твоїй|твоєму|твоїм|твоїх)(?=[^А-Яа-яІіЇїЄєҐґ’']|$)/i;

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test("the academy has one complete leaf for every card", () => {
  assert.equal(files.length, 78);
  for (const { file, leaf } of leaves) assert.equal(String(leaf.id).padStart(2, "0") + ".json", file);
  assert.equal(new Set(leaves.map(({ leaf }) => leaf.slug)).size, 78);
  const index = readFileSync(new URL("index.ts", dir), "utf8");
  assert.deepEqual([...index.matchAll(/"\.\/(\d\d\.json)"/g)].map((m) => m[1]), files, "leaves/index.ts lists every leaf (run scripts/academy-leaves-index.mjs)");
});

test("every leaf is written in English and Ukrainian with the same structure", () => {
  for (const { leaf } of leaves) {
    const where = `${leaf.id} ${leaf.slug}`;
    assert.match(leaf.slug, /^[a-z-]+$/, where);
    assert.match(leaf.artwork?.sha256 ?? "", /^[0-9a-f]{64}$/, where);
    assert.ok(leaf.symbols.length >= 5 && leaf.symbols.length <= 9, `${where}: symbols`);
    for (const symbol of leaf.symbols) {
      for (const axis of ["x", "y"]) assert.ok(Number.isInteger(symbol[axis]) && symbol[axis] >= 0 && symbol[axis] <= 100, `${where}: ${symbol.key}.${axis}`);
      for (const lang of ["en", "uk"]) for (const key of ["name", "seen", "meaning"]) assert.ok(symbol[lang]?.[key]?.trim(), `${where}: ${symbol.key}.${lang}.${key}`);
    }
    for (const lang of ["en", "uk"]) {
      const text = leaf[lang];
      for (const key of TEXT_KEYS) assert.ok(text[key]?.trim(), `${where}: ${lang}.${key}`);
      for (const key of ["upright", "reversed"]) assert.ok(text[key].length && text[key].every((p) => p.trim()), `${where}: ${lang}.${key}`);
      for (const key of ["love", "work", "self"]) assert.ok(text.areas[key]?.trim(), `${where}: ${lang}.areas.${key}`);
      for (const key of ["heart", "challenge", "advice"]) assert.ok(text.positions[key]?.trim(), `${where}: ${lang}.positions.${key}`);
      assert.ok(text.keywords.upright.length >= 4 && text.keywords.reversed.length >= 4, `${where}: ${lang}.keywords`);
      assert.equal(text.questions.length, 3, `${where}: ${lang}.questions`);
      assert.ok(text.questions.every((q) => q.trim().endsWith("?")), `${where}: ${lang}.questions end with ?`);
      assert.equal(Boolean(text.court), isCourt(leaf.id), `${where}: ${lang}.court only on court cards`);
      assert.equal(text.pairs.length, 3, `${where}: ${lang}.pairs`);
      for (const pair of text.pairs) assert.ok(Number.isInteger(pair.with) && pair.with >= 0 && pair.with <= 77 && pair.with !== leaf.id && pair.text.trim(), `${where}: ${lang}.pairs`);
    }
    assert.deepEqual(leaf.uk.pairs.map((p) => p.with), leaf.en.pairs.map((p) => p.with), `${where}: pairs match across languages`);
  }
});

test("the voice holds: no prediction words in English, formal address in Ukrainian", () => {
  for (const { leaf } of leaves) {
    const en = strings([leaf.en, leaf.symbols.map((s) => s.en)]);
    const uk = strings([leaf.uk, leaf.symbols.map((s) => s.uk)]);
    for (const s of en) {
      assert.doesNotMatch(s, EN_BANNED, `${leaf.slug}: ${s.slice(0, 80)}`);
      assert.doesNotMatch(s, /[—–]|'|"/, `${leaf.slug}: typography in "${s.slice(0, 80)}"`);
    }
    for (const s of uk) {
      assert.doesNotMatch(s, UK_INFORMAL, `${leaf.slug}: informal address in "${s.slice(0, 80)}"`);
      assert.doesNotMatch(s, /[А-Яа-яІіЇїЄєҐґ]'[А-Яа-яІіЇїЄєҐґ]/, `${leaf.slug}: ASCII apostrophe in "${s.slice(0, 80)}"`);
      assert.doesNotMatch(s, /Всесвіт/, `${leaf.slug}: ${s.slice(0, 80)}`);
    }
  }
});
