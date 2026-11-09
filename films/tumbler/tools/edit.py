#!/usr/bin/env python3
"""Conform + transitions + grade + letterbox, all in numpy, piped into ffmpeg.

python3 tools/edit.py [--edl edit/edl.json] [--out out/tumbler_picture.mp4] [--only 1A,1B] [--preview]

Reads out/renders/<ID>/NNNN.png (16-bit, any size: scaled to 1920x804 with lanczos in ffmpeg).
EDL (edit/edl.json): {"shots": [{"id": "1A", "in": 7, "out": 54, "grade": "act1", "tin": {"type": "cut"}}, ...]}
Transition types on a shot's "tin" (how it comes in from the previous shot):
  cut | dissolve(n) | luma(n) [bright areas cross first] | whip(n) [directional smear across the cut] | flash(n)
Handles are taken from the renders, so dissolves overlap real frames (no freeze frames).
"""
import json, os, subprocess, sys
import numpy as np

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, BAND = 1920, 1080, 804
FPS = 24


def arg(name, default=None):
    a = sys.argv
    if name in a:
        i = a.index(name)
        return a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith('--') else True
    return default


# ----------------------------------------------------------------------------- io

def read_shot(sid, first, last, pw=W, ph=BAND):
    """Decode frames first..last (inclusive, local numbers) -> float32 array [n, ph, pw, 3] in 0..1 (display-referred)."""
    d = os.path.join(FILM, 'out', 'renders', sid)
    n = last - first + 1
    cmd = ['ffmpeg', '-v', 'error', '-framerate', str(FPS), '-start_number', str(first), '-i', os.path.join(d, '%04d.png'),
           '-frames:v', str(n), '-vf', f'scale={pw}:{ph}:flags=lanczos', '-pix_fmt', 'rgb48le', '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    a = np.frombuffer(raw, np.uint16).astype(np.float32) / 65535.0
    got = a.size // (pw * ph * 3)
    a = a[:got * pw * ph * 3].reshape(got, ph, pw, 3)
    if got < n:   # pad by holding the last frame (should not happen once renders are complete)
        print(f'[edit] WARNING {sid}: wanted {n} frames from {first}, got {got}', flush=True)
        if got == 0:
            a = np.zeros((n, ph, pw, 3), np.float32)
        else:
            a = np.concatenate([a, np.repeat(a[-1:], n - got, 0)], 0)
    return a


# ----------------------------------------------------------------------------- image ops

def box_blur(img, r, axis):
    if r < 1:
        return img
    c = np.cumsum(img, axis=axis, dtype=np.float32)
    pad_shape = list(img.shape)
    pad_shape[axis] = 1
    c = np.concatenate([np.zeros(pad_shape, np.float32), c], axis=axis)
    n = img.shape[axis]
    idx_hi = np.clip(np.arange(n) + r + 1, 0, n)
    idx_lo = np.clip(np.arange(n) - r, 0, n)
    hi = np.take(c, idx_hi, axis=axis)
    lo = np.take(c, idx_lo, axis=axis)
    cnt = (idx_hi - idx_lo).astype(np.float32)
    shape = [1] * img.ndim
    shape[axis] = n
    return (hi - lo) / cnt.reshape(shape)


def blur(img, r, passes=3):
    """Approximate gaussian (3 box passes) on a downsampled copy for big radii."""
    if r <= 0:
        return img
    k = 1
    while r / k > 12 and img.shape[0] // (k * 2) > 8:
        k *= 2
    small = img
    if k > 1:
        h, w = img.shape[0] // k * k, img.shape[1] // k * k
        small = img[:h, :w].reshape(h // k, k, w // k, k, -1).mean((1, 3))
    rr = max(1, int(round(r / k / 1.7)))
    for _ in range(passes):
        small = box_blur(small, rr, 0)
        small = box_blur(small, rr, 1)
    if k > 1:
        small = np.repeat(np.repeat(small, k, 0), k, 1)
        small = box_blur(box_blur(small, k // 2, 0), k // 2, 1)
        out = np.zeros_like(img)
        out[:small.shape[0], :small.shape[1]] = small
        out[small.shape[0]:] = out[small.shape[0] - 1:small.shape[0]]
        out[:, small.shape[1]:] = out[:, small.shape[1] - 1:small.shape[1]]
        return out
    return small


def luma(img):
    return img[..., 0] * 0.2126 + img[..., 1] * 0.7152 + img[..., 2] * 0.0722


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


GRADES = {
    # shadows tint, highlights tint, saturation, contrast, exposure (stops), halation strength, bloom
    'act1': dict(sh=(-0.016, 0.006, 0.024), hi=(0.04, 0.012, -0.035), sat=1.06, con=1.12, exp=0.0, hal=0.22, bloom=0.10),
    'act2': dict(sh=(-0.014, 0.008, 0.026), hi=(0.03, 0.012, -0.02), sat=1.0, con=1.1, exp=0.0, hal=0.18, bloom=0.10),
    'act3': dict(sh=(-0.008, 0.004, 0.014), hi=(0.03, 0.006, -0.035), sat=1.05, con=1.1, exp=-0.05, hal=0.25, bloom=0.12),
    'act4': dict(sh=(-0.012, 0.006, 0.022), hi=(0.03, 0.005, -0.02), sat=1.08, con=1.1, exp=0.0, hal=0.28, bloom=0.14),
    'act5': dict(sh=(-0.006, 0.003, 0.010), hi=(0.02, 0.008, -0.02), sat=1.0, con=1.06, exp=0.0, hal=0.18, bloom=0.08),
}


def grade(img, g, rng, t=0.0):
    x = img
    if g.get('exp'):
        x = x * (2 ** g['exp'])
    # contrast around mid grey (display space), gentle
    x = np.clip(0.5 + (x - 0.5) * g['con'], 0, None)
    # soft shoulder: roll highlights off before 1.0
    knee = 0.78
    over = np.maximum(x - knee, 0)
    x = np.where(x > knee, knee + (1 - knee) * (1 - np.exp(-over / (1 - knee))), x)
    Y = luma(x)[..., None]
    # saturation
    x = Y + (x - Y) * g['sat']
    # split toning
    ws = 1 - smoothstep(0.0, 0.45, Y)
    wh = smoothstep(0.35, 1.0, Y)
    x = x + ws * np.array(g['sh'], np.float32) + wh * np.array(g['hi'], np.float32)
    # halation: bright cores bleed warm-red into neighbours (film)
    Y2 = luma(np.clip(x, 0, 1))
    hot = np.clip((Y2 - 0.62) / 0.38, 0, 1)[..., None] * np.clip(x, 0, 1)
    if g['hal'] > 0:
        hal = blur(hot, 14)
        x = x + hal * np.array([1.0, 0.35, 0.12], np.float32) * g['hal']
    if g['bloom'] > 0:
        bl = blur(hot, 60)
        x = x + bl * np.array([1.0, 0.9, 0.8], np.float32) * g['bloom']
    # vignette (anamorphic oval)
    h, w = x.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    vx, vy = (xx / w - 0.5) * 2, (yy / h - 0.5) * 2
    v = 1 - 0.28 * np.clip((vx ** 2 * 0.75 + vy ** 2 * 0.45) - 0.15, 0, 1)
    x = x * v[..., None]
    # chromatic fringe at the edges (R out, B in)
    shift = (np.abs(vx) ** 2 * 2.0).astype(np.float32)
    xi = np.clip(np.round(xx + np.sign(vx) * shift), 0, w - 1).astype(np.int32)
    xo = np.clip(np.round(xx - np.sign(vx) * shift), 0, w - 1).astype(np.int32)
    r = np.take_along_axis(x[..., 0], xi, 1)
    b = np.take_along_axis(x[..., 2], xo, 1)
    x = np.stack([r, x[..., 1], b], -1)
    # grain: luma-weighted, slightly soft, per frame
    gr = rng.standard_normal((h // 2, w // 2, 1)).astype(np.float32)
    gr = np.repeat(np.repeat(gr, 2, 0), 2, 1)
    gr = box_blur(box_blur(gr, 1, 0), 1, 1) * 1.6
    Yg = luma(np.clip(x, 0, 1))[..., None]
    amp = 0.028 * (0.35 + 0.65 * np.sqrt(np.clip(Yg, 0, 1)) * (1.1 - Yg))
    x = x + gr * amp
    return np.clip(x, 0, 1)


def whip_smear(img, amount, direction=1):
    """Horizontal motion smear for whip-pan transitions."""
    if amount <= 0:
        return img
    r = int(amount)
    return blur(img, 0) if r < 1 else box_blur(box_blur(img, r, 1), r // 2 + 1, 1)


# ----------------------------------------------------------------------------- main

def overlap_n(s):
    t = s.get('tin', {'type': 'cut'})
    return int(t.get('n', 8)) if t['type'] in ('dissolve', 'luma') else 0


def main():
    edl = json.load(open(os.path.join(FILM, arg('--edl', 'edit/edl.json'))))
    shots = edl['shots']
    only = arg('--only')
    if only:
        keep = set(only.split(','))
        shots = [s for s in shots if s['id'] in keep]
    out = os.path.join(FILM, arg('--out', 'out/tumbler_picture.mp4'))
    preview = bool(arg('--preview'))
    ow, oh, band = (W, H, BAND) if not preview else (960, 540, 402)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{ow}x{oh}', '-r', str(FPS),
                            '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14' if not preview else '22',
                            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    rng = np.random.default_rng(7)
    bar = (oh - band) // 2
    # timeline: shot k covers [T[k], T[k] + len_k)
    T, t = [], 0
    for s in shots:
        T.append(t)
        t += s['out'] - s['in'] + 1
    total = t
    cache = {}

    def load(k):
        if k in cache:
            return cache[k]
        s = shots[k]
        n_in = overlap_n(s)
        n_out = overlap_n(shots[k + 1]) if k + 1 < len(shots) else 0
        first = s['in'] - n_in // 2
        last = s['out'] + (n_out - n_out // 2)
        arr = (read_shot(s['id'], first, last, ow, band) * 65535).astype(np.uint16)
        cache[k] = (first, arr)
        for old in list(cache):
            if old < k - 1:
                del cache[old]
        return cache[k]

    def frame_of(k, local):
        first, arr = load(k)
        i = int(np.clip(local - first, 0, arr.shape[0] - 1))
        return arr[i].astype(np.float32) / 65535.0

    k = 0
    for t in range(total):
        while k + 1 < len(shots) and t >= T[k + 1]:
            k += 1
        s = shots[k]
        local = s['in'] + (t - T[k])
        img = frame_of(k, local)
        g = GRADES[s.get('grade', 'act1')]
        # overlap with the NEXT shot (first half of its transition happens at the end of this shot)
        nxt = shots[k + 1] if k + 1 < len(shots) else None
        def mixin(a_img, b_img, kind, m):
            if kind == 'dissolve':
                return a_img * (1 - m) + b_img * m
            Yb = luma(b_img)[..., None]
            mm = np.clip(m * 1.7 - (1 - Yb) * 0.7, 0, 1)
            mm = mm * mm * (3 - 2 * mm)
            return a_img * (1 - mm) + b_img * mm
        if nxt and overlap_n(nxt) and t >= T[k + 1] - overlap_n(nxt) // 2:
            n = overlap_n(nxt)
            m = (t - (T[k + 1] - n // 2) + 0.5) / n
            b_img = frame_of(k + 1, nxt['in'] + (t - T[k + 1]))
            img = mixin(img, b_img, nxt['tin']['type'], m)
            g = GRADES[nxt.get('grade', 'act1')] if m > 0.5 else g
        n_in = overlap_n(s)
        if n_in and t < T[k] + (n_in - n_in // 2) and k > 0:
            prv = shots[k - 1]
            m = (t - (T[k] - n_in // 2) + 0.5) / n_in
            a_img = frame_of(k - 1, prv['out'] + (t - T[k]) + 1)
            img = mixin(a_img, img, s['tin']['type'], m)
        tin = s.get('tin', {'type': 'cut'})
        i = t - T[k]
        nf = s['out'] - s['in'] + 1
        if tin['type'] == 'whip' and i < int(tin.get('n', 3)):
            img = whip_smear(img, (int(tin.get('n', 3)) - i) * 16)
        if s.get('whip_out') and i >= nf - int(s['whip_out']):
            img = whip_smear(img, (i - (nf - int(s['whip_out'])) + 1) * 16)
        if tin['type'] == 'flash' and i < int(tin.get('n', 2)):
            img = np.clip(img + (1 - i / int(tin.get('n', 2))) * 0.3, 0, 1)
        gi = grade(img, g, rng)
        if s.get('fade_in') and i < s['fade_in']:
            gi = gi * ((i + 1) / s['fade_in']) ** 1.5
        if s.get('fade_out') and i >= nf - s['fade_out']:
            gi = gi * ((nf - i - 1) / s['fade_out']) ** 1.5
        frame = np.zeros((oh, ow, 3), np.uint8)
        frame[bar:bar + band] = (np.clip(gi, 0, 1) * 255 + rng.random(gi.shape) * 0.999).astype(np.uint8)
        enc.stdin.write(frame.tobytes())
        if i == 0:
            print(f'[edit] {s["id"]} at {t} ({t / FPS:.2f}s) in={tin["type"]}', flush=True)
    enc.stdin.close()
    enc.wait()
    json.dump({'frames': total, 'cuts': [(s['id'], T[i]) for i, s in enumerate(shots)]}, open(out + '.json', 'w'), indent=1)
    print(f'[edit] wrote {out}  {total} frames  {total / FPS:.2f}s', flush=True)


if __name__ == '__main__':
    main()
