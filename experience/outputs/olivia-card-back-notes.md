# Olivia Arcana — selected olive lattice reverse

Selected by the user on 2026-09-23: **10 — Olive lattice**.

- Exact selected artwork: `olivia-card-back-olive-lattice.png`, 957 × 1643 pixels.
- Web texture: `olivia-card-back.webp`, same dimensions, encoded at quality 92 without cropping or rescaling.
- Current local hero: `olivia-hero.html`, containing the texture directly.
- Rebuild: `python3 work/hero-v10/build.py`.
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

## Motion continuation — revision 6

The same spatial journey now opens the held deck into subtle layers, carries angular motion through compatible poses with shape-preserving Hermite interpolation, and keeps the foreground faces nearer frontal for longer. Rotation speed peaks are approximately 20% lower than revision 5. The long gentle scroll spine is unchanged. A shared rigid scene transform adds slow breathing and restrained mouse tilt while preserving relative card clearance. Lighting responds to card angle and camera position, with warm reflections confined to the gilded detail and cut edges.

`Watch the journey` plays the sequence over approximately 78 active seconds. It can be paused and replayed. Wheel, touch, pointer and navigation-key input return control to native scrolling. `Pause drift` independently freezes ambient movement and pointer response. Reduced motion retains the static final Moon and hides both animation controls.

Resize events are coalesced, unchanged framebuffers and paths are reused, pointer position returns to centre after leaving, and initialization is guarded against disposal. The fragment shader samples only the texture for the visible card side.

Validation: ten control tests pass, covering pause/resume, takeover, hidden tabs, reduced motion, resize reuse and replay. Eight-viewpoint sampled checks reported no intersections across 1,260,630 card-pair comparisons. Shared-transform checks covered 1,281,280 time/progress/pointer states with no detected viewport or navigation/footer incursions. Sampling is not a mathematical guarantee. Desktop, 390 × 844, 320 × 568, 640 × 360, and reduced-motion rendering were inspected in the browser with no reported warnings or errors.

Current editable source and portable artwork dependencies: `work/hero-v6/`. Previous gentle hero: `work/hero-v6/before.html`. The earlier full-session ZIP remains a snapshot from before this continuation.


## Authored formations — revision 7

The single procession is replaced by five connected formations: a layered opening fan, individually curved departures into an asymmetric constellation, a staggered wave of face reveals, a larger central Moon framed by the remaining cards, and a gathering behind the Moon. Seven cards appear in landscape and five in portrait, with layouts authored for each. Reveal timing, sizes and curves belong to individual cards. The chosen Olive lattice back remains unchanged.

Guided playback now lasts 86 active seconds. Native scrolling, gentle damping, ambient pause, reduced motion, responsive pixel limits and the single WebGL canvas remain. Typography has separate fade windows so passages do not overlap. Parallel plane ordering protects physical card clearance during the opening and gathering; cards turn only when separated.

Validation: the final motion source passed 3,918,915 sampled card-pair checks across eight viewports and 29 pointer/ambient conditions, with no detected intersections or viewport/navigation/footer incursions. Minimum sampled navigation clearance is 4.06px, footer 7.73px. These are numerical samples, not a continuous proof. All 25 runtime control/lifecycle mock checks pass. Browser inspection covered desktop and 390×844, the opening, fan, field, flip, Moon formation and reduced-motion finale; guided playback and scroll takeover worked with no browser warnings/errors reported.

Editable source: `work/hero-v7/`. Previous revision preserved as `work/hero-v7/before.html`. The current standalone output is `olivia-hero.html`; `olivia-hero-v7-preview.html` is the matching review copy. No live deployment. The full-session ZIP remains the previously delivered snapshot.


## Immersive passage — revision 8

The deck opens into a sculptural aperture, unwinds into a 2.4-turn helix, and surrounds an actual moving perspective camera. Foreground cards pass intentionally outside the frame while smaller cards describe the depth ahead. The Moon moves inward before advancing through depth, becomes the focal point, and the other cards gather behind it. Landscape uses 32 cards; portrait uses 22. All 22 original major-arcana artworks are embedded as individual detailed textures, with the selected Olive lattice reverse unchanged.

Guided playback lasts 96 active seconds. The native scroll spine is 1050svh on desktop and 900svh on narrow screens. The optional journey, pause, input takeover, hidden-page suspension, DPR limits and static reduced-motion finale remain. One WebGL canvas is used. Opaque geometry is drawn front to back; cards outside the camera depth range are culled. The HTML embeds fonts and every visual asset and makes no external asset requests.

