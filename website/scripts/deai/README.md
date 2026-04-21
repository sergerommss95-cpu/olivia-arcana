# De-AI pipeline

Post-processing scripts that strip the AI "tells" from generated portraits,
videos, and voice. Every Olivia asset runs through these before shipping.

Rationale lives in `docs/handoff/13-olivia-ai-tells-checklist.md`.

## Scripts

| Script | Input | Purpose |
|---|---|---|
| `portrait.py` | jpg | Subject-aware defocus + Portra grade + grain + CA + halation |
| `video.sh` | mp4 | Crop HeyGen title + Portra grade + drift + grain + degraded audio |
| `voice.sh` | mp3 | HF-trim + compressor + room echo + declick |

## Usage

```bash
# Portrait
python3 scripts/deai/portrait.py INPUT.jpg OUTPUT.jpg

# Video
./scripts/deai/video.sh INPUT.mp4 OUTPUT.mp4

# Voice
./scripts/deai/voice.sh INPUT.mp3 OUTPUT.mp3
```

## Dependencies

- Python 3.9+ with `opencv-python`, `numpy`
- `ffmpeg` 6+ (tested on 8.1)

```bash
pip install opencv-python numpy
brew install ffmpeg
```

## Regeneration workflow

1. Generate asset via Midjourney / HeyGen / ElevenLabs.
2. Save the raw output.
3. Run the appropriate script.
4. Audit against the AI-tells checklist (doc 13).
5. Ship to `public/olivia/` or `public/videos/`.

Never ship a raw AI output. The post-processing is the brand.
