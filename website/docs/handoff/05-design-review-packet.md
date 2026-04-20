# Design Review Packet — Olivia Arcana

**For review at [claude.ai/design](https://claude.ai/design)**

---

## 1. Quick Reference

| | |
|---|---|
| **Live site** | https://oliviaarcana.com |
| **Repo** | `olivia-arcana/website/` |
| **Deployed commit** | `29237c0` (Netlify auto-deploy from `main`) |
| **Stack** | Next.js 16 (static export) · React 19 · Tailwind CSS 4 · Framer Motion 12 · Three.js 0.183 |
| **Build** | `npx next build` → `out/` |
| **Hosting** | Netlify (static) + FastAPI on Railway (payments/chat) + Supabase (auth) + Stripe (payments) |
| **Product** | Premium astrology + tarot + AI oracle. Dark-mode only. Editorial aesthetic meets cinematic ceremony. |

> ⚠️ **Next.js 16 has breaking changes** — APIs differ from older versions. Turbopack is default. Static export only (`output: "export"`), no SSR, no API routes in Next.

---

## 2. Design Tokens

All tokens live in `src/app/globals.css`. The system uses **CSS custom properties** (not a JS theme object).

### 2.1 Color System

```css
/* Base — cosmic void */
--c-void:          #06041a;   /* body/html background */
--c-deep-space:    #0b081e;
--c-nebula:        #160e32;

/* Surface — glassmorphism */
--c-surface:       rgba(255,255,255,0.04);
--c-surface-2:     rgba(255,255,255,0.07);
--c-border:        rgba(200,185,255,0.10);
--c-border-2:      rgba(200,185,255,0.18);

/* Text — ivory on void */
--c-text-primary:  rgba(240,236,255,0.95);
--c-text-mid:      rgba(196,185,228,0.80);
--c-text-muted:    rgba(155,145,190,0.60);

/* Accents — mystic purple */
--c-accent:        #a07ae0;
--c-accent-glow:   rgba(130,90,220,0.22);

/* Signature gold */
--c-gold:          #D4AF37;

/* Glass */
--glass-bg:        rgba(255,255,255,0.05);
--glass-border:    rgba(255,255,255,0.09);
--glass-blur:      blur(18px) saturate(1.25);

/* Scrims (for text over nebula) */
--scrim-soft:      radial-gradient(ellipse at center, rgba(8,6,20,0.62) 0%, transparent 95%);
--scrim-strong:    linear-gradient(180deg, rgba(8,6,20,0.75), rgba(8,6,20,0.55));

/* Named brand colors */
--color-celestial-gold:  #D4AF37;
--color-slate-blue:      #7B68EE;
--color-warm-ivory:      #F5F0E8;
--color-muted-lavender:  #9B96A8;
--color-cosmic-teal:     #4ECDC4;
--color-mars-red:        #E8524A;
```

### 2.2 Time-of-Day Palette (automatic)

The `<html data-tod="...">` attribute is set by JS based on local hour. Four states swap a background tint + accent:

| Time | Accent | Bias gradient | Greeting |
|------|--------|---------------|----------|
| Dawn (5a–9a) | `#F6B98A` warm amber | coral glow | "morning" |
| Day (9a–5p) | `#E8C96A` crisp ivory-gold | subtle gold | "afternoon" |
| Dusk (5p–9p) | `#D8B3E8` violet | violet glow | "evening" |
| Night (9p–5a) | `#B8C4F0` cool indigo | indigo glow | "night" |

Transition: `background 3s ease` on the `body::before` layer.

### 2.3 Typography

Fonts loaded via `next/font/google`:

```ts
Cormorant_Garamond  → --font-heading  (300, 400, 500, 600 + italic) — display/serif
DM_Sans             → --font-body     (300, 400, 500) — body/sans
IBM_Plex_Mono       → --font-mono     (400) — accents, data, eyebrows
```

**Type scale** (`globals.css:278-281`):
```css
h1, .text-4xl, .text-5xl { font-size: clamp(1.75rem, 5vw, 3.5rem); }
h2, .text-3xl            { font-size: clamp(1.35rem, 4vw, 2.25rem); }
h3, .text-2xl            { font-size: clamp(1.1rem, 3vw, 1.5rem); }
```

**Hero headline** (`Hero.tsx`): `clamp(2.9rem, 7.2vw, 6.8rem)` italic Cormorant, `-0.02em` tracking, `1.02` line-height.

**Eyebrow pattern**: `0.72rem` body font, `0.28em` tracking, uppercase, gold-ish color `rgba(232, 201, 106, 0.78)`.

### 2.4 Radii

```css
--radius-pill: 9999px;   /* buttons, chips */
--radius-card: 1.25rem;  /* glass cards */
--radius-sm:   0.5rem;   /* inputs */
```

### 2.5 Motion Tokens (Awwwards-grade easings)

```css
--ease-ritual:    cubic-bezier(0.16, 1, 0.3, 1);      /* dominant — veil, cards, reveals */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);  /* buttons, bounces */
--ease-smooth:    cubic-bezier(0.25, 0.1, 0.25, 1);   /* default transitions */
--ease-dramatic:  cubic-bezier(0.075, 0.82, 0.165, 1); /* page enters */
--ease-snap:      cubic-bezier(0.68, -0.55, 0.265, 1.55); /* pops */
```

**Named keyframes** available globally: `float`, `pulse-glow`, `shimmer`, `pageEnter`, `magnetic-glow-pulse`, `oracle-orbit`, `oracle-twinkle`, `oracle-aura-breathe`, and more.

### 2.6 Layout / Navbar

```css
--nav-height: 5rem;           /* consistent top-offset token */
```

Safe-area insets respected on body padding for notched devices.

---

## 3. Signature Utilities (CSS)

### 3.1 `.glass-card`
Glass morphism primitive — the workhorse surface.
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);   /* blur(18px) saturate(1.25) */
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow:
    0 2px 24px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,255,255,0.05);
}
```
Hover lifts the shadow to `0 4px 36px rgba(100,70,200,0.12)`.

### 3.2 `.text-gold-gradient`
```css
background: linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### 3.3 `.gradient-border`
CSS-mask gold→purple→gold animated border for premium CTA frames.

