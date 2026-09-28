import test from 'node:test';
import assert from 'node:assert/strict';
import { createCardPlan, validateQuestionPlan, applyQuestionPlan, createQuestionPlan } from './question-coach.js';
import { SPREADS } from './spread-content.js';
import { guidancePayload } from './question-guidance.js';

const questions = ['What quietly restores you?', 'Where are you pouring outward?', 'Which small lights are already around you?'];
const plan = createCardPlan({ cardId: 17, cardName: 'The Star', questions, question: 'What would help me rest?', locale: 'en', approvedAt: '2026-09-28T10:00:00.000Z' });

test('a card plan keeps the three position ids and asks the card’s own questions', () => {
  assert.equal(plan.source, 'card');
  assert.equal(plan.cardId, 17);
  assert.equal(plan.spreadName, 'The Star: three questions');
  assert.deepEqual(plan.positions.map(p => p.id), ['situation', 'complication', 'next-step']);
  assert.deepEqual(plan.positions.map(p => p.prompt), questions);
  assert.deepEqual(validateQuestionPlan(JSON.parse(JSON.stringify(plan))), plan);
});

test('a card plan applies to the three-card spread with its own ritual copy', () => {
  const spread = applyQuestionPlan(SPREADS.find(s => s.id === 'clarity3'), plan);
  assert.equal(spread.name, 'The Star: three questions');
  assert.match(spread.questionEditorial.invitation, /The Star/);
  assert.equal(spread.positions[1].prompt, questions[1]);
});

test('Ukrainian card plans use the product’s position labels', () => {
  const uk = createCardPlan({ cardId: 17, cardName: 'Зірка', questions, locale: 'uk', approvedAt: '2026-09-28T10:00:00.000Z' });
  assert.deepEqual(uk.positions.map(p => p.label), ['Ситуація', 'Що її ускладнює', 'Корисний наступний крок']);
  assert.equal(uk.spreadName, 'Зірка: три запитання');
});

test('invalid card plans are refused', () => {
  for (const bad of [{ ...plan, cardId: 78 }, { ...plan, direction: 'understand' }, { ...plan, cardName: undefined }, { ...plan, source: 'other' }]) assert.throws(() => validateQuestionPlan(bad));
  assert.throws(() => createCardPlan({ cardId: 3, cardName: 'The Empress', questions: questions.slice(0, 2) }));
});

test('personal readings are not sent a direction for card plans, but still are for editorial ones', () => {
  const record = { question: 'What would help me rest?', spreadId: 'clarity3', cardIds: [1, 2, 3], readingPlan: plan };
  assert.equal(guidancePayload(record).questionDirection, undefined);
  const editorial = createQuestionPlan({ originalQuestion: 'Q', direction: 'understand', locale: 'en' });
  assert.equal(guidancePayload({ ...record, readingPlan: editorial }).questionDirection, 'understand');
});
