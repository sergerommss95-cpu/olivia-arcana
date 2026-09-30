# Amielle — Full deck review

A standalone review collection for all **78 Amielle card identities**, with six optional couple variants. Opening this gallery does not change the production deck.

Open `index.html` directly, or serve this directory locally. The finished page embeds `readings.json` and uses only local scripts, styles, fonts and artwork. It has no runtime network dependencies.

## Review experience

- The collection displays entire card fronts without cropping.
- Filters show all 78 cards, the 22 Major Arcana, or the 56 Minor Arcana.
- Opening a card expands a single reading above the collection. Upright and reversed readings, a reflection question and artwork notes are available in English and Ukrainian.
- Previous/next follows the active collection filter; returning restores focus to the originating card.
- The optional couple-art preference changes The Lovers, The Devil and Four of Wands only. It does not change their readings. Language and artwork preferences are saved only in the browser's local storage, with graceful fallback if storage is unavailable.
- Reduced motion is respected. Native buttons, radio inputs and visible keyboard focus are retained.

## Files and data

`index.html`, `gallery.css`, and `gallery.js` form the standalone gallery. `readings.json` is the editorial source of truth. The JSON is also embedded in the `reading-data` script element in `index.html`, allowing `file://` use without a fetch request. If readings change, replace the contents of that script element with the current JSON before publishing.

Each card record uses `id`, `slug`, `number`, and bilingual `title`, `theme`, `scene`, `upright`, `reversed`, and `question` fields. The renderer expects IDs 0–77, in that order. Artwork paths use `assets/NN-slug.webp`.

Optional couple versions append `-men` or `-women` to the filenames for cards 06, 15 and 25. These alternatives are visible personal preferences, not inferred user identity or demographic profiles.

## Font provenance

The gallery uses the original project's self-hosted font assets, copied without modification:

- `fonts/cormorant-italic.ttf` from `outputs/olivia-experience/assets/font-1.0b9a8a33cfaa624d.ttf`
- `fonts/cormorant-regular.ttf` from `outputs/olivia-experience/assets/font-2.6d37a86241a25d63.ttf`
- `fonts/dm-sans.ttf` from `outputs/olivia-experience/assets/font-3.b0ae3e89a7d3ef2b.ttf`

Both supplied SIL Open Font License notices are included in `fonts/`: `cormorant-OFL.txt` and `dmsans-OFL.txt`, copied from the project's `work/` directory. The original remote font references remain documented in `work/fonts.css`.

Cormorant copyright: 2015 the Cormorant Project Authors. DM Sans copyright: 2014 The DM Sans Project Authors. Preserve the complete bundled license notices when redistributing this gallery.

## Scope

This gallery is a local review surface for the shared artwork and bilingual data. Production integration is handled separately; this continuation does not publish or deploy.

## Full collection continuation

The September 30 continuation adds 54 Minor Arcana without replacing the 24 approved identities or six couple variants. New full-deck readings use `amielle-relationships-v2`; previous `v1` saved readings retain their original Minor imagery and meanings. PNG generation sources remain local, while reviewable WebP assets and generation manifests are tracked. No publishing is authorized for this continuation.
