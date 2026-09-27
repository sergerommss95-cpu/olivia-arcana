# V10 motion validation

Source SHA-256: `36bade07d999c4a15603c8ef3b2d502cf2812b294e4323ff6bf7d745a6f2798f`
Arithmetic + scene-frame SHA-256: `7864a6c7bddf80ff983e82866acf6ba49e9273c132d58182025738e43e8f0d88`

Final timing knots checked: 0.065, 0.095, 0.285, 0.29, 0.30, 0.565, 0.585, 0.77, 0.855, 0.99.

## Numeric results

- 1,001 progress samples at each of eight viewports; 498,498 full rectangular-prism SAT pair tests, including stacked packets.
- Zero card intersections or face crossings. Every pose and camera is finite; rotation bases remain rigid. Minimum eye-to-card clearance is 6.381690 world units.
- No suspected pose/camera jumps after local refinement; descending progress matches ascending poses and cameras exactly at a fixed pointer/time state.
- All viewport, conservative header, and footer checks pass for p ≤ 0.04 and p ≥ 0.985. Middle cropping and passages behind navigation are intentionally recorded as allowed excursions; this is not an all-progress viewport-fit claim.
- A separate cheap check of exact opening/closing poses at 29 pointer/ambient states also passes. Smallest sampled margin is 4.028 px at 640 × 360 opening header.

| Viewport | Opening smallest margin (px) | Closing smallest margin (px) |
|---|---:|---:|
| 1440 × 1000 | 72.578 | 43.023 |
| 1280 × 720 | 32.691 | 11.428 |
| 800 × 900 | 74.013 | 22.515 |
| 390 × 844 | 19.042 | 13.482 |
| 320 × 568 | 35.890 | 4.212 |
| 844 × 390 | 8.884 | 8.954 |
| 640 × 360 | 4.028 | 4.086 |
| 1024 × 768 | 39.488 | 16.785 |

## All-progress separation argument

Each local card rotates only about its Z axis. Its face normal therefore equals the shared actor normal, followed by the shared rigid scene rotation. For indices i and j, the center separation along that normal is |i − j| × gap, and combined thickness support is 0.0055 × (sᵢ + sⱼ). In-plane S-wave and wing changes cannot erase that separating axis.

Let k be common card scale, H the enlarged Moon target, v = space, and f = part × (1 − close). Because the opening spacing ramp completes before part begins, 0 ≤ f ≤ v. The gap is (1 − v) × 0.017k + vG, where G is 0.52 desktop or 0.40 portrait. When H > k, pair clearance is at least (1 − v) × 0.006k + v × [G − 0.0055(k + H)]. When H ≤ k, G ≥ 0.017k, so clearance is at least 0.006k.

Using the complete source scale ranges gives conservative positive lower bounds for every progress value: **0.0100984 world units desktop** and **0.0076275 portrait**. This argument also holds at arbitrary pointer/time values because sceneFrame is a common rigid transform.

Assumptions: positive uniform scales; mesh thickness ±0.0055; only local Z rotations; current single enlarged Moon; shared rigid transforms; zero shader bend and twist. Changing these requires rechecking the proof.

## Limits

Bounds use full rectangular card corners and conservative navigation/footer bands, not measured text glyphs. Pointer/ambient tests sample seven ambient times and four corners; they are not an exhaustive continuous-time bound. Finite sampling alone does not prove global continuity; the independent separating-plane argument supplies the all-progress collision result. Browser appearance, copy overlap, GPU behavior, and performance are owned by separate QA.
