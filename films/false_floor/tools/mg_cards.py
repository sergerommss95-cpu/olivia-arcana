#!/usr/bin/env python3
"""False Floor v3 — typographic / data motion graphics (M_* cards), all on the shared mglib look.

    python3 tools/mg_cards.py M_RULE              # one clip -> out/clips/M_RULE.mkv (+ manifest entry)
    python3 tools/mg_cards.py M_MAZAL M_RULE      # several
    python3 tools/mg_cards.py all                 # every clip in list order
    python3 tools/mg_cards.py M_RULE --stills 0.5,2,3.5   # PNG stills at those seconds to the scratch dir instead

Words on screen quote the George v4 narration (out/vo/vo_george_v4_v01.json) and script/FACTS.md.
Every clip: a two/three-plane camera (slow eased push + drift, parallax between the backdrop and the type),
elements building on over 6-12 frames, mglib grain + vignette. Cast portraits come from assets/portraits/
(rendered by shots/portraits_v3.py) and always carry the DRAMATIZATION tag.
"""
import sys, os, math, json, functools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import mglib as G

FPS, SS, W, H, W2, H2 = G.FPS, G.SS, G.W, G.H, G.W2, G.H2
CX, CY = W2 / 2, H2 / 2
MARGIN = 200                      # 100 px safe margin at 1x
INK, DIM, AMBER, RED, GRID, BG, BG2 = G.INK, G.DIM, G.AMBER, G.RED, G.GRID, G.BG, G.BG2
FAINT = (78, 82, 90)              # hairlines, inactive marks
PORTRAITS = os.path.join(G.FF, 'assets', 'portraits')
MANIFEST = os.path.join(G.CLIPS, 'manifest_mg_cards.json')
HANDLES = 12


# ============================================================================ timing helpers

def p_in(sec, t0, dur=0.4):
    """build-on progress 0..1 (ease-out cubic) starting at t0 seconds over dur (0.4 s = ~10 frames)."""
    return G.ease_out((sec - t0) / dur)


def p_io(sec, t0, dur):
    return G.ease((sec - t0) / dur)


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(int(round(lerp(a, b, t))) for a, b in zip(c1, c2))


# ============================================================================ drawing primitives (tile based: fast)

def composite(im, tile, x, y):
    """alpha-composite a tile at integer (x, y), cropping anything outside the canvas."""
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(im.width, x + tile.width), min(im.height, y + tile.height)
    if x1 <= x0 or y1 <= y0:
        return
    if (x0, y0, x1, y1) != (x, y, x + tile.width, y + tile.height):
        tile = tile.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    im.alpha_composite(tile, (x0, y0))


def fade(tile, alpha):
    if alpha >= 0.999:
        return tile
    t = tile.copy()
    a = t.getchannel('A').point(lambda v: int(v * max(0.0, alpha)))
    t.putalpha(a)
    return t


@functools.lru_cache(maxsize=512)
def _text_tile(s, size, weight, display, tracking, color):
    f = G.font(size, weight, display)
    asc, desc = f.getmetrics()
    if tracking:
        xs = [f.getlength(s[:i]) + i * tracking * size for i in range(len(s))]
        w = (xs[-1] + f.getlength(s[-1])) if s else 0
    else:
        xs, w = None, f.getlength(s)
    pad = int(size * 0.3) + 6
    tile = Image.new('RGBA', (int(w + 2 * pad) + 1, int(asc + desc + 2 * pad) + 1), tuple(color) + (0,))
    d = ImageDraw.Draw(tile)
    if xs:
        for c, x in zip(s, xs):
            d.text((pad + x, pad + asc), c, font=f, fill=tuple(color) + (255,), anchor='ls')
    else:
        d.text((pad, pad + asc), s, font=f, fill=tuple(color) + (255,), anchor='ls')
    return tile, pad, w, asc, desc


def tsize(s, size=64, weight='SemiBold', display=True, tracking=0.0):
    """(width, ascent, descent) of a string in 2x px."""
    _, _, w, a, d = _text_tile(s, size, weight, display, tracking, INK)
    return w, a, d


def text(im, s, xy, size=64, weight='SemiBold', color=INK, alpha=1.0, anchor='ls', display=True, tracking=0.0,
         blur=0.0, dx=0.0, dy=0.0, wipe=1.0):
    """Text at 2x coords. anchor: [l|m|r][a|m|s|d] (ascender top / middle / baseline / descender).
    wipe < 1 reveals the string left to right."""
    if alpha <= 0.003 or not s:
        return
    tile, pad, w, asc, desc = _text_tile(s, size, weight, display, tracking, tuple(color))
    x, y = xy
    x -= {'l': 0, 'm': w / 2, 'r': w}[anchor[0]]
    base = y + {'a': asc, 'm': (asc - desc) / 2, 's': 0, 'd': -desc}[anchor[1]]
    if wipe < 1.0:
        cw = int(pad + w * max(0.0, wipe))
        if cw <= pad:
            return
        tile = tile.crop((0, 0, cw, tile.height))
    if blur > 0.3:
        b = int(blur * 3) + 2
        t2 = Image.new('RGBA', (tile.width + 2 * b, tile.height + 2 * b), tuple(color) + (0,))
        t2.paste(tile, (b, b))
        tile = t2.filter(ImageFilter.GaussianBlur(blur))
        pad += b
    composite(im, fade(tile, alpha), x - pad + dx, base - asc - pad + dy)


def label(im, s, xy, size=34, color=DIM, alpha=1.0, anchor='ls', tracking=0.08, weight='Medium', **kw):
    """small tracked caps label (Inter text cut)."""
    text(im, s.upper(), xy, size=size, weight=weight, color=color, alpha=alpha, anchor=anchor, display=False,
         tracking=tracking, **kw)


def build_text(im, s, xy, sec, t0, dur=0.42, rise=0.22, blur=6.0, alpha=1.0, **kw):
    """the house build-on: fade + rise + focus pull, over ~10 frames."""
    p = p_in(sec, t0, dur)
    if p <= 0:
        return p
    size = kw.get('size', 64)
    text(im, s, xy, alpha=alpha * p, dy=(1 - p) * size * rise, blur=(1 - p) * blur, **kw)
    return p


def build_label(im, s, xy, sec, t0, dur=0.4, alpha=1.0, **kw):
    p = p_in(sec, t0, dur)
    if p <= 0:
        return p
    label(im, s, xy, alpha=alpha * p, dy=(1 - p) * 10, blur=(1 - p) * 3, **kw)
    return p


def draw(im, box, fn, alpha=1.0, blur=0.0, ss=2, glow=0.0, glow_alpha=0.6):
    """Draw vector shapes on a small supersampled tile. fn(d, X) gets an ImageDraw on the tile and X(x, y)->tile
    coords (scaled) plus S = the extra supersample factor (multiply widths/radii by S). box in 2x canvas coords."""
    if alpha <= 0.003:
        return
    pad = int(6 + blur * 3 + glow * 3)
    x0, y0, x1, y1 = [int(v) for v in (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)]
    tw, th = max(1, x1 - x0), max(1, y1 - y0)
    tile = Image.new('RGBA', (tw * ss, th * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)

    def X(x, y):
        return ((x - x0) * ss, (y - y0) * ss)
    fn(d, X, ss)
    if ss > 1:
        tile = tile.resize((tw, th), Image.LANCZOS)
    if blur > 0.3:
        tile = tile.filter(ImageFilter.GaussianBlur(blur))
    if glow > 0:
        g = tile.filter(ImageFilter.GaussianBlur(glow))
        composite(im, fade(g, alpha * glow_alpha), x0, y0)
    composite(im, fade(tile, alpha), x0, y0)


def rgba(c, a=1.0):
    return tuple(int(v) for v in c) + (int(255 * max(0.0, min(1.0, a))),)


def hline(im, x0, x1, y, color=FAINT, width=3, alpha=1.0, p=1.0, glow=0.0):
    """horizontal rule drawn on from x0 toward x1 by p."""
    if p <= 0:
        return
    xe = lerp(x0, x1, p)
    a, b = min(x0, xe), max(x0, xe)
    draw(im, (a, y - width, b, y + width),
         lambda d, X, S: d.rectangle([X(a, y - width / 2), X(b, y + width / 2)], fill=rgba(color)), alpha=alpha,
         glow=glow, ss=1)


def vline(im, x, y0, y1, color=FAINT, width=3, alpha=1.0, p=1.0, glow=0.0):
    if p <= 0:
        return
    ye = lerp(y0, y1, p)
    a, b = min(y0, ye), max(y0, ye)
    draw(im, (x - width, a, x + width, b),
         lambda d, X, S: d.rectangle([X(x - width / 2, a), X(x + width / 2, b)], fill=rgba(color)), alpha=alpha,
         glow=glow, ss=1)


def polyline(im, pts, color=AMBER, width=4, alpha=1.0, p=1.0, glow=0.0, dots=False):
    if p <= 0 or len(pts) < 2:
        return
    q = G.partial_polyline(pts, p)
    if len(q) < 2:
        return
    xs, ys = [a for a, _ in q], [b for _, b in q]
    box = (min(xs) - width * 2, min(ys) - width * 2, max(xs) + width * 2, max(ys) + width * 2)

    def fn(d, X, S):
        d.line([X(*a) for a in q], fill=rgba(color), width=int(width * S), joint='curve')
        r = width * S / 2
        for a in (q[0], q[-1]):
            c = X(*a)
            d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=rgba(color))
    draw(im, box, fn, alpha=alpha, glow=glow)


def dashed(im, a, b, color=AMBER, width=4, dash=18, gap=14, alpha=1.0, p=1.0, glow=0.0, phase=0.0):
    """dashed straight line from a toward b, drawn on by p; phase (px) animates the dashes."""
    if p <= 0:
        return
    ax, ay = a
    bx, by = b
    L = math.hypot(bx - ax, by - ay) * p
    ux, uy = (bx - ax) / max(1e-6, math.hypot(bx - ax, by - ay)), (by - ay) / max(1e-6, math.hypot(bx - ax, by - ay))
    ex, ey = ax + ux * L, ay + uy * L
    box = (min(ax, ex) - width * 2, min(ay, ey) - width * 2, max(ax, ex) + width * 2, max(ay, ey) + width * 2)

    def fn(d, X, S):
        s = -(phase % (dash + gap))
        while s < L:
            s0, s1 = max(0.0, s), min(L, s + dash)
            if s1 > s0:
                d.line([X(ax + ux * s0, ay + uy * s0), X(ax + ux * s1, ay + uy * s1)], fill=rgba(color), width=int(width * S))
            s += dash + gap
    draw(im, box, fn, alpha=alpha, glow=glow)


def rect(im, box, fill=None, outline=None, width=3, radius=0, alpha=1.0, glow=0.0, blur=0.0):
    def fn(d, X, S):
        d.rounded_rectangle([X(box[0], box[1]), X(box[2], box[3])], radius=radius * S,
                            fill=rgba(fill) if fill else None, outline=rgba(outline) if outline else None,
                            width=int(width * S) if outline else 0)
    draw(im, box, fn, alpha=alpha, glow=glow, blur=blur)


def circle(im, c, r, fill=None, outline=None, width=3, alpha=1.0, glow=0.0, blur=0.0, glow_alpha=0.6):
    box = (c[0] - r, c[1] - r, c[0] + r, c[1] + r)

    def fn(d, X, S):
        d.ellipse([X(box[0], box[1]), X(box[2], box[3])], fill=rgba(fill) if fill else None,
                  outline=rgba(outline) if outline else None, width=int(width * S) if outline else 0)
    draw(im, box, fn, alpha=alpha, glow=glow, blur=blur, glow_alpha=glow_alpha)


def poly(im, pts, fill=None, outline=None, width=3, alpha=1.0, glow=0.0, blur=0.0):
    xs, ys = [a for a, _ in pts], [b for _, b in pts]

    def fn(d, X, S):
        q = [X(*a) for a in pts]
        if fill:
            d.polygon(q, fill=rgba(fill))
        if outline:
            d.line(q + [q[0]], fill=rgba(outline), width=int(width * S), joint='curve')
    draw(im, (min(xs), min(ys), max(xs), max(ys)), fn, alpha=alpha, glow=glow, blur=blur)


def check(im, c, s, color=AMBER, width=6, p=1.0, alpha=1.0, glow=0.0):
    """a drawn tick mark (two strokes) of size s centred at c, drawn on by p."""
    pts = [(c[0] - s * 0.5, c[1] + s * 0.02), (c[0] - s * 0.15, c[1] + s * 0.36), (c[0] + s * 0.5, c[1] - s * 0.38)]
    polyline(im, pts, color=color, width=width, p=p, alpha=alpha, glow=glow)


def glow_spot(im, c, r, color=AMBER, alpha=0.2):
    """soft light pool of radius ~r (cheap: drawn small, blurred, scaled up; tile is large enough that the blur
    never reaches its edge)."""
    if alpha <= 0.003:
        return
    k = 8
    core = max(8, int(2 * r / k))
    sz = int(core * 2.2)
    o = (sz - core) // 2
    t = Image.new('RGBA', (sz, sz), tuple(color) + (0,))
    d = ImageDraw.Draw(t)
    d.ellipse([o, o, o + core, o + core], fill=tuple(color) + (255,))
    t = t.filter(ImageFilter.GaussianBlur(core / 4.5)).resize((sz * k, sz * k), Image.BILINEAR)
    composite(im, fade(t, alpha), c[0] - sz * k / 2, c[1] - sz * k / 2)


def tag(im, s, sec, t0=0.15, corner='tr'):
    """DRAMATIZATION / RECONSTRUCTION corner tag: tracked label in a hairline box."""
    p = p_in(sec, t0, 0.5)
    if p <= 0:
        return
    size = 26
    w, a, dsc = tsize(s, size, 'Medium', False, 0.14)
    bw, bh = w + 44, a + 34
    x1 = W2 - MARGIN if corner[1] == 'r' else MARGIN + bw
    y0 = MARGIN - 40 if corner[0] == 't' else H2 - MARGIN - bh + 40
    rect(im, (x1 - bw, y0, x1, y0 + bh), outline=DIM, width=2, alpha=0.55 * p)
    text(im, s, (x1 - bw / 2, y0 + bh / 2), size=size, weight='Medium', display=False, tracking=0.14, color=DIM,
         alpha=0.85 * p, anchor='mm')


# ============================================================================ backdrop, camera, render loop

