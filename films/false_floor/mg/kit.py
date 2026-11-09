"""FALSE FLOOR motion-graphics kit (numpy + Pillow). Shared by every MG shot and overlay so they read as one system.

Pipeline per frame (see Shot.render):
  background (concrete-textured charcoal, or panels / revealed orange interior, computed in output space with exact
  edge coverage) -> soft layer (single colour + alpha map in layout space, e.g. sensor cones) -> crisp layout layer
  (type, rules, line drawings) drawn at 3x into a premultiplied RGBA canvas and downsampled ONCE with Lanczos, the
  slow camera push folded into that one resample -> screen layer (corner labels, no push) -> fine luma grain -> PNG.

Type builds per letter or per word: eased fade + small upward slide that settles (8-14 frames, staggered).
Brand: charcoal #111719, cream #ECE8DF, concrete #B7BAB8, orange #E4442E (orange only for a newly exposed connection).
Barlow Condensed (DIN Condensed stand-in), 100 px margins, 1920x1080 @ 24 fps.
"""
import json
import math
import os
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS, S, M = 1920, 1080, 24, 3, 100
C = {'charcoal': (17, 23, 25), 'cream': (236, 232, 223), 'concrete': (183, 186, 184), 'orange': (228, 68, 46),
     'ink': (17, 23, 25), 'stone': (110, 114, 113)}
LABEL_Y = H - 52           # baseline of the persistent corner labels (matches tools/brand_frame.py)
CASE = 'FALSE FLOOR · CASE No. 02'


def col(c):
    return C[c] if isinstance(c, str) else tuple(c)


def colf(c):
    return np.array(col(c), np.float32) / 255.0


# ----------------------------------------------------------------------------- easing

def clamp01(x):
    return 0.0 if x <= 0 else 1.0 if x >= 1 else float(x)


def ease_out(x):          # cubic
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_out4(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 4


def ease_in_out(x):       # cubic
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_sine(x):
    x = clamp01(x)
    return -(math.cos(math.pi * x) - 1) / 2


def ramp(f, f0, dur):
    if dur <= 0:
        return 1.0 if f >= f0 else 0.0
    return clamp01((f - f0) / dur)


def lerp(a, b, t):
    return a + (b - a) * t


# ----------------------------------------------------------------------------- script cues

_SHOTS = None


def shot_info(sid):
    global _SHOTS
    if _SHOTS is None:
        d = json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))
        _SHOTS = {s['id']: s for s in d['shots']}
    return _SHOTS[sid]


def cue(sid, phrase, lead=0):
    """Frame (0-based) where `phrase` is spoken in the temp VO, estimated by character position within the beat.
    Frame 0 of an MG shot = vo_start. `lead` pulls the cue earlier (type should land just before the word)."""
    s = shot_info(sid)
    vo = s['vo']
    i = vo.find(phrase)
    if i < 0:
        raise KeyError(f'{sid}: "{phrase}" not in VO')
    dur = s['vo_end'] - s['vo_start']
    return int(round(i / len(vo) * dur * FPS)) - lead


# ----------------------------------------------------------------------------- fonts / glyphs (3x)

@lru_cache(None)
def font(weight, px3):
    return ImageFont.truetype(os.path.join(FF, 'fonts', f'BarlowCondensed-{weight}.ttf'), px3)


@lru_cache(None)
def glyph(weight, px3, ch):
    """(mask 'L' or None, off_x, off_y, advance) at 3x; offsets relative to the pen on the baseline."""
    f = font(weight, px3)
    adv = f.getlength(ch)
    if ch.isspace():
        return None, 0, 0, adv
    l, t, r, b = f.getbbox(ch, anchor='ls')
    im = Image.new('L', (r - l + 4, b - t + 4), 0)
    ImageDraw.Draw(im).text((-l + 2, -t + 2), ch, font=f, fill=255, anchor='ls')
    return im, l - 2, t - 2, adv


def text_width(s, weight, px, track=0):
    px3 = int(round(px * S))
    w = sum(glyph(weight, px3, ch)[3] + track * S for ch in s) - (track * S if s else 0)
    return w / S


