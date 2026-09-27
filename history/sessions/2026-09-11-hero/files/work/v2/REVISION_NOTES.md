# Olivia Arcana — The Arrival

## Revision 02: Olivia approaches through water

The owner's new image replaces the original temple artwork. This revision changes the hero from ambient scenery to a short scroll-controlled encounter: Olivia slowly drifts toward the viewer as the page stays in place. Scrolling backward reverses the approach.

The owner specifically requested that the movement feel integrated into water, not like an isolated picture getting larger. This version therefore couples perspective, water-contact position, moving reflection, local surface displacement, concentric wave highlights, and slight fabric motion.

## Use the files

- **index.html** — self-contained animated local prototype. Open directly in Chrome or another modern browser. Images, fonts, and scripts are embedded. Scroll down to approach, up to retreat. Both language options remain available.
- **modular.html + hero.css + hero.js** — separate sources for the implementation handoff. Serve this version through a local server.
- **design-system.html** — visual direction and beginning/end compositions.
- **mockups/** — desktop and phone states of the revised hero.
- **assets/** — the supplied original, edited background plate, keyed foreground, motion mist, fonts and licenses, image-edit prompts, and foreground registration metadata.

The former temple version is preserved separately in the earlier ZIP. This revision changes the local design prototype only. The production site has not been edited or deployed.

## Visual system

Continue the same editorial foundation: Cormorant Garamond regular and italic, DM Sans body, IBM Plex Mono marginal labels, ultramarine grounds, moonstone text, and one gilt primary action.

| Token | Value | Role |
|---|---|---|
| Abyss | #10134D | Deep ink / fallback ground |
| Ultramarine | #20279B | Brand blue |
| Scene ground | #131B76 | New image's darker blue |
| Moonstone | #E8E9FF | Display type |
| Mist | #B7BCE9 | Quiet supporting details |
| Gilt | #E0B768 | Primary action / focus |

The new picture has bright clouds and many stars. A graded dark-blue scrim preserves reading contrast on the left and behind the masthead. The right side stays clearer so Olivia remains the visual subject. Do not combine the scene with the old aurora effect or additional star widgets.

The constellation lines shown in the supplied image are part of the artwork. They are not presented as the real sky at the visitor's time or location. Preserve measured astronomy in the existing instruments elsewhere on the site.

## Scroll choreography

The page uses native scrolling and a sticky hero. Wheel, trackpad, touch, keyboard, and the scrollbar all follow the same progress value. It does not cancel wheel or touch events or lock the body.

- Desktop: approximately 1.75 viewport heights of scrolling for the sequence.
- Phone: approximately 1.15 viewport heights, with a smaller maximum figure size.
- The original photograph is the starting composition.
- During the first 7.5% of scroll, the original transitions into the registered background and foreground layers.
- From 8% through 95%, a smooth progression drives the approach.
- Near the end, motion settles into the closest composition.
- Scrolling backward returns along the same path.
- “Skip animation” goes directly to the final composition.

Progress uses damping to soften irregular trackpad input. This is a scroll-controlled cinematic drift, not a rigged walking cycle or a generated video.

### Perspective, not a center-origin zoom

The projected waterline stays connected to the scene's horizon. Growth follows reciprocal depth:

```js
approach = smoothstep(0.08, 0.95, scrollProgress);
scale = 1 / (1 - 0.66 * approach);
contactY = horizonY + (initialContactY - horizonY) * scale;
```

Olivia can approach about three times her original projected size on desktop, limited to 73% of the scene height. Mobile is capped at 43% so she does not engulf the content. Her feet/dress contact moves down the water plane as she comes forward, while her upper body rises in the composition. A small lateral drift adds depth without a visible zigzag.

The background camera changes by only 2.5%. Most of the depth comes from Olivia's approach, so the entire picture does not simply zoom together.

## Water and edge integration

The hero is composited in one WebGL pass from the original image, the background with Olivia removed, and an isolated high-resolution foreground.

1. **Moving reflection.** The same figure texture generates her reflection at the current contact point. It grows and moves with her, is vertically compressed, broken by two water-wave frequencies, tinted toward the water, and fades with distance.
2. **Local ripples.** Elliptical wave distance is measured around Olivia's current water contact. The wave field changes the sampled background water, with restrained moonlit highlights. It is not a circular sticker attached to the figure.
3. **Ambient water.** Fine horizontal displacement continues across the sea. The horizon and stars remain stable.
4. **Soft contact.** The lowest part of the dress fades through a shallow animated band at the water surface, avoiding a hard horizontal edge.
5. **Fabric movement.** Small changing texture offsets affect loose hems and outer hair while preserving the face and main body. The figure does not bounce as one object.
6. **Mist.** Existing transparent mist layers drift independently at low opacity.

The foreground was prepared from the supplied woman and refined for enlargement. Fine details are synthesized by image editing; it is not a pixel-identical enlargement of the small original face. No new character or different pose was intentionally introduced.

The generator did not return reliable true alpha for the figure, so the final isolated asset uses a uniform green key. The shader removes that green during composition, including soft edge handling and spill suppression. The green is never displayed as a page background. Preserve this keying code when porting, or replace the asset with a professionally matted equivalent.

## Asset registration

The original landscape is 1672 × 941. The scene uses image-space coordinates, then projects them through the cover crop:

- Horizon: approximately y=698px.
- Olivia's original water contact: approximately x=1060px, y=756px.
- Top of halo: approximately y=531px.
- Initial projected height: approximately 225px in original image coordinates.

Foreground bounds are measured from the prepared asset and stored in `assets/foreground-bounds.json`. Do not treat arbitrary transparent or green margins as part of her visible size. A replacement figure or re-crop requires new registration.

## Responsive behavior and access

Desktop keeps the headline on the left and Olivia to the right. Phone layouts use a portrait crop of the same original scene, with a smaller heading and reduced approach scale. English and Ukrainian have separately composed line groups; the existing Cyrillic font fallbacks are retained.

The scene starts still for reduced motion, with no extended scroll distance. An explicit Play choice can enable the sequence. Pause freezes both ambient movement and the approach while ordinary page scrolling remains available. Hidden tabs and offscreen heroes stop rendering.

An ordinary image is present before JavaScript runs. WebGL failure, context loss, or missing edited layers preserve the original picture and usable text/actions. A no-JavaScript view hides inactive animation and language controls. Keep the keyboard skip link, focus treatment, and real anchor links.

## Claude integration

Implement this revision at the active homepage in `website/src/app/page.tsx`, not the stale `src/components/Hero.tsx`. Keep the work limited to the opening/hero.

- Replace the previous opening-only cinema and hold gate with this scene and its own bounded sticky sequence. Do not stack both pins or retain the old body scroll lock.
- Preserve the existing measured Sun/Moon instruments, latitude controls, birth inputs, tarot and reading behavior, pricing, and other page sections.
- Reuse the site's existing `next/font`, `useLocale()`, translation system, and `TransitionLink`. The local prototype's absolute URLs become `/`, `/oracle`, and `/daily` inside the app.
- Add new motion and caption labels to the existing translation system. Do not create separate locale storage.
- Scope CSS to the new hero. Keep old shared backgrounds from tinting it without deleting unrelated lower-page behavior.
- Convert the standalone script into a client component with refs and an effect. Do not read browser properties during server rendering.
- On unmount, cancel animation frames, remove listeners, disconnect observers, and dispose of WebGL textures, shaders, buffers, and program objects. Context restoration should rebuild cleanly.
- Keep the image in initial HTML, embed no secret or service key, and retain the site's static-export configuration. No new runtime animation dependency is required.
- Map the end of the local sequence directly into the existing next homepage section during integration. This local package intentionally stops at the completed hero.

The current request supersedes the previous draft's recommendation for an entirely unpinned opening: the owner now explicitly asks for a sustained scroll encounter. The attached older design brief remains background context, not an instruction to retain its original opening implementation.

## Acceptance checks

Before deployment, inspect the first, middle, and final positions at desktop and phone sizes. Check all of these in EN and UK:

- No duplicate original woman appears behind the approaching figure.
- The dress remains visually attached to the water, not floating above a separate reflection.
- Reflections and ripple centers follow the same water contact point.
- The foreground has no visible green rim or rectangular background.
- The headline and actions remain legible and usable.
- Scroll reversal is smooth; Pause does not continue advancing; Skip reaches the end.
- Reduced motion has a full static scene with no empty pin height.
- No horizontal overflow, translated text clipping, or additional old pin-height gap.
- No resource leaks when navigating away and back; static export passes.

Check Safari/iOS and real mobile performance during the production port. The local prototype is a composited 2.5D effect; it does not simulate full cloth physics or volumetric water.
