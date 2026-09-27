# September 14 tarot integration

Preserved the upstream full-deck **THE RIFFLE** and its manual upright/reversed selection, integrated with our previous individual reveals, accessible result index/loupe, real frontispiece artwork, cancellation and shared reading work. No card database, seeded shuffle, reversal meanings, spread coordinates or astrological calculation code changed.

## Confirmed defects and implementation

| Priority | Before | After |
|---|---|---|
| P0 | Upstream `onDraw` ran at flight start. Parent immediately hid the ribbon node; final selection stopped its animation by entering preparation. | Selection ownership passes after the 460ms flight lands. One pending flight at a time, with immediate placing feedback; selected card mounts at real shelf scale with no opacity restart. Final preparation starts after arrival. Reset changes the sitting key, unmounting/cancelling the flight. |
| P0 | URL parser filtered bad tokens and allowed duplicates; malformed orientations could silently revert to seeded reversals. | Whole reading validates atomically: strict unique full-deck indices, matching spread count, uint32 seed, exact optional 0/1 orientation vector. Invalid links display a recovery message. Legacy valid links without orientation retain seeded reversals. Restore handles React's development effect replay. |
| P1 | Horizontal distance accumulated from pointer-down, making later vertical pull arbitrarily difficult. Candidate changed as pointer crossed other cards. | Separate browsing/pulling phases. Horizontal movement resets the vertical origin; deliberate vertical motion locks the card under the hand. Pull commits only on release. |
| P1 | Pointer cancel used the same tap/draw handler as pointer-up. | Cancellation, lost capture and withdrawn pulls return the card; never commit. Small incremental motion cannot masquerade as a clean tap. |
| P1 | Spring integrated 900-stiffness physics in one potentially 50ms step, producing unstable overshoot. | Bounded 120Hz substeps; deterministic tests cover 240Hz through multi-second stalled frames, bounded displacement and settlement. |
| P1 | Upright/reversed directions were hidden gestures. The local mobile tray would duplicate the new upstream full ribbon. | One ribbon on every viewport, visible previous/next and Draw upright / Draw reversed controls, 44px targets, readable instruction, Arrow/Home/End/Enter/Shift+Enter equivalents. Focus outline no longer overridden inline. |
| P1 | Upstream contained a second, independent AstralAudio engine, preference and button. | Removed it. Tarot sends only `oa-ritual` cues to the global Parlor controller owned by the audio integration task. |
| P2 | Idle riffle wrote transforms on all 78 cards continuously. | Event-woken animation loop settles after input/entrance, sleeps while idle, skips hidden documents, and gives reduced motion single-frame state updates. |
| P2 | Short screens put selected shelf cards over top navigation; controls competed with the ribbon. | Shelf respects a minimum top clearance, prompt follows shelf, ribbon baseline reserves lower control space. True short landscape theater still needs visual inspection. |

Manual orientation now consistently drives the revealed artwork, announcements, chapter text, result index, reading synthesis, inspector and copied URL. Per-card turning, Reveal all and Start over retain the prior owned timer cancellation.

## Validation

- 13 deterministic tests pass: 8 sharing/shuffle/reversal/timer cases and 5 gesture/physics cases.
- TypeScript `tsc --noEmit` passes after integration.
- Focused lint on the six changed implementation/test files passes after moving reset-only sheet state out of the result effect (final root run can confirm).
- No new dependency. No commit or deployment performed by this task. Oracle merge conflict resolved and owned files staged.

## Browser checks requested from root

1. `/oracle`: entry → spread chooser → draw 3 upright/reversed using visible controls; observe continuous ribbon flight and final preparation only after landing.
2. Mobile 390×844 and 390×667: ribbon, controls, prompt, shelf, all chapters and result scroll are reachable.
3. Twelve-card spread: all 78 cards reachable, count correct, full formation and larger result index available.
4. Reset during a flight, during preparation and during the final reveal: no old callback reopens the sitting.
5. Share URL with `draw=77,0,38&spread=three-card&seed=123456&o=1,0,1`; restore exact orientation and named cards. Duplicate draw and malformed orientation should show recovery rather than a fabricated reading.
6. Keyboard arrows/Home/End and Shift+Enter; loupe focus trap; reduced motion should deliver the same result. Root owns UI; these interactions have not been visually confirmed by this subtask.

## Chooser browser-QA follow-up

Root observed misleading large “Astronomer · Open now” tags and a Begin action below the first mobile viewport. Removed tier tags whenever entitlement is allowed; actual locked plans retain an explicit Requires label. Reduced tile padding/diagram height and header margins. The chooser body now scrolls independently while its Begin footer stays visible above the global sound/atlas control band, including 390×667. Focus entry is a named, keyboard-scrollable region. No entitlement or gate behavior changed.
