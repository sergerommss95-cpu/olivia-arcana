# Git history coverage audit — 26 September 2026

**Publication update after the read-only audit:** the coordinating task subsequently pushed the five separate premium-UX commits to `archive/premium-atlas-2026-09-15`. Live GitHub ref verification returned `1aee01e223209a84557d57c5e0d0073d84180f74`. No merge into the current product was performed. Ref tables below describe the earlier inspection point; the additional source history is now preserved remotely.

## Result and scope

All six commits dated **16–26 September 2026** in the inspected Olivia repository are already reachable from GitHub. The latest inspected remote handoff tip was `5a7b12e0433075266d649db1ffc0d8ab8a352eae` on `codex/session-handoff-2026-09-26`.

This is preservation on a pushed branch, **not a merge into `main`**. GitHub's `main` still pointed to `f3795d1` at the time of inspection. The two September 20 commits shown as “ahead 2” on local `main` are ancestors of the pushed handoff, so they are preserved remotely even though they are not yet on remote `main`.

The initial audit covered the primary Olivia checkout, the isolated handoff checkout, all seven local branches in their shared repository, all four remote branch refs, the three registered worktrees, stashes, recent reflog-only history, and the primary checkout's non-ignored changes. A subsequent pass inspected the independent repository in the September 13 Codex workspace, documented separately below. Dates for commit coverage are committer dates. Dates quoted for uncommitted files are filesystem modification times, not proof of when their contents were first created.

Live `git ls-remote` results matched the cached remote refs. No remote tags were advertised. No fetch, source edits, commits, pushes, merges, resets, branch changes, or deployments were performed for this audit. This report is the only file added by the audit task.

## Inspected GitHub refs

| Remote branch | Commit |
| --- | --- |
| `origin/main` | `f3795d157dd3ebe75184d1a8a00ffa1b50c19b7d` |
| `origin/codex/session-handoff-2026-09-26` | `5a7b12e0433075266d649db1ffc0d8ab8a352eae` |
| `origin/redesign/spine` | `f4642456fd71c7f9cb3aa29e3d3da79a2478d83b` |
| `origin/audit/2026-05-04-pricing-brand-drift` | `b02471acb8e371bac6867fb0cc480d21f757d1d6` |

## Local branch coverage

Counts below are commits unreachable from **every inspected remote ref**, rather than commits ahead of a branch's configured upstream.

| Local branch | Inspected tip | Unreachable commits, all dates | Unreachable commits since September 16 |
| --- | --- | ---: | ---: |
| `codex/session-handoff-2026-09-26` | `5a7b12e` | 0 | 0 |
| `main` | `9510387` | 0 | 0 |
| `codex/session-8-compliance-fixes` | `f405cde` | 0 | 0 |
| `redesign/spine` | `2361203` | 0 | 0 |
| `redesign/sprint-3-ab` | `bff7746` | 0 | 0 |
| `redesign/v3-shader-atmosphere` | `00bf07c` | 0 | 0 |
| `legal-protection-phase1` | `e0c153c` | 27 | 0 |

The six recent commits covered by remote history are:

| Date | Commit | Work recorded |
| --- | --- | --- |
| September 19 | `8b2566d` | Arrival artwork and presentation revision |
| September 19 | `f3795d1` | Study presentation and card-facing revision |
| September 20 | `433ffb0` | Funnel, entitlement gates, authentication bridge, question routing, and backend preparation |
| September 20 | `9510387` | Sharing, 78 card pages, and concordance work |
| September 26 | `fdb1968` | Product source, mobile v2, and continuation handoff preservation |
| September 26 | `5a7b12e` | Mobile section layouts and action surfaces |

No stashes or recent reflog-only commits outside existing refs were found.

## Worktrees and uncommitted product work

The three registered worktrees were the primary checkout on `main`, the isolated checkout on the handoff branch, and the April legal worktree on `legal-protection-phase1`.

At the start of the audit, the isolated handoff checkout was clean. During the audit, parallel history-preservation work added nine competitor-research archive files under `history/sessions/2026-09-20-competitor-research/`. Those new files were not part of the inspected pushed tip and were left to the coordinating task to integrate.

The primary checkout had 828 non-ignored status entries: 57 modified tracked files, nine deleted tracked files, and 762 untracked entries, including two nested repository directories. Comparing their file contents with the pushed handoff and its history showed:

- **330 files** exactly matched the current pushed handoff.
- **Four product files** differed from `5a7b12e` but exactly matched pushed commit `fdb1968`: the two generated language entry documents, the generated experience manifest, and the interaction-perimeter source. They are preserved earlier versions superseded by the mobile v3 changes.
- The September master handoff README was fully preserved; the pushed version only prepended two lines.
- One remaining recent difference was a machine-specific editor launch setting, excluded from product-history preservation.
- One tracked deletion was already represented in the handoff. Eight older image deletions were not carried over; the original images remain available in remote history.
- The remaining entries were older artwork or text files and the two nested reference repositories described below.

The April legal worktree's only uncommitted change was a machine-specific editor launch setting dated April 13.

## Older history outside the requested period

### April legal branch

`legal-protection-phase1` has **27 commit objects** from April 13 that are not reachable from the inspected GitHub refs. Patch comparison found 26 distinct patches and one security patch equivalent to work already in remote history.

This branch records the original legal-page, cookie-control, age-gate, checkout-consent, and backend consent-log implementation. Unreachable commit objects do not establish that the current product lacks those features: later implementations can differ or replace them. If complete historical retention beyond September is desired, preserve this branch separately. Do not merge the old implementation into the current product merely to retain its history.

