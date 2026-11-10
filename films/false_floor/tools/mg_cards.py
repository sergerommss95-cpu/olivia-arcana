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

@clip('M_MAZAL', 2.5, 'S05', 'the word "mazal" set large, amber underline draws, label "the word that closes a deal" (VO S05)')
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

    render('M_MAZAL', 2.5, fg, cam=Cam(z=(1.0, 1.075), pan=((0.0, 0.012), (0.0, -0.004))),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.3), stills=stills)


@clip('M_RULE', 4.0, 'S06', '"NO OFFICE UPSTAIRS / NO BOX DOWNSTAIRS" with a building section (office floor -> vault, Level -2), amber link (VO S06)')
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
    y_up = (office[1] + office[3]) / 2
    y_dn = (vault[1] + vault[3]) / 2
    shaft_x = (bx0 + bx1) / 2

    def fg(im, sec, u):
        # ground line + earth hatch
        hline(im, bx0 - 220, bx1 + 150, yg, color=DIM, width=4, p=p_io(sec, 0.0, 0.5), alpha=0.9)
        ph = p_in(sec, 0.25, 0.6)
        if ph > 0:
            def hatch(d, X, S):
                for k in range(-12, 30):
                    xa = bx0 - 220 + k * 34
                    d.line([X(xa, yg + 4), X(xa - (ybot + 40 - yg), ybot + 40)], fill=rgba(FAINT), width=int(2 * S))
                d.rectangle([X(bx0 - 4, yg + 4), X(bx1 + 4, ybot + 4)], fill=(0, 0, 0, 0))
                d.rectangle([X(bx0 - 400, ybot + 40), X(bx1 + 400, ybot + 400)], fill=(0, 0, 0, 0))
            draw(im, (bx0 - 220, yg, bx1 + 150, ybot + 40), hatch, alpha=0.32 * ph)
        # walls rise and sink from the ground line
        pw = p_io(sec, 0.1, 0.6)
        for x in (bx0, bx1):
            vline(im, x, yg, ytop, color=DIM, width=4, p=pw)
            vline(im, x, yg, ybot, color=DIM, width=4, p=pw)
        hline(im, bx0, bx1, ytop, color=DIM, width=4, p=p_io(sec, 0.55, 0.3))
        hline(im, bx0, bx1, ybot, color=DIM, width=4, p=p_io(sec, 0.55, 0.3))
        for k in range(1, 4):
            hline(im, bx0, bx1, yg - k * fl, color=FAINT, width=3, p=p_io(sec, 0.35 + 0.07 * k, 0.35))
        hline(im, bx0, bx1, yg + fl, color=FAINT, width=3, p=p_io(sec, 0.45, 0.35))
        # windows on the other floors
        pwin = p_in(sec, 0.6, 0.5)
        for k in range(4):
            if k == 2:
                continue
            yy = yg - (k + 1) * fl + 52
            for j in (0, 1, 3, 4):
                xx = bx0 + 75 + j * 118
                rect(im, (xx, yy, xx + 74, yy + 62), outline=FAINT, width=2, alpha=0.8 * pwin)
        label(im, 'ground', (bx0 - 220, yg - 22), size=28, alpha=0.8 * p_in(sec, 0.5), tracking=0.14)
        label(im, 'level −1', (bx0 - 220, yg + fl / 2), size=28, alpha=0.8 * p_in(sec, 0.6), tracking=0.14, anchor='lm')
        label(im, 'level −2', (bx0 - 220, yg + 1.5 * fl), size=28, alpha=0.8 * p_in(sec, 0.7), tracking=0.14, anchor='lm')

        build_label(im, 'the rule', (tx, y_up - 150), sec, 0.3, size=34, tracking=0.2)
        # 1) the office
        po = p_in(sec, 0.55, 0.45)
        if po > 0:
            rect(im, office, fill=AMBER, alpha=0.10 * po)
            rect(im, office, outline=AMBER, width=4, alpha=po, glow=8 * po)
            label(im, 'office', (office[0] + 22, office[1] + 50), size=28, color=AMBER, alpha=po, tracking=0.16)
        build_text(im, 'NO OFFICE UPSTAIRS', (tx, y_up), sec, 0.5, size=136, anchor='lm', color=INK)
        # 2) the link down to the vault
        pl = p_io(sec, 1.25, 0.8)
        dashed(im, (shaft_x, office[3]), (shaft_x, vault[1]), color=AMBER, width=5, dash=20, gap=16, p=pl,
               phase=-sec * 30, glow=6)
        if pl > 0:
            circle(im, (shaft_x, office[3]), 9, fill=AMBER, alpha=min(1, pl * 4))
        hline(im, bx1 + 30, tx - 40, y_up, color=AMBER, width=3, p=p_io(sec, 0.85, 0.4), alpha=0.7)
        hline(im, bx1 + 30, tx - 40, y_dn, color=AMBER, width=3, p=p_io(sec, 2.05, 0.4), alpha=0.7)
        # 3) the vault
        pv = p_in(sec, 1.95, 0.45)
        if pv > 0:
            circle(im, (shaft_x, vault[1]), 9, fill=AMBER, alpha=pv)
            rect(im, vault, fill=AMBER, alpha=0.10 * pv)
            rect(im, vault, outline=AMBER, width=4, alpha=pv, glow=8 * pv)
            # the boxes
            gy0 = vault[1] + (vault[3] - vault[1]) / 2 - 38
            for r_ in range(2):
                for c_ in range(7):
                    q = p_in(sec, 2.1 + 0.03 * (c_ + r_ * 7), 0.3)
                    xx, yy = vault[2] - 30 - (7 - c_) * 40, gy0 + r_ * 40
                    rect(im, (xx, yy, xx + 32, yy + 32), outline=AMBER, width=2, alpha=0.75 * q)
            label(im, 'vault', (vault[0] + 22, vault[1] + 50), size=28, color=AMBER, alpha=pv, tracking=0.16)
        build_text(im, 'NO BOX DOWNSTAIRS', (tx, y_dn), sec, 2.1, size=136, anchor='lm', color=INK)

    render('M_RULE', 4.0, fg, cam=Cam(z=(1.02, 1.085), pan=((-0.012, 0.01), (0.008, -0.004))),
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
        build_label(im, 'the tenant', (tx, ty - 300), sec, 0.15, size=34, tracking=0.2)
        build_text(im, 'LEONARDO', (tx, ty - 130), sec, 0.3, size=150, color=INK)
        build_text(im, 'NOTARBARTOLO', (tx, ty + 40), sec, 0.42, size=150, color=INK)
        hline(im, tx, tx + 220, ty + 130, color=AMBER, width=6, p=p_io(sec, 0.75, 0.5), glow=6)
        build_text(im, 'tenant · Antwerp Diamond Centre · from 2000', (tx, ty + 240), sec, 0.95, size=48,
                   weight='Regular', display=False, color=INK, alpha=0.82)

    render('M_NAME_TENANT', 3.5, fg, cam=Cam(z=(1.0, 1.08), pan=((0.012, 0.0), (0.0, -0.01))),
           bg=backdrop(grid=False, glow=(0.68, 0.38), warm=0.3), mid_fn=mid, mid_depth=0.8, stills=stills,
           tag_text='DRAMATIZATION')


@clip('M_MONTHS', 3.5, 'S09', 'lease calendar 2000-2002: 36 month cells tick "PAID" in amber, accelerating; year counter rolls (VO S09 "He pays his rent on time")')
def m_months(stills=None):
    MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    cw, chh, gap, rgap, lab = 196, 150, 20, 36, 250
    gw = lab + 12 * cw + 11 * gap
    gx0 = (W2 - gw) / 2 + lab
    gy0 = CY - (3 * chh + 2 * rgap) / 2 + 120
    T0, T1 = 0.45, 2.85

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

    render('M_MONTHS', 3.5, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.02, -0.008), (0.018, 0.01))),
           bg=backdrop(grid=True, glow=(0.5, 0.45)), stills=stills)


