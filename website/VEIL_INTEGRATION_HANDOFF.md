# Veil Reveal Website Integration — Handoff

## The Problem

The veil-reveal prototype at `olivia-tarot-proto/public/veil-reveal.html` looks perfect as a standalone page (Three.js 0.160 CDN). But when integrated into the Next.js website (`olivia-arcana/website/`, Three.js 0.183 npm), it breaks:

1. **MeshPhysicalMaterial blows out** — Three.js 0.183 renders PBR materials brighter than 0.160. The clearcoat + iridescence + RoomEnvironment creates a white hotspot at the top of the cloth.
2. **Standalone HTML page doesn't match the site** — no navbar, different Starfield, different fonts, feels disconnected.
3. **Iframe approach is hacky** — pixelation, no design system integration.

## What Works (proven in this session)

- **MeshStandardMaterial** (NOT MeshPhysicalMaterial) with Three.js 0.183 looked good: dark cosmic nebula bg, proper cloth folds, no blowout. Screenshot confirmed at the `0x04020d` background + tamed bloom settings.
- The extracted TypeScript modules compile and mount correctly:
  - `src/components/veil-reveal/PBDCloth.ts` (223 lines)
  - `src/components/veil-reveal/VeilAudio.ts` (132 lines)  
  - `src/components/veil-reveal/VeilRevealScene.ts` (900+ lines)
  - `src/components/veil-reveal/VeilRevealWrapper.tsx`
  - `src/components/veil-reveal/CardInfoPanel.tsx`

## What the Next Session Should Do

### 1. Use MeshStandardMaterial (NOT MeshPhysicalMaterial)

The version that looked good had these settings:
```js
new THREE.MeshStandardMaterial({
  color: 0xaaaacc,
  map: veilTexture,
  emissive: 0x5544aa,
  emissiveMap: veilTexture,
  emissiveIntensity: 0,  // 0→0.10 during intro fade
  roughness: 0.6,
  metalness: 0.15,
  envMapIntensity: 0.15,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0,  // 0→0.92 during intro fade
  depthWrite: false,
})
```

### 2. Include the nebula background plane

The dark nebula background (fbm noise shader at z=-8) is REQUIRED. Without it, the scene has nothing dark behind the glass and it blows out. The shader is already in VeilRevealScene.ts as BG_VERTEX/BG_FRAGMENT.

### 3. Skip the RoomEnvironment entirely

Don't create a PMREMGenerator or RoomEnvironment. The directional lights + emissive are enough. RoomEnvironment's overhead light causes the hotspot.

### 4. Tame the bloom

```js
new UnrealBloomPass(
  new THREE.Vector2(w * dpr, h * dpr),  // device pixels, not CSS pixels!
  0.35,  // strength (not 0.55)
  0.6,   // radius
  0.85,  // threshold (higher = only peaks bloom)
)
```

### 5. Set scene.background to match the site

```js
scene.background = new THREE.Color(0x04020d)  // matches --c-void
```

### 6. The page must render within the site's layout

The card-of-the-day page should use the normal Next.js layout (navbar, Starfield behind, etc). The VeilRevealWrapper takes the full viewport height but sits within the layout:

```tsx
<div className="relative" style={{ height: "100dvh", zIndex: 1 }}>
  <VeilRevealWrapper ... />
</div>
```

The VeilRevealScene renderer uses `alpha: false` (opaque) because it has its own nebula background. The site's Starfield is hidden behind it via z-index.

## Key File Locations

| File | Purpose |
|------|---------|
| `src/components/veil-reveal/VeilRevealScene.ts` | Main Three.js module — NEEDS material fixes per above |
| `src/components/veil-reveal/PBDCloth.ts` | Cloth physics — DONE, works |
| `src/components/veil-reveal/VeilAudio.ts` | Audio — DONE, works |
| `src/components/veil-reveal/VeilRevealWrapper.tsx` | React wrapper — DONE, works |
| `src/components/veil-reveal/CardInfoPanel.tsx` | Interpretation panel — DONE, works |
| `src/lib/academy/card-images.ts` | Card → PNG path mapping — DONE |
| `public/cards/*.png` | 78 processed card textures (1024x1536) — DONE |
| `public/textures/veil.jpg` | Veil texture — DONE |
| `olivia-tarot-proto/public/veil-reveal.html` | REFERENCE: the proven prototype that looks perfect |

## The Proven Prototype (for visual reference)

Run `cd ~/olivia-tarot-proto && npm run dev` → `http://localhost:5179/veil-reveal.html`

This uses Three.js 0.160 + MeshPhysicalMaterial with transmission:0.60. It looks perfect. The goal is to match this visual quality using Three.js 0.183 + MeshStandardMaterial within the Next.js site.

## What NOT to Do

- Don't use MeshPhysicalMaterial — it blows out in 0.183
- Don't use an iframe — pixelated, no design integration
- Don't serve veil-reveal.html standalone — no navbar, wrong bg, wrong fonts
- Don't use RoomEnvironment — overhead hotspot
- Don't set bloom resolution in CSS pixels — must use device pixels (multiply by dpr)
