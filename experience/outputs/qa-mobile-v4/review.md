# Mobile coherence pass (v4) — 26 September 2026

Branch `claude/peaceful-clarke-scrh06`, built on handoff commit `89ef292`. Not deployed to production. Built assets: `experience.7aa05041408b09f0.css`, `app.ff457a817c7fbc31.js`, `font-4.51adb4c8c5dc00b8.woff2`.

## Which release was inspected

This container could not reach `oliviaarcana.com` or `*.netlify.app`; the environment's egress policy refused both. Production identity is therefore taken from the v3 record (`experience.b201b3ecb391a586.css`). A clean build of `89ef292` reproduced that stylesheet hash byte-for-byte, and all of the audit below ran against that exact v3 build first, then against this branch.

## What the audit found in v3

Rendered in Chromium with phone emulation (touch, DPR 2) at EN 390×844, UK 375×812 and UK 320×740 through home → question → format → deck → held card → reveal → pending → reading → keep → almanac → revisit, plus the three-card spread.

1. **Pending reading lost the drawn card on phones.** `reading-pending.css` hides `.reading-copy>:not(#reading-copy-guidance)`. The `:not(#id)` carries ID specificity, so it outranked the phone rule that was meant to keep the card header visible. The chosen card flew into an empty box, and only the wordmark remained.
2. **Keyboard hid Continue.** The compose step kept its full-height layout above an open keyboard; the action sat underneath the keys.
3. **The first save of a personal reading said "Save updated reading"**, although nothing had been saved.
4. **The end of a reading read as a list of text links.** Underlined text links, bare-triangle disclosures, double rules around tools, the save confirmation far below its button, and "Saved ↗" still looking like an invitation.
5. **Spread header:** "← Back" overflowed a small circle; the chosen-card receipt used 22 px outlined slots with unreadable numbers.
6. **Format step:** a long question was cut through the middle of a line (UK 320).
7. **Home:** symbol captions ("The lantern", "The veil") sat on top of the artwork; three-card preview captions were staggered and collided ("What complicates i|A helpful…").
8. **Almanac:** an oversized intro and an empty double-ruled band pushed the saved readings below the fold.
9. **Deck hint said "select it with a click"** on phones.
10. **Ukrainian interface text had no designed font.** DM Sans contains 0 Cyrillic glyphs, so every Ukrainian control, label and paragraph fell back to the system sans.
11. Spreads page: the personal-reading checkbox butted against its words (`.spread-entry label[for]{display:block}` outranked the flex row); the 3/5/8 disclosure was an unstyled triangle.
12. Today: the draw button sat under the bottom navigation on short phones.
13. Landscape phones (wider than 700 px) received the desktop choose composition in 390 px of height: eyebrow, steps and heading collided with the header and the deck.

No horizontal page overflow and no console errors were found in v3 or v4.

## Changes

- `mobile-coherence.css` (new, loaded last, phone-only except one landscape-touch block): one action vocabulary — ivory primary, filled lapis secondary rows, filled disclosure rows with a +/− chip, visible press states, no perimeter frames. It also:
  - keeps the drawn card visible and larger during pending; the answer still waits behind the Olivia wordmark;
  - lays out a keyboard-aware compose step and shows the long-question preview in full, up to four lines;
  - orders the save area as keep → confirmation → optional reflection → backup → ways to return, with a distinct saved state;
  - adds pill header controls and a readable receipt (36/32/27 px slots for 3/5/8 cards) to the spread ritual;
  - moves the symbol captions below the artwork and aligns the three preview captions;
  - makes the almanac and supporting pages more compact, recomposes Today (including 375×667 and 320×568), and adapts the landscape choose layout for touch.
- `save-state.js` (+ tests): one set of save labels and states for one-card readings and spreads. An unkept reading is always a first keep. Only a kept one shows "Save updated reading". Saved shows ✓ and a quieter surface.
- `mobile-reading.js` (+ tests): on phones the save confirmation moves directly beneath its button; widening restores the original order exactly.
- `mobile-question.js`: with the keyboard open, the compose step stays scrolled to the top so the question and Continue remain together.
- `app.js`: on coarse pointers the deck hint reads "Tap a card, or pull it upward…" (Ukrainian included).
- `template.html` + `home-showcase.css`: symbol crops became `<figure>` + `<figcaption>`, so the captions are no longer layered on the art. Desktop appearance is unchanged (verified by pixel diff).
- `fonts-inline.css`: Onest Regular 2.001 Cyrillic subset (OFL-1.1, 6.7 KB) added under the `DM Sans` family with a Cyrillic `unicode-range`. Latin text keeps DM Sans. Its license ships in `LICENSES.txt` and the embedded license comment.
- `locale-uk.js`: two new strings.

Unchanged: `hero.js` (SHA-256 `ea557894…`), approved motion reference (`100608f7…`), background/shader, card artwork and Olive Lattice back, spread/selection handlers, reading-service prompts and edge functions, account/payment code.

## Verification

- `node --test experience/work/olivia-product/*.test.mjs`: **219/219** (212 existing + 7 new). `mobile-question.review.mjs`: 7/7. Native/service `node --test`: 49/49. `experience/build.py` and `next build` succeed. A rebuild from an empty output directory reproduces exactly the committed snapshot.
- **Hero:** pixel comparison of base vs branch at journey positions 0, .18, .42, .63 and .86 on desktop 1440×1000 and phone 390×844 found ≤0.025% of pixels changed, all inside the "Українська" header link (now rendered in the Cyrillic companion). The card choreography, camera and material are identical.
- **Desktop EN:** every homepage section (practice, spreads, sample, memory, symbols, footer) is 0-pixel different at 1440×1000 and 1024×768. The question view differs only in the language link.
- **Phone journeys (final build):** EN 390×844 and UK 320×740 single card; EN 390×844 and UK 375×812 three-card spread; EN/UK home. All: no horizontal overflow, no console errors. During pending, meaning, prompt, practice and title are hidden, and the drawn card stays visible.
- **5- and 8-card sample spreads** at 390×844: readable receipt, large focal card, captions clear of the art.
- **Keyboard-only**, desktop 1440 and phone 390: question → format → deck (arrows) → Enter → focus on Reveal → Enter → focus on the card title → Tab to Keep → saved.
- **Reduced motion**, UK phone: instant reveal, and pending keeps the card.
- **Short and landscape:** Today's draw sits above the navigation at 375×667, 320×568 and 390×844. At 844×390 landscape, the choose heading and navigation no longer overlap the deck, and the held card and Reveal are separated.
- **Keyboard opening** was modelled by shrinking `visualViewport` (headless Chromium never opens a software keyboard).

## Not verified

- **Physical iPhone Safari.** Toolbar collapse, safe areas with real notches, the software keyboard, and gesture feel still need a real device.
- The deployed preview itself: https://deploy-preview-4--olivia-arcana.netlify.app/, built by Netlify for draft PR #4, was reported published by Netlify's checks but could not be loaded from the build container. Live AI generation, the payment/account flows and server notifications were also not tested.

## Still worth doing next

- The almanac still opens with practice tools before the first saved reading. The first saved reading could lead on phones.
- Landscape phones use the desktop composition for pages other than the choose step. Check them on a device before recomposing.
- Service copy about AI remains in method/FAQ. Editorial review of question-specific synthesis in EN and UK is still open.
