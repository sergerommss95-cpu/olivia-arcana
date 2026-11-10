#!/usr/bin/env python3
"""QC of a built sequence (uses its _map.json): per-shot sheet (head / middle / tail frame of every shot, shot id burned
in), flicker spikes and exposure jumps that are NOT on a cut, audio dropouts inside the VO and integrated loudness.

    python3 tools/chapter_qc.py out/EP3_ch1.mp4 [...]
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(FF, 'out', 'qc')
FPS = 24


def frames(path, w=320):
    h = w * 9 // 16
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def audio(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


def qc(path):
    tag = os.path.splitext(os.path.basename(path))[0]
    mp = json.load(open(os.path.splitext(path)[0] + '_map.json'))
    cuts, c = [], 0                              # segments are rendered as round(dur * fps) frames each
    for _, _, d in mp['cuts']:
        cuts.append(c)
        c += int(round(d * FPS))
    F = frames(path)
    G = F.astype(np.float32).mean(3)
    n = len(G)
    fl = np.zeros(n)
    for i in range(1, n - 1):
        fl[i] = np.abs(G[i] - 0.5 * (G[i - 1] + G[i + 1])).mean()
    near_cut = lambda i: any(abs(i - c) <= 1 for c in cuts)
    spikes = []
    for i in range(1, n - 1):
        med = float(np.median(fl[max(1, i - 12):min(n - 1, i + 13)]))
        if fl[i] > max(3.0 * med, 2.0) and not near_cut(i):
            spikes.append((i, round(i / FPS, 2), round(float(fl[i]), 1)))
    luma = G.mean((1, 2))
    jumps = [(i, round(i / FPS, 2)) for i in range(1, n) if luma[i - 1] > 4 and abs(luma[i] - luma[i - 1]) / luma[i - 1] > 0.08
             and not near_cut(i)]
    # sheet: 3 frames per shot
    tw, th = 320, 180
    rows = []
    for k, (sid, t0, d) in enumerate(mp['cuts']):
        a, b = cuts[k], min(n - 1, cuts[k] + int(round(d * FPS)) - 1)
        rows.append((sid, d, [min(n - 1, a + 2), (a + b) // 2, max(a, b - 2)]))
    im = Image.new('RGB', (tw * 3 + 160, th * len(rows)), (0, 0, 0))
    dr = ImageDraw.Draw(im)
    for r, (sid, d, idx) in enumerate(rows):
        for c, i in enumerate(idx):
            im.paste(Image.fromarray(F[i]), (160 + c * tw, r * th))
        dr.text((6, r * th + 6), f'{sid}\n{d:.1f}s', fill=(255, 220, 0))
    os.makedirs(OUT, exist_ok=True)
    sp = os.path.join(OUT, f'{tag}_shots.jpg')
    im.save(sp, quality=82)
    # audio: 50 ms RMS windows; a dropout = < -50 dBFS window between two VO windows inside the VO span
    A = audio(path)
    win = 400
    rms = np.array([np.sqrt(np.mean(A[i:i + win] ** 2) + 1e-12) for i in range(0, len(A) - win, win)])
    db = 20 * np.log10(rms)
    loud = db > -35
    drops = []
    if loud.any():
        lo, hi = np.argmax(loud), len(loud) - np.argmax(loud[::-1])
        for i in range(lo, hi):
            if db[i] < -50:
                drops.append(round(i * win / 8000, 2))
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    I = [l for l in m.splitlines() if l.strip().startswith('I:')]
    P = [l for l in m.splitlines() if l.strip().startswith('Peak:')]
    print(f'{tag}: {n} frames ({n / FPS:.1f}s), {len(mp["cuts"])} shots | spikes off-cut {len(spikes)} {spikes[:40]} | '
          f'exposure jumps off-cut {len(jumps)} {jumps[:10]} | audio dropouts {len(drops)} {drops[:10]} | '
          f'{I[-1].strip() if I else ""} {P[-1].strip() if P else ""} | sheet {sp}')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        qc(p)
