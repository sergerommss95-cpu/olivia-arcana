# Olivia Arcana — motion and design refinement
14 September 2026 · local preview · supplements the original redesign audit

The creator's screenshot identified a disconnected cinematic exit, an oversized zodiac background and perceptible animation lag. This pass keeps Olivia's automatic scroll-driven approach and levitation, then resolves the water into a quiet editorial almanac. It does not claim an Awwwards award or guaranteed frame rate.

## Changes ranked by impact

| Priority | Before | Implemented result |
|---|---|---|
| P0 · responsiveness | The scene followed native scrolling through a 125 ms smoothing filter. | Scroll progress now reaches the next rendered frame directly. The optional assisted ride continues through the natural sticky release instead of jumping to the readings. |
| P0 · render workload | 2,359,296 shader pixels at the tested 1280×720 viewport; full portal math even before the opening existed. | 1,200,942 pixels at the same viewport (49.1% fewer). A uniform branch skips invisible portal work during Olivia's approach. Buffer allocation is cached; the phone uses stable stage geometry. |
| P0 · page payload | Initial script files totalled 3,787,240 bytes, including an unnecessary 2.7 MB graphics catalog. | Initial script files total 1,021,977 bytes (73.0% smaller, uncompressed). Optional atlas code loads on request. |
| P1 · coherent transition | Sanctuary ended against a separate control band, decorative spacer and giant zodiac drawing. | Shared #0c1029 ground, continuous water fade, controls fade out, then the editorial introduction arrives through ordinary scrolling. No second decorative scene. |
| P1 · first impression | Header consumed another 140 px above a full-screen scene, cropping Olivia and the reflection. | Masthead overlays the scene. Headline, service actions, Olivia and the water occupy one composition. |
| P1 · shared work | Full-page zodiac canvas repainted on pointer movement; global scroll tracking updated inherited styles; sweeping overlays ran between routes. | Removed these layers and listeners. Routes respond immediately. Optional sound motion listens only while sound is enabled. |
| P1 · editorial hierarchy | Large spacers and multiple idle animations competed with reading choices. | Actual carved card faces, clear Tarot/chart sections, deliberate type hierarchy, quiet Moon marginalia and a daily-card link. The card fan responds to hover/focus and rests otherwise. |
| P2 · resilience | Deferred atlas could arrive after navigation; focus could be captured after the original loading control disappeared. | Route changes cancel its opening. Focus is captured when requested and restored to the invoker or persistent atlas control. |

Astrological calculations, chart geometry, unknown-time handling, seeded tarot/reversals and the working reading room are preserved. The small chart specimen is explicitly a zodiac reference with today's computed Sun, not a fabricated personal birth chart.

## Motion contract

- Preserve the original 3.2 desktop / 2.5 mobile stage-height scroll pacing.
- One signature animated scene; no animated global wallpaper.
- Direct input response while scrolling. Quiet water updates at 30 frames per second; active movement follows browser callbacks without a second timer cap.
- Stop rendering when the scene is finished, out of view, paused or the document is hidden.
- Ambient frames update shader time, not all interface styles. Chapter attributes update only when the chapter changes.
- Cached canvas dimensions and a maximum pixel budget; partial GPU resources are disposed on failure/unmount.
- Full static/reduced-motion content remains available. No autoplay audio or forced route transition.

## Verification and measurement limits

Production export: **64 routes passed**. Existing astronomy, tarot and audio regression tests: **30/30 passed**. Focused lint: **no errors**, four existing raw-image warnings for textures/poster. The production build type-checks the implementation.

Browser checks cover desktop opening/approach/exit, phone layouts, complete mobile menu, skip target, atlas open/close/M/Escape, and immediate chart navigation. The original working stored chart still displayed its unknown-time limitations and planet controls. Device emulation is not a physical-phone test.

An eight-second frame-cadence probe produced an initial baseline mean 12.37 ms / p95 41.6 ms. Later optimized samples ran near 32.6 ms / p95 34.4 ms; a control with the scene fully stopped ran at essentially the same cadence (32.5 ms / p95 34.6 ms). The preview host/browser's pacing changed between samples, and the assisted path was also extended through the release. These are **not a valid FPS improvement comparison**. The payload and backing-pixel reductions above are direct measurements; stable 60/120 Hz on the user's actual devices is not yet established. The probe is absent from the finished export.

## Remaining high-impact checks

1. Compare native Safari/Chrome on the user's Mac and one physical iPhone/Android under the same power and display settings; capture a browser performance trace if stutter remains.
2. Measure real LCP/INP/CLS and compressed transferred bytes on a deployed preview under a realistic connection.
3. Continue the previously documented account/payment, localization and dependency launch gates before production release.

The research rationale and primary references are in [Motion Refinement Research](Motion-Refinement-Research.md). Raw local evidence is in the verification folder. These refinements supersede earlier recommendations for separate Arrival playback or a decorative zodiac backdrop.

Saved locally in commit `87e257d`. No push or production deployment.
