# FALSE FLOOR · Case No. 02: handoff to a session on the Mac

Written 10 Nov 2026 by the cloud session that built v3.1. Repo `sergerommss95-cpu/olivia-arcana`, branch
`claude/hopeful-hamilton-t32gr5`. Everything below is relative to `films/` unless it starts with `/` or `~`.
The cloud machine is temporary: what is not in git or in `ASSETS_MANIFEST.md` is gone when it is reclaimed.

## 1. State of the film

- **Delivered:** v3.1, 11:28 (688.5 s, 16,523 frames, 1920x1080, 24 fps). Master `false_floor/out/FALSE_FLOOR_E02_v3_1.mp4`
  (2.3 GB, x264 crf 18, AAC 256k, -14.2 LUFS, peak -1.5 dBFS). Review copy `..._v3_1_review.mp4` (358 MiB, crf 23, max 5 Mbps).
  Subtitles `false_floor/out/FALSE_FLOOR_E02_v3_1.srt` (297 cues).
- **Structure:** cold open 0:00 · ch1 0:51.92 · ch2 1:49.17 · ch3 3:11.67 · ch4 6:32.21 · ch5 7:55.04 · ch6 8:44.75 · ch7 10:10.00 ·
  end card 11:13.38. 194 shots. The complete shot list (timecodes, IDs, sources, what each shows, narration) is
  `false_floor/review/REVIEW_BRIEF_E02_v3_1.md`; the reviewer prompt is `false_floor/review/GEMINI_REVIEW_PROMPT.md`.
- **Narration is locked:** George v4, `false_floor/out/vo/vo_george_v4_v01.wav` + `.json` (word timings). Every cut is anchored to a word.
  Never regenerate the voice: the timings would change and every cut list would break.

### Not fixed in v3.1 (from the Gemini review of v3)

1. C7: close-up of the guard's face (smooth skin, all-black eyes). Cold open 00:19.46 and ch3. The main case for Human Generator.
2. C3 (cold open 00:07.33): the open, lit vault is visible at the bottom of the stairs before the reveal. Needs a re-render.
3. N8 (ch3, door opening from inside): rendered with the vault lit; only darkened in the grade (`dim={'N8': 0.5}`).
4. N9: the Monster's hand is loose on the crank. Needs a re-render.
5. A_E19_NIGHT: a two-lane road, not a motorway; the car never pulls over.
6. Narrator says "Agim" two ways (ch5 08:06, ch6 09:41). Cannot be fixed without regenerating that line.
7. A_INTERVIEW: the head turn shows a young-looking profile. M_HISSTORY: rows 3 and 4 stay empty.
8. Real photographs are about 2% of screen time; unused, credited candidates are in `false_floor/assets/evidence/` (README.md there).

### Decisions waiting on Collin

