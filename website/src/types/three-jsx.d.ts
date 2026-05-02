import { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      cosmicShaderMaterial: {
        uniforms?: Record<string, { value: unknown }>;
        fragmentShader?: string;
        vertexShader?: string;
        transparent?: boolean;
      };
    }
  }
}
