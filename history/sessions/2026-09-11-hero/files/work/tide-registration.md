# Olivia original-pixel registration

The current `olivia-cutout-raw.png` is registered to the supplied original at **crop origin x=930, y=480**, with crop size **320×310 pixels**. There is no 34-pixel vertical correction. A y=514 mapping is incorrect for the files inspected here.

## Files inspected

- Original: `<LOCAL_HOME>/Downloads/34EE5F88-5FF7-4271-8DB0-ADE059019032.PNG` — 1672×941, RGB.
- Matte: `<LOCAL_HOME>/olivia-arcana/hero-lab/assets/olivia-cutout-raw.png` — 320×310, RGBA.
- Existing placement: `<LOCAL_HOME>/olivia-arcana/hero-lab/hero.css:46` documents the same 930,480 crop; `.figure` uses its matching percentage placement.
- Alternate examined: `<LOCAL_HOME>/Documents/Codex/2026-09-11/i/work/generated-v2/olivia-key-REAL.png` — 1280×1240, RGB on green. It has no alpha. Use the supplied original as the untouched color source instead of this keyed enlargement.

SHA-256 of original: `80a08e584910666dcd9419ecb405a7a00a55a89a26b99bfc1c7e8e1dfad45753`.

SHA-256 of raw matte: `06be5d0dfaf0896e1fe3e3fea0f59028aac13c01493e610e8cc0bd7607854201`.

SHA-256 of keyed alternate: `6d0db7f023d9d7f4ae153edc72d73c82320b31c4ff5fb6b8135a4492525d54a3`.

No generating/extraction script was found in the inspected hero-lab/generated-v2 directories. Registration is established directly by pixel comparison, supported by the CSS provenance comment.

## Pixel evidence

Compared 15,097 raw pixels whose alpha is greater than 250 against the corresponding original RGB values. Mean absolute error is per RGB channel, on the 0–255 scale:

| Crop origin | Mean absolute channel error |
|---|---:|
| **930,480** | **3.3945** |
| 930,479 | 13.7484 |
| 930,514 | 53.9600 |
| 931,475 | 35.7548 |

Independent exact-RGB coordinate voting also selected 930,480. The raw colors are not pixel-identical to the original; they have small interior changes and visibly contaminated/premultiplied-looking fringe colors. Use its alpha only. This is consistent with preserving identity by sampling the original color texture.

## Sampling transform

For a raw local pixel center `(x,y)`, read original pixel center `(930+x,480+y)`. For normalized top-down raw UV `(u,v)`:

```glsl
vec2 originalUV = (vec2(930.0, 480.0) + rawUV * vec2(320.0, 310.0)) / vec2(1672.0, 941.0);
```

For the same textures both sampled in bottom-up UV:

```glsl
vec2 originalUV = vec2(0.5562200957, 0.1604675877)
                + rawUV * vec2(0.1913875598, 0.3294367694);
```

Respect the renderer's existing upload/flip convention. If constructing UVs from integer pixel indices, use pixel centers (`index + 0.5`) consistently. Sample original RGB and raw alpha independently; do not premultiply the source RGB twice.

## Alpha bounds and mask quality

Bounds below are `[left,top,right,bottom)` with exclusive right/bottom:

| Alpha threshold | Raw bounds | Pixel count |
|---|---|---:|
| >0 | [41,47,227,281) | 23,379 |
| >16 | [46,50,217,279) | 21,327 |
| >64 | [48,50,211,279) | 19,955 |
| >127 | [51,50,208,278) | 19,005 |
| >200 | [54,51,205,278) | 17,315 |
| >250 | [57,52,197,277) | 15,097 |

Alpha spans 0–255. There are 75,821 fully transparent pixels and only four exactly opaque pixels. The nonzero bounds map to original `[971,527,1157,761)`. A meaningful halo edge begins near raw y=50–51 / original y=530–531. The raw file's halo does not begin at y=17.

The matte is usable for registration but is not a perfect isolated silhouette:

- A broad semitransparent wedge of the source cloud remains inside the crescent. Raw `(150,75)` has alpha 156 and `(155,90)` has alpha 178. It can move as a faint cloud patch when Olivia approaches. Original RGB sampling removes its black contamination but does not remove the unwanted alpha.
- Soft surrounding pixels remain around parts of the hair, branch and droplet stream. Do not blindly use a high global alpha threshold: it would also delete the intended halo glow and droplets.
- Some low-alpha water/contact pixels extend below and to the sides of the dress. The rightmost low-alpha fringe reaches raw x=226; the lowest reaches y=280. The actual dress contact is around original y=755–757.

The existing CSS foot anchor of 45.31%/90.97% is approximately raw `(145,282)` / original `(1075,762)`. If retaining the earlier scene's intended water contact of original `(1060,756)`, use raw `(130,276)` / normalized `(0.40625,0.89032258)`. Crop registration and the chosen animation pivot are separate concerns.

Only this Markdown report was created for the registration task. No images or site sources were edited.
