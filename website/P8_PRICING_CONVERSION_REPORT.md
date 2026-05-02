# P8 — Pricing Conversion Upgrade Report

## 1. Pricing Journey Before/After
### Before
- **Journey**: Abrupt jump from Oracle result to a generic SaaS pricing grid.
- **Framing**: Standard "Insight", "Premium", "VIP" tiers with dry taglines.
- **Trust**: Minimal trust markers; generic FAQ.
- **Mobile**: Basic vertical stack of cards.

### After (Celestial Depth)
- **Contextual Landing**: Arriving from Oracle now triggers a personalized header: *"Continue your Oracle reading."* It frames the transition as a continuation of the ritual, not a paywall.
- **Depth Framing**: Tiers are reframed around levels of symbolic depth (e.g., "Surface Pattern" vs. "Full Celestial Resonance").
- **Tangible Value**: Added a "Difference in Depth" sample section visually contrasting a free reading with a paid one (including transit overlays and natal aspects).
- **Stronger Trust**: Enhanced FAQ with specific objections addressed (Privacy, Accuracy vs. Symbolism, Cancellation).

## 2. Files Changed
| File | Change |
| :--- | :--- |
| `src/components/Pricing.tsx` | Implemented `from=oracle` logic, new taglines, value explanation section, and sample reading preview. |
| `src/components/Faq.tsx` | Enhanced FAQ with trust, privacy, and symbolic clarity items. |
| `src/components/oracle/FramerTarotOracle.tsx` | Updated "Deep Dive" CTA to link with `?from=oracle` context. |
| `src/app/page.tsx` | Wrapped `Pricing` in a `Suspense` boundary for build compatibility. |
| `src/app/pricing/page.tsx` | Wrapped `Pricing` in a `Suspense` boundary for build compatibility. |

## 3. Plan Framing Changes
- **Free**: Surface Pattern — Initial guidance.
- **Insight**: Expanded Interpretation — Daily companion.
- **Premium**: Full Celestial Resonance — The deeper current.
- **VIP**: Direct Cosmic Guidance — The celestial peak.

## 4. Value Preview Changes
- Added a high-fidelity visual comparison showing how a paid reading "Synchronizes" natal Mercury aspects and Saturn transits into the interpretation, while the free reading remains generic.

## 5. Trust & FAQ Changes
- Added clarity that interpretations are symbolic, not predictions.
- Explicitly addressed data privacy and "no dark patterns" cancellation.
- Verified NASA non-affiliation while citing ephemeris precision.

## 6. Performance Guardrails Preserved
- **Zero Rerender**: Maintained the GPU-only interaction pattern.
- **Build Safety**: Added `Suspense` boundaries to satisfy Next.js static export rules for `useSearchParams`.
- **Assets**: No new heavy assets added; used CSS and typography for luxury feel.

## 7. Verification Results
- **Lint**: 0 errors.
- **Typecheck**: Passed.
- **Build**: Success (64 static routes).
- **Smoke Test**: Verified contextual header and CTA path.

## 8. Remaining Risks
- **Static Export**: Ensure `useSearchParams` doesn't cause hydration flickers in edge cases (mitigated with `Suspense`).
- **Conversion Tuning**: Monitor the 2.4s "preparing" state in the Oracle to ensure it doesn't cause bounce rate increases.