@functools.lru_cache(maxsize=8)
def backdrop(grid=True, glow=(0.5, 0.45), warm=0.22, seed=3, cell=160):
    """2x RGB backdrop: charcoal, a soft warm pool of light, a faint technical grid, low-frequency mottling."""
    rng = np.random.default_rng(seed)
    h, w = H2 // 8, W2 // 8
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx / w - glow[0]) / 0.75) ** 2 + ((yy / h - glow[1]) / 0.62) ** 2)
    pool = np.clip(1 - r, 0, 1) ** 1.8
    mott = Image.fromarray((rng.random((h // 6, w // 6)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    mott = np.asarray(mott.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0 - 0.5
    base = np.array(BG, np.float32)[None, None, :] * (1 + 0.08 * mott[..., None])
    base += pool[..., None] * np.array([34, 25, 15], np.float32) * warm / 0.22
    small = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    bg = small.resize((W2, H2), Image.BICUBIC).convert('RGBA')
    if grid:
        lay = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
        d = ImageDraw.Draw(lay)
        for x in range(int(CX % cell), W2, cell):
            d.line([(x, 0), (x, H2)], fill=GRID + (110,), width=2)
        for y in range(int(CY % cell), H2, cell):
            d.line([(0, y), (W2, y)], fill=GRID + (110,), width=2)
        # fade the grid toward the edges so it reads as a lit surface
        m = Image.fromarray((np.clip(1.15 - r * 1.1, 0, 1) * 255).astype(np.uint8)).resize((W2, H2), Image.BICUBIC)
        a = Image.fromarray((np.asarray(lay.getchannel('A')).astype(np.float32) * np.asarray(m) / 255).astype(np.uint8))
        lay.putalpha(a)
        bg.alpha_composite(lay)
    return bg.convert('RGB')


class Cam:
    """Fern-style move: zoom z0->z1 and drift (fractions of the frame) over the WHOLE rendered range (handles
    included), part-linear so it never parks. Plane depth d scales the move (parallax): backdrop ~0.45, type 1.0."""

    def __init__(self, z=(1.0, 1.06), pan=((0.0, 0.0), (0.0, 0.0)), lin=0.35):
        self.z, self.pan, self.lin = z, pan, lin

    def at(self, u, depth=1.0):
        e = self.lin * u + (1 - self.lin) * G.ease(u)
        z = 1 + (lerp(self.z[0], self.z[1], e) - 1) * depth
        px = lerp(self.pan[0][0], self.pan[1][0], e) * depth
        py = lerp(self.pan[0][1], self.pan[1][1], e) * depth
        cw, ch = W2 / z, H2 / z
        cx, cy = CX + px * W2, CY + py * H2
        # keep the crop inside the canvas
        cx = min(max(cx, cw / 2), W2 - cw / 2)
        cy = min(max(cy, ch / 2), H2 - ch / 2)
        return (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)


@functools.lru_cache(maxsize=4)
def _hud_tag(s_):
    """the corner tag drawn once at 2x, cropped and reduced to a 1x tile: (tile, x, y)."""
    big = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
    tag(big, s_, 99)
    bb = big.getchannel('A').getbbox()
    bb = (bb[0] - bb[0] % 2, bb[1] - bb[1] % 2, bb[2] + bb[2] % 2, bb[3] + bb[3] % 2)
    t = big.crop(bb)
    return t.resize((t.width // 2, t.height // 2), Image.LANCZOS), bb[0] // 2, bb[1] // 2


def render(cid, seconds, draw_fn, cam=None, bg=None, bg_depth=0.45, stills=None, mid_fn=None, mid_depth=0.75,
           finish_kw=None, tag_text=None, tag_t0=0.15):
    """draw_fn(fg, sec, u) draws the type plane (2x RGBA, transparent). mid_fn(sec, u) -> optional 2x RGBA plane
    between backdrop and type. Writes out/clips/<cid>.mkv, or PNG stills (seconds list) to the scratch dir."""
    if cid in CLIPS:                       # the clip registry is the source of truth for the length
        seconds = CLIPS[cid][1]
    cam = cam or Cam()
    bg = bg if bg is not None else backdrop()
    n = int(round(seconds * FPS))
    total = n + 2 * HANDLES

    def frame(i):
        sec = i / FPS
        u = (i + HANDLES) / (total - 1)
        out = bg.resize((W, H), Image.LANCZOS, box=cam.at(u, bg_depth)).convert('RGBA')
        if mid_fn is not None:
            mid = mid_fn(sec, u)
            if mid is not None:
                out.alpha_composite(mid.resize((W, H), Image.LANCZOS, box=cam.at(u, mid_depth)))
        fg = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
        draw_fn(fg, sec, u)
        out.alpha_composite(fg.resize((W, H), Image.LANCZOS, box=cam.at(u, 1.0)))
        if tag_text:                       # screen-fixed corner tag (not moved by the camera)
            t, tx, ty = _hud_tag(tag_text)
            pt = p_in(sec, tag_t0, 0.5)
            if pt > 0:
                composite(out, fade(t, pt), tx, ty)
        return out

    if stills:
        d = os.environ.get('MG_STILLS', '/tmp/mg_stills')
        os.makedirs(d, exist_ok=True)
        for s in stills:
            im = frame(int(round(s * FPS)))
            p = os.path.join(d, f'{cid}_{s:05.2f}.png')
            Image.fromarray(G.finish(im, **(finish_kw or {}))).save(p)
            print('[still]', p, flush=True)
        return
    # write to a scratch dir first and move into out/clips only when complete (no half-written clips on a crash)
    tmp = os.environ.get('MG_TMP', '/tmp/mg_cards_tmp')
    os.makedirs(tmp, exist_ok=True)
    with G.Clip(cid, seconds, handles=HANDLES, out_dir=tmp) as clip:
        for i, t in clip.frames():
            clip.add(frame(i), **(finish_kw or {}))
    if clip.p.returncode == 0:
        import shutil
        shutil.move(clip.path, os.path.join(G.CLIPS, f'{cid}.mkv'))
        print(f'[mg] -> {os.path.join(G.CLIPS, cid + ".mkv")}', flush=True)


# ============================================================================ portraits

@functools.lru_cache(maxsize=16)
def portrait(who, alpha=True):
    p = os.path.join(PORTRAITS, f'{who}_alpha.png' if alpha else f'{who}.png')
    return Image.open(p).convert('RGBA')


@functools.lru_cache(maxsize=32)
def portrait_card(who, w, h, ghost=False):
    """portrait cropped to w x h (2x px), head and shoulders, on the card's dark ground; ghost=True gives a flat
    grey silhouette (from the alpha) for M_GHOSTS."""
    src = portrait(who, True)
    sw, sh = src.size
    # crop: keep the top ~78 % (head to chest), centred a touch left of the face
    ar = w / h
    ch = sh * 0.80
    cw = ch * ar
    cx = sw * 0.47
    box = (cx - cw / 2, sh * 0.06, cx + cw / 2, sh * 0.06 + ch)
    im = src.resize((w, h), Image.LANCZOS, box=box)
    ground = Image.new('RGBA', (w, h), (20, 20, 23, 255))
    # warm falloff behind the head
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx / w - 0.45) / 0.8) ** 2 + ((yy / h - 0.3) / 0.7) ** 2)
    g = np.clip(1 - r, 0, 1) ** 2
    arr = np.asarray(ground).astype(np.float32)
    arr[..., 0] += 26 * g
    arr[..., 1] += 19 * g
    arr[..., 2] += 11 * g
    ground = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if ghost:
        a = im.getchannel('A')
        sil = Image.new('RGBA', (w, h), (58, 61, 66, 255))
        sil.putalpha(a)
        ground.alpha_composite(sil)
    else:
        ground.alpha_composite(im)
    return ground


def grade_grey(img, k):
    """desaturate + darken an RGBA tile by k (0..1)."""
    if k <= 0:
        return img
    a = np.asarray(img).astype(np.float32)
    lum = (a[..., :3] * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
    rgb = a[..., :3] * (1 - k) + lum * k
    rgb *= (1 - 0.35 * k)
    a[..., :3] = rgb
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


# ============================================================================ manifest

def manifest(cid, seconds, beat, note):
    d = {}
    if os.path.exists(MANIFEST):
        try:
            d = json.load(open(MANIFEST))
        except Exception:
            d = {}
    d[cid] = dict(dur_s=seconds, handles=HANDLES, beat=beat, note=note)
    order = list(CLIPS)
    d = {k: d[k] for k in sorted(d, key=lambda k: order.index(k) if k in order else 999)}
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    json.dump(d, open(MANIFEST, 'w'), indent=1, ensure_ascii=False)


CLIPS = {}


def clip(cid, seconds, beat, note):
    def deco(fn):
        CLIPS[cid] = (fn, seconds, beat, note)
        return fn
    return deco


# ============================================================================ the clips

# ---------------------------------------------------------------------------- Ch1-2

@clip('M_MAZAL', 2.6, 'S05', 'the word "mazal" set large, amber underline draws, label "the word that closes a deal" (VO S05)')
def m_mazal(stills=None):
    word, size = 'mazal', 520
    f = G.font(size, 'SemiBold', True)
    w = f.getlength(word)
    x0, base = CX - w / 2, CY + 90

    def fg(im, sec, u):
        for i, ch in enumerate(word):
            p = p_in(sec, 0.08 + 0.065 * i, 0.5)
            if p <= 0:
                continue
            text(im, ch, (x0 + f.getlength(word[:i]), base), size=size, weight='SemiBold', color=INK, alpha=p,
                 dy=(1 - p) * 90, blur=(1 - p) * 10)
        # the amber underline, drawn left to right, with a soft glow
        pu = p_io(sec, 0.62, 0.75)
        hline(im, x0 + 8, x0 + w - 8, base + 92, color=AMBER, width=7, p=pu, glow=10)
        build_label(im, 'the word that closes a deal', (CX, base + 250), sec, 1.05, size=44, anchor='ms', tracking=0.16)

    render('M_MAZAL', 2.6, fg, cam=Cam(z=(1.0, 1.075), pan=((0.0, 0.012), (0.0, -0.004))),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.3), stills=stills)


@clip('M_RULE', 6.7, 'S06', '"ONE RULE" 0.9 / "NO BOX DOWNSTAIRS" 1.7 (vault, Level -2) / "UNLESS YOU\'RE A TENANT UPSTAIRS" 3.7 (office), amber link vault->office; building section (VO S06)')
def m_rule(stills=None):
    # building section icon (2x coords), whole composition centred in frame
    bx0, bx1 = 640, 1340
    fl = 165                        # floor height
    yg = CY + 140                   # ground
    ytop = yg - 4 * fl
    ybot = yg + 2 * fl
    office = (bx0 + 70, yg - 3 * fl + 30, bx1 - 70, yg - 2 * fl - 18)
    vault = (bx0 + 70, yg + fl + 28, bx1 - 70, ybot - 26)
    tx = 1600
    shaft_x = (bx0 + bx1) / 2
    T_RULE, T_BOX, T_TEN = 0.9, 1.7, 3.7

    def fg(im, sec, u):
        # ground line + earth hatch
        hline(im, bx0 - 220, bx1 + 150, yg, color=DIM, width=4, p=p_io(sec, -0.45, 0.5), alpha=0.9)
        ph = p_in(sec, -0.2, 0.6)
        if ph > 0:
            def hatch(d, X, S):
                for k in range(-12, 30):
                    xa = bx0 - 220 + k * 34
                    d.line([X(xa, yg + 4), X(xa - (ybot + 40 - yg), ybot + 40)], fill=rgba(FAINT), width=int(2 * S))
                d.rectangle([X(bx0 - 4, yg + 4), X(bx1 + 4, ybot + 4)], fill=(0, 0, 0, 0))
                d.rectangle([X(bx0 - 400, ybot + 40), X(bx1 + 400, ybot + 400)], fill=(0, 0, 0, 0))
            draw(im, (bx0 - 220, yg, bx1 + 150, ybot + 40), hatch, alpha=0.32 * ph)
        pw = p_io(sec, -0.35, 0.6)
        for x in (bx0, bx1):
            vline(im, x, yg, ytop, color=DIM, width=4, p=pw)
            vline(im, x, yg, ybot, color=DIM, width=4, p=pw)
        hline(im, bx0, bx1, ytop, color=DIM, width=4, p=p_io(sec, 0.1, 0.3))
        hline(im, bx0, bx1, ybot, color=DIM, width=4, p=p_io(sec, 0.1, 0.3))
        for k in range(1, 4):
            hline(im, bx0, bx1, yg - k * fl, color=FAINT, width=3, p=p_io(sec, -0.1 + 0.07 * k, 0.35))
        hline(im, bx0, bx1, yg + fl, color=FAINT, width=3, p=p_io(sec, 0.0, 0.35))
        pwin = p_in(sec, 0.2, 0.5)
        for k in range(4):
            if k == 2:
                continue
            yy = yg - (k + 1) * fl + 52
            for j in (0, 1, 3, 4):
                xx = bx0 + 75 + j * 118
                rect(im, (xx, yy, xx + 74, yy + 62), outline=FAINT, width=2, alpha=0.8 * pwin)
        label(im, 'ground', (bx0 - 220, yg - 22), size=28, alpha=0.8 * p_in(sec, 0.1), tracking=0.14)
        label(im, 'level −1', (bx0 - 220, yg + fl / 2), size=28, alpha=0.8 * p_in(sec, 0.2), tracking=0.14, anchor='lm')
        label(im, 'level −2', (bx0 - 220, yg + 1.5 * fl), size=28, alpha=0.8 * p_in(sec, 0.3), tracking=0.14, anchor='lm')

        build_label(im, 'one rule', (tx, CY - 250), sec, T_RULE - 0.2, size=40, tracking=0.24, color=INK)
        hline(im, tx, tx + 160, CY - 210, color=AMBER, width=5, p=p_io(sec, T_RULE - 0.1, 0.4), glow=4)
        # 1) no box downstairs: the vault
        pv = p_in(sec, T_BOX - 0.25, 0.45)
        if pv > 0:
            rect(im, vault, fill=AMBER, alpha=0.10 * pv)
            rect(im, vault, outline=AMBER, width=4, alpha=pv, glow=8 * pv)
            gy0 = vault[1] + (vault[3] - vault[1]) / 2 - 38
            for r_ in range(2):
                for c_ in range(7):
                    q = p_in(sec, T_BOX - 0.1 + 0.03 * (c_ + r_ * 7), 0.3)
                    xx, yy = vault[2] - 30 - (7 - c_) * 40, gy0 + r_ * 40
                    rect(im, (xx, yy, xx + 32, yy + 32), outline=AMBER, width=2, alpha=0.75 * q)
            label(im, 'vault', (vault[0] + 22, vault[1] + 50), size=28, color=AMBER, alpha=pv, tracking=0.16)
        build_text(im, 'NO BOX DOWNSTAIRS', (tx, CY - 40), sec, T_BOX - 0.2, size=136, color=INK)
        # 2) unless you're a tenant upstairs: the office, linked up from the vault
        pl = p_io(sec, T_TEN - 0.55, 0.75)
        dashed(im, (shaft_x, vault[1]), (shaft_x, office[3]), color=AMBER, width=5, dash=20, gap=16, p=pl,
               phase=sec * 30, glow=6)
        if pl > 0:
            circle(im, (shaft_x, vault[1]), 9, fill=AMBER, alpha=min(1, pl * 4))
        po = p_in(sec, T_TEN - 0.2, 0.45)
        if po > 0:
            circle(im, (shaft_x, office[3]), 9, fill=AMBER, alpha=po)
            rect(im, office, fill=AMBER, alpha=0.10 * po)
            rect(im, office, outline=AMBER, width=4, alpha=po, glow=8 * po)
            label(im, 'office', (office[0] + 22, office[1] + 50), size=28, color=AMBER, alpha=po, tracking=0.16)
        rich(im, [('UNLESS YOU’RE A ', INK), ('TENANT UPSTAIRS', AMBER)], (tx, CY + 150), size=88, anchor='ls',
             sec=sec, t0=T_TEN - 0.25, stagger=0.12)

    render('M_RULE', 6.7, fg, cam=Cam(z=(1.02, 1.09), pan=((-0.012, 0.01), (0.008, -0.004))),
           bg=backdrop(grid=True, glow=(0.45, 0.5)), stills=stills)



@clip('M_NAME_TENANT', 3.5, 'S08', 'name card LEONARDO NOTARBARTOLO / tenant · Antwerp Diamond Centre · from 2000 over a slow push on the cast portrait (tenant); DRAMATIZATION tag')
def m_name_tenant(stills=None):
    src = portrait('tenant', True)
    sc_ = H2 * 1.02 / src.height
    pw, ph = int(src.width * sc_), int(src.height * sc_)
    plane = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
    plane.alpha_composite(src.resize((pw, ph), Image.LANCZOS), (int(W2 - pw - 120), int(H2 - ph + 40)))
    tx, ty = 300, CY - 40

    def mid(sec, u):
        a = 0.35 + 0.65 * p_io(sec, -0.5, 1.0)
        return fade(plane, a)

    def fg(im, sec, u):
        build_label(im, 'the tenant', (tx, ty - 300), sec, 0.2, size=34, tracking=0.2)
        build_text(im, 'LEONARDO', (tx, ty - 130), sec, 0.55, size=150, color=INK)
        build_text(im, 'NOTARBARTOLO', (tx, ty + 40), sec, 0.64, size=150, color=INK)
        hline(im, tx, tx + 220, ty + 130, color=AMBER, width=6, p=p_io(sec, 1.0, 0.5), glow=6)
        build_text(im, 'tenant · Antwerp Diamond Centre · from 2000', (tx, ty + 240), sec, 1.25, size=48,
                   weight='Regular', display=False, color=INK, alpha=0.82)

    render('M_NAME_TENANT', 3.5, fg, cam=Cam(z=(1.0, 1.08), pan=((0.012, 0.0), (0.0, -0.01))),
           bg=backdrop(grid=False, glow=(0.68, 0.38), warm=0.3), mid_fn=mid, mid_depth=0.8, stills=stills,
           tag_text='DRAMATIZATION')


@clip('M_MONTHS', 4.2, 'S09', 'lease calendar 2000-2002: 36 month cells tick "PAID" in amber, accelerating; year counter rolls (VO S09 "He pays his rent on time")')
def m_months(stills=None):
    MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    cw, chh, gap, rgap, lab = 196, 150, 20, 36, 250
    gw = lab + 12 * cw + 11 * gap
    gx0 = (W2 - gw) / 2 + lab
    gy0 = CY - (3 * chh + 2 * rgap) / 2 + 120
    T0, T1 = 0.45, 3.35

    def tick_time(k):
        return T0 + (T1 - T0) * (k / 35) ** 1.35

    def fg(im, sec, u):
        # header: year counter (left) + "RENT: PAID" (right)
        cur = 0
        for k in range(36):
            if sec >= tick_time(k):
                cur = k
        year = 2000 + cur // 12
        ph = p_in(sec, 0.1, 0.45)
        build_label(im, 'the lease', (gx0 - lab, gy0 - 330), sec, 0.05, size=34, tracking=0.2)
        text(im, str(year), (gx0 - lab - 6, gy0 - 110), size=230, color=INK, alpha=ph, dy=(1 - ph) * 40)
        pr = p_in(sec, 0.35, 0.45)
        rx = gx0 + 12 * cw + 11 * gap
        text(im, 'RENT: PAID', (rx, gy0 - 120), size=96, color=AMBER, alpha=pr, anchor='rs', dy=(1 - pr) * 24,
             blur=(1 - pr) * 5)
        for r_ in range(3):
            y = gy0 + r_ * (chh + rgap)
            pl = p_in(sec, 0.15 + 0.08 * r_, 0.4)
            active = (cur // 12 == r_) and sec < T1 + 0.3
            text(im, str(2000 + r_), (gx0 - lab, y + chh / 2), size=56, weight='Medium', color=INK if active else DIM,
                 alpha=pl, anchor='lm', display=False)
            for c_ in range(12):
                k = r_ * 12 + c_
                x = gx0 + c_ * (cw + gap)
                pc = p_in(sec, 0.12 + 0.012 * k, 0.35)
                if pc <= 0:
                    continue
                tk = tick_time(k)
                pt = p_in(sec, tk, 0.25)
                hot = max(0.0, 1 - (sec - tk) / 0.5) if sec >= tk else 0.0
                rect(im, (x, y, x + cw, y + chh), fill=BG2, alpha=0.9 * pc, radius=10)
                rect(im, (x, y, x + cw, y + chh), outline=mix(FAINT, AMBER, hot), width=3, radius=10,
                     alpha=pc, glow=10 * hot)
                label(im, MON[c_], (x + 22, y + 46), size=28, color=DIM, alpha=pc, tracking=0.1)
                if pt > 0:
                    check(im, (x + cw - 46, y + chh - 50), 34, color=AMBER, width=6, p=pt)
                    label(im, 'paid', (x + 22, y + chh - 30), size=30, color=AMBER, alpha=pt, tracking=0.12,
                          weight='SemiBold')

    render('M_MONTHS', 4.2, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.02, -0.008), (0.018, 0.01))),
           bg=backdrop(grid=True, glow=(0.5, 0.45)), stills=stills)


# ---------------------------------------------------------------------------- crew dossier cards (M_CREW, M_GHOSTS)

# role lines: each line is a list of (text, colour, landing time in seconds); words land on the narration
CREW = [('genius', 'THE GENIUS', [[('ALARMS', INK, 1.1)]]),
        ('monster', 'THE MONSTER', [[('LOCKS', INK, 3.3), ('WIRING', INK, 3.95), ('DRIVING', INK, 4.6)]]),
        ('king', 'THE KING OF KEYS', [[('AN OLD FORGER', INK, 6.7)], [('REAL NAME: ', DIM, 7.5), ('UNKNOWN', RED, 7.5)]]),
        ('speedy', 'SPEEDY', [[('THE NERVOUS ONE', INK, 0.0)]])]
CARD_W, CARD_PH, CARD_TH, CARD_GAP = 640, 800, 340, 64
CARD_X0 = (W2 - (4 * CARD_W + 3 * CARD_GAP)) / 2
CARD_Y0 = CY - (CARD_PH + CARD_TH) / 2 + 90


def card_x(k, n_eff):
    """x of card k when n_eff cards (fractional while one slides in) are centred as a group."""
    left = CX - (n_eff * CARD_W + (n_eff - 1) * CARD_GAP) / 2
    return left + k * (CARD_W + CARD_GAP)


@functools.lru_cache(maxsize=8)
def _stamp_tile(s, color):
    size = 84
    w, a, d = tsize(s, size, 'Bold', True, 0.12)
    bw, bh = int(w + 80), int(0.727 * size + 76)
    t = Image.new('RGBA', (bw + 40, bh + 40), tuple(color) + (0,))
    dd = ImageDraw.Draw(t)
    dd.rectangle([20, 20, 20 + bw, 20 + bh], outline=tuple(color) + (255,), width=7)
    dd.rectangle([34, 34, 6 + bw, 6 + bh], outline=tuple(color) + (255,), width=3)
    tile, pad, tw, asc, desc = _text_tile(s, size, 'Bold', True, 0.12, tuple(color))
    cap = 0.727 * size
    t.alpha_composite(tile, (int(20 + bw / 2 - tw / 2 - pad), int(20 + bh / 2 + cap / 2 - asc - pad)))
    # worn ink: knock out speckles
    rng = np.random.default_rng(11)
    arr = np.asarray(t).copy()
    noise = rng.random(arr.shape[:2])
    arr[..., 3] = (arr[..., 3] * np.where(noise < 0.13, 0.25, 1.0)).astype(np.uint8)
    return Image.fromarray(arr).filter(ImageFilter.GaussianBlur(0.6))


def stamp(im, s, c, p, color=INK, rot=-8.0, alpha=0.9):
    """rubber stamp that lands: scale 1.35 -> 1.0 and fade in over ~6 frames."""
    if p <= 0:
        return
    t = _stamp_tile(s, tuple(color))
    k = 1.0 + 0.35 * (1 - p)
    t = t.resize((int(t.width * k), int(t.height * k)), Image.BICUBIC).rotate(rot, Image.BICUBIC, expand=True)
    composite(im, fade(t, alpha * min(1.0, p * 1.6)), c[0] - t.width / 2, c[1] - t.height / 2)


def face_tile(who, w, h, inner=0.0, ghost=0.0, bright=1.0):
    """card portrait (w x h, 2x px): head and shoulders with its own slow push (inner 0..1); ghost 0..1 fades it to a
    flat grey silhouette; bright < 1 steps it back."""
    src = portrait(who, True)
    sw, sh = src.size
    z = 1.0 + 0.06 * inner
    ch_ = sh * 0.80 / z
    cw_ = ch_ * w / h
    cx_, cy_ = sw * 0.47, sh * 0.06 + sh * 0.40
    dy_ = (sh * 0.40 - ch_ / 2) * 0.2
    face = src.resize((w, h), Image.LANCZOS, box=(cx_ - cw_ / 2, cy_ - ch_ / 2 - dy_, cx_ + cw_ / 2, cy_ + ch_ / 2 - dy_))
    base = portrait_ground(w, h)
    base.alpha_composite(face)
    if ghost > 0:
        sil = portrait_ground(w, h, warm=1.0 - ghost)
        s_ = Image.new('RGBA', face.size, (52, 55, 60, 255))
        s_.putalpha(face.getchannel('A'))
        sil.alpha_composite(s_)
        base = Image.blend(grade_grey(base, ghost), sil, min(1.0, ghost)) if ghost < 1.0 else sil
    if bright < 1.0:
        base = Image.blend(Image.new('RGBA', base.size, (20, 20, 23, 255)), base, bright)
    return base


def role_lines(im, lines, x, y, sec, alpha=1.0, size=38, lh=58):
    """tracked caps role words that land one by one on their times (sec >= 90: everything on)."""
    for li, words in enumerate(lines):
        xx = x
        for j, (w_, col, t_) in enumerate(words):
            q = 1.0 if sec >= 90 else p_in(sec, t_ - 0.2, 0.35)
            if j > 0 and not words[j - 1][0].endswith(' '):
                label(im, '·', (xx + 8, y + li * lh), size=size, color=DIM, alpha=alpha * q, tracking=0.0)
                xx += 32
            if q > 0:
                label(im, w_, (xx, y + li * lh), size=size, color=col, alpha=alpha * q, tracking=0.05, dy=(1 - q) * 10,
                      blur=(1 - q) * 3)
            xx += tsize(w_.upper(), size, 'Medium', False, 0.05)[0] + (6 if w_.endswith(' ') else 0)


def crew_card(im, k, sec, appear, bright=1.0, ghost=0.0, stamp_p=0.0, inner=0.0, x=None):
    who, nick, roles = CREW[k]
    x = card_x(k, 4) if x is None else x
    y = CARD_Y0 + (1 - appear) * 90
    a = appear
    if a <= 0:
        return
    rect(im, (x, y, x + CARD_W, y + CARD_PH + CARD_TH), fill=BG2, alpha=0.96 * a, radius=6)
    composite(im, fade(face_tile(who, CARD_W, CARD_PH, inner, ghost, bright), a), x, y)
    rect(im, (x, y, x + CARD_W, y + CARD_PH + CARD_TH), outline=FAINT, width=2, alpha=a, radius=6)
    ta = a * (0.55 + 0.45 * bright)
    label(im, f'no. {k + 1}', (x + 38, y + CARD_PH + 70), size=26, color=DIM, alpha=ta, tracking=0.18)
    text(im, nick, (x + 38, y + CARD_PH + 158), size=60, color=INK, alpha=ta)
    role_lines(im, roles, x + 38, y + CARD_PH + 236, sec, alpha=ta)
    if stamp_p > 0:
        stamp(im, 'UNKNOWN', (x + CARD_W / 2, y + CARD_PH * 0.52), stamp_p, color=INK, rot=-9 + 3 * k % 5, alpha=0.88)


@functools.lru_cache(maxsize=8)
def _pground(w, h, warm_q):
    warm = warm_q / 10.0
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx / w - 0.45) / 0.8) ** 2 + ((yy / h - 0.3) / 0.7) ** 2)
    g = np.clip(1 - r, 0, 1) ** 2
    arr = np.zeros((h, w, 4), np.float32)
    arr[..., 0] = 20 + 26 * g * warm + 6 * g * (1 - warm)
    arr[..., 1] = 20 + 19 * g * warm + 6 * g * (1 - warm)
    arr[..., 2] = 23 + 11 * g * warm + 7 * g * (1 - warm)
    arr[..., 3] = 255
    return Image.fromarray(arr.astype(np.uint8))


