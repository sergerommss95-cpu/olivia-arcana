# Olivia Arcana Tarot Deck — Handoff Document

**Last updated:** 2026-04-10
**Project:** Full 78-card COSMOS-aesthetic tarot deck for oliviaarcana.com
**Status:** v2.7 aesthetic locked, all 78 cards generated, mid-iteration on 5 "enriched symbolism" example cards

---

## Current State (One-Line)

All 78 cards exist at v2.7 quality (minimal sigil bodies). User approved Fool as "perfect" and then asked to **densify symbolism on 5 example cards** — prompts.py was updated for those 5 but they have NOT been regenerated yet.

---

## What Got Built

### Pipeline
- **Backend:** Google Vertex AI via `google-genai` SDK (ADC auth, no service account JSON — org policy blocks key creation)
- **Model:** `gemini-2.5-flash-image` ("nano banana") at native 2:3 aspect ratio
- **Auth:** Application Default Credentials via `gcloud auth application-default login`
- **Project:** `project-f778abe0-d2d9-47df-802` (user's first GCP project, $300 free trial)
- **Key feature used:** Multi-image reference input (nano banana's killer feature vs. BFL Flux 2 Pro text-only)

### Output
- **78 PNG files** at `output/nano_banana_v2/` (1.2–1.5 MB each, ~99 MB total, 2:3 aspect)
- **Contact sheet** at `output/ab_comparison/full_deck_contact_sheet_v2.png` (13 col × 6 row grid)
- **Reference-vs-output grid** at `output/ab_comparison/v2_vs_reference.png`

### Actual cost
- ~$3.00 total (78 cards × $0.039 on Vertex AI)
- First pass: 44 cards succeeded, 31 failed on 429 rate limits
- Retry pass with serial batches + exponential backoff: remaining 31 cards

---

## The v2.7 Aesthetic (LOCKED)

Reference images driving the style live at `references/`:
- `ref_fool_classical.png` — walking classical man with dog (the North Star reference)
- `ref_hermit_staff.png` — hooded classical figure with staff

A third reference (`ref_motion_sparkles.png`) was dropped because it was dominated by sparkle clusters and kept polluting outputs with cheap-looking particle effects.

### Visual spec (every card has all of these)
1. **Classical Greco-Roman line-art figure** in hairline gold on matte indigo
2. **Tilted card** — Dutch angle, ~8–10° counter-clockwise rotation (card's top-left tilts up)
3. **Asymmetric painterly gold nebula** wrapping the card (NOT horizontal bands, NOT symmetric diamond frames)
4. **Soft cyan atmospheric backlight** bleeding around the card silhouette (NOT a neon rectangle outline)
5. **Physical tarot cardstock** — thick matte indigo paper with subtle UV laminate gloss (NOT a glass screen)
6. **Thin emergent gold interior border** (couldn't fully suppress — model locks it in from references, user accepted it)
7. **Card face is otherwise completely blank** except for the central figure and narrative props
8. **Subtle contact shadow** beneath the card

### Explicit negatives (learned through iteration)
- No Apple logo / no bitten-fruit icon (caused by "Apple-style liquid-glass" phrase in early prompts)
- No camera dot / no notch / no front-camera / no phone bezel
- No sparkle clusters / no cyan+magenta particles / no glitter / no lens flares
- No neon tube outline / no crisp cyan rectangle
- No text / no numerals / no roman numerals / no card titles
- No medallion frame / no circular seal
- No iPhone-corner rounding (use traditional playing-card corner radius)

---

## Prompt Architecture

All prompts live in `prompts.py`. Build pipeline:

```
build_prompt_v2(card) =
    GLOBAL_COSMOS_V2_STYLE_PREFIX         (card + nebula + cardstock description)
  + SIGIL_V2_INTRO_TEMPLATE               (classical figure intro with {essence})
  + V2_SIGIL_BODIES[card["id"]]           (per-card figure + narrative props)
  + SIGIL_V2_OUTRO                        (size constraints + breathing room)
  + LIQUID_GLASS_V2_PERIMETER_SUFFIX      (backlight + negative constraints)
```

Each v2 sigil body is wrapped by the `_v2()` helper which appends a shared closing clause ("A single subtle horizontal ground line beneath the figure's feet. Nothing else on the card").

### Current prompt length per card
~7,400–8,100 chars (~1,200–1,350 words). The enriched 5 example cards pushed to ~8,100.

---

## Commands Reference

All commands run from `/Users/macbookpro/olivia-arcana/tarot-deck/generator/`:

```bash
# Generate a single card
python3 gemini_client.py card <id> --v2 --ref default --force

# Generate the A/B test set (Fool, Justice, Two of Wands)
python3 gemini_client.py ab --v2 --ref default

# Generate the full deck (parallel batches, with auto-skip of existing files)
python3 gemini_client.py deck --v2 --ref default --batch-size 4 --batch-pause 10

# Safer retry mode for rate-limited runs
python3 gemini_client.py deck --v2 --ref default --batch-size 1 --batch-pause 5

# Show existing output counts
python3 gemini_client.py status

# Rebuild reference-vs-output grid (3 cards)
python3 v2_compare.py

# Rebuild full 78-card contact sheet
python3 deck_contact_sheet.py
```

### Rate-limit survival
`generate_one()` has **5 retry attempts** with exponential backoff on 429 errors (20s → 40s → 80s → 160s). The `deck` command skips existing files by default — just re-run after a failed run and it will only retry missing cards.

---

## File Map

```
olivia-arcana/tarot-deck/generator/
├── HANDOFF.md                        ← this doc
├── prompts.py                        ← v1 and v2 prompt templates + all 78 sigil bodies
├── gemini_client.py                  ← generator CLI (card / ab / deck / status)
├── deck_manifest.json                ← canonical 78-card definitions (id, name, essence, filename)
├── generate.py                       ← original BFL Flux 2 Pro generator (v1 pipeline, archived use)
├── v2_compare.py                     ← builds reference-vs-v2 3-card comparison grid
├── deck_contact_sheet.py             ← builds full 78-card contact sheet grid
├── ab_compare.py                     ← builds BFL vs nano-banana comparison grid
├── references/
│   ├── ref_fool_classical.png        ← walking classical man with dog (primary ref)
│   └── ref_hermit_staff.png          ← hooded figure with staff (secondary ref)
│   (ref_motion_sparkles.png exists but is NOT in DEFAULT_V2_REFS)
└── output/
    ├── major/                        ← v1 BFL Flux 2 Pro outputs (22 majors)
    ├── minor/                        ← v1 BFL Flux 2 Pro outputs (56 minors)
    ├── nano_banana/                  ← earlier v1 nano banana test outputs
    ├── nano_banana_v2/               ← FINAL v2 outputs (78 cards) ← USE THESE
    └── ab_comparison/
        ├── full_deck_contact_sheet_v2.png
        ├── v2_vs_reference.png
        └── ab_grid.png

tools/gemini-api/
└── .env                              ← GCP_PROJECT + GEMINI_API_KEY (chmod 600, gitignored)
```

---

## Iteration History (Why the Prompt Looks the Way It Does)

| Version | Problem | Fix |
|---------|---------|-----|
| v1 BFL | Flat "Apple SF Symbol" pictograms, no physicality | Pivoted to nano banana on Vertex AI |
| v2.0 | No reference images | Added `--ref` flag + multi-image input |
| v2.1 | Crisp neon rectangle edge | Softened "crisp rim light" → "diffuse halo bleed" |
| v2.2 | Symmetric diamond nebula | "ASYMMETRIC, never diamond, never bow-tie" |
| v2.3 | Still rectangular cyan outline | Reframed as "backlit from behind" not "rim light" |
| v2.4 | Apple logo rendered | Stripped all "Apple" language, added explicit fruit-icon bans |
| v2.5 | No tilt | "DUTCH ANGLE 10° counter-clockwise" explicit framing |
| v2.6 | iPhone screen aesthetic | Rewrote as "physical cotton cardstock 400gsm", banned all device language |
| v2.7 | Persistent top dot | Explicit "no small circle, no dot, no gem at top edge" |

**User verdict on v2.7 Fool:** "the fool here is perfect" — this is the locked aesthetic.

---

## Pending Work (Mid-Iteration)

### The 5 Enriched-Symbolism Example Cards

User asked to add more traditional tarot symbols to cards so readers can understand each concept. I updated `V2_SIGIL_BODIES` in `prompts.py` for 5 test cards but **did NOT regenerate them yet**:

| ID | Card | New Symbolic Elements Added |
|----|------|----------------------------|
| 0 | The Fool | white rose of purity, cliff edge line, eight-pointed guiding star, rising sun on horizon |
| 1 | The Magician | infinity lemniscate above head, ouroboros belt, roses+lilies at feet, 4-elements altar (cup, sword, coin, wand) |
| 2 | The High Priestess | dual light/dark columns, pomegranate-patterned veil, triple-moon crown (waxing/full/waning), water at feet |
| 6 | The Lovers | angel above with spread wings, sun behind angel, tree of knowledge with serpent, tree of life with flame-fruit, mountain peak |
| 17 | The Star | one large 8-pointed star + seven smaller 7-pointed stars, ibis bird in tree, water pouring to pool + to earth (5 rivulets) |

### To regenerate them:
```bash
cd /Users/macbookpro/olivia-arcana/tarot-deck/generator
for id in 0 1 2 6 17; do
  python3 gemini_client.py card $id --v2 --ref default --force
  sleep 5
done
```

Budget: ~$0.20, ~5 minutes. After regenerating, review side-by-side with the old minimalist versions. If approved, extend the enriched treatment to the other 73 cards.

### Decision point after regeneration
Two paths forward:
1. **Apply enriched symbolism to all 78 cards** — another ~$3 + ~60 min run. Each card gets 3–5 additional meaningful symbols. Best fit for oliviaarcana.com brand (educational tarot).
2. **Ship the minimalist version** — keep v2.7 as-is, the figures are already recognizable by narrative prop alone.

---

## Known Issues / Gotchas

1. **Rate limits are brutal on Vertex nano banana.** The default tier gets ~10–15 image requests/min. Parallel batches of 4 will hit 429s. Use `--batch-size 2` for a sweet spot, or `--batch-size 1` for guaranteed serial success.

2. **Thin gold interior border is persistent.** The model locks it in from reference images and can't be fully suppressed via negative prompts. User accepted it on the Fool as "perfect" so it's fine.

3. **Pentacles moderation (BFL only).** The word "Pentacles" trips BFL's moderation filter — v1 code uses `_prompt_safe_name()` to alias to "Coins". This does NOT apply to nano banana v2 (no card name ever enters the v2 prompt).

4. **Python 3.9 deprecation warnings** from `google-auth` — harmless, filtered via grep in all commands.

5. **`GOOGLE_APPLICATION_CREDENTIALS` env-var trap.** If `.env` points at a non-existent JSON key file, `google-auth` tries to open it before falling back to ADC and fails. `gemini_client.py` has defensive `os.environ.pop()` logic — don't put the variable back in `.env`.

6. **Reference image size matters.** Each ref PNG is ~5.8 MB — large reference images count toward the 1M token context window on Vertex. Two refs is the sweet spot; three worked but was near the edge.

7. **Background tasks with `python | grep` buffer stdout.** When running the deck command in the background with a grep filter, the output file stays empty until the process exits. Use `python3 -u` for unbuffered output if live monitoring is needed.

---

## Relevant Brain Notes

- `/Users/macbookpro/Desktop/SerhiiVault/brain/Olivia Arcana.md` — brand overview
- `/Users/macbookpro/Desktop/SerhiiVault/brain/Olivia Tarot Generator.md` — earlier Flux 2 Pro generation state
- `/Users/macbookpro/Desktop/SerhiiVault/brain/Gotchas.md` — general gotchas (Three.js lighting, Helius rate limits, etc.)
- `/Users/macbookpro/Desktop/SerhiiVault/brain/Skills.md` — "max effort" rule, verify-before-complete

---

## Quick Resume Checklist (for the next session)

1. Confirm Vertex AI auth is still valid: `gcloud auth application-default print-access-token`
2. Confirm all 78 files are present: `ls output/nano_banana_v2/*.png | wc -l` → should be 78
3. Check if the 5 enriched cards were regenerated (compare mtime to 2026-04-10): the 5 example Fool/Magician/Priestess/Lovers/Star PNGs should be newer if done
4. If not done yet, run the regeneration loop under "Pending Work" above
5. After regeneration, build a small comparison sheet showing old vs. new symbolism
6. Ask user: ship minimalist, or densify all 78?

---

## Contact Points

- **User:** Serhii (see `brain/North Star.md` for current priorities)
- **Brand:** oliviaarcana.com
- **Deck format:** 78 cards, 2:3 aspect, 1024×1536 native resolution
