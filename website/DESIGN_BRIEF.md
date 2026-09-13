# Olivia Arcana — Design Brief for External Review

Site: **oliviaarcana.com** · Next.js 16 static export → Netlify · deck engine on Railway.
Purpose of this document: full context for a second-opinion design review. Goal: **upscale the visual design** toward awwwards-level while keeping the established system. Suggest concrete, implementable moves — not a rebrand.

---

## 1. The Idea

**Olivia Arcana is a "personal almanac"** — astrology + tarot presented as a serious antique instrument, not neon mysticism. Personal astrology and tarot readings shaped by birth chart, current transits, and the question you bring. Tagline register: *"Your stars, translated clearly. Clarity first. No noise."*

Brand metaphor that unites everything: **an engraved almanac plate, printed at night**. Every screen is a "leaf" of one edition. Real astronomy everywhere — nothing decorative is fake:
- The homepage sky chart plots the actual sky for the reader's hour.
- "Fig. 0" is a true sun/moon altitude-azimuth chart for a stated latitude (like printed almanacs: "calculated for 50°N", reader can set their own, clamped 23–66°N).
- The opening film's overlay draws the constellations actually overhead right now.
- 24 planetary hours are computed as true unequal hours from real sunrise.

**The rule of one hand:** engraved hairline + night glass + mono smallcaps labels + gilt used once per view. Signature stitch: 1px hairline with a centered ✦ diamond at act boundaries. If a component can't be built from these parts, it doesn't ship.

---

## 2. Design System (as implemented)

### 2.1 Palette — tokens (globals.css, verbatim)

```css
:root {
  /* Grounds — from the deepest night up to lit stone */
  --lg-abyss: #04060e;
  --lg-night: #080d1c;      /* page ground */
  --lg-deep: #0d1730;
  --lg-lapis: #16295c;
  --lg-lapis-lit: #1e3a7d;

  /* Light — cold accents + the ONE warm gilt from the carvings */
  --lg-azure: #4b84ff;
  --lg-halo: #6fe0ff;
  --lg-peri: #93a6ee;
  --lg-gilt: #e0b768;       /* the single accent, everywhere */
  --lg-ivory: #f2ece0;

  /* Type on glass */
  --lg-text: #eef2ff;
  --lg-text-soft: rgba(226, 234, 255, 0.78);
  --lg-text-faint: rgba(200, 214, 250, 0.6);

  --lg-ease: cubic-bezier(0.16, 1, 0.3, 1);   /* house ease, everywhere */
}
```

Shell aliases used in components: `--paper #080d1c`, `--ink #eef2ff`, `--ink-soft`, `--ink-faint`, `--hairline rgba(147,166,238,.2)`, `--ox #e0b768` (gilt type accent), `--ox-fill #4b84ff`.

