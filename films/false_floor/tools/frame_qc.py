#!/usr/bin/env python3
"""Frame-by-frame QC of rendered clips (no model judgement, just numbers + sheets to look at).

    python3 false_floor/tools/frame_qc.py C1 C3 N5 ...        # clips from out/clips/<ID>.mkv
    python3 false_floor/tools/frame_qc.py --file some.mp4

Per clip:
  * every frame on one contact sheet (out/qc/<ID>_sheet.jpg), frame numbers burned in;
  * temporal flicker per frame: |F[i] - (F[i-1] + F[i+1]) / 2|. Smooth motion keeps it low; a pop, a texture that
    swims, a light that blinks or a limb that snaps spikes it. Spikes over 3x the clip's running median are listed
    and saved as prev | frame | next | heat-map strips (out/qc/<ID>_f<NNNN>.jpg);
  * exposure drift: mean luma per frame, jumps > 4 % between neighbours flagged.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(FF, 'out', 'qc')


def frames(path, w=480):
    w = int(_opt('--w', w))
    probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                            '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip().split(',')
    W, H = int(probe[0]), int(probe[1])
    h = int(round(H * w / W / 2)) * 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                          '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def sheet(F, tag, cols=10, tw=240):
    cols, tw = int(_opt('--cols', cols)), int(_opt('--tw', tw))
    n = len(F)
    th = int(F.shape[1] * tw / F.shape[2])
    rows = (n + cols - 1) // cols
    im = Image.new('RGB', (cols * tw, rows * th), (0, 0, 0))
    d = ImageDraw.Draw(im)
    for i, f in enumerate(F):
        t = Image.fromarray(f).resize((tw, th))
        x, y = (i % cols) * tw, (i // cols) * th
        im.paste(t, (x, y))
        d.text((x + 3, y + 2), str(i + 1), fill=(255, 255, 0))
    p = os.path.join(OUT, f'{tag}_sheet.jpg')
    im.save(p, quality=86)
    return p


def _opt(n, d):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def analyse(path, tag):
    F = frames(path)
    G = F.astype(np.float32).mean(3)
    n = len(G)
    luma = G.mean((1, 2))
    flick = np.zeros(n)
    heat = {}
    for i in range(1, n - 1):
        dd = np.abs(G[i] - 0.5 * (G[i - 1] + G[i + 1]))
        flick[i] = dd.mean()
        heat[i] = dd
    rep = {'clip': tag, 'frames': n, 'flicker': [], 'exposure_jumps': []}
    for i in range(1, n - 1):
        lo, hi = max(1, i - 12), min(n - 1, i + 13)
        med = float(np.median(flick[lo:hi]))
        if flick[i] > max(3.0 * med, 1.2):
            rep['flicker'].append((i + 1, round(float(flick[i]), 2), round(med, 2)))
            dd = heat[i]
            hm = np.clip(dd * 6, 0, 255).astype(np.uint8)
            hm = np.stack([hm, hm // 3, np.zeros_like(hm)], 2)
            strip = np.concatenate([F[i - 1], F[i], F[i + 1], hm], 1)
            Image.fromarray(strip).save(os.path.join(OUT, f'{tag}_f{i + 1:04d}.jpg'), quality=88)
    for i in range(1, n):
        a, b = luma[i - 1], luma[i]
        if a > 4 and abs(b - a) / a > 0.04:
            rep['exposure_jumps'].append((i + 1, round(float(a), 1), round(float(b), 1)))
    rep['sheet'] = sheet(F, tag)
    rep['flicker_median'] = round(float(np.median(flick[1:-1])), 2) if n > 2 else 0
    return rep


def main():
    os.makedirs(OUT, exist_ok=True)
    args = sys.argv[1:]
    todo = []
    if '--file' in args:
        p = args[args.index('--file') + 1]
        todo.append((p, os.path.splitext(os.path.basename(p))[0]))
    else:
        for sid in [a for i, a in enumerate(args) if not a.startswith('--') and (i == 0 or not args[i - 1].startswith('--'))]:
            todo.append((os.path.join(FF, 'out', 'clips', f'{sid}.mkv'), sid))
    allrep = {}
    for p, tag in todo:
        r = analyse(p, tag)
        allrep[tag] = r
        print(f"{tag}: {r['frames']}f flicker median {r['flicker_median']} | spikes {len(r['flicker'])} "
              f"{r['flicker'][:8]} | exposure jumps {len(r['exposure_jumps'])} {r['exposure_jumps'][:5]}")
    json.dump(allrep, open(os.path.join(OUT, 'frame_qc.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
