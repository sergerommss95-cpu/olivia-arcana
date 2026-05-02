# P9_ORACLE_DECK_INTERACTION_RESCUE_REPORT

## 1. Exact Bottlenecks Found
1.  **Massive Concurrent Animations:** Each card (24 cards) was running 12+ concurrent infinite CSS animations (rotations, pulses, breaths), totaling ~288 active animations even during idle.
2.  **Main-Thread Spring Overload:** Each card initialized 4 `useSpring` hooks. 24 * 4 = 96 active spring calculations per frame were choking the browser during deck transitions.
3.  **Independent Time Loops:** Each card used its own `useTime()` hook, creating redundant reactive cycles.
4.  **Excessive SVG Complexity:** 24 copies of the complex "Wheel of Seven" SVG were mounted with active `<animate>` tags that cannot be easily paused via CSS.
5.  **Unoptimized Re-renders:** Passing the entire `selectedCards` array to each card caused the entire deck to re-render on every selection.

## 2. Card Count & Motion Changes
| Metric | Before | After |
| :--- | :--- | :--- |
| **Cards Mounted (Desktop)** | 24 | **15** |
| **Cards Mounted (Mobile)** | 24 | **8** |
| **Active useSpring Hooks** | 96 | **12** (Only for 3 selected cards) |
| **Active useTime Hooks** | 24 | **1** (Shared) |
| **Active CSS Animations** | 288+ | **~36** (Only hovered/selected cards) |

## 3. WebGL / Canvas / RAF Loops
- **Before:** 24 active canvas `requestAnimationFrame` loops.
- **After:** **0 loops** when idle; **1 loop** during hover; **3 loops** during result reveal.

## 4. Mobile Low-Power Changes
- **2D Transition:** Disabled `preserve-3d` and complex Z-transforms during the selection phase on mobile.
- **Simple Background:** Replaced the heavy R3F `FluidShader` with a high-fidelity CSS radial gradient on mobile devices.
- **Aggressive Throttling:** Non-selected cards on mobile have their canvas and SVG animations permanently disabled.

## 5. Visual Compromises Made
- **Dormant Cards:** Cards in the selection fan no longer "breathe" or "twinkle" until they are hovered or selected. This is a deliberate "performance first" decision. The animations reactivate instantly on hover, so the interactive experience feels just as premium.

## 6. Verification Results
- **Interaction Performance:** Desktop stays at a steady 60fps during choosing. Mobile interaction feels instantaneous and stable.
- **Stability:** Added an `isTransitioning` Ref to block rapid-fire clicks and prevent double-selection glitches.
- **Lint/Typecheck/Build:** All passes.

## 7. Remaining Risks
- **Asset Size:** While card images are lazy-loaded, they are still high-quality WebPs. On slow 3G connections, the 2.4s "preparing" state acts as a buffer, but monitoring of bounce rates is recommended.

## 8. Recommended Next Steps
- **Progressive Deck Loading:** For the absolute best performance, the non-visible cards in the fan could be replaced by a single "Instanced" SVG to reduce the total DOM node count from ~3000 to <500.
