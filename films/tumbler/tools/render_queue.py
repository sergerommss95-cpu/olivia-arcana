#!/usr/bin/env python3
"""Render final frames for shots in small chunks (releases the render lock between chunks).

python3 tools/render_queue.py 1A 1B 2C [--samples 32] [--chunk 6] [--pct 100]
With no ids: every shot in shotlist.json. Skips frames already on disk (out/renders/<ID>/NNNN.png).
"""
import json, os, subprocess, sys, time
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
def opt(name, default):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
samples = opt('--samples', '32'); chunk = int(opt('--chunk', '6')); pct = opt('--pct', '100')
sl = json.load(open(os.path.join(FILM, 'shotlist.json')))
edl = json.load(open(os.path.join(FILM, 'edit', 'edl.json')))['shots']
ids = args or [s['id'] for s in sl['shots']]


def needed_range(sid, s):
    """Frames the edit uses: cut range plus handles only where a dissolve/luma transition overlaps (+1 safety)."""
    i = next((k for k, e in enumerate(edl) if e['id'] == sid), None)
    if i is None:
        return 1, s['render_frames']
    e = edl[i]
    ov = lambda x: int(x.get('tin', {}).get('n', 8)) if x.get('tin', {}).get('type') in ('dissolve', 'luma') else 0
    pre = ov(e) // 2 + 1
    post = (ov(edl[i + 1]) - ov(edl[i + 1]) // 2 + 1) if i + 1 < len(edl) else 1
    return max(1, e['in'] - pre), min(s['render_frames'], e['out'] + post)


for sid in ids:
    s = next(x for x in sl['shots'] if x['id'] == sid)
    lo, hi = needed_range(sid, s)
    n = hi - lo + 1
    out = os.path.join(FILM, 'out', 'renders', sid)
    t0 = time.time()
    for a in range(lo, hi + 1, chunk):
        b = min(hi, a + chunk - 1)
        if all(os.path.exists(os.path.join(out, f'{f:04d}.png')) for f in range(a, b + 1)):
            continue
        cmd = ['python3', os.path.join(FILM, 'tools', 'rb.py'), os.path.join(FILM, s['script']), '--', '--shot', sid, '--anim',
               '--from', str(a), '--to', str(b), '--samples', samples, '--pct', pct]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print(f'[queue] {sid} {a}-{b} FAILED\n{r.stdout[-2000:]}', flush=True)
            sys.exit(1)
        done = len([f for f in os.listdir(out) if f.endswith('.png') and lo <= int(f[:4]) <= hi])
        print(f'[queue] {sid} {done}/{n} frames  {(time.time() - t0) / max(1, done):.1f}s/frame avg', flush=True)
    print(f'[queue] {sid} complete in {time.time() - t0:.0f}s', flush=True)
