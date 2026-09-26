import test from "node:test";
import assert from "node:assert/strict";
import { parseSavedSpreads, SPREAD_STORAGE_UNAVAILABLE } from "./saved-spreads.ts";

const createRecord = (id, spreadId = "clarity3") => {
  const count = { clarity3: 3, crossroads5: 5, compass8: 8 }[spreadId];
  return {
    schemaVersion: 1, id, spreadId, spreadName: "A moment of clarity", createdAt: "2026-09-24T12:00:00.000Z", updatedAt: "2026-09-24T12:00:00.000Z",
    question: "What should I notice?", intention: "open", note: "Keep this thought.",
    cardIds: Array.from({ length: count }, (_, i) => i), revealedCount: count,
    cards: Array.from({ length: count }, (_, i) => ({ cardId: i, positionId: `position-${i}`, label: `Position ${i}`, meaning: "Meaning", prompt: "Prompt", practice: "Practice" })),
    synthesis: { paragraphs: ["The reading together."], prompt: "What feels useful?" },
  };
};
const envelope = records => JSON.stringify({ schemaVersion: 1, records });

test("all supported complete spreads retain card and position order", () => {
  for (const spreadId of ["clarity3", "crossroads5", "compass8"]) {
    const record = createRecord(spreadId, spreadId);
    assert.deepEqual(parseSavedSpreads(envelope([record])).records, [record]);
  }
});

test("incomplete, mismatched, duplicate and malformed records do not hide a valid saved spread", () => {
  const good = createRecord("valid");
  const partial = { ...createRecord("partial"), revealedCount: 2 };
  const wrongOrder = createRecord("wrong-order");
  wrongOrder.cards.reverse();
  const duplicateCard = createRecord("duplicate-card");
  duplicateCard.cardIds[1] = 0;
  const invalidDate = { ...createRecord("date"), createdAt: "2026-99-99T12:00:00.000Z" };
  const raw = envelope([partial, wrongOrder, duplicateCard, invalidDate, good, good, null]);
  const result = parseSavedSpreads(raw);
  assert.equal(result.status, "ready");
  assert.equal(result.skipped, true);
  assert.deepEqual(result.records, [good]);
  assert.equal(raw, envelope([partial, wrongOrder, duplicateCard, invalidDate, good, good, null]));
});

test("loading, missing storage, empty and broken journals stay distinct", () => {
  assert.equal(parseSavedSpreads(null).status, "loading");
  assert.equal(parseSavedSpreads(SPREAD_STORAGE_UNAVAILABLE).status, "unavailable");
  assert.deepEqual(parseSavedSpreads("").records, []);
  for (const raw of ["{", "null", JSON.stringify({ schemaVersion: 2, records: [] }), envelope(Array.from({ length: 101 }, (_, i) => createRecord(String(i))))]) {
    assert.equal(parseSavedSpreads(raw).status, "malformed");
  }
});
