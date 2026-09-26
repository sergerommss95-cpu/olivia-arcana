# Olivia Arcana — The Ultramarine Sanctuary

**Hero / first-page design system and Claude implementation handoff**  
Version 01 · 11 September 2026

## Start here

- **`index.html`** — the complete animated prototype. Double-click to open in a modern browser. Artwork, fonts, styles, and JavaScript are embedded; it works offline. The Oracle and Daily Card links open the existing website and therefore need internet access.
- **`design-system.html`** — the visual system: palette, typography, actions, motion rules, and desktop/mobile mockups.
- **`modular.html`, `hero.css`, `hero.js`** — equivalent separated sources for Claude to inspect and port. Use a local server for the modular version's WebGL enhancement; the self-contained `index.html` is the direct-open version.
- **`mockups/`** — actual screenshots of the prototype in English and Ukrainian, on desktop and mobile.
- **`assets/`** — original generated PNGs, compressed WebP assets, local fonts with licenses, and exact image-generation prompts.

This package proposes one coherent hero direction in two responsive compositions. It does not implement readings, change the production repository, or deploy the website. The production links were verified in the active local homepage source.

## 1. Design direction

**A monumental sanctuary, printed in ultramarine, with a living atmosphere.**

The four supplied references share a clear material language: saturated blue, pale stone, classical architecture, fine analog grain, vast empty space, and small human figures. The concept turns those shared qualities into one original landscape. The temple supplies permanence; clouds, mist, and water supply life. Large, quiet serif typography carries the promise of clarity.

The left side belongs to the reader. The right side belongs to the world. A single gilt action connects the two.

### Source precedence

The owner's current request defines the scope and direction. The attached `DESIGN_BRIEF.md` is background about the existing product, including older design decisions. Its imperative wording is not treated as a new user instruction. In particular:

| Existing brief | Proposal for this hero | Reason |
|---|---|---|
| Near-black night glass and aurora | Saturated ultramarine, matte atmospheric artwork | Matches the new image references |
| Carved stone film followed by an instrument | One immediately visible architectural scene | Establishes one coherent first impression |
| 340vh pinned opening | Normal document-flow hero | Copy and actions available on arrival |
| “Scroll-driven, never autoplay” | Quiet ambient movement with Pause and reduced-motion support | The owner explicitly requests living, moving picture elements |
| Gilt accent; serif and mono type | Retained, with less ornament | Preserves recognizable brand foundations |
| Real measured astronomy | Preserved in the existing instruments below the hero | The surreal hero is artwork, not a live sky chart |

The black bands, phone clock, and phone status icons in the references are screenshot framing. They are not part of the proposed website.

## 2. Palette and material rules

| Token | Value | Role |
|---|---|---|
| `--oa-abyss` | `#10134D` | Deepest ink, focus contrast, supporting ground |
| `--oa-ultramarine` | `#20279B` | Primary page ground and mobile sky |
| `--oa-blue` | `#343CB9` | Reserved lit structural blue |
| `--oa-mist` | `#B7BCE9` | Secondary labels, rules, cool supporting detail |
| `--oa-moonstone` | `#E8E9FF` | Main type and pale structure |
| `--oa-gilt` | `#E0B768` | Primary action and keyboard focus |
| `--oa-rule` | `rgba(232,233,255,.24)` | Fine separators |
| Footer ground | `#121656` | Darker strip that closes the first composition |
| Body text | `#DCE0FC` | Readable supporting copy over the scene |

Use blue and moonstone for almost everything. Gilt is a small functional accent, not an atmospheric wash. The button's lighter hover shade is a tint of that same gilt.

The imagery is already textured. Do not add an animated noise filter over the text. Do not combine this scene with the previous violet/gold aurora, liquid-glass cards, neon edge lights, star particles, or independent decorative astrology widgets. Those would reintroduce competing visual languages.

Surfaces are open sky, stone, water, and fine rules. The primary button has a 2px corner radius. Text sits directly on the scene, supported by a subtle blue scrim. No bordered hero frame is needed.

