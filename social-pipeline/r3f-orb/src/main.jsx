import React from 'react'
import { createRoot } from 'react-dom/client'
// Toggle between scenes:
// import { App } from './App'             // MarchingCubes petri dish (R3F)
// import { App } from './AppShaderLab'     // shader-lab as background
// import { App } from './AppShaderOrb'     // early prototype
// import { App } from './AppOliviaOrb'     // v1 halftone soul orb
import { App } from './AppLiquidGlassOrb'   // ← v2 Apple Liquid Glass rewrite

createRoot(document.getElementById('root')).render(<App />)

