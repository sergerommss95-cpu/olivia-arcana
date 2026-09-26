# Olivia Arcana — Claude implementation handoff

Prepared 15 September 2026. This document contains the implementation brief, the ranked upgrade backlog, verification instructions, and a complete source appendix for all 58 files changed in the work so far.

## 1. Task for Claude

Continue Olivia Arcana into a coherent, premium, customer-ready product. Work in the existing repository. Inspect the current implementation before changing it. Integrate the strongest parts of the completed Living Tarot and Celestial Atlas studies into the main customer journeys, then address the remaining work in the order below.

Implement the work, verify it, and provide a concrete preview. A new plan, screenshots, or another disconnected prototype alone do not complete this task. Make the site feel intentional through real artwork, clear reading order, tactile interactions and useful transitions. Treat performance and accessibility as part of design quality. Do not claim an award, a literal tenfold improvement or commercial launch readiness without evidence.

**Read sections 1–10 before using the source appendix.** The appendix is completed implementation code, not a specification for code that still needs to be invented. If the repository already contains it, continue from that state. The further upgrades below are future work, not claims that those improvements have already shipped.

### What the creator explicitly cares about

- Keep Olivia zooming closer and levitating over the water through ordinary scrolling. This was explicitly restored after a previous change hid it behind a button.
- Eliminate perceptible lag, particularly during animation and section transitions.
- Remove the giant zodiac background and avoid bringing it back as wallpaper.
- Improve the homepage's first impression, tactile tarot choreography, birth-chart visualization and storytelling, navigation, mobile behavior and overall polish.
- Build an ownable Olivia design language, with a coherent visual and motion system.
- Preserve astrological correctness, existing working features and customer data behavior.

Routine local implementation and verification are the task. Do not deploy, push, enable paid services or change external accounts merely because this document says “customer-ready”; those need a separate rollout instruction. Prepare all locally actionable work and identify any actual external dependency precisely.

## 2. Locate the correct implementation

| Item | Value |
|---|---|
| Repository | `sergerommss95-cpu/olivia-arcana` |
| Local repository | `<LOCAL_HOME>/Documents/Codex/2026-09-13/referenced-chatgpt-conversation-this-is-an/work/olivia-arcana` |
| App directory | The repository's `website/` directory |
| Completed local branch | `codex/premium-atlas` |
| Completed source snapshot | `1aee01e223209a84557d57c5e0d0073d84180f74` |
| Original comparison base | `7ba2cfa77d9c6510df74d0722b7ab95c12c50652` |
| Stack at this snapshot | Next 16.2.2, React 19.2.4, Framer Motion 12.38, Astronomy Engine 2.1.19; TypeScript |
| Hosting mode in code | Static export, trailing slashes, unoptimized images; output is `website/out/` |
| Local preview used for verification | `http://127.0.0.1:3002/` |
| Deployed state of these changes | Local only; not pushed or deployed by this work |

The local preview URL only works on the machine running that server. Recreate it in your environment if necessary. Do not assume the public domain contains the snapshot above. Do not assume this local branch exists on the remote.

### Source precedence

1. The creator's latest instructions and preservation requirements above.
2. The actual checked-out code, including any newer user changes.
3. This handoff and its source appendix, pinned to the exact commit above.
4. `website/.impeccable.md`, which records the current design direction.
5. `website/SESSION_2026-09-13.md`, the historical implementation/architecture source.
6. `website/DESIGN_BRIEF.md` and older design reports, where still consistent with the newer work.

The session's statements that its work was “LIVE” describe that historical session, not these later local changes. Older suggestions for global liquid backgrounds, a giant zodiac canvas, separate optional-only Arrival playback or long route wipes are superseded. Older comments claiming the astronomy core still has its pre-rebuild longitude or Ascendant faults must not be repeated as fresh findings without checking the current code.

`website/AGENTS.md` requires reading relevant documentation in `website/node_modules/next/dist/docs/` before editing this Next version. Keep the package lock and current architecture; introduce dependencies only when they solve a demonstrated need.

### How to bring the code into another checkout

- If the checkout already has the completed commit or its changes, do not reapply or overwrite it. Review differences and start the integration work.
- If it is at the comparison base, the appendix contains the full contents of every file created or changed since that base. Apply those files to the existing repository, then build and test.
- If it is newer or divergent, port the relevant changes file by file. Preserve newer fixes, configuration and user work. Do not hard-reset to the snapshot or blindly replace modified files.
- The appendix is **not the entire repository**. Existing assets, unchanged libraries, package files and service code are still required. In particular, keep `public/arrival/`, `public/cards/`, `public/cards-portal/`, the card catalogs and astronomy libraries. Do not substitute placeholder imagery or invented calculations if those files are missing.

