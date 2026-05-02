# P7 — Oracle Conversion Ritual Report

## 1. Journey Map Before/After
### Before
- **Entry**: Immediate "Awaken the Deck" button.
- **Draw**: Fan deck appears, user clicks 3 cards.
- **Wait**: 600ms abrupt delay after 3rd card.
- **Reveal**: Instant flip, sparse labels.
- **CTA**: Single "Reveal the deeper pattern" button.

### After (Luxury Ritual)
- **Focus Phase**: New "Hold one question in mind" state before awakening, adding intentionality.
- **Ceremony**: 2.4s "Listening for the pattern…" transition with cinematic starburst and pulse animations.
- **Reveal**: Refined hierarchy with "Surface Pattern" vs "Deeper Resonance" framing.
- **Conversion Bridge**: Added supportive microcopy about celestial context and symbolic connections.
- **Tactile Feedback**: Haptic-style pulse on all ritual buttons.

## 2. Files Changed
| File | Change |
| :--- | :--- |
| `src/components/oracle/FramerTarotOracle.tsx` | Implemented new state machine, updated layout logic, and added conversion bridge. |
| `src/components/oracle/OracleLoadingState.tsx` | Updated to cinematic "Calibrating the stars…" messaging. |
| `src/components/HeroV3.tsx` | Refined typography and added value-based trust line. |
| `src/components/MagneticButton.tsx` | Added tactile click pulse effect. |
| `src/components/Pricing.tsx` | Added alchemical section headers for feature lists. |

## 3. State Model Changes
- Added `focusing` state: Gathers user intent before fanning the deck.
- Added `preparing` state: A cinematic pause for reflection after drawing 3 cards.

## 4. Motion & Visual Changes
- **Aura Glow**: Selected cards now have a soft, pulsing golden aura (CSS-based, performance-safe).
- **Cinematic Loader**: Multi-layered pulse and spin animation during transition.
- **Zero re-render hover**: Maintained the GPU-only hover pattern throughout the refactor.

## 5. P5 Ideas Intentionally Rejected
- **Chaotic Card Flight**: Rejected in favor of a calm, staggered settle to maintain a premium atmosphere.
- **Fake Metrics**: Entirely excluded to preserve brand integrity.
- **Valtio/State Library**: Rejected; the refactor was achieved using simple local React state + MotionValues.

## 6. Performance Guardrails Preserved
- **CPU/GPU**: Inactive cards still skip their canvas loops (`disableCanvas`).
- **Main Thread**: Hover interactions still cost 0 React renders.
- **Assets**: 100% optimized WebP paths maintained.

## 7. Verification Results
- **Lint**: 0 errors.
- **Typecheck**: Passed.
- **Build**: Success (64 static routes).
- **Smoke Test**: Verified ritual timing and CTA appearance on desktop and mobile viewports.

## 8. Remaining Risks
- **Ritual Length**: Some users may find the 2.4s pause too long. Monitor conversion rates; the duration can be easily tuned in `FramerTarotOracle.tsx`.
- **Safari Clipping**: Complex 3D transforms (`preserve-3d`) are stable but require monitoring on older iOS devices.
