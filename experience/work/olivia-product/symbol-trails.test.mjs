import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SYMBOL_TRAILS, SYMBOL_ARTWORK, getSymbolTrail, comparisonCards } from './symbol-trails.js';
import { TAROT_CARDS } from './deck-catalog.js';

test('the curated visual study has three bilingual trails and nine verified cards', () => {
  assert.deepEqual(SYMBOL_TRAILS.map(trail => trail.id), ['light', 'water', 'thresholds']);
  const ids = SYMBOL_TRAILS.flatMap(trail => trail.cards.map(card => card.cardId));
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, 9);
  assert.deepEqual([...ids].sort((a,b) => a-b), Object.keys(SYMBOL_ARTWORK).map(Number).sort((a,b) => a-b));
  for (const trail of SYMBOL_TRAILS) {
    assert.equal(trail.cards.length, 3);
    assert.ok(Object.isFrozen(trail));
    for (const language of ['en', 'uk']) {
      for (const key of ['name', 'title', 'introduction', 'comparison', 'prompt']) assert.ok(trail[language][key]?.trim(), `${trail.id}/${language}/${key}`);
      for (const card of trail.cards) {
        assert.equal(TAROT_CARDS[card.cardId].number, card.cardId);
        for (const key of ['title', 'location', 'observation', 'reflection', 'detail']) assert.ok(card[language][key]?.trim(), `${card.cardId}/${language}/${key}`);
        assert.notEqual(card[language].observation, card[language].reflection, 'visible evidence and reflective invitation remain distinct');
        assert.ok(Object.isFrozen(card[language]));
      }
    }
  }
});

test('every observation is tied to the exact original artwork that was visually inspected', async () => {
  await Promise.all(Object.entries(SYMBOL_ARTWORK).map(async ([id, reference]) => {
    assert.equal(Number(reference.file.split('_')[0]), Number(id), 'artwork filename must identify its canonical card');
    const folder = Number(id) < 22 ? '../hero-v12/assets/public/cards-portal/' : './assets/minor-arcana/';
    const bytes = await readFile(new URL(folder + reference.file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), reference.sha256, `Card ${id} artwork changed: visually review its symbol observations before updating this reference.`);
  }));
});

test('comparison keeps trail order when the visitor selects a pair in another order', () => {
  assert.deepEqual(comparisonCards('water', [55, 14]).map(card => card.cardId), [14, 55]);
  assert.deepEqual(comparisonCards('light', [19, 9, 17]).map(card => card.cardId), [9, 17, 19]);
  assert.deepEqual(comparisonCards('thresholds', [2, 18]).map(card => card.cardId), [2, 18]);
});

test('comparison rejects too few cards, duplicates, unreviewed cards and mixed trails', () => {
  for (const selected of [[], [9], [9,9], [9,17,19,9], [9,0], [9,14], ['9',17], null]) assert.throws(() => comparisonCards('light', selected), TypeError);
  assert.throws(() => getSymbolTrail('all-78'), TypeError);
  assert.throws(() => comparisonCards('__proto__', [9,17]), TypeError);
  assert.equal(getSymbolTrail('light'), SYMBOL_TRAILS[0]);
});
