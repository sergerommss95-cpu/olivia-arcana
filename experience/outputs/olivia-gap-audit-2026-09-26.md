# What Olivia Arcana still lacks — audit of 26 September 2026

Scope: motion, look, design, implementation, value to users and brand, for the whole site (not only the reading experience). Method: three parallel audits (all 55 routes rendered at 390×844 and 1440×1000; bundle, network and code measurements; product, content and brand review), with the largest claims re-checked in code and screenshots. The same day, the v5 pass on this branch addressed the items marked **Done (v5)**; details and evidence are in `qa-v5/review.md`.

**Verdict.** The core tarot ritual on the homepage is already close to top-tier: the deck art, choosing and turning your own card, the pending reading and the honest wording. What held the site back was around it: about a third of the site was still the old astrology product in a different style, the homepage was very heavy on phones, there was no reliable way to come back to saved readings, nothing could be bought, and the Ukrainian card texts used a different, informal voice.

## Motion

| Gap | Status |
|---|---|
| Screens changed by hard cuts (`setView` hid one view and jumped to the top) | **Done (v5):** product pages fade in (opacity only, reduced-motion safe); the deck, card flights and hero keep their own choreography |
| No shared motion settings: 10 easing curves, ~40 durations | **Done (v5):** `motion-tokens.css` (`--ease-settle`, `--ease-glide`, `--ease-control`, four durations); the CSS now uses 3 named curves plus one outlier |
| The reveal was a flat flip followed by a still hold | **Done (v5):** one soft pass of light and a settle after the card turns; still revealed once; off under reduced motion |
| Living background needs WebGPU; elsewhere a still gradient | Partly: the 2.5 MB shader bundle now downloads only when a WebGPU adapter exists. The animated version is still unverified on real phones |
| "SKY ATLAS · PRESS M" floated over text on every sub-page | **Done (v5):** removed from all but the four earlier night rooms |

## Look

| Gap | Status |
|---|---|
| Only one weight of the sans-serif font is embedded | Open: adding weights would change the approved desktop typography; needs a design decision |
| 361 of 955 font sizes under 12 px | Open: most are tracked capitals in the approved desktop; raise with a type-scale pass |
| 690 distinct colour values; gold defined four times; violet and indigo on older pages | Partly: the site ground is lapis everywhere, checkout panels are no longer violet, and `BRAND.md` defines the palette. A colour-token refactor is still open |
| Card art and Olive Lattice back absent outside the homepage | Partly: both card libraries now show the art; other pages still use earlier card backs |
| Text over the animated background can lose contrast | Open: needs checking on a WebGPU device |

## Design

| Gap | Status |
|---|---|
| Sub-page header took about a third of a phone screen; five header styles | **Done (v5):** one shared masthead (`AlmanacMasthead`), about 115 px on phones, same ivory "Begin a reading" as the homepage |
| Off-system buttons; invisible "Share your Scorpio card" (ivory on ivory) | **Done (v5)** for the header, share and gate buttons |
| Broken: unreadable encyclopedia tiles, endless checkout spinner, "to to set" typo | **Done (v5)** |
| Clipped dropdown on `/synastry` | Open (earlier astrology page) |
| "Explore the tarot library" went to the astrology Academy | **Done (v5):** it opens the card library (`/cards/`, `/uk/cards/`) |
| Homepage footer had no Privacy, Terms or Contact | **Done (v5)** |
| Ukrainian membership link opens the English pricing page; pricing looks like a legal notice | Open: depends on the paid offer |

## Implementation

| Gap | Status |
|---|---|
| Buttons dead until a 2.5 MB background script loaded (scripts loaded one after another) | **Done (v5):** parallel download, ordered execution, app before the background; background only with a WebGPU adapter. Controls are wired after about 0.45 s locally |
| About 8.5 MB downloaded on a phone within 5 s | **Done (v5):** 4.9 MB (EN) and 5.1 MB (UK), with phone-sized hero art (5.3 → 1.8 MB), lazy spread previews, WOFF2 fonts (631 → 148 KB), UTF-8 bundles, and a separate English app bundle (932 → 551 KB) |
| The framework shipped Supabase and the sky chrome to every page | **Done (v5):** Supabase is skipped while accounts are off; the night-room components are split out of the shared bundle; unused font preloads removed |
| No long-term caching of hashed files | **Done (v5):** one-year immutable cache for `/experience/assets/*` and `/_next/static/*` |
| CSS built from stacked overrides (122 `!important`) | Open: motion tokens are a first step; a layered, token-based refactor remains |
| No CI, no browser tests, manual deploys, no error tracking | Partly: GitHub Actions runs every test suite and the static export; a site-wide error page exists. Browser smoke tests in CI, analytics and alerting need an account decision |
| AI endpoint accepted requests without an Origin header; per-instance limit; no spend cap | Partly: requests must now come from the site. A spend cap must be set in the Anthropic console; shared rate limiting is a Netlify setting |
| All 81 Ukrainian pages were marked `lang="en"` | **Done (v5)** |
| No link-preview image on the homepages | **Done (v5):** new EN/UK images in the brand palette |
| 113 old builds (55 MB) committed | **Done (v5):** removed, and the sync now prunes them |

## Value to users

| Gap | Status |
|---|---|
| The promise isn't on the first screen | Open: the hero copy is approved; the owner decides |
| Readings can be lost (Safari clears site storage after a week without a visit) | **Done (v5)** as far as possible without accounts: persistent storage is requested on every save, and iPhone/iPad visitors see a note with Home Screen and backup options |
| No reminders except a calendar file, no accounts or sync | Open: owner decision (channel, accounts) |
| Nothing to buy; plans would sell astrology via Paddle, which bans fortune-telling | Open: owner decision |
| The 56 Minor Arcana reversals came from one fill-in sentence | **Done (v5):** 56 hand-written reversed reflections |
| The finished reading wasn't labelled as AI (though /about and the method said it was) | **Done (v5)** in EN and UK |
| Crisis help existed only as an instruction to the AI | **Done (v5):** a deterministic note with local crisis lines (EN, UK and common Russian phrasings), shown at the question and on the reading, prepared or AI |
| Privacy policy described accounts, Supabase, Paddle, voice and birth data | **Done (v5):** rewritten for the real data flows; cookies, terms and refund pages corrected. Needs legal review |
| Shared reflections carried no link back | **Done (v5)** |
| The AI was fed the old "universe" card texts as the card meanings | **Done (v5):** it receives the curated notes in both languages |

## Brand

| Gap | Status |
|---|---|
| Two brands on one domain (about 100 of 292 sitemap URLs are astrology) | Open: owner decision. Gate and placeholder pages are now out of search results |
| Off-brand manifest, link preview, 404 and Ask title | **Done (v5)** |
| No current brand book; old design docs describe astrology | **Done (v5):** `BRAND.md`; old docs marked superseded |
| No logo or app icon (current icons are the earlier violet sprig) | Open: owner decision |
| Ukrainian card texts in informal «ти» with predictive lines | **Done (v5):** native Ukrainian of the curated English, formal «ви»; `UK-VOICE.md` |
| No named editor, social presence or newsletter | Open: owner decision |

## Decisions only the owner can make

1. The astrology pages: redirect or move them to a separate brand (check Search Console traffic first).
2. What paid membership includes, and which payment provider.
3. How to invite people back: email, Telegram or push.
4. Whether a named person stands behind the readings.
5. The logo and app icon, and confirming the company named on the contact page.
