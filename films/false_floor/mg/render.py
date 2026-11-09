#!/usr/bin/env python3
"""Render FALSE FLOOR motion graphics.

  python3 mg/render.py S06 S09            # full PNG sequences -> out/renders/<ID>/0001.png ...
  python3 mg/render.py S06 --frames 1,200,405 --test   # JPG previews -> tests/mg_S06_f0200.jpg
  python3 mg/render.py all                # every MG shot + overlays
  options: --workers 3 (default 3: other builders share the 4 cores)
"""
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


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith('--') and a in REG or a == 'all']
    if 'all' in ids:
        ids = list(REG)
    fr = arg('--frames')
    frames = [int(x) for x in fr.split(',')] if fr else None
    for sid in ids:
        run(sid, frames, bool(arg('--test')), int(arg('--workers', 3)))


if __name__ == '__main__':
    main()
