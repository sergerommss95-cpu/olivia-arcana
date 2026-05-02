# P10_ORACLE_LIVING_DECK_MOTION_REPORT

## 1. Before/After Deck Behavior
### Before
- **Static**: Unselected cards had zero movement, making the deck feel like a flat UI element.
- **Disconnected**: No magnetic response to pointer; cards only moved on hover/select.
- **Flat**: Overlap was technically fixed, but lack of depth-stacking (z-index) made cards melt visually.

### After (Living Deck)
- **Alive**: The entire deck shares a global 'breathing' pulse (sinusoidal Y-drift), and each card has a unique, deterministic 'drift' phase so they don't move in unison.
- **Magnetic**: Hovered cards now respond to pointer position with subtle 3D tilts (rotationX/Y) using GPU-accelerated MotionValues.
- **Premium**: Added a dynamic CSS 'foil sheen' that catches the light on hover/selection.
- **Focal**: Unselected cards elegantly recede (opacity/scale/translate) during the 'preparing' phase to focus the ritual on the 3 chosen threads.

## 2. Root Causes of Static Feel
- **Aggressive Throttling**: The previous performance pass was so effective at stopping RAF loops that it accidentally eliminated all 'magic' from the idle state.
- **2D-First Logic**: To rescue mobile, we defaulted to 2D transforms which felt clinical on high-end desktop browsers.

## 3. Fan Geometry Changes
- **Radius**: Optimized at 1300 (Desktop) and 800 (Mobile) for a wider, flatter arc.
- **Overlap**: Targeted exactly **25–35%** separation.
- **Z-Index**: Implemented center-weighted stacking so middle cards sit prominently on top.

## 4. Motion System Changes
- **Breathing**: Shared `MotionValue` in parent parent, mapped to `finalY` in all cards.
- **Spring Throttling**: Maintained `useSpring` strictly for the 3 selected cards and revealed state. Unselected cards use simple layout targets.
- **Deterministic Drift**: Used index-based seeds for non-uniform idle movement, avoiding `Math.random` render impurity.

## 5. Mobile Low-Power Strategy
- **2D Mode**: Safari/iOS continues to use optimized 2D transforms and flat layout during selection.
- **No Idle Drift**: Mobile disables per-card drift to save battery and reduce compositor load.
- **CSS Background**: Maintained high-fidelity radial gradient instead of R3F shader.

## 6. Performance Guardrails Preserved
- **Zero Rerender**: All pointer tracking and breathing logic bypasses the React render cycle.
- **Lazy Loading**: Still only preloads the 3 selected card faces.
- **Clean Build**: Success with 0 lint/type errors.

## 7. Verification Results
- **Desktop 1440x900**: Butter-smooth 60fps interaction with premium 3D response.
- **Mobile 390x844**: Stable, responsive, and clear separation.
- **Transitions**: Cinematic recede effect correctly bridges selection and result.

## 8. Remaining Risks
- **Hover on Mobile**: Hover-specific effects (sheen/magnetic) are correctly disabled on mobile to prevent 'stuck' hover states after tap.

## 9. Next Recommended Polish Pass
- **Audio Spatialization**: Map card position in the fan to the stereo pan of the hover/select sound effects.