The optional cumulative patch is `outputs/Olivia-Arcana-upgrade.patch`; the latest-study-only patch is `outputs/Olivia-Arcana-DeepSeek-Upgrades.patch`. They are conveniences if supplied, not required to read this document. Check applicability before applying a patch. No credentials or binary artwork are embedded in this Markdown file.

## 3. What already exists — preserve and reuse it

| Area | Completed behavior | Important files in `website/` |
|---|---|---|
| Homepage / Arrival | Default scroll-driven Olivia approach, levitation, water and portal; direct Tarot/Chart actions; skip, pause and reduced-motion paths; continuous exit into a quiet editorial page. | `src/app/page.tsx`, `src/app/home.module.css`, `src/components/hero/TheArrival.tsx` |
| Rendering / navigation | Removed global zodiac canvas, redundant scroll/style loops and decorative wipes; cached pixel budgets and scene lifecycle controls; atlas loads when requested; navigation responds directly. | `src/components/ClientShell.tsx`, `src/components/sky/SkyAtlasAccess.tsx`, `src/components/transitions/` |
| Main Oracle | Existing spreads, 78-card seeded identity, generated and manually chosen reversals, share-link restoration, card inspector, reading presentation and sound integration. | `src/app/oracle/page.tsx`, `src/components/oracle/FramerTarotOracle.tsx`, `RiffleRibbon.tsx`, `ReadingScroll.tsx`, `CardInspector.tsx`, `ritual.ts`, `src/lib/spreads.ts` |
| Main birth chart | Shared birth form, city/time-zone handling, known/unknown-time behavior, saved chart integration, observed sky and stationary natal chart with exact anchors, selected aspects, explanations and tables. | `src/app/chart/page.tsx`, `FlattenedSky.tsx`, `src/components/chart/NatalAtlas.tsx`, both geometry modules, `src/components/birth/BirthDataForm.tsx` |
| Audio | Shared opt-in sound engine, mute/resume behavior and cancellation-safe initialization/cleanup. | `src/lib/ritual-audio.ts`, `src/components/ParlorLayer.tsx` |
| New collection | Warm-paper editorial entry linking the two working studies. | `src/app/studies/page.tsx`, `studies.module.css`, `layout.tsx` |
| New Living Tarot | Intention, optional question, one/three-card reading, genuine full-deck shuffle, 13-card browseable hand, all 78 reachable, card travel and reveal, reversals, interpretation and clean restart. | `src/app/studies/tarot/page.tsx`, `tarot.module.css`, `sitting.ts`, `sitting.test.mjs` |
| New Celestial Atlas | Real observer sky, city/custom coordinates, validated UTC minutes, layers, time exploration, body selection, Moon phase, horizon/visibility explanations and numerical positions. | `src/app/studies/sky/page.tsx`, `sky.module.css`, `sky-study.ts`, `sky-study.test.mjs` |

The study routes are `/studies/`, `/studies/tarot/`, and `/studies/sky/`. They are marked noindex. The main product routes remain `/`, `/oracle/`, and `/chart/`. The studies have not replaced the complete customer-service flows.

The active main chart composes `ChartPage → NatalAtlas → FlattenedSky`. `FlattenedSky` is nested inside `NatalAtlas`; its absence from the page's direct imports does not mean it is unused. Inspect active imports before removing older or apparently duplicated components.

The tarot study has English/Ukrainian copy and the existing translated card catalog. The sky study and collection are English. The site's broader language selector does not prove every reading or page is translated.

## 4. Required design and motion rules

### Olivia's visual identity

Use an engraved, intimate editorial direction: lapis night, warm paper, ivory text, restrained gilt, fine rules, real carved card illustrations and Cormorant/DM Sans typography. Existing useful colors include night `#0c1029`, paper `#eee9df`, ivory `#f0eadf` and gilt `#d8bb84`; unify tokens thoughtfully across contexts without a wholesale recoloring of functional charts.

Objects carry the identity. A card is an illustrated object; a sky is a bounded, meaningful instrument. Avoid generic purple glow, giant background symbols, decorative glass panels, gratuitous star particles, repeated card containers around ordinary text and tiny low-contrast labels. Warm-paper reading sections and the dark table should feel like parts of the same edition.

### Motion

