# Olivia Arcana — product experience

This local implementation connects the approved editorial hero to a complete first visit: bring a question, choose one card, read a curated interpretation, write a reflection, and keep or revisit the reading in a personal almanac. A clearly labelled Hermit sample is separate from personal draws. Links connect the experience to the existing academy, daily almanac, and full Oracle spread.

## Build and preview

Run from the workspace root:

```sh
python3 work/olivia-product/build.py
node --test work/olivia-product/core.test.mjs
python3 -m http.server 8765 --directory outputs
```

If the preview server already occupies port 8765, reuse it. Open `http://127.0.0.1:8765/olivia-almanac.html`.

The builder creates `outputs/olivia-almanac.html`, with embedded fonts, all 22 Major Arcana images, the Olive Lattice reverse, JavaScript, styles, and the licensed Light Leaks shader bundle. It requires Python 3, Node.js, and the existing `work/background-study/node_modules` installation of esbuild and Shaders. It reads existing project artwork from `work/hero-v12/assets/public/cards-portal`, `outputs/olivia-card-back.webp`, and the shared embedded font files. Keep these inputs with the source when rebuilding.

The generated HTML can be distributed as one file. Use a stable HTTP origin for predictable browser storage; `file:` storage behaviour varies between browsers. `?motion=reduce` requests the static/reduced-motion presentation.

## Source responsibilities

- `template.html` and `style.css`: identity, product pages, responsive layout, accessible controls.
- `app.js`: question → selection → reading → journal routing and UI state.
- `core.js`: secure shuffle, immutable card selection, record validation, local storage, and JSON export.
- `content.js`: authored interpretations, reflection prompts, practices, and card lessons. The question accompanies the chosen card; this version does not generate an AI analysis of the question.
- `hero.js`: the existing cinematic card scene plus the bridge used to open the selectable deck.
- `preset.js` and `background.js`: the matched Light Leaks palette and background lifecycle.
- `build.py`: bundles the modules and embeds assets into the deliverable.

The visual reference is `outputs/olivia-light-leaks.html?revision=card-palette`. Its card choreography, scale, camera, and journey timing are retained for “Watch the journey.” Product entry uses a short opening portion of that same scene. The cinematic Moon is a demonstration; an actual reading is selected from a securely shuffled set of all 22 Major Arcana.

## Private journal and data format

The journal is local to the browser and origin. There is no account sync, database write, interpretation API request, or deployment in this change. Questions and reflections are not sent to a server by this experience. Clearing browser data removes saved entries; the UI provides JSON downloads for backups. Downloads are exports, not an implemented import workflow.

Storage key: `olivia-arcana-readings-v1`

```json
{
  "schemaVersion": 1,
  "records": [
    {
      "schemaVersion": 1,
      "id": "unique-reading-id",
      "createdAt": "2026-09-24T12:00:00.000Z",
      "updatedAt": "2026-09-24T12:00:00.000Z",
      "question": "What deserves my attention?",
      "intention": "open",
      "cardId": 9,
      "cardName": "The Hermit",
      "interpretation": {
        "meaning": "Curated card meaning.",
        "prompt": "A question for reflection.",
        "practice": "A small suggested practice.",
        "connection": "Optional intention framing."
      },
      "note": "The reader's own reflection."
    }
  ]
}
```

Limits: 100 saved readings; questions up to 500 characters; reflections up to 4,000 characters. Intentions are `open`, `relationships`, `work`, or `change`. Card numbers are integers 0–21. Timestamps use UTC ISO format. The core rejects corrupt or unsupported saved data instead of filtering and overwriting it. Blocked storage, quota exhaustion, and journal capacity produce explicit failures; the UI must only claim a successful save after `saveRecord` returns.

In-memory drafts are not a durable backup. A saved reading is the durable browser-local record. Rendering uses text nodes for questions and notes. The same-tab update event is `olivia:journal-change`; other tabs receive the browser's `storage` event.

## Existing website integration

The local Next.js project is `/Users/macbookpro/olivia-arcana/website`.

- `src/app/page.tsx` renders `src/components/almanac/PersonalAlmanacHome.tsx`.
- That component hosts the experience in a same-origin iframe at `/experience/index.html?site=1`. This preserves the approved scene's viewport and scroll behaviour while sharing origin-local journal storage with the site.
- `public/experience/index.html` is a copy of the generated `outputs/olivia-almanac.html`. Copy a fresh build there after changes; the standalone builder does not update it automatically.
- `?site=1` sends academy, daily, and Oracle links to the existing site routes in the top-level window.
- `src/components/almanac/SavedReadings.tsx` reads the shared journal format. Its journal link opens `/experience/index.html?site=1#journal`.
- Pre-integration versions of the homepage, layout, and client shell are kept in this source folder's `integration-backup/` directory. Restore deliberately rather than overwriting unrelated later work.

Start the existing website from its directory with `npm run dev`. Its production verification command is `npm run build`. The production build, TypeScript check, and all 291 generated routes passed after replacing the remote DM Sans build dependency with a licensed local font and correcting the iframe fallback markup.

## Verification and release boundary

The core's eight Node tests passed during implementation. They cover shuffle integrity and rejection sampling, stable choice, validation limits, updates/exports, malformed-store preservation, storage failures, and the 100-entry limit.

Before publishing, verify the full reading/save/resume flow, keyboard selection, small-screen layout, reduced motion, background fallback, unsaved draft recovery, removal/undo, and both standalone and embedded navigation. The current work is a local development integration; no live site was deployed.

## Completed verification — 24 September 2026

- Eight core tests passed; all three embedded scripts pass syntax checks.
- Browser-tested question → actual card selection → interpretation → reflection save → journal → reload → restore. Keyboard card selection and explicit reduced motion were exercised.
- Checked 390 × 844 mobile question/selection screens and the desktop layout. Short-height forms receive a scrollable minimum-height region.
- Confirmed unfinished saved-record edits survive a journal detour, and never-saved drafts appear as “Unsaved draft” without claiming persistence.
- Confirmed the Hermit sample is labelled and offers no personal-reading save action.
- Confirmed a saved entry from the integrated homepage appears on the existing /journal route on the same origin.
- Confirmed cinematic playback works, its camera/card paths and rounded-card geometry match the approved source exactly, and background state changes to suspended while hidden.
- Fixed the site hydration issue and passed the complete production build. A separate MutationObserver message was reproduced on a zero-JavaScript static iframe probe in the in-app browser; it is not produced by the product scripts.

The live domain has not been changed. Accounts, payments, cross-device sync, and AI-generated readings are outside this implementation.
