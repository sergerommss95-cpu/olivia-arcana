# Liquid edges and personal-reading preparation — 25 September 2026

Implemented across the reading experience and native pages:
- Thin moving ivory/gold perimeters on interactive controls, with hover/focus states and disabled/reduced-motion support.
- Shared observer avoids duplicate enhancement; offscreen decorative edge animations pause.
- The existing WebGL card hit regions remain transparent and the approved hero source is unchanged.
- Opted-in readings withhold individual-card interpretation during reveal and all reading prose while the personal synthesis is preparing.
- Olivia / ARCANA wordmark and an indeterminate light rail are the only visible preparation copy. Artwork and navigation remain.
- Completed answers appear as one composed reading. Failed requests restore prepared meanings and a retry action.
- Pending requests survive a view remount without another question submission; detached or superseded views cannot publish results or steal focus.

Verification:
- 187 product tests passed, including nine pending/retry/remount/focus regression tests and four loader lifecycle tests.
- Browser checks used the actual product output with a separate local test service delaying its answer for 22 seconds. The synthetic test response was not included in shipped output.
- Desktop spread: manually chose three cards; checked that partial-reveal meanings and artwork-dialog meanings stayed hidden; preparation screen had artwork, logo, and progress only.
- Mobile 390 x 844: field/button edges, spread preparation and completed reading were inspected. The completed reading remained in view and received keyboard focus.
- Mobile single-card: pull/reveal and text-free preparation verified; simulated service failure restored meanings and retry.
- Product/native perimeter source and stylesheet copies match.
- Native Next build passed. Native inner-page enhancement showed no duplicate edges and no runtime errors.
- Hosted reading service returned a real question-specific single-card answer; the completed reading received focus. Console remained clear.
- Native navigation padding and primary-link spacing were visually checked after the final CSS refinement.
- Browser computed styles confirm the masked perimeter animation is running.

Approved hero SHA256:
413304f1cea159c67fee3f8542cf5f95ebb6358891f2c08b91c38f76a965a5b2

Final draft preview: https://6ab6d766a90f29bde475ebac--olivia-arcana.netlify.app/#question

The final hosted app, stylesheet, background, and approved hero match the reviewed local build byte for byte.

Published the exact reviewed deploy 6ab6d766a90f29bde475ebac to https://oliviaarcana.com/ at 2026-09-25T20:45:56.559Z. Live English and Ukrainian entries reference the approved app and stylesheet. App, CSS, hero, and background bytes match. Reading service reports available for en/uk. Live question page rendered without console errors. Known Ukrainian parity gaps remain; no localization edits were part of this release.
