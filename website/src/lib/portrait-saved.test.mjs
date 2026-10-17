// website/src/lib/portrait-saved.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { savePortrait, listSaved, loadSaved, forgetSaved, MAX, KEY } from "./portrait/saved.js";
const fake = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const reading = (id) => ({ id, locale: "en", packet: { v: 1, factors: [] }, stages: { a: { title: `T${id}` } }, teachings: {} });

test("save, list newest first, load, forget", () => {
  const storage = fake();
  savePortrait(reading("a"), { storage, now: () => 1 });
  savePortrait(reading("b"), { storage, now: () => 2 });
  assert.deepEqual(listSaved({ storage }).map((s) => s.id), ["b", "a"]);
  assert.equal(loadSaved("a", { storage }).stages.a.title, "Ta");
  forgetSaved("a", { storage });
  assert.equal(loadSaved("a", { storage }), null);
});
test("never stores birth details and trims to MAX", () => {
  const storage = fake();
  for (let i = 0; i < MAX + 3; i++) savePortrait({ ...reading(`r${i}`), name: "Olena", date: "2000-02-01" }, { storage, now: () => i });
  const raw = JSON.stringify([...Array(1)].map(() => storage.getItem("olivia:portraits:v1")));
  assert.ok(!raw.includes("Olena") && !raw.includes("2000-02-01"));
  assert.equal(listSaved({ storage }).length, MAX);
});
test("blocked storage never throws", () => {
  const storage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.deepEqual(listSaved({ storage }), []);
  assert.equal(savePortrait(reading("x"), { storage }), null);
});

test("saving the same id replaces it", () => {
  const storage = fake();
  savePortrait(reading("a"), { storage, now: () => 1 });
  savePortrait(reading("b"), { storage, now: () => 2 });
  const again = savePortrait({ ...reading("a"), stages: { a: { title: "Again" } } }, { storage, now: () => 3 });
  assert.deepEqual(again, { id: "a", savedAt: 3, locale: "en", title: "Again" });
  assert.deepEqual(listSaved({ storage }).map((s) => [s.id, s.title]), [["a", "Again"], ["b", "Tb"]]);
});
test("stores exactly the derived reading", () => {
  const storage = fake();
  savePortrait({ ...reading("a"), name: "Olena", time: "04:30", place: "Lviv" }, { storage, now: () => 7 });
  const [entry] = JSON.parse(storage.getItem(KEY));
  assert.deepEqual(Object.keys(entry).sort(), ["id", "locale", "packet", "savedAt", "stages", "teachings"]);
  forgetSaved("a", { storage });
  assert.equal(storage.getItem(KEY), null);
});
test("unparsable storage reads as empty and a save starts fresh", () => {
  const storage = fake();
  storage.setItem(KEY, "{not json");
  assert.deepEqual(listSaved({ storage }), []);
  assert.equal(loadSaved("a", { storage }), null);
  assert.equal(savePortrait(reading("a"), { storage, now: () => 1 }).id, "a");
  assert.deepEqual(listSaved({ storage }).map((s) => s.id), ["a"]);
});
test("blocked storage: load is null, forget is quiet", () => {
  const storage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.equal(loadSaved("x", { storage }), null);
  assert.doesNotThrow(() => forgetSaved("x", { storage }));
});
test("a full storage on write returns null and keeps the earlier list", () => {
  const storage = fake();
  savePortrait(reading("a"), { storage, now: () => 1 });
  const full = { ...storage, setItem() { throw new Error("QuotaExceededError"); } };
  assert.equal(savePortrait(reading("b"), { storage: full, now: () => 2 }), null);
  assert.deepEqual(listSaved({ storage }).map((s) => s.id), ["a"]);
});
