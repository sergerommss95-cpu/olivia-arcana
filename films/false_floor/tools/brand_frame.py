#!/usr/bin/env python3
"""False Floor finishing for stills/frames: brand grade + editorial type + persistent reconstruction label.

python3 tools/brand_frame.py IN.jpg OUT.jpg [--title "109 / 189"] [--sub "BOXES FORCED"] [--kicker "LEVEL −2"]
        [--label "ILLUSTRATIVE RECONSTRUCTION"] [--orange-rule] [--pos left|right] [--no-label]

Grade: S-curve, black point -> charcoal #111719, white point -> cream #ECE8DF, colour muted toward natural, light
halation on highlights, oval vignette, fine grain. Type: Barlow Condensed (DIN Condensed stand-in), rendered at 3x and
downsampled once, 100 px margins at 1080p. Orange only when --orange-rule (a newly exposed connection).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEX = {'charcoal': (17, 23, 25), 'cream': (236, 232, 223), 'concrete': (183, 186, 184), 'orange': (228, 68, 46)}
FONT = lambda w, s: ImageFont.truetype(os.path.join(ROOT, 'fonts', f'BarlowCondensed-{w}.ttf'), s)


def arg(n, d=None):
    a = sys.argv
    if n in a:
        i = a.index(n)
        return a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith('--') else True
    return d


def grade(img, seed=0):
    x = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    h, w = x.shape[:2]
    # gentle S-curve (contrast in the mids, soft toe and shoulder)
    x = np.clip(x, 0, 1)
    x = x * x * (3 - 2 * x) * 0.55 + x * 0.45
    # mute saturation a touch (natural documentary colour)
    Y = (x @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    x = Y + (x - Y) * 0.86
    # halation: bright cores bleed warm into neighbours (subtle)
    pil = Image.fromarray((np.clip(x, 0, 1) * 255).astype(np.uint8))
    hot = np.asarray(pil.filter(ImageFilter.GaussianBlur(w / 160))).astype(np.float32) / 255.0
    hot = np.clip((hot - 0.62) / 0.38, 0, 1) * np.array([1.0, 0.45, 0.25], np.float32)
    x = x + hot * 0.12
    # brand endpoints: black -> charcoal, white -> cream
    lo = np.array(HEX['charcoal'], np.float32) / 255
    hi = np.array(HEX['cream'], np.float32) / 255
    x = lo + np.clip(x, 0, 1) * (hi - lo)
    # vignette
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = 1 - 0.32 * np.clip(((xx / w - 0.5) * 2) ** 2 * 0.7 + ((yy / h - 0.5) * 2) ** 2 * 0.55 - 0.12, 0, 1)
    x = lo + (x - lo) * v[..., None]
    # grain (luma-weighted, fine)
    rng = np.random.default_rng(seed)
    g = rng.standard_normal((h, w, 1)).astype(np.float32)
    Yx = (x @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    x = x + g * 0.018 * (0.4 + 0.6 * np.sqrt(np.clip(Yx, 0, 1)))
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def text_layer(size, items):
    """items: list of (text, font_weight, px, (x, y), color, tracking, anchor). Rendered at 3x then downsampled."""
    S = 3
    W, H = size
    lay = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for it in items:
        kind = it[0]
        if kind == 'rect':
            _, (x0, y0, x1, y1), col = it
            d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=col + (255,))
            continue
        _, text, wgt, px, (x, y), col, track, anchor = it
        f = FONT(wgt, px * S)
        cx = x * S
        if anchor in ('rb', 'rs', 'rt', 'rm'):
            total = sum(d.textlength(ch, font=f) + track * S for ch in text) - track * S
            cx -= total
            anchor = 'l' + anchor[1]
        for ch in text:
            d.text((cx, y * S), ch, font=f, fill=col + (255,), anchor=anchor)
            cx += d.textlength(ch, font=f) + track * S
    return lay.resize((W, H), Image.LANCZOS)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert('RGB')
    if img.size != (1920, 1080):
        img = img.resize((1920, 1080), Image.LANCZOS)
    out = grade(img).convert('RGBA')
    W, H = out.size
    M = 100
    cream, concrete, orange = HEX['cream'], HEX['concrete'], HEX['orange']
    items = []
    pos = arg('--pos', 'left')
    title, sub, kicker = arg('--title'), arg('--sub'), arg('--kicker')
    ax = M if pos == 'left' else W - M
    anc = 'ls' if pos == 'left' else 'rs'
    ty = H - 190
    if kicker:
        items.append(('t', kicker, 'SemiBold', 30, (ax, ty - 168), concrete, 4, anc))
    if title:
        items.append(('t', title, 'Bold', int(arg('--title-size', 150)), (ax, ty), cream, 2, anc))
    if arg('--orange-rule'):
        x0 = ax if pos == 'left' else ax - 220
        items.append(('rect', (x0, ty + 22, x0 + 220, ty + 28), orange))
    if sub:
        items.append(('t', sub, 'Medium', 34, (ax, ty + 72), concrete, 5, anc))
    # in-picture labels at projected 3D anchors: --anchors file.json --tags "office=TENANT'S OFFICE|vault=LEVEL −2"
    if arg('--anchors') and arg('--tags'):
        import json
        A = json.load(open(arg('--anchors')))
        for pair in arg('--tags').split('|'):
            k, txt = pair.split('=', 1)
            hot = txt.startswith('!')
            txt = txt.lstrip('!')
            ax_, ay_ = A[k][0] * W, A[k][1] * H
            col = orange if hot else cream
            items.append(('rect', (ax_ - 4, ay_ - 4, ax_ + 4, ay_ + 4), col))
            items.append(('rect', (ax_ + 4, ay_ - 1, ax_ + 64, ay_ + 1), concrete))
            items.append(('t', txt, 'SemiBold', 28, (ax_ + 76, ay_ + 10), col, 3, 'ls'))
    if not arg('--no-label'):
        items.append(('t', arg('--label', 'ILLUSTRATIVE RECONSTRUCTION'), 'Medium', 22, (M, H - 52), concrete, 3, 'ls'))
        items.append(('t', 'FALSE FLOOR · CASE No. 02', 'Medium', 22, (W - M, H - 52), concrete, 3, 'rs'))
    lay = text_layer((W, H), items)
    out = Image.alpha_composite(out, lay).convert('RGB')
    out.save(dst, quality=94)
    print(dst)


if __name__ == '__main__':
    main()
