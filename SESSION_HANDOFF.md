# Start here — Olivia Arcana session handoff

Updated 26 September 2026. This is the authoritative continuation document for this branch. Read it before older research, release notes, or archived prototypes.

## Current state

- Branch: `codex/session-handoff-2026-09-26`.
- Latest reviewed preview: https://6ab7a60c552dea441e399f9a--olivia-arcana.netlify.app/
- Photographed-section fix: https://6ab7a60c552dea441e399f9a--olivia-arcana.netlify.app/#discover
- Ukrainian preview: https://6ab7a60c552dea441e399f9a--olivia-arcana.netlify.app/uk/
- Preview deploy ID: `6ab7a60c552dea441e399f9a`; Netlify site ID: `6a67384f-4d46-451e-ac61-f8108015fbfd`.
- This latest mobile v2 was **not deployed to production**. Production at the end of this session still had the earlier mobile v1. The user has not yet approved the new phone experience on a physical iPhone.
- This branch includes local predecessor commits `433ffb0` and `9510387`, previously ahead of origin/main, plus the current source/integration. It is a continuation snapshot, not a claim that every proposed feature is launch-ready.

## What the user wants

A beautiful, cinematic and mysterious tarot product, with tactile card selection and an unmistakably personal experience. Mobile should use the phone format rather than compress desktop. Keep the approved lapis/navy, ivory, restrained antique gold, card artwork and Olive Lattice back.

Repeated pain points to avoid reintroducing:

1. Replacing the approved hero with an older or visually different animation. This happened repeatedly. Preserve the current reference tests, camera, card paths, material, scale, and 96-second journey timing.
2. Cards being selected automatically or moving to a new page abruptly. The person chooses, holds, then deliberately reveals a card. An explicit automatic alternative is allowed; it is not the default.
3. Tiny cards, clipped edges, doubled-back flips, crowded strips and captions colliding with art.
4. Overwhelming text or backend explanations in the ritual. The reading should answer the question through the selected cards, in a warm, specific voice. Keep AI/service explanation available in the method/FAQ without implying that a human wrote an automated answer.
5. Thin perimeter rectangles around everything. The user's latest direction is solid, inviting action surfaces and press feedback; do not restore blanket outlined-text buttons.
6. Revealing prepared card meanings while a personal reading is still being generated. Pending should show the Olivia logo/progress, then reveal the reading.
7. Treating green tests as proof of excellent design. Review the actual experience and be candid about remaining work.

## Source of truth

| Area | Location |
|---|---|
| Editable tarot product | `experience/work/olivia-product/` |
| Rebuild instructions | `experience/README.md` |
| Build + native sync entry | `experience/build.py` |
| Generated hosted snapshot | `website/public/experience/` |
| Native EN/UK server-rendered homepage integration | `website/src/components/almanac/NativeExperienceHome.tsx`, `NativeExperienceRuntime.tsx` |
| Native application, SEO, other pages | `website/src/` |
| Personal-reading and conversation service | `website/netlify/edge-functions/reading.ts`, `chat.ts`, `_shared/` |
| Account/payment source repairs | `backend/` and corresponding website clients |
| Immutable approved motion reference | `experience/outputs/olivia-approved-motion-2026-09-24.html` |
| Latest release record and QA | `experience/outputs/olivia-mobile-v2-release.json`, `experience/outputs/qa-mobile-v2/review.md` |

The product was originally edited outside this Git repository. This branch brings its editable source, all build inputs, references, and docs into `experience/`, retaining their relative paths. Do not edit generated hashed files as the primary source. Do not restore the old iframe homepage.

The directory name `hero-v12` is historical and supplies artwork only. Current runtime choreography is `experience/work/olivia-product/hero.js`; protected sections are compared to the approved September 24 reference by tests. Its mobile gate/lifecycle changed without replacing the choreography.

## Latest mobile and button changes

- A phone opening that fits one screen; the full approved cinematic sequence is optional through **Watch the journey**. Desktop scroll behavior remains available.
- Two-step phone question entry: compose, then choose how to read. It preserves text, optional personal-reading consent, native form submission, and focus when switching breakpoints.
- Larger manual selection with a prominent focal card, receding neighboring cards, and a separate held-card reveal.
- Larger reading artwork with title/orientation/question below, more readable prose, and a simpler save ending.
- A contained, one-panel-at-a-time practice carousel. Star artwork, journal note and captions no longer spill across panels. Pager buttons have filled selected states. Excess navigation is hidden during the ritual.
- Warm ivory primary buttons, filled lapis secondary buttons, recessed fields, and distinct hover/press/focus states. Art controls are excluded from generic disabled-opacity styling so dealt/revealing cards do not flash dim.
- EN/UK mobile copy and question-state restoration.

Main recent files: `mobile-question.js`, `mobile-experience.js/.css`, `mobile-ritual.css`, `mobile-reading.js/.css`, `mobile-home-practice.css`, `action-surfaces.css`, `spread-ui.js`, `app.js`, `hero.js`, and `build.py`.

## Product already implemented in this accumulated session

