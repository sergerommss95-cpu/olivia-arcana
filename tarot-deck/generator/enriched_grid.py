"""
Olivia Arcana — Enriched Symbolism 5-Card Comparison Grid.

Shows the 5 test cards that got densified symbolism (Fool, Magician,
High Priestess, Lovers, Star) in a single row so the user can eyeball
the new treatment and decide whether to densify all 78.

Usage:
    python3 enriched_grid.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
V2_DIR = HERE / "output" / "nano_banana_v2"
OUT_DIR = HERE / "output" / "ab_comparison"
OUT_DIR.mkdir(parents=True, exist_ok=True)


ENRICHED_CARDS = [
    {
        "file": "00_the_fool.png",
        "name": "0 — The Fool",
        "symbols": [
            "white rose (purity)",
            "cliff edge",
            "8-pointed guiding star",
            "rising sun",
        ],
    },
    {
        "file": "01_the_magician.png",
        "name": "I — The Magician",
        "symbols": [
            "infinity lemniscate",
            "ouroboros belt",
            "roses + lilies",
            "4-elements altar",
        ],
    },
    {
        "file": "02_the_high_priestess.png",
        "name": "II — The High Priestess",
        "symbols": [
            "dual light/dark columns",
            "pomegranate veil",
            "triple-moon crown",
            "water at feet",
        ],
    },
    {
        "file": "06_the_lovers.png",
        "name": "VI — The Lovers",
        "symbols": [
            "angel above",
            "tree of knowledge + serpent",
            "tree of life + flames",
            "mountain peak",
        ],
    },
    {
        "file": "17_the_star.png",
        "name": "XVII — The Star",
        "symbols": [
            "1 large 8-pt + 7 small 7-pt",
            "ibis in tree",
            "pool + earth pour",
            "5 rivulets",
        ],
    },
]


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


def build_grid():
    card_w = 480
    card_h = int(card_w * 3 / 2)
    col_gap = 36
    margin = 60
    title_h = 120
    name_h = 52
    symbol_line_h = 30
    symbol_block_h = symbol_line_h * 4 + 20
    bottom_pad = margin

    cols = len(ENRICHED_CARDS)
    sheet_w = 2 * margin + cols * card_w + (cols - 1) * col_gap
    sheet_h = (
        title_h
        + margin // 2
        + card_h
        + 24
        + name_h
        + 8
        + symbol_block_h
        + bottom_pad
    )

    bg = (13, 13, 26)
    gold = (212, 175, 55)
    white = (230, 230, 240)
    dim = (170, 170, 190)

    sheet = Image.new("RGB", (sheet_w, sheet_h), bg)
    draw = ImageDraw.Draw(sheet)

    title_f = _pick_font(56)
    sub_f = _pick_font(28)
    name_f = _pick_font(32)
    sym_f = _pick_font(22)

    title = "Olivia Arcana — Enriched Symbolism Test"
    subtitle = "5 cards densified with traditional tarot symbols — decide: ship minimalist, or densify all 78?"

    tbb = draw.textbbox((0, 0), title, font=title_f)
    tw = tbb[2] - tbb[0]
    draw.text(((sheet_w - tw) // 2, margin // 2), title, fill=gold, font=title_f)

    sbb = draw.textbbox((0, 0), subtitle, font=sub_f)
    sw = sbb[2] - sbb[0]
    draw.text(
        ((sheet_w - sw) // 2, margin // 2 + 70),
        subtitle,
        fill=dim,
        font=sub_f,
    )

    row_y = title_h + margin // 2

    for col, card in enumerate(ENRICHED_CARDS):
        cx = margin + col * (card_w + col_gap)
        img_path = V2_DIR / card["file"]

        if img_path.exists():
            img = Image.open(img_path).convert("RGB")
            img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
            ox = (card_w - img.width) // 2
            oy = (card_h - img.height) // 2
            sheet.paste(img, (cx + ox, row_y + oy))
        else:
            draw.rectangle(
                [cx, row_y, cx + card_w, row_y + card_h],
                outline=(80, 80, 100),
                width=3,
            )
            draw.text(
                (cx + 20, row_y + 20),
                f"missing:\n{card['file']}",
                fill=(180, 80, 80),
                font=sym_f,
            )

        name_y = row_y + card_h + 24
        nbb = draw.textbbox((0, 0), card["name"], font=name_f)
        nw = nbb[2] - nbb[0]
        draw.text(
            (cx + (card_w - nw) // 2, name_y),
            card["name"],
            fill=gold,
            font=name_f,
        )

        sym_y = name_y + name_h + 8
        for i, sym in enumerate(card["symbols"]):
            line = f"·  {sym}"
            lbb = draw.textbbox((0, 0), line, font=sym_f)
            lw = lbb[2] - lbb[0]
            draw.text(
                (cx + (card_w - lw) // 2, sym_y + i * symbol_line_h),
                line,
                fill=white,
                font=sym_f,
            )

    out = OUT_DIR / "enriched_5_cards.png"
    sheet.save(out, optimize=True)
    print(f"✓ saved {out}  ({sheet_w}x{sheet_h}, {out.stat().st_size // 1024} KB)")
    return out


if __name__ == "__main__":
    build_grid()