_LUT = {}


def _alpha_mask(mask, a):
    if a >= 0.998:
        return mask
    k = int(a * 255 + 0.5)
    lut = _LUT.get(k)
    if lut is None:
        lut = _LUT[k] = [int(v * k / 255 + 0.5) for v in range(256)]
    return mask.point(lut)


# ----------------------------------------------------------------------------- 3x premultiplied canvas

class Layer:
    """Premultiplied canvas at 3x (RGB colour band + L alpha band). Every primitive is an 'L' coverage mask pasted with a
    solid colour: a plain linear blend per band, which on premultiplied data is exactly the 'over' operator."""

    def __init__(self):
        # premultiplied colour and alpha kept as separate bands: Pillow treats RGBA paste/resize as straight alpha
        self.rgb = Image.new('RGB', (W * S, H * S), (0, 0, 0))
        self.al = Image.new('L', (W * S, H * S), 0)
        self.bb = None

    def _grow(self, x0, y0, x1, y1):
        if self.bb is None:
            self.bb = [x0, y0, x1, y1]
        else:
            b = self.bb
            b[0], b[1], b[2], b[3] = min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1)

    def paste(self, mask, x3, y3, color, a=1.0):
        if a <= 0.004 or mask is None:
            return
        x3, y3 = int(x3), int(y3)
        mw, mh = mask.size
        cx0, cy0 = max(0, x3), max(0, y3)
        cx1, cy1 = min(W * S, x3 + mw), min(H * S, y3 + mh)
        if cx1 <= cx0 or cy1 <= cy0:
            return
        if (cx0, cy0, cx1, cy1) != (x3, y3, x3 + mw, y3 + mh):
            mask = mask.crop((cx0 - x3, cy0 - y3, cx1 - x3, cy1 - y3))
        mask = _alpha_mask(mask, a)
        box = (cx0, cy0, cx1, cy1)
        self.rgb.paste(col(color), box, mask)
        self.al.paste(255, box, mask)
        self._grow(cx0, cy0, cx1, cy1)

    def group(self, fn, color, a=1.0, bbox=None):
        """fn(draw, P) draws white shapes on a coverage mask; P(x, y) maps 1x layout coords to mask coords."""
        if a <= 0.004:
            return
        if bbox is None:
            ox, oy, mw, mh = 0, 0, W * S, H * S
        else:
            x0, y0, x1, y1 = bbox
            ox, oy = int(math.floor(x0 * S)) - 6, int(math.floor(y0 * S)) - 6
            mw, mh = int(math.ceil(x1 * S)) + 6 - ox, int(math.ceil(y1 * S)) + 6 - oy
        m = Image.new('L', (mw, mh), 0)
        fn(ImageDraw.Draw(m), lambda x, y: (x * S - ox, y * S - oy))
        bb = m.getbbox()
        if not bb:
            return
        self.paste(m.crop(bb), ox + bb[0], oy + bb[1], color, a)

    # primitives (1x layout coordinates, widths in 1x px)
    def line(self, p0, p1, w, color, a=1.0, prog=1.0):
        prog = clamp01(prog)
        if prog <= 0:
            return
        p1 = (lerp(p0[0], p1[0], prog), lerp(p0[1], p1[1], prog))
        self.polyline([p0, p1], w, color, a)

    def polyline(self, pts, w, color, a=1.0, prog=1.0):
        pts = cut_path(pts, prog)
        if len(pts) < 2:
            return
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        bb = (min(xs) - w, min(ys) - w, max(xs) + w, max(ys) + w)
        ww = max(1, int(round(w * S)))
        self.group(lambda d, P: d.line([P(*p) for p in pts], fill=255, width=ww, joint='curve'), color, a, bb)

    def dashed(self, pts, w, color, a=1.0, dash=10, gap=8, prog=1.0):
        pts = cut_path(pts, prog)
        if len(pts) < 2:
            return
        segs = dash_path(pts, dash, gap)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        bb = (min(xs) - w, min(ys) - w, max(xs) + w, max(ys) + w)
        ww = max(1, int(round(w * S)))

        def fn(d, P):
            for s in segs:
                d.line([P(*p) for p in s], fill=255, width=ww)
        self.group(fn, color, a, bb)

    def poly(self, pts, color, a=1.0):
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        self.group(lambda d, P: d.polygon([P(*p) for p in pts], fill=255), color, a,
                   (min(xs), min(ys), max(xs), max(ys)))

    def rect(self, x0, y0, x1, y1, color, a=1.0):
        if x1 <= x0 or y1 <= y0:
            return
        self.group(lambda d, P: d.rectangle([P(x0, y0), P(x1, y1)], fill=255), color, a, (x0, y0, x1, y1))

    def outline(self, x0, y0, x1, y1, w, color, a=1.0, prog=1.0):
        """Rectangle outline drawn on clockwise from the top-left corner (prog 0..1)."""
        self.polyline([(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)], w, color, a, prog)

    def dot(self, cx, cy, r, color, a=1.0):
        self.group(lambda d, P: d.ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], fill=255), color, a,
                   (cx - r, cy - r, cx + r, cy + r))

    def ring(self, cx, cy, r, w, color, a=1.0):
        ww = max(1, int(round(w * S)))
        self.group(lambda d, P: d.ellipse([P(cx - r, cy - r), P(cx + r, cy + r)], outline=255, width=ww), color, a,
                   (cx - r - w, cy - r - w, cx + r + w, cy + r + w))

    def square(self, cx, cy, r, color, a=1.0):
        self.rect(cx - r, cy - r, cx + r, cy + r, color, a)

    def downsample(self, X0=0.0, Y0=0.0, s=1.0):
        """One Lanczos resample of the content bbox through the camera window -> (premult float RGBA, ox0, oy0)."""
        if self.bb is None:
            return None
        bx0, by0, bx1, by1 = self.bb
        ox0 = max(0, int(math.floor((bx0 / S - X0) * s)) - 3)
        oy0 = max(0, int(math.floor((by0 / S - Y0) * s)) - 3)
        ox1 = min(W, int(math.ceil((bx1 / S - X0) * s)) + 3)
        oy1 = min(H, int(math.ceil((by1 / S - Y0) * s)) + 3)
        if ox1 <= ox0 or oy1 <= oy0:
            return None
        box = (S * (X0 + ox0 / s), S * (Y0 + oy0 / s), S * (X0 + ox1 / s), S * (Y0 + oy1 / s))
        size = (ox1 - ox0, oy1 - oy0)
        rgb = np.asarray(self.rgb.resize(size, Image.LANCZOS, box=box)).astype(np.float32)
        al = np.asarray(self.al.resize(size, Image.LANCZOS, box=box)).astype(np.float32)
        out = np.concatenate([rgb, al[..., None]], -1) / 255.0
        out[..., :3] = np.minimum(out[..., :3], out[..., 3:4])     # Lanczos ringing must not break premultiplication
        return out, ox0, oy0


