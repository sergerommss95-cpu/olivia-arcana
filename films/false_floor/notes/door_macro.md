# Set A2 — door macro (security mechanisms, close-up) · notes

Illustrative reconstruction. Owner `A2_macro` in `script/SHOTS_v2.json`.
Script `shots/door_macro.py` (`--shot SXX`), library `lib/door_macro.py`. QC sheet: `tests/QC_door_macro.jpg`.

```
python3 films/tumbler/tools/rb.py films/false_floor/shots/door_macro.py -- --shot S16 --stills 7,126,246 --pct 30 --samples 12
python3 films/tumbler/tools/rb.py films/false_floor/shots/door_macro.py -- --shot S18 --anchors   # field-line anchors, no render
```
Extra flags: `--debuglight`, `--fstop F` (override), `--anchors` (S18/S24 only).

## Shots

All 3D, `setup_render(1, N, RES_FINAL, samples=40, AgX Medium High Contrast, clamp 4)`, motion blur on, frames 1..N,
cut = 7..N-6. Real metres (1 BU = 1 m), so DOF is physical macro DOF. Each shot has a slow motivated camera move + subtle
`shake`, cream (4000 K) hard key, cool rim/fill, macro dust motes. No text overlays, no glows, no orange light.

| Shot | N | What happens (frame numbers are render frames) | Camera / focus | Light |
|---|---|---|---|---|
| **S15** drill freeze | 212 | A 10 mm twist drill, spinning (128°/frame, blurred), approaches the door's front plate 34 mm from the free edge (seam + painted frame visible beyond). **Freezes dead at frame 51** (cut frame 45, ~1.8 s), tip 1.6 mm short of the steel: spin and feed stop instantly (flutes snap from blur to sharp), dust motes freeze too. Bit tip and its reflection in the brushed steel nearly touch. | 65 mm, f/14, focus fixed at the gap; dollies in with the bit, then keeps a slow creep in the frozen world | Cream spot raking from upper left (bit shadow converges on the tip), cool sheen strip far right (bit in silhouette against the steel), cool top rim |
| **S16** wheel + lens | 252 | The 0–99 wheel (`lock.build_dial`, black satin + cream numerals, A1's 0.062 m scale) turns 18→47, pauses, back to 24, pauses, settles on **36** at ~frame 212. A top-reading hood over 12 o'clock: the numbers are printed on a band at the back of the wheel rim and can only be read through the small lens on top (plano-convex glass, ~2.4×, real refraction). | 90 mm; starts on the numerals, cranes up past the hood and pushes down the lens axis; f/8 → f/18 and focus racks face → lens → magnified number (arrives ~frame 204) | Cream raking key, light leaking into the hood onto the number, cool rim on the hood top |
| **S17** two-part key | 194 | The long key (A1's design: chrome shank r 6.8 mm, dark knurled coupling collar = the joint of the two parts, chrome collar, T-bar bow with ball ends) is already in the keyway and turns by itself: 0 → 90° (frames 28–92, heavy ease), pause, → 180° with a small settle (156–168). | 50 mm f/4; starts behind the bow (the T-bar sweeps through foreground as it turns), tracks along the shank to the boss and the dark keyway (round + slot); focus collar → boss | Cream key from upper left, grazing light across the panel, cool rim, low panel sheen |
| **S18** magnetic plates | 252 | Static: the two contact plates across the door/frame seam (A1's layout, see below), clean dark seam between them. **No field drawn** — the lead adds the cream lines in post. | 60 mm f/9, slow push 0.36 → 0.27 m from front-right (looks a little into the seam: door-edge depth) | Night: cream key grazing down from upper left (screw sockets, bevels), cool top rim, kick on the frame half, soft sheen on the brushed door steel |
| **S22** loosened + tape | 252 | Same plates in neutral daylight: all screws backed out 2–3.4 mm (threads visible under the heads), a strip of ordinary matte paper tape (pale, slightly translucent, crepe + creases, torn ends) wrapped over each block onto its own surface. | 70 mm f/6, steep top-down view on the two inner top screws across the gap, drifts down to the tapes; focus screw heads → tape | 5200 K overhead fluorescent + crisp neutral graze + soft fill |
| **S24** aluminium plate | 252 | A custom aluminium plate (2 mm sheet, 2 mm shim under its door half, 4 countersunk screws) comes in from the right and seats over both plates (frames 16–72). Hold. **Frames 122–228: the door plate recedes away** (hinge far left, behind the face) — the door half of the contact stays clamped to the frame half by the aluminium plate, its loosened screws' shanks now visible behind it. | 40 mm f/5.6, 3/4 from front-left, slight push, then eases back and left to reveal the opened seam | Same night rig as S18 |

Post anchors for the field lines: `tests/S18_anchors.json`, `tests/S24_anchors.json` — per cut frame, normalised screen
position (x right, y down) of points on the gap-facing face and front face of each half at z = 20/45/70 mm.

## Continuity with A1 (door set, `lib/door_ff.py`)

- Matched to A1: door front-plate border (brushed vertically, base 0.48) and raised panel (brushed horizontally, 0.52),
  6 mm seam, frame worn dark paint 2 mm proud (A1's `mat_worn_paint` params at macro grain), the plates' size/positions
  (62 × 200 × 13 mm each, 20 mm apart, 4 cap screws r 4.8 mm at the corners, armoured cable up from the frame half),
  the key (shank, dark coupling collar, chrome collar, T-bar bow), the boss (chrome r 36 + steel ring r 24, keyway r 8.5
  with slot), the dial (`build_dial`, r 0.062 m).
- **Differs from A1 (lead to decide):**
  1. Plate finish: per the lead's QC note the plates are heavy zinc/steel blocks with a small illegibly-engraved maker's
     plate; A1's wide shots use grey paint (`MagFace` 0.19). At wide scale they read similarly; A1 can switch
     `M['magface']` to `door_macro.mat_zinc` for an exact match.
  2. Reading lens: A1's hood sits above the bezel with a forward-facing lens (no number visible). Mine is a top-reading
     hood over 12 o'clock, lens tilted 40° from vertical, number band under it. Same idea/silhouette; for an exact match A1
     can call `door_macro.dial_with_lens(M, s=DIAL_S)` at the dial position.
  3. S24 door direction: the brief says "the door edge moves away while the plates stay paired"; physically the plates
     can only stay paired if the door face moves away from them, so in S24 the door recedes (into the vault). A1's door
     opens toward the antechamber. In a 10 s macro this reads as "the door moves, the plates don't"; flag if it matters.
  4. S24 has no tape (removed before the aluminium plate goes on); S22 shows it.

## Known issues / notes

- Numbers: the dial's cream numerals and the rim-band numbers are physical engravings on the object (as approved in
  TUMBLER); no overlay text. "36" is arbitrary, not the real combination.
- S15 freeze frame is `F = A + 44` in `s15()`; change it there to retime. After the freeze the world is frozen (bit,
  spin, motes) but the camera keeps creeping, so the lead can hold the shot without a freeze-frame.
- Render cost (CPU test, 30 %, 12–16 samples): 7–21 s/frame on 4 shared cores, so well under 8 s/frame at 1080p/40
  samples on a GPU. S16 has refractive glass (transmission bounces 4); S22's tape uses subsurface.
- Test frames: `tests/S15..S24_*` (`_qc` = the QC pass).
