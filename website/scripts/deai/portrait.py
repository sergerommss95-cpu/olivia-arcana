"""Portrait v7 — u2net-precise subject mask, aggressive bg kill.

Previous mask (v6) = color-threshold skin + turtleneck + dark=hair_ish.
It was ~85% accurate — some bg leaked into the subject zone where the
cosmic nebula hue overlapped the purple turtleneck threshold, and hair
edges were soft.

v7 uses u2net person-segmentation from rembg. Result is pixel-accurate
across hair, shoulders, jewelry. That lets us:

- push background much darker without halo
- apply different texture to subject vs bg (subject: skin noise; bg: stays
  untextured and defocused)
- get a genuinely flat Avedon-style backdrop feel
"""

from pathlib import Path
import cv2
import numpy as np
from rembg import remove, new_session
from PIL import Image

SRC = Path("/tmp/portrait-pre-degrade.jpg")
OUT = Path("/Users/macbookpro/olivia-arcana/website/public/olivia/portrait.jpg")

# Load image.
img = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
h, w = img.shape[:2]
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

# --- u2net precise subject mask ---
print("computing u2net mask...")
session = new_session('u2netp')
mask_pil = remove(Image.open(str(SRC)), session=session, only_mask=True)
subject_mask = np.array(mask_pil).astype(np.float32) / 255.0
# Slight dilation + blur for soft edge.
subject_mask_d = cv2.dilate(subject_mask, np.ones((7, 7), np.uint8))
subject_mask_soft = cv2.GaussianBlur(subject_mask_d, (15, 15), 0)
# Keep two versions: hard for defocus, soft for grade blending.
subject_hard = np.clip(subject_mask, 0, 1).astype(np.float32)
subject_soft = np.clip(subject_mask_soft, 0, 1).astype(np.float32)

# Skin sub-mask (intersect u2net with color-based skin detection).
bgr255 = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
ycrcb = cv2.cvtColor(bgr255, cv2.COLOR_BGR2YCrCb)
Cr, Cb = ycrcb[..., 1], ycrcb[..., 2]
skin = ((Cr >= 133) & (Cr <= 180) & (Cb >= 77) & (Cb <= 130)).astype(np.float32)
skin_soft = cv2.GaussianBlur(skin, (41, 41), 0) * subject_hard

# 1) Background kill + defocus — now very aggressive since mask is precise.
bg_only = 1 - subject_soft
# Heavy blur on bg.
bg_blur = cv2.GaussianBlur(rgb, (0, 0), sigmaX=28.0)
# Pull bg toward very dark (but not pure black — leave some film toe).
bg_dark = (bg_blur * 0.30 + np.array([0.018, 0.015, 0.024], dtype=np.float32) * 0.7).astype(np.float32)
# Composite.
rgb = (rgb * subject_soft[..., None] + bg_dark * (1 - subject_soft[..., None])).astype(np.float32)

# 2) Lift subject mids slightly.
rgb = (rgb + 0.042 * subject_soft[..., None] * (1 - rgb)).astype(np.float32)

# 3) Rim-light desat (extreme orange on hair edge).
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
rim = (((H >= 18) & (H <= 48)) & (S > 0.40) & (V > 0.45)).astype(np.float32)
rim_only = rim * (1 - skin_soft) * subject_soft
rim_only = cv2.GaussianBlur(rim_only, (21, 21), 0)
hsv[..., 1] = hsv[..., 1] * (1 - 0.42 * rim_only)
hsv[..., 2] = hsv[..., 2] * (1 - 0.18 * rim_only)
rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)

# 4) Grade.
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
hsv[..., 1] = np.clip(hsv[..., 1] * 0.82, 0, 1)
rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)

lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
L = lab[..., 0] / 100.0
mid_mask = np.clip(1.0 - np.abs(L - 0.48) * 2.3, 0, 1) ** 1.1
shadow_mask = np.clip(1.0 - L * 1.3, 0, 1) ** 1.6
highlight_mask = np.clip((L - 0.6) / 0.4, 0, 1) ** 1.4

warm = np.zeros_like(rgb); warm[..., 0] = 0.030; warm[..., 1] = 0.011; warm[..., 2] = -0.014
cool = np.zeros_like(rgb); cool[..., 0] = -0.012; cool[..., 1] = 0.004; cool[..., 2] = 0.022
hl = np.zeros_like(rgb); hl[..., 0] = 0.012; hl[..., 1] = 0.008; hl[..., 2] = -0.010
rgb = rgb + warm * mid_mask[..., None] + cool * shadow_mask[..., None] + hl * highlight_mask[..., None]
rgb = np.clip(rgb, 0, 1)

# 5) Curves (film S + lifted blacks + rolled highlights).
rgb = rgb * (1 - 0.038) + 0.038
rgb = rgb + 0.42 * (rgb - 0.5) * rgb * (1 - rgb) * 4.0
rgb = np.clip(rgb, 0, 1)
mask_hi = np.clip((rgb - 0.86) / 0.14, 0, 1)
rgb = rgb - mask_hi * (rgb - 0.86) * 0.38
rgb = np.clip(rgb, 0, 1)

