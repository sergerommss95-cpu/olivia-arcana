import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, ReadingError, shuffleDeck, createSession, chooseCard,
  createRecord, loadRecords, saveRecord, removeRecord, exportRecords, getLastRecord,
} from './core.js';

const ids = Array.from({ length: 22 }, (_, i) => i);
const interpretation = { meaning: 'A new perspective.', prompt: 'What do you notice?', practice: 'Write one observation.' };
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values };
}
function record({ question = '', note = '' } = {}) {
  const session = chooseCard(createSession({ question, intention: 'open' }, ids), 4);
  return createRecord(session, { number: session.cardId, name: `Card ${session.cardId}` }, interpretation, note);
}
const codeIs = code => error => error instanceof ReadingError && error.code === code;

test('crypto shuffle preserves every card exactly once without mutating the input', () => {
  for (let n = 0; n < 100; n++) assert.deepEqual([...shuffleDeck(ids)].sort((a, b) => a - b), ids);
  assert.deepEqual(ids, Array.from({ length: 22 }, (_, i) => i));
  assert.throws(() => shuffleDeck([1, 1]), codeIs('VALIDATION'));
  assert.throws(() => shuffleDeck([22]), codeIs('VALIDATION'));
});

test('Fisher-Yates rejects the biased tail of the random range', () => {
  const samples = [0xffffffff, 0xfffffffe, 0];
  let calls = 0;
  const shuffled = shuffleDeck([0, 1, 2], () => { calls++; return samples.shift(); });
  assert.equal(calls, 3);
  assert.deepEqual(shuffled, [1, 0, 2]);
  assert.throws(() => shuffleDeck([0, 1], () => -1), codeIs('VALIDATION'));
});

test('a chosen card remains stable across additional taps; sessions are immutable', () => {
  const session = createSession({ question: 'What can I bring to today?', intention: 'change' }, ids);
  const chosen = chooseCard(session, 3);
  assert.equal(session.cardId, null);
  assert.equal(chosen.cardId, session.deck[3]);
  assert.equal(chooseCard(chosen, 18), chosen);
  assert.equal(Object.isFrozen(session.deck), true);
  assert.equal(Object.isFrozen(chosen), true);
  assert.throws(() => chooseCard(session, -1), codeIs('VALIDATION'));
  assert.throws(() => createRecord(session, { number: 0, name: 'The Fool' }, interpretation), codeIs('VALIDATION'));
});

test('session and record input limits are enforced without silent truncation', () => {
  assert.throws(() => createSession({ question: 'a'.repeat(501) }), codeIs('VALIDATION'));
  assert.throws(() => createSession({ intention: 'fortune' }), codeIs('VALIDATION'));
  const session = chooseCard(createSession({}, [0]), 0);
  assert.throws(() => createRecord(session, { number: 1, name: 'The Magician' }, interpretation), codeIs('VALIDATION'));
  assert.throws(() => createRecord(session, { number: 0, name: 'The Fool' }, interpretation, 'a'.repeat(4001)), codeIs('VALIDATION'));
});

test('save and update keep one stable reading; export round-trips all plain strings', () => {
  const storage = memoryStorage();
  const unsafeText = '<script>alert("hello")</script> & <img src=x onerror=alert(1)>';
  const first = record({ question: unsafeText, note: unsafeText });
  assert.equal(saveRecord(storage, first).length, 1);
  assert.equal(loadRecords(storage)[0].question, unsafeText);
  assert.equal(loadRecords(storage)[0].note, unsafeText);
  const update = { ...first, note: 'A later observation.', updatedAt: new Date().toISOString() };
  assert.equal(saveRecord(storage, update).length, 1);
  assert.equal(getLastRecord(loadRecords(storage)).note, 'A later observation.');
  const exported = JSON.parse(exportRecords(loadRecords(storage)));
  assert.equal(exported.schemaVersion, 1);
  assert.deepEqual(exported.records, loadRecords(storage));
  assert.throws(() => saveRecord(storage, { ...update, question: 'A different question' }), codeIs('VALIDATION'));
  assert.equal(removeRecord(storage, first.id).length, 0);
  assert.equal(getLastRecord(loadRecords(storage)), null);
});

test('corrupt, unsupported and partially invalid storage is never overwritten', () => {
  for (const value of ['{broken', '', 'null', '[]', '{"schemaVersion":2,"records":[]}', '{"schemaVersion":1,"records":[{}]}']) {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, value);
    assert.throws(() => loadRecords(storage), codeIs('STORAGE_CORRUPT'));
    assert.throws(() => saveRecord(storage, record()), codeIs('STORAGE_CORRUPT'));
    assert.throws(() => removeRecord(storage, 'any'), codeIs('STORAGE_CORRUPT'));
    assert.equal(storage.getItem(STORAGE_KEY), value);
  }
  const storage = memoryStorage();
  const good = record();
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records: [good, good] }));
  assert.throws(() => loadRecords(storage), codeIs('STORAGE_CORRUPT'));
});

test('blocked and quota-limited storage report actionable failures', () => {
  const blocked = { getItem() { throw new DOMException('blocked', 'SecurityError'); }, setItem() {} };
  assert.throws(() => loadRecords(blocked), codeIs('STORAGE_UNAVAILABLE'));
  assert.throws(() => loadRecords(null), codeIs('STORAGE_UNAVAILABLE'));
  const quota = { getItem() { return null; }, setItem() { throw new DOMException('full', 'QuotaExceededError'); } };
  assert.throws(() => saveRecord(quota, record()), codeIs('STORAGE_QUOTA'));
  const blockedWrite = { getItem() { return null; }, setItem() { throw new DOMException('blocked', 'SecurityError'); } };
  assert.throws(() => saveRecord(blockedWrite, record()), codeIs('STORAGE_UNAVAILABLE'));
});

test('journal limit preserves all 100 readings and allows updates and removal', () => {
  const storage = memoryStorage();
  const records = Array.from({ length: 100 }, () => record());
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records }));
  const original = storage.getItem(STORAGE_KEY);
  assert.throws(() => saveRecord(storage, record()), codeIs('STORAGE_LIMIT'));
  assert.equal(storage.getItem(STORAGE_KEY), original);
  assert.equal(saveRecord(storage, { ...records[0], note: 'Updated.' }).length, 100);
  assert.equal(removeRecord(storage, records[0].id).length, 99);
  assert.equal(saveRecord(storage, record()).length, 100);
});