def portrait_ground(w, h, warm=1.0):
    return _pground(w, h, int(round(warm * 10))).copy()


def crew_header(im, sec, t0=0.1, title='THE SCHOOL OF TURIN', sub='a loose network of Italian thieves, known only by nicknames',
                x=None):
    x = CARD_X0 if x is None else x
    build_label(im, title, (x, CARD_Y0 - 150), sec, t0, size=40, tracking=0.2, color=INK)
    build_label(im, sub, (x, CARD_Y0 - 92), sec, t0 + 0.15, size=30, tracking=0.08, weight='Regular')


@clip('M_CREW', 10.9, 'S12', 'dossier cards with cast portraits land on the nicknames: THE GENIUS 0.2 (ALARMS 1.1) / THE MONSTER 2.4 (LOCKS · WIRING · DRIVING 3.3-4.6) / THE KING OF KEYS 5.9 (AN OLD FORGER, REAL NAME: UNKNOWN 7.5); no Speedy card (cut at 10.4); DRAMATIZATION tag')
def m_crew(stills=None):
    T = [0.2, 2.4, 5.9]                 # landing times of the three cards

    def fg(im, sec, u):
        # the group stays centred: older cards glide left as each new one arrives
        n_eff = 1 + sum(p_io(sec, T[k] - 0.5, 0.7) for k in range(1, 3))
        crew_header(im, sec, t0=-0.4, x=card_x(0, n_eff))
        latest = max([k for k in range(3) if sec >= T[k] - 0.3] or [0])
        for k in range(3):
            a = p_in(sec, T[k] - 0.45, 0.55)
            b = 1.0
            if k < latest:
                b = 1.0 - 0.5 * p_io(sec, T[latest] - 0.3, 0.6)
            crew_card(im, k, sec, a, bright=b, inner=G.seg(sec, T[k] - 0.45, 11.0), x=card_x(k, n_eff))

    render('M_CREW', 10.9, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.006, 0.006), (0.006, -0.004)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='DRAMATIZATION', tag_t0=-0.4)


# ---------------------------------------------------------------------------- hero line that steps up into a header

@functools.lru_cache(maxsize=16)
def line_tile(parts):
    """one line from parts ((text, size, weight, display, colour), ...) on a shared baseline -> (tile, cap_cx, cap_cy, x_left,
    baseline) with tile-relative cap-centre, left edge and baseline."""
    tiles = [_text_tile(t_, sz, wt, dp, 0.0, tuple(col)) for t_, sz, wt, dp, col in parts]
    asc = max(t[3] for t in tiles)
    desc = max(t[4] for t in tiles)
    pad = 40
    w = sum(t[2] for t in tiles)
    out = Image.new('RGBA', (int(w + 2 * pad), int(asc + desc + 2 * pad)), (0, 0, 0, 0))
    x = pad
    for (tile, tp, tw, ta, td), (t_, sz, *_rest) in zip(tiles, parts):
        out.alpha_composite(tile, (int(x - tp), int(pad + asc - ta - tp)))
        x += tw
    cap = 0.727 * parts[0][1]
    return out, pad + w / 2, pad + asc - cap / 2, pad, pad + asc


