/**
 * zodiac-sounds.ts -- Spatial audio for zodiac constellations
 *
 * Each constellation plays from its position in 3D space using HRTF.
 * With headphones, the zodiac ring becomes genuinely spatial.
 */

export const ZODIACFREQ: Record<string, number> = {
  Aries: 440, Taurus: 528, Gemini: 396, Cancer: 417,
  Leo: 528, Virgo: 396, Libra: 528, Scorpio: 285,
  Sagittarius: 639, Capricorn: 174, Aquarius: 741, Pisces: 852,
};

const ZODIAC_AZIMUTH: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90,
  Leo: 120, Virgo: 150, Libra: 180, Scorpio: 210,
  Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
};

const ZODIAC_ELEVATION: Record<string, number> = {
  Aries: 15, Taurus: 10, Gemini: 20, Cancer: 5,
  Leo: 25, Virgo: 10, Libra: 15, Scorpio: -5,
  Sagittarius: 20, Capricorn: -10, Aquarius: 15, Pisces: 5,
};

let audioCtx: AudioContext | null = null;

function ensureAudioCtx(): AudioContext {
  if (!audioCtx) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("Web Audio API unavailable");
    }
    audioCtx = new AudioContextCtor();
  }
  return audioCtx;
}

export function playZodiacTone(signName: string, freq: number): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = ensureAudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    const azimuthDeg = ZODIAC_AZIMUTH[signName] ?? 0;
    const elevationDeg = ZODIAC_ELEVATION[signName] ?? 0;
    const azRad = (azimuthDeg * Math.PI) / 180;
    const elRad = (elevationDeg * Math.PI) / 180;
    const x = Math.sin(azRad) * Math.cos(elRad);
    const y = Math.sin(elRad);
    const z = -Math.cos(azRad) * Math.cos(elRad);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createPanner();

    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1;
    panner.maxDistance = 10;
    panner.rolloffFactor = 1;
    panner.positionX.value = x * 3;
    panner.positionY.value = y * 3;
    panner.positionZ.value = z * 3;

    osc.type = "sine";
    osc.frequency.value = freq;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.5);
  } catch {
    // silent fallback
  }
}

export function playConstellationTone(sign: string): void {
  playZodiacTone(sign, ZODIACFREQ[sign] ?? 528);
}
