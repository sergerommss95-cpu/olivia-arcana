import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadingError, STORAGE_KEY } from './core.js';
import {
  SPREAD_STORAGE_KEY, SPREAD_COUNTS, createSpreadSession, selectSpreadCard,
  revealNext, revealAll, createSpreadRecord, loadSpreadRecords, saveSpreadRecord,
  removeSpreadRecord, exportSpreadRecords, getLastSpreadRecord,
} from './spread-core.js';

const codeIs = code => error => error instanceof ReadingError && error.code === code;
function storage() {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
}
function definition(id = 'clarity3') {
  const count = SPREAD_COUNTS[id];
  return { id, count, name: 'Test spread', positions: Array.from({ length: count }, (_, i) => ({ id: `position-${i}`, label: `Position ${i + 1}` })) };
}
function completeSession(spread = definition(), question = '') {
  let session = createSpreadSession({ question, intention: 'open', spreadId: spread.id, count: spread.count });
  for (let i = 0; i < spread.count; i++) session = selectSpreadCard(session, i);
  return revealAll(session);
}
function reading(session, spread = definition(session.spreadId)) {
  return {
    cards: session.cardIds.map((cardId, i) => ({ cardId, positionId: spread.positions[i].id, label: spread.positions[i].label, meaning: `Meaning ${cardId}`, prompt: 'What do you notice?', practice: 'Write one observation.' })),
    synthesis: { paragraphs: ['A relationship between the cards.', 'Room for your own interpretation.'], prompt: 'What would you like to carry forward?' },
  };
}
function record(spread = definition(), note = '') {
  const session = completeSession(spread);
  return createSpreadRecord(session, spread, reading(session, spread), note);
}

test('all supported spreads create immutable unique decks with correct counts', () => {
  for (const [spreadId, count] of Object.entries(SPREAD_COUNTS)) {
    const session = createSpreadSession({ spreadId, count });
    assert.equal(session.deck.length, 78);
    assert.equal(new Set(session.deck).size, 78);
    assert.equal(session.count, count);
    assert.deepEqual(session.cardIds, []);
    assert.equal(Object.isFrozen(session), true);
    assert.equal(Object.isFrozen(session.deck), true);
    assert.equal(Object.isFrozen(session.selectedSlots), true);
  }
  assert.throws(() => createSpreadSession({ spreadId: 'clarity3', count: 5 }), codeIs('VALIDATION'));
  assert.throws(() => createSpreadSession({ spreadId: 'unknown', count: 3 }), codeIs('VALIDATION'));
  assert.throws(() => createSpreadSession({ spreadId: 'clarity3', count: 3 }, [0, 1]), codeIs('VALIDATION'));
  assert.throws(() => createSpreadSession({ spreadId: 'clarity3', count: 3, question: 'x'.repeat(1601) }), codeIs('VALIDATION'));
});

test('rapid repeated picks never duplicate cards or exceed the spread, and order is stable', () => {
  const original = createSpreadSession({ spreadId: 'clarity3', count: 3 });
  let session = original;
  for (const slot of [9, 9, 4, 4, 17, 3, 17, 9]) session = selectSpreadCard(session, slot);
  assert.deepEqual(session.selectedSlots, [9, 4, 17]);
  assert.deepEqual(session.cardIds, [original.deck[9], original.deck[4], original.deck[17]]);
  assert.deepEqual(session.deck, original.deck);
  assert.equal(original.cardIds.length, 0);
  assert.equal(selectSpreadCard(session, 1), session);
  assert.throws(() => selectSpreadCard(session, 78), codeIs('VALIDATION'));
  assert.throws(() => selectSpreadCard(session, 2.5), codeIs('VALIDATION'));
  assert.throws(() => selectSpreadCard({ ...session, cardIds: [0, 0, 0] }, 1), codeIs('VALIDATION'));
});

test('reveals progress one at a time, never exceed selected cards and never shuffle', () => {
  let session = createSpreadSession({ spreadId: 'crossroads5', count: 5 });
  assert.equal(revealNext(session), session);
  assert.equal(revealAll(session), session);
  for (const slot of [20, 1, 4, 7, 12]) session = selectSpreadCard(session, slot);
  const order = [...session.cardIds], deck = [...session.deck];
  const first = revealNext(session);
  assert.equal(first.revealedCount, 1);
  assert.equal(session.revealedCount, 0);
  session = first;
  for (let i = 0; i < 20; i++) session = revealNext(session);
  assert.equal(session.revealedCount, 5);
  assert.deepEqual(session.cardIds, order);
  assert.deepEqual(session.deck, deck);
  assert.equal(revealNext(session), session);
  assert.equal(revealAll(session), session);
});

