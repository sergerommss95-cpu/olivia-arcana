# The phone arrival (v6) — 27 September 2026

Branch `claude/peaceful-clarke-scrh06`, commit `0889b9e`, on top of v5. This is section 1 of [the award plan](../award-plan-2026-09-27.md). The owner approved all five items on 27 September and chose option B (a fixed button) for the second question step.

**In production since 27 September 2026.** The owner asked for the deploy, and PR #4 was merged into `main` as `c822edd` (see "In production" below). Before that, the deploy preview of PR #4 was https://deploy-preview-4--olivia-arcana.netlify.app/ (UK `/uk/`); the build of `0889b9e` is https://6ab92b77b5d4da00084b874f--olivia-arcana.netlify.app/. `hero.js` is byte-identical (SHA-256 `ea5578949b2e…`), and desktop is pixel-identical to v5.

Evidence in this folder:

- `arrival-phone-en-live.png`, `arrival-phone-uk-live.png`, `arrival-desktop-en-live.png`: arrival filmstrips of the preview. Compare `../arrival-2026-09-27/preview-*-sheet.png` for v5.
- `opening-at-safari-heights.jpg`: the opening at 390×664, 375×635, 375×553 and 320×568.
- `question-step-pinned-action.jpg`: the second question step at 390×664 and 375×553, at the top and at the end of the step.
- `opening-card-webgl-vs-poster.jpg`: the WebGL card and the CSS poster, each rendered alone.
- `journey-summary-live.json`: the phone journeys on the preview.
- `arrival-phone-en-production.png`, `arrival-phone-uk-production.png`, `arrival-desktop-en-production.png`, `journey-summary-production.json`: the same checks on oliviaarcana.com after the deploy.

## In production — 27 September 2026

- **Deploy.**
  - The owner asked for the deploy after the preview. PR #4 was marked ready and merged into `main` at 16:58 UTC with a merge commit, `c822edd`, which keeps every commit named in these notes. PR #3 (`codex/session-handoff-2026-09-26`) was part of the branch, and GitHub marked it merged too.
  - CI passed on `c822edd`.
  - Netlify published it about 80 seconds after the merge. Pushes to `main` deploy production automatically.
  - To roll back, publish the v3 deploy `6ab7b1eb2e3eb145b023937a` again in Netlify's deploy list, or revert the merge on `main`.
- **Assets.**
  - `/` serves `experience.9fcb833eb04c4a39.css` and `app-en.526c498c6e397903.js`.
  - `/uk/` serves the same stylesheet with `app.926cd875e85c3725.js` and `<html lang="uk">`.
  - Both carry the inline first-frame script. The served `hero.ea5578949b2e2776.js` is byte-identical to `hero.js`.
- **Headers.**
  - Hashed assets, including the phone card back, are cached for a year as immutable.
  - `/` and `/uk/` have no `X-Robots-Tag`, and their robots meta is `index, follow`. `/experience/` sends `noindex` and `/animation/` sends `noindex, nofollow`. This separates the rule from the header Netlify adds to every preview page, which the preview check could not do.
  - HSTS, `X-Frame-Options`, `nosniff`, and the referrer and permissions policies are present. `robots.txt` allows the site and names the sitemap.
- **Pages.**
  - `manifest.json`, `sitemap.xml`, `/about/`, `/privacy/`, `/terms/`, `/cookies/`, `/contact/`, `/cards/`, `/uk/cards/` and `/ask/` return 200. An unknown path returns 404.
  - There is no Ukrainian About, Privacy, Terms or Contact page. The export has none, and no page links to one.
- **Reading service.** No model was called.
  - `GET /api/reading` and `/api/chat` report the service as configured.
  - A cross-site POST, or one with neither `Origin` nor `Sec-Fetch-Site`, gets 403.
  - A same-origin POST with an invalid body gets 400 with the validation message.
- **Phone journeys** (EN 390×844, UK 375×812, AI declined): both pass. There were no console errors, and no request to `/api/*` other than GET was attempted.
- **Arrival filmstrip** (4G, 4× CPU):
  - Phone EN: FCP 1.30 s, LCP 1.60 s, CLS 0.
  - Phone UK: FCP 1.08 s, LCP 1.40 s, CLS 0.008. That is well under the 0.1 threshold for good, and no frame shows movement.
  - Desktop EN: FCP 0.76 s, CLS 0. Desktop UK: FCP 1.00 s, CLS 0.
  - The frames match the preview's.
- **Phone weight until the network is quiet:** 2.48 MB over the wire in English, 2.56 MB in Ukrainian. These are the preview's figures.