### 3.4 `.star-divider`
Signature section break — two gold-fading lines with a `✦` glyph in center.

### 3.5 Glow text
- `.glow-gold` — double-layer gold text-shadow
- `.glow-blue` — slate-blue equivalent

### 3.6 Scrim system (readability over nebula)
- `.scrim-text` — radial fade behind blocks
- `.scrim-pill` — rounded pill behind short labels
- `.scrim-strong` — near-opaque surface for inputs

---

## 4. Component Inventory (95 files)

### Global shell (every page)
`ClientShell.tsx` wraps everything and mounts: `Starfield`, `CosmicCursor`, `SoundEngine`, `FilmGrain`, `PageTransition`, `SmoothScroll` (Lenis), `EclipseOverlay` (conditional).

### Navigation
- `Navbar.tsx` — sticky top, glass, mobile drawer
- `Footer.tsx` — 3-col grid, gold divider
- `LanguageSwitcher.tsx` — locale menu (9 languages planned)

### Hero / landing
- `Hero.tsx` — stagger-revealed headline, cosmic profile activation via birthday input
- `CosmicProfile.tsx` — appears after birthday entry
- `Features.tsx` / `HowItWorks.tsx` / `Testimonials.tsx` / `CTA.tsx`
- `DailyHoroscope.tsx`, `CompatibilityChecker.tsx`, `CosmicSelfie.tsx`
- `InfiniteMarquee.tsx` — infinite horizontal text scroll

### Pricing & payments
- `Pricing.tsx` — tiered pricing with monthly/annual toggle
- `CheckoutButton.tsx` — Stripe checkout trigger
- `VipBadge.tsx`, `Paywall.tsx`, `UpgradePrompt.tsx`

### Interaction primitives (Awwwards-level)
- `MagneticButton.tsx` — cursor-tracked scale + glow
- `MagneticGlow.tsx` — global magnetic glow layer
- `ScrollFloat.tsx` — scroll-scrubbed micro-animations
- `ScrollReveal.tsx` / `SectionReveal.tsx` / `SmoothReveal.tsx` — variants
- `TiltCard.tsx` — 3D perspective tilt
- `ParallaxSection.tsx`, `HorizontalScroll.tsx`
- `MorphingText.tsx`, `WhisperText.tsx`, `TextReveal.tsx`
- `AnimatedCounter.tsx`

