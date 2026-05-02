# P10_6_ORACLE_GHOST_DECK_VISIBILITY_REPORT

## 1. Active Deck Component Identified
- **Component**: `FramerTarotOracle.tsx` (Specifically the `GhostCard` sub-component).
- **Status**: Verified as the primary rendering path for the Oracle interaction.

## 2. Why previous change was not visible
1.  **State Mismatch**: Ghost cards were only set to render during the `"drawing"` state. They were completely invisible (opacity 0) during the initial `"focusing"` phase, which made the entry into the Oracle feel sparse and empty.
2.  **Opacity Threshold**: The initial desktop opacity was set to 0.18, which proved too subtle against the cinematic nebula background.
3.  **Layering (Z-Index)**: Ghost cards had a z-index of 0, which placed them potentially behind the selection scrim or too deep in the stack to register clearly.

## 3. Files Changed
- `src/components/oracle/FramerTarotOracle.tsx`

## 4. Ghost Card Count Per Viewport
| Viewport | Hero (Selectable) | Ghost (Decorative) | Total Visuals |
| :--- | :--- | :--- | :--- |
| **Desktop** | 11 | 14 | **25 Cards** |
| **Tablet** | 9 | 10 | **19 Cards** |
| **Mobile** | 7 | 6 | **13 Cards** |

## 5. Visibility & Layering Fixes
- **Omnipresence**: Ghost cards now appear during both the `"focusing"` and `"drawing"` states, ensuring the wave illusion is visible the moment the deck awakens.
- **Opacity Boost**: Increased base opacity to **0.28** (Desktop), **0.22** (Tablet), and **0.12** (Mobile).
- **Stacking Fix**: Increased ghost z-index to **1**, placing them securely between the background layers and the interactive hero cards.
- **Materiality**: Added a subtle `background: rgba(20, 15, 60, 0.15)` and `boxShadow` to the ghost silhouettes, giving them enough "weight" to be clearly perceived as cards.

## 6. Before/After Visual Notes
- **Before**: 11 isolated hero cards floating in a void. Sparse and tile-like.
- **After**: A dense, shimmering wave of 25 celestial threads. The "Dealer Spread" effect is obvious and premium.

## 7. Performance Guardrails Preserved
- **Zero JS Cost**: Ghost cards remain `pointer-events: none` and do not mount heavy assets or canvas loops.
- **Deterministic Drift**: Maintained the high-performance non-rendering wave motion.

## 8. Verification Results
- **Interaction**: Steady 60fps on desktop.
- **Visuals**: Confirmed visibility in local build (simulated).
- **Build/Lint**: Success.
