# Verification — The Tide Opens

Checked in installed Chrome with local offline HTML on 12 September 2026. Viewports are emulated, not physical device certification.

- PASS — Initial still and first tiny scroll use an identical scene frame ([2932487947,2932487947])
- PASS — Native keyboard scroll advances scene (0.2990694999008549)
- PASS — Pause freezes progress and ambient time
- PASS — Skip reaches and focuses reading entrance
- PASS — Intent changes suggested question
- PASS — Replay resets opening and restores focus
- PASS — Begin plays the scene (0.1263399825638236)
- PASS — User input cancels assisted playback
- PASS — No horizontal overflow 320 en
- PASS — No horizontal overflow 320 uk
- PASS — No horizontal overflow 390 en
- PASS — No horizontal overflow 390 uk
- PASS — No horizontal overflow 768 en
- PASS — No horizontal overflow 768 uk
- PASS — No horizontal overflow 1440 en
- PASS — No horizontal overflow 1440 uk
- PASS — Opening controls fit short viewport 375x667
- PASS — Opening controls fit short viewport 844x390
- PASS — Reduced motion removes pin and animation
- PASS — Reduced-motion reading remains reachable
- PASS — No-WebGL static fallback without empty scroll
- PASS — Static fallback reaches reading
- PASS — Context loss preserves functional static view
- PASS — No uncaught browser errors ([])

Visuals inspected at progress 0, 0.2, 0.42, 0.56, 0.65, 0.78, 1, plus English/Ukrainian mobile and reading entrance. Original figure color samples are from the same lossless source texture in every frame.

Remaining production verification: physical Safari/iPhone and Android frame pacing, GPU memory, loading on slow connections.