# ---------------------------------------------------------------------------- crew dossier cards (M_CREW, M_GHOSTS)

CREW = [('genius', 'THE GENIUS', [('alarms', INK)]),
        ('monster', 'THE MONSTER', [('locks, wiring, driving', INK)]),
        ('king', 'THE KING OF KEYS', [('an old forger', INK), ('never identified', RED)]),
        ('speedy', 'SPEEDY', [('the nervous one', INK)])]
CARD_W, CARD_PH, CARD_TH, CARD_GAP = 640, 800, 300, 64
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


def crew_card(im, k, sec, appear, bright=1.0, ghost=0.0, stamp_p=0.0, inner=0.0, x=None):
    who, nick, roles = CREW[k]
    x = card_x(k, 4) if x is None else x
    y = CARD_Y0 + (1 - appear) * 90
    a = appear
    if a <= 0:
        return
    rect(im, (x, y, x + CARD_W, y + CARD_PH + CARD_TH), fill=BG2, alpha=0.96 * a, radius=6)
    # portrait with its own slow push
    src = portrait(who, True)
    sw, sh = src.size
    z = 1.0 + 0.06 * inner
    ch_ = sh * 0.80 / z
    cw_ = ch_ * CARD_W / CARD_PH
    cx_, cy_ = sw * 0.47, sh * 0.06 + sh * 0.40
    box = (cx_ - cw_ / 2, cy_ - ch_ / 2 - (sh * 0.40 - ch_ / 2) * 0.2, cx_ + cw_ / 2, cy_ + ch_ / 2 - (sh * 0.40 - ch_ / 2) * 0.2)
    face = src.resize((CARD_W, CARD_PH), Image.LANCZOS, box=box)
    base = portrait_ground(CARD_W, CARD_PH)
    base.alpha_composite(face)
    if ghost > 0:
        sil = portrait_ground(CARD_W, CARD_PH, warm=1.0 - ghost)
        s_ = Image.new('RGBA', face.size, (52, 55, 60, 255))
        s_.putalpha(face.getchannel('A'))
        sil.alpha_composite(s_)
        base = Image.blend(grade_grey(base, ghost), sil, min(1.0, ghost)) if ghost < 1.0 else sil
    if bright < 1.0:
        base = Image.blend(Image.new('RGBA', base.size, (20, 20, 23, 255)), base, bright)
    composite(im, fade(base, a), x, y)
    rect(im, (x, y, x + CARD_W, y + CARD_PH + CARD_TH), outline=FAINT, width=2, alpha=a, radius=6)
    ta = a * (0.55 + 0.45 * bright)
    label(im, f'no. {k + 1}', (x + 38, y + CARD_PH + 70), size=26, color=DIM, alpha=ta, tracking=0.18)
    text(im, nick, (x + 38, y + CARD_PH + 158), size=60, color=INK, alpha=ta)
    yy = y + CARD_PH + 228
    xx = x + 38
    for j, (r, col) in enumerate(roles):
        text(im, r, (xx, yy), size=38, weight='Regular', display=False, color=col,
             alpha=ta * (0.85 if col == INK else 1.0))
        xx += tsize(r, 38, 'Regular', False)[0] + 16
        if j < len(roles) - 1:
            text(im, '·', (xx, yy), size=38, weight='Regular', display=False, color=DIM, alpha=ta)
            xx += tsize('·', 38, 'Regular', False)[0] + 16
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


@clip('M_CREW', 9.0, 'S12', 'four dossier cards with cast portraits slide in on the nicknames: THE GENIUS alarms / THE MONSTER locks, wiring, driving / THE KING OF KEYS an old forger, never identified / SPEEDY the nervous one; DRAMATIZATION tag')
def m_crew(stills=None):
    T = [0.35, 2.4, 4.45, 6.6]

    def fg(im, sec, u):
        # the group stays centred: older cards glide left as each new one arrives
        n_eff = 1 + sum(p_io(sec, T[k] - 0.1, 0.7) for k in range(1, 4))
        crew_header(im, sec, x=card_x(0, n_eff))
        latest = max([k for k in range(4) if sec >= T[k]] or [0])
        for k in range(4):
            a = p_in(sec, T[k], 0.55)
            # focus: the newest card is lit, the others step back
            b = 1.0
            if k < latest:
                b = 1.0 - 0.5 * p_io(sec, T[latest], 0.6)
            crew_card(im, k, sec, a, bright=b, inner=G.seg(sec, T[k], 9.5), x=card_x(k, n_eff))

    render('M_CREW', 9.0, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.006, 0.006), (0.006, -0.004)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='DRAMATIZATION')


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


def layer_row(im, i, sec, t0, hl=0.0, strike=0.0, beaten=0.0):
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
    if det:
        text(im, det, (L_TX + 90 + nw + 34, y), size=40, weight='Regular', display=False, color=mix(DIM, INK, 0.25),
             alpha=a * 0.95)
    if strike > 0:
        tw = nw + (tsize(det, 40, 'Regular', False)[0] + 34 if det else 0)
        hline(im, L_TX + 80, L_TX + 100 + tw, y - 18, color=INK, width=4, p=strike, alpha=0.9)


