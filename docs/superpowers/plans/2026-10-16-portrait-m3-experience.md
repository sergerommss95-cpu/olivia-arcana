# Birth Portrait — Milestone 3: the Laying, the reader, maps, keeping

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Milestone 1 placeholder page with the owner-approved experience: direction "A + B type". It has three parts:

- **The Laying ritual:** while the reading is written, the 11 cards turn in their lattice, the turning card leads, and each card's role is taught.
- **The reader:** the lattice docks beside the text and lights the cards each passage cites. Typography follows the almanac leaf (drop cap, ornaments, ribbon chapter rail).
- **Around them:** a Why drawer, the three calculated maps, save / saved list / download / print, the example reading, phone layout and accessibility.

**Architecture:**

- **Pure logic** lives in `website/src/lib/portrait/` as plain JS with JSDoc, tested with `node --test`:
  - lattice geometry and the reading order;
  - refs → seals and lit positions;
  - saved-portrait storage;
  - the standalone export document.
- **UI** lives in `website/src/components/portrait/` as React client components with CSS modules. `Portrait.tsx` stays the state machine (entry → laying → reader). Each visual block is its own component.
- **Unchanged:** the server and HTTP contract.

**Tech Stack:** Next 16 static export, React 19 client components, CSS modules, the site's tokens and fonts (Cormorant display, Cormorant Garamond headings, DM Sans / Onest body, IBM Plex Mono captions), real deck art `public/cards/NN_slug.webp` + `public/cards/back-448.webp`, `majorCards(locale)`.

**Spec:** `docs/superpowers/specs/2026-10-15-portrait-design.md` §6. Approved mockups: `docs/superpowers/evidence/2026-10-16-m3-directions/` (`a-wait.png`, `a-read.png`, `b-read.png`; the owner chose "A + B type").

## Data the UI reads (verified against the code)

- **Status** (`GET /api/portrait/:id`, via `pollPortrait` in `client.ts`): `{ status, stages: { a?, b?, c? }, teachings, error, costCents }`.
- **Stage A** = `{ title, epigraph, overview: Passage, facets: { temperament, inner, gifts, bonds, direction: Facet } }`. The `outline` is stripped by the server.
- **Stage B** = `{ chapters: { mind, heart, work: Chapter } }`.
- **Stage C** = `{ chapters: { shadow, love, becoming: Chapter }, keep: string[3] }`.
- **Element types:**
  - `Passage = { text, refs: string[], teachings: string[] }`
  - `Facet = Passage & { heading }`
  - `Chapter = { title, lede, paragraphs: string[], practice, refs, teachings }`
- **Teachings** = `Record<teachingId, { label, text, sources: { title, url }[] }>`. Only the teachings the stages cite are included.
- **Packet factors** (`src/lib/portrait/packet.js`), with ids:
  - `arkan-<pos>` `{position, card}`
  - `num-<role>` `{role, value, master}`; roles are `lifePath | expression | soulUrge | personality | birthday`
  - `natal-<body>` `{body, sign, house, retrograde, alternatives}`
  - `natal-asc` / `natal-mc` `{angle, sign}`
  - `aspect-<a>-<aspect>-<b>`
  - With `timeKnown: false` there are no angles and no houses; Moon (and possibly others) carry `alternatives: string[]`.
- **Cards:** `majorCards(locale)` (`src/lib/astrology/deck.ts`) runs only in server components, and the page passes it to `<Portrait cards>`. `MajorCard = { id, name, href, image, thumb, essence, question }`.
- **Sky cards:** `SIGN_CARDS` is an array indexed in `SIGNS` order (aries → 4 The Emperor). `BODY_CARDS` maps body → card, both in `src/lib/astrology/constants.js`.
- **Frames:** `netlify/portrait/knowledge/positions.json` = `{ "1": { en, uk }, … "14": { en, uk } }`.

## Global Constraints

- **Workspace.** Worktree `/Users/macbookpro/olivia-arcana/.claude/worktrees/portrait`, branch `feat/portrait`. Commands run from `website/`.
- **Visual system.**
  - Lapis grounds only, never a light ground.
  - Ivory ink `#eee6d4`, and exactly one gilt accent `#c9b182` in UI.
  - Hairlines `rgba(238,230,212,.14)`.
  - Card art is never redrawn as SVG; the real `.webp` art and back are always used.
