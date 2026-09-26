# Build Log — the last three efforts

*Anchored to commits. Everything after §3 is uncommitted working tree as of
2026-09-21.*

```
9510387  Open the growth loops: share rails, 78 card leaves, the concordance   [LOCAL]
433ffb0  Arm the paid launch: funnel, gates, auth bridge, ask wiring           [LOCAL]
f3795d1  Re-ground the studies: abyss and ivory, the card turned to face you   [pushed]
8b2566d  Re-carve the arrival: the tide now opens in the deck's own hand       [pushed]
```

Two commits are **local and unpushed**. On top of them sit ~39 modified/new files.

---

## 1. `8b2566d` — the carved arrival (pushed, live)

**Finding that drove it:** photoreal AI plates read cheap next to carved card art.
The two materials fight.

Every arrival plate and the Olivia sprite were regenerated as **carved ivory on
lapis** — Runware Seedream 5.0 Pro with the actual card art passed as
`referenceImages`. Sprite registration: 2048×1984 canvas, sprite at x=366 y=274
w=924.

## 2. `f3795d1` — the studies re-grounded (pushed, live)

Serhii rejected beige, then rejected ivory grounds. A 4-candidate tournament
(night-room / lapis-plate / abyss-ivory / moon-paper) with three adversarial judges
settled it: **abyss ground, deck ivory as ink, deck gilt as accent.**

This is the origin of the site-wide rule *no light grounds anywhere*. It is also
why `/studies` is the one place deck pigment appears in UI — a later gilt-sweep
agent "corrected" those three CSS modules to site gilt and had to be reverted with
`git checkout`. **`/studies` is an explicit, permanent exemption.**

## 3. `433ffb0` + `9510387` — paid launch and growth loops (local, unpushed)

Both are code-complete and **inert** behind three unset flags
(`NEXT_PUBLIC_PAYMENTS_ENABLED`, `ACCOUNTS_ENABLED`, `PAYWALL_ENABLED`).
Headless-verified: with flags off, production output is identical to before.

`433ffb0` — checkout funnel via an `oa-pending-checkout` localStorage contract;
success page verifies a real purchase instead of granting VIP unconditionally;
the auth token split-brain closed at both ends (payments falls back to the Supabase
session, backend accepts Supabase JWTs and auto-provisions, 13 tests pass);
`/ask` wired to the live Claude edge function with the canned answers as fallback;
a real footer in `AlmanacShell`.

`9510387` — the oracle's SEND THIS READING button (so `/oracle-letter` is no longer
reading a key nothing wrote); a `/daily` share modal; `LanguageSwitcher` mounted in
the colophon; `InstallPrompt` + service worker mounted; 78 `/cards/[slug]` and 144
`/compatibility/[pair]` static pages; sitemap 57 → 212 URLs. 13/13 headless checks
pass.

> **Blocker, not a code problem:** Paddle's AUP bans tarot and horoscopes outright
> (prohibited category 14), and the entire payment stack targets Paddle. The
> backend has never been deployed (Railway URL 404s) and the Supabase project was
> deleted. See `website/LAUNCH_READINESS_2026-09-20.md` and
> `website/DEPLOY_RUNBOOK.md`.

---

## 4. The hero rebuild — "The Tide Opens" *(uncommitted, +606 lines)*

`src/components/hero/TheArrival.tsx`

Serhii's verdict on the previous hero: *"bad first image, the portal enter and its
animation is the worst, all seems very unprofessional."* Then, after a first pass,
*"better but implementation is 5/10."* Then the real question: *"how can you make
sure our website is beyond AI slop?"*

**Diagnosis: an identity mismatch.** The hero was a generic cinematic portal
attached to an almanac. The fix was not more polish — it was making the hero *be*
Plate I of the almanac.

What shipped into the working tree:

- The procedural water-ring portal is **gone**. A painted cloud break *is* the
  portal, driven by a feathered aperture matte in plate space.
- Cloud language rebuilt by 4-way tournament → **storm-break**: a layered cloudbank
  with one asymmetric torn opening.
- Resolution complaints fixed properly: 2× ML upscale, DPR 2, a 3-tier `srcSet`,
  and — for the parked arrival frame, whose crop was physically unfixable — a
  dedicated native-resolution arrival plate **match-cut** in on the same dolly.
- **Tonight's real sky** computed from `lib/star-chart.ts` for Kyiv and engraved
  into the break, self-captioned in gilt. Star *names* are drawn into the texture's
  green channel so the shader can retire the labels independently of the stars.
- Engraved plate frame, edition number, `Plate I — The tide opens · No. {edition} · MMXXVI`.
- The masthead became a transparent overlay that yields on scroll
  (`--tide-progress` on `<html>`, `data-tide-deep` past 0.42).
- `#p=0.55` hash pin for screenshot capture; a 14s "watch the opening" assisted ride.

**Validation:** a four-round adversarial slop-detector panel. R1 scored 6/10 and
found real bugs. R4 closed at **8/8/8 — "ship it, an engraved almanac nobody can
template."**

*Process note: pin the score scale explicitly in judge prompts. R2/R3 numbers were
not comparable across rounds — that was a prompt bug, not judge drift.*

## 5. The Edition System bind pass *(uncommitted)*

Ranks 1 and 3 of the twelve-item spec. Numbering spine applied across routes
("THE PLATES · I" → "PLATE II — THE DEALING TABLE", figures renumbered per plate,
`№` → `No.` in the colophon) and a gilt-discipline sweep. `/studies` reverted and
exempted, as above.

## 6. The Dealing — the new card act *(uncommitted, new)*

Triggered by Serhii's ChatGPT/DeepSeek mockup: *"can we make it in our design but
use the animation (needs to be fixed of course) and not in hero section but in card
section right after it."*

Full specification in `02_THE_DEALING.md`.
