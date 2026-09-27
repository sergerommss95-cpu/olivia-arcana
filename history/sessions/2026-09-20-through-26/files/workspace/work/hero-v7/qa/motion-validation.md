# V7 motion validation

Source SHA-256: `d3bc4c439ebd75ee2630de30a84260a4bfd268e4327dcf1a326c866c96ce62bf`.

Final source check: **pass at all sampled states**.

Checked 3,918,915 physical-card OBB pairs across eight viewports, 1,001 progress values per viewport, and 29 fixed ambient/pointer states. The shared `sceneFrame` is included. Found zero prism intersections, zero face-plane crossings, zero viewport/nav/footer incursions, no invalid matrices, and no suspected pose jumps.

The opening plane expansion uses one common ramp, preserving the spacing order while screen motion remains staggered. The authored phase endpoints agree at progress 0.18, 0.415, 0.655, and 0.825; their local quintic ramps have settled at those boundaries.

| Viewport | Left | Right | Navigation | Footer |
|---|---:|---:|---:|---:|
| 1440 × 1000 | 162.16px | 66.38px | 42.15px | 88.02px |
| 1280 × 720 | 153.99px | 66.84px | 10.76px | 45.87px |
| 800 × 900 | 100.81px | 103.12px | 31.24px | 73.47px |
| 390 × 844 | 29.26px | 20.70px | 35.23px | 73.16px |
| 320 × 568 | 30.44px | 27.01px | 4.06px | 31.55px |
| 844 × 390 | 106.25px | 47.92px | 11.86px | 12.00px |
| 640 × 360 | 77.00px | 33.41px | 6.87px | 7.73px |
| 1024 × 768 | 111.92px | 44.54px | 16.13px | 53.25px |

These are minimum sampled clearances from conservative header/footer bands, not measured text overlap. Smallest clearances remain 4.06px below navigation at 320×568, and 6.88px below navigation / 7.73px above footer at 640×360. Increasing card size or scene tilt warrants rechecking.

The current canonical report is `validation-corners.json`. `validation-still.json` records the previous source revision, before the final margin adjustments.

Finite sampling does not prove separation or continuity at every possible progress, time, aspect ratio, or pointer position. No browser or production-source edits were performed for this audit.
