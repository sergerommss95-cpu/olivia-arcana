# Olivia Arcana — Full Site Audit

**Date:** 2026-04-17
**Scope:** Production site at https://oliviaarcana.com, source at `/Users/macbookpro/olivia-arcana/website`
**Method:** Live preview screenshots (desktop + mobile) + source code scan + frontend-design principle grid

---

## Anti-Patterns Verdict: **FAIL the AI-slop test**

Brutal honesty: if you showed this interface cold and said "AI made this," people would believe you immediately. It hits **at least 8 of the major AI-slop tells** from the frontend-design skill:

1. **Dark mode with glowing accents as default** — the entire site is `#06041a` + `#D4AF37 gold` + `#a07ae0 violet` glows. Zero commitment required — it just "looks cosmic."
2. **Purple-to-gold gradients everywhere** — both in backgrounds and as text (`.text-gold-gradient` utility literally exists in `globals.css:111`).
3. **Glassmorphism as default container** — `.glass-card` with `blur(18px) saturate(1.25)` is used as a universal wrapper (Navbar, zodiac cards, tool cards, course cards, form fields, daily grid…). It is the site's default layout primitive.
4. **Hero-metric template** — "12,400+ READINGS GIVEN · 4.9★ AVERAGE RATING · 97% ACCURACY RATING" on the home hero, and "14 COURSES · 207 LESSONS · 3 TRACKS · ~65 WEEKS" on the Academy hero.
5. **Identical card grids** — `/daily` has 12 identical purple zodiac cards in a 6×2 grid; `/academy` has 4 identical tool cards and identical 3-per-row course cards; `/signs/aries` has 6 identical "fact" cards (Element, Modality, Ruler, Season, Tarot Card, Crystal).
6. **Rounded icon + heading + text** cells used endlessly.
7. **Gradient text for emphasis** — `.text-gold-gradient` applied to metrics and headings.
8. **Generic font fallback** — `--font-body` is set to **Inter**, the single most-overused UI font of 2022–2025. (Cormorant Garamond for display IS distinctive — keep that.)

**It also has real assets that are genuinely good** — see Positive Findings.

---

## Executive Summary

- **Severity counts:** 7 critical, 14 high, 11 medium, 9 low = **41 issues**
- **Top 3 blockers:**
  1. Text contrast fails WCAG across the hero, signs hero, daily subtitles, academy subtitles (nebula busyness + low-opacity text)
  2. Identical-card-grid pattern on `/daily`, `/academy`, `/signs/[sign]` — template feel
  3. Hero is busy without being informative — the landing impression is "cosmic screensaver," not "what this product does"
- **Overall quality score:** **C+ (6/10)**. High-quality content + unique cosmic shader + i18n effort — squandered by generic layout templates and low-contrast styling.
- **Recommended next steps:** Skip cosmetic tweaks. Re-architect the home hero, kill `.glass-card` as default, commit to one strong aesthetic direction, and eliminate the identical-card-grid pattern everywhere it appears.

---

## Detailed Findings by Severity

### CRITICAL (7) — fix immediately

**C1. Hero headline unreadable on nebula**
- Location: `Hero.tsx` + all pages with nebula bg
- Impact: Text like "Personalised cosmic readings calculated from your exact planetary positions" is muted-lavender on a high-contrast chaotic nebula. Fails WCAG AA at 4.5:1.
- Fix: Add a solid translucent scrim under text (e.g. radial gradient mask), or use the nebula only as an atmospheric gradient, not a photo-realistic cosmic image.

**C2. "Enter your birthday" input nearly invisible on home**
- Location: `Hero.tsx` BirthDatePicker on landing
- Impact: The main conversion UI on the home page is a ghost. Users can't see where to type.
- Fix: Give the input a solid filled background (not glassmorphism).

**C3. Daily horoscope page has zero content on initial view**
- Location: `/daily`
- Impact: 12 identical zodiac cards appear with no default-selected sign. Subtitle "Select your sign above for today's preview" invisible against nebula. First-time user is confronted with a 12-tile grid and no direction.
- Fix: Auto-select user's sign if known (localStorage), or show today's "cosmic weather" as the default reveal. Make the grid secondary.

