/**
 * ritual-audio.ts — THE PARLOR'S VOICE.
 *
 * Zero audio files. One AudioContext, created only inside the reader's
 * consent gesture. One master bus (gentle compressor, ceiling ~-18dBFS),
 * one short synthetic plate every voice shares. The palette is tuned to
 * tonight's actual sky (live.ts): the brightest risen wanderer rules the
 * root, the Moon's light opens the filter, and every riffle steps up
 * tonight's pentatonic ladder.
 *
 * Every public method is try/caught internally — the parlor never throws.
 */

import {
  resolveObserver,
  moonState,
  wanderers,
  altitudeDeg,
  type Wanderer,
} from "@/lib/sky/live";

/* ── Planetary roots (the CosmicSynthesizer mapping, re-tempered) ── */

const PLANET_FREQ: Record<string, number> = {
  saturn: 55, // A1
  jupiter: 73.4, // D2
  mars: 82.4, // E2
  moon: 98, // G2
  venus: 110, // A2
  mercury: 130.8, // C3
  sun: 146.8, // D3
};

/** Pentatonic ladder — semitones above the root. */
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function st(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12);
}

const dB = (v: number) => Math.pow(10, v / 20);

/* ── Tonight's tuning, reckoned from the living ephemeris ── */

export interface ParlorTuning {
  root: number; // ruling-planet root frequency
  rulerName: string; // e.g. "SATURN"
  moonIllum: number; // 0..1 — opens the drone filter
  moonPhaseName: string; // e.g. "WAXING GIBBOUS"
  risen: Wanderer[]; // wanderers above the horizon now
}

export function computeTuning(date?: Date): ParlorTuning {
  const t = date ?? new Date();
  try {
    const obs = resolveObserver();
    const moon = moonState(t);
    const all = wanderers(t);
    const risen = all.filter((w) => altitudeDeg(w.raH, w.decDeg, obs, t) > 0);
    // The ruling voice: brightest wanderer above the horizon; the Moon
    // rules when the classical five have all set.
    let rulerKey = "moon";
    let rulerName = "MOON";
    if (risen.length > 0) {
      const brightest = risen.reduce((a, b) => (a.mag <= b.mag ? a : b));
      rulerKey = brightest.key;
      rulerName = brightest.nameEn.toUpperCase();
    }
    return {
      root: PLANET_FREQ[rulerKey] ?? 110,
      rulerName,
      moonIllum: Math.max(0, Math.min(1, moon.illum)),
      moonPhaseName: moon.nameEn.toUpperCase(),
      risen,
    };
  } catch {
    return {
      root: 110,
      rulerName: "VENUS",
      moonIllum: 0.5,
      moonPhaseName: "FIRST QUARTER",
      risen: [],
    };
  }
}

/* ── The engine ── */

class ParlorAudio {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null; // pre-compressor voice bus
  private plate: ConvolverNode | null = null; // shared short plate
  private plateReturn: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null; // shared pink noise
  private droneNodes: {
    oscs: OscillatorNode[];
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null = null;

  private tuning: ParlorTuning = computeTuning();
  private slideSeed = 0; // rotating filter seeds so no two slides match
  private ladderIdx = -1;
  private ladderLast = 0;
  /** Extra gain applied to every voice (idle attract uses -8dB). */
  softDb = 0;

  /* — lifecycle — */

  /** True once the consent gesture has built the context. */
  get unlocked(): boolean {
    return this.ctx !== null;
  }

  get state(): AudioContextState | "none" {
    return this.ctx ? this.ctx.state : "none";
  }

  /**
   * Build the AudioContext + master bus. MUST be called from inside a
   * user gesture handler — this is the ceremony's unlocking.
   */
  unlock(): void {
    if (this.ctx) {
      this.resume();
      return;
    }
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.tuning = computeTuning();

      // Voice bus -> gentle compressor -> master ceiling (~-18dBFS) -> out
      const bus = ctx.createGain();
      bus.gain.value = 1;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -30;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.006;
      comp.release.value = 0.24;
      const master = ctx.createGain();
      master.gain.value = dB(-18);
      bus.connect(comp);
      comp.connect(master);
      master.connect(ctx.destination);
      this.bus = bus;

      // One short synthetic plate all voices share.
      const plate = ctx.createConvolver();
      plate.buffer = this.makePlateIR(ctx, 0.7, 6);
      const plateReturn = ctx.createGain();
      plateReturn.gain.value = 0.35;
      plate.connect(plateReturn);
      plateReturn.connect(bus);
      this.plate = plate;
      this.plateReturn = plateReturn;

      // Shared pink noise (Voss-ish one-pole cascade), 2 seconds.
      this.noiseBuf = this.makePinkNoise(ctx, 2);
    } catch {
      this.ctx = null;
    }
  }

