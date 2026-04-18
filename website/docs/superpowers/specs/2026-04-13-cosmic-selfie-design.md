# Cosmic Selfie — Design Spec

**Date:** 2026-04-13  
**Status:** Approved  
**Location:** Homepage section between Testimonials and Pricing (replaces current OraclePreview)

---

## Summary

A homepage section where the user's live webcam feed becomes the reveal layer in the existing liquid mask WebGL effect. A cosmic nebula orb sits in the center of the page. When the user clicks "Reveal Yourself" and grants camera access, their own face appears beneath the swirling cosmos — revealed by cursor movement. The physical act of uncovering your own face from a cosmic void is the wow moment.

Tagline: *"The stars already know your face."*

---

## User Flow

1. User scrolls to the section. Sees a cosmic nebula orb (static/subtly animated), headline above it, and a glass "Reveal Yourself" button below.
2. User clicks "Reveal Yourself." Button shows loading spinner, text changes to "Summoning..."
3. Browser camera permission prompt appears.
4. **If granted:** Webcam feed becomes the reveal texture in the liquid mask engine. User moves cursor/finger to dissolve the cosmos and see their own face. Copy shifts, gold CTA appears.
5. **If denied:** Falls back to a pre-shot portrait image as the reveal layer. Same UX otherwise.
6. **If unsupported:** Same static fallback. No degradation in experience quality.

---

## States

| State | Base Layer | Reveal Layer | Headline | Primary Action |
|-------|-----------|-------------|----------|---------------|
| `idle` | Cosmic nebula image | None (engine not yet instantiated) | "The stars already know your face." | Glass button: "Reveal Yourself" |
| `requesting` | Cosmic nebula image | None | "The stars already know your face." | Button disabled, showing "Summoning..." with spinner |
| `streaming` | Cosmic nebula image | Live webcam `<video>` (mirrored) | "This is how the cosmos sees you." | Gold CTA: "Get Your Full Cosmic Portrait" |
| `denied` | Cosmic nebula image | Static portrait image (`/liquid-mask/reveal.png`) | "This is how the cosmos sees you." | Gold CTA: "Get Your Full Cosmic Portrait" |

State transitions are animated: headline cross-fades (opacity 300ms), button dissolves out, CTA + social proof fade up from below (staggered 80ms).

**Engine instantiation strategy:** The engine is NOT created during `idle` state. The base nebula image is rendered as a plain `<img>` with the `mask-image` radial fade. When the user clicks "Reveal Yourself" and camera resolves (or is denied), the engine is instantiated with both textures available — either `revealVideo` or `revealImage`. This avoids the problem of constructing an engine with no reveal texture.

---

## Engine Changes (LiquidMaskEngine.ts)

The existing engine loads two static images as WebGL textures. Two changes needed:

### 1. Add `revealVideo` option

```typescript
interface LiquidMaskOptions {
  baseImage: string;
  revealImage?: string;              // existing — static image URL
  revealVideo?: HTMLVideoElement;    // NEW — live video element
  // ... rest unchanged
}
```

At least one of `revealImage` or `revealVideo` must be provided. Constructor throws if neither is set.

### 2. Per-frame texture update

When `revealVideo` is provided, the render loop calls `gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)` every frame to update the reveal texture. When `revealImage` is provided (existing behavior), the texture is uploaded once at load time.

Everything else — mask shape, liquid noise, feather, velocity tracking, presence animation, chromatic aberration, film grain — remains identical.

### 3. Webcam mirroring

When `revealVideo` is used, the shader flips the reveal texture's U coordinate (`1.0 - uv.x`) so the face appears mirrored (natural selfie view). This is a one-line conditional in the fragment shader.

### 4. Y-axis testing note

`texImage2D` with `HTMLVideoElement` may have different Y-axis orientation than `HTMLImageElement`. Test and toggle `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` if the face appears upside-down.

---

## Component Structure

### CosmicSelfie.tsx (new, replaces OraclePreview.tsx)

The component does NOT reuse `LiquidMaskCanvas.tsx`. It instantiates `LiquidMaskEngine` directly, because:
- It needs to control when the engine is created (not at mount — only after camera resolves)
- It needs to pass a `<video>` element as a texture source
- It manages its own pointer events and cursor layers

