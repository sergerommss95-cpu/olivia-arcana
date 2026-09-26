# September 13 — premium UX, integrations and code handoffs

This is a deduplicated historical reference, separate from the current product. Original sources were inspected and copied read-only; no source repository history was rewritten. Files here should not be deployed over the active website.

The original five September 14–15 commits are also preserved on GitHub branch `archive/premium-atlas-2026-09-15` at `1aee01e223209a84557d57c5e0d0073d84180f74`. Use that branch for exact original commit ancestry; use the current handoff branch for continued product development.

This session preserves the premium UX revision, its source changes, prototype assets, integration notes, review documents, and exported code/patch handoffs. Useful starting points in the reconstructed snapshot:

- `outputs/Olivia-Arcana-Claude-Implementation-Handoff.md` and `outputs/Olivia-Arcana-Complete-Code.md` for exported implementation context.
- `outputs/Olivia-Arcana-DeepSeek-Upgrades-Code.md` and the preserved patches for the upgrade work.
- `outputs/Implementation-and-Verification.md` and the focused integration notes in `work/`.
- `work/deepseek-reference/` for the supplied sky and tarot HTML prototypes.
- `work/olivia-arcana/website/` for the historical Next application source, including chart, sky, arrival, oracle and almanac work.

The nested `work/olivia-arcana` repository was inspected read-only. Its worktree was clean at commit `1aee01e223209a84557d57c5e0d0073d84180f74`. Many source files were already byte-identical to the handoff repository and are mapped there instead of copied again. Its tracked build output was omitted. `work/olivia-arcana-incomplete` contained Git metadata but no HEAD or tracked project files, so it contributes no source snapshot.

## Read and reconstruct

`files/` contains the unique retained artifacts. `manifest.json` maps every inventoried source file to its preserved destination and SHA-256 checksum, or records why it was excluded. Exact duplicates point to current repository files or another retained historical file. Use a complete checkout of the Git commit containing this manifest (or the complete handoff archive). This session folder alone is not sufficient: duplicate paths resolve against the repository root at that same revision.

To reconstruct the included snapshot in a new directory outside this repository, run:

```sh
python3 history/sessions/2026-09-13-premium-ux/restore-snapshot.py /tmp/2026-09-13-premium-ux-restored
```

The helper verifies every retained file before writing, refuses existing destinations, and leaves this repository untouched. External generator originals appear under `_external/generated-images/` in the restored snapshot. If a shared current file later changes, verification stops rather than silently reconstructing the wrong historical bytes; use this handoff's Git revision to restore that file first.

## Scope and limits

- Preserved: unique source code, prototype HTML/CSS/JS/shaders, generated project artwork, project documents, patches, tests/tools, fonts and associated license files where present. A duplicate may exist only through a manifest mapping until the snapshot is reconstructed.
- Omitted: raw session records, screenshots and QA frame/mockup directories, transient browser/command dumps, environment/credential files, databases, dependencies, build output, caches, Git metadata, local deployment state and redundant ZIP packages. Whole omitted directory trees are explicit manifest entries.
- Historical absolute user-home paths in retained text were changed to `<LOCAL_HOME>`; adapt those paths before running old development tools. No credential values were detected by the archive scan. The manifest describes the scan's scope and limits.
- Self-contained prototype HTML is preserved when present. Modular pages require reconstruction so mapped assets return to their expected relative locations. Historical applications still need suitable dependencies and new local environment configuration.
- Historical QA/deployment claims in original documents describe that session. They are context, not current verification or permission to deploy.

This inventory contains **160 unique files**, maps **593 duplicates**, and adds approximately **9.80 MB** of source/artwork before this README, helper and manifest.
