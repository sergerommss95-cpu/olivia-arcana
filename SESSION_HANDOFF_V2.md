# Olivia Arcana — Session Handoff V2

**Date:** April 6, 2026
**Project:** `/Users/macbookpro/olivia-arcana/`
**Previous handoff:** `SESSION_HANDOFF.md` (still accurate for bot/docs/infra details)

---

## What Was Done This Session

### 1. Website Dev Server Fixed (DONE)
**Problem:** Next.js 16.2.2 Turbopack spawns child processes that can't find `node` on PATH. Compilation hung indefinitely.

**Fix:** Added `--webpack` flag to bypass Turbopack entirely. Updated launch config:
- **File:** `~/.claude/launch.json` → `olivia-website` config
- **Command:** `PATH=/usr/local/bin:... exec node next dev --webpack --port 3333`
- Works instantly. No sudo, no symlinks, no downgrade needed.

### 2. Website Visually Verified (DONE)
All 10 components render correctly at 1440x900:
- Hero, DailyHoroscope, Features, HowItWorks, Testimonials, Pricing, CTA, Footer
- Zero console errors
- Glass morphism cards, gold gradients, typography all working

### 3. Six Design Variants Explored (DONE)
Injected CSS theme overrides to preview 6 color variants:

| # | Name | Vibe |
|---|------|------|
| 1 | Celestial Noir | Dark luxury, gold & midnight (current) |
| 2 | Ethereal Dawn | Soft cream/lavender, warm amber |
| 3 | Mystic Indigo | Deep purple, electric cyan |
| 4 | Terracotta Oracle | Earth tones, aged gold |
| 5 | Minimal Cosmos | Clean white, deep indigo accent |
| 6 | Aurora Borealis | Deep teal forest, rose gold |

No variant was selected — all were previewed via runtime CSS injection only.

### 4. WebGL Starfield — Complete Rewrite (DONE)
**File:** `website/src/components/Starfield.tsx`

Rewrote from simple canvas 2D dots to a **WebGL2 shader pipeline**:

#### Rendering Architecture
- **Nebula shader** — 6-octave FBM noise generates flowing cosmic clouds (indigo/purple/blue/warm tones)
- **Gold, purple, teal aurora wisps** flowing through the nebula, animated by time
- **4000 GPU-instanced particles** rendered as GL_POINTS with additive blending
- **Simplex noise flow field** in vertex shader for organic particle drift
- **2D canvas overlay** for constellation connection lines and labels
- Single-pass rendering (no FBOs — multi-pass bloom was attempted but silently failed on this machine)

#### Interactions
- **Mouse gravitational swirl** — particles orbit cursor with attraction + perpendicular force
- **Cursor glow** — warm gold center with purple fringe follows mouse position (in shader)
- **Constellation hover** — 12 zodiac constellations positioned around screen edges. On approach:
  - Golden connection lines between stars glow
  - Zodiac glyph (♈♉♊ etc.) fades in above
  - Constellation name label appears below
  - Radial glow area emanates
- **Particle depth layers** — size/brightness/parallax varies by depth attribute

#### CSS Change
- `globals.css`: `body` background set to `transparent`, `html` has the dark fallback
- This allows the WebGL canvas (position:fixed, z-index:0) to show through

### 5. Google Stitch 2.0 Project Created (DONE)
- **Project:** `projects/15933365241146510227` — "Olivia Arcana — Astrology Landing Page"
- Generated a "Celestial Alchemy" design system with full color tokens, typography scale, component rules
- Generated one hero screen (desktop, 2624x2620)
- Design system includes detailed rules: "No-Line Rule", "Glass & Gold Rule", surface hierarchy, typography editorial voice

---

## What Still Needs Work

### Starfield Polish
- **Bloom post-processing** — multi-pass FBO pipeline was attempted but produced blank output. Likely `RGBA16F` format or framebuffer completeness issue. Worth debugging for proper star glow halos.
- **Liquid glass refraction** — referenced in user's vision (Apple-style). Would need SVG filter (`feTurbulence` + `feDisplacementMap`) or WebGL distortion shader on constellation hover areas.
- **More particle variety** — shooting star trails, cursor spark trails (were in v2 canvas version, not yet in WebGL version)

### From Previous Handoff (Unchanged)
1. **Remaining language configs** — 6 YAML files (ru, ar, de, es, pt, fr)
2. **Missing persona prompts** — `reading_solar_return.txt`, `reading_eclipse.txt`, `reading_retrograde.txt`, `reading_video_script.txt`
3. **Video reading pipeline** — HeyGen + ElevenLabs integration
4. **Viral features** — Cosmic Compatibility Link, Birth Chart Card, Zodiac Roast, etc.
5. **Shared FastAPI backend** — for website ↔ bot shared logic
6. **End-to-end bot testing** — needs real Telegram bot token
7. **Remaining locale strings** — 7 languages
8. **Image generation** — Birth chart card (Pillow), daily horoscope post images
9. **Infrastructure** — Anonymous VPS, eSIM, Telegram registration, domain, deployment

---

## How to Run

### Website
```bash
cd /Users/macbookpro/olivia-arcana/website
PATH="/usr/local/bin:$PATH" node node_modules/.bin/next dev --webpack --port 3333
# Open http://localhost:3333
# Move mouse around to see particle interactions and constellation hover effects
```

### Bot
```bash
cd /Users/macbookpro/olivia-arcana
source .venv/bin/activate
cp .env.example .env  # fill in tokens
python run.py en
```

### Preview Server (Claude Code)
Already configured in `~/.claude/launch.json` as `olivia-website` — use `preview_start("olivia-website")`.

---

## Key Files Changed This Session

| What | Where |
|------|-------|
| WebGL starfield | `website/src/components/Starfield.tsx` |
| CSS (transparent body) | `website/src/app/globals.css` |
| Launch config | `~/.claude/launch.json` (olivia-website entry) |
| Stitch project | Google Stitch project `15933365241146510227` |

---

## Technical Notes

- **Node.js** is at `/usr/local/bin/node` (v24.13.1) but `/usr/local/bin` is NOT on default PATH in Claude Code's shell environment
- **Turbopack** (Next.js 16 default) cannot find node for PostCSS subprocess spawning — use `--webpack` flag
- **WebGL2** is available in the preview browser — shaders compile fine, but `RGBA16F` FBOs may not work (bloom pipeline failed silently)
- **MacBook resource concern** — user explicitly asked to avoid overwhelming CPU/RAM. Kill dev servers when done. Don't run parallel heavy processes.
- **Maximum effort rule** — user expects outstanding quality, not "good enough". Iterate until genuinely impressive.
