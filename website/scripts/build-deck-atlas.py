#!/usr/bin/env python3
"""Build the Major Arcana texture sheet that TheDealing samples.

2048x2048, power-of-two so WebGL1 may mipmap it: an 8 x 4 grid of
256 x 512 cells, each card drawn into the top 256 x 439 of its cell at the
deck's own 896:1536. Ten cells stay empty; the UV rect never reaches the
bleed. Cell order is deck order, 00_the_fool … 21_the_world.

    python3 scripts/build-deck-atlas.py            # -> public/deck/
    python3 scripts/build-deck-atlas.py /tmp/out   # elsewhere

Requires ImageMagick 7 (`magick`).
"""
import glob
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "cards-portal")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public", "deck")
CELL_W, CELL_H, CARD_H = 256, 512, 439
COLS, ROWS = 8, 4
QUALITY = 80                                   # ~319KB for all twenty-two

os.makedirs(OUT, exist_ok=True)
files = sorted(
    f for f in glob.glob(os.path.join(SRC, "*.webp"))
    if re.match(r"^(0\d|1\d|2[01])_", os.path.basename(f))
)
if len(files) != 22:
    raise SystemExit(f"expected 22 Major Arcana in {SRC}, found {len(files)}")

sheet = os.path.join(OUT, ".majors.png")
cmd = ["magick", "-size", f"{CELL_W * COLS}x{CELL_H * ROWS}", "xc:#0a0d38"]
for i, f in enumerate(files):
    cmd += ["(", f, "-resize", f"{CELL_W}x{CARD_H}!", ")",
            "-geometry", f"+{(i % COLS) * CELL_W}+{(i // COLS) * CELL_H}", "-composite"]
subprocess.run(cmd + [sheet], check=True)

webp = os.path.join(OUT, f"majors-q{QUALITY}.webp")
subprocess.run(["magick", sheet, "-quality", str(QUALITY),
                "-define", "webp:method=6", webp], check=True)
os.remove(sheet)

print(f"{webp}  {os.path.getsize(webp) / 1024:.0f}KB  {CELL_W * COLS}x{CELL_H * ROWS}")
for i, f in enumerate(files):
    print(f"  cell {i:>2}  col {i % COLS}  row {i // COLS}  {os.path.basename(f)}")
