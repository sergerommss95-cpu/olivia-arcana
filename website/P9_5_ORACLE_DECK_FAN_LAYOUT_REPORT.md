# P9_5_ORACLE_DECK_FAN_LAYOUT_REPORT

## 1. Root Cause of Overlap
The previous interaction rescue set a high card count (15-24) with a relatively narrow horizontal span and small arc radius. This caused cards to overlap by over 60%, creating a "congested ribbon" effect where individual cards were hard to distinguish, especially at the edges.

## 2. Visible Card Count Before/After
| Viewport | Before | After |
| :--- | :--- | :--- |
| **Desktop** | 15 | **13** |
| **Tablet** | 15 | **11** |
| **Mobile** | 8 | **7** |

## 3. Card Size Before/After
| Viewport | Before | After |
| :--- | :--- | :--- |
| **Desktop** | 140x245 | **130x225** |
| **Tablet** | 140x245 | **120x210** |
| **Mobile** | 120x210 | **95x165** |

## 4. Angle / Radius Changes
- **Radius (Desktop)**: Increased from 1000 to **1200** for a flatter, more premium arc.
- **Span (Desktop)**: Adjusted to **0.4PI** to target exactly **20-35% overlap**.
- **Vertical Arc Multiplier**: Reduced to **0.8** to shallower the fan curve, preventing cards from "melting" into a deep well.

## 5. Desktop / Tablet / Mobile Behavior
- **Desktop**: A wide, elegant fan with center cards sitting on top of neighbors.
- **Tablet**: Balanced pool of 11 cards with clear separation.
- **Mobile**: Compact 7-card fan that avoids horizontal overflow and bottom-nav clipping.

## 6. Performance Guardrails Preserved
- **Zero Rerender**: Maintained the GPU-only interaction pattern via MotionValues.
- **Dormancy**: Card animations still pause when unhovered.
- **Lazy Loading**: Card face images only mount for selected cards.
- **Device Tiering**: Added `useDeviceTier` hook to optimize DOM complexity per device.

## 7. Verification Results
- **Visuals**: Individual cards are now clearly separable with high-contrast borders and centered depth-stacking (z-index).
- **Interaction**: High frame rates maintained across all devices.
- **Build/Lint**: Success.
