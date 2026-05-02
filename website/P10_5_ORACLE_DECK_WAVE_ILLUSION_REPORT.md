# P10_5_ORACLE_DECK_WAVE_ILLUSION_REPORT

## 1. Why previous version felt too simple
The previous performance optimization pass reduced the card count so effectively (to 7-11 cards) that the deck lost its "magical abundance." It felt like a few floating tiles rather than a professional dealer spread or a "living wave."

## 2. Card Count Before/After
| Layer | Viewport | Before | After | Total Visuals |
| :--- | :--- | :--- | :--- | :--- |
| **Hero (Interactive)** | Desktop | 13 | **11** | - |
| **Ghost (Decorative)** | Desktop | 0 | **14** | **25 Cards** |
| **Hero (Interactive)** | Tablet | 11 | **9** | - |
| **Ghost (Decorative)** | Tablet | 0 | **10** | **19 Cards** |
| **Hero (Interactive)** | Mobile | 7 | **7** | - |
| **Ghost (Decorative)** | Mobile | 0 | **6** | **13 Cards** |

## 3. Wave Motion Strategy
- **Shared Organism**: The entire deck (Hero + Ghost) now shares a parent-level `breathing` MotionValue (subtle Y-axis pulse).
- **Chaos Drifting**: Each card (Ghost and Hero) has a unique, deterministic `driftPhase` that adds non-uniform lateral and vertical jitter, making the wave feel organic.
- **Focus Mode**: When the user enters the "Drawing" phase, a background scrim dims the cinematic nebula, and ghost cards elegantly recede, making the 11 interactive cards pop forward.

## 4. Geometry Changes
- **Radius**: Increased to **1400** (Desktop) and **850** (Mobile) to create a more majestic, wide fan.
- **Ghost Span**: The ghost layer uses a wider arc span (**0.65PI**) than the hero layer, creating the illusion that the deck continues into the periphery.
- **Z-Index**: Maintained center-weighted depth stacking so the middle of the wave always sits on top.

## 5. Performance Guardrails Preserved
- **Non-Interactive Layer**: Ghost cards have `pointer-events: none` and `aria-hidden: true`, costing almost zero in the hit-testing phase.
- **Static Silhouettes**: Ghost cards do not mount `<canvas>`, `<Image>`, or `<m.div>` internal animations. They are simple CSS-bordered divs with 0.18 opacity.
- **Progressive Selection**: Only the 3 selected hero cards pay the price for 3D spring physics and image decoding.

## 6. Mobile Behavior
- Reduced ghost count to 6 to prevent over-filling the narrow viewport.
- Disabled `preserve-3d` on the ghost layer for Safari stability.
- Maintained immediate tap response on the 7 hero cards.

## 7. Verification Results
- **Interaction**: Steady 60fps on high-end desktop.
- **Visuals**: The deck now looks like a rich, abundant wave of celestial threads.
- **Build/Lint**: Success.
