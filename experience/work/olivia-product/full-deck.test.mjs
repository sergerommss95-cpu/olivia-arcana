import test from 'node:test';
import assert from 'node:assert/strict';
import { TAROT_CARDS, CARD_IDS, CARD_COUNT, SUITS, cardCaption } from './deck-catalog.js';
import {
  INTENTIONS, STORAGE_KEY, ReadingError, createSession, chooseCard, shuffleDeck,
  createRecord, loadRecords, saveRecord, exportRecords,
} from './core.js';
import {
  SPREAD_STORAGE_KEY, createSpreadSession, selectSpreadCard, revealAll,
  createSpreadRecord, loadSpreadRecords, saveSpreadRecord, exportSpreadRecords,
} from './spread-core.js';
import { CARD_NOTES } from './content.js';
import { SPREADS, positionReading, buildSpreadReading } from './spread-content.js';
import { cardEditorial } from './spread-editorial.js';

const validationError = error => error instanceof ReadingError && error.code === 'VALIDATION';
const interpretation = { meaning: 'A grounded perspective.', prompt: 'What can you sustain?', practice: 'Choose one manageable action.' };
const legacySingle = {
  schemaVersion: 1, id: 'saved-before-full-deck',
  createdAt: '2026-09-20T12:00:00.000Z', updatedAt: '2026-09-20T12:00:00.000Z',
  question: 'What should I notice?', intention: 'open', cardId: 18, cardName: 'The Moon',
  interpretation, note: 'Keep this existing reflection.',
};
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
function completeSpread(ids) {
  const spread = SPREADS.find(item => item.id === 'clarity3');
  let session = createSpreadSession({ spreadId: spread.id, count: spread.count }, ids);
  for (const cardId of ids) session = selectSpreadCard(session, session.deck.indexOf(cardId));
  session = revealAll(session);
  return createSpreadRecord(session, spread, buildSpreadReading(spread, session.cardIds));
}

test('the catalog has 22 preserved majors and four complete 14-card suits with stable artwork IDs', () => {
  assert.equal(CARD_COUNT, 78);
  assert.deepEqual(CARD_IDS, Array.from({ length: 78 }, (_, i) => i));
  assert.equal(TAROT_CARDS.filter(card => card.arcana === 'major').length, 22);
  assert.equal(TAROT_CARDS[0].name, 'The Fool');
  assert.equal(TAROT_CARDS[18].name, 'The Moon');
  assert.equal(TAROT_CARDS[21].name, 'The World');
  for (const [index, suit] of SUITS.entries()) {
    const cards = TAROT_CARDS.filter(card => card.suit === suit.toLowerCase());
    assert.equal(cards.length, 14);
    assert.deepEqual(cards.map(card => card.rank), Array.from({ length: 14 }, (_, i) => i + 1));
    assert.equal(cards[0].number, 22 + index * 14);
    assert.equal(cards[0].name, `Ace of ${suit}`);
    assert.equal(cards[13].name, `King of ${suit}`);
    assert.match(cardCaption(cards[13].number), /MINOR ARCANA/);
  }
  assert.equal(TAROT_CARDS[77].name, 'King of Pentacles');
});

test('the full default deck is unique, immutable and stable after choosing its last minor', () => {
  const session = createSession();
  assert.equal(session.deck.length, 78);
  assert.deepEqual([...session.deck].sort((a, b) => a - b), CARD_IDS);
  assert.equal(Object.isFrozen(session.deck), true);
  const slot = session.deck.indexOf(77), selected = chooseCard(session, slot);
  assert.equal(selected.cardId, 77);
  assert.equal(selected.deck, session.deck);
  assert.equal(chooseCard(selected, (slot + 1) % 78), selected);
  assert.throws(() => selected.deck.push(78), TypeError);
  assert.throws(() => chooseCard(session, 78), validationError);
  assert.throws(() => shuffleDeck([78]), validationError);
  assert.throws(() => shuffleDeck([77, 77]), validationError);
  assert.deepEqual(shuffleDeck([77]), [77]);
  // An explicitly requested Major Arcana deck remains a supported subset.
  assert.equal(createSession({}, CARD_IDS.slice(0, 22)).deck.length, 22);
});

test('existing v1 Major Arcana readings and new minor readings round-trip together without changing the saved draw', () => {
  const store = memoryStorage();
  const legacyEnvelope = JSON.stringify({ schemaVersion: 1, records: [legacySingle] });
  store.setItem(STORAGE_KEY, legacyEnvelope);
  const migratedSingle = { ...legacySingle, orientation: 'upright', deckId: 'olivia' };
  assert.deepEqual(loadRecords(store), [migratedSingle]);
  assert.equal(store.getItem(STORAGE_KEY), legacyEnvelope, 'reading must not rewrite existing storage');
  const session = chooseCard(createSession({}, [77]), 0);
  const minor = createRecord(session, TAROT_CARDS[77], interpretation, 'A new minor-card reading.');
  const records = saveRecord(store, minor);
  assert.equal(records.length, 2);
  assert.deepEqual(records.find(record => record.id === legacySingle.id), migratedSingle);
  assert.equal(loadRecords(store).find(record => record.id === minor.id).cardId, 77);
  const exported = JSON.parse(exportRecords(records));
  const restored = memoryStorage(); restored.setItem(STORAGE_KEY, JSON.stringify(exported));
  assert.deepEqual(loadRecords(restored), records);
  assert.throws(() => saveRecord(store, { ...minor, cardId: 76, cardName: 'Queen of Pentacles' }), validationError);
  assert.throws(() => saveRecord(store, { ...minor, cardId: 78 }), validationError);
  assert.equal(loadRecords(store).find(record => record.id === minor.id).cardId, 77);
});

