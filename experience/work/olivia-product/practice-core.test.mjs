import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { ReadingError, STORAGE_KEY, createSession, chooseCard, createRecord } from './core.js';
import {
  METADATA_KEY, DAILY_KEY, DRAFT_KEY, localDate, loadMetadata, getMetadata,
  saveMetadata, removeMetadata, listRevisits, deriveTopics, loadDaily, saveDaily,
  loadDraft, saveDraft, clearDraft,
} from './practice-core.js';

function memoryStorage() {
  const values = new Map();
  let writes = 0;
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes++; values.set(key, value); },
    values,
    get writes() { return writes; },
  };
}
function record(cardId = 0) {
  const session = chooseCard(createSession({ question: 'What deserves attention?', intention: 'open' }, [cardId]), 0);
  return createRecord(session, { number: cardId, name: `Card ${cardId}` }, {
    meaning: 'Make room for another perspective.', prompt: 'What do you notice?', practice: 'Write one observation.',
  });
}
const codeIs = code => error => error instanceof ReadingError && error.code === code;
const sampleMetadata = (id, extra = {}) => ({ id, kind: 'single', topic: '', nextStep: '', revisitDate: '', outcome: '', reviewedAt: null, ...extra });

test('practice is empty initially and is separate from existing single/spread journals', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, 'Existing journal bytes, intentionally not parsed here');
  storage.setItem('olivia-arcana-spreads-v1', 'Existing spread bytes');
  assert.deepEqual(loadMetadata(storage), []);
  assert.equal(loadDaily(storage, '2026-09-24'), null);
  assert.equal(loadDraft(storage), null);
  saveMetadata(storage, { kind: 'single', id: 'r1', topic: 'Work' });
  saveDaily(storage, record(77), '2026-09-24');
  saveDraft(storage, record(36));
  clearDraft(storage);
  assert.equal(storage.getItem(STORAGE_KEY), 'Existing journal bytes, intentionally not parsed here');
  assert.equal(storage.getItem('olivia-arcana-spreads-v1'), 'Existing spread bytes');
  assert.equal(new Set([METADATA_KEY, DAILY_KEY, DRAFT_KEY, STORAGE_KEY]).size, 4);
});

test('metadata updates retain other fields and distinguish single/spread IDs', () => {
  const storage = memoryStorage();
  const original = saveMetadata(storage, { kind: 'single', id: 'shared', topic: '  A change  ', nextStep: 'Call a friend.', revisitDate: '2026-10-02' });
  assert.equal(original.topic, 'A change');
  saveMetadata(storage, { kind: 'spread', id: 'shared', topic: 'Relationships' });
  const updated = saveMetadata(storage, { kind: 'single', id: 'shared', outcome: 'The conversation helped.', reviewedAt: '2026-10-02T12:30:00.000Z' });
  assert.equal(updated.nextStep, 'Call a friend.');
  assert.equal(updated.revisitDate, '2026-10-02');
  assert.equal(loadMetadata(storage).length, 2);
  assert.equal(getMetadata(loadMetadata(storage), 'spread', 'shared').topic, 'Relationships');
  assert.deepEqual(getMetadata([], 'single', 'new'), sampleMetadata('new'));
  // Returned objects cannot mutate the persisted data.
  updated.topic = 'Changed only in memory';
  assert.equal(getMetadata(loadMetadata(storage), 'single', 'shared').topic, 'A change');
});

