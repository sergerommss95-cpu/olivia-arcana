import test from 'node:test';
import assert from 'node:assert/strict';
import { previousDaily, whenLabel, dayCaption } from './today-pair-dates.js';

const entry = (date, cardId) => ({ date, record: { cardId } });

test('finds the latest earlier day with a different card', () => {
  const entries = [entry('2026-09-20', 3), entry('2026-09-26', 17), entry('2026-09-27', 9), entry('2026-09-28', 9)];
  assert.equal(previousDaily(entries, '2026-09-28', 9).date, '2026-09-26');
  assert.equal(previousDaily(entries, '2026-09-28', 9).gap, 2);
  assert.equal(previousDaily(entries, '2026-09-28', 5).date, '2026-09-27');
});

test('ignores days more than a month back', () => {
  assert.equal(previousDaily([entry('2026-08-01', 3)], '2026-09-28', 9), null);
  assert.equal(previousDaily([], '2026-09-28', 9), null);
});

test('phrases when the earlier card was drawn', () => {
  assert.equal(whenLabel('2026-09-27', 1, 'en'), 'yesterday');
  assert.equal(whenLabel('2026-09-27', 1, 'uk'), 'вчора');
  assert.equal(whenLabel('2026-09-23', 5, 'uk'), 'в середу');
  assert.equal(whenLabel('2026-09-22', 6, 'en'), 'on Tuesday');
  assert.equal(whenLabel('2026-09-22', 6, 'uk'), 'у вівторок');
  assert.equal(whenLabel('2026-09-12', 16, 'en'), 'on 12 September');
  assert.equal(whenLabel('2026-09-12', 16, 'uk'), '12 вересня');
});

test('captions the earlier day in the nominative', () => {
  assert.equal(dayCaption('2026-09-23', 5, 'uk'), 'Середа');
  assert.equal(dayCaption('2026-09-23', 5, 'en'), 'Wednesday');
  assert.equal(dayCaption('2026-09-27', 1, 'uk'), 'Учора');
  assert.equal(dayCaption('2026-09-12', 16, 'en'), '12 September');
});
