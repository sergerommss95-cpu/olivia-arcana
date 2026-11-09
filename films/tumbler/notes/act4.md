# ACT IV — THE GETAWAY (night city): state at pause

Status: **all four shots build and render end to end; no shot is final.** Rendering was paused by the lead
mid-iteration (round 2 of ~4 for 4A, round 1 for 4B/4C/4D). Nothing was committed. No `--anim` was run.

Latest contact sheet: `tests/s4_act4_current.jpg` (4A f1/f54, 4B f8/f26, 4C f7/f42, 4D f18/f34).
Car study: `tests/s4_car_studio.jpg`, `tests/s4_car_night.jpg`. Debug-lit layouts: `tests/s4A_dbg.jpg`,
`tests/s4B_dbg.jpg`, `tests/s4CD_dbg.jpg`.

## Files

- `lib/city.py`: reusable toolkit (no edits to common/lock/note).
  - `build_car()`: procedural 70s/80s four-door sedan, no make or logos. Lofted body shell (46 stations,
    character crease, boolean wheel wells, 12 mm bevel) and greenhouse (A/B/C pillars, tumblehome,
    wrap-around screens). Details: chrome bumpers, quad rectangular headlamps with prism-grid emissive
    lenses, a full-width ribbed red tail bar with chrome dividers, grille, belt/rocker/rub strips,
    arch mouldings, mirrors, handles, wipers, antenna, exhaust, fictional plates "TMB 417", and an
    interior silhouette. Black clearcoat paint has orange peel and object-space panel gaps. Wheels have
    chrome turbine dishes and grooved tyres. The **right rear window is open** for the notes.
    Rig: root (path pos + yaw + terrain pitch) -> body (roll/pitch/heave) -> panels; root -> steer
    pivot -> wheel (spins about local Y). Head spots (4300 K) and a tail glow light are parented.
  - `Path` (centripetal Catmull-Rom, arc length) + `drive()`: speed profile -> per-frame keys with
    spring-damped body roll from lateral g, squat/dive, drift slip, steering, wheel spin and kerb kicks.
    It also fills `car['state'][f]` (world matrices) and `car['traj']` for the wake.
  - `note_wake()`: notes thrown from the open window and/or lifted off the road. Driven by a wake
    field (entrainment, swirl, upwash, turbulence) with anisotropic paper drag, sway, tumbling and
    landing flat on the wet road. Keys loc/rot/scale per frame plus bend/twist.
  - `paper_bend()`: see "Bug found" below.
  - City pieces: `build_street` (wet asphalt with a water-film coat and mirror puddles, kerbs,
    sidewalk slabs, markings, zebra, manholes), `build_buildings` (one box + one shader facade each:
    random warm/cool/dark rooms, blinds, shopfronts), `build_bank_tower`, `streetlights` (sodium
    cobra heads, 2000 K, linked copies), `police_strobe` (beat-locked red/blue double flashes, keyed
    CONSTANT per frame), `build_tunnel` (portal, glazed tiles, amber chamfer fixtures).
  - `build_bank_tower` is the hero 7-bay x 14-floor tower. Real recessed windows: frames, 2 mullions
    + transom, glass, `mat_room` interiors (ceiling gradient, blinds, desk/monitor/column silhouettes,
    warm 2400-3900 K / cool / greenish, ~16% dark). Granite podium with garage ramp (tubes, hazard
    guards, shutter drum), lobby and brass "TUMBLER TRUST".
- `shots/act4_city.py --shot 4A|4B|4C|4D`. Debug flags: `--debuglight`,
  `--ov x,y,z,tx,ty,tz[,lens]` (static overview cam), `--nodof`, `--nonotes`.
- `shots/test_car.py`: car study card (frames 1-4 = four angles; `--studio` for soft boxes).

Render settings: 32 samples, adaptive 0.04, bounces (2,4,4), clamp 6, AgX Medium High Contrast,
exposure 0, motion blur 0.5, world gradient strength 2.5. Emissive windows, facades and lamp lenses
use emission sampling NONE; the spots/area lights do the lighting.

## Shots: what works / what is left

**4A (60 fr).** Opens head-on on the 7x4 grid. Camera at (0, -12.96, 19.3), 28 mm, looking +Y, floors
2-5, held static f1-f11 for the dissolve. Then a drone dive to the garage mouth (framed ~f25). The car's
nose crosses the facade at f27 and it drifts left onto the street. The camera pans to follow it away;
police strobes wash in from off-screen west.
Left to do:
- (a) The tweaks made after the last still are **untested**: lamps 1300 W, lighter asphalt, wider
  room-intensity spread, uplights moved to y=yf-2.6 at 3500 W, StreetBounce cut to 1400 W.
- (b) Piers/spandrels nearly black in f1. They need a visible graze (check the new uplights).
- (c) Police wash should read more clearly red-vs-blue on the podium and road.
- (d) At f54 the car is still close and crossing. Consider a faster exit or a longer follow.