@clip('M_LAYERS_A', 4.0, 'S14', '"TEN LAYERS": exploded stack of the ten security layers (S14-S19 order), counter "1 / 10" lights the steel door')
def m_layers_a(stills=None):
    def fg(im, sec, u):
        build_label(im, 'the vault', (L_TX, L_Y0 - 300), sec, 0.05, size=34, tracking=0.2)
        build_text(im, 'TEN LAYERS', (L_TX, L_Y0 - 170), sec, 0.12, size=120)
        hl = p_in(sec, 1.75, 0.4)
        for i in reversed(range(10)):
            layer_plate(im, i, p_in(sec, 0.3 + 0.1 * i, 0.45), hl=hl if i == 0 else 0.0)
        for i in range(10):
            layer_row(im, i, sec, 0.36 + 0.1 * i, hl=hl if i == 0 else 0.0)
        pc = p_in(sec, 1.85, 0.4)
        if pc > 0:
            x1 = L_TX + 1700
            tabnum(im, '1', (x1 - tsize(' / 10', 120)[0], L_Y0 - 170 + (1 - pc) * 20), size=120, color=AMBER, alpha=pc,
                   anchor='r', glow=8)
            text(im, ' / 10', (x1, L_Y0 - 170 + (1 - pc) * 20), size=120, color=DIM, alpha=pc, anchor='rs')

    render('M_LAYERS_A', 4.0, fg, cam=Cam(z=(1.0, 1.07), pan=((0.006, 0.01), (-0.012, -0.012))),
           bg=backdrop(grid=True, glow=(0.32, 0.4)), stills=stills)


@clip('M_LAYERS_B', 4.0, 'S28', 'the same ten-layer stack, each layer struck through in turn, counter to 10 / 10; "beaten by hair spray, tape, an aluminium plate and a sheet of foam" (VO S28)')
def m_layers_b(stills=None):
    TS = [0.3 + 0.19 * i for i in range(10)]

    def fg(im, sec, u):
        label(im, 'the vault', (L_TX, L_Y0 - 300), size=34, tracking=0.2)
        text(im, 'TEN LAYERS', (L_TX, L_Y0 - 170), size=120)
        n = sum(1 for t_ in TS if sec >= t_ + 0.1)
        for i in reversed(range(10)):
            b = p_in(sec, TS[i] + 0.05, 0.35)
            layer_plate(im, i, 1.0, hl=(1 - b) if i == 0 else 0.0, beaten=b)
        for i in range(10):
            b = p_in(sec, TS[i] + 0.05, 0.35)
            layer_row(im, i, sec, -9, hl=(1 - b) if i == 0 else 0.0, strike=p_io(sec, TS[i], 0.22), beaten=b)
        x1 = L_TX + 1700
        tabnum(im, str(max(1, n)), (x1 - tsize(' / 10', 120)[0], L_Y0 - 170), size=120, color=AMBER, anchor='r', glow=8)
        text(im, ' / 10', (x1, L_Y0 - 170), size=120, color=DIM, anchor='rs')
        build_label(im, 'beaten', (x1, L_Y0 - 300), sec, 0.3, size=34, tracking=0.2, anchor='rs', color=AMBER)
        # the punchline
        yb = L_Y0 + 9 * L_STEP + 300
        rich(im, [('beaten by ', INK), ('hair spray', AMBER), (', ', INK), ('tape', AMBER), (', ', INK),
                  ('an aluminium plate', AMBER), (' and ', INK), ('a sheet of foam', AMBER)],
             (CX, yb), size=72, anchor='ms', sec=sec, t0=2.35, stagger=0.09, dur=0.45)

    render('M_LAYERS_B', 4.0, fg, cam=Cam(z=(1.03, 1.0), pan=((-0.006, -0.006), (0.0, 0.01))),
           bg=backdrop(grid=True, glow=(0.32, 0.4)), stills=stills)


@clip('M_17576', 4.0, 'S19', 'box lock: three letter wheels A-Z spin; counter rolls to 17,576 combinations per box (26x26x26); 189 boxes grid (VO S19)')
def m_17576(stills=None):
    ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    px0, py0, px1, py1 = 330, CY - 560, 1730, CY + 520          # lock face plate
    ww, wh, wg, pitch, lsz = 300, 420, 70, 236, 220
    wx0 = (px0 + px1) / 2 - (3 * ww + 2 * wg) / 2
    wy0 = py0 + 170
    rx = 3500                                                    # right column (right-aligned)

    def vel(tt, j):
        v_fast, v_slow = 19.0 - 2.5 * j, 2.0 + 0.45 * j
        return (v_slow + (v_fast - v_slow) * (1 - G.ease(G.seg(tt, 1.1, 2.5)))) * G.seg(tt, 0.0, 0.25)

    def wheel_pos(j, sec):
        """letters travelled: a fast spin easing down to a slow, stepping search that never settles."""
        t_ = sec - (0.3 + 0.16 * j)
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
        pa = p_in(sec, 0.0, 0.5)
        rect(im, (px0, py0, px1, py1), fill=(30, 31, 36), alpha=0.95 * pa, radius=28)
        rect(im, (px0, py0, px1, py1), outline=(80, 84, 92), width=3, alpha=pa, radius=28)
        rect(im, (px0 + 28, py0 + 28, px1 - 28, py1 - 28), outline=(52, 55, 61), width=2, alpha=pa, radius=18)
        label(im, 'box 1 of 189', (px0 + 80, py0 + 110), size=32, alpha=pa, tracking=0.16)
        label(im, 'three-letter combination', (px1 - 80, py0 + 110), size=32, alpha=pa, tracking=0.16, anchor='rs')
        for j in range(3):
            x = wx0 + j * (ww + wg)
            pw = p_in(sec, 0.12 + 0.08 * j, 0.4)
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
        pk = p_in(sec, 0.45, 0.4)
        kx, ky = (px0 + px1) / 2, wy0 + wh + 200
        if pk > 0:
            circle(im, (kx, ky - 24), 36, fill=(8, 8, 10), alpha=pk)
            poly(im, [(kx - 17, ky - 6), (kx + 17, ky - 6), (kx + 28, ky + 72), (kx - 28, ky + 72)], fill=(8, 8, 10), alpha=pk)
            circle(im, (kx, ky + 6), 100, outline=(74, 78, 86), width=3, alpha=pk)
            label(im, 'its own key', (kx + 140, ky + 16), size=30, alpha=pk, tracking=0.16)
        # right column: 26 x 26 x 26 -> 17,576
        parts = []
        for j in range(3):
            hot = G.seg(sec, 0.3 + 0.16 * j, 0.45) * (1 - G.seg(sec, 1.5, 2.2))
            parts.append(('26', mix(INK, AMBER, hot)))
            if j < 2:
                parts.append((' × ', DIM))
        rich(im, parts, (rx, CY - 400), size=104, anchor='rs', sec=sec, t0=0.3, stagger=0.08)
        pc = G.ease_out(G.seg(sec, 0.55, 2.6))
        if sec >= 0.55:
            tabnum(im, f'{int(round(17576 * pc)):,}', (rx, CY - 70), size=300, color=AMBER, anchor='r',
                   alpha=p_in(sec, 0.55, 0.25), glow=14 * pc)
        build_text(im, 'combinations — per box', (rx, CY + 60), sec, 1.5, size=76, anchor='rs', color=INK)
        # 189 boxes: a grid fills in
        pb = p_in(sec, 2.45, 0.4)
        if pb > 0:
            cols, rows, cs, cg = 27, 7, 30, 10
            gy0 = CY + 230
            gx0 = rx - cols * (cs + cg) + cg
            for k in range(189):
                c_, r_ = k % cols, k // cols
                q = p_in(sec, 2.5 + 0.0045 * k, 0.2)
                if q <= 0:
                    continue
                x = gx0 + c_ * (cs + cg)
                y = gy0 + r_ * (cs + cg)
                rect(im, (x, y, x + cs, y + cs), outline=(118, 123, 132), width=2, alpha=q * 0.9, radius=3)
            gh = rows * (cs + cg) - cg
            text(im, '189 boxes', (gx0 - 50, gy0 + gh / 2 - 6), size=68, color=INK, alpha=pb, anchor='rs')
            label(im, 'each its own key + combination', (gx0 - 50, gy0 + gh / 2 + 56), size=30, alpha=pb, anchor='rs',
                  tracking=0.1)

    render('M_17576', 4.0, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.008, 0.006), (0.01, -0.006))),
           bg=backdrop(grid=True, glow=(0.36, 0.48)), stills=stills)


