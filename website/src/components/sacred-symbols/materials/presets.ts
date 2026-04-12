/**
 * Material presets for 3D extruded symbols.
 *
 * Three tiers:
 *   Gold     — zodiac signs (MeshStandardMaterial, metallic gold)
 *   Glass    — celestial bodies (MeshPhysicalMaterial, crystal)
 *   Holo     — sacred geometry (MeshPhysicalMaterial, iridescent)
 *
 * Materials are created once per preset and reused across instances.
 */

import * as THREE from "three";

export type MaterialPreset = "gold" | "glass" | "holo";

// Shared environment map for reflections (procedural, no HDR file needed)
let _envMap: THREE.Texture | null = null;

function getEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  if (_envMap) return _envMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Procedural gradient environment
  const size = 256;
  const data = new Float32Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const ny = y / size;
      // Deep indigo at bottom → soft lavender at top
      data[i] = 0.02 + ny * 0.12;     // R
      data[i + 1] = 0.01 + ny * 0.08; // G
      data[i + 2] = 0.06 + ny * 0.25; // B
      data[i + 3] = 1.0;
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;

  _envMap = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();

  return _envMap;
}

/** Create a material instance for the given preset. */
export function createMaterial(
  preset: MaterialPreset,
  renderer: THREE.WebGLRenderer,
): THREE.Material {
  const env = getEnvMap(renderer);

  switch (preset) {
    case "gold":
      return new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.85,
        roughness: 0.18,
        envMap: env,
        envMapIntensity: 0.6,
        emissive: 0x8b7020,
        emissiveIntensity: 0.08,
        side: THREE.DoubleSide,
      });

    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: 0xa07ae0,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.85,
        ior: 1.45,
        thickness: 0.6,
        envMap: env,
        envMapIntensity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
      });

    case "holo":
      return new THREE.MeshPhysicalMaterial({
        color: 0xc8b4ff,
        metalness: 0.1,
        roughness: 0.12,
        iridescence: 1.0,
        iridescenceIOR: 1.4,
        iridescenceThicknessRange: [200, 600],
        envMap: env,
        envMapIntensity: 0.7,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
      });
  }
}

/** Default material preset for each symbol category. */
export function defaultPreset(category: string): MaterialPreset {
  switch (category) {
    case "zodiac": return "gold";
    case "celestial": return "glass";
    case "mystical": return "gold";
    case "sacred-geometry": return "holo";
    default: return "gold";
  }
}
