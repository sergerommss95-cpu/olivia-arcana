/**
 * procedural-audio.ts — Cosmic Synthesizer
 *
 * Full procedural generative score that responds to astronomical state.
 * Replaces the basic two-oscillator drone with a multi-layer synthesizer:
 *
 *   1. Root drone — two detuned oscillators at the ruling planet's frequency
 *   2. Harmonic layer — WaveShaperNode with sine transfer function
 *   3. Cosmic texture — white noise through bandpass modulated by slow LFO
 *   4. Time-of-day modulation — filter cutoff tracks solar position
 *   5. Moon phase modulation — harmonic density + reverb
 *   6. Accent notes — pentatonic scale from current sign
 */

import { getSunPosition, getMoonPhase } from "@/lib/celestial";

/* ── Types ── */

export interface AudioConfig {
  rootFrequency: number;     // Based on ruling planet
  filterCutoff: number;      // Based on time of day
  reverbLevel: number;       // Based on moon phase
  harmonicDensity: number;   // Based on moon illumination (0-1)
}

/* ── Planetary frequency map ── */

const PLANET_FREQ: Record<string, number> = {
  Saturn:  55,      // A1
  Jupiter: 73.4,    // D2
  Mars:    82.4,    // E2
  Moon:    98,      // G2
  Venus:   110,     // A2
  Mercury: 130.8,   // C3
  Sun:     146.8,   // D3
  Uranus:  55,      // fallback to Saturn range
  Neptune: 98,      // fallback to Moon range
  Pluto:   55,      // fallback
};

/** Traditional rulers for each zodiac sign */
const SIGN_RULER: Record<string, string> = {
  Aries:       "Mars",
  Taurus:      "Venus",
  Gemini:      "Mercury",
  Cancer:      "Moon",
  Leo:         "Sun",
  Virgo:       "Mercury",
  Libra:       "Venus",
  Scorpio:     "Mars",
  Sagittarius: "Jupiter",
  Capricorn:   "Saturn",
  Aquarius:    "Saturn",
  Pisces:      "Jupiter",
};

/* ── Pentatonic scale intervals (semitones from root) ── */
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function semitonesToFreq(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12);
}

/* ── Compute config from current cosmic state ── */

export function computeCosmicConfig(): AudioConfig {
  const now = new Date();
  const sun = getSunPosition(now);
  const moon = getMoonPhase(now);

  // Root frequency from ruling planet of current Sun sign
  const ruler = SIGN_RULER[sun.sign] ?? "Sun";
  const rootFrequency = PLANET_FREQ[ruler] ?? 110;

  // Filter cutoff tracks hour of day
  // Midnight=200hz, Dawn/Dusk=800hz, Noon=2000hz
  const hour = now.getHours() + now.getMinutes() / 60;
  const dayProgress = Math.sin((hour / 24) * Math.PI); // 0 at midnight, 1 at noon
  const filterCutoff = 200 + dayProgress * 1800;

  // Moon phase modulation
  const illumination = moon.illumination / 100; // 0-1
  const isNewish = illumination < 0.25;
  const reverbLevel = isNewish ? 0.7 : 0.2 + (1 - illumination) * 0.3;
  const harmonicDensity = illumination;

  return { rootFrequency, filterCutoff, reverbLevel, harmonicDensity };
}

/* ── Synthesizer class ── */

export class CosmicSynthesizer {
  private ctx: AudioContext | null = null;
  private playing = false;

  // Nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private harmonicShaper: WaveShaperNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseBandpass: BiquadFilterNode | null = null;
  private noiseLfo: OscillatorNode | null = null;
  private noiseLfoGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;

  private config: AudioConfig = {
    rootFrequency: 110,
    filterCutoff: 800,
    reverbLevel: 0.4,
    harmonicDensity: 0.5,
  };

