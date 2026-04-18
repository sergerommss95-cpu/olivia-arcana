# Handoff: Card of the Day + Veil Reveal System

## Overview

The Card of the Day page (`/academy/card-of-the-day`) is the flagship interactive experience. A 3D cloth veil covers the screen — the user holds (desktop mouse / mobile touch) for 1.3 seconds to lift it, triggering a 7-second cinematic reveal of a daily tarot card. After reveal, an info panel slides in with the card's meaning, advice, and correspondences.

---

## File Map

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/academy/card-of-the-day/page.tsx` | 123 | Page orchestrator — daily card selection, state, layout |
| `src/components/veil-reveal/VeilRevealScene.ts` | 1156 | Core Three.js scene — cloth, shaders, choreography |
| `src/components/veil-reveal/VeilRevealWrapper.tsx` | 257 | React bridge — dynamic import, loading state, cursor ring |
| `src/components/veil-reveal/PBDCloth.ts` | 223 | Position-Based Dynamics cloth solver |
| `src/components/veil-reveal/VeilAudio.ts` | 132 | Procedural audio — whoosh + chimes via Web Audio API |
| `src/components/veil-reveal/CardInfoPanel.tsx` | 158 | Post-reveal info display with Framer Motion staggering |

**Total: ~2,049 lines** for the complete veil system.

---

## Architecture

```
page.tsx (state + layout)
  └─ VeilRevealWrapper.tsx (React shell)
       └─ VeilRevealScene.ts (Three.js runtime)
            ├─ PBDCloth.ts (cloth physics)
            └─ VeilAudio.ts (procedural sound)
  └─ CardInfoPanel.tsx (post-reveal info)
```

### page.tsx — Orchestrator

- **Daily card selection**: `getDailyCard()` uses a day-of-year seed (`dayOfYear * 2654435761`) to deterministically pick a card from `ALL_CARDS` (78 cards). Same card for all users on a given day.
- **Reversed chance**: ~33% (`(seed >> 8) % 3 === 0`)
- **State**: `card`, `reversed`, `revealed`, `mounted`
- **Callbacks**:
  - `handleRevealComplete` → sets `revealed=true`, calls `recordDraw()` to deck memory, auto-scrolls to info panel after 1s
  - `handleDrawAgain` → picks random new card (guaranteed different), scrolls to top, resets veil

### VeilRevealWrapper.tsx — React Bridge

- Dynamic-imports `VeilRevealScene` (keeps Three.js out of initial bundle)
- Shows loading state: pulsing gradient background + "Preparing your reading..." text
- Manages canvas lifecycle: create → init scene → dispose on unmount
- **Cursor ring**: Custom CSS ring that follows mouse, pulses when holding, uses `requestAnimationFrame`
- **Hint text**: "Hold to reveal your card" fades in after 2s, fades out when holding starts
- **Draw Again button**: Appears after reveal complete, positioned over the canvas

### VeilRevealScene.ts — The Engine (1,156 lines)

**4 custom GLSL shaders:**

1. **Nebula shader** (veil cloth material) — Animated fractal noise in purple/gold palette, responds to cloth deformation
2. **Card wipe shader** — Top-to-bottom reveal with soft gradient edge, driven by `uRevealProgress` uniform
3. **Filmic grading** (post-processing) — Color grading pass: warm highlights, cool shadows, vignette
4. **Card glow shader** — Bloom halo around the revealed card

**Physics — PBD Cloth:**
- Grid: 32×32 vertices
- Constraints: structural (stiffness 1.0), shear (0.55), bending (0.22)
- 10 solver iterations per frame
- Top edge pinned, rest falls under gravity
- On hold: top-edge pins release sequentially from center outward

**7-Second Reveal Choreography (after 1.3s hold threshold):**
```
0.0s  — Cloth pins release, gravity takes over
0.0s  — Whoosh audio begins
0.5s  — Card wipe shader starts (uRevealProgress 0→1 over 2s)
1.0s  — Bloom intensity ramps up
2.5s  — Card fully visible
3.0s  — Chime audio plays
4.0s  — Bloom settles to ambient level
5.0s  — Camera eases to final position
7.0s  — onRevealComplete callback fires
```

**Renderer setup:**
- `WebGLRenderer` with `alpha: true`, `antialias: true`, `powerPreference: "high-performance"`
- `ACESFilmicToneMapping`, exposure 1.2
- `EffectComposer` with `UnrealBloomPass` (strength 0.8, radius 0.4, threshold 0.85)
- Aspect ratio: fills viewport, resizes on window resize

### PBDCloth.ts — Cloth Physics

- Position-Based Dynamics (Müller et al. 2007)
- `Particle` class: position, previous position, mass, pinned flag
- `Constraint` class: distance constraint with stiffness
- `solve(dt)`: Verlet integration → constraint projection (10 iterations) → collision
- Exposed API: `setWind(vec3)`, `unpinRow(row)`, `reset()`

### VeilAudio.ts — Procedural Sound

- No audio files — everything synthesized via Web Audio API
- `whoosh()`: filtered noise burst, 0.8s duration, bandpass 200-2000Hz
- `chime()`: 3 sine oscillators at harmonic intervals, exponential decay
- Volume respects system mute / `prefers-reduced-motion`

### CardInfoPanel.tsx — Post-Reveal Display

- Receives `card: TarotCard` and `reversed: boolean`
- Sections (staggered entrance via Framer Motion):
  1. Card name + numeral + reversed badge
  2. Keywords (from `card.keywords`)
  3. Upright meaning or reversed meaning
  4. Advice text
  5. Correspondences: element, planet, zodiac sign

---

## Data Dependencies

| Data | Source | Used for |
|------|--------|----------|
| `ALL_CARDS` (78 cards) | `src/lib/academy/tarot-cards.ts` | Card selection, meanings, keywords |
| `getCardImagePath()` | `src/lib/academy/card-images.ts` | Card face texture for Three.js |
| `recordDraw()` | `src/lib/deck-memory.ts` | localStorage draw history |

---

## Key Constants & Tunables

```typescript
// VeilRevealScene.ts
HOLD_THRESHOLD = 1.3        // seconds to trigger reveal
REVEAL_DURATION = 7.0       // total choreography length
CLOTH_GRID = 32             // vertices per side
SOLVER_ITERATIONS = 10
BLOOM_STRENGTH = 0.8
BLOOM_RADIUS = 0.4
BLOOM_THRESHOLD = 0.85

// PBDCloth.ts
STRUCTURAL_STIFFNESS = 1.0
SHEAR_STIFFNESS = 0.55
BENDING_STIFFNESS = 0.22

// page.tsx
SCROLL_DELAY = 1000         // ms after reveal before auto-scroll
REVERSED_CHANCE = 0.33      // 1 in 3
```

---

## Mobile Behavior

- Touch-hold replaces mouse-hold (same 1.3s threshold)
- Canvas fills 100vh
- Cursor ring hidden on touch devices
- `devicePixelRatio` capped at 2 for performance
- Info panel scrollable below the fold

---

## Known Gotchas

1. **Three.js defaults to pitch black** — All lights are explicitly set: ambient (0.5), key directional (1.4, warm), rim directional (0.6, purple). If you change lighting, test visually.
2. **WebGL context limits** — Chrome allows ~16 contexts. The `activeContexts` counter (global, max 6) prevents context exhaustion. Falls back to `onError` callback.
3. **Static export** — The site uses `output: "export"`. No SSR. The veil scene runs entirely client-side.
4. **Dynamic import** — Three.js is dynamically imported in VeilRevealWrapper to avoid 500KB+ in the initial bundle.