  suspend(): void {
    try {
      if (this.ctx && this.ctx.state === "running") void this.ctx.suspend();
    } catch {
      /* the parlor never throws */
    }
  }

  resume(): void {
    try {
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* the parlor never throws */
    }
  }

  /* — palette — */

  /** 120–180ms pink-noise slide, bandpass sweeping 2.5kHz -> 1.2kHz. */
  cardSlide(velocity = 0.5): void {
    this.voice((ctx, out, now) => {
      if (!this.noiseBuf) return;
      const v = Math.max(0.12, Math.min(1, velocity));
      const dur = 0.12 + 0.06 * v;

      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      // ±30 cents detune + rotating start offset
      const seed = this.slideSeed++ % 3;
      src.detune.value = (Math.random() * 2 - 1) * 30;
      const offset = Math.random() * (this.noiseBuf.duration - dur - 0.05);

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = [0.9, 1.4, 2.1][seed];
      const f0 = 2500 * [1, 1.12, 0.9][seed];
      const f1 = 1200 * [1, 0.94, 1.08][seed];
      bp.frequency.setValueAtTime(f0, now);
      bp.frequency.exponentialRampToValueAtTime(f1, now + dur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.25 * v * dB(this.softDb), now + 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);

      src.connect(bp);
      bp.connect(env);
      env.connect(out);
      this.send(env, 0.15);
      src.start(now, Math.max(0, offset), dur + 0.05);
      src.stop(now + dur + 0.06);
    });
  }

