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