test('metadata limits and calendar/timestamp validation reject input without changing saved data', () => {
  const storage = memoryStorage();
  saveMetadata(storage, { kind: 'single', id: 'safe', topic: 'Original' });
  const before = storage.getItem(METADATA_KEY);
  for (const invalid of [
    { topic: 'x'.repeat(81) }, { nextStep: 'x'.repeat(401) }, { outcome: 'x'.repeat(2001) },
    { revisitDate: '2026-02-29' }, { revisitDate: '2024-02-30' }, { revisitDate: '2026-13-01' },
    { revisitDate: '2026-00-10' }, { revisitDate: '2026-04-31' }, { revisitDate: '0000-01-01' },
    { revisitDate: '2026-1-01' }, { reviewedAt: '2026-09-24' },
    { reviewedAt: '2026-02-30T12:00:00.000Z' }, { reviewedAt: undefined },
    { id: '' }, { kind: 'unknown' },
  ]) {
    assert.throws(() => saveMetadata(storage, { kind: 'single', id: 'safe', ...invalid }), codeIs('VALIDATION'));
    assert.equal(storage.getItem(METADATA_KEY), before);
  }
  assert.equal(saveMetadata(storage, { kind: 'single', id: 'safe', revisitDate: '2024-02-29' }).revisitDate, '2024-02-29');
  assert.equal(saveMetadata(storage, { kind: 'single', id: 'safe', revisitDate: '2000-02-29' }).revisitDate, '2000-02-29');
  assert.throws(() => saveMetadata(storage, { kind: 'single', id: 'safe', revisitDate: '1900-02-29' }), codeIs('VALIDATION'));
});

test('metadata removal preserves other readings and supports an exact undo through saveMetadata', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, 'Unchanged main journal');
  const first = saveMetadata(storage, { kind: 'single', id: 'same-id', topic: 'Work', nextStep: 'Make a call.', revisitDate: '2026-10-02', outcome: 'A useful conversation.', reviewedAt: '2026-10-02T12:00:00.000Z' });
  const spread = saveMetadata(storage, { kind: 'spread', id: 'same-id', topic: 'Family', nextStep: 'Listen.' });
  const other = saveMetadata(storage, { kind: 'single', id: 'another', topic: 'A change' });
  assert.deepEqual(removeMetadata(storage, 'single', first.id), first);
  assert.deepEqual(loadMetadata(storage), [spread, other]);
  assert.equal(storage.getItem(STORAGE_KEY), 'Unchanged main journal');
  const writes = storage.writes;
  assert.equal(removeMetadata(storage, 'single', first.id), null);
  assert.equal(storage.writes, writes);
  assert.deepEqual(saveMetadata(storage, first), first);
  assert.deepEqual(getMetadata(loadMetadata(storage), 'single', first.id), first);
  assert.deepEqual(getMetadata(loadMetadata(storage), 'spread', first.id), spread);
  assert.deepEqual(getMetadata(loadMetadata(storage), 'single', other.id), other);
});

test('metadata removal fails safely for corrupt, blocked or invalid storage and identifiers', () => {
  const storage = memoryStorage();
  saveMetadata(storage, { kind: 'single', id: 'safe', topic: 'Keep this' });
  const before = storage.getItem(METADATA_KEY);
  assert.throws(() => removeMetadata(storage, 'other', 'safe'), codeIs('VALIDATION'));
  assert.throws(() => removeMetadata(storage, 'single', ''), codeIs('VALIDATION'));
  assert.equal(storage.getItem(METADATA_KEY), before);
  storage.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
  assert.throws(() => removeMetadata(storage, 'single', 'safe'), codeIs('STORAGE_UNAVAILABLE'));
  assert.equal(storage.getItem(METADATA_KEY), before);
  for (const raw of ['{broken', '{"schemaVersion":2,"entries":[]}', '{"schemaVersion":1,"entries":[{}]}']) {
    const damaged = memoryStorage();
    damaged.setItem(METADATA_KEY, raw);
    const writes = damaged.writes;
    assert.throws(() => removeMetadata(damaged, 'single', 'safe'), codeIs('STORAGE_CORRUPT'));
    assert.equal(damaged.getItem(METADATA_KEY), raw);
    assert.equal(damaged.writes, writes);
  }
  assert.throws(() => removeMetadata(null, 'single', 'safe'), codeIs('STORAGE_UNAVAILABLE'));
});