Final source SHA-256: `b19453f27b00092f9490007480a00ee06c574c886a3d861994be058c7cfe393f`.

Validation: a final eight-viewport, 2,001-progress scan produced 6,349,173 card-pair tests without detected intersections. The separate Moon entrance sweep at 0.0001 progress spacing added 741,418 pair tests without detected intersections. Camera clearance, opening and closing layout bounds, finite transforms, transition continuity and deterministic reverse playback passed. Intermediate frame cropping is intentional and was visually reviewed. These checks sample the geometry and are not a mathematical proof. All 25 runtime/control mock checks pass. Desktop and 390 × 844 browser review covered the major formations, guided playback and the reduced-motion endpoint; no browser warnings/errors were reported. Real-phone frame rates have not been measured.

Editable source: `work/hero-v8/`. Previous revision: `work/hero-v8/before.html`. Rebuild writes both `olivia-hero.html` and the identical `olivia-hero-v8-preview.html`. Research and original adaptation notes are in `work/hero-v8/references.md`; numerical and runtime reports are in `work/hero-v8/qa/`. No live deployment. The full-session ZIP remains the earlier snapshot.


## Larger cards and emitted light — revision 9

The opening deck is approximately 32% taller on normal desktop screens. The middle camera field of view changes from 46° to 32°, producing approximately 48% greater screen magnification at equivalent poses. Closing cards are larger too, with responsive positioning to keep the invitation readable. Compact phones and short landscape screens have separate framing. The leisurely 96-second guided sequence is unchanged.

A second batched draw within the existing WebGL canvas adds softly feathered antique-gold edge light, fine strands attached to selected moving cards and two small edge-emitted motes per card. Light respects scene depth; overlapping packets reduce their contributions to avoid overexposure. Gold in the artwork catches a slow travelling reflection. Reduced motion retains static edge light and omits moving motes and trails. No added textures, external dependencies or full-screen processing pass are required.

Validation: 3,917,591 sampled card-pair tests passed, as did camera clearance, finite transforms, transition continuity and reverse evaluation. Endpoint framing passed across nine sizes and 29 pointer/ambient states. The current source passed 29 runtime/control checks and 10 light-renderer checks, including bounded finite uploads, render-state restoration, failure cleanup and static reduced-motion output. The light pass uses a fixed 264 KB buffer and reached 768 of 1,100 available quads in the tests. Desktop, compact/tall phone layouts, actual guided playback and reduced-motion rendering were reviewed in the browser with no reported warnings or errors. Real-phone frame rates have not been measured. Numeric geometry validation is sampled, not a continuous guarantee.

Final source SHA-256: `2bee13e9cb22efaf4982804ca97a6505e562f443b671cdf92d333de58410a525`.

Editable source and QA: `work/hero-v9/`. Previous V8 preserved at `work/hero-v9/before.html`. Rebuild writes the canonical `olivia-hero.html` and identical `olivia-hero-v9-preview.html`. Selected Olive lattice master remains unchanged. No live deployment; the older full-session ZIP is unchanged.


## Choreography reset — revision 10

The user rejected revision 9's tails, glow and motion. All added trails, motes, broad halos, luminous outlines and animated gold reflection have been removed. The shader returns to ordinary card lighting. The circular aperture, helix, tunnel and radial gathering have also been replaced.

Thirteen large cards on desktop (nine in portrait) form one broad wave, turn through depth, separate into two offset groups framing a large Moon, and then gather into a compact packet. The new sequence holds the Moon composition before the finish. Faces appear earlier than in the initial draft. A shared rigid transformation preserves card integrity, while individual in-plane angles and ordered depth planes create overlapping silhouettes. Portrait has a taller wave and narrower parting. Selected artwork, oversized framing, single canvas, native scroll, 96-second journey, reduced motion, input takeover and lifecycle handling remain.

Final source SHA-256: `36bade07d999c4a15603c8ef3b2d502cf2812b294e4323ff6bf7d745a6f2798f`.

Validation: 1,001 progress samples at eight viewports produced 498,498 card-pair checks with no intersections, invalid transforms, detected jumps or reverse-evaluation differences. Endpoint framing passed a separate 29-state pointer/ambient check. Camera clearance remained above 6.38 world units. Intermediate crops are intentional. All 29 runtime/control/fallback tests passed. Browser review included desktop wave, turn and Moon reveal, actual playback, portrait wave/reveal and reduced-motion finale, with no reported warnings or errors. These checks verify implementation, not user approval of the art direction.

