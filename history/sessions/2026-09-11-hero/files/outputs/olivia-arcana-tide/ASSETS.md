# Asset provenance — The Tide Opens

The owner’s blue celestial photograph establishes the world. Olivia’s color is sampled directly from this photograph throughout the animation; no remastered face, replacement pose, generated figure, or green-screen portrait is used.

| File | Origin | Use |
|---|---|---|
| `assets/original.webp` | Lossless WebP conversion of the owner’s `34EE5F88-5FF7-4271-8DB0-ADE059019032.PNG`, 1672 × 941 | Static fallback and original figure color source |
| `assets/olivia-original-matte.png` | Unchanged copy of Claude’s original `hero-lab/assets/olivia-cutout-raw.png`, 320 × 310 | Alpha only. Its RGB is intentionally ignored |
| `assets/sea-clean-plate.webp` | Earlier generated edit of the supplied photograph with Olivia removed | Background behind the approaching original figure |
| `assets/inner-sanctuary.webp` | New image generated specifically for this concept, 1660 × 948 | The architectural world visible inside the water opening |
| `assets/fonts/*` | Self-hosted Cormorant Garamond, DM Sans, IBM Plex Mono, IBM Plex Sans | EN/UK text; licenses included |

## Registration

The 320 × 310 matte corresponds to the original image rectangle beginning at `(930,480)`. Its occupied alpha bounds are `[41,47,227,281)`, mapping to `[971,527,1157,761)` in the original photograph. The shader uses this exact mapping and an original water-contact reference of approximately `(1060,756)`.

The matte contains some semitransparent cloud inside the crescent. A localized alpha threshold removes this residue. The figure’s face, hand, robe and crescent color continue to come from the original photograph. Subpixel fabric deformation and waterline feathering are renderer effects.

The original figure has roughly 230 pixels of vertical detail. Enlarging it preserves identity but cannot create genuine missing photographic detail. Desktop growth is capped near 2.2×; phone growth near 1.6×. A future higher-resolution original would improve close-up fidelity without regenerating her face.

## New sanctuary art direction

The original photo was supplied to image generation as a visual reference. The requested companion world was a monumental classical circular observatory, viewed low over dark reflective water, with tall moonstone columns at both sides, a vast circular opening centered on a deep ultramarine star sky, and a small crescent overhead. The center was kept relatively empty for typography; no people, tarot cards, text, furniture or gold were requested. The water portal itself is drawn live by the browser, not baked into this image.

Original generated sanctuary file: `exec-60239501-f25a-499d-bc98-cf1700006ebc.png`. The delivered WebP is an optimized conversion. No external website’s images, code, logos, or visual assets were copied.
