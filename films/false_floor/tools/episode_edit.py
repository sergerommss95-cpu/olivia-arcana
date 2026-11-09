#!/usr/bin/env python3
"""Assemble the episode against the VO: picture per beat, overlays, brand grade, holds, VO + SFX + music mix.

python3 tools/episode_edit.py [--vo out/vo/vo_temp_v01] [--out out/FALSE_FLOOR_E02_v01.mp4] [--preview] [--only S00,S01]
                              [--music KEY --music-gain -20] [--workers 4]

Picture sources per shot (first that exists):
  3D : out/clips/<ID>.mkv (cut frames 7..N-6; if the beat is longer, the last frame holds with a slow push)
  3DS: out/clips/<ID>.png (2560x1440), slow push/drift ("Ken Burns")
  MG : out/renders/<ID>/####.png (full beat; holds last frame)
  fallback (animatic): newest tests/<ID>_*.jpg as a still with a slow push, else a charcoal slate with the shot id.
HOLD beats extend the previous picture. 3D/3DS frames get the brand grade + ILLUSTRATIVE RECONSTRUCTION label.
"""
import glob, json, os, subprocess, sys, math
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS, SR = 1920, 1080, 24, 48000
CHARCOAL = np.array([17, 23, 25], np.float32) / 255
CREAM = np.array([236, 232, 223], np.float32) / 255
FONT = lambda w, s: ImageFont.truetype(os.path.join(FF, 'fonts', f'BarlowCondensed-{w}.ttf'), s)
LAYER = {'S14': 1, 'S15': 2, 'S16': 3, 'S17': 4, 'S18': 5, 'S20': 10}


def arg(n, d=None):
    a = sys.argv
    if n in a:
        i = a.index(n)
        return a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith('--') else True
    return d


# ----------------------------------------------------------------------------- timeline

def build_timeline(shots, vo):
    beats = {f"S{b['beat']:02d}": b for b in vo['beats']}
    tl, t = [], 0.0
    prev_ch = None
    for i, s in enumerate(shots):
        b = beats[s['id']]
        seg = b['end'] - b['start']
        hold = 1.0
        if s['kind'] in ('3D', '3DS'):
            hold += 0.7
        if 'DROP' in s['shot'] or 'freeze' in s['shot'].lower():
            hold += 0.8
        nxt = shots[i + 1] if i + 1 < len(shots) else None
        if nxt and beats[nxt['id']]['chapter'] != b['chapter']:
            hold += 2.6                                   # chapter breath
        if not nxt:
            hold += 2.5
        lead = 0.25 if i else 0.8
        dur = lead + seg + hold
        tl.append({**s, 't0': t, 'dur': dur, 'vo_at': t + lead, 'vo_src': (b['start'], b['end']), 'chapter': b['chapter']})
        t += dur
    kinds = {e['id']: e['kind'] for e in tl}
    for e in tl:
        e['src_kind'] = e['kind']
    # HOLD beats: picture continues from the previous non-HOLD shot
    for k, e in enumerate(tl):
        if e['kind'] == 'HOLD':
            j = k - 1
            while j >= 0 and tl[j]['kind'] == 'HOLD':
                j -= 1
            e['pic_from'] = tl[j]['id'] if j >= 0 else None
            e['src_kind'] = kinds.get(e['pic_from'], 'HOLD')
    return tl, t


# ----------------------------------------------------------------------------- picture

def newest_test(sid):
    c = sorted(glob.glob(os.path.join(FF, 'tests', f'{sid}_*.jpg')), key=os.path.getmtime)
    return c[-1] if c else None


def kb(img, u, seed):
    """Ken Burns: crop window shrinks 100% -> 89% with a gentle drift; output W x H."""
    iw, ih = img.size
    rng = np.random.default_rng(seed)
    dx, dy = rng.uniform(-0.04, 0.04), rng.uniform(-0.03, 0.03)
    e = u * u * (3 - 2 * u)
    sc = 1.0 - 0.11 * e
    cw, ch = iw * sc, iw * sc * H / W
    if ch > ih:
        ch = ih * sc
        cw = ch * W / H
    cx = iw / 2 + dx * iw * e
    cy = ih / 2 + dy * ih * e
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.resize((W, H), Image.BICUBIC, box=box)