## 3. Typography

| Use | Family / weight | Desktop | Mobile |
|---|---|---|---|
| Main headline, EN | Cormorant Garamond 400 | `clamp(82px, 7.6vw, 132px)` | `clamp(65px, 16vw, 104px)` |
| Main headline, UK | Cormorant Garamond 400 | `clamp(72px, 7.1vw, 122px)` with tablet adjustment | `clamp(56px, 15.4vw, 96px)` |
| Final headline line | Same family, italic 400 | Same scale | Same scale |
| Body | DM Sans 400 | 16px / 1.8 | 14px / 1.65 |
| Navigation / actions | DM Sans 400–500 | 14px | 13px actions |
| Eyebrow | IBM Plex Mono 400 | 12px, tracked .2em | 10px, tracked .17em |
| Captions / footer | IBM Plex Mono 400 | 11–12px | 9–10px decorative metadata |
| Trust line | Cormorant Garamond italic | 19px | 17px |

Headline line-height is .90, letter-spacing -.045em. The tightly set display type is balanced by loose body leading and generous empty sky. Keep one italic emphasis, rather than italicizing every message.

Cormorant Garamond and IBM Plex Mono include Latin and Cyrillic fonts. The existing site's DM Sans asset only covers Latin; Ukrainian body text uses the explicit sans-serif fallback. This is visible and intentional in the mockups. For production, preserve the site's `next/font` setup and decide whether to introduce a dedicated Cyrillic sans before adding another typeface.

The very small mono text is decorative editorial metadata. Keep instructions, controls, errors, and important live data at a larger readable size when this system is extended. Increase caption sizing if accessibility review requires it; preserve hierarchy by spacing, not by making core actions small.

## 4. Hero composition

### Desktop

The reference screenshot is **1440 × 900**. The hero occupies the screen with a 77px closing strip. The masthead is 112px high. Horizontal padding is `clamp(24px, 5.25vw, 104px)` — about 76px at the reference width.

The left content begins around y=195px with the eyebrow, followed by the three-line heading. Body copy stays close to 340px wide. Both actions are grouped under it, followed by the italic trust line. The temple stands in the right half, with open sky behind the text and water below.

The landscape is rendered with cover sizing. Its desktop image position is 50% / 50%. Keep the temple whole when adjusting the asset or crop. Do not animate the entire background with a floating or zooming loop.

### Mobile

The reference screenshot is **390 × 960**, captured from a 390 × 844 viewport. The hero is intentionally slightly taller than a short phone screen, with ordinary scrolling. It does not trap scrolling or require a pinned introduction.

At widths of 700px and below:

- A compact masthead keeps the wordmark and language switch.
- The redundant desktop navigation disappears; Oracle and Daily Card remain as the main actions.
- The headline remains three deliberate lines. It is not compressed onto a single line.
- The scene starts lower, at 435px, with a blue fade into the copy area. Its horizontal focal position shifts to 78% so the temple fits the portrait composition.
- The artwork and its reflections remain visible below the content. No glass panel is placed behind the text.
- The closing strip is 85px high. Its center motto is omitted; the motion control remains.

The prototype has additional handling for 320px phones and tablet widths. In production, allow natural height if copy grows or the user enlarges text.

## 5. Copy and actions

| Element | English | Ukrainian |
|---|---|---|
| Eyebrow | A personal almanac | Персональний альманах |
| Headline | Your stars, / translated / clearly. | Ваші зірки — / людською / мовою. |
| Body | Astrology and tarot, shaped by your birth chart and the question you bring. | Астрологія й таро на основі вашої натальної карти та запитання, з яким ви прийшли. |
| Primary action | Ask the oracle | Запитати Оракула |
| Secondary action | Draw your daily card | Карта дня |
| Trust line | Clarity first. No noise. | Спершу ясність. Без шуму. |
| Scene caption | I. The sanctuary | I. Святилище |
| Caption subtitle | Between the known & the possible | Між відомим і можливим |
| Motion control | Pause motion / Play motion | Зупинити рух / Увімкнути рух |

