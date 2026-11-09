#!/usr/bin/env python3
"""Score stills for exposure: clipped highlights, lifted blacks, dull colour.
python3 tools/exposure_check.py [--day] img1.jpg img2.jpg ..."""
import sys, numpy as np
from PIL import Image
day = '--day' in sys.argv
for f in [a for a in sys.argv[1:] if not a.startswith('--')]:
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32) / 255.0
    y = a @ np.array([0.2126, 0.7152, 0.0722])
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0.02, (mx - mn) / np.maximum(mx, 1e-4), 0)
    p5, p50, p95, p99 = np.percentile(y, [5, 50, 95, 99.5])
    clip = (mx > 0.985).mean() * 100
    near = (y > 0.9).mean() * 100
    flags = []
    if clip > 0.5: flags.append('CLIPPED')
    if near > (6 if day else 2): flags.append('TOO BRIGHT')
    if p5 > (0.12 if day else 0.06): flags.append('LIFTED BLACKS')
    if p50 > (0.55 if day else 0.4): flags.append('OVEREXPOSED')
    if p95 < 0.25: flags.append('MURKY (no highlights)')
    if np.mean(sat[y > 0.08]) < 0.12 if (y > 0.08).any() else False: flags.append('DULL COLOUR')
    print(f'{f.split("/")[-1]:42s} p5 {p5:.3f} p50 {p50:.3f} p95 {p95:.3f} p99.5 {p99:.3f} clip {clip:.2f}% near-white {near:.2f}% sat {np.mean(sat):.2f}  {" ".join(flags) or "OK"}')
