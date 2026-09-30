# Amielle — Six studies in connection

Created 29 September 2026 for Olivia Arcana. This is a review collection, not an update to the live 78-card deck.

## What is included

Six relationship-focused card identities, twelve finished artworks, English and Ukrainian upright/reversed readings, artwork notes and a reflective question per card.

| Card | Relationship focus | Artwork options |
| --- | --- | --- |
| VI The Lovers | Attraction becoming a freely made choice | Woman & man / Two men / Two women |
| IX The Hermit | Chosen space within a connected life | Shared artwork |
| XI Justice | Reciprocity, agreements and accountability | Shared artwork |
| XV The Devil | Desire, habit and freedom within attachment | Woman & man / Two men / Two women |
| Four of Wands | Everyday devotion and making a home | Woman & man / Two men / Two women |
| Eight of Cups | Leaving with dignity and memory | Shared artwork |

## Review

Hosted review: https://6abbbd6884e2dc00c2613777--keen-pastelito-ae4ca3.netlify.app/

Open `index.html` directly, or serve this directory. The gallery works offline and embeds its reading data. Tap a card for an enlarged artwork and its reading. English/Ukrainian and upright/reversed controls are functional. Keyboard focus returns to the originating card when a reading closes; Escape also closes it. Reduced-motion preferences are respected.

The optional couple-art selector changes three images without changing meanings or the other cards. It stores an artwork preference in local browser storage, not a sexuality field. It makes no inference about identity and sends no preference to a server. Choosing an edition is not required to view the collection. For future product integration, show the three artwork previews in the deck chooser and permit changes from deck settings; keep the artwork preference distinct from reading content and account demographics.

## Files

- `originals/`: twelve final generated PNGs, approximately 958 × 1642 px each; original image proportions retained.
- `assets/`: twelve high-quality WebP equivalents used by the gallery. No cropping or compositional alteration.
- `readings.json`: canonical bilingual editorial content.
- `editorial-notes.md`: interpretive principles and distinctions from Olivia.
- `prompts-and-provenance.json`: exact prompts, reference roles, generation source paths and the Eight of Cups hand revision.
- `index.html`, `gallery.css`, `gallery.js`, `fonts/`: standalone review gallery.

All artwork was created with built-in ImageGen. The approved Amielle back provided materials and palette; a newly generated Lovers card set the collection's sculptural treatment. Subsequent cards were generated as distinct scenes, and each couple variant was edited from the corresponding finished base card. One targeted image edit corrected the unsupported cup in the first Eight of Cups render. WebP conversion used ordinary format conversion only.

## Visual direction

Close, emotionally legible scenes in veined ivory marble, deep aubergine velvet and restrained antique gold. Love is expressed through contact, care, fair exchange, shared domestic life, chosen solitude and leaving. Recognizable tarot symbols remain: blessing and paired figures; lantern and staff; scales and sword; chains and horned imagery; four garlanded staffs; eight cups and departure. Eight of Cups deliberately reinterprets the traditional eight abandoned cups as seven left behind and one carried.

## Status and continuation

Verified with actual artwork at desktop width and 390 × 844: no horizontal page overflow, all artwork loads, couple preference updates the correct three cards, and the enlarged mobile artwork fits the available width without cropping. English/Ukrainian, upright/reversed, next/previous and focus restoration were checked. The gallery script passes syntax validation.

This collection is ready for art-direction review. It does not claim that all 78 Amielle cards or live readings have been reworked. No production deck assets, hero motion, AI service or account settings were changed. If approved, use this as the visual/editorial reference before developing the remaining cards. Any eventual live integration must carry a deck/artwork edition identifier separately from semantic card identity, preserve saved-reading artwork and implement bilingual relational interpretations deliberately.
