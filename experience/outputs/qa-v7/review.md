# Staying with the question (v7) — 27 September 2026

Branch `claude/peaceful-clarke-scrh06`, commits `bdae5c1`, `e95c563` and `9143a47`, plus the film on How Olivia works (`8e0adec`), on top of production v6 (`c822edd`). **Not deployed:** production is v6, and a push to `main` would deploy this. `hero.js` is byte-identical, and a first visit is pixel-identical to production.

Why: the owner asked what would give users best-in-class value, then said to start on what is best. The brand promise ends "keep what you notice, and return to see what changed" (`BRAND.md`). The product could already keep a check-in date, but the date sat two collapsed sections deep and nothing invited a return. The same pass adds the Ukrainian About and Contact pages. It also shows the personal reading as it is written, instead of after a wait.

Evidence in this folder:

- `checkins-phone-en.jpg`, `checkins-phone-uk.jpg` (390×844 and 375×812):
  - the choice after keeping, and the chosen day;
  - a returning visitor's menu dot and menu line;
  - the question step with a check-in waiting;
  - "How did it turn out?", and the kept answer.
- `checkins-desktop-en.jpg`: the header's Today dot and return link, and the return panel beside the card.
- `checkins-spread-en.jpg`: a three-card spread's check-in on phone and desktop.
- `streamed-reading-phone.jpg`:
  - a personal reading being written (EN), and finished;
  - the same being written in Ukrainian;
  - a stream that broke off, showing the existing "could not be completed" state.
- `uk-about-contact.jpg`: the new Ukrainian pages on phone and desktop.
- `film-how-olivia-works.jpg`: the film in the How Olivia works FAQ. Desktop EN playing, desktop EN in reduced motion (the poster and the play button), phone EN and phone UK playing.

## 1. Check-ins (`checkins.js`, `checkins.css`)

- **One choice after keeping.** When a reading or spread is kept, a panel asks "Look at this again in…" («Погляньте на це знову через…»).
  - The choices are 3 days, a week, a month, the next new or full moon (from `lunar-checkin.js`), or another date.
  - It then shows the day ("Sunday, 4 October", «Неділя, 4 жовтня») with "Change the date", "No check-in" and the existing calendar file.
  - Nothing is sent and nothing notifies, as the copy says.
- **"How did it turn out?"** When the day comes, the reading opens with a panel before the interpretation.
  - It shows the date the question was asked, the question itself, and the next step the visitor wrote.
  - The visitor can keep what changed (practice `outcome` and `reviewedAt`). "Not yet" moves the check-in a week on.
  - After keeping, it offers "Bring a new question" and the almanac. Spreads get the same panel under their title.
- **Signs that a check-in is waiting.** None of these appear on a first visit.
  - A gold dot on Today: the phone dock, the phone menu button (with "Explore, 1 check-in waiting" for screen readers) and the desktop header.
  - The phone menu's Today line reads "1 check-in waiting" («На вас чекає 1 повернення», with Ukrainian plural forms).
  - The question step shows a row that opens the reading; on phones it sits below Continue.
  - On desktop, the home's return link reads "A check-in is waiting · the Tower ↗" and opens that reading.
- **One place for the date.** The practice editor's own date field, moon picks and calendar file moved into the new panel. Its topic and return notes stay, and they update when the panel saves.
  - Everything uses the existing practice metadata (`revisitDate`, `outcome`, `reviewedAt`), so backups, imports and removal are unchanged.
- **Safari heights.** The row never moves Continue.
  - With or without it, Continue ends at 569 px at 664 px tall and at 537 px at 553 px tall.
  - The first question step's Continue used to end 16 px below the fold on an iPhone SE in Safari. It now fits (`mobile-coherence.css`, 128 px field at 600 px tall or less).
- **File name.** `experience/.gitignore` ignores `check-*.js`, so the module is `checkins.js`.

## 2. Ukrainian About and Contact

- `/uk/about/` and `/uk/contact/` are in the formal «ви», following `UK-VOICE.md`. They have hreflang pairs with the English pages (page metadata and sitemap).
- The Ukrainian homepage footer and the inner-page colophon lead to them.
- `LegalShell` follows the route language:
  - «Оновлено»;
  - Ukrainian colophon labels;
  - "English" / «Українською» when the page exists in the other language.
  - Terms, Privacy and Disclaimer are marked "· EN" until they are reviewed and translated.
- The English Contact page no longer offers help with accounts and billing, which are not open.
- The operator named on Contact is unchanged and still needs the owner's confirmation.

## 3. The personal reading as it is written

- **The page.** It asks `/api/reading` for a stream (`Accept: application/x-ndjson`). Each paragraph appears as soon as it is complete (`streamBlocks`), with the AI label from the first one.
  - The finished reading replaces them without arriving a second time.
  - A stream that ends in an error removes what was shown and gives the existing "could not be completed" state with a retry.
  - Only a confirmed reading is cached. A remount while it is being written shares the text so far.
- **The service** (`reading-service.ts`) calls the provider with `stream: true` only when asked, and forwards text as it arrives. The ending is decided by the same rules as the single answer:
  - "done" only for a complete reply (`end_turn`) within 14,000 characters;
  - otherwise "error": an early stop, a provider error event, a timeout, or an over-long answer.
  - A refusal before streaming, older pages, and `/api/chat` keep the JSON answer.
  - A page that leaves cancels the provider request.
