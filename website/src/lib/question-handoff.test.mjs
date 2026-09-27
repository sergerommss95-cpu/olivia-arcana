import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_HANDOFF_KEY, readQuestionHandoff, writeQuestionHandoff, clearQuestionHandoff } from './question-handoff.ts';

function memory() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test('a carried question survives Ask remounts and a document reload without extending its expiry', () => {
  const storage = memory(), now = 5_000_000;
  const question = '  Як підготуватися до складної розмови?\nМої власні слова.  ';
  writeQuestionHandoff(storage, question, now);
  const original = storage.getItem(QUESTION_HANDOFF_KEY);
  assert.equal(readQuestionHandoff(storage, now), question);
  assert.equal(readQuestionHandoff(storage, now + 100), question);
  assert.equal(readQuestionHandoff(storage, now + 30 * 60 * 1000), question);
  assert.equal(storage.getItem(QUESTION_HANDOFF_KEY), original);
  assert.equal(readQuestionHandoff(storage, now + 30 * 60 * 1000 + 1), null);
  assert.equal(storage.getItem(QUESTION_HANDOFF_KEY), null);
});

test('edits replace the draft, an empty question clears it, and successful submission acknowledges it', () => {
  const storage = memory();
  writeQuestionHandoff(storage, 'Original question', 100);
  writeQuestionHandoff(storage, 'My edited question', 200);
  assert.equal(readQuestionHandoff(storage, 201), 'My edited question');
  writeQuestionHandoff(storage, ' \n ', 202);
  assert.equal(readQuestionHandoff(storage, 203), null);
  writeQuestionHandoff(storage, 'A new question', 300);
  clearQuestionHandoff(storage);
  assert.equal(readQuestionHandoff(storage, 301), null);
});

test('both reception and writing enforce the 1600-character boundary and invalid dates are rejected', () => {
  const storage = memory();
  writeQuestionHandoff(storage, 'ї'.repeat(1600), 100);
  assert.equal(readQuestionHandoff(storage, 101).length, 1600);
  assert.throws(() => writeQuestionHandoff(storage, 'ї'.repeat(1601), 100));
  for (const raw of ['{', 'null', JSON.stringify({schemaVersion:1,question:'q',createdAt:102}), JSON.stringify({schemaVersion:1,question:'q'.repeat(1601),createdAt:100}), JSON.stringify({schemaVersion:2,question:'q',createdAt:100})]) {
    storage.setItem(QUESTION_HANDOFF_KEY, raw);
    assert.equal(readQuestionHandoff(storage, 101), null);
    assert.equal(storage.getItem(QUESTION_HANDOFF_KEY), null);
  }
});

test('blocked storage permits a fresh Ask page but transfer failures remain visible to the caller', () => {
  const storage = {getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  assert.equal(readQuestionHandoff(storage, 100), null);
  assert.throws(() => writeQuestionHandoff(storage, 'Keep my question', 100), /blocked/);
  assert.throws(() => writeQuestionHandoff(storage, '', 100), /blocked/);
});