### Page transitions
- `transitions/PageTransition.tsx` — orchestrator
- `transitions/TransitionLink.tsx` — wraps `<Link>`, triggers overlay before nav
- `transitions/TransitionOverlay.tsx` — cosmic wipe curtain

### 3D / WebGL systems
- `veil-reveal/*` — flagship Card of the Day ceremony (see doc 01)
- `cosmos/engine/*` — WebGL star map (WebGLEngine, StarSystem, NebulaPlane, ShootingStars, ZodiacGL, FlowmapSystem)
- `oracle/LiquidMaskCanvas` + `LiquidMaskEngine` — WebGL liquid mask
- `sacred-symbols/*` — 3D extruded SVG symbols (zodiac, mystical, sacred geometry)

### Academy widgets (8 interactive lesson tools)
`academy/ZodiacWheel`, `HouseWheel`, `ElementMatrix`, `PlanetaryJourney`, `AspectVisualizer`, `FoolsJourneyMap`, `TarotRevealCard`, `SecretReveal`

### Ambient / overlay
- `Starfield.tsx` — canvas twinkling star background
- `CosmicCursor.tsx` — custom cursor with trail
- `FilmGrain.tsx` — CSS film grain overlay
- `ConstellationOverlay.tsx` — SVG constellation patterns
- `EclipseOverlay.tsx` — special-date eclipse animation
- `CardAgeOverlay.tsx` — aging/patina effect
- `GlobalBackground.tsx` — base void layer

### Audio
- `SoundEngine.tsx` — orchestrator
- `AmbientSound.tsx` — background ambient audio
- `lib/procedural-audio.ts` — Web Audio API synthesis (whooshes, chimes)
- `lib/zodiac-sounds.ts` — sign-specific sound themes

### Utility
- `CinematicLoader.tsx` — full-viewport intro loader
- `CosmicToast.tsx`, `CosmicStatus.tsx`, `CosmicTimestamp.tsx`, `CosmicIndicators.tsx`
- `InstallPrompt.tsx` (PWA)
- `ShareCardModal.tsx`

---

## 5. Flagship Pages (with current code excerpts)

### 5.1 Home (`src/app/page.tsx`)

Structure:
```
CinematicLoader → SignLabel → ConstellationOverlay → MagneticGlow → Navbar → CosmicStatus
<main>
  Hero
  ScrollFloat[0] → DailyHoroscope
  ScrollFloat[1] → CompatibilityChecker
  InfiniteMarquee (trust strip)
  ScrollFloat[2] → Features
  ScrollFloat[3] → HowItWorks
  ScrollFloat[4] → Testimonials
  ScrollFloat[5] → CosmicSelfie
  ScrollFloat[6] → Pricing
  ScrollFloat[7] → CTA
Footer
```
Every section scroll-floats in via index-staggered `ScrollFloat`. On zodiac activation the whole section column fades out to spotlight the cosmic reveal.

### 5.2 Card of the Day (`src/app/academy/card-of-the-day/page.tsx`) — FLAGSHIP

The veil reveal ceremony — full-viewport Three.js PBD cloth, hold-to-reveal, 7-second choreography. Complete breakdown in [01-veil-card-of-the-day.md](./01-veil-card-of-the-day.md).

Summary: daily-seeded tarot card (same for all users that day) → 3D cloth veil → user holds cursor/touch 1.3s → pins release, cloth falls → wipe shader reveals card with bloom + filmic grading → info panel slides in with meaning/advice/correspondences → "Draw Again" resets.

### 5.3 Pricing (`src/components/Pricing.tsx`)

Free vs VIP ($6.50/mo or $65/yr). Billing toggle, à la carte section with 5 one-time products ($1.95–$39.99). Full breakdown in [03-pricing-payments.md](./03-pricing-payments.md).

### 5.4 Hero (`src/components/Hero.tsx`)

