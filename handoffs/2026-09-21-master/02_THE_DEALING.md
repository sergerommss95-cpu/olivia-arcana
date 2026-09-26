# The Dealing — Plate II's figure, dealt from the whole deck

*New, uncommitted. `src/components/almanac/TheDealing.tsx` (724 lines) +
`public/deck/majors-q80.webp` (319KB) + `scripts/build-deck-atlas.py`.*

---

## 1. The brief

Serhii supplied a ChatGPT/DeepSeek mockup (`olivia-arcana.html`, 1.5MB, ~620KB of
it inlined Three.js r160) and asked: **take the animation, fix it, put it in our
design, and place it in the card section after the hero rather than in the hero.**

The card section after the hero is `.plate-oracle` — the first plate, whose figure
was `SpreadTheater`: three CSS-3D cards that deal open, breathe, occasionally turn
one face, and dive to `/oracle` on click.

## 2. What the reference actually does — and where it breaks

A full recon pass read the mockup's animation code. Summary of the act: 22
Three.js card groups, six authored poses each, interpolated on
`poseTimes = [0, .16, .29, .45, .68, .91]` against a 7-key camera table, over a
`660svh` document with the canvas `fixed; inset: 0`.

Faults worth naming, because our version exists to fix them:

| Fault | Detail |
|---|---|
| **The resting frame is empty** | `glass = ramp(.75,.93,p)` drives opacity to `.038`. From p=.93 to 1 the deck is 22 ghosts at 4%. You scroll to the end and it has vanished. |
| **Velocity is zero at every key** | Smoothstep applied *per segment* to camera and every pose. The camera comes to a full stop at .16/.29/.45/.68/.91. It is six eased hops glued end to end, not a flight. |
| **The deck is a lie** | Only `i < 7` get relief geometry; labels are `titles[i % 7]`. *The Sun*, *The Moon*, *The Star* each appear 3–4 times in a "22 Major Arcana" deck. Cards 7–21 are blank porcelain. |
| **Guaranteed mid-scroll hitch** | `iridescence` assigned at runtime on materials constructed without it. In three.js `USE_IRIDESCENCE` is a compile-time define — 22 material clones all recompile on the first frame past p=.75. |
| **Reduced motion does nothing that matters** | `quiet` removes idle float, scroll smoothing and pointer parallax. The z +12 → −23 dolly with a travelling `lookAt` still runs at full amplitude — precisely the vestibular trigger the media query exists for. |
| **Mobile pops** | `c.visible = !(mobile && p>.33 && p<.73 && i>11)` hides 10 of 22 cards mid-flight and pops them back. Twice. |
| **The corridor** | The most-cloned WebGL scroll demo of the decade. |
| **Lockstep** | `c.rotateY(sin(elapsed*.17)*.035*glass)` — no per-card phase. 22 objects breathing on one clock read as a shader, not as objects. |
| **Art direction** | Warm olive/graphite ground, porcelain/platinum/sage materials, DM Sans labels, PMREM studio environment. None of it is ours. |

Worth **stealing**, and stolen: the stagger envelope that guarantees every card
lands exactly on its authored endpoint; frame-rate-corrected damping
(`1 - exp(-dt*k)`); and the instinct to flatten the celestial ring so it reads as a
drawn orbit rather than a ring of floating objects.

## 3. How the direction was chosen

Four art directions were written independently, then scored by three judges on
separate lenses (taste/anti-slop, buildability/performance, motion craft), harsh
scale, 5 = competent generic agency work.

| | taste | build | craft | **total** |
|---|---|---|---|---|
| **Concordance** | **8** | 7 | 7.5 | **22.5** |
| Restraint | 7 | **8** | 7 | 22 |
| Unbinding | 7 | 6 | **8** | 21 |
| Camera / corridor | 5.5 | 6 | 6.5 | 18 |

Camera was eliminated unanimously — it listed "the most-cloned WebGL scroll demo of
the decade" in its own fault list and then shipped it.

**Concordance won the concept. Restraint's structural spine was grafted onto it**,
because the build judge's objection was specific and correct: the other three all
bolt a second pinned, full-bleed, multi-thousand-pixel runway onto a 7,969-line
`page.tsx` and then invent machinery to survive `.oa-plate-clip`, `.oa-plate-in`'s
`scale(1.12)`, and the drift rig's per-frame `skewY`.

One further change was made against the taste judge's own criticism of the winner —
*"22 tarot cards arranged on a circle is the most stock image of the four."* The
ring is therefore **not** a flat wheel. It is the **ecliptic seen as a band from just
above its plane**, receding into the plate — the same low view the sky rooms take of
the horizon. This also makes it fit a 530×448 figure box, which a wheel never would.

## 4. The idea

> The plate opens on one squared block of twenty-two. As it crosses the reader, the
> block deals itself out along the ecliptic and every Major Arcanum takes the
> station its correspondence gives it. Then three leaves are drawn onto the table.

The spine is the site's own data. `MAJOR_ARCANA[].astrology` assigns every Major
Arcanum exactly one sign or one body, and **the set closes perfectly**: twelve signs
plus ten bodies is twenty-two, nothing repeated, nothing left over.

- The **twelve sign cards** stand at their house's mid-point — fixed stations.
- The **ten planet cards** stand at the ecliptic longitude that body actually holds
  tonight, from `getAllPositions(new Date())`.
- **A planet in retrograde lays its card down inverted.** The almanac's own notation,
  carried onto the table. This is the single detail the taste judge called
  jury-winning.
