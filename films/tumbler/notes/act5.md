# Act V — The Rosette + Title (state at render pause)

Owner: Act V builder agent. Nothing committed. Rendering was paused by the lead mid-way through the
final timing pass, so a few numbers below are marked **unverified**.

## Files

| file | status |
|---|---|
| `shots/act5_title.py` | new. Shots `5A`, `5A2`, `5B` (`--shot`), plus `--debuglight` (flat overhead light, no DOF) |
| `lib/title.py` | new. `mat_perlage` (engine-turned steel), `mat_letter_steel`, `title_text`, `link_light` |
| `lib/note.py` | rewritten print/material. API kept: `make_banknote(name, detail, coll, xs, ys)`, `flutter(...)`, `mat_banknote(name, detail)`. New: `conform(o, fn)`, `hero_xy()`, `uv_to_xy()`, constants `HERO_UV`, `HERO_R`, `HERO_RADIUS_M` |
| `shots/test_note.py` | test card: `--view full` (default), `--view macro` (hero rosette, grazing light), `--view lo`; `--bump K` scales bump distance |

Render commands (the lead runs the final queue):

    python3 tools/rb.py shots/act5_title.py -- --shot 5A  --anim     # 60 frames -> out/renders/5A/
    python3 tools/rb.py shots/act5_title.py -- --shot 5A2 --anim     # 36 frames -> out/renders/5A2/
    python3 tools/rb.py shots/act5_title.py -- --shot 5B  --anim     # 72 frames -> out/renders/5B/

`5A2` is not in shotlist.json yet. It is a 36-frame render (24 cut + 6 handles each side), only used under
the 5A slot for the dissolve. Please add it to the edit list.

## 5A: banknote to rosette (60 frames, cut 7..54)

- Real metres. The note is 0.156 x 0.066 m and lies on a dark engine-turned steel plate. It has a soft
  old centre fold and a slight curl (`conform`, max ~0.5 mm), so the macro DOF has something to fall off on.
- Camera: 100 mm lens, looking straight down (orthogonal), shutter 0.4. Frames 1..7 are static with the note
  width filling the frame width exactly (0.998 W). The note overfills vertically by about 0.3 mm, so no
  background shows. Orientation for the 4D handoff: front face up (+Z), 'TUMBLER RESERVE NOTE' upright at
  the top, green hero rosette left, red seal right.
- Push f7 → f33 (ease in/out, log zoom, 0.433 m → 0.153 m) onto the hero rosette. f-stop 8 → 3.2, focus on
  the paper at the rosette. At the same time the note turns clockwise about the rosette centre. Angular
  speed eases from 0 at f7 to `OMEGA` = 1.6°/frame at f22, then stays constant.
- From f33 (`ARRIVE`): the rosette is centred and its rim (ρ = 1, r = 9.24 mm) fills 80% of frame height.
  The camera keeps creeping +0.25% size per frame (`CREEP`) so it never goes static.
- Light: a warm 4300K spot from the upper left at 55° elevation irises from a 22° to a 6.5° cone during the
  push. That turns the frame into a pool on the rosette with the paper falling off to cool shadow (amber
  vs teal). A 3700K grazing spot at 8° elevation catches the raised ink. Cool fill and edge lights are very
  low. A few dust motes.
- Samples: 16. Full-res f40 measured **21.1 s at 20 samples**. At 16 it should be about 17 s
  (**unverified**).

## 5A2: dial clicks to 0 (36 frames, cut 7..30), the T5 dissolve partner

- `lock.build_dial` in dial units, head-on, 70 mm lens, f-stop 0.16 (slight softness on the knob), focus on
  the face plane. The door plate uses `title.mat_perlage` (real engine-turning) through `mats={'plate': ...}`.
- Light follows the Act I language: a warm 3100K grazing sweep from the left, a soft warm key from the upper
  left (numerals read), cool top rim, warm kick on the medallion. Two disc lights near the lens axis are
  **light-linked** (Cycles light linking). One puts a satin sheen on the black face only. The other puts a
  faint pool on the plate only, so the metal plate and bezel don't mirror the face light.