**Accent discipline:** gilt `#e0b768` is the only warm color. Cold blues carry structure; gilt carries meaning (the sun's road, the current hour, CTAs, finials). A second warm hue is forbidden — "golden hour" on charts is expressed as *weight/glow of the same gilt*, not orange.

### 2.2 Type

- **Display:** Cormorant Garamond (serif, 500, often italic) — headlines, marginalia ("Altitude" rotated in margins), counsel lines.
- **Labels/numerals:** IBM Plex Mono — tracked smallcaps kickers (`letter-spacing .2–.42em`, uppercase), roman-numeral hours (VI…XXI), colophons, captions ("Fig. 0 — the night, drawn as it stands · 23:54").
- **Body:** DM Sans.
- Text over busy grounds gets engraver's halo: `paint-order: stroke` with paper-colored stroke (SVG), or layered dark text-shadow (HTML).

### 2.3 Surfaces — liquid glass (globals.css, verbatim recipe)

```css
--lg-tint: linear-gradient(158deg,
  rgba(147,166,238,.14) 0%, rgba(21,34,72,.34) 42%, rgba(6,10,22,.5) 100%);
--lg-blur: blur(26px) saturate(165%);
--lg-rim:  inset 0 1px 0 rgba(216,232,255,.24),
           inset 0 -1px 0 rgba(110,150,230,.09),
           inset 1px 0 0 rgba(216,232,255,.06),
           inset -1px 0 0 rgba(216,232,255,.06);
--lg-cast: 0 1.6rem 3.6rem rgba(2,4,10,.55);

.glass { background: var(--lg-tint); backdrop-filter: var(--lg-blur);
         box-shadow: var(--lg-rim), var(--lg-cast); border-radius: 18px; }
.glass::before { /* specular sweep at 118deg, rgba(214,232,255,.16) peak */ }
.glass::after  { /* refraction bloom: radial azure pooling at bottom edge */ }
.glass-thin    { /* lighter recipe for glass-on-glass, blur(14px) */ }
.glass-btn     { /* pill, blur(18px), rim-lit, rising light flood on hover */ }
```

Rule: a panel is either **glass** or **bare night** — nothing papery, no flat boxes, no plain borders. The user explicitly rejected "window-like frames"; acts sit ON the night with soft-edge masks, corner marks instead of boxes.

### 2.4 Iconography & ornament

- Engraved hairlines (0.4–1.5px), double rules, corner L-marks (two-weight).
- ✦ diamond as divider/finial. Astronomical glyphs (☉ ☽ ♄ ♃ ♂ ♀ ☿, ♈–♓) always with U+FE0E text-presentation (emoji rendering is a known trap).
- Cartouches: title between double gilt rules with diamond finials; small engraved sun at west end of rule, crescent at east.
- Figure numbering: "Frontispiece", "Fig. 0", "Fig. 1" + colophon rows (`☉ ♍ 3°42′ · ☽ 98% waxing · DAY 13h 27m · HOUR ♀ Venus · LAT 50° N · No. 241`).

### 2.5 Motion language

- House ease `cubic-bezier(0.16,1,0.3,1)`; ink-flood 460ms on buttons.
- **Scroll-driven, never autoplay.** All reveals ride a progress var with smoothstep bands:
  `--k: clamp(0,(var(--p) - var(--s))*speed,1); opacity: calc(k*k*(3-2k)*var(--o,1))`.
- Engraving order: rules → graduations → light → figures → type sets LAST.
- Perpetual motion is jewel-scale: sun corona rotates once/5min, stars twinkle on coprime periods, NOW cursor breathes.
- The opening pin's clock is a **native CSS scroll timeline** (compositor-owned, can't stall):

```css
@property --cp { syntax: "<number>"; inherits: true; initial-value: 0; }
@keyframes oa-cp-drive { from { --cp: 0 } to { --cp: 1 } }
@supports (animation-timeline: view()) {
  .front-pin { animation: oa-cp-drive linear both;
               animation-timeline: view(block);
               animation-range: contain 0% contain 100%; }
}
```
JS only seeks the video (`currentTime = p * duration`) and falls back to a damped rAF writer where unsupported.
- `prefers-reduced-motion`: everything still DRAWS (never `display:none` the content — that bug shipped once), motion stops, films hidden, plate complete.

---

## 3. Site Anatomy (homepage acts, in order)

1. **The Opening (one 340vh pin, three beats on one `--cp` clock):**
   - Beat 1 (0→.3): full-bleed **carved-sky film** — Seedream 5 Pro still in the deck's stele language (lapis stone wall, marble bas-relief Pegasus/Andromeda/Cassiopeia, hammered gold-leaf stars, crystalline milky-way vein, marble crescent), animated by Seedance 2.5 (5s, moonlight sweep, glinting stars). **Scroll scrubs the film** — static picture becomes motion at the hand's pace. Intro lines: "Begin with the sky." / "The deck carved it in stone. Scroll, and the stone wakes."
   - Beat 2 (.3→.55): film dissolves; **tonight's real constellations** rise as gilt hairlines over the stone (live-computed, honors user latitude).
   - Beat 3 (.55→1): the **hero lands and stays** — interactive live sky-chart canvas (CARTA COELI + SIGNA cartouches, gilt ecliptic with signs, sun marker), headline "YOUR STARS, TRANSLATED CLEARLY.", sub, "Clarity first. No noise.", CTAs (ASK THE ORACLE / DAILY CARD), DESCEND. Old "dive" drama (display lines parting, dawn flare) remapped to the last 28% as the exit.
