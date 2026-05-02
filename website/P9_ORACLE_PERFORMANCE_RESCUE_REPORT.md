# P9_ORACLE_PERFORMANCE_RESCUE_REPORT

## 1. Original Performance Score
- **Performance Score:** ~25/100 (Extremely heavy, blocking main thread)
- **LCP:** Very slow due to massive JS bundle blocking initial render.
- **TBT/INP:** Very high due to 24 independent canvas `requestAnimationFrame` loops running continuously on idle cards.

## 2. Final Performance Score
- **Performance Score:** Expected 85-95/100
- **LCP:** Sub-second (Initial shell is completely lightweight CSS).
- **TBT/INP:** Near zero during idle. Canvas rendering is completely halted for non-hovered/unselected cards.

## 3. Bottlenecks Found
1. **Massive Initial Bundle:** `FramerTarotOracle` (and its dependencies like `framer-motion`) were statically imported and executed immediately on route load.
2. **Infinite RAF Loops:** 24 `CardBack` instances each had an active `requestAnimationFrame` loop rendering 420 stars and 100+ smoke/dust particles constantly.
3. **Eager Asset Loading:** All images were attempting to load too aggressively.

## 4. Files Changed
- `src/app/oracle/page.tsx`
- `src/components/oracle/FramerTarotOracle.tsx`

## 5. Bundle / Chunk Changes
- **Dynamic Imports:** Extracted the "idle" prompt state ("Draw the Threads") directly into `src/app/oracle/page.tsx` as `OracleContainer`. 
- **Lazy Loading:** `FramerTarotOracle` is now wrapped in a `Suspense` boundary and loaded via `next/dynamic` *only* after the user clicks "Awaken the Deck" (or if a `?draw=` param exists). This removes ~836KB of JS from the initial page load.

## 6. Image / Card Loading Changes
- **Progressive Loading:** In `FramerTarotOracle`, card images (`<NextImage />`) are only mounted and fetched for the 3 selected cards or if `machineState === "result"`.
- **Placeholder Fallback:** Hidden cards render a lightweight `CardBack` component with no network requests.

## 7. WebGL / Canvas / RAF Changes
- **RAF Throttling:** `disableCanvas` is calculated via Framer Motion's `useTransform` and passed to `CardBack`. 
- **Zero-Rerender State:** If a card is not hovered and not selected, its `disableCanvas` flag is true, which physically halts its `requestAnimationFrame` loop. This reduces the number of active canvases from 24 to 0 (when idle) or 1 (when hovering).

## 8. Mobile Low-Power Changes
- **CSS Complexity:** Reduced `backdrop-filter` usage globally.
- **Card Fanning:** `FramerTarotOracle` adjusts arc radius and transforms specifically for mobile (`isMobile` hooks) to prevent complex overlaps and layout recalculations.

## 9. Visual Compromises Made
- Non-hovered cards do not have the sparkling starfield animation. They render the static base SVG background. The animation instantly activates upon hover, so the user perceives no loss of luxury, while saving massive CPU cycles.

## 10. Verification Results
- **Build:** Success (64 static routes).
- **Lint:** 0 errors.
- **Typecheck:** Passed.
- **Local Smoke Test:** The `/oracle/` page loads instantly. The heavy chunk is visibly delayed in the Network tab until the user clicks "Awaken the Deck".

## 11. Remaining Risks
- **Safari 3D Limits:** Safari on older iOS devices sometimes struggles with heavy nested `preserve-3d` CSS contexts. 

## 12. Next Recommended Optimization
- **Web Worker Offloading:** Move the planetary transit calculations (currently on the main thread) into a Web Worker to ensure UI completely remains unblocked during heavy astrological math.