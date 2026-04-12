/**
 * ParallaxSection.tsx — Multi-layer parallax depth section
 *
 * Creates depth illusion with multiple layers moving at different
 * scroll speeds. Layers can be background images, decorative elements,
 * or content. Used for hero sections and story sections.
 *
 * Also supports mouse-reactive parallax for desktop.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";

interface ParallaxLayer {
  /** React content for this layer */
  content: React.ReactNode;
  /** Parallax speed multiplier (0 = fixed, 1 = scroll speed, >1 = faster) */
  speed: number;
  /** Optional z-index override */
  zIndex?: number;
  /** Apply mouse parallax (default: false) */
  mouseReactive?: boolean;
  /** Mouse parallax intensity (default: 0.02) */
  mouseIntensity?: number;
  /** Layer opacity (default: 1) */
  opacity?: number;
}

interface ParallaxSectionProps {
  layers: ParallaxLayer[];
  /** Main content (rendered on top) */
  children?: React.ReactNode;
  /** Section height (default: "100vh") */
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ParallaxSection({
  layers,
  children,
  height = "100vh",
  className = "",
  style,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Scroll tracking
  useEffect(() => {
    if (reducedMotion) return;

    let raf = 0;
    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setScrollY(viewCenter - sectionCenter);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  // Mouse tracking with lerp
  useEffect(() => {
    if (reducedMotion) return;

    const handleMouse = (e: MouseEvent) => {
      // Normalize to -1...1 from viewport center
      mouseTargetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTargetRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const animate = () => {
      const c = mouseCurrentRef.current;
      const t = mouseTargetRef.current;
      c.x += (t.x - c.x) * 0.05;
      c.y += (t.y - c.y) * 0.05;
      setMouse({ x: c.x, y: c.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouse);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        height,
        ...style,
      }}
    >
      {/* Parallax layers */}
      {layers.map((layer, i) => {
        const scrollOffset = reducedMotion ? 0 : scrollY * layer.speed * 0.1;
        const mouseX = layer.mouseReactive && !reducedMotion
          ? mouse.x * (layer.mouseIntensity || 0.02) * 100
          : 0;
        const mouseY = layer.mouseReactive && !reducedMotion
          ? mouse.y * (layer.mouseIntensity || 0.02) * 100
          : 0;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: "-10%", // oversized to prevent edge visibility during parallax
              width: "120%",
              height: "120%",
              zIndex: layer.zIndex ?? i,
              opacity: layer.opacity ?? 1,
              transform: `translate(${mouseX}px, ${scrollOffset + mouseY}px)`,
              willChange: reducedMotion ? "auto" : "transform",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {layer.content}
          </div>
        );
      })}

      {/* Main content on top */}
      {children && (
        <div style={{ position: "relative", zIndex: layers.length + 1, height: "100%", pointerEvents: "auto" }}>
          {children}
        </div>
      )}
    </section>
  );
}
