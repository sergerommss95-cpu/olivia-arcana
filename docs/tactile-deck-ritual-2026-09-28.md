# Tactile deck ritual — developer handoff

Date: 28 September 2026. Implemented on `codex/tactile-deck-ritual`. Public preview information is recorded below when available; production is not changed by this branch.

## Scope

The one-card journey now carries the selected deck through extraction, a held face-down card, a deliberate turn, inspection, and an explicit **Read my card** action. Turning does not open the reading or draw another card. Face-loading failures retain the chosen card and offer a retry. Keyboard controls and English/Ukrainian copy are included.

Both artwork identities are supported: **Olivia** (`olivia`, lapis/navy and ivory) and **Amielle** (`space-between`, aubergine, marble and gold). The selected home hero, its artwork and its established choreography were preserved; these changes concern the draw and reading experience.

The held card and the reading artwork respond to pointer/touch movement. The reading also offers **Explore the light**. Interaction and keepsake controls pause while the personal reading is pending. The material layer respects reduced motion, visibility, route cleanup and unavailable WebGL; the underlying artwork remains visible.

## Integration

Paths below are relative to the repository root.

| Files | Responsibility |
| --- | --- |
| `experience/work/olivia-product/single-card-flow.js`, `.css` | Draw/hold/turn/read states, continuity of the chosen card, explicit reading action, input and recovery behavior. |
| `experience/work/olivia-product/card-material.js`, `.css` | Transparent WebGL light/shadow layer registered to the existing artwork; bounded rendering and lifecycle cleanup. |
| `experience/work/olivia-product/reading-touch.js`, `.css` | Reading-page material control, pending-state gating and the `#single-keepsake` host. |
| `experience/work/olivia-product/reading-keepsake.js`, `.css` | Actual-reading sentence selection/editing, local persistence, preview and canvas PNG export. |
| `experience/work/olivia-product/app.js`, `build.py` | Reading lifecycle, actual-text callback, almanac export and generated product bundles. |
| `experience/work/olivia-product/reading-removal.js`, `almanac-backup.js`, `living-deck.js` | Transactional removal/undo, validated backup import, complete backup export and recovery data. |

`mountReadingKeepsake(host, {record, assets, locale, getText})` returns `update(options)` and `destroy()`. `getText()` supplies the current reading as plain text or an array of paragraphs. `assets.forRecord(record)` preserves the reading’s deck identity. The integration supplies the actual personal reading when available and the visible curated reading otherwise; this feature makes no model calls.

## Material limitation

The light response is derived from luminance gradients and approximate color masks in the existing card image. The ivory and antique-metal details receive source-tinted light; the dark velvet is excluded. The earlier broad velvet response was removed after it washed Amielle into lavender. This is an image-derived relief approximation, not authored geometry, a physical depth scan or a true material/normal map. It cannot infer the real depth or material of every painted detail. The original full-resolution image remains the visible surface, with no displacement or replacement artwork.

## Kept words and local data

A visitor chooses a sentence from the reading and can edit it up to 240 characters. **Keep these words** explicitly saves the sentence with its reading ID, question, card and deck in the separate `olivia-reading-keepsakes-v1` store. It does not save the full reading. Up to 48 sentences are retained; capacity, unreadable data and write failures are reported without silently discarding older words.

The saved preview contains an artwork sliver and the chosen words. Wallpaper export creates a local 1080 × 1920 PNG using the existing art, ivory text, deck-specific navy/aubergine and a small gold olive impression. The PNG contains the chosen words and card/deck names; the question stays out of the image. Export also works before a local save.

Full backups include `keepsakes: {version: 1, entries: [...]}`. Import accepts older backups with no keepsakes, validates the bounds and identities, preserves existing local words, and permits independent keepsakes whose full reading was never saved. If a matching saved reading exists, its question and draw must agree. Keepsakes participate in stale-preview checks and rollback on interrupted imports.

Deleting a single-card reading removes its associated kept words and private question context in the same staged transaction as related reading data. Undo restores them and rejects conflicting newer data without a partial restore. A spread with the same identifier does not remove a single-card keepsake. Independent keepsakes remain removable from their own panel.

## Verification at this handoff

- Product suite: **296 tests passed**. Service suite: **59 tests passed**.
- Focused coverage includes uninterrupted turn/read separation, failed face loading, cancellation, Ukrainian control labels, sentence provenance, persistence, bounds, backup validation and atomic removal/import rollback.
- Browser: Amielle’s complete flow checked at **390 × 844**, including saved-word persistence. Its **1080 × 1920 PNG** was exported and visually checked.
- Browser: Olivia’s desktop keyboard draw, turn and explicit reading action checked. Its keepsake was saved, exported as a 1080 × 1920 PNG, and visually checked.
- Browser: Ukrainian Amielle draw, held note, turn, explicit reading and reading/keepsake copy checked at 375 × 812 with `?motion=reduce`. The face appeared immediately and waited for the explicit reading action.
- Corrected a shared disclosure style that darkened the folded question note; the final phone check shows legible ivory paper and ink.
- Local static servers do not provide personal AI readings; local interaction checks used curated readings. On the public preview, one synthetic creative-practice question was submitted through the normal personal-reading flow and completed successfully. The keepsake choices were verified against the resulting personal answer, with no captured console errors.
- Production build passed and verified both deck routes and 78 cards in each deck.
- No production deployment is confirmed by this handoff.

