# September 11 — hero and Tide Opens predecessor

This is a deduplicated historical reference, separate from the current product. Original sources were inspected and copied read-only; no source repository history was rewritten. Files here should not be deployed over the active website.

This session preserves the early Olivia hero, its Arrival revision, and the subsequent Tide Opens sequence. Useful starting points in the reconstructed snapshot:

- `outputs/olivia-arcana-hero/README.md`, `DESIGN_SYSTEM.md`, `index.html` and `index.modular.html`.
- `outputs/olivia-arcana-tide/README.md`, `ASSETS.md`, `DESIGN_SYSTEM.md`, `app.js`, `world.glsl` and `storyboard.html`.
- `work/archive-v1/olivia-arcana-hero/` for the preceding design.
- `work/generated/` and `work/generated-v2/` for generated artwork and available generation prompts.
- `_external/generated-images/` for original image-generator outputs associated with this session. Three originals match preserved project files; two further Olivia artwork iterations are retained separately.

The supplied `user-photo.png` was visually inspected: it is the fictional Olivia celestial seascape used as brand artwork, not an unrelated personal photograph. It and its project derivatives are retained. The additional generated images were also inspected and depict the Olivia figure and a moonlit classical sanctuary. Their historical presence does not mean that they are the currently approved art direction.

## Read and reconstruct

`files/` contains the unique retained artifacts. `manifest.json` maps every inventoried source file to its preserved destination and SHA-256 checksum, or records why it was excluded. Exact duplicates point to current repository files or another retained historical file. Use a complete checkout of the Git commit containing this manifest (or the complete handoff archive). This session folder alone is not sufficient: duplicate paths resolve against the repository root at that same revision.

To reconstruct the included snapshot in a new directory outside this repository, run:

```sh
python3 history/sessions/2026-09-11-hero/restore-snapshot.py /tmp/2026-09-11-hero-restored
```

The helper verifies every retained file before writing, refuses existing destinations, and leaves this repository untouched. External generator originals appear under `_external/generated-images/` in the restored snapshot. If a shared current file later changes, verification stops rather than silently reconstructing the wrong historical bytes; use this handoff's Git revision to restore that file first.

## Scope and limits

- Preserved: unique source code, prototype HTML/CSS/JS/shaders, generated project artwork, project documents, patches, tests/tools, fonts and associated license files where present. A duplicate may exist only through a manifest mapping until the snapshot is reconstructed.
- Omitted: raw session records, screenshots and QA frame/mockup directories, transient browser/command dumps, environment/credential files, databases, dependencies, build output, caches, Git metadata, local deployment state and redundant ZIP packages. Whole omitted directory trees are explicit manifest entries.
- Historical absolute user-home paths in retained text were changed to `<LOCAL_HOME>`; adapt those paths before running old development tools. No credential values were detected by the archive scan. The manifest describes the scan's scope and limits.
- Self-contained prototype HTML is preserved when present. Modular pages require reconstruction so mapped assets return to their expected relative locations. Historical applications still need suitable dependencies and new local environment configuration.
- Historical QA/deployment claims in original documents describe that session. They are context, not current verification or permission to deploy.

This inventory contains **72 unique files**, maps **57 duplicates**, and adds approximately **35.99 MB** of source/artwork before this README, helper and manifest.