  /** 60ms felt thud: sine 120 -> 60Hz drop + low-passed 10ms noise tick. */
  feltThud(velocity = 0.7): void {
    this.voice((ctx, out, now) => {
      const v = Math.max(0.2, Math.min(1, velocity));

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.5 * v * dB(this.softDb), now + 0.006);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(env);
      env.connect(out);
      this.send(env, 0.1);
      osc.start(now);
      osc.stop(now + 0.1);

      if (this.noiseBuf) {
        const tick = ctx.createBufferSource();
        tick.buffer = this.noiseBuf;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 900;
        const tenv = ctx.createGain();
        tenv.gain.setValueAtTime(0.16 * v * dB(this.softDb), now);
        tenv.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
        tick.connect(lp);
        lp.connect(tenv);
        tenv.connect(out);
        tick.start(now, Math.random(), 0.02);
        tick.stop(now + 0.02);
      }
    });
  }

  /** 20ms high-passed paper snap. */
  paperFlip(): void {
    this.voice((ctx, out, now) => {
      if (!this.noiseBuf) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 4000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.22 * dB(this.softDb), now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      src.connect(hp);
      hp.connect(env);
      env.connect(out);
      this.send(env, 0.08);
      src.start(now, Math.random() * 1.5, 0.03);
      src.stop(now + 0.03);
    });
  }

  /**
   * Inharmonic FM bell (partials ~1 : 2.76 : 5.4). RATIONED — reserved
   * for major-reveal and spread-complete only.
   */
  giltChime(root?: number): void {
    this.voice((ctx, out, now) => {
      const f = (root ?? this.tuning.root) * 4; // bell register
      const partials: Array<[number, number, number]> = [
        // [ratio, level, decay-seconds]
        [1, 0.28, 2.4],
        [2.76, 0.14, 1.5],
        [5.4, 0.06, 0.9],
      ];
      // Gentle FM strike on the fundamental
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 1.4;
      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(f * 0.6, now);
      modGain.gain.exponentialRampToValueAtTime(1, now + 0.5);
      mod.connect(modGain);

      for (const [ratio, level, decay] of partials) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f * ratio;
        if (ratio === 1) modGain.connect(osc.frequency);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(level * dB(this.softDb), now + 0.008);
        env.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.connect(env);
        env.connect(out);
        this.send(env, 0.45);
        osc.start(now);
        osc.stop(now + decay + 0.1);
      }
      mod.start(now);
      mod.stop(now + 2.6);
    });
  }

  /** Consecutive riffle-ticks/deals climb tonight's pentatonic set. */
  ladderTick(): void {
    this.voice((ctx, out, now) => {
      const t = Date.now();
      // The ladder resets after 1.6s of stillness.
      this.ladderIdx = t - this.ladderLast > 1600 ? 0 : (this.ladderIdx + 1) % PENTATONIC.length;
      this.ladderLast = t;
      const f = st(this.tuning.root * 4, PENTATONIC[this.ladderIdx]);

      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.08 * dB(this.softDb), now + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(env);
      env.connect(out);
      this.send(env, 0.12);
      osc.start(now);
      osc.stop(now + 0.1);
    });
  }

  /* — drone — */

  /** Whisper-level bed on tonight's ruling-planet root. 4s fade-in. */
  droneStart(): void {
    this.voice((ctx, out, now) => {
      if (this.droneNodes) return;
      this.tuning = computeTuning();
      const { root, moonIllum } = this.tuning;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      // The Moon's light opens the bed: dark moon = 240Hz, full = 520Hz.
      filter.frequency.value = 240 + moonIllum * 280;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(dB(-31), now + 4); // -30..-32dB bed

      const oscs: OscillatorNode[] = [];
      const voices: Array<[number, number]> = [
        [root, -3],
        [root, 4], // slow beat pair
        [root / 2, 0], // sub body
        [root * 1.5, -6], // quiet fifth
      ];
      for (const [f, detune] of voices) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(filter);
        o.start(now);
        oscs.push(o);
      }
      filter.connect(gain);
      gain.connect(out);
      this.send(gain, 0.3);
      this.droneNodes = { oscs, filter, gain };
    });
  }

  droneStop(): void {
    try {
      const ctx = this.ctx;
      const d = this.droneNodes;
      if (!ctx || !d) return;
      const now = ctx.currentTime;
      d.gain.gain.cancelScheduledValues(now);
      d.gain.gain.setValueAtTime(d.gain.gain.value, now);
      d.gain.gain.linearRampToValueAtTime(0, now + 1.2);
      const oscs = d.oscs;
      this.droneNodes = null;
      window.setTimeout(() => {
        try {
          oscs.forEach((o) => o.stop());
        } catch {
          /* already stopped */
        }
      }, 1400);
    } catch {
      /* the parlor never throws */
    }
  }

  /** Pointer movement lets a little more light into the bed's filter. */
  droneExcite(amount = 0.5): void {
    try {
      const ctx = this.ctx;
      const d = this.droneNodes;
      if (!ctx || !d) return;
      const base = 240 + this.tuning.moonIllum * 280;
      const target = base + Math.min(1, Math.max(0, amount)) * 160;
      const now = ctx.currentTime;
      d.filter.frequency.cancelScheduledValues(now);
      d.filter.frequency.setTargetAtTime(target, now, 0.25);
      d.filter.frequency.setTargetAtTime(base, now + 0.6, 1.2);
    } catch {
      /* the parlor never throws */
    }
  }

  /* — haptics — */

  /** Android-only vibration; a silent no-op everywhere else. */
  haptic(ms: number): void {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      /* the parlor never throws */
    }
  }

  /* — internals — */

  /** Run a voice against the live bus; swallow every fault. */
  private voice(
    fn: (ctx: AudioContext, out: GainNode, now: number) => void,
  ): void {
    try {
      const ctx = this.ctx;
      const out = this.bus;
      if (!ctx || !out || ctx.state !== "running") return;
      fn(ctx, out, ctx.currentTime);
    } catch {
      /* the parlor never throws */
    }
  }

  /** Wire a small send from a voice into the shared plate. */
  private send(from: AudioNode, level: number): void {
    try {
      if (!this.ctx || !this.plate) return;
      const g = this.ctx.createGain();
      g.gain.value = level;
      from.connect(g);
      g.connect(this.plate);
    } catch {
      /* the parlor never throws */
    }
  }

  private makePlateIR(
    ctx: AudioContext,
    seconds: number,
    decay: number,
  ): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
      }
    }
    return buf;
  }

  private makePinkNoise(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.22;
    }
    return buf;
  }
}

/** The one parlor voice — module singleton, safe to import from SSR. */
export const parlorAudio = new ParlorAudio();

// Debug/verification handle (harmless in production; reads only).
if (typeof window !== "undefined") {
  (window as unknown as { __oaParlor?: ParlorAudio }).__oaParlor = parlorAudio;
}
