# An award-level arrival: findings and plan — 27 September 2026

**Status: proposed.** The owner asked what is left for a site worthy of Awwwards and BRRRANDING, with "the strongest, most memorable and magical experience for a customer when they arrive". Nothing below is implemented yet, and the owner has not yet approved section 1. Ask before starting it.

Later on 27 September, a second session added the live preview measurements and the research on 2026 winners and BRRRANDING (sections "What a visitor sees today" and "What 2026 winners do in their first seconds").

## How the two are judged

- **Awwwards.**
  - Design 40%, usability 30%, creativity 20%, content 10%. At least 18 jurors vote, and the 3 scores furthest from the average are dropped.
  - A score of 6.5 or more earns an Honorable Mention. Site of the Day goes to the day's top score, then Site of the Month and of the Year.
  - A developer jury scores each Site of the Day; above 7 earns the Developer Award. Its categories are semantics/SEO, animations and transitions, accessibility, performance (WPO), responsive design, and markup/meta-data.
  - Jurors click through the whole site. Design and usability make up 70%, so a flawless, fast, clear arrival matters more than extra effects.
  - The Mobile Excellence award (with Google, from 2017) is no longer offered: the evaluation page lists only the five awards above. Its old checklist is still a good test for the usability score: fast first paint on a slow connection, visible content first, key calls to action visible, legible type, adequate tap targets, and no permission prompts on arrival.
- **BRRRANDING** (brrranding.com).
  - 215 identities, each picked by Vadim Carazan, a brand designer and founder of the studio Wegrow: "No algorithm. No AI. Just great work." Its notes add: "nothing is generated: every entry is a real identity made by a real studio."
  - An entry names the client, the studio, the year, the sector, the colours and the identity's elements (custom typeface, packaging, motion, website, print and others). It shows about ten still mockups and links to the studio's own case study.
  - Projects are submitted by email to the curator. Studios include Pentagram, Koto, Collins, Otherway and Fiasco. Web- and app-first brands are common.
  - No tarot, astrology or spiritual brand is featured.
  - The project's own notes describe the card art as AI-generated (`docs/CONTENT_STRATEGY_V2.md`). To be featured, the identity (mark, type, pattern, applications) would need to be designed by a person or studio and presented as a branding case study. This is the owner's decision.