2. **Fig. 0 — the day plate:** true alt/az chart of sun+moon tracks for stated latitude. Registers: cartouche title, real-sky constellations at night (fade at dusk), altitude graticule, compass, twilight strata (civil/nautical/astro, ruled+named), gilt sun road with roman hour stations, engraved 32-ray sun / opaque phase-true moon, rise/set stations with times, meridian, 24 unequal planetary-hours ledger (current cell gilt, NOW cursor breathing, pointer-sweep lights cells), colophon row. Daily-ritual layer: **pulse line** ("☉ sets in 1h 32m at WNW · ♀ the hour of Venus in 24m · the day shrinks 3m 48s"), **since-you-last-looked** memory line, **set-your-latitude** control, mood tints (is-golden/is-dusk/is-night), next-lunation countdown. Mobile gets its own composed plate, not a squash.
3. **Inscription** — "When were you born?" (localStorage only, "KEPT IN THIS BROWSER · NEVER SENT ANYWHERE").
4. **Plates I–III** — specimen cards/features; **Wheel** (zodiac ring, sun marker, season arc) — the WHERE view complementing Fig. 0's WHEN.
5. **Tariff** (pricing tiers: Free / Insight / Astronomer / Patron; paywall currently off — "open while the press is stopped" ribbons).

**Oracle room** (`/oracle`): night "dealing table". Ritual stages FOCUS → CALIBRATING → DRAWING → INTERPRETING. Spread chooser (3-card, Celtic Cross 10, Relationship 7, Year Ahead 12) with to-scale diagrams. Card fan with hover dock physics; picked cards fly to a **living shelf** (sized by picks-so-far, springs re-seat, count-aware spacing/scale per device tier); ring formation; flip reveal; full written reading (per-position passages, synthesis by majors/elements/reversals, counsel line). Card backs: lapis night, hairline double frame, corner marks, 8-ray rosette with gilt heart. Cards 136×225 (≈ deck art ratio 0.604).

**Deck**: 78 AI-generated stele cards (public/cards/) — shallow *rilievo schiacciato* marble relief on blue-cosmos lapis stone, gilt inlay details, full RWS symbol canon. This IS the brand's visual root; the site's whole language derives from it.

**Background**: live WebGPU "Northern Lights" shader (shaders.com preset: Swirl base + Aurora with violet/gilt rays + FilmGrain), CSS three-lobe aurora fallback. Sits behind everything; plates use a soft radial scrim + horizontal edge-fade masks to stay legible without boxes.

---

## 4. Key Code Patterns (excerpts)

### 4.1 Scroll-scrub film (ScrollCinema.tsx, condensed)

```tsx
// Layer inside the hero's pinned stage; pointer-events none; one clock.
const host = el.closest(".front-pin");
const hasTimeline = CSS.supports("animation-timeline: view()");
const loop = () => {
  raf = requestAnimationFrame(loop);
  const p = hasTimeline
    ? parseFloat(getComputedStyle(host).getPropertyValue("--cp")) || 0
    : dampedRectFallback();               // lerp .14 toward -top/span
  host.classList.toggle("is-done", p > 0.6);
  if (video.duration && video.readyState >= 2) {
    const t = p * (video.duration - 0.05);
    if (Math.abs(video.currentTime - t) > 0.02) video.currentTime = t;
  }
};
// IntersectionObserver gates start/stop; visibilitychange stops.
```

Bands (styled-jsx): film opacity 1→0 over `--cp` .28–.5; intro type in .02–.24, out by .34; live-sky overlay in .3, out .72; hero `.front` gated in at .38, lands 1 at .7 and holds.

### 4.2 Live sky projection (same math everywhere)

```ts
// lib/diurnal.ts — spherical astronomy on the site's own ephemeris
toEquatorial(eclipticLon, jd)  // → {ra, dec} via obliquity
horizontalAt(ra, dec, hourLocal, lat, lon, midnight)  // → {alt, az}
trackFor(body, date, lat, lon) // rise/transit/set/maxAlt/altitude-now
planetaryHours(date, sunrise, sunset) // 24 TRUE unequal hours, Chaldean rulers
upcomingEvents(...)            // pulse line: next sky events with countdowns
nextLunation(elongation)       // full/new moon in N days
dayLengthDelta(date, lat, lon) // "the day shrinks 3m 32s"
```
Verified against knowns: equinox 11.96h day, June solstice 16.1h @50°N, dec ±23.44°, weekday-ruler check for planetary hours. Only Sun+Moon are plotted — the ephemeris' planet longitudes (Mercury…Pluto) are known-inaccurate (heliocentric bug), so honesty forbids plotting them.

### 4.3 Smoothstep reveal contract (used by every plate register)

```css
.pan-fade {
  --k: clamp(0, (var(--p) - var(--s, 0)) * 5, 1);
  --e: calc(var(--k) * var(--k) * (3 - 2 * var(--k)));
  opacity: calc(var(--e) * var(--o, 1));
}
/* every element sets --s (its start) and --o (its resting weight) */
```
Gotcha encoded: max `--s` + 1/speed must be ≤ 1 or late registers never finish.

