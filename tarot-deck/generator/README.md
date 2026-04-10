# Olivia Arcana — Flux 2 Pro Generator

Complete pipeline for generating the 78-card **Olivia Arcana** tarot deck using the Black Forest Labs Flux 2 Pro API, per the Master Guide.

## Files

```
generator/
├── deck_manifest.json    # All 78 cards with card_subject + astrological_symbology
├── prompts.py            # GLOBAL_STYLE_PREFIX, LIGHTING_TEXTURE_SUFFIX, build_prompt()
├── generate.py           # CLI: discover | card | deck | status
├── output/
│   ├── style_discovery/  # Phase 1 variations of The Fool
│   ├── major/            # Major Arcana PNGs (22 cards)
│   └── minor/            # Minor Arcana PNGs (56 cards)
└── README.md
```

## Prerequisites

- BFL API key in `~/tools/bfl-api/.env` as `BFL_API_KEY`
- Python 3 (no external deps — uses stdlib `urllib`)

## Cost estimate

Flux 2 Pro (text-to-image) on `https://api.bfl.ai/v1/flux-2-pro`:
- **~$0.03 per image**
- Full 78-card deck: **~$2.34**
- 5-variation style discovery: **~$0.15**

## Workflow

### Phase 1 — Style Discovery (MANDATORY before full deck)

Generate N variations of The Fool with random seeds. Visually inspect and pick the one that best matches the Seven Aesthetic Laws (§1.2 of the Master Guide).

```bash
cd ~/olivia-arcana/tarot-deck/generator
python3 generate.py discover -n 5
```

Review outputs in `output/style_discovery/`. Open each PNG and judge against:

- [ ] Liquid glass material (no stone/wood/metal)
- [ ] 40%+ negative space (pearl-white silk visible)
- [ ] Cool lighting from upper-left, no warm tones
- [ ] Astronomical precision (Uranus rings tilted correctly, moons visible)
- [ ] Zero text/typography
- [ ] Silk texture visible

**Record the chosen seed** — the filename contains it: `fool_vNN_seed<NUMBER>.png`.

Edit `deck_manifest.json` and set:
```json
"global_style_seed": <the chosen number>
```

### Phase 2 — Generate The Deck

Generate all pending cards (respects `global_style_seed` and derives per-card seeds as `global_style_seed + card_id`):

```bash
# Small batch first for sanity check
python3 generate.py deck --batch 5

# Full deck run
python3 generate.py deck
```

The manifest is saved after **every card** so progress is preserved on interruption.

### Single card generation

```bash
python3 generate.py card 0          # The Fool
python3 generate.py card 16         # The Tower
python3 generate.py card 0 --force  # Regenerate even if output exists
```

### Status check

```bash
python3 generate.py status
```

Shows counts by status (`pending`, `generated`, `approved`, `regenerate`).

## Manual QA loop

1. Generate a batch: `python3 generate.py deck --batch 10`
2. Open images in `output/major/` or `output/minor/`
3. For any card that fails the Seven Aesthetic Laws check, edit the manifest:
   ```json
   "status": "regenerate"
   ```
   (Optionally change the seed too — set `"seed": <new>`.)
4. Re-run: `python3 generate.py deck` — only regenerate-status cards are processed.
5. For cards that pass QA, change status to `"approved"` to lock them.

## Card ID layout

| ID range | Arcana | Suit |
|---|---|---|
| 0-21 | Major | — |
| 22-35 | Minor | Wands (Ace, 2-10, Page, Knight, Queen, King) |
| 36-49 | Minor | Cups |
| 50-63 | Minor | Swords |
| 64-77 | Minor | Pentacles |

## Master Guide compliance

This implementation enforces all seven aesthetic laws from §1.2 via the `GLOBAL_STYLE_PREFIX` and `LIGHTING_TEXTURE_SUFFIX` in `prompts.py`. **Do not modify these strings** — they are the signature of Olivia Arcana.

The 4-module prompt order from §2.1 is preserved:
```
[GLOBAL_STYLE_PREFIX] + [CARD_SUBJECT] + [ASTROLOGICAL_SYMBOLOGY] + [LIGHTING_TEXTURE_SUFFIX]
```

API parameters from §4.1:
- `width=896, height=1536` (11:19 ratio = 2.75×4.75" tarot standard at ~320 DPI)
- `guidance=3.5`
- `safety_tolerance=2`
- `prompt_upsampling=false`
- `output_format=png`, `output_quality=100`

Error handling per §4.5: failed cards retry once with `seed+500`, then get marked `regenerate`.

## Troubleshooting

- **Card has text/numerals in it** — Flux sometimes adds them despite constraints. Re-run with `seed+1000`.
- **Too busy / not enough negative space** — Check the `card_subject` in the manifest; trim secondary elements.
- **Wrong color tone (warm / cyberpunk)** — Verify the suffix is verbatim in `prompts.py`. Do not paraphrase.
- **Rate limit (HTTP 429)** — Script already sleeps 1s between cards. If rate-limited, wait a minute and rerun.
- **Polling timeout** — A generation is taking >3 minutes. Check BFL status page.
