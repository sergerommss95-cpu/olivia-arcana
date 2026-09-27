import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_DIRECTIONS, createQuestionPlan, validateQuestionPlan, applyQuestionPlan } from './question-coach.js';
import { SPREADS, buildSpreadReading } from './spread-content.js';
import { localizeSpreadReading } from './locale.js';
import { guidancePayload } from './question-guidance.js';
import { createSpreadSession, selectSpreadCard, revealAll, createSpreadRecord, saveSpreadRecord, loadSpreadRecords, exportSpreadRecords, SPREAD_STORAGE_KEY } from './spread-core.js';

const base = SPREADS.find(spread => spread.id === 'clarity3');
const store = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };
const complete = plan => {
  const spread = applyQuestionPlan(base, plan);
  let session = createSpreadSession({ question: plan.question, spreadId: plan.spreadId, count: 3, readingPlan: plan, reversals: true });
  for (const slot of [7, 24, 61]) session = selectSpreadCard(session, slot);
  session = revealAll(session);
  return { spread, session, reading: buildSpreadReading(spread, session.cardIds, session.intention, session.orientations) };
};

test('each editorial direction supports both languages without inventing new card positions', () => {
  for (const locale of ['en', 'uk']) for (const direction of ['original', 'understand', 'decision', 'conversation']) {
    const originalQuestion = 'Should I speak to my colleague?';
    const plan = createQuestionPlan({ originalQuestion, direction, locale });
    assert.equal(plan.question, originalQuestion, 'Selecting an angle must not automatically rewrite the question');
    assert.equal(plan.originalQuestion, originalQuestion);
    assert.deepEqual(plan.positions.map(position => position.id), ['situation', 'complication', 'next-step']);
    assert.equal(plan.source, 'editorial');
    assert.equal(Object.isFrozen(plan), true);
    assert.equal(Object.isFrozen(plan.positions[0]), true);
    if (locale === 'uk') for (const position of plan.positions) {
      assert.match(position.label, /[А-Яа-яІіЇїЄєҐґ]/u);
      assert.match(position.prompt, /[А-Яа-яІіЇїЄєҐґ]/u);
    }
    const { spread, session, reading } = complete(plan);
    assert.deepEqual(spread.questionEditorial, QUESTION_DIRECTIONS[locale][direction].ritual);
    assert.equal(spread.questionEditorial.chapters.length, reading.synthesis.paragraphs.length);
    if (locale === 'uk') for (const value of [spread.questionEditorial.gesture, spread.questionEditorial.invitation, spread.questionEditorial.arrival, ...spread.questionEditorial.chapters]) assert.match(value, /[А-Яа-яІіЇїЄєҐґ]/u);
    assert.deepEqual(reading.cards.map(card => card.label), plan.positions.map(position => position.label));
    assert.deepEqual(reading.cards.map(card => card.positionId), plan.positions.map(position => position.id));
    const record = createSpreadRecord(session, spread, localizeSpreadReading(reading, spread, locale));
    assert.deepEqual(record.readingPlan, plan);
  }
});

test('AI handoff includes every approved direction, including original, and only the narrow trusted context', () => {
  for (const direction of ['original', 'understand', 'decision', 'conversation']) {
    const plan = createQuestionPlan({ originalQuestion: 'My unedited situation', question: 'My approved focus', direction });
    const payload = guidancePayload({ question: plan.question, spreadId: 'clarity3', readingPlan: plan, cardIds: [1, 18, 40], cards: [{ orientation: 'upright' }, { orientation: 'reversed' }, { orientation: 'upright' }], note: 'Private diary' });
    assert.equal(payload.questionDirection, direction);
    assert.equal(payload.originalQuestion, plan.originalQuestion);
    assert.equal(payload.question, plan.question);
    assert.equal(payload.spreadId, 'clarity3');
    assert.equal(Object.hasOwn(payload, 'positions'), false);
    assert.equal(Object.hasOwn(payload, 'readingPlan'), false);
    assert.equal(Object.hasOwn(payload, 'note'), false);
  }
});

test('a full 1,600-character original and approved focus survive save, reload and export independently', () => {
  const plan = createQuestionPlan({ originalQuestion: 'Я'.repeat(1600), question: 'A'.repeat(1600), direction: 'conversation', locale: 'uk' });
  const { spread, session, reading } = complete(plan), storage = store();
  const record = createSpreadRecord(session, spread, reading, 'My interpretation, in my words.');
  saveSpreadRecord(storage, record);
  const [restored] = loadSpreadRecords(storage), restoredDefinition = applyQuestionPlan(base, restored.readingPlan);
  assert.deepEqual(restored.readingPlan, plan);
  assert.equal(restored.question.length, 1600);
  assert.equal(restoredDefinition.name, plan.spreadName);
  assert.deepEqual(restoredDefinition.positions.map(position => ({ id: position.id, label: position.label, prompt: position.prompt })), plan.positions);
  assert.deepEqual(restored.cardIds, session.cardIds);
  assert.deepEqual(restored.cards.map(card => card.orientation), session.orientations);
  assert.deepEqual(JSON.parse(exportSpreadRecords([restored])).records[0].readingPlan, plan);
});

