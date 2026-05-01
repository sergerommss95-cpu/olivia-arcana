# Olivia Arcana — Project Codex Handoff
**Date:** Thursday, April 30, 2026
**Status:** Production Live (Success)
**Current Branch:** `main` (synchronized with `origin/main`)

## 1. Executive Summary
This session focused on resolving a critical build blocker in the **Living Orb** component and finalizing a high-stakes deployment involving the **Witness Engine (V4)** and **God-Mode UX**. The repository history was surgically cleaned to remove large binaries and phantom submodules, enabling a clean production push to Netlify.

## 2. Technical Stack
- **Framework:** Next.js 16.2.2 (Turbopack, Static Export)
- **UI:** React 19, Tailwind CSS 4
- **3D/WebGL:** Three.js 0.183.2, `@react-three/fiber`, `@react-three/drei`
- **Motion:** Framer Motion 12, GSAP, `@react-spring/three`
- **Deployment:** Netlify (Primary) + FastAPI (Railway)

## 3. Recent Critical Changes (Today)
### 3.1 Living Orb Fix
- **File:** `src/components/orb/LivingOrb.tsx`
- **Change:** Implemented `mounted` state in `useEffect` to prevent hydration mismatches and resolve a "Cannot find name mounted" TypeScript error that was blocking the build.
- **Visuals:** The orb now correctly initializes WebGL layers only on the client.

### 3.2 Git History & Deployment Recovery
- **Large File Removal:** Surgically removed `chrome-headless-shell` (146MB) from the unpushed history using `git filter-branch`.
- **Submodule Cleanup:** Deleted phantom submodule references to `OpenMontage` and `youtube-shorts-pipeline` which were preventing Netlify's build environment from cloning the repo.
- **Push Success:** History is now linear and clean. Push to GitHub `main` is successful.

## 4. Feature & Design Specifications
### 4.1 Witness Engine (V4)
- **Concept:** "Atmospheric Heartbeat" + "Gravitational Lensing".
- **Path:** `src/components/cosmos/TheWitness.tsx`
- **Implementation:** Custom GLSL shaders for refractive glass effects and ritualistic interaction.

### 4.2 God-Mode UX
- **Concept:** SOTY-tier scrollytelling.
- **Paths:** `src/components/hero/SlashHero.tsx`, `src/components/hero/HeroOverlay.tsx`
- **Design:** Uses an "Arc" system for card reveals and cinematic lighting.

### 4.3 Global Localization
- **Status:** Audit completed for 8 languages.
- **Path:** `src/lib/i18n/useLocale.ts`

## 5. Directory Mapping (High Signal)
| System | Directory / File | Description |
| :--- | :--- | :--- |
| **Orb Component** | `src/components/orb/` | Living Orb (fixed today). |
| **Oracle Logic** | `src/components/oracle/` | Framer Oracle, Tarot 3D, WebGL God Oracle. |
| **Witness Engine** | `src/components/cosmos/` | Flagship shader interactions. |
| **Hero Systems** | `src/components/hero/` | New SlashHero and CardArc systems. |
| **Transitions** | `src/components/transitions/` | Page transition orchestrators. |
| **Public Assets** | `public/cards-portal/` | Tarot card textures/images. |

## 6. Design Decisions
- **Ritual Motion:** All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (Ritual Ease).
- **Dark Mode Only:** Void color is `#06041a`.
- **Static First:** Next.js `output: 'export'` is strictly enforced. No Node.js server-side logic in the frontend.

## 7. Next Steps for Codex
1. **Review original unpushed commits:** Ensure the Witness Intelligence (85/100) and Atmospheric Heartbeat logic are fully calibrated.
2. **Sacred Symbols:** Finalize the `3dsvg` rewrite mentioned in the Phase 9 roadmap (mostly uncommitted files like `Symbol3D.tsx`).
3. **PWA:** Add 192/512 icons to `manifest.json`.

---
**Build Command:** `npx next build`
**Deploy Command:** `netlify deploy --prod --dir=out`