**4B (36 fr).** Lens on the asphalt (z 0.14, 18 mm) 0.45 m right of the car's path. The car (26 m/s)
passes at f19, whip-pan right ~180 deg f17-25, then tail lights receding over the mirror-wet road.
Left to do:
- (a) Shopfronts are oversized flat beige panels and the upper window grids look too regular.
  Reduce shop strength to ~0.6, add mullions/fascia, lower lit fraction.
- (b) Notes are too small/far to read. Put 10-15 ground notes in the car's path 1-6 m ahead of the
  final view so the wake lifts them past the lens.
- (c) Add warm shop-spill area lights (visible_glossy off) so sidewalks get pools.

**4C (48 fr).** Tracking alongside at 22 m/s, 32 mm, camera 4.1-4.5 m off the car's right side, slowly
slipping back. Police heads trail 14/26 m behind; 60 notes stream from the window.
Left to do:
- (a) Framing too tight: the nose is cut. Pull out to ~5.5 m or use a 28 mm lens.
- (b) Far-side shopfronts read as huge flat pink/white panels. Same facade fix as 4B.
- (c) The side panels are too dark. The near side (behind camera) needs lights for the paint to
  reflect: sodium heads plus shop spill.
- (d) Notes not yet legible in stills. Verify with a debug pass.

**4D (48 fr).** Rear chase, 30 mm, ~7.5 m behind. The car reaches the portal at f13 and the camera
enters ~f20; amber tunnel strips streak and the blue/red police wash hits the rear.
Hero note: released from the window at f21, tumbles at the lens, lands **flat at f38** and holds
flat to f48.
Left to do:
- (a) Exposure flags CLIPPED 1.3-1.8% (tail bar and fixture lenses) plus MURKY walls. Drop the tail
  lens strength from 3.5 to ~2, raise the fixtures' light into the walls (more strength, or add
  area lights per n fixtures).
- (b) The note reads lavender in flight (police blue from behind). Warm it: reduce blue near the
  end and raise NoteFill.
- (c) The landed frame has **not been re-rendered since the bend fix**. `tests/4D_dbg_f0042.jpg`
  shows the old truncated text.

## T4 handoff (4D end -> 5A)

The note is `make_banknote('HeroNote','hi')`, with its text joined into the paper and parented to the
camera.
- From f38 it sits at camera-local (0, 0, -0.126 m): lens 30 mm, sensor 36 mm, note width = 103% of
  frame width (about 4% vertical overfill).
- It faces the camera with the print side toward the lens and the text upright, not mirrored.
- A residual tremble of ≤0.003 rad decays by ~f44. Bend and twist are 0 after f38, so the paper is
  flat.
- Lighting at the end: amber tunnel fixtures sweeping plus a warm 2600 K camera-parented fill
  (0.6 W).

## T3 handoff (3D end -> 4A)

The grid is 7 bays at 4.4 m pitch (window openings 3.84 x 1.9 m, piers 0.56 m) by 4 floors at
3.2 m. The frame runs mid-spandrel to mid-spandrel and the corner piers are cut at the left/right
edges. Frames 1-11 are static. Windows are about 2:1 wide rectangles, roughly 75% lit (warm majority,
cool fluorescent, a few dark, some with blinds).

## Timing (measured, half res 640x268, 16 samples, incl. per-frame sync)

| shot | s/frame | note |
|------|---------|------|
| 4A | 3.2-5.8 | |
| 4B | 5.6-7.1 | |
| 4C | 6.5-7.9 | |
| 4D | 6.0-7.0 | |

**Full-res 1280x536 at 32 samples was not measured** (paused). A naive 4x pixels x 2x samples estimate
is 25-55 s/frame, likely **over the 20 s budget**. Before the final queue, measure one full-res still
per shot. Expect to need ~20-24 samples, adaptive 0.05, and possibly the notes' motion_steps lowered
from 2-3 to 1. There are no volumes in Act IV.

## Bugs found (relevant to other acts)

1. `common.shade()` calls `Mesh.shade_smooth_by_angle`, which does not exist in Blender 5.2. It
   silently falls back to **all faces smooth**, including flat caps of cylinders/boxes made with
   `smooth=True`. City code uses `mesh.shade_smooth()` + `mesh.set_sharp_from_angle()` (`city.smooth_angle`).
2. SimpleDeform BEND about **Y** (as in `note.flutter`) measures the bend along the note's
   thickness:
   - on a flat 'lo' note it does nothing;
   - on a 'hi' note only the text bends, so the text slides off or into the paper (the right half
     vanished in my test).
   `city.paper_bend()` fixes it: bend about Z in the space of a child empty rotated 90 deg about X,
   which curls the paper along its length. TWIST about X works as-is. `note.flutter()` has the same
   problem for whoever uses it.
