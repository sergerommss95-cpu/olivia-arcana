# OpenMontage Study — Patterns for Olivia Arcana Video Pipeline

## Architecture Overview

OpenMontage is a YAML-driven video production framework. An LLM agent walks through pipeline stages defined in manifests, producing JSON artifacts validated against schemas, with Remotion as the composition engine.

## What to Steal

### 1. Pipeline Manifest YAML (steal this)
Each video type is a YAML file in `pipeline_defs/`. Key structure:
- `stages[]` with `skill`, `produces`, `tools_available`, `checkpoint_required`
- `review_focus` (checklist strings) and `success_criteria` per stage
- `orchestration.budget_default_usd` — budget cap before rendering starts

For Olivia zodiac videos, one manifest could drive all 12 signs:
```yaml
name: zodiac-daily
stages:
  - name: script
    produces: [script]
    tools_available: [tts_selector]
  - name: assets
    produces: [asset_manifest]
    tools_available: [image_selector, tts_selector, music_gen]
  - name: compose
    produces: [render_report]
    tools_available: [video_compose]
```

### 2. Provider Scoring (steal the weights, skip the Python)
7-dimension scoring in `lib/scoring.py`: task_fit(0.30), output_quality(0.20), control(0.15), reliability(0.15), cost_efficiency(0.10), latency(0.05), continuity(0.05). For Olivia we only need 2-3 providers (Flux for images, ElevenLabs for TTS, local music), so a simple comparison table in the manifest suffices — no need for the full Python scoring engine.

### 3. Delivery Promise (steal the concept)
`lib/delivery_promise.py` classifies what the video promises (motion_led vs data_explainer etc.) and prevents silent downgrade. For Olivia: lock the promise at "motion_led" for zodiac videos — never silently fall back to still slideshows.

### 4. Remotion Components (steal patterns, rewrite for Olivia brand)
Key components in `remotion-composer/src/`:
- **ThemeConfig** (`Root.tsx`) — colors, fonts, spring configs per style. Olivia needs one theme: mystic purples/golds.
- **HeroTitle** — per-character spring animation with staggered delay. Good for sign name reveals.
- **CaptionOverlay** — word-level highlight captions (TikTok style). Essential for short-form.
- **Explainer.tsx** — scene router that renders cut types (text_card, stat_card, hero_title, etc.) via a switch statement on `scene.type`.

The `Sequence`-based scene routing pattern is clean:
```tsx
{scenes.map((scene, i) => (
  <Sequence from={scene.startFrame} durationInFrames={scene.duration}>
    <SceneRenderer scene={scene} theme={theme} />
  </Sequence>
))}
```

### 5. Quality Gates (steal the reviewer protocol)
`skills/meta/reviewer.md` — every stage artifact gets reviewed against `review_focus` items from the manifest before proceeding. Schema validation first, then checklist, then playbook cross-check. Severity levels: critical/suggestion/nitpick. Adopt this as a brain/ note.

## What's Overengineered (skip)

- **Full Python scoring engine** — we have 2-3 fixed providers, not a marketplace
- **12 pipeline def variants** — Olivia needs 1-2 (zodiac-daily, zodiac-weekly)
- **Checkpoint system** (`lib/checkpoints/`) — multi-stage human approval for each run. Olivia videos are templatized; batch-approve the template, auto-run daily
- **Skill hierarchy** (core/creative/meta/pipelines) with 50+ markdown files — our brain/ system is simpler and sufficient
- **JSON schema validation** for every artifact — useful at scale, premature for daily zodiac content

## Key File Paths

| Pattern | Path |
|---------|------|
| Pipeline manifests | `pipeline_defs/*.yaml` |
| Remotion compositions | `remotion-composer/src/Explainer.tsx`, `Root.tsx` |
| Theme system | `remotion-composer/src/Root.tsx` (ThemeConfig interface) |
| Reusable components | `remotion-composer/src/components/` |
| Provider scoring | `lib/scoring.py` (ProviderScore dataclass) |
| Delivery promise | `lib/delivery_promise.py` |
| Quality gate protocol | `skills/meta/reviewer.md` |
| Style playbooks | `styles/*.yaml` |
