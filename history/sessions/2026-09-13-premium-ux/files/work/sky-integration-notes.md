# September 14 sky + atlas integration

The newer SESSION_2026-09-14.md implementation is preserved as the **Flattened Sky** signature: a still birth-sky dome, selectable planets, an eastern rising point, and a reversible sky-to-chart fold. It now reveals the actual upgraded NatalAtlas SVG. The calculation engine and stored birth-data contract are unchanged.

## Changes and before/after rationale

- **P0 — observed position was inferred from longitude alone.** The upstream dome passed each geocentric zodiac longitude to `eclipticToEquatorial`, discarding ecliptic latitude and the observer's parallax. It now independently calls Astronomy Engine `Observer → Equator(ofdate=true, aberration=true) → Horizon` for all ten planets. The Moon's parallax and each planet's true latitude therefore affect the dome. The astrology wheel continues to use the existing geocentric longitudes. UTC derives from the same saved wall time and offset. Observer elevation defaults to sea level, matching the available input data; atmospheric refraction is deliberately excluded and disclosed.
- **P0 — fold and finished wheel used incompatible scales.** Upstream drew its own clockwise 500-unit wheel and then mounted another SVG whose zodiac ring rotated independently. The dome now overlays the actual 520-unit NatalAtlas SVG. Every planet interpolates toward the same separated glyph label using `wheelAngle` and `separateLabels`; the real stationary SVG appears beneath it. No independently rotating zodiac or duplicate approximation remains. Exact anchor dots, house cusps and aspect endpoints retain the computed longitudes.
- **P1 — keyboard/cancel diverged.** Upstream ArrowRight could reach the end without calling its completion callback; pointercancel reused pointerup. A native range control replaces the custom slider. Button, keyboard/end, pointer completion, reduced-motion change and direct navigation share one guarded `land` path. Pointer cancellation restores its starting progress without completing the fold. Raising the sky reverses the same surface, so there is no mount handoff or diagram jump. The actual SVG becomes operable at completion; the same named planet buttons work throughout.
- **P1 — sky obscured the result's first screen on phone.** Three stacked signature rows became three compact readable columns. The sky comes before fold controls. Its square footprint remains fixed through the transformation; the caption and control regions reserve room. Controls remain at least 44px high; the named planet index remains available below.
- **P1 — misleading certainty.** Unknown-time results say local-noon illustration and omit the rising point. Existing no-houses/ASC/MC and Moon-ingress caveats remain. Below-horizon objects are numerically correct but are radially capped for the drawing and explicitly described as schematic. Day births state that stars are shown despite daylight. Aspect threads are described as astrological relationships. The Moon's icon shows phase, not sky orientation.
- **P2 — motion/performance.** Only a fold requests animation frames (780ms at full distance); resize/selection draw once, with no idle canvas loop. A reduced-motion preference change completes the active transition immediately. A canvas tap is ignored after a scrolling gesture. Canvas fonts use the resolved custom-property family instead of invalid CSS `var()` expressions in `context.font`.
- **P2 — Ukrainian entry and operating controls.** `/chart` now subscribes to the existing locale hook; its header, form copy, progress/error copy, signature labels, planet/sign labels, main navigation, sky instructions and controls respond to Ukrainian. The form's timezone caption now updates when copy changes without remounting or discarding entered values. The long interpretation corpus is still the existing English content; Ukrainian users see an explicit note above it. This is a remaining localization task, not a claim of full Ukrainian coverage.

## Source verification

Read the installed Astronomy Engine type documentation and its [primary JavaScript reference](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#equatorbody-date-observer-ofdate-aberration--equatorialcoordinates). `Equator` explicitly supplies topocentric positions with parallax and requires equator-of-date for `Horizon`. Catalog stars are rotated from J2000 to the date's true equator; their individual proper motions are not modeled. The ecliptic uses the library's true-ecliptic-to-equator rotation. These distinctions are disclosed in the atlas methodology.

## Verification

- TypeScript passes after integration and localization.
- Focused ESLint passes for all chart code and the new tests/copy module.
- **11 numerical tests pass:** six existing atlas geometry tests, including 2,000 crowded skies; five new tests cover sky cardinal directions, finite nadir capping, a J2000 London topocentric Sun/Moon fixture, independence from astrological longitudes, equivalent local-time offsets, unknown-time angle omission, and finite output for 1900/2000/2035 at northern, southern and polar latitudes.
- Existing real-engine SSR check passes for timed and Moon-ingress untimed results. Ten exact anchors, houses/angles only when timed, and the default Sun interpretation remain. Both chart objects remain unchanged after rendering.
- Root browser verification reported the dome at 390×844, London 2000-01-01 at noon: Sun 15.5° above the southern horizon; keyboard End exposes the true atlas; selected aspect and interpretation stay synchronized. Root is conducting the final production-build and post-compaction mobile checks.

## Remaining release work

- Full Ukrainian translation and editorial review of the existing interpretation corpus and methodology/accessibility prose; other locales continue their existing English fallback for this custom page.
- Manual VoiceOver and keyboard/touch cancellation coverage on real Safari/iOS; no screen-reader certification is claimed.
- Historical timezone/DST ambiguity engine fixtures remain a separate pre-existing correctness task. No calculation engine changes were made here.
- No production deploy was performed.
