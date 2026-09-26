# Olivia Arcana — a floating-card hero

22 September 2026 · motion direction, research and implementation specification

[Open the interactive motion study](olivia-hero-motion-study.html)

## The decision

Build a full-screen, scroll-led opening around Olivia’s **actual carved-ivory-on-lapis artwork**. A suspended deck opens into a fan, separates into an accordion, stretches into an S-shaped ribbon, and releases into an asymmetrical constellation. One large card holds the final composition while the remaining cards continue to give it depth. The visitor can enter the reading at any point.

The magic comes from **a recognizable physical object behaving with an impossible collective intention**. Individual cards retain weight, order, stiff surfaces and legible artwork. The group can suspend gravity. That is the central distinction: physically readable cards, deliberately supernatural choreography.

This replaces the earlier brief’s small plate and PAST · NOW · NEXT ending. The new hero belongs outside `.plate-figure`, `.oa-plate-clip` and the page’s drift transform. `TheDealing` remains the existing embedded act; do not enlarge it and inherit its ending by accident.

Keep abyss `#0a0d38`, night `#10134d`, moonstone `#e8e9ff`, mist `#b7bce9`, and UI gilt `#e0b768`. The gold already painted into the deck stays part of the artwork. Use the site’s display serif and caption typography in production. No new imagery is needed to establish this direction.

## What has been made

The accompanying **standalone study** uses raw WebGL1, all 22 distinct Major Arcana, the existing atlas, and a sharper original Moon texture for the foreground. It demonstrates six compositions, a segmented card surface, an opaque depth-tested renderer, physical front/back selection, shared-tangent motion, pointer parallax and a composed reduced-motion state. Scroll or use the review slider; the slider and study label are review tools, not proposed production furniture.

It does not replace the website or contain a finished collision/contact solver, velocity blur, optical depth of field, or the proposed secondary spring rig. Those are deliberately distinguished from the tested motion foundation below. The photographed-looking relief is in the existing artwork; the study does not manufacture geometric depth for the illustrated figures.

The screenshots supplied with the brief show an earlier ghost-glass reference. The HTML currently on disk has since changed its art and camera. I inspected the current source as well as those screenshots; the inherited reference measurements are not all current.

## 1. Motion vocabulary

**Reading these numbers:** these are authored starting values, not measurements of cardists or physical constants of Olivia’s stock. Let `W` mean one card width. Preview time assumes a 10,000ms journey; real time follows the visitor’s scroll. A spring below uses normalized mass `m=1`, stiffness `k` in s⁻² and damping `c` in s⁻¹. “Rigid” means four surface vertices suffice for the transform; a convincing edge can still require extra geometry. “Segmented” means shader-deformed geometry with actual interior vertices. All listed moves are feasible in WebGL1.