- Sources: [Awwwards evaluation system](https://www.awwwards.com/about-evaluation/), [Awwwards Developer Award](https://www.awwwards.com/developer-award/), [Mobile Excellence guidelines (2018)](https://www.awwwards.com/mobile-excellence-guidelines.pdf), [Awwwards judging criteria (2026)](https://www.hontran.dev/blog/awwwards-judging-criteria), [BRRRANDING](https://www.brrranding.com/) and [its notes for readers and agents](https://www.brrranding.com/llms.txt).

## What a visitor sees today

Method: `experience/work/tools/arrival-filmstrip.mjs` against the local static export of this branch (v5). The phone profile is 390×844 at 2×, an iPhone user agent, 4G (9 Mbps, 120 ms round trip) and a 4× slower CPU, to stand in for a mid-range phone. The desktop profile is 1440×900. Headless Chromium has no WebGPU, so every frame shows the still palette. Contact sheets are in `arrival-2026-09-27/`; `phone-en-run1-sheet.png` is labelled with the planned marks, captured at about 0.3, 2.0, 2.1, 2.2, 3.0, 4.5, 7 and 12 s.

- **Phone.** First paint came after 2 to 3 s; before that the tab was white. Then only lapis and a single card back showed, with the navigation ghosted. Next the desktop composition appeared: in one run the whole thing (header row, left-aligned wordmark, grey button), in another only its header fading in. One to two seconds later everything jumped into the phone composition (centred wordmark, ivory "Draw your card", menu button). CLS was 0.067.
  - Cause: the phone composition is keyed to `body.mobile-experience`. `mobile-experience.js` (`sync()`) adds that class only after the app bundle has downloaded and run.
  - After that, the phone opening stays still by design (v2): the 96-second journey plays only after "Watch the journey".
- **Desktop.** First paint about 0.55 s, then an entrance of about 2 s (card, wordmark letters, tagline, button). After that it is a calm first screen whose only motion is the slow tilt of the card.
- **The live preview** (filmed later on 27 September; `preview-*-sheet.png`) shows the same sequence.
  - Phone EN: a white first frame, first paint at 1.27 s, CLS 0.068.
  - Phone UK: first paint at 0.78 s, CLS 0.081.
  - Desktop: first paint at 0.35 s (EN) and 0.84 s (UK), CLS 0.
- **Weight.** On the live preview a phone homepage downloads 3.57 MB over the wire in English (4.98 MB decoded) and 3.65 MB in Ukrainian, before the network goes quiet. Production v3 downloads 7.53 MB.
  - Images are 2.83 MB of the preview's total: the 22 phone-sized Major Arcana textures `hero.js` loads at boot (1.82 MB), the card back (0.43 MB), and three full-size cards that homepage sections below the fold load straight away (0.59 MB).
  - Scripts are 0.45 MB over the wire and fonts 0.19 MB.
- **Safari's visible height.** Tests use the whole screen (390×844), but Safari with its toolbars shows about 390×664, 375×635 on a 375-wide iPhone, and 375×553 on an iPhone SE.
  - At those heights the homepage's "Draw your card" fits, except on the SE (9 px short).
  - The second question step ("How shall we read?") puts its only primary action 166–210 px below the visible area. Visitors have to scroll to find "Choose my card" (`qa-v5/live-preview-2026-09-27/prepare-step-safari-height.jpg`).
- **Not seen.** The WebGPU background on a real device (Safari on iOS 26 and desktop Chrome support WebGPU), and text contrast over it.

## What 2026 winners do in their first seconds

Research on 27 September covered ten Sites of the Day from March to September 2026, six of them also Sites of the Month (March to August). It drew on their Awwwards pages, studio write-ups and served HTML, plus BRRRANDING's own pages. The phone timing of each opening could not be measured from here, so none is claimed.

- **Openings are short or absent.**
  - Oryzo AI (Lusion), Floema (Bürocratik), Paul Kalkbrenner (HOLOGRAPHIK) and White Desert (Malvah) have no loading screen in their HTML.
  - Others show a brief text-only one: a percentage (Lama Lama; "Aa · 0% · Loading" on Squarespace Foundations by Resn), place names (ERA Residence), or a line of poetry (Son Daven).
- **One explicit cue, written for touch.** "Tap to Explore" (Squarespace Foundations), "Drag to see more" (ERA Residence), "Scroll to Explore ↓" (Floema), hold to compare the seasons (Son Daven).
- **3D stays on phones, tuned for them.**
  - GQ & AP The Extraordinary Lab (Immersive Garden, Site of the Month for March) aimed for 60 fps on iPhone 11 and 12.
  - Oryzo AI serves phone-only images.
  - Floema stops its render loop when nothing moves.
- **Sound never starts on arrival.** Sites use a "Sound OFF / Sound ON" toggle (Paul Kalkbrenner) or mute buttons, or keep sound to inner pages.
- **Where winners lose points.** Usability was the lowest of the four jury scores on 9 of the 13 winner pages opened, and accessibility the lowest developer score on 11 of 13.
  - Son Daven, a bilingual English/Ukrainian site by the Ukrainian studio The First The Last: usability 7.16 against creativity 8.15; accessibility 7.40 against responsive design 8.40.
  - Its Ukrainian loader still reads "please wait" in English.
- **The Awwwards developer guideline** asks for:
  - animations neither too slow nor too frequent, and a stable frame rate;
  - visible content first;
  - adequate tap targets, and nothing only on hover;
  - a pause control for any animation that starts by itself and lasts more than 5 seconds (Olivia's desktop has "Motion on"; on phones it is in the Explore menu);
  - the page language declared in the HTML.

What applies to Olivia:

1. **The first paint is the finished still composition.** Lapis, the card back, the wordmark, the line and "Draw your card", with no counter or loader in front of them. This is section 1, items 1 to 3.
2. **One touch cue, always in reach.** Keep "Draw your card" / «Оберіть свою карту» large and above the fold at Safari's visible height, including the iPhone SE. Apply the same rule to every step of the ritual: the second question step fails it now.
3. **Keep the approved hero, its 96-second journey and its timing.** The journey already starts only on "Watch the journey" on phones, and "Return to the beginning" and the motion toggle already exist. Nothing here needs `hero.js` to change.
4. **Sound off by default, behind one toggle** (section 2).
5. **Performance the way winners do it.**
   - Measure the WebGPU background at 60 fps on an iPhone 11/12-class phone.
   - Let it stop drawing when nothing moves.
   - Keep phone-sized textures (done in v5).
6. **Win the points winners lose: usability and accessibility.**
   - Contrast of small gold and grey text on lapis.
   - Visible focus.
   - Every primary action visible without scrolling.
   - Screen-reader labels in both languages.
7. **Ukrainian with equal care, down to the loading and error strings.** Olivia already declares `lang="uk"` and sets Ukrainian in a designed Cyrillic face.
8. **BRRRANDING features no tarot or spiritual brand yet,** so a well-made one would stand out. It would have to be an identity by a real designer or studio, shown on the studio's case-study page, with about ten stills:
   - the wordmark, the Olive Lattice as a pattern system, and the palette;
   - the cards, print pieces, and the site on a phone;
   - English and Ukrainian type side by side.

Sources: [Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/), [Sites of the Month](https://www.awwwards.com/websites/sites_of_the_month/), [GQ & AP The Extraordinary Lab case study](https://www.awwwards.com/gq-audemars-piguet-the-extraordinary-lab.html), [Oryzo AI](https://www.awwwards.com/sites/oryzo-ai), [Floema case study](https://www.awwwards.com/floema-spaces-for-people-made-for-life.html), [Son Daven](https://www.awwwards.com/sites/son-daven), [Lama Lama](https://www.awwwards.com/sites/lama-lama-2), [ERA Residence](https://www.awwwards.com/sites/era-residence), [Squarespace Foundations](https://www.awwwards.com/sites/squarespace-foundations), [Paul Kalkbrenner](https://www.awwwards.com/sites/paul-kalkbrenner), [White Desert](https://www.awwwards.com/sites/white-desert), [bleibtgleich'26 on Codrops](https://tympanus.net/codrops/2026/09/23/bleibtgleich26-a-180-turn-from-brutalism-to-minimalism/), [Awwwards developer guideline](https://docs.google.com/document/d/1Gvmg6Z60UQ-4BOM3XyUcBKvq2shd4J-l_MoXT26JFEg/), [BRRRANDING's full index](https://www.brrranding.com/llms-full.txt).

## Plan

Constraints for all of it: do not replace or re-time the approved hero (`hero.js` is hash-locked); people choose their own cards; a card is revealed once; no blanket perimeter frames; English and Ukrainian get equal care.

### 1. Must fix first (safe, no change to `hero.js`)

1. **Phone composition before first paint.**
   - Option A: a small inline script at the top of the native markup in `website/src/components/almanac/NativeExperienceHome.tsx`. Below 701 px it sets what `sync()` sets for the home view: `body.mobile-experience`, `data-mobile-immersive="true"`, the mobile header visible and the bottom navigation hidden.
   - Option B: repeat the needed rules under `@media (max-width: 700px)`.
   - Option A is smaller and matches the script exactly.
   - Verify with the filmstrip: no desktop frame on phones. Keep the desktop pixel-identical to v5.
   - The composition must fit Safari's visible height, not only the full screen: check 390×664, 375×635 and 375×553.
2. **No white flash.** Give `html` the lapis background inline in the document head (plus `theme-color`) so the first frame is never white.
3. **A designed entrance of about 2 s on every device and connection:** lapis, card back, wordmark, line, button. It must not depend on when the scripts arrive. Under reduced motion, show the final state immediately.
4. **Lighter first load.** Aim for 2.5 MB or less over the wire on a phone homepage (3.57 MB on the preview), without changing `hero.js`. In order of ease:
   - load the three full-size cards for the homepage sections when those sections come near the screen (0.59 MB);
   - smaller or AVIF versions of the card back (0.43 MB) and the 22 phone textures (1.82 MB), if the asset map can offer them where the browser supports them;
   - check that nothing else loads twice.
5. **Every step's primary action within Safari's visible height.** Found on the live preview: the second question step's "Choose my card" is 166–210 px below the fold on most iPhones.
   - Option A: tighten that step on short screens.
   - Option B: keep the action in a fixed area at the bottom, as "Reveal this card" already is.
   - The owner chooses.
6. **Real devices.** On iPhone Safari and Android Chrome, check that the WebGPU background runs smoothly, what it does to the battery, and that text stays readable over it.

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