def cut_path(pts, prog):
    prog = clamp01(prog)
    if prog >= 1:
        return list(pts)
    if prog <= 0:
        return []
    seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    L = sum(seg) * prog
    out = [pts[0]]
    for i, s in enumerate(seg):
        if L >= s:
            out.append(pts[i + 1])
            L -= s
        else:
            t = L / s if s > 0 else 0
            out.append((lerp(pts[i][0], pts[i + 1][0], t), lerp(pts[i][1], pts[i + 1][1], t)))
            break
    return out


def dash_path(pts, dash, gap):
    segs, cur, on, rem = [], [pts[0]], True, dash
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        L = math.dist(a, b)
        pos = 0.0
        while L - pos > 1e-6:
            step = min(rem, L - pos)
            pos += step
            t = pos / L
            p = (lerp(a[0], b[0], t), lerp(a[1], b[1], t))
            if on:
                cur.append(p)
            rem -= step
            if rem <= 1e-6:
                if on:
                    segs.append(cur)
                on = not on
                rem = dash if on else gap
                cur = [p]
    if on and len(cur) > 1:
        segs.append(cur)
    return segs


# ----------------------------------------------------------------------------- type that builds and settles

class Text:
    """One line of type. Units (letters or words) fade in with an eased small upward slide that settles.
    x, y: 1x layout coords of the anchor on the baseline. anchor 'l' | 'r' | 'c'."""

    def __init__(self, s, weight='Bold', px=60, x=M, y=500, color='cream', track=0.0, anchor='l', unit='letter',
                 start=0, dur=12, stagger=None, slide=None, a=1.0):
        self.s, self.weight, self.px, self.color, self.a = s, weight, px, color, a
        self.px3 = int(round(px * S))
        self.unit, self.start, self.dur = unit, start, dur
        self.stagger = stagger if stagger is not None else (2 if unit == 'letter' else 4)
        self.slide = slide if slide is not None else max(6.0, min(16.0, px * 0.12))
        items, pen, u, prev_space = [], 0.0, -1, True
        for ch in s:
            g = glyph(weight, self.px3, ch)
            if unit == 'letter':
                if not ch.isspace():
                    u += 1
            elif unit == 'word':
                if not ch.isspace() and prev_space:
                    u += 1
            else:          # 'line': everything at once
                u = 0
            prev_space = ch.isspace()
            if g[0] is not None:
                items.append((g, pen, max(u, 0)))
            pen += g[3] + track * S
        self.width3 = pen - (track * S if s else 0)
        self.width = self.width3 / S
        self.nunits = max(u + 1, 1)
        x3 = x * S
        if anchor == 'r':
            x3 -= self.width3
        elif anchor == 'c':
            x3 -= self.width3 / 2
        self.x3, self.y3 = x3, y * S
        self.x, self.y = x3 / S, y
        self.items = items

    @property
    def end(self):
        return self.start + (self.nunits - 1) * self.stagger + self.dur

    def unit_progress(self, f, u):
        return ramp(f, self.start + u * self.stagger, self.dur)

    def draw(self, L, f, a=1.0, dx=0.0, dy=0.0, color=None, out=None):
        """out=(f0, dur): fade out (and lift slightly) from f0."""
        a *= self.a
        if out is not None:
            po = ramp(f, out[0], out[1])
            a *= 1 - ease_in_out(po)
            dy -= 6 * ease_in_out(po)
        if a <= 0.004:
            return
        c = color or self.color
        for (g, pen, u) in self.items:
            p = ramp(f, self.start + u * self.stagger, self.dur)
            if p <= 0:
                continue
            ga = ease_out(p) if p < 1 else 1.0
            ys = self.slide * (1 - ease_out4(p))
            m, ox, oy, _ = g
            L.paste(m, round(self.x3 + pen + ox + dx * S), round(self.y3 + oy + (ys + dy) * S), c, a * ga)


