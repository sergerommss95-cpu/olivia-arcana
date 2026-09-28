import test from 'node:test';
import assert from 'node:assert/strict';
import { pinPosition } from './pin-walk.js';

test('pins turn with a reversed card', () => {
  assert.deepEqual(pinPosition({ x: 30, y: 20 }, 'upright'), { x: 30, y: 20 });
  assert.deepEqual(pinPosition({ x: 30, y: 20 }, 'reversed'), { x: 70, y: 80 });
});