test('records require every chosen card to be revealed and preserve spread position order', () => {
  const spread = definition();
  let session = createSpreadSession({ spreadId: spread.id, count: spread.count });
  session = selectSpreadCard(session, 2);
  assert.throws(() => createSpreadRecord(session, spread, reading(session)), codeIs('VALIDATION'));
  session = selectSpreadCard(selectSpreadCard(session, 5), 11);
  assert.throws(() => createSpreadRecord(session, spread, reading(session)), codeIs('VALIDATION'));
  session = revealAll(session);
  const meaning = reading(session), result = createSpreadRecord(session, spread, meaning);
  assert.deepEqual(result.cardIds, session.cardIds);
  assert.deepEqual(result.cards.map(card => card.positionId), spread.positions.map(position => position.id));
  assert.throws(() => createSpreadRecord(session, spread, { ...meaning, cards: [...meaning.cards].reverse() }), codeIs('VALIDATION'));
  assert.throws(() => createSpreadRecord(session, spread, meaning, 'x'.repeat(4001)), codeIs('VALIDATION'));
});

test('save, restore, update and export keep actual ordered cards without drawing again', () => {
  const store = storage(), original = record(definition('compass8'));
  const sentinel = '{"existing":"one-card data"}';
  store.setItem(STORAGE_KEY, sentinel);
  saveSpreadRecord(store, original);
  const restored = loadSpreadRecords(store)[0];
  assert.deepEqual(restored, original);
  const updated = { ...restored, note: '<script>not executable</script> & "a thought"', updatedAt: new Date().toISOString() };
  assert.equal(saveSpreadRecord(store, updated).length, 1);
  assert.equal(getLastSpreadRecord(loadSpreadRecords(store)).note, updated.note);
  assert.deepEqual(JSON.parse(exportSpreadRecords(loadSpreadRecords(store))).records[0].cardIds, original.cardIds);
  assert.equal(store.getItem(STORAGE_KEY), sentinel);
  assert.equal(removeSpreadRecord(store, original.id).length, 0);
  assert.equal(getLastSpreadRecord(loadSpreadRecords(store)), null);
});

test('an existing record cannot silently change its selected cards, question or position order', () => {
  const store = storage(), original = record();
  saveSpreadRecord(store, original);
  assert.throws(() => saveSpreadRecord(store, { ...original, question: 'A different question' }), codeIs('VALIDATION'));
  const swapped = { ...original, cardIds: [...original.cardIds].reverse(), cards: [...original.cards].reverse() };
  assert.throws(() => saveSpreadRecord(store, swapped), codeIs('VALIDATION'));
  assert.deepEqual(loadSpreadRecords(store), [original]);
});

test('corrupt and unsupported spread storage is reported and never overwritten', () => {
  const original = record();
  for (const raw of ['{bad', '', 'null', '[]', '{"schemaVersion":2,"records":[]}', JSON.stringify({ schemaVersion: 1, records: [{ ...original, revealedCount: 1 }] }), JSON.stringify({ schemaVersion: 1, records: [original, original] })]) {
    const store = storage(); store.setItem(SPREAD_STORAGE_KEY, raw);
    assert.throws(() => loadSpreadRecords(store), codeIs('STORAGE_CORRUPT'));
    assert.throws(() => saveSpreadRecord(store, record()), codeIs('STORAGE_CORRUPT'));
    assert.throws(() => removeSpreadRecord(store, original.id), codeIs('STORAGE_CORRUPT'));
    assert.equal(store.getItem(SPREAD_STORAGE_KEY), raw);
  }
});

test('blocked access, quota errors and capacity are explicit and do not report false saves', () => {
  const blocked = { getItem() { throw new DOMException('blocked', 'SecurityError'); }, setItem() {} };
  assert.throws(() => loadSpreadRecords(blocked), codeIs('STORAGE_UNAVAILABLE'));
  assert.throws(() => loadSpreadRecords(null), codeIs('STORAGE_UNAVAILABLE'));
  const quota = { getItem: () => null, setItem() { throw new DOMException('full', 'QuotaExceededError'); } };
  assert.throws(() => saveSpreadRecord(quota, record()), codeIs('STORAGE_QUOTA'));
  const blockedWrite = { getItem: () => null, setItem() { throw new DOMException('blocked', 'SecurityError'); } };
  assert.throws(() => saveSpreadRecord(blockedWrite, record()), codeIs('STORAGE_UNAVAILABLE'));
  const store = storage(), records = Array.from({ length: 1000 }, () => record());
  store.setItem(SPREAD_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records }));
  const before = store.getItem(SPREAD_STORAGE_KEY);
  assert.throws(() => saveSpreadRecord(store, record()), codeIs('STORAGE_LIMIT'));
  assert.equal(store.getItem(SPREAD_STORAGE_KEY), before);
  assert.equal(saveSpreadRecord(store, { ...records[0], note: 'A later thought.' }).length, 1000);
  removeSpreadRecord(store, records[0].id);
  assert.equal(saveSpreadRecord(store, record()).length, 1000);
});