def morph(im, parts, big_c, small_left_base, k_small, mv, alpha=1.0, dy=0.0, blur=0.0):
    """draw a line big with its cap-centre at big_c, moving (mv 0..1, eased) and scaling by k_small so that it ends
    left-aligned on the baseline small_left_base."""
    if alpha <= 0.003:
        return
    tile, ccx, ccy, xl, bl = line_tile(parts)
    k = lerp(1.0, k_small, mv)
    # anchor point inside the tile: cap-centre (big) -> left/baseline (small)
    ax, ay = lerp(ccx, xl, mv), lerp(ccy, bl, mv)
    tx_, ty_ = lerp(big_c[0], small_left_base[0], mv), lerp(big_c[1], small_left_base[1], mv) + dy
    t = tile if abs(k - 1) < 1e-3 else tile.resize((max(1, int(tile.width * k)), max(1, int(tile.height * k))), Image.LANCZOS)
    if blur > 0.3:
        t = t.filter(ImageFilter.GaussianBlur(blur))
    composite(im, fade(t, alpha), tx_ - ax * k, ty_ - ay * k)


# ---------------------------------------------------------------------------- rich text + tabular numbers

def rich(im, parts, xy, size=64, anchor='ms', alpha=1.0, weight='SemiBold', display=True, p=1.0, stagger=0.0, sec=None,
         t0=0.0, dur=0.42):
    """one line made of (string, colour) parts. anchor l|m|r + baseline. With sec/t0: each part builds on in turn
    (stagger seconds apart)."""
    widths = [tsize(t_, size, weight, display)[0] for t_, _ in parts]
    total = sum(widths)
    x = xy[0] - {'l': 0, 'm': total / 2, 'r': total}[anchor[0]]
    for j, ((t_, col), w_) in enumerate(zip(parts, widths)):
        if sec is not None:
            q = p_in(sec, t0 + stagger * j, dur)
            text(im, t_, (x, xy[1]), size=size, weight=weight, display=display, color=col, alpha=alpha * q,
                 dy=(1 - q) * size * 0.2, blur=(1 - q) * 5, anchor='l' + anchor[1])
        else:
            text(im, t_, (x, xy[1]), size=size, weight=weight, display=display, color=col, alpha=alpha * p,
                 anchor='l' + anchor[1])
        x += w_


def tabnum(im, s, xy, size=200, color=AMBER, alpha=1.0, anchor='r', weight='SemiBold', display=True, glow=0.0):
    """digits in fixed-width slots (no jitter while a counter rolls). anchor l|m|r, y = baseline."""
    f = G.font(size, weight, display)
    dw = max(f.getlength(c) for c in '0123456789')
    slots = [(c, dw if c.isdigit() else f.getlength(c)) for c in s]
    total = sum(w_ for _, w_ in slots)
    x = xy[0] - {'l': 0, 'm': total / 2, 'r': total}[anchor]
    for c, w_ in slots:
        if glow:
            text(im, c, (x + w_ / 2, xy[1]), size=size, weight=weight, display=display, color=color, alpha=alpha * 0.35,
                 anchor='ms', blur=glow)
        text(im, c, (x + w_ / 2, xy[1]), size=size, weight=weight, display=display, color=color, alpha=alpha,
             anchor='ms')
        x += w_
    return total


# ---------------------------------------------------------------------------- Ch3: the ten layers

LAYERS = [('STEEL DOOR', '3 tons · 12 hours of drilling'),
          ('SEISMIC SENSOR', 'trips at the first vibration'),
          ('COMBINATION DIAL', '0–99 · read through a lens'),
          ('KEY', 'nearly a foot long'),
          ('MAGNETIC SEAL', 'two plates form a field'),
          ('KEYPAD', 'switches the field off'),
          ('HEAT & MOTION', 'detectors'),
          ('LIGHT SENSOR', ''),
          ('RADAR', ''),
          ('CAMERA', 'feed to the guard station')]
L_STEP = 92
L_Y0 = CY - 420
L_SX, L_A, L_B, L_T = 900, 360, 104, 16      # stack centre x, rhombus half-width/half-height, plate thickness
L_TX = 1560                                   # label column


def layer_plate(im, i, appear, hl=0.0, beaten=0.0):
    if appear <= 0:
        return
    y = L_Y0 + i * L_STEP - (1 - appear) * 60
    cx = L_SX
    top = [(cx, y - L_B), (cx + L_A, y), (cx, y + L_B), (cx - L_A, y)]
    side_l = [(cx - L_A, y), (cx, y + L_B), (cx, y + L_B + L_T), (cx - L_A, y + L_T)]
    side_r = [(cx, y + L_B), (cx + L_A, y), (cx + L_A, y + L_T), (cx, y + L_B + L_T)]
    base_fill = mix((34, 35, 40), (22, 22, 25), beaten)
    edge = mix(mix((96, 100, 108), AMBER, hl), (58, 60, 66), beaten)
    a = appear * (1 - 0.35 * beaten)

    def fn(d, X, S):
        d.polygon([X(*q) for q in side_l], fill=rgba(mix(base_fill, (10, 10, 12), 0.45)))
        d.polygon([X(*q) for q in side_r], fill=rgba(mix(base_fill, (10, 10, 12), 0.25)))
        d.polygon([X(*q) for q in top], fill=rgba(mix(base_fill, AMBER, 0.18 * hl)))
        d.line([X(*q) for q in top + [top[0]]], fill=rgba(edge), width=int(3 * S), joint='curve')
        d.line([X(cx - L_A, y), X(cx - L_A, y + L_T), X(cx, y + L_B + L_T), X(cx + L_A, y + L_T), X(cx + L_A, y)],
               fill=rgba(mix(edge, (10, 10, 12), 0.4)), width=int(2 * S))
    draw(im, (cx - L_A - 4, y - L_B - 4, cx + L_A + 4, y + L_B + L_T + 4), fn, alpha=a, glow=10 * hl, glow_alpha=0.5)


def layer_row(im, i, sec, t0, hl=0.0, strike=0.0, beaten=0.0, show_det=True):
    p = p_in(sec, t0, 0.4)
    if p <= 0:
        return
    y = L_Y0 + i * L_STEP + 18
    name, det = LAYERS[i]
    a = p * (1 - 0.55 * beaten)
    # leader from the plate's right corner
    hline(im, L_SX + L_A + 24, L_TX - 40, L_Y0 + i * L_STEP, color=mix(FAINT, AMBER, hl), width=2, p=p, alpha=0.8 * a)
    label(im, f'{i + 1:02d}', (L_TX, y), size=30, color=mix(DIM, AMBER, hl), alpha=a, tracking=0.1)
    text(im, name, (L_TX + 90, y), size=58, color=mix(INK, AMBER, hl), alpha=a, dy=(1 - p) * 12, blur=(1 - p) * 4)
    nw = tsize(name, 58)[0]
    if det and show_det:
        text(im, det, (L_TX + 90 + nw + 34, y), size=40, weight='Regular', display=False, color=mix(DIM, INK, 0.25),
             alpha=a * 0.95)
    if strike > 0:
        tw = nw + (tsize(det, 40, 'Regular', False)[0] + 34 if det else 0)
        hline(im, L_TX + 80, L_TX + 100 + tw, y - 18, color=INK, width=4, p=strike, alpha=0.9)


@clip('M_LAYERS_A', 6.0, 'S14', '"TEN LAYERS" stack; the steel door lit, counter 1 / 10; "3 TONS" lands at 0, "12 HOURS" (of nonstop drilling) at 2.8 (VO S14)')
def m_layers_a(stills=None):
    cx = 2420

    def fg(im, sec, u):
        build_label(im, 'the vault', (L_TX, L_Y0 - 300), sec, -0.5, size=34, tracking=0.2)
        build_text(im, 'TEN LAYERS', (L_TX, L_Y0 - 170), sec, -0.45, size=120)
        for i in reversed(range(10)):
            t_ = -0.45 if i == 0 else 0.3 + 0.12 * (i - 1)
            layer_plate(im, i, p_in(sec, t_, 0.45), hl=1.0 if i == 0 else 0.0)
        for i in range(10):
            t_ = -0.4 if i == 0 else 0.36 + 0.12 * (i - 1)
            layer_row(im, i, sec, t_, hl=1.0 if i == 0 else 0.0, show_det=False)
        pc = p_in(sec, 0.1, 0.4)
        if pc > 0:
            x1 = L_TX + 1700
            tabnum(im, '1', (x1 - tsize(' / 10', 120)[0], L_Y0 - 170 + (1 - pc) * 20), size=120, color=AMBER, alpha=pc,
                   anchor='r', glow=8)
            text(im, ' / 10', (x1, L_Y0 - 170 + (1 - pc) * 20), size=120, color=DIM, alpha=pc, anchor='rs')
        # the door, in two numbers
        build_text(im, '3 TONS', (cx, L_Y0 + 300), sec, -0.3, size=170, color=AMBER)
        build_label(im, 'of steel', (cx + 6, L_Y0 + 380), sec, -0.1, size=34, tracking=0.2)
        build_text(im, '12 HOURS', (cx, L_Y0 + 700), sec, 2.6, size=170, color=AMBER)
        build_label(im, 'of nonstop drilling', (cx + 6, L_Y0 + 780), sec, 2.8, size=34, tracking=0.2)
        hline(im, cx, cx + 700, L_Y0 + 470, color=FAINT, width=2, p=p_io(sec, 2.4, 0.5))

    render('M_LAYERS_A', 6.0, fg, cam=Cam(z=(1.0, 1.07), pan=((0.006, 0.01), (-0.008, -0.01))),
           bg=backdrop(grid=True, glow=(0.32, 0.4)), stills=stills)


@clip('M_LAYERS_B', 6.7, 'S28', 'the ten-layer stack struck through fast (0.1-1.2), counter to 10 / 10; "beaten by" then hair spray 1.6, tape 2.5, an aluminium plate 3.2, a sheet of foam 4.9 (VO S28)')
def m_layers_b(stills=None):
    TS = [0.1 + 0.09 * i for i in range(10)]
    PARTS = [('beaten by ', INK, 1.0), ('hair spray', AMBER, 1.6), (', ', INK, 2.5), ('tape', AMBER, 2.5), (', ', INK, 3.2),
             ('an aluminium plate', AMBER, 3.2), (' and ', INK, 4.9), ('a sheet of foam', AMBER, 4.9)]

    def fg(im, sec, u):
        label(im, 'the vault', (L_TX, L_Y0 - 300), size=34, tracking=0.2)
        text(im, 'TEN LAYERS', (L_TX, L_Y0 - 170), size=120)
        n = sum(1 for t_ in TS if sec >= t_ + 0.1)
        for i in reversed(range(10)):
            layer_plate(im, i, 1.0, beaten=p_in(sec, TS[i] + 0.05, 0.3))
        for i in range(10):
            layer_row(im, i, sec, -9, strike=p_io(sec, TS[i], 0.18), beaten=p_in(sec, TS[i] + 0.05, 0.3))
        x1 = L_TX + 1700
        if sec > TS[0]:
            tabnum(im, str(max(1, n)), (x1 - tsize(' / 10', 120)[0], L_Y0 - 170), size=120, color=AMBER, anchor='r',
                   glow=8)
            text(im, ' / 10', (x1, L_Y0 - 170), size=120, color=DIM, anchor='rs')
        build_label(im, 'beaten', (x1, L_Y0 - 300), sec, 0.0, size=34, tracking=0.2, anchor='rs', color=AMBER)
        # the punchline, each item landing on its word
        yb = L_Y0 + 9 * L_STEP + 300
        size = 72
        total = sum(tsize(t_, size)[0] for t_, _, _ in PARTS)
        x = CX - total / 2
        for t_, col, tl in PARTS:
            build_text(im, t_, (x, yb), sec, tl - 0.25, size=size, color=col)
            x += tsize(t_, size)[0]

    render('M_LAYERS_B', 6.7, fg, cam=Cam(z=(1.03, 1.0), pan=((-0.006, -0.006), (0.0, 0.01))),
           bg=backdrop(grid=True, glow=(0.32, 0.4)), stills=stills)


