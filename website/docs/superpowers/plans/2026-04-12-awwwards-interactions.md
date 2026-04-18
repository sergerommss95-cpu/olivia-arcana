# Awwwards-Level Interaction Upgrades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Olivia Arcana from 6.5/10 to 8.5+/10 Awwwards standard by adding page transitions, scroll-driven micro-animations, and magnetic interactive buttons.

**Architecture:** Three independent systems layered onto the existing component tree. (1) A `PageTransition` wrapper in layout.tsx intercepts route changes and choreographs exit/enter animations using Framer Motion's `AnimatePresence`. (2) A `ScrollFloat` component replaces `SectionReveal` with scrubbed scroll-driven animations (rotation, scale, parallax) using Framer Motion `useScroll`/`useTransform`. (3) A `MagneticButton` component wraps all CTAs with cursor-tracking tilt, glow expansion, press feedback, and sound triggers.

**Tech Stack:** Framer Motion 12 (already installed), Lenis (already installed), Web Animations API, CSS custom properties, custom React hooks. No new dependencies needed.

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/components/transitions/PageTransition.tsx` | Wraps `{children}` in layout — AnimatePresence orchestration |
| `src/components/transitions/TransitionLink.tsx` | Drop-in `<a>` replacement — delays navigation until exit animation completes |
| `src/components/transitions/TransitionOverlay.tsx` | Full-screen wipe overlay (cosmic curtain between pages) |
| `src/components/ScrollFloat.tsx` | Scroll-scrubbed micro-animations: rotate, scale, parallax, opacity |
| `src/components/MagneticButton.tsx` | Cursor-tracking magnetic button with glow, scale, press, sound |
| `src/hooks/useScrollProgress.ts` | Lightweight hook: returns 0→1 progress for an element's viewport journey |
| `src/hooks/useMagnetic.ts` | Cursor-relative position calculation for magnetic pull effect |

### Modified Files
| File | Change |
|------|--------|
| `src/app/layout.tsx` | Wrap `{children}` in `<PageTransition>` |
| `src/components/Navbar.tsx` | Replace `<a>` with `<TransitionLink>` for animated navigation |
| `src/app/page.tsx` | Replace `<SectionReveal>` with `<ScrollFloat>` |
| `src/components/CTA.tsx` | Replace `<a>` buttons with `<MagneticButton>` |
| `src/components/Hero.tsx` | Replace CTA `<a>` tags with `<MagneticButton>` |
| `src/components/Features.tsx` | Wrap feature cards in `<ScrollFloat>` |
| `src/components/Pricing.tsx` | Wrap pricing cards in `<ScrollFloat>`, CTAs with `<MagneticButton>` |
| `src/components/Testimonials.tsx` | Wrap testimonials in `<ScrollFloat>` with horizontal stagger |
| `src/components/HowItWorks.tsx` | Wrap steps in `<ScrollFloat>` |
| `src/components/Footer.tsx` | Replace links with `<TransitionLink>` |
| `src/components/SmoothScroll.tsx` | Expose Lenis instance via context for scroll-locking during transitions |
| `src/app/globals.css` | Add transition overlay keyframes + magnetic button CSS custom properties |

---

## Task 1: Scroll Progress Hook

**Files:**
- Create: `src/hooks/useScrollProgress.ts`

This hook powers all scroll-driven animations. It returns a 0→1 value representing how far an element has traveled through the viewport (0 = just entered bottom, 1 = exiting top).

First, create the hooks directory:

```bash
mkdir -p src/hooks
```

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Returns a ref to attach to any element and a `progress` value (0→1)
 * tracking how far the element has scrolled through the viewport.
 *
 * 0 = element's top edge is at viewport bottom
 * 1 = element's bottom edge is at viewport top
 *
 * Uses IntersectionObserver for activation + RAF scroll listener
 * for smooth per-frame updates. Self-cleans when element leaves.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  offsetTop = "0px",
  offsetBottom = "0px"
) {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const isVisible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    const update = () => {
      if (!isVisible.current || !el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when top of element hits bottom of viewport
      // 1 when bottom of element hits top of viewport
      const raw = (vh - rect.top) / (vh + rect.height);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    let rafId: number;
    const loop = () => {
      update();
      if (isVisible.current) rafId = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          update();
          rafId = requestAnimationFrame(loop);
        }
      },
      { rootMargin: `${offsetTop} 0px ${offsetBottom} 0px`, threshold: 0 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [offsetTop, offsetBottom]);

  return { ref, progress };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx tsc --noEmit src/hooks/useScrollProgress.ts 2>&1 || echo "Check output"`

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useScrollProgress.ts
git commit -m "feat: add useScrollProgress hook for scroll-driven animations"
```

---

## Task 2: ScrollFloat Component

**Files:**
- Create: `src/components/ScrollFloat.tsx`

Replaces `SectionReveal` with richer scroll-driven micro-animations. Each child element rotates, scales, and translates based on its scroll position — creating the "everything responds to scroll" feel Awwwards judges look for.

- [ ] **Step 1: Create the ScrollFloat component**

```tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface ScrollFloatProps {
  children: React.ReactNode;
  /** Delay class index for stagger (each adds 60ms) */
  index?: number;
  /** Animation intensity: 'subtle' | 'medium' | 'dramatic' */
  intensity?: "subtle" | "medium" | "dramatic";
  /** Extra className */
  className?: string;
  /** Custom offset for scroll trigger */
  offsetTop?: string;
  offsetBottom?: string;
  /** Disable specific transforms */
  disableRotate?: boolean;
  disableScale?: boolean;
  disableParallax?: boolean;
}

