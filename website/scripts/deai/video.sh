#!/usr/bin/env bash
# De-AI a HeyGen-style talking-head video.
#
# Usage:  ./video.sh <input.mp4> <output.mp4>
# See docs/handoff/13-olivia-ai-tells-checklist.md for rationale.
#
# Applied filters:
#   - crop template title pill (HeyGen adds a lower-third; remove)
#   - Portra-style color grade (warm mids, cool shadows, lifted blacks)
#   - unsharp + chroma blur (breaks digital sharpness signature)
#   - subtle vignette
#   - temporal film grain (animates so single frames aren't frozen-clean)
#   - micro handheld drift via two overlapping sine waves
#   - audio: strip HF sheen, gentle compressor, short room echo

set -euo pipefail

IN="${1:-}"
OUT="${2:-}"

if [[ -z "$IN" || -z "$OUT" ]]; then
  echo "usage: $0 <input.mp4> <output.mp4>" >&2
  exit 2
fi

ffmpeg -y -i "$IN" \
  -filter_complex "\
[0:v]crop=iw:ih*0.80:0:ih*0.03,\
scale=1080:1728,\
eq=contrast=1.06:saturation=0.88:gamma=0.99,\
colorbalance=rs=0.02:gs=0.008:bs=-0.02:rm=0.038:gm=0.012:bm=-0.022:rh=0.012:gh=0.006:bh=-0.012,\
curves=r='0/0.04 0.15/0.16 0.5/0.518 0.85/0.865 1/0.985':b='0/0.05 0.15/0.172 0.5/0.492 0.85/0.825 1/0.975':g='0/0.045 0.5/0.5 1/0.99',\
unsharp=5:5:0.38:3:3:-0.12,\
vignette=angle=PI/5.2:mode=backward,\
noise=alls=8:allf=t+u,\
crop=iw-30:ih-30:15+2.8*sin(2*PI*t/5.5):15+2.1*sin(2*PI*t/7.3+1.3),\
scale=1080:1728,\
setsar=1[v];\
[0:a]highpass=f=88,lowpass=f=13200,acompressor=threshold=-19dB:ratio=2.2:attack=6:release=140,aecho=0.38:0.6:32:0.13,volume=1.02[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  "$OUT"
