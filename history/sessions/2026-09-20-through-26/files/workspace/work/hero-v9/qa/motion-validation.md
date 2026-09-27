# V9 geometry and framing QA

Source SHA-256: `da7eb0b56f0dcfce79ce8df6d0f5681d8eaa93368181f97794e6c4e0d7b84769`.
Arithmetic block + sceneFrame SHA-256: `0b583fc60c956661d9e3cb10210b5673c78f4f7b6f6196e4d9388a2e7b0b129c`.

**Pass at all sampled states.**

- Whole journey: 1,001 progress samples across eight viewports; 3,176,173 physical card-pair checks.
- Moon: progress 0.66–1 in steps of 0.0001 across eight viewports; 741,418 additional checks.
- Zero prism intersections, face crossings, detected pose/camera/branch jumps, invalid matrices, or reverse-evaluation differences.
- Smallest sampled camera/card clearance: 1.13940 world units. Moon-specific clearance: 9.86406.
- Opening and closing bounds pass. Middle cropping remains intentional.

Changing the middle FOV from 46° to 32° magnifies unchanged geometry by about 1.48× at the same camera distance. Keeping the central Moon at its original physical scale avoids enlarging its collision volume while delivering that screen-size increase.

Endpoint framing was separately checked at 29 pointer/ambient states for the eight standard viewports and a 375×667 phone spot check. Opening and closing remain within viewport/nav/footer bands.

| Viewport | Opening nav gap | Closing nav gap | Closing right gap | Closing bottom edge |
|---|---:|---:|---:|---:|
| 1440 × 1000 | 66.48px | 41.48px | 209.30px | 825.6px |
| 1280 × 720 | 28.16px | 10.12px | 223.84px | 594.6px |
| 800 × 900 | 69.53px | 21.14px | 151.31px | 529.1px |
| 390 × 844 | 70.78px | 25.34px | 12.09px | 496.1px |
| 320 × 568 | 33.47px | 3.33px | 42.46px | 295.8px |
| 844 × 390 | 6.45px | 8.11px | 172.77px | 320.3px |
| 640 × 360 | 1.87px | 3.42px | 117.66px | 295.5px |
| 1024 × 768 | 34.86px | 15.67px | 136.10px | 634.0px |
| 375 × 667 | 49.76px | 14.36px | 49.58px | 347.3px |

The tightest geometric margins are 1.87px below navigation for the 640×360 opening and 3.33px for the 320×568 closing. The 375×667 closing card ends at 347px, and 390×844 at 496px. CSS-based estimates put the copy just below those edges, so actual font/glow layout remains a visual-review responsibility; this audit does not claim to measure rendered DOM text.

Current reports: `validation-current.json`, `validation-moon.json`, and `validation-bookends.json`. Other copied reports are historical. Source/effects edits that leave the arithmetic hash unchanged do not alter these geometry results.

Finite sampling is evidence, not a continuous collision proof. No hero source or template was edited by this audit.
