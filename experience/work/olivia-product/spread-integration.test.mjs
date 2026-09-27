import test from 'node:test';
import {CARD_COUNT} from './deck-catalog.js';
import assert from 'node:assert/strict';
import { SPREADS, buildSpreadReading, positionReading, synthesizeSpread } from './spread-content.js';
import { createSpreadSession, selectSpreadCard, revealAll, createSpreadRecord, saveSpreadRecord, loadSpreadRecords, SPREAD_COUNTS } from './spread-core.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

for (const spread of SPREADS) {
  test(`${spread.name}: authored content, positions, core schema and saved restoration agree for every card`, () => {
    assert.equal(spread.count, SPREAD_COUNTS[spread.id]);
    assert.equal(spread.positions.length, spread.count);
    assert.equal(spread.layout.length, spread.count);
    assert.deepEqual(spread.readingOrder, Array.from({ length: spread.count }, (_, i) => i));
    for (let offset = 0; offset < CARD_COUNT; offset++) {
      const orderedIds = Array.from({ length: spread.count }, (_, i) => (offset + i) % CARD_COUNT);
      for (const intention of ['open', 'relationships', 'work', 'change']) {
        let session = createSpreadSession({ spreadId: spread.id, count: spread.count, intention, question: 'What could I look at differently?' });
        for (const cardId of orderedIds) session = selectSpreadCard(session, session.deck.indexOf(cardId));
        session = revealAll(session);
        const reading = buildSpreadReading(spread, orderedIds, intention);
        const record = createSpreadRecord(session, spread, reading, 'My own response.');
        assert.deepEqual(record.cardIds, orderedIds);
        assert.deepEqual(record.cards.map(card => card.positionId), spread.positions.map(position => position.id));
        assert.deepEqual(record.cards.map(card => card.label), spread.positions.map(position => position.label));
        assert.doesNotMatch(JSON.stringify(record), /\bundefined\b|\[object Object\]/);
        const journal = storage();
        saveSpreadRecord(journal, record);
        assert.deepEqual(loadSpreadRecords(journal), [record]);
      }
    }
  });
}

test('a card receives genuinely position-specific meaning and a reordered draw changes the synthesis', () => {
  const spread = SPREADS.find(item => item.id === 'clarity3');
  const situation = positionReading(18, spread.positions[0]);
  const complication = positionReading(18, spread.positions[1]);
  const next = positionReading(18, spread.positions[2]);
  assert.equal(new Set([situation.meaning, complication.meaning, next.meaning]).size, 3);
  assert.notDeepEqual(synthesizeSpread(spread, [18, 4, 17]).paragraphs, synthesizeSpread(spread, [4, 18, 17]).paragraphs);
  assert.throws(() => buildSpreadReading(spread, [18, 18, 17]), TypeError);
  assert.throws(() => buildSpreadReading(spread, [18, 4]), TypeError);
});
