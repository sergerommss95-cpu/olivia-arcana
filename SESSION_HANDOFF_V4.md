# Olivia Arcana — Session Handoff V4

**Date:** 2026-04-16
**Previous:** [`SESSION_HANDOFF_V3.md`](./SESSION_HANDOFF_V3.md) (2026-04-06)
**Read first. Then `brain/Olivia Arcana.md` for project context.**

---

## TL;DR — Where We Are

- **Deck:** 78 cards regenerated in flat-digital v3 style via Vertex AI. Done.
- **Pipeline:** Full GCP production infrastructure deployed (Cloud Run + Scheduler + GCS + Secrets + Cloud Build). Done.
- **Posting:** Blocked — API keys are placeholders in Secret Manager, and TikTok Content Posting API application not yet submitted.
- **Video creative:** 15+ failed iterations. Current state is a MarchingCubes petri-dish sandbox at `social-pipeline/r3f-orb/`. Technically works; brand fit is questionable.
- **Remotion migration:** Plan approved at `~/.claude/plans/fancy-munching-book.md`. Scaffold partially in place at `social-pipeline/remotion-video/`. Not integrated into daily pipeline yet.

**Git:** 9 modified + 10 untracked directories on `main`. Not yet committed — needs to be split into logical chunks.

---

## What's New Since V3 (2026-04-06 → 2026-04-16)

### Deck generator
- `tarot-deck/generator/prompts.py` — added `build_prompt_v3` with `GLOBAL_V3_STYLE_PREFIX` for flat-digital (no physical-card simulation)
- `tarot-deck/generator/gemini_client.py` — added `use_v3` flag support + `NB_V3_OUTPUT_DIR`
- Output: 78 cards at `tarot-deck/generator/output/nano_banana_v3/`

### Social pipeline — GCP deployment
New files (all untracked):
- `social-pipeline/Dockerfile` — Python 3.11-slim + ffmpeg
- `social-pipeline/cloudbuild.yaml`
- `social-pipeline/deploy.sh` — one-command deploy
- `social-pipeline/.dockerignore`
- `social-pipeline/scripts/gcs_client.py` — GCS upload/download
- `social-pipeline/poster/Dockerfile` + `main.py` — FastAPI poster service
- `social-pipeline/scripts/daily_pipeline.py` (modified)

### Remotion video — scaffolded
- `social-pipeline/remotion-video/` — Root + ZodiacDaily + ColorProphecy + components + fonts + types. `node_modules` installed. **Not integrated into daily pipeline yet.**

### R3F orb — video creative sandbox
- `social-pipeline/r3f-orb/` — React + Vite + @react-three/fiber + drei + postprocessing
- `src/App.jsx` — MarchingCubes petri dish (12 metaballs, green semi-transparent liquid, cream bottom, metallic ring)
- `src/InnerSwirl.jsx`, `src/Particles.jsx` — supporting components
- `public/studio.hdr` — local HDR (polyhaven studio_small_09_1k)

### Website (modified, not yet committed)
- `website/src/components/CosmicSelfie.tsx`
- `website/src/components/LessonList.tsx`
- `website/src/components/oracle/LiquidMaskEngine.ts`
- `website/src/components/sacred-symbols/Symbol2DFallback.tsx`
- `website/src/app/symbols-test/page.tsx`
- `website/public/cosmic-selfie/nebula.png`

---

## Current State by Component

