# P12 Content De-Bloat / Value Clarity Report

Date: 2026-05-03

## 1. Sections Removed

Homepage removals:

| Section/component | Classification | Reason |
| --- | --- | --- |
| `CinematicLoader` | Decorative / conversion blocker | First mobile screenshot showed the loader instead of the value proposition. Removed from homepage so the CTA is visible immediately. |
| `CosmicStatus` | Decorative / confusing | Live RA/DEC/JD and status chips added technical noise above the product story. |
| `StoryMarkers` | Decorative | Chapter rail was built for a long editorial homepage that no longer exists. |
| `CelestialAltar` | Useful but too large | Card-of-day module pushed core product choices down. Kept as its own route, not homepage. |
| `DailyHoroscope` | Useful but too dense | Zodiac selector is now represented by a simpler path/CTA instead of a full module. |
| `CompatibilityChecker` | Repetitive | Homepage now links to `/synastry` rather than embedding a second form. |
| Proof ticker / marquee | Trust-risky / decorative | Removed language counts, ephemeris claims, Paddle/ElevenLabs/vendor claims, lesson counts, and other low-value ticker copy. |
| `Features` | Useful but too long | Replaced with 3 clear action cards. |
| `HowItWorks` | Repetitive | Replaced with 3 concise "why personal" points. |
| `Testimonials` | Trust-risky | No verification source found. Removed from homepage rather than keeping possible fake social proof. |
| `CosmicSelfie` | Confusing / decorative | Removed the "stars already know your face" flow from homepage. Component left intact for future review. |
| Homepage `Pricing`, `Faq`, `CTA` blocks | Repetitive / too long | Replaced by one compact pricing teaser and direct CTAs. Pricing/FAQ details live on `/pricing`. |

## 2. Sections Shortened

| Route/component | Before | After |
| --- | --- | --- |
| `/` hero | Technical Witness/ephemeris framing | Clear astrology + tarot value proposition and one primary CTA. |
| `/pricing` | Plan cards plus long "deeper resonance" essay, sample comparison, and full mobile matrix | Plan cards, short trust row, collapsed mobile details, desktop comparison table. |
| `/synastry` | "Cosmic chemistry between souls" framing | Direct compatibility reading instructions. |
| `/academy` masthead | "14 courses, 207 lessons, 3 braided tracks" | "Learn astrology and tarot at your own pace." |
| `/story` | NASA/JPL and precision-heavy story | Reflection, chart context, timing, and ritual ease. |
| `/cosmos` | "The Living Cosmos" / real-time proof framing | "Current Sky" and practical sky details. |
| Global metadata | Precise/NASA/vendor-heavy claims | Clearer product descriptions focused on readings and reflection. |

## 3. Sections Moved Lower / Collapsed

| Item | Change |
| --- | --- |
| Pricing feature matrix | Hidden behind a concise mobile `<details>` summary; full matrix remains on desktop. |
| PWA install prompt | Delayed by 12 seconds so it does not cover the first decision moment. |
| Technical trust claims | Moved out of hero/main homepage flow; legal/disclaimer pages remain untouched. |

## 4. Hero Copy Before / After

English before:

> Your stars, read for you. Ask the Witness what seeks clarity. Personalized astrology and tarot readings computed from high-precision astronomical positions.

English after:

> Your stars, translated clearly.
> Personal astrology and tarot readings shaped by your birth chart, current transits, and the question you bring.
> Personal, reflective readings. Built for clarity, not noise.

Ukrainian before:

> Ваші зірки, прочитані для вас. ... реальних планетарних позицій precise astronomical.

Ukrainian after:

> Ваші зірки — людською мовою.
> Персональні астрологічні й таро-читання на основі вашої натальної карти, поточних транзитів і запитання, яке ви приносите.
> Особисті, рефлексивні читання. Створено для ясності, не шуму.

Also cleaned the hero copy in `ru`, `de`, `fr`, `ar`, `es`, and `pt` to remove the stray "precise astronomical" phrase.

