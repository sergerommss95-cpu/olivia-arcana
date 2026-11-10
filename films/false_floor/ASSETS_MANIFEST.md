# FALSE FLOOR · Case No. 02: assets that are not in git

Packed 10 Nov 2026 from the cloud machine that built v3.1. Everything here is needed to rebuild the film and is in no
repository. The parts were sent to Collin through the Claude app (Outputs of the cloud session). Read `HANDOFF_MAC.md` first.

## 1. The parts

One tar archive, `FF_ASSETS.tar`, 3,448,289,280 bytes (3,448.3 MB), split into 10 parts of at most 340 MiB (356.5 MB).

| Part | Bytes | Size | sha256 |
|---|---:|---:|---|
| `FF_ASSETS.tar.part00` | 356,515,840 | 356.5 MB | `b468a72f1abae15a87198d0c5363a1e4773d6b701f71aa8833fd1b6ea6e4b410` |
| `FF_ASSETS.tar.part01` | 356,515,840 | 356.5 MB | `ab1deb60523d14a9290a80375d522d6d81593b2fa558373c41562148aa346cb1` |
| `FF_ASSETS.tar.part02` | 356,515,840 | 356.5 MB | `f412baa94219f5072927d2aeadeb28b71bad163ce22fccaec462b8fd409bdf9b` |
| `FF_ASSETS.tar.part03` | 356,515,840 | 356.5 MB | `2973e17c32736b0a853372cbefdba0e75890b1dfeaa04be5afcb70e987695391` |
| `FF_ASSETS.tar.part04` | 356,515,840 | 356.5 MB | `1bfb25afa6503cd749b498881abca6ac16ef69968faea5ef19233d23ef846a8c` |
| `FF_ASSETS.tar.part05` | 356,515,840 | 356.5 MB | `d3d990ae5980e6465ec4d0357b2219824cd4c28bd22f81eb5870a197781ad2be` |
| `FF_ASSETS.tar.part06` | 356,515,840 | 356.5 MB | `16c7c175c0280a54e50e0dfedf0aac55059cb19209baed87ba3cbd27150f6e2a` |
| `FF_ASSETS.tar.part07` | 356,515,840 | 356.5 MB | `6910be2dff41674f4023eddb042ac45cbb4c9b50420de9b83e6d3d720497746e` |
| `FF_ASSETS.tar.part08` | 356,515,840 | 356.5 MB | `8206f8639011f93d85ab4abe8c4a506000465f5d578a3239e6ee7980b743c78d` |
| `FF_ASSETS.tar.part09` | 239,646,720 | 239.6 MB | `0cf1283ddb8e1d4d635dc07bf52561948defa67ecafc90f94b7b58ceb8f09e14` |

sha256 of the joined `FF_ASSETS.tar`: `6a2b55721a671cb71097ee5bdf209523e693c074681925e2c286b9f666fbb7bb`

Separate small file:

| File | Bytes | sha256 | Holds |
|---|---:|---|---|
| `FF_EXTRAS.tar` | 3,041,280 | `b185e1603ee694ecdf1de34918ef89e66358e27900ca6576da5cb828d37c6021` | `vendor/cmu/02.asf`, `vendor/cmu/02_01.amc` (the two CMU mocap files the walk cycles use; `lib/mocap.py` downloads them from mocap.cs.cmu.edu on first use if they are missing) and `false_floor/assets_private/ref/` (the brand references Collin supplied: style guide, brand board, icon, sound logo; kept out of git on purpose, no tool reads them). |

## 2. The film itself

**The v3.1 master is included**, split the same way: `FALSE_FLOOR_E02_v3_1.mp4`, 2,454,452,438 bytes (2,454.5 MB), in 7 parts.