- Full-res **13.7 s/frame** (24 samples), measured.

### Dissolve map (lead: please use this)

- **5A2 frame f = 5A frame f + 24.** 5A2 f7..f30 lie under 5A f31..f54.
- Both shots are centred and both turn clockwise at 1.6°/frame. The rosette rim (ρ=1) and the dial's
  knurled rim (r=1) are the same size on screen and creep at the same rate from 5A f33.
- The rosette rings at ρ 0.32 / 0.445 / 0.955 / 1.0 line up with the dial's medallion, knob, face edge and
  knurled rim.
- Suggested edit inside the 48-frame 5A slot:
  - 5A f7..f32: 5A alone (note → rosette).
  - **5A f33..f42 ↔ 5A2 f9..f18: cross-dissolve (10 frames).** The rosette is in place and turning at
    constant speed from f33 onward, so the dissolve can start anywhere from f33.
  - The dial holds the matched speed through 5A2 f15. It accelerates over f15..f19 and **clicks onto 0 at
    the index mark on 5A2 f19 = 5A f43 (a beat; film frame 576 if 5A starts at 540)**. It overshoots
    0.55 tick at f20, springs back 0.12 at f21 and settles at f22.
  - 5A f43..f54 = 5A2 f19..f30: the dial alone, holding 0. 5A2 has handles f1..f8 and f31..f36.
- The luminance step is large: cream paper (p50 ~0.3) to a dark dial (p50 ~0.02). 5A's end frame is
  already a pool on darkness to soften it. A luma-weighted dissolve or a slight dip will look better than
  a straight mix.

## 5B: title (72 frames, cut 7..66)

- "TUMBLER" in Blender's built-in font, weighted with curve offset 0.012, extrude 0.07, chamfer 0.016. It is
  auto-fitted to 2.7 m wide (about 59% of frame), with tracking 1.18.
- Letter material: steel with brushed faces (anisotropic, tangent along local Y so reflections smear
  vertically) and polished chamfers. The shader tells face from chamfer by object-space normal.
- Behind the letters, out of focus (55 mm lens, f/0.35 at 7 m): a stack of three `lock.build_wheel` brass
  tumbler wheels and a second pair further back at upper left. They turn slowly in alternating directions
  (0.4–0.75°/frame).
- Light, all light-linked:
  - Letters only: a vertical 3800K strip behind the camera travels left → right (f8 → f46). Its reflection
    is a crisp band crossing the word, crossing letters around f18..f36. Also a cool top rim on the upper
    chamfers, a warm low kick on the left chamfers, and a faint broad front sheen so the faces never go
    fully black.
  - Wheels and motes only: a warm key from the top right, a low warm grazer and a faint cool edge.
- From f50 everything dims to about 25%. At f64 the frame is almost black (p95 0.12), and the edit does
  the final fade.
- Full-res f30 measured **26.7 s/frame at 24 samples: over budget.** I've since dropped it to 16 samples,
  which should be about 18 s, but this is **unverified**. The out-of-focus brass wheels are the noisiest
  part, so check them in the first frames of the anim.
- Highlights: the brightest full-res still (f30, sweep peak) has 0.02% clipped pixels, under the 0.5% flag.

## Banknote (lib/note.py)

- New layout, still fictional ('TUMBLER RESERVE NOTE', no portrait, no real-currency layout):
  - Green hero guilloche rosette (left). It is nested: a centre crossing rosette, a milled ring, a 12-petal
    crossing-spiral field, a double rim with milling, and a lighter 16-lobed wavy wreath on a pale green
    underprint.
  - An **engraved vault-door medallion** in the centre, where a portrait would be. Its tone is rendered by
    line weight: stepped rings, 20 bolts with lit crescents, a cross-hatched 5-spoke hand wheel.
  - Red toothed seal, corner rosettes behind both '100's, a rope-guilloche border with frame lines, fine
    wavy background lines, and a soft green → cream → ochre rainbow underprint.
  - Extra text: 'WILL PAY THE BEARER ON DEMAND' and 'SERIES A'.
