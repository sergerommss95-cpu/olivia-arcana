"use client";

import React, { useState, useRef, useEffect } from "react";

// Inline paths — simple shapes that SVGLoader can fill
const SYMBOLS: [string, string[]][] = [
  ["Aries", [
    "M 50 85 L 50 35 C 50 15, 30 10, 20 25 C 15 32, 18 40, 25 38",
    "M 50 35 C 50 15, 70 10, 80 25 C 85 32, 82 40, 75 38",
  ]],
  ["Star", [
    "M 50 10 L 61 38 L 92 38 L 67 58 L 76 88 L 50 70 L 24 88 L 33 58 L 8 38 L 39 38 Z",
  ]],
  ["Crescent Moon", [
    "M 55 15 C 75 20, 85 40, 85 55 C 85 75, 70 90, 50 90 C 35 90, 20 78, 18 60 C 32 78, 55 72, 60 50 C 63 35, 58 20, 55 15 Z",
  ]],
  ["Taurus", [
    "M 50 75 C 30 75, 20 60, 20 50 C 20 35, 35 25, 50 25 C 65 25, 80 35, 80 50 C 80 60, 70 75, 50 75 Z",
  ]],
  ["All-Seeing Eye", [
    "M 10 50 C 25 25, 45 18, 50 18 C 55 18, 75 25, 90 50 C 75 75, 55 82, 50 82 C 45 82, 25 75, 10 50 Z",
    "M 50 35 C 58 35, 65 42, 65 50 C 65 58, 58 65, 50 65 C 42 65, 35 58, 35 50 C 35 42, 42 35, 50 35 Z",
  ]],
  ["Pentagram", [
    "M 50 14 L 62 42 L 90 42 L 68 60 L 76 88 L 50 72 L 24 88 L 32 60 L 10 42 L 38 42 Z",
  ]],
  ["Ankh", [
    "M 50 20 C 60 20, 68 28, 68 36 C 68 44, 60 50, 50 50 C 40 50, 32 44, 32 36 C 32 28, 40 20, 50 20 Z",
  ]],
];

/** Parse SVG path d= string into array of {x,y} points by sampling */
function pathToPoints(d: string, samples = 40): { x: number; y: number }[] {
  // Create a temporary SVG path to use getPointAtLength
  if (typeof document === "undefined") return [];
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", d);
  svg.appendChild(path);
  document.body.appendChild(svg);

  const len = path.getTotalLength();
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const p = path.getPointAtLength((i / samples) * len);
    pts.push({ x: p.x, y: p.y });
  }

  document.body.removeChild(svg);
  return pts;
}

export default function SymbolsTestPage() {
  const [idx, setIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cleanupRef.current?.();
    cleanupRef.current = null;

    let rafId = 0;
    let alive = true;

    import("three").then((T) => {
      if (!alive) return;

      const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.setSize(350, 350);
      r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      r.outputColorSpace = T.SRGBColorSpace;
      r.toneMapping = T.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.2;

      const sc = new T.Scene();
      const cam = new T.PerspectiveCamera(40, 1, 0.1, 100);
      cam.position.set(0, 0, 4.5);

      sc.add(new T.AmbientLight(0xffffff, 0.5));
      const kl = new T.DirectionalLight(0xfff4e0, 1.4);
      kl.position.set(3, 3, 5);
      sc.add(kl);
      const rl = new T.DirectionalLight(0xc790ff, 0.6);
      rl.position.set(-3, 1, -2);
      sc.add(rl);

      const grp = new T.Group();
      const mat = new T.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.18,
        side: T.DoubleSide,
      });

      const [, pathStrings] = SYMBOLS[idx];

      // Convert each SVG path string into a 3D tube via DOM sampling
      for (const d of pathStrings) {
        const pts2d = pathToPoints(d, 50);
        if (pts2d.length < 2) continue;

        const pts3d = pts2d.map((p) => new T.Vector3(p.x, p.y, 0));
        const curve = new T.CatmullRomCurve3(pts3d, false);
        const tube = new T.TubeGeometry(curve, 30, 1.5, 8, false);
        grp.add(new T.Mesh(tube, mat));
      }

      // Center + scale + flip Y
      const box = new T.Box3().setFromObject(grp);
      const ctr = box.getCenter(new T.Vector3());
      const sz = box.getSize(new T.Vector3());
      const mx = Math.max(sz.x, sz.y, sz.z) || 1;
      grp.position.sub(ctr);
      grp.scale.set(2.2 / mx, -2.2 / mx, 2.2 / mx);
      sc.add(grp);

      const t0 = performance.now();
      const loop = () => {
        rafId = requestAnimationFrame(loop);
        const t = (performance.now() - t0) / 1000;
        grp.rotation.y = t * 0.4;
        grp.position.y = Math.sin(t * 0.8) * 0.1;
        r.render(sc, cam);
      };
      rafId = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        mat.dispose();
        grp.traverse((c: any) => c.geometry?.dispose());
        r.dispose();
        r.forceContextLoss();
      };
    });

    return () => { alive = false; cleanupRef.current?.(); };
  }, [idx]);

  return (
    <div style={{
      minHeight: "100vh", background: "#04020d",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", position: "relative", zIndex: 1, gap: "1rem",
    }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "rgba(240,236,255,0.9)" }}>
        {SYMBOLS[idx][0]}
      </h1>
      <p style={{ color: "rgba(196,185,228,0.5)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
        {idx + 1} of {SYMBOLS.length}
      </p>
      <canvas ref={canvasRef} width={700} height={700} style={{ width: 350, height: 350, display: "block" }} />
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        {["Prev", "Next"].map((label) => (
          <button key={label} onClick={() => setIdx((i) =>
            label === "Prev" ? (i - 1 + SYMBOLS.length) % SYMBOLS.length : (i + 1) % SYMBOLS.length
          )} style={{
            padding: "0.5rem 1.2rem", borderRadius: "999px", cursor: "pointer",
            fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
            fontFamily: "var(--font-heading)", border: "1px solid rgba(200,185,255,0.1)",
            background: "rgba(255,255,255,0.04)", color: "rgba(196,185,228,0.7)",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}
