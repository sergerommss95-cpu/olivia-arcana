# Motion and renderer audit for the new full-screen hero

Read-only source audit, 22 September 2026. No website edits, browser session, server, or tests were run. References below are source line numbers at audit time. Performance figures would be estimates until measured on the finished scene.

## Scope and corrections

The deliverable is a new full-screen card hero. The current three-card hand, compact plate dimensions, and tide-opening narrative are existing implementations, not constraints on that hero.

- `website/src/components/almanac/TheDealing.tsx:627–632` defines a fluid stage with `max-width: 34rem; height: 28rem`. At a 16px root those maxima are 544 × 448 CSS pixels; 530 × 448 could be a measured parent-constrained instance, not its fixed specification. Its three-card conclusion is implemented at 427–442 and labelled at 619–621. Do not carry that ending into the new hero by accident.
- `website/src/components/hero/TheArrival.tsx:781–784` already has a `100svh` stage, a 700px minimum, and a sticky enhanced state. Its old 3.2/2.5-viewport scroll range is at 349–355. These are reusable integration patterns, not approved dimensions or scroll budgets for the replacement.
- Neither production component parks its animation loop merely because progress settles. Dealing calls `start()` after every visible frame (492–511). Arrival does the same (516–533). Both suspend outside the observed stage or a hidden document; Arrival also stops when explicitly paused.
- The reference `work/app.js:239–244` also runs continuously with normal-motion WebGL. It parks in reduced motion once progress settles. Its camera is already a centripetal Catmull–Rom path (190–199); it is not a set of independently eased camera lerps. The card paths are independently eased segments (211–213).
- Arrival's reduced-motion CSS hides the canvas (1072–1074), and `measure()` removes its runway. However `start()` does not check the reduced-motion preference (365); the hidden canvas can continue rendering while the stage is visible. Dealing switches to its DOM fallback instead (267–278, 609).

## What to retain, and what needs replacing

| Source | Retain as an idea | Replace for the new hero |
| --- | --- | --- |
| Dealing 47–78, 288–305 | Stable 22-card identities, atlas lookup, optional actual sky correspondence | Do not let the ephemeris ring dictate the hero's art direction unless explicitly wanted |
| Dealing 83–145, 340–351 | Small maths utilities, native scroll input, visibility-aware scheduling | Compact-stage scroll mapping, end-state three-card hand, unconditional visible RAF |
| Dealing 163–174, 524–529 | Shared geometry/program architecture | One flat four-vertex quad cannot show smooth bending, thickness, or a real card edge |
| Dealing 176–254 | Palette, printed-back drawing, atlas convention | Face crossfade, synthetic lighting tied to UV rather than the transformed/deformed normal |
| Arrival 319–365, 575–638 | DOM text/links outside WebGL, skip/pause controls, reduced-motion fallback, native scrolling | Tide shader and assets, old chapter sequence, current fixed runway values |
| Reference app 103–138 | Actual thin card body, separate face/back, scene-level lighting and depth | Importing every material, soft shadow pass, and opacity transition unchanged without profiling |

Keep the renderer interface separate from choreography: a pure `sampleScene(progress, layout)` supplies camera, card poses, deformation, and material parameters; one renderer consumes it. Three.js is a practical fit if the new hero needs manufactured card edges and physical lighting. Keeping raw WebGL is also possible, but its existing four-vertex geometry, disabled depth, and face blending must change. Merely increasing the canvas size is not sufficient.

For genuine bending, supply a subdivided surface, deform it in local card coordinates, and derive corresponding normals and a consistent edge/back surface. A shader evaluated only at the existing four corners still produces two planar triangles. If the visual direction calls for rigid manufactured cards, use a thin rigid mesh instead and omit bending. Choose mesh density from silhouette and normal quality at the closest planned view; any initial vertex budget is provisional.

The existing atlas has 256 × 512 cells with 256 × 439 active artwork (`TheDealing:76–78`). A large foreground card can expose its texture resolution. Plan a higher-resolution foreground artwork source or LOD; do not claim the existing atlas is automatically sufficient for a full-screen close-up.

## Proven motion defects and distinctions

**The lift arcs are not C1.** `sin(π·clamp((p-a)/h))` is constant outside its interval but has nonzero one-sided derivatives ±π/h inside. Its value joins continuously; its velocity does not. Dealing uses this at 384 (camera lift), 411 (deal lift), and 431 (hand lift). The eased base path does not cancel these terms. At the camera's internal `p = .82` boundary, the lift derivative jumps from `−π/.82` to zero; that changes eye Y, eye Z, and look-target Y (385–388). Replace a temporary bump with, for example, `16t²(1−t)²` inside the interval and zero outside. It has value and first derivative zero at both ends. Use `64t³(1−t)³` if zero second derivative is also needed.

**C1 does not mean uninterrupted movement.** The reference's smoothstep-per-segment card lerps (`app.js:212–213`) already have zero velocity on both sides of each pose knot, so the base translation is C1. They visibly stop at every pose, and generally do not have matched acceleration. Calling them “not C1” is inaccurate. Replacing smoothstep with quintic still produces stops; it does not create continuous travel through the intermediate poses.

**The reference camera has a timing mismatch.** `poseTimes` are nonuniform (app.js:16), but `curveTime()` maps each interval linearly to one equal-sized `getPoint()` segment (194). Its slope changes at every unequal interval. In the bundled Three.js implementation, centripetal tangents are also scaled by each chord's internal knot interval, while `getPoint()` selects segments uniformly. Thus smooth geometric direction does not guarantee equal velocity with respect to scroll progress. Eye and target have different chord lengths as well. The new specification should not promise C1 merely by saying “use centripetal Catmull–Rom.”

