"use client";

import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { ALL_SYMBOLS } from "@/components/sacred-symbols/paths";

const SYMBOLS = Object.entries(ALL_SYMBOLS);

export default function SymbolsTestPage() {
  const [idx, setIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [name, data] = SYMBOLS[idx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cleanup previous
    cleanupRef.current?.();

    let rafId = 0;
    let disposed = false;

    (async () => {
      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(350, 350);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 4);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xfff4e0, 1.2);
      key.position.set(3, 3, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc790ff, 0.5);
      rim.position.set(-3, 1, -2);
      scene.add(rim);

      // Parse SVG
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        ${data.paths.map((d) => `<path d="${d}" fill="black" stroke="black" stroke-width="4"/>`).join("")}
      </svg>`;
      const svgData = new SVGLoader().parse(svgMarkup);
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, metalness: 0.85, roughness: 0.18, side: THREE.DoubleSide,
      });

      for (const path of svgData.paths) {
        for (const shape of SVGLoader.createShapes(path)) {
          const geo = new THREE.ExtrudeGeometry(shape, {
            depth: 6, bevelEnabled: true, bevelThickness: 1,
            bevelSize: 0.8, bevelSegments: 3, curveSegments: 12,
          });
          geo.computeVertexNormals();
          group.add(new THREE.Mesh(geo, mat));
        }
      }

      // Center + scale + flip Y
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const sz = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;
      group.position.sub(center);
      group.scale.set(2.2 / maxDim, -2.2 / maxDim, 2.2 / maxDim);
      scene.add(group);

      const t0 = performance.now();
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        const t = (performance.now() - t0) / 1000;
        group.rotation.y = t * 0.4;
        group.position.y = Math.sin(t * 0.8) * 0.1;
        renderer.render(scene, camera);
      };
      rafId = requestAnimationFrame(animate);

      cleanupRef.current = () => {
        cancelAnimationFrame(rafId);
        mat.dispose();
        group.traverse((c) => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose(); });
        renderer.dispose();
        renderer.forceContextLoss();
      };
    })();

    return () => { disposed = true; cleanupRef.current?.(); };
  }, [idx, data.paths]);

  return (
    <div style={{
      minHeight: "100vh", background: "#04020d",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", position: "relative", zIndex: 1, gap: "1rem",
    }}>
      <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "rgba(240,236,255,0.9)" }}>
        {data.name}
      </h1>
      <p style={{ color: "rgba(196,185,228,0.5)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
        {idx + 1} of {SYMBOLS.length}
      </p>
      <canvas ref={canvasRef} width={700} height={700} style={{ width: 350, height: 350, display: "block" }} />
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <Btn onClick={() => setIdx((i) => (i - 1 + SYMBOLS.length) % SYMBOLS.length)}>Prev</Btn>
        <Btn onClick={() => setIdx((i) => (i + 1) % SYMBOLS.length)}>Next</Btn>
      </div>
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "0.5rem 1.2rem", borderRadius: "999px", cursor: "pointer",
      fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" as const,
      fontFamily: "var(--font-heading)", border: "1px solid rgba(200,185,255,0.1)",
      background: "rgba(255,255,255,0.04)", color: "rgba(196,185,228,0.7)",
    }}>{children}</button>
  );
}