- Fixed: the central medallion never rendered. `nb.math(..., LENGTH-node)` linked `VectorMath.outputs[0]`,
  which is the zero Vector socket, not `'Value'`. Patterns are now built through a small expression
  wrapper (`X`) that always links the right socket.
- Ink is darker and greener (`INK` (0.006, 0.072, 0.05)), lines are bolder, and there is a pale green tint
  under the motifs, so the green reads at small sizes.
- Intaglio relief and paper fibres come from one Bump node. Note: in Blender 5.2 the bump needs about 10x
  the "physical" height to read (Filter Width input, set to 0.4). The weights are tuned by eye under
  grazing light.
- Performance: the print is split into four regions (hero disc / left / centre / right). Each region has
  its own node copy and its own BSDF, joined by hard 0/1 Mix Shaders, so Cycles' jump-if-zero only
  evaluates the motifs under the shading point. Full-res macro of the hero went 44 s → 15 s (16 samples).
- **'lo' detail**: same print and colours, **no bump, no text meshes**, about 1/3 the shading cost. 'lo'
  notes now use their own material, **`BanknoteLo`** ('hi' uses `Banknote`). Signatures are unchanged.
  Tell the Act IV agent in case they look a material up by name. The hero note that flies into the lens at
  the end of 4D should use `detail='hi'` so it matches 5A f7.
- `flutter()` is unchanged. Text meshes don't follow `flutter` (they're parented, not deformed). That's
  fine for 'lo', which has none.

## Open issues / not done

1. **No motion check of any shot** (`--anim --step 3`); only stills. Rendering paused.
2. **5B budget unverified** at 16 samples (was 26.7 s at 24). If it is still over budget, cut DOF noise:
   fewer, larger motes, or wheel material `scale`/detail lower.
3. **5A budget unverified** at 16 samples (21.1 s at 20).
4. The `note_test_full` test card in tests/ predates the final ink colours and the move of the
   bottom-left corner rosette. `tests/5A_f0007.jpg` shows the current note in shot light, and
   `tests/note_test_macro_opt_f0001.jpg` the current macro. Re-render with
   `python3 tools/rb.py shots/test_note.py -- --stills 1 --pct 100`.
5. Mid-push (around 5A f18..f24) there is clear motion blur on the far side of the note (lateral move plus
   rotation). It is natural, but if the push should feel slower, lengthen it (`ARRIVE` later) and move the
   dissolve later to match. `tests/5A_f0020.jpg` is from an earlier lighting pass but shows the blur.
6. Under the warm key the green ink reads olive-green. The grade can push it. A cooler key (`kelvin(4300)`
   → 5000) also works.
7. **lock.py bug (not mine to fix):** `mat_engine_turned` has the same `VectorMath LENGTH → outputs[0]` bug,
   so the door-plate engine-turning in Act I never renders. `title.mat_perlage` is a working replacement
   (object-space tangent, unrotated objects only). It can be passed to `build_dial(mats={'plate': ...})`.
8. The 5A2 perlage reads slightly spiky or "egg-crate" near the bright pool; acceptable in the dark. The
   brass wheel faces in 5B are mottled (from `mat_brass` wear noise).
9. exposure_check flags: 5A shows LIFTED BLACKS because paper fills the frame and there are no true
   blacks by design (corners about 0.1–0.16). 5B shows MURKY because it is a black title card by design.

## Last stills

- 5A: `tests/5A_f0007.jpg` (cut-in, full note), `tests/5A_full_f0040.jpg` (full res, rosette),
  `tests/5A_f0054.jpg`
- 5A2: `tests/5A2_full_f0013.jpg`, `tests/5A2_full_f0019.jpg` (click on 0), `tests/5A2_f0022.jpg`
- 5B: `tests/5B_f0007.jpg`, `tests/5B_full_f0030.jpg` (full res, sweep crossing), `tests/5B_f0064.jpg`
  (dimmed)
- Note: `tests/note_test_macro_opt_f0001.jpg` (current), `tests/note_test_full_f0001.jpg` (slightly stale)
- Contact sheet: `tests/act5_contact.jpg`