# ---------------------------------------------------------------------------- Ch4

def embers(im, sec, n=46, seed=5, y0=None, alpha=1.0):
    """slow sparks rising from the bottom of frame."""
    rng = np.random.default_rng(seed)
    y0 = H2 + 40 if y0 is None else y0
    for k in range(n):
        x = rng.uniform(300, W2 - 300)
        t0 = rng.uniform(-3.0, 3.5)
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


@clip('M_BURNLIST', 3.5, 'S30', '"THE PLAN: BURN EVERYTHING" (according to Notarbartolo): TAPE / TOOLS / PACKAGING / FOOD tick on; faint ember glow + sparks (VO S30)')
def m_burnlist(stills=None):
    tw = tsize('THE PLAN: BURN EVERYTHING', 132)[0]
    x0 = CX - tw / 2
    y_t = CY - 300
    ITEMS = ['TAPE', 'TOOLS', 'PACKAGING', 'FOOD']
    TT = [1.0, 1.45, 1.9, 2.35]

    def fg(im, sec, u):
        fl = 0.75 + 0.25 * math.sin(sec * 7.3) * math.sin(sec * 3.1 + 1)
        glow_spot(im, (CX, H2 + 260), 1500, color=(232, 120, 40), alpha=0.21 * fl * p_in(sec, -0.4, 1.2))
        glow_spot(im, (CX - 500, H2 + 200), 900, color=(232, 150, 60), alpha=0.08 * fl)
        embers(im, sec, alpha=0.75)
        build_label(im, 'according to Notarbartolo', (x0, y_t - 170), sec, 0.05, size=34, tracking=0.18)
        build_text(im, 'THE PLAN: BURN EVERYTHING', (x0, y_t), sec, 0.15, size=132)
        hline(im, x0, x0 + tw, y_t + 70, color=FAINT, width=3, p=p_io(sec, 0.45, 0.6))
        for j, it in enumerate(ITEMS):
            y = y_t + 220 + j * 140
            pa = p_in(sec, 0.55 + 0.06 * j, 0.4)
            if pa <= 0:
                continue
            bx = x0 + 6
            rect(im, (bx, y - 64, bx + 72, y + 8), outline=(120, 124, 132), width=3, alpha=pa, radius=6)
            pt = p_io(sec, TT[j], 0.3)
            on = p_in(sec, TT[j], 0.35)
            text(im, it, (bx + 130, y), size=84, color=mix(DIM, INK, on), alpha=pa, dy=(1 - pa) * 14)
            if pt > 0:
                check(im, (bx + 38, y - 30), 56, color=AMBER, width=8, p=pt, glow=6)

    render('M_BURNLIST', 3.5, fg, cam=Cam(z=(1.0, 1.07), pan=((0.0, 0.012), (0.0, -0.008))),
           bg=backdrop(grid=False, glow=(0.5, 0.85), warm=0.4), stills=stills)


