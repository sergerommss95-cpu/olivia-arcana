# Olivia Arcana: Design System (God Mode)

## 1. Visual Theme: "Celestial Obsidian"
Olivia Arcana is a cinematic experience that bridges ancient astrology with high-end modern technology. The theme is **"Controlled Drama"** (Apple-inspired) combined with **"Financial-Grade Precision"** (Stripe-inspired).

### Atmosphere
- Vast expansive void (`#08061a`).
- Product as sculpture: Elements are treated as physical, illuminated objects in space.
- Reduction over decoration: Every element must serve a purpose.

## 2. Color Palette & Roles

### Backgrounds
- **Primary Void** (`#08061a`): The base canvas for the entire site.
- **Translucent Glass** (`rgba(8, 6, 26, 0.8)`): For sticky elements with `backdrop-filter: blur(24px)`.

### Typography Colors
- **Warm Ivory** (`#f5f2e1`): Primary reading text. 
- **Celestial Gold** (`#d4af37`): Accents, interactive highlights, and badging.
- **Muted Lavender** (`#9b91be`): Secondary/tertiary text, metadata.

### Surface Elevation
- **Card Base**: `rgba(255, 255, 255, 0.03)` with `1px solid rgba(255, 255, 255, 0.08)`.
- **Shadow**: `rgba(0, 0, 0, 0.5) 0px 20px 50px -10px`.

## 3. Typography Rules

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero Display | Heading | 72px-120px| 300-400 | 0.95 | -0.02em |
| Page Title | Heading | 56px-72px | 300 | 1.1 | -0.01em |
| Section Head | Heading | 32px-40px | 400 | 1.2 | 0 |
| Body Lead | Body | 21px | 300 | 1.5 | 0 |
| Body Standard | Body | 17px | 300 | 1.6 | 0.01em |
| Mono Label | Mono | 12px | 500 | 1.0 | 0.4em (uppercase)|

## 4. Layout & Spacing
- **Base Unit**: 8px.
- **Section Spacing**: 160px-240px (Cinematic breathing room).
- **Component Radius**: 12px-24px (Soft but intentional).

## 5. UI/UX Flaws to Fix (Phase 3 Audit)
1. **Low Contrast**: Text over nebula backgrounds often fails WCAG. **Fix**: Use "Editorial Scrims" (gradients) behind all text blocks.
2. **Visual Noise**: Too many moving rings/particles distract from content. **Fix**: Consolidate into single "Monolithic" interactions.
3. **Disjointed Journey**: Navigation feels separate from the immersive pages. **Fix**: Use seamless "Glass" navigation that integrates with the void.
4. **Mechanical Interaction**: Hover states are "on/off". **Fix**: Use "Haptic" physics (React Spring) for all interactive surfaces.
