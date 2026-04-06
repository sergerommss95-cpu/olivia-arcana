# Olivia Arcana — Motion Direction System

**Date:** April 6, 2026
**Scope:** Hero animation, cosmos engine, zodiac interaction system, liquid glass treatment

---

## OUTPUT 1 — CREATIVE DIAGNOSIS

### What's wrong with the current animation

**The core problem:** The animation is technically competent WebGL but emotionally empty. It feels like a shader demo, not a mystical experience. There is no narrative, no hierarchy, no ritual. It's "things moving" instead of "something happening."

#### Specific failures:

**1. Motion has no hierarchy**
Every particle moves the same way. The nebula drifts, particles drift, constellations drift — all at similar speeds, similar amplitudes. There's no distinction between cosmic macro-motion (slow, vast, geological) and intimate micro-motion (shimmer, breath, pulse). Everything is "medium-speed wobble."

**2. Particles are decoration, not substance**
4000 identical GL_POINTS with a softened circle fragment shader. They don't vary in shape, don't have tails, don't cluster realistically, don't form structures. Real starfields have dense regions, sparse voids, color temperature gradients from hot blue to cool red, and varying magnitudes spanning 6+ orders of brightness. This looks like evenly scattered confetti.

**3. Constellations are treated as identical hover targets**
All 12 zodiac signs share the exact same interaction: proximity → golden lines appear → glyph fades in. Leo behaves like Pisces. Scorpio behaves like Libra. This makes them feel like 12 copies of the same component, not 12 unique mythic entities. The hover response is also instant and mechanical — no anticipation, no crescendo, no ritual.

**4. The nebula is procedurally obvious**
FBM noise layered 4 times with color mixing. It reads as "I am procedural noise" rather than "I am cosmic gas illuminated by distant stars." The aurora wisps are just more noise with different offsets. There's no volumetric quality, no light-source directionality, no sense that the nebula is being illuminated by something.

**5. Mouse interaction is a gimmick, not a ritual**
The cursor creates a gold glow dot and pushes particles away with a basic force field. This is the default "interactive particle" demo behavior. There's no sense of the cursor being a cosmic agent — no gravitational lensing, no light-bending, no revelation. It should feel like wielding a divination tool, not poking a fish tank.

**6. No timing intelligence**
Everything runs at constant speed forever. Premium motion has phrasing: tension, release, rest, surprise. The current system never rests, never surprises, never changes pace. There's no sense that you're watching a celestial event unfold — it's just an eternal screensaver.

**7. Stars lack realism**
Real stars have: color temperature (blue-white for hot, yellow for solar, orange-red for cool), magnitude variation (most stars barely visible, a few very bright), scintillation (atmospheric twinkling, not sine wave pulsing), and airy disks (the cross-shaped diffraction spikes from bright stars). The current particles are uniform gold/purple dots.

**8. No glass or refraction**
The "liquid glass" concept is completely absent. There's no refractive distortion, no caustic light patterns, no sense of viewing the cosmos through an enchanted lens. Glass could elevate constellations from "dots with lines" to "sacred objects suspended in crystal."

**9. No depth architecture**
Everything is on the same plane. There should be a clear sense of: deep background (vast, slow) → mid-field (nebula gas, medium drift) → foreground (bright stars, fast parallax) → interactive layer (cursor effects, constellation activations). The current implementation is flat.

**10. Code is minified for no reason**
Variable names like `c`, `g`, `s`, `n`, `sc`, `hu` make the code unreadable and unmaintainable. This isn't production-minified code — it's development code that should be readable.

---

## OUTPUT 2 — REFERENCE BOARD

### Studio-level references

**1. Lusion (lusion.co)**
- What's valuable: Fluid dynamics, ray marching, photorealistic rendering in WebGL. Every effect has narrative purpose.
- Borrow: The principle that effects must serve story. Their flip-solver fluid dynamics for organic motion.
- Don't copy: Their maximalist approach. Olivia needs restraint — mystery, not spectacle.

**2. Darkroom Engineering (darkroom.engineering)**
- What's valuable: Dev-first philosophy. Performance-conscious. Clean architecture.
- Borrow: Their approach to system thinking — animation as infrastructure, not decoration.
- Don't copy: Their minimal aesthetic. We need more atmosphere.

