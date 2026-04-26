# Olivia Arcana — Session Handoff

**Last session:** 2026-04-22
**Working tree:** clean on olivia-arcana/website (all session work committed + pushed to main → Netlify)
**Live:** https://olivia-arcana.netlify.app/

---

## What shipped this session (3 commits on main)

1. **`497ae72` — Wheel of Seven + Olive Heart card back**
   - Replaced the "Astral Portal" eye composition with a non-creepy, brand-rooted card back
   - Zodiac wheel (96r outer ring, 82r inner ring, 12 ticks, 4 cardinal dot markers) + Seed of Life (7 hex-packed circles, r=32) + Olive sprig at center
   - Visible in the Flip variant of the shader picker at `/v3/`
   - File: `src/components/shaders/FlipRevealCard.tsx` (1270 lines)

2. **`5980c9d` — Olive Mark brand system**
   - Favicons: `icon-16/32/48/192/512.png` + multi-resolution `favicon.ico`
   - Apple touch icon: `apple-touch-icon.png` (180×180)
   - PWA: `icon-maskable-512.png` + `manifest.json` (theme `#d4af37`, background `#06031a`)
   - Social: `og-image.svg` + `og-image.png` (1200×630, card preview left / wordmark right)
   - Vector marks: `olive-mark.svg` (32×32, bare sprig) + `olive-mark-framed.svg` (512×512, indigo bg + Seed of Life halo + sprig)
   - Wired into `src/app/layout.tsx` metadata + openGraph + icons

3. **`fe16242` — Zodiac glyph text-presentation fix**
   - OG image was rendering ♈♋♎♑ as color emoji squares in headless Chrome
   - Fixed with gold dot markers on OG; fixed sitewide in `src/app/globals.css` via `font-variant-emoji: text` + `@font-face` `zodiac-text` family with `unicode-range: U+2609, U+260A-260B, U+263C-264F, U+2648-2653` fallback chain (Apple Symbols → Segoe UI Symbol → DejaVu Sans → Symbola → Arial Unicode MS)
   - Any future use of zodiac unicode glyphs should get class `zodiac` or `zodiac-glyph`

---

## File map — brand system

All in `website/public/`:

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 2.3 KB | Multi-res 16+32+48, legacy browsers |
| `icon-16.png` | 392 B | Smallest favicon |
| `icon-32.png` | 708 B | Modern browser tab |
| `icon-48.png` | 1.2 KB | Windows tiles |
| `icon-192.png` | 28.9 KB | PWA install, Android home screen |
| `icon-512.png` | 160 KB | PWA splash, high-DPI |
| `icon-maskable-512.png` | 160 KB | Android adaptive icon (safe zone built in) |
| `apple-touch-icon.png` | 25.8 KB | iOS home screen 180×180 |
| `olive-mark.svg` | 1.8 KB | Bare sprig, scales to any size |
| `olive-mark-framed.svg` | 3.0 KB | Full brand composition (indigo + halo + sprig) |
| `og-image.png` | 830 KB | Twitter/FB/LinkedIn/Slack unfurl |
| `og-image.svg` | 7.3 KB | Source for og-image.png |
| `manifest.json` | 1.2 KB | PWA manifest |

---

## Work that was in flight (not finished, not committed)

I was mid-way through a **4-hour autonomous polish block** when the session ended. The work was at the *survey* phase:

- Captured full-page Puppeteer screenshots of 15 routes at `/tmp/audit_*.png`:
  - `/`, `/v3/`, `/daily/`, `/chart/`, `/cosmos/`, `/story/`, `/ask/`, `/sample/`, `/portrait/`, `/oracle/`, `/synastry/`, `/transits/`, `/timing/`, `/journal/`, `/academy/`
- Began reading the homepage screenshot to analyze page structure
- **Did not yet move into actual polish edits** — the code on main is in clean, shipped state

### Initial survey findings (pre-read)
- `/` is 9905px tall — has significant below-the-fold content (not just a splash)
- `/v3/` is 8799px tall
- `/sample/` is 4967px — **conversion-critical page** (the "see what a reading actually looks like" demo)
- `/story/` is 4102px
- `/academy/` is 3119px
- Several pages render at exactly 900px (viewport height) — likely login walls or very short: `/daily/`, `/chart/`, `/ask/`, `/portrait/`, `/synastry/`, `/transits/`, `/timing/`, `/journal/`. Needs verification — might be auth redirects.