| Part | Bytes | Size | sha256 |
|---|---:|---:|---|
| `FF_MASTER_v3_1.mp4.part00` | 356,515,840 | 356.5 MB | `3023396cd9fd3876c2453819a8e7c3b279c3ddf07e2e8f6816fdad9da40e3e94` |
| `FF_MASTER_v3_1.mp4.part01` | 356,515,840 | 356.5 MB | `6d4166ba9f77887a4972da6923068432d1f27d47fd1b0285e4d1f2ae008d9153` |
| `FF_MASTER_v3_1.mp4.part02` | 356,515,840 | 356.5 MB | `2006e89127a40ccd9742aba30761518960d369e0c63e9dcce8b33aefc0943245` |
| `FF_MASTER_v3_1.mp4.part03` | 356,515,840 | 356.5 MB | `f41b74361d2a589ad5486c265dd183626e6d207544de696f271926559795910c` |
| `FF_MASTER_v3_1.mp4.part04` | 356,515,840 | 356.5 MB | `137e44a19ea5a2780dc193173dcb7d445bd0226057efae01c75a15472a6bf824` |
| `FF_MASTER_v3_1.mp4.part05` | 356,515,840 | 356.5 MB | `45f0b85417e7bf77de14405d3c212208c2ce76c7697ff8703e365e13382f374d` |
| `FF_MASTER_v3_1.mp4.part06` | 315,357,398 | 315.4 MB | `2e8e85fc21db1fadffbba401ca2e9609d80b1f07233f9559254ce902314ed5b8` |

sha256 of the joined master: `624a76b4e9767997898152a19fba264b3784b8fb17b3df4e871b223a342adfdb`

The review copy `FALSE_FLOOR_E02_v3_1_review.mp4` (374,566,078 bytes, sha256 `2473155e69a4a771da39ff425d04e424ee7975f2f7de895d028cd2d794a46516`) was sent to Collin earlier as a single file and is not repeated.

## 3. Join, check and extract on macOS

Put all the downloaded parts in one folder. If the browser renamed a file (for example added ` (1)`), check it against the
table by its sha256 and rename it back. Then:

```bash
REPO="/Users/macbookpro/Fake Floor Ep"          # the repo root (the folder that contains films/)
cd ~/Downloads                                  # or wherever the parts are

# 1. every part against the table above
shasum -a 256 FF_ASSETS.tar.part??

# 2. join, and check the whole archive
cat FF_ASSETS.tar.part?? > FF_ASSETS.tar
shasum -a 256 FF_ASSETS.tar
#   must print 6a2b55721a671cb71097ee5bdf209523e693c074681925e2c286b9f666fbb7bb

# 3. extract into films/ (the archive holds false_floor/... and tumbler/...; the only file in it that git also tracks, tumbler/audio/manifest.json, is identical)
tar -xf FF_ASSETS.tar -C "$REPO/films"
tar -xf FF_EXTRAS.tar -C "$REPO/films"          # the two mocap files and the brand references

# 4. every extracted file against the list in git (prints only failures)
cd "$REPO/films" && shasum -a 256 -c false_floor/ASSETS_FILES_SHA256.txt | grep -v ": OK$"

# 5. MakeHuman character data (198 MB, downloaded, sha256-pinned; not in the archive)
bash vendor/fetch_vendor.sh

# 6. the master
cd ~/Downloads && cat FF_MASTER_v3_1.mp4.part?? > FALSE_FLOOR_E02_v3_1.mp4 && shasum -a 256 FALSE_FLOOR_E02_v3_1.mp4
#   must print 624a76b4e9767997898152a19fba264b3784b8fb17b3df4e871b223a342adfdb
mv FALSE_FLOOR_E02_v3_1.mp4 "$REPO/films/false_floor/out/"
```

`??` matches the two-digit part number and sorts in the right order. After step 4 the parts and the joined tar can be deleted.

## 4. What is inside `FF_ASSETS.tar`

709 files, 3,447.7 MB. Paths are relative to `films/`.