@clip('M_17576', 6.0, 'S19', 'box lock: three letter wheels A-Z spin; 189 boxes grid; counter reaches 17,576 by 2.7 (26x26x26), "combinations", "PER BOX" at 4.0 (VO S19)')
def m_17576(stills=None):
    ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    px0, py0, px1, py1 = 330, CY - 560, 1730, CY + 520          # lock face plate
    ww, wh, wg, pitch, lsz = 300, 420, 70, 236, 220
    wx0 = (px0 + px1) / 2 - (3 * ww + 2 * wg) / 2
    wy0 = py0 + 170
    rx = 3500                                                    # right column (right-aligned)

    def vel(tt, j):
        v_fast, v_slow = 19.0 - 2.5 * j, 2.0 + 0.45 * j
        return (v_slow + (v_fast - v_slow) * (1 - G.ease(G.seg(tt, 1.6, 3.0)))) * G.seg(tt, 0.0, 0.25)

    def wheel_pos(j, sec):
        """letters travelled: a fast spin easing down to a slow, stepping search that never settles."""
        t_ = sec - (0.0 + 0.12 * j)
        if t_ <= 0:
            return 7.0 * j, 0.0
        n = max(1, int(t_ * 48))
        pos = sum(vel((m + 0.5) * t_ / n, j) for m in range(n)) * t_ / n
        v = vel(t_, j)
        # slow: rest on a letter, then click to the next one
        base = math.floor(pos)
        fr = pos - base
        stepped = base + G.ease(G.seg(fr, 0.55, 1.0))
        w = G.seg(v, 3.5, 7.0)
        return 7.0 * j + stepped * (1 - w) + pos * w, v

    def fg(im, sec, u):
        pa = p_in(sec, -0.45, 0.5)
        rect(im, (px0, py0, px1, py1), fill=(30, 31, 36), alpha=0.95 * pa, radius=28)
        rect(im, (px0, py0, px1, py1), outline=(80, 84, 92), width=3, alpha=pa, radius=28)
        rect(im, (px0 + 28, py0 + 28, px1 - 28, py1 - 28), outline=(52, 55, 61), width=2, alpha=pa, radius=18)
        label(im, 'box 1 of 189', (px0 + 80, py0 + 110), size=32, alpha=pa, tracking=0.16)
        label(im, 'three-letter combination', (px1 - 80, py0 + 110), size=32, alpha=pa, tracking=0.16, anchor='rs')
        for j in range(3):
            x = wx0 + j * (ww + wg)
            pw = p_in(sec, -0.4 + 0.06 * j, 0.4)
            if pw <= 0:
                continue
            rect(im, (x, wy0, x + ww, wy0 + wh), fill=(11, 11, 13), alpha=pw, radius=12)
            pos, v = wheel_pos(j, sec)
            tile = Image.new('RGBA', (ww, wh), (0, 0, 0, 0))
            nsub = 1 if v < 5 else 6
            for sub in range(nsub):
                ps = pos - (v / FPS) * 0.6 * sub / max(1, nsub - 1) if nsub > 1 else pos
                base = math.floor(ps)
                frac = ps - base
                for m in range(-2, 3):
                    yc = wh / 2 + (m - frac) * pitch
                    if -pitch < yc < wh + pitch:
                        text(tile, ABC[(base + m) % 26], (ww / 2, yc), size=lsz, color=INK,
                             alpha=min(1.0, 1.7 / nsub), anchor='mm')
            arr = np.asarray(tile).astype(np.float32)
            yy = np.abs(np.arange(wh, dtype=np.float32) - wh / 2) / (wh / 2)
            arr[..., 3] *= np.clip(1.2 - yy ** 1.6 * 1.25, 0, 1)[:, None]
            composite(im, fade(Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), pw), x, wy0)
            rect(im, (x, wy0, x + ww, wy0 + wh), outline=(74, 78, 86), width=3, alpha=pw, radius=12)
            # reading marks either side of the window
            for sx_ in (x - 22, x + ww + 22):
                d_ = 1 if sx_ < x else -1
                poly(im, [(sx_ - d_ * 14, wy0 + wh / 2 - 13), (sx_ + d_ * 6, wy0 + wh / 2), (sx_ - d_ * 14, wy0 + wh / 2 + 13)],
                     fill=AMBER, alpha=0.85 * pw)
        # keyhole: its own key
        pk = p_in(sec, -0.2, 0.4)
        kx, ky = (px0 + px1) / 2, wy0 + wh + 200
        if pk > 0:
            circle(im, (kx, ky - 24), 36, fill=(8, 8, 10), alpha=pk)
            poly(im, [(kx - 17, ky - 6), (kx + 17, ky - 6), (kx + 28, ky + 72), (kx - 28, ky + 72)], fill=(8, 8, 10), alpha=pk)
            circle(im, (kx, ky + 6), 100, outline=(74, 78, 86), width=3, alpha=pk)
            label(im, 'its own key', (kx + 140, ky + 16), size=30, alpha=pk, tracking=0.16)
        # right column: 26 x 26 x 26 -> 17,576
        parts = []
        for j in range(3):
            hot = G.seg(sec, 0.12 * j, 0.12 * j + 0.3) * (1 - G.seg(sec, 2.2, 2.9))
            parts.append(('26', mix(INK, AMBER, hot)))
            if j < 2:
                parts.append((' × ', DIM))
        rich(im, parts, (rx, CY - 430), size=104, anchor='rs', sec=sec, t0=0.15, stagger=0.08)
        pc = G.ease_out(G.seg(sec, 0.6, 2.7))
        if sec >= 0.6:
            tabnum(im, f'{int(round(17576 * pc)):,}', (rx, CY - 110), size=300, color=AMBER, anchor='r',
                   alpha=p_in(sec, 0.6, 0.25), glow=14 * pc)
        build_text(im, 'combinations', (rx, CY + 20), sec, 2.55, size=76, anchor='rs', color=INK)
        build_text(im, 'PER BOX', (rx, CY + 200), sec, 3.78, size=130, anchor='rs', color=INK)
        # 189 boxes: a grid fills in (said just before this clip)
        pb = p_in(sec, -0.2, 0.4)
        if pb > 0:
            cols, rows, cs, cg = 27, 7, 30, 10
            gy0 = CY + 330
            gx0 = rx - cols * (cs + cg) + cg
            for k in range(189):
                c_, r_ = k % cols, k // cols
                q = p_in(sec, -0.15 + 0.004 * k, 0.2)
                if q <= 0:
                    continue
                x = gx0 + c_ * (cs + cg)
                y = gy0 + r_ * (cs + cg)
                rect(im, (x, y, x + cs, y + cs), outline=(118, 123, 132), width=2, alpha=q * 0.9, radius=3)
            gh = rows * (cs + cg) - cg
            text(im, '189 boxes', (gx0 - 50, gy0 + gh / 2 - 6), size=68, color=INK, alpha=pb, anchor='rs')
            label(im, 'each its own key + combination', (gx0 - 50, gy0 + gh / 2 + 56), size=30, alpha=pb, anchor='rs',
                  tracking=0.1)

    render('M_17576', 6.0, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.008, 0.006), (0.01, -0.006))),
           bg=backdrop(grid=True, glow=(0.36, 0.48)), stills=stills)


# ---------------------------------------------------------------------------- Ch4

def embers(im, sec, n=46, seed=5, y0=None, alpha=1.0, span=3.5):
    """slow sparks rising from the bottom of frame."""
    rng = np.random.default_rng(seed)
    y0 = H2 + 40 if y0 is None else y0
    for k in range(n):
        x = rng.uniform(300, W2 - 300)
        t0 = rng.uniform(-3.0, span)
        life = rng.uniform(2.2, 3.6)
        vy = rng.uniform(260, 520)
        sway = rng.uniform(20, 70)
        ph = rng.uniform(0, 6.28)
        r = rng.uniform(3.0, 7.0)
        tt = sec - t0
        if tt < 0 or tt > life:
            continue
        q = tt / life
        xx = x + math.sin(ph + tt * 1.7) * sway
        yy = y0 - vy * tt
        a = math.sin(math.pi * q) * alpha * (0.6 + 0.4 * math.sin(ph + tt * 9))
        circle(im, (xx, yy), r, fill=(255, 176, 92), alpha=a, glow=r * 2.5, glow_alpha=0.9)


@clip('M_BURNLIST', 8.7, 'S30', '"THE PLAN:" 0-0.8 (according to Notarbartolo), "BURN EVERYTHING" 1.8; TAPE 4.6 / TOOLS 5.3 / PACKAGING 6.0 / FOOD 6.9 tick on; ember glow + sparks, hold (VO S30)')
def m_burnlist(stills=None):
    size = 132
    w1 = tsize('THE PLAN: ', size)[0]
    tw = tsize('THE PLAN: BURN EVERYTHING', size)[0]
    x0 = CX - tw / 2
    y_t = CY - 300
    ITEMS = ['TAPE', 'TOOLS', 'PACKAGING', 'FOOD']
    TT = [4.6, 5.3, 6.0, 6.9]

    def fg(im, sec, u):
        fl = 0.75 + 0.25 * math.sin(sec * 7.3) * math.sin(sec * 3.1 + 1)
        heat = 0.7 + 0.3 * G.seg(sec, 1.6, 8.0)
        glow_spot(im, (CX, H2 + 260), 1500, color=(232, 120, 40), alpha=0.21 * fl * heat * p_in(sec, -0.5, 1.2))
        glow_spot(im, (CX - 500, H2 + 200), 900, color=(232, 150, 60), alpha=0.08 * fl * heat)
        embers(im, sec, n=96, alpha=0.75, span=9.2)
        build_label(im, 'according to Notarbartolo', (x0, y_t - 170), sec, -0.1, size=34, tracking=0.18)
        build_text(im, 'THE PLAN:', (x0, y_t), sec, 0.05, size=size, dur=0.6)
        build_text(im, 'BURN EVERYTHING', (x0 + w1, y_t), sec, 1.55, size=size, dur=0.5)
        hline(im, x0, x0 + tw, y_t + 70, color=FAINT, width=3, p=p_io(sec, 1.9, 0.7))
        for j, it in enumerate(ITEMS):
            y = y_t + 220 + j * 140
            pa = p_in(sec, 2.6 + 0.08 * j, 0.4)
            if pa <= 0:
                continue
            bx = x0 + 6
            rect(im, (bx, y - 64, bx + 72, y + 8), outline=(120, 124, 132), width=3, alpha=pa, radius=6)
            q = p_in(sec, TT[j] - 0.25, 0.35)
            if q > 0:
                text(im, it, (bx + 130, y), size=84, color=INK, alpha=q, dy=(1 - q) * 14, blur=(1 - q) * 5)
            pt = p_io(sec, TT[j] - 0.2, 0.3)
            if pt > 0:
                check(im, (bx + 38, y - 30), 56, color=AMBER, width=8, p=pt, glow=6)

    render('M_BURNLIST', 8.7, fg, cam=Cam(z=(1.0, 1.08), pan=((0.0, 0.012), (0.0, -0.008)), lin=0.5),
           bg=backdrop(grid=False, glow=(0.5, 0.85), warm=0.4), stills=stills)


@clip('M_GHOSTS', 3.6, 'S32', 'the four crew dossier cards (M_CREW art) fade to grey silhouettes stamped UNKNOWN by 1.8; DRAMATIZATION tag (VO S32 "the crew are ghosts")')
def m_ghosts(stills=None):
    def fg(im, sec, u):
        crew_header(im, 99, title='THE SCHOOL OF TURIN', sub='')
        build_label(im, 'to the detectives: ghosts', (CARD_X0, CARD_Y0 - 92), sec, 0.5, size=30, tracking=0.08,
                    weight='Regular')
        for k in range(4):
            g = p_io(sec, 0.15 + 0.1 * k, 0.9)
            crew_card(im, k, 99, 1.0, bright=1.0 - 0.15 * g, ghost=g, stamp_p=p_in(sec, 1.0 + 0.15 * k, 0.22),
                      inner=0.5 + 0.5 * G.seg(sec, -0.5, 4.1))

    render('M_GHOSTS', 3.6, fg, cam=Cam(z=(1.0, 1.06), pan=((0.004, 0.006), (-0.004, -0.004))),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='DRAMATIZATION', tag_t0=-9)


# ---------------------------------------------------------------------------- evidence illustrations (flat, no photos)

PAPER, PAPER_D, LINE_D = (170, 172, 174), (128, 130, 134), (78, 80, 86)
BREAD, CRUST, SALAMI, FAT = (146, 132, 108), (112, 98, 78), (122, 70, 66), (176, 150, 140)


def _ill_receipts(d, P, S):
    for k, (ox, oy, rot) in enumerate([(-70, 10, 0), (60, -10, 0)]):
        w_, h_ = 190, 330
        x0, y0 = ox - w_ / 2, oy - h_ / 2
        pts = [(x0, y0), (x0 + w_, y0)]
        n = 9
        for j in range(n + 1):
            pts.append((x0 + w_ - j * w_ / n, y0 + h_ + (0 if j % 2 == 0 else -16)))
        d.polygon([P(*q) for q in pts], fill=rgba(PAPER if k else PAPER_D))
        for j in range(7):
            yy = y0 + 40 + j * 30
            ln = w_ - 50 - (j * 37 % 60)
            d.line([P(x0 + 22, yy), P(x0 + 22 + ln, yy)], fill=rgba(LINE_D), width=int(5 * S))
        d.line([P(x0 + 22, y0 + h_ - 60), P(x0 + w_ - 22, y0 + h_ - 60)], fill=rgba(LINE_D), width=int(8 * S))


def _ill_envelopes(d, P, S):
    for k, (ox, oy) in enumerate([(-50, 30), (50, -30)]):
        w_, h_ = 300, 200
        x0, y0 = ox - w_ / 2, oy - h_ / 2
        d.rectangle([P(x0, y0), P(x0 + w_, y0 + h_)], fill=rgba(PAPER if k else PAPER_D))
        d.line([P(x0, y0), P(ox, oy + 20), P(x0 + w_, y0)], fill=rgba(LINE_D), width=int(5 * S), joint='curve')
        d.line([P(x0, y0 + h_), P(ox - 40, oy + 10)], fill=rgba(LINE_D), width=int(4 * S))
        d.line([P(x0 + w_, y0 + h_), P(ox + 40, oy + 10)], fill=rgba(LINE_D), width=int(4 * S))


def _stone(d, P, S, cx, cy, r, col=INK):
    t, hc, hp = r * 0.55, r * 0.35, r * 0.85
    pts = [(cx - t, cy - hc), (cx + t, cy - hc), (cx + r, cy), (cx, cy + hp), (cx - r, cy)]
    d.polygon([P(*q) for q in pts], fill=rgba((150, 160, 170), 0.22))
    d.line([P(*q) for q in pts + [pts[0]]], fill=rgba(col), width=int(4 * S), joint='curve')
    d.line([P(cx - r, cy), P(cx + r, cy)], fill=rgba(col), width=int(3 * S))
    for fx in (-t, 0, t):
        d.line([P(cx + fx * 0.6, cy), P(cx, cy + hp)], fill=rgba(col, 0.7), width=int(2 * S))
    d.line([P(cx - t, cy - hc), P(cx - r * 0.5, cy)], fill=rgba(col, 0.7), width=int(2 * S))
    d.line([P(cx + t, cy - hc), P(cx + r * 0.5, cy)], fill=rgba(col, 0.7), width=int(2 * S))
    d.line([P(cx, cy - hc), P(cx - r * 0.5, cy)], fill=rgba(col, 0.5), width=int(2 * S))
    d.line([P(cx, cy - hc), P(cx + r * 0.5, cy)], fill=rgba(col, 0.5), width=int(2 * S))


def _ill_stones(d, P, S):
    for cx, cy, r in [(-120, -40, 62), (10, 10, 82), (140, -60, 48), (-60, 100, 44), (120, 90, 56)]:
        _stone(d, P, S, cx, cy, r)


def _ill_paperwork(d, P, S):
    for k, (ox, oy) in enumerate([(-40, 34), (-16, 14), (10, -8)]):
        w_, h_ = 280, 360
        x0, y0 = ox - w_ / 2, oy - h_ / 2
        d.rectangle([P(x0, y0), P(x0 + w_, y0 + h_)], fill=rgba(PAPER if k == 2 else PAPER_D),
                    outline=rgba((90, 92, 98)), width=int(2 * S))
    x0, y0 = 10 - 140, -8 - 180
    d.rectangle([P(x0 + 26, y0 + 30), P(x0 + 120, y0 + 66)], fill=rgba(LINE_D))
    for j in range(8):
        yy = y0 + 110 + j * 28
        d.line([P(x0 + 26, yy), P(x0 + 26 + (220 if j % 3 else 150), yy)], fill=rgba(LINE_D), width=int(5 * S))


def _ill_sandwich(d, P, S, scale=1.0):
    k = scale
    w_, cx = 420 * k, 0
    x0, x1 = cx - w_ / 2, cx + w_ / 2
    # bottom bread
    d.rounded_rectangle([P(x0, 18 * k), P(x1, 78 * k)], radius=30 * k * S, fill=rgba(BREAD))
    d.rectangle([P(x0, 64 * k), P(x1, 78 * k)], fill=rgba(CRUST))
    # salami slices peeking out
    for j in range(6):
        sx = x0 + 40 * k + j * 66 * k
        d.ellipse([P(sx - 40 * k, -6 * k), P(sx + 40 * k, 30 * k)], fill=rgba(SALAMI))
        for (fx, fy) in ((-12, 6), (10, 14), (16, 2)):
            d.ellipse([P(sx + fx * k - 4 * k, fy * k - 4 * k), P(sx + fx * k + 4 * k, fy * k + 4 * k)], fill=rgba(FAT))
    # top bread: a long dome
    pts = []
    for j in range(41):
        a = math.pi * j / 40
        pts.append((cx - math.cos(a) * w_ / 2, 6 * k - math.sin(a) * 110 * k))
    d.polygon([P(*q) for q in pts], fill=rgba(BREAD))
    d.line([P(*q) for q in pts], fill=rgba(CRUST), width=int(10 * S * k), joint='curve')
    for j in range(4):
        sx = x0 + 90 * k + j * 80 * k
        d.line([P(sx, -70 * k), P(sx + 30 * k, -88 * k)], fill=rgba(CRUST), width=int(5 * S * k))
    # the bitten / cut end: erase two scallops on the right
    for (bx, by, br) in ((x1 + 6 * k, -40 * k, 62 * k), (x1 + 20 * k, 40 * k, 56 * k)):
        d.ellipse([P(bx - br, by - br), P(bx + br, by + br)], fill=(0, 0, 0, 0))


