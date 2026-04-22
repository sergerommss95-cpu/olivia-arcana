"""Per-frame de-AI v2 — uses u2net subject masks + Avedon-dark bg.

Same pipeline as portrait v7. Each frame goes through:
1. u2net person segmentation → precise subject mask
2. Background kill (30% of blurred + warm-purple floor)
3. Subject mid-lift, grade, rim-light desat, curves
4. Skin-masked texture + chroma noise (confined to subject)
5. Dual film grain
6. Vignette, CA, halation

u2netp is fast enough (~150ms/frame) to run serially on 986 frames
in under 3 minutes on CPU. No need to parallelize.
"""

import subprocess
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from rembg import remove, new_session
from PIL import Image

IN = Path(sys.argv[1])
OUT = Path(sys.argv[2])

RAW_DIR = Path("/tmp/vid_frames_raw2")
OUT_DIR = Path("/tmp/vid_frames_out2")
RAW_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Clear output.
for p in OUT_DIR.glob("*.png"):
    p.unlink()

# 1) Extract frames (with HeyGen title crop).
print("[1/3] extracting frames...")
subprocess.run(
    [
        "ffmpeg", "-y", "-i", str(IN),
        "-vf", "crop=iw:ih*0.80:0:ih*0.03,scale=1080:1728",
        "-qscale:v", "2",
        str(RAW_DIR / "frame_%05d.png"),
    ],
    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)
frames = sorted(RAW_DIR.glob("frame_*.png"))
n = len(frames)
print(f"      {n} frames extracted")


def process_frame(src: Path, dst: Path, session, seed: int):
    # Load frame.
    img = cv2.imread(str(src), cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

    # u2net subject mask (using PIL for rembg).
    pil_frame = Image.fromarray((rgb * 255).astype(np.uint8))
    mask_pil = remove(pil_frame, session=session, only_mask=True)
    subject_mask = np.array(mask_pil).astype(np.float32) / 255.0
    subject_mask_d = cv2.dilate(subject_mask, np.ones((7, 7), np.uint8))
    subject_soft = cv2.GaussianBlur(subject_mask_d, (15, 15), 0).astype(np.float32)
    subject_soft = np.clip(subject_soft, 0, 1)

    # Skin sub-mask.
    bgr255 = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    ycrcb = cv2.cvtColor(bgr255, cv2.COLOR_BGR2YCrCb)
    Cr, Cb = ycrcb[..., 1], ycrcb[..., 2]
    skin = ((Cr >= 133) & (Cr <= 180) & (Cb >= 77) & (Cb <= 130)).astype(np.float32)
    skin_soft = cv2.GaussianBlur(skin, (41, 41), 0) * subject_soft

    # 1) bg kill + defocus.
    bg_blur = cv2.GaussianBlur(rgb, (0, 0), sigmaX=22.0)
    bg_dark = (bg_blur * 0.30 + np.array([0.018, 0.015, 0.024], dtype=np.float32) * 0.7).astype(np.float32)
    rgb = (rgb * subject_soft[..., None] + bg_dark * (1 - subject_soft[..., None])).astype(np.float32)

    # 2) lift subject mids.
    rgb = (rgb + 0.042 * subject_soft[..., None] * (1 - rgb)).astype(np.float32)

    # 3) rim-light desat.
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    H_, S_, V_ = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    rim = (((H_ >= 18) & (H_ <= 48)) & (S_ > 0.40) & (V_ > 0.45)).astype(np.float32)
    rim_only = rim * (1 - skin_soft) * subject_soft
    rim_only = cv2.GaussianBlur(rim_only, (21, 21), 0)
    hsv[..., 1] = hsv[..., 1] * (1 - 0.42 * rim_only)
    hsv[..., 2] = hsv[..., 2] * (1 - 0.18 * rim_only)
    rgb = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)

    # 4) grade.
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

    # 5) curves.
    rgb = rgb * (1 - 0.038) + 0.038
    rgb = rgb + 0.42 * (rgb - 0.5) * rgb * (1 - rgb) * 4.0
    rgb = np.clip(rgb, 0, 1)
    mask_hi = np.clip((rgb - 0.86) / 0.14, 0, 1)
    rgb = rgb - mask_hi * (rgb - 0.86) * 0.38
    rgb = np.clip(rgb, 0, 1)

    # 6) cheekbone softening.
    L01 = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    hot = np.clip((L01 - 0.72) / 0.28, 0, 1) * skin_soft
    hot_blur = cv2.GaussianBlur(hot, (0, 0), sigmaX=9)
    rgb = rgb * (1 - hot_blur[..., None] * 0.065)

    # 7) skin texture + chroma noise.
    rng = np.random.default_rng(seed)
    hf = rng.standard_normal((h, w)).astype(np.float32)
    hf = cv2.GaussianBlur(hf, (0, 0), sigmaX=0.95)
    hf = (hf - hf.mean()) / (hf.std() + 1e-6)
    ycr = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2YCrCb).astype(np.float32) / 255.0
    ycr[..., 0] = np.clip(ycr[..., 0] + hf * 0.022 * skin_soft, 0, 1)
    cb_noise = rng.standard_normal((h, w)).astype(np.float32)
    cb_noise = cv2.GaussianBlur(cb_noise, (0, 0), sigmaX=1.8)
    cb_noise = (cb_noise - cb_noise.mean()) / (cb_noise.std() + 1e-6)
    ycr[..., 2] = np.clip(ycr[..., 2] + cb_noise * 0.007 * skin_soft, 0, 1)
    rgb = cv2.cvtColor((ycr * 255).astype(np.uint8), cv2.COLOR_YCrCb2RGB).astype(np.float32) / 255.0

    # 8) dual grain.
    grain_fine = rng.standard_normal((h, w)).astype(np.float32)
    grain_fine = cv2.GaussianBlur(grain_fine, (0, 0), sigmaX=0.55)
    grain_fine = (grain_fine - grain_fine.mean()) / (grain_fine.std() + 1e-6)
    grain_coarse = rng.standard_normal((h, w)).astype(np.float32)
    grain_coarse = cv2.GaussianBlur(grain_coarse, (0, 0), sigmaX=1.1)
    grain_coarse = (grain_coarse - grain_coarse.mean()) / (grain_coarse.std() + 1e-6)
    shadow_weight = 1.0 - L01
    fine_strength = 0.014 * (1.0 + 0.4 * (1.0 - shadow_weight))
    coarse_strength = 0.020 * shadow_weight
    for c in range(3):
        rgb[..., c] = np.clip(rgb[..., c] + grain_fine * fine_strength + grain_coarse * coarse_strength, 0, 1)

    # 9) vignette.
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    r2 = ((xx - cx) / (w * 0.55)) ** 2 + ((yy - cy) / (h * 0.55)) ** 2
    vignette = 1.0 - 0.20 * np.clip(r2 ** 1.22, 0, 1)
    rgb = rgb * vignette[..., None]

    # 10) CA.
    shift = 1.0
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

    # 11) halation.
    bright = np.clip((L01 - 0.78) / 0.22, 0, 1)
    bright_blur = cv2.GaussianBlur(bright, (0, 0), sigmaX=11)
    halation = np.zeros_like(rgb)
    halation[..., 0] = 0.06; halation[..., 1] = 0.025; halation[..., 2] = -0.020
    rgb = np.clip(rgb + halation * bright_blur[..., None] * 0.40, 0, 1)

    out_rgb = (rgb * 255.0 + 0.5).clip(0, 255).astype(np.uint8)
    out_bgr = cv2.cvtColor(out_rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(dst), out_bgr)


