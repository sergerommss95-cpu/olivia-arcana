# Deck library — implementation handoff

Updated 28 September 2026. This describes the current source addition, not a production deployment. See the latest release record for deployment and browser QA status.

## Product decision

The collection gives a reader a choice of visual world before drawing, without adding another required onboarding step. Both available decks contain the same 78 stable tarot identities:

| ID | Deck | Role | Reverse |
|---|---|---|---|
| `olivia` | Olivia | General use: daily life, work and change | Existing lapis/ivory Olive Lattice |
| `space-between` | The Space Between / Простір між нами | Connection, intimacy and boundaries | **The Hidden Garden**: ivory and plum marble olive leaves, restrained gold olives, aubergine velvet |

The user explicitly corrected an earlier selection: **Hidden Garden is selected, not The Silk Seal**. Do not substitute the pleated ivory fans or the old oversized twisted-marble reverse.

Deck choice changes artwork. It does not claim different predictive accuracy, silently change card meanings, or select a spread on the reader’s behalf. Both decks are available without a paid deck gate in this implementation. Existing verified-membership rules for larger personal spreads remain separate.

## Routes and experience

- `/decks/` and `/uk/decks/` are native Next routes with localized metadata, canonical/hreflang links and server-visible collection content. They reuse the existing native experience runtime with `entry="decks"`.
- `#decks` is the in-experience view, also available in the portable preview.
- The collection shows large artwork compositions, three front previews per deck, a reverse toggle, material descriptions, a visible selected state, **Use this deck**, and **Begin a reading**.
- **Use this deck** saves the preference while leaving the reader in the collection. **Begin a reading** chooses that deck and opens question entry, or returns to the spread question form that opened the collection.
- The question and spread forms include a compact deck-back preview and **Change deck** action. Homepage navigation, footer, almanac links and mobile navigation expose the collection.
- The approved homepage hero and homepage illustrations remain Olivia’s original lapis artwork. The card renderer can use the chosen deck during the reading ritual; it returns to original artwork on the homepage. Its protected camera, geometry, materials, choreography and 96-second timing are not replaced.

## Source of truth

| Area | Editable source |
|---|---|
| Deck registry, preference, artwork resolver, EN/UK metadata | `work/olivia-product/deck-library.js` |
| Collection UI and responsive styling | `work/olivia-product/deck-library-ui.js`, `deck-library.css` |
| Question-form deck control | `work/olivia-product/deck-selection.css`, `app.js` |
| Original 78 card identities and names | `work/olivia-product/deck-catalog.js` |
| New deck web assets and provenance | `work/olivia-product/assets/decks/space-between/` |
| Source packaging and generated manifest | `work/olivia-product/build.py`, top-level `experience/build.py` |
| Single/spread record schemas | `work/olivia-product/core.js`, `spread-core.js` |
| Draft, daily, question-history and backup preservation | `practice-core.js`, `question-history.js`, `almanac-backup.js` in the same product directory |
| Native routes | `website/src/app/decks/page.tsx`, `website/src/app/uk/decks/page.tsx` |
| Server markup, entry state and native runtime | `website/src/components/almanac/NativeExperienceHome.tsx`, `NativeExperienceRuntime.tsx`, `website/src/lib/experience-shell.ts` |

The hosted `website/public/experience/` snapshot and its hash-named assets are generated. Edit the source, rebuild, then inspect the result. Do not patch generated bundles as the main implementation.

### Artwork mapping

The new deck includes 78 front WebPs plus `back.webp`, approximately 13.2 MB in total. The source manifest records dimensions, output and original SHA-256 checksums, original filenames and encoding. Web images are 768 pixels wide; source PNGs were approximately 958 × 1642 pixels.

- `00`–`21`: The Fool through The World.
- `22`–`35`: Wands, Ace through King.
- `36`–`49`: Cups, Ace through King.
- `50`–`63`: Swords, Ace through King.
- `64`–`77`: Pentacles, Ace through King.

All application views use these stable IDs. Never reorder the catalogue to accommodate a deck’s filenames. The builder verifies all 79 specialist WebPs exist and emits hash-addressed assets plus `window.OLIVIA_DECK_ASSETS`. `window.OLIVIA_ASSETS` remains the original deck. The generated manifest contains separate `decks.olivia` and `decks["space-between"]` asset maps.

Original generated PNGs are local design masters in the earlier workspace’s `outputs/olivia-space-between-78-2026-09-28/` and `outputs/olivia-space-between-backs-2026-09-28/`. Their provenance is retained in the web-asset manifest; these PNG folders are not required for a fresh source build. The selected reverse source is `02-the-hidden-garden.png`. These web assets do not constitute print-ready prepress artwork.

## State and history guarantees

The browser preference is the raw deck ID under `olivia-preferred-deck-v1`. It is device-local. Missing, unknown or unavailable preferences fall back to Olivia; storage failure leaves in-memory choice usable. Only a registered deck with all 78 fronts and a reverse can be chosen.

The controller distinguishes **preferred deck** from **active artwork**. Returning home or reopening an older reading may temporarily display another deck without changing the preference for future draws.

Every new single/spread session captures `deckId`. The identity persists through choice, reveal, record creation, drafts, saved readings, daily records and JSON export. Missing `deckId` in old records normalizes to `olivia` without rewriting storage during a read. Explicit unknown IDs fail validation. An existing saved draw or draft cannot change decks when a note is edited.

Use `assets.forRecord(record)` for stored readings, journal/revisit thumbnails, share-image export and question-history snapshots. Do not render history from the current preference. Question-history snapshots carry their own `deckId`, so their artwork remains identifiable if the source reading is later absent. Backup import verifies deck identity alongside the question, date, card IDs, orientations and spread positions; it does not silently replace a conflicting draw.

Today’s existing reading retains its original deck for the rest of that local day. Choosing another deck does not redraw today’s card. Manually logged physical cards and curated Symbol Trails retain original Olivia representational artwork in this version.

## Build and verification

From the repository root, after installing the locked dependencies described in [README.md](README.md):

```sh
node --test experience/work/olivia-product/*.test.mjs
node experience/work/olivia-product/mobile-question.review.mjs
python3 experience/build.py
npm --prefix website run build
node --test website/src/lib/*.test.mjs website/netlify/edge-functions/_shared/*.test.mjs
```

The product suite passed **225/225** on 28 September after the schema/backup compatibility fixes. New coverage includes `deck-library.test.mjs` and `deck-identity.test.mjs`; existing question-history, backup, draft and legacy-deck tests were extended. Approved motion regression tests remained green in that run. This test count is a dated observation, not a substitute for rerunning the current tree.

Before release, visually exercise both routes and languages on desktop and phone; change decks before single and spread draws; reopen records from the other deck; inspect artwork/reverse toggles; check reduced motion, selected-state focus and mobile card bounds. Verify a backup round trip and daily-card preservation. Browser QA and final build/deployment evidence belong in the release record; they are not implied by unit-test success.

## Extending the collection

Add a complete, reviewed deck and provenance manifest first. Keep the shared 78-card semantic mapping. Update both registry and schema allowlists (`deck-library.js` and `core.js`), build asset mapping, localized metadata and previews, then add identity/asset checks. Keep future decks visible as a collection only when they actually exist; do not advertise unfinished concepts as selectable products.

Useful next refinements are more artwork browsing, card-level editorial review for each deck and reader feedback about when they choose each one. A future paid collection would need real entitlement handling and explicit purchase terms; no deck commerce is implemented here.
