# Start here — Olivia Arcana session handoff

Updated 28 September 2026: fixes, the card academy and Learn to read, merged into `main` (PR #6) and in production. Before that, 27 September 2026, second session: the live preview check, research for the award plan, and the phone arrival (v6, section 1 of the award plan). Earlier that day: the arrival findings and the award plan, after the site-wide pass v5 on top of the v4 mobile pass. This is the authoritative continuation document for this branch. Read it before older research, release notes, or archived prototypes. Brand and design rules: [BRAND.md](BRAND.md).

For work across earlier Olivia tasks, start with [the project history index](history/README.md), [decision history](history/DECISIONS.md), and [Git coverage audit](history/git-coverage-2026-09-26.md). Historical artifacts are separate from current source. The archive preserves recoverable files and documented decisions; it is not a complete recording of every unsaved edit or every conversation.

## Deployment integration — 28 September 2026

The Decks release was published manually at 16:45 UTC (`6aba987a183c0d45b862fe07`), but it existed only on `codex/session-handoff-2026-09-26`. At 16:54 UTC, `main` commit `e241dee` automatically deployed without those changes (`6aba9b6e59e42c000828ed78`), making `/decks/` and `/uk/decks/` return 404. This was a source-branch divergence, not browser cache.

The repair combines the Decks work with current `main` before publishing, retaining the phone arrival, learning pages and production fixes. Publish from the integrated `main` history: do not promote old standalone branch builds over it. Build with `python3 experience/build.py` followed by `npm --prefix website run build`; the postbuild check requires both Decks routes and both complete 78-card asset sets.

The specialist deck is **Amielle** in both languages, with the **Hidden Garden** reverse. Keep its internal `space-between` ID stable for saved readings and preferences. See [Decks implementation](experience/DECK_LIBRARY.md) and [release record](experience/outputs/olivia-deck-library-release.json). Historical production statements below are dated snapshots; this integration section takes precedence.

## Archived continuation notes (27 September 2026)

- **State.**
  - Branch `claude/peaceful-clarke-scrh06`, draft PR #4 into `main`: https://github.com/sergerommss95-cpu/olivia-arcana/pull/4. CI (`.github/workflows/ci.yml`) is green and the PR merges cleanly. **Never merge without the owner's approval.**
  - Production is still v3.
  - Preview of this branch: https://deploy-preview-4--olivia-arcana.netlify.app/ (and `/uk/`), now v6. The v6 build of `0889b9e`: https://6ab92b77b5d4da00084b874f--olivia-arcana.netlify.app/. The v5 build of `c19bdeb`: https://6ab820e030b21a0008ba98f9--olivia-arcana.netlify.app/.
  - Pushes that change nothing under `website/` cancel the Netlify build. That is expected.
  - One session works on this branch. The earlier session's check-in on PR #4 was switched off at the owner's request; it can be re-enabled in the owner's Routines.
- **Network and tools** (checked 27 September).
  - The preview, `oliviaarcana.com` and `www.brrranding.com` answer from the container.
  - `www.awwwards.com` resets the TLS handshake after the proxy opens the tunnel. That is the far end, not the environment's policy. WebFetch and web search still reach Awwwards pages.
  - Playwright's Chromium does not trust the proxy's certificate authority until you add it:
    `apt-get install -y libnss3-tools && certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt`
  - The tools import `playwright`; link the global install next to them (`experience/.gitignore` ignores it):
    `mkdir -p experience/work/tools/node_modules && ln -sfn /opt/node22/lib/node_modules/playwright experience/work/tools/node_modules/playwright`
  - `experience/work/tools/`:
    - `arrival-filmstrip.mjs` films the first seconds (phone on 4G with a 4× CPU, and desktop).
    - `phone-journey.mjs` walks the one-card phone journey (EN 390×844, UK 375×812), declining the AI reading.
    - `phone-art.mjs` regenerates the phone textures and phone card back (it needs `npm --prefix website ci` for sharp).
    - All three take a URL or `website/out`.
- **Done on 27 September (second session).**
  1. **Live preview check of v5:** `experience/outputs/qa-v5/review.md` ("Live preview check") and `olivia-v5-release.json` (`live_check`).
  2. **Research** added to [the award plan](experience/outputs/award-plan-2026-09-27.md) ("What 2026 winners do in their first seconds"): recent winners open with no loader or a brief text one, lose most points on usability and accessibility, and BRRRANDING features studio-made identities only.
  3. **Section 1 of the award plan, approved by the owner, built as v6** (below; QA `experience/outputs/qa-v6/review.md`).
     - Phones open in their own composition from the first frame (CLS 0).
     - The opening card stands where `hero.js` draws it.
     - The opening and the second question step fit Safari's visible height.
     - A phone homepage is 2.43–2.48 MB over the wire in English, and 2.56 MB in Ukrainian (v5: 3.57 MB and 3.65 MB).
- **Next.**
  - The owner checks v6 on an iPhone and an Android phone (plan item 6): the arrival, the WebGPU background's smoothness and battery use, text contrast over it, and the fixed button on the question step.
  - Whether to close the last 0.06 MB for Ukrainian: softer textures, AVIF, or a lighter Next runtime on the homepage.
  - Then the owner chooses from sections 2 to 5 of the award plan. Nothing there is approved yet.
- **Owner decisions still open:**
  - From the award plan's sections 3 and 4: the logo and identity, and whether a person designs them so the brand qualifies for BRRRANDING; the astrology pages; hiding membership until an offer exists.
  - Legal review of the legal pages, and confirmation of the company they name.
  - The Anthropic spend limit.
  - The channel for inviting people back.
  - A named editor.

## Newest work (28 September 2026): fixes, card academy and Learn to read — in production

- **In production since 28 September 2026, 16:03 UTC.** The owner asked for the deploy. PR #6 (https://github.com/sergerommss95-cpu/olivia-arcana/pull/6, branch `fix/2026-09-28`) was merged into `main` as `2699b22`, and Netlify published it as deploy `6aba8f2e26da670008284e95`, about 3 minutes after the merge. CI was green on Node 22.
  - Commits: `c62657d` (almanac rail and every spread open), `4291355` (78 card pages and 28 Symbol Trails), `e52b9fa` (Learn to read), `28d30df` (card spreads, carving walk, hub), `5d5be39` (Pair lab, Celtic Cross, spread designer), `16d34b7` (fixes from the preview check: link previews, focus, Ukrainian date).
  - **Rollback:** publish v6 deploy `6ab94b20212dd9000886073c` again in Netlify's deploy list, or revert `2699b22` on `main`.
  - Checked on the deploy preview and again in production by independent agents: `hero.js` and `background.js` are byte-identical to v6. All 726 sitemap URLs return 200. There are no page or console errors on the home routes, lessons, pair pages or the lab. The reading-service guards return 403, 400 and 415, and no paid call was made. The phone first load is about 25 KB heavier than v6 (+0.8%: app bundle +21 KB and CSS +4 KB, gzipped).
  - **PR #5 (v7, `claude/peaceful-clarke-scrh06`) now conflicts with `main`** in `SESSION_HANDOFF.md`, `experience/work/olivia-product/app.js`, `practice-ui.js`, `build.py` and `website/src/app/sitemap.ts`, and in the generated `website/public/experience` files. Merge `main` into that branch, resolve the conflicts, and run `python3 experience/build.py` to regenerate the assets before merging it.
  - Follow-up PR #7 (same day) fixes what the production check found in the new features and one v6 gap:
    - "Add it to my reflection" now opens the collapsed notes and moves focus into them.
    - The Ukrainian counters read «Деталь 1 / 9», «Крок 1 / 7» and «Урок 1 / 5»; in uppercase, «З» looked like the digit 3.
    - The Ukrainian "Інші розклади" panel is translated; since v6 it had shown English spread names.
  - Existing issues from v6, still open: the skip link reads "Skip to main content" on `/uk/` pages, and some older pages lack `og:image` and a canonical link.
- **Learn to read** (`/learn`, `/uk/learn`): 29 bilingual lessons in five paths (`website/src/lib/learn/lessons/*.json`, types in `lessons.ts`, index regenerated by `scripts/academy-leaves-index.mjs` on predev/prebuild). Interactive tools are chosen per lesson by `tool` and prepared server-side in `components/learn/LessonTool.tsx` (question lab, look first, one card in three positions, look at the whole, your sentence, two worked readings, read a pair, the deck laid out, court council, return, Celtic Cross, spread designer).
- **Pairs**: 186 pair pages from the pairings written on card pages (`lib/academy/pairs.ts`, `/cards/pairs/<a>-and-<b>/`), shown on both cards' pages, plus `/cards/pairs/lab/` for any two cards.
- **Reading experience** (`experience/work/olivia-product`): question note (`question-hint.js`, suggestions only), look at the whole with exact random-draw odds (`website/src/lib/learn/spread-survey.js`, flagged only at p ≤ 1/8, never "significant"), "your sentence first" (`sentence-first.js`), re-read panel for readings kept ≥ 20 h (`reread.js`), today's card beside the last daily card (`today-pair.js`), carving walk on single readings (`pin-walk.js`), spreads from a card (`#spreads/card-<id>`: question plans accept `source: 'card'`; `question-coach.js` `createCardPlan`). Phrase bank, pair texts, card questions and pin text are lazy per-language JSON assets emitted by `build.py` (`OLIVIA_ASSETS.lazy`).
- **Personal readings** (`netlify/edge-functions/_shared/reading-service.ts`) now receive `spreadPatterns` (counted facts with their odds) and may mention one marked worth noticing, never as a sign. Card-plan readings send no `questionDirection`.
- **Rules to keep**: server components never pass functions to client components (use `{placeholder}` strings); deal random cards only after mount; lesson copy follows `BRAND.md` plus the UK glossary (kept with the session notes; key terms: «у середньому», «Старші Аркани», «призма», «Кельтський хрест», «Вейта–Сміт», «Золота Зоря»); product JSON imports need `with { type: 'json' }` so node tests can load them.
- **Verified**: product tests 249/249, website + service tests 58/58, `tsc` and eslint clean, `next build` exports every new route (sitemap 726 URLs), headless EN/UK desktop and 375 px checks, end-to-end card spread save/reload, re-read save, support lines.
- **Owner decisions still open**: astrology pages; default reversal approach and upright-only; whether worked readings become a paid library; the old `/academy` tarot track is untouched (its lessons have no individual URLs to redirect).

## Previous: the phone arrival (v6), not yet in production

- Same branch and draft PR #4, commit `0889b9e`, on top of v5. QA: `experience/outputs/qa-v6/review.md`. Record: `experience/outputs/olivia-v6-release.json`. Preview build: https://6ab92b77b5d4da00084b874f--olivia-arcana.netlify.app/.
- What v6 changes. Phones only; `hero.js` and desktop are unchanged, and desktop is pixel-identical to v5.
  - **First frame.** `first-frame.js` is inlined at the top of `<body>` by `build.py`; `NativeExperienceHome.tsx` keeps it (`data-first-frame`). Below 701 px it sets `body.mobile-experience`, `data-view="home"` and `data-mobile-immersive`, and draws the masthead, before the first paint. `mobile-experience.js` adopts the masthead; its markup lives in `mobile-masthead.js`. `<body>` has `suppressHydrationWarning` for these pre-hydration changes.
  - **Entrance and opening card.** The entrance is CSS from the first paint (about 2 s). The poster `<img>` is placed where `hero.js` draws the first card, using `hero.js`'s camera and opening pose in CSS 3D (`mobile-coherence.css`, "The phone arrival"), and the WebGL card fades in over it.
  - **Safari heights.** The card clears ARCANA up to 740 px tall. The opening fits at 600 px and less. The second question step's "Choose my card" is fixed at the bottom (option B).
  - **First load.** Section art waits for the first scroll (`holdSectionArt`, `held-art.js`). Phones use a 768 px card back (`experience/outputs/olivia-card-back-phone.webp`). The 22 phone textures are re-encoded at the same fidelity, 12% smaller.
- Rules to keep:
  - **Keep `first-frame.js` small and synchronous.** It runs inline before the markup. `NativeExperienceHome`'s script filter must keep `data-first-frame`.
  - **Change the masthead only in `mobile-masthead.js`.** Never re-append an adopted masthead: that would replay its entrance.
  - **Section art on phones goes through `showArt()`.** Never set `src` directly on an `img[data-home-art]`, `#sample-art` or `#home-memory-image`.
  - **The poster's CSS repeats `hero.js`'s camera and START pose.** `hero.js` is locked; if it ever changes, update `mobile-coherence.css` and re-check the alignment. Also re-check it if `#motion-stage`'s phone insets (106 px) or transforms change.
  - **Regenerate the phone art with `phone-art.mjs`** whenever a Major Arcana image or the card back changes. It uses Chromium's default canvas resize, then sharp at WebP quality 81 and effort 6.
  - **Test phone journeys with taps.** A mouse click leaves a pointer over the deck, which triggers the desktop hover lift.

## Previous: site-wide pass (v5), not yet in production

- Same branch, `claude/peaceful-clarke-scrh06` (draft PR #4 into `main`; do not merge without the owner's approval). v5 works through `experience/outputs/olivia-gap-audit-2026-09-26.md`. QA: `experience/outputs/qa-v5/review.md`. Record: `experience/outputs/olivia-v5-release.json`.
- **Production is still v3.** v5 is built and tested on this branch only.
- **Preview (v5):** https://deploy-preview-4--olivia-arcana.netlify.app/ (UK: `/uk/`) follows the PR head. The build of the tested commit `c19bdeb` is https://6ab820e030b21a0008ba98f9--olivia-arcana.netlify.app/ (deploy `6ab820e030b21a0008ba98f9`). Netlify's checks reported it published (3543 files uploaded, all 5 header rules processed). GitHub Actions CI passed on its first runs for the same commit. The session that built v5 could not open `*.netlify.app`; a later session loaded and checked the preview on 27 September (`qa-v5/review.md`, "Live preview check").
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
| Latest release record and QA | v6 (branch, not deployed): `experience/outputs/olivia-v6-release.json`, `experience/outputs/qa-v6/review.md`, plan `award-plan-2026-09-27.md`. v5: `olivia-v5-release.json`, `qa-v5/review.md`, audit `olivia-gap-audit-2026-09-26.md`. v4: `olivia-mobile-v4-release.json`, `qa-mobile-v4/review.md`. Production v3: `olivia-mobile-v3-release.json`, `qa-mobile-v3/review.md` |
| Phone composition (v4) | `experience/work/olivia-product/mobile-coherence.css` — loaded last; add phone layout fixes here rather than to the older layered mobile files |
| Phone arrival (v6) | `first-frame.js` (inlined before the first paint; also holds section art), `mobile-masthead.js`, `held-art.js` (`showArt`), the "phone arrival" rules at the end of `mobile-coherence.css`; phone art from `experience/work/tools/phone-art.mjs` (`cards-portal-phone/`, `experience/outputs/olivia-card-back-phone.webp`) |
| Brand and design rules | `BRAND.md` (supersedes `website/DESIGN.md`, `website/DESIGN_BRIEF.md`, `docs/DESIGN_SYSTEM.md`) |
| Card texts | EN: `content.js`, `minor-content.js`, `minor-reversed.js`. UK: `card-notes-uk.js` (voice guide `UK-VOICE.md`). After editing, run `node experience/work/tools/sync-card-notes.mjs` to refresh `website/src/lib/academy/tarot-notes.ts` (used by the AI service and `/uk/cards/`) |
| Inner-page header | `website/src/components/almanac/AlmanacMasthead.tsx` (used by `AlmanacShell` and `LegalShell`) |
| Motion vocabulary | `experience/work/olivia-product/motion-tokens.css` |

The product was originally edited outside this Git repository. This branch brings its editable source, all build inputs, references, and docs into `experience/`, retaining their relative paths. Do not edit generated hashed files as the primary source. Do not restore the old iframe homepage.

The directory name `hero-v12` is historical and supplies artwork only. Current runtime choreography is `experience/work/olivia-product/hero.js`; protected sections are compared to the approved September 24 reference by tests. Its mobile gate/lifecycle changed without replacing the choreography.

## Latest changes and rules to keep

v5 (this branch) — the full list is in `qa-v5/review.md`. Rules to keep:

- **Load order.** The homepage runs assets, hero, then the app; the WebGPU background loads last and only with an adapter. Don't put anything a button depends on into `background.js`.
- **Phone hero art.** `hero.js` reads `DETAIL_DATA` and `BACK_DATA`. Below 700 px the asset map points them at `cards-portal-phone/` (512×1024, what `hero.js` draws there anyway) and at `experience/outputs/olivia-card-back-phone.webp` (v6). If a Major Arcana image or the card back changes, regenerate both with `experience/work/tools/phone-art.mjs` (usage in its header; needs `npm --prefix website ci` for sharp).
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

v6 (this branch; details in `qa-v6/review.md`):
- 238/238 product tests (13 new in `first-frame.test.mjs`), 7/7 mobile-question checks, 51/51 website and service tests. CI passed on `0889b9e`. Both builds succeed, and a rebuild from an empty output directory reproduces the 113 snapshot files byte for byte.
- Desktop against the v5 export: hero at five journey positions, UK and 1024: at most 6 pixels of 1.3 million differ (motion-bar noise). Full homepages in reduced motion: 0 pixels changed.
- The opening card's poster is within 1–3 device pixels of the WebGL card at seven phone sizes. After scrolling, the phone sections are identical to v5 except the card backs drawn from the 768 px file.
- On the preview:
  - Phone journeys pass (EN 390×844, UK 375×812).
  - The arrival filmstrip shows phone CLS 0 in both languages.
  - No white frames.
  - A phone homepage is 2.43–2.48 MB (EN) and 2.56 MB (UK) over the wire.
- **Not tested on a physical phone and not deployed to production.** Safari's heights are modelled. The WebGPU background has never been seen from a container.

v5 (this branch):
- 225/225 product tests, 7/7 mobile-question checks, 51/51 website and service tests. `experience/build.py` and `npm --prefix website run build` succeed. A rebuild from an empty output directory reproduces the 116 snapshot files byte for byte.
- Pixel comparison with v4: desktop hero at five journey positions within renderer noise; desktop homepage sections 0 pixels changed apart from the added footer row; phone hero frames (including mid-journey "Watch the journey") show no visible change.
- Phone journeys on the native export with a synthetic delayed reading, EN 390×844, UK 375×812 and 320×740: pending hides every interpretation and keeps the card; AI label; keep → "Saved ✓"; almanac with the Safari note; revisit; crisis note at the question and on single and spread readings. Reduced motion, desktop keyboard-only (UK) and inner pages at 390/1440 were checked. No overflow, no console errors.
- **Not tested on a physical iPhone, not deployed to production, and live AI generation not run.** The build session had no API key or route to the preview. The live check on 27 September requested no reading: the preview's service is configured, so every valid request is paid. The animated WebGPU background has never been seen from a container.
- The deployed preview was checked from a container on 27 September: assets, headers, the reading service's origin and validation guards, phone journeys (EN 390×844, UK 375×812), transfer sizes against production, and the arrival filmstrip (`qa-v5/review.md`).

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

Section 1 of [the award plan](experience/outputs/award-plan-2026-09-27.md) (the arrival) is done as v6. Next: the owner's device check of v6, then whatever the owner chooses from sections 2 to 5. Owner decisions that now block the biggest remaining gaps (see the audit): the astrology pages (redirect or separate brand), the paid offer and payment provider, a return channel (email/Telegram/push), a named editor, and the logo/app icon. Also confirm the company named in the legal pages and have a lawyer review them. Set a monthly spend limit for the AI key in the Anthropic console.

Engineering next steps, in order:
- Put the v5 preview on the owner's iPhone. Check the load and feel, the reveal light, the page fades, the crisis note and the Safari note, in EN and UK.
- Enable prompt caching once traffic is steady: split the system prompt into a cached shared block and a small per-spread/locale block; confirm with `usage.cache_read_input_tokens`. The shared prompt must be at least 1,024 tokens for Sonnet 5.
- A colour and type token pass on the CSS (tokens exist only for motion); a 12 px minimum for phone text.
- Browser smoke tests in CI (Playwright, EN/UK × phone/desktop).
- Keyed translations instead of matching English strings in `locale.js`.

Longer-standing items:

0. The preview https://deploy-preview-4--olivia-arcana.netlify.app/ (and `/uk/`) follows the branch head and shows v5 (deploy `6ab820e030b21a0008ba98f9` for `c19bdeb`). A container confirmed on 27 September that it serves `experience.b4dc10712a673cd4.css`. Netlify's collaboration toolbar appears at the bottom of every preview page, never in production. Promote to production only with the owner's approval. On the device, check the keyboard with a real question, toolbar collapse during the deck, the held/reveal gesture, and pending → reading in EN and UK.
1. Collect the owner's iPhone feedback on v5 (or on production v3 if the preview is not reviewed). Test the three practice panels, question keyboard, single-card pull, three-card draw, held/reveal state, pending state and reading in EN and UK. Fix concrete clipping/scroll/gesture defects without replacing the design or approved motion.
2. v4 browser checks covered keyboard (modelled), reduced motion, short-height landscape and 5/8-card layouts; device inspection is still needed. Known follow-ups: the almanac still leads with practice tools before the first saved reading; pages other than the choose step use the desktop composition on landscape phones.
3. Keep production release records and this GitHub branch synchronized. The v3 release is live; do not send the user back to the older v2 preview, and do not describe v4 or v5 as live until deployed.
4. Restore and verify real account infrastructure, owner-scoped storage/sync, entitlements and a suitable verified payment flow before selling memberships. Existing product records are browser-local and can be lost if site storage is cleared; export/import is provided.
5. Continue EN/UK editorial review of question-specific synthesis for card relationships, clarity and unsupported certainty. A successful HTTP request does not establish reading quality.
6. Consider future features only after the core loop is satisfying. Shared live spreads, narrated voice ritual, simulated-client practice room, human reviews, camera recognition, sealed readings, collective statistics and yearly recap were discussed; they are **not implemented by this handoff**.

## Included history and excluded material

`experience/outputs/` includes strategy, competitor study, release records and QA notes. Their dates matter. `hero-lab/`, `handoffs/2026-09-21-master/`, source snapshots and integration backups are historical references, not current instructions. The older access handoff has obsolete IDs/service observations; prefer this file and current source.

`prepare.py` is an obsolete bootstrap generator and can overwrite current templates: do not run it. Generated bundles, dependency installs, local caches, raw personal screenshots/attachments, environment files and unrelated image-generation experiments were excluded. Unrelated local deletions of old experimental deck images were not staged or pushed. The original working checkout was left intact.
