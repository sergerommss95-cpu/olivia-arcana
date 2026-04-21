# Rethinking the veil with shaders

**Status: strategic proposal, not yet built.**
**TL;DR: stop asking the user to perform a gesture. The veil is friction wearing the mask of ceremony. Move to an *ambient shader atmosphere* where the card is always present and the page itself breathes. If we must keep a gesture, make it feel like optics, not like a stage trick.**

---

## 1. Why the current veil underperforms

Being honest about what we built:

1. **The metaphor is literal and dated.** "Cloth hangs over a card and you lift it" is a stage-magic trope. In 2018 it felt fresh; in 2026 it reads as skeuomorphic. Every luxury brand is moving toward shader-first atmospheres (Arc, Linear, Vercel OG) because fragment shaders feel *native to the medium*, not imported from a physical prop.
2. **It's CPU-bound.** PBD cloth is 48×64 particles × 10 solver iterations per frame × main-thread JavaScript. A fragment shader doing the same visual work is one triangle on the GPU.
3. **Bundle cost is wildly out of proportion.** ~1100 lines of `VeilRevealScene.ts` + PBDCloth + VeilAudio + postprocessing chain + texture loader = ~500KB of download to render a cloth falling off a card. A shader-based veil is ~200 lines of GLSL + ~100 lines of React wrapper. Total bundle delta: ~30KB.
4. **It's a one-note interaction.** Hold → cloth falls → done. There's no evolution after the first view. Ambient designs beat event-driven designs for repeat visitors because they *keep being alive*.
5. **"Press and hold" is friction in a mask.** It's not ceremony; it's a micro-chore. The brand is *editorial cosmic almanac*, not *escape room*. An almanac opens; it doesn't gate you on dexterity.

---

## 2. The core shift: from *reveal* to *atmosphere*

Today the veil is asking the wrong question: *"how should the card be revealed?"*

The right question is: *"how does today's card live on this page?"*

An almanac doesn't hide the contents; it presents them under weather. Reframe:

- **The card is always present.** No cover, no gate, no hold.
- **The page breathes around it.** A shader atmosphere layered behind the card shifts slowly with the time of day, the moon phase, the cursor's proximity.
- **Attention sharpens the card, distance softens it.** Move your cursor close → the card is fully clear. Look elsewhere → atmospheric distortion settles back over it. No binary reveal state — a continuum.

This is how `/v2` can *actually* feel different from `/`, not just with a prettier veil but with a completely different posture toward the user: editorial, calm, generous.

---

## 3. Four shader directions (picking from your resource list)

I studied all four resources you linked. Here's what each one is *actually good for* in our context, ranked by fit.

### ★ Direction A — Ambient mesh-gradient atmosphere (`paper-design/shaders`)

**What it is.** A fullscreen-quad fragment shader using `paper-design/shaders`' `meshGradient` or `liquidMetal` as the *site background*, not a veil. The card is always fully visible, sitting on top. The gradient shifts slowly with time — it's the page's weather.

**How it feels.** The way the paper-design homepage feels. Living light. Colors drift like a Rothko moving in slow motion. The card is the still point in a moving composition.

**Why it's a fit.** 
- On-brand: matches the editorial-almanac posture (card is *printed*, weather is *atmospheric*).
- Zero gesture required.
- Extends the aesthetic to the whole site, not just the card.
- `paper-design/shaders` is zero-dependency canvas, ~8KB gzipped, drop-in React component. Ships in one afternoon.

**Implementation sketch.**
```tsx
import { MeshGradient } from "@paper-design/shaders-react";

<section>
  <MeshGradient
    colors={["#06041a", "#1a0e2e", "#2a1a50", "#E8C96A"]}
    speed={0.08}
    style={{ position: "absolute", inset: 0, zIndex: 0 }}
  />
  <InlineTarotCard card={card} /> {/* no veil — just the card */}
</section>
```

**Lines of code to ship: ~80** (including the new `InlineTarotCard` that replaces `InlineVeilReveal`).

---

### ★★ Direction B — "Living paper" with cursor-lens clarity (custom GLSL)

**What it is.** A thin translucent veil that's ALWAYS visible over the card — swirling noise, subtle ink-like flows — but *clears locally under the cursor*. No hold threshold, no gate. Move your pointer toward the card and it resolves. Move away and the page settles back into gentle obscurity.

**How it feels.** A tarot card printed on living rice paper. The page is alive. Your attention is the lens. The card is always there; you just have to look at it.

**Shader core** (fragment only, ~50 lines):
```glsl
// Inputs: card texture, cursor xy, time
uniform sampler2D uCard;
uniform vec2 uCursor;  // 0..1 uv
uniform float uTime;

float fbm(vec2 p) { /* standard fbm */ }

void main() {
  vec2 uv = vUv;

  // Animated noise — the "paper"
  float n = fbm(uv * 2.4 + uTime * 0.08);

  // Cursor attention lens — radius ~0.22 uv units
  float attention = 1.0 - smoothstep(0.0, 0.22, distance(uv, uCursor));

  // Opacity of the veil at this pixel
  // High where noise is thick, zero where cursor is close
  float veilMask = clamp(n * 0.85 - attention * 0.95, 0.0, 1.0);

  // Color of the living paper — void + subtle gold shimmer on folds
  vec3 paperColor = mix(
    vec3(0.024, 0.016, 0.102),   // void
    vec3(0.91, 0.79, 0.42),      // gold shimmer
    smoothstep(0.6, 0.95, n)
  );

  vec4 card = texture2D(uCard, uv);
  gl_FragColor = mix(card, vec4(paperColor, 1.0), veilMask);
}
```