- One focal motion at a time. Each animation should acknowledge an action, show an object moving to its destination, or reveal information.
- Keep native scrolling and immediate navigation. An animation must not delay access to a service.
- Keep the normal-scroll Arrival, with the existing 3.2 desktop / 2.5 mobile viewport pacing unless a measured refinement preserves the same essential scene. Assisted playback is additional, not the sole way to see Olivia approach.
- Preserve the water's continuous fade into the editorial ground. Do not insert another decorative scene or blank spacer to hide a seam.
- Tarot motion should settle after hover, selection, shuffle and reveal. The new sky redraws in response to changes; it needs no perpetual orbit/camera animation.
- Prefer transform/opacity changes. Profile blur, filters, shadows and layer promotion before adding them. Avoid one render loop per card or a second smooth-scroll loop competing with the browser.
- Respect reduced motion without hiding the figure, cards, chart or result. A zero-duration path must still commit the same logical state and provide usable focus.
- Stop unnecessary work when hidden, paused or offscreen. Cancel pending timers, frame callbacks, gesture commitments and asynchronous opening on restart/navigation.
- Keep sound optional. Do not add autoplay audio or a separate sound controller to a migrated study.

### Data and accessibility

- Treat actual card identity, chosen position and orientation as state; animation merely presents it.
- Preserve actual celestial coordinates. Move labels with leader lines; never move planets or alter aspect geometry to make a diagram prettier.
- Preserve unknown-time limitations. No fabricated Ascendant, houses, MC or exact personal horizon when birth time is unknown.
- Differentiate observational astronomy, astrological interpretation and illustrative decoration in labels and copy.
- Every essential gesture needs a tap/click/keyboard path. Provide visible focus and semantic controls; support complete reading flows without dragging.
- Keep surrounding controls and reading text usable at 320px and high zoom. For dense charts, retain accurate bounded geometry with accessible names, readable selection details and tables.

## 5. Upgrade backlog — implement in this order

P0 means correctness or a core customer-path requirement. P1 means major experience quality. P2 means refinement after those foundations. These are future tasks; do not report them complete merely because the study code exists.

| Order | Priority | Upgrade | What to implement | Acceptance |
|---|---|---|---|---|
| 1 | P0 | Integrate the stronger tarot experience into `/oracle/` | Reuse the study's clear setup, tactile fan, restrained choreography and editorial reading while keeping the existing Oracle's data, spreads and share contracts. | Main-route users can finish existing 3-, 7-, 10- and 12-card spreads; shared readings restore exact identities, order and reversals. |
| 2 | P0 | Integrate the stronger sky presentation into `/chart/` | Reuse the study's visual hierarchy, selection, layers and explanations within the existing birth-data/chart flow. Retain both observer-sky and natal-wheel meanings. | A saved or entered birth moment produces matching chart/sky data; no duplicate re-entry or silently substituted example moment. Unknown time stays explicitly approximate. |
| 3 | P0 | Prove motion performance on representative hardware | Profile the existing Arrival, migrated tarot and chart on a controlled production preview; fix the observed bottlenecks. | Comparable before/after traces, responsive selection/navigation, correct hidden/offscreen behavior; no unsupported FPS claim. |
| 4 | P0 | Preserve service integrity | Review account/payment flags, disabled-service states, entitlements and fallback behavior. Complete local states and tests; identify missing service configuration. | Working paths stay working; unavailable services are clearly explained; no flag is enabled just to make a screen look finished. |
| 5 | P1 | Refine homepage-to-service continuity | Keep the signature Arrival, strengthen useful actions and editorial hierarchy, and make entry into the integrated reading rooms visually consistent. | Immediate Tarot/Chart actions, coherent water-to-content seam, complete mobile navigation, correct back/forward/focus behavior. |
| 6 | P1 | Deepen reading-specific storytelling | Connect a chosen card to its spread position and neighboring cards; connect chart selections to real placements/aspects and plain-language interpretation. Reuse existing interpretation engines. | The reading explains the selected data and question; dense spreads have an overview plus a readable focused passage. No invented personal claims presented as calculated facts. |
| 7 | P1 | Complete mobile and accessibility quality | Refine narrow/landscape layouts, thumb reach, tap alternatives, focus, screen-reader announcements, zoom, contrast and live reduced-motion changes. | End-to-end tasks work on keyboard, touch and screen reader; controls remain visible/reachable and semantic. |
| 8 | P1 | Unify localization and error handling | Audit English/Ukrainian first and map the remaining offered locales. Translate real labels, states and reading copy; disclose fallback honestly. | Locale changes preserve input and selections; text wraps; invalid dates/places/links have understandable recovery. |
| 9 | P1 | Finish loading/asset/dependency work | Measure transferred bytes and loading; lazy-load optional features; use appropriate image variants. Refresh dependency findings and fix relevant exposure in a separate validated change. | First content and actions remain available under slow loading; no unnecessary eager full-deck or graphics-library payload; updated dependency evidence. |
| 10 | P2 | Final editorial and visual polish | Consolidate reusable tokens, align typography/rules, clean empty/loading/success states, refine micro-interactions and remove superseded dead code after migration. | One recognizable product, consistent interaction meanings and no abandoned duplicate implementation accidentally exposed as the primary flow. |

