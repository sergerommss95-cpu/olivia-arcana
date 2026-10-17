# Birth Portrait M3b — Redesign the reader (direction A + B's glance) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portrait reader in the owner-chosen direction. The reader rated it 6/10 ("more beautiful and easier to digest"), so the rebuild takes A's structure with B's glance. The reading order becomes:

1. A **glance** on B's lit card table.
2. The **opening**.
3. A **five-facet spread** that opens in place.
4. **Chapters as book plates**, grouped as Part one (mind, heart, work) and Part two (shadow, love, becoming).
5. **Numbers and maps.**
6. **Keep tools.**

The lattice moves out of the persistent dock: it is now on demand, behind a "Your eleven cards" mini-map. Body text is set in DM Sans.

**Architecture:**
- New pure logic lives in `src/lib/portrait/digest.js`, tested with `node --test`: which cards define the portrait, each facet's card, first sentences, pull quotes and reading time.
- Each new surface gets its own component and CSS module in `src/components/portrait/`. `Reader.tsx` becomes a thin orchestrator.
- `LatticeDock.tsx` and `ChapterRail.tsx` are retired. They are replaced by `MiniMap.tsx` and `Contents.tsx` inside a slim sticky `ReadingBar.tsx`.
- A shared `type.module.css` defines the one label voice. Other modules use it via CSS Modules `composes`.
- Unchanged: the server, the status contract, storage, export, and the Why drawer's content.

**Tech Stack:** Next 16 static export, React 19 client components, CSS Modules, `next/font`, the site's tokens in `src/app/globals.css`, real card art in `public/cards/`.

**Spec:**
- **Visual targets:** `docs/superpowers/evidence/2026-10-17-m3-redesign/a/index.html` (structure, facet spread, chapter plates, mini-map) and `docs/superpowers/evidence/2026-10-17-m3-redesign/b/index.html` (the glance table composition only). Their screenshots sit in the same folders.
- **Why:** `docs/superpowers/evidence/2026-10-17-m3-redesign/critique.md`.
- **Data:** the "Data the UI reads" section of `docs/superpowers/plans/2026-10-16-portrait-m3-experience.md`.

## Global Constraints

