# Olivia Arcana — Website Development Handoff

**Date:** April 6, 2026
**Status:** Hero + WebGL pipeline complete. Backend + product pages not started.
**Tech:** Next.js 16 + Three.js + Tailwind CSS 4 + Framer Motion

---

## 1. Current State (What's Built)

### Complete
- **WebGL cosmos engine** — Full Three.js pipeline with 5 interconnected systems (see Section 9)
- **Hero section** — Birthday input (MM/DD), zodiac detection, horoscope display card
- **Landing page sections** — Navbar, Features, HowItWorks, DailyHoroscope, Pricing, Testimonials, CTA, Footer
- **5K nebula photo background** — GLSL shader with tone mapping, chromatic aberration, grain
- **Flowmap mouse interaction** — 512x512 ping-pong render target, Gaussian velocity stamps, ~800ms decay
- **2000 GPU stars** — THREE.Points with GLSL parallax, twinkle, diffraction spikes
- **12 zodiac constellations** — Animated line draw-in, energy traces, starburst node ignition, sacred geometry rings
- **Spring physics mouse** — Stiffness 0.08, damping 0.82 (shader.se-style weighted cursor)
- **Birthday-to-zodiac activation** — Custom event `zodiac:activate` triggers constellation pull-in + horoscope

### Not Started
- FastAPI backend
- Onboarding flow (full birth data: date + time + city)
- Birth chart wheel page (`/chart`)
- Daily reading page (`/daily`)
- Compatibility page (`/compatibility`)
- Ask the Stars page (`/ask`)
- User accounts / authentication
- Payment integration (Stripe)
- Mobile optimization

---

## 2. File Structure

```
website/
  src/
    app/
      layout.tsx                     -- Root layout, font imports, metadata
      page.tsx                       -- Landing page, composes all sections
    components/
      Starfield.tsx                  -- Mounts WebGL engine (Three.js, no Canvas 2D)
      Hero.tsx                       -- Birthday input + horoscope card display
      Navbar.tsx                     -- Fixed top navigation, glass morphism
      Features.tsx                   -- Feature cards grid
      HowItWorks.tsx                 -- 3-step process explanation
      DailyHoroscope.tsx             -- Sample daily reading section
      Pricing.tsx                    -- VIP subscription plans
      Testimonials.tsx               -- User testimonial cards
      CTA.tsx                        -- Call to action section
      Footer.tsx                     -- Footer with links
      cosmos/
        data/
          constellations.ts          -- 12 zodiac signs: star positions, ecliptic band layout, metadata
        engine/
          WebGLEngine.ts             -- Three.js core: renderer, camera, RAF loop, spring-physics mouse
          NebulaPlane.ts             -- Fullscreen GLSL shader: noise UV warp, vignette, grain, chromatic aberration, tone mapping
          FlowmapSystem.ts           -- 512x512 ping-pong RT, Gaussian velocity stamps, ~800ms decay
          StarSystem.ts              -- 2000 GPU stars via THREE.Points, GLSL parallax + twinkle + diffraction
          ZodiacGL.ts                -- 12 constellations: animated line draw-in, energy traces, starburst ignition
          zodiac-renderer.ts         -- OLD Canvas 2D renderer (unused, kept as reference)
    lib/
      zodiac-utils.ts                -- Sun sign calculator (date range math) + 3 pre-written horoscopes per sign, rotated by day-of-year
  public/
    nebula-bg.jpg                    -- 5K nebula photo (681KB, cropped to remove watermark area)
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
```

---

## 3. How to Run

```bash
cd ~/olivia-arcana/website

# Install dependencies (if first time)
npm install

# Start dev server
# IMPORTANT: PATH fix required on this machine, and --webpack flag needed for Three.js compatibility
PATH="/usr/local/bin:$PATH" node node_modules/.bin/next dev --webpack --port 3333

# Open http://localhost:3333
```