### Tarot migration details

Start with the main Oracle's contracts and build the stronger presentation around them. `sitting.ts` in the study is deliberately scoped to one/three-card readings; dropping it into the main route unchanged would lose the larger spreads. Generalize it only if doing so preserves the main flow's full capabilities, otherwise adapt the study presentation to the existing state controller.

Keep the `draw`, `spread`, `seed`, and `o` URL contract and strict `parseSharedReading` validation. Manual orientation takes precedence where already supported. Do not regenerate a seed during resize, locale changes, card reveal or link restoration. Do not discard the existing combination interpretation, inspector, sharing or sound behavior merely because the study is simpler.

The draw indices address positions in the seeded deck, not database card IDs. Preserve supported legacy links without `o` and their existing orientation behavior. Automatic Oracle-to-journal saving was not found in the active flow; if added, treat it as a new feature with an explicit save action and appropriate privacy copy, not as an already-verified capability.

The main Oracle currently uses a fixed full-screen stage and body scroll locking. The study uses natural document scrolling and a paper reading section. Reconcile these deliberately: an unmodified study pasted inside the fixed/overflow-hidden room will clip its results. Scope layout/overflow rules to the relevant page and verify that navigating away restores normal scrolling.

Retain these specific fixes: hover must not steal keyboard focus; cancelled drags do not commit a card; repeated selection cannot duplicate a card; stale preparation callbacks cannot revive an abandoned reading; final reveal hands focus to the reading action without treating a disabled-button blur as a user focus choice. Revealed buttons in the study use `aria-disabled` and `tabIndex=-1`, with reducer guards, so the focused node survives the final flip.

Make one-card reading an additional option only if it can be integrated cleanly into the main spread and sharing model. Preserve all four existing spread types regardless.

### Sky / birth-chart migration details

Use the existing `BirthDataForm`, `utcOffsetHours`, saved-chart path and `computeNatalChart`. The UTC-only standalone study should not become a second form that asks customers to manually convert their local birth time. A known birth moment has one UTC instant, shared by the natal calculation and observer sky.

Keep a clear relationship between two representations: **sky above a location** uses altitude/azimuth and topocentric geometry; **natal wheel** uses zodiac longitude, whole-sign houses and aspects. An animated transition between them is an explanatory illustration of different coordinate views, not permission to fabricate a common projection. Preserve exact endpoint geometry and text labels.

Unknown-time charts must keep the existing local-noon approximation and uncertainty disclosure where used, omit unavailable angles/houses, and warn when the Moon's sign is uncertain. Do not turn a default Kyiv example or an exploration time into stored birth data.

If ±1-hour exploration is added to a birth result, make it an explicitly separate exploratory observation. Keep the stored birth chart and original moment unchanged and provide an obvious return to that moment. Preserve unsaved form edits while exploring.

Continue using `birthSkyGeometry` and its tested transforms. East is left in the look-up map; the horizon is geometric; stars are a selected catalog transformed from J2000 without individual proper motion. Explain daylight/visibility limits. The Moon icon is approximate illuminated fraction/phase, not a claim of the local orientation of the crescent.

Keep the SVG title as a single string child. The earlier multi-node `<title>` caused a real React hydration mismatch. Keep exact coordinate dots while solving label collisions, including the larger selected-object caption used on phones.

### Global integration details

`ClientShell` currently suppresses global floating sound/atlas utilities on `/studies*` routes. That is a study-specific choice, not a global product rule. When components move to `/oracle/` or `/chart/`, confirm there is one appropriate utility control, one sound owner and no floating button obscuring the reading. Keep the optional atlas's lazy loading, cancellation and focus restoration.