The main heading and trust line retain the site's existing wording. The description is shortened for this composition. New captions are proposed brand copy, not claims about astronomical conditions.

**Primary:** gilt fill, dark ink, 54px minimum height on desktop / 50px on phones. Hover lifts the button by 2px and moves its arrow by 4px. Press returns it to its resting position.

**Secondary:** text with a fine underline and small card glyph. Keep its visual weight lower than the gilt action. Both are normal anchor links, usable without JavaScript.

**Navigation:** wordmark and Almanac → existing homepage; Oracle → `/oracle`; Daily Card → `/daily`. The prototype's absolute URLs become internal route links during integration. Language selection changes the local preview only; it does not attempt to change the live website's stored locale before navigating.

## 6. The living scene

This is **an original still enhanced by real-time regional animation**, not generated video. The supplied files contain two generated bitmap assets. The HTML adds independent water, cloud, and mist movement.

| Layer | Behavior | Parameters / implementation |
|---|---|---|
| Base scene | Immediately visible, always present | Normal HTML image below canvas |
| Water | Small horizontal displacement and faint shifting highlights | Mask fades out before the shoreline, below image UV y=.29 from the bottom |
| Cloud crown | Slowly changing shape in its upper region | Smooth mask above UV y=.68–.74; excludes roof, columns, shore, and figure |
| Mist 1 | Horizontal drift, small lift and scale | 26s alternate loop, opacity .13–.25 |
| Mist 2 | Independent slower opposing drift | 34s alternate-reverse loop |
| Temple, figure and typography | Stationary | No camera wobble or whole-image bobbing |
| Controls | Short, purposeful feedback | 300ms, `cubic-bezier(.16,1,.3,1)` |

The image coordinates are specific to `sanctuary.webp`. A different crop or replacement artwork requires checking the masks again. Mobile cover mapping uses the same coordinates in image space, so the water animation stays on water.

The lightweight WebGL renderer uses no external runtime library. Pixel density is capped at 1.5 and slow-scene drawing at approximately 30fps. It pauses when the page is hidden or the hero leaves the viewport. Both mist layers pause at the same time.

**Motion preference:** start still when `prefers-reduced-motion` is enabled. The complete scene and all copy remain visible. The reader may explicitly choose Play, which enables both canvas and mist; a subsequent system preference change resets to that system preference. Pause freezes the composition without clearing it. There is no audio, scroll lock, or mandatory entrance sequence.

**Fallback:** an unavailable WebGL context, shader failure, or context loss reveals the base image. CSS mist still supplies ambient movement when permitted. With JavaScript disabled, the image and links remain, and inactive language/motion controls are hidden. No content waits for animation to finish.

## 7. Asset inventory and generation provenance

Both images were created with the built-in image-generation tool, with one request per asset. They are original artworks guided by the owner-supplied references; the phone screenshots are not embedded in the prototype.

| File | Dimensions | Approximate size | Purpose |
|---|---:|---:|---|
| `assets/sanctuary.webp` | 1672 × 941 | 184 KiB | Optimized hero image |
| `assets/sanctuary-original.png` | 1672 × 941 | 2.16 MiB | Original generated master |
| `assets/mist.webp` | 1536 × 1024 | 140 KiB | Transparent animated mist |
| `assets/mist-original.png` | 1536 × 1024 | 1.07 MiB | Original transparent master |
| `assets/fonts/*.woff2` | Latin + relevant Cyrillic subsets | See files | Existing brand font assets |
| `assets/fonts/licenses/` | OFL license text | — | Redistribution notices |
| `assets/generation-prompts.json` | Exact prompts and metadata | — | Reuse / future asset generation |

The main image was requested at 2560 × 1440; the tool returned 1672 × 941. It has not been artificially enlarged. That is suitable for this prototype, but a larger master may be desirable for very large or high-density production screens. The mist has verified genuine alpha transparency, including fully transparent corners.

