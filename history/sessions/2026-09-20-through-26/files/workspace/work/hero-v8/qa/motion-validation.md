# V8 final motion validation

Source SHA-256: `b19453f27b00092f9490007480a00ee06c574c886a3d861994be058c7cfe393f`.
Arithmetic block + sceneFrame SHA-256: `230fcc763512138c6550b352cd298b65fe05ed0b408ea6b52b459b256317e04f`.

**Current source passes all final sampled checks.**

- Full journey: 2,001 progress values × eight viewports; 6,349,173 physical card-pair tests.
- New Moon entrance: progress 0.66–1 in steps of 0.0001 × eight viewports; 741,418 Moon-versus-card tests.
- No prism intersections or face-plane crossings. No invalid matrices, detected pose/camera/branch jumps, or ascending-versus-descending evaluation differences.
- Minimum camera-to-card distance: 1.13724 world units. Moon-only minimum: 9.86406 world units.
- Opening and closing bounds pass. Middle cropping, near-plane passage, and background cards crossing the navigation/footer bands are intentionally permitted.

| Viewport | Endpoint left | Endpoint right | Navigation | Footer |
|---|---:|---:|---:|---:|
| 1440 × 1000 | 778.02px | 244.39px | 45.08px | 211.05px |
| 1280 × 720 | 716.78px | 249.08px | 12.86px | 134.60px |
| 800 × 900 | 341.12px | 165.90px | 41.00px | 297.73px |
| 390 × 844 | 111.45px | 25.78px | 44.09px | 283.35px |
| 320 × 568 | 120.02px | 49.85px | 12.75px | 215.40px |
| 844 × 390 | 485.27px | 180.22px | 19.04px | 33.94px |
| 640 × 360 | 358.39px | 124.54px | 13.42px | 27.79px |
| 1024 × 768 | 544.77px | 163.06px | 18.38px | 147.70px |

The full-journey endpoint measurements above use fixed ambient time and neutral pointer. Endpoint enforcement covers progress ≤0.04 and ≥0.985.

The unchanged baseline before the new Moon entrance also passed 92,109,017 pair tests across 29 pointer/ambient states (all four ±1 pointer corners at seven times, plus the neutral state). That report is `validation-corners.json`, source `92d61b02d14fe5e4fd2d3ef325cc4fa815234daaf384d8b925de7d55c5c46e2b`. It is explicitly an earlier source revision; the complete sweep was not repeated after the Moon-only adjustment.

The updated Moon follows the same common rigid scene transform as every other card, so pointer/ambient motion cannot alter card-to-card intersections. Its final endpoint pose is unchanged. The final source was independently retested with the fine Moon sweep and whole-journey regression described above.

Camera projection uses the actual `cameraPose(progress).vp`, including the moving eye and field of view. Camera distance is exact signed point-to-OBB distance at each sampled state, with no assumed camera body radius. Card bounds include physical thickness. Middle boxes are clipped against the near/far planes before projection.

Authoritative current-source reports: `validation-final-still.json` and `validation-moon.json`. Earlier intermediate reports and collision-range files are diagnostic history.

Finite sampling is evidence, not a proof over every continuous progress/time/aspect-ratio combination. The no-jump diagnostic does not assert global C2 continuity. No hero source, template, or browser was edited or operated by this audit.
