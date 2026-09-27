# Olivia Arcana — Light Leaks 1

Installed from the authenticated Shaders MCP `get_preset` export, preset ID `14ca0e55-b724-455f-b2d8-126e1e38bb80`.

Preview: `http://127.0.0.1:8765/olivia-light-leaks.html`

Deliverable: `outputs/olivia-light-leaks.html` — self-contained HTML with the approved V12 cards and Olive Lattice reverse. The original three-background comparison remains at `outputs/olivia-backgrounds.html`.

`preset.js` now uses the card palette: deep lapis, smoky blue, warm ivory highlights and muted antique gold. Component IDs, motion, positions and grain remain as exported. Colour interpolation uses OKLAB and chromatic aberration is reduced from 0.55 to 0.06 to suppress unrelated spectral fringes. CSS fallback colours and typography accents are matched too. The integration retains pause, reduced motion, capped GPU buffers, hidden-tab suspension, cleanup, a static fallback, and the corrected scrolling handoff.

The exact original export is retained in `preset.original.js` and `licensed-preset.json`; its standalone preview is `outputs/olivia-light-leaks-original.html`.

Build with `python3 work/light-leaks/build.py`. It uses the pinned dependencies in `work/background-study/package.json` (`shaders@3.2.470`, `esbuild@0.28.2`) and reads the approved V12 preview without modifying it. The generated HTML embeds the runtime and artwork; it does not require a CDN or account credentials.

Verification: both inline scripts pass syntax checks; desktop opening and Moon compositions render; pause/resume and scrolling work; 390 × 844 reduced-motion opening renders with no horizontal overflow. Browser warning/error logs were empty in checked runs. Real-device sustained performance was not measured.
