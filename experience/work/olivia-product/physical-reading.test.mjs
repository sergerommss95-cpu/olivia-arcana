import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhysicalRecord, filterPhysicalCards } from './physical-reading.js';
import { TAROT_CARDS } from './deck-catalog.js';
import { cardNotesForOrientation } from './content.js';
import { saveRecord, loadRecords, exportRecords } from './core.js';

const identity = { id: 'physical-reading-test', now: '2026-09-24T12:00:00.000Z' };
const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }; };

test('all 78 manually selected cards retain their exact identity and chosen orientation', () => {
  for (const card of TAROT_CARDS) for (const orientation of ['upright', 'reversed']) {
    const record = createPhysicalRecord({ cardId: card.number, orientation }, identity);
    assert.equal(record.cardId, card.number);
    assert.equal(record.cardName, card.name);
    assert.equal(record.orientation, orientation);
    assert.equal(record.source, 'physical');
    assert.equal(record.interpretation.meaning, cardNotesForOrientation(card.number, orientation).meaning);
    assert.equal(record.id, identity.id);
    assert.equal(record.createdAt, identity.now);
  }
});

test('invalid IDs, orientations and text limits are rejected by the shared reading schema', () => {
  for (const cardId of [-1, 78, 2.5, '18', null, undefined]) assert.throws(() => createPhysicalRecord({ cardId }, identity), { code: 'VALIDATION' });
  for (const patch of [{ orientation: 'sideways' }, { question: 'x'.repeat(1601) }, { note: 'x'.repeat(4001) }, { intention: 'prediction' }]) assert.throws(() => createPhysicalRecord({ cardId: 18, ...patch }, identity), { code: 'VALIDATION' });
  const record = createPhysicalRecord({ cardId: 0, question: 'Я'.repeat(1600), note: 'Н'.repeat(4000) }, identity);
  assert.equal(record.question.length, 1600); assert.equal(record.note.length, 4000);
});

test('card search works in English and Ukrainian without changing stable IDs', () => {
  assert.equal(filterPhysicalCards().length, 78);
  assert.deepEqual(filterPhysicalCards('moon').map(card => card.number), [18]);
  assert.deepEqual(filterPhysicalCards('МІСЯЦЬ', 'uk').map(card => card.number), [18]);
  assert.deepEqual(filterPhysicalCards('queen cups', 'uk').map(card => card.number), [48]);
  assert.equal(filterPhysicalCards('unrecognized card').length, 0);
  assert.equal(filterPhysicalCards('  ', 'uk').length, 78);
});

test('physical provenance, notes, exact question and orientation survive the existing almanac', () => {
  const store = storage(), question = '<script>literal question</script> & "my words"';
  const original = createPhysicalRecord({ cardId: 77, orientation: 'reversed', question, note: 'A detail from my own deck.' }, identity);
  saveRecord(store, original);
  const [restored] = loadRecords(store);
  assert.deepEqual(restored, original);
  assert.deepEqual(JSON.parse(exportRecords([restored])).records[0], original);
  assert.throws(() => saveRecord(store, { ...restored, source: undefined }), { code: 'VALIDATION' });
});