```
CosmicSelfie.tsx
  ├── State machine: idle | requesting | streaming | denied
  ├── useScrollProgress (entrance animation — simple opacity + scale)
  ├── streamRef (stores MediaStream for cleanup)
  ├── Hidden <video> element (webcam sink, CSS transform: scaleX(-1) for preview if needed)
  ├── LiquidMaskEngine (instantiated directly, not via LiquidMaskCanvas)
  │     ├── Base: /cosmic-selfie/nebula.png
  │     └── Reveal: webcam video OR /liquid-mask/reveal.png
  ├── Headline (changes per state, cross-fade animated)
  ├── "Reveal Yourself" button (idle state) / "Summoning..." (requesting state)
  ├── Feature pills (streaming/denied only, hardcoded):
  │     ├── ✦ AI Birth Chart → /portrait
  │     ├── ☽ Daily Readings → /daily
  │     └── ⊹ Cosmic Portrait → /portrait
  ├── Social proof line (streaming/denied only): "Trusted by 12,400+ seekers · 4.9★ rating"
  ├── Gold CTA: "Get Your Full Cosmic Portrait" → /portrait (streaming/denied only)
  └── Privacy text: "Camera is live — nothing is recorded" (streaming only)
```

### Webcam Integration

```typescript
const streamRef = useRef<MediaStream | null>(null);
const videoRef = useRef<HTMLVideoElement>(null);

const startCamera = async () => {
  setState('requesting');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
    });
    streamRef.current = stream;
    const video = videoRef.current!;
    video.srcObject = stream;
    await video.play();
    
    // Create engine now that we have the video
    const engine = new LiquidMaskEngine(containerRef.current!, {
      baseImage: '/cosmic-selfie/nebula.png',
      revealVideo: video,
      maskRadius: isMobile ? 0.32 : 0.26,
      feather: 0.09,
      lerpFactor: 0.09,
    });
    engine.start();
    engineRef.current = engine;
    setState('streaming');
    
    // Handle camera disconnection
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      setState('denied');
      // Engine stays alive, swap to static image fallback
    });
  } catch {
    setState('denied');
    // Create engine with static fallback image
    const engine = new LiquidMaskEngine(containerRef.current!, {
      baseImage: '/cosmic-selfie/nebula.png',
      revealImage: '/liquid-mask/reveal.png',
      maskRadius: isMobile ? 0.32 : 0.26,
    });
    engine.start();
    engineRef.current = engine;
  }
};
```

**Cleanup on unmount:**
```typescript
return () => {
  streamRef.current?.getTracks().forEach(t => t.stop());
  engineRef.current?.dispose();
};
```

### Webcam Aspect Ratio Handling

Webcams return non-square feeds (typically 4:3 or 16:9). The `<video>` element's natural dimensions won't match the square canvas.

**Solution:** Request `640x480` (standard 4:3) and let the shader handle it. The existing shader samples the reveal texture with UV coordinates 0-1 across the quad. A non-square video will be stretched to fill the square. Since the face is roughly centered in any webcam frame, the mild horizontal stretch is barely noticeable and avoids the complexity of an intermediate cropping canvas. If testing reveals noticeable distortion, add a shader-side aspect correction: `revealUV.x = 0.5 + (revealUV.x - 0.5) * (videoAspect / canvasAspect)`.

### Pointer Events / Cursor

Pointer tracking (mousemove, touch) is handled directly in `CosmicSelfie.tsx` using the same pattern as the existing `LiquidMaskCanvas.tsx` — normalize client coordinates to 0-1 UV, forward to `engine.updatePointer()`. The 3-layer custom cursor (halo/ring/core) is also replicated directly.

`setPresent(true/false)` is driven by `mouseenter`/`mouseleave` events on the canvas container — same as existing behavior. It is NOT called when the stream starts. The mask only reveals when the cursor is actively over the orb.

---

## Visual Design

### Layout

```
     "The stars already know your face."      ← Cormorant Garamond italic, muted
                                              
              ┌─────────────┐                 
              │  Cosmic Orb  │  ~420px        
              │  (WebGL)     │  circular      
              │              │  mask-image     
              └─────────────┘  fade edges     
                                              
          [ Reveal Yourself ]                 ← Glass button (idle)
                                              
     — after camera granted: —                
                                              
        "This is how the cosmos               
              sees you."                      
                                              
     ✦ AI Birth Chart  ☽ Daily  ⊹ Portrait   ← Hardcoded glass pills
      Trusted by 12,400+ · 4.9★              ← AnimatedCounter components
                                              
     [ Get Your Full Cosmic Portrait → ]      ← Gold MagneticButton → /portrait
                                              
       Camera is live — nothing is recorded   ← Privacy text, only in streaming state
```

### Visual Elements

- **Orb:** Circular, `mask-image` radial fade at edges, no border/frame
- **Rift edges:** Golden crack lines at section top/bottom (existing keyframes)
- **Aura glow:** Breathing purple/gold radial gradient behind the orb (existing keyframe)
- **No particles, no sacred geometry, no orbital rings** — the webcam moment is the spectacle
- **Scroll entrance:** Simple opacity + scale (0.9 → 1.0), not phased choreography. Uses `useScrollProgress` with a single eased value.

