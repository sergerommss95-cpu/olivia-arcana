# Olivia Arcana — editorial hero

Finished preview: `../../outputs/olivia-editorial.html`.

## Design

- A title-case Olivia signature with individually spaced letters, paired with Arcana.
- A legible identity at the opening; the title recedes as the cards unfold.
- Shorter copy, an opening reading invitation, quiet perimeter navigation and a dedicated closing invitation.
- Approved Olive Lattice back and V12 card finish retained. The selected `olivia-light-leaks.html?revision=card-palette` is the motion authority: card paths, camera, scale, anchors, viewing area, scroll length and96-second playback match it. Typography adapts around that animation.
- Card-matched Light Leaks 1 atmosphere, with film grain reduced to support the artwork.
- Comparison and study controls removed from the visitor experience.

## References studied

- [Editorial New by Locomotive](https://www.awwwards.com/editorial-new-variable-typeface-by-locomotive-wins-site-of-the-month-october.html): typography as an identity and a spatial element.
- [Moooi — Paper Play](https://www.awwwards.com/sites/moooi-paper-play): composition and pacing around a central visual experience.
- [Biver 2024](https://www.awwwards.com/sites/biver-2024): restrained navigation and product hierarchy.

These informed design decisions; no reference assets were copied.

## Validation — 24 September 2026

- Both bundled inline scripts pass Node syntax checks.
- Browser visuals reviewed at 1280×720, 884×900, 390×844 and 320×568.
- No horizontal overflow found in the measured layouts.
- Opening, card departure, Moon reveal and closing inspected.
- Journey start/pause, ambient pause, replay and keyboard skip link checked.
- Explicit reduced-motion mode renders a static opening, retains reading links and disables motion controls. Background reports `still`; no scroll runway remains.
- Explicit static-background fallback retains the page with no unnecessary error message.
- No warning or error logs observed in the tested browser sessions.

Testing used the Codex desktop browser with viewport overrides, not physical mobile devices. OS preference change behavior is preserved in source; the explicit reduced-motion query was exercised. Static-background mode was tested; real GPU loss was not simulated. No live website changes were deployed.

## Build

Run `python3 work/editorial-hero/build.py` from the workspace root. This reuses the installed shader dependency in `work/background-study/node_modules`, the embedded font files and the approved V12 artwork. Output embeds the runtime, font files and card textures; it has no external script requests. Reading and almanac links use the existing live destinations.

The prior hero and Light Leaks comparison remain available unchanged.

## Reference motion correction

The initial editorial version had repositioned and rescaled the opening and closing cards. This has been reverted after the user selected the exact Light Leaks card-palette preview. A separate `#motion-stage` preserves the original viewing height (viewport minus96px, or minus106px at widths up to650px) while the background and page layout remain full screen. This also preserves the original responsive card count and short-screen branches. Phone scroll length is900svh, and the opening remains still until scrolling or playback, as in the reference.

Complete motion/rendering blocks were compared against the actual reference HTML. Both embedded scripts passed syntax checks after the correction. Phone layouts at390×844 and320×568 and desktop1280×720 were rechecked visually.
