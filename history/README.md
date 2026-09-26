# Olivia Arcana — project history and archive

Preservation pass: 26 September 2026. **For current work, read [SESSION_HANDOFF.md](../SESSION_HANDOFF.md) first.** This archive is historical evidence, not another production source tree.

## What this handoff means

The current product, editable source, artwork, approved motion reference, service handlers, tests, release records and continuation instructions are preserved on the GitHub branch `codex/session-handoff-2026-09-26`, linked to draft PR #3. They are **not merged into `main`**. A new AI should check out this branch, not assume GitHub's default branch contains the latest product.

The September 26 archive pass adds recoverable earlier design work that lived outside the main repository. A file snapshot preserves its saved contents; it does not recover every intermediate editor state. Many iterations were originally edited in place, then packaged much later. Do not infer that each change has its own Git commit.

Five additional September 14–15 commits from the separate premium-UX checkout are preserved with their original ancestry on [`archive/premium-atlas-2026-09-15`](https://github.com/sergerommss95-cpu/olivia-arcana/tree/archive/premium-atlas-2026-09-15), at `1aee01e223209a84557d57c5e0d0073d84180f74`. This is an archival branch, not the branch for current development.

## Where to look

| Need | Start here |
| --- | --- |
| Continue the current product safely | [Current handoff](../SESSION_HANDOFF.md) |
| Rebuild the product | [Editable experience instructions](../experience/README.md) |
| Understand accepted and rejected directions | [Decision history](DECISIONS.md) |
| Understand what is on GitHub and what remains outside | [Git coverage audit](git-coverage-2026-09-26.md) and session manifests below |
| Recover earlier hero prototypes | `sessions/2026-09-11-hero/` and `sessions/2026-09-20-through-26/` |
| Review the earlier premium UX / tarot / sky studies | `sessions/2026-09-13-premium-ux/` |
| Read the separate competitor study and view its concepts | [September 20 research](sessions/2026-09-20-competitor-research/README.md) |
| Review current product strategy and competitor lessons | [Product strategy](../experience/outputs/olivia-product-strategy.md), [competitive study](../experience/outputs/olivia-competitive-study.md) |
| Understand commercial launch limits | [Current handoff](../SESSION_HANDOFF.md), then the dated [launch audit](../experience/outputs/olivia-launch-readiness.md) |
| Inspect current mobile release evidence | [Mobile v3 review](../experience/outputs/qa-mobile-v3/review.md) |

Each session archive has its own README and manifest describing source provenance, checksums, deduplication and exclusions. Consult those before opening or rebuilding old prototypes. Historical scripts can contain original absolute paths or reference old servers; do not execute them against the current product without inspection.

## Tasks identified and reviewed

The task titles below are the original titles, not names invented for this archive. The task listing exposed these four relevant Codex tasks; no archived Codex tasks were returned at inspection time. This does not prove there are no other conversations or external assistants' work.

| Task | Scope preserved or referenced |
| --- | --- |
| **Design animated hero page** | September 11–12 predecessor: original Olivia figure, arrival/levitation, Tide Opens prototype, artwork and design-system handoffs. The last visible critique rejected the execution; this is not the approved current hero. |
| **Upgrade Olivia Arcana premium UX** | September 13–15 predecessor: performance, continuous sections, card interaction, chart/sky studies, original code and Claude implementation handoff. Later repository history records related integration work. |
| **Research Olivia Arcana competitors** | September 20: eight competitors, seven visual/motion references, product recommendations, generated desktop/mobile concepts and prompts. These were static concepts. |
| **Redesign Olivia Arcana HTML** | September 20–26: original card/identity explorations, hero revisions, selected back and motion, shader/editorial studies, product/spreads/78 cards, personal practice, EN/UK, question-aware readings, deployments and mobile revisions. Current product source is in `experience/`, not this archive. |

Task messages were used to establish context. Raw chat transcripts, internal reasoning, personal sidebar screenshots, account state and credentials are not published. The reusable project decisions are summarized in [DECISIONS.md](DECISIONS.md).

## Coverage and limits

- Every recent commit found in the inspected primary repository for September 16–26 was already reachable from the pushed handoff branch before this archival pass. See the exact refs and reconciliation in the Git audit.
- Current editable source and generated production assets were preserved previously. This pass fills gaps in the earlier workspace artifacts; it does not replace current files with the older workspace copies.
- Historical release ZIPs often duplicate an entire workspace. Their useful unique members are considered separately; the session manifest records what was preserved and why package files or intermediate render captures were omitted.
- An old preview URL such as `?motion=v5` or `?revision=card-palette` is not a version-control system. Some query parameters only changed a cache key or selected a runtime mode while the underlying file continued to change. Exact saved snapshots and hashes are stronger evidence than a URL suffix.
- Screenshots demonstrate an appearance, not the full implementation. A missing unsaved revision cannot be reconstructed exactly from a screenshot. Such gaps are not silently described as complete history.
- Separate older April–August branches and artwork experiments exist outside the roughly ten-day scope. Their counts and status are documented in the Git audit; this archive does not claim that all historical work by every tool or assistant has been published.
- Dependencies, environments, caches, credentials, unrelated personal files and redundant generated output are intentionally excluded. Where source/art is deduplicated, the manifest gives its retained location or content reference.

## Status of this archival pass

This pass changes documentation and historical preservation only. It does not deploy a new site, replace the hero, change card drawings or alter the personal-reading service. The current production release remains the one recorded in `SESSION_HANDOFF.md`.

Build and behavioral test results cited in older notes belong to those releases. Archive integrity checks establish that files were copied and can be recovered; they do not establish that old prototypes still run against today's external services.

See [the archive verification record](VERIFICATION.md) for the checks performed during publication.