- Worktree `/Users/macbookpro/olivia-arcana/.claude/worktrees/portrait`, branch `feat/portrait`. Commands run from `website/`. No push.
- **Owner's choice, verbatim:** "Rebuild in direction A (glance, facet spread, chapter plates, lattice on demand), using B's table glance and DM Sans body text."
- **Palette.** Lapis grounds only. Ivory ink `#eee6d4`. One gilt accent `#c9b182`. Hairlines no stronger than `rgba(238,230,212,.14)`, except form fields, which stay at `.38`.
- **No glow, light trails, particles or starfields.** The owner rejected these before. Depth comes from scale, a soft shadow under each card, and lapis→abyss bands.
- **One label voice.** Cormorant small caps (real small caps, never synthesised), or DM Sans 13–14 px in sentence case. No letter-spaced monospace capitals anywhere in the portrait. Mono may appear only for a numeral, if at all.
- **Body text.** DM Sans for Latin and Onest for Cyrillic (the site's existing variables), 18–19 px, line-height about 1.7, measure 58–66 characters.
- **Display type.** Headings in Cormorant / Cormorant Garamond. Ledes and pull quotes in Cormorant Garamond italic.
- **Layout.** Left-aligned editorial headings; no centred stacks. Vary the vertical rhythm: tight groups, generous separations.
- **Cards** are always the real art, shown as physical objects: rounded radius matching the art, soft shadow, no thick frames.
- **Card-name hover.** Every card wrapper carries `data-card-label="<pos> · <role> · <name>"`, so the site-wide plate (`src/components/CardNameHover.tsx`) names it richly. Face-down cards never reveal a name.
- **Motion.** Transform and opacity only, easing `cubic-bezier(.16,1,.3,1)`. Ink-in is opacity plus an 8 px rise, 600–950 ms. Facets open via a `grid-template-rows` transition. Under `prefers-reduced-motion` there is no motion; final states only.
- **Accessibility.**
  - Headings run h1 → h2 → h3 in order.
  - Every toggle is a `<button>` with `aria-expanded`/`aria-controls`.
  - Focus ring: 2 px gilt, 3 px offset.
  - Body text contrast at least 7:1.
  - The live region stays mounted.
  - On a phase change, focus moves to the new h1.
- **Strings.** All strings live in `copy.ts`, EN and UK. UK addresses the reader with «ви», plural agreement, no gendered forms.
- **Functionality to keep working**, each task re-verifying what it touches:
  - the Laying, with resume after reload;
  - placeholders while stages B and C land;
  - failure notices that keep everything already written;
  - the Why drawer (focus trap, Esc returns focus);
  - maps, including unknown-time behaviour;
  - Save, Download, Print, the example reading and the saved list;
  - `#saved=` across languages;
  - Back from an example or saved reading;
  - card-name hover;
  - print stylesheet.
- **Tests.**
  - `node --test src/lib/*.test.mjs netlify/edge-functions/_shared/*.test.mjs netlify/portrait/*.test.mjs` passes.
  - `npx eslint src/components/portrait src/lib/portrait src/app/portrait src/app/uk/portrait` is clean.
  - `npm run build` passes once, at the end of each task.
- **Verification.** Headless Chrome only, via `scripts/portrait-shots.mjs`; read its header for the flags. Never open a visible window. Port 4321 belongs to the owner's demo server, so do not stop it.
  - Screenshots are JPEG, saved into `docs/superpowers/evidence/2026-10-17-m3b/<task>/`.
  - Look at every shot. Self-critique against the mockups and `critique.md`, then fix the top issues and re-shoot.

---

### Task R1: Digest logic, the label voice, and mono caps gone

**Files:**
- Create:
  - `website/src/lib/portrait/digest.js`
  - `website/src/lib/portrait-digest.test.mjs`
  - `website/src/components/portrait/type.module.css`
  - `website/src/components/portrait/fonts.ts`
- Modify: every portrait CSS module that uses IBM Plex Mono or letter-spaced capitals (`laying.module.css`, `lattice.module.css`, `why.module.css`, `maps.module.css`, `keep.module.css`, `portrait.module.css`, `reader.module.css`), plus `Portrait.tsx` to apply the font class at the portrait root.

**Interfaces (Produces):**
- `definingCards(stageA, packet, n = 4) → { card: number, positions: number[], count: number }[]`
  - Counts citations of each Major card across the opening and the five facets only, so the result is stable before the chapters land.
  - Ties go to cards cited in the opening, then to the earliest position in `READING_ORDER`.
  - Returns the top `n`, re-sorted by first position.
- `facetCards(stageA, packet) → Record<"temperament"|"inner"|"gifts"|"bonds"|"direction", number | null>`. Each value is a position.
  - Facets with the fewest Arkan refs choose first.
  - Each facet takes its first-cited position whose card no other facet has taken yet, falling back to its first-cited position.
  - `null` when the facet cites no Arkan.
- `firstSentence(text) → string`. Splits after `.` `!` `?` `…`, optionally followed by a closing quote (`»` `”` `’` `"`), then whitespace.
- `pullQuote(chapter) → { sentence: string, after: number } | null`.
  - Candidates are sentences from `chapter.paragraphs`, skipping the very first sentence of paragraph 0.
  - A candidate must have 8–20 words, end in `.` or `!`, and not start with "And", "But", "So", «І», «А», «Але» or «Тож».
  - Picks the one with the fewest words; on a tie, the earliest.
  - `after` is the index of the paragraph that contains it.
  - Returns `null` when nothing qualifies.
- `readingMinutes(stages) → number`. Counts the words of the title, epigraph, overview, facets (heading + text), every present chapter (title, lede, paragraphs, practice) and the keep lines. Divides by 220 and rounds, with a minimum of 1.
- `type.module.css` classes:
  - `.label`: Cormorant SC, 14 px, letter-spacing 0.03em, ivory at 0.72.
  - `.labelGilt`: same, in gilt.
  - `.meta`: DM Sans 13.5 px, ivory at 0.66.
  - `.numeral`: Cormorant, lining figures.
- `fonts.ts` exports `portraitFonts.className` and the variable `--font-sc`. It loads `Cormorant_SC` from `next/font/google`, with subsets latin and cyrillic, weights 400/500, `display: "swap"`, `preload: false`.
  - If `Cormorant_SC` lacks a Cyrillic subset, fall back to Cormorant Garamond with `font-variant-caps: small-caps` only where the font has real `smcp` glyphs (check them).
  - Report what you found either way.

- [ ] **Step 1: Write the failing tests**

```js
// website/src/lib/portrait-digest.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { definingCards, facetCards, firstSentence, pullQuote, readingMinutes } from "./portrait/digest.js";

const arkan = (position, card) => ({ id: `arkan-${position}`, kind: "arkan", position, card });
const packet = { v: 1, locale: "en", timeKnown: true, factors: [arkan(1, 1), arkan(2, 2), arkan(3, 2), arkan(4, 3), arkan(5, 4), arkan(6, 7), arkan(7, 5), arkan(8, 9), arkan(12, 14), arkan(13, 8), arkan(14, 13)] };
const p = (refs, text = "One. Two.") => ({ text, refs, teachings: [] });
const stageA = {
  title: "T", epigraph: "E",
  overview: p(["arkan-2", "arkan-5", "arkan-6"]),
  facets: {
    temperament: { heading: "h", ...p(["arkan-13", "arkan-14"]) },
    inner: { heading: "h", ...p(["arkan-12", "arkan-13", "arkan-4"]) },
    gifts: { heading: "h", ...p(["arkan-6", "arkan-7", "arkan-8"]) },
    bonds: { heading: "h", ...p(["arkan-14", "num-soulUrge"]) },
    direction: { heading: "h", ...p(["arkan-1", "arkan-2", "arkan-3", "arkan-5", "arkan-6"]) },
  },
};

test("defining cards: most cited in the opening and facets, ties to the overview, then reading order", () => {
  const d = definingCards(stageA, packet);
  // Counts: card 2 (pos 2+3) = 3, card 7 (pos 6) = 3, card 4 (pos 5) = 2 and cited in the overview, card 8 (pos 13) = 2, card 13 (pos 14) = 2.
  // Top four by count, overview, first position: 2, 7, 4, 8 — then re-sorted by first position.
  assert.deepEqual(d.map((x) => x.card), [2, 4, 7, 8]);
  assert.deepEqual(d[0], { card: 2, positions: [2, 3], count: 3 });
  assert.ok(d.some((x) => x.card === 7));
  for (let i = 1; i < d.length; i++) assert.ok(d[i - 1].positions[0] < d[i].positions[0], "re-sorted by first position");
});

test("facet cards: fewest refs choose first, no card repeats when avoidable", () => {
  const f = facetCards(stageA, packet);
  assert.equal(f.bonds, 14);
  assert.equal(f.temperament, 13);
  assert.notEqual(packet.factors.find((x) => x.position === f.inner).card, packet.factors.find((x) => x.position === f.temperament).card);
  assert.equal(facetCards({ ...stageA, facets: { ...stageA.facets, bonds: { heading: "h", ...p(["num-soulUrge"]) } } }, packet).bonds, null);
});

test("first sentence handles closing quotes and Ukrainian", () => {
  assert.equal(firstSentence("He said «go». Then more."), "He said «go».");
  assert.equal(firstSentence("Ви приходите вчасно. Далі."), "Ви приходите вчасно.");
  assert.equal(firstSentence("No ending"), "No ending");
});

test("pull quote: shortest qualifying sentence, never the chapter's first, with its paragraph", () => {
  const chapter = { title: "t", lede: "l", practice: "p", refs: [], teachings: [], paragraphs: [
    "This very first sentence has exactly nine words in it. And this one starts with a conjunction but is long enough to count here.",
    "A short one. Here is a calm sentence of exactly ten words in total. Another sentence that runs on for quite a long while past twenty words so that it can never qualify as a pull quote at all.",
  ] };
  assert.deepEqual(pullQuote(chapter), { sentence: "Here is a calm sentence of exactly ten words in total.", after: 1 });
  assert.equal(pullQuote({ ...chapter, paragraphs: ["Too short. Also short."] }), null);
});

test("reading minutes counts present stages at 220 words a minute", () => {
  const words = (n) => Array.from({ length: n }, () => "w").join(" ");
  const stages = { a: { ...stageA, overview: p([], words(440)) }, b: { chapters: { mind: { title: "t", lede: "l", paragraphs: [words(440)], practice: "p", refs: [], teachings: [] } } } };
  assert.equal(readingMinutes(stages), 4);
  assert.equal(readingMinutes({ a: { ...stageA, overview: p([], "x") } }), 1);
});
```

- [ ] **Step 2: Run the tests and see them fail** (module not found).
- [ ] **Step 3: Implement `digest.js`.** Plain JS with JSDoc. Import `READING_ORDER` from `./lattice.js`.
- [ ] **Step 4: Run all the tests and see them pass.**
- [ ] **Step 5: Add the label voice.**
  - Create `type.module.css` and `fonts.ts`, and apply `portraitFonts.className` on the portrait root element in `Portrait.tsx`.
  - In every portrait CSS module, replace each `font-family` using `--font-mono`/IBM Plex Mono and each `text-transform: uppercase` + letter-spacing label with `composes: label from "./type.module.css"`, or `labelGilt`/`meta`.
  - Cyrillic labels must render in real small caps or sentence case, never synthesised caps.
  - Keep numerals (positions, life-path digits) in `.numeral`.
- [ ] **Step 6: Screenshots** into `docs/superpowers/evidence/2026-10-17-m3b/r1/`, EN and UK, 1440×900 and 390×844:
  - the Laying at t=8;
  - the Why drawer;
  - the maps;
  - the keep footer;
  - the entry.

  Confirm by DOM query that no portrait element computes `font-family` containing "Plex Mono". Use `--eval` to report the count; it must be 0.
- [ ] **Step 7:** run the tests, eslint and the build, then commit:

  ```
  Give the portrait one label voice and the digest logic the redesign reads from

  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```

---

### Task R2: Glance on the card table, reading bar, mini-map, contents; retire dock and rail

**Files:**
- Create:
  - `Glance.tsx` + `glance.module.css`
  - `ReadingBar.tsx` + `readingbar.module.css`
  - `MiniMap.tsx` + `minimap.module.css`
  - `Contents.tsx`
- Modify: `Reader.tsx`, `Portrait.tsx` (the Laying → glance hand-off), `copy.ts`
- Delete: `LatticeDock.tsx`, `ChapterRail.tsx`, and their CSS rules, once nothing imports them.

**Interfaces:**
- Consumes: `definingCards`, `readingMinutes` (R1); `Lattice.tsx` (`LatticeCard`, `Threads`); `ROLES`; `frames.json`; `MajorCard[]`.
- Produces:
  - `<Glance stages packet cards locale example? onBegin />`;
  - `<ReadingBar sectionTitle onContents onCards />`;
  - `<MiniMap open onClose packet cards locale lit:number[] />`;
  - `<Contents open onClose sections:{id,label,pending?}[] />`.
  - `Reader` keeps one current `{ id, title, lit:number[] }` section state, updated by IntersectionObserver with `rootMargin: "-40% 0px -55% 0px"`. R3–R5 register their sections into it with `registerSection(id, title, lit)`.

**The glance.** Port B's composition from `b/index.html`: `.glance` and the table styles.
- **Desktop.** Left about 56%: a lit lapis "table" (a broad radial lapis→abyss pool, no glow), holding the 3–4 `definingCards` slightly overlapped, about 330 px tall. Each is a `LatticeCard` face-up with `data-card-label`. Below the cards, museum captions: role in `.label` and name in Cormorant Garamond italic. Then one `.meta` line: "The four cards your opening returns to most, of the eleven your birth date lays out." (UK equivalent.)
- **Right column:**
  - `.labelGilt` "Your birth portrait" (or "Example — a fictional person" for the example);
  - the h1 title in Cormorant 300 at about clamp(44px, 5vw, 72px);
  - the epigraph in Cormorant Garamond italic, 26 px;
  - `.label` "If you read nothing else", then the three `keep` lines in Cormorant Garamond 25 px, without rules between them. Until stage C lands, show three shimmer bars at 8% opacity with `aria-busy`, and ink the lines in when they arrive;
  - the CTA "Begin the reading ↓" (ivory pill), which scrolls to the opening;
  - `.meta` "{n} min read · an opening, five facets, six chapters".
- **Phone.** The table becomes a fan of 3 cards overlapping about 40%, around 210 px tall, then the text column. The whole glance fits in about 1.6 screens.

**The reading bar.**
- A slim (52 px) bar under the site header. It becomes sticky once the glance scrolls out.
- Left: the current section title in Cormorant Garamond italic.
- Right: two quiet buttons, "Contents" and "Your eleven cards". The second shows A's 11-dot lattice glyph, with the current section's positions in gilt.
- Hidden in print.

**The mini-map.** A non-modal panel, desktop right, 420 px. On phone it becomes a bottom sheet.
- It holds the full lattice (all 11 cards face up, threads, `<pos> · <role>` captions in `.label`).
- The current section's cards are at full brightness; the rest sit at 0.45.
- A `.meta` line: "Lit: the cards {section} was read from."
- Esc and the close button return focus to the trigger.

**Contents.** A sheet that lists:
- Opening;
- Five facets;
- Part one (with I–III);
- Part two (with IV–VI);
- Your numbers and maps;
- Keep this portrait.

Chapters not written yet show dimmed with a "being written" note.

**Hand-off.**
- When stage A lands, FLIP the defining cards from their lattice slots in the Laying to their table slots in the glance, transform only, 800 ms. The other Laying cards fade out.
- Reduced motion: an instant swap.
- A reopened finished reading starts at the glance with no Laying.

**Remove** the persistent dock and the rail. Remove the old "keep plate" at the end, since the keep lines now live in the glance.

- [ ] Steps:
  1. Implement.
  2. Delete the retired files.
  3. Screenshots into `.../r2/`, EN and UK, desktop and phone:
     - the glance with keep lines;
     - the glance with keep pending (`--a-at 2 --bc-at 999`);
     - the reading bar stuck after scrolling;
     - the mini-map open;
     - the contents open;
     - the FLIP mid-transition;
     - the example glance;
     - reduced motion.
  4. Run a keyboard pass over Begin, Contents and the mini-map (focus in, Esc, return).
  5. Check the console is clean.
  6. Run tests, eslint and the build, then commit:

     ```
     Open the portrait on its card table and keep the lattice a tap away

     Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
     ```

---

### Task R3: The opening and the five-facet spread

**Files:**
- Create: `Opening.tsx`, `FacetSpread.tsx`, `facets.module.css`
- Modify: `Reader.tsx`, `copy.ts`

**Interfaces:**
- Consumes: `facetCards`, `firstSentence` (R1); `registerSection` (R2); `sealsFor`; `onWhy(key, trigger)` from the existing Why drawer wiring.
- Produces: `<Opening stages packet cards locale onWhy />` and `<FacetSpread stages packet cards locale onWhy />`.

**The opening.** Port A's `#opening`.
- Left-aligned h2 "Opening".
- The overview in DM Sans 19 px with a Cormorant drop cap.
- A "Read from" note: `.meta` "Read from *The High Priestess*, *The Emperor*…", with the names in italic serif. It sits beside the text on desktop (sticky inside its section) and below it on phone.
- A soft "Why these cards?" text button, DM Sans 14 px, underlined on hover, which opens the Why drawer.

**The facet spread.** Port A's `#facets`.
- **Desktop.** Five columns. Each holds:
  - a hairline top rule;
  - the facet card (`facetCards`, about 72×124 px, `data-card-label`);
  - `.label` with the facet name: Temperament / Inner life / Gifts / Bonds / Direction (UK: Темперамент / Внутрішнє життя / Дари / Зв'язки / Напрям);
  - the h3 heading in Cormorant Garamond 26 px;
  - the first sentence in Cormorant Garamond 18 px;
  - a quiet "+" button in the corner (`aria-label` "Read {heading}", `aria-expanded`).
- **Opening a facet** expands a full-width row below the spread with a `grid-template-rows` transition:
  - on the left, the facet's cited cards in an overlapping stack with captions;
  - on the right, the full text at the body measure, then "Read from" and "Why these cards?".
  - Only one facet is open at a time. The open column's rule turns gilt and its button reads "Close ×".
- **Phone.** A vertical list. Each row is the card thumb, the label, the heading and the first sentence, and tapping the row opens the text inline under it.
- **Arrival.** Facets ink in with a 90 ms stagger when stage A lands.

- [ ] Steps:
  1. Implement.
  2. Screenshots into `.../r3/`, EN and UK, desktop and phone:
     - the opening;
     - the spread closed;
     - one facet open;
     - a keyboard-opened facet (`--keys Tab… Enter`).
  3. Check `aria-expanded` and `aria-controls` in the accessibility tree.
  4. Check the console is clean.
  5. Run tests, eslint and the build, then commit:

     ```
     Lay the five facets out as a spread you can read in a glance

     Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
     ```

---

### Task R4: Chapters as book plates in Part one and Part two

**Files:**
- Create: `ChapterPlate.tsx`, `chapters.module.css`
- Modify: `Reader.tsx`, `copy.ts`

**Interfaces:**
- Consumes: `pullQuote` (R1); `registerSection` (R2); `frames.json`; `ROLES`; `onWhy`.
- Produces: `<Part n={1|2} title stage chapters={keys} … />` and `<ChapterPlate chapterKey numeral chapter packet cards locale onWhy pending? failed? />`.

**Parts.** Each part opens with a `.labelGilt` "Part one" / "Part two" and an h2: "Mind, heart and work" / "Shadow, love and becoming" (UK equivalents). Part one is stage B; Part two is stage C.

**The frontispiece.** Port A's plates.
- **Desktop.** Two columns.
  - Left: the chapter's 1–2 cited Arkan cards, large (the first about 280×480 px; a second overlaps at 0.8 scale). Each has a caption: the name in Cormorant Garamond italic, `.label` "In the place of {role}", and the second-person frame line from `frames.json` in Cormorant Garamond italic at 0.8.
  - Right: a small gilt roman numeral in Cormorant, 44 px, not A's giant numeral; then `.label` "Chapter one · Mind"; the h3 title in Cormorant 300 at about clamp(36px, 4vw, 56px); the lede in Cormorant Garamond italic 28 px.
- **No Arkan cited:** the frontispiece shows the card back with a `.meta` line naming the sky or number the chapter reads from (via `sealsFor`).

**The body.**
- Paragraphs in DM Sans 19 px at the measure, with a book indent on paragraphs after the first.
- `pullQuote` inserted after paragraph `after`, as a blockquote in Cormorant Garamond italic 34 px with a 1 px gilt rule above and hanging quotes. No pull quote when it returns `null`.
- **The practice** as a ritual card: a lapis→abyss band, the card back (`/cards/back-448.webp`, about 120 px) floated left, `.labelGilt` "A practice for this week", then the practice text in Cormorant Garamond 22 px.
- "Read from …" and "Why these cards?" close the chapter.

**Pending.** A part whose stage has not landed shows its plates as quiet placeholders: the card back at 0.4, the numeral, title bars at 8%, and `aria-busy`. Each fills with ink-in when its stage arrives.

**Failed.** A part whose stage failed shows one calm notice in place of its plates: the existing error copy with one next step. Everything already written stays.

**Phone.** The frontispiece goes full width, cards first and centred about 240 px tall, then the text. The practice card floats its back right, as in A's phone shot.

- [ ] Steps:
  1. Implement.
  2. Screenshots into `.../r4/`, EN and UK, desktop and phone:
     - the Part one opener;
     - a plate frontispiece;
     - a body with its pull quote;
     - a practice card;
     - pending parts (`--a-at 2 --bc-at 999`);
     - a failed part (`--fail-at`);
     - a reading line lighting the reading bar's dots.
  3. Check the console is clean.
  4. Run tests, eslint and the build, then commit:

     ```
     Open each chapter on its card, like a plate in a book

     Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
     ```

---

### Task R5: Numbers, maps, keep tools, print and export

**Files:**
- Modify: `Maps.tsx`, `maps.module.css`, `Keep.tsx`, `keep.module.css`, `reader.module.css` (print), `Reader.tsx`, `copy.ts`

**Your numbers.** Replace the four-cell box grid with A's set numerals:
- a row of four Cormorant numerals at 64 px;
- each with `.label` role and a one-line meaning in Cormorant Garamond italic;
- separated by space, not boxes;
- the master-number hallmark as a small `.labelGilt` "Master number";
- the birthday number set small beneath.

**Maps.** Keep the cards map and the sky map, restyled to the label voice. The cards map can reuse `MiniMap`'s lattice rendering, static and full size.

**Keep tools.** Save, Download and Print, with "Start a new portrait", in a closing band that has `.labelGilt` "Keep this portrait". The example's closing band keeps "Read my own portrait". Behaviour stays unchanged: confirm, saved state, Forget.

**Print.**
- Update the reader's `@media print` for the new structure: glance first without the table art, or with small art; facets all expanded; chapters each on a new page; the practice card kept together; the reading bar, mini-map, contents and buttons hidden.
- Check `buildExport` output order still matches: glance → opening → facets → chapters → numbers → maps → teachings. Adjust `export.js` and its tests if the order differs.

- [ ] Steps:
  1. Implement.
  2. Screenshots into `.../r5/`:
     - numbers (EN, UK, phone);
     - maps;
     - the keep band (saved and unsaved);
     - the example closing band;
     - print-media emulation of the reader;
     - the downloaded export opened from `file://`.
  3. Check the console is clean.
  4. Run tests, eslint and the build, then commit:

     ```
     Set the numbers like type and close the portrait with what to keep

     Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
     ```

---

### Task R6: Phone, accessibility, performance, polish, audit

**Files:** any portrait component or CSS module. Also: generate mid-size card art.

**Mid-size art.**
- Add `public/cards/mid/NN_slug.webp`, about 420 px wide, generated with `sharp` if it is available in `node_modules` (check `node -e "require('sharp')"`); otherwise use `cwebp`/`sips` if present.
- Write the generator as `scripts/card-mid.mjs` and commit both the script and the images.
- Use `srcSet` thumb 120w, mid 420w and full 896w everywhere portrait cards render, with correct `sizes`.

**Verification matrix.** Saved into `.../r6/`:
- {EN, UK} × {1440×900, 390×844, 820×1180} × {glance, opening, facets open, plate, practice, numbers, keep band, mini-map, Why drawer};
- plus reduced motion for the glance and a plate.

**Accessibility.**
- Heading outline dump (`--ax`): h1 → h2 (parts and sections) → h3 (facets and chapters) in order.
- Tab path: glance → Begin → bar → facets → plates → Why → keep.
- Contrast of body, `.meta` and `.label` against their grounds: report the ratios. Body ≥ 7:1, meta and label ≥ 4.5:1.
- The live region announces stage landings.

**Performance.**
- First-load JS for `/portrait/` from the build output: report it against M3 (Task 7 commit 77df891).
- CLS < 0.05 via PerformanceObserver in a headless run.
- Image bytes for a phone first view.

**Design passes.**
- Run the `critique` skill on the r6 screens, then `polish` and `audit` (the owner's design rules require all three before "done").
- Fix every high and medium finding. Write a short report: `docs/superpowers/evidence/2026-10-17-m3b/r6/REPORT.md`.

- [ ] Steps:
  1. Implement.
  2. Run the matrix and the passes.
  3. Run tests, eslint and the build, then commit:

     ```
     Polish the redesigned portrait for phones, every reader and fast loads

     Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
     ```
