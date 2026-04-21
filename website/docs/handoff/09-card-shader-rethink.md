# Card shader — rethink (scoped to the card area only)

**Status: proposal, awaiting direction.**
**Constraint: site background stays as-is (GlobalBackground / starfield). All shader work is scoped inside the card frame, nothing leaks to the site.**

---

## What went wrong last time

1. **Over-scoped.** Built a fullscreen `MeshAtmosphere` that washed the whole site in a yellow/violet gradient. The brand is dark-mode cosmic void; the wash destroyed that. *Now reverted.*
2. **LivingPaperCard opacity was inverted.** Shipped with 55–90% paper over the card. The card was effectively hidden. *Now fixed — 12–22% baseline, cursor clears to near-zero.*

Both fixes deployed. But the user asked for a rethink of the *approach*, not just the numbers — so here are real alternatives.

---

## What the card *is* in the brand

A tarot card is an object. It has weight, edges, a face, a back. It's printed. The right shader treatment should reinforce that the card is a real thing, not a slot for pixels. Our failure modes are:

- **Treating the card like a slideshow.** (Just fade it in / wipe it in.)
- **Treating the card like a prop.** (Cover it with cloth, lift the cloth.) — the original veil
- **Treating the card like a surface.** (Put texture *on* it that lives and breathes.) — what we're after

All three of the options below are "card-as-surface" directions. Different vocabularies.

---

## Option A — Caustics-lit card

> *The card is printed on a page sitting under shifting light. The light moves like ripples at the bottom of a pool.*

**What it is.** The card image stays fully visible, always. A shader **caustics pattern** (the bright-line interference patterns you see on a pool floor) plays across the card's surface at low intensity. Cursor movement shifts where the "light source" sits, so the caustics drift with attention. No hold, no gate — just living light on a real object.

**Shader core.** Single fragment, ~35 lines. Caustics via layered sin/cos at shifting offsets. Multiplicative blend onto the card so it feels like lighting, not a filter.

**Why it works for tarot.**
- Caustics are the visual cue for *things lit from above by refracted light* — candles on a reading table, water in a scrying bowl. Brand-native.
- Subtle by default (multiplicative blend barely touches the card) and more dramatic under cursor.
- Card is always readable.

**Feels like.** A card sitting at the bottom of a shallow dish of clear water, catching candlelight.

**Effort.** ~3 hours.

---

## Option B — Gold-ink living page (fixed version of what's on /v3 now)

> *The card is printed on handmade paper. Gold-flecked ink drifts across the page. Your attention settles the ink.*

**What it is.** Current /v3 LivingPaperCard, now with the corrected 12–22% paper opacity. Card is clearly visible; gold-ink fbm drifts over it; cursor clears it locally. Gold rim glow around the cursor's attention field.

**Refinements on top of today's fix.**
- Add a **drop-shadow frame** around the card so it sits *on* the page, not embedded in it.
- Add a **slow slight rotation** of the whole card (±0.4°) as if it's resting on paper, not screwed down. Makes it feel like a physical object.
- Tune the ink color to shift per time-of-day (same palette as the existing TimeOfDayTheme).

**Feels like.** Reading an almanac page. The ink is part of the paper, not a cover.

**Effort.** ~2 hours (refine current component).

---

## Option C — Smoke-lifted reveal (shader veil, not cloth)

> *You still hold to reveal. But instead of cloth physics, the cover is shader smoke that lifts and dissipates under the cursor.*

**What it is.** Keeps the "hold to reveal" ceremony the current veil has. Replaces the PBD cloth + wipe shader with a single fragment shader:
- Starting state: card is 100% covered by animated smoke/ink (fbm + domain warp).
- Hold ~1.3s → a pressure point forms under the cursor, smoke disperses outward from it, card reveals.
- Release to reset.
- On mobile: touch-and-hold same behavior.

**Why this option exists.** If you actually want to keep the ceremony — the moment of reveal — this preserves that UX but ditches the cloth physics and the ~500KB bundle. ~60 lines of GLSL total.

**Feels like.** The cover is made of smoke instead of fabric. Same gesture, different vocabulary, much lighter. Less "theatrical stage trick", more "ritual smoke clearing".

**Effort.** ~5 hours.

**Tradeoff.** Brings back the hold-to-reveal friction that the ambient options (A / B) remove. If the friction is the point — ceremony as value — pick this.

---

## Option D — Edge-lit card, no shader on the surface

> *The card is fully, always visible. A shader lives in a ring around the card's edge — gold-dust caustics, or aurora, or a slow liquid-metal rim.*

**What it is.** Card image is printed flat in the frame, untouched. The *frame around the card* becomes a shader surface — a thin 2–6px aura + an outer 40px falloff — where things happen:
- Liquid-metal ring that slowly changes color with ToD
- Gold dust motes that orbit the card
- Aurora shader that leaks past the edges

**Why this is interesting.** It respects the card as a finished artifact. No paint on the card itself. The atmosphere happens *around* it, which is a far more "cosmic object" feeling than "let me put a filter on the artwork".

**Feels like.** A tarot card mounted in a reliquary, with a small field of energy around it.

**Effort.** ~4 hours (new shader primitive; the card itself stays a plain `<img>`).

---

## My recommendation

**Option A (caustics).** Here's why:

- Card is always fully readable. Zero friction. Zero risk of "where did my card go" moments like /v3 today.
- Caustics are one of the strongest brand-fits in the shader toolbox for tarot (candlelight, scrying bowls, refracted night-sky light).
- Shortest effort (~3 hours).
- Lives comfortably on top of the card image with multiplicative blend — never blocks, only illuminates.
- Cursor interaction is "where does the light land?", which is a natural metaphor for attention.

**Second choice: Option D (edge-lit).** If you want the card completely untouched and the shader work to live around it — a more conservative but very clean move.

**Third: Option C (smoke reveal).** Only if you actively want to keep the hold-to-reveal ceremony. I'd argue the ambient options beat the ceremony here, but it's a defensible call if you think the gesture carries meaning.

---

## What I wouldn't do

- **Not another fullscreen atmosphere.** That's what went wrong last time. The brand is already dark-mode cosmic; adding a second background layer fights it.
- **Not a shader on the card that *hides* it.** Any approach where "the card is hidden until..." is a regression toward the veil.
- **Not another full Three.js scene.** We already have the veil scene at /academy/card-of-the-day for the "full ceremony" throwback. The card-on-the-homepage should be a single fragment shader, <10KB of JS.

---

## Next step

Tell me A, B, C, or D. I'll rebuild just the card component on the existing `/v3` branch — site background stays put, shader work is scoped to the card frame only, ~1 session of work per option.