**Why it's a fit.**
- Replaces a binary gate with a continuous interaction — every pixel is on a spectrum.
- Brand-perfect (gold shimmer on the "folds", cursor attention as a metaphor for reading).
- Works on touch too: tap-to-focus, no long-press required.
- ~150 lines total. No physics. No postprocessing chain.

**Source of truth.** `paper-design/shaders` can't do this alone (it's a preset library). This is a custom GLSL fragment shader mounted via plain WebGL or `xemantic/shader-web-background`. Shadertoy has several fbm+cursor-lens starting points (search "iMouse fbm reveal").

---

### Direction C — Constellation assembly (`shadergradient`-adjacent)

**What it is.** Reject "cover the card" entirely. The card image is *written in stars*. ~4000 GPU points start scattered across the viewport as a starfield. Over 2–3 seconds they migrate to pixel targets sampled from the card, drawing the card in constellation-style. User does nothing; it happens.

**How it feels.** The brand name is literal. "Written in your stars" — the card *is* written, letter by letter, from the sky.

**Why it's a fit.**
- Most brand-native option we have.
- Extends to transitions: "Draw another" dissolves the card back to stars, which then re-assemble as the new one.

**Downsides.**
- Higher LOC (~400). Point-cloud morphing shader isn't trivial.
- Arrival animation runs once per page load; doesn't help repeat atmosphere the way A or B do.
- Could feel over-theatrical (we already ditched theatre once).

**Use this as: the transition *between* cards inside Direction B**, not as the main idea.

---

### Direction D — Keep hold-to-reveal, but replace cloth with liquid (Shadertoy ink-bleed)

**What it is.** If you want to keep the gesture. Cloth becomes ink: user holds, ink recedes from the cursor outward in an fbm-warped spreading pattern, card shows through.

**Why it's a fit.**
- Same UX as today (gesture is familiar).
- Completely different visual vocabulary.
- Easy port from Shadertoy — [this ink-bleed shader](https://www.shadertoy.com/results?query=ink+bleed) is a ~40-line fragment.

**Why I'm down-ranking it.**
- Keeps the friction we should be removing.
- Still framed as "veil over card" — doesn't address the root diagnosis in §1.

**Use this as: the fallback if A/B don't land.**

---

## 4. What I'd ship first

**Direction A as the site-wide atmosphere, then Direction B as the hero card treatment.**

Concretely:

1. **Week 1, day 1.** Add `paper-design/shaders` as a dep. Replace the current `Starfield` + fixed-position cosmic overlays with a single `MeshGradient` background layer driven by the existing `TimeOfDayTheme` palette.
   - Dawn palette gets warm amber + coral mesh
   - Day gets ivory + pale gold mesh
   - Dusk gets violet + orchid
   - Night gets deep indigo + silver
   - Single GL context, ~8KB lib, zero per-frame JS overhead.

2. **Week 1, day 2–3.** Build the "living paper" card component (Direction B) as a drop-in replacement for `InlineVeilReveal`. Card always present. Cursor-attention clears the paper. No hold, no gate, no "Draw another button" — it's always there, swipe-or-arrow key cycles cards.

3. **Week 1, day 4.** Retire `VeilRevealScene.ts`, `VeilRevealWrapper.tsx`, `PBDCloth.ts`, `VeilAudio.ts` from the primary path. Keep `/academy/card-of-the-day` pointing at them for the "throwback full ceremony" (optional — could delete outright).

4. **Week 2 (stretch).** Add Direction C (constellation assembly) as the *transition* between cards inside Direction B. When user cycles, card dissolves to particles, stars assemble as the next card.

**Total bundle delta from today:**
- Remove: `VeilRevealScene` + PBD + postprocessing path (~500KB in the flagship chunk).
- Add: `paper-design/shaders` (~8KB) + custom living-paper fragment (~2KB).
- **Net: ~490KB smaller.** Faster LCP, faster INP, same-or-better aesthetic.

---

## 5. Why this is the right call (philosophical)

We've been designing the homepage around *performing magic for the user*. That's a children's-party-magician stance. The correct brand posture for an editorial cosmic almanac is *being a place where magic lives*.

Magic that lives doesn't need to be summoned. It doesn't gate the reader with a dexterity test. It's present in the weather of the page — the gradient drifts, the paper breathes, the card is there to be read when read.

The cloth was us saying *"look what we can do"*. The living paper is us saying *"come in, it's already happening"*.

Better design is usually subtraction.

---

## 6. What to build first?

Three options, I'd pick one and prototype it this week:

1. **Direction A only** — site-wide mesh gradient. Minimum viable aesthetic upgrade. ~4 hours.
2. **Direction A + B** — mesh gradient background + living paper card. The full vision. ~1.5 days.
3. **Direction D** — ink-bleed hold-to-reveal. Keeps the existing UX but swaps cloth for ink. ~6 hours. Safe middle ground if you want to A/B the *visual* without also changing the *interaction*.

My vote: option 2. Ship the actual vision, let the A/B run against the current / and the poster-free /v2. Winning version becomes the site.

**Tell me which direction and I'll build it on a new branch.**
