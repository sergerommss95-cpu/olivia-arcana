# Start here — Olivia Arcana session handoff

Updated 26 September 2026. This is the authoritative continuation document for this branch. Read it before older research, release notes, or archived prototypes.

For work across earlier Olivia tasks, start with [the project history index](history/README.md), [decision history](history/DECISIONS.md), and [Git coverage audit](history/git-coverage-2026-09-26.md). Historical artifacts are separate from current source. The archive preserves recoverable files and documented decisions; it is not a complete recording of every unsaved edit or every conversation.

## Current state

- Branch: `codex/session-handoff-2026-09-26`.
- Current production: https://oliviaarcana.com/?revision=mobile-surfaces#discover
- Exact deployment: https://6ab7b1eb2e3eb145b023937a--olivia-arcana.netlify.app/
- Ukrainian production: https://oliviaarcana.com/uk/
- Production deploy ID: `6ab7b1eb2e3eb145b023937a`; Netlify site ID: `6a67384f-4d46-451e-ac61-f8108015fbfd`.
- Mobile v3 is deployed to production. The user's latest iPhone screenshots showed the old production mobile v1; v2 had existed only on a separate preview. This release promotes the v2 work and repairs the remaining cross-section frames and button surfaces. The user has not yet reviewed v3 on a physical iPhone.
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
| Latest release record and QA | `experience/outputs/olivia-mobile-v3-release.json`, `experience/outputs/qa-mobile-v3/review.md` |

The product was originally edited outside this Git repository. This branch brings its editable source, all build inputs, references, and docs into `experience/`, retaining their relative paths. Do not edit generated hashed files as the primary source. Do not restore the old iframe homepage.

The directory name `hero-v12` is historical and supplies artwork only. Current runtime choreography is `experience/work/olivia-product/hero.js`; protected sections are compared to the approved September 24 reference by tests. Its mobile gate/lifecycle changed without replacing the choreography.

## Latest mobile and button changes

The v3 repair removes automatic `olivia-edge` decoration in both native and product runtimes. Only explicit `data-liquid-edge` surfaces can opt in; none currently do. Do not restore blanket frames to cards, scene links or navigation. `mobile-home-sections.css` now supplies readable mobile spread captions, a contained sample card with a filled reveal action, a full-width almanac entry, and phone-specific symbols/footer spacing. Long Ukrainian reveal labels center independently of the artwork. These changes preserve hero/artwork and existing selection/reveal handlers.

Included from v2:

- A phone opening that fits one screen; the full approved cinematic sequence is optional through **Watch the journey**. Desktop scroll behavior remains available.
- Two-step phone question entry: compose, then choose how to read. It preserves text, optional personal-reading consent, native form submission, and focus when switching breakpoints.
- Larger manual selection with a prominent focal card, receding neighboring cards, and a separate held-card reveal.
- Larger reading artwork with title/orientation/question below, more readable prose, and a simpler save ending.
- A contained, one-panel-at-a-time practice carousel. Star artwork, journal note and captions no longer spill across panels. Pager buttons have filled selected states. Excess navigation is hidden during the ritual.
- Warm ivory primary buttons, filled lapis secondary buttons, recessed fields, and distinct hover/press/focus states. Art controls are excluded from generic disabled-opacity styling so dealt/revealing cards do not flash dim.
- EN/UK mobile copy and question-state restoration.

Main recent files: `mobile-question.js`, `mobile-experience.js/.css`, `mobile-ritual.css`, `mobile-reading.js/.css`, `mobile-home-practice.css`, `mobile-home-sections.css`, `action-surfaces.css`, `interactive-perimeter.js`, `spread-ui.js`, `app.js`, `hero.js`, and `build.py`.

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

### Local Netlify worktree caveat

The tracked root `.netlify/state.json` points at an obsolete site. Always explicitly use site `6a67384f-4d46-451e-ac61-f8108015fbfd`.

