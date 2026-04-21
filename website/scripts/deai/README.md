# De-AI pipeline

Post-processing scripts that strip the AI "tells" from generated portraits,
videos, and voice. Every Olivia asset runs through these before shipping.

Rationale lives in `docs/handoff/13-olivia-ai-tells-checklist.md`.

## Scripts

| Script | Input | Output | Purpose |
|---|---|---|---|
| `portrait.py` | jpg | jpg | Subject-aware defocus + Portra grade + dual-grain + CA + halation |
| `video.sh` | mp4 | mp4 | Quick pass — ffmpeg filters only (fast, approximate) |
| `video_per_frame.py` | mp4 | mp4 | Slow god-tier pass — portrait.py pipeline on every frame + audio chain (SLOW — 5-10 minutes per clip) |
| `voice.sh` | mp3 | mp3 | HF trim + gentle compressor + short room echo + declick |
| `make_room_tone.py` | — | wav | Generate 60s of synthetic room tone for mixing under voice |

## Usage

```bash
# Portrait — standalone script, CLI args optional (defaults to Olivia paths)
python3 scripts/deai/portrait.py INPUT.jpg OUTPUT.jpg
# or with no args:
python3 scripts/deai/portrait.py   # reads portrait-original.jpg, writes portrait.jpg

# Video — quick ffmpeg-only pass
./scripts/deai/video.sh INPUT.mp4 OUTPUT.mp4

# Video — slow god-tier per-frame pass (use for hero videos)
python3 scripts/deai/video_per_frame.py INPUT.mp4 OUTPUT.mp4

# Voice
./scripts/deai/voice.sh INPUT.mp3 OUTPUT.mp3

# Room tone (one-shot — generate once, mix into many clips)
python3 scripts/deai/make_room_tone.py
# writes /tmp/room-tone.wav
```

## Which video script to use

- **`video.sh`** — day-to-day clips. Fast (<30s). Applies grade, drift,
  grain, crop via ffmpeg filters alone. Quality is 85% of v6.
- **`video_per_frame.py`** — hero videos only. Slow (5-10 min). Exactly
  matches portrait grade, proper subject-aware bg defocus, per-frame
  animated grain. Use for intro videos, daily card hero, landing page.

## Mixing room tone under a processed voice

```bash
python3 scripts/deai/make_room_tone.py   # → /tmp/room-tone.wav

ffmpeg -y -i voice-processed.mp3 -i /tmp/room-tone.wav \
  -filter_complex "\
[1:a]aloop=loop=-1:size=2e+09,volume=+3dB[rt];\
[0:a][rt]amix=inputs=2:duration=first:weights='1 0.22'[a]" \
  -map "[a]" -ar 44100 -b:a 192k voice-final.mp3
```

## Dependencies

- Python 3.9+ with `opencv-python`, `numpy`, `scipy`
- `ffmpeg` 6+ (tested on 8.1)

```bash
pip install opencv-python numpy scipy
brew install ffmpeg
```

## Full regeneration workflow

When you need a new Olivia asset:

1. **Generate** the raw AI (Midjourney portrait / HeyGen video /
   ElevenLabs voice).
2. **Save** the untouched original next to the final (e.g.
   `portrait-original.jpg` beside `portrait.jpg`). This lets you
   re-process when the pipeline improves without regenerating AI.
3. **Run** the appropriate script(s) — portrait.py for stills,
   video_per_frame.py for hero videos, voice.sh for TTS audio.
4. **Audit** against `docs/handoff/13-olivia-ai-tells-checklist.md`.
5. **Ship** only when every giveaway checkbox is unchecked.

The post-processing is the brand. Raw AI outputs never ship.

## Related docs

- `docs/handoff/10-olivia-persona-brief.md` — persona directions +
  anti-AI hardened Midjourney prompt
- `docs/handoff/11-olivia-heygen-scripts.md` — script templates for
  HeyGen avatar videos
- `docs/handoff/12-olivia-elevenlabs-voice.md` — anti-AI ElevenLabs
  prompt + post-processing chain
- `docs/handoff/13-olivia-ai-tells-checklist.md` — exhaustive
  giveaway list for image/motion/voice
- `docs/handoff/14-olivia-voice-audition-playbook.md` — tactical
  guide for picking the right ElevenLabs take