### Proposed next session priority ranking
1. **`/sample/`** — highest ROI. It's the conversion funnel page. Editorial voice likely strong, visual hierarchy likely weak based on pattern in this codebase.
2. **`/` homepage** — the entry point. 9905px tall means lots of surface area that could be tightened.
3. **`/v3/`** — where the Wheel of Seven ships. The card itself is done, but the surrounding page (shader picker, other variants) has not been polished to match.
4. **Check the 900px pages** — are they login walls? If yes, design those empty states well instead of leaving them bare.

---

## Key technical decisions — don't re-litigate

- **Brand mark is the olive sprig, not a sparkle ✦.** "Olive" is the etymology of "Olivia." The ✦ was rejected for being "AI everywhere."
- **The eye composition is dead.** User called it "a bit creepy" multiple iterations in. Do not resurrect it. Wheel of Seven is the ship.
- **No Latin inscription on the card.** Removed during hard critique pass.
- **No supernova rings / no wordmark on the card face.** Removed during hard critique pass. The card back is deliberately quiet.
- **Card breathing animation lives on inner `<g className="al-olive">`** — the outer `<g transform="translate(180 270)">` holds the SVG positioning. Do not merge them; CSS transforms on the outer group clobber the SVG translate.
- **Seed of Life uses a single shared radius constant `r = 32`** at center `(180, 270)` with hex packing (`sqrt(3)/2` y-offset). Don't hand-code the circle centers.
- **Zodiac unicode glyphs need the `zodiac` class** or they render as color emoji in Chrome/Safari. `font-variant-emoji: text` alone is not sufficient — need the `@font-face` + unicode-range combo.

---

## Known gotchas

- **Browser harness (Chrome CDP on :9222) was unstable mid-session.** Fell back to direct Puppeteer at `/Users/macbookpro/node_modules/puppeteer`. If you need screenshots and the harness is flaky, skip it — go direct Puppeteer.
- **User told me "pngs don't load here"** referring to Claude chat UI embedding `/tmp/` paths. Don't include `![](/tmp/...)` in responses — use the live Netlify URL for visual verification instead.
- **The parent directory `/Users/macbookpro/olivia-arcana` has many unrelated dirty files** (tarot-deck regens, social-pipeline edits, untracked handoff docs from other sessions). The scope of THIS repo is strictly `website/`. When committing, stage only files under `website/` — do not `git add -A` at the parent level.
- **There are two other session handoff files already at the olivia-arcana parent level** (`SESSION_HANDOFF_2026-04-13.md`, `SESSION_HANDOFF_V4.md`). This doc supersedes them for the website work.

---

## How to run / deploy

```bash
# Dev
cd /Users/macbookpro/olivia-arcana/website
npm run dev          # → http://localhost:3000

# Build check (before committing anything non-trivial)
npm run build

# Deploy
git push origin main  # Netlify auto-deploys from main
```

---

## Design context (unchanged, carrying forward)

- **Brand:** Olivia Arcana — personalized astrology, real NASA ephemeris, editorial voice
- **Aesthetic register:** editorial cosmic almanac — think New Yorker × Dior × Tarot of Marseille
- **Palette:** `#d4af37` gold on `#06031a` indigo. No cyan, no neon, no "AI purple gradient"
- **Display type:** Cormorant Garamond italic — never Inter
- **Body type:** DM Sans
- **Anti-references:** glassmorphism, gradient text on metrics, identical card grids, hero-metric layouts, dark mode with glowing accents

---

## Todo list as of session end

```
[ ] Deep survey: audit every main page's current quality (IN PROGRESS — 15 screenshots captured, homepage partially analyzed)
[ ] Fix homepage / if it's only a splash screen
[ ] Polish /sample/ to god-tier (editorial magazine quality)
[ ] Polish /daily/ composition
[ ] Polish /chart/ form (conversion-critical)
[ ] Port Wheel-of-Seven to other shader variants if time allows
[ ] Commit + push everything
```

Pick up from item 1 — finish the survey by reading the remaining `/tmp/audit_*.png` files, then start on `/sample/` since it's highest-leverage.
