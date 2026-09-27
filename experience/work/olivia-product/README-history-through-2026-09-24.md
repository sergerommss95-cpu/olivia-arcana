# Historical implementation notes — not current instructions

These notes describe superseded builds. Use README.md and the current release record for implementation decisions.

# Current product build — 24 September 2026

## Recovered animation release — 25 September 2026

The hosted homepage's **Unfold the deck** control now opens `/animation/?play=1`,
which runs the preserved September 24 Light Leaks card-palette preview. Its two
original animation/shader scripts are unchanged. The normal homepage and reading
views retain their existing renderer; the dedicated player replaces the iframe
document during playback, so the two players do not run together.

Build the player with `python3 work/olivia-product/publish-reference.py`. This
checks the fixed source hash, preserves the original runtime, and adapts only
navigation and the preview toolbar for the live product. Copy
`outputs/olivia-animation/` to the website's `public/animation/` before the Next
build. `/animation/original.html` is the byte-identical archival version;
`provenance.json` records the source and runtime hashes. The portable product
HTML retains its integrated playback because it has no hosted animation route.

The player links to `/?experience=question`, `/?experience=spreads`, and
`/?experience=journal`, keeping product navigation within the current website.

The latest pass adds Today, a stable daily card, next steps and revisits, user-defined topic groups, private-safe sharing, durable single-card drafts and an explicit free three-card experience. Five/eight-card personal spreads retain verified membership access; account and billing services are not certified for launch. The implementation and limitations are documented in `outputs/olivia-product-evolution.md`, with research and service audit beside it.

Build with `python3 work/olivia-product/build.py`; verify with `node --test work/olivia-product/*.test.mjs` (52 tests). The build creates both `outputs/olivia-almanac.html` (fully embedded offline edition) and `outputs/olivia-experience/` (hosted edition with 87 current hashed assets and a manifest). Cache headers in the manifest are deployment recommendations, not host configuration. Initial hero artwork is still substantial; cold mobile performance remains a release check.

The new `practice-core.js` validates daily records, drafts and follow-up metadata without replacing legacy journal formats. `practice-ui.js` builds Today, method, membership and follow-up views; `practice.css` styles them. Its storage keys are `olivia-arcana-practice-metadata-v1`, `olivia-arcana-daily-reading-v1` and `olivia-arcana-current-reading-v1`. Follow-up fields become durable when saved; unsaved fields survive internal navigation and warn on close. No cloud sync, email reminders, analytics collection, JSON import, or live checkout is introduced.

## Full deck — 24 September 2026

The reading experience now uses all 78 cards: 22 Major Arcana and 14 each of Wands, Cups, Swords, and Pentacles. Stable IDs are defined in `deck-catalog.js`: Majors 0–21, Wands 22–35, Cups 36–49, Swords 50–63, Pentacles 64–77. Existing v1 saved readings keep their identities and remain readable.

All artwork comes from the existing Olivia `website/public/cards-portal` collection. The 22 Major Arcana images match the approved hero files byte for byte. The 56 Minor Arcana are copied unchanged into `assets/minor-arcana`; the build checks for missing and duplicate IDs. `DETAIL_DATA` remains limited to the hero's Major Arcana so the expanded reading deck does not upload 56 additional WebGL textures. `MINOR_DATA` is available to reading views separately.

The complete shuffled deck is available in both one-card and guided-spread readings. One-card readings browse groups of 9 or 13 backs in the existing cinematic fan (7 in the non-WebGL fallback). Spreads show 5 or 7 at a time. Browsing never reshuffles the session; selected cards cannot repeat. The optional automatic choice remains explicit. Three-card personal readings are now free; five/eight-card personal readings require verified membership.

Minor Arcana content lives in `minor-content.js`: each card has a reflective meaning, prompt, practice and learning note, plus a card-specific lens for spread positions. These are curated reflections, not generated analyses of a visitor's question. Court cards describe approaches or qualities without assigning gender or claiming to identify another person.

The downloadable HTML embeds the whole deck for offline use. It is larger than the 22-card edition; the hosted edition now splits the artwork into cacheable assets without changing the selection model.

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

The builder creates `outputs/olivia-almanac.html`, with embedded fonts, all 78 card images, the Olive Lattice reverse, JavaScript, styles, and the licensed Light Leaks shader bundle. It requires Python 3, Node.js, and the existing `work/background-study/node_modules` installation of esbuild and Shaders. It reads existing project artwork from `work/hero-v12/assets/public/cards-portal`, `outputs/olivia-card-back.webp`, and the shared embedded font files. Keep these inputs with the source when rebuilding.

The generated HTML can be distributed as one file. Use a stable HTTP origin for predictable browser storage; `file:` storage behaviour varies between browsers. `?motion=reduce` requests the static/reduced-motion presentation.

## Source responsibilities

- `template.html` and `style.css`: identity, product pages, responsive layout, accessible controls.
- `app.js`: question → selection → reading → journal routing and UI state.
- `core.js`: secure shuffle, immutable card selection, record validation, local storage, and JSON export.
- `content.js`: authored interpretations, reflection prompts, practices, and card lessons. The question accompanies the chosen card; this version does not generate an AI analysis of the question.
- `hero.js`: the existing cinematic card scene plus the bridge used to open the selectable deck.
- `preset.js` and `background.js`: the matched Light Leaks palette and background lifecycle.
- `build.py`: bundles the modules and embeds assets into the deliverable.

The visual reference is `outputs/olivia-light-leaks.html?revision=card-palette`. Its card choreography, scale, camera, and journey timing are retained for “Watch the journey.” Product entry uses a short opening portion of that same scene. The cinematic Moon is a demonstration; an actual reading is selected from a securely shuffled set of all 78 cards.

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

