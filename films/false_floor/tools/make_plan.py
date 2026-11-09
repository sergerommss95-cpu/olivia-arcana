#!/usr/bin/env python3
"""Write script/PLAN_TABLES.md and stills/plan_timeline.png from tools/plan_data.py."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from plan_data import CH, SETS
C = dict(char=(17, 23, 25), cream=(236, 232, 223), grey=(183, 186, 184), orange=(228, 68, 46), dim=(70, 78, 80))
COL = {'3D': C['orange'], '3DS': C['grey'], 'MG': C['cream'], 'PH': (110, 116, 118)}
NAME = {'3D': 'Animated 3D', '3DS': '3D still + camera move', 'MG': 'Motion graphics', 'PH': 'Photo (cleared)'}
F = lambda w, s: ImageFont.truetype(os.path.join(ROOT, 'fonts', f'BarlowCondensed-{w}.ttf'), s)


def mmss(s):
    return f'{int(s // 60)}:{int(s % 60):02d}'


def chart(path):
    W, H = 1920, 760
    im = Image.new('RGB', (W, H), C['char'])
    d = ImageDraw.Draw(im)
    d.text((100, 52), 'FALSE FLOOR  ·  CASE No. 02  ·  THE TENANT UPSTAIRS', font=F('SemiBold', 30), fill=C['grey'])
    d.text((100, 92), 'EPISODE PLAN — 15:00, CHAPTER BY CHAPTER', font=F('Bold', 64), fill=C['cream'])
    total = sum(s for _, _, sh in CH for _, s, _, _ in sh)
    x0, x1, y = 100, W - 100, 250
    scale = (x1 - x0) / total
    t = 0
    for ci, (name, sub, shots) in enumerate(CH):
        cx = x0 + t * scale
        clen = sum(s for _, s, _, _ in shots)
        for typ, s, st, desc in shots:
            bx = x0 + t * scale
            d.rectangle([bx + 1, y, bx + s * scale - 1, y + 150], fill=COL[typ])
            t += s
        d.line([cx, y - 20, cx, y + 250], fill=C['dim'], width=2)
        d.text((cx + 6, y + 166), mmss(cx and (cx - x0) / scale or 0), font=F('Medium', 22), fill=C['grey'])
        label = name.split(' ', 1)
        d.text((cx + 6, y + 196), label[0] if len(label) > 1 and label[0].isdigit() else 'OPEN', font=F('Bold', 30),
               fill=C['orange'] if ci == 0 else C['cream'])
        if len(label) > 1 and label[0].isdigit():
            nm = label[1]
        else:
            nm = name
        wrap = nm if len(nm) < 14 else nm.replace(' ', '\n', 1)
        d.multiline_text((cx + 6, y + 232), wrap, font=F('Medium', 21), fill=C['grey'], spacing=2)
    d.text((x1 - 40, y + 166), '15:00', font=F('Medium', 22), fill=C['grey'])
    # legend + totals
    tot = {k: 0 for k in COL}
    for _, _, sh in CH:
        for typ, s, _, _ in sh:
            tot[typ] += s
    lx, ly = 100, 600
    for typ in ('3D', '3DS', 'MG', 'PH'):
        d.rectangle([lx, ly, lx + 34, ly + 34], fill=COL[typ])
        d.text((lx + 48, ly - 4), f'{NAME[typ]}  {mmss(tot[typ])}  ({100 * tot[typ] / total:.0f}%)', font=F('SemiBold', 30), fill=C['cream'])
        lx += 455
    d.text((100, 680), f'Animated 3D = {tot["3D"] * 24:,} frames to render  ·  every 3D frame labelled ILLUSTRATIVE RECONSTRUCTION',
           font=F('Medium', 26), fill=C['grey'])
    im.save(path, quality=92)


def tables(path):
    out = ['# Episode plan — shot tables (generated from tools/plan_data.py)\n']
    t = 0
    for name, sub, shots in CH:
        clen = sum(s for _, s, _, _ in shots)
        out.append(f'\n### {name} — {sub} ({mmss(t)}–{mmss(t + clen)})\n')
        out.append('| Time | Len | Type | Set | Shot |\n|---|---|---|---|---|')
        for typ, s, st, desc in shots:
            out.append(f'| {mmss(t)} | {s}s | {NAME[typ]} | {st} | {desc} |')
            t += s
    out.append('\n## 3D sets\n\n| Set | What | Build |\n|---|---|---|')
    for k, (nm, ds) in SETS.items():
        used = sum(s for _, _, sh in CH for typ, s, st, _ in sh if st == k and typ in ('3D', '3DS'))
        out.append(f'| {k} | {nm} ({mmss(used)} on screen) | {ds} |')
    open(path, 'w').write('\n'.join(out) + '\n')


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'stills'), exist_ok=True)
    chart(os.path.join(ROOT, 'stills', 'plan_timeline.jpg'))
    tables(os.path.join(ROOT, 'script', 'PLAN_TABLES.md'))
    print('ok')