The self-contained `index.html` is approximately **868 KiB**. Its duplication of the mist data is intentional for easy offline use. The modular version shares the external asset instead.

For future assets, preserve: ultramarine and pale moonstone duotone, fine lithographic grain, classical architectural mass, small human scale, and broad negative space. Use the saved exact prompts as the starting point. Do not introduce colorful nebulae, neon surfaces, star fields, or typography inside generated backgrounds.

## 8. Validation and current limits

Completed in local Chrome:

- Direct `file://` opening of the self-contained HTML: fonts, all images, and WebGL loaded.
- English and Ukrainian layout checks at 320, 390, 430, 700, 768, 1024, 1440, and 1920px widths: no horizontal overflow, clipped heading, or body/footer collision in the tested cases.
- Desktop and mobile visual inspection, including translated headline wrapping.
- Pause: consecutive screenshots were identical after pausing.
- Motion: separate screenshot comparisons confirmed changes in the water and cloud regions while a sampled column region remained unchanged.
- Reduced-motion default and explicit opt-in: both canvas and mist follow the chosen state.
- Simulated WebGL context loss: static artwork and headline remained visible.
- JavaScript-disabled rendering: headline and artwork remain usable.
- No JavaScript page errors in the checks above.

These checks are prototype validation, not a claim of audited accessibility compliance or measured 30fps on every device. Safari/iOS, touch-device performance, text enlargement, and the production React lifecycle should be checked during integration. The exact implementation work is described below.


## 9. Claude implementation handoff

## Integrate at the active entry point

The active homepage is `website/src/app/page.tsx`. Its inline hero begins around line 4594, and the current hero actions are around lines 4653–4656. `website/src/components/Hero.tsx` is an older component with different copy and destinations; editing it will not update the current homepage.

Create a focused hero component and a scene component, then mount them at the active homepage entry point. Suggested names are `SanctuaryHero.tsx` and `SanctuaryScene.tsx`; these names are proposals, not existing project files. Put the reviewed generated images under `public/images/sanctuary/` with stable descriptive names. Use an ordinary accessible image as the immediately visible base, and enhance it with a canvas only after the renderer is ready.

Replace the current opening's `340vh` `.front-pin` and sticky `.front-stage` with an ordinary document-flow hero. The headline and both actions should be visible on arrival. The visitor should be able to scroll directly into the existing next section. The reference mobile composition is deliberately taller than a short phone viewport; preserve readable type and the temple rather than squeezing everything into `100vh`.

The existing opening also has a `hold → bloom → done` stage sequence, a `HoldMark`, a temporary body scroll lock, and a scroll-scrubbed `ScrollCinema`. These are separate from the `.front-pin` height and must be addressed together. Remove or bypass the opening-only gate and body lock when adopting the immediate hero. Retain the `stage-done` state/class where surviving lower-page styles or effects require it until those dependencies are reviewed. Do not blindly delete every `stage-*` selector or effect from the large homepage file.

The homepage currently mounts `ShaderBackdrop`, `LampLight`, `InkCursor`, and `MagnetRig` near its root. Isolate the sanctuary in its own stacking context and opaque visual ground so older aurora, cursor, and illumination effects do not tint or cover it. Preserve lower-page behavior for this phase; do not remove shared effects globally just to simplify the hero. Review inherited pointer transforms so they cannot shift the temple, headline, or button hit areas.

### Preserve the working product below the hero

Keep `DayPanorama`/Fig. 0, its real Sun and Moon calculations, latitude input, daily timing and memory behavior, the birth inscription, specimen/features, zodiac instruments, and tariff sections intact. Preserve their data sources and event wiring. The prototype is a new first impression, not a replacement for the astronomy or reading engines.

The old interactive sky chart occupies the opening being replaced. Do not present an illustrated sky as its functional equivalent. Keep the verified astronomy code available for the existing instruments or a separately reviewed future placement; do not refactor or delete shared catalog and ephemeris code as part of this visual integration.

