# An award-level arrival: findings and plan — 27 September 2026

**Status: proposed.** The owner asked what is left for a site worthy of Awwwards and BRRRANDING, with "the strongest, most memorable and magical experience for a customer when they arrive". Nothing below is implemented yet, and the owner has not yet approved section 1. Ask before starting it.

## How the two are judged

- **Awwwards.** Design 40%, usability 30%, creativity 20%, content 10%. At least 18 jurors vote, and the 3 scores furthest from the average are dropped. A score of 6.5 or more earns an Honorable Mention; Site of the Day goes to the day's top score, then Site of the Month and of the Year. Jurors click through the whole site. Design and usability make up 70%, so a flawless, fast, clear arrival matters more than extra effects.
- **BRRRANDING** (brrranding.com). A hand-curated gallery of branding projects run by designer Vadim Carazan: "no algorithm, no AI, just great work", selecting only work made by human hands. The project's own notes describe the card art as AI-generated (`docs/CONTENT_STRATEGY_V2.md`). To be featured, the identity (mark, type, pattern, applications) would need to be designed by a person or studio and presented as a branding case study. This is the owner's decision.
- Sources (web search; the build container could not open either site): [Awwwards evaluation system](https://www.awwwards.com/about-evaluation/), [Awwwards judging criteria (2026)](https://www.hontran.dev/blog/awwwards-judging-criteria), [BRRRANDING](https://www.brrranding.com/), [Dezi Gallery on BRRRANDING](https://x.com/dezigallery/status/2086490210284790211).

## What a visitor sees today

Method: `experience/work/tools/arrival-filmstrip.mjs` against the local static export of this branch (v5). The phone profile is 390×844 at 2×, an iPhone user agent, 4G (9 Mbps, 120 ms round trip) and a 4× slower CPU, to stand in for a mid-range phone. The desktop profile is 1440×900. Headless Chromium has no WebGPU, so every frame shows the still palette. Contact sheets are in `arrival-2026-09-27/`; `phone-en-run1-sheet.png` is labelled with the planned marks, captured at about 0.3, 2.0, 2.1, 2.2, 3.0, 4.5, 7 and 12 s.

- **Phone.** First paint came after 2 to 3 s; before that the tab was white. Then only lapis and a single card back showed, with the navigation ghosted. Next the desktop composition appeared: in one run the whole thing (header row, left-aligned wordmark, grey button), in another only its header fading in. One to two seconds later everything jumped into the phone composition (centred wordmark, ivory "Draw your card", menu button). CLS was 0.067.
  - Cause: the phone composition is keyed to `body.mobile-experience`. `mobile-experience.js` (`sync()`) adds that class only after the app bundle has downloaded and run.
  - After that, the phone opening stays still by design (v2): the 96-second journey plays only after "Watch the journey".
- **Desktop.** First paint about 0.55 s, then an entrance of about 2 s (card, wordmark letters, tagline, button). After that it is a calm first screen whose only motion is the slow tilt of the card.
- **Weight.** A phone downloads about 4.9 MB (EN) in the first 5 seconds (v5 measurement).
- **Not seen.** The WebGPU background on a real device (Safari on iOS 26 and desktop Chrome support WebGPU), and text contrast over it.

## Plan

Constraints for all of it: do not replace or re-time the approved hero (`hero.js` is hash-locked); people choose their own cards; a card is revealed once; no blanket perimeter frames; English and Ukrainian get equal care.

### 1. Must fix first (safe, no change to `hero.js`)

1. **Phone composition before first paint.**
   - Option A: a small inline script at the top of the native markup in `website/src/components/almanac/NativeExperienceHome.tsx`. Below 701 px it sets what `sync()` sets for the home view: `body.mobile-experience`, `data-mobile-immersive="true"`, the mobile header visible and the bottom navigation hidden.
   - Option B: repeat the needed rules under `@media (max-width: 700px)`.
   - Option A is smaller and matches the script exactly.
   - Verify with the filmstrip: no desktop frame on phones. Keep the desktop pixel-identical to v5.
2. **No white flash.** Give `html` the lapis background inline in the document head (plus `theme-color`) so the first frame is never white.
3. **A designed entrance of about 2 s on every device and connection:** lapis, card back, wordmark, line, button. It must not depend on when the scripts arrive. Under reduced motion, show the final state immediately.
4. **Lighter first load.** Aim for 2.5 MB or less in a phone's first 5 seconds: AVIF card art, and cards that are not on screen loaded when needed.
5. **Real devices.** On iPhone Safari and Android Chrome, check that the WebGPU background runs smoothly, what it does to the battery, and that text stays readable over it.

### 2. Signature moments (prototype on a separate preview; the owner chooses)

- **First touch.** Light follows the finger or cursor across the hero card. Tapping the card begins the reading with a continuous flight into the fanned deck. Choosing and turning stay manual.
- **Sound, off by default.** A shuffle, the turn, and one low tone at the reveal, behind a single toggle. No sound under reduced motion.
- **One continuous room.** Cross-document View Transitions between the homepage and the inner pages.
- **Small touches.** A light as the desktop cursor over the deck; a vibration on Android when a card is picked or turned; a greeting for the moon phase or time of day (the lunar module exists).
- **Share.** A story-format image of the drawn card in the deck's art, linking back to the site.

### 3. Brand identity (the owner, ideally with a designer)

- **A mark.** Logo lockup, monogram, app icon and favicon. The current icons are the old violet sprig, and the rejected sculptural emblem must not become the logo.
- **A system.** The Olive Lattice as a pattern system; a type scale with more weights; the "light pass" as the motion signature.
- **A voice.** A named editor and a short "why Olivia" page.
- **Applications.** Social templates, a printed deck mockup, email, and a one-page guideline.
- **For BRRRANDING,** a human-designed identity with a case study.

### 4. Remove what drags the score down (owner decisions)

- About 100 astrology pages in an older style: redirect them or move them to a separate brand.
- Hide membership and pricing until the offer exists.

### 5. Submission

- Films of the ritual on phone and desktop, and stills.
- Lighthouse scores measured on the live site.
- A case-study page with credits.