**C4. Identical-card grid on `/daily` (12 zodiac cards, 6×2)**
- Location: `DailyHoroscope.tsx`
- Impact: Textbook AI slop pattern. Adds zero hierarchy — all 12 signs equal visual weight.
- Fix: Use a wheel layout (zodiac actually IS a wheel), or reduce to 1 feature + 11 smaller secondaries.

**C5. Signs page hero — 6 identical "fact" cards**
- Location: `/signs/[sign]/page.tsx` — Element, Modality, Ruler, Season, Tarot Card, Crystal
- Impact: Hero metric template × 6. Feels like a Notion template.
- Fix: Integrate these facts into a typographic composition — a single editorial layout where each fact is styled distinctly, not as equal cells.

**C6. FilmGrain chromatic aberration is degrading readability everywhere**
- Location: `FilmGrain.tsx` mounted in `ClientShell.tsx`
- Impact: RGB splitting artifacts visible on all pages. Makes all text slightly unfocused. Hurts ~8 major pages at once.
- Fix: Dial it back — reduce `opacity` param (currently 0.03 — check intensity of chromatic effect), or disable the chromatic aberration pass entirely while keeping the grain.

**C7. Mobile home stats show "0+ / 0★"**
- Location: `AnimatedCounter.tsx` on mobile
- Impact: Animated counters don't fire or are initial-zero. The "social proof" numbers render as zero on first paint — looks broken.
- Fix: Hydrate with the final value as text, then animate. Don't start from 0 if the intersection observer misses the fire.

---

### HIGH (14)

**H1. Home hero has no single visual anchor**
- Impact: Eye has nowhere to land. The glowing nebula, tiny star glyph, tagline, form, CTAs, stats all compete.
- Fix: Commit to ONE hero subject. (Recommendation: replace "cosmic nebula + form" with an "enter your birth chart → see your live cosmic weather" inline preview that earns the full viewport.)

**H2. "14 COURSES · 207 LESSONS · 3 TRACKS · ~65 WEEKS" hero on `/academy`**
- Impact: Generic stat grid. Talks about scale ("207 LESSONS") not value ("find the meaning of your Saturn return").
- Fix: Lead with the user's first lesson or an interactive preview. Bury the counts in a footer.

**H3. 4 identical tool cards on Academy (Card of Day / Tarot Encyclopedia / Aspect Guide / Live Cosmos)**
- Impact: All 4 get same size despite very different value. The Card of Day is a daily ritual; the Encyclopedia is a reference lookup. Don't style them equally.
- Fix: Feature card (Card of Day) × 3 smaller utility tiles.

**H4. Identical course cards (3 per row, every course equally sized)**
- Impact: No progression cue. A beginner can't see which course to start with.
- Fix: "Start Here" badge, varying card sizes by track progression, or use a path/tree layout.

**H5. Navbar is the only navigation (no section-local nav, no breadcrumbs, no in-page TOC for long pages like `/signs/aries`)**
- Impact: User lands deep in content with no orientation.
- Fix: Add breadcrumbs on detail pages; add sticky section TOC on long pages.

