"""
Olivia Arcana — Full 78-card deck contact sheet.

Builds a grid image showing all 78 cards at a glance, ordered by
ID (Majors first 0-21, then Wands, Cups, Swords, Pentacles).
Layout: 13 cols × 6 rows = 78 cells.

Usage:
    python3 deck_contact_sheet.py              # from v2 folder
    python3 deck_contact_sheet.py --v1         # from v1 folder
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
MANIFEST = HERE / "deck_manifest.json"
V1_DIRS = [HERE / "output" / "major", HERE / "output" / "minor"]
V2_DIR = HERE / "output" / "nano_banana_v2"
OUT_DIR = HERE / "output" / "ab_comparison"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _pick_font(size: int) -> ImageFont.ImageFont:
    for c in [
        "/System/Library/Fonts/Supplemental/Playfair Display.ttc",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def _find_card(card, v1: bool) -> Path | None:
    fname = card["output_filename"]
    if v1:
        for d in V1_DIRS:
            p = d / fname
            if p.exists():
                return p
        return None
    p = V2_DIR / fname
    return p if p.exists() else None


def build(v1: bool = False) -> Path:
    manifest = json.load(open(MANIFEST))
    cards = sorted(manifest["cards"], key=lambda c: c["id"])

    # Grid layout: 13 cols × 6 rows = 78 cells
    cols = 13
    rows = 6
    cell_w = 280
    cell_h = 420  # 2:3 aspect
    label_h = 28
    margin = 40
    title_h = 90
    gap = 14

    sheet_w = margin * 2 + cols * cell_w + (cols - 1) * gap
    sheet_h = title_h + margin + rows * (cell_h + label_h) + (rows - 1) * gap + margin

    bg = (13, 13, 26)
    gold = (212, 175, 55)
    white = (220, 220, 230)

    sheet = Image.new("RGB", (sheet_w, sheet_h), bg)
    draw = ImageDraw.Draw(sheet)

    title_f = _pick_font(52)
    label_f = _pick_font(17)

    label = "Olivia Arcana — Full 78-Card Deck (v2 Tilted Glass)"
    if v1:
        label = "Olivia Arcana — v1 COSMOS (BFL Flux 2 Pro)"
    tbb = draw.textbbox((0, 0), label, font=title_f)
    tw = tbb[2] - tbb[0]
    draw.text(((sheet_w - tw) // 2, margin // 2), label, fill=gold, font=title_f)

    for idx, card in enumerate(cards):
        col = idx % cols
        row = idx // cols
        if row >= rows:
            break
        cx = margin + col * (cell_w + gap)
        cy = title_h + margin + row * (cell_h + label_h + gap)

        img_path = _find_card(card, v1)
        if img_path and img_path.exists():
            try:
                img = Image.open(img_path).convert("RGB")
                img.thumbnail((cell_w, cell_h), Image.Resampling.LANCZOS)
                ox = (cell_w - img.width) // 2
                oy = (cell_h - img.height) // 2
                sheet.paste(img, (cx + ox, cy + oy))
            except Exception as e:
                draw.rectangle([cx, cy, cx + cell_w, cy + cell_h],
                               outline=(80, 80, 100), width=3)
                draw.text((cx + 10, cy + 10), f"err\n{e}", fill=(200, 80, 80), font=label_f)
        else:
            draw.rectangle([cx, cy, cx + cell_w, cy + cell_h],
                           outline=(80, 80, 100), width=3)
            draw.text((cx + cell_w // 2 - 20, cy + cell_h // 2 - 8),
                      "—", fill=(100, 100, 120), font=label_f)

        # Label beneath
        name = f"{card['id']:02d} {card['card_name']}"
        lbb = draw.textbbox((0, 0), name, font=label_f)
        lw = lbb[2] - lbb[0]
        # Truncate if too wide
        while lw > cell_w - 8 and len(name) > 10:
            name = name[:-2] + "…"
            lbb = draw.textbbox((0, 0), name, font=label_f)
            lw = lbb[2] - lbb[0]
        draw.text((cx + (cell_w - lw) // 2, cy + cell_h + 6),
                  name, fill=white, font=label_f)

    suffix = "v1" if v1 else "v2"
    out = OUT_DIR / f"full_deck_contact_sheet_{suffix}.png"
    sheet.save(out, optimize=True)
    print(f"✓ saved {out}  ({sheet_w}x{sheet_h}, {out.stat().st_size // 1024} KB)")
    return out


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--v1", action="store_true", help="Build sheet from v1 BFL outputs instead of v2")
    args = p.parse_args()
    build(v1=args.v1)