| Path | Files | Size | What | State |
|---|---:|---:|---|---|
| `false_floor/out/clips/[CNS]*.mkv` | 50 | 496.7 MB | 3D renders (Blender Cycles): cold open `C*`, night `N*`, numbered `S*` | **re-encoded**, see below |
| `false_floor/out/clips/M_*.mkv` | 34 | 1,453.0 MB | code-animated graphics and maps | **re-encoded** |
| `false_floor/out/clips/E_*.mkv` | 7 | 135.7 MB | moves on real, credited photos | **re-encoded** |
| `false_floor/out/clips/A_*.mkv` | 19 | 155.7 MB | Kling clips, ingested to 1920x1080, 24 fps | as built |
| `false_floor/out/clips/*.png` | 28 | 307.6 MB | 3D stills (`S*`) and plate stills (`P_*`) | as built |
| `false_floor/out/clips/*.json` | 2 | 0.0 MB | `manifest_mg_cards.json`, `manifest_mg_maps.json`, written by the graphics generators | as built |
| `false_floor/assets/kling_raw/*.mp4` | 19 | 155.1 MB | Kling downloads before ingest (the links have expired; these are the only copies) | as downloaded |
| `false_floor/out/vo/` | 11 | 207.4 MB | narration `vo_george_v4_v01.wav`, word timings `.json`, per-chapter files | as built |
| `false_floor/out/renders/` | 444 | 30.5 MB | overlay frames: `O_109`, `O_COUNT`, `O_LABEL`, `O_LAYER`, `O_TITLE` | as built |
| `false_floor/out/edit_segments/END_1080.mp4` | 1 | 29.4 MB | end card, 15 s | as built |
| `false_floor/out/*_map.json` | 9 | 0.0 MB | cut maps of the v3.1 parts (`EP3_ch1_map.json`, `EP3_ch2_map.json`, `EP3_ch3_map.json`, `EP3_ch4_map.json`, `EP3_ch5_map.json`, `EP3_ch6_map.json`, `EP3_ch7_map.json`, `FALSE_FLOOR_COLD_v2_map.json`, `FALSE_FLOOR_COLD_v3_map.json`) | as built |
| `false_floor/out/FALSE_FLOOR_E02_v3_1.srt` | 1 | 0.0 MB | subtitles of v3.1 | as built |
| `false_floor/out/qc/chapters_final_qc.txt` | 1 | 0.0 MB | QC log of the v3.1 parts | as built |
| `tumbler/audio/music/` | 11 | 359.1 MB | score: `ff_COLD`, `ff_1` .. `ff_7`, and earlier tracks | as built |
| `tumbler/audio/sfx/` | 71 | 117.5 MB | sound effects | as built |
| `tumbler/audio/manifest.json` | 1 | small | sources and licences of the audio | same as in git |

### What was re-encoded

Only to make the transfer smaller. Frame size, frame rate and frame count are unchanged; the frame count of every clip was
checked against its original after encoding.

| Clips | On the cloud disk | In the archive | Size |
|---|---|---|---|
| `[CNS]*.mkv` (50) | H.264 (libx264), crf 8, yuv444p10le | H.264 (libx264), preset medium, crf 14, yuv444p10le | 2,325.1 MB to 496.7 MB |
| `M_*.mkv` (34) | H.264 (libx264), crf 10, yuv444p | H.264 (libx264), preset medium, crf 16, yuv444p | 3,130.6 MB to 1,453.0 MB |
| `E_*.mkv` (7) | H.264 (libx264), crf 10, yuv444p | H.264 (libx264), preset medium, crf 16, yuv444p | 367.0 MB to 135.7 MB |

These are second-generation files. They are still well above the master (crf 18, yuv420p), so a rebuild from them should look
the same, but it will not be bit-identical to the delivered v3.1. The graphics (`M_*`, `E_*`) can be regenerated from
code (`mg_cards.py`, `mg_maps.py`). The 3D clips can only be regenerated by rendering. The originals exist only on the cloud
machine and go when it is reclaimed.

## 5. What is not in the archive

| Missing | Why | How to get it |
|---|---|---|
| `false_floor/out/EP3_ch1..7.mp4`, `FALSE_FLOOR_COLD_v3.mp4`, their `_tail.wav` | deleted in the cloud to free disk | rebuild: `seq_edit.py --seq <part> --out ...` (`HANDOFF_MAC.md` section 4). The `_map.json` in the archive are overwritten by the rebuild |
| `false_floor/out/seq_segments/` | cache, about 6 GB | written by the rebuild |
| `vendor/makehuman_data/` | 198 MB, public download | `bash vendor/fetch_vendor.sh` |
| `false_floor/out/qc/*.jpg` | QC sheets | `chapter_qc.py`, `frame_qc.py` |
| `tumbler/audio/raw/` | 54 MB of source downloads that `sfx/` was cut from | not read by the editor; `el_sfx.py`, `tumbler/tools/fetch_audio.py` |
| `false_floor/tests/*.jpg`, older masters (v1 animatic, night tests, v3) | superseded test stills and cuts | not needed. The files the tools do read from `tests/` (`S18_anchors.json`, `S24_anchors.json`, two style frames for `thumbnail.py`) are now in git |
| Human Generator files | never downloaded | Collin, from his own account |