## 5. Pricing Copy Before / After

Before:

- "Choose your depth"
- Vendor/model claims in feature bullets
- Long "What deeper readings add" section
- Long illustrative reading comparison
- "Astronomical Ephemeris" trust chip

After:

- "Choose your reading plan"
- Free/Insight/Premium/VIP plan cards focus on what the user gets
- Trust row: "Secure checkout", "Private readings", "Cancel anytime"
- Mobile users get a short plan comparison instead of a wide matrix
- Pricing metadata now explains free start + paid plan value without vendor bragging

## 6. Synastry Copy Before / After

Before:

> Cosmic Synastry. Compare two birth charts to reveal the cosmic chemistry between souls.

After:

> Compatibility Reading. Enter two birth dates. Add birth times and cities when you know them for a more useful comparison.

Also changed:

- "Calculate Synastry" -> "Compare charts"
- Invite copy from "stars aligned" to "compare charts"
- Score label from "COSMIC COMPATIBILITY" to "Compatibility score"

## 7. Testimonial / Trust Cleanup

- Removed homepage testimonials because names/quotes could not be verified in code.
- Removed low-value trust ticker claims from the homepage.
- Softened technical trust copy into human trust copy: private readings, cancel anytime, reflective use.
- Footer English/Ukrainian now clarifies that readings are for reflection and choices remain with the user.

## 8. Mobile Improvements

- Homepage now has a short hero, one visible primary CTA, and no first-load cinematic blocker.
- Homepage body text reduced from a long product encyclopedia to 4 concise sections.
- Pricing mobile no longer exposes the full comparison matrix by default.
- Academy mobile grid no longer expands the layout width.
- Nav/back links and Oracle exit link now meet touch-target sizing.
- Skip link is visually hidden until keyboard focus.
- PWA install prompt no longer appears immediately on first screen.

## 9. Writing Rules Created

1. Every line must help the user understand, trust, or act.
2. No mystical filler unless it supports a decision or interaction.
3. No duplicated technical claims in hero/homepage flow.
4. No long italic paragraphs on mobile.
5. No vendor/model/ephemeris jargon above the fold.
6. CTA text must name the concrete action.
7. Body copy should be calm, direct, and short.
8. Decorative labels should stay under 2-4 words.
9. Ukrainian must read naturally and never mix in English fragments.
10. Testimonials require verification; otherwise use product samples or remove.

## 10. Verification Results

Commands run:

| Check | Result |
| --- | --- |
| `npm run lint -- --quiet` | Pass |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass; all 64 static routes generated |

Browser smoke:

| Routes | Viewports | Result |
| --- | --- | --- |
| `/`, `/pricing`, `/oracle`, `/synastry`, `/academy`, `/cosmos`, `/story` | 390x844, 768x1024, 1440x900 | No 404s, no horizontal overflow, no hydration errors seen, no small tap targets after fixes |

Screenshots saved locally for QA:

- `/tmp/olivia-p12-qa/home-mobile.png`
- `/tmp/olivia-p12-qa/pricing-mobile.png`
- `/tmp/olivia-p12-qa/synastry-mobile.png`

Observed residual browser warnings:

- `THREE.Clock` deprecation warning appears from the Three/R3F stack. It is not new from this pass and did not block rendering.
- Repeated local CDP smoke tests can briefly trigger "too many active WebGL contexts" in headless Chrome while opening many routes quickly. This was not observed as a route failure.

## 11. File Map

Primary files changed in this pass:

| File | Change |
| --- | --- |
| `src/app/page.tsx` | Rebuilt homepage IA into hero, 3 actions, personal-context points, sample, pricing teaser. |
| `src/components/HeroV3.tsx` | Shortened mobile hero flow, translated trust line, hid secondary CTA on mobile, routed daily node to `/daily`. |
| `src/lib/i18n/translations.ts` | Rewrote hero EN/UK copy, removed mixed-language fragments across locales, simplified pricing and footer EN/UK copy. |
| `src/components/Pricing.tsx` | Removed long value/sample sections, simplified headers/trust row, collapsed mobile feature matrix. |
| `src/components/Faq.tsx` | Shortened answers and removed technical/overclaiming language. |
| `src/app/synastry/page.tsx` | Rewrote page and invite copy to action-focused compatibility language. |
| `src/app/academy/AcademyPageContent.tsx` | Fixed mobile grid overflow and shortened academy masthead. |
| `src/app/story/page.tsx` | Softened technical story claims into chart/context/ritual-ease language. |
| `src/app/cosmos/page.tsx` | Simplified title and description. |
| `src/components/InstallPrompt.tsx` | Delayed PWA install prompt so it does not cover first-screen value. |
| `src/components/Navbar.tsx`, `src/app/oracle/page.tsx`, `src/app/transits/page.tsx` | Improved touch target sizing. |
| `src/app/globals.css` | Added proper visually-hidden skip-link behavior. |
| `src/app/layout.tsx` and route layouts | Simplified metadata and removed mismatched `nebula-bg.webp` preload warning. |
| `src/components/oracle/FramerTarotOracle.tsx` | Replaced confusing "Synastry Engine" label with "Tarot Reading". |

Pre-existing modified readability/performance files were preserved and not reverted, including `CosmicProfile.tsx`, `MagneticButton.tsx`, `MobileBottomNav.tsx`, and `Surface.tsx`.

## 12. Remaining Content Risks

| Area | Risk | Recommendation |
| --- | --- | --- |
| `/academy` | Still content-heavy by nature. | Next pass should split "learn" and "tools" more clearly, and reduce course-card copy on mobile. |
| `/story` | Still editorial/showpiece. | Decide whether this route is a brand story or an Awwwards-style artifact; it may not belong in primary nav. |
| `/oracle` | Still has dense ritual language and heavy motion. | Next pass should simplify labels like "Collapse Time" and review WebGL fallback/performance. |
| `CosmicSelfie.tsx` | Unused after homepage removal, contains confusing "stars already know your face" copy. | Keep out of navigation; decide later whether to rebuild or delete. |
| Non-English locales beyond EN/UK | Hero was cleaned, but deeper pricing/course copy remains less audited. | Do a dedicated i18n tone pass before multilingual launch. |
| Global nav | Top + bottom nav on mobile still creates visual density. | Consider hiding non-primary top CTA on very small screens after product-flow review. |

## 13. Content Inventory By Route

| Route | Current sections | Classification | Action taken |
| --- | --- | --- | --- |
| `/` | Hero, 3 action cards, 3 personal-context points, sample preview, pricing teaser, footer | Essential / useful | Rebuilt IA around "what is it, what can I do, why personal, what to click." |
| `/pricing` | Plan cards, trust row, mobile collapsed comparison, desktop matrix, add-ons, FAQ via route context | Essential / useful but long | Removed long sales essays and simplified plan language. |
| `/synastry` | Header, two-person form, compare CTA, result/paywall flow | Essential | Rewrote copy to action-first language. |
| `/oracle` | Immersive tarot draw | Essential but ritual-heavy | Fixed confusing "Synastry Engine" label; deeper simplification deferred. |
| `/academy` | Masthead, tool cards, course tracks | Useful but too long | Fixed mobile width and shortened masthead claim. |
| `/cosmos` | Current moon, positions, events | Useful niche page | Simplified title/subtitle and metadata. |
| `/story` | Brand story, principles, CTA | Decorative/editorial | Softened technical claims; deeper nav decision deferred. |
| `/transits` | Empty-state CTA or transit timeline | Essential for users with chart | Metadata softened; route flow left intact. |
| `/signs/[sign]` | Rich SEO sign guide | Useful but dense | Left intact; should be audited in a later SEO/content pass. |
