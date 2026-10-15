# The Birth Portrait on oliviaarcana.com — design

Date: 2026-10-15 · Branch: `feat/portrait` (worktree `.claude/worktrees/portrait`, off origin/main `dfbf226`)
Source product: Codex/ChatGPT V18 portrait (`~/Documents/Codex/2026-10-10/start-the-session-getting-to-know`, private on chatgpt.site).

## Goal

Rebuild the V18 birth portrait as a native page of oliviaarcana.com with (1) readings that sound like a perceptive
reader instead of a disclaimer memo, (2) a motion-led ritual that turns the generation wait into the experience, and
(3) a production service on Netlify, launched as a hidden beta.

Input stays V18's: full birth name (optional Latin spelling), date, local time or "unknown", birthplace.
Three traditions read the same birth: Chrzanowska 11-position Arkan portrait, Pythagorean name numbers, natal chart.

## Decisions (owner, 2026-10-15)

- Native on oliviaarcana.com, not chatgpt.site.
- Claude writes readings (`claude-opus-5-5`), not OpenAI.
- Hidden beta: page live, `noindex`, not linked; example reading open to all; generation needs an invite code.
- No live web research per request. Sources ship as a static registry.
- Structure: overview + 5 facets + 6 chapters + three sentences to keep (V17 patterns dropped).

## Routes and files

| Path | Purpose |
| --- | --- |
| `website/src/app/portrait/page.tsx`, `website/src/app/uk/portrait/page.tsx` | Pages. `robots: noindex`. AlmanacShell (EN) / UkrainianLibraryShell (UK). |
| `website/src/components/portrait/` | `Portrait.tsx` (client state machine), `BirthForm.tsx`, `Laying.tsx`, `Reading.tsx`, `WhyDrawer.tsx`, `ChapterRail.tsx`, `export.ts`, `portrait.module.css` |
| `website/src/lib/portrait/` | `arkan.js`, `numbers.js`, `uncertain.js`, `packet.js` (plain JS + JSDoc, like `chart.js`) |
| `website/src/lib/portrait-*.test.mjs` | Calculation and packet tests (CI glob is `src/lib/*.test.mjs`) |
| `website/netlify/functions/portrait.mts` | `POST /api/portrait` admit; `GET /api/portrait/:id` status |
| `website/netlify/functions/portrait-background.mts` | Runs the staged generation (15 min wall clock) |
| `website/netlify/portrait/` | Shared server code: `knowledge/*.json`, `teachings.ts` (selector), `prompt.ts`, `schema.ts`, `validate.ts`, `style.ts`, `claude.ts`, `store.ts`, `invite.ts`, tests `*.test.mjs` |
| `website/public/portrait/example-en.json`, `example-uk.json` | Reviewed example readings (fictional people) |
| `website/scripts/portrait-invite.mjs`, `scripts/portrait-eval.mjs` | Invite code generator; quality eval runner |
| `website/netlify.toml` | Remove `/portrait` 301s; `X-Robots-Tag: noindex` on `/portrait/*`, `/uk/portrait/*` |

The `/chart` 301s stay. `/astrology/birth-chart/` is unchanged and gets no link to the portrait until public launch.

## 1. Calculation (device, deterministic)

- Natal: reuse `src/lib/astrology/chart.js` (Swiss-Ephemeris-checked) and `places.json`.
- Arkan: port `calculatePortrait` (Chrzanowska public individual): positions 1–3 from day / month / year digit sum,
  4–8, 12–14 from the documented sums, `reduce22` by subtracting 22, school numbering 8↔11 and 22→Fool mapped to
  deck identities. Check `reduce22(p4+p5+p6) === p12`.
- Numbers: port `calculateNumerology` (Pythagorean A–Z, components reduced separately, masters 11/22/33, Decoz Y rules,
  per-occurrence Y override). Non-Latin names require a supplied Latin spelling; no invented transliteration.
  Roles: Life Path, Expression, Soul Urge, Personality, Birthday.
- Unknown time (`uncertain.js`): sample the civil day; for Sun, Moon, Mercury, Venus, Mars report every sign the body
  occupies that day. No Ascendant, Midheaven, houses or Moon aspects.
- V18 calculation tests are ported with their fixtures (Olena Koval 2000-02-01 14:30 Kyiv must reproduce V18 values).

## 2. Packet (privacy boundary)

