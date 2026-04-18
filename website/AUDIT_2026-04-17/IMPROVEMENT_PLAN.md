# Olivia Arcana — Improvement Plan (7-hour overnight overhaul)

Guiding principle: **move the site from "another cosmic SaaS" to "the editorial cosmic almanac with a real-time celestial engine and a beautifully bespoke feel."**

Not "more features." Fewer but better. Kill the templates, earn the visual weight, respect the content.

## Aesthetic direction (committed)
- **Editorial mystical almanac.** Think: *The New Yorker* × a 1920s astrology annual × Apple restraint.
- Dominant neutral: deep indigo `#0c0a1f`. Signature accent: a *single* warm gold used surgically. Secondary: a cool slate `#7B68EE`. Body text in warm ivory `#F5F0E8` with aggressive contrast.
- Display: **Cormorant Garamond** (keep). Body: **DM Sans** (already loaded — swap Inter out). Accent: small-caps gold for labels.
- Less glass, more solid surfaces. Use glass only as a selective gesture (e.g. the palette, the veil reveal), not as default.
- Layouts left-aligned asymmetric, not centered everywhere.
- Hero-metric template is banned.
- Identical card grid is banned. Use varied card sizes / treatments / single-hero + secondary.

## Wave-by-wave plan

### Wave 1 — A11y + readability foundation (~45 min)
Goal: fix blocking readability + a11y before touching any design.

1. Global `:focus-visible` ring tokens in `globals.css`
2. Skip-to-main-content link in `layout.tsx`
3. `useLocale` synchronous initial read (kill language flash)
4. `document.documentElement.lang = locale` on locale change (SEO + a11y)
5. `AnimatedCounter` — render final value immediately; animate only when visible; never render 0
6. Reduce `FilmGrain` intensity and remove chromatic aberration
7. Add `--c-scrim` token for text-over-background use-cases
8. Fix `/daily` heading clipping under navbar via `scroll-margin-top` + consistent page top offset
9. Replace `Inter` with `DM Sans` (already imported) as `--font-body`
10. Add `aria-live="polite"` on the dynamic horoscope sections

### Wave 2 — Design rhythm (~90 min)
Goal: kill the template, earn visual identity.

1. New `<Surface>` component with 3 variants: `solid`, `veil` (glass), `bare`. Use it everywhere `.glass-card` is used. Then update the most visible pages first.
2. Home hero redesign: left-aligned editorial headline, smaller nebula presence, primary CTA with stronger affordance, birthday input as a FILLED control not ghost.
3. Academy page redesign: hero without the 4-stat grid; featured "Card of the Day" tile + 3 smaller; featured course ("Start Here — The Cosmic Alphabet") + progression strip.
4. Signs hero redesign: editorial typographic composition — sign name XL serif, dates micro-cap, motto as pull quote, facts inline in a sentence instead of card grid.
5. Daily redesign: today card (live cosmic weather) as centerpiece; 12 signs condense to a compact horizontal scroller (zodiac wheel view as bonus).
6. Remove `.text-gold-gradient` usage from all prose. Keep for single signature moment per page.

### Wave 3 — Engagement + personalization (~60 min)
Goal: make the site remember you.

1. `UserContext` → sun sign stored in localStorage after first birthday entry.
2. Navbar chip: "Your sign: ♈ Aries" (linked to /signs/aries)
3. Home greeting: "Tuesday morning, Aries" (time-of-day aware)
4. `/daily` streak mechanic: consecutive days visited → subtle "🔥 3-day ritual" badge
5. Breadcrumbs on `/signs/[sign]`, `/academy/[course]`, `/academy/[course]/[lesson]`
6. In-page TOC on long detail pages
7. Share-card generation for Card-of-the-Day (static OG image template)

### Wave 4 — Signature creativity (~75 min)
Goal: add the "wow, how was this made?" moment that isn't a shader.

1. **Time-of-day palette** — slightly shift accent + background from dawn (amber) → day (ivory) → dusk (violet) → night (deep indigo). Based on user local hour, persisted across session.
2. **Zodiac wheel** — a canvas/svg wheel view as the primary `/daily` navigator. Click a sector → that sign's horoscope.
3. **Editorial signs hero** — replace card grid with a typographic poster (one line per fact, oversized glyph as background).
4. **Page transitions refined** — one cohesive "veil wipe" transition between pages (not just fade).
5. **Cosmos cursor enhancement** — adds a faint star trail when moving, constellates when idle.

### Wave 5 — Performance (~45 min)
Goal: first paint under 1.5s, interaction under 100ms.

1. Defer `GlobalBackground` (Three.js nebula) until after hero render (`requestIdleCallback` + `<Suspense>` boundary)
2. Preload Cormorant Garamond + DM Sans
3. Code-split heavy academy widgets (already lazy — verify)
4. Static OG images (generate once at build)
5. Decommission `symbols-test` page from production
6. Audit InfiniteMarquee animationDirection warning

### Wave 6 — Mobile (~45 min)
Goal: the site feels *designed* for mobile, not shrunk.

1. **Bottom nav** (4 icons: Home, Daily, Academy, Profile) for thumb-reach.
2. Hero input (birthday) becomes solid + larger tap target.
3. Horizontal scroller for 12 signs on `/daily` mobile (not 3×4 cramped grid).
4. Safe-area padding verified everywhere.
5. Reduce heavy animations on mobile.

### Final — critique + deploy (~45 min)
1. Run `/critique` skill against the home + daily + signs + academy pages.
2. Apply fast fixes from critique.
3. `next build`.
4. Commit + push + netlify deploy.
5. Smoke test production.
6. Write SESSION_HANDOFF_2026-04-17.md.

---

## Quality gates
- Every wave: verify in local preview + screenshot.
- Never ship a wave that breaks `next build`.
- Every commit message is feature-clear.
- Deploy after Wave 3 as a mid-point safety net, then final after Wave 6.