class Para:
    """Wrapped block of type built word by word, line after line. y = baseline of the first line."""

    def __init__(self, s, weight='Bold', px=48, x=M, y=500, maxw=800, leading=1.12, color='cream', track=0.0,
                 start=0, dur=12, stagger=3, slide=None, unit='word', anchor='l', a=1.0):
        words, lines, cur = s.split(' '), [], ''
        for wd in words:
            t = (cur + ' ' + wd) if cur else wd
            if cur and text_width(t, weight, px, track) > maxw:
                lines.append(cur)
                cur = wd
            else:
                cur = t
        if cur:
            lines.append(cur)
        self.lines, self.texts, n = lines, [], 0
        for i, ln in enumerate(lines):
            t = Text(ln, weight, px, x, y + i * px * leading, color, track, anchor, unit, start + n * stagger, dur,
                     stagger, slide, a)
            self.texts.append(t)
            n += t.nunits
        self.height = (len(lines) - 1) * px * leading
        self.y_last = y + self.height
        self.width = max(t.width for t in self.texts)

    @property
    def end(self):
        return max(t.end for t in self.texts)

    def draw(self, L, f, **kw):
        for t in self.texts:
            t.draw(L, f, **kw)


# ----------------------------------------------------------------------------- background texture, camera, compositing