test('due/upcoming revisits use date-only ordering, preserve text, and omit reviewed or unscheduled entries', () => {
  const entries = [
    sampleMetadata('later', { revisitDate: '2026-10-01', nextStep: '<script>literal text</script>' }),
    sampleMetadata('today', { revisitDate: '2026-09-24' }),
    sampleMetadata('old', { kind: 'spread', revisitDate: '2026-09-01' }),
    sampleMetadata('done', { revisitDate: '2026-09-20', reviewedAt: '2026-09-22T10:00:00.000Z' }),
    sampleMetadata('no-date'),
  ];
  const before = JSON.stringify(entries);
  const { due, upcoming } = listRevisits(entries, '2026-09-24');
  assert.deepEqual(due.map(entry => entry.id), ['old', 'today']);
  assert.deepEqual(upcoming.map(entry => entry.id), ['later']);
  assert.equal(upcoming[0].nextStep, '<script>literal text</script>');
  assert.equal(JSON.stringify(entries), before);
  assert.throws(() => listRevisits(entries, '2026-09-31'), codeIs('VALIDATION'));
});

test('topic suggestions come only from user entries and deduplicate without changing stored labels', () => {
  const entries = [sampleMetadata('1', { topic: 'Work' }), sampleMetadata('2', { topic: ' work ' }), sampleMetadata('3', { topic: 'Family' }), sampleMetadata('4')];
  assert.deepEqual(deriveTopics(entries), ['Family', 'Work']);
  assert.equal(entries[1].topic, ' work ');
});

test('localDate respects local midnight in both positive and negative timezones', () => {
  const url = new URL('./practice-core.js', import.meta.url).href;
  const run = (tz, instant) => execFileSync(process.execPath, ['--input-type=module', '-e', `import {localDate} from ${JSON.stringify(url)};process.stdout.write(localDate(new Date(${JSON.stringify(instant)})));`], { env: { ...process.env, TZ: tz }, encoding: 'utf8' });
  assert.equal(run('Pacific/Auckland', '2026-09-24T13:30:00.000Z'), '2026-09-25');
  assert.equal(run('America/Los_Angeles', '2026-09-24T02:30:00.000Z'), '2026-09-23');
  assert.equal(run('Europe/Kyiv', '2026-09-24T21:30:00.000Z'), '2026-09-25');
  assert.throws(() => localDate(new Date(NaN)), codeIs('VALIDATION'));
  assert.throws(() => localDate('2026-09-24'), codeIs('VALIDATION'));
});

test('a local-day reading survives reload, duplicate saves and competing valid draws unchanged', () => {
  const storage = memoryStorage(), first = record(77), competing = record(0);
  assert.deepEqual(saveDaily(storage, first, '2026-09-24'), first);
  const before = storage.getItem(DAILY_KEY), writes = storage.writes;
  assert.deepEqual(loadDaily(storage, '2026-09-24'), first);
  assert.deepEqual(saveDaily(storage, competing, '2026-09-24'), first);
  assert.deepEqual(saveDaily(storage, { ...first, note: 'Different note' }, '2026-09-24'), first);
  assert.equal(storage.getItem(DAILY_KEY), before);
  assert.equal(storage.writes, writes);
  assert.deepEqual(saveDaily(storage, competing, '2026-09-25'), competing);
  assert.deepEqual(loadDaily(storage, '2026-09-24'), first);
  assert.deepEqual(loadDaily(storage, '2026-09-25'), competing);
  assert.equal(loadDaily(storage, '2026-09-26'), null);
});

test('daily and draft storage enforce the same complete record schema as the core journal', () => {
  const storage = memoryStorage(), good = record(77);
  for (const invalid of [
    { ...good, cardId: 78 }, { ...good, schemaVersion: 2 }, { ...good, note: 'x'.repeat(4001) },
    { ...good, interpretation: {} }, { ...good, createdAt: 'bad' },
    { ...good, updatedAt: '2000-01-01T00:00:00.000Z' },
  ]) {
    assert.throws(() => saveDaily(storage, invalid, '2026-09-24'), codeIs('VALIDATION'));
    assert.throws(() => saveDraft(storage, invalid), codeIs('VALIDATION'));
  }
  assert.equal(storage.writes, 0);
  assert.throws(() => saveDaily(storage, good, '2026-02-29'), codeIs('VALIDATION'));
});

