# Olivia Arcana background comparison

Local comparison only. None of the three palettes has been approved for the live website.

## Deliverable

`outputs/olivia-backgrounds.html` is a self-contained comparison using the accepted V12 cards and Olive Lattice back. Preview at `http://127.0.0.1:8765/olivia-backgrounds.html?palette=plum`.

Palettes: Smoked charcoal, Blackened plum, Warm mineral. Controls switch palette while preserving the composition, select Opening or Moon reveal, isolate the background, or play the existing journey.

## Source and build

Licensed Shaders preset: [Illuminated Clouds 4](https://shaders.com/collection/illuminated-clouds/711b09c2-bc9c-4d2c-b2a3-f0a6eacc2de0), exported through the authenticated MCP service. Runtime version: `shaders@3.2.470`. The original component structure is retained with slower movement, tuned colours, static grain, and no mouse influence. Telemetry is disabled.

Build: `python3 work/background-study/build.py`. Input: `outputs/olivia-hero-v12-preview.html`. The official Shaders runtime adds a WebGPU background canvas alongside the inherited WebGL card renderer. Static CSS backgrounds provide fallback. Rendering is paused when hidden or reduced motion is enabled; buffers are capped for this comparison.

## Verification — 2026-09-24

- Both inline scripts pass `node --check`.
- Visually checked desktop and 390 × 844 mobile viewport: opening, Moon reveal, palette selection, background isolation, and typography.
- Pause, reduced-motion composition controls, and forced static fallback checked in browser.
- No browser warning/error logs observed in checked runs.
- GPU lifecycle and recovery handling reviewed independently against the installed runtime source. GPU loss and back-forward cache recovery were not explicitly simulated.
- Physical mobile hardware performance and sustained frame rate were not measured.

The canonical hero and V12 preview were not modified by this comparison. Both retain SHA-256 `d112e64d90199c7bc07a9fd2eccaba0c2130b8f8519f795348ce192cc9ce5de1`, size 9,075,803 bytes, and modification timestamp 2026-09-23 21:39:14.

## Scroll stall fix — revision 3

Reproduced: scrolling moved the document from 798 to 1596 pixels while card progress remained at 0.82. The comparison's still-pose helper set `freezeTime`, but inherited scrolling never released it.

The comparison now aligns each selected composition with its place in the scroll spine, releases the hold when actual scrolling diverges, and retains the selected position during resize. Reduced-motion views keep their chosen still image. The active composition indicator clears when scrolling takes over.

Verified actual browser interaction: wheel scrolling releases Moon; keyboard PageDown releases Opening; automatic playback advances; wheel input takes over from playback; reduced-motion Moon survives startup and mobile resize. Browser warning/error logs were empty. Both rebuilt inline scripts pass syntax checks; canonical hero hashes remain unchanged.
