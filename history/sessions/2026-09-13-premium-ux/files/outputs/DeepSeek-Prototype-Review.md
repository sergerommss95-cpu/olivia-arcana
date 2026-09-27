# DeepSeek prototypes — independent review

15 September 2026 · Source inspection, deterministic checks and primary-source verification

Both prototypes contain useful directions. The tarot treats a card as a physical object with depth, a face, a back and a deliberate reveal. The sky separates the engraved map from a compact input form and actually uses the chosen observer. Those ideas can inform Olivia Arcana's studies. The supplied files are not ready to replace the working reading or birth-chart engines.

| Prototype | Concept potential, subjective | Production readiness, subjective | Reason |
|---|---:|---:|---|
| Living Tarot | 7/10 | 2/10 | A focused tactile concept, undermined by two core interaction bugs, decorative-only shuffling and missing reading contracts. |
| Celestial Atlas | 7/10 | 3/10 | A useful map/form composition and real spherical geometry, with invalid-date acceptance, catalog defects and incomplete epoch handling. |

These ratings assess the design direction expressed in the source and the implementation's completeness. They are not rendered-visual scores, user-test results, performance measurements or award predictions. This independent review did not operate a browser.

## Tarot: verified findings

**P0 — the animation clock is sampled twice.** At [tarot line 286](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:286), `getElapsedTime()` is followed immediately by `getDelta()`. The exact pinned Three.js r160 source shows that the first method already calls the second. Consequently, the interpolation receives the tiny interval between those calls, plus an arbitrary `.0001`, rather than the interval between frames. Camera drift and card movement therefore run on inconsistent clocks. Read delta once and maintain elapsed time from that sample; use frame-rate-independent damping. [Three.js r160 Clock source](https://raw.githubusercontent.com/mrdoob/three.js/r160/src/core/Clock.js)

**P0 — hovering cannot activate the advertised lift.** `pick()` returns a mesh at [line 247](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:247), but the comparison at [line 314](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:314) compares that mesh with `m.userData`, a different object. The same false comparison sets `u.hovered` at line 335. Compare `m === hovered`. Also note that the computed `ry` for hover/shuffle is discarded: line 328 replaces it with zero or π. Fixing the comparison alone will not restore the intended horizontal tilt.

**P1 — “Shuffle” does not change card identity or order.** [Lines 220–230](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:220) randomize temporary positions and rotations. The fan is then rebuilt using the same array index at [line 279](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:279). No deck permutation occurs. A production shuffle must operate on a seeded card order; the visual mixing should depict that state change without becoming the source of truth.

**P1 — a returned card can announce itself again.** The 380ms label timeout at [line 269](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:269) is not cancelled on return or shuffle. Draw, return immediately, then wait: the old callback can restore the drawn panel. Repeated shuffle clicks also leave 950ms callbacks that can prematurely finish the latest shuffle. Give each operation an owned timer/token and invalidate it on replacement, cancellation and teardown.

**P1 — the interaction depends on prior pointer movement.** The ray position updates only on `pointermove` at [line 238](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:238); clicking calls `pick()` without using the click coordinates at line 264. A tap without a preceding move can use the initial or stale ray. Update coordinates from the activation event, distinguish cancellation from selection, and provide named keyboard/tap controls. Only Shuffle is exposed as a DOM button; the cards and result have no equivalent keyboard selection or announced status.

**Scope gap, not a hidden implementation:** [lines 60–64](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:60) define 22 Major Arcana with generated text faces, and line 271 always says upright. There is no 78-card model, reversal state, multi-position spread, interpretation, sharing or persistence. The fixed camera only changes aspect on resize; it does not refit the fan for narrow screens. Continuous rendering has no reduced-motion, pause or teardown path. Retain these as study boundaries until the existing product contracts are connected.

One suspected issue is **not a bug**: the face/back material assignment matches Three.js r160's six BoxGeometry groups. Its +Z and −Z slots are correctly identified. [Prototype line 185](<LOCAL_HOME>/Downloads/deepseek_html_20260915_4edfd0.html:185), [Three.js r160 BoxGeometry source](https://raw.githubusercontent.com/mrdoob/three.js/r160/src/geometries/BoxGeometry.js)

## Sky: verified findings

**P0 — impossible dates produce a plausible map.** [The date calculation](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:121) accepts the supplied day directly. A deterministic evaluation gives the same Julian date, 2451666.0, for both 2000-04-31 12:00 and 2000-05-01 12:00. The map's caption nevertheless retains the invalid entered date. The `change` handlers at [line 322](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:322) also call drawing directly, bypassing submit-time constraints. Validate finite integer values and the full calendar date before calculation; keep the last valid result visible alongside an explicit error.

**P0 — the anonymous catalog has a duplicate and an unverified entry.** The array contains 63 rows but only 62 unique triples. `[12.900,55.960,1.77]` occurs at both [line 103](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:103) and [line 114](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:114). This position agrees with Alioth, whose SIMBAD J2000 coordinates are approximately 12.90049h, +55.95982°. Drawing it twice makes that point brighter. [SIMBAD: Alioth](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=ALIOTH)

The last row, `[16.486,+26.432,1.06]`, resembles a sign-flipped Antares entry. Antares is approximately 16.49013h, **−26.43200°**, agreeing with the earlier negative-declination row at line 98. The northern row cannot represent Antares. Its identity is not supplied, so a mistaken duplicate is an inference, not a confirmed identification. Remove it until a catalog identifier/source supports it. Give every retained star a stable identifier, coordinate frame, epoch and provenance. [SIMBAD: Antares](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Antares)

**P1 — fixed catalog coordinates are combined with a date-dependent sidereal angle.** The catalog is passed directly into `horizontal()` at [line 261](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:261), with no transformation from its J2000-like coordinates to the observation date. The 1800–2100 input range makes that omission material. Use one declared coordinate pipeline, such as J2000 vectors → `Rotation_EQJ_HOR` → horizontal coordinates, and state whether stellar proper motion and atmospheric refraction are included. Do not mix J2000 mean coordinates, coordinates of date and apparent sidereal time implicitly. Astronomy Engine explicitly distinguishes these frames and supplies their transforms. [Astronomy Engine coordinate documentation](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#coordinate-transforms)

**P1 — the viewing convention is unstated.** The projection at [line 165](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:165) and labels at line 222 put north at the top and east on the right. This is internally consistent as an overhead compass map. It is mirrored relative to the usual chart held overhead while looking up, where east lies left of north. Either explicitly label the overhead convention or reverse the horizontal projection and labels together for a look-up map. The stereographic radius formula itself is correct: zenith maps to the center and geometric horizon to the outer ring. [Sky & Telescope's chart-use guidance](https://skyandtelescope.org/astronomy-resources/using-a-map-at-the-telescope/)

**P1 — explanatory scope must match what is calculated.** The input explicitly requests UTC, so the lack of automatic timezone conversion is not itself a mathematical error. It is a product gap for people entering a local birth time; there is also no minute field or unknown-time path. This is a selected-time star/Sun map, not a natal chart with planets, houses and aspects. Daylight stars remain plotted as if on a night ground: label them as theoretical positions, or explain daylight visibility. The southern latitude caption also prints a signed negative number followed by “S” at [line 311](<LOCAL_HOME>/Downloads/deepseek_html_20260915_178c0e.html:311); display its absolute magnitude with the hemisphere.

## Ranked implementation punch-list

| Order | Change | Acceptance evidence |
|---|---|---|
| 1 | Repair tarot timing, identity comparison and cancellation | Hover visibly lifts the intended card; draw/return/shuffle races cannot restore stale state; equal elapsed time gives comparable movement at different frame cadences. |
| 2 | Validate sky dates and replace anonymous catalog defects | Impossible dates are rejected; catalog identifiers are unique; Alioth and Antares agree with the declared source/epoch. |
| 3 | Connect production data contracts | Real 78-card art/order/reversals and existing reading state survive; sky uses the established birth input and astronomy pipeline rather than replacing them with prototype formulas. |
| 4 | Make touch, keyboard and reduced motion complete paths | A first tap works without hovering; every card can be selected by named controls; results are announced; animation can stop without losing content. |
| 5 | Verify astronomy and orientation | Known fixtures at two epochs and both hemispheres agree with the chosen engine/frame; cardinal projection, horizon clipping and daytime labels match the stated convention. |
| 6 | Fit and profile the experience | At 320px, 390px and desktop widths all necessary controls/cards remain reachable; no unwanted scrolling lock, idle/offscreen animation or leaked GPU resources. Record actual device behavior before making smoothness claims. |

## Limits

The source checks establish specific faults, not every possible runtime outcome. No physical-device, screen-reader, external-network failure or full-catalog audit was performed. No frame-rate, conversion or accessibility-conformance score is asserted. External sources were retrieved on 15 September 2026; the Three.js verification uses the prototype's exact r160 tag. The two supplied HTML files and the product repository were not modified by this review.
