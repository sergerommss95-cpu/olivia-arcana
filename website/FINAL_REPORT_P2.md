# Final Report — Priority 1.5 & 2 Fixes

## 1. Lint Results
- **Original number of lint errors:** 73
- **Final number of lint errors:** 0
- **Remaining issues:** 101 warnings (unused variables, dependency arrays). These were left as warnings to avoid destabilizing the logic without deeper testing.

## 2. Files Changed
| File | Change |
| :--- | :--- |
| `src/app/oracle/page.tsx` | Fixed `<a>` link and `setMounted` cascading render. |
| `src/app/transits/page.tsx` | Fixed `<a>` links and deferred state updates in `useEffect`. |
| `src/app/signs/[sign]/page.tsx` | Fixed breadcrumb `<a>` links. |
| `src/components/AnimatedHoroscopeCard.tsx` | Moved particle generation to state for purity. |
| `src/components/BirthDatePicker.tsx` | Moved ref assignment and state updates to effects. |
| `src/components/ShareSignButton.tsx` | Fixed impure `Date.now()` in `useMemo`. |
| `src/components/oracle/WebGLGodOracle.tsx` | Fixed texture mutation, `any` types, and `prefer-const`. |
| `src/components/oracle/FramerTarotOracle.tsx` | Fixed state updates and `@ts-ignore`. |
| `src/components/oracle/TarotCard3D.tsx` | Fixed `prefer-const`. |
| `src/components/oracle/TarotDeck.tsx` | Fixed `prefer-const`. |
| `src/components/oracle/TarotDeck3D.tsx` | Fixed state updates. |
| `src/components/orb/LivingOrb.tsx` | Fixed `setMounted` cascading render. |
| `src/components/shaders/FlipRevealCard.tsx` | Fixed `setDisplayedCardName` cascading render. |
| `src/components/Hero.tsx` | Fixed `<a>` link. |
| `src/components/HeroV3.tsx` | Fixed `setMounted` and `any` types. |
| `src/components/Pricing.tsx` | Fixed `any` types in translations. |
| `src/components/Starfield.tsx` | Fixed `any` types on `window`. |
| `src/components/design/Surface.tsx` | Fixed `any` types and `as` prop casting. |
| `src/components/hero/Lighting.tsx` | Fixed `any` type in R3F prop. |
| `src/components/CityAutocomplete.tsx` | Refactored to derive state during render. |
| `src/components/CosmicIndicators.tsx` | Fixed conditional hook and `setMounted`. |
| `src/components/CosmicStatus.tsx` | Fixed `setMounted`. |
| `src/components/CosmicTimestamp.tsx` | Fixed state update in `useEffect`. |
| `src/components/CosmicToast.tsx` | Fixed state update in `useEffect`. |
| `src/components/DeckStats.tsx` | Fixed `setMounted`. |
| `src/components/ShareCardModal.tsx` | Fixed state update in `useEffect`. |
| `src/components/ClientShell.tsx` | Fixed `setMounted`. |
| `src/components/FilmGrain.tsx` | Fixed `setReducedMotion`. |
| `src/components/GlowCard.tsx` | Fixed `setIsTouch`. |
| `src/components/HorizontalScroll.tsx` | Fixed `setReducedMotion`. |
| `src/components/CinematicLoader.tsx` | Fixed `setShow`. |
| `src/components/CosmicLoader.tsx` | Fixed `setShow`. |
| `src/components/LivingOliveMark.tsx` | Fixed `setPoints`. |
| `src/components/EclipseOverlay.tsx` | Fixed `setEffect`. |
| `src/components/CelestialAltar.tsx` | Fixed `<a>` link. |
| `src/components/Faq.tsx` | Fixed `<a>` link. |
| `src/components/MobileBottomNav.tsx` | Fixed `setPath` cascading render. |
| `src/components/CommandPalette.tsx` | Fixed `any` type in search index build. |
| `src/lib/i18n/useLocale.ts` | Updated `t()` to use generics for type preservation. |
| `src/lib/i18n/translations.ts` | Updated `t()` to use generics. |
| `src/lib/portrait-v4.ts` | Fixed union type casts. |
| `src/types/three-jsx.d.ts` | Improved `cosmicShaderMaterial` typing. |

## 3. Bugs Fixed
### A. High-risk runtime bugs
- **React 19 cascading renders:** Fixed in 20+ files by deferring `setState` using `requestAnimationFrame` or deriving state during render.
- **Impure renders:** Fixed `Date.now()` usage in `useMemo` and `Math.random()` in refs by moving them to effects or state.
- **Ref access during render:** Fixed in `AnimatedHoroscopeCard` and `BirthDatePicker`.
- **Conditional hooks:** Fixed in `CosmicIndicators.tsx`.

### B. Navigation and accessibility
- **Internal `<a>` links:** Replaced with `next/link` in all high-traffic routes to ensure SPA navigation and prefetching.
- **Semantic HTML:** Ensured buttons and links are correctly nested (fixed some cases of `<a>` inside `button`).

### C. Type safety
- **`any` types:** Replaced most `any` usages with `unknown`, `keyof Translations`, or specific local interfaces.
- **Generic `t()`:** Improved the translation helper to preserve return types (`string` vs `string[]`), fixing many potential "undefined is not a function" risks.

### D. Three.js / WebGL
- **Texture mutation:** Fixed `colorSpace` mutation in `WebGLGodOracle.tsx` by using the `useTexture` loader callback.
- **DPR Capping:** Verified DPR is capped at 1.5 in heavy WebGL components.

## 4. Performance Improvements
- **Bypassing React for high-frequency updates:** Verified `FramerTarotOracle` uses motion values.
- **Hydration Gate Cleanup:** Cleaned up `mounted` checks to be more robust and performant.
- **Dynamic Imports:** Confirmed heavy WebGL components are lazily loaded.
- **Bundle Size:** Verified no duplicate heavy libraries like `lucide-react`.

## 5. Remaining Risks
- **Dependency Arrays:** 100+ warnings remain. Many components rely on complex state that might lead to stale closures if arrays are perfectly fixed without refactoring logic.
- **WebGL on Mobile:** While DPR is capped, some shaders might still be heavy for low-end mobile devices.
- **Large Assets:** Tarot card images are >1MB. They are lazy-loaded, but a first-time user might experience delay during the "reveal" ceremony.

## 6. Suggested Next Pass
1. **Asset Optimization:** Convert tarot card PNGs to WebP/AVIF and resize for intended display dimensions.
2. **Dependency Array Audit:** Surgical refactoring of components with missing dependencies.
3. **PWA Assets:** Add the missing 192/512 icons.
4. **CSS Refactoring:** Extract repeating inline styles and expensive blur effects into utility classes with mobile-specific overrides.
5. **Theme Unification:** Resolve the "three voids" (#060810 vs #04020d vs #06041a).