**3. Codrops / Tympanus — UntilLabs Particle System**
- What's valuable: Transforming a photograph into a living particle system using GPGPU. Physics-driven, data-driven motion.
- Borrow: The idea that particles should be structured, not random. Particles forming meaningful shapes.
- Don't copy: The corporate context. We need mysticism, not startup energy.

**4. Three.js Journey — GPGPU Flow Field Particles**
- What's valuable: Ping-pong FBO technique for GPU particle simulation. Curl noise for organic turbulence.
- Borrow: Curl noise as the flow field driver (swirling, non-divergent, visually organic).
- Don't copy: The educational simplicity. We need production polish.

**5. Stripe.com hero**
- What's valuable: Gradient mesh that feels alive. Mouse interaction is subtle but present. No particles — just color and form.
- Borrow: The restraint. The sense that less motion, done perfectly, beats more motion done generically.
- Don't copy: The color palette or tech-startup energy.

**6. Cosmos Magazines / NASA Visualization Lab**
- What's valuable: Real cosmic imagery. Actual nebula photography. How real stars look vs how we imagine them.
- Borrow: Color accuracy (blue-white hot stars, red cool stars, green/teal nebula emission, warm dust lanes). Density variation. The Milky Way band structure.
- Don't copy: The scientific UI. We need mysticism wrapping real astronomy.

**7. Apple Liquid Glass (WWDC 2025)**
- What's valuable: Refractive displacement, specular highlights, curved surface distortion.
- Borrow: The SVG displacement map technique (feTurbulence + feDisplacementMap) for glass distortion on sacred objects.
- Don't copy: The UI system context. We use glass as oracle lens, not as toolbar chrome.

### Motion style references

**8. Terrence Malick cinematography (Tree of Life cosmos sequence)**
- Vast, slow, awe-inspiring. Camera moves through cosmic gas. Light behaves physically.
- Borrow: Pacing. Slowness = magnitude. The biggest motions should be the slowest.

**9. Denis Villeneuve's Arrival (alien language circles)**
- Sacred geometry appearing through smoke. Hovering, rotating, incomplete circles resolving.
- Borrow: The idea of zodiac glyphs as sacred geometry that resolves/forms on hover.

**10. Planetarium projection domes**
- Immersive starfield with realistic magnitude distribution. Most stars invisible, some faint, few bright. The Milky Way as a structural band.
- Borrow: Star density, magnitude distribution, color realism.

---

## OUTPUT 3 — MOTION DIRECTION SYSTEM

### Emotional Goal
The user should feel like they've stepped into a sacred observatory. Every micro-interaction should feel like the cosmos is responding to their presence — not with gimmicky reactivity, but with ancient, knowing awareness. The motion vocabulary: **revelation, resonance, orbit, breath, alignment.**

### Motion Pillars

1. **Gravity over randomness** — Everything moves with purpose. Particles follow flow fields, not random jitter. Constellations hold their positions with gravitational authority.

2. **Slowness = magnitude** — The largest motions are the slowest. The nebula drifts at geological speed. Stars breathe, not bounce. Only the smallest elements (dust, shimmer) move quickly.

3. **Orchestrated surprise** — Every 15-30 seconds, something rare happens: a meteor, a nebula brightening, a distant star flaring. These events are unannounced and brief, creating the feeling that the cosmos is alive and unpredictable.

4. **Ritual over reaction** — Hover interactions don't snap. They unfold over 800ms-1200ms with anticipation → action → settling. The cursor is a divination tool, not a pointer.

5. **Earned revelation** — Zodiac details aren't freely given. The user must approach, dwell, and wait. Information reveals in stages: distant glow → constellation lines → glyph emergence → name → sign-specific animation.

### Timing Philosophy
- **Macro motion** (nebula, deep stars): `0.003-0.01` speed factor. Near-imperceptible drift.
- **Mid motion** (gas clouds, aurora): `0.02-0.05`. Visible but stately.
- **Star breathing**: 4-8 second cycles, sine-eased, offset by depth.
- **Constellation hover response**: 800ms ease-in to full activation. 1200ms ease-out on leave.
- **Micro shimmer**: 0.5-2 second cycles for refraction caustics, dust sparkle.
- **Rare events** (meteor, flare): Every 20-40 seconds. Duration 1-3 seconds.