The live domain has not been changed. At that initial milestone, accounts, payments, cross-device sync, and AI-generated readings were outside the implementation. The guided-spread extension and its current release boundary are documented below.

## Guided spreads — 24 September 2026

The home now connects to three original member spreads through **Spreads** in the navigation and **Some questions need more room** below the hero:

- **A little clarity — 3 cards:** situation, complication, helpful next step.
- **At a crossroads — 5 cards:** central value, two named paths, an overlooked perspective, grounded next step.
- **The inner compass — 8 cards:** situation, root, inner perspective, outer influences, tension, support, release, next step.

Every spread uses the existing 22 Major Arcana and Olive Lattice back. The new animation uses CSS transforms and the Web Animations API; it does not create another WebGL renderer or change `hero.js`. Cards travel from the deck to authored positions over 1.4 seconds each. Reveals take 1.2 seconds, with a 1.6-second reading beat during playback. Manual reveal, pause/continue, immediate reveal, keyboard selection, responsive layouts, off-tab animation suspension, and reduced motion are supported. Leaving the ritual cancels its pending animation work.

The reading connects specific cards in specific positions; the three synthesis structures differ. Text is curated and does not claim to analyse the visitor’s question. See `SPREAD-RESEARCH.md` for sources and rationale. More cards mean more perspectives, not greater predictive accuracy.

### Source and data

- `spread-content.js`: position definitions, layouts, card-specific lenses and synthesis.
- `spread-core.js`: immutable unique selection, ordered reveal, validation and storage.
- `spread-ui.js`: library, membership bridge, dealing/reveal, interpretation and journal integration.
- `spread-core.test.mjs` and `spread-integration.test.mjs`: state/storage tests plus 264 complete content → record → restore combinations.

Spread storage is separate: `olivia-arcana-spreads-v1`, an envelope `{schemaVersion:1,records:[...]}`. A record retains question, intention, spread identity, ordered card IDs and positions, full curated interpretation, synthesis and reflection. Up to 100 spreads are retained. Reflection limit is 4,000 characters. The question form allows 240 characters; the two crossroads paths allow 120 each, keeping their combined stored question within 500. A complete spread is required before saving. The almanac’s combined download contains `oneCardReadings` and `guidedSpreads` envelopes; a spread-only export remains available. Import is not implemented.

### Membership and integration

Integrated entry: `http://localhost:8780/?experience=spreads`.

The same-origin parent supplies a server-derived entitlement through a request-ID-bound message. Both source window and origin are checked; tokens are never sent into the iframe. Loading, invalid, unavailable or unpaid states do not start personal spreads. All three spreads are available for recognized paid tiers. Fixed sample previews remain public, are clearly labelled, and have no personal save action. Saved readings remain readable independently of current membership.

`PersonalAlmanacHome.tsx`, `experience-subscription.ts`, `useSubscription.tsx`, `SavedSpreads.tsx`, `saved-spreads.ts` and the existing journal route connect the experience with the website. Local backend fixes correct FastAPI Bearer header binding, effective paid status, timezone comparisons and Paddle timestamp parsing. No checkout, webhook, purchase or deployment was performed against a live account.

**Release boundary:** this is a working local product integration. Personal spreads currently execute in the client after a verified UI entitlement. Their code/content is bundled, so this is not server-side enforcement of a paid reading service. Before a paid production launch, deploy the tested billing fixes, enable and verify the existing account/payment services and allowed origins, and put any protected paid reading operation behind server authorization. The repository currently defaults those services to paused and has a legacy prelaunch paywall bypass; the new spread gate does not use that bypass. Questions and notes remain device-local, with no account sync.

### Verification

- 20 one-card/spread core and integration tests passed, including 264 content/store/restore combinations.
- Parent message boundary, malformed entitlement, expired entitlement and allowlisted route tests passed; saved-spread parser tests passed.
- 21 focused backend payment/auth/status/webhook tests passed in an isolated environment.
- Production build and TypeScript passed (291 generated pages).
- Browser checks covered normal dealing/reveal, pause/continue, instant reveal, fixed preview isolation, simulated-member personal five-card selection, exact save/reload/restore, combined journal availability, remove/undo and removal not reappearing as a draft.
- Desktop and 390px mobile layouts were inspected; touch selection uses 48px cards in a scrolling row on mobile. Explicit reduced motion completed all eight reveals immediately.

The paid browser test fixture is separate under `work/qa-spreads`, served on an isolated localhost origin, and is not included in the product or public site build.

### Artistic spread refinement — 24 September 2026

The spread library now presents one authored composition of the actual deck alongside three editorial choices. Each selection changes the arrangement; the approved hero, back artwork and card faces remain unchanged.

`spread-motion.js` supplies distinct curved dealing paths, dimensional reveals and reading holds for clarity, crossroads and compass. Its pure keyframe helpers leave cancellation, visibility pausing and reduced motion with the existing UI controller. Rotated slots receive coordinates in their own local space.

`spread-editorial.js` supplies concise card-and-position leads. Full original interpretations are retained in disclosures. A native dialog displays the artwork at a useful viewing size. Connections are explored one at a time, with the corresponding cards shown together; reflection and saving remain available. Saved records keep the existing schema and exact draws.

Verification: existing 20 core/content/persistence tests passed; desktop/mobile layouts, three/eight-card previews, personal five-card selection/dealing/reveal, artwork dialog, chapter navigation and keyboard focus, reduced-motion mode, pause/resume/skip, and save/reload/restore were checked in the browser. The paid-flow check used a separate local simulated membership fixture; it does not certify production billing or server-side reading authorization.
