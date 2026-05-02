# P10_6_ORACLE_GHOST_DECK_VISIBILITY_REPORT

## 1. Active Deck Component Identified
- **Component**: `FramerTarotOracle.tsx` (Specifically the `GhostCard` sub-component).
- **Status**: Verified as the primary rendering path.

## 2. Why previous change was not visible
1.  **State Logic**: Ghost cards were restricted only to the `"drawing"` state, making the entry phase (`"focusing"`) feel empty.
2.  **Subtle Opacity**: An opacity of 0.18 with a thin, semi-transparent border was effectively invisible against the dark cinematic background.
3.  **Z-Index/3D Layering**: Cards were at `zIndex: 0` and `translateZ(0)`, which caused them to be obscured by background layers or "z-fight" with the slightly recessed hero cards.

## 3. Files Changed
- `src/components/oracle/FramerTarotOracle.tsx`

## 4. Ghost Card Count Per Viewport
| Viewport | Hero (Selectable) | Ghost (Decorative) | Total Visuals |
| :--- | :--- | :--- | :--- |
| **Desktop** | 11 | 14 | **25 Cards** |
| **Tablet** | 9 | 10 | **19 Cards** |
| **Mobile** | 7 | 6 | **13 Cards** |

## 5. Visibility & Layering Fixes (Final)
- **High Contrast**: Boosted desktop opacity to **0.55** and border opacity to **0.8** (Gold).
- **Material Weight**: Switched from a transparent silhouette to a solid `rgba(10, 8, 30, 0.75)` background with a pronounced `0.8` shadow.
- **3D Stacking**: Applied `z: -100` to the ghost layer to physically lock them behind the hero cards in the 3D perspective stack.
- **Majestic Spread**: Increased horizontal span to **0.75PI** (Desktop) to ensure ghost cards fill the peripheral vision.

## 6. Before/After Visual Notes
- **Before**: Sparse, isolated cards floating in a void.
- **After**: A dense, shimmering celestial wave that feels like a professional dealer's spread. The "infinite deck" illusion is now undeniable.

## 7. Performance Guardrails Preserved
- **Non-Interactive**: Ghost cards remain `pointer-events: none` silhouettes.
- **Deterministic Motion**: Maintained shared `breathing` and `drift` logic for a "Living Deck" feel with 0 React re-renders.

## 8. Verification Results
- **Visuals**: Confirmed strong presence and correct depth-stacking in local simulation.
- **Build/Lint**: Success.
