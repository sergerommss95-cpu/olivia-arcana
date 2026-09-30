import test from 'node:test';
import assert from 'node:assert/strict';
import {mountCardUnveiling} from './card-unveiling.js';
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

class Events {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatch(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) || [])]) listener({type, ...event});
  }
}

// This is a lifecycle double, not a GLSL emulator. Browser review covers the
// artwork, colour, shape, registration and visual orientation of the effect.
function fixture({reduced = false, webgl = true, compile = true, uploadError = false, canvas2d = true, readbackError = false, size = [800, 1368], maxTextureSize = 4096} = {}) {
  const frames = new Map(), calls = [], deleted = [], observers = [], bitmapDraws = [], readbacks = [];
  let frameId = 0, now = 0, contexts = 0;
  const constants = new Map();
  const gl = new Proxy({
    getShaderParameter: () => compile,
    getProgramParameter: () => true,
    getAttribLocation: () => 0,
    getUniformLocation: (_, name) => name,
    getParameter: () => maxTextureSize,
    getError: () => uploadError ? 1282 : 0,
    createShader: () => ({}), createProgram: () => ({}),
    createBuffer: () => ({}), createTexture: () => ({}),
  }, {get(target, key) {
    if (key in target) return target[key];
    if (/^[A-Z_0-9]+$/.test(key)) {
      if (!constants.has(key)) constants.set(key, key === 'NO_ERROR' ? 0 : constants.size + 1);
      return constants.get(key);
    }
    return (...args) => { calls.push({name: key, args}); if (key.startsWith('delete')) deleted.push(args[0]); };
  }});
  const media = new Events(); media.matches = reduced;
  const doc = new Events(); doc.hidden = false;
  const win = new Events();
  Object.assign(win, {
    performance: {now: () => now}, devicePixelRatio: 2,
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    matchMedia: () => media,
    getComputedStyle: element => ({position: 'static', borderRadius: '8px', visibility: 'visible', display: 'block', rotate: element.style.rotate || 'none', transform: 'none', transformOrigin: '50% 50%'}),
    ResizeObserver: class {
      constructor(fn) { this.callback = fn; observers.push(this); }
      observe() {} disconnect() { this.disconnected = true; }
    },
  });
  doc.defaultView = win;
  class Element extends Events {
    constructor(tag = 'div') {
      super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc;
      this.children = []; this.attributes = {}; this.dataset = {}; this.hidden = false;
      this.style = {position: '', setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; }};
      const classes = new Set(); this.classList = {add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name)};
      this.offsetWidth = 240; this.offsetHeight = 410; this.offsetLeft = 0; this.offsetTop = 0;
    }
    append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    querySelector(selector) { return selector === 'img' ? this.children.find(child => child.tagName === 'IMG') : null; }
    getBoundingClientRect() { return {left: 0, top: 0, width: this.offsetWidth, height: this.offsetHeight}; }
    getContext(kind) {
      if (kind === 'webgl') { contexts++; return webgl ? gl : null; }
      if (kind !== '2d' || !canvas2d) return null;
      const canvas = this;
      return {
        drawImage(...args) { bitmapDraws.push({canvas, args}); },
        getImageData(...args) {
          if (readbackError) { const error = new Error('Cross-origin pixels are unavailable'); error.name = 'SecurityError'; throw error; }
          const [, , width, height] = args;
          const data = new Uint8ClampedArray(width * height * 4);
          // Distinct corners make it possible to detect changed order or data
          // when handing the already decoded RGBA buffer over to WebGL.
          data.set([23, 41, 79, 255], 0); data.set([237, 226, 201, 255], data.length - 4);
          const result = {data, width, height}; readbacks.push({canvas, args, result}); return result;
        },
      };
    }
  }
  doc.createElement = tag => new Element(tag);
  const container = new Element(), image = new Element('img'), front = new Element('img');
  Object.assign(image, {src: 'back.webp', currentSrc: 'back.webp', naturalWidth: size[0], naturalHeight: size[1], complete: true});
  Object.assign(front, {src: 'front.webp', currentSrc: 'front.webp', naturalWidth: size[0], naturalHeight: size[1], complete: true});
  container.append(image);
  const renderer = mountCardUnveiling(container, {image});
  const canvas = container.children.find(child => child.tagName === 'CANVAS');
  return {
    renderer, container, image, front, canvas, doc, win, media, frames, calls, deleted, observers, bitmapDraws, readbacks, gl,
    get contexts() { return contexts; },
    advance(time) { now = time; const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(time); },
    setReduced(value) { media.matches = value; media.dispatch('change', {matches: value}); },
  };
}