Netlify CLI 25 misdetects this isolated Git worktree because `.git` is a file. From `website/`, its remote `base=website` resolves to nonexistent `website/website`, and the error misleadingly says "Project not found." For the v3 deploy, the exact original bytes of `website/netlify.toml` were saved, `base = "."` temporarily inserted beneath `[build]`, then `netlify deploy --prod --no-build --dir=out --site=6a67384f-4d46-451e-ac61-f8108015fbfd` ran from `website/`. The original config was restored in `finally`. Do not commit that temporary base override: normal hosted Git builds need the repository-relative `website` base. This CLI's deploy command rejects `--config` despite base-command code referencing it.

The deploy includes Edge Function bundling even with `--no-build`; verify `/api/reading` and `/api/chat` afterward. A static-only upload is insufficient.

## Evidence and limits

- 212 existing product tests and seven additional mobile-question checks passed for the latest preview. The approved motion sections and original card bytes are covered.
- Source build validates generated references and JavaScript; native static build passed. Packaging in a separate checkout also passed 49 native/service tests and reproduced the exact current asset manifest and EN/UK markup.
- Backend test files are preserved; pytest was unavailable in the Python environments during packaging, so those tests were not rerun in this pass. Earlier release notes record 13 targeted checks; real account/payment flows remain unverified.
- Browser review at 375×667, 390×844, 430×932 and 1440×1000. Manual three-card selection and single-card choose/hold/reveal were exercised.
- Pending personal reading was checked using a local delayed synthetic response. That test fixture was not shipped. This final visual pass did not perform live paid generation or a payment transaction.
- v3 production `/` and `/uk/` returned 200 with the exact newly built stylesheet (`experience.b201b3ecb391a586.css`). `/api/reading` and `/api/chat` returned 200 with `available: true` on safe GET checks. Production mobile runtime loaded successfully, with no `olivia-edge` elements and no horizontal page overflow at 390px; no console errors were observed in that inspected page.
- v3 browser review additionally covered EN 390×844, UK 375×812 and 320×740, plus desktop 1440×1000. Sample flip controls, 8-position captions, almanac entry, symbols and compose/prepare controls were reviewed. See the v3 review record for the exact scope.
- **Not yet tested on physical iPhone Safari.** Safe-area/browser-toolbar behavior, touch scrolling, keyboard opening and gesture feel still deserve device testing.
- Earlier docs contain dated service observations; do not treat them as today's verified infrastructure status.

## Prioritized next work

1. Get the user's iPhone feedback on the current production v3 release. Test the three practice panels, question keyboard, single-card pull, three-card draw, held/reveal state, pending state and reading. Test EN and UK. Fix concrete clipping/scroll/gesture defects without replacing the design or approved motion.
2. Verify keyboard, reduced motion, short-height landscape and larger 5/8-card layouts. Existing tests and prior viewport checks help, but are not a substitute for device inspection.
3. Keep production release records and this GitHub branch synchronized. The v3 release is already live; do not send the user back to the older v2 preview.
4. Restore and verify real account infrastructure, owner-scoped storage/sync, entitlements and a suitable verified payment flow before selling memberships. Existing product records are browser-local and can be lost if site storage is cleared; export/import is provided.
5. Continue EN/UK editorial review of question-specific synthesis for card relationships, clarity and unsupported certainty. A successful HTTP request does not establish reading quality.
6. Consider future features only after the core loop is satisfying. Shared live spreads, narrated voice ritual, simulated-client practice room, human reviews, camera recognition, sealed readings, collective statistics and yearly recap were discussed; they are **not implemented by this handoff**.

## Included history and excluded material

`experience/outputs/` includes strategy, competitor study, release records and QA notes. Their dates matter. `hero-lab/`, `handoffs/2026-09-21-master/`, source snapshots and integration backups are historical references, not current instructions. The older access handoff has obsolete IDs/service observations; prefer this file and current source.

`prepare.py` is an obsolete bootstrap generator and can overwrite current templates: do not run it. Generated bundles, dependency installs, local caches, raw personal screenshots/attachments, environment files and unrelated image-generation experiments were excluded. Unrelated local deletions of old experimental deck images were not staged or pushed. The original working checkout was left intact.