- **Measured with a fake provider** (`tools/stream-reading.mjs`): the real service in the loop, and a reading written over about 2.7 s. The first paragraph appeared after 0.5–0.8 s, where before the whole wait came first.

## 4. The film on How Olivia works (28 September)

The owner asked for the "How it works" film in one of the How Olivia works FAQ sections.
- **Where.** "What happens in a reading?" (UK «Як відбувається читання?») is the first answer in the `#method` FAQ. It spans the whole grid and is open by default; "How is my personal reading created?" stays open below it. A caption under the film says what it shows.
- **Which cut.** The film plays in the page's language. Phones (up to 700 px) get the 4:5 cut, 720×900, and wider screens the 16:9 cut, 1920×1080. Each is WebM (VP9) first, with MP4 (H.264) for Safari. Turning a tablet across 700 px swaps the cut and keeps the moment, since both cuts share one timeline.
- **Behaviour** (`method-film.js`):
  - Nothing loads until the film is 400 px from the screen. The poster comes with the sources.
  - It plays muted and inline while at least 40% of it is in view and its answer is open. It pauses out of view, when the answer closes, and in a hidden tab.
  - With `prefers-reduced-motion` or data saving, it shows the poster and waits for the play button.
  - The round button plays, pauses, and plays again from the start after the end card; there is no loop. Once the visitor pauses, scrolling back does not start it again. Its labels are translated.
- **Weight.** A first visit downloads none of the film. On How Olivia works, one cut loads: 1.9–2.4 MB on phones (WebM or MP4), and 3.8–5.3 MB on wider screens.
- **Build.** The published files are committed in `experience/outputs/film/`. `build.py` publishes them with hashed names under `/experience/assets/` (immutable caching), as `window.OLIVIA_ASSETS.film`, and checks that every path exists. The portable single file has no film, and the answer is then left out.

## Verification

- **Tests:** 249/249 product (7 `checkins.test.mjs`, 1 `streamBlocks`, 3 stream-reading), 7/7 mobile-question checks, 58/58 website and service (7 streaming). CI passed on `bdae5c1` and `e95c563`. With the film: 259/259 product (10 `method-film.test.mjs`).
- **Builds:** `experience/build.py` and the website build succeed. A rebuild from an empty output directory reproduces the snapshot (0 changed files). `hero.js` SHA-256 is unchanged (`ea5578949b2e…`).
- **First visit against production v6**, homepage in reduced motion (EN and UK; 1440×900 and 390×844): 0 pixels differ. After the film was added, the same four views against the build before it: 0 pixels differ.
- **The film** (Chromium, EN and UK, desktop 1440×900 and phones 390×844 and 375×812), 29 of 29 checks:
  - no film request on a first visit to the homepage;
  - the film is the first answer, open;
  - the right language and cut play muted in view (WebM);
  - the poster and labels are in the page's language;
  - it stays paused after the visitor pauses, and pauses when scrolled away;
  - only one cut loads;
  - in reduced motion there is no autoplay, and the play button works.
  - The portable file leaves the answer out, with no page errors. The phone and check-in journeys still pass.
  - On deploy preview 5, the same 29 checks pass. The videos are served with byte ranges (206), `video/webm` and `video/mp4`, immutable caching and `noindex`. CI passed on `8e0adec`.
- **Phone journeys** (`phone-journey.mjs`, now with a check-in step): EN 390×844 and UK 375×812 pass.
- **Check-ins** (`tools/checkin-journey.mjs`, EN and UK; phone, then desktop):
  - the chooser is hidden until the reading is kept;
  - "a week" stores today + 7;
  - a due check-in shows the menu dot, the menu line and the question row;
  - an empty answer asks for words, and a kept answer sets `outcome` and `reviewedAt` and clears the dot;
  - on desktop, "Not yet" moves the date;
  - no page errors.
  - Spreads (seeded three-card reading, phone and desktop, EN and UK): Today lists it, the return panel shows the next step, the answer is kept, and a new check-in can be planned and then cleared.
- **Streamed reading** (`tools/stream-reading.mjs`, EN and UK, plus a broken stream):
  - paragraphs only grow, and the AI label shows throughout;
  - the finished state is `ready` with no second arrival animation;
  - one request per reading, and no page errors.
- **Ukrainian pages:**
  - `lang="uk"`, titles, hreflang alternates, sitemap entries;
  - the colophon and homepage footer links;
  - no horizontal overflow at 375 and 1440;
  - changed files pass ESLint and TypeScript. The site-wide lint has 56 older problems in astrology-era files, and CI does not run it.

## Not verified

- **The live provider stream.** No paid call was made. The Anthropic event format is parsed as documented and tested with a fake provider, but a real reading through Netlify's edge runtime (and the AI gateway, if production uses it) has not been seen. One personal reading on a preview would confirm it; that is a paid call and needs the owner's approval.
- A physical iPhone or Android phone.
- Firefox and Safari engines: every check ran in Chromium. For the film this includes Safari's MP4 path and its autoplay rules. The page follows them (muted, inline, started only in view), but Safari itself has not been tried.
