"use client";

/**
 * ShaderBackdrop — the sky the whole almanac sits under.
 *
 * Northern Lights (shaders.com): a Swirl base in deep navy with an
 * Aurora ribbon over it and a breath of film grain. It replaces the CSS
 * lobes as the thing the glass panes refract — same role, real light.
 *
 * Two guards, because this is WebGPU:
 *   · devices without WebGPU keep the CSS aurora and never load the
 *     shader bundle at all;
 *   · prefers-reduced-motion keeps the CSS aurora too — a full-viewport
 *     animated field is exactly what that setting exists to stop.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NorthernLights = dynamic(() => import("./NorthernLights"), { ssr: false });

export default function ShaderBackdrop() {
  const [useShader, setUseShader] = useState(false);

  useEffect(() => {
    let alive = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // `"gpu" in navigator` is true even when the property is undefined,
    // and some devices expose navigator.gpu with no usable adapter — so
    // the only honest test is asking for one.
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    if (!gpu?.requestAdapter) return;

    gpu
      .requestAdapter()
      .then((adapter) => {
        if (alive && adapter) setUseShader(true);
      })
      .catch(() => {
        /* no adapter — the CSS field stays */
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!useShader) {
    // The CSS field — three drifting lobes. Cheap, and it keeps the
    // glass with something to refract on every device.
    return (
      <div className="lg-aurora" aria-hidden>
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className="lg-shader" aria-hidden>
      <NorthernLights />
      <style jsx global>{`
        /* The shells promote every direct child into the content stack
           (position relative, z-index 1) — hold the sky down below it. */
        .almanac .lg-shader,
        .alm-page .lg-shader,
        .lg-shader {
          position: fixed !important;
          inset: 0;
          z-index: 0 !important;
          pointer-events: none;
          overflow: hidden;
          contain: strict;
        }
        /* The library sizes its own wrapper to a 2:1 canvas; the sky has
           to fill the viewport, so both are forced and the frame is
           cropped rather than letterboxed. */
        .lg-shader > div,
        .lg-shader .shader {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        .lg-shader canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
          display: block;
        }
        /* The aurora is the room, not the subject: held back so type and
           the glass panes keep the foreground. */
        .lg-shader::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(16, 19, 77, 0.34) 0%,
              rgba(16, 19, 77, 0.62) 30%,
              rgba(16, 19, 77, 0.62) 70%,
              rgba(16, 19, 77, 0.34) 100%
            ),
            radial-gradient(
              120% 90% at 50% 40%,
              rgba(16, 19, 77, 0.1),
              rgba(16, 19, 77, 0.42) 100%
            );
        }
      `}</style>
    </div>
  );
}