## Review build

- Preview: https://6abac253bc5d54000828e751--olivia-arcana.netlify.app/decks/#decks
- Deployed code commit: `0e04ef1`
- Pull request: https://github.com/sergerommss95-cpu/olivia-arcana/pull/11
- GitHub branch and pull-request test/build checks passed.
- Public deck page returns 200, loads both decks, and has no captured browser console errors.
- To try this specific one-card sequence: select a deck, begin a reading, enter a question, then choose **A fresh perspective · One card** under **Change the reading** (or the phone’s second step). One card is now the stable initial choice; typing a question does not change it. Three cards require an explicit selection or an accepted coached plan.
- The public reading endpoint is configured/available, and the hosted personal-reading check above completed successfully. Production has not been replaced; this is a review preview.

## Follow-up: color fidelity and card-in-hand motion

The fan hover now uses only the original card image, lift and shadow. Material lighting is enabled only after extraction or reveal. The softened relief calculation no longer amplifies fine velvet grain into metallic noise. Explicit premultiplied compositing and an ivory/gold mask preserve the source palette.

A finite 3.2-second grazing light passes across the carving after the card settles and after it turns. The image and lighting canvas share one inner surface: pointer/touch movement tilts them together, bounded to 6°/7°, followed by an 850ms settle. The outer extraction path and hit area remain stable. The desktop held card is larger; phone sizing still reserves space for the question and action. Reduced motion skips the extra surface motion and lighting. No continuous animation frame loop runs after settling.

The question entry now keeps the offered one-card format while typing or autofilling; choosing three cards remains explicit. Four new entry tests cover English/Ukrainian, typed/autofilled questions and accepted question plans. Four further ritual tests cover bounded tilt, shared surface, release/cancel and reduced motion.

Current follow-up checks: 296 product tests pass; product generation and the full website build pass. Desktop fan hover keeps the original Amielle palette. A 390×844 browser check covers selection, held card, drag, turn, explicit reading and no captured console errors. Safari material checks preserve the dark velvet at the strongest pointer light.

Hosted follow-up: the new preview loads both decks; typing the sample question retained the one-card action and entered the correct fan. Safari also completed Olivia selection and held-card checks at its native desktop size. Both GitHub test/build jobs and Netlify header checks passed for `0e04ef1`.


## Follow-up: touch-led artwork unveiling

The one-card reveal now opens the actual selected front through its back, instead of adding another hover light. The camera first approaches for 1.2 seconds; a 5.2-second WebGL transition then begins at the visitor's contact point. Two irregular, carving-sensitive folds expand through the surface, with a narrow source-tinted edge, local refraction and shadow. Pointer movement bends the passing fold. Source colors are unchanged at both endpoints. Olivia and Amielle use their own original back/front assets, including reversed orientation.

`card-unveiling.js` / `.css` own only this finite transition. `mountCardUnveiling(container, {image, reduced})` returns `reveal({front, duration, orientation, onStart, onProgress})`, `touch(x,y)`, `cancel()` and `destroy()`. `onStart` is awaited so camera movement completes before the artwork starts opening. Success leaves the final canvas visible until the caller swaps its original image and cancels the overlay. Unsupported WebGL, failed texture upload, context loss or reduced motion return control to the existing safe flip/immediate fallback. The transition stops its render loop at completion, pauses elapsed time in hidden tabs, and cancels stale work on route changes.

On wide screens the completed card stays large, with the folded question and explicit **Read my card** control to its side. Phone layout reserves space for the same controls and hides the mobile masthead during unveiling. Tapping the actual held card or its **Unveil my card** button starts the sequence; dragging the held surface does not unveil, and the extraction gesture cannot double-trigger it. The original home hero remains unchanged.

Validation for this follow-up: **311 product tests pass**, full product generation and website production build pass. New tests cover GPU fallback and failures, cancellation during an awaited camera approach, context loss, reduced motion, hidden-tab pause, final-frame handoff, cleanup, physical tap versus drag, compatibility click after extraction, and resize during fallback turning. Browser checks: Amielle contact-origin opening and matched reading at 390×844; Olivia contact-origin opening and enlarged inspection layout at 1280×800. Both original palettes remain intact. The local personal-reading service is unavailable, so these local checks used prepared card meanings; the reading service is unchanged.

This remains a review branch, not a production release. The next review URL is recorded in the pull request after its build finishes.
