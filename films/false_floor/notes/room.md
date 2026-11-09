# Vault room (Level −2) — builder B (`owner: B_room`)

Script: `shots/room.py` (all shots, `--shot SXX`). Set helpers: `lib/vault_ff.py` (extended; SF1 untouched, see below).
QC sheet: `tests/QC_room.jpg`. S27 counter sync table: `notes/room_S27_counter.json`.

```
python3 films/tumbler/tools/rb.py films/false_floor/shots/room.py -- --shot S27 --stills 7,40 --pct 30 --samples 12
# finals (lead, GPU):  ... --shot S27 --anim            (3D: frames 1..N, cut 7..N-6)
#                      ... --shot S41 --stills 1         (3DS: one 2560x1440 frame)
```

## Shots

| Shot | Kind | Frames (render / cut) | State | What it is | Camera |
|---|---|---|---|---|---|
| S02 | 3D | 252 / 7–246 | AFTER | Descent along the forced right wall (the SF1 wall, same seeds) to the floor: torn envelopes, an emptied velvet pouch, a passport, a ring, an opened diamond paper | 28 mm f/2.2 crane from 2.55 m to 0.3 m, tilting down; focus rides the wall then racks to the ring (f205–232) |
| S21 | 3D | 252 / 7–246 | BEFORE (day) | Wall camera on the end wall with its red status LED → rack + push to the heat/motion sensor in the ceiling corner as a hair-spray mist (two puffs of sub-mm droplets + a thin local haze) drifts across its Fresnel lens, which keeps a faint glossy film and a few beads → back to the camera | 50 mm f/1.8; on camera f1–72, rack/push to sensor f72–104, hold f104–184 (mist f96–200, lens film f138–172), back f184–218 |
| S26 | 3D | 252 / 7–246 | NIGHT (dark) | Only the antechamber spill through the open vault door. A white EPS sheet glides in through the doorway and along the right wall under the heat/motion sensor, always turned to face it (slight carried bob/sway, no person) → crane up to the light sensor on the ceiling under a strip of black gaffer tape | 28 mm f/2; low wide f1–125, crane/tilt to the ceiling f125–232 |
| S27 | 3D | 252 / 7–246 | NIGHT → lights on | Three twin-tube fluorescents strike with starter-ballast flicker (independent per tube, f5–27); the crank tool (bridge clamp braced on the neighbouring cells, lead screw, crank arm, no hand) turns ~3 times and the first door gives at f30; 108 more doors snap open in a wave down the wall | 30 mm f/2.8, three-quarter down the right wall, slow pull back + pan; focus follows the wave front |
| S34 | 3D | 98 / 7–92 | AFTER, dark | Monday morning: room dark, torch (warm-white core + spill, handheld jitter) sweeps the debris and sorted loot and finds the foot of the forced wall; thin local dust volume shows the beam | 28 mm f/2.8 low across the floor, slight push |
| S28 | 3DS | 1 @ 2560×1440 | AFTER, lit | The sorting area on the floor, low: passports stacked + one open, cards, two rings, envelope heap, emptied cases, trays, pouches; forced wall behind | 32 mm f/4, 0.3 m off the floor |
| S41 | 3DS | 1 @ 2560×1440 | BEFORE, sealed | One-point view down the room to the shut vault door; all boxes closed, polished clean floor, near tube off, far tubes cold | 24 mm f/5.6 |
| S45a | 3DS | 1 @ 2560×1440 | AFTER, lit | Counter-evidence: the taped light sensor on the ceiling with the twin tube burning right beside it | 40 mm f/2.8 looking up |
| S45b | 3DS | 1 @ 2560×1440 | AFTER, lit | Counter-evidence: the sorted loot on the lit floor, from above like a scene photograph | 35 mm f/5.6 top-down |
| S51 | 3DS | 1 @ 2560×1440 | AFTER | The forced wall wide, one pool of cream light near camera, the wall receding into black (for the slow pull back) | 24 mm f/4 |

S45 is delivered as two inserts (`--shot S45a`, `--shot S45b`); the shot table lists one S45.

## S27 counter sync (001 → 109 / 189)
- Door *n* (n = 1..109) snaps on frame **F(n) = 30 + 2·(n − 1)** → 30, 32, … 246 (= last cut frame): closed on F(n) − 1,
  mid-swing (motion-blurred) on F(n), settled by F(n) + 7. Door 1 is the crank-tool door (it gives at f30, after the tubes
  have struck at f27); doors 2–109 are the wave down the wall, near → far.