# 2) process serially (u2netp is fast enough).
print(f"[2/3] processing {n} frames with u2netp mask...")
session = new_session('u2netp')
t0 = time.time()
for i, src in enumerate(frames):
    process_frame(src, OUT_DIR / src.name, session, seed=(i * 2654435761) & 0x7FFFFFFF)
    if i % 50 == 0:
        elapsed = time.time() - t0
        eta = (elapsed / max(i, 1)) * (n - i) / 60
        print(f"      {i}/{n}  (eta {eta:.1f}min)")
print(f"      done in {(time.time() - t0):.1f}s")

# 3) mux with drift-crop + audio chain.
print("[3/3] encoding...")
subprocess.run(
    [
        "ffmpeg", "-y",
        "-framerate", "25",
        "-i", str(OUT_DIR / "frame_%05d.png"),
        "-i", str(IN),
        "-filter_complex",
        "[0:v]crop=iw-36:ih-36:18+3.0*sin(2*PI*t/5.4):18+2.3*sin(2*PI*t/7.2+1.3),scale=1080:1728,setsar=1[v];"
        "[1:a]highpass=f=85,lowpass=f=12000,"
        "equalizer=f=120:t=q:w=1.8:g=-2,"
        "equalizer=f=280:t=q:w=1.4:g=-1.2,"
        "equalizer=f=1500:t=q:w=1.6:g=+1.2,"
        "equalizer=f=4500:t=q:w=2.0:g=-2,"
        "equalizer=f=8500:t=q:w=1.4:g=-3.5,"
        "acompressor=threshold=-18dB:ratio=2.3:attack=5:release=120:makeup=1.5,"
        "aecho=0.35:0.55:28:0.11[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "160k",
        str(OUT),
    ],
    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)

print(f"done: {OUT}  ({OUT.stat().st_size} bytes)")