- Complete 78-card catalogue, all original images, optional reversals.
- Manual single-card and 3/5/8-card spread flows, explicit sample experiences and verified-membership gates for larger personal spreads.
- Question preparation and approved spread positions, question-aware synthesis, structured readable sections, pending-state gate, saving and downloading readings.
- Daily practice, local almanac, next steps, topics, revisit dates, observations/outcomes, question histories, living-deck marks and personal meanings.
- Manual physical-card entry by name/orientation; this is **not camera recognition**.
- Validated local backup/import and coordinated removal/Undo.
- Calendar-file reminders, including optional new/full moon check-ins using Astronomy Engine. These are **not server push notifications**.
- Curated Symbol Trails and illustrated homepage product previews.
- Native EN/UK pages, translated product flows, `/uk/ask/`, server-visible homepage content and sitemap work.
- Service prompts and handlers grounded in the exact selected cards, positions, orientations and user question. Unrelated journal/birth data is not silently sent with synthesis.
- Narrow bearer-header, membership-status and subscription-date handling repairs in the backend, with targeted tests. Those repairs do not prove a working paid backend.

## Rebuild and verify

Follow `experience/README.md` for the complete fresh-checkout sequence. At minimum:

```sh
npm --prefix experience/work/background-study ci --ignore-scripts
npm --prefix experience/work/olivia-product ci --ignore-scripts
node --test experience/work/olivia-product/*.test.mjs
node experience/work/olivia-product/mobile-question.review.mjs
python3 experience/build.py
npm --prefix website ci --ignore-scripts
npm --prefix website run build
```

For native integration/service checks:

```sh
node --test website/src/lib/*.test.mjs website/netlify/edge-functions/_shared/*.test.mjs
```

No secrets are required for static build or local prepared readings. Optional AI needs the server environment described in `website/netlify/edge-functions/_shared/README-reading.md`. Never copy `.env` contents into Git or a handoff. Account/payment flags are intentionally separate; do not turn them on simply to make a demo appear complete.

`website/out/` is the native static export. Publish with the site's Netlify edge-function configuration; uploading static HTML alone omits the personal-reading service. A Git push to the handoff branch is not a production deployment. Inspect current Netlify settings before merging to main because historical project notes describe automatic deployment there.

## Evidence and limits

- 212 existing product tests and seven additional mobile-question checks passed for the latest preview. The approved motion sections and original card bytes are covered.
- Source build validates generated references and JavaScript; native static build passed. Packaging in a separate checkout also passed 49 native/service tests and reproduced the exact current asset manifest and EN/UK markup.
- Backend test files are preserved; pytest was unavailable in the Python environments during packaging, so those tests were not rerun in this pass. Earlier release notes record 13 targeted checks; real account/payment flows remain unverified.
- Browser review at 375×667, 390×844, 430×932 and 1440×1000. Manual three-card selection and single-card choose/hold/reveal were exercised.
- Pending personal reading was checked using a local delayed synthetic response. That test fixture was not shipped. This final visual pass did not perform live paid generation or a payment transaction.
- Preview `/`, `/uk/`, assets and `/api/reading` returned 200. No console errors were observed in the reviewed preview.
- **Not yet tested on physical iPhone Safari.** Safe-area/browser-toolbar behavior, touch scrolling, keyboard opening and gesture feel still deserve device testing.
- Earlier docs contain dated service observations; do not treat them as today's verified infrastructure status.

## Prioritized next work

1. Get the user's iPhone feedback on this exact preview. Test the three practice panels, question keyboard, single-card pull, three-card draw, held/reveal state, pending state and reading. Test EN and UK. Fix concrete clipping/scroll/gesture defects without replacing the design or approved motion.
2. Verify keyboard, reduced motion, short-height landscape and larger 5/8-card layouts. Existing tests and prior viewport checks help, but are not a substitute for device inspection.
3. Confirm whether the user wants the preview promoted; do not conflate this GitHub handoff with deployment.
4. Restore and verify real account infrastructure, owner-scoped storage/sync, entitlements and a suitable verified payment flow before selling memberships. Existing product records are browser-local and can be lost if site storage is cleared; export/import is provided.
5. Continue EN/UK editorial review of question-specific synthesis for card relationships, clarity and unsupported certainty. A successful HTTP request does not establish reading quality.
6. Consider future features only after the core loop is satisfying. Shared live spreads, narrated voice ritual, simulated-client practice room, human reviews, camera recognition, sealed readings, collective statistics and yearly recap were discussed; they are **not implemented by this handoff**.

## Included history and excluded material

`experience/outputs/` includes strategy, competitor study, release records and QA notes. Their dates matter. `hero-lab/`, `handoffs/2026-09-21-master/`, source snapshots and integration backups are historical references, not current instructions. The older access handoff has obsolete IDs/service observations; prefer this file and current source.

`prepare.py` is an obsolete bootstrap generator and can overwrite current templates: do not run it. Generated bundles, dependency installs, local caches, raw personal screenshots/attachments, environment files and unrelated image-generation experiments were excluded. Unrelated local deletions of old experimental deck images were not staged or pushed. The original working checkout was left intact.
