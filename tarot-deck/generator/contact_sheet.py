"""
Contact sheet builder — compile generated cards into grids for visual review.

Usage:
    python3 contact_sheet.py majors   # 22-card major arcana grid (6×4)
    python3 contact_sheet.py minors   # 56-card minor arcana grid (8×7)
    python3 contact_sheet.py all      # full 78-card grid (10×8)
    python3 contact_sheet.py suit wands|cups|swords|pentacles
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("ERROR: Pillow not installed. Run: pip3 install pillow")

HERE = Path(__file__).parent
MANIFEST = HERE / "deck_manifest.json"
OUTPUT_DIR = HERE / "output"
MAJOR_DIR = OUTPUT_DIR / "major"
MINOR_DIR = OUTPUT_DIR / "minor"
SHEETS_DIR = OUTPUT_DIR / "contact_sheets"
SHEETS_DIR.mkdir(parents=True, exist_ok=True)

# Per-cell size in the sheet — downscaled from source 896x1344
CELL_W = 320
CELL_H = 480
PAD = 14
LABEL_H = 26
BG_COLOR = (13, 13, 26)      # voidBlack
LABEL_COLOR = (212, 175, 55) # celestialGold
MISSING_COLOR = (40, 40, 60)


def _load_manifest() -> dict:
    with open(MANIFEST) as f:
        return json.load(f)


def _card_path(card: dict) -> Path:
    base = MAJOR_DIR if card["arcana"] == "major" else MINOR_DIR
    return base / card["output_filename"]


def _render_cell(card: dict, draw_placeholder_if_missing: bool = True) -> Image.Image:
    """Return a CELL_W x (CELL_H + LABEL_H) tile for this card."""
    tile = Image.new("RGB", (CELL_W, CELL_H + LABEL_H), BG_COLOR)
    path = _card_path(card)

    if path.exists() and path.stat().st_size > 20_000:
        try:
            img = Image.open(path).convert("RGB")
            img.thumbnail((CELL_W, CELL_H), Image.LANCZOS)
            ox = (CELL_W - img.width) // 2
            oy = (CELL_H - img.height) // 2
            tile.paste(img, (ox, oy))
        except Exception as e:
            print(f"  ⚠ failed to open {path.name}: {e}")
    elif draw_placeholder_if_missing:
        d = ImageDraw.Draw(tile)
        d.rectangle([(10, 10), (CELL_W - 10, CELL_H - 10)], outline=MISSING_COLOR, width=2)
        msg = f"[{card['id']:02d}]\nMISSING"
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
        except Exception:
            font = ImageFont.load_default()
        d.text((CELL_W // 2, CELL_H // 2), msg, fill=(80, 80, 100), font=font, anchor="mm")

    # Label at the bottom
    d = ImageDraw.Draw(tile)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
    except Exception:
        font = ImageFont.load_default()
    label = f"{card['id']:02d}  {card['card_name']}"
    d.text((CELL_W // 2, CELL_H + LABEL_H // 2), label, fill=LABEL_COLOR, font=font, anchor="mm")
    return tile


def build_sheet(cards: list[dict], cols: int, title: str, out_name: str) -> Path:
    rows = (len(cards) + cols - 1) // cols
    w = cols * CELL_W + (cols + 1) * PAD
    header_h = 60
    h = header_h + rows * (CELL_H + LABEL_H) + (rows + 1) * PAD
    sheet = Image.new("RGB", (w, h), BG_COLOR)

    # Title bar
    d = ImageDraw.Draw(sheet)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    except Exception:
        title_font = ImageFont.load_default()
    d.text((w // 2, header_h // 2), title, fill=LABEL_COLOR, font=title_font, anchor="mm")

    for i, card in enumerate(cards):
        r, c = divmod(i, cols)
        x = PAD + c * (CELL_W + PAD)
        y = header_h + PAD + r * (CELL_H + LABEL_H + PAD)
        sheet.paste(_render_cell(card), (x, y))

    out_path = SHEETS_DIR / out_name
    sheet.save(out_path, "PNG", optimize=True)
    print(f"✓ {title}: {out_path.name} ({w}x{h}, {len(cards)} cards)")
    return out_path


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    m = _load_manifest()
    all_cards = sorted(m["cards"], key=lambda c: c["id"])
    majors = [c for c in all_cards if c["arcana"] == "major"]
    minors = [c for c in all_cards if c["arcana"] == "minor"]

    mode = sys.argv[1]
    if mode == "majors":
        build_sheet(majors, cols=6, title="OLIVIA ARCANA — MAJOR ARCANA", out_name="majors.png")
    elif mode == "minors":
        build_sheet(minors, cols=8, title="OLIVIA ARCANA — MINOR ARCANA", out_name="minors.png")
    elif mode == "all":
        build_sheet(all_cards, cols=10, title="OLIVIA ARCANA — FULL DECK", out_name="full_deck.png")
    elif mode == "suit":
        if len(sys.argv) < 3:
            sys.exit("Usage: contact_sheet.py suit <wands|cups|swords|pentacles>")
        suit = sys.argv[2].lower().capitalize()
        cards = [c for c in minors if c.get("suit") == suit]
        if not cards:
            sys.exit(f"No cards found for suit {suit!r}")
        build_sheet(cards, cols=7, title=f"OLIVIA ARCANA — {suit.upper()}",
                    out_name=f"suit_{suit.lower()}.png")
    elif mode == "status":
        gen = sum(1 for c in all_cards if c["status"] == "generated")
        pen = sum(1 for c in all_cards if c["status"] == "pending")
        reg = sum(1 for c in all_cards if c["status"] == "regenerate")
        print(f"generated: {gen}  pending: {pen}  regenerate: {reg}  total: {len(all_cards)}")
        files = sum(1 for c in all_cards if _card_path(c).exists())
        print(f"files on disk: {files}/78")
    else:
        sys.exit(f"Unknown mode: {mode}")


if __name__ == "__main__":
    main()
