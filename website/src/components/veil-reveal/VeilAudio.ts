/**
 * Web Audio synthesis for the veil reveal ceremony.
 *
 * Creates AudioContext lazily on first user gesture to satisfy
 * browser autoplay policies. No audio files needed -- everything
 * is generated procedurally.
 */

export class VeilAudio {
  private ctx: AudioContext | null = null;

  /** Lazily create or return the AudioContext. */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      // Audio not available -- degrade silently
    }
    return this.ctx;
  }

  /** Resume a suspended AudioContext (browser autoplay policy). */
  resume(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Filtered noise whoosh -- the sound of the veil lifting.
   * Lowpass sweep 2400 Hz -> 160 Hz over the given duration.
   */
  playWhoosh(duration = 3.4): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration);
  }

  /**
   * Play the chime sequence -- 5 ascending sine oscillators timed to
   * the card emergence. Each chime includes a fifth-above overtone
   * for warmth.
   *
   * G4(392) -> C5(523) -> E5(659) -> G5(784) -> C6(1047)
   * at delays +0 / +0.2 / +0.4 / +0.6 / +1.0 from startDelay.
   */
  playChimes(startDelay = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes: [freq: number, offset: number, dur: number, peak: number][] = [
      [392.0, 0.0, 1.8, 0.06], // G4
      [523.25, 0.2, 1.8, 0.07], // C5
      [659.25, 0.4, 1.8, 0.08], // E5
      [783.99, 0.6, 2.4, 0.1], // G5
      [1046.5, 1.0, 3.0, 0.08], // C6
    ];

    for (const [freq, offset, duration, gainPeak] of notes) {
      this.playChime(freq, startDelay + offset, duration, gainPeak);
    }
  }

  /** Play a single chime with its fifth-above overtone. */
  private playChime(
    freq: number,
    delay: number,
    duration = 1.4,
    gainPeak = 0.08,
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;

    // Fundamental
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Fifth-above gentle overtone for warmth
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, start);
    gain2.gain.linearRampToValueAtTime(gainPeak * 0.35, start + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.8);

    osc.connect(gain).connect(ctx.destination);
    osc2.connect(gain2).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
    osc2.start(start);
    osc2.stop(start + duration);
  }
}