**The existing stagger has an internal derivative break.** `app.js:211` subtracts a delay proportional to `sin(π·clamp(p/.83))`. The delay disappears at .83 with a nonzero incoming derivative. Since the underlying card is moving within its .69–.925 segment there, its scroll derivative generally changes abruptly. Damping the master progress (241) softens the event in time but does not repair the path derivative.

## A coherent C1 scroll specification

Define one normalized hero progress `p ∈ [0,1]` from the hero's own runway. Retain native document scroll. Select composition knots `p₀ … pₙ` for opening deck, release, field, and final hero composition; these are poses along one journey, not separate stop/start animations. Do not inherit the old three-card ending.

Use time-aware cubic Hermite interpolation for position, scale, camera eye, look target, and any scalar deformation amplitude. At each knot store a value `xᵢ` and one shared derivative `vᵢ = dx/dp`. On interval `h = pᵢ₊₁ − pᵢ`, with `t = (p − pᵢ)/h`:

```text
x(p) = (2t³−3t²+1)xᵢ + (t³−2t²+t)h vᵢ
     + (−2t³+3t²)xᵢ₊₁ + (t³−t²)h vᵢ₊₁
```

The factor `h` is essential: both adjacent pieces then have derivative `vᵢ` with respect to the same global progress. Use nonzero interior derivatives to keep travelling; zero derivatives at the two endpoints give a settled opening and final composition. Adjust interior tangents to avoid intersections and composition overshoot. Sharing derivative data is more reliable than placing unrelated easing functions between poses. A globally smooth reparameterization preserves this property; a piecewise-linear timing remap with slope jumps generally does not.

For rotations, use sign-consistent quaternions and a time-aware rotation spline whose physical angular velocity agrees on both sides of every knot. Plain segment slerp can change angular velocity at knots; individually easing every slerp makes it stop there. A generic uniform-time squad call is not by itself a guarantee when scroll knot spacing is unequal.

For stagger that lasts through the entire journey, use a global envelope:

```text
E(p) = 16p²(1−p)²
pᵢ   = p − δᵢ E(p)
```

Here `E` and `E′` vanish at the endpoints and `E > 0` everywhere inside. Check `1 − δᵢ E′(p) > 0` to preserve monotonic travel; since `max |E′| = 16/(3√3)`, `|δᵢ| < 3√3/16` is a sufficient bound. With that bound, `pᵢ` already stays inside `[0,1]`, so no extra clamp is needed. Applying this to a C1 pose path preserves C1. Resetting this envelope independently at every pose interval instead makes the cards resynchronize at every knot; that is not an endpoint-only stagger.

Treat camera, orientation, FOV, card motion, and material modulation as parts of this same continuity contract. Keep eye and look target separated, and avoid a look direction parallel to its up vector. Ambient clock motion is a separate optional layer; it must be removed or gated if the finished scene should sleep when idle. C1 here describes the path with respect to scroll, not a guarantee of constant speed under arbitrary user input.

## Occlusion and actual front/back visibility

Dealing disables depth at 515 and painter-sorts card **centres** at 456–483. The comment that this is exact because planes never intersect is too strong: nonintersecting tilted planes can have misleading centre order when their depth ranges overlap, and a single global order cannot solve intersecting/cyclic occlusion. Full-screen bends and close passes make those limits more apparent. Use depth testing for opaque card surfaces with cutout/discard edges, then handle any intentionally translucent layers separately. Do not promise that centre sorting guarantees correct overlaps.

`uFace` at 182/241 and its animation at 425/441 are a texture crossfade. They do not choose a material from the physical side facing the camera. At an edge-on turn this can expose incorrect or mirrored artwork. Use actual front/back surfaces with correct winding/UVs, or derive sidedness from `gl_FrontFacing` on a two-sided surface. A two-sided plane still has no thickness. The prototype already has distinct body/face/back meshes (`app.js:125–128`), though its later face opacity changes remain an authored material effect rather than geometry.

## Lifecycle work required in an implementation

- Dealing creates shader/program/buffer/texture objects without deleting or consistently retaining them (353–357, 514–558). Its cleanup (598–606) omits the anonymous resize and link listeners, pointer listeners, image callbacks, and transition timer (567–590). There is no disposed flag guarding a late image load. A failed initializer exits before the cleanup is returned (561). Context loss switches to the DOM fallback (595); there is no explicit restoration path for this instance.
- Arrival removes most UI observers/listeners and has an async `alive` guard (624–655), and context restoration does call initialization (630–633). It still lacks retained/deleted GPU resource handles (429–438, 540–560). Partial initialization failure also needs resource disposal. The extra entrance RAF at 566 is not retained for cancellation. Reset document-level CSS/data state set at 451–455 on teardown.
- The standalone reference disposes registered geometry/materials/textures on non-persisted `pagehide` (269), and attempts restoration (262–263). Those page-lifetime handlers are not a React component unmount contract; any port needs removable named listeners and explicit teardown.

The implementation should track every resource and async callback, clean up partial failure, support loss/restoration or a deliberate static fallback, and render only while visible and needed. Wake on changed scroll, pointer, resize, assets, or explicit animation; park after interpolation settles unless a deliberate ambient layer is active. Verify continuity and overlap at each planned knot and with reverse/fast scroll when implementation is authorized.