  /** Start the ambient score */
  start(): void {
    if (this.playing) return;

    const ctx = new AudioContext();
    this.ctx = ctx;
    this.playing = true;

    // ── 1. Root drone: two detuned oscillators ──
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = this.config.rootFrequency;
    osc1.detune.value = -2;

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = this.config.rootFrequency + 6; // ~6hz theta beat difference
    osc2.detune.value = 2;

    // Subharmonic oscillator at half the root frequency for body resonance
    const oscSub = ctx.createOscillator();
    oscSub.type = "sine";
    oscSub.frequency.value = this.config.rootFrequency / 2;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.4; // subtle body resonance
    oscSub.connect(subGain);

    this.osc1 = osc1;
    this.osc2 = osc2;
    this.oscSub = oscSub;
    this.subGain = subGain;

    // ── 2. Harmonic layer: WaveShaperNode with sine transfer ──
    const shaper = ctx.createWaveShaper();
    const curveLen = 4096;
    const curve = new Float32Array(curveLen);
    for (let i = 0; i < curveLen; i++) {
      const x = (i / (curveLen - 1)) * 2 - 1;
      // Soft sine-based saturation that adds warm overtones
      curve[i] = Math.sin(x * Math.PI * (0.5 + this.config.harmonicDensity * 1.5));
    }
    shaper.curve = curve;
    shaper.oversample = "2x";
    this.harmonicShaper = shaper;

    // ── 3. Cosmic texture: white noise -> bandpass ──
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    this.noiseSource = noiseSource;

    const noiseBandpass = ctx.createBiquadFilter();
    noiseBandpass.type = "bandpass";
    noiseBandpass.frequency.value = this.config.filterCutoff * 0.5;
    noiseBandpass.Q.value = 0.3;
    this.noiseBandpass = noiseBandpass;

    // LFO modulating noise bandpass center frequency at 0.05hz
    const noiseLfo = ctx.createOscillator();
    noiseLfo.type = "sine";
    noiseLfo.frequency.value = 0.05;
    this.noiseLfo = noiseLfo;

    const noiseLfoGain = ctx.createGain();
    noiseLfoGain.gain.value = 150;
    this.noiseLfoGain = noiseLfoGain;

    noiseLfo.connect(noiseLfoGain);
    noiseLfoGain.connect(noiseBandpass.frequency);

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.012;
    this.noiseGain = noiseGain;

    noiseSource.connect(noiseBandpass);
    noiseBandpass.connect(noiseGain);

    // ── 4. Time-of-day filter ──
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.value = this.config.filterCutoff;
    masterFilter.Q.value = 0.8;
    this.masterFilter = masterFilter;

    // ── 5. Reverb (synthetic impulse response) ──
    const convolver = ctx.createConvolver();
    convolver.buffer = this.createReverbIR(ctx, 3.0, 2.5);
    this.convolver = convolver;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = this.config.reverbLevel * 0.15;
    this.reverbGain = reverbGain;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1.0;
    this.dryGain = dryGain;

    // ── Master gain ──
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    this.masterGain = masterGain;

    // ── Routing ──
    // Oscillators -> shaper -> filter
    osc1.connect(shaper);
    osc2.connect(shaper);
    subGain.connect(shaper);
    shaper.connect(masterFilter);

    // Noise -> filter (parallel)
    noiseGain.connect(masterFilter);

    // Filter -> dry/wet split
    masterFilter.connect(dryGain);
    masterFilter.connect(convolver);
    convolver.connect(reverbGain);

    dryGain.connect(masterGain);
    reverbGain.connect(masterGain);

    masterGain.connect(ctx.destination);

    // ── Start all sources ──
    osc1.start();
    osc2.start();
    oscSub.start();
    noiseSource.start();
    noiseLfo.start();

    // First Silence: 1.4s of silence before the drone begins, then 2s fade-in
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    setTimeout(() => {
      if (this.ctx && this.masterGain) {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 2.0);
      }
    }, 1400);
  }

  /** Stop with fade out */
  stop(): void {
    if (!this.ctx || !this.playing) return;

    const ctx = this.ctx;
    const mg = this.masterGain;

    if (mg) {
      mg.gain.cancelScheduledValues(ctx.currentTime);
      mg.gain.setValueAtTime(mg.gain.value, ctx.currentTime);
      mg.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    }

    this.playing = false;

    setTimeout(() => {
      this.cleanup();
    }, 1600);
  }

  /** Update parameters based on cosmic state */
  updateConfig(config: AudioConfig): void {
    this.config = config;

    if (!this.ctx || !this.playing) return;
    const t = this.ctx.currentTime + 0.5; // smooth transition

    // Update root drone frequency
    this.osc1?.frequency.linearRampToValueAtTime(config.rootFrequency, t);
    this.osc2?.frequency.linearRampToValueAtTime(config.rootFrequency + 6, t);
    this.oscSub?.frequency.linearRampToValueAtTime(config.rootFrequency / 2, t);

    // Update time-of-day filter
    this.masterFilter?.frequency.linearRampToValueAtTime(config.filterCutoff, t);

    // Update noise bandpass center
    this.noiseBandpass?.frequency.linearRampToValueAtTime(
      config.filterCutoff * 0.5, t,
    );

    // Update reverb level
    if (this.reverbGain) {
      this.reverbGain.gain.linearRampToValueAtTime(
        config.reverbLevel * 0.15, t,
      );
    }

    // Update harmonic shaper curve for density
    if (this.harmonicShaper) {
      const curveLen = 4096;
      const curve = new Float32Array(curveLen);
      for (let i = 0; i < curveLen; i++) {
        const x = (i / (curveLen - 1)) * 2 - 1;
        curve[i] = Math.sin(x * Math.PI * (0.5 + config.harmonicDensity * 1.5));
      }
      this.harmonicShaper.curve = curve;
    }
  }

  /** Play a ritual accent note (pentatonic scale) */
  playAccent(noteIndex: number): void {
    if (!this.ctx || !this.playing) return;
    const ctx = this.ctx;

    const idx = ((noteIndex % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length;
    const freq = semitonesToFreq(this.config.rootFrequency * 2, PENTATONIC[idx]);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const env = ctx.createGain();
    env.gain.value = 0;

    osc.connect(env);
    env.connect(this.masterGain!);

    osc.start();

    // Quick attack, slow decay
    const now = ctx.currentTime;
    env.gain.linearRampToValueAtTime(0.08, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.stop(now + 2.1);
  }

  /** Play a chime sequence */
  playChimeSequence(): void {
    if (!this.ctx || !this.playing) return;

    const notes = [0, 2, 4, 2, 4]; // pentatonic indices
    notes.forEach((note, i) => {
      setTimeout(() => this.playAccent(note), i * 280);
    });
  }

  isPlaying(): boolean {
    return this.playing;
  }

  /* ── Private helpers ── */

  /** Create a synthetic reverb impulse response */
  private createReverbIR(
    ctx: AudioContext,
    duration: number,
    decay: number,
  ): AudioBuffer {
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
      }
    }

    return buffer;
  }

  private cleanup(): void {
    try {
      this.osc1?.stop();
      this.osc2?.stop();
      this.oscSub?.stop();
      this.noiseSource?.stop();
      this.noiseLfo?.stop();
    } catch {
      // already stopped
    }
    try {
      this.ctx?.close();
    } catch {
      // already closed
    }

    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.oscSub = null;
    this.subGain = null;
    this.harmonicShaper = null;
    this.noiseSource = null;
    this.noiseBandpass = null;
    this.noiseLfo = null;
    this.noiseLfoGain = null;
    this.noiseGain = null;
    this.masterFilter = null;
    this.reverbGain = null;
    this.dryGain = null;
    this.masterGain = null;
    this.convolver = null;
  }
}
