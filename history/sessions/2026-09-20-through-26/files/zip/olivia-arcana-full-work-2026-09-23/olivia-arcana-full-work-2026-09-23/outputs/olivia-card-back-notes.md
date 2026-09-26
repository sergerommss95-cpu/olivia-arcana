# Olivia Arcana — selected olive lattice reverse

Selected by the user on 2026-09-23: **10 — Olive lattice**.

- Exact selected artwork: `olivia-card-back-olive-lattice.png`, 957 × 1643 pixels.
- Web texture: `olivia-card-back.webp`, same dimensions, encoded at quality 92 without cropping or rescaling.
- Current local hero: `olivia-hero.html`, containing the texture directly.
- Rebuild: `python3 work/hero-v5/build.py`.
- Selection record: `olivia-card-back-selection.json`.

The source is byte-identical to the user's `Downloads/10-olive-lattice.png` attachment. The master PNG remains unchanged. The card back is selected; this does not select a standalone logo. There has been no live-site deployment.

The artwork was generated with the built-in image-generation tool. Its original prompt is study 10 in `olivia-weave-reimagined/prompts.json`.

## Hero choreography — revision 5

Cards peel individually from the selected Olive lattice deck, enter a spatial path, turn through a foreground pass and gather behind the Moon. Each card advances along a sampled arc-length path with smooth individual departure and arrival. The frame no longer shrinks the entire formation to fit every card.

Landscape has nine cards; portrait has five to keep the artwork readable. The responsive rail has separate departure clearance and a rear approach to the final packet. Card fronts and selected back use mipmaps and bounded anisotropic filtering. The original critically damped scroll response, single canvas, DPR cap, hidden-page parking and reduced-motion composition remain.

Validation: 2,001 progress samples at eight screen sizes, repeated with still and both extreme pointer/ambient offsets, produced 1,260,630 pair checks with no detected card intersections or viewport/nav/footer incursions. This is sampled validation rather than a mathematical guarantee. Reports and the independent harness are in `work/hero-v5/`. Browser review covered desktop, portrait, compact landscape, pause/resume, backwards scrolling and the same reduced-motion rendering path through `?motion=reduce`.

The HTML embeds fonts, faces and reverse artwork; it makes no external asset requests. A matching still back is shown while the WebGL scene starts. The previous hero is preserved in `work/hero-v5/before.html`.

## Slower pacing — 2026-09-23

In response to the journey feeling too fast, the scroll distance is now 6.6 screen heights on desktop (body 760svh) and 5.3 on narrow screens (body 630svh), compared with 4 and 3.1 previously. The global timing curve integrates a quintic velocity ramp into an even middle passage, reducing its central speed peak. The same foreground pass receives over twice the scroll distance. Typography is mapped back to its original card poses so fades remain coordinated.

Card geometry, spatial paths, selected artwork, input damping and reduced-motion behavior are unchanged. The previous version is preserved in `work/hero-v5/before-slower-pace/`. Timing validation is in `work/hero-v5/timing-audit.json`.
