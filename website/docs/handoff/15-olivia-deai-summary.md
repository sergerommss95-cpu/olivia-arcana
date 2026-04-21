# Olivia — de-AI iteration summary

Comprehensive record of the de-AI sprint: what was wrong, what we
tried, what shipped, and what each asset looks like now.

Use this as the sign-off doc when reviewing the final state of the
Olivia assets — and as a reference for the next person who wonders
"why do we process these images so much?"

---

## The brief

> *"Find a way for Olivia to look (portrait lighting) and sound and
> move less like AI, remove all AI artifacts, and common things that
> scream AI when you watch and listen to video."*

Three assets, three axes: **portrait**, **video**, **voice**. All
three showed characteristic AI "tells":

- **Portrait**: plastic-smooth skin, purple/magenta wash, cinematic
  rim-light halo, too-perfect bokeh background, pure blacks.
- **Video**: HeyGen-template title pill, static camera, pristine
  studio audio, identical face lighting every frame, same AI tells
  as the portrait.
- **Voice**: ElevenLabs Voice Design's default output — broadcast
  clarity, zero breath, identical inter-word spacing, no mouth
  sounds, crisp phrase endings.

---

## Final shipped state

| Asset | Version | File | Path |
|---|---|---|---|
| Portrait | v6 | 590KB jpg | `public/olivia/portrait.jpg` |
| Video | v8 | 22.3MB mp4 | `public/videos/olivia-intro.mp4` |
| Captions | v1 | VTT | `public/videos/olivia-intro.vtt` |
| Raw portrait | — | 324KB jpg | `public/olivia/portrait-original.jpg` |
| Voice | (prompt ready) | — | doc 12 |

**Deployed**: https://olivia-arcana.netlify.app/v3/ (Olivia section
mid-page, Act 4 in the narrative).

---

## Iteration log

### Portrait

- **v1** — basic grade + grain. Yellow cast crept in, background
  still distracting.
- **v2** — subject-aware bg defocus + skin texture injection.
  Background kill too aggressive.
- **v3** — editorial (Roversi direction). Face too dark, lost warmth.
- **v4** — Portra-style warm Portra grade + rolled highlights + lifted
  blacks + dual-frequency grain + halation. **Shipped as interim.**
- **v5** — Avedon-pure-black direction. Background darkening didn't
  take because subject mask bled. Rejected.
- **v6** — Subject mask unified with video v6 (adds hair_ish channel).
  **Final shipped.**

### Video

- **v1** — basic ffmpeg chain (grade, grain, drift). Template title
  still visible.
- **v2** — cropped HeyGen title pill (iw × 0.80). Massive improvement.
- **v3** — added tilt rotation. Produced black-corner artifacts.
  Rejected.
- **v4** — tuned grade to match portrait v2. Shipped as interim.
- **v5** — added hue pulse + brightness breathing + CRF 23.
- **v6** — **per-frame Python grade** (portrait.py on every frame).
  5-minute processing, 6-core parallel. Massive jump — background
  properly defocused, exact grade match to portrait.
- **v7** — mixed in synthetic room tone at 15% weight.
- **v8** — SM7B-emulated EQ curve (broadcast-style low-mid warmth,
  HF rolloff) + stronger room tone (22%). **Final shipped.**

### Voice

- **Prompt v1** — legacy "measured literary presenter"
- **Prompt v2** — "soft/deep/conversational"
- **Prompt v3** — **anti-AI hardened** with explicit
  breath/fry/mouth-sound requests and explicit presenter-rejection.
  Documented in `12-olivia-elevenlabs-voice.md`.

Actual voice regeneration requires the user to go to ElevenLabs and
run 5–8 takes through the new prompt, then use the audition playbook
(doc 14) to pick the winner.

---

## Pipeline scripts

All in `scripts/deai/`:

| Script | Use case |
|---|---|
| `portrait.py` | Any AI-generated still |
| `video.sh` | Quick ffmpeg-only video pass (<30s) |
| `video_per_frame.py` | Hero videos — portrait.py per frame (5-10min) |
| `voice.sh` | Any TTS-generated voice track |
| `make_room_tone.py` | Generate reusable 60s room-tone bed |

See `scripts/deai/README.md` for full usage.

---

## What's different now vs before

### Portrait

- **Plastic skin is gone** — dual skin-masked luma+chroma noise adds
  real surface variation.
- **Purple wash is dead** — hue-selective desat on the 260-325° range,
  confined to non-subject areas.
- **Background is defocused** — soft+heavy Gaussian blur blended by
  subject mask. Cosmic stars read as proper bokeh now.
- **Blacks are lifted** — +4% off zero, so shadows have film "toe."
- **Highlights are rolled** — compression above 0.86 so nothing clips.
- **Grain is dual-frequency** — fine (sigma 0.55) + coarse (sigma 1.1),
  shadow-weighted like real Portra 400.
- **Chromatic aberration** at corners (~1px R outward, B inward).
- **Warm halation** around highlights simulating Kodak film behavior.
- **Rim-light desat** — the obvious orange backlight halo is
  selectively desaturated 32% on saturation, 12% on value.

