"""Shared look for every code-animated graphic (M_*) and evidence photo move (E_*) in False Floor v3.
Keep all motion graphics on these primitives so the episode reads as one film (see script/EP_v3_PLAN.md · Look).

    import mglib as G
    with G.Clip('M_RULE', seconds=4.0) as clip:            # writes out/clips/M_RULE.mkv (+ handles if asked)
        for f, t in clip.frames():                         # t in 0..1 over the clip (handles excluded)
            im = G.canvas()                                # RGBA 2x supersampled canvas (3840x2160)
            G.text(im, 'NO OFFICE UPSTAIRS', (G.W2 // 2, 900), size=120, anchor='mm', alpha=G.ease(t * 4))
            clip.add(im)                                   # downsample, grade, grain, vignette, encode

Everything is drawn at 2x (3840x2160) and box-filtered to 1920x1080 for clean anti-aliasing.
"""
import math, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(FF, 'out', 'clips')
W, H, FPS = 1920, 1080, 24
SS = 2
W2, H2 = W * SS, H * SS

# palette
BG = (14, 14, 16)            # charcoal base
BG2 = (24, 24, 28)           # panels
INK = (220, 227, 234)        # cold white text
DIM = (140, 146, 154)        # secondary text
AMBER = (232, 163, 61)       # the one accent: routes, highlights, counters
RED = (217, 73, 59)          # alarms / never found
GRID = (44, 46, 52)

# Inter (static .otf files: Inter-*.otf and InterDisplay-*.otf). Set FF_INTER_DIR on a machine that keeps them elsewhere.
FONT_DIR = next((d for d in [os.environ.get('FF_INTER_DIR', ''), os.path.join(FF, 'fonts', 'inter'), '/usr/share/fonts/opentype/inter',
                             os.path.expanduser('~/Library/Fonts'), '/Library/Fonts'] if d and os.path.exists(os.path.join(d, 'Inter-Regular.otf'))),
                '/usr/share/fonts/opentype/inter')
_FONTS = {}


def font(size, weight='SemiBold', display=True):
    """Inter / Inter Display at a size in 2x pixels. weight: Thin, Light, Regular, Medium, SemiBold, Bold, Black."""
    key = (size, weight, display)
    if key not in _FONTS:
        name = f"{'InterDisplay' if display else 'Inter'}-{weight}.otf"
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path):
            path = os.path.join(FONT_DIR, 'Inter-Regular.otf')
        _FONTS[key] = ImageFont.truetype(path, size)
    return _FONTS[key]


def ease(t):
    """cubic in-out, clamped 0..1"""
    t = max(0.0, min(1.0, t))
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def seg(t, a, b):
    """0..1 progress of t inside [a, b] (clip-relative seconds or fractions — caller's choice), clamped."""
    return max(0.0, min(1.0, (t - a) / max(1e-9, b - a)))


def canvas(color=BG):
    return Image.new('RGBA', (W2, H2), color + (255,))


def layer():
    return Image.new('RGBA', (W2, H2), (0, 0, 0, 0))


def text(im, s, xy, size=64, weight='SemiBold', color=INK, alpha=1.0, anchor='la', display=True, tracking=0.0):
    """Draw text on an RGBA image (2x coordinates). tracking in em (0.03 = +3 %), applied per character."""
    if alpha <= 0:
        return
    lay = layer()
    d = ImageDraw.Draw(lay)
    f = font(size, weight, display)
    col = tuple(color) + (int(255 * max(0.0, min(1.0, alpha))),)
    if tracking:
        widths = [d.textlength(c, font=f) + tracking * size for c in s]
        total = sum(widths) - tracking * size
        x, y = xy
        if anchor[0] == 'm':
            x -= total / 2
        elif anchor[0] == 'r':
            x -= total
        a2 = 'l' + anchor[1]
        for c, wdt in zip(s, widths):
            d.text((x, y), c, font=f, fill=col, anchor=a2)
            x += wdt
    else:
        d.text(xy, s, font=f, fill=col, anchor=anchor)
    im.alpha_composite(lay)


def label(im, s, xy, size=34, color=DIM, alpha=1.0, anchor='la'):
    """small caps label with +4 % tracking"""
    text(im, s.upper(), xy, size=size, weight='Medium', color=color, alpha=alpha, anchor=anchor, display=False, tracking=0.04)


def line(im, pts, color=AMBER, width=6, alpha=1.0, glow=0):
    lay = layer()
    d = ImageDraw.Draw(lay)
    d.line([tuple(p) for p in pts], fill=tuple(color) + (int(255 * alpha),), width=width, joint='curve')
    if glow:
        g = lay.filter(ImageFilter.GaussianBlur(glow))
        im.alpha_composite(g)
    im.alpha_composite(lay)