- Stagger-revealed 4-word headline ("Written in Your Stars") via Web Animations API
- MM/DD birthday input → triggers 1200ms cosmic profile revelation choreography
- Zodiac sign pulls constellation in, sections fade, profile emerges
- Italic Cormorant at `clamp(2.9rem, 7.2vw, 6.8rem)`
- Editorial eyebrow · scrim-wrapped sub-copy · solid dark input + gold CTA + outline CTA · micro-trust counter row (12,400 readings · 4.9 ★ · 9 languages)

---

## 6. Interaction Patterns

### 6.1 The ritual feel
All primary actions go through a **ceremony**:
- Veil reveal ceremony (Card of the Day)
- Cosmic activation ceremony (Hero birthday)
- Page transitions with cosmic wipe curtain
- Oracle liquid-mask awakening

**Key rule**: Never jump-cut. Every state change has deliberate choreography, typically 500–2000ms, using `--ease-ritual` (0.16, 1, 0.3, 1).

### 6.2 Magnetic interactions
CTAs use `MagneticButton` — cursor attraction radius ~80px, scale transform 1→1.03, glow intensity on proximity. Combined with haptics on mobile (`lib/haptics.ts`).

### 6.3 Scroll-scrubbed motion
`ScrollFloat` wraps every major home section. Input: scroll progress within viewport. Output: opacity + translateY + blur. The `index` prop staggers timing.

### 6.4 Sound-coupled interactions
Magnetic button clicks emit `cosmos:chime` events. The `SoundEngine` routes these to `procedural-audio.ts` synths. Respects system mute + reduced-motion.

---

## 7. Accessibility

Built in from the start:

- **Skip link** → visible on focus, jumps to `#main-content`
- **Focus ring** — gold outline, 4px soft glow halo, ONLY on `:focus-visible` (not mouse clicks)
- **44px min touch targets** on mobile (`button, a, [role="button"]` below 640px)
- **Reduced motion** — all animations honor `prefers-reduced-motion: reduce`
- **Scrim utilities** — guarantee text contrast over the nebula background
- **Safe-area insets** on body padding (notched devices)
- **Semantic HTML** — proper headings, labels, ARIA (e.g. `aria-labelledby="home-hero-headline"`)
- **`::selection`** styled for brand consistency

**Open audit items**:
- Some gold-on-dark ratios sit at 4.2–4.4 : 1 — verify AA pass at all sizes
- Form error states: not every input has explicit error handling/feedback yet
- Some decorative SVGs still need `aria-hidden`

---

## 8. Responsive System

### Breakpoints
- **≤380px** (tiny phones) — scaled body font 0.9rem, reduced glass padding
- **≤640px** (mobile) — 44px touch targets, tighter scrollbar, 1rem section padding
- **≤767px** (portrait tablet) — bottom-nav padding offset
- **Default desktop** (768+) — full layout

### Fluid sizing
The design leans on `clamp()` for almost all typography and spacing:
```css
padding: clamp(6rem, 12vw, 9rem) clamp(1.25rem, 6vw, 6rem);
font-size: clamp(2.9rem, 7.2vw, 6.8rem);
```
Single source, zero breakpoint thrash.

### Touch states
```css
@media (hover: none) and (pointer: coarse) {
  button:active, a:active {
    opacity: 0.85;
    transform: scale(0.97);
    transition: transform 80ms ease, opacity 80ms ease;
  }
}
```

---

## 9. Build & Deployment

### Build config

**`next.config.ts`** — static export, trailing slashes (for Netlify), unoptimized images:
```ts
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};
```

**`netlify.toml`** — build, edge function, security headers:
```toml
[build]
  command = "npx next build"
  publish = "out"

[[edge_functions]]
  path = "/api/chat"
  function = "chat"

[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### PWA (`public/manifest.json`)
- `background_color`/`theme_color`: `#04020d`
- Display: `standalone`
- Orientation: `portrait-primary`
- Categories: lifestyle, entertainment
- **Note**: only favicon in icons array — full icon suite missing

