# Mobile surfaces and section repair — 26 September 2026

The user's iPhone screenshots were from oliviaarcana.com, still serving mobile v1 (`experience.2bd1edc82c22a347.css`). The previous v2 was only on the separate preview (`experience.2721adb61bab3762.css`). This revision includes that mobile work and fixes the remaining cross-section framing/affordance problems.

## Changes

- Automatic perimeter decoration was removed in both the native shell and product runtime. The optional edge now requires an explicit `data-liquid-edge` marker; current controls do not opt in. This prevents a frame being drawn around the unrotated container of rotated card artwork, illustration links, pager buttons, and navigation text.
- Primary/secondary filled surfaces, recessed fields, selected states and keyboard focus provide the action hierarchy. The sample-card caption is now a filled ivory action inside the existing accessible reveal button; its hit target and flip handler remain intact. Long Ukrainian labels center independently of the artwork width.
- Existing v2 practice panels each fit the viewport, contain their artwork, and retain the native swipe/pager behavior.
- New `mobile-home-sections.css` recomposes the spread preview, sample card, almanac entry, symbols and footer below 700px. Spread captions are larger, card positions no longer shift because of caption length, the sample's decorative oversized numeral is removed, and almanac text occupies a full-width entry.
- Approved hero source, card bytes, selection/reveal logic and personal-reading service prompts are unchanged by this revision.

## Verification in this pass

- 212 product tests and 7 mobile-question interaction checks passed.
- 49 native/service tests passed. Native Next export and portable/hosted product builds succeeded.
- Source build checked artwork bytes, asset references and generated JavaScript.
- Browser visual review: English at 390×844; Ukrainian at 375×812 and 320×740; desktop at 1440×1000. Reviewed the practice card panel and pager, 8-position spread labels, sample front/back + filled action, almanac tabs/entry, symbol section, and question compose/prepare states.
- EN 390 and UK 375 pages reported document width equal to viewport width and zero generated `olivia-edge` elements.
- Desktop hero and controls visually reviewed, no console errors observed on that inspected page.
- This is responsive browser testing, not testing on a physical iPhone Safari. User device feedback remains necessary for browser chrome, touch and keyboard feel.
- No live paid generation, account payment or real notification was triggered by this pass. Local prepared-reading availability behaved as expected without the service endpoint.

## Production verification

Published to oliviaarcana.com as deploy `6ab7b1eb2e3eb145b023937a`. EN and UK HTML reference `experience.b201b3ecb391a586.css`; both service availability GETs returned 200 with `available: true`. Browser checked the live practice panel at 390×844: proper filled controls, complete Star artwork after image load, zero detached edge elements, no horizontal page overflow, and no console errors on the inspected page.
