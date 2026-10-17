# M3b R6: final pass (commit 6fd94d6)

This pass covers phones, accessibility, performance, typography and print. It closes out the owner-chosen redesign ("direction A + B's table glance + DM Sans body").

## Checks run

- **Tests:** 370 passed, 0 failed.
- **Static checks:** eslint and tsc are clean. `npm run build` exits 0; its only warning is the existing MODULE_TYPELESS one.
- **Screenshot matrix** (64 shots in this folder; console clean on every run):
  - every combination of EN/UK × 1440×900, 390×844, 820×1180 × glance, opening, facets, plate, practice, numbers, keep, mini-map, Why drawer;
  - reduced motion: EN/UK × 1440×900 and 390×844 × glance and plate;
  - the UK maps;
  - a print-emulation shot taken after `beforeprint`.

## Numbers

| Measure | Before | After |
|---|---|---|
| Phone first view images, 390×844 @1x | 15 files, 924.3 kB | 14 files, 199.3 kB |
| Phone first view images, 390×844 @3x | 21 files, 2340.7 kB | 14 files, 199.3 kB |
| First-load JS `/portrait/`, raw / gzip | M3: 1161.6 / 360.2 kB | 1199.9 / 371.5 kB |
| First-load JS `/uk/portrait/`, raw / gzip | M3: 1147.0 / 355.8 kB | 1185.3 / 367.1 kB |
| CLS, page load plus a full scroll | EN 820: 0.139, EN 1440: 0.031 | EN 0 / 0.0001 / 0.0062; UK 0 / 0.0287 / 0.0199 (390 / 820 / 1440) |

## Contrast

Each ratio is measured against the pixels behind the text, across 17 states.

| Text | Minimum | Target |
|---|---|---|
| Body | 9.00:1 | 7:1 |
| Meta | 5.69:1 | 4.5:1 |
| Label | 6.25:1 | 4.5:1 |
| Unlit mini-map caption | 6.13:1 (was 2.58:1) | 4.5:1 |
| Gilt label | 6.87:1 | 4.5:1 |

## Fixes carried into R6

1. **Count-aware glance note.** It says "three" or «Три» on phone and tablet, where the fan shows three cards, and "four" on desktop.
2. **Labels.** They move from 14px/500 to 15px/600 with 0.04em tracking. The 600 weight of Cormorant SC is now loaded and the unused 400 dropped.
3. **Display typography.** `src/lib/portrait/typography.js` provides `typeset()` and `typesetStages()`, both tested.
   - EN gets ’ ‘ ’ “ ”. UK gets « », „ “ for quotes inside quotes, and ’.
   - Dashes stay with the word before them.
   - It runs once in Reader. The Why drawer, `buildExport`, the keep title, the saved list and the forget dialog also use it.
   - Stored data is never changed.
4. **Print insurance.** `readyForPrint()` switches lazy card images to eager and decodes them, capped at 3 s.
   - A `beforeprint` handler starts it, and the Print button waits for it to finish.
   - The browser's own print menu cannot be blocked, so there it only starts the loads.
5. **Mid-size card art.** `scripts/card-mid.mjs` uses sharp to cut `public/cards/mid/` for the 22 Majors at 420×720 (783 kB in total).
   - `cardSrcSet()` offers 120w, 420w and 896w everywhere portrait cards render, with `sizes` checked against the rendered widths.
   - The mini-map and the cards map load lazily.

## Accessibility

- **Headings**, EN and UK, with no skipped level:
  - h1;
  - h2: essence, opening, facets, both parts, numbers, maps, keep;
  - h3: the five facets, the chapters, cards, sky;
  - h4: other planets.
- **Tab path:** Begin → Contents → "Your eleven cards" → the Opening's Why → the 5 facet toggles → the 6 chapter Whys → the 11 map cards → sky → Save, Download, Print → New portrait.
- **Live region:** announces "Writing the chapters" at 4.4 s, then "The portrait is written." at 12.0 s. UK: «Пишуться розділи», «Портрет написано.»
- **Layout:** no horizontal overflow at any size, and every image has alt text.
- **Touch targets:** 44 px hit areas for "Why these cards?" and the facet "+".

## Critique, polish and audit

The page passed the anti-pattern check, which looks for generic "AI-made" design tells.

| Severity | Finding | Fix |
|---|---|---|
| High | On phone and tablet the plate card was small and centred, away from its left-aligned caption. | The plate is left-aligned. On phone the card is `min(60vw, 240px)`, and from 720 px it sits beside its words. |
| High | CLS was 0.139 at 820×1180 when a reading reopened, because the footer rose into the 70vh hold. | `.hold` is now `min-height: 100vh`. |
| Medium | Unlit mini-map captions measured 2.58:1. | The card art is veiled with the card's own `--front-dim`, and the caption sits at 0.62. |
| Medium | Desktop glance roles wrapped and pushed the names out of line. | Name first, role beneath, with 8 px more spacing. |
| Medium | The tablet glance fan stayed at phone size. | 156 px at tablet width. |
| Medium | On tablet, an open facet's cards trailed after its text. | The cards sit in a side column at tablet width. |
| Medium | The phone's first view fetched full-size art. | Mid-size cuts and lazy loading. |
| Medium | Lazily loaded art could print blank. | The print insurance above. |
| Low | The UK phone birthday line started with "·". | On phones the meaning takes its own line. |
| Low | Lit mini-map threads showed between caption words. | A ground is drawn under each caption line. |
| Polish | Small touch targets. | 44 px hit areas via `::after`, leaving the layout unchanged. |
| Low, open | Palette tokens are redeclared in 6 CSS modules. | Left for a later consolidation. |
| Low, open | UK CLS at 820 is 0.0287, caused by the shell footer. | Under the 0.05 target. |