test('all spread sizes draw manually from 78 stable cards and retain late deck slots', () => {
  for (const spread of SPREADS) {
    const original = createSpreadSession({ spreadId: spread.id, count: spread.count });
    assert.deepEqual([...original.deck].sort((a, b) => a - b), CARD_IDS);
    assert.deepEqual(original.cardIds, []);
    let chosen = original;
    const slots = [77, 64, 50, 36, 22, 1, 3, 5].slice(0, spread.count);
    for (const slot of slots) {
      chosen = selectSpreadCard(chosen, slot);
      assert.equal(selectSpreadCard(chosen, slot), chosen);
    }
    const revealed = revealAll(chosen);
    assert.deepEqual(revealed.cardIds, slots.map(slot => original.deck[slot]));
    assert.deepEqual(revealed.deck, original.deck);
    assert.equal(Object.isFrozen(revealed.cardIds), true);
    assert.equal(selectSpreadCard(revealed, 0), revealed);
    assert.throws(() => selectSpreadCard(revealed, 78), validationError);
  }
  assert.throws(() => createSpreadSession({ spreadId: 'clarity3', count: 3 }, [0, 77, 78]), validationError);
});

test('v1 saved spreads and mixed Major/Minor spreads restore and export exact card and position order', () => {
  const store = memoryStorage();
  const old = { ...completeSpread([0, 18, 21]), id: 'legacy-major-spread', createdAt: legacySingle.createdAt, updatedAt: legacySingle.updatedAt };
  const legacyEnvelope = JSON.stringify({ schemaVersion: 1, records: [old] });
  store.setItem(SPREAD_STORAGE_KEY, legacyEnvelope);
  assert.deepEqual(loadSpreadRecords(store), [old]);
  assert.equal(store.getItem(SPREAD_STORAGE_KEY), legacyEnvelope);
  const mixed = completeSpread([18, 22, 77]);
  assert.deepEqual(mixed.cardIds, [18, 22, 77]);
  const records = saveSpreadRecord(store, mixed);
  assert.deepEqual(records.find(record => record.id === old.id), old);
  const restored = memoryStorage(); restored.setItem(SPREAD_STORAGE_KEY, exportSpreadRecords(records));
  assert.deepEqual(loadSpreadRecords(restored), records);
  const changedDraw = { ...mixed, cardIds: [18, 22, 76], cards: mixed.cards.map((card, i) => i === 2 ? { ...card, cardId: 76 } : card) };
  assert.throws(() => saveSpreadRecord(store, changedDraw), validationError);
  assert.deepEqual(loadSpreadRecords(store).find(record => record.id === mixed.id).cardIds, [18, 22, 77]);
});

test('all 78 cards have complete single-card reflections and editorial/reading coverage in every spread position', () => {
  const positions = [...new Map(SPREADS.flatMap(spread => spread.positions).map(position => [position.id, position])).values()];
  for (const card of TAROT_CARDS) {
    const note = CARD_NOTES[card.number];
    assert.ok(note, `Missing written card ${card.number}: ${card.name}`);
    for (const field of ['meaning', 'prompt', 'practice', 'learn']) {
      assert.equal(typeof note[field], 'string', `${card.name}: ${field}`);
      assert.ok(note[field].trim(), `${card.name}: ${field} must not be empty`);
      assert.doesNotMatch(note[field], /\b(?:undefined|null|TODO)\b/);
    }
    for (const position of positions) {
      const editorial = cardEditorial(card.number, position.id);
      assert.ok(editorial.line.trim(), `${card.name}: ${position.id} editorial`);
      assert.doesNotMatch(editorial.line, /\b(?:undefined|null|TODO)\b/);
      for (const intention of INTENTIONS) {
        const reading = positionReading(card.number, position, intention);
        assert.equal(reading.cardId, card.number);
        assert.equal(reading.positionId, position.id);
        assert.ok(reading.meaning.includes(card.name), `${card.name}: ${position.id} meaning`);
        for (const field of ['meaning', 'prompt', 'practice', 'learn', 'connection']) {
          assert.ok(reading[field].trim(), `${card.name}: ${position.id} ${field}`);
          assert.doesNotMatch(reading[field], /\b(?:undefined|null|TODO)\b/);
        }
      }
    }
  }
  assert.throws(() => cardEditorial(78, 'situation'), TypeError);
  assert.throws(() => positionReading(78, 'situation'), TypeError);
});