ILLS = {'receipts': _ill_receipts, 'envelopes': _ill_envelopes, 'stones': _ill_stones, 'paperwork': _ill_paperwork,
        'sandwich': _ill_sandwich}


@functools.lru_cache(maxsize=16)
def ill_tile(kind, w=620, h=480, scale=1.0):
    ss = 2
    t = Image.new('RGBA', (w * ss, h * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)

    def P(x, y):
        return ((x * scale + w / 2) * ss, (y * scale + h / 2) * ss)
    if kind == 'sandwich':
        _ill_sandwich(d, P, ss * scale)
    else:
        ILLS[kind](d, P, ss * scale)
    t = t.resize((w, h), Image.LANCZOS)
    # soft drop shadow (pinned to a board)
    sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sh.putalpha(t.getchannel('A').point(lambda v: int(v * 0.55)))
    sh = sh.filter(ImageFilter.GaussianBlur(10))
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.alpha_composite(sh, (10, 16))
    out.alpha_composite(t)
    return out


def pin(im, c, alpha=1.0):
    circle(im, (c[0] + 4, c[1] + 6), 15, fill=(0, 0, 0), alpha=0.5 * alpha, blur=3)
    circle(im, c, 15, fill=AMBER, alpha=alpha)
    circle(im, (c[0] - 4, c[1] - 5), 5, fill=(255, 226, 170), alpha=0.9 * alpha)


def string(im, a, b, p=1.0, sag=60, alpha=0.9, color=AMBER, width=4):
    pts = []
    for j in range(25):
        t_ = j / 24
        pts.append((lerp(a[0], b[0], t_), lerp(a[1], b[1], t_) + sag * 4 * t_ * (1 - t_)))
    polyline(im, pts, color=color, width=width, p=p, alpha=alpha)


def ev_tag(im, num, s, c, alpha=1.0, color=INK, size=30):
    w, a, d_ = tsize(s.upper(), size, 'Medium', False, 0.12)
    bw, bh = w + 120, 70
    x0, y0 = c[0] - bw / 2, c[1] - bh / 2
    rect(im, (x0, y0, x0 + bw, y0 + bh), fill=(34, 35, 40), outline=(92, 96, 104), width=2, radius=6, alpha=alpha)
    label(im, num, (x0 + 24, c[1]), size=size - 4, color=AMBER, alpha=alpha, anchor='lm', tracking=0.1, weight='SemiBold')
    label(im, s, (x0 + 84, c[1]), size=size, color=color, alpha=alpha, anchor='lm', tracking=0.12)


# ---------------------------------------------------------------------------- Ch4: the bags in the woods

@clip('M_EVIDENCE', 3.6, 'S36', 'evidence-board reconstruction: RECEIPTS 0 / ENVELOPES 1.0 / LOOSE STONES 1.9 (cut-away at 3.2); flat illustrations + tags, amber string; RECONSTRUCTION tag (VO S36)')
def m_evidence(stills=None):
    ITEMS = [('receipts', 'receipts', (980, CY - 20), -4, 0.0),
             ('envelopes', 'envelopes', (1930, CY - 150), 3, 1.0),
             ('stones', 'loose stones', (2870, CY - 10), -2, 1.9)]
    PIN = [-214, -168, -134]

    def fg(im, sec, u):
        build_label(im, 'found in the woods', (520, 380), sec, -0.45, size=34, tracking=0.2, color=INK)
        build_label(im, 'what the bags held', (520, 436), sec, -0.35, size=30, tracking=0.08, weight='Regular')
        pins = [(x + (12 if j % 2 else -10), y + PIN[j]) for j, (_, _, (x, y), _, _) in enumerate(ITEMS)]
        for j in range(1, len(ITEMS)):
            string(im, pins[j - 1], pins[j], p=p_io(sec, ITEMS[j][4] - 0.45, 0.5), sag=70, alpha=0.85)
        for j, (kind, name, (x, y), rot, tl) in enumerate(ITEMS):
            p = p_in(sec, tl - 0.4, 0.5)
            if p <= 0:
                continue
            tile = ill_tile(kind, 760, 590, 1.2)
            r = rot + (1 - p) * 6 * (1 if j % 2 else -1)
            k = 1.0 + 0.08 * (1 - p)
            t2 = tile.resize((int(tile.width * k), int(tile.height * k)), Image.BICUBIC).rotate(r, Image.BICUBIC, expand=True)
            composite(im, fade(t2, p), x - t2.width / 2, y - t2.height / 2 - (1 - p) * 30)
            ev_tag(im, f'{j + 1:02d}', name, (x, y + 300), alpha=p)
        for j in range(len(ITEMS)):
            pp = p_in(sec, ITEMS[j][4] - 0.2, 0.25)
            if pp > 0:
                pin(im, pins[j], alpha=pp)

    render('M_EVIDENCE', 3.6, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.008, 0.004), (0.008, -0.004))),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.26), stills=stills, tag_text='RECONSTRUCTION', tag_t0=-0.4)


@clip('M_DNA', 4.9, 'S37', 'sandwich in an evidence bag -> swab -> DNA strand lands 0.8 -> "CASE FILE" stamp 3.3 (no percentages); RECONSTRUCTION tag (VO S37)')
def m_dna(stills=None):
    XS = [760, 1560, 2380, 3180]
    LB = ['evidence bag', 'swab', 'DNA', 'case file']
    TT = [-0.45, 0.15, 0.35, 2.7]
    TL = [-0.25, 0.35, 0.6, 3.15]

    def bag(im, c, p):
        x, y = c
        bw, bh = 560, 640
        rect(im, (x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2), fill=(180, 190, 200), alpha=0.08 * p, radius=14)
        rect(im, (x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2), outline=(150, 156, 166), width=3, alpha=p, radius=14)
        hline(im, x - bw / 2, x + bw / 2, y - bh / 2 + 40, color=(150, 156, 166), width=3, alpha=p)
        hline(im, x - bw / 2, x + bw / 2, y - bh / 2 + 54, color=(150, 156, 166), width=3, alpha=p)
        rect(im, (x - bw / 2 + 40, y + 150, x + bw / 2 - 40, y + bh / 2 - 40), fill=(210, 212, 214), alpha=0.9 * p, radius=4)
        label(im, 'evidence', (x - bw / 2 + 64, y + 210), size=30, color=(30, 30, 34), alpha=p, tracking=0.2,
              weight='Bold')
        for j in range(2):
            hline(im, x - bw / 2 + 64, x + bw / 2 - 64 - j * 90, y + 250 + j * 34, color=(120, 122, 128), width=4, alpha=p)
        t = ill_tile('sandwich', 760, 520, 1.25)
        t = t.resize((int(t.width * 0.62), int(t.height * 0.62)), Image.LANCZOS).rotate(-6, Image.BICUBIC, expand=True)
        composite(im, fade(t, p), x - t.width / 2, y - 60 - t.height / 2)
        # plastic sheen
        poly(im, [(x - bw / 2 + 30, y - bh / 2 + 80), (x - bw / 2 + 90, y - bh / 2 + 80), (x - bw / 2 + 30, y + 60)],
             fill=(255, 255, 255), alpha=0.06 * p)

    def swab(im, c, p):
        x, y = c
        ang = math.radians(-35)
        L = 520
        ax, ay = x - math.cos(ang) * L / 2, y - math.sin(ang) * L / 2
        bx, by = x + math.cos(ang) * L / 2, y + math.sin(ang) * L / 2
        polyline(im, [(ax, ay), (bx, by)], color=(196, 200, 206), width=10, p=p)
        if p > 0.7:
            q = (p - 0.7) / 0.3
            tx, ty = bx + math.cos(ang) * 30, by + math.sin(ang) * 30

            def fn(d, X, S):
                pts = []
                for j in range(36):
                    a = 2 * math.pi * j / 36
                    ex, ey = math.cos(a) * 60, math.sin(a) * 26
                    pts.append(X(tx + ex * math.cos(ang) - ey * math.sin(ang), ty + ex * math.sin(ang) + ey * math.cos(ang)))
                d.polygon(pts, fill=rgba((232, 230, 224)))
            draw(im, (tx - 70, ty - 70, tx + 70, ty + 70), fn, alpha=q)

    def helix(im, c, p, sec):
        x, y = c
        hh, amp = 700, 150
        ph = sec * 2.2
        n = 80
        top = y - hh / 2
        cut = p
        strands = [[], []]
        for j in range(n + 1):
            t_ = j / n
            if t_ > cut:
                break
            yy = top + t_ * hh
            a = t_ * 3.2 * math.pi + ph
            strands[0].append((x + math.sin(a) * amp, yy, math.cos(a)))
            strands[1].append((x + math.sin(a + math.pi) * amp, yy, math.cos(a + math.pi)))
        # rungs
        for j in range(0, len(strands[0]), 4):
            (x1, y1, z1), (x2, y2, z2) = strands[0][j], strands[1][j]
            hot = (j // 4) % 5 == 2
            polyline(im, [(x1, y1), (x2, y2)], color=AMBER if hot else (120, 124, 132), width=5,
                     alpha=0.9 if hot else 0.6)
        for st in strands:
            if len(st) < 2:
                continue
            # back half dimmer: split into segments by depth
            for j in range(len(st) - 1):
                z = (st[j][2] + st[j + 1][2]) / 2
                polyline(im, [st[j][:2], st[j + 1][:2]], color=INK, width=9, alpha=0.45 + 0.55 * (z + 1) / 2)

    def folder(im, c, p, sp):
        x, y = c
        fw, fh = 560, 680
        poly(im, [(x - fw / 2, y - fh / 2 + 40), (x - fw / 2 + 200, y - fh / 2 + 40), (x - fw / 2 + 230, y - fh / 2),
                  (x - fw / 2 + 400, y - fh / 2), (x - fw / 2 + 430, y - fh / 2 + 40), (x + fw / 2, y - fh / 2 + 40),
                  (x + fw / 2, y + fh / 2), (x - fw / 2, y + fh / 2)], fill=(52, 54, 60), outline=(110, 114, 122), width=3,
             alpha=p)
        for j in range(3):
            hline(im, x - fw / 2 + 50, x + fw / 2 - 50 - j * 80, y + 140 + j * 50, color=(88, 92, 100), width=4, alpha=p)
        stamp(im, 'CASE FILE', (x, y - 70), sp, color=AMBER, rot=-7, alpha=0.95)

    def fg(im, sec, u):
        y = CY - 40
        p0 = p_in(sec, TT[0], 0.5)
        if p0 > 0:
            bag(im, (XS[0], y), p0)
        swab(im, (XS[1], y), p_io(sec, TT[1], 0.6))
        helix(im, (XS[2], y), p_io(sec, TT[2], 0.5), sec)
        p3 = p_in(sec, TT[3], 0.45)
        if p3 > 0:
            folder(im, (XS[3], y), p3, p_in(sec, TT[3] + 0.42, 0.22))
        for j in range(3):
            pa = p_io(sec, TT[j + 1] - 0.25, 0.35)
            dashed(im, (XS[j] + 330, y), (XS[j + 1] - 330, y), color=AMBER, width=4, dash=16, gap=14, p=pa,
                   phase=-sec * 40, alpha=0.8)
            if pa >= 1:
                ex = XS[j + 1] - 330
                poly(im, [(ex - 22, y - 16), (ex + 6, y), (ex - 22, y + 16)], fill=AMBER, alpha=0.9)
        for j in range(4):
            build_label(im, LB[j], (XS[j], y + 470), sec, TL[j], size=32, tracking=0.2, anchor='ms',
                        color=AMBER if j == 3 else DIM)

    render('M_DNA', 4.9, fg, cam=Cam(z=(1.02, 1.1), pan=((-0.01, 0.0), (0.03, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='RECONSTRUCTION', tag_t0=-0.4)


# ---------------------------------------------------------------------------- Ch5: the tenant returns

@clip('M_DATE_21FEB', 2.8, 'S39', 'date card "FRIDAY · 21 FEBRUARY 2003" + "FIVE DAYS AFTER THE HEIST" in at 0.2; a week strip Sat 15 - Fri 21 counts +1..+5 from the heist weekend (FACTS 1, 28)')
def m_date_21feb(stills=None):
    DAYS = [('SAT', 15), ('SUN', 16), ('MON', 17), ('TUE', 18), ('WED', 19), ('THU', 20), ('FRI', 21)]
    cw, gap, ch = 270, 26, 230
    gx0 = CX - (7 * cw + 6 * gap) / 2
    gy = CY + 120

    def fg(im, sec, u):
        build_text(im, 'FRIDAY · 21 FEBRUARY 2003', (CX, CY - 200), sec, -0.05, size=150, anchor='ms', color=INK)
        build_label(im, 'five days after the heist', (CX, CY - 70), sec, -0.05, size=40, tracking=0.22, anchor='ms',
                    color=AMBER)
        for k, (dname, dd) in enumerate(DAYS):
            x = gx0 + k * (cw + gap)
            pc = p_in(sec, 0.3 + 0.04 * k, 0.35)
            if pc <= 0:
                continue
            heist = k < 2
            hot = k == 6
            ph = p_in(sec, 0.75 + 0.16 * (k - 2), 0.3) if k >= 2 else 0.0
            ha = p_in(sec, 1.4, 0.35) if hot else 0.0
            rect(im, (x, gy, x + cw, gy + ch), fill=(40, 41, 47) if heist else BG2, alpha=0.95 * pc, radius=8)
            rect(im, (x, gy, x + cw, gy + ch), outline=mix(FAINT, AMBER, ha), width=3, alpha=pc, radius=8, glow=10 * ha)
            if hot:
                rect(im, (x, gy, x + cw, gy + ch), fill=AMBER, alpha=0.12 * ha, radius=8)
            label(im, dname, (x + 30, gy + 58), size=28, color=mix(DIM, AMBER, ha), alpha=pc, tracking=0.16)
            text(im, str(dd), (x + 30, gy + 190), size=110, color=mix(INK if not heist else DIM, AMBER, ha), alpha=pc)
            if ph > 0:
                label(im, f'+{k - 1}', (x + cw - 28, gy + 58), size=28, color=AMBER if hot else DIM, alpha=ph,
                      anchor='rs', tracking=0.06)
        pb = p_io(sec, 0.6, 0.4)
        hline(im, gx0, gx0 + 2 * cw + gap, gy + ch + 40, color=DIM, width=3, p=pb)
        build_label(im, 'the heist', (gx0, gy + ch + 100), sec, 0.7, size=30, tracking=0.2)

    render('M_DATE_21FEB', 2.8, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.006, 0.006), (0.006, -0.004))),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills)


@clip('M_DETECTIVES', 5.9, 'S39', 'two name cards, no faces: AGIM DE BRUYCKER 0.8 / PATRICK PEYS 2.0 / "DIAMOND SQUAD · ANTWERP POLICE" 3.0 (VO S39)')
def m_detectives(stills=None):
    blocks = [(820, 'AGIM', 'DE BRUYCKER', 0.8), (2320, 'PATRICK', 'PEYS', 2.0)]
    y0 = CY - 120

    def fg(im, sec, u):
        for x, a, b, tl in blocks:
            t0 = tl - 0.3
            vline(im, x - 60, y0 - 130, y0 + 250, color=AMBER, width=5, p=p_io(sec, t0 - 0.1, 0.5), glow=4)
            build_label(im, 'detective', (x, y0 - 90), sec, t0, size=32, tracking=0.2)
            build_text(im, a, (x, y0 + 50), sec, t0 + 0.06, size=124, color=INK)
            build_text(im, b, (x, y0 + 200), sec, t0 + 0.12, size=124, color=INK)
        hline(im, 760, 3080, y0 + 360, color=FAINT, width=3, p=p_io(sec, 2.7, 0.6))
        build_label(im, 'diamond squad · antwerp police', (760, y0 + 450), sec, 2.8, size=44, tracking=0.22, color=INK)

    render('M_DETECTIVES', 5.9, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.012, 0.008), (0.01, -0.006)), lin=0.5),
           bg=backdrop(grid=False, glow=(0.45, 0.5)), stills=stills)