@clip('M_GHOSTS', 3.0, 'S32', 'the four crew dossier cards (M_CREW art) fade to grey silhouettes stamped UNKNOWN; DRAMATIZATION tag (VO S32 "the crew are ghosts")')
def m_ghosts(stills=None):
    def fg(im, sec, u):
        crew_header(im, 99, title='THE SCHOOL OF TURIN', sub='')
        build_label(im, 'to the detectives: ghosts', (CARD_X0, CARD_Y0 - 92), sec, 0.9, size=30, tracking=0.08,
                    weight='Regular')
        for k in range(4):
            g = p_io(sec, 0.25 + 0.12 * k, 1.0)
            crew_card(im, k, sec, 1.0, bright=1.0 - 0.15 * g, ghost=g, stamp_p=p_in(sec, 1.15 + 0.2 * k, 0.22),
                      inner=0.5 + 0.5 * G.seg(sec, -0.5, 3.5))

    render('M_GHOSTS', 3.0, fg, cam=Cam(z=(1.0, 1.055), pan=((0.004, 0.006), (-0.004, -0.004))),
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

@clip('M_EVIDENCE', 5.0, 'S36', 'evidence-board reconstruction: receipts, envelopes, loose stones, paperwork (-> an office in the Diamond Centre), half a salami sandwich; flat illustrations + tags, amber string; RECONSTRUCTION tag (VO S36)')
def m_evidence(stills=None):
    ITEMS = [('receipts', 'receipts', (840, 800), -4, 0.25),
             ('envelopes', 'envelopes', (1820, 690), 3, 0.95),
             ('stones', 'loose stones', (2880, 800), -2, 1.6),
             ('paperwork', 'paperwork', (2820, 1530), 2, 2.25),
             ('sandwich', 'half a salami sandwich', (1640, 1560), -3, 3.35)]
    PIN = [-178, -140, -112, -190, -122]

    def fg(im, sec, u):
        build_label(im, 'found in the woods', (440, 330), sec, 0.05, size=34, tracking=0.2, color=INK)
        build_label(im, 'what the bags held', (440, 386), sec, 0.15, size=30, tracking=0.08, weight='Regular')
        pins = [(x + (12 if j % 2 else -10), y + PIN[j]) for j, (_, _, (x, y), _, _) in enumerate(ITEMS)]
        # strings first (they run behind the items and tags): each new item ties back to the previous one
        for j in range(1, len(ITEMS)):
            ps = p_io(sec, ITEMS[j][4] - 0.05, 0.55)
            string(im, pins[j - 1], pins[j], p=ps, sag=70, alpha=0.8 if j < 4 else 1.0)
        for j, (kind, name, (x, y), rot, t0) in enumerate(ITEMS):
            p = p_in(sec, t0, 0.5)
            if p <= 0:
                continue
            scale = 1.25 if kind == 'sandwich' else 1.0
            tile = ill_tile(kind, scale=scale) if kind != 'sandwich' else ill_tile(kind, 760, 520, 1.25)
            r = rot + (1 - p) * 6 * (1 if j % 2 else -1)
            k = 1.0 + 0.08 * (1 - p)
            t2 = tile.resize((int(tile.width * k), int(tile.height * k)), Image.BICUBIC).rotate(r, Image.BICUBIC, expand=True)
            composite(im, fade(t2, p), x - t2.width / 2, y - t2.height / 2 - (1 - p) * 30)
            hot = kind == 'sandwich'
            ev_tag(im, f'{j + 1:02d}', name, (x, y + (300 if hot else 250)), alpha=p, color=AMBER if hot else INK)
        for j in range(len(ITEMS)):
            pp = p_in(sec, ITEMS[j][4] + 0.15, 0.25)
            if pp > 0:
                pin(im, pins[j], alpha=pp)
        # paperwork points back to an office
        pa = p_in(sec, 2.75, 0.45)
        if pa > 0:
            x, y = ITEMS[3][2]
            label(im, '→ an office in the Diamond Centre', (x, y + 345), size=30, color=DIM, alpha=pa,
                  tracking=0.08, weight='Regular', anchor='ms')
        if sec > 3.4:
            glow_spot(im, ITEMS[4][2], 520, color=AMBER, alpha=0.07 * p_in(sec, 3.4, 0.6))

    render('M_EVIDENCE', 5.0, fg, cam=Cam(z=(1.0, 1.085), pan=((0.006, -0.01), (-0.006, 0.02)), lin=0.45),
           bg=backdrop(grid=False, glow=(0.5, 0.55), warm=0.26), stills=stills, tag_text='RECONSTRUCTION')


@clip('M_DNA', 4.0, 'S37', 'sandwich in an evidence bag -> swab -> DNA strand -> "CASE FILE" stamp (no percentages); RECONSTRUCTION tag (VO S37)')
def m_dna(stills=None):
    XS = [760, 1560, 2380, 3180]
    LB = ['evidence bag', 'swab', 'DNA', 'case file']
    TT = [0.1, 0.85, 1.6, 2.4]

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
        helix(im, (XS[2], y), p_io(sec, TT[2], 0.8), sec)
        p3 = p_in(sec, TT[3], 0.45)
        if p3 > 0:
            folder(im, (XS[3], y), p3, p_in(sec, TT[3] + 0.55, 0.22))
        for j in range(3):
            pa = p_io(sec, TT[j + 1] - 0.25, 0.35)
            dashed(im, (XS[j] + 330, y), (XS[j + 1] - 330, y), color=AMBER, width=4, dash=16, gap=14, p=pa,
                   phase=-sec * 40, alpha=0.8)
            if pa >= 1:
                ex = XS[j + 1] - 330
                poly(im, [(ex - 22, y - 16), (ex + 6, y), (ex - 22, y + 16)], fill=AMBER, alpha=0.9)
        for j in range(4):
            build_label(im, LB[j], (XS[j], y + 470), sec, TT[j] + 0.2, size=32, tracking=0.2, anchor='ms',
                        color=AMBER if j == 3 else DIM)

    render('M_DNA', 4.0, fg, cam=Cam(z=(1.12, 1.08), pan=((-0.045, 0.0), (0.035, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.5, 0.5)), stills=stills, tag_text='RECONSTRUCTION')


# ---------------------------------------------------------------------------- Ch5: the tenant returns

@clip('M_DETECTIVES', 3.5, 'S39', 'two name cards, no faces: AGIM DE BRUYCKER / PATRICK PEYS - diamond squad, Antwerp police; 21 February 2003 (VO S39)')
def m_detectives(stills=None):
    blocks = [(820, 'AGIM', 'DE BRUYCKER', 0.25), (2320, 'PATRICK', 'PEYS', 0.7)]
    y0 = CY - 50

    def fg(im, sec, u):
        build_label(im, '21 february 2003 · the diamond centre', (760, y0 - 260), sec, 0.05, size=32, tracking=0.2)
        for x, a, b, t0 in blocks:
            vline(im, x - 60, y0 - 130, y0 + 400, color=AMBER, width=5, p=p_io(sec, t0 - 0.1, 0.5), glow=4)
            build_label(im, 'detective', (x, y0 - 90), sec, t0, size=32, tracking=0.2)
            build_text(im, a, (x, y0 + 50), sec, t0 + 0.08, size=124, color=INK)
            build_text(im, b, (x, y0 + 200), sec, t0 + 0.16, size=124, color=INK)
            build_text(im, 'diamond squad · Antwerp police', (x, y0 + 330), sec, t0 + 0.35, size=50, weight='Regular',
                       display=False, color=INK, alpha=0.8)

    render('M_DETECTIVES', 3.5, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.012, 0.008), (0.01, -0.006))),
           bg=backdrop(grid=False, glow=(0.45, 0.5)), stills=stills)


@clip('M_SENTENCES', 4.0, 'S40', '"2005 · APPEALS COURT, ANTWERP": Notarbartolo 10 years (organising the heist); three others 5 years each (Tavano, D\'Onorio, Finotto) as year blocks (VO S40, FACTS 30)')
def m_sentences(stills=None):
    lx = 440
    bx0, unit, gap = 1420, 130, 14
    rx = bx0 + 10 * unit + 9 * gap + 90
    y1 = CY - 170
    ys = [CY + 250, CY + 370, CY + 490]
    names = ['Tavano', 'D\'Onorio', 'Finotto']

    def blocks(im, y, n, h, sec, t0, color, step=0.08):
        for k in range(n):
            q = p_in(sec, t0 + step * k, 0.25)
            x = bx0 + k * (unit + gap)
            rect(im, (x, y - h, x + unit, y), outline=(70, 74, 82), width=2, alpha=0.9, radius=4)
            if q > 0:
                rect(im, (x, y - h + (1 - q) * h, x + unit, y), fill=color, alpha=0.95, radius=4)

    def fg(im, sec, u):
        build_label(im, '2005 · appeals court, antwerp', (lx, y1 - 330), sec, 0.05, size=38, tracking=0.2, color=INK)
        hline(im, lx, W2 - lx, y1 - 280, color=FAINT, width=3, p=p_io(sec, 0.15, 0.7))
        # row 1
        build_text(im, 'LEONARDO', (lx, y1 - 70), sec, 0.25, size=80)
        build_text(im, 'NOTARBARTOLO', (lx, y1 + 22), sec, 0.32, size=80)
        build_label(im, 'for organising the heist', (lx, y1 + 92), sec, 0.5, size=30, tracking=0.08, weight='Regular')
        pa = p_in(sec, 0.35, 0.4)
        if pa > 0:
            blocks(im, y1 + 22, 10, 110, sec, 0.55, AMBER, 0.085)
        n1 = sum(1 for k in range(10) if sec >= 0.55 + 0.085 * k + 0.12)
        if sec > 0.55:
            nw = tabnum_w('10', 150)
            tabnum(im, str(max(1, n1)), (rx + nw, y1 + 22), size=150, color=AMBER, anchor='r')
            text(im, 'YEARS', (rx + nw + 30, y1 + 22), size=64, color=AMBER, alpha=p_in(sec, 0.55, 0.3))
        # rows 2-4
        build_text(im, 'THREE OTHERS', (lx, ys[0] - 100), sec, 1.55, size=62)
        for j, y in enumerate(ys):
            pr = p_in(sec, 1.7 + 0.12 * j, 0.35)
            if pr <= 0:
                continue
            text(im, names[j], (bx0 - 60, y - 4), size=44, weight='Regular', display=False, color=DIM, alpha=pr,
                 anchor='rs')
            blocks(im, y, 5, 64, sec, 1.85 + 0.12 * j, (200, 206, 214), 0.07)
        pe = p_in(sec, 2.4, 0.4)
        text(im, '5 YEARS EACH', (bx0 + 5 * (unit + gap) + 76, ys[1] - 6), size=64, color=INK, alpha=pe, anchor='ls',
             dy=(1 - pe) * 14)

    render('M_SENTENCES', 4.0, fg, cam=Cam(z=(1.0, 1.065), pan=((-0.01, -0.006), (0.008, 0.01))),
           bg=backdrop(grid=True, glow=(0.5, 0.45)), stills=stills)