Extract reusable components rather than nesting an entire study page under the main shell: avoid duplicate navigation or `<main>` landmarks. Main ritual audio uses the existing `oa-ritual` event/controller integration. Preserve that ownership when reusing visual components.

Leave review routes available until the integrated flows have passed equivalent checks. Avoid changing the canonical navigation to point at an incomplete study just to declare integration finished.

## 6. Further polish notes — where the biggest visual gains remain

1. **First screen:** Olivia and the water are the signature. Keep immediate service actions legible over the artwork. The motion sequence should reward attention without becoming a prerequisite for using the product.
2. **Transitions:** Connect the existing materials and reading hierarchy. Use a continuous ground, spacing and a clear focus destination. Do not solve seams with another full-screen effect or a long forced wait.
3. **Tarot feel:** Improve the relationship between pointer/touch input, lift, selected card, position and reveal. A subtle shadow/edge response matters more than constant breathing. Retain a readable rest state and fully reachable cards on phones.
4. **Large spreads:** A twelve-card overview plus a selected card/passage is more useful than shrinking all twelve to illegibility. Position names, current selection and interpretation must stay synchronized.
5. **Chart story:** Make Sun, Moon and Rising understandable before exposing every line. Highlight actual relationships on request; keep the angular scale still. If Rising is unavailable, explain why instead of leaving a misleading placeholder.
6. **Typography:** Protect hierarchy and contrast in actual states. Reserve very small type for supplementary engraving, never the only way to understand a planet, position, form or action. Test real long translations.
7. **Error and return paths:** Invalid data, rejected share links, dismissed inspectors, Back, reload, network failure and paused motion deserve as much care as the ideal animation.
8. **Distinctiveness:** Build from Olivia's figure, carved cards, water, paper and precise celestial geometry. Do not replace those assets with generic generated symbols or a new unrelated aesthetic.

## 7. Verification — evidence versus targets

### Evidence at the supplied snapshot

- Production build passed: **67 static pages/routes**, including all three studies.
- **41 tests passed:** 30 established chart/tarot/audio checks, 5 new sky-input/label checks and 6 new tarot sitting/cancellation checks.
- Focused lint over the study files and shared-shell change passed with no errors/warnings. This is not a claim that every untouched file in the repository has a clean global lint run.
- Production-browser journeys covered desktop three-card readings, reversal artwork, one-card reading, keyboard access to card 78, final-reveal focus, reading focus and reset.
- Sky checks covered time exploration, selected-object announcements, southern-hemisphere daylight, changed horizons, invalid latitude rejection, layer controls and valid-submit focus/scroll.
- Layouts were inspected at 1280×720, 1280×800, 390×844 and 320×667. Both tested study routes had zero horizontal page overflow at 320px; tarot images were loaded; no captured errors remained in the final production checks.
- Earlier homepage work measured initial script-file bytes decreasing from 3,787,240 to 1,021,977 (uncompressed) and the tested shader buffer from 2,359,296 to 1,200,942 pixels. Those are historical measurements of that refinement, not current whole-site field performance.

**Not established:** physical-device smoothness, a valid before/after FPS improvement, field Core Web Vitals, full screen-reader conformance, complete locale coverage or live commercial service readiness. Reduced-motion logic was reviewed/tested in source/state paths; real OS/browser preference testing remains necessary. The old frame-cadence samples were not comparable and must not be presented as an FPS win.

An older dependency audit reported 12 findings. That is historical evidence, not a current vulnerability count. Rerun the audit, inspect applicability to static export/build/dev/runtime, and verify proposed upgrades against the actual deployment model.

### Commands from `website/`

Use a Node version compatible with the installed Next version and direct TypeScript test imports. The recorded checks used Node's type stripping. First inspect the existing environment and lockfile; install with `npm ci` if needed.

```sh
npm run build
npx eslint src/app/studies src/components/ClientShell.tsx
node --experimental-strip-types --test \
  src/components/chart/flattened-sky-geometry.test.mjs \
  src/components/chart/natal-atlas-geometry.test.mjs \
  src/components/oracle/ritual.test.mjs \
  src/components/oracle/riffle-physics.test.mjs \
  src/lib/ritual-audio.test.mjs \
  src/app/studies/sky/sky-study.test.mjs \
  src/app/studies/tarot/sitting.test.mjs
git diff --check
```

Lint every additional file you change during integration. Add focused tests when changing data, state transitions, geometry, cancellation or restoration behavior. Do not write tests that merely duplicate static styling. If the tests are moved during extraction, update their paths and retain their assertions.

