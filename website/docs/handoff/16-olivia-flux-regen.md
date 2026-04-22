# Olivia — Flux portrait regeneration

The single biggest quality jump in the Olivia pipeline. Previous portrait
was generated via Gemini — heavy post-processing could polish it but
the underlying face geometry (symmetric features, AI-perfect skin
topology, "AI beauty" face) was baked in. Flux 2 Pro produces
dramatically more human faces from the hardened anti-AI prompt.

---

## What shipped

**Live**: `public/olivia/portrait.jpg` — Flux 2 Pro seed 219, graded
through `scripts/deai/portrait.py` (u2net-precise mask, Avedon-dark bg,
Portra split-tone, dual-frequency film grain).

**Kept for reference**:
- `public/olivia/portrait-flux-219-raw.jpg` — untouched Flux output
- `public/olivia/portrait-gemini-v7.jpg` — previous shipped version
  (Gemini, post-processed through v7 pipeline)
- `public/olivia/portrait-original.jpg` — untouched Gemini original
- `public/olivia/candidates/flux-seed-{42,137,219,333}.jpg` — all 4
  Flux variants for A/B comparison

---

## Why Flux produces better faces than Gemini + post-processing

Gemini produces a specific kind of AI face:
- Symmetric features (eyes same size, brows mirrored, lips centered)
- Plastic-smooth skin (no pores, no variation)
- "AI beauty" idealized proportions
- No freckles, no asymmetry, no visible age markers

Post-processing can add grain and grade but **cannot fix the underlying
face geometry**. The face still reads as rendered.

Flux 2 Pro (Black Forest Labs, released 2025) trained on photographs
with natural imperfections. With the hardened anti-AI prompt it produces:
- Visible pores, freckles, small blemishes
- Genuine asymmetry (slightly different eye heights, uneven brows)
- Age markers (fine lines around eyes, natural skin texture variation)
- Real silk fabric texture (visible weave)
- Real photo grain baked in

Even before running through `portrait.py`, the Flux outputs are more
human than the Gemini+post-process result.

---

## The prompt that worked

Used for all 4 variants at 1024×1280 (4:5 portrait), with seeds
42 / 137 / 219 / 333 for variety:

```
unretouched editorial photograph, thoughtful woman early to mid
thirties (not older), soft natural skin with a few subtle freckles
across the nose, slight facial asymmetry, loose dark wavy hair with
flyaway strands, warm terracotta lip (NOT burgundy, NOT dark red -
terracotta orange-earth tone), minimal makeup, deep violet silk
turtleneck, one small tarnished gold pendant, quiet closed-mouth
half-smile catching one side more than the other, slight three-
quarter angle toward camera, one-source soft Rembrandt key light
from frame-left, plain black velvet backdrop, shot on Mamiya 645
80mm Kodak Portra 400, light film grain, intimate editorial
documentary feel, real photograph not rendered.

Avoid: plastic skin, cinematic rim halo, cosmic background, nebula,
stars, galaxy, bokeh, oversaturated purple, magenta wash, dramatic
backlight, older woman, deep burgundy lip, overly made-up,
symmetric features, AI-perfect beauty.
```

**Cost**: $0.045 per generation. 4 variants = $0.18 total.

---

## Ranking of the 4 Flux variants

Scored against the Olivia brief (mid-30s editorial astrologer,
New Yorker columnist feel, writerly, grounded warmth):

| Seed | Age read | Smile | Lip color | Fit | Rank |
|---|---|---|---|---|---|
| **219** | Mid-30s | Quiet warm | Terracotta ✓ | Best match | **1** |
| 333 | Mid-30s | Soft | Terracotta ✓ | Close second | 2 |
| 137 | Mid-30s | Big smile | Terracotta ✓ | Smile too big | 3 |
| 42 | Late-30s/40s | Smirk | Burgundy | Too old / wrong lip | 4 |

**219 wins.** Writer's eyes, quiet editorial smile, correct lip color,
correct age, natural freckles, genuine asymmetry.

---

## ⚠️ Open action: HeyGen video needs regeneration

**Critical discontinuity**: the shipped portrait is now the Flux 219
face. The shipped video (`public/videos/olivia-intro.mp4`) still uses
the previous HeyGen avatar which was built from the Gemini portrait.
Two different people.

On the site: the portrait shows first. When the user clicks play, the
face changes to a different (AI) person. That's jarring.

**Required next step** (user action):

1. **Upload `public/olivia/portrait.jpg`** (or the raw `portrait-flux-219-raw.jpg`) to HeyGen as a new Photo Avatar.
2. **Re-generate the 27-second intro** using the same script
   (`docs/handoff/11-olivia-heygen-scripts.md` PRIMARY script).
3. **Voice source**: ideally, run the new ElevenLabs anti-AI prompt
   (doc 12), pick a take via the audition playbook (doc 14), process
   through `scripts/deai/voice.sh`, upload MP3 to HeyGen to lip-sync
   against. If not ready for that pipeline yet, use HeyGen's built-in
   voice library.
4. **Download the new video**, run through `scripts/deai/video_per_frame.py`
   (u2net per-frame pipeline).
5. **Replace** `public/videos/olivia-intro.mp4`.
6. **Commit + push.**

Estimated time: 20-30 minutes in HeyGen + ~15 minutes processing.

Until that regeneration happens, the site shows a high-quality Flux
portrait but a video of a different (lower-quality) person. The
portrait-first visual improvement is still a net win for first
impressions, but the discontinuity is a known gap.

---

## Alternative — revert to Gemini v7 if the mismatch is too disruptive

If you want consistency over portrait quality, revert via:

```bash
cp public/olivia/portrait-gemini-v7.jpg public/olivia/portrait.jpg
git add public/olivia/portrait.jpg
git commit -m "revert: restore Gemini v7 portrait for video continuity"
git push
```

Then regenerate HeyGen when ready, and re-adopt the Flux portrait.

---

## Generating more Flux variants

If 219 / 333 aren't quite right, generate more variants using
`~/tools/bfl-api/flux.py` or the direct curl pattern from
`SerhiiVault/brain/BFL Flux API.md`:

```bash
BFL_KEY=$(grep BFL_API_KEY ~/tools/bfl-api/.env | cut -d= -f2 | tr -d '"'"'"' ')

RESP=$(curl -sS --max-time 25 -X POST "https://api.bfl.ai/v1/flux-2-pro" \
  -H "Content-Type: application/json" -H "x-key: $BFL_KEY" \
  -d '{"prompt":"<your-prompt>","width":1024,"height":1280,"seed":NEW_SEED}')
POLL=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['polling_url'])")
# ...poll until Ready, download result.sample
```

At $0.045/generation, audit 5-10 seeds for any new project.
