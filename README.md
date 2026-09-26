# Olivia Arcana

A bilingual tarot product with a complete 78-card deck, manual card selection, guided spreads, personal readings and a local almanac.

**Another AI continuing the work should start with [SESSION_HANDOFF.md](SESSION_HANDOFF.md).** It records the latest preview, source authority, build instructions, completed work, preserved design decisions and outstanding release gates.

- [Brand and design rules](BRAND.md)
- [Editable product and rebuild instructions](experience/README.md)
- [Project history, earlier iterations and coverage limits](history/README.md)
- [What the site still lacks — audit of 26 September 2026](experience/outputs/olivia-gap-audit-2026-09-26.md)
- [Latest QA — v5 site-wide pass, not yet deployed](experience/outputs/qa-v5/review.md) · [v4 mobile coherence pass](experience/outputs/qa-mobile-v4/review.md)
- [Preview of this branch (draft PR #4)](https://deploy-preview-4--olivia-arcana.netlify.app/)
- [Production mobile QA — v3](experience/outputs/qa-mobile-v3/review.md)
- [Current production release (v3)](https://6ab7b1eb2e3eb145b023937a--olivia-arcana.netlify.app/)
- Native Next.js application: `website/`
- Optional question-aware reading service: `website/netlify/edge-functions/`
- Supporting backend: `backend/`

Branch `claude/peaceful-clarke-scrh06` carries the v4 mobile pass and the v5 site-wide pass on top of the handoff branch `codex/session-handoff-2026-09-26`, which preserves the deployed v3 product and its editable source. Neither is merged into `main`. It does not certify account sync or paid launch readiness, and a later Git push does not itself replace the production release.