### Interaction Philosophy
- Mouse position is tracked but smoothed with 0.08 lerp factor (sluggish, weighty response).
- Cursor influence radius: 15-20% of viewport width (large but gentle).
- Effect at cursor center: subtle gravitational lensing (UV distortion in nebula shader), not particle pushing.
- Effect at cursor periphery: particles gently flow in orbital paths.
- Constellation activation: only when cursor lingers >300ms within constellation bounds. Instant hover is ignored.

### Depth Architecture (4 layers)

| Layer | Content | Speed | Parallax | Opacity |
|-------|---------|-------|----------|---------|
| Deep | Faint distant stars, deep nebula | Near-zero | None | 30-50% |
| Mid | Nebula gas, aurora wisps | Very slow | Subtle mouse | 40-70% |
| Near | Bright stars, constellations | Slow drift | Mouse parallax | 60-100% |
| Surface | Cursor effects, glass, UI glow | Responsive | Direct | 80-100% |

### Glass / Refraction Usage Rules
- Glass is used ONLY on constellation activation areas and navigation UI.
- It is NOT a universal background treatment.
- Implementation: SVG filter overlay (`feDisplacementMap` driven by `feTurbulence`) positioned at active constellation centers.
- Visual: like looking through a crystal ball at that region of the sky.
- Opacity: 0 when inactive, eases to 30-40% intensity on hover.
- Glass distortion is spherical (radial), not rectangular.