### Verify it works:
1. Move mouse fast over the nebula background -- you should see flowmap displacement (nebula flows under cursor)
2. Type a birthday in the MM/DD field (e.g., `03/06`) -- the corresponding constellation should pull to center, scale 3x, and a horoscope card should appear

### Why the PATH fix?
The local machine has a non-standard Node.js installation path. Without the PATH prefix, `next` can't find the Node binary. This only affects this specific development machine.

### Why --webpack?
Next.js 16 defaults to Turbopack. Three.js GLSL imports and certain shader patterns don't work reliably with Turbopack yet. The `--webpack` flag forces the classic webpack bundler.

---

## 4. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.2 | React framework, SSR, routing |
| `react` | 19.2.4 | UI library |
| `three` | 0.183.2 | WebGL 3D engine for cosmos pipeline |
| `@types/three` | 0.183.1 | TypeScript types for Three.js |
| `framer-motion` | 12.38.0 | Section animations, scroll reveals, hover effects |
| `@fontsource/cormorant-garamond` | 5.2.11 | Accent/label font (zodiac names, card titles) |
| `@fontsource/inter` | 5.2.8 | Body text font |
| `@fontsource/playfair-display` | 5.2.8 | Headline font |
| `tailwindcss` | 4.x | Utility-first CSS |
| `@tailwindcss/postcss` | 4.x | PostCSS integration for Tailwind |

---

## 5. Known Issues

1. **Hydration warnings from Hero.tsx** — The birthday input and horoscope display are client-only (use `useEffect` for zodiac computation). React 19 SSR hydration emits warnings because the server render differs from the client render. Not a bug, but noisy in console. Fix: wrap the dynamic parts in a `Suspense` boundary or use `'use client'` directive more granularly.

2. **Nebula background "Ai" watermark area** — The source image (`nebula-bg.jpg`) was cropped to remove a visible "Ai" watermark from the stock photo. The cropping is done, but there's a slightly darker region in the bottom-right corner where the crop happened. The GLSL tone mapping (`color *= 0.15`) makes this invisible in practice, but if the tone mapping values change, the artifact could reappear. Solution: replace with a properly licensed nebula photo.

3. **MacBook thermal throttling** — The full WebGL pipeline (nebula shader + flowmap + 2000 stars + zodiac renderer) runs at 60fps on M-series Macs but can cause thermal throttling on Intel MacBooks after ~10 minutes. The fan will spin up. This is expected during development.

4. **No mobile optimization yet** — The WebGL pipeline runs on mobile but is too heavy. Stars need reduction to 500, flowmap should be disabled on touch devices, and constellations should use tap-to-activate instead of hover. See Motion Direction doc for full mobile spec.

---

## 6. What to Build Next (Priority Order)

### Sprint 1 (Week 1): Foundation

#### 6.1 FastAPI Backend
**Why:** The website needs the same astrology engine the Telegram bot uses. The Python astrology code (kerykeion) is already built and tested.

**Build:**
```
backend/
  main.py                    -- FastAPI app, CORS config
  api/
    chart.py                 -- POST /api/chart (birth data -> natal chart)
    daily.py                 -- POST /api/daily (chart + transits -> reading)
    compatibility.py         -- POST /api/compat (two charts -> synastry)
    transits.py              -- GET /api/transits (current planetary positions)
    ask.py                   -- POST /api/ask (question + chart -> Claude answer)
    auth.py                  -- POST /api/auth (anonymous account creation)
  requirements.txt           -- fastapi, uvicorn, kerykeion, anthropic, sqlalchemy
```