- Counter at frame f: **n = floor((f − 30) / 2) + 1** for 30 ≤ f ≤ 246 → `001` at f30, `054` at f136, `109` at f246.
  Show nothing (or `000`) for f7–29 (the flicker + crank beat). Linear, one tick every 2 frames (12/s); put each clack on F(n).
- Want the openings spread over the *whole* cut instead (counter from f7)? Render with `--wave_start 7`
  (F(n) = 7 + (239/108)·(n − 1)); the tool door then gives during the flicker, which reads worse.
- Per-door table (column/row on the right wall, exact frames): `notes/room_S27_counter.json`.

## Set and continuity
- Room = SF1 geometry: box walls at x = ±1.25 (22 × 13 cells each, z 0.18–2.78), ceiling 2.9 m, vault doorway in the
  end wall (y 6.225), SF1 fluorescent positions (y 0.6 / 2.4 / 4.2). AFTER shots use the SF1 walls with the SF1 seeds and
  the SF1 debris scatter, plus one sorting area (centre (0.15, 3.0)) used by S28, S34, S45b.
- Sensors are in the same place in every shot: heat/motion PIR on a corner bracket in the far-right ceiling corner; light
  sensor on the ceiling at (−0.25, 4.95), taped from THE NIGHT on; wall camera on the end wall right of the doorway (red
  LED only lit in S21 and S41).
- Light colour: cold daytime tubes 6000–6200 K (BEFORE); SF1 rig 4600 K tubes + 3900 K cream key (AFTER/NIGHT lit);
  antechamber spill 5200 K; torch 3600–3700 K. No orange light, no glows, no lasers.

## vault_ff.py changes (SF1 reproducible)
- `build_wall(..., closed=False)` and `scatter_debris(..., avoid=None)`: new opt-in params; defaults leave the RNG
  sequence and output identical, so `shots/sf_vault.py` re-renders SF1 unchanged.
- New: `mats_room`, `build_room`, `fixture` + `flicker`, `pir_sensor`, `light_sensor` (tape), `cctv`, `foam_sheet`,
  `crank_tool`, `door_lock_point`, hero props (`torn_envelope`, `pouch_empty`, `passport`, `ring_jewel`, `diamond_paper`,
  `jewel_box`, `deposit_tray`, `card`), `sorted_loot`, `clear_loose`.

## Known issues / notes for the lead
- Box count: the room holds 2 × 286 cells (the approved SF1 wall). The 189 figure is not countable on screen in any of
  these shots, but don't present a wide as "all 189".

## v2 "The Night" (SEQ_NIGHT.json) — N9, N10 (`shots/room.py --shot N9|N10`)
- **N9** (120 f, cut 7–114): the Monster (`cast.make('monster')`) cranks the puller clamped on right-wall box c9/r5. Arms
  are keyed every 2 frames with a two-bone IK built on `HU.aim` (hand lands on the crank grip all the way round; `CA.reach`
  alone overshoots because it doesn't solve length). The crank turns ~2.3 times, slowing; the door bulges, then **buckles and
  pops at f84** (door kicks to 15°, twists, clamp jolts, grit puff, camera flinch). Handheld push-in from his right-front,
  28 mm f/2.4: face + hands at the start, tight on hands/clamp/door by the end. Lights on, 4400 K tubes + warm key, exposure +0.5.
- **N10** (170 f, cut 7–164): 109 doors burst open on an accelerating schedule `snap(n) = 10 + 140·((n−1)/108)^0.42`
  (door 1 f10, 10th ≈ f61, 50th ≈ f112, 109th f150), early doors placed ahead of the rushing camera so each lands in frame;
  the cascade fills the right wall; ~34 boxes spill a paper/envelope. Camera rushes down the aisle (24 mm), whips right at
  f118–146 and lands on the wall of open boxes. Per-door frames for a count overlay: `notes/room_N10_counter.json`. Exposure +0.3.
- Test stills (pct 25, 8 spp): N9 mean luma 0.30–0.34, N10 0.34–0.39 (before the final tweak: tubes cooled 3900→4400 K,
  N10 exposure 0.5→0.3, N9 reframed to show his face). Those last changes were checked numerically (framing/occlusion,
  doors in view), not re-rendered: the 2-still budget per shot was used.