@clip('M_NEVER', 3.5, 'S41', '"KING OF KEYS - NEVER IDENTIFIED" / "THE DIAMONDS - NEVER FOUND (almost all of them)" with red accents (VO S41)')
def m_never(stills=None):
    gx = CX - 40
    rows = [('KING OF KEYS', 'NEVER IDENTIFIED', CY - 170, 0.2, ''),
            ('THE DIAMONDS', 'NEVER FOUND', CY + 190, 1.35, 'almost all of them')]

    def fg(im, sec, u):
        for subj, st, y, t0, sub in rows:
            build_text(im, subj, (gx - 90, y), sec, t0, size=128, anchor='rs', color=INK)
            pd = p_io(sec, t0 + 0.3, 0.3)
            hline(im, gx - 30, gx + 30, y - 46, color=RED, width=8, p=pd, glow=6)
            pw = p_io(sec, t0 + 0.45, 0.45)
            if pw > 0:
                text(im, st, (gx + 90, y), size=128, color=RED, wipe=pw, alpha=1.0)
                text(im, st, (gx + 90, y), size=128, color=RED, wipe=pw, alpha=0.35 * (1 - G.seg(sec, t0 + 0.9, 1.0)),
                     blur=14)
            if sub:
                build_label(im, sub, (gx + 94, y + 80), sec, t0 + 0.9, size=36, tracking=0.12, weight='Regular')

    render('M_NEVER', 3.5, fg, cam=Cam(z=(1.0, 1.075), pan=((0.0, -0.01), (0.0, 0.01))),
           bg=backdrop(grid=False, glow=(0.5, 0.5), warm=0.18), stills=stills)


@clip('M_CASECLOSED', 3.0, 'S42', '"CASE CLOSED" stamp lands, then the year rolls 2003 -> 2009 ("six years later") (VO S42)')
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
        pitch = size * 0.95
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
        arr[..., 3] *= np.clip(1.6 - yy * 1.7, 0, 1)[:, None]
        composite(im, Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)), x0 + 3 * dw - 10,
                  xy[1] - size * 0.36 - th * 0.5)

    def fg(im, sec, u):
        # the file under the stamp
        pf = p_in(sec, -0.2, 0.5)
        fx0, fy0, fx1, fy1 = CX - 1000, CY - 640, CX + 1000, CY + 120
        rect(im, (fx0, fy0, fx1, fy1), fill=(30, 31, 36), outline=(70, 74, 82), width=3, radius=10, alpha=pf)
        label(im, 'antwerp diamond centre · february 2003', (fx0 + 70, fy0 + 100), size=32, tracking=0.18, alpha=pf)
        for j in range(3):
            hline(im, fx0 + 70, fx1 - 70 - j * 260, fy0 + 180 + j * 56, color=(62, 66, 74), width=4, alpha=pf)
        ps = p_in(sec, 0.3, 0.2)
        if ps > 0:
            # a small jolt on impact
            jolt = math.sin(G.seg(sec, 0.45, 0.75) * math.pi * 3) * (1 - G.seg(sec, 0.45, 0.75)) * 6
            stamp_big(im, 'CASE CLOSED', (CX, CY - 250 + jolt), ps)
        pv = p_in(sec, 1.05, 0.35)
        if pv > 0:
            v = 3.0 + 6.0 * G.seg(sec, 1.25, 2.45)
            b_ = math.floor(v)
            v = min(9.0, b_ + G.ease(G.seg(v - b_, 0.35, 1.0)))     # click from year to year
            roll(im, v, (CX, CY + 560))
            build_label(im, 'six years later', (CX, CY + 700), sec, 2.2, size=36, tracking=0.2, anchor='ms')

    render('M_CASECLOSED', 3.0, fg, cam=Cam(z=(1.0, 1.07), pan=((0.0, -0.012), (0.0, 0.012))),
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

@clip('M_WIRED', 4.0, 'S43', 'typographic citation, no logo: "2009 - Notarbartolo talks to journalist Joshua Davis, for Wired" (VO S43)')
def m_wired(stills=None):
    x0 = 1000
    y0 = CY - 300

    def fg(im, sec, u):
        vline(im, x0 - 90, y0 - 160, y0 + 560, color=AMBER, width=6, p=p_io(sec, 0.0, 0.6), glow=5)
        pn = build_text(im, '2009', (x0, y0), sec, 0.1, size=170, color=AMBER)
        words = 'Notarbartolo talks'.split(' ')
        x = x0
        for j, w_ in enumerate(words):
            build_text(im, w_, (x, y0 + 230), sec, 0.5 + 0.14 * j, size=150, color=INK)
            x += tsize(w_ + ' ', 150)[0]
        words2 = 'to the journalist Joshua Davis, for Wired.'.split(' ')
        x = x0
        for j, w_ in enumerate(words2):
            build_text(im, w_, (x, y0 + 380), sec, 1.0 + 0.1 * j, size=76, weight='Regular', display=False, color=INK,
                       alpha=0.88)
            x += tsize(w_ + ' ', 76, 'Regular', False)[0]
        build_label(im, 'interview · his side of the story', (x0, y0 + 520), sec, 1.9, size=32, tracking=0.2)

    render('M_WIRED', 4.0, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.01, 0.006), (0.008, -0.006))),
           bg=backdrop(grid=False, glow=(0.4, 0.5)), stills=stills)


