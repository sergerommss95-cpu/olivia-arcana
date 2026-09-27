# Olivia Arcana — motion refinement research

14 September 2026 · Source review and primary-source research

The priority is to make Olivia's approach over the water feel immediate, then let that scene resolve into a composed editorial page. Preserve her zoom, figure registration, reflection and native scroll. A large zodiac backdrop and several simultaneous effects weaken that focal point.

This review inspects the restored Arrival implementation before the current refinement. It identifies measurable causes and implementation hypotheses; it does not report a frame-rate measurement or a new browser test. The recommendations use the optimize skill's measure-before/after workflow.

## Seven changes, ranked by impact

### 1. Remove the delay between scrolling and Olivia's response

**Source finding:** `TheArrival.tsx` uses `1 - exp(-dt * 8)` to chase the scroll target. Its time constant is 125ms, taking approximately 375ms to close 95% of a sudden gap. This creates trailing motion even if rendering never drops a frame.

**Action:** use direct or tightly damped progress while the user scrolls. Keep a softer curve for the explicitly requested assisted ride. Read the scroll position once per frame and use the same progress for figure size, portal, copy and chapter indicator. Keep the existing canvas attached to its sticky scene; adding another global scroll controller would create another clock. Lusion's own engineering example explains why native scrolling and WebGL's animation frame can become unsynchronized, and documents the tradeoffs of fixing that relationship. [Lusion: WebGL Scroll Sync](https://github.com/lusionltd/WebGL-Scroll-Sync)

**Verify:** rapid wheel, touch and reverse-scroll input should keep the scene close to the gesture; record input response separately from dropped frames.

### 2. Spend the GPU budget on Olivia and the water

**Source finding:** the full-screen fragment shader calculates sanctuary, portal, spray and rush effects even before their visible phase. At 1280×720 with its 1.6 pixel-ratio cap, the buffer contains approximately 2.36 million pixels; this is a pixel-count calculation, not a performance result.

**Action:** gate expensive work by the uniform scene phase. Before the opening, render the plate, figure, reflection and wake; when the portal fills the view, stop computing layers it fully obscures. Keep the same final color grading in every path. Give the canvas a maximum pixel budget and lower its internal resolution on constrained devices while keeping CSS dimensions and DOM text crisp. MDN explicitly supports trading back-buffer size for speed. [MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

**Verify:** compare the same scroll recording before and after; check the phase boundaries for lighting pops and Olivia's hem/reflection for lost detail.

### 3. Stop rewriting the interface during stationary water motion

**Source finding:** `paint()` updates several CSS properties, chapter classes, `aria-current`, progress attributes and the intro's inert state on every frame, even when only `uTime` changes.

**Action:** separate scene rendering from interface updates. Write progress-dependent styles only when progress changes; change chapter and focus semantics only when their state changes. Cache layout measurements outside the draw loop. Stop rendering offscreen, hidden, paused or in reduced motion, and delete owned GPU resources on teardown. This reduces competing work without flattening the sea. [Google: Rendering performance](https://web.dev/articles/rendering-performance), [MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

### 4. Compose a cinematic exit into the editorial section

**Source finding:** the final sanctuary and arrival text belong to the sticky scene; the service plates then begin as a separate composition. There is no shared exit progress tying those surfaces together.

**Action:** use one exit value across the final roughly 15% of the sequence. Let the sanctuary settle, fade the lower water into the exact navy of the next section, and settle out the scene controls. A fine rule and the first service kicker should become the next focal point as the sticky stage releases naturally. Bring the real next section into view immediately, with no extra viewport of waiting. Keep this handoff reversible when scrolling upward. Animate DOM opacity and a small translation; avoid a new full-screen shader, a blur transition or another zodiac scene.

This proposed choreography takes the useful principle from Cartier's production account: each chapter has its own identity while transitions connect it to the next. It does not copy that project's visuals or imply measured usability equivalence. [Mooders: Cartier Watches and Wonders](https://mooders.net/en/works/cartier-watches-and-wonders/), [Google: High-performance CSS animations](https://web.dev/articles/animations-guide)

### 5. Give the background a subordinate role

**Action:** remove the enormous persistent zodiac from ordinary editorial sections. Use solid nocturnal grounds, restrained paper grain and a small static engraved mark where it supports the layout. Reserve the legible, fully plotted sky for the actual chart/Atlas and Olivia's water for the opening. Keep real chart data and zodiac geometry unchanged.

This is an art-direction recommendation, not a claim that a zodiac graphic is inherently slow. It reduces visual competition and permits fewer large composited surfaces. Google's rendering guidance cautions that extra layers consume memory and bandwidth. Lusion's Infinite Passerella offers a relevant first-party example of concentrating craft on a distinctive subject—in that case clothing textures and models. [Google: Why some animations are slow](https://web.dev/articles/animations-overview), [Lusion: Infinite Passerella](https://lusion.co/projects/infinite_passerella/)

### 6. Let each service section arrive as one composition

**Action:** coordinate the numeral, heading, brief description and artwork as a single entrance. Use a short opacity/translation reveal, then leave text still. Avoid independent headline, card, background and cursor loops all competing for attention. Keep the preceding section's navy and rule alignment through the seam; vary scale and composition within that system. Preserve all service links and the direct hero actions. Google recommends transform/opacity and checking paint or layout costs before animating other properties. [Google: High-performance CSS animations](https://web.dev/articles/animations-guide)

### 7. Judge polish with repeatable motion checks

**Action:** record the same full scroll at desktop and phone sizes, including the approach, opening, exit and first service. Compare frame-time consistency, long tasks, rendering work and input lag. Repeat with the page paused, hidden then restored, reduced motion enabled, and after route navigation. Confirm mobile browser chrome changes do not repeatedly reset the canvas or scene height. A 60Hz display has 16.7ms per frame; Google recommends leaving browser overhead by keeping application work around 10ms. Those are diagnostic budgets, not claimed results. [Google: Rendering performance](https://web.dev/articles/rendering-performance)

Completion should mean that Olivia still visibly approaches over the water, the scene follows the user's gesture, the editorial content arrives without a visual break, and the measured recording supports the claimed improvement.

## Scope and evidence

All web references were opened or retrieved on 14 September 2026. Google and MDN supply engineering guidance; Lusion and Mooders supply their own implementation or production accounts. Studio examples establish transferable mechanisms, not an independent ranking of “best” sites. Existing build/tests remain useful regression evidence, but do not establish animation smoothness.
