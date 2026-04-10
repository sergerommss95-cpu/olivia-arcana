"""
Olivia Arcana — A/B comparison sheet builder.

Creates side-by-side comparison images of the same card rendered on two
backends (BFL Flux 2 Pro vs Gemini/Imagen/Nano Banana).

Usage:
    python3 ab_compare.py single 0                     # Side-by-side for card id 0 only
    python3 ab_compare.py grid                         # 3-card grid: Fool, Two of Wands, Justice
    python3 ab_compare.py grid --cards 0,11,23,36      # Custom card list

Reads BFL output from output/major/|minor/ and Gemini output from
output/nano_banana/. Writes to output/ab_comparison/.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
MANIFEST_PATH = HERE / "deck_manifest.json"
OUTPUT_DIR = HERE / "output"
MAJOR_DIR = OUTPUT_DIR / "major"
MINOR_DIR = OUTPUT_DIR / "minor"
NB_DIR = OUTPUT_DIR / "nano_banana"
COMP_DIR = OUTPUT_DIR / "ab_comparison"
COMP_DIR.mkdir(parents=True, exist_ok=True)


def load_manifest() -> dict:
    with open(MANIFEST_PATH) as f:
        return json.load(f)


def _find_bfl_path(card: dict) -> Optional[Path]:
    d = MAJOR_DIR if card["arcana"] == "major" else MINOR_DIR
    p = d / card["output_filename"]
    return p if p.exists() else None


def _find_nb_path(card: dict) -> Optional[Path]:
    p = NB_DIR / card["output_filename"]
    return p if p.exists() else None


def _pick_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Playfair Display.ttc",
        "/System/Library/Fonts/Supplemental/Cochin.ttc",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            continue
    return ImageFont.load_default()


def build_single(card: dict) -> Path:
    """Build a side-by-side comparison for one card."""
    bfl_path = _find_bfl_path(card)
    nb_path = _find_nb_path(card)

    if not bfl_path:
        sys.exit(f"BFL image missing for {card['card_name']} at {MAJOR_DIR if card['arcana']=='major' else MINOR_DIR}")
    if not nb_path:
        print(f"  ⚠ Nano Banana image missing for {card['card_name']} — rendering BFL-only panel")

    # Target card size (scale down to fit side-by-side)
    card_w = 700
    card_h = int(card_w * 3 / 2)  # 2:3 aspect
    gutter = 40
    margin = 50
    label_h = 80
    title_h = 70

    sheet_w = 2 * card_w + 3 * margin
    sheet_h = title_h + card_h + label_h + 2 * margin

    # Celestial Noir palette
    bg_color = (13, 13, 26)       # #0D0D1A
    title_color = (212, 175, 55)  # #D4AF37 (Olivia gold)
    label_color = (230, 230, 240)

    sheet = Image.new("RGB", (sheet_w, sheet_h), bg_color)
    draw = ImageDraw.Draw(sheet)

    title_font = _pick_font(48)
    label_font = _pick_font(32)

    # Title
    title = f"{card['card_name']} — A/B Comparison"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(
        ((sheet_w - title_w) // 2, margin // 2),
        title,
        fill=title_color,
        font=title_font,
    )

    # Left panel — BFL
    bfl_img = Image.open(bfl_path).convert("RGB")
    bfl_img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
    bx = margin
    by = title_h + margin
    # Center inside the card_w x card_h slot
    offset_x = (card_w - bfl_img.width) // 2
    offset_y = (card_h - bfl_img.height) // 2
    sheet.paste(bfl_img, (bx + offset_x, by + offset_y))
    # BFL label
    bfl_label = "BFL Flux 2 Pro"
    lbb = draw.textbbox((0, 0), bfl_label, font=label_font)
    lw = lbb[2] - lbb[0]
    draw.text(
        (bx + (card_w - lw) // 2, by + card_h + 15),
        bfl_label,
        fill=label_color,
        font=label_font,
    )

    # Right panel — Nano Banana / Imagen / placeholder
    rx = margin * 2 + card_w
    ry = title_h + margin
    if nb_path:
        nb_img = Image.open(nb_path).convert("RGB")
        nb_img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
        offset_x = (card_w - nb_img.width) // 2
        offset_y = (card_h - nb_img.height) // 2
        sheet.paste(nb_img, (rx + offset_x, ry + offset_y))
        nb_label = "Gemini (nano banana)"
    else:
        # Draw a placeholder rectangle with "pending" text
        draw.rectangle(
            [rx, ry, rx + card_w, ry + card_h],
            outline=(80, 80, 100),
            width=3,
        )
        pending_font = _pick_font(36)
        pending_text = "pending paid access"
        pbb = draw.textbbox((0, 0), pending_text, font=pending_font)
        pw = pbb[2] - pbb[0]
        ph = pbb[3] - pbb[1]
        draw.text(
            (rx + (card_w - pw) // 2, ry + (card_h - ph) // 2),
            pending_text,
            fill=(140, 140, 160),
            font=pending_font,
        )
        nb_label = "Gemini (nano banana) — awaiting upgrade"

    nlb = draw.textbbox((0, 0), nb_label, font=label_font)
    nw = nlb[2] - nlb[0]
    draw.text(
        (rx + (card_w - nw) // 2, ry + card_h + 15),
        nb_label,
        fill=label_color,
        font=label_font,
    )

    out_path = COMP_DIR / f"{card['output_filename'].replace('.png', '')}_ab.png"
    sheet.save(out_path, optimize=True)
    print(f"  ✓ {out_path.name}  ({sheet_w}x{sheet_h}, {out_path.stat().st_size // 1024} KB)")
    return out_path


def build_grid(card_ids: list) -> Path:
    """Build a 3+ card grid comparison."""
    manifest = load_manifest()
    cards = []
    for cid in card_ids:
        c = next((x for x in manifest["cards"] if x["id"] == cid), None)
        if c:
            cards.append(c)
        else:
            print(f"  ⚠ skipping unknown id {cid}")
    if not cards:
        sys.exit("No valid cards to compare")

    card_w = 520
    card_h = int(card_w * 3 / 2)
    col_gap = 40
    row_gap = 80
    margin = 50
    label_h = 60
    title_h = 90
    row_title_w = 260  # left column for backend labels

    cols = len(cards)
    rows = 2  # BFL + Nano Banana

    sheet_w = row_title_w + margin + cols * card_w + (cols - 1) * col_gap + margin
    sheet_h = title_h + rows * (card_h + label_h) + (rows - 1) * row_gap + 2 * margin

    bg_color = (13, 13, 26)
    title_color = (212, 175, 55)
    label_color = (230, 230, 240)
    divider_color = (40, 40, 60)

    sheet = Image.new("RGB", (sheet_w, sheet_h), bg_color)
    draw = ImageDraw.Draw(sheet)

    title_font = _pick_font(52)
    card_label_font = _pick_font(30)
    row_label_font = _pick_font(38)

    # Main title
    title = "Olivia Arcana — BFL vs Gemini Nano Banana"
    tbb = draw.textbbox((0, 0), title, font=title_font)
    tw = tbb[2] - tbb[0]
    draw.text(((sheet_w - tw) // 2, margin // 2), title, fill=title_color, font=title_font)

    # Draw card names across the top (column headers)
    for col, card in enumerate(cards):
        cx = row_title_w + margin + col * (card_w + col_gap)
        header = card["card_name"]
        hbb = draw.textbbox((0, 0), header, font=card_label_font)
        hw = hbb[2] - hbb[0]
        draw.text(
            (cx + (card_w - hw) // 2, title_h + margin - 45),
            header,
            fill=label_color,
            font=card_label_font,
        )

    # Row 1: BFL
    row_y = title_h + margin
    # Row label
    draw.text(
        (margin, row_y + card_h // 2 - 20),
        "BFL\nFlux 2 Pro",
        fill=title_color,
        font=row_label_font,
    )
    for col, card in enumerate(cards):
        cx = row_title_w + margin + col * (card_w + col_gap)
        cy = row_y
        bfl_path = _find_bfl_path(card)
        if bfl_path:
            img = Image.open(bfl_path).convert("RGB")
            img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
            ox = (card_w - img.width) // 2
            oy = (card_h - img.height) // 2
            sheet.paste(img, (cx + ox, cy + oy))
        else:
            draw.rectangle([cx, cy, cx + card_w, cy + card_h], outline=(80, 80, 100), width=3)

    # Row 2: Nano Banana
    row_y = title_h + margin + card_h + label_h + row_gap
    draw.text(
        (margin, row_y + card_h // 2 - 20),
        "Gemini\nnano banana",
        fill=title_color,
        font=row_label_font,
    )
    for col, card in enumerate(cards):
        cx = row_title_w + margin + col * (card_w + col_gap)
        cy = row_y
        nb_path = _find_nb_path(card)
        if nb_path:
            img = Image.open(nb_path).convert("RGB")
            img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
            ox = (card_w - img.width) // 2
            oy = (card_h - img.height) // 2
            sheet.paste(img, (cx + ox, cy + oy))
        else:
            draw.rectangle([cx, cy, cx + card_w, cy + card_h], outline=(80, 80, 100), width=3)
            pending_font = _pick_font(28)
            pending = "awaiting paid access"
            pbb = draw.textbbox((0, 0), pending, font=pending_font)
            pw = pbb[2] - pbb[0]
            ph = pbb[3] - pbb[1]
            draw.text(
                (cx + (card_w - pw) // 2, cy + (card_h - ph) // 2),
                pending,
                fill=(140, 140, 160),
                font=pending_font,
            )

    out_path = COMP_DIR / "ab_grid.png"
    sheet.save(out_path, optimize=True)
    print(f"  ✓ {out_path.name}  ({sheet_w}x{sheet_h}, {out_path.stat().st_size // 1024} KB)")
    return out_path


def main():
    p = argparse.ArgumentParser(description="A/B comparison sheet builder")
    sub = p.add_subparsers(dest="command", required=True)

    p_single = sub.add_parser("single", help="Build a single-card A/B comparison")
    p_single.add_argument("id", type=int, help="Card ID")

    p_grid = sub.add_parser("grid", help="Build a grid comparison")
    p_grid.add_argument(
        "--cards",
        default="0,23,11",
        help="Comma-separated card IDs (default: 0,23,11 = Fool, Two of Wands, Justice)",
    )

    args = p.parse_args()

    if args.command == "single":
        manifest = load_manifest()
        card = next((c for c in manifest["cards"] if c["id"] == args.id), None)
        if not card:
            sys.exit(f"Card id {args.id} not found")
        build_single(card)
    elif args.command == "grid":
        card_ids = [int(x.strip()) for x in args.cards.split(",")]
        build_grid(card_ids)


if __name__ == "__main__":
    main()
