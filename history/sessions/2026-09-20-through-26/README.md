# September 20–26: design, motion and product history

This is a **historical archive**, not the current product. Start current development from [SESSION_HANDOFF.md](../../../SESSION_HANDOFF.md) and `experience/work/olivia-product/`. Restoring this archive does not change the approved hero or roll back the mobile fixes.

This collection preserves 3,007 recoverable file versions/paths from the September 20 workspace, all 17 project ZIP containers, and all 78 images generated in this task. The ZIP snapshots matter: the September 24 product and September 25 release candidate contain earlier source files that had since been overwritten in the working directory. Those versions are retained separately.

The archive contains 1,634 unique content objects. Identical content already in Git points to immutable commit `5a7b12e0433075266d649db1ffc0d8ab8a352eae`; duplicate embedded images share one stored original. A restoration tool reconstructs the exact original bytes and verifies SHA-256. One preset JSON is intentionally sanitized: its signed thumbnail URL was removed, while its shader configuration remains. It is marked in the manifest with both original and sanitized checksums.

## Where to look

Names below are original paths in the `workspace` collection. List or restore them with the commands in the next section. Version names record the files that existed; they are not evidence that each version was approved.

| Work | Preserved original paths | What it explains |
|---|---|---|
| Early Three.js studies | `work/app.js`, `work/template.html`, `work/before-upgrade/`, `work/before-materials/`, `work/before-artwork/`, `outputs/olivia-arcana.html` | The starting composition, material and artwork experiments |
| Card-back explorations | `outputs/card-back-options*/`, `outputs/card-back-atelier*/`, `outputs/card-backs-ornamental/`, `outputs/card-back-art-01-05/`, `outputs/card-back-art-06-10/` | Original raster/vector designs, prompts and galleries |
| Identity and rejected directions | `outputs/olivia-identity/`, `outputs/olivia-threshold/`, `outputs/olivia-threshold-atlas/`, `outputs/olivia-three-directions/`, `outputs/olivia-living-weave/`, `outputs/olivia-weave-reimagined/` | Logo, threshold, inlay, weave and engraving explorations |
| Chosen olive lattice | `outputs/olivia-card-back-olive-lattice.png`, `outputs/olivia-card-back.webp`, `outputs/olivia-card-back-selection.json`, `outputs/olive-refinement/` | Selected back artwork and its selection record |
| Hero choreography | `work/hero-motion/`, `work/hero-v2/` through `work/hero-v12/`, `outputs/olivia-hero-motion-spec.md`, `outputs/olivia-hero-*-preview.html` | Editable motion revisions and surviving rendered HTML snapshots |
| Motion research | `work/card-motion-research.md`, `work/studio-motion-research.md`, `work/motion-code-audit.md` | References and implementation decisions |
| Background studies | `work/background-study/`, `work/light-leaks/`, `outputs/olivia-backgrounds.html`, `outputs/olivia-light-leaks-original.html`, `outputs/olivia-light-leaks.html` | Shader comparison, selected preset and card-matched palette |
| Editorial hero | `work/editorial-hero/`, `outputs/olivia-editorial.html` | Typography and product-entry revisions |
| Approved motion reference | `outputs/olivia-approved-motion-2026-09-24.html`, adjacent JSON | Reference provenance; use the current handoff to identify production authority |
| Product evolution | `work/olivia-product/`, `snapshots/product-evolution-before/`, `snapshots/hero-affordance-before/`, `snapshots/product-evolution-site-before/` | Spreads, readings, localization, mobile and pre-change snapshots |
| Earlier published bundles | `outputs/olivia-experience/`, `outputs/olivia-almanac.html` | Surviving hashed JS/CSS revisions and exact standalone product HTML |
| Strategy and release evidence | `outputs/olivia-competitive-study.md`, `outputs/olivia-product-strategy.md`, `outputs/olivia-product-evolution.md`, release JSON/Markdown and QA reports | Product reasoning, deployments and validation limits |
| Additional generated originals | `generated-iterations` collection | All 78 known task-generated PNGs, including 15 not found in the workspace outputs |

## Restore or inspect

Run these from the repository root with Python 3 and Git. No additional packages or network access are needed for a full clone containing the pinned commit.

```sh
# Show the exact collection names.
python3 history/sessions/2026-09-20-through-26/restore.py --list

# List the preserved original workspace paths.
python3 history/sessions/2026-09-20-through-26/restore.py --list --collection workspace

# Reconstruct the historical workspace in a new, separate directory.
python3 history/sessions/2026-09-20-through-26/restore.py --collection workspace --output /tmp/olivia-history-sep20-26

# Or recover one exact motion preview only.
python3 history/sessions/2026-09-20-through-26/restore.py --collection workspace --path outputs/olivia-hero-v11-preview.html --output /tmp/olivia-hero-v11-reference

# Recover the earlier September 24 product snapshot.
python3 history/sessions/2026-09-20-through-26/restore.py --collection zip/olivia-product-2026-09-24 --output /tmp/olivia-product-sep24

# Recover the later personal-practice release candidate source snapshot.
python3 history/sessions/2026-09-20-through-26/restore.py --collection zip/olivia-personal-practice-release-candidate --output /tmp/olivia-personal-practice-snapshot

# Validate all retained objects, including original embedded image bytes.
python3 history/sessions/2026-09-20-through-26/restore.py --verify
```

The tool refuses to overwrite files and refuses restoration inside the active repository. Historical build scripts can contain old absolute paths or obsolete assumptions; inspect them before running. Exact HTML snapshots are useful references even where an earlier build workflow is no longer portable. For a shallow clone missing the pinned commit, fetch the handoff branch history first.

## Deliberate omissions and limits

The [manifest](manifest.json) records every inspected workspace path and ZIP member, its collection and inclusion/exclusion reason. It also lists the original ZIP hashes. The ZIP container bytes are not retained; their useful members are retained. Nested copies of the same ZIP are recognized by hash.

Excluded: 1,064 QA screenshot/video captures, 3,844 generated Next export files from the release ZIP (the source and standalone HTML are preserved), and 8 machine-local metadata/log files. Installed dependencies and build caches were not inventoried recursively. Raw private attachments and conversation transcripts were not copied. Current QA evidence remains in the product handoff; this archive is not a claim that every historical rendering was correct.

This preserves the surviving files found during the audit. It cannot reconstruct unsaved editor states, overwritten files that never had a snapshot, or undocumented actions in another tool. It does not claim every intermediate animation ever shown is recoverable. All retained objects passed byte-for-byte checksum verification; the one signed-thumbnail sanitization is explicitly recorded.
