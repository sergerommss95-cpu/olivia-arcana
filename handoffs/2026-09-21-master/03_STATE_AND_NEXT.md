# State and Next

*As of 2026-09-21.*

---

## 1. Deploy state

| | |
|---|---|
| Live on prod | `f3795d1` and everything before it — carved hero assets, abyss+ivory studies |
| **Local, unpushed** | `433ffb0` (paid launch) · `9510387` (growth loops) |
| **Uncommitted** | ~39 files — the hero rebuild, the Edition bind pass, The Dealing |

Nothing ships without explicit word. `git push` deploys automatically via Netlify.

## 2. Uncommitted working tree

**New files**
```
website/src/components/almanac/TheDealing.tsx     the card act (724 lines)
website/public/deck/majors-q80.webp               the 22-card atlas (319KB)
website/scripts/build-deck-atlas.py               rebuilds that atlas
website/public/arrival/arch-mask{,-828}.webp      the hero's aperture matte (lossless)
website/public/arrival/{arrival,plate,sanctuary,scene}-{828,1672}.webp   srcSet tiers
```

**Modified (headline)**
```
src/components/hero/TheArrival.tsx   +606 / -200   the hero rebuild
src/app/page.tsx                     +43           masthead yield, numbering spine, TheDealing wiring
src/components/InstallPrompt.tsx     +54           the dev service-worker fix
~17 further files                    ±2–12 each    the Edition gilt + numbering sweep
```

Full list in `_status.txt` beside this file.

**Health:** `npx tsc --noEmit` clean. The hero is verified by screenshot at four
frozen states. The Dealing is **not yet verified against pixels** — see
`02_THE_DEALING.md` §6.

## 3. Immediate next

1. **Run `deal-states.mjs`** and tune The Dealing. It has never been seen.
2. Work the graft list in `02_THE_DEALING.md` §7 — the fore-edge sky and the
   animated dive are the two with real upside.
3. Decide whether 530×448 is enough room, or whether the plate row needs to widen
   for the act.

## 4. Edition System — ranks still queued

Rank 1 (spine) and rank 3 (gilt) are done. Remaining, roughly in value order:

- `.cta-pill` unification (start from the oracle's filled-moonstone button)
- Caption colour law: lavender = structure, gilt = live
- Extract `PlateFrame.tsx`
- Ground unification — `/oracle` and `/daily` to abyss
- Masthead-that-yields on every route, not just `/`
- `SkySignature.tsx` in its four rooms
- Motion retune to `--ease-engrave` / 950ms across interior plates
- Display-serif snap; de-glass; footer-as-back-cover

**Bind-pass skips to resolve:** `/pricing` "Plate VII" needs a `LegalShell` prop;
`/daily`'s per-sign "Plate I–XII" collides with the spine — proposed fix is
"Sign I–XII".

## 5. From the ChatGPT design research

The mockups were refused — generic CGI, weaker than our painting. The **product**
P1s were adopted or queued:

- ✅ Direct reading CTA in the first viewport; the arrival act resolves into a
  "Begin a reading" pill
- ⬜ Named Sky Atlas destinations instead of "Uncharted"
- ⬜ One daily loop: card → interpretation → journal → lesson
- ⬜ `/sample` title/body mismatch
- ⬜ Access-state copy on `/pricing`

## 6. Blockers that are not code

These gate revenue and cannot be solved by writing more of the site.

1. **Paddle's AUP bans tarot and horoscopes** (prohibited category 14). The entire
   payment stack targets a processor that will not take this vertical. Candidates:
   Gumroad (explicitly allows entertainment-framed tarot), Lemon Squeezy (Stripe-owned,
   risky), Telegram Stars, high-risk gateways. **Processor choice is the long pole.**
2. **The backend has never been deployed.** Complete FastAPI auth + payments code
   sits at `~/olivia-arcana/backend`; the Railway URL 404s; env vars are empty.
3. **The Supabase project was deleted.** The hardcoded URL is DNS-dead.
4. **"Olivia Arcana LLC (Wyoming)"** appears in all six legal pages. Existence
   unverified.
5. Netlify production has **one** environment variable in total.

Recommended commercial shape, from the readiness audit: Insight + Premium only.
Drop VIP, the $49.99 video reading, and the solar-return addon — all three are
vapor with no implementation or fulfilment path.

Detail: `website/LAUNCH_READINESS_2026-09-20.md`, `website/DEPLOY_RUNBOOK.md`,
`website/GROWTH_PLAYBOOK_2026-09-20.md`.

## 7. Dead code, safe to delete

`Pricing.tsx`, `Footer.tsx`, `UpgradePrompt.tsx` — all orphaned. The real footer
lives in `AlmanacShell`.
