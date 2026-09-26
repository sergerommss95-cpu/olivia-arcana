# Shared performance correction — 2026-09-14

## Changes

- `ClientShell`: removed the globally mounted `SkyVoyageCanvas`. This was the enormous etched constellation visible beneath the Arrival. It is entirely absent from the page, rather than covered by another layer. The real sky atlas remains available on request.
- Removed `EphemerisScroll`, which maintained its own RAF settle loop and wrote inherited `--scroll-vel` at document root for every scroll frame. The homepage no longer consumes that tracker (coordinated with editorial agent).
- `SkyAtlasAccess` is an eager lightweight launcher; `SkyAtlas` is dynamically imported only after click, M, or `oa-sky-map`. Includes loading, retry/cancel, keyboard typing guards. Closing cancels the pending display even if the import completes later. Atlas keeps focus trapping/restoration, scroll lock, charted-port memory, real planetary positions and locale. It mounts only while open, so the chart timer is inactive otherwise.
- Page transitions start routing immediately and show the existing thin progress rule. Removed full-screen moving sheet, SVG meniscus, noise image, text-shadow imitation and 180ms delay on atlas navigation. Existing modifier-click/native-link behavior and route focus handling remain.
- Removed invisible aurora animations/blur promotion and legal-page WebGPU atmospheric backdrop. Night room header uses an opaque ground instead of backdrop blur.
- Parlor pointer listener is registered only while sound is actually running. Removed five global input listeners, idle decorative timers/root class churn and unsolicited timed moon-fact popup. Existing consent, saved preference, audio lifecycle and tarot cues remain.
- Removed five speculative external connection hints from shared head; Next serves the font files locally, and payment/API operations initiate their connections when used.
- Shared body and night band use agreed ink `#0c1029`; no broad nonhomepage palette rewrite.

## Before/after workload evidence

- Decorative fixed global canvases: **1 → 0** (Arrival and functional charts not included).
- The removed canvas had a backing store at up to DPR 2: **4 × viewport CSS pixels**, about 3.69 million pixels / 14.1 MiB RGBA at 1280×720. It cleared and reprojected its star catalog on pointer movement even when hidden behind opaque page art. That whole background allocation, paint path and event listener are gone. This is an allocation/workload calculation, not a measured frame-rate claim.
- Global scrolling velocity trackers: **1 → 0**. Root inherited custom-property writes from this tracker: **one per active RAF → 0**.
- Page-turn fullscreen overlays: **1 → 0**, associated full-page grain and changing text shadow removed.
- Retired CSS aurora animations: **3 → 0**; legal-page atmospheric WebGPU canvases: **up to 1 → 0**.
- Optional atlas: **eager global component → first request import**. 35,943 bytes source previously sat in eager imports; this is source size, not transferred bundle savings. Runtime bundle savings should be measured after root builds the combined change.
- Baseline production homepage: **15 JavaScript chunks, 3,787,240 raw bytes**, excluding the root agent's 1,644-byte motion probe. Nine preloaded font resources, 229,304 raw bytes. Baseline copied to `/tmp/oa-ambient-baseline.json`. Final combined byte result belongs to root's new build; do not attribute whole payload delta to these shared changes.
- Largest old initial JS chunk was `0a5aagj7me22k.js` (2,665,924 bytes), containing the shaders WebGPU effect catalog. Root/editorial agent were alerted and removed eager legacy homepage art dependencies.

## Verification performed

- Focused ESLint on nine touched TSX modules: clean.
- Existing six audio lifecycle tests: pass.
- `git diff --check`: clean at last check.
- No full build run by this agent. Root owns production rebuild and visual/browser verification.

## Browser checks for root

1. No full-viewport sky canvas under page content; Arrival keeps its own working water/figure canvas.
2. Open Sky atlas with button and M; Escape and close button restore focus and scrolling.
3. Select a destination in atlas: starts routing immediately, no wipe.
4. Open/close atlas before import completes: it must stay closed once load resolves.
5. Check chart/tarot header remains readable at mobile width, with sound and atlas controls independently available.