## What changed

### 1. The phone composition from the first frame

- `first-frame.js` is bundled by `build.py` and inlined at the top of `<body>`. `NativeExperienceHome.tsx` keeps this one script (`data-first-frame`).
- Below 701 px it runs before anything paints. It adds `mobile-experience`, sets `data-view="home"` and `data-mobile-immersive="true"`, and draws the masthead.
- `mobile-masthead.js` is the single source of the masthead's markup. `mobile-experience.js` adopts the early element and never re-appends it, so its entrance is not replayed.
- `<body>` carries `suppressHydrationWarning`, because the script changes its attributes before React hydrates. React 19 passes over the extra masthead element in `<body>`. Production loads show no hydration errors.
- Result: phones never show the desktop composition. Layout shift on phones (filmstrip, live): 0.068 → 0 in English, 0.081 → 0 in Ukrainian.

### 2. No white flash

- There was none to fix. Every frame was recorded while navigating from a magenta page to the site on the throttled phone profile: 0 white frames for v5 (locally and live) and for this build.
- Browsers keep showing the previous page until the first paint, and the first paint is already lapis: `theme-color`, `color-scheme: dark` and render-blocking lapis CSS were all in place.
- The white frames in the earlier filmstrips were the browser's empty tab. `arrival-filmstrip.mjs` now starts each visit from a grey page, so this can't be misread again.

### 3. A designed entrance, independent of the scripts

- The sequence, all CSS, so it runs the same on every connection:
  - the first paint is lapis;
  - the wordmark letters come in from 0.16 s (the existing stagger);
  - the card back fades in at its final place from 0.12 s;
  - the line at 0.45 s and Draw your card at 0.66 s;
  - Watch the journey and the menu button at 0.7 s.
- It is complete about 2 s after the first paint. Under reduced motion, or with motion paused, the final state shows at once.
- **The opening card.** The poster (a plain `<img>` in the markup) now stands exactly where `hero.js` draws the first card at the start of the journey.
  - `mobile-coherence.css` repeats `hero.js`'s camera and opening pose in CSS 3D: perspective 1.4521 × the stage height, centred; card centre 58% across and 39% down (35% on short stages); yaw −0.34, pitch −0.12, bank −0.10 rad.
  - Sizes come from container units on `#stage`, so they follow the same stage `hero.js` measures.
  - When `hero.js` is ready, the WebGL card fades in over the poster (1 s), and the poster is hidden afterwards. The only visible change is the edge of the stacked deck appearing.
- Poster against WebGL card, each rendered alone (device-pixel bounding boxes):

| Phone | WebGL card | Poster | Overlap (IoU) |
|---|---|---|---|
| 390×844 | 177, 306 – 619, 957 | 178, 305 – 609, 953 | 0.959 |
| 390×664 | 229, 231 – 563, 724 | 230, 232 – 555, 721 | 0.958 |
| 375×635 | 220, 222 – 540, 693 | 220, 223 – 531, 690 | 0.953 |
| 375×553 | 246, 186 – 513, 580 | 247, 186 – 508, 577 | 0.961 |
| 430×932 | 127, 326 – 757, 1261 | 128, 326 – 746, 1259 | 0.967 |
| 360×780 | 166, 279 – 568, 874 | 166, 281 – 560, 872 | 0.964 |
| 320×568 | 186, 192 – 463, 600 | 187, 193 – 456, 597 | 0.957 |

  The poster lies entirely inside the WebGL card. The remaining 3–4% is the deck's edge on the right and bottom.

### 4. Safari's visible height

- **Up to 740 px tall:** the card moves 20 px down, so it no longer touches ARCANA. It keeps the clearance it has on a full-height screen.
- **Up to 600 px** (an iPhone SE in Safari, about 375×553): the hero region may shrink to 480 px, the wordmark is 56 px and the line 25 px. Draw your card is at 425–483 px and Watch the journey is in view. In v5 the button ended 9 px below the fold.
- **The second question step** ("How shall we read?") keeps its one primary action fixed at the bottom over a lapis fade (option B).
  - Scroll padding keeps a focused row clear of it, and it returns to the form while the keyboard is open.
  - It is now in view at every height: 588–646 px at 390×664 and 477–535 px at 375×553. In v5 it was 166–210 px below the fold at those heights.

### 5. A lighter first load on phones

