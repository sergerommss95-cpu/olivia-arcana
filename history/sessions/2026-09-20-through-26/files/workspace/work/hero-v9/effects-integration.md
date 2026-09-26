# Card light pass integration

`effects.inc.js` belongs inside the existing hero IIFE, before `draw()` and before `initialize()` executes. It reads the existing `gl`, `program`, `buf`, `indexBuf`, `CARD_W`, `CARD_H`, `COUNT`, `quiet`, `freezeTime`, `time`, `diagnostics`, `ramp`, `clamp`, `mix`, `norm`, `cross`, `add`, `scale` and `rotate` names.

1. Call `initializeMagic()` after the main program, mesh buffers and locations are ready. It detects compile/link errors, cleans up on failure and records `diagnostics.magicFailure`; a failure does not throw and does not prevent the main hero rendering.
2. After the opaque card loop call `drawMagic(progress, camera, layers, previousLayers)`. Matrices in both layer arrays are **world-space matrices**, as they are in the present `draw()` implementation. `previousLayers` uses the same `index` and `matrix` fields. It can be computed from a small earlier authored progress such as `Math.max(0, progress - .008)`; the effect derives a bounded filament tail from this pose. It does not mutate either input. Missing previous layers are valid and give shorter, softly curved corner filaments.
3. Call `disposeMagic()` from `dispose()` before deleting the primary buffers/program. Reinitializing calls `disposeMagic()` first. Calling it after WebGL context restore is safe: WebGL ignores deletion of handles from the lost context.

The effect restores the main program, array and element buffers, vertex attribute pointers, opaque blending state, depth write/test and culling state after every draw. **No further binding reset is required.** It leaves active texture selection/bindings unchanged, as it uses no textures.

One fixed 264,000-byte CPU array and GPU dynamic buffer; one additional draw call; maximum 1,100 quads. At 32 visible cards the intended budget is 768 quads (512 narrow perimeter segments, 128 broad edge halos, 64 motes, 64 filament segments). Quiet mode has no motes/filaments and the perimeter time is fixed. All animated positions use the existing `time` global, so pausing stops the light movement. Frozen diagnostics use deterministic progress-derived time.

Antique-gold edge pooling shifts slowly around the cut, with occasional pale ivory and very restrained blue. Fine strands come only from one card in four. Light respects the opaque depth buffer and does not draw on top of closer cards. There is no screen-space starfield, no texture download, no global circular halo and no full-screen processing pass.

Diagnostics: `magicQuads`, `magicDrawCalls`, and optional `magicFailure`. The main runtime GL mock needs `bufferSubData`, `drawArrays`, `disableVertexAttribArray`, `depthMask`, `blendFunc`, `DYNAMIC_DRAW`, `SRC_ALPHA`, `ONE`; meaningful browser QA should check effect appearance and `gl.getError()`.
