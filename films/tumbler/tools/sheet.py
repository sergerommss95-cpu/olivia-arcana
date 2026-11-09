#!/usr/bin/env python3
"""Contact sheet of a folder of frames (or explicit files): python3 tools/sheet.py DIR [--cols 4] [--w 480] [--out f.jpg]"""
import os, sys, glob
from PIL import Image, ImageDraw
args = sys.argv[1:]
cols = int(args[args.index('--cols') + 1]) if '--cols' in args else 4
w = int(args[args.index('--w') + 1]) if '--w' in args else 480
out = args[args.index('--out') + 1] if '--out' in args else None
paths = [a for a in args if not a.startswith('--') and a not in (str(cols), str(w), out)]
files = []
for p in paths:
    files += sorted(glob.glob(os.path.join(p, '*.jpg')) + glob.glob(os.path.join(p, '*.png'))) if os.path.isdir(p) else [p]
ims = [Image.open(f).convert('RGB') for f in files]
h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (0, 0, 0))
d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y))
    d.text((x + 4, y + 2), os.path.basename(f), fill=(255, 255, 0))
out = out or (paths[0].rstrip('/') + '_sheet.jpg')
sheet.save(out, quality=88)
print(out)
