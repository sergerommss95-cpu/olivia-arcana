"""Generate 60s of synthetic room tone — band-limited brown-ish noise at -48dB peak.

Real rooms have:
- Ambient air movement (~50Hz rumble)
- HVAC/traffic (~80-200Hz)
- Room resonance (~200-800Hz low frequencies)
- Subtle high-frequency "air" (~2-8kHz very low)

We generate a mix approximating this, write a 60s WAV at low level. Then ffmpeg
can loop it and mix it under voice to break the "pristine studio" feel.
"""

from pathlib import Path
import numpy as np
import wave

OUT = Path("/tmp/room-tone.wav")

sample_rate = 44100
duration = 60
N = int(sample_rate * duration)
rng = np.random.default_rng(42)

# Brown noise: integrate white noise.
white = rng.standard_normal(N).astype(np.float32)
brown = np.cumsum(white)
brown = brown / (np.abs(brown).max() + 1e-6)
# Normalize and low-pass heavily.
import scipy.signal as sps
# Butterworth low-pass at 400Hz (brown-ish emphasis).
sos = sps.butter(4, 400.0, btype='low', fs=sample_rate, output='sos')
brown_low = sps.sosfilt(sos, brown)

# Pink noise for HF "air".
pink = rng.standard_normal(N).astype(np.float32)
sos_hp = sps.butter(2, 1500.0, btype='high', fs=sample_rate, output='sos')
pink_hi = sps.sosfilt(sos_hp, pink)
pink_hi = pink_hi / (np.abs(pink_hi).max() + 1e-6)

# Tiny HVAC-like wobble: 80Hz tone modulated slowly.
t = np.arange(N) / sample_rate
hvac = 0.08 * np.sin(2 * np.pi * 80 * t + 0.5 * np.sin(2 * np.pi * 0.13 * t))

mix = brown_low * 0.7 + pink_hi * 0.15 + hvac * 0.15
mix = mix / (np.abs(mix).max() + 1e-6)

# Scale to -48dB (about 0.004).
peak_linear = 10 ** (-48 / 20)
mix = mix * peak_linear

# Convert to 16-bit PCM.
pcm = (mix * 32767).astype(np.int16)

with wave.open(str(OUT), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sample_rate)
    w.writeframes(pcm.tobytes())

print(f"wrote {OUT}  ({OUT.stat().st_size} bytes, ~{duration}s)")
