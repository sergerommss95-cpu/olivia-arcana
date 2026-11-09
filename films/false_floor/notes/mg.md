# FALSE FLOOR · Case No. 02 — motion graphics (builder D, owner `D_mg`)

All MG is code: numpy + Pillow, no Blender. 1920x1080 RGB PNG, 24 fps, exactly `render_frames` per shot
(`script/SHOTS_v2.json`), frames `out/renders/<ID>/0001.png …`. Overlays are RGBA PNG (straight alpha).

## Code

| File | What |
|---|---|
| `mg/kit.py` | Shared system: easing, VO cue lookup, 3x type builder (`Text`, `Para`), 3x premultiplied canvas (`Layer`: lines, polylines, dashed, polys, rects, dots), concrete-texture charcoal background, camera push, exact-coverage panels, soft layers, grain, corner labels, `Shot` base class |
| `mg/shots.py` | The 14 MG shots (one class per shot) |
| `mg/overlays.py` | O_109, O_LAYER, O_COUNT, O_TITLE, O_LABEL, END |
| `mg/render.py` | Runner (multiprocessing, 3 workers by default) |
| `mg/qc.py` | Rebuilds `tests/QC_mg.jpg` from the rendered frames |

```
python3 mg/render.py S06 S09            # full sequences -> out/renders/<ID>/
python3 mg/render.py S06 --frames 1,200,405 --test   # JPG previews -> tests/mg_S06_f0200.jpg
python3 mg/render.py all                # everything (~25 min on 3 cores, ~11 GB)
```

How a frame is made: background (concrete-mottled charcoal with a soft motivated key, or cream panels / the revealed
orange interior, computed in output space with exact edge coverage) → optional soft layer (sensor fields, the darker
ground below street level) → crisp layer (all type and line work) drawn at **3x** into a premultiplied canvas and
downsampled **once** with Lanczos, the camera push folded into that single resample → screen layer (corner labels, no
push) → fine luma-weighted grain (σ ≈ 1.6/255, new every frame) → PNG.

Motion rules applied everywhere: type builds per letter (titles, kickers, labels) or per word (subs, paragraphs) with an
eased fade + 6–16 px upward slide that settles over 10–14 frames, staggered 1–4 frames; lines draw on with ease-in-out;
cards slide up 22 px and settle; nothing pops. Camera: layout pushes 0.8 %, background 2.8 % over each shot (slight
parallax), so no frame is static. 100 px margins (type in the layout layer drifts ≤ 8 px outward by the last frame of a
shot because of the push; corner labels are screen-locked at exactly 100 px / baseline 1028, matching
`tools/brand_frame.py`). Barlow Condensed throughout, same sizes as SF1/SF3 (kicker SemiBold 30/+4, title Bold 150/+2,
sub Medium 34/+5, corner label Medium 22/+3, in-picture labels SemiBold 22–28/+3).

## Shots

Cue frames are estimated from the temp VO (character position inside each beat, `kit.cue`); type lands just before the
word. When George's VO is locked, nudge the phrase offsets in `shots.py` and re-run the shot (each takes 1–3 min).