- **Section art waits.**
  - On phones, the card art in the homepage sections (faces and backs) is held until the visitor scrolls, then loads as its section comes within a screen of view (`first-frame.js`, `holdSectionArt`).
  - A MutationObserver swaps each source for a 1×1 placeholder while the page is parsed, before the browser's lazy loader measures anything.
  - Chrome's IntersectionObserver reports no intersection for images inside the 3D sample card or the horizontal practice carousel, so their sections are observed instead.
  - Code that assigns section art goes through `showArt()` (`held-art.js`), which leaves a held image waiting. After scrolling, the phone sections are pixel-identical to v5, except the card backs described next.
- **A phone card back.** Phones use `outputs/olivia-card-back-phone.webp`, 768 × 1319 and 129 KB, instead of 426 KB. It reaches phones through the asset map (`BACK_DATA` when the stage is under 700 px wide) and a `<source>` on the poster. Desktop keeps the original.
- **Re-encoded phone textures.** `tools/phone-art.mjs` keeps Chromium's canvas resize, then encodes with sharp (WebP quality 81, effort 6, smart subsampling). The 22 textures go from 1.80 to 1.59 MB. Fidelity against the lossless resize is 36.36 dB, against 36.26 dB before.
- **AVIF was tested and dropped.** At equal fidelity it was only 22% smaller, and the asset map can't check AVIF support synchronously.
- Phone homepage, everything fetched until the network is quiet (live preview, iPhone profile, new browser profile):

| | Production v3 | v5 | v6 |
|---|---|---|---|
| EN over the wire | 7.53 MB | 3.57 MB | 2.43–2.48 MB (2.35 MB of distinct files) |
| UK over the wire | 7.54 MB | 3.65 MB | 2.56 MB |
| EN images | 5.72 MB | 2.83 MB | 1.66 MB |

- The target in the plan was 2.5 MB or less. English meets it; Ukrainian is 0.06 MB over, from its larger app bundle and the Cyrillic face. What remains is essentially:
  - the 22 textures `hero.js` loads at boot (1.59 MB), which the locked `hero.js` needs before the journey can play;
  - the app bundle (0.18 MB EN, 0.24 MB UK);
  - Next.js's runtime (about 0.27 MB);
  - fonts (0.19–0.21 MB).
- Closing the last gap would mean slightly softer textures (quality 78 saves 0.24 MB at 35.5 dB), AVIF with a support check, or trimming the Next runtime on this page. All three are for the owner to choose.

## Verification

- **Tests:** 238/238 product tests (225 + 13 in `first-frame.test.mjs`), 7/7 mobile-question checks, 51/51 website and service tests. CI passed on `0889b9e` (push and pull request).
- **Builds:** `experience/build.py` and `npm --prefix website run build` succeed. A rebuild from an empty output directory reproduces all 113 snapshot files byte for byte.
- **Desktop against the v5 export:**
  - Hero at journey positions 0, .18, .42, .63 and .86 (EN 1440), plus UK 1440 and EN 1024: at most 6 pixels of 1.3 million differ. That is the breathing motion bars, the same noise the baseline shows against itself.
  - Full homepages in reduced motion (EN 1440 and 1024, UK 1440): 0 pixels changed.
- **Phone sections, after scrolling through, against the live v5 preview:** identical except the card backs drawn from the 768 px file (the spread table and the sample card).
- **Phone journeys** (`phone-journey.mjs`: EN 390×844, UK 375×812, AI declined) pass on the local export and on the preview. No console errors, no AI request.
- **Arrival filmstrips** (4G, 4× CPU, live):
  - Phone EN: FCP 1.14 s, CLS 0. Phone UK: FCP 1.09 s, CLS 0.
  - Desktop EN: FCP 0.58 s; UK FCP 0.75 s; CLS 0 in both.
  - Phones show lapis, then the wordmark and card fading in at their final places, then the line, button and controls. There is no desktop frame and no jump.
- **Watch the journey** on a phone still plays (local export): cinema mode, the pause control, the poster and masthead hidden, no errors.
- **Reduced motion** (preview, UK): at the first frame with any markup, the phone class is set and the wordmark, card, line, button and masthead are all at full opacity, before `hero.js` is ready.

## Not verified

- A physical iPhone or Android phone. The Safari heights are modelled from its toolbars (390×664, 375×635, 375×553), and the real toolbar collapse, safe areas and gesture feel still need a device.
- The WebGPU background on a real device: its smoothness, battery cost and text contrast (item 6 of the plan).
- Firefox and Safari engines: every check ran in Chromium.
- Live AI generation: no personal reading was requested, in the preview or in production, because every valid request is a paid call.