Preserve `ClientShell` and its subscription/transition providers. It currently always renders page content and introduces transition choreography after mounting; browser graphics must tolerate mounting and cleanup without leaking or rendering duplicate loops.

### Routes and language

Use the site's `TransitionLink` for the internal actions and existing route behavior:

| Element | Production route |
|---|---|
| Brand wordmark | `/` |
| Ask the Oracle | `/oracle` |
| Daily card | `/daily` |
| Academy, if retained in the navigation | `/academy` |
| Tariff, if retained | `/pricing` |

The older `Hero.tsx` points to `/academy/card-of-the-day`; use the currently active homepage's `/daily` destination for this concept. Absolute oliviaarcana.com URLs in the local prototype are for opening the existing product from an offline file; convert them to the internal routes above when integrating.

Reuse `useLocale()` from `src/lib/i18n/useLocale.ts` and its `locale`, `t`, and `setLocale`. It already persists `olivia-locale`, emits `olivia:locale-change`, synchronizes tabs, and sets document language/direction. Do not copy the standalone prototype's DOM language-switching script or create a competing storage key.

The existing translation keys cover the main heading, main action, description, and trust line. Reuse unchanged keys; put new sanctuary captions, motion labels, and revised shorter descriptions into the typed translation system rather than silently overwriting text used elsewhere. The delivered EN/UK switch demonstrates two reviewed layouts; preserve the application's existing locale behavior and fallback for its other supported languages. Avoid splitting translated headings by an assumed English word count; author appropriate line groups for EN and UK, and permit natural wrapping elsewhere.

| Existing key | English | Ukrainian |
|---|---|---|
| `hero_title` | Your stars, translated clearly. | Ваші зірки — людською мовою. |
| `hero_trust_line` | Clarity first. No noise. | Спершу ясність. Без шуму. |
| `hero_consult_cta` | Ask the Oracle | Запитати Оракула |
| Current homepage daily action | Daily card | Карта дня |

Use the existing `next/font` definitions in `src/app/layout.tsx`. Cormorant/Cormorant Garamond and IBM Plex Mono have Latin and Cyrillic subsets. The project's DM Sans definition supplies Latin; retain an explicit suitable system sans fallback for Ukrainian body copy, or deliberately introduce a reviewed Cyrillic body face. Do not assume that selecting a font family guarantees Cyrillic coverage.

### Translate the prototype into a React component

The project is a Next.js static export: `next.config.ts` sets `output: "export"`, `trailingSlash: true`, and unoptimized images. Keep the scene fully client-side and its assets static; it needs no service endpoint or new runtime dependency. Before implementing, follow `website/AGENTS.md` and read the relevant local Next.js documentation under `node_modules/next/dist/docs/` for the project's installed version.

The prototype's self-contained HTML uses embedded images/fonts and a one-page script for easy offline review. In the production component, use scoped CSS/CSS modules, refs, React state, and a client effect. Do not paste its global `html`, `body`, `h1`, or universal selectors into `globals.css`; map its palette to hero-scoped custom properties and preserve the typography elsewhere.

Keep the image and text in the initial rendered markup. Do not read `window`, `localStorage`, image dimensions, or browser media queries during server rendering. `useLocale()` intentionally starts with English on server and first client render and updates after mount to avoid a hydration mismatch; keep that contract.

Inside the scene effect, retain explicit references to every listener, observer, animation frame, shader, program, buffer, and texture. Its cleanup must cancel the frame, disconnect both intersection and resize observers, remove visibility/media/image/context listeners, and release WebGL resources. Reinitialize cleanly on context restoration. The standalone script is page-scoped and does not implement React unmount cleanup; lifecycle handling is a required part of the port.

### Motion and accessibility contract

The local prototype animates only selected image regions: horizontal water displacement below the shoreline, subtle cloud displacement above the roof, and two independently moving mist overlays. The roof, columns, shore, human silhouette, and text remain anchored. Its masks are authored for this exact reviewed image. If the background changes, remeasure the image coordinates rather than reusing the same mask values.