# 6) Cheekbone softening.
L01 = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
hot = np.clip((L01 - 0.72) / 0.28, 0, 1) * skin_soft
hot_blur = cv2.GaussianBlur(hot, (0, 0), sigmaX=9)
rgb = rgb * (1 - hot_blur[..., None] * 0.065)

# 7) Skin texture + chroma noise (only in subject zone).
rng = np.random.default_rng(311)
hf = rng.standard_normal((h, w)).astype(np.float32)
hf = cv2.GaussianBlur(hf, (0, 0), sigmaX=0.95)
hf = (hf - hf.mean()) / (hf.std() + 1e-6)
ycr = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2YCrCb).astype(np.float32) / 255.0
ycr[..., 0] = np.clip(ycr[..., 0] + hf * 0.024 * skin_soft, 0, 1)
lf = rng.standard_normal((h, w)).astype(np.float32)
lf = cv2.GaussianBlur(lf, (0, 0), sigmaX=24)
lf = (lf - lf.mean()) / (lf.std() + 1e-6)
ycr[..., 0] = np.clip(ycr[..., 0] + lf * 0.018 * skin_soft, 0, 1)
cb_noise = rng.standard_normal((h, w)).astype(np.float32)
cb_noise = cv2.GaussianBlur(cb_noise, (0, 0), sigmaX=1.8)
cb_noise = (cb_noise - cb_noise.mean()) / (cb_noise.std() + 1e-6)
ycr[..., 2] = np.clip(ycr[..., 2] + cb_noise * 0.008 * skin_soft, 0, 1)
cr_noise = rng.standard_normal((h, w)).astype(np.float32)
cr_noise = cv2.GaussianBlur(cr_noise, (0, 0), sigmaX=1.8)
cr_noise = (cr_noise - cr_noise.mean()) / (cr_noise.std() + 1e-6)
ycr[..., 1] = np.clip(ycr[..., 1] + cr_noise * 0.008 * skin_soft, 0, 1)
rgb = cv2.cvtColor((ycr * 255).astype(np.uint8), cv2.COLOR_YCrCb2RGB).astype(np.float32) / 255.0

# 8) Dual film grain (shadow-weighted).
grain_fine = rng.standard_normal((h, w)).astype(np.float32)
grain_fine = cv2.GaussianBlur(grain_fine, (0, 0), sigmaX=0.55)
grain_fine = (grain_fine - grain_fine.mean()) / (grain_fine.std() + 1e-6)
grain_coarse = rng.standard_normal((h, w)).astype(np.float32)
grain_coarse = cv2.GaussianBlur(grain_coarse, (0, 0), sigmaX=1.1)
grain_coarse = (grain_coarse - grain_coarse.mean()) / (grain_coarse.std() + 1e-6)
shadow_weight = 1.0 - L01
fine_strength = 0.016 * (1.0 + 0.4 * (1.0 - shadow_weight))
coarse_strength = 0.022 * shadow_weight
for c in range(3):
    rgb[..., c] = np.clip(rgb[..., c] + grain_fine * fine_strength + grain_coarse * coarse_strength, 0, 1)

# 9) Vignette.
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
cx, cy = w / 2, h / 2
r2 = ((xx - cx) / (w * 0.55)) ** 2 + ((yy - cy) / (h * 0.55)) ** 2
vignette = 1.0 - 0.22 * np.clip(r2 ** 1.22, 0, 1)
rgb = rgb * vignette[..., None]

# 10) CA.
shift = 1.05
nx = (xx - cx) / (cx + 1e-6)
ny = (yy - cy) / (cy + 1e-6)
mag = np.sqrt(nx * nx + ny * ny) + 1e-6
nx_u, ny_u = nx / mag, ny / mag
radial_soft = np.clip(np.sqrt(nx * nx + ny * ny), 0, 1) ** 2.0
mxr = (xx + nx_u * shift * radial_soft).astype(np.float32)
myr = (yy + ny_u * shift * radial_soft).astype(np.float32)
mxb = (xx - nx_u * shift * radial_soft).astype(np.float32)
myb = (yy - ny_u * shift * radial_soft).astype(np.float32)
R_ = cv2.remap((rgb[..., 0] * 255).astype(np.uint8), mxr, myr, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(np.float32) / 255.0
B_ = cv2.remap((rgb[..., 2] * 255).astype(np.uint8), mxb, myb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(np.float32) / 255.0
rgb[..., 0] = R_
rgb[..., 2] = B_

# 11) Halation.
bright = np.clip((L01 - 0.78) / 0.22, 0, 1)
bright_blur = cv2.GaussianBlur(bright, (0, 0), sigmaX=11)
halation = np.zeros_like(rgb)
halation[..., 0] = 0.07; halation[..., 1] = 0.028; halation[..., 2] = -0.022
rgb = np.clip(rgb + halation * bright_blur[..., None] * 0.48, 0, 1)

out_rgb = (rgb * 255.0 + 0.5).clip(0, 255).astype(np.uint8)
out_bgr = cv2.cvtColor(out_rgb, cv2.COLOR_RGB2BGR)
cv2.imwrite(str(OUT), out_bgr, [cv2.IMWRITE_JPEG_QUALITY, 93])
print(f"wrote {OUT}  ({OUT.stat().st_size} bytes)")