**Key endpoints:**
| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/chart` | POST | `{date, time?, city?}` | Full natal chart (10 planets, 12 houses, aspects) |
| `/api/daily` | POST | `{chart_id}` | Personalized daily reading (Power/Pressure/Trouble format) |
| `/api/compat` | POST | `{chart_id_1, chart_id_2}` | Synastry scores (Love, Communication, Conflict, Trust) |
| `/api/transits` | GET | — | Current planetary positions |
| `/api/ask` | POST | `{question, chart_id}` | Claude-generated astrological answer |

**Reuse from bot codebase:**
- `src/astrology/charts.py` -- NatalChart computation (NASA JPL ephemeris)
- `src/astrology/transits.py` -- Current transit positions + overlays
- `src/astrology/synastry.py` -- Compatibility scores
- `src/astrology/geocode.py` -- City name to lat/lng + timezone
- `src/persona/engine.py` -- Claude persona engine (Olivia's voice)

#### 6.2 Onboarding Flow (`/onboarding`)
Multi-step form: Name -> Birth date -> Birth time (optional) -> Birth city (geocode autocomplete) -> Compute chart -> Show result.

4-5 screens with Framer Motion page transitions. The birthday input in Hero.tsx currently only collects MM/DD -- the onboarding flow collects full birth data for an accurate chart.

#### 6.3 Birth Chart Page (`/chart`)
Interactive SVG wheel visualization showing houses, planet positions, aspect lines. Reference Co-Star's circular chart view. Needs a React SVG component that renders the kerykeion chart data.

### Sprint 2 (Week 2): Daily Engine

#### 6.4 Daily Reading Page (`/daily`)
Claude API generates personalized readings based on today's transits overlaid on user's natal chart. Display format: Power / Pressure / Trouble categories (Co-Star's proven format).

#### 6.5 Planet-in-Sign Readings
For each planet in user's chart: "Your Sun in Pisces means..." x 10 planets + Rising. Pre-written or Claude-generated on first view, then cached.

### Sprint 3 (Week 3): Social

#### 6.6 Compatibility Checker (`/compatibility`)
Enter two birth charts -> compute synastry -> show scores in Love, Communication, Conflict, Trust. The engine (`src/astrology/synastry.py`) already exists.

#### 6.7 Shareable Chart Card
Generate a 1080x1080 image showing user's Big 3 (Sun/Moon/Rising) + cosmic tagline. Shareable to Instagram/TikTok. Server-side rendering with Python Pillow or HTML-to-image.

### Sprint 4 (Week 4): Monetization

#### 6.8 Ask the Stars (`/ask`)
Pay-per-question: user types a question -> Claude generates an astrologically-informed answer based on their chart + current transits. Bundle pricing (3 questions / $2.99).

#### 6.9 Payment Integration
Stripe for website payments. Subscription tiers: VIP Monthly ($6.50/mo), VIP Annual ($65/yr). One-time reading purchases ($1.95-$39.99).

---

## 7. Architecture

```
                    BROWSER
                      |
          +-----------+-----------+
          |                       |
   Next.js Frontend         Three.js WebGL
   (React + Tailwind)       (Cosmos Engine)
          |
     REST API calls
          |
          v
    FastAPI Backend (Python)
          |
    +-----+-----+-----+
    |           |     |
 kerykeion   Claude  SQLite/
 (NASA JPL)   API    Postgres
```

### Data flow for a daily reading:
1. User opens `/daily`
2. Frontend sends `POST /api/daily` with `chart_id`
3. Backend loads user's natal chart from DB
4. Backend computes today's transits via kerykeion
5. Backend overlays transits on natal chart to find active aspects
6. Backend sends chart + transits to Claude API with Olivia persona prompt
7. Claude generates personalized reading
8. Backend returns reading as JSON
9. Frontend renders in Power/Pressure/Trouble format

---

## 8. Design Tokens

### CSS Variables (Celestial Noir palette)

```css
:root {
  /* Colors */
  --color-void-black: #0D0D1A;
  --color-deep-cosmos: #1A1A3E;
  --color-celestial-gold: #D4AF37;
  --color-slate-blue: #7B68EE;
  --color-warm-ivory: #F5F0E8;
  --color-muted-lavender: #9B96A8;
  --color-cosmic-teal: #4ECDC4;
  --color-mars-red: #E8524A;

  /* Typography */
  --font-headline: 'Playfair Display', serif;       /* 700 weight */
  --font-body: 'Inter', sans-serif;                   /* 400 weight */
  --font-accent: 'Cormorant Garamond', serif;         /* 500 weight */

  /* Glass morphism */
  --glass-bg: rgba(13, 13, 26, 0.6);
  --glass-border: rgba(212, 175, 55, 0.15);
  --glass-blur: 20px;

  /* Spacing */
  --section-padding: 80px;
  --card-radius: 16px;
  --border-thin: 1px solid var(--glass-border);
}
```

### Glass Morphism Pattern
Used on Navbar, cards, and interactive panels:
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--border-thin);
  border-radius: var(--card-radius);
}
```