def _vnoise(rng, gw, gh, w, h):
    small = rng.random((gh, gw)).astype(np.float32)
    return np.asarray(Image.fromarray(small, 'F').resize((w, h), Image.BICUBIC))


@lru_cache(None)
def concrete_tex(seed=11):
    """Zero-mean concrete mottling (float32 HxW, roughly -1..1) + sparse pores, layout space, cached per process."""
    rng = np.random.default_rng(seed)
    m = (0.50 * _vnoise(rng, 5, 3, W, H) + 0.30 * _vnoise(rng, 20, 12, W, H) + 0.20 * _vnoise(rng, 80, 45, W, H)
         + 0.12 * _vnoise(rng, 320, 180, W, H))
    fine = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    fine = np.asarray(Image.fromarray(fine, 'F').resize((W, H), Image.BILINEAR))
    m = m + 0.08 * fine
    m = (m - m.mean()) / (m.std() + 1e-6)
    pores = (rng.random((H, W)) > 0.99965).astype(np.float32)
    pores = np.asarray(Image.fromarray(pores * 255).convert('L').resize((W // 2, H // 2), Image.BILINEAR)
                       .resize((W, H), Image.BICUBIC)).astype(np.float32) / 255.0
    m = m - 2.5 * pores
    return np.clip(m, -3, 3).astype(np.float32)


@lru_cache(None)
def light_field(kind='key'):
    """Soft, motivated light on the wall: brighter upper-left, falling off to the edges (layout space)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = xx / W, yy / H
    key = np.exp(-(((u - 0.34) / 0.62) ** 2 + ((v - 0.30) / 0.75) ** 2))
    vig = np.clip(((u - 0.5) * 2) ** 2 * 0.55 + ((v - 0.5) * 2) ** 2 * 0.45 - 0.15, 0, 1)
    return (key - 0.45 * vig).astype(np.float32)


def resample(arr, X0, Y0, s, resample=Image.BILINEAR):
    """Layout-space float map -> output space through the camera window."""
    box = (X0, Y0, X0 + W / s, Y0 + H / s)
    return np.asarray(Image.fromarray(arr, 'F').resize((W, H), resample, box=box))


def cover_1d(n, a, b):
    i = np.arange(n, dtype=np.float32)
    return np.clip(np.minimum(i + 1, b) - np.maximum(i, a), 0, 1)


def rect_cover(x0, y0, x1, y1):
    """Exact anti-aliased coverage (HxW) of an axis-aligned rectangle given in OUTPUT pixel coords."""
    return cover_1d(H, y0, y1)[:, None] * cover_1d(W, x0, x1)[None, :]


class Cam:
    """Very slow push (<=3 %): background pushes a little more than the layout (gentle parallax)."""

    def __init__(self, n, push=0.008, bg_push=0.028, center=(W * 0.5, H * 0.5)):
        self.n, self.push, self.bg_push, self.center = n, push, bg_push, center

    def t(self, f):
        x = f / max(1, self.n - 1)
        return 0.5 * x + 0.5 * ease_sine(x)

    def win(self, f, bg=False):
        s = 1 + (self.bg_push if bg else self.push) * self.t(f)
        cx, cy = self.center
        return cx - cx / s, cy - cy / s, s

    @staticmethod
    def to_out(win, x, y):
        X0, Y0, s = win
        return (x - X0) * s, (y - Y0) * s


def charcoal_bg(f, cam, tint='charcoal', amp=0.011, light=0.018):
    X0, Y0, s = cam.win(f, bg=True)
    tex = resample(concrete_tex(), X0, Y0, s)
    lf = resample(light_field(), X0, Y0, s)
    base = colf(tint)
    d = tex * amp + lf * light
    return np.clip(base[None, None, :] + d[..., None] * np.array([0.92, 1.0, 1.02], np.float32), 0, 1)


def over(dst, src_premult, ox=0, oy=0):
    """dst (HxWx3) <- src (premult RGBA float) over dst, at offset."""
    h, w = src_premult.shape[:2]
    reg = dst[oy:oy + h, ox:ox + w]
    reg *= (1 - src_premult[..., 3:4])
    reg += src_premult[..., :3]


def over_rgba(dst, src_premult, ox=0, oy=0):
    """premult RGBA over premult RGBA."""
    h, w = src_premult.shape[:2]
    reg = dst[oy:oy + h, ox:ox + w]
    reg *= (1 - src_premult[..., 3:4])
    reg += src_premult


def grain(img, f, seed=0, sigma=0.0062):
    rng = np.random.default_rng(seed * 100003 + f)
    g = rng.standard_normal((H, W), dtype=np.float32)
    Y = img @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    amp = sigma * (0.45 + 0.55 * np.sqrt(np.clip(Y, 0, 1)))
    img += (g * amp)[..., None]
    return img


def to_u8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def corner_labels(L, left=None, right=CASE, color='concrete', a=1.0, color_right=None):
    if left:
        Text(left, 'Medium', 22, M, LABEL_Y, color, 3, 'l', 'line').draw(L, 10 ** 6, a=a)
    if right:
        Text(right, 'Medium', 22, W - M, LABEL_Y, color_right or color, 3, 'r', 'line').draw(L, 10 ** 6, a=a)


# ----------------------------------------------------------------------------- shot base

class Shot:
    """Subclass: set self.n, implement layout(L, f) (camera layer), optionally screen(L, f) (no camera, e.g. labels),
    background(f) (HxWx3 float, output space) and soft(f) -> (colour, alpha HxW layout space) or list of them."""
    seed = 1
    label_left = None
    label_right = CASE
    label_color = 'concrete'
    static_screen = True
    rgba = False
    grain_sigma = 0.0062

    def __init__(self, n):
        self.n = n
        self.cam = Cam(n)
        self._screen_cache = None

    def files(self):
        return [(f'{f + 1:04d}.png', f) for f in range(self.n)]

    def background(self, f):
        return charcoal_bg(f, self.cam)

    def soft(self, f):
        return None

    def layout(self, L, f):
        pass

    def screen(self, L, f):
        corner_labels(L, self.label_left, self.label_right, self.label_color)

    def _screen(self, f):
        if self.static_screen and self._screen_cache is not None:
            return self._screen_cache
        L = Layer()
        self.screen(L, 10 ** 6 if self.static_screen else f)   # a cached screen layer must be the settled state
        r = L.downsample()
        if self.static_screen:
            self._screen_cache = r
        return r

    def render(self, f):
        win = self.cam.win(f)
        if self.rgba:
            img = np.zeros((H, W, 4), np.float32)
            L = Layer()
            self.layout(L, f)
            r = L.downsample(*win)
            if r is not None:
                over_rgba(img, r[0], r[1], r[2])
            r = self._screen(f)
            if r is not None:
                over_rgba(img, r[0], r[1], r[2])
            a = img[..., 3:4]
            rgb = np.where(a > 1e-4, img[..., :3] / np.maximum(a, 1e-4), 0)
            return np.concatenate([to_u8(rgb), to_u8(a)], -1)
        img = self.background(f).astype(np.float32)
        sl = self.soft(f)
        if sl is not None:
            for colr, alpha in (sl if isinstance(sl, list) else [sl]):
                al = np.clip(resample(alpha, *win), 0, 1)[..., None]
                img = img * (1 - al) + colf(colr)[None, None, :] * al
        L = Layer()
        self.layout(L, f)
        r = L.downsample(*win)
        if r is not None:
            over(img, r[0], r[1], r[2])
        r = self._screen(f)
        if r is not None:
            over(img, r[0], r[1], r[2])
        if self.grain_sigma > 0:
            img = grain(img, f, self.seed, self.grain_sigma)
        return to_u8(img)