@clip('M_SENTENCES', 9.0, 'S40', '"2005 · APPEALS COURT, ANTWERP": tenant card 10 YEARS at 1.1; four cards enter at 3.7 as silhouettes, revealed SPEEDY 6.2 / THE MONSTER 7.0 / THE GENIUS 7.9, "5 YEARS EACH" by 8.0; King of Keys card stays blank; DRAMATIZATION tag (VO S40, FACTS 30)')
def m_sentences(stills=None):
    cw, ph, th, gap = 560, 700, 300, 48
    x0 = (W2 - (5 * cw + 4 * gap)) / 2
    y0 = CY - (ph + th) / 2 - 20
    CARDS = [('tenant', None, 1.1), ('speedy', 'SPEEDY', 6.2), ('monster', 'THE MONSTER', 7.0),
             ('genius', 'THE GENIUS', 7.9), ('king', None, None)]

    def gx(k, sec):
        n_eff = 1 + 4 * p_io(sec, 3.25, 0.75)          # the tenant card glides left as the four arrive
        return CX - (n_eff * cw + (n_eff - 1) * gap) / 2 + k * (cw + gap)

    def card(im, k, sec):
        who, nick, tr = CARDS[k]
        x = gx(k, sec)
        ta = p_in(sec, 0.55, 0.55) if k == 0 else p_in(sec, 3.3 + 0.08 * (k - 1), 0.5)
        if ta <= 0:
            return
        y = y0 + (1 - ta) * 80
        rv = 1.0 if k == 0 else (p_io(sec, tr - 0.4, 0.5) if tr else 0.0)
        rect(im, (x, y, x + cw, y + ph + th), fill=BG2, alpha=0.96 * ta, radius=6)
        composite(im, fade(face_tile(who, cw, ph, G.seg(sec, 0.0, 9.0), ghost=1.0 - rv), ta), x, y)
        rect(im, (x, y, x + cw, y + ph + th), outline=FAINT, width=2, alpha=ta, radius=6)
        if k == 0:
            label(im, 'leonardo notarbartolo', (x + 34, y + ph + 64), size=28, color=INK, alpha=ta, tracking=0.12)
            q = p_in(sec, 0.85, 0.35)
            text(im, '10 YEARS', (x + 34, y + ph + 180), size=100, color=AMBER, alpha=q, dy=(1 - q) * 16, blur=(1 - q) * 5)
            label(im, 'for organising the heist', (x + 34, y + ph + 240), size=26, alpha=q, tracking=0.08)
        elif tr is None:
            hline(im, x + 34, x + 200, y + ph + 150, color=(60, 63, 70), width=3, alpha=ta)     # stays blank
        else:
            hline(im, x + 34, x + 200, y + ph + 150, color=(60, 63, 70), width=3, alpha=ta * (1 - rv))
            q = p_in(sec, tr - 0.25, 0.35)
            if q > 0:
                label(im, nick, (x + 34, y + ph + 64), size=30, color=INK, alpha=q, tracking=0.14)
                text(im, '5 YEARS', (x + 34, y + ph + 180), size=100, color=INK, alpha=q, dy=(1 - q) * 16,
                     blur=(1 - q) * 5)

    def fg(im, sec, u):
        build_label(im, '2005 · appeals court, antwerp', (gx(0, sec), y0 - 110), sec, -0.3, size=38, tracking=0.2,
                    color=INK)
        for k in range(5):
            card(im, k, sec)
        # the bracket under the three
        bx0, bx1 = gx(1, sec), gx(4, sec) - gap
        yb = y0 + ph + th + 50
        pb = p_io(sec, 7.55, 0.5)
        hline(im, bx0, bx1, yb, color=DIM, width=3, p=pb)
        if pb > 0:
            vline(im, bx0, yb - 30, yb, color=DIM, width=3, p=pb)
            vline(im, bx1, yb - 30, yb, color=DIM, width=3, p=pb)
        build_text(im, '5 YEARS EACH', ((bx0 + bx1) / 2, yb + 110), sec, 7.75, size=72, color=INK, anchor='ms')

    render('M_SENTENCES', 9.0, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.008, -0.004), (0.008, 0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='DRAMATIZATION', tag_t0=-0.4)


@clip('M_NEVER', 4.5, 'S41', '"KING OF KEYS - NEVER IDENTIFIED" on at the start; "THE DIAMONDS" 1.0, "almost all of them" 1.8, "NEVER FOUND" (red) 2.6 (VO S41)')
def m_never(stills=None):
    gx = CX - 40
    rows = [('KING OF KEYS', 'NEVER IDENTIFIED', CY - 170, -0.45, -0.25, ''),
            ('THE DIAMONDS', 'NEVER FOUND', CY + 190, 0.8, 2.2, 'almost all of them')]

    def fg(im, sec, u):
        for subj, st, y, t0, ts, sub in rows:
            build_text(im, subj, (gx - 90, y), sec, t0, size=128, anchor='rs', color=INK)
            hline(im, gx - 30, gx + 30, y - 46, color=RED, width=8, p=p_io(sec, ts - 0.15, 0.3), glow=6)
            pw = p_io(sec, ts, 0.4)
            if pw > 0:
                text(im, st, (gx + 90, y), size=128, color=RED, wipe=pw, alpha=1.0)
                text(im, st, (gx + 90, y), size=128, color=RED, wipe=pw, alpha=0.35 * (1 - G.seg(sec, ts + 0.45, ts + 1.0)),
                     blur=14)
            if sub:
                build_label(im, sub, (gx - 94, y + 80), sec, 1.6, size=36, tracking=0.12, weight='Regular', anchor='rs')

    render('M_NEVER', 4.5, fg, cam=Cam(z=(1.0, 1.075), pan=((0.0, -0.01), (0.0, 0.01))),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.18), stills=stills)


@clip('M_CASECLOSED', 5.6, 'S42', '"CASE CLOSED" stamp 0.1, "SIX YEARS LATER" 1.6, year rolls 2003 -> 2009 at 2.2-3.0, then 2009 holds with a slow drift to the end (editor cuts ~4.1) (VO S42)')
def m_caseclosed(stills=None):
    def roll(im, v, xy, size=260, color=AMBER):
        """2 0 0 + an odometer last digit at value v (3.0 .. 9.0)."""
        f = G.font(size, 'SemiBold', True)
        dw = max(f.getlength(c) for c in '0123456789')
        x0 = xy[0] - 2 * dw
        for j, c in enumerate('200'):
            text(im, c, (x0 + (j + 0.5) * dw, xy[1]), size=size, color=color, anchor='ms')
        base = int(math.floor(v))
        fr = v - base
        pitch = size * 1.15
        tw, th = int(dw + 20), int(size * 1.6)
        tile = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
        for m in (0, 1):
            dgt = base + m
            if dgt > 9:
                continue
            yb = th * 0.5 + size * 0.36 + (m - fr) * pitch
            text(tile, str(dgt), (tw / 2, yb), size=size, color=color, anchor='ms')
        arr = np.asarray(tile).astype(np.float32)
        yy = np.abs(np.arange(th, dtype=np.float32) - th / 2) / (th / 2)
        arr[..., 3] *= np.clip((0.8 - yy) / 0.3, 0, 1)[:, None]
        composite(im, Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), x0 + 3 * dw - 10,
                  xy[1] - size * 0.36 - th * 0.5)

    def fg(im, sec, u):
        # the file under the stamp
        pf = p_in(sec, -0.5, 0.4)
        fx0, fy0, fx1, fy1 = CX - 1000, CY - 640, CX + 1000, CY + 120
        rect(im, (fx0, fy0, fx1, fy1), fill=(30, 31, 36), outline=(70, 74, 82), width=3, radius=10, alpha=pf)
        label(im, 'antwerp diamond centre · february 2003', (fx0 + 70, fy0 + 100), size=32, tracking=0.18, alpha=pf)
        for j in range(3):
            hline(im, fx0 + 70, fx1 - 70 - j * 260, fy0 + 180 + j * 56, color=(62, 66, 74), width=4, alpha=pf)
        ps = p_in(sec, -0.1, 0.2)
        if ps > 0:
            # a small jolt on impact
            jolt = math.sin(G.seg(sec, 0.1, 0.4) * math.pi * 3) * (1 - G.seg(sec, 0.1, 0.4)) * 6
            stamp_big(im, 'CASE CLOSED', (CX, CY - 250 + jolt), ps)
        pv = p_in(sec, 1.15, 0.35)
        if pv > 0:
            v = 3.0 + 6.0 * G.seg(sec, 2.2, 3.0)
            b_ = math.floor(v)
            v = min(9.0, b_ + G.ease(G.seg(v - b_, 0.35, 1.0)))     # click from year to year
            roll(im, v, (CX, CY + 560))
            build_label(im, 'six years later', (CX, CY + 700), sec, 1.4, size=40, tracking=0.22, anchor='ms', color=INK)

    render('M_CASECLOSED', 5.6, fg, cam=Cam(z=(1.0, 1.08), pan=((0.0, -0.012), (0.0, 0.014)), lin=0.5),
           bg=backdrop(grid=False, glow=(0.5, 0.5)), stills=stills)


