# Handoff: Full Codebase Overview

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.2 |
| Runtime | React | 19.2.4 |
| 3D | Three.js | 0.183.2 |
| Animation | Framer Motion | 12.38.0 |
| Auth | Supabase | 2.102.1 |
| Payments | Stripe (via FastAPI backend) | — |
| Smooth scroll | Lenis | 1.3.21 |
| Styling | Tailwind CSS 4 + CSS custom properties | — |
| Deployment | Netlify (static export) | — |
| Backend API | FastAPI on Railway | — |

**Build mode**: `output: "export"` — fully static HTML/JS/CSS. No SSR, no API routes in Next.js. All API calls go to the FastAPI backend.

---

## Pages (29 routes)

### Core Experience
| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing — Hero, Features, HowItWorks, Testimonials, CTA, Pricing |
| `/daily` | `src/app/daily/page.tsx` | Daily horoscope by sign |
| `/oracle` | `src/app/oracle/page.tsx` | AI oracle with liquid mask canvas |
| `/ask` | `src/app/ask/page.tsx` | Chat with Olivia (AI) |
| `/chart` | `src/app/chart/page.tsx` | Natal birth chart calculator |
| `/cosmos` | `src/app/cosmos/page.tsx` | WebGL interactive star map |
| `/portrait` | `src/app/portrait/page.tsx` | Cosmic portrait generator |
| `/story` | `src/app/story/page.tsx` | Scrollytelling brand story page |

### Academy
| Route | File | Description |
|-------|------|-------------|
| `/academy` | `src/app/academy/page.tsx` | Course catalog (14 courses, 207 lessons) |
| `/academy/[course]` | `src/app/academy/[course]/page.tsx` | Individual course + lesson viewer |
| `/academy/card-of-the-day` | `src/app/academy/card-of-the-day/page.tsx` | Veil reveal ceremony |
| `/academy/tarot-encyclopedia` | `src/app/academy/tarot-encyclopedia/page.tsx` | 78-card reference |
| `/academy/aspect-guide` | `src/app/academy/aspect-guide/page.tsx` | Aspect interpretation guide |

### Astrology Tools
| Route | File | Description |
|-------|------|-------------|
| `/signs` | `src/app/signs/page.tsx` | Zodiac sign index |
| `/signs/[sign]` | `src/app/signs/[sign]/page.tsx` | Individual sign profile |
| `/synastry` | `src/app/synastry/page.tsx` | Relationship compatibility |
| `/transits` | `src/app/transits/page.tsx` | Current planetary transits |
| `/timing` | `src/app/timing/page.tsx` | Life timing engine |

### Auth & Payments
| Route | File | Description |
|-------|------|-------------|
| `/login` | `src/app/login/page.tsx` | Supabase email/password login |
| `/register` | `src/app/register/page.tsx` | Registration |
| `/onboarding` | `src/app/onboarding/page.tsx` | Post-registration birth data collection |
| `/profile` | `src/app/profile/page.tsx` | User profile |
| `/account/billing` | `src/app/account/billing/page.tsx` | Subscription management |
| `/checkout/success` | `src/app/checkout/success/page.tsx` | Post-payment success |
| `/checkout/cancel` | `src/app/checkout/cancel/page.tsx` | Payment canceled |

### Misc
| Route | File | Description |
|-------|------|-------------|
| `/journal` | `src/app/journal/page.tsx` | Reflection journal |
| `/oracle-letter` | `src/app/oracle-letter/page.tsx` | Weekly oracle letter |
| `/animated` | `src/app/animated/page.tsx` | Animation playground |
| `/symbols-test` | `src/app/symbols-test/page.tsx` | Sacred symbols dev test |

---

## Components (~95 files)

### Global Shell
- `ClientShell.tsx` — Wraps app with overlays (Starfield, CosmicCursor, SoundEngine, SmoothScroll, etc.)
- `Navbar.tsx` — Responsive nav with glassmorphism, mobile drawer
- `Footer.tsx` — Site footer with navigation links
- `GlobalBackground.tsx` — Void background color base

