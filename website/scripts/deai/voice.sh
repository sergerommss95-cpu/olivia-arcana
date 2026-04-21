#!/usr/bin/env bash
# De-AI an ElevenLabs voice generation.
#
# Usage:  ./voice.sh <input.mp3> <output.mp3>
# See docs/handoff/13-olivia-ai-tells-checklist.md for rationale.
#
# Applied filters:
#   - highpass/lowpass: strips sub-vocal rumble + AI's HF digital sheen
#   - acompressor: gentle compression, mimics analog behavior
#   - aecho: faint 32ms early reflection — 13% wet, adds room tone
#   - adeclick: removes any synthesis clicks
#   - volume: modest makeup gain

set -euo pipefail

IN="${1:-}"
OUT="${2:-}"

if [[ -z "$IN" || -z "$OUT" ]]; then
  echo "usage: $0 <input.mp3> <output.mp3>" >&2
  exit 2
fi

ffmpeg -y -i "$IN" \
  -af "highpass=f=85,lowpass=f=13500,
       acompressor=threshold=-19dB:ratio=2.2:attack=6:release=140,
       aecho=0.38:0.6:32:0.13,
       adeclick,
       volume=1.02" \
  -ar 44100 -b:a 192k \
  "$OUT"
