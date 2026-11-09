#!/usr/bin/env python3
"""Render False Floor shots (runs on a GPU pod or locally) and pack each into a compact clip.

python3 films/false_floor/tools/render_shots.py S00 S01 ... [--samples 40] [--still-samples 96] [--keep-png] [--force]
For each shot from script/SHOTS_v2.json:
  3D  -> frames 1..render_frames via the shot's script (--anim), then encoded to out/clips/<ID>.mkv
         (x264 4:4:4 10-bit CRF 8: visually lossless, ~30-60 MB per 10 s) and the PNGs deleted.
  3DS -> one 2560x1440 frame (16-bit PNG) to out/clips/<ID>.png.
Uses TUMBLER_DEVICE from the environment (OPTIX on GPU pods). Logs to out/clips/render.log.
"""
import json, os, shutil, subprocess, sys, time

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILMS = os.path.dirname(FF)
RB = os.path.join(FILMS, 'tumbler', 'tools', 'rb.py')
SCRIPT = {'A1_door': 'shots/door.py', 'A2_macro': 'shots/door_macro.py', 'B_room': 'shots/room.py',
          'C_office_city': 'shots/office_city.py', 'E_woods': 'shots/woods.py', 'LEAD': 'shots/lead.py'}


def arg(name, default):
    a = sys.argv
    if name in a:
        return a[a.index(name) + 1]
    return default


def main():
    ids = [x for x in sys.argv[1:] if x[:1] in ('S', 'N', 'C') and x[1:].isdigit()]
    samples = arg('--samples', '40')
    still_samples = arg('--still-samples', '96')
    shots = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots']}
    for s_ in (json.load(open(os.path.join(FF, 'script', 'SEQ_NIGHT.json')))['shots'] +
               json.load(open(os.path.join(FF, 'script', 'SEQ_COLD.json')))['shots']):
        if s_['kind'] == '3D':
            shots[s_['id']] = s_
    clips = os.path.join(FF, 'out', 'clips')
    os.makedirs(clips, exist_ok=True)
    log = open(os.path.join(clips, 'render.log'), 'a')
    for sid in ids:
        s = shots[sid]
        script = os.path.join(FF, s['script'] if 'script' in s else SCRIPT[s['owner']])
        t0 = time.time()
        if s['kind'] == '3D':
            n = s['render_frames']
            out_mkv = os.path.join(clips, f'{sid}.mkv')
            if os.path.exists(out_mkv) and '--force' not in sys.argv:
                continue
            frames = os.path.join(FF, 'out', 'renders', sid)
            if '--force' in sys.argv and os.path.isdir(frames):
                shutil.rmtree(frames)      # never reuse frames left by an older, interrupted render of this shot
            cmd = ['python3', RB, script, '--', '--shot', sid, '--anim', '--from', '1', '--to', str(n), '--samples', samples]
            if s.get('stretch'):
                cmd += ['--stretch', str(s['stretch'])]
            r = subprocess.run(cmd, capture_output=True, text=True)
            frames = os.path.join(FF, 'out', 'renders', sid)
            ok = r.returncode == 0 and os.path.isdir(frames) and len([f for f in os.listdir(frames) if f.endswith('.png')]) >= n
            if ok:
                enc = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', os.path.join(frames, '%04d.png'),
                                      '-c:v', 'libx264', '-preset', 'medium', '-crf', '8', '-pix_fmt', 'yuv444p10le', out_mkv],
                                     capture_output=True, text=True)
                ok = enc.returncode == 0
                if ok and '--keep-png' not in sys.argv:
                    shutil.rmtree(frames)
            msg = f'{sid} 3D {n}f {"OK" if ok else "FAILED"} {time.time() - t0:.0f}s'
        elif s['kind'] == '3DS':
            out_png = os.path.join(clips, f'{sid}.png')
            if os.path.exists(out_png) and '--force' not in sys.argv:
                continue
            cmd = ['python3', RB, script, '--', '--shot', sid, '--anim', '--from', '1', '--to', '1', '--samples', still_samples,
                   '--overwrite']
            r = subprocess.run(cmd, capture_output=True, text=True)
            src = os.path.join(FF, 'out', 'renders', sid, '0001.png')
            ok = r.returncode == 0 and os.path.exists(src)
            if ok:
                shutil.move(src, out_png)
            msg = f'{sid} 3DS {"OK" if ok else "FAILED"} {time.time() - t0:.0f}s'
        else:
            continue
        if not ok:
            msg += '\n' + (r.stdout or '')[-1500:]
        print(msg, flush=True)
        log.write(msg + '\n')
        log.flush()


if __name__ == '__main__':
    main()
