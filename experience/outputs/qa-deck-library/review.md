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