### 🟢 Deck (complete)
- **78 cards** at `tarot-deck/generator/output/nano_banana_v3/`
- Style: flat digital, gold-on-navy engraving, no physical-card artifacts
- Generator supports `--v3` flag; seed anchor system still in use (see [[Patterns#Global Seed]])

### 🟢 GCP Infrastructure (deployed, waiting for keys)
| Component | Resource | Status |
|-----------|----------|--------|
| Pipeline | Cloud Run **Job** | Deployed ✅ |
| Poster | Cloud Run **Service** (FastAPI) | Deployed ✅ |
| Storage | GCS bucket `olivia-arcana-daily` | Active ✅ |
| Scheduler | Cloud Scheduler | Configured ✅ |
| Secrets | Secret Manager | **Placeholders only** ⚠️ |
| CI/CD | Cloud Build + Artifact Registry | Working ✅ |

**Project:** `project-f778abe0-d2d9-47df-802` · **Region:** `us-central1`

Deploy script: `./social-pipeline/deploy.sh [pipeline|poster|all]`

### 🟡 Remotion Video (scaffolded, not integrated)
- Code at `social-pipeline/remotion-video/`
- Studio preview: `cd social-pipeline/remotion-video && npx remotion studio`
- **Migration plan:** `~/.claude/plans/fancy-munching-book.md` — 5 steps, approved, not executed
- Integration point: `USE_REMOTION=1` env var in `daily_pipeline.py`

### 🟡 R3F Orb (R&D only, not production)
- Dev server: `cd social-pipeline/r3f-orb && npm run dev` → http://localhost:5173
- Current look: top-down petri dish, Le Jardin-inspired
- **Not used anywhere** — purely for figuring out the TikTok video aesthetic
- Open question: is this even the right visual direction for a tarot brand?

### 🔴 Posting (blocked)
- API keys in Secret Manager are PLACEHOLDERS
- TikTok Content Posting API application **not yet submitted** (~2 week approval)
- Pipeline will run end-to-end but posting calls will fail

---

## Environment / Secrets

### Local dev
```bash
export ANTHROPIC_API_KEY="..."
export ELEVENLABS_API_KEY="..."
# ffmpeg must be on PATH
```

### Cloud Run (Secret Manager — needs real values)
| Secret | Status |
|--------|--------|
| `EL_API_KEY` | placeholder |
| `TIKTOK_CLIENT_KEY` | placeholder |
| `TIKTOK_CLIENT_SECRET` | placeholder |
| `IG_ACCESS_TOKEN` | placeholder |
| `YT_OAUTH_TOKEN` | placeholder |

Update via:
```bash
echo -n "REAL_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=- --project=project-f778abe0-d2d9-47df-802
```

### Fixes already applied during deployment
- Granted `storage.admin`, `logging.logWriter`, `artifactregistry.writer` to `593244157073-compute@developer.gserviceaccount.com`
- Removed machine-type override from `cloudbuild.yaml` (was hitting E2_HIGHCPU_8 quota)

---

## How To Pick Up — Three Clean Paths

Pick ONE. Don't fork.

### Path A: Ship the pipeline (highest ROI — infra is built)
1. Get real API keys (ElevenLabs subscription, Meta Graph token, YouTube OAuth)
2. Submit TikTok Content Posting API application
3. Populate Secret Manager with real values
4. Run a manual dry-run: `gcloud run jobs execute olivia-pipeline --region=us-central1`
5. Fix what breaks, then let Scheduler take over

### Path B: Execute Remotion migration (plan is ready)
1. Open `~/.claude/plans/fancy-munching-book.md`
2. Continue from Step 1 (Remotion project exists but not integrated)
3. Integration point is `scripts/generate_video_remotion.py` (stub exists) + `USE_REMOTION=1` toggle in `daily_pipeline.py`
4. Add Node.js layer to `social-pipeline/Dockerfile`
5. Verify 12 videos render correctly on mobile 9:16

### Path C: Nail the video creative direction (longest unlock)
- Don't iterate on r3f-orb more. The decision from 2026-04-14 still stands: **start with footage, not code** ([[Key Decisions#Video Creative Direction]]).
- Generate 3–5 second clips of actual Olivia concepts (liquid gold, oracle's table, ink in water) via Wan2.1 or Kling
- Pick one, then build Remotion around the winning footage
- R3F orb is for the website, not for video

---

## Known Blockers

1. **API keys** — placeholders in Secret Manager. Can't post until real.
2. **TikTok API approval** — ~2 week wait once submitted.
3. **Git hygiene** — 9 modified + 10 untracked, needs commit split: `(a) v3 deck generator (b) GCP deployment (c) remotion scaffold (d) r3f-orb sandbox (e) website tweaks`.
4. **Video aesthetic unresolved** — MarchingCubes petri dish works technically but may not fit the brand. Needs a product-level decision, not more iteration.

---

## Open Research Threads (asked, never answered)
- `basement.studio/tools/shader-lab` + `github.com/basementstudio/shader-lab` — how can it help us?
- `github.com/browser-use/video-use` — how good is it for us?

Captured in `brain/Olivia Video Creative.md` under "Open research threads" so they don't get lost again.

---

## Key Files To Read Next Session

| File | Why |
|------|-----|
| `brain/Olivia Arcana.md` | Project overview |
| `brain/Olivia Social Pipeline.md` | GCP deployment state, files, blockers |
| `brain/Olivia Video Creative.md` | Everything tried for TikTok visuals, what failed, what's next |
| `brain/Key Decisions.md` | R3F+drei decision, "start with footage not code" |
| `brain/Gotchas.md` | Three.js transmission artifacts, HDR CORS, CSS-not-cinema, broken-concept iteration |
| `~/.claude/plans/fancy-munching-book.md` | Approved Remotion migration plan |

---

## Rules Rediscovered This Session

- **Reference-match first, then question the reference.** Almost copied Le Jardin's visual identity wholesale without asking if a Shopify molecule demo fits a tarot brand. It doesn't.
- **3-iteration rule.** After 3 rounds without a clear "wow", stop tweaking and question the concept. We ran 15+ iterations on CSS/GLSL/Three.js before the insight ("CSS can't create cinematic visuals") finally landed.
- **Start with footage, not code.** Video quality ceiling of code-generated backgrounds is below the floor of real footage. Decision locked in 2026-04-14.
- **Open research threads get dropped on pivot.** Two user questions went unanswered because the conversation moved on. Now tracked explicitly.
