"""
Extract the gold figure from each card PNG and drop the baked indigo backdrop,
so the card front can sit over the same nebula gradient the back uses.

Input:  public/cards/NN_name.png         (RGBA, card body has painted backdrop)
Output: public/cards-portal/NN_name.png  (RGBA, figure only, backdrop transparent)

Mask: per-pixel warmth (R+G)/2 - B. Gold lines are warm; the indigo backdrop
is cool. Smooth ramp preserves anti-aliased edges. Anti false-reject for dim
strokes: second mask channel boosts bright-but-slightly-warm pixels.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "public" / "cards"
OUT_DIR = ROOT / "public" / "cards-portal"
OUT_DIR.mkdir(exist_ok=True)

def extract(src: Path, dst: Path) -> tuple[int, float]:
    img = Image.open(src).convert("RGBA")
    a = np.array(img)
    r = a[..., 0].astype(int)
    g = a[..., 1].astype(int)
    b = a[..., 2].astype(int)
    alpha = a[..., 3]

    warmth = (r + g) / 2 - b
    brightness = (r + g + b) / 3

    m1 = np.clip((warmth - 8) / 35.0, 0, 1)
    m2 = np.clip((brightness - 120) / 80 * np.clip((warmth - 2) / 20, 0, 1), 0, 1)
    mask = np.maximum(m1, m2)

    a[..., 3] = (alpha.astype(float) * mask).clip(0, 255).astype(np.uint8)
    Image.fromarray(a, "RGBA").save(dst, optimize=True)
    kept = int((a[..., 3] > 8).sum())
    return kept, kept / a[..., 3].size * 100

def main() -> None:
    pngs = sorted(SRC_DIR.glob("*.png"))
    if not pngs:
        raise SystemExit(f"No PNGs in {SRC_DIR}")
    print(f"Processing {len(pngs)} cards → {OUT_DIR}")
    for src in pngs:
        kept, pct = extract(src, OUT_DIR / src.name)
        print(f"  {src.name}: {kept:>7,} px kept ({pct:4.1f}%)")

if __name__ == "__main__":
    main()