const INTENSITY = {
  subtle:   { rotate: 1.5,  scale: 0.03, parallax: 15,  opacity: 0.15 },
  medium:   { rotate: 3,    scale: 0.06, parallax: 30,  opacity: 0.3  },
  dramatic: { rotate: 5,    scale: 0.10, parallax: 50,  opacity: 0.5  },
} as const;

export default function ScrollFloat({
  children,
  index = 0,
  intensity = "medium",
  className = "",
  offsetTop = "100px",
  offsetBottom = "0px",
  disableRotate = false,
  disableScale = false,
  disableParallax = false,
}: ScrollFloatProps) {
  const { ref, progress } = useScrollProgress(offsetTop, offsetBottom);
  const cfg = INTENSITY[intensity];

  // Detect reduced motion safely (avoids SSR hydration mismatch)
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Eased progress (ease-out expo — fast reveal, smooth settle)
  const eased = useMemo(() => {
    if (reducedMotion) return 1;
    // Stagger: each subsequent element starts its animation slightly later
    const staggerDelay = index * 0.04; // 4% per index
    const adjusted = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)));
    return 1 - Math.pow(2, -10 * adjusted);
  }, [progress, index, reducedMotion]);

  // Transform values interpolated from eased progress
  const rotateX = disableRotate || reducedMotion ? 0 : (1 - eased) * cfg.rotate;
  const rotateY = disableRotate || reducedMotion ? 0 : (1 - eased) * cfg.rotate * 0.5;
  const scale = disableScale || reducedMotion ? 1 : 1 - (1 - eased) * cfg.scale;
  const translateY = disableParallax || reducedMotion ? 0 : (1 - eased) * cfg.parallax;
  const opacity = reducedMotion ? 1 : 1 - (1 - eased) * cfg.opacity;

  // Clip-path: reveal from bottom (inherited from SectionReveal pattern)
  const clipInset = reducedMotion ? 0 : (1 - eased) * 100;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateY(${translateY}px)`,
        clipPath: eased < 0.99 ? `inset(${clipInset}% 0 0 0)` : "none",
        opacity,
        willChange: eased < 0.99 && !reducedMotion ? "transform, clip-path, opacity" : "auto",
        transformOrigin: "center bottom",
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx tsc --noEmit src/components/ScrollFloat.tsx 2>&1 || echo "Check output"`

- [ ] **Step 3: Commit**

```bash
git add src/components/ScrollFloat.tsx
git commit -m "feat: add ScrollFloat component — scroll-scrubbed micro-animations"
```

---

## Task 3: Integrate ScrollFloat Into Homepage

**Files:**
- Modify: `src/app/page.tsx`

Replace all `<SectionReveal>` wrappers with `<ScrollFloat>` and add stagger indices.

- [ ] **Step 1: Update homepage imports and wrappers**

In `src/app/page.tsx`:

Replace:
```tsx
import SectionReveal from "@/components/SectionReveal";
```
With:
```tsx
import ScrollFloat from "@/components/ScrollFloat";
```

Then replace every `<SectionReveal>` / `<SectionReveal delay={N}>` with `<ScrollFloat index={N}>`:

```tsx
<ScrollFloat index={0}>
  <DailyHoroscope />
</ScrollFloat>
<ScrollFloat index={1}>
  <CompatibilityChecker />
</ScrollFloat>
<ScrollFloat index={2}>
  <Features />
</ScrollFloat>
<ScrollFloat index={3}>
  <HowItWorks />
</ScrollFloat>
<ScrollFloat index={4}>
  <Testimonials />
</ScrollFloat>
<ScrollFloat index={5}>
  <Pricing />
</ScrollFloat>
<ScrollFloat index={6}>
  <CTA />
</ScrollFloat>
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -20`

Expected: Clean build, all routes render.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace SectionReveal with ScrollFloat on homepage"
```

---

## Task 4: Add ScrollFloat to Feature Cards, Pricing Cards, Testimonials

**Files:**
- Modify: `src/components/Features.tsx`
- Modify: `src/components/Pricing.tsx`
- Modify: `src/components/HowItWorks.tsx`
- Modify: `src/components/Testimonials.tsx`

Wrap individual cards within each section with `<ScrollFloat>` at `intensity="subtle"` and stagger indices. This creates the "every element responds to scroll" effect.

- [ ] **Step 1: Add ScrollFloat to Features.tsx**

Import `ScrollFloat` and wrap each feature card. Use `intensity="subtle"` since these are smaller elements inside an already-floating section.

```tsx
import ScrollFloat from "@/components/ScrollFloat";

// Wrap each individual card:
<ScrollFloat index={i} intensity="subtle" disableRotate>
  <div className="glass-card ...">
    {/* existing card content */}
  </div>
</ScrollFloat>
```

- [ ] **Step 2: Add ScrollFloat to Pricing.tsx**

Same pattern — wrap each pricing tier card.

- [ ] **Step 3: Add ScrollFloat to HowItWorks.tsx**

Wrap each step card with stagger index.

- [ ] **Step 4: Add ScrollFloat to Testimonials.tsx**

Wrap each testimonial with stagger. Use `intensity="subtle"`.

- [ ] **Step 5: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -20`

- [ ] **Step 6: Commit**

```bash
git add src/components/Features.tsx src/components/Pricing.tsx src/components/HowItWorks.tsx src/components/Testimonials.tsx
git commit -m "feat: add ScrollFloat micro-animations to all section cards"
```

---

## Task 5: Magnetic Pull Hook

**Files:**
- Create: `src/hooks/useMagnetic.ts`

This hook tracks the cursor position relative to an element and returns x/y deltas for magnetic pull, glow position, and tilt. It's the core of the MagneticButton.

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface MagneticState {
  /** X offset from center (-1 to 1) */
  x: number;
  /** Y offset from center (-1 to 1) */
  y: number;
  /** Whether cursor is within the magnetic pull radius */
  active: boolean;
  /** Whether element is being pressed */
  pressed: boolean;
}

