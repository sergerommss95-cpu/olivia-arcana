# Olivia — AI-tells checklist

The single handoff doc for making AI-generated assets read as human.
Use before shipping every new Olivia portrait, video, and voice
generation.

Three axes: **image**, **motion**, **voice**. Each has a list of
giveaways and a list of fixes. Iterate until none of the giveaways
are visible/audible.

---

## Why this matters

An AI persona only works if the viewer doesn't *see* the AI. The
instant they read "this is a synthesised person," trust collapses —
and for a product that claims rigour ("I read charts *by hand* for
fifteen years") losing that trust is fatal.

Human images, videos, and voices are imperfect. AI removes the
imperfections. Our job on every asset is to **put the imperfections
back** — either by prompting for them up front or by post-processing.

---

## Portrait / image tells

### Giveaways (reject if present)

- **Plastic-smooth skin.** No visible pores, no micro-variation in
  surface. Like porcelain.
- **Perfect symmetry.** Eyes identical size. Eyebrows mirrored. Lips
  centered. Humans are slightly asymmetric.
- **Identical lighting on both sides.** Too-even fill. Real studios
  have key/fill imbalance.
- **Over-saturated purple/magenta wash.** Default AI bias, especially
  on fabric and background.
- **Too-sharp-everywhere.** No natural depth-of-field falloff; hair,
  face, and background are all in focus.
- **"Cinematic rim light" halo.** Orange backlight glowing on every
  hair strand. Looks like SORA/Midjourney cliché.
- **Background stars/bokeh are perfect circles.** Real out-of-focus
  highlights are slightly oval, asymmetric, and vary in size.
- **Pure blacks.** RGB(0,0,0) in shadows. Real film never hits zero.
- **Pure whites.** Perfect highlight clipping. Real highlights roll off.
- **No film grain.** Clean noiseless digital surface.
- **Zero chromatic aberration.** Every edge perfectly registered.
  Real lenses have fringing at the corners.
- **No atmospheric haze / fog.** Face and background feel composited
  rather than photographed.
- **Identical skin tone across face.** Real skin has color variation
  — slightly redder cheeks, slightly cooler forehead, etc.

### Fixes (apply via post-processing — see `/tmp/deai_portrait_v4.py`)

1. **Defocus the background selectively.** Subject-aware Gaussian blur:
   soft (sigma 6) near the subject, heavy (sigma 18) at the edges.
2. **Lift the blacks** by ~4%. `rgb = rgb * (1 - 0.04) + 0.04`.
3. **Roll the highlights** above 0.86 by 35–40%.
4. **Add a gentle film S-curve**: `rgb += 0.42 * (rgb - 0.5) * rgb * (1 - rgb) * 4`.
5. **Kill the purple wash** — hue-selective desat on the 260–325° range
   in non-subject areas.
6. **Split-tone grade:** warm mids (R+3%, G+1%, B−1.5%), cool shadows
   (R−1%, G+0.5%, B+2%).
7. **Skin texture injection:** YCrCb luma channel, high-frequency
   Gaussian noise (sigma 0.95) at 2% strength, skin-masked only.
8. **Chroma noise on skin:** break uniform tone with Cb/Cr noise
   (sigma 1.8, 0.8% strength).
9. **Monochromatic film grain:** blurred Gaussian noise (sigma 0.55),
   shadow-weighted, 2.2% strength over entire image.
10. **Vignette:** 17–22% corner darkening.
11. **Chromatic aberration:** shift R channel outward and B channel
    inward by 1.0–1.1px at corners, radial falloff squared.
12. **Halation:** warm Gaussian bloom (sigma 11) around areas above
    luminance 0.78, color (R+7%, G+2.8%, B−2%) at 45% strength.
13. **Selective rim-light desat** on hair/backlight halo zones —
    target H∈[15,55], S>0.4, V>0.45, desat by 40%.

### Prompt-side fixes (for regenerating the portrait)

If you have to re-generate the portrait, bias the prompt against the
above tells:

```
realistic portrait photograph, mid-thirties woman, natural
imperfect skin with visible pores, slight asymmetry, Kodak Portra
400 film grain, soft Rembrandt lighting from the left, muted
editorial color grade, shallow depth of field, black velvet
background, shot on Mamiya 645 with Sekor 80mm, slight film
halation around highlights, natural skin tone variation. Avoid
symmetrical features, avoid glossy skin, avoid cinematic rim
light, avoid cosmic background bokeh, avoid over-saturated
purple, avoid uniform lighting. Editorial magazine feel.
```

---

## Video / motion tells

### Giveaways (reject if present)

- **Perfectly still body below the neck.** HeyGen avatars typically
  only animate the face. Real talking-heads have shoulder drift,
  slight upper-body sway, breath movement.
- **Static camera.** No handheld float. Even on a tripod there's
  tiny environmental tremor.
- **Identical eye blink cadence.** Blinks every N seconds to the ms.
- **Mouth-shape library artifacts.** Same three visemes repeated.
  Watch for "tt" and "s" sounds — AI lip-sync struggles here.
- **No natural head micro-tilt.** Real speech is accompanied by tiny
  head direction changes that correspond to emphasis.
- **Too-clean audio.** Studio-pristine; no room tone.
- **HeyGen template title pill.** "Name / Role" in generic sans
  screams stock.
- **Green/purple fringe at hair edges.** Compositing artifact where
  the avatar's neural matte disagrees with sub-pixel detail.
- **Identical skin tone every frame.** No camera exposure variation.
- **Perfect focus throughout.** No breathing/micro-focus pulse.

### Fixes (ffmpeg filter chain — see `deai-video.sh` template below)

```bash
ffmpeg -y -i INPUT.mp4 \
  -filter_complex "\
[0:v]\
crop=iw:ih*0.80:0:ih*0.03,\
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
[0:a]\
highpass=f=88,lowpass=f=13200,\
acompressor=threshold=-19dB:ratio=2.2:attack=6:release=140,\
aecho=0.38:0.6:32:0.13,\
volume=1.02\
[a]" \
  -map "[v]" -map "[a]" \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  OUTPUT.mp4
```

Key filter roles:

- `crop=iw:ih*0.80:0:ih*0.03` — **crops the HeyGen template title bar**
  (bottom 20%, top 3% for breathing room).
- `eq + colorbalance + curves` — Portra-style warm midtones, cool
  shadows, lifted blacks, rolled highlights (matches portrait grade).
- `unsharp=5:5:0.38:3:3:-0.12` — unsharp-mask on luma, slight blur
  on chroma; breaks the AI's digital sharpness signature.
- `vignette=angle=PI/5.2` — subtle corner darkening.
- `noise=alls=8:allf=t+u` — temporal+uniform film grain, animates so
  it doesn't freeze on single frames.
- `crop=iw-30:ih-30:15+2.8*sin(...)` — **micro handheld drift**, two
  overlapping sine waves at different frequencies so motion never
  repeats perfectly.
- Audio chain: highpass/lowpass removes digital HF sheen,
  `acompressor` mimics analog compressor feel, `aecho` adds 32ms
  room-tone reflection at 13% wet.

### Regeneration-side fixes for video

HeyGen avatar output is largely fixed once you've picked the portrait,
but you can reduce tells by:

1. **Recording the voice externally** on a real microphone (your
   phone in a bedroom is fine) and uploading the MP3 — HeyGen lip-syncs
   to uploaded audio. This gets around the ElevenLabs sheen.
2. **Disabling HeyGen's default intro/outro** title cards. They
   scream template. Cinema-direct cuts only.
3. **Using "custom background"** set to solid dark velvet rather than
   any animated background HeyGen provides.
4. **Keeping the script under 45s per clip.** Longer clips amplify
   lip-sync artifacts.

---

## Voice / audio tells

### Giveaways (reject if present)

- **Perfect consonant attack.** Every "t" and "s" is crisp to the
  millisecond.
- **Mechanical inter-word spacing.** Identical gap between every word.
- **Zero breath.** No audible inhalation anywhere in the take.
- **Zero mouth sound.** No tiny click, no lip friction between phrases.
- **Crisp phrase endings.** "Know." lands like a hammered period.
- **No vocal fry.** Sentence ends are clean, never slightly creaky.
- **Constant emotional level.** Every sentence has the same warmth.
- **Studio-dry recording.** No room reflection at all.
- **No false starts.** Every sentence is perfect on the first try.
- **Even speed.** Identical words-per-second throughout.
- **No glottal stops.** "Astrology isn't" comes out smooth instead
  of with a tiny catch between words.
- **No lisp, slurring, or softening.** Every word hits its IPA target.
- **Identical volume throughout.** No natural dynamic variation.

### Fixes — prompt side

See `12-olivia-elevenlabs-voice.md` anti-AI prompt. Core principles:

1. Explicitly request breath, fry, mouth sound, micro-pauses.
2. Explicitly reject broadcast clarity, studio air, audiobook
   performance.
3. Specify recording context: "small bedroom, not studio."
4. Deliver character direction: "like speaking quietly at the end
   of a long day."

### Fixes — post-processing

Apply to the ElevenLabs MP3 before uploading to HeyGen:

```bash
ffmpeg -i voice-raw.mp3 \
  -af "highpass=f=85,lowpass=f=13500,
       acompressor=threshold=-19dB:ratio=2.2:attack=6:release=140,
       aecho=0.38:0.6:32:0.13,
       adeclick,
       volume=1.02" \
  -ar 44100 -b:a 192k \
  voice-processed.mp3
```

- `highpass=85` — strips sub-vocal rumble and some AI sheen.
- `lowpass=13500` — removes the "digital air" top octave.
- `acompressor` — gentle compression mimics analog compressor.
- `aecho` — faint 32ms early reflection adds room tone without
  sounding reverberant.
- `adeclick` — removes any clicks the AI introduced (rare but real).

### Advanced — mix in room tone bed

For the best result, record 10–15 seconds of your actual room
ambience (on your phone, mic open in a quiet bedroom) and mix it
under the voice at -42 dB:

```bash
ffmpeg -i voice-processed.mp3 -i room-tone.wav \
  -filter_complex "[1]volume=-42dB,aloop=loop=-1:size=2e+09[rt];\
                   [0][rt]amix=inputs=2:duration=first:dropout_transition=2" \
  -ar 44100 -b:a 192k voice-final.mp3
```

Real voice recordings have ambient noise. Adding any non-zero
background is the single fastest way to stop a voice reading
"synthesised."

---

## Release checklist

Before any Olivia asset ships:

### Portrait
- [ ] Run `/tmp/deai_portrait_v4.py` (or equivalent) against the raw AI output.
- [ ] Zoom to 100% — check face for visible grain + skin texture variation.
- [ ] Inspect background — is it soft, muted, not competing?
- [ ] Color check: skin is warm, shadows slightly cool, highlights rolled.
- [ ] File size is reasonable (400–600KB for 1280×1600).

### Video
- [ ] HeyGen title pill cropped out.
- [ ] ffmpeg filter chain applied (grade, grain, drift, vignette).
- [ ] Audio processed with highpass/lowpass/compressor/echo.
- [ ] Play at 1× — confirm subtle drift, not dead-still.
- [ ] Play at 2× — grain visible but not overwhelming.
- [ ] Duration ≤45s (cut longer scripts into multiple videos).

### Voice
- [ ] Anti-AI prompt used.
- [ ] Listened to 5+ takes before picking.
- [ ] Winning take includes audible breath somewhere.
- [ ] Phrase endings soften / drop, not crisp.
- [ ] Post-processed with ffmpeg chain.
- [ ] Room tone mixed in at -42 dB (advanced).

### Integration
- [ ] Portrait placed behind the play pill in `OliviaIntro.tsx`.
- [ ] Video streams from `/videos/olivia-intro.mp4` on tap.
- [ ] Close button works + keyboard-accessible.
- [ ] Build passes (`npm run build`).
- [ ] Netlify preview tested on mobile.

---

## Regeneration playbook

When you need a new Olivia asset (new daily card video, new oracle
response video, new About page image):

1. **Generate** via the usual pipeline (Midjourney → HeyGen → ElevenLabs).
2. **Audit** against the giveaways list above, axis by axis.
3. **Process** via the ffmpeg / Python chains documented here.
4. **Re-audit** — zoom in, play 2×, listen eyes-closed.
5. **Ship** only if all giveaway boxes are unchecked.

The goal is not "AI that passes as human 70% of the time." The goal is
"a reasonable viewer, given 30 seconds, cannot determine this is AI."
