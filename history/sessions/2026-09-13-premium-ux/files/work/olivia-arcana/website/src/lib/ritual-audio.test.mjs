import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("./ritual-audio.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function fixture() {
  const contexts = [];
  const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  class Node {
    constructor() {
      for (const key of ["gain", "frequency", "detune", "Q", "threshold", "knee", "ratio", "attack", "release"]) this[key] = parameter();
      this.disconnected = false;
      this.started = false;
      this.stopped = false;
      this.onended = null;
    }
    connect(target) { return target; }
    disconnect() { this.disconnected = true; }
    start() { this.started = true; }
    stop() { this.stopped = true; }
  }
  class AudioContext {
    constructor() {
      contexts.push(this);
      this.state = "suspended";
      this.currentTime = 0;
      this.sampleRate = 100;
      this.destination = new Node();
      this.nodes = [];
      this.oscillators = [];
      this.sources = [];
      this.pending = [];
      this.suspendCalls = 0;
    }
    node() { const node = new Node(); this.nodes.push(node); return node; }
    createGain() { return this.node(); }
    createDynamicsCompressor() { return this.node(); }
    createConvolver() { return this.node(); }
    createBiquadFilter() { return this.node(); }
    createOscillator() { const node = this.node(); this.oscillators.push(node); return node; }
    createBufferSource() { const node = this.node(); this.sources.push(node); return node; }
    createBuffer(channels, length, rate) {
      return { duration: length / rate, getChannelData: () => new Float32Array(length) };
    }
    resume() { return new Promise((resolve, reject) => this.pending.push({ resolve, reject })); }
    finishResume() {
      if (this.state !== "closed") this.state = "running";
      this.onstatechange?.();
      this.pending.shift().resolve();
    }
    rejectResume() { this.pending.shift().reject(new Error("Audio unavailable")); }
    async suspend() { this.suspendCalls += 1; this.state = "suspended"; this.onstatechange?.(); }
    async close() { this.state = "closed"; this.onstatechange?.(); }
  }
  const sandbox = { exports: {}, window: { AudioContext },
    require: (id) => {
      assert.equal(id, "@/lib/sky/live");
      return { resolveObserver: () => ({}), moonState: () => ({ illum: .4, nameEn: "Waxing crescent" }),
        wanderers: () => [], altitudeDeg: () => 0 };
    },
  };
  vm.runInNewContext(compiled, sandbox);
  return { contexts, engine: new sandbox.exports.ParlorAudio() };
}

test("importing the shared engine creates no audio context; first mobile resume gates the drone", async () => {
  const { engine, contexts } = fixture();
  assert.equal(contexts.length, 0);
  const ready = engine.unlock();
  const ctx = contexts[0];
  engine.droneStart();
  assert.equal(ctx.oscillators.length, 0, "a suspended mobile context cannot schedule the bed");
  ctx.finishResume();
  assert.equal(await ready, true);
  engine.droneStart(); engine.droneStart();
  assert.equal(ctx.oscillators.length, 4, "exactly one four-voice bed starts");
  assert.equal(contexts.length, 1);
});

test("turning sound off during delayed resume cannot reactivate sound", async () => {
  const { engine, contexts } = fixture();
  const ready = engine.unlock();
  await engine.suspend();
  contexts[0].finishResume();
  assert.equal(await ready, false);
  assert.equal(engine.state, "suspended");
  engine.droneStart();
  assert.equal(contexts[0].oscillators.length, 0);
});

test("rapid activations reuse one context and only the newest completion wins", async () => {
  const { engine, contexts } = fixture();
  const first = engine.unlock();
  const second = engine.unlock();
  assert.equal(contexts.length, 1);
  contexts[0].finishResume();
  assert.equal(await first, false);
  contexts[0].finishResume();
  assert.equal(await second, true);
});

test("disposing during resume closes the old context and invalidates its completion", async () => {
  const { engine, contexts } = fixture();
  const ready = engine.unlock();
  engine.dispose();
  contexts[0].finishResume();
  assert.equal(await ready, false);
  assert.equal(contexts[0].state, "closed");
  assert.equal(engine.state, "none");
  assert.equal(engine.unlocked, false);
});

test("stopping a bed releases its nodes immediately and completed cues release their graphs", async () => {
  const { engine, contexts } = fixture();
  const ready = engine.unlock();
  const ctx = contexts[0];
  ctx.finishResume(); await ready;
  engine.droneStart();
  const firstBed = ctx.oscillators.slice();
  engine.droneStop();
  assert.ok(firstBed.every(node => node.stopped && node.disconnected));
  engine.droneStart();
  assert.equal(ctx.oscillators.length, 8);
  const beforeCue = ctx.nodes.length;
  engine.cardSlide();
  const source = ctx.sources.at(-1);
  assert.equal(source.started, true);
  source.onended();
  assert.ok(ctx.nodes.slice(beforeCue).every(node => node.disconnected));
  engine.dispose();
  assert.ok(ctx.oscillators.every(node => node.stopped && node.disconnected));
});

test("browser resume rejection resolves false without an unhandled promise", async () => {
  const { engine, contexts } = fixture();
  const ready = engine.unlock();
  contexts[0].rejectResume();
  assert.equal(await ready, false);
  assert.equal(engine.state, "suspended");
});
