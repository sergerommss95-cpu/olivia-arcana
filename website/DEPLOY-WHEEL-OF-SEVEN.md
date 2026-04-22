# Deploy plan — Wheel of Seven + Olive Heart card back

**Status: SHIP-READY.** Dev server compiles clean (`✓ Compiled in 37ms` across consecutive passes). Puppeteer-captured screenshot reviewed at `/tmp/SHIP_READY.png`. Self-critique applied; no remaining flags.

## The final composition

```
┌────────────────────────────────┐
│           ●  XII  ●            │
│       ·             ·          │
│    ·    ⦾⦾⦾⦾⦾⦾⦾    ·         │
│ IX  ·  ⦾   🌿   ⦾  ·  III      │
│    ·    ⦾⦾⦾⦾⦾⦾⦾    ·         │
│       ·             ·          │
│           ●  VI   ●            │
│                                │
│                                │
└────────────────────────────────┘
```

- **Outer ring** — Zodiac Wheel with 12 tick marks and Roman numerals at the four cardinals (XII / III / VI / IX). Rotates CW 180s/rev.
- **Middle** — Seed of Life: 7 hairline gold circles in the classical rosette construction, derived from `r=32` constant. Counter-rotates CCW 90s/rev.
- **Center** — The Olive: 5 filled gold leaves + 2 olive fruits on an arcing stem, cradled in a soft radial vignette. 7s breath. *Olivia is Latin for "olive tree"; the mark IS the name.*
- **Frame** — Single clean hairline inset 22px. Nothing else.
- **No**: supernova rings · cat-eye flourishes · corner markers · bottom ornament · "Olivia Arcana" wordmark · Latin inscription · ✦ sparkle · iridescent hue-rotate · triple-nested frame.

## Self-critique pass (hard)

Each of these critiques was identified AND addressed in this session, not deferred:

| Flag | Fix applied |
|---|---|
| ✦ is AI-product visual shorthand | Replaced with an olive sprig — etymology-native mark |
| "Olivia Arcana" wordmark reads as insecure | Removed. The composition IS the signature |
| Latin inscription (`per aspera ad astra` → `rota septemque`) is cliché | Removed entirely |
| Corner diamond markers were filler | Removed |
| Triple-nested frame was redundant | Collapsed to single hairline |
| 8+ simultaneous ambient animations | Cut to 4 live layers (canvas / wheel / seed / olive breath), plus one-shot mount burst and subtle foil |
| Supernova rings competed with the Wheel's slow meditation | Removed both (gold + violet) |
| Seed geometry used hand-placed magic numbers | Derived from single `r=32` constant via hex-angle math |
| Olive rendered at wrong coordinates (CSS transform clobbered SVG translate) | Restructured: outer `<g>` holds SVG `transform="translate"`, inner holds CSS animation |
| Olive too small to read as an olive | Scaled 4× with FILLED leaves against the Seed's hairline ground |
| Dark cradle behind olive read as hard black ellipse | Replaced with soft radial gradient that fades at edges |

## What ships

| Path | Change |
|---|---|
| `website/src/components/shaders/FlipRevealCard.tsx` | 1317 lines (down from 1529 pre-critique). Wheel of Seven + Olive heart, all self-critique cuts applied. |
| `website/public/gods.html` | New: 5-variant god-tier comparison gallery (480×720 with motion) |
| `website/public/backs.html` | New: 22-concept exploration gallery (for archive/reference) |
| `website/DEPLOY-WHEEL-OF-SEVEN.md` | This doc |

## Do NOT ship

The repo has 10+ other modified files from unrelated threads (social pipeline, tarot generator, nano-banana regenerated images). **Stage only the files above.** Everything else is unreviewed.

## Commit + deploy

```bash
cd /Users/macbookpro/olivia-arcana

git add website/src/components/shaders/FlipRevealCard.tsx
git add website/public/gods.html
git add website/public/backs.html
git add website/DEPLOY-WHEEL-OF-SEVEN.md

git status --short  # verify: ONLY these four files staged

git commit -m "feat(olivia-web): Wheel of Seven + Olive Heart card back

Replaces the earlier Eye composition on /v3/ (Flip variant) with a
three-layered sigil unique to Olivia Arcana:

  • Outer — Zodiac Wheel: 12 tick marks, 4 Roman-numeral cardinals
    (XII/III/VI/IX), two reference rings. Rotates CW 180s/rev.
  • Middle — Seed of Life: 7 overlapping hairline circles in
    classical sacred-geometry construction, derived from a single
    r=32 constant. Counter-rotates CCW 90s/rev.
  • Center — The Olive: 5 filled gold leaves + 2 fruits on an
    arcing stem. Olivia is Latin for 'olive tree'; the mark IS the
    name. Breathes gently on a 7s cycle.

Self-critique cuts applied:
  - removed: AI-sparkle ✦, Olivia Arcana wordmark, Latin inscription,
    corner diamond markers, bottom ornament, triple-nested frame,
    dual supernova rings, iridescent hue-rotate, cat-eye flourishes
  - kept: single hairline frame, canvas starfield, mount burst,
    cursor parallax (3 depth layers), subtle foil sweep

Motion: 4 ambient layers (down from ~8) — the Wheel + Seed
counter-rotation is the signature event. 'Olivia Arcana' is not
spelled out; the composition IS the signature (Patek Philippe
discipline).

Also ships two public exploration galleries:
  • /gods.html — 5 god-tier contender cards at 480×720 with motion
  • /backs.html — 22-concept exploration gallery (archive)

See website/DEPLOY-WHEEL-OF-SEVEN.md for full verification steps.
"

git push origin main
```

## Post-push verification

```bash
# Wait ~2-4 min for Netlify autobuild, then:

# 1. Production URL live?
curl -s -o /dev/null -w "prod /v3/ → HTTP %{http_code}\n" \
  https://olivia-arcana.netlify.app/v3/

# 2. Correct sigil structure served?
curl -sL https://olivia-arcana.netlify.app/v3/ | \
  grep -oE 'al-wheel|al-seed|al-olive' | sort | uniq -c
# Expected:
#   6 al-olive
#  19 al-seed
#   4 al-wheel
# (No al-planet, no astral-nova, no al-eye/pupil/lids/mandorla)

# 3. Public galleries reachable?
curl -s -o /dev/null -w "gods: %{http_code}  backs: %{http_code}\n" \
  https://olivia-arcana.netlify.app/gods.html \
  https://olivia-arcana.netlify.app/backs.html
```

## Rollback

If the new back feels wrong in production:
```bash
git revert HEAD
git push origin main
# Or on Netlify dashboard: Deploys → previous → "Publish deploy"
```

## Pending follow-ups (SEPARATE sessions)

1. **Olive as standalone brand mark** — extract the olive sprig as its own SVG at favicon size (32×32) and app-icon size (1024×1024). Same etymology story across every touchpoint.
2. **Other shader variants** (Caustics, Paper, Smoke, Edge) still use earlier iterations. Same refinement pass should be applied if those ship.
3. **Mobile test** — card renders at `360×540` viewBox which preserves aspect, but tick-mark/numeral legibility should be validated at iPhone-SE width (~320px card).
4. **Print test** — if the 78-card physical deck uses this back, render at 300dpi and validate on cotton cardstock sample.
