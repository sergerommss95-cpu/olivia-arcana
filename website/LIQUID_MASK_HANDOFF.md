# Liquid Mask Reveal — /oracle Page Handoff

**Project:** `/Users/macbookpro/olivia-arcana/website`
**Route:** `/oracle`
**Live URL:** `http://localhost:3333/oracle`
**Date:** 2026-04-11

---

## What It Is

An interactive "Discover Your Cosmic Self" experience on the Olivia Arcana website. A cosmic marble bust fills the canvas. When the user moves their cursor over it, a soft circular mask reveals a real human face underneath — the marble "melts away" to show the true self. On mobile, touch replaces cursor. For reduced-motion users, a static side-by-side fallback is shown.

**Reference:** Recreates the liquid mask effect from [@Oriku175's viral post](https://x.com/Oriku175/status/2042305257947218256), built in pure WebGL instead of Unicorn Studio.

---

## How to Run

```bash
cd /Users/macbookpro/olivia-arcana/website
npm run dev
# → http://localhost:3333/oracle
```

---

## File Inventory

| File | Lines | What |
|------|-------|------|
| `src/components/oracle/LiquidMaskEngine.ts` | 320 | Pure WebGL class — shaders, textures, rAF loop, pointer tracking, velocity, presence |
| `src/components/oracle/LiquidMaskCanvas.tsx` | 243 | React wrapper — dynamic import, lifecycle, mouse/touch, 3-layer cursor, enter/leave |
| `src/components/oracle/OracleLoadingState.tsx` | 42 | "Summoning the Oracle..." shimmer placeholder |
| `src/components/oracle/OracleStaticFallback.tsx` | 54 | Side-by-side images for reduced-motion / no-WebGL |
| `src/app/oracle/page.tsx` | 185 | Page layout — glass nav, canvas, headline, CTA |
| `public/liquid-mask/base.png` | — | Cosmic marble bust (957 KB, Vertex AI `gemini-2.5-flash-image`) |
| `public/liquid-mask/reveal.png` | — | Real human face, same pose (1.0 MB, Vertex AI image edit) |

---

## Architecture

```
page.tsx ("use client")
  └── dynamic(() => import("LiquidMaskCanvas"), { ssr: false })
        ├── LiquidMaskEngine.ts   (Pure WebGL, no Three.js)
        ├── OracleLoadingState    (while textures load)
        └── OracleStaticFallback  (prefers-reduced-motion / no WebGL)
```

**Why `dynamic({ ssr: false })`:** The engine uses `document.createElement('canvas')` and `getContext('webgl')` which crash during SSR. A direct import of a `"use client"` component in Next.js 16 causes "Lazy element type must resolve to class or function" errors. The `dynamic()` wrapper with an explicit `loading` component solves both.

**Why no Three.js:** The effect is a single fullscreen quad with a custom fragment shader. Three.js would add ~500KB of unused code. The existing site already has Three.js for the starfield, but this component avoids adding to that dependency surface.

---

## LiquidMaskEngine — WebGL Core

### Shader Uniforms (9)

| Uniform | Type | Purpose |
|---------|------|---------|
| `uBase` | sampler2D | Marble bust texture |
| `uReveal` | sampler2D | Real face texture |
| `uMouse` | vec2 | Smooth-lerped cursor position (0–1) |
| `uTime` | float | Elapsed seconds |
| `uAspect` | float | Canvas width/height for circular mask |
| `uRadius` | float | Mask radius (0.26 desktop, 0.32 mobile) |
| `uFeather` | float | Edge softness (0.09) |
| `uVelocity` | float | Cursor speed 0–1, tracked per frame |
| `uPresence` | float | 0→1 animated on cursor enter/leave |

### Shader Effects (7)

1. **Soft circular mask** — `smoothstep(radius - feather, radius + feather*0.25, dist)`
2. **Liquid edge noise** — 2-layer scrolling Perlin noise distorts the mask boundary (scales with `uPresence`)
3. **Dynamic radius** — grows 4% with velocity for a breathing feel
4. **Multi-layer chromatic edge glow** — rotating iridescent ring (gold ↔ blue + cyan accent), pulsing at 1.8 Hz
5. **Micro chromatic aberration** — R/B channel split at mask edge (0.006 offset)
6. **Warm face glow** — soft orange overlay on revealed pixels
7. **Ambient marble shimmer** — specular noise crawl on base texture bright areas

Plus: vignette + film grain.

### Class API

```typescript
new LiquidMaskEngine(container, {
  baseImage: "/liquid-mask/base.png",
  revealImage: "/liquid-mask/reveal.png",
  maskRadius: 0.26,
  feather: 0.09,
  lerpFactor: 0.09,
  onReady: () => { /* textures loaded */ },
})

engine.start()                      // Begin rAF loop
engine.updatePointer(normX, normY)  // Forward mouse position (0–1)
engine.setPresent(true/false)       // Animate mask in/out on enter/leave
engine.dispose()                    // Cleanup: cancel rAF, remove canvas
```

### Canvas Sizing

The engine creates its own `<canvas>` and appends it to the container. Initial sizing uses `setTimeout` at 100ms + 500ms + `ResizeObserver` because:
- Immediate `getBoundingClientRect()` returns wrong size before CSS `aspectRatio` takes effect
- The container's `aspectRatio: 1/1` style needs a layout pass to resolve

---

## LiquidMaskCanvas — React Wrapper

### StrictMode Handling

React 18+ StrictMode does mount → unmount → remount in dev. The dynamic `import()` is async, so cleanup can run before the import resolves. An `aborted` flag prevents the orphaned `.then()` from creating an engine after cleanup:

```typescript
let aborted = false
import("./LiquidMaskEngine").then(({ LiquidMaskEngine }) => {
  if (aborted) return  // StrictMode cleaned up while we were loading
  const engine = new LiquidMaskEngine(...)
  ...
})
return () => { aborted = true; engine?.dispose() }
```

### 3-Layer Custom Cursor (Desktop Only)

| Layer | Size | Visual | Follows with |
|-------|------|--------|-------------|
| Outer halo | 80px | Soft purple radial gradient | 250ms CSS transition, scales 1→2.2× with velocity |
| Middle ring | 36px | Thin gold border | 180ms CSS transition, scales 1→1.5× with velocity |
| Inner core | 8px | Bright gold dot, screen blend, glow shadow | Instant (no transition) |

All positioned via `translate3d()` for GPU acceleration. Hidden on mobile.

### Enter/Leave

- `mouseenter` → `engine.setPresent(true)`, hint text fades out (opacity 0)
- `mouseleave` → `engine.setPresent(false)`, hint text returns (opacity 1)
- The `uPresence` uniform animates 0↔1 at lerp rate 0.08 — mask grows/shrinks smoothly

### Velocity Tracking

Per-frame: `velocity = clamp(sqrt(dx²+dy²), 0, 40) / 40`. This drives:
- `uVelocity` in the shader (radius growth + feather expansion)
- Cursor layer scaling (ring and halo grow when moving fast)

---

## Page Layout (`/oracle`)

```
┌──────────────────────────────────────────────┐
│  ← Olivia Arcana                    ORACLE   │  ← Glass nav bar (fixed, 60px)
├──────────────────────────────────────────────┤
│                                              │
│         ┌──────────────────────┐             │
│         │                      │             │
│         │   LiquidMaskCanvas   │ 600×600     │
│         │   (WebGL)            │ max         │
│         │                      │             │
│         └──────────────────────┘             │
│                                              │
│      Discover Your *Cosmic* Self             │  ← Cormorant Garamond, gold gradient
│                                              │
│      Move your cursor to peel back           │  ← Inter 300, muted
│      the marble...                           │
│                                              │
│      ┌─ BEGIN YOUR COSMIC PORTRAIT ─┐        │  ← Pill CTA → /portrait
│      └──────────────────────────────┘        │
│                                              │
│      ✦ Powered by real NASA planetary data   │
└──────────────────────────────────────────────┘
```

Background: Global starfield (from `layout.tsx`, behind all pages).

---

## Image Generation

Both images were generated via **Vertex AI** (`gemini-2.5-flash-image`) using the project's existing Google Cloud credentials:

**Project:** `project-f778abe0-d2d9-47df-802`
**Location:** `us-central1`
**Auth:** Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`)

### Base Prompt
> Hyper-realistic close-up portrait of a classical Greek marble bust of a young woman. The upper half of her face — eyes, forehead, temples — is replaced by a deep swirling cosmic nebula void with glowing stars and indigo-purple gas clouds. Pearlescent liquid-mercury sheen with subtle iridescence. Greco-Roman sculptural curls. 4K, cinematic studio lighting, black background.

### Reveal Prompt (Image Edit)
> Transform this marble bust into a photo-realistic portrait of the same woman. Remove ALL marble texture, cosmic elements. Replace with natural warm human skin tone. Keep the EXACT same face shape, pose, angle, lighting. Natural dark brown hair, subtle makeup. Same black background.

The reveal image was generated by feeding the base image back to Gemini with the edit prompt — this guarantees pose/composition match.

**Regeneration script:** `olivia-tarot-proto/liquid-mask-generator.py` (Gradio UI, also supports BFL Flux as fallback)

---

## Design Tokens Used

All from `src/app/globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--c-void` | `#04020d` | Canvas background |
| `--c-border` | `rgba(255,255,255,0.08)` | Canvas border |
| `--radius-card` | `1.25rem` | Canvas corners |
| `--glass-bg` | `rgba(255,255,255,0.05)` | Nav bar background |
| `--glass-blur` | `blur(18px) saturate(1.25)` | Nav bar backdrop |
| `--font-heading` | Playfair Display | Nav brand text |
| `--font-accent` | Cormorant Garamond | Headline, hint, loading text |
| `--font-body` | Inter | Body copy, CTA |
| `--color-celestial-gold` | `#D4AF37` | Nav brand color |
| `--c-text-primary` | `rgba(240,236,255,0.95)` | Headline |
| `--c-text-mid` | `rgba(196,185,228,0.80)` | Body copy |

---

## Bugs Fixed During Integration

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Page crash loop (91 reloads/5s) | Direct import of `"use client"` component → "Lazy element type invalid" | Wrapped in `dynamic({ ssr: false, loading: ... })` |
| Canvas 300×150 (default) | `resize()` ran before CSS `aspectRatio` layout pass | Added `setTimeout` at 100ms + 500ms fallback |
| Engine killed by StrictMode | Async import resolves after cleanup → orphaned engine | `aborted` flag in the `.then()` closure |
| Mask invisible (too small) | `maskRadius: 0.15` = ~45px on 600px canvas | Bumped to 0.26 desktop / 0.32 mobile |
| Reveal face showed at load | `smoothX/smoothY` initialized at (0.5, 0.5) | Initialized at (-1, -1) = off-screen |
| Starfield canvas confused debugging | `document.querySelector('canvas')` found wrong canvas | Both canvases correctly layered (z-index -1 vs auto) |

---

## Accessibility

- **`prefers-reduced-motion: reduce`** → WebGL skipped entirely, static side-by-side images shown
- **Mobile:** Touch events (`touchstart`, `touchmove`) with `{ passive: true }`
- **No WebGL:** Falls back to static if `getContext('webgl')` fails
- **Nav:** Back-link to home with visible "← Olivia Arcana" text
- **Known gap:** No `aria-live` region for the reveal state change

---

## Performance

| Metric | Value |
|--------|-------|
| JS chunk (engine) | ~10KB gzipped |
| Texture loads | 2 × ~1MB PNG (async, placeholder while loading) |
| FPS | 60 stable (single quad, no geometry, no physics) |
| DPR | Capped at 2× |
| Shader complexity | Low (2 texture samples + noise + smoothstep per pixel) |

---

## What's NOT Done

- [ ] i18n — all strings are hardcoded English (should use `useLocale()`)
- [ ] Footer link to /oracle not added
- [ ] Touch: cursor/mask works on touch but not tested on real devices
- [ ] Analytics event on reveal interaction
- [ ] SEO: meta description, Open Graph image for /oracle
- [ ] Separate base/reveal images per user (currently static marble/face pair)
- [ ] Navbar "Oracle" link not yet in all translations