test('reduced motion and unavailable WebGL leave the original card in control', async () => {
  const reduced = fixture({reduced: true});
  assert.equal(await reduced.renderer.reveal({front: reduced.front}), false);
  assert.equal(reduced.contexts, 0);
  assert.equal(reduced.frames.size, 0);
  assert.equal(reduced.image.src, 'back.webp');
  reduced.renderer.destroy();
  const unsupported = fixture({webgl: false});
  assert.equal(await unsupported.renderer.reveal({front: unsupported.front}), false);
  assert.equal(unsupported.frames.size, 0);
  assert.ok(unsupported.canvas.hidden);
  assert.equal(unsupported.image.src, 'back.webp');
  unsupported.renderer.destroy();
});

test('a shader or texture failure does not announce or strand a reveal', async () => {
  for (const options of [{compile: false}, {uploadError: true}]) {
    const x = fixture(options); let starts = 0;
    assert.equal(await x.renderer.reveal({front: x.front, onStart: () => starts++}), false);
    assert.equal(starts, 0);
    assert.equal(x.frames.size, 0);
    assert.ok(x.canvas.hidden);
    assert.equal(x.image.src, 'back.webp');
    x.renderer.destroy();
  }
});

test('cancelling an active reveal resolves it and prevents stale callbacks', async () => {
  const x = fixture(), progress = []; let starts = 0;
  const result = x.renderer.reveal({front: x.front, duration: 1000, onStart: () => starts++, onProgress: value => progress.push(value)});
  await flush();
  assert.equal(starts, 1);
  x.advance(100); x.advance(200);
  const before = progress.length;
  x.renderer.cancel();
  assert.equal(await result, false);
  assert.equal(x.frames.size, 0);
  assert.ok(x.canvas.hidden);
  x.advance(5000);
  assert.equal(progress.length, before);
  assert.equal(x.image.src, 'back.webp');
  x.renderer.destroy();
});

test('context loss and a new reduced-motion preference both finish safely', async () => {
  for (const stop of ['context', 'preference']) {
    const x = fixture();
    const result = x.renderer.reveal({front: x.front});
    x.advance(100); let prevented = false;
    if (stop === 'context') x.canvas.dispatch('webglcontextlost', {preventDefault() { prevented = true; }});
    else x.setReduced(true);
    assert.equal(await result, false);
    assert.equal(x.frames.size, 0);
    assert.ok(x.canvas.hidden);
    if (stop === 'context') assert.ok(prevented);
    x.renderer.destroy();
  }
});

