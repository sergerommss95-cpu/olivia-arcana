"""
SVG trace v2 — Canny edge detection → stroke paths → glowing hairlines.
Not filled silhouettes. Actual line art. Magical.
"""
import subprocess, re, tempfile
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

SRC = Path(__file__).parent / "output/nano_banana_v4/00_the_fool.png"
OUT = Path("/tmp/00_the_fool_traced.svg")

img = Image.open(SRC).convert("RGB")
W, H = img.size
a = np.array(img, dtype=np.uint8)

# ── 1. Isolate the gold+silver figure from black bg ───────────────────
gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)

# Threshold: anything above 40 brightness is figure content
_, fg_mask = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)

# ── 2. Canny edges on the figure only ────────────────────────────────
# Blur first to reduce noise, then find edges
blurred = cv2.GaussianBlur(gray, (3, 3), 0)
edges = cv2.Canny(blurred, threshold1=30, threshold2=90)

# Keep only edges that are ON the figure (not black bg noise)
edges = cv2.bitwise_and(edges, fg_mask)

# Dilate slightly for thicker, more visible strokes
kernel = np.ones((2, 2), np.uint8)
edges = cv2.dilate(edges, kernel, iterations=1)

# ── 3. Separate gold vs silver for two-tone ───────────────────────────
af = a.astype(np.float32)
r, g, b = af[..., 0], af[..., 1], af[..., 2]
warmth = (r + g) / 2 - b
neutral = 255 - np.abs(r - g) - np.abs(g - b)

gold_zone   = ((warmth > 25) | (gray > 60))
silver_zone = (neutral > 180) & (gray > 120) & ~gold_zone

edges_gold   = cv2.bitwise_and(edges, edges, mask=gold_zone.astype(np.uint8) * 255)
edges_silver = cv2.bitwise_and(edges, edges, mask=silver_zone.astype(np.uint8) * 255)

# ── 4. Trace each edge map with potrace ───────────────────────────────
def trace_edges(edge_img: np.ndarray, label: str) -> str:
    pil = Image.fromarray(255 - edge_img)  # invert: white bg, dark lines
    with tempfile.NamedTemporaryFile(suffix=".pbm", delete=False) as f:
        pbm = f.name
    with tempfile.NamedTemporaryFile(suffix=".svg", delete=False) as f:
        svg_out = f.name
    pil.save(pbm)
    subprocess.run(
        ["potrace", "--svg", "--turdsize", "2",
         "--alphamax", "1.0", "--opttolerance", "0.4",
         "-o", svg_out, pbm],
        capture_output=True, check=True
    )
    raw = Path(svg_out).read_text()
    m = re.search(r'<g\s+transform="([^"]+)"[^>]*>(.*?)</g>', raw, re.DOTALL)
    if not m:
        return f'<g id="{label}"></g>'
    n = m.group(2).count("<path")
    print(f"  {label}: {n} paths")
    return f'<g id="{label}" transform="{m.group(1)}">{m.group(2).strip()}</g>'

print(f"Tracing {SRC.name} ({W}x{H})…")
gold_g   = trace_edges(edges_gold,   "gold-figure")
silver_g = trace_edges(edges_silver, "silver-cosmic")

px, py = int(W * 0.05), int(H * 0.03)

SVG = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="60%">
      <stop offset="0%"   stop-color="#1a1040"/>
      <stop offset="50%"  stop-color="#0e0825"/>
      <stop offset="100%" stop-color="#05030e"/>
    </radialGradient>
    <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="silver-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    #gold-figure path {{
      fill: #c9a84c;
      filter: url(#gold-glow);
      animation: breathe 8s ease-in-out infinite alternate;
    }}
    #silver-cosmic path {{
      fill: #dde0ff;
      filter: url(#silver-glow);
      animation: twinkle 4s ease-in-out infinite alternate;
    }}
    @keyframes breathe {{
      from {{ opacity: .80; }}
      to   {{ opacity: 1.0; }}
    }}
    @keyframes twinkle {{
      from {{ opacity: .50; }}
      to   {{ opacity: 1.0; }}
    }}
  </style>

  <!-- Deep indigo card face -->
  <rect width="{W}" height="{H}" fill="#030209" rx="28"/>
  <rect x="8" y="12" width="{W-16}" height="{H-24}" fill="url(#bg)" rx="22"/>

  <!-- Hairline border -->
  <rect x="{px}" y="{py}" width="{W-px*2}" height="{H-py*2}"
        fill="none" stroke="#c9a84c" stroke-width="1" rx="3" opacity=".6"/>

  <!-- Figure -->
  {gold_g}
  {silver_g}
</svg>"""

OUT.write_text(SVG)
kb = OUT.stat().st_size // 1024
print(f"=> {OUT}  {kb} KB")
