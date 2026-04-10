"""
Olivia Arcana — V2 reference-vs-output comparison sheet.

Builds a 2-row grid comparing user's reference images (top) against the
v2 nano banana outputs (bottom) for visual quality validation.

Usage:
    python3 v2_compare.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
REF_DIR = HERE / "references"
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


def build_grid():
    # 3 columns: reference + v2 output pairing
    pairs = [
        ("Reference A", REF_DIR / "ref_fool_classical.png",
         "v2 — The Fool", V2_DIR / "00_the_fool.png"),
        ("Reference B", REF_DIR / "ref_hermit_staff.png",
         "v2 — Justice", V2_DIR / "11_justice.png"),
        ("Reference C", REF_DIR / "ref_motion_sparkles.png",
         "v2 — Two of Wands", V2_DIR / "23_two_of_wands.png"),
    ]

    card_w = 520
    card_h = int(card_w * 3 / 2)
    col_gap = 40
    row_gap = 80
    margin = 50
    label_h = 55
    title_h = 100
    row_title_w = 260

    cols = len(pairs)
    rows = 2

    sheet_w = row_title_w + margin + cols * card_w + (cols - 1) * col_gap + margin
    sheet_h = title_h + rows * (card_h + label_h) + (rows - 1) * row_gap + 2 * margin

    bg = (13, 13, 26)
    gold = (212, 175, 55)
    white = (230, 230, 240)

    sheet = Image.new("RGB", (sheet_w, sheet_h), bg)
    draw = ImageDraw.Draw(sheet)

    title_f = _pick_font(48)
    row_f = _pick_font(34)
    card_f = _pick_font(26)

    # Title
    title = "Olivia Arcana — Reference vs V2 Nano Banana"
    tbb = draw.textbbox((0, 0), title, font=title_f)
    tw = tbb[2] - tbb[0]
    draw.text(((sheet_w - tw) // 2, margin // 2), title, fill=gold, font=title_f)

    def paste_row(row_y: int, row_label: str, images_and_labels):
        # Row label on left
        draw.text((margin, row_y + card_h // 2 - 40), row_label, fill=gold, font=row_f)
        for col, (img_path, lbl) in enumerate(images_and_labels):
            cx = row_title_w + margin + col * (card_w + col_gap)
            if img_path.exists():
                img = Image.open(img_path).convert("RGB")
                img.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
                ox = (card_w - img.width) // 2
                oy = (card_h - img.height) // 2
                sheet.paste(img, (cx + ox, row_y + oy))
            else:
                draw.rectangle([cx, row_y, cx + card_w, row_y + card_h],
                               outline=(80, 80, 100), width=3)
            # Label beneath
            lbb = draw.textbbox((0, 0), lbl, font=card_f)
            lw = lbb[2] - lbb[0]
            draw.text((cx + (card_w - lw) // 2, row_y + card_h + 12),
                      lbl, fill=white, font=card_f)

    ref_row_y = title_h + margin
    out_row_y = ref_row_y + card_h + label_h + row_gap

    paste_row(ref_row_y, "Reference\n(user)",
              [(p[1], p[0]) for p in pairs])
    paste_row(out_row_y, "V2 Nano\nBanana",
              [(p[3], p[2]) for p in pairs])

    out = OUT_DIR / "v2_vs_reference.png"
    sheet.save(out, optimize=True)
    print(f"✓ saved {out}  ({sheet_w}x{sheet_h}, {out.stat().st_size // 1024} KB)")
    return out


if __name__ == "__main__":
    build_grid()