**H6. No persistent state indicator (which sign am I? what's my current course?)**
- Impact: Every visit feels cold. The one thing the site knows about a user (birth date) is collected, then forgotten.
- Fix: After first birthday entry, show "Your Sun: ♈ Aries" chip in navbar. Personalize home greeting.

**H7. `useLocale` returns `"en"` on first render, then updates in effect → every i18n'd string flashes English**
- Location: `useLocale.ts` — `useState<Locale>("en")` then `useEffect(() => setLocale(detectLocale()))`
- Impact: On uk/ru/de/fr/… users, the initial render shows English, then re-renders. "Language flash" is ugly.
- Fix: Read from `localStorage` + `document.documentElement.lang` synchronously in initializer. Or wrap in `<Suspense>` + skeleton.

**H8. `<html lang="en">` hardcoded — screen readers + SEO treat all 9 locales as English**
- Location: `layout.tsx`
- Impact: Accessibility + search ranking damage.
- Fix: Client-side update `document.documentElement.lang = locale` in `useLocale` effect.

**H9. No focus-visible styles on most interactive elements**
- Impact: Keyboard users can't see where they are. Navbar links, zodiac cards, course cards, language switcher — all missing explicit `:focus-visible` rings.
- Fix: Global `:focus-visible` rule with a gold outline; per-component adjustments for contrast.

**H10. `/daily` headings overlap navbar**
- Location: `DailyHoroscope.tsx`
- Impact: "DAILY HOROSCOPE" label is clipped behind the fixed navbar on load.
- Fix: Add `scroll-margin-top` + consistent vertical rhythm with the navbar height.

**H11. Inter is the body font — AI-tier generic**
- Location: `globals.css:30` — `--font-body: "Inter", system-ui…`
- Impact: Body copy feels like every other SaaS.
- Fix: Pair Cormorant Garamond (keep) with a more distinctive sans — e.g. **Fraunces** (variable), **Söhne**, **Söhne Mono**, **GT America**, **Apercu**, or keep DM Sans (already imported) as the real body font.

**H12. Cosmic cursor + Lenis smooth scroll + film grain + page transitions all simultaneously active**
- Impact: Over-orchestrated. Combined with background three.js renderer, LCP + INP are heavy. On mid-tier mobile, frame budget is destroyed.
- Fix: Make cosmic cursor desktop-only (already is), film grain subtler, disable Lenis on `prefers-reduced-motion`.

**H13. `glass-card` overuse — visual rhythm is flat**
- Impact: The site has ONE container style. No variation = no hierarchy.
- Fix: Introduce 3 container archetypes (solid surface, glass, no-container) and use them by function (primary content / metadata / body prose).

**H14. No empty / loading / error states on any data-driven view**
- Location: `ChartPage`, `TransitTimeline`, `SynastryPage`, etc.
- Impact: First-time users see blank forms with no guidance.
- Fix: Teach the interface via empty states.

---

### MEDIUM (11)

**M1. Home stats rendered but always-on (not scroll-triggered)** — wasted animation budget
**M2. `InfiniteMarquee` mixes `animation` shorthand with `animationDirection` longhand** — React dev-mode warning (not production-critical)
**M3. Image optimization disabled** (`images: { unoptimized: true }` in next.config) — OK for static export but means no responsive images, no AVIF, no blur placeholders
**M4. No OG image / Twitter cards** — `layout.tsx` has basic metadata but no social share preview
**M5. No sitemap / robots.txt visible in `public/`**
**M6. Course cards show English subtitles on non-EN locales for some courses** (per your own handoff: zh.ts is a German copy)
**M7. `/chart`, `/transits` pages have data tables with no scroll affordance on mobile**
**M8. The `veil-reveal-v2.html` standalone isn't linked from the Academy tool card properly** — a standalone experience is the site's best moment but users won't find it
**M9. CosmicCursor may conflict with browser native focus styles on desktop**
**M10. No skip-to-content link — keyboard users have to tab through full nav every page**
**M11. The Cmd+K palette doesn't index the 78 tarot card detail anchors via `#card=<slug>`, but encyclopedia doesn't yet support hash → auto-open** — feature mismatch

---

### LOW (9)

**L1.** Redundant heading patterns — "Daily Horoscope" + subtitle + "Select your sign above for today's preview"
**L2.** Button chime plays on every click including navigation → fatigue
**L3.** Multiple tarot decks of card images inflates asset weight
**L4.** `symbols-test` page shipped to production (should be dev-only)
**L5.** Footer has no visual weight or brand recap
**L6.** No `prefers-reduced-transparency` fallback for glass
**L7.** Body uses `DM Sans`-weight-light that doesn't exist at some sizes
**L8.** `::selection` color uses `--color-warm-ivory` but should be a brand tint
**L9.** No theme-toggle (dark is permanent) — mild accessibility concern for light-sensitive users

---

## Patterns & Systemic Issues

- **The glass-card is doing too much.** It's used for navbar, content wrappers, cards, buttons, and modals. When everything is glass, nothing reads as important.
- **No container/layout variety.** The site has exactly one rhythm: full-width cosmic background + centered glass container. Every page feels like the same page.
- **The cosmic background is a crutch.** It creates the illusion of atmosphere but forces every foreground element to be either muted (illegible) or gold-glowing (AI-slop). A solid-ish hero surface on some sections would let the background breathe.
- **Animated counters + hero metrics + identical cards** is the exact combination of signals that say "AI template."
- **Hierarchy crisis.** Every page has a centered heading, an equal-weight grid, and a gold gradient accent. Pages don't feel different from each other.

---

## Positive Findings (don't throw these away)

1. **Editorial content is genuinely strong** — the `/signs/aries` overview ("the cosmic pioneer, the initiator, the spark that lights every fire") is proper copywriting, not AI filler.
2. **Three.js nebula shader is custom & distinctive** — don't kill it. Constrain it.
3. **i18n across 9 languages** — real competitive moat; no competitor does this.
4. **Veil Reveal V2 experience** — Apple-level bespoke interaction. Needs to become more central to the product.
5. **Cosmic time / live planetary hour / moon phase indicators** — genuine uniqueness, underused in UI.
6. **Sound design infrastructure** (SoundEngine + cosmos:chime event bus) — ready to amplify, underused.
7. **Custom CSS variable system** (`--c-void`, `--c-accent`, etc.) — scaffolding for a real design system exists.
8. **Cormorant Garamond** for display — distinctive, fits the mystical tone.
9. **The new Cmd+K palette** — the best-designed surface on the site right now.

---

## Recommendations by Priority

### Immediate (Wave 1–2, tonight)
1. **Kill the hero-metric template** on home and academy. Replace with a single strong proposition + inline live-cosmos preview.
2. **Add solid scrims / surfaces** under all body text on nebula pages so contrast passes AA.
3. **Eliminate the 12-card identical zodiac grid** on `/daily`. Replace with a zodiac wheel or a "today" card + signs as secondary.
4. **Lighten / remove the FilmGrain chromatic aberration.**
5. **Add `:focus-visible` global ring** for keyboard accessibility.
6. **Add skip-to-content link.**
7. **Fix the `useLocale` language flash** (synchronous initial read).
8. **Fix `<html lang>` to track locale.**
9. **Fix `/daily` heading collision with navbar.**
10. **Fix mobile home "0+ / 0★" counter race condition.**

### Short-term (Wave 3–4)
11. **Introduce container variety** (3 archetypes instead of 1).
12. **Redesign the Signs hero** — editorial layout, not 6 fact cards.
13. **Redesign Academy page** — 1 featured tool + 3 small utility tiles; 1 featured course + progression cues.
14. **Add a persistent user state chip** (current sun sign) in the navbar after first birthday entry.
15. **Add a breadcrumb + in-page TOC** on long detail pages.
16. **Add a streak / ritual mechanic** to `/daily` (returning-visitor reward).
17. **Time-of-day tint** — subtle palette shift based on user's hour.

### Medium-term (Wave 5–6)
18. **Mobile bottom nav** — thumb-reachable primary navigation.
19. **Performance pass** — defer Three.js nebula until after LCP; preload fonts; image CDN.
20. **Section-local search** (academy-scoped, sign-scoped) in addition to global Cmd+K.
21. **Social share cards with OG images** per sign / per card.
22. **Consolidated design tokens** — remove duplication between `@theme inline` and `:root`.

### Long-term
23. **A11y audit pass** — ARIA roles, keyboard traps, screen reader labels.
24. **Light-theme variant** (cosmic dawn palette).
25. **Service worker / PWA upgrade** — notifications for daily ritual.
26. **Arabic RTL support** (from prior handoff — still open).

---

## Suggested Commands to Execute the Fixes

- `/distill` — strip hero + academy landing to their essence (kills metric template + identical grids)
- `/normalize` — align spacing tokens + kill duplicate design tokens
- `/harden` — add focus-visible, skip link, error states, loading states
- `/adapt` — mobile layout pass (bottom nav, viewport fixes, thumb-reachable CTAs)
- `/optimize` — defer Three.js, preload fonts, reduce initial bundle, image strategy
- `/typeset` — replace Inter body, strengthen hierarchy
- `/colorize` — wake up monochrome muted lavender body text
- `/polish` — final detail pass
- `/critique` — self-review after each wave
- `/delight` — time-of-day theme, easter eggs, signature micro-moments
- `/onboard` — first-visit flow (birthday → sun sign → daily ritual)

---

*End of audit. Plan follows in IMPROVEMENT_PLAN.md.*