PANEL_L = (200, 330, 1870, 1880)
PANEL_R = (1970, 330, 3640, 1880)
HIS = [('An insurance job', 'a diamond dealer hired the crew to stage it'),
       ('A replica vault', 'rehearsing so they could work in the dark'),
       ('Bags nearly empty', 'the stones moved out before the weekend'),
       ('“20 million, not 100”', 'his figure for the haul')]
EVI = [('Lights on', 'they did not work in the dark'),
       ('Tape over the light sensor', 'black tape on the ceiling sensor'),
       ('Loot sorted on the vault floor', 'the bags were not empty'),
       ('Jewels and passports left behind', 'found by the guard on Monday')]


def story_panel(im, box, title, sub, rows, sec, t_rows, alpha=1.0, active=True, strikes=None, hot_row=None, p_head=1.0):
    x0, y0, x1, y1 = box
    rect(im, box, fill=(24, 24, 28), alpha=0.9 * alpha * p_head, radius=10)
    rect(im, box, outline=(64, 68, 76) if not active else (92, 96, 104), width=2, alpha=alpha * p_head, radius=10)
    if active:
        hline(im, x0, x0 + 260, y0, color=AMBER, width=6, p=p_head, glow=5)
    tx = x0 + 110
    text(im, title, (tx, y0 + 200), size=104, color=INK, alpha=alpha * p_head, dy=(1 - p_head) * 20)
    label(im, sub, (tx, y0 + 270), size=30, alpha=alpha * p_head, tracking=0.14)
    for j, (head, note) in enumerate(rows):
        p = p_in(sec, t_rows[j], 0.42) if t_rows is not None else 0.0
        y = y0 + 470 + j * 300
        if p <= 0:
            hline(im, tx, x1 - 110, y - 40, color=(50, 53, 60), width=2, alpha=alpha * p_head * 0.7)
            continue
        col = AMBER if hot_row == j else INK
        label(im, f'{j + 1:02d}', (tx, y - 4), size=30, color=DIM, alpha=alpha * p, tracking=0.1)
        text(im, head, (tx + 90, y), size=78, color=col, alpha=alpha * p, dy=(1 - p) * 16, blur=(1 - p) * 5)
        text(im, note, (tx + 92, y + 70), size=40, weight='Regular', display=False, color=DIM, alpha=alpha * p)
        if strikes and strikes.get(j, 0) > 0:
            w_ = tsize(head, 78)[0]
            hline(im, tx + 80, tx + 104 + w_, y - 26, color=INK, width=5, p=strikes[j], alpha=0.85)


