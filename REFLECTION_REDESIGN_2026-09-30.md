# Reflection practice redesign — review handoff

Branch: `codex/reflection-practice-redesign`, based on main `f6ac41c` after PR14 merged. This redesign is prepared for review; production has not been changed.

## Implemented stages

1. First and second visits: clear homepage value, one primary reflection action, a real sample with a small next step, and a return card that opens an existing reading and its dated follow-up editor. Single cards and spreads accept an optional personal response, disagreement, title, theme and next step. Then / Now / Next retains original words and appends dated returns; stale editors cannot erase previously saved returns.
2. Motion and journal: an accessible reveal skip button, shorter repeat rituals, reduced-motion handling, and a card-to-journal receipt only after successful saving. Journal rows use saved-edition artwork and user titles; descriptive retrospectives and existing export/delete tools keep storage transparent.
3. Deck and continuity: all 54 remaining Minor Arcana artworks and EN/UK upright/reversed reflections complete the 78-card Amielle edition. The new v2 edition preserves v1 saved artwork and interpretation behavior. Astrology transfers a minimal local practice origin into the same reflection history; birth inputs, personal responses and follow-ups are excluded from reading-service requests.

## Validation

- Product suite: 353 tests passed.
- Website and service suite: 98 tests passed.
- TypeScript and ESLint on changed website/service files passed.
- Experience generation and Next production export passed; generated resource paths, scripts, Ukrainian page language and both versioned 78-card Amielle manifests were validated.
- Previous v1 artwork manifest matches main exactly. Original approved artwork and variants are preserved; raw new generation originals remain local outside the commit.

## Remaining review limitation

No local-browser tool is exposed in this executor. Actual desktop/mobile EN/UK visual review, interactive export and interrupted/repeated browser flow checks remain unverified. Unit tests cover save/export invariants, dated returns, motion cancellation/reduced motion, and local astrology handoff, but do not replace browser review. Review the preview on iOS and desktop before merging.

No remote journal or birth-data storage, paid service, notification schedule or production deployment was added. Existing astrology, approved WebGL hero and unrelated open PR work remain intact.

## Visible art-direction follow-up

After the owner found the initial preview too similar, the opening composition was rebuilt around three actual Amielle relief fronts, an editorial invitation, aubergine depth and an ivory primary action. The optional fan expansion and chosen-card separation work with HTML/CSS when WebGL is unavailable. Existing cinematic renderer infrastructure stays available through Watch the journey. Reading artwork is larger and the writing area is a distinct ivory surface; the journal introduction/navigation is compact so saved entries lead the return.

Cloud QA of the previous commit verified save/reload/revisit flows, and exposed locale hydration and interrupted-ritual bugs. Authored EN/UK routes now own the language, dates follow that language, and single/spread interrupted drafts recover exact shuffled choices without restoring external-guidance consent. The new visual/recovery pass still requires cloud desktop/mobile QA. Before reference: https://6abd3f560162d100087af94f--olivia-arcana.netlify.app (commit cea92e8).

Cloud review follow-up: the ivory writing panel now owns explicit dark label/status/help, placeholder, focus, error and disabled colors. Calculated text contrast is 5.4:1–9.4:1, with focus/field boundaries above 3:1. Returning-user secondary hero links now wrap with a 22px gap and separate 44px targets; short returning-user screens reserve additional height. Browser recheck remains with the parent.

Final cloud follow-up: filled secondary controls and expandable summaries now use explicit pale backgrounds with dark text; the primary save control retains paired dark/light colors. Recovered selected spread slots announce a selected face-down card instead of waiting, with focused EN/UK regression coverage. Parent cloud QA verified link spacing, locale recovery, exact single-card recovery and exact partial-spread recovery.
