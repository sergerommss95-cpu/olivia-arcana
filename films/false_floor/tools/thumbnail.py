#!/usr/bin/env python3
"""YouTube thumbnails for False Floor: a punchier grade than the film (they're read at ~200 px wide) and 2–4 words of
heavy type. Built at 2560x1440 and downsampled once to 1280x720, kept under YouTube's 2 MB cap.

python3 tools/thumbnail.py            -> out/thumbs/T1_vault.jpg, T2_sandwich.jpg, T3_tenant.jpg + a side-by-side sheet

Brand rules kept: charcoal blacks, cream type, orange only to mark the one connection that matters (the circle / rule),
no faces or real photos, small ILLUSTRATIVE RECONSTRUCTION tag on 3D images.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(FF, 'out', 'thumbs')
W, H = 2560, 1440
CHAR, CREAM, ORANGE = (17, 23, 25), (236, 232, 223), (228, 68, 46)
FONT = lambda w, s: ImageFont.truetype(os.path.join(FF, 'fonts', f'BarlowCondensed-{w}.ttf'), s)


def fit(img, cx=0.5, cy=0.5, zoom=1.0):
    """Cover-crop to 16:9 around (cx, cy) in source fractions, with extra zoom."""
    img = img.convert('RGB')
    sw, sh = img.size
    s = max(W / sw, H / sh) * zoom
    img = img.resize((round(sw * s), round(sh * s)), Image.LANCZOS)
    x = min(max(0, round(cx * img.width - W / 2)), img.width - W)
    y = min(max(0, round(cy * img.height - H / 2)), img.height - H)
    return img.crop((x, y, x + W, y + H))


def grade(img, lift=0.0, warm=0.0, sat=1.12, clarity=0.55, vig=0.42, dark_side=None):
    x = np.asarray(img).astype(np.float32) / 255
    # clarity: large-radius local contrast so the subject reads at small sizes
    blur = np.asarray(img.filter(ImageFilter.GaussianBlur(40))).astype(np.float32) / 255
    x = np.clip(x + (x - blur) * clarity, 0, 1)
    x = np.clip(x + lift * (1 - x) * x * 2, 0, 1)
    x = x * x * (3 - 2 * x) * 0.6 + x * 0.4                      # S-curve
    Y = (x @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    x = np.clip(Y + (x - Y) * sat, 0, 1)
    x = x * np.array([1 + warm, 1 + warm * 0.35, 1 - warm * 0.6], np.float32)
    lo, hi = np.array(CHAR, np.float32) / 255, np.array(CREAM, np.float32) / 255
    x = lo + np.clip(x, 0, 1) * (hi - lo)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = 1 - vig * np.clip(((xx / W - 0.5) * 2) ** 2 * 0.6 + ((yy / H - 0.5) * 2) ** 2 * 0.7 - 0.1, 0, 1)
    if dark_side:   # darken the side the type sits on (a soft gradient, not a box)
        t = xx / W if dark_side == 'left' else 1 - xx / W
        v = v * (0.42 + 0.58 * np.clip((t - 0.05) / 0.5, 0, 1) ** 0.8)
    x = lo + (x - lo) * v[..., None]
    g = np.random.default_rng(3).standard_normal((H, W, 1)).astype(np.float32)
    x = x + g * 0.012
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def shadowed_text(base, xy, text, font, fill=CREAM, anchor='la', shadow=26, tracking=0):
    """Type with a soft dark drop so it holds over any background."""
    lay = Image.new('L', base.size, 0)
    d = ImageDraw.Draw(lay)
    _draw(d, xy, text, font, 255, anchor, tracking)
    sh = lay.filter(ImageFilter.GaussianBlur(shadow)).point(lambda p: int(p * 0.85))
    base.paste(Image.new('RGB', base.size, (8, 10, 11)), (0, 0), sh)
    col = Image.new('L', base.size, 0)
    _draw(ImageDraw.Draw(col), xy, text, font, 255, anchor, tracking)
    base.paste(Image.new('RGB', base.size, fill), (0, 0), col)
    return ImageDraw.Draw(lay).textbbox(xy, text, font=font, anchor=anchor)


def _draw(d, xy, text, font, fill, anchor, tracking):
    if not tracking:
        d.text(xy, text, font=font, fill=fill, anchor=anchor)
        return
    x, y = xy
    total = sum(font.getlength(c) for c in text) + tracking * (len(text) - 1)
    if anchor[0] == 'r':
        x -= total
    elif anchor[0] == 'm':
        x -= total / 2
    for c in text:
        d.text((x, y), c, font=font, fill=fill, anchor='l' + anchor[1])
        x += font.getlength(c) + tracking


def tags(img, recon=True):
    d = ImageDraw.Draw(img)
    f = FONT('SemiBold', 44)
    _draw(d, (W - 90, H - 80), 'FALSE FLOOR · CASE No. 02', f, (205, 200, 190), 'rs', 6)
    if recon:
        _draw(d, (90, H - 80), 'ILLUSTRATIVE RECONSTRUCTION', FONT('Medium', 34), (170, 168, 160), 'ls', 5)


def ring(img, cx, cy, r, width=22):
    """Orange marker ring (the brand's 'connection' colour), drawn at 2x for a clean edge."""
    S = 2
    m = Image.new('L', (W * S, H * S), 0)
    ImageDraw.Draw(m).ellipse([(cx - r) * S, (cy - r * 0.82) * S, (cx + r) * S, (cy + r * 0.82) * S], outline=255,
                              width=width * S)
    m = m.resize((W, H), Image.LANCZOS)
    glow = m.filter(ImageFilter.GaussianBlur(18)).point(lambda p: int(p * 0.5))
    img.paste(Image.new('RGB', (W, H), (255, 120, 80)), (0, 0), glow)
    img.paste(Image.new('RGB', (W, H), ORANGE), (0, 0), m)


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    small = img.resize((1280, 720), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
    for q in (95, 92, 88, 84):
        small.save(p, quality=q, subsampling=0, optimize=True)
        if os.path.getsize(p) < 1_900_000:
            break
    print(p, os.path.getsize(p) // 1024, 'KB')
    return p


def t1_vault():
    src = os.path.join(FF, 'tests', 'SF1_vault_final_f0001.jpg')
    img = grade(fit(Image.open(src), cx=0.56, cy=0.5, zoom=1.08), lift=0.18, warm=0.05, dark_side='left')
    shadowed_text(img, (150, 470), '10 LAYERS.', FONT('Bold', 330))
    b = shadowed_text(img, (150, 840), '0 ALARMS.', FONT('Bold', 330))
    ImageDraw.Draw(img).rectangle([158, b[3] + 46, 158 + 520, b[3] + 46 + 22], fill=ORANGE)
    tags(img)
    return save(img, 'T1_vault.jpg')


def t2_sandwich():
    src = os.path.join(FF, 'out', 'clips', 'S36.png')
    img = grade(fit(Image.open(src), cx=0.59, cy=0.52, zoom=1.55), lift=0.12, warm=0.06, sat=1.18, dark_side='right')
    ring(img, 845, 893, 430)
    shadowed_text(img, (W - 150, 300), 'THE', FONT('Bold', 200), anchor='ra')
    shadowed_text(img, (W - 150, 500), '$100M', FONT('Bold', 400), anchor='ra')
    shadowed_text(img, (W - 150, 920), 'MISTAKE', FONT('Bold', 300), anchor='ra')
    tags(img)
    return save(img, 'T2_sandwich.jpg')


def t3_tenant():
    src = os.path.join(FF, 'tests', 'SF3_section_final_f0001.jpg')
    img = grade(fit(Image.open(src), cx=0.6, cy=0.48, zoom=1.12), lift=0.08, sat=1.05, clarity=0.35, dark_side='left')
    shadowed_text(img, (150, 380), 'HE RENTED', FONT('Bold', 280))
    shadowed_text(img, (150, 680), 'THE OFFICE', FONT('Bold', 280))
    b = shadowed_text(img, (150, 980), 'UPSTAIRS', FONT('Bold', 280), fill=ORANGE)
    tags(img)
    return save(img, 'T3_tenant.jpg')


if __name__ == '__main__':
    ps = [t1_vault(), t2_sandwich(), t3_tenant()]
    sheet = Image.new('RGB', (1280 * 2 + 30, 720 * 2 + 30), (30, 30, 30))
    for i, p in enumerate(ps):
        sheet.paste(Image.open(p), ((i % 2) * 1310, (i // 2) * 750))
    # small-size check: how it reads in the feed (~320 px wide)
    for i, p in enumerate(ps):
        sheet.paste(Image.open(p).resize((320, 180), Image.LANCZOS), (1310 + 40 + i * 400 // 1, 750 + 60 + (i % 1) * 0))
    sheet.save(os.path.join(OUT, 'thumbs_sheet.jpg'), quality=90)
    print(os.path.join(OUT, 'thumbs_sheet.jpg'))
