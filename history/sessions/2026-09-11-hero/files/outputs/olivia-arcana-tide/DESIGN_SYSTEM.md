# Olivia Arcana — The Tide Opens

**A living entrance from the original celestial sea into the Oracle.** Olivia approaches the reader; her wake rises into a large moonlit opening; the view passes through to a quiet place to choose a question.

This is a standalone design prototype and Claude implementation handoff. It does not modify or deploy oliviaarcana.com. The proposed scope is the opening sequence and its reading entrance; the site's functioning astronomy, readings, accounts, and lower-page content remain separate.

## Open and review

- Open **[index.html](index.html)** directly in a browser. Images, fonts, styles, and rendering code are embedded for local review without a build or network connection. Product links require internet access.
- Use **[modular.html](modular.html)** with **[style.css](style.css)**, **[app.js](app.js)**, **[world.glsl](world.glsl)**, and the **assets/** directory for implementation. Serving this folder locally is preferable when editing the modular version. `app.js` already contains the compiled-in shader string; `world.glsl` is the readable shader source, not a runtime fetch.
- The **mockups/** directory contains captured scene stages and desktop/mobile reading-entrance views. The animation itself is best reviewed in the HTML.
- Completed browser verification is recorded in **[QA.md](QA.md)**.

## Direction and reference review

The owner's selected concept is **The Tide Opens**. Preserve the supplied blue celestial photograph and Olivia's identity, then extend its water and moonlight into the transition. The atmospheric treatment is matte ultramarine, pale blue-white light, fine grain, and restrained gilt. Avoid introducing a second unrelated visual language around the scene.

The earlier Claude brief explains the product and its former night/glass/aurora system. It is useful context, not a requirement to retain every previous motion rule. The selected concept deliberately introduces a reversible cinematic passage. It keeps the established editorial typography, reflective tone, and limited warm accent.

| Reference | What was reviewed | How it informs this concept |
|---|---|---|
| Existing Claude-built homepage and atlas | Inspected locally at port 3300 during this task | Preserve the product's almanac context, current arrival component, and functioning instruments. |
| [Lando Norris](https://landonorris.com) | Live site directly reviewed | Scene pacing and the relationship between an immersive opening and usable navigation. |
| [Lusion](https://lusion.co) | Primary homepage description reviewed; visual capture remained on its loader | A reference for the studio's immersive-web direction. The full visual flow was **not** tested or validated. |
| [Bruno Simon](https://bruno-simon.com) | Primary site and its driving metaphor | A continuous spatial metaphor that makes navigation feel like part of the world. This prototype does not implement a driving system. |

These are interaction references. Their images, branding, and source implementations were not copied.

## Scene and asset provenance

| Delivered file | Source and purpose |
|---|---|
| `assets/original.webp` | Lossless WebP encoding of the supplied original, `34EE5F88-5FF7-4271-8DB0-ADE059019032.PNG`, 1672 × 941. This is the original RGB source for Olivia and the static poster. |
| `assets/olivia-original-matte.png` | Copy of `<LOCAL_HOME>/olivia-arcana/hero-lab/assets/olivia-cutout-raw.png`, 320 × 310 RGBA. The shader uses its **alpha**, not its RGB, to isolate Olivia. |
| `assets/sea-clean-plate.webp` | Prepared background without the original stationary figure, from `work/generated-v2/arrival-background.png`. It provides the moving sea behind the independently composited figure. |
| `assets/inner-sanctuary.webp` | Newly generated inner-sanctuary artwork for the other side of the opening. It is a distinct scene, not a remaster of Olivia. |
| `assets/fonts/` | Local Cormorant Garamond, DM Sans, IBM Plex Mono, and a Cyrillic IBM Plex Sans fallback. Font license texts are included under `assets/fonts/licenses/`. |

**Olivia is not regenerated.** Her visible color is sampled directly from `original.webp`; the raw cutout contributes opacity only. Its registered crop origin is **x = 930, y = 480**, with size **320 × 310**. The occupied nonzero-alpha bounds map to original pixels **[971, 527, 1157, 761)**. The shader uses that 186 × 234 region, with a contact anchor near original **(1060, 756)**. There is no 34-pixel vertical registration correction.

The raw cutout RGB contains small changes and dark fringe contamination, which is why it is not used as the color texture. A localized alpha adjustment removes some attached cloud inside the crescent without replacing face pixels. The identity-preservation claim applies to the source sampling: texture interpolation, alpha blending, mild hem displacement, reflections, and the final grain still affect the displayed composite. The entire rendered frame is not claimed to be pixel-identical to the supplied photograph.

The original portrait is only roughly **200 pixels tall**; its full occupied region including halo and fringes is 234 pixels. Desktop enlargement is capped at **2.2×**. On mobile, the figure occupies at most about 40% of scene height, giving approximately **1.6×** enlargement in the intended portrait framing. These limits preserve the original identity at the cost of visible softness. A sharper close-up would require a higher-resolution original, not invented facial detail.

## Visual tokens

| Token | Value | Role |
|---|---|---|
| `--abyss` | `#0a0d38` | Deepest shadow, button text, legibility scrims |
| `--night` | `#10134d` | Page ground and reading entrance |
| `--lapis` | `#20279b` | Saturated ultramarine identity color |
| `--moon` | `#e8e9ff` | Primary text and moonlit highlights |
| `--mist` | `#b7bce9` | Supporting text and quieter details |
| `--gilt` | `#e0b768` | Primary action, selected intent, progress, focus |
| `--rule` | `rgba(232,233,255,.25)` | Fine dividers and boundaries |
| `--page-pad` | `clamp(24px,4.5vw,86px)` | Main horizontal spacing; 19px on the narrowest layout |

The blue scene carries the spectacle. Gilt is a small signal for meaning and action, not a floodlight. Moonlit water is cool silver-blue. The reading entrance uses a bare dark ground, fine ruled rows, and type; it does not become a dashboard of glass cards. The masthead action has a light transparent tint for contrast, without making glass the primary surface language.

### Typography and composition

| Role | Treatment |
|---|---|
| Hero headline | Cormorant Garamond 400; desktop `clamp(64px,7.8vw,128px)`, line-height .92, tracking −.055em; final line italic |
| Narrative lines | Cormorant Garamond 400, approximately 40–112px by scene and viewport; one short message at a time |
| Reading heading | Cormorant Garamond 400, desktop `clamp(45px,4.4vw,72px)`, line-height 1.03; 43px mobile |
| Body | DM Sans; Cyrillic IBM Plex Sans fallback; 12–17px by viewport, generous line-height |
| Labels/progress | IBM Plex Mono; small uppercase labels with deliberate tracking |
| Suggested question | Cormorant Garamond italic, 26px desktop / 24px mobile |

Desktop leaves the headline on the left and gives Olivia and the rising opening room to the right. The supplied photo is covered at a centered horizontal anchor. Mobile uses a **63% horizontal source anchor**, a lower figure position, smaller portrait enlargement, and a dedicated vertical composition. It is not simply a reduced desktop screenshot. Ukrainian has its own headline sizing and wrapping rules.

Primary actions have a gilt fill, dark text, a small arrow, and a minimum height of about 49–54px. Secondary actions are quiet underlined links. Reading intents are full-width ruled rows with Roman numerals; the selected row turns gilt and reveals its arrow. Keep these states legible independently of animation.

## Motion chronology

One normalized progress value, **p = 0…1**, drives the scene. The controls identify three chapters: **Approach → Open → Enter**. The ranges below overlap deliberately so the scene does not cut between states.

| Progress | Scene | Copy and interface |
|---|---|---|
| 0–.16 | Original sea composition; slight ambient water and cloud motion; Olivia begins to approach after .015 | Headline, description, Begin, direct Oracle link, and navigation remain visible. |
| .16–.34 | Olivia advances, her reflection follows, and concentric wake lines gather at her feet | Intro fades and rises slightly; it becomes inert when effectively invisible. |
| .34–.65 | A low elliptical ripple rises into an upright moonlit opening. The inner sanctuary becomes visible inside it. | “II. The tide opens” and “A little stillness. A different perspective.” appear and fade. |
| .65–.86 | The opening expands toward the viewer; the original figure fades between approximately .665 and .79 | “Bring what is on your mind.” accompanies passage through the opening. |
| .86–1 | Inner sanctuary fills the view; the scene settles into a reading invitation | “Your question. A new perspective.” appears; native scrolling continues into the reading entrance. |

Useful shader bands: approach uses a quintic ease from .015 to .47; opening .33–.65; the water ring rises .38–.67; passage .64–.97. The opening is a refracting band of water with asymmetric lit crests, restrained engraved marks, and a view into another scene. It is not a flat glowing circle placed over the image.

The animation is a **single WebGL image-compositing pass**, not a generated video or a full 3D character model. It combines four textures, a sampled original figure, a generated reflection, water displacement, the wake, a rising aperture, and subtle grain. Olivia's approach is an image-based movement; it does not create a new walking performance or reconstruct hidden anatomy.

### Scroll and controls

- **Native scroll:** scene travel spans **3.2 viewport heights on desktop** and **2.5 on mobile**, in addition to the stage's own height. The stage is sticky only while graphics are available and reduced motion is off. These are travel distances, not total section heights.
- **Reversible:** scrolling upward reverses the spatial sequence. Progress is eased toward the scroll target; native scrolling itself is not replaced.
- **Begin:** starts an optional assisted traversal of roughly **12.5 seconds**, scaled to the remaining distance. The current code uses `12500 × (.98 − p)` milliseconds, or 12.25 seconds from p = 0. It reaches the final scene invitation; the reading section follows below.
- **Interrupt:** wheel, touch, pointer interaction, or navigation keys cancel assisted playback. The reader can take over immediately.
- **Pause/Play:** pauses ambient time and scene progression; it does not lock document scrolling. Resuming follows the current scroll position. The button has the stable accessible name “Scene motion”.
- **Skip:** jumps to the local reading entrance and focuses it. The keyboard skip link does the same. This is separate from the direct Oracle product link.
- **Replay:** returns to the opening and focuses Begin.
- **EN/UA:** updates both visible strings and document language. “UA” is the visible label; the language code is `uk`.

## Copy and reading interaction

The reading entrance offers **sample starting points**, not personal results. Its first option is initially selected. Selecting another option changes the suggested question locally and announces the update through a polite live region.

| Element | English | Ukrainian |
|---|---|---|
| Hero | Your stars, translated clearly. | Ваші зірки — людською мовою. |
| Begin | Begin the journey | Почати подорож |
| Tide line | A little stillness. A different perspective. | Трохи тиші. Інший погляд. |
| Passage line | Bring what is on your mind. | Почніть із того, що вас хвилює. |
| Reading heading | What would you like to see more clearly? | Що ви хочете побачити ясніше? |
| Question label | A question to begin with | Запитання для початку |
| Decision | A decision | Рішення |
| Relationship | A relationship | Стосунки |
| Next step | My next step | Мій наступний крок |
| Oracle action | Continue to the Oracle | Перейти до Оракула |
| Daily action | Draw your daily card | Витягнути карту дня |
| Trust | Clarity first. No noise. | Спершу ясність. Без шуму. |

| Intent | English suggestion | Ukrainian suggestion |
|---|---|---|
| Decision | What should I consider before I choose? | Що варто врахувати, перш ніж зробити вибір? |
| Relationship | What could help me understand this connection? | Що допоможе мені краще зрозуміти ці стосунки? |
| Next step | What deserves my attention now? | На що мені зараз варто звернути увагу? |

All implemented strings and line breaks are in the `text` dictionaries in `app.js`. No cards are drawn, chart positions calculated, or personal counsel fabricated. There is no question submission or account mutation.

“Continue to the Oracle”, “Go to the reading”, and the masthead Oracle action open **[oliviaarcana.com/oracle](https://oliviaarcana.com/oracle)**. Daily actions open **[oliviaarcana.com/daily](https://oliviaarcana.com/daily)**. **The selected intent and suggested question are not transferred to those destinations.** That is an integration feature to design and verify later, not a behavior of this prototype.

## Motion alternatives and performance

The original poster is present in the initial HTML. When WebGL or an image fails, the prototype removes the long scene range and displays the static opening followed by the reading entrance. The core product links remain ordinary anchors.

Reduced motion removes the long sticky journey, suppresses interface transitions, and presents the static scene and reading entrance in ordinary flow. The motion control reports Still mode instead of allowing the cinematic sequence to restart. Background-tab and offscreen rendering are paused. The drawing resolution caps device pixel ratio at **1.35 desktop / 1.5 mobile**.

The prototype uses requestAnimationFrame and a single shader pass; it does not promise a fixed frame rate on all hardware. Artwork and fonts are embedded in the standalone file for convenience, so that file is intentionally larger than a production page. Use separately cacheable assets for production. Maintain a visible fallback while images load, and never gate the headline or product actions on successful graphics initialization.

## Claude integration: extend the current Arrival

**The current integration point is `website/src/components/hero/TheArrival.tsx`, mounted by `website/src/app/page.tsx` around line 4597.** The page now passes locale, title lines, subtitle, trust copy, route destinations, and captions into this component. This has changed since the earlier design brief and first handoff. Do not implement against the old inline `.front-pin`/`ScrollCinema` block or the stale `src/components/Hero.tsx` component.

The existing `TheArrival.tsx` already renders a scroll-driven approach with original, clean-plate, and keyed-figure textures. It also has an optional Godrays layer. The new concept should replace or extend that renderer coherently: add the fourth sanctuary texture, replace keyed-figure RGB with original-photo RGB plus the registered raw alpha, and implement the shared progress state, water opening, and reading entrance. Do not run the old and new full-scene effects behind one another.

Recommended component boundary:

1. **Arrival controller:** refs, measured native scroll range, progress, playback, pause, media/visibility state, and control actions.
2. **Arrival renderer:** four textures, original/matte registration, figure/reflection, water opening, fallback, and graphics-resource lifetime.
3. **Reading entrance:** accessible intent rows, selected sample question, and existing internal product links.

These can remain within the current component initially or be extracted into focused files. Keep the current page's locale and product-route props. Use the existing `useLocale()` and translation system rather than copying the standalone DOM-mutating language script. Preserve supported locale behavior beyond the two demonstrated layouts. The new Cyrillic body fallback is included deliberately; do not assume Latin DM Sans covers Ukrainian.

Scope styles to the Arrival and reading entrance. The delivered standalone CSS contains `html`, `body`, heading, and control defaults that should not be pasted wholesale into production globals. Map its colors to component-scoped variables or the existing site tokens. Reconcile the masthead once; do not render both the page's header and the prototype header. Review the surviving page-level hold/bloom gate and body scroll lock so the opening and direct actions are available on arrival, while retaining any lower-page state dependencies that still need `stage-done`.

Keep `DayPanorama`/Fig. 0 immediately after the agreed new entrance flow, along with its actual Sun/Moon calculations, latitude input, timing, and memory. Preserve the birth inscription, almanac/atlas instruments, reading engine, subscription providers, and downstream routes. The cinematic moon, engravings, and water are symbolic artwork and must not be labeled as a measured current sky.

The project uses Next.js static export. Put the reviewed image files in a stable public asset folder, keep browser-only setup inside client effects, and preserve server/client markup parity. Follow `website/AGENTS.md` and the installed Next.js documentation before coding. No new runtime package is necessary for this shader approach.

The standalone script is page-scoped. Its React port needs explicit lifecycle cleanup: cancel animation frames, the preference-check interval and assisted playback; remove scroll, resize, input, visibility, media, image, and context listeners; disconnect observers; and release textures, buffers, shaders, and programs. Handle remounts, route changes, context loss/restoration, and dynamic reduced-motion changes without retaining duplicate render loops. Store selected intent in React state; do not introduce personal-data persistence as part of a visual port.

## Known limits and verification

The portrait is intentionally limited by its original resolution and raw matte. Some fine glow, droplet, or cloud-edge softness may remain. The scene is a 2.5D composition, and the sanctuary is generated art. The prototype contains sample intent selection only, with no transfer to the real Oracle and no astrology or tarot calculation.

**Completed verification: see [QA.md](QA.md).** The installed Chrome checks passed for opening-frame continuity, native keyboard scrolling, Begin interruption, Skip/focus, Pause, Replay, intent selection, EN/UK overflow at four widths, short portrait/landscape control placement, reduced motion, no-WebGL fallback and context loss. Scene states and mobile/desktop layouts were visually inspected. Physical Safari/iPhone and Android performance remain production checks.

The final integration should additionally check static export, hydration, repeated route navigation, renderer cleanup, and preserved lower-page instruments. No production files were changed to create this standalone concept or handoff.
