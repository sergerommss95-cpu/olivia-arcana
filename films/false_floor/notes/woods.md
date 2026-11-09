# S5 Woods off the E19 — builder notes (owner E_woods)

Files
- `lib/woods.py` — all builders: numpy heightfield (`HField`) so leaves stack and props drape over the litter;
  oak/beech leaf prototypes (smooth ~100-row outlines, lobes/serration, torn edges, cupping) scattered as linked
  copies; torn black bin bags (`build_binbag`, closed `build_bag_flight`); damp paper (receipt, torn envelope,
  folded document, small folded packets, wads) with abstract print lines; rough pale stones; half a salami baguette
  (cut face, bite, crust ring, salami with fat specks); twigs, trunks, walking stick; fake distance fog
  (`fog_wrap`) + overcast world (`woods_world`); soft-edged night fog volume (`mat_fog_soft`); `build_tableau()`
  (the SF2/S36 macro set).
- `shots/woods.py --shot S31|S33|S35|S36` — episode shots. `shots/sf_woods.py` — the SF2 style frame (same
  tableau builder).
- Flags on both scripts: `--debuglight` (flat light, no DOF/fog), `--nodof`, `--seed N`. `sf_woods.py` also has
  `--dolly` (240-frame lateral dolly keyed, focus locked on the cut face) and `--closeup` (inspection camera).

| Shot | Kind | Frames / res | What | Camera / light |
|---|---|---|---|---|
| S31 | 3D | 1..252 (cut 7..246), 1920x1080, 40 spp, MB on | Night woods, fog between trunks. Bag 1 thrown in from the motorway side (left, behind): airborne f55, lands f70; Bag 2 airborne f111, lands f128. On impact each closed, tumbling bag swaps to a pre-torn settled bag (squash/settle keys f+0..9), papers, wads, packets and a few stones burst out of the mouth and land at their rest poses over 7–22 frames (one sheet floats down until ~f104), a few leaves hop. f160–252 settle; fog drifts. | 32 mm f/2.8, low (0.44 m) slow push of 0.4 m, eased, 1.5 mm shake; focus on bag 1. Cold moonless dome + 11000 K top light + 9000 K soft cool key from camera right; one faint, small, desaturated ~2700 K glow far off between the trunks (motorway). Soft-edged fog volume 30x28x3 m, density 0.02. |
| S33 | 3DS | 1 frame, 2560x1440 | Same woods, grey morning: worn muddy path winding into the fog; a walking stick (crook handle, rubber ferrule) leaning on a beech beside the path. | 0.95 m eye, 40 mm f/2.8, focus on the stick. Overcast dome + large soft key from far behind (6800 K), fog. |
| S35 | 3DS | 1 frame, 2560x1440 | The torn bags in daylight: three bags (one main bag torn open toward camera, one smaller, one emptied/flattened) with ~23 items fanned over the leaves: envelopes, receipts, folded document sheets, small folded paper packets, wads, rough stones. | 0.62 m, 35 mm f/4, focus on the main bag mouth. Overcast. |
| S36 | 3DS | 1 frame, 2560x1440 | The SF2 macro tableau (receipt, torn envelope, folded document, loose rough stones, torn bag behind, half a salami sandwich as hero). | Layout on a 50 mm "composition" lens, rendered at 37.5 mm (`LENS_K=0.75`) so the SF2 frame sits in the central ~75 % (push room); f/2.8 keeps SF2-like bokeh. 0.12 m off the ground. |

All 3DS stills: compose with subjects inside the central ~70 %. No people, no type, no HUD. Paper props carry
abstract print lines only (not legible; no names).

Render
- Tests (CPU, lock runner): `python3 films/tumbler/tools/rb.py films/false_floor/shots/woods.py -- --shot S36 --stills 1 --pct 25 --samples 16`
- S31 anim (lead, GPU): `TUMBLER_DEVICE=OPTIX python3 films/tumbler/tools/rb.py films/false_floor/shots/woods.py -- --shot S31 --anim`
- 3DS finals: `... --shot S33 --stills 1` (2560x1440, 48 spp default).
- Build time ~25–45 s per shot (leaf scatter + paper draping in Python). Scene sizes: S31 ~8.5k leaf instances
  + volume; S35 ~10.6k; S33 ~9.5k; S36 ~5.8k.
- CPU timings here (4 cores): SF2 full res 1920x1080 at 48 spp = 355 s (over the 90 s target); S31 test frames
  at 30 % / 16 spp ≈ 50 s each (+40 s build); S35 at 25 % ≈ 70 s, S36 ≈ 50 s, S33 ≈ 43 s. Expect a 4090 to do S31 at 1080p/40 spp within the
  ~8 s/frame budget; if not, drop `vol_step` to 4 or the fog density/box size first.

Known issues / honest limits
- S31: the tear is not simulated. The closed flight bag is swapped for the pre-torn, settled bag on the impact
  frame (hidden by the squash keys and motion blur). Spilled papers fly as rigid pre-draped sheets (no bending in
  the air). Check the swap frames 70/128 in motion.
- Leaves are single-sided instanced meshes (no thickness); at the S36 foreground distance edges are smooth but
  very close leaves can still look thin.
- Fog in the daylight shots is a per-material distance mix (cheap aerial perspective), not a volume: no shafts.
- Trunks are procedural columns with a bark shader; no branches or canopy (frames crop below ~2 m) and no
  undergrowth (bramble/holly) yet.
- The bread crumb and crust are procedural; at very close range the crumb pores still read slightly graphic.
- `stills`-only SF2 final (`tests/SF2_woods_final_f0001.jpg`) was rendered before the leaf-outline / crumb /
  salami upgrades the lead asked for afterwards; re-running `shots/sf_woods.py` now gives the upgraded look.
