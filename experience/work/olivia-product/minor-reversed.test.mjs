import test from 'node:test';
import assert from 'node:assert/strict';
import { MINOR_REVERSED } from './minor-reversed.js';
import { CARD_NOTES, cardNotesForOrientation } from './content.js';

test('every Minor Arcana card has its own authored reversed reflection', () => {
  const ids = Object.keys(MINOR_REVERSED).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ids, Array.from({ length: 56 }, (_, i) => i + 22));
  const meanings = new Set();
  for (const id of ids) {
    const note = cardNotesForOrientation(id, 'reversed');
    assert.ok(!meanings.has(note.meaning), `${id} repeats another reversed meaning`);
    meanings.add(note.meaning);
    assert.ok(note.meaning.split(/\s+/).length >= 40, `${id} meaning is too thin`);
    assert.match(note.prompt, /\?$/, `${id} prompt`);
    assert.match(note.practice, /\.$/, `${id} practice`);
    assert.notEqual(note.prompt, CARD_NOTES[id].prompt, `${id} prompt repeats the upright one`);
    assert.equal(note.learn, CARD_NOTES[id].learn);
    // The earlier fill-in template must not come back.
    assert.doesNotMatch(note.meaning, /Notice whether the quality of/);
    assert.doesNotMatch(note.meaning, /\b(will happen|is destined|the universe|bad luck)\b/i);
  }
});
