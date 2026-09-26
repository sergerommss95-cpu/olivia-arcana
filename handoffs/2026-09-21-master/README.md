> Historical handoff. For current source, preview, deployment IDs and priorities, read [SESSION_HANDOFF.md](../../SESSION_HANDOFF.md). Service observations below are dated and must be rechecked.

# Olivia Arcana — master bundle, rev. 2026-09-22

Read the docs in order. They are written to stand alone: nothing here assumes the
conversation that produced it.

```
docs/00_MASTER.md           what the project is, the stack, the design system,
                            the Edition System, and the gotchas that have bitten
docs/01_BUILD_LOG.md        the last three efforts, anchored to commits
docs/02_THE_DEALING.md      full spec of the new card act — brief, the reference's
                            faults, the direction tournament, the design, the code
                            map, and an honest status
docs/03_STATE_AND_NEXT.md   deploy state, uncommitted tree, the queue, the blockers
docs/04_ACCESS_AND_CREDENTIALS.md
                            every account, permission and environment variable
                            the project needs — names only, never values. Safe
                            to hand to an external assistant.
docs/_status.txt            raw `git status` of website/ at bundle time

src/components/almanac/TheDealing.tsx      the new card act (724 lines, uncommitted)
src/components/almanac/SpreadTheater.tsx   the DOM stage it falls back to
src/components/hero/TheArrival.tsx         the rebuilt hero (uncommitted, +606)
src/lib/celestial.ts                       the ephemeris the act is built on

scripts/build-deck-atlas.py   rebuilds public/deck/majors-q80.webp from the deck
scripts/deal-states.mjs       headless capture of the act at frozen states

public/deck/majors-q80.webp   the 22-card atlas, 2048² POT, 319KB

diff/uncommitted-src.diff     every uncommitted source change (1,511 lines)
diff/last-commits.txt         the last three commits with stats
```

## The one-paragraph version

The site is an engraved almanac that computes the real sky. The hero — Plate I —
was rebuilt so that a painted cloud break *is* the portal and the break opens onto
tonight's actual constellations over Kyiv; a four-round adversarial panel closed it
at 8/8/8. The plate immediately below it, Plate II, has just been given a new
figure: the whole 22-card Major Arcana deals itself out along the ecliptic, every
card landing at the station its astrological correspondence gives it — the twelve
sign cards at their houses, the ten planet cards at the longitude that body holds
tonight, retrogrades laid down inverted — before three leaves come off the band
onto the table as PAST · NOW · NEXT. It is 724 lines of raw WebGL1 with no library,
it typechecks, it is wired in, and **it has not yet been looked at**.

## To pick this up

```bash
cd ~/olivia-arcana/website
npx tsc --noEmit                              # expect clean
# start the dev server via preview_start "olivia-site" — never via bash
node scripts/deal-states.mjs 0.05 0.30 0.55 0.75 1
```

Then tune, per `docs/02_THE_DEALING.md` §6–7.

**Do not commit or deploy without explicit word from Serhii.**
