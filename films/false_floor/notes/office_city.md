# Set C · office / dealer's table / bag / district — builder C (`owner: C_office_city`)

Script: `shots/office_city.py` (all shots, `--shot SXX`). Set helpers: `lib/office_city.py` (materials + builders; reuses
`tumbler/lib/city.py`: SB, sweep, `mat_room`, `mat_facade`, `mat_wet_asphalt`, `mat_stone`, `mat_window_glass`).
QC sheet: `tests/QC_office_city.jpg`. Ready list for the GPU pods: `notes/ready_C_office_city.txt`.

```
python3 films/tumbler/tools/rb.py films/false_floor/shots/office_city.py -- --shot S08 --stills 1 --pct 25 --samples 16
# finals (lead, GPU): render_shots.py S04 S05 S08 S11 S23 S38   (3DS -> --anim --from 1 --to 1, 2560x1440 16-bit PNG)
# flags: --debuglight (flat layout light, no DOF/haze)  --nohaze  --nodof  --hide Obj1,Obj2 (debug)
```

## Shots (all 3DS: one frame, 2560x1440, ~15% safe room on every side for the push)

| Shot | What it is | Camera | Light |
|---|---|---|---|
| S04 | The district at **dusk**: the street mouth from across a wet road — stone/glass office fronts, a row of steel bollards across the entrance (one retracted), the police-post kiosk on the right corner, bracket CCTV cameras on the facades + a dome on the kiosk, span-wire lamps receding. Cold dusk sky over a low two-storey corner block = calm **left third** | 32 mm f/5.6, 2.2 m high, 40 m out, slight tilt up | Sky (world gradient, warm horizon glow), sodium span lamps + wall lanterns on, cool security lights over entrances, lit kiosk, ~58% of office windows lit |
| S05 | Dealer's table under north light: an opened diamond paper (white outside, blue liner, fold memory) with ~11 rough pebble-like stones + 2 small polished ones, 3 stones spilled by the tips of diamond tweezers, a folding loupe, pocket carat scale (lid up, LCD blank), closed parcels and a pen (soft foreground) on a black leather pad / dark lacquered desk | 60 mm f/2.8, 0.55 m, 39 deg down | Big cool north-window softbox back-left, warm off-frame desk lamp right, faint bounce |
| S08 | The rented office, **afternoon**, seen from the corridor through the open door: the door leaf on the right carries the brass nameplate (engraved bars only, nothing legible), through the doorway a plain veneer desk with a precision balance (glass draft shield), an office phone with coiled cord, a black desk lamp (off), blotter, papers, three closed parcels, an **empty task chair**, venetian blinds over the window, coat stand | 24 mm f/4 at the threshold, 1.45 m | Low sun through the slats (stripes on desk and floor), sky fill through the blinds, thin local haze for the shafts, dim corridor fluorescent |
| S11 | Macro: canvas messenger bag on a beech chair; a leather front strap with a box-X stitch, and in the middle of the X a **pinhole lens** (black glass bead in a dark bezel) catching a small glint; flap binding with saddle stitching, brass buckle below | 85 mm f/2.8, 0.34 m, 30 deg off-axis (focus falls off to the right) | Raking window light from the left, weak front fill, warm rim, small glint source for the lens |
| S23 | The district at **night**, Saturday: low view up the empty wet street — bollards across the entrance reflected in puddles, the police post lit (cool fluorescent) on the right, shuttered shopfronts, span-wire sodium lamps receding into a thin mist, a few cool security lights and lit windows. **Left third** = the plain stone corner of the near building (calm, for the date card) | 30 mm f/4, 1.3 m | Sodium span lamps + lanterns, cool kiosk/security lights, faint cool night sky |
| S38 | The **same office at dusk**, same camera as S08: blinds glowing cold blue (lit office block across the street through the slats), one warm desk lamp pooling on the desk and phone, the empty chair in silhouette, nameplate faintly caught by a corridor night light | as S08 | Blue window fill, practical desk lamp (2700 K), dim corridor light |

## Known issues / notes
- No people, no text: the nameplate, phone keys, balance and carat-scale displays are blank or abstract bars; no signs on
  the fascias, nothing on the kiosk.
- S08: the slat stripes on the desk are compressed by the low eye-level view; they read on the floor in front of the
  desk (bottom band, partly inside the push-in crop) and as highlights on the props. Haze is a local volume box.
- S04/S23: facade cameras are ~30 px wide at 2560 in S04 (small but readable); the kiosk interior is a simple desk,
  cabinet, monitor shape and half-drawn vertical blinds (empty).
- S05: two small polished stones kept deliberately small and matte-lit (no caustics) so it stays "documentary", not an ad.
- Render cost (CPU, shared 4 cores, 25%, 16 spp): 20-45 s each. Finals at 96 spp on OptiX should be ~1-3 min/still.
