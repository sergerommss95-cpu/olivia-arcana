# FALSE FLOOR · Case No. 02 — builder brief (read fully before building)

You build one part of a 12:30 YouTube documentary on the 2003 Antwerp Diamond Centre heist, in procedural Python →
headless Blender 5.2 (Cycles). **Deadline: today.** The lead integrates, renders finals on rented GPUs and edits.
Work only in `/home/user/olivia-arcana/films/`. Do NOT git commit or push (the lead does). Do not edit files owned by
other builders.

## Read first
- `films/false_floor/PLAN.md` §7 **quality bar** (Collin: "everything needs to be cinematic and well made").
- `films/false_floor/stills/SF1_vault_v01.jpg` — **the approved look reference** (built by `shots/sf_vault.py`,
  `lib/vault_ff.py`). Match its lighting philosophy: mostly shadow, motivated light, edges/lips catching light, black
  cavities, real scale, worn materials, shallow DOF.
- `films/false_floor/stills/SF3_section_v01.jpg` (brand section style), `films/false_floor/script/EPISODE_02_SCRIPT_v2.md`
  (the approved script: read your beats), `films/false_floor/script/SHOTS_v2.json` (your shots: `owner`, `kind`,
  `render_frames`, `shot` description, `vo`), `films/false_floor/script/FACTS.md` (rules).
- Toolkit: `films/tumbler/lib/common.py` (reset, setup_render, camera/DOF, cam_path, key, shake, light, kelvin, NB node
  builder, mat_metal/mat_paint/mat_brass/mat_concrete/mat_strip/mat_volume, prim/box/bevel/text_mesh, motes, finish CLI),
  `films/false_floor/lib/ff.py` (import this: brand colours, RES_FINAL=1920x1080, routes finish() output to
  `films/false_floor/`), reusable assets: `films/tumbler/lib/lock.py` (combination dial 0–99 `build_dial`, guilloche,
  engine-turned steel), `films/tumbler/lib/vault.py` (vault door parts, materials, deposit walls, gold, lasers),
  `films/false_floor/lib/vault_ff.py` (S2 forced box wall, debris), `films/tumbler/lib/city.py` (night street kit).

## Hard rules (from the channel's past rejections)
- No people, no hands, no faces, no silhouettes of people. Actions are shown through objects moving (a door swings, a sheet
  of foam slides, a tool turns) — never a person.
- No text, numbers, HUD, overlays, brackets, glows or labels **in your renders**. All type/counters/labels are added in post.
- No neon, no sci-fi glow particles, no lasers. Light sources look physically real (fluorescent tubes, a doorway, a torch beam,
  daylight). Orange (#E4442E) is NOT a light colour in your scenes unless your brief says so.
- No diamond/jewellery-ad look. Loose stones are rough, pale, semi-translucent pebbles.
- Facts: the vault door is a heavy steel door (3 tons) with a 0–99 combination wheel read through a small lens on top, a
  long two-part key, two magnetic plates across door and frame plus a keypad; sensors: heat/infrared, motion, light
  (ceiling), radar, camera; 189 boxes each with a key lock + three letter wheels; 109 forced. Don't invent other gadgets.

## Conventions
- One shot script per set: `films/false_floor/shots/<your_set>.py` with `--shot SXX` (ids from SHOTS_v2.json). Helpers in
  `films/false_floor/lib/<your_set>.py`.
- **3D** (animated): `setup_render(1, N, res=RES_FINAL, samples=40, ...)` with N = `render_frames` (includes 6-frame
  handles each side; the cut uses frames 7..N-6). Motion blur on. Motivated camera move, eased keys, subtle `shake`.
  The scene must render on a GPU in ≲8 s/frame (keep volumes thin and local; reuse meshes via linked copies).
- **3DS** (still moved in post): ONE frame at `res=(2560, 1440)`; compose with ~15% safe room on all sides because the
  edit pushes in slowly. Same quality bar as 3D.
- Test renders ALWAYS via the shared lock runner, small and fast (other builders share 4 CPU cores):
  `python3 films/tumbler/tools/rb.py films/false_floor/shots/<set>.py -- --shot SXX --stills 7,40 --pct 30 --samples 12`
  Output: `films/false_floor/tests/SXX_fNNNN.jpg` (view with Read). Do a quick layout pass with a temporary debug light
  first; then beauty. Max ~3 iterations per shot. Do NOT render final animations (`--anim`): the lead renders on GPU.
- When done, write `films/false_floor/notes/<your_set>.md` (shots, frame counts, known issues) and a QC contact sheet
  `films/false_floor/tests/QC_<your_set>.jpg` (first/middle/last frame of each 3D shot at --pct 30, each 3DS still at
  --pct 25) using `python3 films/tumbler/tools/sheet.py <files> --cols 3 --w 640 --out <path>`. Report the paths.