@clip('M_HISSTORY', 5.0, 'S44', 'split frame, left panel "HIS STORY" (according to Notarbartolo, 2009): insurance job / replica vault, dark / bags nearly empty / "20 million, not 100"; right panel waits (VO S44)')
def m_hisstory(stills=None):
    T = [0.6, 1.55, 2.5, 3.5]

    def fg(im, sec, u):
        ph = p_in(sec, 0.0, 0.5)
        story_panel(im, PANEL_L, 'HIS STORY', 'according to Notarbartolo, 2009', HIS, sec, T, p_head=ph, hot_row=3)
        story_panel(im, PANEL_R, 'THE EVIDENCE', 'investigators', EVI, sec, None, alpha=0.28, active=False,
                    p_head=p_in(sec, 0.2, 0.6))

    render('M_HISSTORY', 5.0, fg, cam=Cam(z=(1.0, 1.045), pan=((-0.012, 0.004), (-0.006, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.3, 0.5)), stills=stills)


@clip('M_20vs100', 3.0, 'S44', 'two bars to scale: HIS CLAIM ~EUR 18 M (FACTS 33) vs REPORTED LOSS at least $100 M, an estimate (FACTS 4); note: bars at 2003 exchange rates (VO S44 "Twenty million, he says. Not a hundred.")')
def m_20vs100(stills=None):
    bx0, bx1 = 640, 2860
    ya, yb = CY - 200, CY + 330
    frac = 18 * 1.10 / 100        # EUR 18 M at ~1.10 USD/EUR (2003) vs USD 100 M

    def fg(im, sec, u):
        # his claim
        build_label(im, 'his claim', (bx0, ya - 170), sec, 0.05, size=34, tracking=0.2, color=INK)
        pa = p_io(sec, 0.25, 0.7)
        rect(im, (bx0, ya - 110, bx1, ya), outline=(52, 55, 62), width=2, alpha=0.8, radius=4)
        if pa > 0:
            rect(im, (bx0, ya - 110, bx0 + (bx1 - bx0) * frac * pa, ya), fill=(200, 206, 214), alpha=0.95, radius=4)
            v = 18 * pa
            text(im, f'~€{v:.0f} M', (bx0 + (bx1 - bx0) * frac * pa + 50, ya - 8), size=140, color=INK)
        # reported
        build_label(im, 'reported loss · estimate', (bx0, yb - 170), sec, 0.75, size=34, tracking=0.2, color=INK)
        pb = p_io(sec, 0.95, 1.1)
        rect(im, (bx0, yb - 110, bx1, yb), outline=(52, 55, 62), width=2, alpha=0.8 * p_in(sec, 0.75, 0.3), radius=4)
        if pb > 0:
            rect(im, (bx0, yb - 110, bx0 + (bx1 - bx0) * pb, yb), fill=AMBER, alpha=0.95, radius=4, glow=10 * pb)
            v = 100 * pb
            xe = bx0 + (bx1 - bx0) * pb + 50                    # the counter rides the end of the bar
            nw = tabnum(im, f'${v:.0f}', (xe, yb - 8), size=140, color=AMBER, anchor='l')
            text(im, ' M+', (xe + nw, yb - 8), size=140, color=AMBER, alpha=p_in(sec, 1.8, 0.3))
            label(im, 'at least', (xe + 6, yb - 150), size=32, alpha=p_in(sec, 1.8, 0.3), tracking=0.14)
        build_label(im, 'his account (WIRED, 2009) vs. the estimated loss · bars to scale at 2003 exchange rates',
                    (bx0, yb + 150), sec, 2.0, size=30, tracking=0.06, weight='Regular')

    render('M_20vs100', 3.0, fg, cam=Cam(z=(1.0, 1.06), pan=((-0.01, 0.006), (0.006, -0.004))),
           bg=backdrop(grid=True, glow=(0.45, 0.5)), stills=stills)


def tabnum_w(s, size, weight='SemiBold', display=True):
    f = G.font(size, weight, display)
    dw = max(f.getlength(c) for c in '0123456789')
    return sum(dw if c.isdigit() else f.getlength(c) for c in s)


@clip('M_EVIDENCESTORY', 4.0, 'S45', 'split frame, right panel "THE EVIDENCE": lights on / tape over the light sensor / loot sorted on the vault floor / jewels and passports left behind; his claims dimmed, contradicted ones struck (VO S45, FACTS 19/22/35)')
def m_evidencestory(stills=None):
    T = [0.45, 1.25, 2.05, 2.85]

    def fg(im, sec, u):
        dimk = 1 - 0.55 * p_io(sec, 0.0, 0.6)
        strikes = {1: p_io(sec, T[0] + 0.35, 0.3), 2: p_io(sec, T[2] + 0.35, 0.3)}
        story_panel(im, PANEL_L, 'HIS STORY', 'according to Notarbartolo, 2009', HIS, 99, [0, 0, 0, 0], alpha=dimk,
                    active=False, strikes=strikes)
        story_panel(im, PANEL_R, 'THE EVIDENCE', 'investigators · the crime scene', EVI, sec, T,
                    p_head=0.28 + 0.72 * p_in(sec, 0.0, 0.45))

    render('M_EVIDENCESTORY', 4.0, fg, cam=Cam(z=(1.0, 1.045), pan=((0.006, 0.004), (0.012, -0.006)), lin=0.5),
           bg=backdrop(grid=True, glow=(0.7, 0.5)), stills=stills)


@clip('M_QUOTE', 5.0, 'S46', 'the detective\'s quote typeset (FACTS 34): "Not one detail of Leo\'s story can be confirmed by the facts in the investigation." - Agim De Bruycker, lead detective')
def m_quote(stills=None):
    lines = [[('Not one detail', AMBER), (' of Leo’s story', INK)],
             [('can be confirmed by the facts', INK)],
             [('in the investigation.', INK)]]
    size, lh = 128, 170
    x0 = 1020
    y0 = CY - 180

    def fg(im, sec, u):
        pq = p_in(sec, 0.0, 0.5)
        text(im, '“', (x0 - 50, y0 + 120), size=400, color=AMBER, alpha=0.9 * pq, anchor='rs', dy=(1 - pq) * 30)
        # word-by-word at reading pace
        t = 0.3
        for li, parts in enumerate(lines):
            x = x0
            for s_, col in parts:
                for w_ in s_.strip().split(' '):
                    lead = ' ' if (s_.startswith(' ') or x > x0) else ''
                    if lead and x > x0:
                        x += tsize(' ', size)[0]
                    build_text(im, w_, (x, y0 + li * lh), sec, t, size=size, color=col, dur=0.4)
                    x += tsize(w_, size)[0]
                    t += 0.2
        build_text(im, '— Agim De Bruycker, lead detective', (x0, y0 + 3 * lh + 70), sec, t + 0.25, size=56,
                   weight='Regular', display=False, color=INK, alpha=0.85)
        build_label(im, 'quoted in the Columbia Journalism Review', (x0, y0 + 3 * lh + 150), sec, t + 0.5, size=28,
                    tracking=0.12)

    render('M_QUOTE', 5.0, fg, cam=Cam(z=(1.0, 1.075), pan=((-0.008, 0.008), (0.008, -0.006))),
           bg=backdrop(grid=False, glow=(0.4, 0.45)), stills=stills)


@clip('M_TWOPATHS', 4.5, 'S47', 'a path forks: IF TRUE -> he\'s the fall guy / IF FALSE -> a very convenient story (VO S47)')
def m_twopaths(stills=None):
    sx, fx, ex = 560, 1380, 2140
    yu, yd = CY - 380, CY + 380

    def curve(a, b, n=40):
        pts = []
        for j in range(n + 1):
            t_ = j / n
            e = t_ * t_ * (3 - 2 * t_)
            pts.append((lerp(a[0], b[0], t_), lerp(a[1], b[1], e)))
        return pts

    def fg(im, sec, u):
        build_label(im, 'his story', (sx, CY - 70), sec, 0.05, size=36, tracking=0.2, color=INK)
        circle(im, (sx, CY), 14, fill=INK, alpha=p_in(sec, 0.0, 0.3))
        polyline(im, [(sx, CY), (fx, CY)], color=(150, 156, 166), width=5, p=p_io(sec, 0.15, 0.6))
        pf = p_in(sec, 0.7, 0.3)
        if pf > 0:
            pulse = 0.5 + 0.5 * math.sin(sec * 4.0)
            circle(im, (fx, CY), 20, fill=AMBER, alpha=pf, glow=10 + 6 * pulse)
        for j, (yy, t0, k1, h1, n1) in enumerate([
                (yu, 0.85, 'if true', 'he’s the fall guy', 'the real crime happened inside the building'),
                (yd, 2.15, 'if false', 'a very convenient story', 'for the one man who knows where the rest went')]):
            pts = curve((fx, CY), (ex, yy))
            pl = p_io(sec, t0, 0.7)
            polyline(im, pts + [(ex + 120, yy)], color=(150, 156, 166), width=5, p=pl)
            if pl >= 0.98:
                poly(im, [(ex + 120, yy - 18), (ex + 150, yy), (ex + 120, yy + 18)], fill=(150, 156, 166))
            tx = ex + 220
            build_label(im, k1, (tx, yy - 78), sec, t0 + 0.45, size=34, tracking=0.2, color=AMBER)
            build_text(im, h1, (tx, yy + 34), sec, t0 + 0.55, size=104, color=INK)
            build_text(im, n1, (tx, yy + 124), sec, t0 + 0.8, size=44, weight='Regular', display=False, color=DIM)

    render('M_TWOPATHS', 4.5, fg, cam=Cam(z=(1.0, 1.07), pan=((-0.012, 0.0), (0.012, 0.0))),
           bg=backdrop(grid=True, glow=(0.45, 0.5)), stills=stills)


@clip('M_QUESTION', 5.0, 'S52', 'end question "MASTERMIND - OR FALL GUY?" with small "Tell us in the comments" (VO S52)')
def m_question(stills=None):
    s1, s2 = 'MASTERMIND —', 'OR FALL GUY?'
    size = 250
    f = G.font(size, 'SemiBold', True)

    def letters(im, s, xc, y, sec, t0, colf):
        w = f.getlength(s)
        x0 = xc - w / 2
        for i, ch in enumerate(s):
            if ch == ' ':
                continue
            p = p_in(sec, t0 + 0.035 * i, 0.5)
            if p <= 0:
                continue
            text(im, ch, (x0 + f.getlength(s[:i]), y), size=size, color=colf(i, ch), alpha=p, dy=(1 - p) * 60,
                 blur=(1 - p) * 9)

    def fg(im, sec, u):
        letters(im, s1, CX, CY - 60, sec, 0.15, lambda i, c: INK)
        letters(im, s2, CX, CY + 230, sec, 0.85, lambda i, c: DIM if i < 2 else (AMBER if c == '?' else INK))
        build_label(im, 'tell us in the comments', (CX, CY + 450), sec, 2.0, size=40, tracking=0.2, anchor='ms')

    render('M_QUESTION', 5.0, fg, cam=Cam(z=(1.0, 1.1), pan=((0.0, 0.01), (0.0, -0.006)), lin=0.5),
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
