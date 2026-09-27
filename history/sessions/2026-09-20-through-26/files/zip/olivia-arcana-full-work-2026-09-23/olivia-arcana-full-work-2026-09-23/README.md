# Olivia Arcana — complete working-session handoff

Packaged 23 September 2026, Europe/Kyiv.

This includes the 22 September design session and its continuation after midnight on 23 September: card-back research and explorations, logo studies, hero motion versions, the selected artwork, editable sources, previews, and quality checks. Earlier reference deliverables are included for continuity. Existing smaller ZIPs are retained so gallery download links keep working.

## Start here

Open `START-HERE.html`, or open `outputs/olivia-hero.html` directly in your browser.

The current hero is the latest, slower version: an even central passage, over twice the foreground viewing distance at the same scrolling pace, and a longer gathering. The Olive lattice back is embedded. The HTML also embeds its card fronts and fonts, so it can be opened without a build or internet connection. Navigation buttons still link to oliviaarcana.com.

## Current selected files

- `outputs/olivia-hero.html` — final self-contained hero, including slower motion.
- `outputs/olivia-card-back-olive-lattice.png` — exact selected artwork master, 957 × 1643.
- `outputs/olivia-card-back.webp` — optimized web texture.
- `outputs/olivia-card-back-selection.json` — selection record.
- `outputs/olivia-card-back-notes.md` — implementation and validation notes.

The selected card back is **10 — Olive lattice**. Logo explorations remain studies; no standalone logo has been selected. This archive contains local website design work, not a deployment of the live site's backend or accounts. Artwork studies are not a printer-prepared production package.

## Explore the work

`outputs/` contains the galleries, images, original export archives, motion recordings and earlier HTML versions. `work/` contains session source files, research, prompts, checks and revision history. Historical filenames are preserved so existing local links continue to resolve.

Start with these galleries:

- `outputs/olivia-weave-reimagined.html` — latest identity-connected backs, including the selected Olive lattice.
- `outputs/olivia-living-weave.html` — living-weave developments.
- `outputs/olivia-three-directions.html` — inlaid monogram, living weave and engraved field.
- `outputs/olivia-card-backs-art-01-05.html` and `outputs/olivia-card-backs-art-06-10.html` — generated art directions.
- `outputs/olivia-card-backs-ornamental.html` — ornamental card backs.
- `outputs/olivia-inspiration-reset.html` — research and reference directions.
- `outputs/olivia-identity.html` and `outputs/olivia-threshold.html` — identity studies.

The final result is `olivia-hero.html`; files named `next`, `v2`, `v3`, `before`, or `study` are retained history.

## Edit and rebuild the current hero

Requires Python 3, with no third-party Python packages.

From this unpacked folder, run:

    python3 work/hero-v5/build.py

Editable inputs:

- `work/hero-v5/hero.js` — rendering and motion.
- `work/hero-v5/template.html` — layout, typography and page structure.
- `work/fonts-inline.css` — embedded fonts.
- `assets/olivia-website/public/` — the six bundled front-artwork inputs.
- `outputs/olivia-card-back.webp` — selected reverse.

The packaged builder uses relative paths and was verified to reproduce the supplied final HTML byte-for-byte. `build.original.py` preserves the original workstation-specific builder. Older experiment scripts are archival sources and may still contain original local paths or require libraries such as sharp/opentype.js; only the current v5 build is presented as a portable rebuild.

Optional local viewing server, from the unpacked folder:

    python3 -m http.server 8765 --directory outputs

Then visit http://127.0.0.1:8765/olivia-hero.html . If that port is occupied, choose another port.

## Checks and provenance

- `work/hero-v5/timing-audit.json` — current slower timing comparison.
- `work/hero-v5/validation-motion-safe*.json` — sampled geometry checks, whose poses are preserved by the pace change.
- `work/hero-v5/validate-motion.cjs` — optional arithmetic motion checker (Node.js; no npm dependencies).
- `work/hero-v5/before-slower-pace/` — version immediately before the speed reduction.
- `work/hero-v5/before.html` — earlier hero.
- Font licenses are in `work/` and embedded in the final HTML.
- Image-generation prompts and design notes are retained alongside studies where available.

`MANIFEST.json` lists every packaged payload file with its size and SHA-256 hash. The manifest itself is excluded from that list. System metadata and unrelated access/credential documents are outside this package.