test('destroy resolves a running reveal and removes its observers and surface', async () => {
  const x = fixture();
  const result = x.renderer.reveal({front: x.front});
  x.renderer.destroy();
  assert.equal(await result, false);
  assert.equal(x.frames.size, 0);
  assert.ok(!x.container.children.includes(x.canvas));
  assert.ok(x.observers.every(observer => observer.disconnected));
  assert.equal([...x.doc.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
  assert.equal([...x.media.listeners.values()].reduce((sum, set) => sum + set.size, 0), 0);
  assert.equal(await x.renderer.reveal({front: x.front}), false);
});

test('completion holds the final frame until the caller replaces the source image', async () => {
  const x = fixture(), progress = [];
  const result = x.renderer.reveal({front: x.front, duration: 1000, onProgress: value => progress.push(value)});
  await flush(); x.advance(100); x.advance(600); x.advance(1100);
  assert.equal(await result, true);
  assert.equal(progress.at(-1), 1);
  assert.equal(x.frames.size, 0);
  assert.equal(x.canvas.hidden, false, 'the final front must cover the back until the image handoff');
  assert.equal(x.image.src, 'back.webp', 'the effect never mutates the caller’s visible image');
  x.image.src = x.front.src; x.image.currentSrc = x.front.currentSrc;
  x.renderer.cancel();
  assert.ok(x.canvas.hidden);
  assert.equal(x.image.src, 'front.webp');
  x.renderer.destroy();
});

test('a hidden tab pauses elapsed time and resumes without skipping the unveiling', async () => {
  const x = fixture(), progress = [];
  const result = x.renderer.reveal({front: x.front, duration: 1000, onProgress: value => progress.push(value)});
  await flush(); x.advance(100); x.advance(400);
  assert.equal(progress.at(-1), .3);
  x.doc.hidden = true; x.doc.dispatch('visibilitychange');
  assert.equal(x.frames.size, 0);
  x.advance(60400);
  x.doc.hidden = false; x.doc.dispatch('visibilitychange');
  x.advance(60416); x.advance(60516);
  assert.equal(progress.at(-1), .4);
  x.advance(61216);
  assert.equal(await result, true);
  x.renderer.destroy();
});

test('a cancelled camera approach cannot restart after a replacement reveal', async () => {
  const x = fixture(); let releaseApproach, firstProgress = 0;
  const first = x.renderer.reveal({front: x.front, onStart: () => new Promise(resolve => { releaseApproach = resolve; }), onProgress: () => firstProgress++});
  await flush();
  assert.equal(x.frames.size, 0, 'reveal waits until the approach finishes');
  const replacement = x.renderer.reveal({front: x.front, duration: 1000});
  assert.equal(await first, false);
  await flush();
  releaseApproach(); await flush();
  assert.equal(x.frames.size, 1, 'only the replacement owns the animation frame');
  x.advance(100); x.advance(1100);
  assert.equal(await replacement, true);
  assert.equal(firstProgress, 0);
  x.renderer.destroy();
});

test('loading different artwork cancels the old effect without overwriting that artwork', async () => {
  const x = fixture();
  const result = x.renderer.reveal({front: x.front}); await flush();
  x.image.src = 'another-back.webp'; x.image.currentSrc = 'another-back.webp'; x.image.dispatch('load');
  assert.equal(await result, false);
  assert.equal(x.frames.size, 0);
  assert.ok(x.canvas.hidden);
  assert.equal(x.image.src, 'another-back.webp');
  x.renderer.destroy();
});

test('ordinary artwork uploads decoded RGBA pixels at its exact native size', async () => {
  const x = fixture({size: [768, 1316]});
  const result = x.renderer.reveal({front: x.front}); await flush();
  const uploads = x.calls.filter(call => call.name === 'texImage2D');
  assert.equal(uploads.length, 2);
  assert.equal(x.bitmapDraws.length, 2, 'both images must use the decoded pixel path, even without resizing');
  for (const [index, source] of [x.image, x.front].entries()) {
    const drawing = x.bitmapDraws[index], readback = x.readbacks[index], args = uploads[index].args;
    assert.deepEqual(drawing.args, [source, 0, 0, 768, 1316]);
    assert.deepEqual(readback.args, [0, 0, 768, 1316]);
    assert.equal(drawing.canvas.width, 768); assert.equal(drawing.canvas.height, 1316);
    assert.deepEqual(args.slice(0, 8), [x.gl.TEXTURE_2D, 0, x.gl.RGBA, 768, 1316, 0, x.gl.RGBA, x.gl.UNSIGNED_BYTE]);
    assert.equal(args.length, 9, 'use the explicit pixel-buffer overload, never the DOM-source overload');
    assert.ok(ArrayBuffer.isView(args[8]));
    assert.equal(args[8].buffer, readback.result.data.buffer);
    assert.deepEqual([...args[8].slice(0, 4)], [23, 41, 79, 255]);
    assert.deepEqual([...args[8].slice(-4)], [237, 226, 201, 255]);
  }
  assert.ok(x.calls.some(call => call.name === 'pixelStorei' && call.args[0] === x.gl.UNPACK_ALIGNMENT && call.args[1] === 1));
  assert.ok(x.calls.some(call => call.name === 'pixelStorei' && call.args[0] === x.gl.UNPACK_FLIP_Y_WEBGL && call.args[1] === false));
  x.renderer.cancel(); assert.equal(await result, false); x.renderer.destroy();
});

test('print-resolution artwork is proportionally bounded before pixel readback and upload', async () => {
  for (const [maximum, expected] of [[4096, [896, 1536]], [1024, [597, 1024]]]) {
    const x = fixture({size: [4200, 7200], maxTextureSize: maximum});
    const result = x.renderer.reveal({front: x.front}); await flush();
    const uploads = x.calls.filter(call => call.name === 'texImage2D');
    assert.equal(uploads.length, 2);
    for (let i = 0; i < 2; i++) {
      assert.deepEqual(x.bitmapDraws[i].args.slice(1), [0, 0, ...expected]);
      assert.deepEqual(x.readbacks[i].args, [0, 0, ...expected]);
      assert.deepEqual(uploads[i].args.slice(3, 5), expected);
      assert.equal(uploads[i].args[8].byteLength, expected[0] * expected[1] * 4);
    }
    x.renderer.cancel(); assert.equal(await result, false); x.renderer.destroy();
  }
});

test('unavailable 2D context or denied pixel readback falls back without starting the reveal', async () => {
  for (const options of [{canvas2d: false}, {readbackError: true}]) {
    const x = fixture(options); let starts = 0;
    const result = x.renderer.reveal({front: x.front, onStart: () => starts++});
    assert.equal(await result, false);
    assert.equal(starts, 0); assert.equal(x.frames.size, 0); assert.ok(x.canvas.hidden);
    assert.equal(x.image.src, 'back.webp');
    assert.equal(x.calls.filter(call => call.name === 'texImage2D').length, 0);
    assert.ok(x.deleted.length > 0, 'failed readback releases the resources already allocated');
    x.renderer.destroy();
  }
});

test('cancelling from a progress callback wins even on the final artwork frame', async () => {
  for (const stopAt of [.5, 1]) {
    const x = fixture(); let reports = 0;
    const result = x.renderer.reveal({front: x.front, duration: 1000, onProgress: progress => {
      reports++; if (progress >= stopAt) x.renderer.cancel();
    }});
    await flush(); x.advance(100); x.advance(100 + stopAt * 1000);
    assert.equal(await result, false);
    assert.ok(x.canvas.hidden); assert.equal(x.frames.size, 0); assert.equal(reports, 1);
    x.advance(5000); assert.equal(reports, 1);
    x.renderer.destroy();
  }
});

test('a replacement started inside onProgress owns the surface and animation clock', async () => {
  for (const replaceAt of [.5, 1]) {
    const x = fixture(); let replacement, oldReports = 0;
    const original = x.renderer.reveal({front: x.front, duration: 1000, onProgress: progress => {
      oldReports++;
      if (progress >= replaceAt) replacement = x.renderer.reveal({front: x.front, duration: 800});
    }});
    await flush(); x.advance(100); x.advance(100 + replaceAt * 1000);
    assert.equal(await original, false); await flush();
    assert.equal(x.canvas.hidden, false, 'finishing the old callback must not hide its replacement');
    assert.equal(x.frames.size, 1, 'the old reveal must not schedule another frame');
    x.advance(2000); x.advance(2800);
    assert.equal(await replacement, true); assert.equal(oldReports, 1); assert.equal(x.frames.size, 0);
    x.renderer.destroy();
  }
});

test('a camera approach finishing in a hidden tab waits for visibility before starting time', async () => {
  const x = fixture(), progress = []; let approachReady;
  const result = x.renderer.reveal({front: x.front, duration: 1000,
    onStart: () => new Promise(resolve => { approachReady = resolve; }),
    onProgress: value => progress.push(value)});
  await flush(); assert.equal(x.frames.size, 0);
  x.doc.hidden = true; x.doc.dispatch('visibilitychange');
  approachReady(); await flush();
  assert.equal(x.frames.size, 0);
  x.advance(60000); assert.equal(progress.length, 0);
  x.doc.hidden = false; x.doc.dispatch('visibilitychange');
  x.advance(60016); x.advance(60116);
  assert.equal(progress.at(-1), .1, 'background time must not consume the reveal');
  x.renderer.cancel(); assert.equal(await result, false); x.renderer.destroy();
});

test('cancelling a completed-art hold cannot be revived by visibility or context restoration', async () => {
  const x = fixture(); let reports = 0;
  const result = x.renderer.reveal({front: x.front, duration: 1000, onProgress: () => reports++});
  await flush(); x.advance(100); x.advance(1100); assert.equal(await result, true);
  x.renderer.cancel();
  x.doc.hidden = true; x.doc.dispatch('visibilitychange');
  x.doc.hidden = false; x.doc.dispatch('visibilitychange');
  x.canvas.dispatch('webglcontextlost', {preventDefault() {}}); x.canvas.dispatch('webglcontextrestored');
  x.advance(5000);
  assert.ok(x.canvas.hidden); assert.equal(x.frames.size, 0); assert.equal(reports, 1);
  x.renderer.destroy();
});