Client sends only derived factors: `{ locale, factors[] }`. Each factor has a stable id (`arkan-7`, `num-soulUrge`,
`natal-venus`, `natal-asc`, `aspect-moon-square-saturn`), a value (card id, number, sign, house, retrograde) and
optional `alternatives` (unknown-time signs). No name, date, time, place, coordinates, letters or degrees. The factors
are derived from those details and can still reveal the birth date (Arkan positions 1–3 are the day mod 22, the month and the
digit sum of the year; Sun and outer-planet signs narrow the year), so the server treats them as personal data (§5).
The server rebuilds teachings from the packet; the client never sends prompt text.

## 3. Knowledge bank (server JSON, EN/UK)

Ported from V18 by a one-off conversion script (modules → JSON): Arkan per-card fields (`portrait-arkan-v15`) with the
V18 role→field selector, numbers by role (`portrait-numbers-v15`), 36 Mercury/Venus/Mars profiles
(`portrait-natal-personal-v18`), sign/house/aspect texts (`portrait-natal-knowledge-v15`, `natal-pairs-v12`).
New in this edition: 24 Sun/Moon personal profiles (disposition / satisfaction / strain) and an 11-entry Arkan
position frame (what the position asks of a card). `sources.json` is the static registry (V18 URLs, labels).
Teaching ids are stable and travel with each passage.

## 4. Interpretation

**Voice brief** (`prompt.ts`): Olivia is a perceptive reader across the table. Second person, warm, exact.
- Every passage opens with a recognition line: a concrete behaviour the reader can confirm or reject.
- Each facet and chapter names one tension specific to this combination, not a generic balance.
- Everyday nouns and verbs. Method words stay out of prose (no "symbolic", "supplied", "position", "teaching",
  "tradition suggests"). One honest framing note closes the reading; sentences are not individually hedged.
- Uncertain factors stay conditional in the text itself ("if your Moon is in Leo… if in Virgo…").
- No diagnosis, prediction, fate, health, money or relationship verdicts. Reflection, not prophecy.
- Gold examples: one hand-written model passage per section type, EN and UK, in the system prompt.

**Structure** (structured output via `output_config.format`, ids restricted to the packet by enum):
- Stage A: `title`, `epigraph`, `overview`, five facets (`temperament`, `inner`, `gifts`, `bonds`, `direction`).
- Stage B: chapters `mind`, `heart`, `work`. Stage C: chapters `shadow`, `love`, `becoming`, plus `keep[3]`.
- Chapter: `title`, `lede` (one recognition sentence), `paragraphs[2–3]`, `practice` (one concrete, optional act),
  `refs[]` (factor ids), `teachings[]` (teaching ids).
- Stage A runs first (~25 s) and is shown immediately; B and C run in parallel after A, receiving A's text to
  avoid repetition.

**Validation** (`validate.ts`, ported from V18 `validatePortraitAiReadingV18` and extended): schema bounds; refs and
teachings exist in packet / selection; every required factor referenced somewhere; uncertain refs carry conditional
wording; unsafe regex (diagnosis, fate, death, illness, money promises). `style.ts` lint: banned phrases list,
hedge density (≤1 hedge per 60 words), repeated sentence openers, cross-section n-gram repetition.
One repair retry per stage with the validation errors attached; then the stage fails visibly. No silent stock text.

**Model call** (`claude.ts`): `@anthropic-ai/sdk`, `claude-opus-5-5`, adaptive thinking, effort from
`PORTRAIT_EFFORT` (default `medium`, tuned in eval), server-side refusal fallback (`fallbacks: "default"`),
cached system prompt (voice brief + gold examples). Usage recorded per stage.

**Quality bar** (`scripts/portrait-eval.mjs`): 6 fictional profiles (EN ×3, UK ×3, one unknown-time each).
Blind pairwise judge (old V18 text vs new) on recognisability, specificity, distinctness across sections, warmth,
absence of jargon. Ship when new wins ≥5/6 and the owner rates finalists.

## 5. Server (Netlify)

- `POST /api/portrait` (sync function): same-origin check; invite code (SHA-256 against `PORTRAIT_INVITE_HASHES`);
  per-invite daily count (`PORTRAIT_PER_INVITE_DAILY`, default 3) and global daily reserve
  (`PORTRAIT_DAILY_BUDGET_USD`, default 5; each admission reserves `PORTRAIT_RESERVE_USD`, default 0.75) in Blobs with
  conditional writes (missing etag = refuse, never fail open); packet validation; job written `queued`;
  background function invoked; returns `{ id }` 202. `Idempotency-Key` header dedupes double submits.
