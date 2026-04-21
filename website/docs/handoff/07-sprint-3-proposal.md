# Sprint 3 — "Make the magic the marketing"

**Strategic proposal. Status: draft for review, not committed to scope.**

---

## 0. Honest assessment (5/10 → 9/10)

After Sprints 1 & 2 the site has good bones: unified tokens, clean Hero CTA, sharp pricing, a FAQ, proof marquee, a form primitive, an elevation scale. That's worth ~5/10.

**What's actually limiting the score:**

1. **The flagship experience is hidden.** The veil reveal is the single most magical thing on the site. It lives at `/academy/card-of-the-day`. A first-time visitor has to decide to click a nav link to find it. The brand promises cosmic ceremony — the home page shows a text gradient and some star glyphs.
2. **The homepage is a feature tour, not a narrative.** 11 sections, each a separate widget. Hero → horoscope → compatibility → marquee → features → how it works → testimonials → selfie → pricing → FAQ → CTA. It reads like a product brochure for an astrology SaaS, not "Written in your stars."
3. **Too many ambient overlays are fighting.** Starfield + CosmicCursor + FilmGrain + EclipseOverlay + TimeOfDayTheme + ConstellationOverlay + MagneticGlow + SignLabel + CinematicLoader all run simultaneously. Individually tasteful, collectively overproduced. Your best effects are suffocating each other.
4. **The claim "real NASA ephemeris data" has no artifact.** Nothing on the homepage proves this. No live transit readout, no example reading, no computed chart preview. The brand asserts truth; the interface doesn't demonstrate it.
5. **"Sample reading" is a promise that goes nowhere.** I added `/#sample` as a secondary hero CTA in Sprint 1. There's nothing at that anchor. That's worse than not having the link.
6. **No persona.** "Olivia" is a brand name with no face, no voice, no bio, no origin. Users don't know if this is a real astrologer, a persona, or a team. Trust in mystical/spiritual categories is built on *who's telling you*. The FAQ I wrote has six answers by nobody.
7. **Zero personalization for returning users.** A user who has saved their birth data sees exactly the same page as a first-time visitor. The product *knows* their sign and never uses that knowledge on home.
8. **Academy is buried.** 207 lessons of real astrology education, and the homepage never explains what the academy is or why to care.

**What's NOT the problem:**
- Tech stack (Next 16 + R3F + Three.js is fine)
- Design tokens (clean after Sprint 1)
- Typography (Cormorant + DM Sans + IBM Plex is a great trio)
- Pricing (sharp after Sprint 1-2)

**The core Sprint 3 bet:** every visitor should *experience* real astrology in the first 15 seconds on the homepage, and meet the person who's writing it.

---

## 1. Sprint 3 scope — 8 items, ranked by impact

### 🔥 THE BIG THREE (do these even if you skip everything else)

#### A. Hero = live veil reveal, not a poster
Replace the current Hero text-and-buttons composition with a **miniaturized veil reveal rendered right there**, above the fold. A 360×540px veil at the right edge of the hero, with the headline on the left. User sees the cloth hanging, sees the hold prompt, and can reveal today's card *without leaving the homepage*.

- Reuse `VeilRevealScene` with a "compact" mode prop (smaller canvas, same physics, same reveal)
- Once revealed, the reveal persists in-session — they don't see it again on refresh
- "Full ceremony →" link opens `/academy/card-of-the-day` for the room-filling version
- This is the single highest-leverage change on the site. 15 minutes of "oh wow" vs. 15 seconds of "nice text"

**Difficulty:** high. Needs a second mount mode for VeilRevealScene. Protected in Sprints 1-2; this touches it carefully.
**Impact:** massive.

#### B. Live sky ticker — prove the ephemeris claim
A thin strip immediately below the hero:

> **Right now:** Moon in Scorpio ☾ · Mercury at 12° Libra sextile Venus · Mars retrograde day 23 · Waxing gibbous, 67%

Updates every 60 seconds from your existing `transit-calculator.ts` + `astro-events.ts`. No pricing, no signup — just proof that the astrology is real, computed, now. This is the single most efficient way to convert "sounds nice" into "this is actually astrology."

**Difficulty:** medium. Data layer exists; UI is new.
**Impact:** huge for credibility.