@functools.lru_cache(maxsize=4)
def _stamp_big_tile(s):
    size = 190
    w, a, d = tsize(s, size, 'Bold', True, 0.08)
    bw, bh = int(w + 140), int(0.727 * size + 130)
    t = Image.new('RGBA', (bw + 60, bh + 60), INK + (0,))
    dd = ImageDraw.Draw(t)
    dd.rectangle([30, 30, 30 + bw, 30 + bh], outline=INK + (255,), width=12)
    tile, pad, tw, asc, desc = _text_tile(s, size, 'Bold', True, 0.08, INK)
    t.alpha_composite(tile, (int(30 + bw / 2 - tw / 2 - pad), int(30 + bh / 2 + 0.727 * size / 2 - asc - pad)))
    rng = np.random.default_rng(4)
    arr = np.asarray(t).copy()
    noise = Image.fromarray((rng.random((arr.shape[0] // 3, arr.shape[1] // 3)) * 255).astype(np.uint8)).resize(
        (arr.shape[1], arr.shape[0]), Image.BILINEAR)
    nz = np.asarray(noise).astype(np.float32) / 255
    speck = rng.random(arr.shape[:2])
    arr[..., 3] = (arr[..., 3] * np.clip(0.55 + nz * 0.7, 0, 1) * np.where(speck < 0.1, 0.2, 1.0)).astype(np.uint8)
    return Image.fromarray(arr).filter(ImageFilter.GaussianBlur(0.8))


def stamp_big(im, s, c, p, rot=-4.0):
    t = _stamp_big_tile(s)
    k = 1.0 + 0.45 * (1 - p)
    t = t.resize((int(t.width * k), int(t.height * k)), Image.BICUBIC).rotate(rot, Image.BICUBIC, expand=True)
    composite(im, fade(t, 0.92 * min(1.0, p * 1.5)), c[0] - t.width / 2, c[1] - t.height / 2)


# ---------------------------------------------------------------------------- Ch6-7: two stories

@clip('M_WIRED', 6.6, 'S43', 'typographic citation, no logo: "2009" 0.6 / "Notarbartolo talks" / "to the journalist" / "Joshua Davis," 4.0 / "for Wired." 5.2 (VO S43)')
def m_wired(stills=None):
    x0 = 1000
    y0 = CY - 300
    WORDS = [('to', 2.9, 0.82), ('the', 3.0, 0.82), ('journalist', 3.15, 0.82), ('Joshua', 4.0, 1.0), ('Davis,', 4.1, 1.0),
             ('for', 5.2, 0.82), ('Wired.', 5.3, 1.0)]

    def fg(im, sec, u):
        vline(im, x0 - 90, y0 - 160, y0 + 470, color=AMBER, width=6, p=p_io(sec, -0.3, 0.7), glow=5)
        build_text(im, '2009', (x0, y0), sec, 0.4, size=170, color=AMBER)
        x = x0
        for j, w_ in enumerate(['Notarbartolo', 'talks']):
            build_text(im, w_, (x, y0 + 230), sec, 1.3 + 0.3 * j, size=150, color=INK)
            x += tsize(w_ + ' ', 150)[0]
        x = x0
        for w_, tl, al in WORDS:
            build_text(im, w_, (x, y0 + 380), sec, tl - 0.2, size=76, weight='Regular', display=False, color=INK, alpha=al)
            x += tsize(w_ + ' ', 76, 'Regular', False)[0]

    render('M_WIRED', 6.6, fg, cam=Cam(z=(1.0, 1.08), pan=((-0.01, 0.006), (0.008, -0.006)), lin=0.5),
           bg=backdrop(grid=False, glow=(0.4, 0.5)), stills=stills)


PANEL_L = (200, 330, 1870, 1880)
PANEL_R = (1970, 330, 3640, 1880)
HIS = ['he wasn’t the mastermind',
       'a diamond dealer hired the crew to stage a robbery for the insurance',
       'they rehearsed in a replica vault, to work in the dark',
       'the bags were nearly empty: “20 million, not 100”']


def wrap(s_, size, maxw, weight='SemiBold', display=True):
    lines, cur = [], ''
    for w_ in s_.split(' '):
        t_ = (cur + ' ' + w_).strip()
        if not cur or tsize(t_, size, weight, display)[0] <= maxw:
            cur = t_
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def panel_frame(im, box, title, sub, alpha=1.0, active=True, p_head=1.0, accent=1.0):
    x0, y0, x1, y1 = box
    rect(im, box, fill=(24, 24, 28), alpha=0.9 * alpha, radius=10)
    rect(im, box, outline=(92, 96, 104) if active else (64, 68, 76), width=2, alpha=alpha, radius=10)
    if active:
        hline(im, x0, x0 + 260, y0, color=AMBER, width=6, p=accent, glow=5)
    if title:
        text(im, title, (x0 + 110, y0 + 170), size=100, color=INK, alpha=alpha * p_head, dy=(1 - p_head) * 20,
             blur=(1 - p_head) * 5)
    if sub:
        label(im, sub, (x0 + 110, y0 + 235), size=30, alpha=alpha * p_head, tracking=0.14)


def his_rows(im, sec, t_rows, alpha=1.0, strikes=None):
    """the four 'he says' claims in the left panel; rows without a time stay as placeholder rules."""
    x0, y0, x1, y1 = PANEL_L
    tx = x0 + 110
    for j, s_ in enumerate(HIS):
        ys = y0 + 330 + j * 290
        t_ = t_rows[j] if t_rows else None
        p = p_in(sec, t_, 0.45) if t_ is not None else 0.0
        if p <= 0:
            hline(im, tx, x1 - 110, ys + 100, color=(50, 53, 60), width=2, alpha=alpha * 0.8)
            continue
        label(im, 'he says', (tx, ys + 30), size=28, color=AMBER if alpha > 0.7 else DIM, alpha=alpha * p, tracking=0.2)
        lines = wrap(s_, 62, x1 - x0 - 200)
        for li, ln in enumerate(lines):
            text(im, ln, (tx, ys + 112 + li * 80), size=62, color=INK, alpha=alpha * p, dy=(1 - p) * 14, blur=(1 - p) * 5)
        if strikes and strikes.get(j, 0) > 0:
            for li, ln in enumerate(lines):
                hline(im, tx - 10, tx + 10 + tsize(ln, 62)[0], ys + 112 + li * 80 - 22, color=INK, width=5,
                      p=strikes[j], alpha=0.85)


def evi_rows_placeholder(im, alpha=1.0):
    x0, y0, x1, y1 = PANEL_R
    for j in range(4):
        hline(im, x0 + 110, x1 - 110, y0 + 330 + j * 290 + 100, color=(50, 53, 60), width=2, alpha=alpha * 0.8)


@clip('M_HISSTORY', 8.2, 'S44', 'split frame, left panel "HIS STORY" (according to Notarbartolo, 2009): HE SAYS he wasn\'t the mastermind 0.1 / HE SAYS a diamond dealer hired the crew to stage a robbery for the insurance 2.6; rows 3-4 wait; right panel waits (VO S44)')
def m_hisstory(stills=None):
    def fg(im, sec, u):
        ph = p_in(sec, -0.45, 0.4)
        panel_frame(im, PANEL_L, 'HIS STORY', 'according to Notarbartolo, 2009', alpha=ph, p_head=ph)
        his_rows(im, sec, [-0.2, 2.35, None, None], alpha=ph)
        pr = p_in(sec, -0.3, 0.6)
        panel_frame(im, PANEL_R, 'THE EVIDENCE', 'investigators', alpha=0.28 * pr, active=False)
        evi_rows_placeholder(im, alpha=0.28 * pr)

    render('M_HISSTORY', 8.2, fg, cam=Cam(z=(1.0, 1.05), pan=((-0.012, 0.004), (-0.006, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.3, 0.5)), stills=stills)


@clip('M_20vs100', 3.9, 'S44', 'his words as two bars to scale: HE SAYS "20 MILLION" at 0 / "NOT 100" at 1.9 (reported loss: at least $100 million, an estimate, FACTS 4); footnote: his figure about EUR 18 million (FACTS 33) (VO S44)')
def m_20vs100(stills=None):
    bx0, bx1 = 640, 2700
    ya, yb = CY - 200, CY + 330
    frac = 20 / 100

    def fg(im, sec, u):
        build_label(im, 'he says', (bx0, ya - 170), sec, -0.5, size=34, tracking=0.2, color=AMBER)
        pa = p_io(sec, -0.45, 0.5)
        rect(im, (bx0, ya - 110, bx1, ya), outline=(52, 55, 62), width=2, alpha=0.8 * p_in(sec, -0.5, 0.3), radius=4)
        if pa > 0:
            rect(im, (bx0, ya - 110, bx0 + (bx1 - bx0) * frac * pa, ya), fill=(200, 206, 214), alpha=0.95, radius=4)
        build_text(im, '“20 MILLION”', (bx0 + (bx1 - bx0) * frac + 50, ya - 8), sec, -0.3, size=140, color=INK)
        # not a hundred
        rect(im, (bx0, yb - 110, bx1, yb), outline=(52, 55, 62), width=2, alpha=0.8 * p_in(sec, 1.4, 0.3), radius=4)
        pb = p_io(sec, 1.6, 0.8)
        if pb > 0:
            rect(im, (bx0, yb - 110, bx0 + (bx1 - bx0) * pb, yb), fill=AMBER, alpha=0.95, radius=4, glow=10 * pb)
        build_text(im, '“NOT 100”', (bx1 + 50, yb - 8), sec, 1.7, size=140, color=AMBER)
        build_label(im, 'reported loss: at least $100 million · an estimate', (bx0, yb - 170), sec, 2.2, size=34,
                    tracking=0.14, color=INK)
        build_label(im, 'his figure: about €18 million (WIRED, 2009) · bars to scale', (bx0, yb + 150), sec, 2.6,
                    size=30, tracking=0.06, weight='Regular')

    render('M_20vs100', 3.9, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.01, 0.006), (0.004, -0.004))),
           bg=backdrop(grid=True, glow=(0.45, 0.5)), stills=stills)


def tabnum_w(s, size, weight='SemiBold', display=True):
    f = G.font(size, weight, display)
    dw = max(f.getlength(c) for c in '0123456789')
    return sum(dw if c.isdigit() else f.getlength(c) for c in s)


@clip('M_EVIDENCESTORY', 3.2, 'S45', 'split frame: his claims dimmed left; "ONE PROBLEM" 0.6, then the right panel lights at 1.5 as a title card: large "THE EVIDENCE" / "the crime scene" (no rows; the next shots show the evidence) (VO S45)')
def m_evidencestory(stills=None):
    x0, y0, x1, y1 = PANEL_R
    pcx, pcy = (x0 + x1) / 2, (y0 + y1) / 2

    def fg(im, sec, u):
        dimk = 1 - 0.55 * p_io(sec, -0.4, 0.6)
        panel_frame(im, PANEL_L, 'HIS STORY', 'according to Notarbartolo, 2009', alpha=dimk, active=False)
        his_rows(im, 99, [0, 0, 0, 0], alpha=dimk)
        pl = p_in(sec, 1.3, 0.45)
        panel_frame(im, PANEL_R, '', '', alpha=0.3 + 0.7 * pl, active=pl > 0, accent=p_io(sec, 1.3, 0.5))
        # "one problem" lands big in the empty panel, then steps up into its kicker as THE EVIDENCE arrives
        p1 = p_in(sec, 0.4, 0.4)
        mv = p_io(sec, 1.05, 0.4)
        if p1 > 0 and mv < 1:
            text(im, 'ONE PROBLEM', (pcx, pcy + 10 - mv * 160), size=130, color=INK, alpha=p1 * (1 - mv), anchor='ms',
                 dy=(1 - p1) * 20, blur=(1 - p1) * 5 + mv * 6)
        label(im, 'one problem', (x0 + 4, y0 - 36), size=30, color=AMBER, alpha=mv, tracking=0.2)
        # the panel is a title card: nothing else in it
        build_text(im, 'THE EVIDENCE', (pcx, pcy + 10), sec, 1.3, size=176, color=INK, anchor='ms')
        hline(im, pcx - 110, pcx + 110, pcy + 80, color=AMBER, width=5, p=p_io(sec, 1.5, 0.45), glow=4)
        build_label(im, 'the crime scene', (pcx, pcy + 170), sec, 1.55, size=44, tracking=0.24, anchor='ms', color=INK)

    render('M_EVIDENCESTORY', 3.2, fg, cam=Cam(z=(1.0, 1.05), pan=((0.006, 0.004), (0.012, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.7, 0.5)), stills=stills)


@clip('M_QUOTE', 9.2, 'S46', 'attribution "AGIM DE BRUYCKER · lead detective" 0.4; the quote (FACTS 34) "Not one detail of Leo\'s story can be confirmed by the facts in the investigation." builds word by word 3.4-7.5')
def m_quote(stills=None):
    lines = [[('Not one detail', AMBER), (' of Leo’s story', INK)],
             [('can be confirmed by the facts', INK)],
             [('in the investigation.', INK)]]
    size, lh = 128, 170
    x0 = 1020
    y0 = CY - 60
    words = []
    for li, parts in enumerate(lines):
        x = x0
        for s_, col in parts:
            for w_ in s_.strip().split(' '):
                if x > x0:
                    x += tsize(' ', size)[0]
                words.append((w_, col, x, y0 + li * lh))
                x += tsize(w_, size)[0]
    T0, T1 = 3.4, 7.5

    def fg(im, sec, u):
        pa = p_in(sec, 0.15, 0.45)
        mv = p_io(sec, 2.75, 0.7)
        morph(im, (('AGIM DE BRUYCKER ', 120, 'SemiBold', True, INK), ('· lead detective', 78, 'Regular', False, DIM)),
              (CX, CY - 20), (x0, y0 - 380), 80 / 120, mv, alpha=pa, dy=(1 - pa) * 30, blur=(1 - pa) * 6)
        hline(im, x0, x0 + 200, y0 - 320, color=AMBER, width=5, p=p_io(sec, 3.2, 0.5), glow=4)
        pq = p_in(sec, 3.0, 0.5)
        text(im, '“', (x0 - 50, y0 + 120), size=400, color=AMBER, alpha=0.9 * pq, anchor='rs', dy=(1 - pq) * 30)
        for k, (w_, col, x, y) in enumerate(words):
            tl = T0 + (T1 - T0) * k / (len(words) - 1)
            build_text(im, w_, (x, y), sec, tl - 0.25, size=size, color=col, dur=0.4)
        build_label(im, 'quoted in the Columbia Journalism Review', (x0, y0 + 3 * lh + 30), sec, 7.9, size=28,
                    tracking=0.12)

    render('M_QUOTE', 9.2, fg, cam=Cam(z=(1.0, 1.08), pan=((-0.008, 0.008), (0.008, -0.006)), lin=0.5),
           bg=backdrop(grid=False, glow=(0.4, 0.45)), stills=stills)


@clip('M_TWOPATHS', 16.3, 'S47', 'continuous fork (editor shows 0-7.3 and 11.0-15.9): "SO WHY TELL IT?" 0 / IF IT\'S TRUE -> the real crime happened inside the building 1.6 / -> HE\'S THE FALL GUY 6.2 / IF IT ISN\'T fully on by 11.0 / -> A VERY CONVENIENT STORY 11.5 / for the one man who knows where the rest went 14.4 (VO S47)')
def m_twopaths(stills=None):
    sx, fx, ex = 520, 1180, 1800
    yt = CY + 150
    yu, yd = CY - 200, CY + 540
    tx = ex + 200
    LINEC = (150, 156, 166)

    def curve(a, b, n=40):
        pts = []
        for j in range(n + 1):
            t_ = j / n
            e = t_ * t_ * (3 - 2 * t_)
            pts.append((lerp(a[0], b[0], t_), lerp(a[1], b[1], e)))
        return pts

    def branch(im, sec, yy, t_draw):
        pts = curve((fx, yt), (ex, yy))
        pl = p_io(sec, t_draw, 0.7)
        polyline(im, pts + [(ex + 120, yy)], color=LINEC, width=5, p=pl)
        if pl >= 0.98:
            poly(im, [(ex + 120, yy - 18), (ex + 150, yy), (ex + 120, yy + 18)], fill=LINEC)

    def fg(im, sec, u):
        build_text(im, 'SO WHY TELL IT?', (440, 470), sec, -0.4, size=120, color=INK)
        build_label(im, 'his story', (sx, yt - 60), sec, -0.3, size=34, tracking=0.2)
        circle(im, (sx, yt), 14, fill=INK, alpha=p_in(sec, -0.4, 0.3))
        polyline(im, [(sx, yt), (fx, yt)], color=LINEC, width=5, p=p_io(sec, -0.2, 0.9))
        pf = p_in(sec, 0.6, 0.3)
        if pf > 0:
            pulse = 0.5 + 0.5 * math.sin(sec * 3.0)
            circle(im, (fx, yt), 20, fill=AMBER, alpha=pf, glow=10 + 6 * pulse)
        # path A
        branch(im, sec, yu, 0.9)
        build_label(im, 'if it’s true', (tx, yu - 140), sec, 1.35, size=40, tracking=0.2, color=AMBER)
        build_text(im, 'the real crime happened inside the building', (tx, yu - 52), sec, 1.5, size=56,
                   weight='Regular', display=False, color=INK, alpha=0.88)
        build_text(im, '→ HE’S THE FALL GUY', (tx, yu + 90), sec, 5.95, size=100, color=INK)
        # path B (on screen before the editor comes back at 11.0)
        branch(im, sec, yd, 9.8)
        build_label(im, 'if it isn’t', (tx, yd - 130), sec, 10.35, size=40, tracking=0.2, color=AMBER)
        build_text(im, '→ A VERY CONVENIENT STORY', (tx, yd - 20), sec, 11.25, size=100, color=INK)
        build_text(im, 'for the one man who knows where the rest went', (tx, yd + 86), sec, 14.15, size=56,
                   weight='Regular', display=False, color=INK, alpha=0.88)

    render('M_TWOPATHS', 16.3, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.006, -0.008), (0.006, 0.012)), lin=0.6),
           bg=backdrop(grid=True, glow=(0.45, 0.5)), stills=stills)


@clip('M_QUESTION', 9.0, 'S52', 'end question: "SO WHAT DO YOU THINK?" 0.4 / "THE MASTERMIND" 2.9 / "or" 3.9 / "THE FALL GUY?" 4.2; small "Tell us in the comments"; slow drift to the end (VO S52)')
def m_question(stills=None):
    size = 210
    f = G.font(size, 'SemiBold', True)

    def letters(im, s_, xc, y, sec, t_land, colf):
        w = f.getlength(s_)
        x0 = xc - w / 2
        n = len(s_)
        for i, ch in enumerate(s_):
            if ch == ' ':
                continue
            p = p_in(sec, t_land - 0.42 + 0.018 * (i - n / 2), 0.45)
            if p <= 0:
                continue
            text(im, ch, (x0 + f.getlength(s_[:i]), y), size=size, color=colf(i, ch), alpha=p, dy=(1 - p) * 50,
                 blur=(1 - p) * 8)

    def fg(im, sec, u):
        pa = p_in(sec, 0.15, 0.45)
        mv = p_io(sec, 1.7, 0.55)
        wq = line_tile((('SO WHAT DO YOU THINK?', 140, 'SemiBold', True, INK),))[0].width - 80
        morph(im, (('SO WHAT DO YOU THINK?', 140, 'SemiBold', True, INK),), (CX, CY - 20), (CX - wq * 0.45 / 2, CY - 400),
              0.45, mv, alpha=pa, dy=(1 - pa) * 30, blur=(1 - pa) * 6)
        letters(im, 'THE MASTERMIND', CX, CY - 110, sec, 2.9, lambda i, c: INK)
        build_text(im, 'or', (CX, CY + 40), sec, 3.7, size=90, anchor='ms', color=DIM)
        letters(im, 'THE FALL GUY?', CX, CY + 290, sec, 4.2, lambda i, c: AMBER if c == '?' else INK)
        build_label(im, 'tell us in the comments', (CX, CY + 470), sec, 5.6, size=36, tracking=0.2, anchor='ms')

    render('M_QUESTION', 9.0, fg, cam=Cam(z=(1.0, 1.1), pan=((0.0, 0.01), (0.0, -0.006)), lin=0.6),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.26), stills=stills)


# ============================================================================ main

def main():
    args = sys.argv[1:]
    stills = None
    if '--stills' in args:
        i = args.index('--stills')
        stills = [float(v) for v in args[i + 1].split(',')]
        args = args[:i] + args[i + 2:]
    ids = list(CLIPS) if (not args or args == ['all']) else args
    for cid in ids:
        if cid not in CLIPS:
            print(f'[mg] unknown clip {cid}; known: {", ".join(CLIPS)}')
            continue
        fn, sec, beat, note = CLIPS[cid]
        fn(stills=stills)
        if not stills:
            manifest(cid, sec, beat, note)


if __name__ == '__main__':
    main()
