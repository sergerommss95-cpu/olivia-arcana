#!/usr/bin/env python3
"""Render FALSE FLOOR motion graphics.

  python3 mg/render.py S06 S09            # full PNG sequences -> out/renders/<ID>/0001.png ...
  python3 mg/render.py S06 --frames 1,200,405 --test   # JPG previews -> tests/mg_S06_f0200.jpg
  python3 mg/render.py all                # every MG shot + overlays
  python3 mg/render.py S06 --pack         # render, then pack to out/clips/S06.mkv (x264 CRF 8, 4:4:4 10-bit),
                                          # verify the frame count and delete the PNGs (disk is tight)
  python3 mg/render.py END --pack-only    # pack an existing PNG sequence
  options: --workers 3 (default 3: other builders share the 4 cores)
"""
import shutil
import subprocess
import os
import sys
import time
from multiprocessing import get_context

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image  # noqa: E402

import kit  # noqa: E402
import shots  # noqa: E402
import overlays  # noqa: E402

REG = dict(shots.REG)
REG.update(overlays.REG)
_OBJ = None


def arg(name, default=None):
    a = sys.argv
    if name in a:
        i = a.index(name)
        return a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith('--') else True
    return default


def _work(job):
    f, path, jpg = job
    arr = _OBJ.render(f)
    im = Image.fromarray(arr)
    if jpg:
        im.convert('RGB').save(path, quality=92)
    else:
        im.save(path, compress_level=3)
    return path


def run(sid, frames=None, test=False, workers=3):
    global _OBJ
    _OBJ = REG[sid]()
    if test:
        out = os.path.join(kit.FF, 'tests')
        files = [(f - 1, os.path.join(out, f'mg_{sid}_f{f:04d}.jpg')) for f in frames]
        if _OBJ.rgba:   # preview overlays over mid grey so alpha is visible
            files = [(f - 1, p.replace('.jpg', '.png')) for f, p in files]
    else:
        out = os.path.join(kit.FF, 'out', 'renders', sid)
        if not frames and os.path.isdir(out):       # full render: never leave stale frames from an older length
            shutil.rmtree(out)
        os.makedirs(out, exist_ok=True)
        files = [(f, os.path.join(out, name)) for name, f in _OBJ.files()]
        if frames:
            keep = set(x - 1 for x in frames)
            files = [x for x in files if x[0] in keep]
    jobs = [(f, p, test and not _OBJ.rgba) for f, p in files]
    t0 = time.time()
    if workers <= 1 or len(jobs) < 4:
        for j in jobs:
            _work(j)
    else:
        with get_context('fork').Pool(workers) as pool:
            for _ in pool.imap_unordered(_work, jobs, chunksize=4):
                pass
    print(f'[mg] {sid}: {len(jobs)} files in {time.time() - t0:.1f}s -> {out}', flush=True)


def pack(sid):
    """PNG sequence -> out/clips/<ID>.mkv; delete the PNGs only once the clip's decoded frame count matches."""
    src = os.path.join(kit.FF, 'out', 'renders', sid)
    n = len([f for f in os.listdir(src) if f.endswith('.png')])
    dst_dir = os.path.join(kit.FF, 'out', 'clips')
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, f'{sid}.mkv')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', '24', '-i', os.path.join(src, '%04d.png'), '-c:v',
                    'libx264', '-preset', 'medium', '-crf', '8', '-pix_fmt', 'yuv444p10le', dst], check=True)
    got = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries',
                          'stream=nb_read_frames', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout.strip()
    if int(got) == n:
        shutil.rmtree(src)
        print(f'[mg] packed {sid}: {n} frames -> {dst} ({os.path.getsize(dst) / 1e6:.0f} MB), PNGs removed', flush=True)
    else:
        print(f'[mg] PACK MISMATCH {sid}: {n} PNG vs {got} in clip, PNGs kept', flush=True)


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith('--') and a in REG or a == 'all']
    if 'all' in ids:
        ids = list(REG)
    fr = arg('--frames')
    frames = [int(x) for x in fr.split(',')] if fr else None
    for sid in ids:
        if not arg('--pack-only'):
            run(sid, frames, bool(arg('--test')), int(arg('--workers', 3)))
        if (arg('--pack') or arg('--pack-only')) and not REG[sid].rgba:
            pack(sid)


if __name__ == '__main__':
    main()
