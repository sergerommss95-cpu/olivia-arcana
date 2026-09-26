# Archive verification — 26 September 2026

This is a preservation check, not a fresh product release or a claim that historical prototypes meet today's requirements.

## Content and reconstruction

- September 20–26: all **1,634 unique objects** were reconstructed and SHA-256 verified; all **3,007 retained path/version references** validated. The coordinator independently reran the full verification. A saved v11 hero HTML was also restored to a new directory and checksum-verified.
- September 11: **129 retained paths** reconstructed and checked, including 72 unique archived files and 57 deduplicated mappings.
- September 13: **753 retained paths** reconstructed and checked, including 160 unique archived files and 593 deduplicated mappings.
- September 20 competitor task: all **seven source/report/concept artifacts** checked against their recorded sizes and SHA-256 hashes. README and manifest are additional archival documentation.
- The two older snapshot reconstructions were rerun independently by the coordinator after updating restoration helpers. Helpers reject existing destinations and restoration inside the active checkout. Checksums prevent accepting changed shared files; a matching Git blob can recover the intended bytes after checkout line-ending conversion.
- Historical line endings are protected by `.gitattributes`. Historical whitespace is deliberately retained because changing it would invalidate the archived checksums. Formatting checks apply to newly authored handoff material and restoration helpers, not to rewriting old source.
- The largest newly stored artifact is **4,977,222 bytes**, below GitHub's per-file limit. The archival files total approximately **461 MB** before Git compression, including unique artwork and historical sources.

## Publication review

- Current source authority remains `experience/work/olivia-product/`; no current product runtime, artwork, service behavior or deployment configuration was changed during this pass.
- New archival text was scanned for common private-key, API credential, GitHub token, cloud access-key, Slack token, JWT and literal-secret patterns. One signed thumbnail URL in a preset export was found and removed; the manifest records this intentional sanitization and both hashes. No other matches remained in the final 885-file text scan. The large compressed recent archive was also scanned after reconstruction.
- The separate premium-UX Git history was inspected before pushing: 71 new text blobs, 1,858,243 bytes total, no new binary artifacts or detected credential patterns. Its five commits, including the merge ancestry, were preserved on a separate archive branch. Live GitHub verification matched `1aee01e223209a84557d57c5e0d0073d84180f74`.
- Credentials, raw conversations/internal reasoning, personal screenshots, machine state, dependencies and caches were not intentionally published. Pattern scanning is a targeted review, not a guarantee against every possible sensitive string.
- Main handoff/index links were checked. Each session manifest documents exclusions and deduplicated destinations; those manifests are the source for exact coverage.

## Scope limits

The archive preserves discoverable saved artifacts, original recent Git history, and summarized project decisions. It cannot recover unsaved edits or unavailable conversations. Some older April–August branches/artwork remain outside this recent-work archive, as documented in the Git coverage audit. The full chat history is not represented as a Git transcript.

No application test suite or production deployment was rerun solely for these archival changes. Current production verification and remaining physical-device/account/payment checks are recorded separately in `SESSION_HANDOFF.md`.