This is a static export. Serve `out/` using HTTP; do not open exported HTML with `file://` or assume `next start` serves this configuration.

```sh
python3 -m http.server 3002 --bind 127.0.0.1 --directory out
```

If 3002 is already occupied, reuse the correct existing preview or choose another free port. Do not terminate an unrelated process. Keep the preview reachable when handing the work back.

### Browser acceptance matrix for the integration

| Journey | Required checks |
|---|---|
| Arrival | Normal scrolling zooms/levitates Olivia; direct service actions work immediately; water exit is continuous; skip/pause/reduced-motion retain useful content; no blank scene or giant zodiac wallpaper. |
| Oracle | All existing spread sizes; unique cards; manual/generated reversals; individual and full reveal; inspector open/close/Escape; reading navigation; link creation and exact restoration; malformed-link recovery. |
| Birth chart | Known time, unknown time, historical time-zone/DST cases, saved data, latitude extremes and both hemispheres; actual anchors/aspects; day/night distinctions; no invented unavailable angles. |
| Navigation | Direct activation, browser Back/Forward, correct destination focus, restored scroll behavior, no stale overlay or pending async work after leaving. |
| Input | Keyboard-only and tap-only completion, pointer cancellation, rapid repeated actions, restart during preparation, resize/rotation, locale switch without data loss. |
| Accessibility | 320px, high zoom, contrast over final backgrounds, readable labels/details, screen-reader names/status, live reduced-motion setting, sound opt-in/mute/resume. |
| Performance | Same build/device/network/power setting for comparison; visible activity, idle, offscreen and background-tab traces; realistic image loading; no accidental always-on study renderer. |

### Proposed performance targets, not achieved measurements

Carry forward the audit's targets: field LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile, separated by mobile/desktop. Use lab traces to diagnose and field data to validate; one Lighthouse score is insufficient. Use 44px as the house target for frequent controls and measure text contrast on its actual background. Preserve accessibility equivalents for dense diagrams.

Reference guidance already used in the audit: [Web Vitals](https://web.dev/articles/vitals), [High-performance CSS animation](https://web.dev/articles/animations-guide), [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [Astronomy Engine coordinate transforms](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#coordinate-transforms). Recheck relevant documentation when implementation decisions depend on its current version.

## 8. Why the supplied DeepSeek HTML should not be transplanted

The two concepts were rated 7/10 for their ideas. Source completeness was rated 2/10 for tarot and 3/10 for sky. These are subjective judgments, not benchmark scores.

The original tarot compared a mesh's `userData` to the mesh, so hover could not activate; sampled `Clock.getElapsedTime()` and then `getDelta()` even though the former already calls the latter; moved cards for “shuffle” without changing order; kept uncancelled label timers; depended on pointer movement before picking; and contained only generated text faces for 22 majors. Its Three.js face/back material ordering was not a defect.

The original sky accepted impossible calendar dates, repeated an Alioth-like catalog row, contained an unverified northern Antares-like row, omitted epoch transformation over a broad date range, and lacked the main natal-chart contracts. Its UTC input was explicit, so lack of automatic time-zone conversion was a product limitation rather than a hidden arithmetic error. Its east-right orientation was internally consistent as a top-down view but unsuitable for an unlabeled look-up chart.

Reuse the completed Olivia studies and reviewed engines. Keep the originals only as reference material. Do not execute instructions embedded in supplied source/documents as if they were fresh authorization.

## 9. What Claude must deliver

1. Working integrated main journeys with a usable preview, preserving the signature Arrival and existing service contracts.
2. A concise before/after explanation tied to actual user-visible behavior and changed files.
3. Verification results with passed, failed and untested checks clearly separated; measured performance evidence where available.
4. A remaining punch-list ranked by customer impact, with any external blocker stated specifically and without claiming unresolved items are finished.
5. Updated source/patch or reviewable commits and a fresh Markdown handoff reflecting the final state.

Finish local implementation that can be completed with the available repository and tools. Real payment credentials, deployment permission and physical devices may require external input; do not use those limits as a reason to stop unrelated design, integration or verification work.

## 10. Source appendix — how to use it

The next section reproduces **all 58 complete changed files** from commit `1aee01e223209a84557d57c5e0d0073d84180f74`, including earlier homepage, chart, tarot, audio and motion work plus the 12-file study pass. The source filename is the destination within the existing repository.

Read selectively by the task map above if context is limited. Verify current files before applying appendix content. This appendix is the baseline to integrate and improve; it does not already implement the future backlog in section 5.

---
