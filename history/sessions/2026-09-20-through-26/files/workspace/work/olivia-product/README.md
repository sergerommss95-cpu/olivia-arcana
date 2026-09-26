# Olivia Arcana — personal practice release candidate

Current authority: 25 September 2026. This source builds the native tarot experience and its portable HTML edition. Historical release notes live in `README-history-through-2026-09-24.md`; do not use their old animation, iframe, storage or service instructions.

## Preserve the approved experience

The native homepage directly runs the locked `hero.js` choreography. Never replace it with another motion revision or an embedded page. Preserve the current camera, paths, scale, timing and reference tests. Hero SHA-256: `413304f1cea159c67fee3f8542cf5f95ebb6358891f2c08b91c38f76a965a5b2`.

New product views continue the lapis/navy ground, ivory type, original artwork and restrained antique gold. Card selection belongs to the user. Automatic selection is an explicit alternative. Cards and orientations never change after a draw is confirmed.

## Current product

- All 78 cards; optional reversed orientations; manual single-card and guided spread selection.
- Optional question preparation: original, understanding, decision or conversation; an explicitly approved three-position plan remains attached to its reading.
- Optional, disclosed question-aware AI; prepared meanings stay available independently. Saved AI text carries its source and language.
- Illustrated lower homepage: question/card/next-step scenes, interactive 3/5/8 spread layouts, deliberate sample-card reveal and sample almanac timeline. Examples are explicitly labelled.
- Optional first impressions before prepared interpretation, kept separately from later reflection and never sent to AI.
- Local almanac with next steps, topics, return dates, outcomes and private calendar check-ins. Optional next new/full moon dates use Astronomy Engine in the visitor’s time zone.
- Explicit question histories with immutable original reading snapshots and appended dated observations. Topic matching never links readings automatically.
- Three curated Symbol Trails (Light, Water, Thresholds) with complete original artwork and side-by-side comparison; nine inspected cards, not a claim of annotations for all 78.
- Up to 1,000 single-card and 1,000 spread records, subject to browser quota. Removal and Undo coordinate readings, practice notes, meaningful marks, question links, daily references and drafts.
- Topic journeys and a living deck of user-written personal meanings linked to source readings. Meaningful marks never affect draw probabilities.
- Physical-card entry by name and orientation, without generating a substitute draw.
- Validated export/import with conflict detection and rollback; recovery exports for damaged stores.
- English and Ukrainian product flows, with a native `/uk/ask/` conversation route.

## Build and validate

Run from the workspace root:

```sh
npm --prefix work/olivia-product ci --ignore-scripts
node --test work/olivia-product/*.test.mjs
python3 work/olivia-product/build.py
```

The builder creates `outputs/olivia-almanac.html` and `outputs/olivia-experience/`. It requires Python 3, Node.js, the installed esbuild/Shaders dependencies in `work/background-study/node_modules`, original artwork in `work/hero-v12/assets/public/cards-portal`, the minor artwork under this source's `assets/minor-arcana`, the approved back in `outputs/olivia-card-back.webp`, and existing embedded font inputs.

For the native website, sync the hosted output into `/Users/macbookpro/olivia-arcana/website/public/experience/`, then build that Next.js project. Its edge functions are required for optional AI. The portable HTML supports local practice; it does not include a hosted AI service or cross-origin question handoff. Serve it from a stable origin for predictable browser storage.

## Source responsibilities

- `app.js`, `template.html`, CSS: routing, layout, lifecycle and integration.
- `core.js`, `spread-core.js`: immutable selected cards, validation and local records.
- `question-coach.js`, `question-guidance.js`: approved editorial plans and explicit AI requests/saves.
- `practice-core.js`, `practice-ui.js`: daily readings, drafts, topics and follow-ups.
- `living-deck.js`, `almanac-journey.js`: joined history and user-confirmed card meanings.
- `physical-reading.js`: faithful manual entry from a physical deck.
- `almanac-backup.js`: backup preview, validation, import and recovery.
- `followup-reminder.js`, `lunar-checkin.js`: private calendar check-ins and opt-in lunar dates. Astronomy Engine is pinned to 2.1.19, MIT; phase calculations follow its [SearchMoonPhase documentation](https://github.com/cosinekitty/astronomy/blob/master/source/js/README.md#searchmoonphasetargetlon-datestart-limitdays--astrotime--null).
- `home-showcase.js/.css`: illustrated homepage examples; no draw or storage side effects.
- `question-history.js/.css`: explicit question links, dated observations and backup merge validation.
- `first-impression.js/.css`: original observations, immutable once saved.
- `reading-removal.js`: coordinated deletion and recovery with rollback.
- `symbol-trails.js/.css`: curated artwork observations and reflective comparisons.
- `hero.js`, `background.js`, `preset.js`: approved animation and card-matched shader.
- `build.py`: reproducible hosted and embedded builds, including resource and artwork validation.

## Service and release boundaries

Free core practice is available. Five/eight-card personal readings require verified membership; do not fabricate entitlements or billing success. Browser-local records are not account sync. Calendar exports are not automatically enabled notifications. Never send journal history, notes or birth details as part of optional AI question synthesis.

See `outputs/olivia-product-release-candidate.md` for the current preview, test evidence, editorial limitations, service blockers and excluded roadmap features. This is a working review candidate; it is not certified for a paid commercial launch.