- **Human Generator V4** (bought, order #4277098 on superhivemarket.com): not installed. The cloud could not log in (reCAPTCHA).
  On the Mac he logs in himself and downloads to disk. Licence: personal, single user, never upload or share the files.
  So render Human Generator characters on the Mac only (Metal); do not send them to RunPod unless he says so.
  Untested on Blender 5.2. Plan agreed with him: test on the face close-ups (C7, portraits) first, then decide on a recast.
  The current cast is MakeHuman-based (`false_floor/lib/human.py`, `cast.py`, `mocap.py`); a recast means re-rigging every character shot.
- **Second Gemini pass** on v3.1: send the review copy, `REVIEW_BRIEF_E02_v3_1.md`, `GEMINI_REVIEW_PROMPT.md` and `review/D_cast_lineup.jpg`.
- **Thumbnails and the YouTube package** (not started for v3). The description must list every photo credit used and say the
  CC BY-SA photos are offered under the same licence (`false_floor/script/EP_v3_PLAN.md`, last section).

### Money, at 18:45 UTC on 10 Nov

- **RunPod:** balance $44.00. None of this project's pods exist. Two pods belong to other agents and must never be touched:
  `ff-ep2-v3final-grokbot-b` ($1.09/h) and `trump-crypto-opening-benchmark` ($0.72/h). They drain the same balance.
- **Kling:** 950 credits used of the ~1,000 Collin approved (account had 1,621). Ask before going past 1,000.
- **ElevenLabs:** used for the voice, music and effects; no new generation is needed.

## 2. What is in git and what is not

| Path | In git | Holds | Written by | Read by |
|---|---|---|---|---|
| `false_floor/tools/`, `lib/`, `shots/`, `script/`, `notes/`, `review/`, `fonts/` | yes | code, cut lists, plans, fonts (Barlow Condensed, Inter) | hand | everything |
| `false_floor/assets/` (mapdata, portraits, evidence, epa, kling_raw/jobs.json) | yes | map data, cast portraits, credited photos, Kling source stills, Kling job ids | agents | `mg_maps.py`, `mg_cards.py` |
| `tumbler/lib`, `tumbler/tools` | yes | shared Blender helpers, `rb.py` (runs Blender) | hand | shot scripts |
| `gpu/` | yes | RunPod client, dispatcher, tests | hand | renders |
| `false_floor/out/clips/` | **no** | every source clip: `C*`,`N*`,`S*` 3D renders (.mkv), `S*`/`P_*` stills (.png), `A_*` Kling, `M_*` graphics, `E_*` photo moves | `render_shots.py` (3D), Kling ingest, `mg_cards.py`, `mg_maps.py` | `seq_edit.py` |
| `false_floor/out/vo/` | **no** | narration wav + word timings | `el_vo.py` | `seq_edit.py`, `make_srt.py`, `ep_assemble.py` |
| `tumbler/audio/music`, `tumbler/audio/sfx` | **no** | score `ff_COLD`, `ff_1`..`ff_7`; effects `el__*`, `boom__*`, `whoosh__*`, `mech__*`... | `el_music.py`, `el_sfx.py`, downloads | `seq_edit.py` |
| `false_floor/out/renders/O_*` | **no** | overlay frames: corner labels, title, counters | `episode_edit.py` (v1) | `seq_edit.py` (`E.overlay`) |
| `false_floor/out/edit_segments/END_1080.mp4` | **no** | end card, 15 s | ffmpeg from frames | `ep_assemble.py` |
| `false_floor/out/*_map.json` | **no** | per part: cuts and narration pieces on that part's clock | `seq_edit.py` | `ep_assemble.py`, `chapter_qc.py`, `make_review_brief.py` |
| `false_floor/out/EP3_ch{1..7}.mp4`, `FALSE_FLOOR_COLD_v3.mp4`, `*_tail.wav` | **no, deleted** | the eight built parts and their music tails | `seq_edit.py` | `ep_assemble.py` |
| `false_floor/out/seq_segments/<part>/` | **no, deleted** | per-shot segment cache | `seq_edit.py` | `seq_edit.py --reuse` |
| `false_floor/out/qc/` | **no** | QC sheets and `chapters_final_qc.txt` | `chapter_qc.py`, `frame_qc.py` | `make_review_brief.py` |
| `vendor/makehuman_data`, `vendor/cmu` | **no** | MakeHuman base mesh, rig, clothes; CMU mocap | `vendor/fetch_vendor.sh`, `lib/mocap.py` | every character shot |
| `false_floor/tests/` | **no**, except the four files below | low-res test stills. In git: `S18_anchors.json`, `S24_anchors.json` (the editor draws the magnetic field lines of S18 and S24 from them; without them the lines silently disappear) and two style frames for `thumbnail.py` | `rb.py --stills`, `shots/door_macro.py` | you, `episode_edit.py` |
| `false_floor/assets_private/ref/` | **no** | Collin's brand references (style guide, brand board, icon, sound logo); in `FF_EXTRAS.tar` | Collin | nobody |

The untracked material you need comes as parts (10 for the assets, 7 for the v3.1 master, one small extras file): see `ASSETS_MANIFEST.md`. The eight built parts were deleted to make room,
so the first job on the Mac is to rebuild them (section 4).

## 3. Setup on the Mac

Versions used in the cloud: Blender 5.2.3 LTS · Python 3.13.18 · ffmpeg 6.1.1 (libx264, AAC) · numpy 2.5.3 · Pillow 12.3.0.
Only for regenerating graphics: skia-python 144.1 and opencv-python-headless 5.0.0 (`mg_maps.py`); pyshp 3.1.8 and shapely 2.2.0
(`mg_maps.py prep` only). Nothing imports scipy.

1. **Blender:** install 5.2.3, not 5.1: `https://download.blender.org/release/Blender5.2/blender-5.2.3-macos-arm64.dmg`.
   Then `export BLENDER=/Applications/Blender.app/Contents/MacOS/Blender`. The shot scripts were only ever run on 5.2.3.
2. **Python:** `python3 -m pip install numpy pillow` (plus `skia-python opencv-python-headless pyshp shapely` if you regenerate graphics).
   Untested on 3.14.
3. **Fonts:** nothing to install. `false_floor/fonts/inter/` (Inter, used by `mglib.py`) and `false_floor/fonts/` (Barlow Condensed,
   used by the editor) are in git.
4. **Assets:** join and extract the parts as `ASSETS_MANIFEST.md` says.
5. **Character data:** `bash vendor/fetch_vendor.sh` (downloads MakeHuman data, sha256-pinned). CMU mocap files download on first use.

### Environment variables the tools read

| Variable | Used by | Meaning |
|---|---|---|
| `BLENDER` | `tumbler/tools/rb.py` | Blender binary; default `blender` on PATH |
| `TUMBLER_DEVICE` | `tumbler/lib/common.py` | `CPU` (default), `OPTIX`, `CUDA`, or `METAL` for the Mac's GPU. `METAL` was added for this handoff and has never been run |
| `TUMBLER_ADAPTIVE`, `TUMBLER_LOCK` | `tumbler/lib/common.py`, `rb.py` | sampling threshold; render lock |
| `RUNPOD_STATE` | `gpu/runpod_client.py` | pod state file; default `~/.runpod/state.json` |
| `FF_INTER_DIR` | `false_floor/tools/mglib.py` | folder with Inter .otf files; default is the repo copy |
| `MG_TMP`, `MG_STILLS`, `MG_MAPS_STILLS`, `MG_MAPS_RAW` | `mg_cards.py`, `mg_maps.py` | scratch folder, stills-only modes, raw map download cache |
| `FF_PROTRACT`, `FF_PROTRACT_MAX`, `FF_CLOTH_SMOOTH`, `FF_CLOTH_LAMBDA`, `FF_CLOTH_VP` | `lib/mocap.py`, `lib/human.py` | shoulder and garment tuning; leave unset |
| `VO_LENGTH_SCALE`, `PIPER_VOICE`, `PIPER_PY` | `make_temp_vo.py` | old temporary voice; unused |

### Keys (names and places only)

- **RunPod:** API key in the file `~/.runpod/api_key`. Never in the repo. Collin has it.
- **ElevenLabs:** in the cloud the key was injected by the network proxy; `el_vo.py`, `el_sfx.py`, `el_music.py` send the header
  `xi-api-key: proxy-injected`. On the Mac they will not work until that header is filled from a key, and nothing needs them now.
- **Kling:** through the Kling connector (MCP), signed in on Collin's account. Job ids are in `false_floor/assets/kling_raw/jobs.json`.
- **Superhive (Human Generator):** Collin's own login, in his browser only.

## 4. Commands (run from `films/false_floor` unless noted)

```bash
# timing check only: every shot's length against its source, no rendering
python3 tools/seq_edit.py --seq ch3 --plan

# build one part (cold | ch1 .. ch7). Writes out/<name>.mp4, _map.json, _tail.wav. About 10-35 min each in the cloud.
python3 tools/seq_edit.py --seq cold --out out/FALSE_FLOOR_COLD_v3.mp4
python3 tools/seq_edit.py --seq ch3  --out out/EP3_ch3.mp4
# after changing only the mix or a few shots: reuse cached segments (delete the changed shots' files in out/seq_segments/ch3/ first)
python3 tools/seq_edit.py --seq ch3 --reuse --out out/EP3_ch3.mp4

# QC of built parts: per-shot sheets in out/qc/, in-shot jumps, audio dropouts, loudness
python3 tools/chapter_qc.py out/FALSE_FLOOR_COLD_v3.mp4 out/EP3_ch1.mp4 out/EP3_ch2.mp4 out/EP3_ch3.mp4 \
  out/EP3_ch4.mp4 out/EP3_ch5.mp4 out/EP3_ch6.mp4 out/EP3_ch7.mp4 > out/qc/chapters_final_qc.txt
# QC of single source clips (contact sheet, flicker spikes)
python3 tools/frame_qc.py N3 S26

# master + review copy + SRT in one pass (needs all eight parts, their _map.json and _tail.wav, and END_1080.mp4)
python3 tools/ep_assemble.py --out out/FALSE_FLOOR_E02_v3_1.mp4 --review out/FALSE_FLOOR_E02_v3_1_review.mp4

# review brief for the assembled cut (reads the parts, maps and out/qc/chapters_final_qc.txt)
python3 tools/make_review_brief.py --out review/REVIEW_BRIEF_E02_v3_1.md --video out/FALSE_FLOOR_E02_v3_1_review.mp4

# one graphic or photo move again
python3 tools/mg_cards.py M_CASECLOSED        # or: all
python3 tools/mg_maps.py M_ROUTE_E19          # photo moves download a small depth model on first run

# a 3D shot: test still, then the final clip (frames -> out/clips/<ID>.mkv)
cd .. && python3 tumbler/tools/rb.py false_floor/shots/night.py -- --shot N3 --stills 40 --pct 30 --samples 12 --tag _t
TUMBLER_DEVICE=METAL python3 false_floor/tools/render_shots.py N3 --force --samples 40 --still-samples 96

# RunPod, only if Collin agrees to the spend (from films/)
python3 gpu/runpod_client.py balance
RUNPOD_STATE=~/.runpod/pod21.json python3 gpu/runpod_client.py create --gpu "NVIDIA GeForce RTX 4090,NVIDIA A40" --cloud SECURE
RUNPOD_STATE=~/.runpod/pod21.json bash gpu/pod_go.sh setup
python3 gpu/dispatch.py --pods ~/.runpod/pods.txt --until-empty --idle-minutes 8     # queue = notes/ready_*.txt
python3 gpu/test_dispatch_idle.py
```

Where the cut lives: `tools/ep_cuts.py` (`CH['ch1'..'ch7']`: cuts as `(clip, beat, first word)`, `clip@n` = same clip from frame n,
plus `inoff`, `dim`, `crop`, `noexp`, `speed`, `count`, `vhs`, `beds`, `floor`, `music`, `tailx`) and `SEQS['cold']` in `tools/seq_edit.py`.
Spot effects tied to clip events are `SPOTS` in `seq_edit.py`.

## 5. Rules Collin set

- No faces of real people anywhere. Evidence is free-licensed only, credited on screen.
- 3D and AI shots carry the "ILLUSTRATIVE RECONSTRUCTION" label (the editor adds it).
- Push only to `claude/hopeful-hamilton-t32gr5`; no pull request unless he asks. No model names in commits or files.
- Never commit keys. Never touch another agent's RunPod pods. Do not run MPFB add-on code (only its data files are used).
- Ask before spending past the Kling budget or starting pods; say what it will cost.

## 6. Traps already hit

1. **Disk fills silently.** A full build writes about 6 GB of segments. When the disk filled, the ch3 build failed, the script
   carried on, and QC ran on the old ch3. Check `df -h` first and check that each `seq_edit` printed `[seq] wrote`.
2. **Stale QC sheets.** `chapter_qc.py` uses whatever `.mp4` and `_map.json` exist. Compare the shot count it prints with the cut list.
3. **`--reuse` only checks frame counts.** A cached segment with the right length but old picture is reused. Delete the segment
   file when a clip, crop or grade changes.
4. **The same clip twice in one part** must use different ids (`S17` and `S17@24`), or it is one segment file.
5. **Kling adds its own cuts** inside 5 s clips. Run `frame_qc.py` on every new clip; ask for "one continuous shot, no cuts".
6. **Kling result links expire in 24 h.** Download at once into `assets/kling_raw/`, then ingest to `out/clips/A_*.mkv`
   (`ffmpeg -an -vf fps=24,scale=1920:1080 -c:v libx264 -crf 12`).
7. **Idle pods drained the balance once** ($42 idle of $55). The dispatcher now terminates its own pods after idle minutes;
   a pod created by hand and not in `pods.txt` is watched by nothing.
8. **New pods need `vendor/`** (`pod_go.sh setup` uploads it now). Without it every character shot fails in seconds.
9. **Per-part loudness** is a constant gain to -14 LUFS plus a limiter. A plain peak-limited gain came out 5 dB quiet.
10. **Auto exposure lifts dark frames.** Studio portraits on black need `noexp`; night shots that render bright need `dim`.
11. **Two heavy Blender processes at once** ran the cloud box out of memory. One at a time.
12. **Gemini samples one frame per second**: it misses short events and misreads mid-animation frames. Verify each finding on the frames.