def slate(text):
    im = Image.new('RGB', (W, H), tuple(int(c * 255) for c in CHARCOAL))
    d = ImageDraw.Draw(im)
    d.text((100, H // 2), text, font=FONT('SemiBold', 44), fill=(183, 186, 184))
    return im


class Source:
    def __init__(self, e):
        self.e = e
        sid = e['pic_from'] if e['kind'] == 'HOLD' and e.get('pic_from') else e['id']
        self.sid = sid
        src = next((x for x in [e] if x['id'] == sid), None)
        self.kind = e['kind'] if e['kind'] != 'HOLD' else 'HOLDSTILL'
        self.frames = None
        self.still = None
        self.mode = None
        clip = os.path.join(FF, 'out', 'clips', f'{sid}.mkv')
        png = os.path.join(FF, 'out', 'clips', f'{sid}.png')
        mg = os.path.join(FF, 'out', 'renders', sid)
        if os.path.exists(clip):
            self.mode = 'clip'
            self.clip = clip
        elif os.path.exists(png):
            self.mode = 'still'
            self.still = Image.open(png).convert('RGB')
        elif os.path.isdir(mg) and glob.glob(os.path.join(mg, '*.png')):
            self.mode = 'mg'
            self.mg = sorted(glob.glob(os.path.join(mg, '*.png')))
        else:
            t = newest_test(sid)
            self.mode = 'still'
            self.still = Image.open(t).convert('RGB') if t else slate(f'{sid} · {e["shot"][:90]}')
            self.placeholder = t is None

    def clip_frames(self, n_needed):
        if getattr(self, '_fr', None) is not None:
            return self._fr
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', self.clip, '-vf', f'scale={W}:{H}:flags=lanczos', '-pix_fmt', 'rgb24',
                              '-f', 'rawvideo', '-'], capture_output=True).stdout
        a = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
        if self.e.get('src_kind') == '3D':          # 3D renders carry 6-frame handles at both ends
            a = a[6:max(7, len(a) - 6)]
        self._fr = a
        return a

    def samples(self):
        """A few frames for the exposure balance."""
        if self.mode == 'clip':
            fr = self.clip_frames(0)
            return [Image.fromarray(fr[j]) for j in np.linspace(0, len(fr) - 1, 5).astype(int)]
        if self.mode == 'still' and self.still is not None:
            return [self.still]
        return []

    def frame_iter(self, n):
        if self.mode == 'clip':
            fr = self.clip_frames(n)
            self.n_clip = len(fr)
            last = Image.fromarray(fr[-1])
            for i in range(n):
                if i < len(fr):
                    yield Image.fromarray(fr[i])
                else:
                    yield kb(last, (i - len(fr)) / max(1, n - len(fr)) * 0.35, 1)
        elif self.mode == 'mg':
            for i in range(n):
                im = Image.open(self.mg[min(i, len(self.mg) - 1)]).convert('RGB')
                yield im if im.size == (W, H) else im.resize((W, H), Image.BILINEAR)
        else:
            seed = int(self.sid[1:]) if self.sid[1:].isdigit() else 0
            for i in range(n):
                yield kb(self.still, i / max(1, n - 1), seed)


def shot_exposure(frames):
    """Per-shot exposure balance for 3D renders (phones show low-key renders as black). From a few sample frames:
    gain puts the bright end (p99 luma) near 0.82 (max x3.2), then a midtone gamma lifts the mean luma to >= 0.26.
    Never darkens a shot. Returns (gain, gamma)."""
    Ys = []
    for im in frames:
        a = np.asarray(im.resize((240, 135), Image.BILINEAR)).astype(np.float32) / 255.0
        Ys.append(a @ np.array([0.2126, 0.7152, 0.0722], np.float32))
    Y = np.concatenate([y.ravel() for y in Ys])
    hi = float(np.percentile(Y, 99.0))
    gain = float(np.clip(0.82 / max(hi, 1e-3), 1.0, 3.2))
    m = float(np.clip(Y * gain, 0, 1).mean())
    gamma = float(np.clip(np.log(0.26) / np.log(max(m, 1e-3)), 0.55, 1.0)) if m < 0.26 else 1.0
    return gain, gamma


