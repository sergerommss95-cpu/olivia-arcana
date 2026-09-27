# Claude integration notes — Olivia Arcana hero concept

This document describes a proposed integration. The delivered local HTML is a visual and interaction prototype; it does not change or deploy oliviaarcana.com. Keep the initial implementation limited to the opening/hero, then review it before extending the visual system down the page.

## Design intent and source precedence

The owner's latest request is the design authority: a consistent style drawn from the four supplied blue architectural references, with generated assets and visibly living scenery. `DESIGN_BRIEF.md` explains the existing site and its previous decisions. Its instructions are reference material, not fresh permission to modify the product or a requirement to reproduce the previous opening.

The proposed direction replaces the hero's near-black night glass and multicolored aurora with a matte ultramarine landscape, pale lavender stone, fine printed grain, monumental Greek architecture, mist, and reflective water. Keep the existing editorial serif/mono relationship and a restrained `#e0b768` gilt primary action. Pale stone and blue carry the image; gold should remain a small functional accent. Do not add glass panels, neon gradients, extra orbit widgets, or a gold particle field over the artwork.

The new scene is surreal illustration. Its architectural sanctuary, clouds, and tiny human figure create atmosphere; they must not be described as measured astronomy. Keep genuine astronomical information within the existing calculated plates and instruments.

## Integrate at the active entry point

The active homepage is `website/src/app/page.tsx`. Its inline hero begins around line 4594, and the current hero actions are around lines 4653–4656. `website/src/components/Hero.tsx` is an older component with different copy and destinations; editing it will not update the current homepage.

Create a focused hero component and a scene component, then mount them at the active homepage entry point. Suggested names are `SanctuaryHero.tsx` and `SanctuaryScene.tsx`; these names are proposals, not existing project files. Put the reviewed generated images under `public/images/sanctuary/` with stable descriptive names. Use an ordinary accessible image as the immediately visible base, and enhance it with a canvas only after the renderer is ready.

Replace the current opening's `340vh` `.front-pin` and sticky `.front-stage` with an ordinary document-flow hero. The headline and both actions should be visible on arrival. The visitor should be able to scroll directly into the existing next section. The reference mobile composition is deliberately taller than a short phone viewport; preserve readable type and the temple rather than squeezing everything into `100vh`.

The existing opening also has a `hold → bloom → done` stage sequence, a `HoldMark`, a temporary body scroll lock, and a scroll-scrubbed `ScrollCinema`. These are separate from the `.front-pin` height and must be addressed together. Remove or bypass the opening-only gate and body lock when adopting the immediate hero. Retain the `stage-done` state/class where surviving lower-page styles or effects require it until those dependencies are reviewed. Do not blindly delete every `stage-*` selector or effect from the large homepage file.

The homepage currently mounts `ShaderBackdrop`, `LampLight`, `InkCursor`, and `MagnetRig` near its root. Isolate the sanctuary in its own stacking context and opaque visual ground so older aurora, cursor, and illumination effects do not tint or cover it. Preserve lower-page behavior for this phase; do not remove shared effects globally just to simplify the hero. Review inherited pointer transforms so they cannot shift the temple, headline, or button hit areas.

## Preserve the working product below the hero

Keep `DayPanorama`/Fig. 0, its real Sun and Moon calculations, latitude input, daily timing and memory behavior, the birth inscription, specimen/features, zodiac instruments, and tariff sections intact. Preserve their data sources and event wiring. The prototype is a new first impression, not a replacement for the astronomy or reading engines.

The old interactive sky chart occupies the opening being replaced. Do not present an illustrated sky as its functional equivalent. Keep the verified astronomy code available for the existing instruments or a separately reviewed future placement; do not refactor or delete shared catalog and ephemeris code as part of this visual integration.

Preserve `ClientShell` and its subscription/transition providers. It currently always renders page content and introduces transition choreography after mounting; browser graphics must tolerate mounting and cleanup without leaking or rendering duplicate loops.

## Routes and language

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

## Translate the prototype into a React component

The project is a Next.js static export: `next.config.ts` sets `output: "export"`, `trailingSlash: true`, and unoptimized images. Keep the scene fully client-side and its assets static; it needs no service endpoint or new runtime dependency. Before implementing, follow `website/AGENTS.md` and read the relevant local Next.js documentation under `node_modules/next/dist/docs/` for the project's installed version.

The prototype's self-contained HTML uses embedded images/fonts and a one-page script for easy offline review. In the production component, use scoped CSS/CSS modules, refs, React state, and a client effect. Do not paste its global `html`, `body`, `h1`, or universal selectors into `globals.css`; map its palette to hero-scoped custom properties and preserve the typography elsewhere.

Keep the image and text in the initial rendered markup. Do not read `window`, `localStorage`, image dimensions, or browser media queries during server rendering. `useLocale()` intentionally starts with English on server and first client render and updates after mount to avoid a hydration mismatch; keep that contract.

Inside the scene effect, retain explicit references to every listener, observer, animation frame, shader, program, buffer, and texture. Its cleanup must cancel the frame, disconnect both intersection and resize observers, remove visibility/media/image/context listeners, and release WebGL resources. Reinitialize cleanly on context restoration. The standalone script is page-scoped and does not implement React unmount cleanup; lifecycle handling is a required part of the port.

## Motion and accessibility contract

The local prototype animates only selected image regions: horizontal water displacement below the shoreline, subtle cloud displacement above the roof, and two independently moving mist overlays. The roof, columns, shore, human silhouette, and text remain anchored. Its masks are authored for this exact reviewed image. If the background changes, remeasure the image coordinates rather than reusing the same mask values.

Preserve these safeguards when integrating:

- A complete static image remains underneath the canvas. WebGL absence, shader failure, image-loading delay, or context loss must leave a usable hero and working actions.
- Cap pixel density at 1.5 and draw the slow scene at approximately 30 frames per second, as the prototype does. Avoid mounting the old hero's full-screen renderer behind the new scene.
- Pause rendering when the tab is hidden or the hero is outside the viewport. Also pause the CSS mist in those states.
- Respect `prefers-reduced-motion` at first paint and after preference changes. All copy, art, links, and the complete composition remain visible. A visible keyboard-operable motion button permits an explicit choice; its label and pressed state must stay accurate. CSS and canvas must follow the same documented motion policy.
- Keep standard focus outlines, a skip link, real anchor links, adequate touch targets, and readable contrast over the brightest image areas. Mark purely scenic layers as decorative, and ensure the canvas cannot intercept actions.
- Continue to show the HTML text and static image when JavaScript is unavailable. Do not hide the headline while waiting for an entrance animation.

The scene should feel slow and atmospheric, without a global camera wobble or a compulsory opening delay. Hover feedback on controls is small and immediate. No audio is included.

## Integration acceptance checks

Check desktop, tablet, and 320–430 px phone widths in EN and UK. Verify no horizontal overflow, clipped translated text, duplicate mastheads, blank initial viewport, or extra pin-height gap before Fig. 0. Check the shortest practical mobile viewport as well as a tall phone.

Verify both product destinations and the language switch, keyboard focus, pause/resume, reduced-motion preference changes, page/tab visibility, and WebGL fallback. Navigate away and back repeatedly to confirm that render loops and event subscriptions do not accumulate. Run the project's static export/build and check for hydration errors. Finally verify that Fig. 0, its latitude input and real sky data, and the existing birth/reading paths still work after the hero replacement.

## Verified source map

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