### Typography Scale
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| H1 (Hero) | Playfair Display | 64px | 700 | Celestial Gold |
| H2 (Section) | Playfair Display | 42px | 700 | Celestial Gold |
| H3 (Card title) | Cormorant Garamond | 24px | 500 | Celestial Gold |
| Body | Inter | 16-18px | 400 | Warm Ivory |
| Label | Cormorant Garamond | 14px | 500 | Muted Lavender |
| Small | Inter | 13px | 400 | Muted Lavender |

---

## 9. Three.js WebGL System Architecture

### System Hierarchy
```
WebGLEngine (orchestrator)
  |
  +-- NebulaPlane (fullscreen GLSL shader)
  |     - Noise UV warp (FBM)
  |     - Vignette + grain
  |     - Chromatic aberration (flowmap-driven)
  |     - Tone mapping: color *= 0.15, Reinhard, pow 1.6
  |     - Receives flowmap texture as uniform
  |
  +-- FlowmapSystem (mouse interaction)
  |     - 512x512 ping-pong render targets (2 FBOs)
  |     - Gaussian velocity stamps at mouse position
  |     - ~800ms exponential decay
  |     - Output: displacement texture sampled by NebulaPlane
  |     - Flowmap strength: 0.14
  |
  +-- StarSystem (GPU particles)
  |     - 2000 stars via THREE.Points
  |     - GLSL vertex shader: parallax based on depth attribute
  |     - GLSL fragment shader: twinkle (noise-modulated alpha) + diffraction spikes (cross shape for bright stars)
  |     - Star colors: 60% warm white, 15% blue-white, 10% yellow, 10% orange-red, 5% deep red
  |
  +-- ZodiacGL (constellation renderer)
        - 12 constellations with ecliptic-band placement
        - Animated line draw-in (0-1 progress uniform)
        - Energy traces along connection lines
        - Starburst node ignition at constellation stars
        - Sacred geometry rings (activated state)
        - Listens for 'zodiac:activate' custom events
```

### Render Loop (per frame)
1. `FlowmapSystem.update(mouseX, mouseY, deltaTime)` -- stamp velocity, decay previous frame
2. `NebulaPlane.update(time, flowmapTexture)` -- render nebula with displacement
3. `StarSystem.update(time, mouseX, mouseY)` -- update parallax + twinkle
4. `ZodiacGL.update(time, activeSign)` -- animate constellations
5. `WebGLEngine.render()` -- compose to screen

### Key Shader Uniforms
| System | Uniform | Value | Purpose |
|--------|---------|-------|---------|
| Nebula | `u_time` | elapsed seconds | Animates noise warp |
| Nebula | `u_flowmap` | sampler2D | Displacement from FlowmapSystem |
| Nebula | `u_flowStrength` | 0.14 | Displacement intensity |
| Nebula | `u_darken` | 0.15 | Tone mapping multiplier |
| Stars | `u_mousePos` | vec2 | Parallax reference point |
| Stars | `u_time` | elapsed seconds | Twinkle animation |
| Zodiac | `u_activeSign` | int (0-11 or -1) | Which constellation is activated |
| Zodiac | `u_progress` | float (0-1) | Line draw-in animation progress |