### Visual Effects
- `Starfield.tsx` — Canvas-based animated starfield background
- `CosmicCursor.tsx` — Custom cursor with trail particles
- `FilmGrain.tsx` — CSS film grain overlay
- `EclipseOverlay.tsx` — Eclipse animation for special dates
- `ConstellationOverlay.tsx` — SVG constellation patterns
- `CardAgeOverlay.tsx` — Aging/patina effect for tarot cards

### Interaction Systems (Awwwards-level)
- `MagneticButton.tsx` — Cursor-tracking glow, scale, press feedback
- `ScrollFloat.tsx` — Scroll-scrubbed micro-animations (opacity, translate, blur)
- `MagneticGlow.tsx` — Magnetic glow effect for elements
- `TiltCard.tsx` — 3D perspective tilt on hover
- `HorizontalScroll.tsx` — Horizontal scroll section
- `ParallaxSection.tsx` — Parallax scroll layers
- `MorphingText.tsx` — Text morphing animation
- `WhisperText.tsx` — Subtle text reveal
- `TextReveal.tsx` — Character-by-character text animation
- `SmoothReveal.tsx` / `SectionReveal.tsx` / `ScrollReveal.tsx` — Various scroll-triggered reveals
- `InfiniteMarquee.tsx` — Infinite horizontal text scroll
- `AnimatedCounter.tsx` — Number counting animation

### Page Transitions
- `transitions/PageTransition.tsx` — Orchestrated route change animations
- `transitions/TransitionLink.tsx` — Link that triggers transition before navigation
- `transitions/TransitionOverlay.tsx` — Cosmic wipe curtain

### Veil Reveal System (5 files)
See [01-veil-card-of-the-day.md](./01-veil-card-of-the-day.md)

### Sacred Symbols (3D)
- `sacred-symbols/Symbol3D.tsx` — Three.js extruded SVG symbols
- `sacred-symbols/SymbolElement.tsx` — Individual symbol wrapper
- `sacred-symbols/FloatingSymbolField.tsx` — Floating symbol particles
- `sacred-symbols/SectionDivider.tsx` — Decorative divider with 3D symbols
- `sacred-symbols/Symbol2DFallback.tsx` — SVG fallback when WebGL unavailable
- `sacred-symbols/paths/` — zodiac, celestial, mystical, sacred geometry SVG path data
- `sacred-symbols/materials/presets.ts` — Material presets (gold, silver, obsidian, etc.)

### Cosmos Engine (WebGL star map)
- `cosmos/engine/WebGLEngine.ts` — Core renderer
- `cosmos/engine/StarSystem.ts` — Procedural star generation
- `cosmos/engine/NebulaPlane.ts` — Nebula background
- `cosmos/engine/ShootingStars.ts` — Animated shooting stars
- `cosmos/engine/ZodiacGL.ts` + `zodiac-renderer.ts` — Zodiac constellation rendering
- `cosmos/engine/FlowmapSystem.ts` — Mouse-reactive flow distortion

### Oracle (AI Chat)
- `oracle/LiquidMaskCanvas.tsx` + `LiquidMaskEngine.ts` — WebGL liquid mask effect
- `oracle/OracleLoadingState.tsx` — Loading animation
- `oracle/OracleStaticFallback.tsx` — No-WebGL fallback

### Academy Interactive Widgets (8)
- `academy/ZodiacWheel.tsx` — Interactive zodiac wheel
- `academy/HouseWheel.tsx` — House system visualizer
- `academy/ElementMatrix.tsx` — Element/modality grid
- `academy/PlanetaryJourney.tsx` — Animated planet orbits
- `academy/AspectVisualizer.tsx` — Aspect angle visualizer
- `academy/FoolsJourneyMap.tsx` — Major Arcana narrative map
- `academy/TarotRevealCard.tsx` — Card flip/reveal for lessons
- `academy/SecretReveal.tsx` — Hidden content revealer

### Payments & Auth
- `Pricing.tsx` — Pricing tiers (Free / VIP)
- `CheckoutButton.tsx` — Stripe checkout trigger
- `Paywall.tsx` — VIP content gate
- `UpgradePrompt.tsx` — Inline upgrade nudge
- `VipBadge.tsx` — VIP status indicator