- The deal runs in **zodiacal order sweeping from 0° Aries**, not 0→21. The ring
  fills as the sky runs, not as the deck is numbered.

The figure is different tonight than it was last night, and no other deck can
borrow it.

### The beats

| `a` | beat | what happens |
|---|---|---|
| 0.00–0.12 | THE BLOCK | twenty-two squared into one deck, read on its edges |
| 0.12–0.58 | THE DEALING | zodiacal sweep; each leaf rises clear and settles on its station, turning face-up as it lands |
| 0.58–0.78 | THE PLATE | the band is complete and ruled; the mono chip names the date and the real datum |
| 0.78–1.00 | THE THREE | three leaves come off the band to PAST · NOW · NEXT, face down; the band thins into the ground |

`a` is driven by **the figure's own crossing of the viewport** and reaches 1 as the
plate centres — which is where a reader stops. **No pin, no added page height.**
This is the concession that made the build judge's objection moot.

## 5. Engineering

- **One WebGL1 context, one program, 22 painter-sorted quads, no depth buffer, no
  library.** `three` would have added ~700KB to a route that currently imports none
  of it.
- **The card back is drawn in the fragment shader**, not sampled — at the SVG's own
  130×225 coordinate space, matching `CardBackPlate` fleck for fleck (double ruled
  frame, four corner crosses, 8-ray compass, gilt core, the same 30 procedural
  flecks). Sharp at any distance, zero bytes.
- **Atlas**: 2048×2048 power-of-two so WebGL1 may mipmap it; 8×4 grid of 256×512
  cells, card in the top 256×439 at the deck's own 896:1536. **319KB for all 22.**
  Rebuild with `scripts/build-deck-atlas.py`.
- **Camera is one continuous move**, quintic-eased only at the two ends — the direct
  fix for the reference stopping dead at all five keys.
- **Depth is ink density, never alpha.** `mix(col, ABYSS, uDim)`. Nothing ever
  becomes a ghost; the resting frame is always a finished composition.
- **Per-leaf breath is phased by the station the leaf holds** (`st.lambda * 0.0175`),
  so the idle is organised by meaning rather than by index, and never lockstep.
- **Parks hard**: `visible() = inView && !document.hidden`, `raf = 0` as the first
  statement in `tick`, IntersectionObserver + `visibilitychange`.
- **Governor**: 8 heavy frames in 20 drops DPR one step, rather than limping for
  ~2.5s first as the reference does.
- **A real `<a href="/oracle">`** replaces `role="link" + tabIndex=0`, so cmd-click,
  middle-click and open-in-new-tab work. Plain left click still `preventDefault()`s
  into the dive transition.
- **Fallback**: no WebGL, or `prefers-reduced-motion`, returns the proven
  `<SpreadTheater>` DOM stage. Live-reactive to the media query.
- `#deal=0.62` hash pin for screenshot capture, matching the hero's `#p=` hook.

### Code map

| Lines | |
|---|---|
| 47–70 | `CONCORDANCE` — the 22 → 12 signs + 10 bodies table |
| 84–150 | maths; `viewM4` returns `fwd` so the sort reads view-space depth without a per-card matrix multiply |
| 152–166 | the band: `RING_R 4.35`, `RING_TILT 62°`, `station(λ)` |
| 178–255 | the fragment shader; 200–238 is the drawn card back |
| 287–320 | tonight's ephemeris → stations, deal order, the chip, the day's hand |
| 337–350 | `onScroll` — the runway, no pin |
| 371–470 | `paint` — camera, the four beats, the sort |
| 492–512 | `tick` — damping and the governor |
| 516–556 | `initialize` — program, atlas, mipmaps, anisotropy |
| 610–724 | markup + styled-jsx |

## 6. Status — honest

**Built, typechecks clean (`npx tsc --noEmit`), wired into `page.tsx`, not yet seen.**

The last capture run died `exit 137` (OOM — six reloads of a heavy page in one
Puppeteer process). `deal-states.mjs` has been rewritten to use one browser per
state at DPR 1.5. The browser pane cannot verify it either: it reports
`document.hidden === true`, so the loop correctly parks and paints nothing.

So the authored numbers are **unverified against pixels**: ring radius 4.35, tilt
62°, the beat windows, the hand's landing positions, the block's edge read, and
whether 530×448 is in fact enough room. Expect a tuning pass.

**Verify with:**
```bash
node deal-states.mjs 0.05 0.30 0.55 0.75 1
```

## 7. Grafts still owed

Named by the judges, not yet implemented:

- Open on **anticipation** — the three cards resting, squaring back into the block —
  rather than opening on the block itself.
- Paint **tonight's sky across the block's fore-edge** while it is squared (a real
  binder's trick; the block owns readable edges for ~0.13 of the act).
- **Animate the dive**: play the act backwards fast into its own first image, rather
  than inheriting a generic gather-and-lift.
- **Cut, don't crossfade** mono furniture — 90ms hard swap, rate-limited to one cut
  per ~110ms so a flick scroll skips labels instead of strobing them. *(The CSS does
  this already; the rate limit does not exist yet.)*
- **Solve the three final positions from the measured figure box every frame** so the
  projected landing matches the DOM labels exactly at any viewport.
- Compose the act's **exit into Plate IV** — leave the band at the orientation and
  relative scale of the wheel diagram below it.
- Park the page's **other** unparked rAF (`page.tsx:4372`).
- **Every beat must be a finished still**, as an acceptance criterion — a fast
  scroller may see only one frame.