| Move and real-world source | What it looks like | The cue that sells it | Starting parameters | Cheapest convincing WebGL1 version | Place in this hero |
|---|---|---|---|---|---|
| **Single-card deal / low glide** — [Giobbi, Introduction, pp. 37–39](https://www.eugenemagicclub.com/Giobbi_Card_Magic-Intro.pdf) | One leaf separates before it travels. | Small clearance, translation leading rotation, restrained landing. | 620ms; 90ms separation; travel 1.4W; pitch 8°→0°; tilt lags 45ms; `k144/c24`; zero overshoot. | Rigid surface; one transform per card; optional 8×12 grid for a 2° flex. | The deck’s first release. “Glide” here describes movement; *The Glide* is also the name of a different sleight. |
| **Table spread** — [School of Cardistry](https://www.youtube.com/watch?v=0gGONQKuM5s) | A packet exposes an orderly line of overlapping cards. | The traveling packet releases cards progressively; no simultaneous explosion. | 1,100ms; 26ms release stagger; 0.20W reveal per card; yaw ≤5°; `k144/c24`. | Rigid quads; shared path and ordered offsets. | Borrow its release order while replacing the table with suspension. |
| **Ribbon spread** — [52Kards](https://52kards.com/video/ribbon-spread/) | An overlapping band forms a broad straight or curved sweep. | Consistent order, controlled overlap and one leading edge. | 2,100ms; 7W span; centerline amplitude 1.3W; release 24–38ms apart; roll ≤25°; no overshoot. | Rigid cards on a spline; 8×12 grid only for ≤4° local flex. | Main silhouette, from fold into S-ribbon. Table and ribbon spread are related names, not necessarily separate techniques. |
| **Ribbon turnover** — [Michael Patrick’s demonstration/transcript](https://howcast.com/videos/515098-how-to-do-a-ribbon-spread-magic-card-flourishes/) | A turn propagates down an overlapping line. | Neighbor-to-neighbor support, a visible traveling pivot and preserved overlap. | 1,380ms total; 330ms local turn; 50ms between starts; 180° local rotation; 7° maximum bend; `k196/c22.4`, ≤1.5% settle overshoot. | Rigid hinge rotations give the chain; a segmented plane adds the small elastic give. | Optional single reveal during the ribbon. Not yet in the study; test before adding. |
| **Arm spread** — [School of Cardistry](https://www.youtube.com/watch?v=XhvD5h4sVBk) | A narrow spread rides a supporting curve and can gather again. | The supported band stays coherent; gaps do not appear randomly. | 1,200ms; 4.5W support arc; 20–30ms offset; gather over 700ms; roll ≤20°. | Rigid cards on an authored support spline. | Borrow the gathering gesture. A literal invisible arm and airborne catch add nothing here. |
| **Riffle shuffle** — [52Kards tabled riffle/bridge](https://52kards.com/video/tabled-bridge-riffle-shuffle/) | Two bowed packets release interleaving edges. | Visible loading, alternating release, then compression. | 180ms preload + 380ms release + 260ms square; bow 12°; release 14–22ms; `k225/c27`; no broad bounce. | Two packet rigs plus 8×12 segmented cards near the release edge. More clearance work than shader work. | Cut from main sequence: shuffling is a different narrative from opening a world. |
| **Bridge finish** — [same practitioner source](https://52kards.com/video/tabled-bridge-riffle-shuffle/) | A bowed woven deck relaxes into a squared pack. | Stored bend is released; cards recover rather than melt. | 160ms tension hold, 300ms release, 220ms settle; 14°→0° bend; `k324/c30.6`; ≤0.7% overshoot. | Segmented sheets with a shared changing curvature, not a soft-body solver. | Reserve as an alternative closing study, not an additional flourish. |
| **Faro / weave** — [December Boys](https://decemberboys.com.ua/en/tutorials/faro/) | Two aligned packets join through alternating edges. | Accurate alternating order and a plausible edge-engagement path. | 240ms align + 480ms engage + 220ms settle; 0.5W entry; tilt ≤4°; 16ms contact offsets; `k144/c24`. | Rigid packets; explicit separation and collision-safe paths. A perfect faro is an exact permutation. | Cut: too mechanical and too easy to fake by interpenetration. |
| **Descending cascade** — [Michael Patrick](https://howcast.com/videos/515108-how-to-do-a-card-cascade-magic-card-flourishes/) | A woven deck releases into a descending chain. | A supported start and an accelerating fall distinguish it from a static line. | 850ms; 26ms releases; fall 2.5W; receiving tilt 8°; `k196/c25.2`. | Rigid instances plus small release bend; optional 8×12 mesh. | A possible alternative to the ribbon. Do not combine all three cascade/spring/dribble effects. “Cascade” also names other finishes. |
| **Card spring** — [Michael Patrick](https://howcast.com/videos/515121-how-to-do-a-spring-magic-card-flourishes/) | Loaded cards propel into a continuous airborne stream. | Compression precedes propulsion, followed by elastic recovery. | 170ms preload; 650ms release; 24ms stagger; 3W arc; 18° flex at release, 0° by 220ms; `k324/c28.8`, ≤1.5% overshoot. | Segmented near cards, rigid far cards; authored flight curves. | Cut from the quiet main sequence. A slowed spring is a deliberate fantasy, not realistic unmodified card handling. |
| **Dribble** — [Giobbi pp. 88–90](https://www.eugenemagicclub.com/Giobbi_Card_Magic-Intro.pdf) | Individual cards fall from a held pack at an even release cadence. | Falling and gathering rather than spring propulsion. | 950ms; 34ms releases; fall 1.8W; pitch ±7°; arrival stagger retained; `k144/c24`. | Rigid cards with ballistic-looking authored paths. | Cut: creates a receiving-surface expectation the floating hero does not need. |
| **Charlier cut** — [School of Cardistry](https://www.youtube.com/watch?v=YdBdW0OlLpQ) | Two packets pivot past one another and exchange places. | Packet rigidity, corner pivot and clearance before closing. | 1,100ms; 120ms anticipation; pivot up to95°; minimum modeled clearance 0.02W; 160ms settle. | Two rigid parent transforms; individual leaves remain locked to their packet. | Possible alternate opening. Do not add it to the fan opening as well. |
| **Sybil** — [52Kards](https://52kards.com/video/card-tricks-sybil-cut-tutorial/) | Several packets articulate into a complex geometric display. | Each packet is coherent and handoffs have understandable support. | Exploratory test only: 1,800ms; 3–5 packets by selected variation; 90ms offsets; 35–110° pivots. | Rigid packet hierarchy; sequencing/collision work dominates. | Cut. Multiple simultaneous mechanisms compete with the artwork. |
| **Thumb fan** — [December Boys](https://decemberboys.com.ua/en/tutorials/thumb-fan/) | The squared deck opens around a supported pivot. | Persistent overlap and controlled pivot geometry. | 1,600ms opening phrase; authored 206° positional arc; up to161° total card roll in study; 18ms maximum local delay; ≤4° flex. | Rigid fan is enough; segmented flex is optional. | Keep as the first major reveal. No source checked establishes a universal 300° minimum. |
| **Pressure fan** — [Tom Interval](https://intervalmagic.wordpress.com/2022/04/19/how-to-fan-a-deck-of-cards-the-pressure-fan/) | Stored pressure opens the cards around an arc. | Compression drives the release; spacing follows contact, not independent random transforms. | 160ms compression + 520ms opening + 220ms settle; 220° target display; 8° load; `k196/c22.4`. | Segmented release region plus rigid target fan. | Borrow the anticipation only. A very slow expansion is pressure-fan-inspired. |
| **Giant / double-tier fan** — [Michael Patrick](https://howcast.com/videos/515102-how-to-do-the-giant-fan-magic-card-flourishes/) | A partially woven deck opens into two nested tiers. | The double tier remains identifiable. | 1,300ms; two tiers separated 0.7W; 240° authored opening; 70ms inter-tier lag; `k144/c24`. | Two ordered rigid fan rigs; limited flex at the join. | Cut from first version. It is not simply a larger thumb fan and risks turning the hero into a dense rosette. |

**Material limits.** Paperboard can have different machine-direction and cross-direction stiffness, but the artwork does not reveal Olivia’s grain orientation, mass or spring constant. Do not state that every card necessarily bends more easily about a particular geometric axis. Use the directions “curvature across width” and “curvature along length” explicitly. The proposed rig values are perceptual tuning. [Playing-card board manufacturer specification](https://www.bgppl.com/bgppl-imperial-c2s-ab-pcb-%E2%80%93-playing-card-board-detail-5-1)

Aerodynamic gliding also is not an automatic leveling mechanism. For this hero, planarization is an authored orientation constraint. Do not label a spline and a damped tilt as a validated aerodynamic simulation. Friction and corner-first contact matter only in the supported portions; once the deck levitates, the support is deliberately imagined.

## 2. Revised beat sheet

Use a 100svh sticky stage in a 440svh desktop wrapper, giving 340svh of scroll travel; start with 360svh/260svh on mobile. Preserve native scrolling and a visible reading link. The lengths are tunable, not required viewing time. A ten-second preview gives the following durations.

| Global progress / preview time | Composition and motion | What a fast scroller must see | Boundary contract |
|---|---|---|---|
| **0 / 0ms** | A large opaque deck floats to the right of the masthead. Twenty-two leaves remain compressed; one face is readable. Shared 0.018-world-unit heave, not individual layer wobble. | An object with a face and an edge, plus a usable reading link. | Directed position and angle derivatives zero. Ambient motion is a separate optional layer. |
| **.16 / 1,600ms** | The upper corner loosens, then the deck opens into a broad fan. A 90–140ms counter-tilt can anticipate release in the final rig. | A fan with a clear pivot and uninterrupted card order. | Shared nonzero Hermite tangents. No ease-to-zero at the fan pose. |
| **.34 / 3,400ms** | The fan stretches into an accordion. Alternating cards approach80° yaw; every fourth card stays near23° so artwork survives the edge-on passage. | A rhythm of edges and faces, not twenty-two disappearing slivers. | Keep translation and angular velocity continuous through the fold. This is an orientation passage, not a pause. |
| **.55 / 5,500ms** | The fold opens into a broad S-shaped ribbon above and to the right of the reading copy. The head and tail overlap in time. | One clean curved silhouette with several distinct illustrations visible. | Shared outgoing/incoming derivatives; optional turnover has its own smooth compact envelope. |
| **.77 / 7,700ms** | The ribbon loosens into an asymmetrical constellation. The Moon comes forward; distant cards separate into upper and lower groups. | One focal image, supporting depth and a quiet text region. | Nonzero travel through the key. Camera remains stable in the study. |
| **1 / 10,000ms** | The cards form an open surround around the foreground Moon. The surrounding field remains materially present; the reading link is still available. | A complete hero composition, never an empty frame or a three-card spread. | Directed derivatives taper to zero once. Optional ambient drift remains bounded; pause/reduced motion parks it. |

This is a **sequence of silhouettes**, not six chapter screens. The copy does not change at every shape. Give text a protected region: desktop left4.6–38% and approximately51–81% vertically; on mobile, reserve the lower text/CTA band and compose the card field above it. Peripheral cards may leave the viewport; the focal card may not be accidentally clipped.

The study’s ordinary drift is 0.027 world units of vertical motion at0.32rad/s and 0.012rad of yaw at0.23rad/s, with different stable phases. This is subtle movement, not an endless orbit. Pointer translation is capped at0.09 world units horizontally and0.065 vertically. In the production rig, translation can use `m1/k144/c24` and rotation `m1/k196/c22.4` with a45ms overlapping response; disable both under reduced motion.

### A real continuity guarantee

There are two different requirements: **C1 continuity** and **not stopping at every key**. Smoothstep segments with zero velocity on both sides already satisfy C1, but they stop. The reference’s card motion has that problem. Its current camera already uses a spline; claiming otherwise would repeat a stale observation.

Store one value `x[j]` and one derivative `v[j] = dx/dp` at each global knot. For interval width `h` and local parameter `u`, use:

```text
x = (2u³ − 3u² + 1)x[j] + (u³ − 2u² + u)h·v[j]
  + (−2u³ + 3u²)x[j+1] + (u³ − u²)h·v[j+1]

v[0] = v[last] = 0
v[j] = 0.55 · (x[j+1] − x[j−1]) / (p[j+1] − p[j−1])
```

The adjacent segments use the **same** derivative in the **same scroll coordinate**. Apply this to position, scale and deformation. The study uses the same construction on explicitly authored, unwrapped Euler angles; because the rotation matrix is a smooth function of these angles, its matrix derivative also joins continuously. For production paths containing large multi-axis spins, use sign-consistent quaternions with matched angular velocities rather than shortest-path slerp per segment. The proposed hero does not need such spins.

For per-card lag use the global envelope below, not a sine abruptly switched off at an interior key:

```text
E(p) = 16p²(1−p)²
p_card = p − (cardOrder/21)·0.018·E(p)
```

Both the envelope and its derivative vanish at the endpoints. Its maximum slope magnitude is approximately3.0792, so the chosen lag keeps `dp_card/dp ≥ 0.9446`: no reversal or clipping is required. Apply the shared Hermite path to `p_card`. The representative foreground card has order0 and no lag; each other card crosses its own knots slightly later with a continuous derivative.

For any temporary lift, use `16u²(1−u)²` inside its interval and zero outside. The existing `sin(π·clamp(u))` lift has nonzero interior endpoint slopes and therefore jumps in velocity when joined to its zero outside state. Do not fix that by stacking more easing functions.

The foreground Moon’s **incoming and outgoing translation speeds** are identical at each boundary. The numbers below are current displayed card-widths per second in a ten-second uniform preview, with pointer/ambient offsets removed. The camera’s directed speed is zero throughout this study; the cards provide the journey.

| Boundary | Desktop incoming = outgoing | Mobile390px incoming = outgoing |
|---|---:|---:|
|0|0|0|
|.16|0.396870W/s|0.358680W/s|
|.34|0.694651W/s|0.634140W/s|
|.55|0.488094W/s|0.512044W/s|
|.77|0.437592W/s|0.408199W/s|
|1|0|0|

The included [continuity measurements](../work/hero-motion/continuity.json) also record all nine scalar channels across all22cards, derivative vectors, and scale bounds. User scroll speed multiplies the preview speeds. This is a path-continuity guarantee, **not** a promise of constant wall-clock speed, C2 acceleration continuity, or collision freedom. If acceleration changes remain visible, promote only the offending track to a shared-acceleration quintic spline. [Why spline parameterization matters](https://www.cemyuksel.com/research/catmullrom_param/)

## 3. Effects that earn their cost

| Technique | Decision and numeric starting limit | Cost / reason |
|---|---|---|
| **Anticipation and overlap** | Keep one90–140ms preparation before major release; tilt follows travel by35–55ms. | Authored targets plus a small rig. Stronger perceptual return than another postprocess. [Lasseter’s original animation-principles paper](https://www.cs.cmu.edu/afs/cs/academic/class/15462-f13/www/lec_slides/Lesseter.pdf) |
| **Spring-damper response** | Keep for pointer response and release recovery, not as22 uncontrolled physics simulations of the full narrative. Critical translation `k144/c24`; restrained rotational response `k196/c22.4`. | Retains velocity and supports interruption. Exponential smoothing alone is first order; it is not a spring. [Juckett’s derivation](https://www.ryanjuckett.com/damped-springs/) |
| **Depth through ink** | Core. Mix distant surfaces up to40% toward abyss; keep the foreground crisp and card alpha1. | A few operations in the existing fragment pass. No translucency sorting or extra target. |
| **Edge glint** | Keep, limited to a narrow0.5–1.2CSS-pixel edge; highlight follows normal/light/view. | Small shader term or a narrow bevel. A bright permanent border would make the cards look electronic. |
| **Proximity/contact shadows** | Add only for compressed/overlapping cards; separation falloff over0.03–0.18W. | Analytic neighbor projection first; a real shadow map adds a light-view pass. No fake floor shadow in empty space. [Bruno Simon on shadow rendering](https://threejs-journey.com/lessons/shadows) |
| **Depth of field** | Defer. Test one focus plane;0px on focal artwork, at most2CSS-pixel background circle of confusion. | Needs depth-aware handling at silhouettes; softening a texture inside a sharp rectangle is not optical DoF. [GPU Gems DoF](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-28-practical-post-process-depth-field) |
| **Velocity-buffer blur** | Defer until fast-scroll recordings prove a need. Starting shutter1/120s, displacement threshold1.5px, clamp4px,8taps maximum; off at rest and in reduced motion. | Independent card rotation and bend need previous/current object states; depth-derived camera blur alone misses them. WebGL1 can use an extra geometry pass or an MRT extension. [GPU Gems motion blur](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-27-motion-blur-post-processing-effect) |
| **Bloom, chromatic aberration, feedback trails** | Cut. | Hide the engraving, suggest glass or holograms, and add fullscreen work without clarifying the object. |

At1920×1080, an RGBA8 target is approximately7.91MiB before driver overhead. Eight fullscreen color samples amount to16.6million sample requests per frame before velocity/depth reads. These are storage/sample calculations, **not measured GPU milliseconds**. The study has no postprocessing targets. Start with DPR≤1.75 desktop,≤1.5 mobile and a3.5million-pixel drawing-buffer cap, then profile actual phones before increasing quality.

### What the named studios actually contribute

- **Active Theory:** its [Hydra/Aura account](https://medium.com/active-theory/the-story-of-technology-built-at-active-theory-5d17ae0e3fb4) supports a small renderer built for known tasks, careful updates and selected custom effects. Transfer that discipline, not an unsupported claim about its spring constants.
- **Lusion:** its [authored studio account](https://tympanus.net/codrops/2026/04/13/lusion-where-digital-craft-meets-ambitious-experimentation/) supports project-specific systems and deliberate interactive storytelling. Here that means a few strong silhouettes rather than a catalog of flourishes.
- **Resn:** [Resn Labs](https://labs.resn.co.nz/) builds experiments around legible interaction ideas. Borrow one behavior—the field yields slightly to attention—rather than adding several competing pointer effects.
- **Bruno Simon:** [performance guidance](https://threejs-journey.com/lessons/performance-tips) informs the measurement discipline and restraint around shadow passes. It is not a reason to import Three.js here.
- **Yuri Artiukh:** [image-unrolling work](https://tympanus.net/codrops/2020/01/22/how-to-unroll-images-with-three-js/) demonstrates local shader deformation. Transfer the coordinate discipline, not the literal rolled-sheet shape.
- **Robert Hodgin:** [Murmuration](https://roberthodgin.com/project/murmuration) demonstrates a coherent group with individual variation. With22 cards, an authored director is preferable to an unbounded flock simulation.
- **Matt DesLauriers:** [parametric geometry](https://mattdesl.svbtle.com/shaping-curves-with-parametric-equations) informs efficient analytic deformation and the importance of stable frames. Do not introduce elaborate tube geometry just to bend a card.
- **Inigo Quilez:** [Behind Elevated](https://iquilezles.org/articles/function2009/function2009.pdf) informs controlled camera inertia and exposure-aware blur. His [shaping functions](https://iquilezles.org/articles/functions/) are a vocabulary for localized envelopes; they do not remove the need to inspect joins and derivatives.

These are explicit design transfers. The sources do not establish that every listed studio uses velocity buffers, the same DoF algorithm, or any particular spring solver.

## 4. Implementation against the actual code

Source references below are to the working tree inspected on22September; no production files were edited for this specification.

| Current source | Keep | Replace / add for the full-screen hero |
|---|---|---|
| `TheDealing.tsx:47–78` |22 stable identities, atlas order and real image assets. | Use those assets in a new hero director. Do not repeat seven illustrations under22 labels. |
| `:288–305` | Existing real astronomy calculation, if it serves a visible purpose. | Do not force all cards onto their exact longitudes: conjunctions create overlaps. Optional sky influence must be labeled a visual interpretation, not a geometric sky chart. No invented coordinates. |
| `:163–174`, `:524–529` | One shared program/geometry concept. | Replace the four-corner quad with a small segmented sheet and an edge. A vertex shader cannot create missing interior vertices. |
| `:176–254` | Atlas convention, abyss recession and engraved reverse language. | Replace the30-star loop with a cached back texture or cheaper procedural back; use deformed normals for lighting. Keep gilt restrained. |
| `:241`, `:425`, `:441` | Nothing from face crossfading. | Choose front/back by real sidedness (`gl_FrontFacing` with correct UVs, or separate surfaces), not `uFace` opacity interpolation. |
| `:340–346`, `:627–632` | Native-scroll input principle. | Replace compact figure-crossing progress and34rem×28rem stage with a hero wrapper and sticky100svh stage. Measure `offsetWidth/offsetHeight`, cached by `ResizeObserver`. |
| `:383–388`, `:409–423` | Small math helpers. | Use shared global-progress derivatives; replace clamped-sine lifts. The current `quint(ramp(...))` combination is not a guarantee of continuous travel. |
| `:427–448`, `:614–621` | A real HTML reading link. | Remove hand selection, PAST/NOW/NEXT labels and table-dive behavior from the **new hero**. Keep the existing embedded component separate. |
| `:456–483`, `:515`, `:532–533` | Batchable card data. | Enable depth test/write; opaque surfaces and cutout corners. Center painter sorting is not guaranteed correct for tilted or bent cards. Depth testing solves visibility, not collisions. |
| `:492–511` | Delta-time damping and quality awareness. | Park offscreen/hidden immediately. At rest, run only if ambient motion is explicitly enabled. A visible pause and reduced-motion mode must stop the ambient loop. |
| `:535–558`, `:598–606` | Async texture loading and DOM fallback principle. | Track/delete textures, buffers/programs; remove named listeners; guard late loads; handle context loss/restoration. Avoid the current anonymous resize listener leak. |
| `TheArrival.tsx:319–365`, `:575–638` | Hero DOM controls, visibility observers, native scroll and client-only rendering idioms. | Reuse integration patterns without its sea/portal shader, chapter UI or old artwork. Replace the old hero when integrating; do not mount a second hero loop underneath it. |

Read the installed Next.js documentation before framework changes, per `website/AGENTS.md`. A new `CardHero` component should own a pure `sampleScene(progress, layout)` director and an independently disposable renderer. Keep React out of per-frame card updates. The study is vanilla HTML precisely so it can be judged before framework integration.

### Geometry and instance data

An8×12 **segment** sheet has117 vertices and192 triangles. The study adds an80-triangle thin perimeter:272triangles/card,5,984 for22cards. It uses ordinary indexed draws and no instancing extension. The edge is a visual approximation, not a production bevel. Its single center sheet also is not a closed solid; front/back thickness consistency should be refined for close macro views.

A smooth bend across width can use `x'=sin(kx)/k`, `z'=z+(1−cos(kx))/k`, with the straight limit when `k→0`. A twist can rotate `xz` by an angle varying with local `y`. Compute normals from the deformed surface; taper should stay≤1% and normally remain0, because printed cards do not stretch. Keep visible flex≤4° in this hero. Larger spring/bridge values belong to the cut experiments, not continuous idle.

Production per-card data should carry: stable ID and atlas rect; position; orientation; scale; width/length curvature; twist; thickness; phase; release order; depth-ink amount; focal/quality flags. Keep velocity and spring state on CPU for this population. Only add previous transform/deformation state if velocity blur survives the cost test.

For optional instancing, use compact quaternion + translation/scale attributes rather than two `mat4` attributes. Feature-test [ANGLE_instanced_arrays](https://registry.khronos.org/webgl/extensions/ANGLE_instanced_arrays/); keep ordinary draws as fallback. No move selected here requires WebGL2, WebGPU or Three.js. Optional MRT/depth texture effects depend on separate WebGL1 extensions and should have a no-effect fallback. [WebGL1 specification](https://registry.khronos.org/webgl/specs/latest/1.0/)

The existing atlas’s active card area is only256×439px. That is suitable for distant cards, not automatically for a full-screen foreground. The study uses the original896×1536Moon for that reason. Production should load high-resolution textures only for the few cards that approach the camera. Add duplicated-edge tile padding/mip gutters when rebuilding the atlas; the current no-gutter layout can bleed at small mips.

### Responsive and accessible behavior

- Preserve the choreography’s identity on phones, but author the positions again. Reduce spread width, lift the focal card, and reserve the copy band. Do not pop half the deck in/out at breakpoint progress values.
- Reduced motion receives the composed constellation still, immediate links, no dolly, no pointer displacement, no blur and no ongoing frame loop. It also loses the long empty scroll runway.
- Pause freezes ambient movement at its current offset. Scroll remains a deliberate user action; provide a skip link to the page’s next content during integration.
- Keep all meaningful copy, navigation and links in HTML. The canvas is decorative. Failed WebGL or image decoding leaves a readable static poster and working reading link.
- Cache dimensions; only read layout on measurement/input events. Avoid per-card per-frame DOM reads. Budget the hero against the page’s existing Lenis and drift work rather than assessing an isolated canvas alone.

## 5. Cut list

1. **The three-card conclusion and compact plate.** Wrong purpose for this new hero.
2. **Ghost opacity.** It destroys the printed-object premise and produces an empty finale.
3. **A corridor flight through rows of cards.** The camera journey competes with the card choreography and adds vestibular motion.
4. **All78 cards at equal visual importance.** Start with22 real Major Arcana and strong hierarchy. More cards are not automatically more magical.
5. **Riffle, faro, Sybil and spring in one sequence.** They turn the page into a demonstration reel. Research them; choose only the mechanics the narrative needs.
6. **An exact ephemeris ring as the hero’s mandatory layout.** Astronomical coincidences can make a poor composition. Keep precise astronomy in its appropriate explanatory spaces; any hero adaptation must be honest about being an interpretation.
7. **Rigidly synchronized bobbing.** Repeated objects need stable individual phases, while the compressed packet must still move as one body.
8. **Rubber bending, rolled tubes and breathing textures.** The deck looks stiff and printed. Flex only where release/acceleration explains it.
9. **Full soft-body dynamics and collisions as the first implementation.** Start with authored clearance. Never claim a depth buffer proves cards do not pass through one another.
10. **Blanket blur, bloom, chromatic fringes and fake star particles.** The existing card art already carries the detail. More effects would weaken it.
11. **An unbounded camera orbit or idle animation everywhere.** Keep a stable camera first. Add movement only if an A/B recording improves the reading of the deck.
12. **A new rendering library.** None of the selected moves requires one, and the existing home route already establishes the raw-WebGL idiom. The inherited700KB claim is not a new bundle measurement.

## What still needs a visual decision

The study tests the principal silhouettes and timing. Before integrating, compare three short captures using identical cards: ribbon with no bend versus4° bend; ordinary ribbon versus one traveling turnover; current no-blur sweep versus a4px velocity-blur cap. Inspect full-speed playback and frozen frames. Keep only a difference that is clearly visible and improves card readability.

For contact/collision quality, sample the complete path, especially fan-to-fold and fold-to-ribbon. Test projected silhouettes and actual card-plane clearances, including mobile. The study has correct depth visibility but does not assert a collision-free physical simulation. For speed, profile the integrated page on real mobile hardware; responsive desktop emulation is a layout test, not a phone GPU benchmark.

Further source detail: [card-handling research](../work/card-motion-research.md), [studio/renderer research](../work/studio-motion-research.md), [current-code audit](../work/motion-code-audit.md).

## Validation of the delivered study

Syntax and browser checks passed. Twelve principal desktop/mobile states retained22cards, one canvas, no GL/runtime/console errors, no external asset requests and no horizontal overflow. Targeted320×568 checks cleared the initial and final copy overlaps. Keyboard controls, the static WebGL fallback, reduced-motion idle parking and context-loss recovery also passed. Desktop and mobile scroll recordings were sampled through the transitions.

The mathematical audit checked all nine path channels across176internal junctions in two layouts, with derivative disagreement below9×10⁻¹⁶ from floating-point arithmetic. Scales stay positive. The ambient envelope and small-angle bend are continuous, and the twist normal includes its longitudinal derivative. These checks establish the stated path properties; they do not establish mesh collision freedom or production mobile GPU performance. The original website and earlier reference HTML were not modified.