### Audio
- `SoundEngine.tsx` — Global sound system manager
- `AmbientSound.tsx` — Background ambient audio

---

## Library / Utilities (~50 files in `src/lib/`)

### Astrology Core
- `natal-chart.ts` — Birth chart computation (planet positions, houses, aspects)
- `planet-interpretations.ts` — 120 planet-in-sign interpretations + 10 planet meanings + 12 house meanings
- `sign-data.ts` — 12 zodiac sign profiles (~1500 words each)
- `transit-calculator.ts` — Current transit positions
- `synastry-engine.ts` — Relationship chart comparison
- `life-timing-engine.ts` — Predictive timing (profections, transits)
- `celestial.ts` + `celestial-sphere.ts` — Celestial coordinate math
- `zodiac-utils.ts` — Sign helpers (element, modality, ruler)
- `astro-events.ts` — Eclipse/retrograde/ingress calendar

### Academy Content Engine
- `academy/courses.ts` — 14 course definitions with 207 lessons
- `academy/tarot-cards.ts` — 78 tarot cards (name, arcana, suit, number, keywords, meanings)
- `academy/card-images.ts` — Card image path resolver
- `academy/content/index.ts` — `generateFullLessonContent()` entry point
- `academy/content/mapping.ts` — Slug-to-template resolver
- `academy/content/types.ts` — ContentSection union type
- `academy/content/templates/` — 8 template files generating content from data

### User & State
- `supabase.ts` — Supabase client init
- `user-store.ts` — User state management
- `payments.ts` — Stripe API client
- `chat-client.ts` + `chat-store.ts` — AI chat state
- `journal-store.ts` + `journal-prompts.ts` — Journal state + prompts
- `deck-memory.ts` — Tarot draw history (localStorage)
- `constellation-memory.ts` — Constellation interaction memory

### Audio & Effects
- `procedural-audio.ts` — Web Audio API synthesis utilities
- `zodiac-sounds.ts` — Sign-specific sound themes
- `haptics.ts` — Vibration API wrapper
- `eclipse-effects.ts` — Eclipse date detection + effects
- `cosmic-toasts.ts` — Notification system

### i18n
- `i18n/translations.ts` — Translation strings (EN default + i18n keys)
- `i18n/useLocale.ts` — Locale hook

---

## CSS Design System

### Custom Properties (defined in `globals.css`)
```css
--c-void: #04020d          /* base background */
--c-obsidian: #0c0a14      /* card backgrounds */
--c-celestial-gold: #d4af37
--c-warm-ivory: #f0ecff
--c-stardust: #c4b9e4
--font-heading: "Cormorant Garamond"
--font-body: "DM Sans"
--font-accent: "IBM Plex Mono"
```

### Visual Language
- **Glass morphism**: `backdrop-filter: blur(12px)` + `rgba(255,255,255,0.04)` backgrounds
- **Borders**: `1px solid rgba(200,185,255,0.08)`
- **Gradients**: Purple-to-gold radial gradients, never flat colors
- **Spacing**: Generous whitespace, `py-16 sm:py-32` sections
- **Typography**: Cormorant Garamond headings, DM Sans body, IBM Plex Mono accents
- **Border radius**: Cards `1.5rem`, buttons `999px` (pill), modals `1.5rem`

---

## Deployment

| Service | Purpose | Config |
|---------|---------|--------|
| Netlify | Static hosting | `netlify.toml`: build `npx next build`, publish `out` |
| Railway | FastAPI backend | Hosts `/api/payments/*`, `/api/chat/*` |
| Supabase | Auth + database | User accounts, subscription records |
| Stripe | Payments | Checkout sessions, subscriptions, webhooks |
| GitHub | Source | `olivia-arcana` repo, auto-deploy via Netlify GitHub App |

### Build
```bash
npx next build    # outputs to website/out/
```
Static export — no server needed. Edge function for `/api/chat` defined in `netlify.toml`.

---

## Environment Variables

```
NEXT_PUBLIC_API_URL          — FastAPI backend URL (Railway)
NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anonymous key
```

All secrets (Stripe keys, Supabase service role, etc.) live on the backend only.