def partial_polyline(pts, t):
    """the first fraction t of a polyline (for drawing routes on)."""
    pts = [np.array(p, float) for p in pts]
    L = [np.linalg.norm(b - a) for a, b in zip(pts, pts[1:])]
    total = sum(L) * max(0.0, min(1.0, t))
    out = [pts[0]]
    for (a, b), l in zip(zip(pts, pts[1:]), L):
        if total <= 0:
            break
        if total >= l:
            out.append(b)
            total -= l
        else:
            out.append(a + (b - a) * (total / l))
            break
    return [tuple(p) for p in out]


def panel(im, box, fill=BG2, alpha=0.92, radius=18, outline=None):
    lay = layer()
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle(box, radius=radius, fill=tuple(fill) + (int(255 * alpha),),
                        outline=(tuple(outline) + (255,)) if outline else None, width=3 if outline else 0)
    im.alpha_composite(lay)


def place_image(im, src, center, scale=1.0, alpha=1.0, rotate=0.0):
    """paste a PIL image (any mode) centred at a 2x-coordinate point."""
    s = src.convert('RGBA')
    if scale != 1.0:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.LANCZOS)
    if rotate:
        s = s.rotate(rotate, resample=Image.BICUBIC, expand=True)
    if alpha < 1.0:
        a = s.split()[3].point(lambda v: int(v * alpha))
        s.putalpha(a)
    im.alpha_composite(s, (int(center[0] - s.width / 2), int(center[1] - s.height / 2)))


def push(src, t, zoom=(1.0, 1.08), pan=((0, 0), (0, 0)), out=(W2, H2)):
    """Fern-style slow push on an image: crop window shrinks from zoom[0] to zoom[1] (eased), centre panned by pan
    (fractions of width/height). Returns an out-sized RGBA image."""
    e = ease(t)
    z = zoom[0] + (zoom[1] - zoom[0]) * e
    cx = 0.5 + pan[0][0] + (pan[1][0] - pan[0][0]) * e
    cy = 0.5 + pan[0][1] + (pan[1][1] - pan[0][1]) * e
    sw, sh = src.size
    ar = out[0] / out[1]
    cw = min(sw, sh * ar) / z
    ch = cw / ar
    x0 = max(0, min(sw - cw, cx * sw - cw / 2))
    y0 = max(0, min(sh - ch, cy * sh - ch / 2))
    return src.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize(out, Image.LANCZOS).convert('RGBA')


def grade_photo(img, warm=0.06, sat=0.78, contrast=1.06, lift=0.02):
    """Bring a real photo into the film's palette: slightly desaturated, warm mids, gentle contrast."""
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    lum = (a * [0.2126, 0.7152, 0.0722]).sum(2, keepdims=True)
    a = lum + (a - lum) * sat
    a = (a - 0.5) * contrast + 0.5 + lift
    a[..., 0] *= 1 + warm
    a[..., 2] *= 1 - warm
    return Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))


def credit(im, s, alpha=0.7):
    """photo credit line, bottom-left (required for every free-licensed photo)."""
    text(im, s, (64 * SS // 2 * 2, H2 - 56), size=36, weight='Regular', color=INK, alpha=alpha, anchor='ls', display=False)


_RNG = np.random.default_rng(7)


def finish(im, grain=2.5, vignette=0.28):
    """2x RGBA -> 1920x1080 RGB uint8 with grain + vignette (the film's finish)."""
    rgb = im.convert('RGB').resize((W, H), Image.BOX)
    a = np.asarray(rgb).astype(np.float32)
    if vignette:
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
        a *= (1 - vignette * r ** 2.2)[..., None]
    if grain:
        a += _RNG.normal(0, grain, a.shape[:2])[..., None]
    return np.clip(a, 0, 255).astype(np.uint8)


class Clip:
    """Context manager that pipes frames to ffmpeg -> out/clips/<ID>.mkv (x264 crf 10, yuv444p, 24 fps).
    handles: extra frames rendered before/after (t < 0 / t > 1) so the editor can trim on words."""

    def __init__(self, cid, seconds, handles=12, out_dir=CLIPS):
        self.cid, self.seconds, self.handles = cid, seconds, handles
        self.n = int(round(seconds * FPS))
        self.path = os.path.join(out_dir, f'{cid}.mkv')
        os.makedirs(out_dir, exist_ok=True)

    def __enter__(self):
        self.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                                   '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '10',
                                   '-pix_fmt', 'yuv444p', self.path], stdin=subprocess.PIPE)
        return self

    def frames(self):
        """yields (frame_index, t) with t = 0..1 across the main part; handles give t slightly < 0 and > 1."""
        for i in range(-self.handles, self.n + self.handles):
            yield i, (i / max(1, self.n - 1))

    def add(self, im, **kw):
        self.p.stdin.write(finish(im, **kw).tobytes())

    def add_rgb(self, arr):
        self.p.stdin.write(np.ascontiguousarray(arr, dtype=np.uint8).tobytes())

    def __exit__(self, *exc):
        self.p.stdin.close()
        self.p.wait()
        print(f'[mg] wrote {self.path} ({self.n} frames + {self.handles}x2 handles)', flush=True)