### Older artwork and other local artifacts

There were **481 untracked files, totaling 853,627,227 bytes**, absent by path from the current handoff tree. Their filesystem modification times ranged from May 3 through August 25; none fell within the September 16–26 window.

- **156 purple-backup artwork files** already have exact blob matches in remote history, despite their local backup paths being absent from the current tree.
- **325 files, totaling 831,668,601 bytes**, have no exact blob match in any inspected remote history. These consist of 323 older artwork renders, one older generation script, and one unrelated text artifact. Private or incidental filenames and text contents are intentionally omitted.

The unpublished artwork belongs to the older `deck_final`, `night_v1`, `relief_v1`, `relief_v2`, `seedream_canon`, `seedream_final`, `shadow_bakeoff`, and `stele` experiment families. These are historical candidates for a separate archive, not inputs to merge into the current product without review.

### Nested reference repositories

- `references/OpenMontage` was on `55c08acdd04495e0c01ec87318f5c4c15fe715b7`, with no local commits beyond its cached upstream refs. It contained **27 local source/output changes** dated April 17–18, excluding its dependency environment and voice binaries. Those local adaptations and render outputs are outside the recent Olivia handoff scope.
- `references/youtube-shorts-pipeline` was clean at `acf3c251c179e7f90e7ae31e3d47182837aab733`, with no local commits beyond its cached upstream refs.

Live remote-ref verification applied to the Olivia repository. Nested repositories were compared against their locally cached upstream refs; their external remotes were not refreshed.

## Additional independent repository in the September 13 workspace

A later inspection found a separate Git repository under the September 13 Codex workspace's `work/olivia-arcana` directory. It is not one of the primary repository's three worktrees. Its `origin` points to the same GitHub repository as the primary checkout, but its cached `origin/main` remains at `7ba2cfa77d9c6510df74d0722b7ab95c12c50652`.

The checkout was clean on `codex/premium-atlas`, at **`1aee01e223209a84557d57c5e0d0073d84180f74`**. Comparing its entire local branch ancestry against every live-verified Olivia remote ref identified **five unpublished commits**, all dated September 14–15. Thus they fall just before the September 16 cutoff, but they are relevant to broader historical preservation.

| Commit | Committer date, UTC+03:00 | Work recorded |
| --- | --- | --- |
| `ff140dcd6759e7e267b39430cbff990037eb25d7` | September 14, 18:23:25 | Premium atlas and tarot interaction checkpoint |
| `bfec7c1ffc10174355be5ee6ad413183703c85d4` | September 14, 18:49:32 | Merge integrating the September 14 rituals with the atlas work |
| `f4a3b786638d00eb670bed0d81eccd81937dcc79` | September 14, 19:23:53 | Scroll-driven arrival restoration |
| `87e257d5e9e21f8eed5c0f307cd43431a3f3f730` | September 14, 20:07:11 | Cinematic motion, ambient-overhead reduction, and homepage sections |
| `1aee01e223209a84557d57c5e0d0073d84180f74` | September 15, 18:44:00 | Illustrated tarot and engraved sky studies |

None of these five commit objects was reachable from GitHub `main`, the September 26 handoff branch, or either other inspected remote branch. The local `main` in this separate repository, at `06f6be7`, was already covered by remote history.

The exact graph matters: checkpoint `ff140dcd` starts from `06f6be7`; merge `bfec7c1` has parents `ff140dcd` and `7ba2cfa`. Preserving the tip as an archive branch retains both parents and all five original commits. Copying only the final files or squashing them would not retain this history.

Compared with the common published baseline at `7ba2cfa`, the archive tip changes 58 paths. Against the current handoff tree, 10 of those paths have identical contents, 35 differ, and 13 are absent. Some study work has therefore been carried forward, while exact branch history and other atlas, interaction, and audio work remain distinct. This is a reason to preserve the branch independently, not to replace the current product with it.

### Incremental publication checks

The review compared the branch's objects with objects already reachable from the inspected GitHub refs. The unpublished increment contains 124 Git objects, including **71 text blobs totaling 1,858,243 bytes**. The largest individual blob is 294,338 bytes. This checks intermediate versions across the five commits as well as the final tree.

- No new binary blobs or large media files were found in that increment.
- No credential-file or private-attachment paths were identified among the incremental files.
- Targeted scans found no private-key markers, recognized provider or GitHub token patterns, JWTs, embedded URL credentials, credential literal assignments, or machine-specific absolute paths.
- No credential values or private artifact contents were printed or recorded.

The incremental changes are source, styles, design guidance, and tests. No publication blocker was found by these checks. They are archival checks; they do not certify this older implementation for production use.

**Recommendation:** preserve exact tip `1aee01e223209a84557d57c5e0d0073d84180f74` on a separate archive branch, for example `archive/premium-atlas-2026-09-15`, without merging it into `main` or the current handoff. At this report's inspection point, no archive branch had been created or pushed by the audit task. The coordinating task owns any subsequent publication and should record its final ref separately.

## Exclusions and interpretation

Credentials, environment values, dependency installations, virtual environments, caches, build outputs, and machine-local settings were excluded. No credential contents were inspected or recorded. Generated files used for the product comparison were checked by content identity; deployment readiness was not inferred from Git reachability.

The September 16–26 product work within the primary and handoff checkouts is preserved on GitHub through the handoff branch. The additional September 14–15 atlas branch is a distinct unpublished history identified by the extended inspection. Other outstanding historical gaps belong to the older, separately scoped work above. This report does not certify materials outside the inspected checkouts or changes added after the recorded remote tip.