- **Motion.**
  - Transform and opacity only.
  - Easing `cubic-bezier(.16,1,.3,1)` (the site's `--ease-ritual`).
  - Ink-in: 950 ms, opacity 0 → 1 with an 8 px rise.
  - Card turn: a single 700 ms rotateY with no double-flip.
  - `prefers-reduced-motion: reduce` → no dealing, no flips, no rises. Final states render immediately.
- **Privacy.**
  - No birth details are written to storage unless the reader presses Save. Save stores only the derived packet, the stages and the cited teachings, never the name, date, time or place.
  - The job id and packet may sit in localStorage only while a reading is in progress, so a reload can resume.
- **Locales.** Every string exists in EN and UK. UK addresses the reader as «ви» (lower-case) with plural agreement (no gendered forms).
- **Accessibility.**
  - Every interactive element is reachable and operable by keyboard, with a visible focus ring (2 px gilt outline, 3 px offset).
  - On a phase change, focus moves to that phase's h1.
  - Progress is announced through a live region that is mounted before its content changes.
  - Body text contrast ≥ 7:1.
- **Performance.**
  - Card art is loaded with `loading="lazy"` except the eleven lattice cards, which preload once stage A is near.
  - No new npm dependency.
  - No WebGL.
- **Tests.**
  - `node --test src/lib/*.test.mjs netlify/edge-functions/_shared/*.test.mjs netlify/portrait/*.test.mjs` passes.
  - `npm run build` passes.
  - `npx eslint src/components/portrait src/lib/portrait src/app/portrait src/app/uk/portrait` is clean.

---

### Task 1: Lattice, seals and saved portraits (pure logic)

**Files:**
- Create: `website/src/lib/portrait/lattice.js`, `website/src/lib/portrait/seals.js`, `website/src/lib/portrait/saved.js`
- Test: `website/src/lib/portrait-lattice.test.mjs`, `portrait-seals.test.mjs`, `portrait-saved.test.mjs`

**Interfaces:**
- `lattice.js`:
  - `READING_ORDER = [1,2,3,4,5,6,7,8,12,13,14]`
  - `ROWS = [[1,2,3],[4,5],[7,6,8],[13,12,14]]`
  - `layout(width) → { positions: {[pos]: {x, y}}, card: {w, h}, height }` — desktop when width ≥ 720, else compact
  - `threads(layout) → {from, to, d}[]` from `LINKS` in `./arkan.js`
  - `litPositions(refs, packet) → number[]` — Arkan positions cited by a passage's refs
- `seals.js`: `sealsFor(refs, packet, locale, cards) → Seal[]`, where `Seal = { kind: "card"|"planet"|"angle"|"number"|"aspect", key, label, image?, glyph?, value? }`, ordered card → planet → angle → number → aspect, capped at 4
- `saved.js`:
  - `KEY = "olivia:portraits:v1"`, `MAX = 20`
  - `listSaved() → Summary[]`, where `Summary = { id, savedAt, locale, title }`
  - `loadSaved(id) → Saved | null`
  - `savePortrait({ id, locale, packet, stages, teachings }) → Summary` (replaces the same id; trims to MAX, oldest dropped)
  - `forgetSaved(id)`
  - Storage access is wrapped in try/catch. A blocked or quota failure returns `null` / `[]` and never throws.
  - `saved.js` takes a `storage` param, defaulting to `globalThis.localStorage`, so tests can inject a Map-backed fake.

- [ ] **Step 1: Write the failing tests**

```js
// website/src/lib/portrait-lattice.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { layout, threads, litPositions, READING_ORDER } from "./portrait/lattice.js";
import { LINKS } from "./portrait/arkan.js";

test("every position has a place, rows read 1-2-3 / 4-5 / 7-6-8 / 13-12-14", () => {
  const l = layout(1200);
  assert.deepEqual(Object.keys(l.positions).map(Number).sort((a, b) => a - b), [...READING_ORDER].sort((a, b) => a - b));
  assert.ok(l.positions[1].y < l.positions[4].y && l.positions[4].y < l.positions[7].y && l.positions[7].y < l.positions[13].y);
  assert.ok(l.positions[4].x > l.positions[1].x && l.positions[4].x < l.positions[2].x);
});
test("compact layout fits a 360 px column", () => {
  const l = layout(360);
  for (const { x } of Object.values(l.positions)) assert.ok(x - l.card.w / 2 >= 0 && x + l.card.w / 2 <= 360);
});
test("one thread per dependency", () => {
  const expected = Object.values(LINKS).reduce((n, from) => n + from.length, 0);
  assert.equal(threads(layout(1200)).length, expected);
});
test("lit positions come only from arkan refs present in the packet", () => {
  const packet = { factors: [{ id: "arkan-4", kind: "arkan", position: 4, card: 3 }, { id: "natal-sun", kind: "planet" }] };
  assert.deepEqual(litPositions(["natal-sun", "arkan-4", "arkan-9"], packet), [4]);
});
```

```js
// website/src/lib/portrait-seals.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sealsFor } from "./portrait/seals.js";
const cards = Array.from({ length: 22 }, (_, id) => ({ id, name: `Card ${id}`, thumb: `/cards/thumbs/${id}.webp` }));
const packet = { factors: [
  { id: "arkan-14", kind: "arkan", position: 14, card: 13 },
  { id: "natal-mercury", kind: "planet", body: "mercury", sign: "aquarius" },
  { id: "natal-asc", kind: "angle", angle: "asc", sign: "cancer" },
  { id: "num-lifePath", kind: "number", role: "lifePath", value: 5 },
  { id: "aspect-sun-trine-moon", kind: "aspect", a: "sun", b: "moon", aspect: "trine" },
] };
test("seals come in a fixed order and read naturally", () => {
  const s = sealsFor(["num-lifePath", "natal-asc", "arkan-14", "natal-mercury", "aspect-sun-trine-moon"], packet, "en", cards);
  assert.deepEqual(s.map((x) => x.kind), ["card", "planet", "angle", "number"]);
  assert.equal(s[0].image, "/cards/thumbs/13.webp");
  assert.match(s[1].label, /Mercury · Aquarius/);
  assert.match(s[2].label, /Rising · Cancer/);
  assert.match(s[3].label, /Life path 5/);
});
test("Ukrainian labels", () => {
  const s = sealsFor(["natal-asc", "num-lifePath"], packet, "uk", cards);
  assert.match(s[0].label, /Асцендент · Рак/);
  assert.match(s[1].label, /Життєвий шлях 5/);
});
```

```js
// website/src/lib/portrait-saved.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { savePortrait, listSaved, loadSaved, forgetSaved, MAX } from "./portrait/saved.js";
const fake = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
const reading = (id) => ({ id, locale: "en", packet: { v: 1, factors: [] }, stages: { a: { title: `T${id}` } }, teachings: {} });

test("save, list newest first, load, forget", () => {
  const storage = fake();
  savePortrait(reading("a"), { storage, now: () => 1 });
  savePortrait(reading("b"), { storage, now: () => 2 });
  assert.deepEqual(listSaved({ storage }).map((s) => s.id), ["b", "a"]);
  assert.equal(loadSaved("a", { storage }).stages.a.title, "Ta");
  forgetSaved("a", { storage });
  assert.equal(loadSaved("a", { storage }), null);
});
test("never stores birth details and trims to MAX", () => {
  const storage = fake();
  for (let i = 0; i < MAX + 3; i++) savePortrait({ ...reading(`r${i}`), name: "Olena", date: "2000-02-01" }, { storage, now: () => i });
  const raw = JSON.stringify([...Array(1)].map(() => storage.getItem("olivia:portraits:v1")));
  assert.ok(!raw.includes("Olena") && !raw.includes("2000-02-01"));
  assert.equal(listSaved({ storage }).length, MAX);
});
test("blocked storage never throws", () => {
  const storage = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.deepEqual(listSaved({ storage }), []);
  assert.equal(savePortrait(reading("x"), { storage }), null);
});
```

- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Implement the three modules.**
  - Geometry, desktop (≥720): card w 86 / h 149. Column x centres at 15%, 50% and 85% of a 820-wide box, scaled to `width`. Row 2 centres at 32.5% and 67.5%. Row y centres at 95, 285, 475 and 662, scaled by w/86.
  - Geometry, compact: card w 54. Columns at 17%, 50% and 83%. Rows at 0.5h, 1.75h, 3h and 4.25h, with `height` = 4.85h.
  - `threads` builds straight `M x1 y1 L x2 y2` paths.
  - Seal labels use the same EN/UK planet, sign, angle and number-role names as `netlify/portrait/teachings.ts`. Copy the small name tables into `seals.js`; client code must not import netlify/ modules.
- [ ] **Step 4: Run the full test command; all pass. Commit** "Lay out the lattice, read a passage's seals, and keep saved portraits without birth details".

---

### Task 2: The Laying (waiting ritual)

**Files:**
- Create: `website/src/components/portrait/Laying.tsx`, `website/src/components/portrait/laying.module.css`
- Modify: `website/src/components/portrait/copy.ts` (Laying strings EN/UK)

**Interfaces:**
- `<Laying packet={Packet} cards={MajorCard[]} locale status={PortraitStatus|null} frames={Record<number,{en,uk}>} onSettled? />`
- `frames` comes from `netlify/portrait/knowledge/positions.json`. Import the JSON from the page component and pass it down; the file is data, not server code.

**Behaviour (desktop; layout as in `a-wait.png`):**
1. **Deal.** On mount the 11 backs are dealt into their lattice slots: from a stack above the lattice centre, 70 ms apart, each a 600 ms translate+opacity move. Threads are drawn after the deal, as SVG path stroke-dashoffset animations of 900 ms.
2. **Turn and focus.**
   - Cards turn in `READING_ORDER`, one every 2.6 s. Each turn is a single 700 ms rotateY, showing the art at its midpoint.
   - The turning card scales to 1.3× with a soft gilt glow; turned cards settle at 1×; unturned backs sit at brightness .5.
   - Under each turned card: a mono caption, `<pos> · <role>`.
   - The right column's focus panel shows the current card: position and role (mono, gilt), card name (Cormorant Garamond 28 px), and the position frame text.
3. **Side column.**
   - Kicker «The laying · <first name>». The first name is the first token of the typed name and stays in memory only.
   - h1 «Your cards are turning in the order your birth set them.» (UK: «Ваші карти перевертаються в порядку, який задало ваше народження.»)
   - One explanatory line about threads.
   - The numbers strip: Life path · Expression · Motivation · Sun sign glyph. Glyphs use the text presentation selector U+FE0E.
   - The stage list: Opening · Chapters · Keepsakes. The current stage gets the gilt dot; completed stages read ivory.
4. **Hold.** After all 11 have turned, the focus panel cycles slowly (every 6 s) through positions 1–14 until stage A lands. Its text is announced through the live region only on stage changes, not on every cycle.
5. **Handoff.** When stage A arrives, call `onSettled()`. The parent then performs the FLIP into the dock (Task 3).
- **Reduced motion:** the lattice renders fully turned with no animation, and the focus panel shows position 1.
- **Phone (<720 px):** compact layout. The side column stacks below the lattice. The focus panel becomes a single line under the lattice.
- **Acceptance:** headless screenshots at 1440×900 and 390×844, for EN and UK, at t = 1 s, 8 s and 35 s, plus reduced motion. Compare them with `a-wait.png`. Console stays clean. The cards' accessible names read e.g. «Card 5, Conscious aim, The Emperor».

- [ ] Steps: implement → screenshots via headless Chrome (scripts in the scratchpad) → self-critique against the mockup → commit "Turn the eleven cards while the portrait is written".

---

### Task 3: Reader with lattice dock and book typography

**Files:**
- Create: `website/src/components/portrait/Reader.tsx`, `reader.module.css`, `LatticeDock.tsx`, `ChapterRail.tsx`
- Modify: `Portrait.tsx` (phase "reading": render `<LatticeDock>` + `<Reader>` + `<ChapterRail>`; FLIP from Laying)

**Layout (desktop, ≥1100 px), from `a-read.png` and `b-read.png`:**
- Grid columns: dock 360 px · text 640 px · rail 160 px, gap 64 px, centred.
- The dock is sticky at top 120 px.

**Typography:**
- Kicker: mono 11 px, gilt.
- h1 title: Cormorant 300, 64/1 px.
- Epigraph: Cormorant Garamond italic 24 px, gilt.
- Overview: DM Sans 17/1.8 px, opening with a drop cap (Cormorant 74 px, gilt, 3 lines).
- Facet and chapter headings: Cormorant Garamond 32 px, preceded by a small gilt fleuron (❦).
- Chapter lede: Cormorant Garamond italic 22 px, ivory.
- Practice: left gilt rule 2 px with an indent.
- Keep: a final plate. Three lines in Cormorant Garamond 26 px, separated by hairlines.

**Interaction:**
- Hovering or focusing a passage (overview, facet, chapter) highlights it with a faint gilt gradient and lights its cited cards in the dock (`litPositions`). Lit cards are 1.25× at full brightness with gilt glow; the others sit at brightness .42.
- The dock legend lists the lit cards («Lit: 13 · Self-image · Strength»).
- Seals (`sealsFor`) sit below each passage as pills, with a "Why this" link at the end.

**Arrival:**
- Stage A inks in passage by passage: 90 ms stagger, 950 ms each.
- Chapters from B and C show as engraved placeholders (title shimmer bars at 8% opacity, no spinner) until they land, then ink in.
- The rail highlights the section in view (IntersectionObserver, rootMargin −40%). Click scrolls smoothly; reduced motion jumps instead.

**FLIP:** measure each lattice card's rect in the Laying, render the dock, then animate each card from the old rect to the new one (transform only, 800 ms).

**Phone:**
- The dock becomes a sticky horizontal strip of the 11 cards (44 px wide) under the masthead, with lit cards raised.
- The rail becomes a top progress bar plus a "Contents" sheet.
- The text column is full width with a 20 px gutter.

**Acceptance:**
- Screenshots: desktop and phone, EN and UK. Use the example reading from M2 Task 6 if ready; otherwise the M1 evidence JSON served by a local fixture route.
- The passage→card link works by keyboard: Tab into a passage lights its cards.

- [ ] Steps: implement → screenshots → critique → commit "Dock the lattice beside the reading and light the cards each passage cites".

---

### Task 4: Why drawer

**Files:**
- Create: `WhyDrawer.tsx`, `why.module.css`
- Modify: `Reader.tsx`

**Behaviour:**
- **Opening and closing.**
  - "Why this" opens a right-side drawer (desktop, 440 px) or a bottom sheet (phone, 85vh).
  - `role="dialog"`, `aria-modal="true"`, labelled by its heading. Focus is trapped inside. Esc and the close button return focus to the triggering link.
  - The background is inert (`inert` attribute on the main content).
- **Contents.**
  - The passage's seals, each with its card image (the card turns face up as the drawer opens — one 700 ms turn — or no motion when reduced) or glyph.
  - Each factor's one-line calculation:
    - Arkan: "Position 4 · from cards 1 + 2".
    - Number: "Life path 5".
    - Planet: "Mercury in Aquarius, 8th house" / «Меркурій у Водолії, 8-й дім».
  - The cited teachings (`teachings` from the status/saved data) with their sources as links (`rel="noopener"`, opening in a new tab).
  - A closing honest line: "These traditions offer a way to reflect; they are not facts about you."

**Acceptance:** keyboard-only open/close, focus returns, screen-reader name. Screenshot desktop and phone.

- [ ] Steps: implement → verify → commit "Explain each passage in a drawer that returns you where you were".

---

### Task 5: The three maps

**Files:**
- Create: `Maps.tsx`, `maps.module.css`
- Modify: `Reader.tsx` (a "Your maps" section after the keep plate; rail entry "Maps")

**Content:**
1. **Arkan lattice.** Full size, all cards turned, captions and threads drawn. Same component as the Laying in a static mode.
2. **Numbers plate.** Four engraved cells: Life path (`lifePath`), Expression (`expression`), Inner motivation (`soulUrge`), Outward personality (`personality`). Each shows a Cormorant 44 px numeral, the mono role and one line from the position frame–style role notes (EN/UK). Birthday shows small beneath.
3. **Sun, Moon, Rising as cards.**
   - Three cards from the deck via the site's own `SIGN_CARDS[SIGNS.indexOf(sign)]` (`src/lib/astrology/constants.js`), each with a sign caption.
   - Unknown time: Rising is replaced by a card back with «Rising needs a birth time».
   - A Moon with alternatives shows both signs: «Taurus or Gemini».
4. **Other planets.** A compact two-column list (glyph · sign · house) with retrograde marked ℞.

**Acceptance:** screenshots desktop and phone, timed and unknown-time packets.

- [ ] Steps: implement → verify → commit "Show the three maps the portrait was read from".

---

### Task 6: Keep it — save, saved list, download, print, example

**Files:**
- Create: `website/src/lib/portrait/export.js` (+ `portrait-export.test.mjs`), `Keep.tsx`
- Modify: `Portrait.tsx`, `copy.ts`
- Create: `website/public/portrait/example-en.json`, `example-uk.json` (from M2 Task 6's approved readings)

**Behaviour:**
- **Save.** "Save on this device" calls `savePortrait`. The button confirms with «Saved», so the action and its result share a name. `aria-live` announces it.
- **Saved list.**
  - Shown on the entry screen when `listSaved()` is non-empty, as up to 5 recent title cards, plus "See all".
  - Opening one renders the reader from the saved data. It needs no server and no network.
  - Each card has a Forget action.
- **Download.** "Download as a page" uses `buildExport({ stages, teachings, packet, locale, cardImages })`, which returns a complete HTML string with:
  - inline CSS (the site palette, print-friendly);
  - embedded card thumbnails as data URIs, fetched at click time from the same origin;
  - all passages, chapters, keep lines, maps (lattice as a static image grid, numbers, sky cards) and cited teachings with sources;
  - no scripts.
  - It is offered as a file named `olivia-portrait-<title-slug>.html`.
- **Print.** A `@media print` stylesheet on the reader: ink on white is acceptable for print only. It hides the dock, rail and buttons, puts chapters on page breaks and keeps the keep plate together.
- **Example.** "Read an example portrait" on entry loads `/portrait/example-<locale>.json`. It is labelled «Example — a fictional person» everywhere it shows and is never saved automatically.
- **Export test:**
  - the document contains every passage text and every chapter title;
  - no `<script`;
  - every `<img` has a `data:` src;
  - the UK export contains Ukrainian labels.

- [ ] Steps: TDD for `export.js` → implement UI → commit "Save, reopen, download and print a portrait; open the example".

---

### Task 7: Entry, form and error states

**Files:**
- Modify: `Portrait.tsx`, `copy.ts`, `portrait.module.css`
- Create: `PlaceField.tsx`

**Changes:**
- **Entry layout:** h1 «Your birth, read three ways». A three-line lede, replacing the current paragraph. Each line is short:
  - "Your birth date lays out eleven cards."
  - "Your name gives five numbers."
  - "The sky at your birth adds the planets."
  - Then one line: "Olivia reads them together in about three minutes."
  - The privacy and retention note moves to a small «How your details are used» disclosure under the button.
- **Primary CTA:** "Read my portrait". Secondary: "Read an example portrait". When portraits are saved, the saved list follows.
- **Form fields:** labelled inputs with full borders (as on `/astrology/birth-chart/`), not bare underlines.
  - **PlaceField** is an ARIA 1.2 combobox: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, arrow keys, Enter to choose, Esc to close. Focus returns to the input after a pick. An empty state reads "No match — try the nearest city".
  - **Latin field:** its hint is linked by `aria-describedby`, and `title` mirrors the pattern error.
  - **Invite field:** shown only when no code is stored. Hint: "Your invite link fills this in".
- **Errors:** inline, next to the field that caused them, with `aria-describedby`. Server errors appear in a calm notice block that names one next step.
- **Focus:** on phase change, focus moves to the new h1 (`tabIndex={-1}`).

- [ ] Steps: implement → keyboard walkthrough recorded in the report → commit "Make the entry clear, calm and keyboard-complete".

---

### Task 8: Phone, motion, accessibility and polish pass

**Files:** any portrait component and CSS module.

- [ ] **Headless verification matrix.** {EN, UK} × {1440×900, 390×844} × {entry, laying t=8 s, reader top, reader chapter, Why drawer, maps, saved list}, plus reduced motion for laying and reader.
  - Use headless Chrome over CDP (scratchpad scripts). Never open a visible window.
  - Commit the screenshots to `docs/superpowers/evidence/2026-10-16-m3/`.
- [ ] **Accessibility checks:**
  - axe-core loaded from cdnjs in a headless page context, if reachable; otherwise a manual checklist;
  - contrast of body and caption text;
  - tab order;
  - focus visibility;
  - live-region announcements captured via CDP Accessibility events.
- [ ] **Performance:** first load JS for `/portrait/` from the build output, kept within +60 KB of M1; CLS < 0.05 measured via PerformanceObserver in a headless run.
- [ ] **Critique pass.** Write a short self-critique against the approved mockups and the global constraints, fix the top issues, then run a final "remove one accessory" pass.
- [ ] **Push and check the preview.** Push, then verify on deploy preview 20: one real reading end to end in EN on phone width and one in UK on desktop. This spends budget, so it needs the owner's go-ahead.
- [ ] **Commit** "Polish the portrait for phones, motion and every reader".
