#!/usr/bin/env python3
"""Mix music + sound effects from edit/cues.json against the edit's timeline, then mux with the picture.

python3 tools/mix.py [--picture out/tumbler_picture.mp4] [--out out/TUMBLER.mp4]
Cue times are given per shot: {"shot": "2B", "f": 12} = 12 frames after that shot's first cut frame (24 fps).
"""
import json, os, subprocess, sys
import numpy as np

FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, FPS = 48000, 24


def arg(name, default=None):
    a = sys.argv
    return a[a.index(name) + 1] if name in a else default


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20.0)


def main():
    cues = json.load(open(os.path.join(FILM, 'edit', 'cues.json')))
    edl = json.load(open(os.path.join(FILM, 'edit', 'edl.json')))['shots']
    starts, t = {}, 0
    for s in edl:
        starts[s['id']] = t
        t += s['out'] - s['in'] + 1
    total_frames = t
    n = int(total_frames / FPS * SR) + SR * 2
    bus_m = np.zeros((n, 2), np.float32)
    bus_s = np.zeros((n, 2), np.float32)
    mu = cues['music']
    trk = load(os.path.join(FILM, 'audio', 'music', mu['key'] + '.wav'))
    o = int(mu['offset_s'] * SR)
    seg = trk[o:o + n]
    seg = seg * db(mu.get('gain_db', 0))
    fi = int(mu.get('fade_in_s', 0.05) * SR)
    if fi:
        seg[:fi] *= np.linspace(0, 1, fi)[:, None]
    bus_m[:len(seg)] += seg
    # music fade at the end of the film
    end = int(total_frames / FPS * SR)
    fo = int(mu.get('fade_out_s', 2.0) * SR)
    env = np.ones(n, np.float32)
    env[end - fo:end] = np.linspace(1, 0, fo) ** 1.5
    env[end:] = 0
    for d in mu.get('dips', []):   # e.g. duck under a big SFX: {"shot":..,"f":..,"len_s":..,"db":-6}
        a = int((starts[d['shot']] + d['f']) / FPS * SR)
        L = int(d['len_s'] * SR)
        env[a:a + L] *= db(d['db'])
    bus_m *= env[:, None]
    cache = {}
    for c in cues['cues']:
        if c['key'] not in cache:
            cache[c['key']] = load(os.path.join(FILM, 'audio', 'sfx', c['key'] + '.wav'))
        x = cache[c['key']]
        so = int(c.get('src_s', 0.0) * SR)
        x = x[so:]
        if c.get('dur_s'):
            x = x[:int(c['dur_s'] * SR)].copy()
        else:
            x = x.copy()
        if c.get('rate', 1.0) != 1.0:   # varispeed (pitch follows), like tape
            r = c['rate']
            idx = np.arange(0, len(x) - 1, r)
            x = np.stack([np.interp(idx, np.arange(len(x)), x[:, ch]) for ch in (0, 1)], 1).astype(np.float32)
        fo_ = int(c.get('fade_s', 0.08) * SR)
        if fo_ and len(x) > fo_:
            x[-fo_:] *= np.linspace(1, 0, fo_)[:, None]
        pan = c.get('pan', 0.0)
        x = x * db(c.get('gain_db', 0)) * np.array([min(1, 1 - pan), min(1, 1 + pan)], np.float32)
        at = int(((starts[c['shot']] + c.get('f', 0)) / FPS + c.get('dt', 0.0)) * SR)
        at = max(0, at)
        L = min(len(x), n - at)
        bus_s[at:at + L] += x[:L]
    mix = bus_m + bus_s
    mix[end + int(0.6 * SR):] = 0
    # master: gentle soft clip + peak normalise to -1 dBFS
    drive = 1.4
    mix = np.tanh(mix * drive) / np.tanh(drive)
    pk = np.max(np.abs(mix)) + 1e-9
    mix = mix * (db(-1.0) / pk)
    mix = mix[:end + int(0.6 * SR)]
    os.makedirs(os.path.join(FILM, 'out'), exist_ok=True)
    wav = os.path.join(FILM, 'out', 'tumbler_mix.wav')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', wav],
                         stdin=subprocess.PIPE)
    p.stdin.write(mix.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    pic = os.path.join(FILM, arg('--picture', 'out/tumbler_picture.mp4'))
    out = os.path.join(FILM, arg('--out', 'out/TUMBLER.mp4'))
    if os.path.exists(pic):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pic, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac',
                        '-b:a', '320k', '-shortest', '-movflags', '+faststart', out], check=True)
        print('[mix] wrote', out)
    print(f'[mix] {total_frames} frames = {total_frames / FPS:.2f}s; music peak/rms {20 * np.log10(np.abs(bus_m).max() + 1e-9):.1f} dBFS')


if __name__ == '__main__':
    main()
