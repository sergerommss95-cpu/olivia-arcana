import test from 'node:test';
import assert from 'node:assert/strict';
import { bindDeckGesture } from './deck-gesture.js';

const previousComputedStyle = globalThis.getComputedStyle;
globalThis.getComputedStyle = image => ({ transform: image.computedTransform });
test.after(() => {
  if (previousComputedStyle) globalThis.getComputedStyle = previousComputedStyle;
  else delete globalThis.getComputedStyle;
});

function fixture({ height, syncCaptureLoss=false, animated=false, reduced=false, browse=false }={}) {
  const image = { style: { transform: '', transition: '' }, computedTransform: 'matrix(1, 0, 0, 1, 0, -12)' };
  if(height){image.offsetHeight=height;image.offsetWidth=height*.583;}
  const animations=[];
  if(animated)image.animate=(frames,options)=>{
    let resolve,reject;
    const animation={frames,options,finished:new Promise((yes,no)=>{resolve=yes;reject=no;}),cancelled:false,cancel(){this.cancelled=true;reject(new Error('cancelled'));},finish(){resolve();}};
    animations.push(animation);return animation;
  };
  class Button extends EventTarget {
    dataset = { angle: '-8' };
    captured = new Set();
    querySelector(selector) { assert.equal(selector, 'img'); return image; }
    removeAttribute(name) { assert.equal(name, 'data-dragging'); delete this.dataset.dragging; }
    setPointerCapture(id) { this.captured.add(id); }
    hasPointerCapture(id) { return this.captured.has(id); }
    releasePointerCapture(id) {
      this.captured.delete(id);
      if(syncCaptureLoss){const event=new Event('lostpointercapture');event.pointerId=id;this.dispatchEvent(event);}
    }
  }
  const button = new Button(), choices = [],progress=[],browsing=[];
  let enabled = true;
  const reset = bindDeckGesture(button, {
    enabled: () => enabled,
    choose: keyboard => choices.push({ keyboard, pose: image.style.transform }),
    onPull: value=>progress.push(value),reduced:()=>reduced,
    canBrowse:()=>browse,onBrowse:value=>browsing.push(value),
  });
  const pointer = (type, { id = 1, x = 100, y = 100, primary=true, button: pointerButton=0 } = {}) => {
    const event = new Event(type);
    Object.assign(event, { pointerId: id, pointerType: 'touch', button: pointerButton, isPrimary:primary,clientX: x, clientY: y });
    button.dispatchEvent(event);
  };
  const click = (detail = 1) => {
    const event = new Event('click');
    Object.assign(event, { detail });
    button.dispatchEvent(event);
  };
  return { button, image, choices, pointer, click, reset, progress,animations,browsing,disable: () => { enabled = false; } };
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


test('the commitment distance scales with card size rather than triggering at a tiny fixed pull', () => {
  const large=fixture({height:500});
  large.pointer('pointerdown');large.pointer('pointermove',{y:35});large.pointer('pointerup',{y:35});
  assert.equal(large.choices.length,0);
  large.pointer('pointerdown');large.pointer('pointermove',{y:-10});large.pointer('pointerup',{y:-10});
  assert.equal(large.choices.length,1);
  const small=fixture({height:150});
  small.pointer('pointerdown');small.pointer('pointermove',{y:50});small.pointer('pointerup',{y:50});
  assert.equal(small.choices.length,1);
});

test('pulling tracks screen-up even for rotated cards while preserving the button hit area', () => {
  const f=fixture({height:400});f.button.dataset.angle='20';
  f.pointer('pointerdown');f.pointer('pointermove',{y:20});
  const translation=f.image.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\)/);
  const x=Number(translation[1]),y=Number(translation[2]),r=20*Math.PI/180;
  assert.ok(Math.abs(x*Math.cos(r)-y*Math.sin(r))<.001);
  assert.ok(Math.abs(x*Math.sin(r)+y*Math.cos(r)+80)<.001);
  assert.equal(f.button.style,undefined); // The gesture never writes a button transform.
  assert.ok(f.progress.at(-1)>.9&&f.progress.at(-1)<1);
});

test('a horizontal swipe or drag back to rest cannot accidentally choose a card', () => {
  const f=fixture();
  f.pointer('pointerdown');f.pointer('pointermove',{x:330,y:35});f.pointer('pointerup',{x:330,y:35});f.click();
  assert.equal(f.choices.length,0);
  f.pointer('pointerdown');f.pointer('pointermove',{y:20});f.pointer('pointermove',{y:100});f.pointer('pointerup');f.click();
  assert.equal(f.choices.length,0);
});

test('the release position is authoritative even when the final pointermove was skipped', () => {
  const f=fixture();
  f.pointer('pointerdown');f.pointer('pointerup',{y:20});
  assert.equal(f.choices.length,1);assert.match(f.choices[0].pose,/translate/);
  const horizontal=fixture();
  horizontal.pointer('pointerdown');horizontal.pointer('pointerup',{x:220});horizontal.click();
  assert.equal(horizontal.choices.length,0);
});

test('synchronous capture loss cannot erase the card pose or choose twice', () => {
  const f=fixture({syncCaptureLoss:true});
  f.pointer('pointerdown');f.pointer('pointermove',{y:20});
  const pose=f.image.style.transform;
  f.pointer('pointerup',{y:20});f.click();
  assert.deepEqual(f.choices,[{keyboard:false,pose}]);
  assert.equal(f.progress.at(-1),0);
});

