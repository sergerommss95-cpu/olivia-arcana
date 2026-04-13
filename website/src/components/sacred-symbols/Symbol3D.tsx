"use client";

/**
 * Symbol3D — Renders an extruded SVG symbol as an interactive 3D object.
 *
 * Uses a global context pool (max 8 simultaneous WebGL contexts) to avoid
 * hitting Chrome's ~16 context limit. IntersectionObserver gates init/dispose.
 */

import React, { useRef, useEffect, useCallback } from "react";
import type * as THREE from "three";
import type { MaterialPreset } from "./materials/presets";

// Global context counter — Chrome hard-limits ~16, we cap at 8 for safety
let activeContexts = 0;
const MAX_CONTEXTS = 8;

interface Symbol3DProps {
  paths: string[];
  material?: MaterialPreset;
  materialPreset?: MaterialPreset;
  color?: string;
  animate?: "none" | "spin" | "float" | "pulse" | "wobble" | "spinFloat" | "swing";
  size?: number;
  rotationSpeed?: number;
  floatAmplitude?: number;
  mouseParallax?: boolean;
  /** Called if WebGL init fails — parent should show 2D fallback. */
  onError?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function Symbol3D({
  paths,
  material = "gold",
  size = 100,
  rotationSpeed = 0.3,
  floatAmplitude = 0.12,
  mouseParallax = true,
  onError,
  className,
  style,
}: Symbol3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const initScene = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check context budget
    if (activeContexts >= MAX_CONTEXTS) {
      onError?.();
      return;
    }

    try {
      const THREE = await import("three");
      const { SVGLoader } = await import("three/examples/jsm/loaders/SVGLoader.js");
      const { createMaterial } = await import("./materials/presets");

      const dpr = Math.min(window.devicePixelRatio, 2);
      activeContexts++;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(dpr);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 3.5);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const key = new THREE.DirectionalLight(0xfff4e0, 1.2);
      key.position.set(2, 3, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc790ff, 0.5);
      rim.position.set(-3, 1, -2);
      scene.add(rim);

      // Parse SVG and extrude
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        ${paths.map((d) => `<path d="${d}" fill="black" stroke="black" stroke-width="2"/>`).join("\n")}
      </svg>`;

      const loader = new SVGLoader();
      const svgData = loader.parse(svgMarkup);
      const group = new THREE.Group();
      const mat = createMaterial(material, renderer);

      const extrudeSettings = {
        depth: 4,
        bevelEnabled: true,
        bevelThickness: 0.8,
        bevelSize: 0.6,
        bevelSegments: 3,
        curveSegments: 12,
      };

      for (const path of svgData.paths) {
        const shapes = SVGLoader.createShapes(path);
        for (const shape of shapes) {
          const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          geo.computeVertexNormals();
          group.add(new THREE.Mesh(geo, mat));
        }

        // Stroke paths → tube geometry
        if (path.subPaths?.length) {
          for (const subPath of path.subPaths) {
            const pts = subPath.getPoints(24);
            if (pts.length < 2) continue;
            const curve = new THREE.CatmullRomCurve3(
              pts.map((p) => new THREE.Vector3(p.x, p.y, 2)),
              false,
            );
            group.add(new THREE.Mesh(
              new THREE.TubeGeometry(curve, 20, 0.8, 6, false),
              mat,
            ));
          }
        }
      }

      // Center + scale
      const box = new THREE.Box3().setFromObject(group);
      if (box.isEmpty()) {
        // No geometry created — SVG paths might not produce fill shapes
        // Fall back to tube-only approach
        onError?.();
        activeContexts--;
        renderer.dispose();
        renderer.forceContextLoss();
        return;
      }

      const center = box.getCenter(new THREE.Vector3());
      const boxSize = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);
      group.position.sub(center);
      group.scale.setScalar(2.0 / maxDim);
      group.scale.y *= -1; // Flip Y (SVG is top-down)
      scene.add(group);

      // Animation
      const t0 = performance.now();
      let lastFrame = t0;

      const animate = () => {
        rafRef.current = requestAnimationFrame(animate);
        const now = performance.now();
        const elapsed = (now - t0) / 1000;
        const dt = Math.min((now - lastFrame) / 1000, 0.05);
        lastFrame = now;

        if (rotationSpeed) group.rotation.y = elapsed * rotationSpeed;
        if (floatAmplitude) group.position.y = Math.sin(elapsed * 0.8) * floatAmplitude;
        if (mouseParallax) {
          group.rotation.x += (mouseRef.current.y * 0.3 - group.rotation.x) * 2.5 * dt;
          group.rotation.z += (mouseRef.current.x * -0.2 - group.rotation.z) * 2.5 * dt;
        }
        renderer.render(scene, camera);
      };

      rafRef.current = requestAnimationFrame(animate);

      cleanupRef.current = () => {
        cancelAnimationFrame(rafRef.current);
        group.traverse((c) => { if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose(); });
        mat.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        activeContexts--;
      };
    } catch (err) {
      console.warn("[Symbol3D] WebGL init failed:", err);
      onError?.();
    }
  }, [paths, material, size, rotationSpeed, floatAmplitude, mouseParallax, onError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let initialized = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !initialized) {
          initialized = true;
          initScene();
        } else if (!entry.isIntersecting && initialized) {
          cleanupRef.current?.();
          cleanupRef.current = null;
          initialized = false;
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      mouseRef.current.y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    };
    if (mouseParallax) window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      observer.disconnect();
      cleanupRef.current?.();
      if (mouseParallax) window.removeEventListener("mousemove", onMouseMove);
    };
  }, [initScene, mouseParallax]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, display: "block", ...style }}
      aria-hidden="true"
    />
  );
}