### Starfield Realism Rules
- Star colors: 60% warm white (#F5F0E8), 15% blue-white (#C8D8F0), 10% yellow (#F0D88A), 10% orange-red (#E8A060), 5% deep red (#D06040).
- Magnitude distribution: 70% of stars are barely visible (size < 1px, alpha < 0.2). 20% are visible. 8% are bright. 2% are very bright with diffraction spikes.
- Clustering: Stars are NOT evenly distributed. Use Poisson-disk sampling with variable density. Denser in some regions (simulating galactic arm), sparser in others.
- Scintillation: Real atmospheric twinkling is rapid and irregular, not sine-wave. Use noise-modulated alpha for bright stars.
- No star is the same color as the particle next to it.

### Zodiac Animation Rules
- Each sign has unique motion vocabulary (see Output 4).
- Signs are placed with compositional intent, not evenly spaced.
- Idle state: barely visible. 2-3 of the brightest stars visible, connection lines invisible.
- Hover approach (100-200px): faint recognition — a few more stars brighten.
- Hover contact (<100px, 300ms dwell): activation begins — lines draw, glow emerges.
- Full activation (800ms): glyph forms, sign-specific animation plays, glass lens activates.
- Leave: 1200ms graceful fade. Glyph dissolves last.

### CTA / UI Motion Rules
- Navigation: fixed, glass-morphic, but subtle. No heavy animation.
- Buttons: gentle gold shimmer on hover (2s cycle), not pulsing glow.
- Scroll indicator: slow breathing opacity, not bouncing.
- Section transitions: content fades in with 60px upward translate, 800ms staggered.

### Mobile Simplification
- Disable WebGL particle system entirely. Use CSS gradient background + static star image.
- Constellations: tap to activate (no hover). Show one at a time.
- Reduce to 500 particles maximum if WebGL is retained.
- No glass/refraction effects on mobile.
- Test for 30fps minimum on iPhone 12.

### Performance Rules
- Target: 60fps on M1 MacBook, 30fps minimum on 2019 Intel MacBook.
- Particle budget: 3000-4000 maximum.
- Uniform locations: cache on init, not per-frame `getUniformLocation`.
- Reduce particle count if `devicePixelRatio > 1.5`.
- Provide `prefers-reduced-motion` fallback: static nebula gradient + no particles.

---

## OUTPUT 4 — ZODIAC ANIMATION CONCEPTS

### Placement Philosophy
Signs are NOT evenly distributed. They follow a compositional arc — the "ecliptic band" — a subtle S-curve across the viewport. Fire signs cluster toward warm regions (lower-left nebula), water signs toward cool regions (upper-right), earth signs grounded (lower edge), air signs elevated (upper edge).

---

### 1. Aries (Mar 21 - Apr 19) — THE CHARGE
**Element:** Fire | **Quality:** Cardinal | **Motion language:** Burst, thrust, sharp emergence
- **Placement:** Upper-left, aggressive forward position
- **Idle:** Two bright stars pulse with a rapid, irregular heartbeat rhythm
- **Hover:** Stars ignite sequentially like a fuse being lit — each connection line draws as a streak of light from star to star
- **Activation:** A sharp radial burst of energy from the center, like a ram's headbutt. Particles scatter outward then snap back. The glyph appears as if stamped in hot metal — brief bright flash, then settling to warm gold.
- **Signature effect:** Radial particle burst (explosion outward, 200ms, then magnetic snap-back)
- **Color:** Hot white transitioning to molten gold

### 2. Taurus (Apr 20 - May 20) — THE EMERGENCE
**Element:** Earth | **Quality:** Fixed | **Motion language:** Slow reveal, gravity, solidity
- **Placement:** Lower-left, grounded position
- **Idle:** Stars glow with warm, steady amber. No flickering — the most stable constellation.
- **Hover:** Connection lines draw slowly like roots growing through soil. Each line takes 400ms.
- **Activation:** The constellation doesn't burst — it settles. Stars become brighter and heavier. A gentle gravitational pull draws nearby dust particles inward, accumulating density. The glyph rises from below like something unearthing itself.
- **Signature effect:** Gravitational accumulation (particles slowly drawn inward, compacting)
- **Color:** Deep amber, earth gold, warm ochre

### 3. Gemini (May 21 - Jun 20) — THE MIRROR
**Element:** Air | **Quality:** Mutable | **Motion language:** Duality, reflection, oscillation
- **Placement:** Upper area, slightly off-center (two clusters)
- **Idle:** Two star groups pulse in alternation — when one brightens, the other dims. Breathing in counterpoint.
- **Hover:** Mirror effect — nearby particles split into twin streams flowing in opposite directions around the constellation center
- **Activation:** The twin star groups connect with a bridge of light. The glyph appears with a brief double-vision effect (two overlapping copies that merge). Connection lines draw simultaneously from both sides toward the middle.
- **Signature effect:** Particle bifurcation (streams splitting into two mirrored paths)
- **Color:** Quick-shifting silver to pale gold, mercury-like

### 4. Cancer (Jun 21 - Jul 22) — THE SHELL
**Element:** Water | **Quality:** Cardinal | **Motion language:** Curling, protective, tidal
- **Placement:** Right side, slightly recessed
- **Idle:** Stars glow with a soft, pearlescent shimmer — like moonlight on water
- **Hover:** A protective shell of light begins to form — particles curve inward in spiral arcs, creating a boundary
- **Activation:** The constellation wraps itself — lines draw in a curling, spiral motion (not straight). The glyph emerges from the center of the spiral, cradled. A gentle pulse radiates outward like a ripple on still water.
- **Signature effect:** Spiral particle inflow (protective curling motion)
- **Color:** Pearl white, lunar silver, pale blue

### 5. Leo (Jul 23 - Aug 22) — THE THRONE
**Element:** Fire | **Quality:** Fixed | **Motion language:** Radiance, corona, sovereignty
- **Placement:** Left side, prominent position — largest constellation
- **Idle:** The brightest idle state of all signs. Central star (Regulus analog) has a visible corona even at rest.
- **Hover:** Light radiates outward from the central star in concentric rings, like a solar corona expanding. Other stars ignite in hierarchical order — brightest first.
- **Activation:** Full solar corona effect. The central star becomes a small sun with animated rays. Connection lines draw outward FROM the center (not between nodes). The glyph appears crowned — with a subtle arc of light above it. This is the most dramatic activation.
- **Signature effect:** Solar corona expansion (concentric light rings radiating from center)
- **Color:** Regal gold, solar white, warm amber

### 6. Virgo (Aug 23 - Sep 22) — THE WEAVE
**Element:** Earth | **Quality:** Mutable | **Motion language:** Precision, threading, crystalline order
- **Placement:** Right edge, analytical position
- **Idle:** Stars shimmer with a precise, clock-like regularity — each star's twinkle is exactly timed
- **Hover:** Connection lines don't just appear — they thread through like a needle weaving through fabric, one segment at a time in sequence
- **Activation:** A lattice of faint geometric lines briefly appears around the constellation — like a crystalline structure revealing its hidden order. The glyph materializes with perfect rotational symmetry, piece by piece.
- **Signature effect:** Sequential line-threading (each connection draws one at a time in order)
- **Color:** Cool silver, analytical blue-white, precise gold

### 7. Libra (Sep 23 - Oct 22) — THE BALANCE
**Element:** Air | **Quality:** Cardinal | **Motion language:** Equilibrium, oscillation, symmetry
- **Placement:** Left lower area, centered/balanced position
- **Idle:** Two star groups sway gently like scale pans — one rises as the other falls, in perpetual slow oscillation
- **Hover:** The oscillation slows and begins seeking equilibrium. Particles arrange symmetrically around the center axis.
- **Activation:** Perfect stillness. The scales reach balance and hold — a moment of cosmic equilibrium. The glyph appears at the fulcrum point with a gentle settling motion. Connection lines draw simultaneously from both sides, meeting in the middle.
- **Signature effect:** Damped oscillation resolving to stillness
- **Color:** Rose gold, harmonious lavender, balanced warm/cool split

### 8. Scorpio (Oct 23 - Nov 21) — THE DEPTH
**Element:** Water | **Quality:** Fixed | **Motion language:** Intensity, penetration, hidden revelation
- **Placement:** Lower-left, deep position with the most stars (complex form)
- **Idle:** Most stars are barely visible — this constellation hides in darkness. Only 1-2 stars faintly pulse with deep red.
- **Hover:** Stars reveal in sequence from the body toward the tail, like something emerging from shadow. The reveal is slow and deliberate — this sign doesn't hurry.
- **Activation:** The tail star (Antares analog) flares intensely — a deep crimson pulse. The glyph appears to surface from beneath, as if rising through dark water. Faint particles are drawn downward (gravitational sinking, not floating).
- **Signature effect:** Downward gravitational pull (particles sink, not rise)
- **Color:** Deep crimson, obsidian, dark garnet, momentary white flare

### 9. Sagittarius (Nov 22 - Dec 21) — THE ARC
**Element:** Fire | **Quality:** Mutable | **Motion language:** Trajectory, launch, directional energy
- **Placement:** Lower center, the "horizon" position — aimed upward
- **Idle:** A single bright star marks the arrowhead, pulsing with focused intensity
- **Hover:** An energy arc begins forming — like a bowstring being drawn. Particles along the arrow's trajectory begin to glow sequentially.
- **Activation:** Release. A streak of light fires from the bow-star along the arrow's trajectory, leaving a phosphorescent trail that fades over 2 seconds. The glyph appears at the peak of the arc's trajectory. The most kinetic activation of all signs.
- **Signature effect:** Directional light streak (arrow release trajectory)
- **Color:** Bright amber, fire gold, trail fading to deep blue

### 10. Capricorn (Dec 22 - Jan 19) — THE ASCENT
**Element:** Earth | **Quality:** Cardinal | **Motion language:** Climb, structure, crystallization
- **Placement:** Lower-right, mountain-base position, oriented upward
- **Idle:** Stars have a mineral quality — sharp, precise points without soft glow. The steadiest idle after Taurus.
- **Hover:** Stars brighten from bottom to top, like ascending a mountain. Each level takes longer than the last (decelerating climb).
- **Activation:** A crystalline structure briefly forms — sharp geometric lines radiating from nodes, like frost patterns on glass. The glyph appears at the summit. Motion is upward and earned, not given.
- **Signature effect:** Bottom-to-top sequential reveal (ascending activation)
- **Color:** Steel silver, mountain grey, ice blue, summit gold

### 11. Aquarius (Jan 20 - Feb 18) — THE WAVE
**Element:** Air | **Quality:** Fixed | **Motion language:** Flow, disruption, electric current
- **Placement:** Right lower area, flowing position
- **Idle:** Stars pulse with an irregular, electric rhythm — like synaptic firing, not breathing
- **Hover:** A wave propagates through the constellation — each star triggers the next with a 50ms delay, creating a visible wave pattern
- **Activation:** An electric discharge effect — thin, branching lines of light flash briefly between and around the constellation (like contained lightning). The glyph appears with a digital glitch — a momentary horizontal displacement that resolves. The most "modern" feeling activation.
- **Signature effect:** Propagating wave (sequential activation with visible transmission)
- **Color:** Electric cyan, ultraviolet blue, momentary white flash

### 12. Pisces (Feb 19 - Mar 20) — THE DISSOLUTION
**Element:** Water | **Quality:** Mutable | **Motion language:** Fluidity, dissolve, merge, dream
- **Placement:** Far right, liminal edge position — at the boundary of visibility
- **Idle:** The most ethereal idle state. Stars shimmer with aqueous refraction — as if seen through water. Very faint, almost imagined.
- **Hover:** Particles in the area begin to drift with a current-like flow, as if underwater. The constellation seems to undulate slightly.
- **Activation:** The two fish-chains of stars glow with a bioluminescent quality. Connection lines draw as flowing curves (not straight lines — bezier interpolation). The glyph appears soft and slightly blurred, as if seen through a dream. Nearby particles become temporarily iridescent.
- **Signature effect:** Bezier-curved connections (flowing lines instead of straight)
- **Color:** Iridescent ocean, bioluminescent teal, dream-soft lavender

---

## OUTPUT 5 — IMPLEMENTATION PLAN

### Architecture

Split the monolithic `Starfield.tsx` into a modular system:

```
src/components/cosmos/
  CosmosCanvas.tsx      — Main component, mounts WebGL + overlay canvases
  engine/
    renderer.ts         — WebGL setup, program management, draw loop
    nebula.ts           — Nebula shader uniforms + configuration
    starfield.ts        — Star particle system (GPU buffer management)
    constellations.ts   — Constellation data + per-sign animation logic
    interactions.ts     — Mouse tracking, smoothing, gravitational influence
    events.ts           — Rare celestial events (meteor, flare, etc.)
  shaders/
    nebula.frag         — Nebula fragment shader
    quad.vert           — Fullscreen quad vertex shader
    star.vert           — Star particle vertex shader
    star.frag           — Star particle fragment shader
  data/
    constellations.ts   — Constellation coordinates + metadata
    zodiac-animations.ts — Per-sign animation configs
```

### What stays
- WebGL2 rendering approach (correct choice for this volume)
- FBM noise nebula shader (good foundation, needs refinement)
- Canvas 2D overlay for constellation labels (pragmatic, works well)
- Additive blending for star particles

### What gets rewritten
- **Star particle system:** Replace uniform GL_POINTS with magnitude-distributed stars using realistic color temperature. Add diffraction spikes for bright stars via fragment shader.
- **Nebula shader:** Add directional illumination (light source position), volumetric depth impression, and mouse-driven gravitational lensing (UV distortion).
- **Constellation system:** Replace identical hover behavior with per-sign animation functions. Add dwell-time gating (300ms before activation begins). Add staged revelation (proximity → recognition → activation → full).
- **Mouse interaction:** Add lerp-smoothed cursor tracking, gravitational UV lensing in nebula shader, and remove the crude radial push.

### What gets added
- **Rare events system:** Timer-based meteor showers, star flares, nebula brightening events.
- **Glass refraction layer:** SVG filter element with `feDisplacementMap`, positioned at active constellation via CSS transform, opacity animated with constellation hover state.
- **Star magnitude classes:** Background dust (tiny, faint), field stars (small, moderate), bright stars (visible, colored), beacon stars (bright, diffraction spikes).
- **Constellation-specific animations:** 12 unique activation functions based on Output 4 concepts.
- **`prefers-reduced-motion` support:** Static gradient + constellation data visible without animation.

### Technology choices
- **Cosmos engine:** Raw WebGL2 (already working, no need for Three.js overhead)
- **Constellation overlay:** Canvas 2D (for lines/text) + SVG (for glass refraction filter)
- **UI animations (buttons, nav, sections):** Framer Motion (already installed)
- **Glass effect:** SVG `feTurbulence` + `feDisplacementMap` filter (performant, no WebGL FBO needed)
- **Scroll-triggered content:** Framer Motion `useInView` or Intersection Observer

### Performance strategy
- Cache all `gl.getUniformLocation` calls on init
- Use `gl.bufferSubData` for updating particle positions instead of full reallocation
- Throttle constellation hover calculations to every 2nd frame
- Reduce star count on high-DPI displays (scale by 1/dpr)
- Gate rare events with `requestIdleCallback`
- Provide fallback for WebGL failure: CSS gradient background

---

## OUTPUT 6 — CODE CHANGES

### Approach
Rather than rewriting everything at once (which risks the "compiling forever, nothing visible" problem we've seen), I'll implement in phases:

**Phase 1 (this session):** Improve nebula depth + star realism + mouse gravitational lensing + cache uniforms + clean up code readability. This gets the biggest visual improvement with lowest risk.

**Phase 2 (next session):** Constellation-specific animations (Output 4 concepts). Add dwell-time gating, staged revelation, per-sign motion functions.

**Phase 3 (next session):** Glass refraction layer. SVG displacement map positioned at active constellations. Rare celestial events.

This lets us ship visible improvements now without breaking what works.