### Copy Progression

1. **Idle:** "The stars already know your face." — curiosity hook
2. **Requesting:** Same headline (no change during permission prompt)
3. **Active:** "This is how the cosmos sees you." — wonder/awe
4. **CTA:** "Get Your Full Cosmic Portrait →" — conversion

---

## Privacy & Security

- Camera is **never** activated without explicit user action (button click + browser permission)
- The webcam stream is used **only** as a WebGL texture source — no frames are captured, stored, transmitted, or processed
- The `<video>` element is hidden (`display: none`), used purely as a texture input
- Stream tracks are stored in `streamRef` and stopped on component unmount
- Camera disconnection (track ended event) triggers fallback to `denied` state
- Privacy reassurance text visible below the orb when streaming: "Camera is live — nothing is recorded"
- On mobile: `facingMode: 'user'` ensures front camera (selfie mode)

---

## Mobile Behavior

- Touch replaces cursor for the liquid mask (existing behavior)
- Front-facing camera via `facingMode: 'user'`
- Orb size scales to `80vw` (capped at 420px)
- "Reveal Yourself" button works identically
- Feature pills wrap to 2 rows if needed

---

## Accessibility

- **`prefers-reduced-motion: reduce`:** Scroll entrance animation is skipped (section appears immediately at full opacity). The liquid mask effect itself still works (it's cursor-driven, not time-animated). The "Reveal Yourself" camera flow is fully available. The noise animation speed in the shader is reduced but not removed.
- Camera button has clear label and is keyboard-accessible (`<button>` element)
- Fallback to static image if camera unavailable ensures no broken experience
- Privacy text is always visible when camera is active
- `aria-live="polite"` on the headline container so screen readers announce state changes

---

## Analytics Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `cosmic_selfie_viewed` | Section enters viewport | `{ section: 'cosmic-selfie' }` |
| `cosmic_selfie_reveal_clicked` | User clicks "Reveal Yourself" | `{}` |
| `cosmic_selfie_camera_granted` | Camera permission accepted | `{}` |
| `cosmic_selfie_camera_denied` | Camera permission denied/failed | `{ reason: 'denied' | 'unsupported' }` |
| `cosmic_selfie_cta_clicked` | User clicks gold CTA | `{ destination: '/portrait' }` |

Events dispatched via the existing `window.dispatchEvent(new CustomEvent(...))` pattern used elsewhere in the site.

---

## Assets Needed

| Asset | Description | Source |
|-------|------------|--------|
| `/cosmic-selfie/nebula.png` | Swirling cosmic void — the base layer. Dark center, brighter edges, portal-like. | Generate via Vertex AI |
| `/liquid-mask/reveal.png` | Static face fallback (existing) | Already exists |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/oracle/LiquidMaskEngine.ts` | Add `revealVideo` option, per-frame `texImage2D`, U-flip for mirror, `UNPACK_FLIP_Y` handling |
| `src/components/CosmicSelfie.tsx` | New component (replaces OraclePreview.tsx). Instantiates engine directly (does NOT use LiquidMaskCanvas.tsx) |
| `src/components/OraclePreview.tsx` | Delete (replaced by CosmicSelfie) |
| `src/app/page.tsx` | Swap `OraclePreview` import → `CosmicSelfie` |
| `src/app/globals.css` | Remove `.oracle-circular-canvas` hack. Keep oracle keyframes (aura-breathe, canvas-glow, rim-pulse). Add mask-image for `.cosmic-selfie-orb`. |
| `public/cosmic-selfie/nebula.png` | New asset |

**NOT modified:** `src/components/oracle/LiquidMaskCanvas.tsx` — the existing wrapper continues to work unchanged for the standalone `/oracle` page. CosmicSelfie bypasses it entirely.

---

## Success Criteria

1. User sees a cosmic orb on the homepage that invites interaction
2. Clicking "Reveal Yourself" shows a loading state, then prompts camera access
3. If granted, user's live mirrored face appears beneath the cosmos within 1 second
4. The liquid mask effect works identically to the current implementation (noise edges, velocity, presence)
5. Denying camera or camera disconnection gracefully falls back to static portrait
6. The section drives clicks to `/portrait` (measurable via `cosmic_selfie_cta_clicked` event)
7. 60fps on desktop, smooth on mobile
8. No privacy concerns — nothing captured or transmitted
9. `prefers-reduced-motion` users still get the full camera experience (only scroll animation is skipped)