Preserve these safeguards when integrating:

- A complete static image remains underneath the canvas. WebGL absence, shader failure, image-loading delay, or context loss must leave a usable hero and working actions.
- Cap pixel density at 1.5 and draw the slow scene at approximately 30 frames per second, as the prototype does. Avoid mounting the old hero's full-screen renderer behind the new scene.
- Pause rendering when the tab is hidden or the hero is outside the viewport. Also pause the CSS mist in those states.
- Respect `prefers-reduced-motion` at first paint and after preference changes. All copy, art, links, and the complete composition remain visible. A visible keyboard-operable motion button permits an explicit choice; its label and pressed state must stay accurate. CSS and canvas must follow the same documented motion policy.
- Keep standard focus outlines, a skip link, real anchor links, adequate touch targets, and readable contrast over the brightest image areas. Mark purely scenic layers as decorative, and ensure the canvas cannot intercept actions.
- Continue to show the HTML text and static image when JavaScript is unavailable. Do not hide the headline while waiting for an entrance animation.

The scene should feel slow and atmospheric, without a global camera wobble or a compulsory opening delay. Hover feedback on controls is small and immediate. No audio is included.

### Integration acceptance checks

Check desktop, tablet, and 320–430 px phone widths in EN and UK. Verify no horizontal overflow, clipped translated text, duplicate mastheads, blank initial viewport, or extra pin-height gap before Fig. 0. Check the shortest practical mobile viewport as well as a tall phone.

Verify both product destinations and the language switch, keyboard focus, pause/resume, reduced-motion preference changes, page/tab visibility, and WebGL fallback. Navigate away and back repeatedly to confirm that render loops and event subscriptions do not accumulate. Run the project's static export/build and check for hydration errors. Finally verify that Fig. 0, its latitude input and real sky data, and the existing birth/reading paths still work after the hero replacement.

### Verified source map

Locations below were inspected in the current local project; line numbers can move during implementation.

- `src/app/page.tsx:4251` — opening state sequence and subsequent body-scroll lock.
- `src/app/page.tsx:4511` — page root and shared visual effects.
- `src/app/page.tsx:4594` — active opening/hero; actions at 4653 and 4656.
- `src/app/page.tsx:5374` — `340vh` pin and sticky stage styles.
- `src/lib/i18n/translations.ts:328` / `:582` — current English/Ukrainian hero text.
- `src/lib/i18n/useLocale.ts` — hydration-safe locale state and shared persistence/event wiring.
- `src/app/layout.tsx:8` — existing display, body, and mono font setup.
- `src/components/ClientShell.tsx` — shared subscription and transition wrapper.
- `next.config.ts` — static-export configuration.
- `public/olive-mark.svg` — existing simple olive-sprig emblem, available if desired; the active homepage uses a text wordmark.

No production files were edited for this concept or these notes.


## 10. Suggested message to Claude

```text
Use the attached Olivia Arcana “Ultramarine Sanctuary” package as the visual reference for the homepage opening only. First read DESIGN_SYSTEM.md and inspect index.html, design-system.html, hero.css, hero.js, and the desktop/mobile screenshots.

Implement this immediate hero in the active website/src/app/page.tsx using focused React components. Preserve the exact art direction, original assets, English/Ukrainian hierarchy, mobile crop, and independently animated water/cloud/mist. Keep the temple and text anchored. Reuse the existing font setup, locale system, and TransitionLink routes.

Replace the opening-only pin, cinematic gating, and body lock so the hero and its actions appear immediately. Preserve existing astronomy, birth inputs, reading functionality, and the rest of the homepage. Scope new styles to the hero and prevent previous visual effects from tinting it.

Port the standalone animation into a client effect with complete cleanup, reduced-motion parity, pause/resume, visibility gating, and a static-image fallback. Check EN/UK across desktop and phone widths, test route navigation and remount cleanup, and run the existing project's required build checks. Show the local result for review before deployment.
```