test('cancellation has one measured return and reset cancels it cleanly', async () => {
  const f=fixture({animated:true,syncCaptureLoss:true});
  f.pointer('pointerdown');f.pointer('pointermove',{y:70});
  const pose=f.image.style.transform;
  f.pointer('pointercancel');f.click();
  assert.equal(f.choices.length,0);assert.equal(f.button.hasPointerCapture(1),false);
  assert.equal(f.animations.length,1);assert.equal(f.animations[0].frames[0].transform,pose);
  assert.ok(f.animations[0].options.duration<=400);
  assert.equal(f.progress.at(-1),0);
  f.reset();await Promise.resolve();
  assert.equal(f.animations[0].cancelled,true);assert.equal(f.image.style.transition,'');
});

test('a finished return restores the stylesheet transition', async () => {
  const f=fixture({animated:true});
  f.pointer('pointerdown');f.pointer('pointermove',{y:70});f.pointer('pointerup',{y:70});
  f.animations[0].finish();await Promise.resolve();
  assert.equal(f.image.style.transition,'');
});

test('reduced motion keeps direct manipulation without decorative tilt or animated recoil', () => {
  const f=fixture({animated:true,reduced:true});
  f.pointer('pointerdown');f.pointer('pointermove',{x:115,y:70});
  assert.match(f.image.style.transform,/rotate\(0deg\)/);
  f.pointer('pointercancel');
  assert.equal(f.animations.length,0);assert.equal(f.image.style.transform,'');assert.equal(f.progress.at(-1),0);
});

test('Escape cancels the captured pull without accepting a trailing click', () => {
  const f=fixture();f.pointer('pointerdown');f.pointer('pointermove',{y:20});
  const escape=new Event('keydown',{cancelable:true});escape.key='Escape';f.button.dispatchEvent(escape);f.click();
  assert.equal(escape.defaultPrevented,true);assert.equal(f.choices.length,0);assert.equal(f.button.hasPointerCapture(1),false);
});

test('non-primary touch and non-left mouse buttons cannot start the ritual', () => {
  const f=fixture();
  f.pointer('pointerdown',{primary:false});f.pointer('pointermove',{y:20});f.pointer('pointerup',{y:20});
  f.pointer('pointerdown',{button:2});f.pointer('pointermove',{y:20});f.pointer('pointerup',{y:20});
  assert.equal(f.choices.length,0);assert.equal(f.button.dataset.dragging,undefined);
});

test('a mobile horizontal swipe stays browsing even when the thumb curves upward',()=>{
 const f=fixture({browse:true,syncCaptureLoss:true});
 f.pointer('pointerdown');f.pointer('pointermove',{x:145,y:95});
 assert.equal(f.button.dataset.dragging,undefined);
 assert.equal(f.progress.at(-1),0,'browsing must clear the pull affordance');
 f.pointer('pointermove',{x:170,y:0});f.pointer('pointerup',{x:170,y:0});f.click();
 assert.deepEqual(f.choices,[]);
 assert.deepEqual(f.browsing.map(value=>value.phase),['start','move','move','end']);
 assert.equal(f.browsing.at(-1).dx,70);assert.equal(f.image.style.transform,'');
});

test('a mobile upward pull locks before later lateral drift and still selects once',()=>{
 const f=fixture({browse:true});
 f.pointer('pointerdown');f.pointer('pointermove',{y:75});f.pointer('pointerup',{x:145,y:20});f.click();
 assert.equal(f.choices.length,1);assert.deepEqual(f.browsing,[]);
});

test('a quick sideways release is a browse even without pointermove',()=>{
 const f=fixture({browse:true});
 f.pointer('pointerdown');f.pointer('pointerup',{x:30});f.click();
 assert.equal(f.choices.length,0);assert.deepEqual(f.browsing.map(value=>value.phase),['start','move','end']);
});

test('cancelling, disabling, or leaving a phone swipe cannot browse or choose afterward',()=>{
 for(const end of ['pointercancel','lostpointercapture','reset','disabled']){
  const f=fixture({browse:true,syncCaptureLoss:true});
  f.pointer('pointerdown');f.pointer('pointermove',{x:160});
  if(end==='reset')f.reset();
  else if(end==='disabled'){f.disable();f.pointer('pointerup',{x:160});}
  else f.pointer(end);
  f.pointer('pointerup',{x:160});f.click();
  assert.equal(f.choices.length,0);assert.equal(f.browsing.filter(value=>value.phase==='end').length,0);
  assert.equal(f.browsing.filter(value=>value.phase==='cancel').length,1);
  assert.equal(f.image.style.transform,'');
 }
});

test('mobile taps and keyboard selection keep their direct selection behavior',()=>{
 const tap=fixture({browse:true});tap.pointer('pointerdown');tap.pointer('pointerup');tap.click();
 assert.equal(tap.choices.length,1);assert.deepEqual(tap.browsing,[]);
 const keyboard=fixture({browse:true});keyboard.click(0);
 assert.deepEqual(keyboard.choices,[{keyboard:true,pose:''}]);
});

test('ambiguous phone diagonals and sideways-ending pulls cancel instead of drawing',()=>{
 const diagonal=fixture({browse:true});
 diagonal.pointer('pointerdown');diagonal.pointer('pointermove',{x:140,y:60});diagonal.pointer('pointerup',{x:190,y:10});diagonal.click();
 assert.deepEqual(diagonal.choices,[]);assert.deepEqual(diagonal.browsing,[]);
 const drift=fixture({browse:true});
 drift.pointer('pointerdown');drift.pointer('pointermove',{y:75});drift.pointer('pointerup',{x:190,y:10});drift.click();
 assert.deepEqual(drift.choices,[]);assert.deepEqual(drift.browsing,[]);
});