---

## 10. Birthday-to-Zodiac Activation System

### Event Flow
```
User types "03/06" in Hero.tsx birthday input
  |
  v
zodiac-utils.ts: getZodiacSign("03/06") -> "pisces"
  |
  v
Hero.tsx dispatches CustomEvent('zodiac:activate', { detail: { sign: 'pisces' } })
  |
  v
ZodiacGL.ts event listener receives event
  |
  v
ZodiacGL animates:
  1. Focused constellation pulls to viewport center (spring animation)
  2. Constellation scales to 3x
  3. Full activation: line draw-in, starburst, sacred geometry
  4. Other 11 signs fade to 20% opacity
  |
  v
Hero.tsx shows horoscope card:
  - zodiac-utils.ts has 3 pre-written readings per sign
  - Rotation: dayOfYear % 3 selects which reading to show
  - Card slides in with Framer Motion (fade up + scale)
```

### Birthday Input Behavior
- Auto-inserts `/` after typing 2 digits (MM)
- Validates month (01-12) and day (01-31)
- No year needed for sun sign calculation
- On valid input: triggers zodiac activation
- On clear/delete: resets constellation view to default

### How to Extend for Full Birth Data
The current Hero.tsx input only collects MM/DD for the quick zodiac preview. The onboarding flow (to be built) should collect:
1. Full date (YYYY/MM/DD)
2. Birth time (HH:MM, with "I don't know" option)
3. Birth city (autocomplete using geocode API -> lat/lng + timezone)

This full data goes to `POST /api/chart` which uses kerykeion with NASA JPL ephemeris for precise planet/house calculation.

---

## 11. Performance Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Target FPS | 60fps on M1+, 30fps minimum on Intel | MacBook development machine thermal limits |
| Star count | 2000 maximum | GPU particle budget; reduce to 500 on mobile |
| Flowmap resolution | 512x512 | Two FBOs; higher causes frame drops on Intel |
| DevicePixelRatio | Scale stars by 1/dpr if dpr > 1.5 | Retina displays multiply fragment count |
| Nebula shader passes | 4 FBM octaves | More octaves = more ALU pressure |
| Constellation hover throttle | Every 2nd frame | Distance calculations for 12 signs |
| `prefers-reduced-motion` | Static gradient fallback | Accessibility requirement |
| Mobile | Disable flowmap, reduce stars to 500 | Touch devices lack hover; save GPU |

### Thermal Management
The MacBook's fan will spin up during development with the WebGL pipeline running. To reduce:
- Close other GPU-intensive apps (browsers with WebGL, Figma)
- Use `--port 3333` to avoid conflicts
- Kill the dev server when not actively testing WebGL (`Ctrl+C`)

---

## 12. Reference Documents

| Document | Path | Contains |
|----------|------|----------|
| Feature Spec | `/Users/macbookpro/olivia-arcana/docs/COSTAR_FEATURE_SPEC.md` | 21 features, 4 priority tiers, architecture, sprint plan |
| Business Architecture | `/Users/macbookpro/olivia-arcana/docs/BUSINESS_ARCHITECTURE.md` | Revenue model, pricing, unit economics, launch phases |
| Motion Direction | `/Users/macbookpro/olivia-arcana/docs/MOTION_DIRECTION.md` | Animation spec, zodiac-specific motion, performance rules |
| Design System | `/Users/macbookpro/olivia-arcana/docs/DESIGN_SYSTEM.md` | 5 visual variants, Celestial Noir primary, typography, color palettes |
| Asset Specifications | `/Users/macbookpro/olivia-arcana/docs/ASSET_SPECIFICATIONS.md` | 14 marketing asset templates with exact dimensions and layouts |
| Session Handoff | `/Users/macbookpro/olivia-arcana/SESSION_HANDOFF_V3.md` | Latest session state, what was built, what's next |