| ID | Frames | On screen | Bottom-left label |
|---|---|---|---|
| S06 | 405 | Street line, bollards, police post draw; floor plates of the Diamond Centre build up from the ground floor, then down to −1 and −2; the vault box with its deposit grid; labels OFFICES · TENANTS / GROUND FLOOR · GUARDS / LEVEL −2 · THE VAULT; title ONE RULE + orange rule + NO OFFICE UPSTAIRS · NO BOX DOWNSTAIRS; finally A TENANT'S OFFICE lights and the **orange link** drops from that office to the vault (SF3's connection). Ground below the street darkens a shade. | EDITORIAL SECTION · NOT A FLOOR PLAN |
| S09 | 345 | Calendar, one fine mark per day from 1 Jan 2001, **one row per year** (2001 / 2002 / 2003, months on top); days tick in with a bright leading edge that settles to concrete, accelerating then slowing; lands on the single **orange mark: SATURDAY 15 FEBRUARY 2003**; title AN ORDINARY TENANT, sub HIS LEASE CAME WITH HIS OWN BOX IN THE VAULT. | ONE MARK PER DAY · JANUARY 2001 TO FEBRUARY 2003 |
| S12 | 634 | Kicker + THE SCHOOL OF TURIN; four typographic cards, one at a time on the VO: ALIAS 01 THE GENIUS · ALARMS / 02 THE MONSTER · LOCKS · WIRING · DRIVING / 03 THE KING OF KEYS · AN OLD FORGER · REAL NAME NEVER KNOWN / 04 SPEEDY · A LONG-TIME FRIEND · ANXIOUS · PARANOID. On "Keep him in mind" the first three recede to ~40 % and Speedy's card holds. No faces. | NICKNAMES AS REPORTED · SCHOOL OF TURIN |
| S19 | 536 | Orthographic plan: poché walls, the door standing open with its swing; soft cream sensor fields grow in as named — HEAT · INFRARED, MOTION, LIGHT · CEILING, RADAR (VO + FACTS 14), CAMERA · FEED TO THE GUARD STATION (dashed feed leaves the room); then **189 cells** sweep round three walls (81 + 54 + 54) while a counter climbs 001→189 (ON THE WALLS / 189 / BOXES / EACH WITH ITS OWN KEY AND THREE LETTER WHEELS); bottom-left 26 × 26 × 26 / 17,576 / POSSIBLE COMBINATIONS · PER BOX. | ILLUSTRATIVE RECONSTRUCTION · SCHEMATIC PLAN, NOT TO SCALE |
| S30 | 245 | ACCORDING TO NOTARBARTOLO / BURN EVERYTHING / FROM THE JOB AND THE SAFE HOUSE; list 01 TAPE 02 TOOLS 03 PACKAGING 04 FOOD on the words. Right: abstract map, two parallels (51.2° N / 50.8° N), ANTWERP → **orange line** along E19 → BRUSSELS. No tiles. | SCHEMATIC · NOT A RECONSTRUCTED ESCAPE ROUTE (as required) |
| S37 | 279 | HALF A SALAMI SANDWICH; **DNA** builds in cream (250 px); an orange hairline reaches across; **MATCH** builds in orange; INTO THE CASE FILE. No percentage anywhere. | FROM THE WOODS OFF THE E19 · c. 17 FEBRUARY 2003 |
| S39 | 373 | FIVE DAYS AFTER THE HEIST / FRIDAY · 21 FEBRUARY 2003 / LEONARDO NOTARBARTOLO WALKS BACK INTO THE DIAMOND CENTRE; two name cards (rule + DETECTIVE · DIAMOND SQUAD + name): AGIM DE BRUYCKER · PATRICK PEYS. | — |
| S40 | 376 | 2005 · ANTWERP COURT OF APPEAL / LEONARDO NOTARBARTOLO / **10 YEARS** / FOR ORGANISING THE HEIST; THREE MORE MEN · WHO POLICE BELIEVE ARE; cards SPEEDY · THE MONSTER · THE GENIUS, each 5 YEARS, on the VO; fourth card THE KING OF KEYS: dashed outline, empty sentence slot, NEVER IDENTIFIED. | ANTWERP COURT OF APPEAL · 2005 |
| S43 | 267 | Cream panel slides in over the left half: HIS ACCOUNT · WIRED, 2009 / HIS STORY / AS TOLD TO JOSHUA DAVIS; right on charcoal: THE INVESTIGATION · 2003 / THE EVIDENCE / WHAT THE DETECTIVES FOUND; on "It points at…" the **orange link** draws across the split between the two titles. | HIS ACCOUNT · DISPUTED BY INVESTIGATORS |
| S44 | 608 | Continues S43's layout; his panel widens to 1150 px and THE EVIDENCE recedes; five claims typeset one by one, each with HE SAYS, earlier claims dimming as the next lands: He wasn't the mastermind. / A diamond dealer hired them to stage it for the insurance. / They rehearsed in a replica vault, to work in the dark. / Most bags were nearly empty: the stones were moved out before the weekend. / About twenty million was taken. Not a hundred. | HIS ACCOUNT · DISPUTED BY INVESTIGATORS |
| S46 | 234 | AGIM DE BRUYCKER · LEAD DETECTIVE builds first (VO names him first), a large concrete open-quote, then the quote word by word (fast, so it can be read twice while he is quoted): "Not one detail of Leo's story can be confirmed by the facts in the investigation." — AGIM DE BRUYCKER, LEAD DETECTIVE. | QUOTED IN COLUMBIA JOURNALISM REVIEW |
| S47 | 400 | The split frame again; each side takes a branch: IF HE'S TELLING THE TRUTH / The real crime happened inside the building. / HE'S THE FALL GUY — IF HE ISN'T / A mostly empty vault is a very convenient story / FOR THE ONE MAN WHO KNOWS WHERE THE REST WENT. On "the one man" the two panels **slide apart** (54 frames, panels cast soft shadows) onto an **empty orange space**: not a flat fill, a lit interior (brighter from above, burnt toward the edges, concrete grain). Ends fully orange so the S48 HOLD sits on it. | TWO ACCOUNTS · ONE VAULT (ink) |
| S49 | 457 | AFTER THE SENTENCE · 2009–2017; axis with year ticks; 2009 PAROLED (THE YEAR HIS STORY RUNS), 2010 MILAN; hung from 2010: ABOUT A KILOGRAM OF DIAMONDS / HIDDEN BETWEEN THE SEATS OF HIS CAR; HE SAYS Cheap industrial stones, bought legally. │ BELGIAN POLICE SAY Of the highest quality. 2011 WARRANT · 2013 PARIS · 2017 SENTENCE SERVED are on the axis dimmed, and their labels build in the last 2 s (they are S50's VO). | — |
| S50 | 309 | NEVER COMPENSATED HIS VICTIMS / BROKE HIS PAROLE / 2011 · EUROPEAN ARREST WARRANT; map TURIN → gentle **orange arc** → PARIS · CHARLES DE GAULLE; title PARIS · 2013 / ARRESTED ON A LAYOVER · SENTENCE SERVED BY 2017. | SCHEMATIC · NOT A RECONSTRUCTED ROUTE |

Orange appears only as: the S06 office→vault link and SF3-style title rule, the S09 mark on 15 FEB 2003, the S30/S50 map
lines, the S37 link + MATCH, the S43 link across the split, the S47 revealed interior, and the brand lockup dash on
O_TITLE / END. No glows, brackets, scanlines, hex, HUD frames or flat orange panels.

## Overlays (RGBA, screen-locked: no push, no grain — the grade adds grain on top)

| Folder | Files | Use |
|---|---|---|
| `out/renders/O_109/` | `0001–0252.png` | Over S01: kicker MONDAY 17 FEBRUARY 2003 · LEVEL −2 (f25), `109 / 189` builds per letter (f47–), SAFE-DEPOSIT BOXES FORCED (f85); same positions/sizes as SF1. Stack O_LABEL too. |
| `out/renders/O_LAYER/` | `layer_01.png … layer_10.png` | Top-right corner counter: LAYER / `01` `/ 10`. Cut (or 4-frame dissolve) to the next file on each layer beat (S14 onward). |
| `out/renders/O_COUNT/` | `count_001.png … count_109.png` | Top-right corner counter: BOXES FORCED / `054` `/ 189` (S27, one file per clack). |
| `out/renders/O_TITLE/` | `0001–0072.png` | Over S03: FALSE FLOOR letters build and settle lower-left (title baseline 890), CASE No. 02 + the lockup's orange dash; holds settled from f56. Dissolve out in the edit. |
| `out/renders/O_LABEL/` | `label.png` | ILLUSTRATIVE RECONSTRUCTION (lower-left) + FALSE FLOOR · CASE No. 02 (lower-right), baseline 1028, exactly as `tools/brand_frame.py`. Put on every 3D/3D-S frame. |
| `out/renders/END/` | `0001–0360.png` (RGB, full frame) | 15 s end card: the mark's planes separate and the orange drop grows, FALSE / FLOOR + THE STORY BENEATH + dash; NEXT CASE teaser; two 16:9 video-tile zones at (1180,180)-(1820,540) and (1180,590)-(1820,950) under WATCH NEXT; subscribe ring centre (188,862) r 88. Set YouTube end-screen elements on those zones. Teaser text is a placeholder: edit `NEXT_LINE` in `mg/overlays.py` ("CASE No. 03 · COMING SOON") and run `python3 mg/render.py END`. |

## Issues / decisions for the lead

1. **S37 MATCH** follows the brief, but FACTS row 27 only says the sandwich DNA "became evidence". MATCH asserts a
   positive identification; please confirm the source (or swap to `EVIDENCE` in `S37.__init__`).
2. **S50 Turin** as the origin of the 2013 flight is not in FACTS (row 32 names only Paris CDG). Verify before lock or
   change the start label.
3. **S44 claim 5** reads "About twenty million was taken. Not a hundred." to match the VO; FACTS row 33 says ~€18m
   (his account) versus the $100m estimate (different currencies). Wording is in `S44.CLAIMS`.
4. **S09** is three rows (one per year), not one long strip: a 776-day strip across 1720 px is a 2.2 px pitch and
   moirés under the push (tested). Same idea, clean marks.
5. **S43 orange "link"**: drawn as a hairline from HIS STORY across the split to THE EVIDENCE on "It points at…".
   S47's orange is the revealed interior (lit, textured), not a flat fill.
6. **S19** shows radar as a fifth field (it is in the VO and FACTS 14). 189 cells are a diagram convention (81 far wall,
   54 each side wall), not the real layout; the label says so.
7. Timing is from the temp VO. Every shot opens on ~0.5 s of background + labels before the first element, so a few
   frames can be trimmed at either end; every line holds ≥ 3 s settled except where the VO forces later cues (S06
   tenant link ~2 s before the cut; S40 5 YEARS cards ~2–4 s).
8. Disk: ~1.85 MB per RGB frame (grain is incompressible); all MG ≈ 11 GB under `out/renders/`.
9. QC sheet: `tests/QC_mg.jpg` (3 frames per shot: ~20 %, ~60 %, last; overlays shown over black).
10. **Re-timing to George**: everything (frame counts and every cue) is read from `script/SHOTS_v2.json` (`render_frames`,
    `vo`, `vo_start`, `vo_end`). Rendered against the current table (temp-VO timing). `edit/vo_george_v4_v01_timing.json`
    has shorter beats for S19 (≈473 f), S40 (≈323), S44 (≈559), S46 (≈215), S47 (≈374), S49 (≈427). Every shot ends on a
    settled hold, so tails can be trimmed, but S47's panel reveal ends at f386 and S44's last claim lands at f~523: if the
    table is regenerated from George's timing, just run `python3 mg/render.py all` (≈30 min on 3 cores) and all cues and
    lengths follow automatically.
11. Fixed during the pass: a cached screen layer could freeze a half-faded corner label in one worker (S44); S44 was
    re-rendered in full and S43/S47 frames 1–12, so labels are constant from frame 1 everywhere.