/**
 * Tracks cursor position relative to an element for magnetic pull effects.
 *
 * Returns normalized x/y offsets (-1 to 1) from element center,
 * active state (cursor within pull radius), and pressed state.
 *
 * @param pullRadius - Distance in px beyond element bounds that triggers magnetic pull (default: 60)
 * @param pullStrength - How strongly the element follows the cursor (0-1, default: 0.3)
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(
  pullRadius = 60,
  pullStrength = 0.3
) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<MagneticState>({
    x: 0,
    y: 0,
    active: false,
    pressed: false,
  });

  // Lerp position for smooth movement
  const lerpRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const maxDist = Math.max(rect.width, rect.height) / 2 + pullRadius;
    const active = dist < maxDist;

    if (active) {
      // Normalize to -1..1 and apply strength
      const nx = (dx / maxDist) * pullStrength;
      const ny = (dy / maxDist) * pullStrength;
      lerpRef.current = { x: nx, y: ny };
    } else {
      lerpRef.current = { x: 0, y: 0 };
    }

    setState((prev) => ({ ...prev, active }));
  }, [pullRadius, pullStrength]);

  const handleMouseDown = useCallback(() => {
    setState((prev) => ({ ...prev, pressed: true }));
  }, []);

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, pressed: false }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    lerpRef.current = { x: 0, y: 0 };
    setState((prev) => ({ ...prev, active: false, pressed: false }));
  }, []);

  // Smooth RAF loop for lerped position
  useEffect(() => {
    // Skip on touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;

    const currentState = { x: 0, y: 0 };
    let rafId: number;

    const tick = () => {
      currentState.x += (lerpRef.current.x - currentState.x) * 0.12;
      currentState.y += (lerpRef.current.y - currentState.y) * 0.12;

      // Only update state if change is visible (>0.001)
      if (Math.abs(currentState.x - lerpRef.current.x) > 0.001 ||
          Math.abs(currentState.y - lerpRef.current.y) > 0.001 ||
          Math.abs(currentState.x) > 0.001) {
        setState((prev) => ({
          ...prev,
          x: currentState.x,
          y: currentState.y,
        }));
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const el = ref.current;
    // Listen on document for mouse position, element for enter/leave
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    el?.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    el?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", handleMouseMove);
      el?.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      el?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp, handleMouseLeave]);

  return { ref, ...state };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMagnetic.ts
git commit -m "feat: add useMagnetic hook — cursor-relative position tracking"
```

---

## Task 6: MagneticButton Component

**Files:**
- Create: `src/components/MagneticButton.tsx`

The showpiece interaction component. Wraps any CTA with magnetic cursor pull, glow expansion, scale on hover, press feedback, and an optional sound trigger.

- [ ] **Step 1: Create MagneticButton**

```tsx
"use client";

import React from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

interface MagneticButtonProps {
  children: React.ReactNode;
  /** URL for navigation */
  href?: string;
  /** Click handler (used instead of href for non-navigation buttons) */
  onClick?: () => void;
  /** Visual variant */
  variant?: "gold" | "glass" | "outline";
  /** Extra className */
  className?: string;
  /** Open in new tab */
  external?: boolean;
  /** Play cosmic chime on click */
  sound?: boolean;
  /** Button size */
  size?: "sm" | "md" | "lg";
}

const VARIANTS = {
  gold: {
    bg: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)",
    text: "var(--c-void)",
    border: "none",
    shadow: "0 0 0px rgba(212,175,55,0)",
    shadowHover: "0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)",
    glowColor: "rgba(212,175,55,0.2)",
  },
  glass: {
    bg: "linear-gradient(135deg, rgba(160,120,255,0.18) 0%, rgba(100,80,220,0.14) 100%)",
    text: "rgba(240,235,255,0.95)",
    border: "1px solid rgba(200,180,255,0.22)",
    shadow: "0 0 0px rgba(160,120,255,0)",
    shadowHover: "0 0 25px rgba(160,120,255,0.3), 0 0 50px rgba(160,120,255,0.1)",
    glowColor: "rgba(160,120,255,0.15)",
  },
  outline: {
    bg: "transparent",
    text: "var(--c-accent)",
    border: "1px solid rgba(160,120,255,0.3)",
    shadow: "0 0 0px rgba(160,120,255,0)",
    shadowHover: "0 0 20px rgba(160,120,255,0.2)",
    glowColor: "rgba(160,120,255,0.1)",
  },
} as const;

const SIZES = {
  sm: "px-5 py-2 text-sm",
  md: "px-8 py-3 text-base",
  lg: "px-10 py-4 text-lg",
} as const;