#### C. Commission an actual "Olivia" identity
The question "is Olivia a real person?" is the single most important product question you haven't answered. Three paths:

1. **Olivia is a persona** (my recommendation) — write a first-person 150-word bio card, commission an illustrated portrait (SVG or single AI image, not photographic), give her a signature on every reading: *✦ Olivia*. Treat her like a character — Kurzgesagt's bird, Waking Up's Sam Harris voice, Almanac's anonymous editorial "we".
2. **Olivia is you** — real photo, real bio, real credentials. Higher trust, smaller scale (you can't scale 1:1 readings).
3. **Olivia is a collective** — "the almanac team", multiple bylines. More honest but less distinctive.

Every other brand decision (FAQ voice, email signatures, oracle replies, readings) cascades from this. Do not let Sprint 3 ship without answering this.

**Difficulty:** medium as content work. Design work is small.
**Impact:** reframes the entire brand.

---

### 💪 HIGH-VALUE (do 2-3 of these)

#### D. `/sample` — one real, beautiful, shippable reading
A full page at `/sample` with a worked example natal reading for a fictional-but-named subject ("Eleanor, b. March 14 1994, 3:47am, Edinburgh"). ~2,000 words. Custom typography. Scrollytelling where sections animate in as you read. Signed *✦ Olivia*.

This replaces the broken `/#sample` anchor. It's the single most convincing proof of product quality: people pay for readings because of *taste*, and taste has to be demonstrable.

Use it for:
- Hero secondary CTA
- Press / outreach ("here's a sample of what we do")
- Social sharing (OG image the reading's headline)

**Difficulty:** low-medium. 1 day of design + writing, 1 day of scrollytelling.
**Impact:** very high. This is how you sell the premium tier without needing a free trial.

#### E. Ruthlessly delete ambient overlays
Audit every component inside `ClientShell.tsx`. Keep 3. Delete the rest.

| Keep | Kill or gate |
|---|---|
| `Starfield` (it IS the brand) | `FilmGrain` (redundant with noise in starfield) |
| `TimeOfDayTheme` (subtle, invisible until you notice) | `CosmicCursor` (fights the magnetic buttons, feels dated) |
| `MagneticGlow` (reinforces button interactions) | `EclipseOverlay` (shown once a year, ship as Easter egg instead) |
| | `ConstellationOverlay` (decorative, doesn't earn viewport) |
| | `SignLabel` (what does this even do visually?) |
| | `CinematicLoader` (adds latency to reach the real content) |

Every overlay you delete makes the remaining effects hit harder. "Restraint is the signature of a master" etc.

**Difficulty:** low — mostly deletion.
**Impact:** large, perceived quality jump.

#### F. Personalize the homepage for returning visitors
If `useProfile()` returns a profile, swap the hero headline + eyebrow:

- **First visit:** "Your chart, *read for you.*" + "✦ An editorial cosmic almanac"
- **Returning:** "Welcome back, *Serhii.*" + "✦ Wednesday, April 22 · Leo ☉ · Mercury in your 10th"

This is a 20-line change that signals product maturity more than any visual change. No login required — use the existing localStorage profile.

**Difficulty:** low.
**Impact:** medium-high (especially for retention once you have users).

#### G. Homepage narrative restructure (the hard one)
Kill the 11-section feature tour. Replace with a 7-act narrative:

1. **Hero** — live veil reveal + today's date/sky ticker
2. **Your sky right now** — bigger, interactive transit readout ("what these mean for you" CTA)
3. **A reading, worked end-to-end** — embedded excerpt from `/sample` with "read the full thing" CTA
4. **The person writing** — Olivia's intro card (or team)
5. **How deep it goes** — academy preview (first 90 seconds of Lesson 1, playable in-page)
6. **The offer** — Pricing (now anchored by sections 1–5 instead of floating in space)
7. **Lingering questions + final ask** — FAQ + CTA

What gets cut:
- `DailyHoroscope` component (redundant with sky ticker)
- `CompatibilityChecker` (give it its own page; it's a feature, not a narrative beat)
- `CosmicSelfie` (absorbed into section 3)
- `InfiniteMarquee` (proof is shown via the ticker + the worked reading, not quotes)
- `Features` / `HowItWorks` / `Testimonials` as their current sections (absorbed into acts 3–5)

The cuts will feel scary because you built them. Ship the cuts anyway. A focused site will outperform a feature-rich site every time at this stage.

**Difficulty:** high. This is a real rewrite, not an edit.
**Impact:** enormous. This is the single biggest step-change available.

---

### ⚡ FAST WINS (do all of these, they're cheap)

#### H. Real Lighthouse pass
Run Lighthouse on home, Card of the Day, Pricing, Academy. For each score below 95:
- LCP: preload the hero image/shader, font-display: optional for body, subset Cormorant to Latin-1
- CLS: reserve space for the veil canvas, specify dimensions for all deferred components
- TBT: confirm Sprint 2's dynamic imports are actually splitting chunks
- Accessibility: fix any color contrast failures (gold on dark edges are probably the culprit)

**Difficulty:** medium, concrete checklist once we have the report.
**Impact:** both UX and SEO.

#### I. Adopt the surface elevation scale
Sprint 2 added `.surface-1/.surface-2/.surface-3` but nothing uses them yet. In Sprint 3:
- Migrate all `.glass-card` usages → choose the right surface tier
- Make the VIP pricing card `.surface-3` (single highlight)
- Make interactive cards (feature tiles, academy entries) `.surface-2`
- Make static containers (info panels, form wraps) `.surface-1`

Consistent hierarchy = perceived quality.

**Difficulty:** low, mechanical.
**Impact:** small per card, cumulative.

#### J. Swap placeholder copy in three places
Sprint 2's TODOs:
- `Faq.tsx` ROWS → verbatim from `Olivia Arcana v2.html`
- `Pricing.tsx` COMPARE_ROWS → verbatim from prototype
- `page.tsx` marquee items → verbatim from prototype

Cheap. Will make the whole site feel more finished.

**Difficulty:** trivial.
**Impact:** the "finished-ness" sniff test.

---

## 2. What NOT to do in Sprint 3

- **Don't add more WebGL.** You have plenty. Making existing WebGL tighter beats adding more.
- **Don't add more Three.js scenes.** The veil is enough. The cosmos map is enough. Don't make a third one.
- **Don't redesign the tokens.** Sprint 1 got them right. Leave them.
- **Don't add more motion tokens.** Five easings is plenty.
- **Don't add more pages.** You have 29. Narrowing is the work.
- **Don't theme-switch to light mode.** This is a nighttime product. Own it.
- **Don't add a blog.** If writing is the output, make readings the output.
- **Don't onboard more languages yet.** One great language > 9 half-translated ones.

---

## 3. Suggested Sprint 3 cut

If you can only do 4 items, do:

1. **C. Olivia identity decision** (unblocks everything)
2. **A. Hero = live veil reveal** (single biggest visual change)
3. **G. Homepage narrative restructure** (the real work)
4. **E. Delete ambient overlays** (perceived quality jump)

If you can do 6, add:

5. **D. `/sample` worked reading** (premium tier proof)
6. **H. Lighthouse pass** (performance foundation)

If you can do all 10:

7. **B. Live sky ticker**
8. **F. Personalize for returning**
9. **I. Adopt surface scale**
10. **J. Swap placeholder copy**

---

## 4. Rough sizing

| Item | Days |
|---|---|
| A. Hero = live veil | 3 |
| B. Sky ticker | 1 |
| C. Olivia identity | 2 (mostly content + one illustration) |
| D. `/sample` reading | 2 |
| E. Delete overlays | 0.5 |
| F. Personalize returning | 0.5 |
| G. Homepage narrative | 5 (the big one) |
| H. Lighthouse pass | 1.5 |
| I. Adopt surface scale | 0.5 |
| J. Swap placeholder copy | 0.25 |
| **Total full scope** | **~16 days** |
| **Minimum viable Sprint 3 (A, C, E, G)** | **~10 days** |

---

## 5. Metric to decide success

Not Lighthouse. Not time-on-site. Not conversion rate.

**After Sprint 3, a first-time visitor should, within 30 seconds of landing on the homepage:**
1. See the veil cloth hanging and understand it responds to them
2. See live astrological data updating
3. Know who Olivia is

If those three things happen, you're at 9/10. Everything else is polish.