test('approval snapshot cannot be mutated by a caller, later selection, or a changed editorial template', () => {
  const plan = createQuestionPlan({ originalQuestion: 'What matters?', direction: 'decision' });
  const imported = JSON.parse(JSON.stringify(plan));
  let session = createSpreadSession({ question: plan.question, spreadId: 'clarity3', count: 3, readingPlan: imported });
  imported.positions[0].label = 'Changed after approval';
  assert.equal(session.readingPlan.positions[0].label, plan.positions[0].label);
  session = selectSpreadCard(session, 4);
  assert.deepEqual(session.readingPlan, plan);
  assert.throws(() => { session.readingPlan.positions[0].label = 'Changed'; }, TypeError);
  assert.throws(() => { QUESTION_DIRECTIONS.en.decision.positions[0].label = 'Changed'; }, TypeError);
  const historic = { ...plan, positions: plan.positions.map(position => ({ ...position, label: `Saved ${position.label}` })) };
  assert.deepEqual(applyQuestionPlan(base, validateQuestionPlan(historic)).positions.map(position => position.label), historic.positions.map(position => position.label));
});

test('a different spread, reordered positions, forged source or oversized questions are rejected', () => {
  const plan = createQuestionPlan({ originalQuestion: 'What now?' });
  for (const patch of [
    { source: 'ai' }, { schemaVersion: 2 }, { locale: 'other' }, { direction: 'predict' }, { spreadId: 'crossroads5' },
    { originalQuestion: 'x'.repeat(1601) }, { question: 'x'.repeat(1601) },
    { approvedAt: 'not a date' }, { approvedAt: '2026-02-30T00:00:00.000Z' },
    { positions: [...plan.positions].reverse() }, { positions: plan.positions.slice(0, 2) },
  ]) assert.throws(() => validateQuestionPlan({ ...plan, ...patch }), TypeError);
  assert.throws(() => applyQuestionPlan(SPREADS.find(spread => spread.id === 'crossroads5'), plan), TypeError);
  assert.throws(() => createSpreadSession({ question: 'Different question', spreadId: 'clarity3', count: 3, readingPlan: plan }), { code: 'VALIDATION' });
  assert.throws(() => createSpreadSession({ question: plan.question, spreadId: 'crossroads5', count: 5, readingPlan: plan }), { code: 'VALIDATION' });
});

test('positions cannot be redefined after drawing and an existing saved plan cannot be replaced', () => {
  const plan = createQuestionPlan({ originalQuestion: 'My choice', direction: 'decision' });
  const { spread, session, reading } = complete(plan), storage = store();
  const changed = { ...spread, positions: spread.positions.map((position, index) => index ? position : { ...position, prompt: 'A new meaning after the draw' }) };
  assert.throws(() => createSpreadRecord(session, changed, reading), { code: 'VALIDATION' });
  const record = createSpreadRecord(session, spread, reading); saveSpreadRecord(storage, record);
  const before = storage.getItem(SPREAD_STORAGE_KEY);
  assert.throws(() => saveSpreadRecord(storage, { ...record, readingPlan: { ...plan, originalQuestion: 'Changed original' } }), { code: 'VALIDATION' });
  assert.throws(() => saveSpreadRecord(storage, { ...record, readingPlan: undefined }), { code: 'VALIDATION' });
  assert.equal(storage.getItem(SPREAD_STORAGE_KEY), before);
  saveSpreadRecord(storage, { ...record, note: 'A later reflection', updatedAt: new Date().toISOString() });
  assert.deepEqual(loadSpreadRecords(storage)[0].readingPlan, plan);
});

test('legacy unplanned spreads remain readable beside a planned spread', () => {
  const storage = store();
  let session = createSpreadSession({ question: 'An earlier question', spreadId: 'clarity3', count: 3 });
  for (const slot of [0, 1, 2]) session = selectSpreadCard(session, slot);
  session = revealAll(session);
  const legacy = createSpreadRecord(session, base, buildSpreadReading(base, session.cardIds)); saveSpreadRecord(storage, legacy);
  const { spread, session: planned, reading } = complete(createQuestionPlan({ originalQuestion: '<img src=x onerror=alert(1)> & "my words"' }));
  const record = createSpreadRecord(planned, spread, reading); saveSpreadRecord(storage, record);
  const records = loadSpreadRecords(storage);
  assert.equal(records.length, 2);
  assert.deepEqual(records.find(value => value.id === legacy.id), legacy);
  assert.equal(records.find(value => value.id === record.id).readingPlan.originalQuestion, '<img src=x onerror=alert(1)> & "my words"');
});