export default function MagneticButton({
  children,
  href,
  onClick,
  variant = "glass",
  className = "",
  external = false,
  sound = true,
  size = "md",
}: MagneticButtonProps) {
  const { ref, x, y, active, pressed } = useMagnetic<HTMLElement>(60, 0.3);
  const v = VARIANTS[variant];

  const handleClick = () => {
    // Dispatch sound event
    if (sound) {
      window.dispatchEvent(new CustomEvent("cosmos:chime"));
    }
    onClick?.();
  };

  const scale = pressed ? 0.97 : active ? 1.06 : 1;
  const translateX = x * 12; // Max 12px pull
  const translateY = y * 12;

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    position: "relative",
    borderRadius: "100px",
    background: v.bg,
    color: v.text,
    border: v.border,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textDecoration: "none",
    cursor: "pointer",
    overflow: "hidden",
    backdropFilter: variant === "glass" ? "blur(16px) saturate(1.35)" : undefined,
    transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
    boxShadow: active ? v.shadowHover : v.shadow,
    transition: pressed
      ? "transform 100ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 100ms ease"
      : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1)",
    willChange: active ? "transform, box-shadow" : "auto",
    minHeight: "44px",
    minWidth: "44px",
  };

  // Inner glow that follows cursor
  const glowStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: `radial-gradient(circle at ${50 + x * 50}% ${50 + y * 50}%, ${v.glowColor}, transparent 70%)`,
    opacity: active ? 1 : 0,
    transition: "opacity 300ms ease",
    pointerEvents: "none",
  };

  const content = (
    <>
      <span style={glowStyle} aria-hidden />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={handleClick}
        className={`${SIZES[size]} ${className}`}
        style={style}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={handleClick}
      className={`${SIZES[size]} ${className}`}
      style={style}
      type="button"
    >
      {content}
    </button>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/components/MagneticButton.tsx
git commit -m "feat: add MagneticButton — cursor-tracking glow, scale, press feedback"
```

---

## Task 7: Wire MagneticButton Into CTAs

**Files:**
- Modify: `src/components/CTA.tsx`
- Modify: `src/components/Hero.tsx`
- Modify: `src/components/Pricing.tsx`

Replace all plain `<a>` CTA buttons with `<MagneticButton>`.

- [ ] **Step 1: Update CTA.tsx**

Replace the gold gradient `<a>` with:

```tsx
import MagneticButton from "@/components/MagneticButton";

<MagneticButton href="/portrait" variant="gold" size="lg" external>
  {t("cta_button")}
</MagneticButton>
```

Remove the old inline-styled `<a>` with its manual gradient spans.

- [ ] **Step 2: Update Hero.tsx CTA buttons**

Find the two CTA buttons ("CELESTIAL PORTRAIT" and "ASK THE STARS") and replace with:

```tsx
import MagneticButton from "@/components/MagneticButton";

<MagneticButton href="/portrait" variant="glass" size="md">
  {t("hero_cta_portrait")} →
</MagneticButton>
<MagneticButton href="/ask" variant="outline" size="md">
  {t("hero_cta_ask")}
</MagneticButton>
```

- [ ] **Step 3: Update Pricing.tsx CTA buttons**

Replace pricing tier CTA buttons with `<MagneticButton variant="gold">` for the featured tier and `<MagneticButton variant="glass">` for other tiers.

- [ ] **Step 4: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/components/CTA.tsx src/components/Hero.tsx src/components/Pricing.tsx
git commit -m "feat: wire MagneticButton into all CTA sections"
```

---

## Task 8: Page Transition — Overlay Component

**Files:**
- Create: `src/components/transitions/TransitionOverlay.tsx`

A full-screen cosmic curtain that sweeps across the screen during page transitions. Uses CSS keyframes for performance.

- [ ] **Step 1: Create the overlay**

```tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isVisible: boolean;
}

/**
 * Cosmic wipe overlay for page transitions.
 *
 * A gradient curtain sweeps from right to left (exit),
 * then from left to right (enter). The gradient uses
 * the site's nebula palette for continuity.
 */
export default function TransitionOverlay({ isVisible }: Props) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            pointerEvents: "none",
            background: `linear-gradient(
              135deg,
              rgba(4,2,13,0.98) 0%,
              rgba(18,12,40,0.95) 40%,
              rgba(4,2,13,0.98) 100%
            )`,
          }}
          initial={{ clipPath: "inset(0 0 0 100%)" }}
          animate={{ clipPath: "inset(0 0 0 0%)" }}
          exit={{ clipPath: "inset(0 100% 0 0)" }}
          transition={{
            duration: 0.6,
            ease: [0.76, 0, 0.24, 1], // cubic-bezier for snappy wipe
          }}
        >
          {/* Subtle stars/dots during wipe */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.3,
              background: `
                radial-gradient(1px 1px at 20% 30%, rgba(200,180,255,0.6), transparent),
                radial-gradient(1px 1px at 50% 70%, rgba(212,175,55,0.4), transparent),
                radial-gradient(1px 1px at 80% 20%, rgba(200,180,255,0.5), transparent),
                radial-gradient(1px 1px at 30% 80%, rgba(212,175,55,0.3), transparent),
                radial-gradient(1px 1px at 70% 50%, rgba(200,180,255,0.4), transparent)
              `,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p src/components/transitions
git add src/components/transitions/TransitionOverlay.tsx
git commit -m "feat: add TransitionOverlay — cosmic wipe curtain for page transitions"
```

---

## Task 9: Page Transition — TransitionLink Component

**Files:**
- Create: `src/components/transitions/TransitionLink.tsx`

A drop-in replacement for `<a>` that triggers the exit animation before navigating.

- [ ] **Step 1: Create TransitionLink**

```tsx
"use client";

import React, { useCallback } from "react";

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Drop-in <a> replacement that dispatches a custom event
 * to trigger the page transition overlay before navigating.
 *
 * The PageTransition component listens for this event,
 * shows the overlay, waits for the animation, then navigates.
 */
export default function TransitionLink({
  href,
  children,
  className,
  style,
  onClick,
}: TransitionLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Don't intercept external links, modifier clicks, or same-page anchors
      const isExternal = href.startsWith("http") || href.startsWith("//");
      const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isAnchor = href.startsWith("#");
      const isSamePage = href === window.location.pathname;

      if (isExternal || isModified || isAnchor || isSamePage) return;

      e.preventDefault();
      onClick?.();

      // Dispatch transition event — PageTransition will handle the rest
      window.dispatchEvent(
        new CustomEvent("page:transition", { detail: { href } })
      );
    },
    [href, onClick]
  );

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transitions/TransitionLink.tsx
git commit -m "feat: add TransitionLink — triggers page transition before navigation"
```

---

## Task 10: Page Transition — PageTransition Wrapper

**Files:**
- Create: `src/components/transitions/PageTransition.tsx`
- Modify: `src/app/layout.tsx`

The orchestrator. Wraps `{children}` in layout, listens for `page:transition` events, shows the overlay, navigates, then hides the overlay with the exit animation.

- [ ] **Step 1: Create PageTransition**

```tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import TransitionOverlay from "./TransitionOverlay";

interface Props {
  children: React.ReactNode;
}

/**
 * Page transition orchestrator.
 *
 * Lifecycle:
 * 1. TransitionLink dispatches 'page:transition' event
 * 2. PageTransition shows overlay (wipe in: 600ms)
 * 3. At midpoint, navigates to new URL
 * 4. New page mounts — overlay wipes out (600ms)
 * 5. Page content fades in (400ms)
 */
export default function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animationKey, setAnimationKey] = useState(pathname ?? "/");

  // Listen for transition events from TransitionLink
  useEffect(() => {
    const handleTransition = (e: Event) => {
      const href = (e as CustomEvent).detail?.href;
      if (!href) return;

      // Phase 1: Show overlay
      setOverlayVisible(true);

      // Phase 2: Navigate after overlay covers screen
      setTimeout(() => {
        window.location.href = href;
      }, 600); // Match overlay animation duration
    };

    window.addEventListener("page:transition", handleTransition);
    return () => window.removeEventListener("page:transition", handleTransition);
  }, []);

  // When pathname changes (new page loaded), animate in
  useEffect(() => {
    setDisplayChildren(children);
    setAnimationKey(pathname);

    // Hide overlay after new page content is ready
    const timer = setTimeout(() => {
      setOverlayVisible(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <>
      <TransitionOverlay isVisible={overlayVisible} />
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Wire into layout.tsx**

In `src/app/layout.tsx`, add the import and wrap `{children}`:

Add import:
```tsx
import PageTransition from "@/components/transitions/PageTransition";
```

Replace:
```tsx
        {/* Page content */}
        {children}
```

With:
```tsx
        {/* Page content — with transition choreography */}
        <PageTransition>{children}</PageTransition>
```

- [ ] **Step 3: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -10`

Expected: Clean build. All routes still render as static pages.

- [ ] **Step 4: Commit**

```bash
git add src/components/transitions/PageTransition.tsx src/app/layout.tsx
git commit -m "feat: add PageTransition — orchestrated route change animations"
```

---

## Task 11: Wire TransitionLink Into Navigation

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`

Replace plain `<a>` navigation links with `<TransitionLink>` for animated page changes.

- [ ] **Step 1: Update Navbar.tsx**

Remove `import Link from "next/link"` (no longer needed). Import TransitionLink and replace all navigation `<a>` tags and the `<Link>` logo:

```tsx
import TransitionLink from "@/components/transitions/TransitionLink";

// Desktop links — replace <a> with <TransitionLink>:
{navLinks.map((link) => (
  <TransitionLink
    key={link.href}
    href={link.href}
    className="text-sm text-muted-lavender hover:text-celestial-gold transition-colors duration-300"
  >
    {link.label}
  </TransitionLink>
))}

// Mobile links — same pattern:
{navLinks.map((link) => (
  <TransitionLink
    key={link.href}
    href={link.href}
    onClick={() => setOpen(false)}
    className="block text-muted-lavender hover:text-celestial-gold transition-colors py-2"
  >
    {link.label}
  </TransitionLink>
))}

// Logo link:
<TransitionLink href="/" className="flex items-center gap-2 group">
  ...
</TransitionLink>

// Sign up / Profile link:
<TransitionLink
  href={loggedIn ? "/profile" : "/register"}
  className="px-5 py-2 rounded-full ..."
>
  ...
</TransitionLink>
```

- [ ] **Step 2: Update Footer.tsx**

Import `TransitionLink` and replace internal `<a>` navigation links. Keep external links (social media, Telegram, etc.) as plain `<a>`. Some internal links in the "Connect" section may have `target="_blank"` — remove that attribute when wrapping with `TransitionLink` since it handles navigation internally.

- [ ] **Step 3: Build and verify**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/components/Navbar.tsx src/components/Footer.tsx
git commit -m "feat: wire TransitionLink into Navbar and Footer for animated navigation"
```

---

## Task 12: Sound Event for MagneticButton

**Files:**
- Modify: `src/components/SoundEngine.tsx`

Add a `cosmos:chime` event listener that plays a short, elegant chime on button click.

- [ ] **Step 1: Add chime handler to SoundEngine**

The existing SoundEngine uses a `CosmicAudio` singleton class with `getAudio()` accessor. It already has a `playChime(freq)` method (line 100). Add a `cosmos:chime` event listener alongside the existing `cosmos:shockwave` listener:

```typescript
// Inside the useEffect in SoundEngine, next to the existing onShockwave handler:
const onChime = () => getAudio().playChime(1200);

window.addEventListener("cosmos:chime", onChime);
// ... add to cleanup return:
window.removeEventListener("cosmos:chime", onChime);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SoundEngine.tsx
git commit -m "feat: add cosmos:chime sound event for MagneticButton clicks"
```

---

## Task 13: CSS Custom Properties for Transitions

**Files:**
- Modify: `src/app/globals.css`

Add CSS variables and keyframes that support the transition system.

- [ ] **Step 1: Add transition CSS to globals.css**

Add before the `@media (prefers-reduced-motion)` block:

```css
/* ── Page Transition ── */
.page-enter {
  animation: pageEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Magnetic Button Glow ── */
@keyframes magnetic-glow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add page transition and magnetic button CSS keyframes"
```

---

## Task 14: Final Build, Test, and Deploy

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `cd /Users/macbookpro/olivia-arcana/website && npx next build 2>&1 | tail -30`

Expected: Clean build, all routes render, no type errors.

- [ ] **Step 2: Check bundle size impact**

Run: `ls -la /Users/macbookpro/olivia-arcana/website/.next/static/chunks/ | sort -k5 -n | tail -10`

Verify no single chunk exceeds 250KB (Framer Motion is already in the bundle, so impact should be minimal).

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Expected: Netlify auto-deploys. Verify at oliviaarcana.com.

- [ ] **Step 4: Manual verification checklist**

1. Navigate between pages — cosmic wipe overlay appears and content fades in
2. Scroll homepage — sections rotate/scale/parallax as they enter viewport
3. Hover over CTA buttons — magnetic pull, glow follows cursor, scale increase
4. Click CTA button — press animation (scale 0.97), chime sound (if enabled)
5. Mobile — all effects gracefully degrade (no magnetic on touch, simpler scroll)
6. `prefers-reduced-motion` — all animations disabled, content shows immediately

---

## Architecture Decisions

1. **Framer Motion over GSAP**: Already installed (0KB added). Framer Motion's `AnimatePresence` is purpose-built for React mount/unmount animations. GSAP would add ~40KB and require manual React lifecycle management.

2. **Custom `useScrollProgress` over Framer Motion `useScroll`**: The site's existing pattern uses IntersectionObserver + RAF. A custom hook matches this pattern and avoids pulling in Framer Motion's scroll module on every page.

3. **Custom event system for transitions**: The site already uses `window.dispatchEvent(new CustomEvent(...))` extensively (cosmos:shockwave, zodiac:hover, etc.). Page transitions follow the same pattern for consistency.

4. **`window.location.href` for navigation**: With `output: "export"` (static site), Next.js client-side navigation is limited. Full page loads with a visual overlay create the same perceived smoothness as SPA transitions while being 100% compatible with static export.

5. **No horizontal scroll section yet**: Deliberately deferred. The three upgrades (transitions + scroll animations + magnetic buttons) are the highest-ROI changes. Horizontal scroll can be Phase 2.
