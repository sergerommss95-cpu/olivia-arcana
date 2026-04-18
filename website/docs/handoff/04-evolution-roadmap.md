# Handoff: Site Evolution & Future Roadmap

## Project Identity

**Olivia Arcana** — A premium mystical brand combining tarot, astrology, and AI. The website is the central product: a Next.js 16 static-export app that feels like an Awwwards submission meets a spiritual sanctuary. Dark-mode only, glassmorphic UI, procedural audio, Three.js 3D scenes, and AI-powered oracle chat.

---

## Evolution Timeline (git history)

### Phase 1 — Foundation
- Core Next.js 16 app with static export
- Basic page structure: home, daily horoscope, zodiac signs
- Supabase auth (login, register, onboarding)
- CSS design system: void background, glassmorphism, Cormorant Garamond typography
- Starfield background, basic section animations

### Phase 2 — Astrology Engine
- `natal-chart.ts` — Full birth chart computation
- `planet-interpretations.ts` — 120 planet-in-sign readings
- `sign-data.ts` — 12 zodiac profiles (~1500 words each)
- `transit-calculator.ts` — Current planetary transits
- `synastry-engine.ts` — Relationship compatibility
- `life-timing-engine.ts` — Profections + transit timing
- Chart, synastry, timing, transits pages

### Phase 3 — Academy & Content
- 14 courses with 207 lessons (`courses.ts`)
- 78 tarot cards with full data (`tarot-cards.ts`)
- Content engine: `generateFullLessonContent()` with 8 template types
- 6,600 lines of educational content across templates
- Tarot encyclopedia, aspect guide
- 8 interactive widgets (ZodiacWheel, HouseWheel, ElementMatrix, etc.)

### Phase 4 — AI & Oracle
- `/oracle` page with liquid mask WebGL effect
- `/ask` chat page with AI conversation
- `chat-client.ts` + `chat-store.ts` for conversation state
- Backend AI endpoint on FastAPI
- Edge function for `/api/chat` on Netlify

### Phase 5 — Payments & Monetization
- Stripe integration via FastAPI backend
- Free/VIP tiers ($6.50/mo, $65/yr)
- 5 à la carte products ($1.95 – $39.99)
- Checkout flow, billing management, customer portal
- Paywall component for gating premium content

### Phase 6 — Awwwards-Level Interactions
- **11 new interaction components** in a single session:
  - MagneticButton, ScrollFloat, TransitionLink, TransitionOverlay, PageTransition
  - MagneticGlow, TiltCard, HorizontalScroll, ParallaxSection
  - MorphingText, WhisperText
- CosmicCursor (custom cursor with particle trail)
- SoundEngine + AmbientSound (spatial audio system)
- FilmGrain overlay
- `/story` scrollytelling page
- Wired interactions into all CTA buttons, nav, hero, cards

### Phase 7 — Three.js Spectacles
- **Veil Reveal System** (1,926 lines) — PBD cloth physics, 4 GLSL shaders, hold-to-reveal ceremony
- **Cosmos Engine** — WebGL star map with flowmap, shooting stars, nebula, zodiac constellations
- **Sacred Symbols** — 3D extruded SVG zodiac/mystical symbols with metallic materials
- Oracle liquid mask WebGL effect

### Phase 8 — Mobile & Polish
- Mobile responsiveness across all components
- Touch interactions for veil (touch-hold)
- PWA install prompt (`InstallPrompt.tsx`)
- Eclipse overlay for special dates
- Constellation memory system
- i18n framework with useLocale hook

### Phase 9 — Deployment Pipeline
- Netlify connected via GitHub App for auto-deploy
- Build: `npx next build` → static `out/` directory
- FastAPI backend on Railway
- Fixed turbopack.root build error for Netlify

---

## Current State (as of April 2026)

### Deployed & Working
- All 29 pages building and deployed
- Veil reveal ceremony on Card of the Day
- Full academy with 207 lessons and content engine
- Stripe payments (subscriptions + one-time purchases)
- Supabase auth
- All interaction systems (magnetic, scroll, transitions)
- Cosmos WebGL star map
- Auto-deploy from GitHub push

### Uncommitted / In Progress
- **Sacred Symbols 3D rewrite** — 8 files using `3dsvg` library instead of custom Three.js. Files exist locally but not committed:
  - `package.json` (added `3dsvg` dependency)
  - `Symbol3D.tsx` (rewritten to use 3dsvg)
  - `SymbolElement.tsx`, `FloatingSymbolField.tsx`, `SectionDivider.tsx`, `index.ts`
  - `symbols-test/page.tsx` (test page)

---

## Roadmap / Vision

### Near-Term
1. **Commit sacred symbols rewrite** — The `3dsvg` library version is cleaner than the custom Three.js version. Needs testing and commit.
2. **Content completeness** — Some lessons may still fall through to generic content. Audit all 207 lessons.
3. **Image assets** — Tarot card images: `getCardImagePath()` returns paths but actual image files need to be present in `public/`.
4. **Backend hardening** — Rate limiting, webhook signature verification, error handling on Railway.
5. **SEO** — Meta tags, Open Graph images, structured data for each page.

### Medium-Term
6. **Video readings** — The $39.99 "Video Reading" product exists in pricing but needs fulfillment pipeline.
7. **Push notifications** — Transit alerts for VIP users (daily planet movements affecting their chart).
8. **Social sharing** — `ShareCardModal.tsx` exists but needs polish. Share Card of the Day to social.
9. **Deck memory visualization** — `DeckStats.tsx` component exists. Show which cards appear most in readings.
10. **Journal AI** — AI-powered journal prompt responses tied to current transits.

### Long-Term (North Star)
11. **Olivia Social Pipeline** — Daily automated TikTok/IG/YouTube content generation.
12. **Full tarot deck artwork** — 78 custom cards via Flux 2 Pro pipeline.
13. **Mobile app** — React Native wrapper or PWA enhancement.
14. **Community features** — User profiles, shared readings, discussion forums.
15. **Seasonal ceremonies** — Special interactive experiences for solstices, eclipses, retrogrades.

---

## Architecture Principles

1. **Static-first** — Everything that can be pre-rendered is. Dynamic data comes from the FastAPI backend.
2. **Progressive enhancement** — WebGL features (veil, cosmos, symbols) have fallbacks. Core content works without JS.
3. **Client-side compute** — Natal charts, transits, synastry calculated in-browser. No backend needed for astrology math.
4. **Cinematic feel** — Every interaction should feel like a film moment. Framer Motion for UI, Three.js for spectacle, procedural audio for immersion.
5. **Data-driven content** — Academy lessons generated from structured data (sign profiles, planet meanings, card data), not handwritten prose for each lesson.

---

## Key Files for Any New Session

If you're picking this up fresh, read these first:

```
src/app/page.tsx                          — Homepage structure
src/app/layout.tsx                        — Root layout + font loading
src/components/ClientShell.tsx            — Global overlay wrapper
src/lib/academy/courses.ts               — Course/lesson definitions
src/lib/academy/tarot-cards.ts           — Card data
src/lib/payments.ts                       — Payment API
src/hooks/useSubscription.tsx             — Subscription state
netlify.toml                              — Deploy config
next.config.ts                            — Build config
```

For the veil system specifically, see [01-veil-card-of-the-day.md](./01-veil-card-of-the-day.md).
For payments details, see [03-pricing-payments.md](./03-pricing-payments.md).
