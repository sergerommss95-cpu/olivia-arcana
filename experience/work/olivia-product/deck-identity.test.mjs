import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReadingError, STORAGE_KEY, createSession, chooseCard, createRecord,
  loadRecords, saveRecord, exportRecords, normalizeDeckId,
} from './core.js';
import {
  SPREAD_STORAGE_KEY, createSpreadSession, selectSpreadCard, revealNext, revealAll,
  createSpreadRecord, loadSpreadRecords, saveSpreadRecord, exportSpreadRecords,
} from './spread-core.js';

const validation = error => error instanceof ReadingError && error.code === 'VALIDATION';
const corrupt = error => error instanceof ReadingError && error.code === 'STORAGE_CORRUPT';
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function singleRecord(deckId) {
  const session = chooseCard(createSession({ deckId }), 4);
  return createRecord(session, { number: session.cardId, name: 'Chosen card' }, {
    meaning: 'The chosen card’s meaning.', prompt: 'What do you notice?', practice: 'Keep a thought.',
  });
}
const spread = {
  id: 'clarity3', count: 3, name: 'A little clarity',
  positions: ['Situation', 'Complication', 'Next step'].map((label, i) => ({ id: `position-${i}`, label })),
};
function spreadRecord(deckId) {
  let session = createSpreadSession({ spreadId: spread.id, count: spread.count, deckId });
  for (const slot of [2, 5, 11]) session = selectSpreadCard(session, slot);
  session = revealAll(session);
  return createSpreadRecord(session, spread, {
    cards: session.cardIds.map((cardId, i) => ({
      cardId, positionId: spread.positions[i].id, label: spread.positions[i].label,
      meaning: 'A card meaning.', prompt: 'What do you notice?', practice: 'Keep a thought.',
    })),
    synthesis: { paragraphs: ['The cards read together.'], prompt: 'What will you carry forward?' },
  });
}
const withoutDeck = record => { const legacy = { ...record }; delete legacy.deckId; return legacy; };

test('new and legacy readings default to the original Olivia deck without rewriting storage on load', () => {
  assert.equal(createSession().deckId, 'olivia');
  assert.equal(createSpreadSession({ spreadId: 'clarity3', count: 3 }).deckId, 'olivia');
  const store = storage();
  for (const [key, record, load, exportAll] of [
    [STORAGE_KEY, singleRecord(), loadRecords, exportRecords],
    [SPREAD_STORAGE_KEY, spreadRecord(), loadSpreadRecords, exportSpreadRecords],
  ]) {
    const legacy = withoutDeck(record), raw = JSON.stringify({ schemaVersion: 1, records: [legacy] });
    store.setItem(key, raw);
    assert.equal(load(store)[0].deckId, 'olivia');
    assert.equal(JSON.parse(exportAll([legacy])).records[0].deckId, 'olivia');
    assert.equal(store.getItem(key), raw);
  }
});

test('unknown deck identity is rejected at session, record, and stored-data boundaries', () => {
  for (const deckId of ['missing', '', null, 1, {}, ['olivia']]) {
    assert.throws(() => normalizeDeckId(deckId), validation);
    assert.throws(() => createSession({ deckId }), validation);
    assert.throws(() => createSpreadSession({ spreadId: 'clarity3', count: 3, deckId }), validation);
  }
  const store = storage();
  for (const [key, record, save, load, exportAll] of [
    [STORAGE_KEY, singleRecord(), saveRecord, loadRecords, exportRecords],
    [SPREAD_STORAGE_KEY, spreadRecord(), saveSpreadRecord, loadSpreadRecords, exportSpreadRecords],
  ]) {
    const invalid = { ...record, deckId: 'unknown' };
    assert.throws(() => save(store, invalid), validation);
    assert.throws(() => exportAll([invalid]), validation);
    const raw = JSON.stringify({ schemaVersion: 1, records: [invalid] });
    store.setItem(key, raw);
    assert.throws(() => load(store), corrupt);
    assert.equal(store.getItem(key), raw);
  }
});

test('single draw keeps its immutable deck identity through choosing, save, edit, and export', () => {
  const original = createSession({ deckId: 'space-between' });
  assert.throws(() => { original.deckId = 'olivia'; }, TypeError);
  const chosen = chooseCard(original, 8);
  assert.equal(chosen.deckId, 'space-between');
  assert.equal(original.cardId, null);
  assert.equal(chooseCard(chosen, 2), chosen);
  assert.throws(() => chooseCard({ ...original, deckId: 'invalid' }, 8), validation);
  const record = createRecord(chosen, { number: chosen.cardId, name: 'Chosen card' }, {
    meaning: 'A meaning.', prompt: 'A question?', practice: 'A practice.',
  });
  const store = storage();
  saveRecord(store, record);
  saveRecord(store, { ...record, note: 'A later observation.' });
  const reopened = loadRecords(store)[0];
  assert.equal(reopened.deckId, 'space-between');
  assert.equal(JSON.parse(exportRecords([reopened])).records[0].deckId, 'space-between');
  const raw = store.getItem(STORAGE_KEY);
  assert.throws(() => saveRecord(store, { ...record, deckId: 'olivia' }), validation);
  assert.throws(() => saveRecord(store, withoutDeck(record)), validation);
  assert.equal(store.getItem(STORAGE_KEY), raw);
});

test('spread deck identity survives each choice and reveal, saved revisions, and export', () => {
  const original = createSpreadSession({ spreadId: 'clarity3', count: 3, deckId: 'space-between' });
  assert.throws(() => { original.deckId = 'olivia'; }, TypeError);
  let session = original;
  for (const slot of [4, 10, 17]) {
    session = selectSpreadCard(session, slot);
    assert.equal(session.deckId, 'space-between');
  }
  assert.deepEqual(original.cardIds, []);
  session = revealNext(session);
  assert.equal(session.deckId, 'space-between');
  session = revealAll(session);
  assert.equal(session.deckId, 'space-between');
  assert.equal(session.revealedCount, 3);
  assert.throws(() => revealNext({ ...session, deckId: 'invalid' }), validation);
  const record = spreadRecord('space-between'), store = storage();
  saveSpreadRecord(store, record);
  saveSpreadRecord(store, { ...record, note: 'Something became clearer.' });
  const reopened = loadSpreadRecords(store)[0];
  assert.equal(reopened.deckId, 'space-between');
  assert.equal(JSON.parse(exportSpreadRecords([reopened])).records[0].deckId, 'space-between');
  const raw = store.getItem(SPREAD_STORAGE_KEY);
  assert.throws(() => saveSpreadRecord(store, { ...record, deckId: 'olivia' }), validation);
  assert.throws(() => saveSpreadRecord(store, withoutDeck(record)), validation);
  assert.equal(store.getItem(SPREAD_STORAGE_KEY), raw);
});

test('a legacy Olivia record can be edited but cannot acquire a different deck', () => {
  for (const [key, original, load, save] of [
    [STORAGE_KEY, singleRecord(), loadRecords, saveRecord],
    [SPREAD_STORAGE_KEY, spreadRecord(), loadSpreadRecords, saveSpreadRecord],
  ]) {
    const store = storage(), legacy = withoutDeck(original);
    store.setItem(key, JSON.stringify({ schemaVersion: 1, records: [legacy] }));
    save(store, { ...legacy, note: 'A new note on an old reading.' });
    assert.equal(load(store)[0].deckId, 'olivia');
    assert.throws(() => save(store, { ...legacy, deckId: 'space-between' }), validation);
  }
});
