# Reflection practice redesign — review handoff

Branch: `codex/reflection-practice-redesign`, based on main `f6ac41c` after PR14 merged. This redesign is prepared for review; production has not been changed.

## Implemented stages

1. First and second visits: clear homepage value, one primary reflection action, a real sample with a small next step, and a return card that opens an existing reading and its dated follow-up editor. Single cards and spreads accept an optional personal response, disagreement, title, theme and next step. Then / Now / Next retains original words and appends dated returns; stale editors cannot erase previously saved returns.
2. Motion and journal: an accessible reveal skip button, shorter repeat rituals, reduced-motion handling, and a card-to-journal receipt only after successful saving. Journal rows use saved-edition artwork and user titles; descriptive retrospectives and existing export/delete tools keep storage transparent.
3. Deck and continuity: all 54 remaining Minor Arcana artworks and EN/UK upright/reversed reflections complete the 78-card Amielle edition. The new v2 edition preserves v1 saved artwork and interpretation behavior. Astrology transfers a minimal local practice origin into the same reflection history; birth inputs, personal responses and follow-ups are excluded from reading-service requests.

## Validation

- Product suite: 343 tests passed.
- Website and service suite: 96 tests passed.
- TypeScript and ESLint on changed website/service files passed.
- Experience generation and Next production export passed; generated resource paths, scripts, Ukrainian page language and both versioned 78-card Amielle manifests were validated.
- Previous v1 artwork manifest matches main exactly. Original approved artwork and variants are preserved; raw new generation originals remain local outside the commit.

## Remaining review limitation

No local-browser tool is exposed in this executor. Actual desktop/mobile EN/UK visual review, interactive export and interrupted/repeated browser flow checks remain unverified. Unit tests cover save/export invariants, dated returns, motion cancellation/reduced motion, and local astrology handoff, but do not replace browser review. Review the preview on iOS and desktop before merging.

No remote journal or birth-data storage, paid service, notification schedule or production deployment was added. Existing astrology, approved WebGL hero and unrelated open PR work remain intact.