- `portrait-background`: claims the job (`queued`→`running` via `onlyIfMatch`), runs A, then B‖C, writes each
  stage as it validates, settles actual cost, marks `done` or `failed` with a reader-facing reason.
- `GET /api/portrait/:id`: `{ status, stages: {a?, b?, c?}, teachings, error? }`. Strong consistency read.
- Retention: the server never receives the name, date, time or place, but the derived factors can reveal the birth
  date, so they are kept only as long as the page needs them. When a job finishes (done or failed) the cited teachings
  are stored as `job/<id>/t` and the job's `packet` is set to `null`; the stages, `t` and the job record then stay for
  at most 24 h. Jobs expire on read after 24 h, and `portrait-cleanup` (scheduled function, hourly, no path) removes
  every job (with `a|b|c|t`) past 23 h, so nothing outlives a day even if nobody polls, and `quota/<day>/…` counters
  older than 7 days. It logs counts only. The reader may keep the portrait on their own device.
- Kill switch: budget 0 or `PORTRAIT_ENABLED=false` → 503 with a calm message; example still works.
- Risk: `ANTHROPIC_API_KEY` on Netlify was reported dead in September. First milestone verifies it on a deploy
  preview; if dead, the owner rotates it.

## 6. Experience and motion

Site inner-page palette (lapis paper, ivory ink, brass/gilt one accent), Cormorant display, DM Sans / Onest body,
real deck art (`majorCards(locale)`), easing from `globals.css` (`--ease-engrave`, `--ease-ritual`).

1. **Entry**: title "Your birth, read three ways"; form (name, Latin spelling when needed, date, time / unknown,
   place search). On submit the form folds to one line "Born … in …" (birth-chart pattern). Invite field appears
   only when no stored code; `#invite=` in the URL is stored and stripped.
2. **The Laying** (calculation + generation): the 11 cards are dealt face down into the Chrzanowska lattice
   (rows 1-2-3 / 4-5 / 7-6-8 / 13-12-14) while engraved dependency lines draw in. Each card turns in reading order
   with its role caption as the calculation resolves; name numbers and Sun/Moon/Rising engrave into the margin.
   Then a slow breathing hold tied to real job status ("Olivia is writing your portrait"), with the stage names
   lighting as they land. When stage A arrives, the lattice contracts (FLIP) into a header strip and the title
   inks in. No fake percentage.
3. **Reading**: title + epigraph; overview; five facets each with a margin seal (its main card / planet / number).
   Passages ink in on entry (opacity + 8px rise + letter-spacing settle, `--ease-engrave`, 950 ms, stagger 90 ms).
   Chapters B/C show as engraved placeholders until they land, then ink in. Sticky chapter rail (desktop side,
   phone bottom sheet) with read progress.
4. **Why drawer**: from any passage; the referenced card turns face up, factors listed with their calculation in one
   line, teachings quoted, source links. Return restores scroll to the passage.
5. **Keep**: Save (localStorage `olivia:portraits:v1`), Saved list, Download standalone HTML (inline CSS, embedded
   card thumbnails, no scripts), print stylesheet.
6. **Reduced motion**: static layout, instant states, no dealing. All motion is transform/opacity only.

Example reading button on entry opens `example-<locale>.json` with the same reader, labelled as an example.

## 7. Verification

- `node --test` over new lib and server tests, added to the CI glob in `.github/workflows/ci.yml`.
- Headless Chrome (CDP screencast pattern; never visible windows): entry → laying → reading → why → save → reload →
  download, EN and UK, 1440×900 and 390×844; reduced-motion pass; console clean.
- Deploy preview: real generations (≤6, ≈$3), one unknown-time, one UK; invite, cap and kill-switch checked.
- PR to main with deploy preview. Production only on the owner's word.

## Milestones

1. Calculations, packet, server pipeline with plain prompt, minimal reader. Verified on deploy preview.
2. Interpretation: knowledge port + additions, voice brief, gold examples, validation + style lint, eval.
3. Experience: Laying, reading motion, Why drawer, rail, export, polish/audit pass.

## Out of scope

Payments, accounts/sync, public launch (nav, sitemap, SEO), chatgpt.site changes, Telegram Mini App entry.
