# Start here — Olivia Arcana session handoff

Updated 26 September 2026 (site-wide pass, v5, on top of the v4 mobile pass). This is the authoritative continuation document for this branch. Read it before older research, release notes, or archived prototypes. Brand and design rules: [BRAND.md](BRAND.md).

For work across earlier Olivia tasks, start with [the project history index](history/README.md), [decision history](history/DECISIONS.md), and [Git coverage audit](history/git-coverage-2026-09-26.md). Historical artifacts are separate from current source. The archive preserves recoverable files and documented decisions; it is not a complete recording of every unsaved edit or every conversation.

## Newest work: site-wide pass (v5), not yet in production

- Same branch, `claude/peaceful-clarke-scrh06` (draft PR #4 into `main`; do not merge without the owner's approval). v5 works through `experience/outputs/olivia-gap-audit-2026-09-26.md`. QA: `experience/outputs/qa-v5/review.md`. Record: `experience/outputs/olivia-v5-release.json`.
- **Production is still v3.** v5 is built and tested on this branch only.
- **Preview (v5):** https://deploy-preview-4--olivia-arcana.netlify.app/ (UK: `/uk/`) follows the PR head. The build of the tested commit `c19bdeb` is https://6ab820e030b21a0008ba98f9--olivia-arcana.netlify.app/ (deploy `6ab820e030b21a0008ba98f9`). Netlify's checks reported it published (3543 files uploaded, all 5 header rules processed). GitHub Actions CI passed on its first runs for the same commit. The build container cannot open `*.netlify.app`, so the preview itself was not loaded from here.
- What v5 changes:
  - **Speed.** Parallel ordered scripts, and the WebGPU background only with an adapter. Phone-sized hero textures (`cards-portal-phone/`, `hero.js` unchanged). WOFF2 fonts, UTF-8 bundles and an English-only app bundle. Lazy spread previews, immutable caching, stale builds pruned. Supabase and the night-room chrome are out of the shared website bundle. A phone's first 5 s drop from 8.5 MB to 4.9 MB.
  - **Brand around the product.** Manifest, link previews, 404 and the Ask page. Lapis ground everywhere. The Sky Atlas only on the four night rooms. `lang="uk"`, noindex for gates and placeholders, a pruned sitemap and service worker. `BRAND.md`.
  - **Trust.** An AI label on personal readings. A crisis-support note (`support-note.js`). Persistent storage and a Safari note in the almanac. Privacy, cookies, terms and refund pages rewritten for the real data flows (need legal review). Footer legal links. Same-origin only for the AI service, which now receives the curated card notes.
  - **Content.** Native Ukrainian card notes in «ви» (`card-notes-uk.js`, guide `UK-VOICE.md`) in the app, on `/uk/cards/` and in the AI context. 56 hand-written Minor Arcana reversals (`minor-reversed.js`).
  - **Inner pages.** One compact masthead (`AlmanacMasthead.tsx`) with the homepage's ivory button. Card art in both card libraries. Encyclopedia, share-button and checkout fixes. A Cyrillic body font (Onest) on Next pages. A bilingual error page.
  - **Motion.** `motion-tokens.css`, a light pass after the reveal, and soft page fades.
  - **Tooling.** CI in `.github/workflows/ci.yml`.
- Protected and verified: `hero.js` is byte-identical. The desktop hero and desktop homepage sections match v4 pixel for pixel (only the footer gains a legal row). Phone hero frames show no visible change with the pre-sized textures.

## Previous: mobile coherence pass (v4), not yet in production

- Branch: `claude/peaceful-clarke-scrh06`, built on `codex/session-handoff-2026-09-26` at `89ef292`. Continue from this branch; it contains everything below plus the v4 pass.
- Built assets: `experience.7aa05041408b09f0.css`, `app.ff457a817c7fbc31.js`, `font-4.51adb4c8c5dc00b8.woff2`. Record: `experience/outputs/olivia-mobile-v4-release.json`. QA: `experience/outputs/qa-mobile-v4/review.md`.
- **Production is still v3** (below). v4 was built and tested on this branch; it is not deployed to production.
- **Preview (v4):** the same PR preview URL showed v4 until v5 was pushed. Netlify built it for draft PR #4 (https://github.com/sergerommss95-cpu/olivia-arcana/pull/4, into `main`, not to be merged without the owner's approval). The build of the tested commit `6c9854d` is https://6ab7ea87917b4400080cbbc3--olivia-arcana.netlify.app/. Netlify's checks reported it published. The build container could not open `*.netlify.app` itself, and whether personal readings work there depends on the deploy-preview environment variables.
- What v4 changes: the drawn card stays on screen while a personal reading is prepared (a CSS specificity bug hid it on phones); the question step stays usable with the keyboard open; one filled action vocabulary covers the whole phone journey (secondary rows, +/− disclosure rows, press states); keep/saved states are correct (the first keep is never "Save updated reading"); the spread header and chosen-card receipt are legible; home symbol captions sit below the art; the almanac and Today are recomposed; a landscape touch fix covers the choose step; and Ukrainian UI text gets a designed Cyrillic face (Onest, OFL) instead of the system fallback, because DM Sans has no Cyrillic.
- Protected and verified unchanged: `hero.js` (SHA-256 `ea5578949b2e…`), the approved motion reference (`100608f7d72a…`), card artwork, the Olive Lattice back, selection/reveal handlers and the reading service. The EN desktop homepage is pixel-identical to v3.
- New source files: `mobile-coherence.css` (all v4 phone composition; loaded last), `save-state.js` and its tests, `mobile-reading.test.mjs`, `experience/work/onest-OFL.txt`.

## Current production state (v3)

- Base branch: `codex/session-handoff-2026-09-26`.
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
| Latest release record and QA | v5 (branch, not deployed): `experience/outputs/olivia-v5-release.json`, `experience/outputs/qa-v5/review.md`, audit `olivia-gap-audit-2026-09-26.md`. v4: `olivia-mobile-v4-release.json`, `qa-mobile-v4/review.md`. Production v3: `olivia-mobile-v3-release.json`, `qa-mobile-v3/review.md` |
| Phone composition (v4) | `experience/work/olivia-product/mobile-coherence.css` — loaded last; add phone layout fixes here rather than to the older layered mobile files |
| Brand and design rules | `BRAND.md` (supersedes `website/DESIGN.md`, `website/DESIGN_BRIEF.md`, `docs/DESIGN_SYSTEM.md`) |
| Card texts | EN: `content.js`, `minor-content.js`, `minor-reversed.js`. UK: `card-notes-uk.js` (voice guide `UK-VOICE.md`). After editing, run `node experience/work/tools/sync-card-notes.mjs` to refresh `website/src/lib/academy/tarot-notes.ts` (used by the AI service and `/uk/cards/`) |
| Inner-page header | `website/src/components/almanac/AlmanacMasthead.tsx` (used by `AlmanacShell` and `LegalShell`) |
| Motion vocabulary | `experience/work/olivia-product/motion-tokens.css` |

The product was originally edited outside this Git repository. This branch brings its editable source, all build inputs, references, and docs into `experience/`, retaining their relative paths. Do not edit generated hashed files as the primary source. Do not restore the old iframe homepage.

The directory name `hero-v12` is historical and supplies artwork only. Current runtime choreography is `experience/work/olivia-product/hero.js`; protected sections are compared to the approved September 24 reference by tests. Its mobile gate/lifecycle changed without replacing the choreography.

## Latest changes and rules to keep

v5 (this branch) — the full list is in `qa-v5/review.md`. Rules to keep:

- **Load order.** The homepage runs assets, hero, then the app; the WebGPU background loads last and only with an adapter. Don't put anything a button depends on into `background.js`.
- **Phone hero art.** `hero.js` reads `DETAIL_DATA`; below 700 px the asset map points it at `cards-portal-phone/` (512×1024, what `hero.js` draws there anyway). If a Major Arcana image changes, regenerate that folder with `experience/work/tools/phone-art.mjs`.
- **Bundles.** English entries load `app-en` (no Ukrainian data); Ukrainian entries (`/uk/`) and the portable file load `app`. Both come from `bundle-app.mjs`. A `?lang=uk` query on an English page therefore stays in English; link to `/uk/` instead.
- **AI honesty and safety.** Keep the provenance line on personal readings and the crisis note (`support-note.js`); both are covered by tests.
- **Ukrainian.** Formal «ви» everywhere, never «ти»; tests enforce it for card notes. Follow `UK-VOICE.md`.
- **Motion.** New CSS transitions use the tokens in `motion-tokens.css`. The hero keeps its own timing.
- **Inner pages.** Use `AlmanacShell`/`LegalShell` and the shared masthead; don't add sky chrome outside the four night rooms.

v4 — the full list is in `qa-mobile-v4/review.md`. Rules future phone work should keep:

- **Action vocabulary on phones.** There is one ivory primary action per step. Secondary actions are filled lapis rows with a trailing glyph. Optional content is a filled row with a +/− chip. Never use an underlined text link as a button, a bare triangle disclosure, or a frame around artwork.
- **Pending.** During pending, the drawn card(s) stay visible and every interpretation stays hidden. Watch selector specificity: `reading-pending.css` uses `:not(#id)`.
- **Save states.** `save-state.js` owns the labels. An unkept reading is `keep`, a kept reading with changes is `update`/`reflection`, and a kept reading with nothing new is `saved` (✓).
- **Ukrainian text** renders through a `unicode-range` Onest face registered under the `DM Sans` family. Keep it if fonts are changed.
- **Keyboard.** `body[data-mobile-keyboard=true]` plus `--mobile-viewport-height` drive the compact compose step.

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

`npm --prefix website run build` runs `next build` and then `website/scripts/postbuild.mjs`, which marks every exported `/uk/` page `lang="uk"`. Netlify's build command is `npm run build` for the same reason (v5). `python3 experience/build.py` also prunes asset files from earlier builds in `website/public/experience/assets/`.

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

v5 (this branch):
- 225/225 product tests, 7/7 mobile-question checks, 51/51 website and service tests. `experience/build.py` and `npm --prefix website run build` succeed. A rebuild from an empty output directory reproduces the 116 snapshot files byte for byte.
- Pixel comparison with v4: desktop hero at five journey positions within renderer noise; desktop homepage sections 0 pixels changed apart from the added footer row; phone hero frames (including mid-journey "Watch the journey") show no visible change.
- Phone journeys on the native export with a synthetic delayed reading, EN 390×844, UK 375×812 and 320×740: pending hides every interpretation and keeps the card; AI label; keep → "Saved ✓"; almanac with the Safari note; revisit; crisis note at the question and on single and spread readings. Reduced motion, desktop keyboard-only (UK) and inner pages at 390/1440 were checked. No overflow, no console errors.
- **Not tested on a physical iPhone, not deployed, and live AI generation not run** (no API key or network route from this container). The animated WebGPU background has never been seen from this container.

v4:
- 219/219 product tests, 7/7 mobile-question checks and 49/49 native/service tests; `experience/build.py` and `next build` succeed. A rebuild from an empty output directory reproduces the committed snapshot exactly.
- Rendered review in Chromium phone emulation (touch, DPR 2) of the full journey: EN 390×844, UK 375×812/320×740, 375×667, 320×568, and 844×390 landscape. No horizontal overflow and no console errors. The 5/8-card samples, keyboard-only readings through to save (desktop and phone), and reduced motion were all checked.
- Hero pixel comparison against v3 at five journey positions (desktop and phone): ≤0.025% changed, all inside the Ukrainian language label. EN desktop homepage sections are 0-pixel different at 1440 and 1024.
- The software keyboard was modelled by shrinking `visualViewport`; headless Chromium never opens one. **v4 has not been tested on a physical iPhone and has not been deployed.**

v3 (production):
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

Owner decisions that now block the biggest remaining gaps (see the audit): the astrology pages (redirect or separate brand), the paid offer and payment provider, a return channel (email/Telegram/push), a named editor, and the logo/app icon. Also confirm the company named in the legal pages and have a lawyer review them. Set a monthly spend limit for the AI key in the Anthropic console.

Engineering next steps, in order:
- Put the v5 preview on the owner's iPhone. Check the load and feel, the reveal light, the page fades, the crisis note and the Safari note, in EN and UK.
- Enable prompt caching once traffic is steady: split the system prompt into a cached shared block and a small per-spread/locale block; confirm with `usage.cache_read_input_tokens`. The shared prompt must be at least 1,024 tokens for Sonnet 5.
- A colour and type token pass on the CSS (tokens exist only for motion); a 12 px minimum for phone text.
- Browser smoke tests in CI (Playwright, EN/UK × phone/desktop).
- Keyed translations instead of matching English strings in `locale.js`.

Longer-standing items:

0. The preview https://deploy-preview-4--olivia-arcana.netlify.app/ (and `/uk/`) follows the branch head and now shows v5 (deploy `6ab820e030b21a0008ba98f9` for `c19bdeb`). From a browser, confirm it serves `experience.b4dc10712a673cd4.css` (v4 was `experience.7aa05041408b09f0.css`). Promote to production only with the owner's approval. On the device, check the keyboard with a real question, toolbar collapse during the deck, the held/reveal gesture, and pending → reading in EN and UK.
1. Collect the owner's iPhone feedback on v5 (or on production v3 if the preview is not reviewed). Test the three practice panels, question keyboard, single-card pull, three-card draw, held/reveal state, pending state and reading in EN and UK. Fix concrete clipping/scroll/gesture defects without replacing the design or approved motion.
2. v4 browser checks covered keyboard (modelled), reduced motion, short-height landscape and 5/8-card layouts; device inspection is still needed. Known follow-ups: the almanac still leads with practice tools before the first saved reading; pages other than the choose step use the desktop composition on landscape phones.
3. Keep production release records and this GitHub branch synchronized. The v3 release is live; do not send the user back to the older v2 preview, and do not describe v4 or v5 as live until deployed.
4. Restore and verify real account infrastructure, owner-scoped storage/sync, entitlements and a suitable verified payment flow before selling memberships. Existing product records are browser-local and can be lost if site storage is cleared; export/import is provided.
5. Continue EN/UK editorial review of question-specific synthesis for card relationships, clarity and unsupported certainty. A successful HTTP request does not establish reading quality.
6. Consider future features only after the core loop is satisfying. Shared live spreads, narrated voice ritual, simulated-client practice room, human reviews, camera recognition, sealed readings, collective statistics and yearly recap were discussed; they are **not implemented by this handoff**.

## Included history and excluded material

`experience/outputs/` includes strategy, competitor study, release records and QA notes. Their dates matter. `hero-lab/`, `handoffs/2026-09-21-master/`, source snapshots and integration backups are historical references, not current instructions. The older access handoff has obsolete IDs/service observations; prefer this file and current source.

`prepare.py` is an obsolete bootstrap generator and can overwrite current templates: do not run it. Generated bundles, dependency installs, local caches, raw personal screenshots/attachments, environment files and unrelated image-generation experiments were excluded. Unrelated local deletions of old experimental deck images were not staged or pushed. The original working checkout was left intact.
