/**
 * RelicScene.tsx — The 3D stage for the Celestial Portrait
 */

"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  Stage
} from "@react-three/drei";
import AlchemicalRelic from "./AlchemicalRelic";
import { type Portrait3DConfig } from "../../lib/portrait-v4";

export default function RelicScene({ config }: { config: Portrait3DConfig }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas dpr={[1, 2]} shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={40} />
          
          <Stage intensity={0.5} environment="night" shadows={false} adjustCamera={false}>
            <AlchemicalRelic config={config} />
          </Stage>

          <ContactShadows 
            position={[0, -0.2, 0]} 
            opacity={0.6} 
            scale={10} 
            blur={2} 
            far={1} 
            color="#000000" 
          />
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 2.2} 
            autoRotate 
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