### SEO (`src/app/layout.tsx`)
- OpenGraph + Twitter card configured
- `metadataBase: https://oliviaarcana.com`
- `theme-color: #060810` (note: doesn't match the `--c-void: #06041a` in CSS — inconsistency to resolve)
- `apple-mobile-web-app-status-bar-style: black-translucent`

---

## 10. What's Deployed vs What's Local

### Deployed (on `main`, auto-deploying to Netlify)
- Everything described above
- Veil reveal integrated on Card of the Day
- Stripe payments live
- Academy with 207 lessons
- All interaction systems

### Local / uncommitted
- **Sacred Symbols 3D rewrite** — 8 files using `3dsvg` library instead of custom Three.js. Cleaner implementation but not yet shipped. Files: `package.json`, `Symbol3D.tsx`, `SymbolElement.tsx`, `FloatingSymbolField.tsx`, `SectionDivider.tsx`, `index.ts`, `symbols-test/page.tsx`.

---

## 11. Known Issues to Review

Concrete things to look at when doing design review:

1. **Theme-color mismatch** — `layout.tsx` uses `#060810`, `manifest.json` uses `#04020d`, `globals.css` uses `#06041a`. Three "voids." Pick one.
2. **PWA icons** — manifest only references favicon; needs 192/512 PNG icons for install.
3. **Font import** — globals.css does `@import url('https://fonts.googleapis.com/...')` AND `next/font` loads the same fonts. Redundant; the Google Fonts `@import` is dead weight.
4. **Italic headline** — hero uses italic Cormorant at large sizes. Review rendering at various weights — kerning on italics can drift.
5. **Magnetic button radius** — may feel too grabby on mouse-only desktops. Consider tightening.
6. **Scrollbar** — 6px gold-ish thumb, may be too subtle on light sections (there are none currently, but if any light surfaces emerge).
7. **Cosmic cursor** — combined with magnetic buttons on a busy page, the cursor trail can feel over-caffeinated.
8. **`<style>` tag in Hero.tsx** — keyframes inlined per component. Fine for isolation, but audit for duplication across files.
9. **Many `style={{...}}` inline props** — heavy use of inline styles for one-off designs. Pro: self-contained. Con: no design-token enforcement. Consider extracting shared patterns to utility classes.
10. **Veil scene load time** — Three.js dynamic-imported, ~500KB chunk. Loading state exists but review the "Preparing your reading…" phrasing and timing.

---

## 12. How to Run Locally

```bash
cd /Users/macbookpro/olivia-arcana/website
npm install
npm run dev     # http://localhost:3000

# Static build (what Netlify runs)
npx next build  # outputs to ./out/

# Required env vars (.env.local)
NEXT_PUBLIC_API_URL=https://<railway-fastapi-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

---

## 13. Companion Handoff Docs

- [01 — Veil + Card of the Day](./01-veil-card-of-the-day.md) — 2,049 lines of Three.js cloth physics, shaders, choreography
- [02 — Full codebase overview](./02-full-codebase.md) — 29 pages, 95 components, 50 lib files
- [03 — Pricing & payments](./03-pricing-payments.md) — Stripe flows, tiers, paywall
- [04 — Evolution & roadmap](./04-evolution-roadmap.md) — 9-phase build history, vision, next steps

---

## 14. One-Paragraph Brand Summary (for design-AI context)

> **Olivia Arcana** is a premium mystical almanac that combines tarot, astrology, and AI oracle into a single editorial cosmic experience. The aesthetic is dark-mode only — a deep cosmic void (`#06041a`) layered with nebula gradients, glassmorphic cards, italic Cormorant Garamond display serifs, and a signature gold (`#D4AF37`) accent that shifts palette with the time of day. Every interaction is a small ceremony — nothing jump-cuts; motion uses a ritual easing curve (`cubic-bezier(0.16, 1, 0.3, 1)`) that feels deliberate and reverent. The flagship moment is the **veil reveal** on the Card of the Day page — a full-viewport Three.js PBD cloth that the user holds their cursor over for 1.3 seconds to physically lift, revealing a daily tarot card through a wipe shader with bloom and filmic color grading. The brand voice is *editorial cosmic almanac* — confident, slightly arcane, never campy. Typography is the workhorse: italic Cormorant for display, DM Sans for body, IBM Plex Mono for eyebrows and data. Interactions are physical (magnetic cursor attraction, cloth physics, scroll-scrubbed floats) and acoustic (procedural audio synthesis for whooshes and chimes).