### Video

- **Title pill cropped** — HeyGen template branding removed entirely.
- **Portra grade matched to portrait** — split-tone (warm mids, cool
  shadows), S-curve, lifted blacks, rolled highlights.
- **Micro handheld drift** — two overlapping sine waves (5.4s and 7.3s
  periods, phase-shifted) jitter the crop origin by up to 3px. No
  perceptible shake, but the "dead still" AI look is gone.
- **Hue pulse + brightness breathing** — subtle sinusoidal variation
  over 13-19s periods. Below conscious perception, but registers as
  "alive."
- **Per-frame grade** — subject-aware bg defocus, skin texture
  injection, chroma noise on skin, dual-frequency grain that animates
  per frame. Matches portrait grade exactly.
- **Room tone bed** — synthetic 60s ambient loop (brown noise <400Hz,
  pink >1.5kHz, 80Hz HVAC wobble) mixed under voice at 22% weight.
- **SM7B-style EQ** — proximity bass pull, mud cut, presence boost,
  de-ess, HF rolloff.
- **Compressor + echo** — gentle studio-grade with +1.5 makeup gain,
  28ms/11% early reflection for room feel.

### Voice (prompt)

- **Explicit imperfection requests** — breath intakes, vocal fry,
  micro-pauses, mouth sounds, phrase-end softening.
- **Explicit rejection list** — broadcast clarity, studio air,
  audiobook performance, upspeak, theatrical mysticism, ASMR
  whisper.
- **Recording context directive** — "small room at home, not studio."
- **Character direction** — "like a friend at the end of a long day."
- **Post-processing chain documented** — highpass/lowpass/compressor/
  echo/declick/room-tone bed.

---

## What's still AI (and why)

Not everything can be post-processed away. What remains:

### Portrait
- **The face itself** is still an AI-generated face — the symmetric
  features, the specific skin topology, the way the highlights fall
  on the nose. This would only improve by regenerating with the
  anti-AI Midjourney prompt (doc 10, Direction 1) or by using a real
  photograph.
- **Rim-light remnants** — we desaturate the obvious orange glow but
  some warm hair backlighting is baked in. The hardened Midjourney
  prompt explicitly rejects "cinematic rim light halo" for the next
  regen.

### Video
- **Head-only motion** — HeyGen avatars only animate the face. The
  shoulders and upper body are effectively static. A real person
  would have shoulder sway, breath movement, tiny direction changes.
  Fixable only by recording a real person OR by a separate post-
  process that adds body micro-motion (out of scope for now).
- **Viseme library** — the mouth shapes on certain consonants (T, S)
  show the "this was generated" character. Fixable only by longer
  clips where the lips get more variation, or by recording real.

### Voice
- **Not yet regenerated** — current voice is the old take. When the
  user runs the anti-AI prompt in ElevenLabs (guided by doc 14), the
  voice will catch up to the visual improvements.

---

## Regeneration workflow

For the next Olivia asset (new daily card video, about-page image,
oracle response clip):

1. Generate raw AI output via Midjourney / HeyGen / ElevenLabs.
2. Save raw to `public/olivia/<asset>-original.<ext>` (preserve it).
3. Run:
   ```bash
   python3 scripts/deai/portrait.py <raw>.jpg <final>.jpg
   python3 scripts/deai/video_per_frame.py <raw>.mp4 <final>.mp4
   ./scripts/deai/voice.sh <raw>.mp3 <final>.mp3
   ```
4. Audit against doc 13 (AI-tells checklist).
5. For voice takes: use doc 14 audition playbook.
6. Ship only when every giveaway checkbox is unchecked.

---

## Doc index

- `10-olivia-persona-brief.md` — persona directions, anti-AI MJ prompt
- `11-olivia-heygen-scripts.md` — HeyGen script templates
- `12-olivia-elevenlabs-voice.md` — anti-AI ElevenLabs prompt
- `13-olivia-ai-tells-checklist.md` — exhaustive giveaway list
- `14-olivia-voice-audition-playbook.md` — audition scoring sheet
- `15-olivia-deai-summary.md` — this doc

---

## Commits (in order)

1. `feat(olivia): de-AI pipeline for portrait, video, voice`
2. `polish(olivia-video): v5 — hue pulse + brightness breathing + CRF 23`
3. `polish(olivia): hand-authored VTT captions + anti-AI Midjourney prompt`
4. `polish(olivia-video): v6 — per-frame Python grade, matches portrait exactly`
5. `polish(olivia-audio): v7 — synthetic room tone bed under voice`
6. `polish(olivia-portrait): v6 — subject mask unified with video pipeline`
7. `polish(olivia-audio): v8 — SM7B-emulated EQ curve + stronger room tone`
8. `docs(olivia): voice-audition playbook + updated scripts README`
9. `docs(olivia): de-AI iteration summary` (this doc)

---

*The post-processing is the brand. Raw AI outputs never ship.*