### 4.4 Signature SVG details

- `vector-effect: non-scaling-stroke` on hairlines/rects so rules survive any width.
- All computed coords rounded (`r1/r3`) — full-precision floats break React hydration.
- SVG text halos: `paint-order: stroke; stroke: var(--paper); stroke-width: 3`.

---

## 5. Asset Inventory

| Asset | Path | Notes |
|---|---|---|
| 78-card stele deck | `public/cards/*.webp` (+ `cards-portal/`) | 896×1536, Seedream 5 Pro, ~$4 total |
| Carved-sky film | `public/motion/sky-carved.mp4` | 5s 1536w, g=6 CRF23 (scrub-friendly), 4.2MB |
| Film poster | `public/motion/sky-carved-poster.jpg` | 1600w, 440KB |
| Aurora shader | `shaders` npm (WebGPU) preset | Swirl `#0b1329/#0c0f17` + Aurora `#8d54ff/#e0b768/#1122d9`, FilmGrain .1 |
| Star catalog | `src/lib/star-chart.ts` | 109 stars RA/dec/mag + constellation line indices |
| Fonts | Cormorant Garamond, IBM Plex Mono, DM Sans | next/font |

---

## 6. Work Log (condensed)

- Blue Hour palette → full **liquid-glass** conversion (all shells, buttons, date inputs).
- 78-card deck generated (prompt evolution: copper → letterpress → marble bas-relief → shallow rilievo → blue-cosmos → full RWS symbols), incorporated, deployed.
- Oracle: full ritual, generalized N-card spreads, card inspector (drag/zoom/pan), plan/entitlement model (paywall flag off), written readings engine (local, no LLM call).
- 54-agent UI/UX audit → 64 findings fixed; "frankenstein" unification pass (one ink, one gilt, one ease).
- Fig. 0: cartoon panorama → true astronomical plate → daily-ritual instrument (pulse/memory/latitude/mood) → majesty pass (real constellations in the vault, engraved corona, cartouche, ground hatch).
- Opening: reference-style scroll-film act, fused with hero into one 340vh pin, compositor-driven clock.
- Hard-won gotchas: styled-jsx doesn't scope `motion.*` or portal content; hidden panes freeze rAF/IO; turbopack can serve stale CSS chunks across restarts (`rm -rf .next`); sticky killed by a higher-specificity `position: relative`; framer sprung scale in `style` + `animate` scale = silent route death.

---

## 7. Where We Want the Upscale (questions for the reviewer)

Honest self-assessment — push on these:

1. **Coldness risk.** The system is disciplined but leans austere/technical. Where can warmth/wonder increase *without* a second accent hue or breaking "one hand"? (Texture? Light behavior? Micro-interactions?)
2. **Mid-page sag.** The opening act and Fig. 0 are the strongest screens; Inscription → Plates → Tariff feel comparatively ordinary. How to carry the "engraved instrument" energy through the commerce sections without gimmicks?
3. **Glass vs. engraving tension.** Two sub-languages coexist: iOS-like liquid glass panes and copperplate SVG engraving. They're bridged by palette/gilt, but is the bridge strong enough? Would you push one to dominate?
4. **Typography scale.** Display serif tops out ~3.9rem in the film act; hero uses letter-staggered slabs. Is the type system doing enough work? Where would bigger/smaller/weirder scale earn its place?
5. **Aurora background.** Live WebGPU aurora (violet+gilt) behind everything; CSS fallback is muddier. Does a busy living background undercut the engraved plates? Alternatives that keep "alive at night" feeling?
6. **The deck on the site.** 78 gorgeous card faces exist but appear mainly in the oracle. Where else should the stele art surface (backgrounds, section breaks, empty states) without wallpapering?
7. **Mobile.** Wide plates get purpose-built compact variants (Fig. 0) — but the opening film + hero pin on a phone: judge the pattern (300vh+ pins on mobile) honestly.
8. Anything that reads "AI-generated site" or generic dark-luxury template — name it and propose the fix.

**Constraints for any suggestion:** Next.js static export; no new runtime deps preferred (inline SVG + CSS + framer-motion + shaders lib already present); every visual claim data-honest (no fake astronomy); one gilt accent; reduced-motion parity; Ukrainian + English copy everywhere.