test('draft edits keep the chosen draw and targeted clear cannot remove a newer draft', () => {
  const storage = memoryStorage(), first = record(36), newer = record(64);
  saveDraft(storage, first);
  const updated = { ...first, note: 'A thought to keep.' };
  assert.deepEqual(saveDraft(storage, updated), updated);
  assert.deepEqual(loadDraft(storage), updated);
  for (const patch of [{ cardId: 1 }, { orientation: 'reversed' }, { question: 'A new question' }, { intention: 'change' }, { createdAt: '2020-01-01T00:00:00.000Z' }]) {
    assert.throws(() => saveDraft(storage, { ...updated, ...patch }), codeIs('VALIDATION'));
    assert.deepEqual(loadDraft(storage), updated);
  }
  saveDraft(storage, newer);
  assert.deepEqual(clearDraft(storage, first.id), newer);
  assert.deepEqual(loadDraft(storage), newer);
  assert.equal(clearDraft(storage, newer.id), null);
  assert.equal(loadDraft(storage), null);
  const writes = storage.writes;
  assert.equal(clearDraft(storage), null);
  assert.equal(storage.writes, writes);
});

test('malformed envelopes are preserved by all read, save and clear operations', () => {
  const good = record();
  const operations = [
    [METADATA_KEY, storage => loadMetadata(storage), storage => saveMetadata(storage, { id: 'test', kind: 'single' })],
    [DAILY_KEY, storage => loadDaily(storage, '2026-09-24'), storage => saveDaily(storage, good, '2026-09-24')],
    [DRAFT_KEY, storage => loadDraft(storage), storage => saveDraft(storage, good), storage => clearDraft(storage)],
  ];
  for (const [key, ...calls] of operations) for (const raw of ['{broken', '', 'null', '[]', '{}', '{"schemaVersion":2}', '{"schemaVersion":1}']) {
    const storage = memoryStorage();
    storage.setItem(key, raw);
    const writes = storage.writes;
    for (const call of calls) assert.throws(() => call(storage), codeIs('STORAGE_CORRUPT'));
    assert.equal(storage.getItem(key), raw);
    assert.equal(storage.writes, writes);
  }
});

test('partially damaged lists and duplicate days/metadata are never filtered then overwritten', () => {
  const good = record(), entry = sampleMetadata('test');
  const cases = [
    [METADATA_KEY, { entries: [entry, {}] }, storage => saveMetadata(storage, { id: 'test', kind: 'single' })],
    [METADATA_KEY, { entries: [entry, entry] }, storage => saveMetadata(storage, { id: 'test', kind: 'single' })],
    [DAILY_KEY, { days: [{ date: '2026-09-24', record: good }, { date: '2026-09-25', record: {} }] }, storage => saveDaily(storage, good, '2026-09-26')],
    [DAILY_KEY, { days: [{ date: '2026-09-24', record: good }, { date: '2026-09-24', record: good }] }, storage => saveDaily(storage, good, '2026-09-26')],
    [DRAFT_KEY, { record: {} }, storage => clearDraft(storage)],
  ];
  for (const [key, payload, call] of cases) {
    const storage = memoryStorage(), raw = JSON.stringify({ schemaVersion: 1, ...payload });
    storage.setItem(key, raw);
    assert.throws(() => call(storage), codeIs('STORAGE_CORRUPT'));
    assert.equal(storage.getItem(key), raw);
  }
});

test('blocked and quota-limited storage errors leave the previous practice intact', () => {
  assert.throws(() => loadMetadata(null), codeIs('STORAGE_UNAVAILABLE'));
  const blocked = { getItem() { throw new DOMException('blocked', 'SecurityError'); }, setItem() {} };
  assert.throws(() => loadDaily(blocked, '2026-09-24'), codeIs('STORAGE_UNAVAILABLE'));
  assert.throws(() => clearDraft(blocked), codeIs('STORAGE_UNAVAILABLE'));
  const storage = memoryStorage(), good = record();
  saveDraft(storage, good);
  const prior = storage.getItem(DRAFT_KEY);
  storage.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  assert.throws(() => saveDraft(storage, { ...good, note: 'Not saved' }), codeIs('STORAGE_QUOTA'));
  assert.equal(storage.getItem(DRAFT_KEY), prior);
  const blockedWrite = { getItem() { return null; }, setItem() { throw new Error('blocked'); } };
  assert.throws(() => saveMetadata(blockedWrite, { id: 'test', kind: 'single' }), codeIs('STORAGE_UNAVAILABLE'));
});
