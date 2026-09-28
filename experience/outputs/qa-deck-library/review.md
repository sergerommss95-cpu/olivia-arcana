# Deck collection review — 28 September 2026

Implemented in the authoritative Git checkout. See [DECK_LIBRARY.md](../../DECK_LIBRARY.md) for architecture and future extensions.

## Verified locally

- Native English and Ukrainian collection routes render outside the old site shell, with localized metadata, headings, links and controls.
- Desktop 1440 × 1000 and phone 390 × 844: no horizontal page overflow; full artwork compositions and usable controls.
- Front/reverse toggle uses The Hidden Garden exactly. Three front-art previews per deck.
- Choosing The Space Between persists after navigation/reload and carries into both reading types.
- Typed question survives visiting the library and beginning a reading.
- Three cards individually picked, revealed and saved. After switching preference to Olivia, reopening that spread still uses all original Space Between fronts and reverse.
- A single card was picked, held and revealed on mobile. The final reading and recovered draft use its Space Between artwork.
- English/Ukrainian language links open the corresponding deck route. Existing unsaved-reading protection still applies to full page navigation.
- Product suite: 225 passing. Website suite: 49 passing. Native static build passes. Approved hero motion regression suite passes.

## Release boundary

Netlify returned a successful **draft** deploy, `6aba91b29e3a832d20ea7cb8`. Production was not changed. Initial verification encountered DNS failures, which later cleared. Both deck routes return HTTP 200, the deployed page loads and renders in the browser, and /api/reading and /api/chat return available:true. No AI generation request was made. The temporary CLI base override was restored byte-for-byte.

Physical iPhone review remains valuable. AI generation was not exercised or changed by this feature.

## Production — Amielle rename

The user approved **Amielle**, then explicitly requested deployment. Renamed all active EN/UK display names and metadata, keeping the persistent ID stable. Nine targeted tests and the native build passed. Published deploy `6aba987a183c0d45b862fe07` at 2026-09-28T16:45:20.394Z. Verified the live home, /decks/, /uk/decks/, interactive browser rendering, both AI service availability endpoints, and exact live manifest equality with the checked build. No AI generation request was made.


## Production integration repair — 28 September 2026

The manually published Decks build was replaced by an automatic build of divergent `main`, which did not contain either Decks route. Merged current production changes into the Decks source and merged PR #10 to `main` as `800aae38bf48b054f486c8edaaa0e08179ecd652`. The combined preview is `6abaa3ee429a9c000868986c`.

- 264 product checks and 59 website/service checks pass; GitHub CI passes.
- Both `/decks/` and `/uk/decks/` return 200 on the preview; its manifest exactly matches the rebuilt source.
- The native export now validates both Decks pages and all 78 images plus reverse for each deck. Verified it rejects an export with a missing Decks route.
- Desktop collection boots and loads both decks; no console errors.
- Phone 390×844: Amielle selection → question → manual choice → held card → reveal → saved reading, with Amielle artwork and no horizontal overflow.
- Ukrainian phone collection renders all artwork and translated controls without horizontal overflow.
- Main's phone arrival, learning resources and static-export language fix are retained. Shared lazy resources survive deck switching. Mixed-deck daily pairs resolve each historical artwork independently, and artwork-specific tours remain attached to their original artwork.
- Hero choreography is unchanged. Physical-device verification and paid AI calls were not repeated.

Production verification: deploy `6abaa4d61e3d900008f70a08` from main commit `800aae3` published at 17:35:52 UTC. `/decks/`, `/uk/decks/`, `/`, `/learn/` return 200; production manifest matches the checked build; safe GET checks confirm reading and chat availability.
