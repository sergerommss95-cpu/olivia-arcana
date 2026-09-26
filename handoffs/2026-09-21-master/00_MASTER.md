# Olivia Arcana — Master Brief

*Assembled 2026-09-21. Supersedes the scattered `website/P*_REPORT.md` files for
orientation purposes; those remain as historical record.*

---

## 1. What this is

A premium astrology + tarot site whose entire design conceit is that it is **an
engraved almanac** — a bound, printed, dated volume — rather than an app with a
mystical skin.

That conceit is not decoration. It decides everything:

- Pages are **plates** with Roman numerals; illustrations are **figures** (`FIG. n`).
- Copy is set like print: ruled hairlines, margin inscriptions, mono caption chips,
  a colophon at the foot of the volume.
- Every room is dark. The almanac is printed on night, never on paper.
- The site's one genuinely unfakeable asset: **it computes the real sky**. Tonight's
  constellations over Kyiv, the live planetary longitudes, the retrogrades, the moon
  phase. Anything a competitor can copy by hiring an illustrator is not the moat;
  the ephemeris is.

Positioning: honest pricing against CHANI ($14M/yr persona engine), Co-Star
(notification voice + friend-chart loop), Nebula (predatory upsell). Native
Ukrainian-language wedge is the largest untapped edge — UA tarot market doubling
yearly, incumbents are RU-domain and avoided.

---

## 2. Stack and hard constraints

| | |
|---|---|
| Framework | **Next.js static export** — a breaking-change fork. `AGENTS.md` mandates reading `node_modules/next/dist/docs/` before writing code; APIs differ from training data. |
| Repo | `~/olivia-arcana/website` (site) · `~/olivia-arcana/backend` (FastAPI, **never deployed**) |
| Deploy | Netlify, auto-deploys on push to `main` |
| Dev | `preview_start "olivia-site"` → port 3300. **Never** run the dev server via Bash. |
| Astronomy | `astronomy-engine` — already in the home bundle via `lib/celestial.ts` |
| 3D | `three` is in `package.json` but **nothing on the home route imports it**. Adding it to `/` costs ~700KB. The hero and the card act are hand-rolled raw WebGL1 instead. |
| Also present | `gsap`, `framer-motion`, `lenis` (Lenis is live on `/` via `ClientShell`) |

### Standing rules
- **Commit and deploy only on explicit user word.** Never on initiative.
- Read a file before editing it. Validate before declaring done; paste the proof.
- No secrets in deliverable docs.
- Memory goes to `~/Desktop/SerhiiVault/brain/Olivia Arcana.md`, not to project files.

---

## 3. Design system

### Palette
| Token | Hex | Use |
|---|---|---|
| abyss | `#0a0d38` | the ground, everywhere |
| night | `#10134d` | panels, raised surfaces |
| moonstone | `#e8e9ff` | primary ink |
| mist | `#b7bce9` | secondary ink, captions |
| gilt | `#e0b768` | **the one site accent** — live / now / active only |
| hairline | `rgba(232,233,255,.16)` | every rule |

**Deck pigments** — carved ivory `#DACEB8`, deck gilt `#D6B276`, lapis near-black —
are sampled from the card artwork and are **for artwork only**. They are never UI.
The one sanctioned exception is `/studies`, which is deliberately printed in deck
pigment (see §4).

**Rule: no light grounds anywhere.** Ivory is a pigment for figures and type, never
a wall. This was settled by tournament after two rejected attempts (beige, then
ivory grounds).

### Type
Cormorant (display) + IBM Plex Mono (chips, captions, numerals).

### Motion
- Ease: `--ease-engrave: cubic-bezier(0.625, 0.05, 0, 1)`
- Plate reveal: `--dur-plate: 1.15s`, clip-path wipe from the lower edge + a 1.12 → 1.0 settle
- Interior plates ink in at ~950ms. **The dolly belongs to the hero and never leaves it.**

---

## 4. The Edition System

The connective contract that makes the site read as one bound volume rather than a
set of pages. Two-tier print spine:

**Plates** (Roman, one per route)

| | |
|---|---|
| I | The Tide Opens — `/` (hero) |
| II | The Dealing Table — `/oracle` |
| III | Today's Leaf — `/daily` |
| IV | The Wheel of Houses — `/chart` |
| V | The Reading Room — `/academy` |
| VI | A Worked Reading — `/sample` |
| VII | The Tariff — `/pricing` |

Homepage sections borrow the numeral of the plate they preview. Painted breaks are
unnumbered interludes.

**Figures** — Arabic `FIG. n`, restarting inside each plate.

**Furniture kit:** a `PlateFrame` component (double hairline at .26/.11 opacity,
corner chips, margin inscription, seats the SKY ATLAS chip); one caption-chip voice;
exactly two rules (double hairline, single .26 — dashed means *awaiting*);
`.cta-pill` (gilt hairline pill, ink-flood on hover).

**Sky signature** recurs in exactly four rooms: hero, the oracle void, the chart's
awaiting state, and `/daily` FIG. 1.

Ranks 1 (the spine) and 3 (gilt discipline) are implemented. Ranks 2 and 4–12 are
queued — see `03_STATE_AND_NEXT.md`.

---

## 5. Known gotchas — read before debugging

1. **A cache-first service worker must never touch a dev origin.** `sw.js` serves
   `/_next/static/` cache-first forever. Correct in production (content-hashed
   filenames), fatal in dev, where Turbopack keeps chunk paths identical across
   edits. The browser then hydrates hours-old JS against fresh SSR HTML, which
   presents *exactly* as a float-precision hydration bug and is not one.
   Diagnostic that cracks it: `curl` the chunk from the dev server and `fetch()`
   the same URL in-page — differing byte counts prove the SW. Fixed: `InstallPrompt`
   registers only when `NODE_ENV === "production"` and self-heals poisoned dev
   browsers. **Check `navigator.serviceWorker.getRegistrations()` before suspecting
   the math.**
2. **Server and browser libm differ by ~1 ULP on trig.** SVG coordinates computed
   from astronomy must be quantized at the source. Use `Math.trunc(v * 1e6) / 1e6`,
   not `Math.round` — rounding can push a capped projection radius past its cap.
   See `components/chart/flattened-sky-geometry.ts`.
3. **A hash-only navigation does not re-run React effects.** Any `#p=` / `#deal=`
   screenshot pin needs a full `page.reload()` in the capture script.
4. **The browser pane reports `document.hidden === true`.** Correctly-parked render
   loops therefore paint nothing there. Verify canvases with headless Puppeteer
   (`/Users/macbookpro/node_modules/puppeteer/...`, `headless:'new'`,
   `--use-gl=angle`), one browser per state — six reloads of `/` in one process
   gets OOM-killed (exit 137).
5. **`.plate-figure` is rotated and skewed every frame** by the page's drift rig, and
   `.oa-plate-clip` hard-clips its descendants. Size a canvas from
   `offsetWidth/offsetHeight`, never from `getBoundingClientRect()`, and never let a
   canvas bleed outside that figure.
6. **Three unparked rAF loops already run on `/`** — Lenis in `ClientShell`, the
   drift rig in `page.tsx` (a `getBoundingClientRect()` per `[data-drift]` element,
   every frame, forever), and the hero. Anything new must park hard on an
   IntersectionObserver plus `visibilitychange`.
7. Per-cell hash erosion in a shader produces axis-aligned rectangular confetti.
   Use smooth value noise.
8. Lossy WebP mattes leak through aperture math — encode masks lossless and threshold
   in the shader.
