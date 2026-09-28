#!/usr/bin/env bash
# Web deliverables from the near-lossless masters: H.264 MP4 (plays everywhere)
# and VP9 WebM (smaller), no audio, plus a poster. Usage: encode.sh <masters-dir> <out-dir>
set -euo pipefail
masters=${1:-masters}; out=${2:-deliver}
mkdir -p "$out"
for lang in en uk; do
  for layout in landscape portrait; do
    master="$masters/$lang-$layout.mp4"
    [ -f "$master" ] || { echo "missing $master"; continue; }
    # The poster is the card turned face up, after the light has passed over it.
    poster_t=$(node -e "const f = JSON.parse(require('fs').readFileSync('footage-$lang/film.json', 'utf8')); console.log((f.shots.find(s => s.id === 'turn').start + 3.15).toFixed(2))")
    if [ "$layout" = landscape ]; then size=1920x1080; scale="scale=1920:1080"; else size=720x900; scale="scale=720:900:flags=lanczos"; fi
    name="$out/olivia-how-it-works-$lang-$size"
    ffmpeg -y -loglevel error -i "$master" -vf "$scale,format=yuv420p" -c:v libx264 -preset slow -crf 25 -profile:v high -tune film -movflags +faststart -an "$name.mp4"
    ffmpeg -y -loglevel error -i "$master" -vf "$scale,format=yuv420p" -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an "$name.webm"
    ffmpeg -y -loglevel error -ss "$poster_t" -i "$master" -frames:v 1 -vf "$scale" -c:v libwebp -quality 82 "$name-poster.webp"
    if [ "$layout" = portrait ]; then
      # A full-size portrait cut for sharing (stories, messages).
      ffmpeg -y -loglevel error -i "$master" -vf "format=yuv420p" -c:v libx264 -preset slow -crf 23 -profile:v high -tune film -movflags +faststart -an "$out/olivia-how-it-works-$lang-1080x1350.mp4"
    fi
  done
done
ls -la "$out" | awk 'NR>1 {printf "%8.2f MB  %s\n", $5/1048576, $9}'
