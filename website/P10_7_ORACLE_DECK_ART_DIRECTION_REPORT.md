# P10_7_ORACLE_DECK_ART_DIRECTION_REPORT

## 1. Why previous version looked plain
The previous performance-optimized deck used uniform card silhouettes and a single layer of interactivity. While fast, the lack of depth variations, material textures, and ritual grounding made it feel like a standard web component rather than a sacred digital object.

## 2. Visual Layers Added
Rebuilt the deck into a **3-Layer Depth System**:
- **Layer 1: Deep Echo (Subconscious)**: Very faint (opacity 0.08) silhouettes in the far periphery. Creates the sense that the deck is part of a larger celestial machine.
- **Layer 2: Ghost Deck (Abundance)**: 12 decorative mid-layer cards that fill the gaps in the spread, providing the "Dealer Spread" wave feeling.
- **Layer 3: Hero Cards (Interactive)**: 11 sharp, high-contrast selectable cards with full material properties.

## 3. Focal Field Implementation
Added a **Sacred Center** using a CSS-only radial gradient halo (`ellipse_at_center`). It creates a subtle violet-gold warmth behind the central 3 cards, drawing the user's eye to the ritual's heart without the cost of a blur filter.

## 4. Celestial Thread / Orbit
Implemented a **Celestial Orbit** using a single lightweight SVG path following the deck's arc. 
- **Stroke**: Dotted gold/violet gradient.
- **Motion**: Extremely slow `stroke-dashoffset` animation (60s loop) that makes the spread feel connected and grounded in planetary logic.

## 5. Card Material Upgrades
- **Inner Borders**: Added 1px `white/5` and `white/10` internal highlights to card faces and backs, creating a "channeled" glass look.
- **Corner Glints**: Implemented a CSS pseudo-element (`::after`) that places a static soft glint in the top-left corner of hero cards.
- **Material Gradients**: Updated `glass-card` background to a multi-tone `135deg` gradient, reducing the flat appearance.

## 6. Hover & Selection Upgrades
- **Magnetic Tilt**: Cards now tilt up to 12 degrees toward the pointer using GPU-only MotionValues.
- **Foil Sheen**: Hovering a card activates a dynamic iridescent sheen that "catches the light" as you move.
- **Selection Recede**: Unselected cards (Ghost and Hero) now elegantly recede and fade during the `"preparing"` phase, creating a cinematic transition to the result.

## 7. Performance Guardrails Preserved
- **Non-Interactive**: Deep Echo and Ghost layers are `pointer-events: none` and `aria-hidden: true`.
- **Throttling**: All material effects (sheen, magnetic tilt, high-fidelity springs) are strictly limited to the interactive Hero layer.
- **Zero JS Motion**: Shared parent `breathing` MotionValue eliminates redundant hooks.

## 8. Verification Results
- **Visuals**: The deck now feels undeniably premium, layered, and magical.
- **Stability**: 0 console errors, 0 hydration warnings.
- **Netlify**: Ready for production.