def grade(im, rng, expo=(1.0, 1.0)):
    x = np.asarray(im).astype(np.float32) / 255.0
    gain, gamma = expo
    if gain != 1.0 or gamma != 1.0:
        x = x * gain
        x = np.where(x > 0.8, 0.8 + 0.2 * np.tanh((x - 0.8) / 0.2), x)       # soft shoulder, no clipped highlights
        x = np.clip(x, 0, 1) ** gamma
    # gentle S-curve; lighter on low-key shots so the shadows keep detail
    k = 0.5 if gamma >= 0.95 else 0.3
    x = x * x * (3 - 2 * x) * k + x * (1 - k)
    Y = x @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    x = Y[..., None] + (x - Y[..., None]) * 0.86
    small = Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8)).resize((W // 8, H // 8), Image.BILINEAR)
    hot = np.asarray(small.filter(ImageFilter.GaussianBlur(3)).resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
    x = x + np.clip((hot - 0.62) / 0.38, 0, 1) * np.array([1.0, 0.45, 0.25], np.float32) * 0.1
    x = CHARCOAL + np.clip(x, 0, 1) * (CREAM - CHARCOAL)
    x = CHARCOAL + (x - CHARCOAL) * VIG[..., None]
    g = rng.standard_normal((H // 2, W // 2), dtype=np.float32).repeat(2, 0).repeat(2, 1)[..., None]
    x = x + g * 0.016
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def make_vig():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    return 1 - 0.22 * np.clip(((xx / W - 0.5) * 2) ** 2 * 0.7 + ((yy / H - 0.5) * 2) ** 2 * 0.55 - 0.12, 0, 1)


VIG = make_vig()


def set_size(w, h):
    global W, H, VIG
    W, H = w, h
    VIG = make_vig()


def overlay(name, idx=None):
    d = os.path.join(FF, 'out', 'renders', name)
    if not os.path.isdir(d):
        return None
    fs = sorted(glob.glob(os.path.join(d, '*.png')))
    if not fs:
        return None
    f = fs[0] if idx is None else fs[min(idx, len(fs) - 1)]
    im = Image.open(f).convert('RGBA')
    return im if im.size == (W, H) else im.resize((W, H), Image.BILINEAR)


def find_value_png(name, prefix, value):
    p = os.path.join(FF, 'out', 'renders', name, f'{prefix}{value}.png')
    if not os.path.exists(p):
        return None
    im = Image.open(p).convert('RGBA')
    return im if im.size == (W, H) else im.resize((W, H), Image.BILINEAR)


def label_fallback():
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = FONT('Medium', max(11, int(22 * W / 1920)))
    d.text((100 * W // 1920, H - 52 * H // 1080), 'ILLUSTRATIVE RECONSTRUCTION', font=f, fill=(183, 186, 184, 255), anchor='ls')
    d.text((W - 100 * W // 1920, H - 52 * H // 1080), 'FALSE FLOOR · CASE No. 02', font=f, fill=(183, 186, 184, 255), anchor='rs')
    return lay


FIELD_CACHE = {}


def field_lines(sid, cut_f, i, fade):
    """Magnetic field (S18/S24): fine cream lines bridging the two plates across the seam, drawn in post from A2's
    per-frame anchors (tests/<sid>_anchors.json), with a slow travelling shimmer. fade: 0..1 overall opacity."""
    if sid not in FIELD_CACHE:
        p = os.path.join(FF, 'tests', f'{sid}_anchors.json')
        FIELD_CACHE[sid] = json.load(open(p))['frames'] if os.path.exists(p) else None
    fr = FIELD_CACHE[sid]
    if not fr or fade <= 0:
        return None
    keys = sorted(int(k) for k in fr)
    a = fr[str(min(max(cut_f, keys[0]), keys[-1]))]
    S = 2
    lay = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(lay)
    P = lambda k: np.array(a[k], np.float32) * np.array([W * S, H * S], np.float32)
    lv = ['z20', 'z45', 'z70']
    t = i / FPS
    for hi in range(11):
        u = -0.1 + 1.2 * hi / 10                       # across the plate height, a little past the anchors
        seg, w_ = (0, u / 0.5) if u < 0.5 else (1, (u - 0.5) / 0.5)
        get = lambda name: P(f'{name}_{lv[seg]}') * (1 - w_) + P(f'{name}_{lv[seg + 1]}') * w_
        dc, fc, df, ff_ = get('door_contact'), get('frame_contact'), get('door_front'), get('frame_front')
        for k, fa in enumerate((0.25, 1.0, 2.2, 3.8)):
            p0 = dc + (df - dc) * fa
            p1 = fc + (ff_ - fc) * fa
            v = p1 - p0
            L = float(np.hypot(*v)) + 1e-6
            nrm = np.array([v[1], -v[0]]) / L
            if nrm[1] > 0:
                nrm = -nrm
            ctrl = (p0 + p1) / 2 + nrm * L * (0.12 + 0.10 * fa)
            ts = np.linspace(0, 1, 40)[:, None]
            pts = (1 - ts) ** 2 * p0 + 2 * (1 - ts) * ts * ctrl + ts ** 2 * p1
            base = int(255 * fade * (0.46 - 0.08 * k) * (0.85 + 0.15 * math.sin(t * 2.1 + hi * 0.7 + k)))
            d.line([tuple(q) for q in pts], fill=base, width=2 * S // 2 + 1)
            # travelling brighter dash (the field "holding")
            ph = (t * 0.35 + hi * 0.137 + k * 0.31) % 1.0
            j0 = int(ph * 34)
            d.line([tuple(q) for q in pts[j0:j0 + 6]], fill=int(255 * fade * 0.75), width=2 * S // 2 + 1)
    lay = lay.resize((W, H), Image.LANCZOS)
    glow = lay.filter(ImageFilter.GaussianBlur(3)).point(lambda q: int(q * 0.6))
    alpha = Image.fromarray(np.maximum(np.asarray(lay), np.asarray(glow)))
    out = Image.new('RGBA', (W, H), (236, 232, 223, 0))
    out.putalpha(alpha)
    return out


def render_segment(args):
    e, path, preview = args
    n = int(round(e['dur'] * FPS))
    src = Source(e)
    rng = np.random.default_rng((int(e['id'][1:]) if e['id'][1:].isdigit() else 99) * 7 + 1)
    is3d = e['kind'] in ('3D', '3DS') or (e['kind'] == 'HOLD' and src.mode != 'mg')
    label = overlay('O_LABEL') or label_fallback()
    ow, oh = W, H
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{ow}x{oh}', '-r', str(FPS),
                            '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16' if not preview else '23',
                            '-pix_fmt', 'yuv420p', path], stdin=subprocess.PIPE)
    expo = (1.0, 1.0)
    if is3d and not getattr(src, 'placeholder', False):
        smp = src.samples()
        if smp:
            expo = shot_exposure(smp)
    for i, im in enumerate(src.frame_iter(n)):
        if is3d:
            im = grade(im, rng, expo)
        im = im.convert('RGBA')
        if is3d:
            im = Image.alpha_composite(im, label)
        sid = e['id']
        if sid in ('S18', 'S24') and src.mode == 'clip':
            nc = getattr(src, 'n_clip', n)
            fade = min(1.0, max(0.0, (i - 10) / 14)) if sid == 'S18' else min(1.0, (i + 1) / 8)
            if i >= nc:
                fade *= max(0.0, 1 - (i - nc) / 10)
            o = field_lines(sid, 7 + min(i, nc - 1), i, fade)
            if o:
                im = Image.alpha_composite(im, o)
        if sid == 'S01':
            o = overlay('O_109', i)
            if o:
                im = Image.alpha_composite(im, o)
        if sid == 'S03':
            o = overlay('O_TITLE', i)
            if o:
                im = Image.alpha_composite(im, o)
        if sid in LAYER:
            o = find_value_png('O_LAYER', 'layer_', f'{LAYER[sid]:02d}')
            if o:
                im = Image.alpha_composite(im, o)
        if sid == 'S27':
            v = 1 + int(108 * min(1.0, i / max(1, n - 1 - int(1.3 * FPS))))
            o = find_value_png('O_COUNT', 'count_', f'{v:03d}')
            if o:
                im = Image.alpha_composite(im, o)
        if e.get('fade_in') and i < e['fade_in']:
            im = Image.blend(Image.new('RGBA', im.size, (17, 23, 25, 255)), im, (i + 1) / e['fade_in'])
        if e.get('fade_out') and i >= n - e['fade_out']:
            im = Image.blend(Image.new('RGBA', im.size, (17, 23, 25, 255)), im, max(0, (n - i - 1) / e['fade_out']))
        im = im.convert('RGB')
        enc.stdin.write(im.tobytes())
    enc.stdin.close()
    enc.wait()
    return e['id'], n, src.mode + (f' gain {expo[0]:.2f} gamma {expo[1]:.2f}' if expo != (1.0, 1.0) else '')


# ----------------------------------------------------------------------------- audio

def load_wav(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def mix(tl, total, vo_path, out_wav, music=None, music_gain=-22.0, music_offset=0.0):
    n = int((total + 1) * SR)
    vo_bus = np.zeros((n, 2), np.float32)
    fx_bus = np.zeros((n, 2), np.float32)
    vo = load_wav(vo_path + '.wav')
    for e in tl:
        if not e.get('vo_src'):
            continue
        a, b = int(e['vo_src'][0] * SR), int(e['vo_src'][1] * SR)
        seg = vo[a:b]
        at = int(e['vo_at'] * SR)
        vo_bus[at:at + len(seg)] += seg[:max(0, n - at)]
    cues_p = os.path.join(FF, 'edit', 'sfx_cues.json')
    sfx_dir = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'sfx')
    if os.path.exists(cues_p):
        start = {e['id']: e['t0'] for e in tl}
        for c in json.load(open(cues_p)):
            if c['shot'] not in start:
                continue
            p = os.path.join(sfx_dir, c['key'] + '.wav')
            if not os.path.exists(p):
                continue
            x = load_wav(p)
            if c.get('dur'):
                x = x[:int(c['dur'] * SR)]
                fo = min(len(x), int(0.3 * SR))
                x[-fo:] *= np.linspace(1, 0, fo)[:, None]
            x *= 10 ** (c.get('gain', -12) / 20)
            at = int((start[c['shot']] + c.get('t', 0.0)) * SR)
            L = min(len(x), n - at)
            if L > 0:
                fx_bus[at:at + L] += x[:L]
    out = vo_bus * 1.0 + fx_bus
    plan_p = os.path.join(FF, 'edit', 'music_plan.json')
    if os.path.exists(plan_p) and not music:
        plan = json.load(open(plan_p))
        mdir = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'music')
        bed = np.zeros((n, 2), np.float32)
        cache = {}
        for c in plan['chapters']:
            span = [e for e in tl if e['chapter'].split(' ')[0] == c['chapter']]
            if not span:
                continue
            a = int(span[0]['t0'] * SR)
            b = int((span[-1]['t0'] + span[-1]['dur']) * SR)
            if c['track'] not in cache:
                cache[c['track']] = load_wav(os.path.join(mdir, c['track'] + '.wav'))
            src = cache[c['track']]
            o = int(c['offset'] * SR)
            seg = src[o:o + (b - a)].copy()
            fade = min(len(seg) // 2, int(1.5 * SR))
            if fade > 0:
                seg[:fade] *= np.linspace(0, 1, fade)[:, None]
                seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
            bed[a:a + len(seg)] += seg * 10 ** (c['gain'] / 20)
        for d in plan.get('drops', []):
            e = next((x for x in tl if x['id'] == d['shot']), None)
            if not e:
                continue
            seg_len = e['vo_src'][1] - e['vo_src'][0]
            at = e['vo_at'] + (0 if d['at'] == 'vo_start' else seg_len + float(d['at'].split('-')[1]) * -1)
            a, L = int(at * SR), int(d['len'] * SR)
            env = np.ones(n, np.float32)
            env[max(0, a - SR // 4):a] = np.linspace(1, 0, min(a, SR // 4))
            env[a:a + L] = 0
            env[a + L:a + L + SR // 2] = np.linspace(0, 1, len(env[a + L:a + L + SR // 2]))
            bed *= env[:, None]
            fx_bus *= np.where(np.arange(n) < a, 1.0, np.where(np.arange(n) < a + L, 0.15, 1.0))[:, None]
        vo_env = np.sqrt(np.convolve(vo_bus[:, 0] ** 2, np.ones(SR // 5) / (SR // 5), 'same'))
        bed *= np.where(vo_env > 0.01, 0.55, 1.0)[:, None]
        out += bed
    if music:
        m = load_wav(music)
        o = int(music_offset * SR)
        seg = m[o:o + n]
        env = np.full(len(seg), 10 ** (music_gain / 20), np.float32)
        vo_env = np.sqrt(np.convolve((vo_bus[:len(seg), 0] ** 2), np.ones(SR // 5) / (SR // 5), 'same'))
        env *= np.where(vo_env > 0.01, 0.6, 1.0)
        out[:len(seg)] += seg * env[:, None]
    # loudness: peak-safe normalise toward about -14 LUFS (approx. via RMS of speech)
    rms = np.sqrt(np.mean(out ** 2) + 1e-12)
    out *= min(10 ** (-17 / 20) / rms, 0.95 / (np.abs(out).max() + 1e-9))
    out = np.tanh(out * 1.1) / np.tanh(1.1)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le',
                          out_wav], stdin=subprocess.PIPE)
    p.stdin.write(out[:int(total * SR)].astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    # broadcast loudness: two-pass EBU R128 to YouTube's -14 LUFS, -1.5 dBTP
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', out_wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
          f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    tmp = out_wav + '.ln.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out_wav, '-af', ln, '-ar', str(SR), '-c:a', 'pcm_s24le', tmp], check=True)
    os.replace(tmp, out_wav)


def main():
    vo_path = os.path.join(FF, arg('--vo', 'out/vo/vo_george_v4_v01'))
    out = os.path.join(FF, arg('--out', 'out/FALSE_FLOOR_E02_v01.mp4'))
    preview = bool(arg('--preview'))
    if preview:
        set_size(960, 540)
    shots = json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']
    vo = json.load(open(vo_path + '.json'))
    tl, total = build_timeline(shots, vo)
    tl[0]['fade_in'] = 18
    tl[-1]['fade_out'] = 30
    end_src = [os.path.join(FF, 'out', 'clips', 'END.mkv'), os.path.join(FF, 'out', 'renders', 'END')]
    if not arg('--no-end') and any(os.path.exists(p) for p in end_src):
        # 15 s end card (lockup, next-case line, end-screen tile zones); music runs on under it
        tl.append({'id': 'END', 'kind': 'MG', 'src_kind': 'MG', 'shot': 'end card', 't0': total, 'dur': 15.0, 'vo_at': None,
                   'vo_src': None, 'chapter': tl[-1]['chapter'], 'fade_in': 12, 'fade_out': 18})
        total += 15.0
    only = arg('--only')
    work = os.path.join(FF, 'out', 'edit_segments')
    os.makedirs(work, exist_ok=True)
    jobs = [(e, os.path.join(work, f"{e['id']}.mp4"), preview) for e in tl if not only or e['id'] in only.split(',')]
    print(f'[edit] timeline {int(total // 60)}:{total % 60:04.1f}, {len(tl)} shots, rendering {len(jobs)} segments', flush=True)
    with ProcessPoolExecutor(int(arg('--workers', 4))) as ex:
        for sid, n, mode in ex.map(render_segment, jobs):
            print(f'[edit] {sid} {n}f {mode}', flush=True)
    json.dump({'total': total, 'timeline': [{k: e.get(k) for k in ('id', 't0', 'dur', 'kind', 'chapter', 'vo_at', 'vo_src')} for e in tl]},
              open(os.path.join(FF, 'out', 'timeline.json'), 'w'), indent=1)
    lst = os.path.join(work, 'list.txt')
    segs = [os.path.join(work, e['id'] + '.mp4') for e in tl]
    if only:
        segs = [p for p in segs if os.path.basename(p)[:-4] in only.split(',')]
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in segs if os.path.exists(p)))
    pic = os.path.join(work, 'picture.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', pic], check=True)
    wav = os.path.join(FF, 'out', 'mix.wav')
    music = arg('--music')
    mix(tl, total, vo_path, wav, music=os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'music', music + '.wav') if music else None,
        music_gain=float(arg('--music-gain', -22)), music_offset=float(arg('--music-offset', 0)))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pic, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac',
                    '-b:a', '256k', '-shortest', '-movflags', '+faststart', out], check=True)
    print(f'[edit] wrote {out}  {int(total // 60)}:{total % 60:04.1f}', flush=True)


if __name__ == '__main__':
    main()
