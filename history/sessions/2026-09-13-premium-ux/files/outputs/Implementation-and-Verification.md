# Olivia Arcana — implementation and verification

14 September 2026

## Reviewable result

- Branch: `codex/premium-atlas`
- Final local commit: `87e257d`
- September 14 upstream: `7ba2cfa`
- Prior local checkpoint: `ff140dc`
- Repository: `sergerommss95-cpu/olivia-arcana`
- Changes versus upstream: 47 files changed, 3125 insertions(+), 11242 deletions(-) (the patch is authoritative).
- No push or deployment was performed. The working tree was clean after committing.

Local preview: [Open Olivia Arcana](http://127.0.0.1:3002/). This is the static production export, served on this computer. It is available while the local preview process is running.

## 14 September 2026 correction — Arrival restored

At the user's request, Olivia's zooming approach and levitation over the water again advance with normal scrolling by default. The stage fills the viewport, and the original pacing is restored: 3.2 viewports on desktop and 2.5 on mobile. Direct Tarot and Birth Chart actions remain available immediately; the assisted ride is an additional control. Static artwork and working actions remain available with reduced motion or unavailable WebGL.

The assisted ride now uses the scene's document position rather than an offset relative to its wrapper. Pausing or hiding the tab cancels the ride, preventing a jump when returning. The production build passes after this correction. Desktop normal scrolling was visually verified at 1280×720: the canvas fills the viewport and Olivia visibly approaches over the water (observed sequence progress 0.2381). Mobile normal scrolling was also visually verified at an actual 390×844 viewport: Olivia enlarged over the water at progress 0.3009, with no horizontal overflow. The heading and both direct actions remained visible on the initial screen. Desktop chapter navigation reached progress 0.4199; pausing and returning to the top restored progress 0.0000; Skip focused the readings section. The production export and focused lint passed (four existing image warnings, no errors).

## Automated evidence

| Check | Result | Practical limit |
|---|---|---|
| Production build | PASS; Next 16.2.2 compiled, type-checked and exported 64 pages | Does not prove live API, payment or entitlement readiness |
| Focused ESLint over changed experience code | 0 errors; 9 warnings | Five unused legacy homepage items; four intentional raw image elements used as responsive WebGL textures/poster sources |
| TypeScript | PASS | Includes integrated sky, tarot, audio, shared shells and locales |
| Regression suite | 30/30 PASS | 11 chart/sky geometry tests; 13 tarot/share/gesture tests; 6 async audio lifecycle tests |
| Real-engine chart rendering | PASS for known time and unknown time with Moon ingress | Tests do not replace a broad historical timezone/DST audit |
| Patch whitespace/conflicts | PASS | No unresolved merge conflicts; patch application checked against upstream using an isolated index |

Test details: exact stationary longitude anchors, collision-separated glyph labels, 2,000 crowded skies, observed topocentric positions, equivalent timezone offsets, no fabricated unknown-time angles, full 78 seeded identity and reversals, malformed shared-reading rejection, pointer cancellation, stable spring integration, activation/mute/dispose races and completed audio graph cleanup.

## Browser journeys actually checked

- Homepage at 1280px and 390px: direct Tarot and Birth Chart actions visible in the first screen; existing figure/artwork retained. Ukrainian headline and longer actions wrap correctly. More opens; Escape closes it and restores focus.
- Navigation from homepage to chart starts without waiting for the scene. Existing chart form accepts a known synthetic fixture: 2000-01-01, 12:00, London, UTC+0.
- Timed sky: Sun 15.5° above the southern horizon. Native range keyboard End exposes the fixed chart. Sun in Capricorn 10.4°, Moon in Scorpio 13.3°, Aries rising; selecting Saturn trine shows its 120° relationship and 0° rounded orb.
- Unknown-time fixture: 1995-06-02, London, UTC+1. Changing language after entering data preserves fields and updates timezone copy. Result labels local-noon approximation, omits houses/ASC/MC, and states the Moon changed sign during the date. Ukrainian core controls render; long English interpretation is explicitly labelled.
- Chart checked at 390px and confirmed 320px. The mobile signatures use three compact columns. The full chart and native controls remain available in the reading column.
- Tarot at 390×667 and 390×844: Choose spread, Begin, full-deck browse controls, explicit Draw reversed then two upright cards, one-by-one reveal and Reveal all.
- Verified three-card result: Ten of Pentacles reversed / Six of Wands / Two of Pentacles for seed 998076851, draw indices 39,40,41 and orientation 1,0,0.
- Copied reading link gives visible success text. Loading that URL in the static production build restores the same cards, order and reversal.
- Twelve-card year-ahead URL restores all twelve cards and specified reversals; mobile overview is paired with a readable card index and full reading.
- Card inspector opens with Close focused; Escape restores focus to the invoking result card.
- Sound enable/mute UI was exercised; the saved preference’s Resume state appeared. Physical-device audible output was not certified.
- No captured console errors on the restored three-card production result.

## Remaining acceptance work

This is an implemented upgrade, not a claim that every commercial launch gate is closed. The ranked audit describes the work still required: real account/payment configuration and purchase validation, physical iOS/Android interaction and audio QA, screen-reader/high-zoom/live reduced-motion testing, measured performance, dependency advisory triage and complete editorial/localization coverage. Seven- and ten-card layouts are covered by deterministic data tests but were not each completed manually in this browser pass. Gesture cancellation is regression-tested; no physical touch-device certification is claimed.

No LCP, INP, CLS, conversion or accessibility-conformance score is asserted. The npm audit count is recorded as an unresolved dependency review, with static-export exposure distinctions in the main audit.

## Using the patch

`Olivia-Arcana-upgrade.patch` is a binary-safe diff from the September 14 upstream commit 7ba2cfa to the final local commit. Apply it from the repository root to that base (or review conflicts against any newer work). It contains code, tests and design context; existing artwork remains in the repository.

The existing workspace already contains the completed branch at:

`work/olivia-arcana/website`

For a fresh verification from that application directory:

```sh
npm ci
npm run build
node --test src/components/chart/natal-atlas-geometry.test.mjs src/components/chart/flattened-sky-geometry.test.mjs src/components/oracle/ritual.test.mjs src/components/oracle/riffle-physics.test.mjs src/lib/ritual-audio.test.mjs
```

This app uses static export. A local file server should serve `website/out`; opening exported HTML directly from a file URL will not correctly resolve all absolute asset paths.

## Latest refinement — motion and editorial handoff

The 14 September follow-up addresses the creator's reported lag, disconnected section transition and oversized zodiac background. See [Motion and Design Upgrade](Motion-and-Design-Upgrade.md) for the current implementation and candid performance measurements; its decisions supersede earlier decorative background/animation descriptions. The current production export passes, with 30/30 regression tests and no focused lint errors. Actual desktop and 390×844/320×667 layouts, mobile menu, invalid-date handling, skip focus and Tarot/chart navigation were checked. Atlas keyboard opening/closing restores the invoking focus; route changes cancel unfinished opening. No production deployment or push occurred.
