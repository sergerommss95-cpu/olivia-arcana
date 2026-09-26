import test from 'node:test';
import assert from 'node:assert/strict';
import { bindDeckGesture } from './deck-gesture.js';

const previousComputedStyle = globalThis.getComputedStyle;
globalThis.getComputedStyle = image => ({ transform: image.computedTransform });
test.after(() => {
  if (previousComputedStyle) globalThis.getComputedStyle = previousComputedStyle;
  else delete globalThis.getComputedStyle;
});

function fixture() {
  const image = { style: { transform: '' }, computedTransform: 'matrix(1, 0, 0, 1, 0, -12)' };
  class Button extends EventTarget {
    dataset = { angle: '-8' };
    captured = new Set();
    querySelector(selector) { assert.equal(selector, 'img'); return image; }
    removeAttribute(name) { assert.equal(name, 'data-dragging'); delete this.dataset.dragging; }
    setPointerCapture(id) { this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) { this.captured.delete(id); }
  }
  const button = new Button(), choices = [];
  let enabled = true;
  const reset = bindDeckGesture(button, {
    enabled: () => enabled,
    choose: keyboard => choices.push({ keyboard, pose: image.style.transform }),
  });
  const pointer = (type, { id = 1, x = 100, y = 100 } = {}) => {
    const event = new Event(type);
    Object.assign(event, { pointerId: id, pointerType: 'touch', button: 0, clientX: x, clientY: y });
    button.dispatchEvent(event);
  };
  const click = (detail = 1) => {
    const event = new Event('click');
    Object.assign(event, { detail });
    button.dispatchEvent(event);
  };
  return { button, image, choices, pointer, click, reset, disable: () => { enabled = false; } };
}

test('downward and short upward drags return without choosing, including their trailing click', () => {
  for (const y of [130, 75, 60]) {
    const f = fixture();
    f.pointer('pointerdown');
    f.pointer('pointermove', { y });
    f.pointer('pointerup', { y });
    f.click();
    assert.deepEqual(f.choices, []);
    assert.equal(f.image.style.transform, '');
    assert.equal(f.button.dataset.dragging, undefined);
  }
});

test('an upward pull chooses once from its visible pose and suppresses the synthetic click', () => {
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointermove', { x: 112, y: 45 });
  const pulledPose = f.image.style.transform;
  f.pointer('pointerup', { x: 112, y: 45 });
  f.click();
  assert.deepEqual(f.choices, [{ keyboard: false, pose: pulledPose }]);
  assert.match(pulledPose, /^translate\(/);
  assert.equal(f.image.style.transform, '');
  assert.equal(f.button.hasPointerCapture(1), false);
});

test('a keyboard click identifies keyboard selection', () => {
  const f = fixture();
  f.click(0);
  assert.deepEqual(f.choices, [{ keyboard: true, pose: '' }]);
});

test('pointer cancellation restores the card and cannot complete the canceled pull', () => {
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointermove', { y: 35 });
  f.pointer('pointercancel');
  assert.equal(f.image.style.transform, '');
  assert.equal(f.button.dataset.dragging, undefined);
  f.pointer('pointerup', { y: 35 });
  assert.deepEqual(f.choices, []);
});

test('lost capture and explicit reset restore the artwork without choosing', () => {
  for (const end of ['lostpointercapture', 'reset']) {
    const f = fixture();
    f.pointer('pointerdown');
    f.pointer('pointermove', { y: 35 });
    if (end === 'reset') f.reset();
    else f.pointer(end);
    assert.equal(f.image.style.transform, '');
    assert.equal(f.button.dataset.dragging, undefined);
    f.pointer('pointerup', { y: 35 });
    assert.deepEqual(f.choices, []);
  }
});

test('disabling selection during a pull prevents its completion and trailing click', () => {
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointermove', { y: 35 });
  f.disable();
  f.pointer('pointerup', { y: 35 });
  f.click();
  assert.deepEqual(f.choices, []);
  assert.equal(f.image.style.transform, '');
});

test('a second pointer cannot replace the active pull', () => {
  const f = fixture();
  f.pointer('pointerdown');
  f.pointer('pointermove', { y: 35 });
  const pulledPose = f.image.style.transform;
  f.pointer('pointerdown', { id: 2, y: 200 });
  f.pointer('pointerup', { y: 35 });
  assert.deepEqual(f.choices, [{ keyboard: false, pose: pulledPose }]);
  assert.equal(f.button.hasPointerCapture(2), false);
});

test('cancellation or capture loss from another pointer does not cancel the active pull', () => {
  for (const end of ['pointercancel', 'lostpointercapture']) {
    const f = fixture();
    f.pointer('pointerdown');
    f.pointer('pointermove', { y: 35 });
    const pulledPose = f.image.style.transform;
    f.pointer(end, { id: 2 });
    f.pointer('pointerup', { y: 35 });
    assert.deepEqual(f.choices, [{ keyboard: false, pose: pulledPose }]);
  }
});
