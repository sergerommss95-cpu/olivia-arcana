# Olivia Arcana — visual practice release

Preview: https://6ab68923efc66ff9806fcb25--olivia-arcana.netlify.app/#discover

Built 25 September 2026. This extends the personal-practice release candidate with a visual explanation of the product and a more durable record of reflection. The exact reviewed preview was promoted to https://oliviaarcana.com on 25 September 2026 at 15:20:36 UTC, following the user’s deployment request. No rebuild was used for publication.

## What changed

- The lower homepage now shows the product: an illustrated question/card/next-step sequence; interactive three-, five- and eight-card arrangements; a deliberate sample-card reveal; and a Day 1/7/21 almanac illustration. All sample material is labelled as an example.
- Each spread position opens its own prompt. Keyboard tabs and card buttons work; mobile layouts have dedicated spacing instead of shrinking the desktop composition.
- Optional first impressions give the reader space to notice the image before seeing prepared interpretation. Kept impressions are separate from later notes and excluded from AI requests. In incomplete spreads, the interface explicitly says to complete and save the spread to retain the impression.
- Question histories connect only readings the user chooses. Original question/card/orientation snapshots stay fixed. Dated observations append instead of rewriting earlier words. Calendar order respects the chosen observation date, with actual save time breaking same-day ties.
- Optional next new/full moon check-in dates use Astronomy Engine 2.1.19 in the visitor’s time zone. They set a date only; the reader still saves it. Existing calendar downloads remain optional, not automatic notifications.
- Symbol Trails offer Light, Water and Thresholds through nine visually inspected card artworks. Readers can compare two or three full cards. Descriptions of the artwork are separate from questions for reflection.
- Almanac limits are now 1,000 single-card readings and 1,000 spreads, still subject to browser storage quota. Deletion/Undo coordinate readings, question links, practice notes, personal meanings, daily references and saved drafts. Full backups include question histories and first impressions, including standalone observations after a linked reading is removed.
- New interfaces and homepage content are available in English and Ukrainian.

## What stays unchanged

The approved hero animation, its camera, paths, timing and card artwork are preserved. The hero source SHA-256 is `413304f1cea159c67fee3f8542cf5f95ebb6358891f2c08b91c38f76a965a5b2`.

## Validation

- 138 product tests passed, covering saved-record identity, first-impression immutability, explicit question linking, dated observations, backup merge validation and atomic rollback, lunar dates, deletion/Undo and original motion fixtures.
- 45 native-site/service tests passed; product and native production builds completed.
- Browser checks at 1280px and 390px covered the illustrated homepage, 3/5/8 arrangements, sample flip, almanac tabs, symbol comparison, Ukrainian content, and horizontal overflow.
- A synthetic single-card reading was manually selected and revealed, given a first impression, linked to a question, given a lunar check-in and a dated observation, reloaded, removed and restored with Undo. Its saved context remained intact. Test content is isolated to the local preview origin.
- A manual three-card spread kept its first-card impression through completion and explicit saving; the remaining draw and reveal controls remained available.
- Native preview console showed no errors in the checked flows. Generated resource paths and original artwork bytes passed build validation.

## Production verification

Netlify confirms deploy `6ab68923efc66ff9806fcb25` is published and ready. Live hero, application and stylesheet bytes match the reviewed assets. The live five-card preview responds correctly and the checked browser flow reports no console errors. Previous production deploy: `6ab647837a10ea159cef2e7a`.

## Release boundaries

Records remain on the visitor’s browser/device; this pass does not add cloud sync. The account-service restoration, verified checkout/membership and Ukrainian AI editorial gates documented in the prior release candidate remain open and were not re-certified in this visual pass. Symbol Trails are a curated nine-card study, not complete symbol annotation of all 78 cards. Moon dates are reflective scheduling options and make no predictive claim.

Source: `work/olivia-product/`. Native build: `/Users/macbookpro/olivia-arcana/website`. The portable local edition is `outputs/olivia-almanac.html`; the hosted experience is `outputs/olivia-experience/`.
