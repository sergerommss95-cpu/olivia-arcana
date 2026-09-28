import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SYMBOL_TRAIL_DATA as SYMBOL_TRAILS, SYMBOL_ARTWORK } from './symbol-trails-data.js';
import { findTrail, loupeBackground } from './symbol-trails.js';
import { TAROT_CARDS } from './deck-catalog.js';

test('every trail is bilingual and follows its symbol through four to eight different cards', () => {
  assert.ok(SYMBOL_TRAILS.length >= 12, 'the language of symbols covers the main symbols of the deck');
  assert.equal(new Set(SYMBOL_TRAILS.map(trail => trail.id)).size, SYMBOL_TRAILS.length);
  for (const trail of SYMBOL_TRAILS) {
    for (const language of ['en', 'uk']) assert.ok(trail.group?.[language]?.trim(), `${trail.id} group/${language}`);
    assert.ok(trail.cards.length >= 4 && trail.cards.length <= 8, `${trail.id} has ${trail.cards.length} cards`);
    assert.equal(new Set(trail.cards.map(card => card.cardId)).size, trail.cards.length, `${trail.id} repeats a card`);
    for (const language of ['en', 'uk']) {
      for (const key of ['name', 'title', 'introduction', 'comparison', 'prompt']) assert.ok(trail[language][key]?.trim(), `${trail.id}/${language}/${key}`);
      assert.ok(trail[language].prompt.trim().endsWith('?'), `${trail.id}/${language} prompt is a question`);
    }
    for (const card of trail.cards) {
      assert.ok(TAROT_CARDS[card.cardId], `${trail.id}: card ${card.cardId} exists`);
      assert.ok(Number.isInteger(card.x) && card.x >= 0 && card.x <= 100 && Number.isInteger(card.y) && card.y >= 0 && card.y <= 100);
      assert.match(card.slug, /^[a-z-]+$/);
      for (const language of ['en', 'uk']) for (const key of ['name', 'seen', 'meaning']) assert.ok(card[language][key]?.trim(), `${trail.id}/${card.cardId}/${language}/${key}`);
      assert.notEqual(card.en.seen, card.en.meaning, 'visible evidence and meaning remain distinct');
    }
  }
});

test('every observation is tied to the exact original artwork that was visually inspected', async () => {
  const used = new Set(SYMBOL_TRAILS.flatMap(trail => trail.cards.map(card => card.cardId)));
  assert.deepEqual([...used].sort((a, b) => a - b), Object.keys(SYMBOL_ARTWORK).map(Number).sort((a, b) => a - b));
  await Promise.all(Object.entries(SYMBOL_ARTWORK).map(async ([id, reference]) => {
    assert.equal(Number(reference.file.split('_')[0]), Number(id), 'artwork filename must identify its canonical card');
    const folder = Number(id) < 22 ? '../hero-v12/assets/public/cards-portal/' : './assets/minor-arcana/';
    const bytes = await readFile(new URL(folder + reference.file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), reference.sha256, `Card ${id} artwork changed: visually review its symbol observations before updating this reference.`);
  }));
});

test('a loupe centres its symbol and stays inside the artwork at the edges', () => {
  assert.deepEqual(loupeBackground({ x: 50, y: 50 }, 4), { size: '400% auto', position: '50.0% 50.0%' });
  assert.equal(loupeBackground({ x: 0, y: 0 }, 4).position, '0.0% 0.0%');
  assert.equal(loupeBackground({ x: 100, y: 100 }, 4).position, '100.0% 100.0%');
  const [across] = loupeBackground({ x: 25, y: 50 }, 4).position.split(' ').map(parseFloat);
  // (0.5 - 0.25 × 4) / (1 - 4) = 1/6 of the travel.
  assert.ok(Math.abs(across - 100 / 6) < 0.1);
});

test('an unknown trail is refused', () => {
  assert.throws(() => findTrail(SYMBOL_TRAILS, 'all-78'), TypeError);
  assert.throws(() => findTrail(SYMBOL_TRAILS, '__proto__'), TypeError);
  assert.equal(findTrail(SYMBOL_TRAILS, SYMBOL_TRAILS[0].id), SYMBOL_TRAILS[0]);
});
