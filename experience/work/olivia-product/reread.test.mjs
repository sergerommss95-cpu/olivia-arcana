import test from 'node:test';
import assert from 'node:assert/strict';
import { isReturn } from './reread.js';

test('a kept reading becomes a return after most of a day', () => {
  const now = Date.parse('2026-10-02T12:00:00.000Z');
  assert.equal(isReturn({ createdAt: '2026-10-02T09:00:00.000Z' }, now), false);
  assert.equal(isReturn({ createdAt: '2026-10-01T15:00:00.000Z' }, now), true);
  assert.equal(isReturn({ createdAt: 'not a date' }, now), false);
  assert.equal(isReturn(null, now), false);
});