Editable/build source: `work/hero-v10/hero.js`, `template.html`, `build.py`. The `choreography.js` file records the new arithmetic section for reference; `hero.js` is the authoritative build input. Previous revision preserved as `work/hero-v10/before.html`. Canonical HTML and the matching V10 preview are self-contained. No live deployment; the old ZIP remains unchanged.


## Cinematic refinement — revision 11

The user described V10 as better but short of the desired quality, then chose “Cinematic and mysterious” to guide the refinement. V11 retains the broad wave, dimensional turn and Moon reveal. Cards depart and return with individually staggered timing, and have small independent rigid tilts. The full Moon arrangement holds for approximately nine seconds during the unchanged 96-second journey. The surrounding wings recede in brightness while the Moon becomes the visual focus.

A fixed ivory key now casts soft card-to-card shadows over a cool ambient fill. A single optional 1024px desktop / 512px mobile packed-depth map uses the existing card mesh and canvas, with nine depth comparisons per shaded fragment. Dithering is disabled for depth packing and restored for the main pass. Optional shadow failure retains ordinary card lighting. No tails, glow, luminous outlines or particles return. The selected Olive lattice master and original fronts are unchanged.

Source SHA-256: `38d7cc5e04bc47ea844fde1940b6772b6cb5e087928edb45ea41e88d8b1e2d44`.

Validation: 1,293,306 sampled card-pair checks across eight viewports and extreme pointer/ambient endpoint states found no intersections, non-finite transforms, camera penetration, endpoint overflow or sampled discontinuities. These are samples, not a mathematical guarantee. 31 runtime/control/lifecycle checks and 12 shadow state/allocation/failure checks pass with mocked GPU calls. Real browser review covered the opening, wave, turn, Moon reveal and closing at desktop; portrait opening/reveal and the reduced-motion view at 390×667. The shadow map initialized at 512px in the portrait browser. Guided playback completed, and the browser reported no warnings/errors. A reduced-motion navigation initially stayed at its loading poster; reloading rendered the expected still view. Real-phone frame rates have not been measured.

Editable source and QA are in `work/hero-v11/`. `hero.js` is authoritative; `lighting.inc.js` records the integrated shadow helper. `before.html` preserves V10. Rebuilding creates both the canonical `olivia-hero.html` and matching `olivia-hero-v11-preview.html`, with embedded fonts and art. No live deployment. The older full-session ZIP remains unchanged. This revision is for user review, not an approved final art direction.


## Card finish — revision 12

The user described V11 as better, but the cards looked badly cut. The previous face used a rounded fragment mask inside a disconnected square perimeter; the artwork also contained inconsistent baked worn edges. V12 replaces this construction with a closed rounded body: two real face planes, ten segments per quarter-circle corner and six narrow bevel/edge profile rings. All surfaces meet. The main and shadow passes use the identical silhouette; the old discard mask and artificial bright perimeter have been removed. A restrained satin edge receives the existing key light.

Front imagery is mapped with a 1.2% inset on every side. The Sun uses 5.8% because its source included a photographed card within a dark surrounding margin. Insets are uniform to retain image proportions; the original images are not modified. The selected Olive lattice reverse receives no additional UV inset. The static poster also has matching rounded corners.

The existing V11 camera, paths, timing and motion controls are identical. The solid body remains inside the original 1.1667 × 2 × 0.011 conservative card bounds. Final source SHA-256: `5ba1b14c68c2ce02536fd40bdc6cacd53fc43ad68ea4a8737eb153c270a0b911`.

Validation: 12 mesh checks passed, including welded manifold closure, no degenerate triangles, outward winding, normals, face selection, UVs and dimensions. 31 runtime/control checks and 12 shadow lifecycle checks passed using mocked GPU calls. Browser inspection covered opening stack, near-edge-on turn, foreground faces, Moon reveal and portrait reveal; actual shader initialization succeeded and no browser warnings/errors were reported. The previous choreography sampling is retained as baseline because arithmetic and bounding envelope did not change; it is not a new motion scan. Desktop and mobile rasterization were visually inspected; physical-phone performance was not measured.

Editable source and QA: `work/hero-v12/`. V11 is preserved in `before.html`. Build writes matching standalone `olivia-hero.html` and `olivia-hero-v12-preview.html`. Approved master artwork checksum is unchanged. No live deployment; the older full-session ZIP is unchanged.
