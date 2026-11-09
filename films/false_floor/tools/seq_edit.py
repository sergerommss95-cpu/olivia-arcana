#!/usr/bin/env python3
"""Cut the v2 test sequence 'The Night' (script/SEQ_NIGHT.json) to George's words.

python3 tools/seq_edit.py [--preview] [--out out/NIGHT_v2_test.mp4]
Each shot starts on a word boundary from the ElevenLabs character timestamps (tools/make_srt.words_on_vo_clock),
hard cuts, impacts on the cuts, the heist cue (ff_3) under ducked VO, broadcast loudness. Missing renders show the
newest test still or a slate so the cut can be judged before every shot is final.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import episode_edit as E
from make_srt import words_on_vo_clock

FF = E.FF
VO = os.path.join(FF, 'out', 'vo', 'vo_george_v4_v01')
SFX = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'sfx')
MUS = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'music')

# (shot, beat, first word of the shot's VO phrase) — the shot starts when that word starts (minus lead)
CUTS = [('N1', 23, 'Saturday'), ('N2', 23, 'The#2'), ('N3', 24, 'Down'), ('S24', 24, 'a'), ('N5', 24, 'The'),
        ('S16', 25, 'Then'), ('S17', 25, 'Then#2'), ('N8', 27, 'Then'), ('S01', 27, 'They'), ('N9', 27, 'They#2'),
        ('N10', 27, 'One')]
# first frame used inside each clip (after the 6-frame handle trim): start on the action
INOFF = {'N3': 24, 'S16': 168, 'S01': 96, 'N8': 8, 'N9': 0, 'S24': 0}
BEATS = [23, 24, 25, 27]
B25_END_WORD = 'key.'          # beat 25 is cut after "Then the key."
GAP = 0.32                     # silence between VO pieces
TAIL = 1.6


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def main():
    preview = '--preview' in sys.argv
    if preview:
        E.set_size(960, 540)
    out = os.path.join(FF, arg('--out', 'out/NIGHT_v2_test.mp4'))
    vo = E.load_wav(VO + '.wav')
    beats = {b['beat']: b for b in json.load(open(VO + '.json'))['beats']}
    words = [w for w in words_on_vo_clock(VO) if w[0] in BEATS]
    # VO pieces on the output clock
    pieces, t = [], 0.4
    wpos = {}                                   # (beat, word#n) -> output time of the word start
    for b in BEATS:
        s0, s1 = beats[b]['start'], beats[b]['end']
        bw = [w for w in words if w[0] == b]
        if b == 25:
            end_w = next(w for w in bw if w[1] == B25_END_WORD)
            s1 = end_w[3] + 0.12
        pieces.append((s0, s1, t))
        seen = {}
        for _, w, a, _e in bw:
            if a > s1:
                break
            seen[w] = seen.get(w, 0) + 1
            key = w if seen[w] == 1 else f'{w}#{seen[w]}'
            wpos[(b, key.strip('.,'))] = t + (a - s0)
            wpos.setdefault((b, w.strip('.,')), t + (a - s0))
        t += (s1 - s0) + GAP
    total = t - GAP + TAIL
    starts = []
    for sid, b, w in CUTS:
        key = (b, w.strip('.,'))
        st = wpos.get(key)
        if st is None:
            raise SystemExit(f'word {w} not found in beat {b}')
        starts.append(max(0.0, st - 0.12))
    starts[0] = 0.0
    shots = []
    seq = {s['id']: s for s in json.load(open(os.path.join(FF, 'script', 'SEQ_NIGHT.json')))['shots']}
    seq['S01'] = {'id': 'S01', 'kind': 'CLIP', 'shot': 'door reveal (v1 clip)'}
    for i, (sid, b, w) in enumerate(CUTS):
        t0 = starts[i]
        t1 = starts[i + 1] if i + 1 < len(CUTS) else total
        kind = seq[sid]['kind']
        e = {'id': sid, 'kind': '3D' if kind == '3D' else '3D', 'src_kind': '3D', 'shot': seq[sid]['shot'], 't0': t0, 'dur': t1 - t0,
             'chapter': '3', 'vo_src': None}
        if sid == 'S17':
            e['src_kind'] = 'CLIP_RAW'          # rendered without handles (frames 60-130)
        shots.append(e)
    print(f'[seq] {total:.1f}s, {len(shots)} shots: ' + ' '.join(f"{e['id']}={e['dur']:.1f}" for e in shots), flush=True)
    # picture
    work = os.path.join(FF, 'out', 'seq_segments')
    os.makedirs(work, exist_ok=True)
    segs = []
    for e in shots:
        p = os.path.join(work, e['id'] + '.mp4')
        n = int(round(e['dur'] * E.FPS))
        render_seg(e, p, n, preview)
        segs.append(p)
        print(f"[seq] {e['id']} {n}f", flush=True)
    lst = os.path.join(work, 'list.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in segs))
    pic = os.path.join(work, 'picture.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', pic], check=True)
    # audio
    SR = E.SR
    nS = int((total + 0.5) * SR)
    vo_bus = np.zeros((nS, 2), np.float32)
    for s0, s1, at in pieces:
        seg = vo[int(s0 * SR):int(s1 * SR)]
        i = int(at * SR)
        vo_bus[i:i + len(seg)] += seg[:max(0, nS - i)]
    fx = np.zeros((nS, 2), np.float32)

    def put(name, at, gain_db, dur=None):
        f = os.path.join(SFX, name + '.wav')
        if not os.path.exists(f):
            return
        a = E.load_wav(f)
        if dur:
            a = a[:int(dur * SR)].copy()
            fl = min(len(a), int(0.3 * SR))
            a[-fl:] *= np.linspace(1, 0, fl)[:, None]
        i = int(at * SR)
        fx[i:i + len(a)] += a[:max(0, nS - i)] * 10 ** (gain_db / 20)

    st = {e['id']: e['t0'] for e in shots}
    for e in shots[1:]:
        put('metal__resonant_whoosh_hit', e['t0'] - 0.18, -22)                # impact on every cut
    put('el__city_dusk', 0.0, -20, dur=st['N2'] + 0.3)
    put('whoosh__deep_air', 0.0, -14)
    put('el__antechamber_fluoro', st['N2'], -22, dur=st['N8'] - st['N2'])
    put('el__plate_slide', st['S24'] + 0.4, -10)
    put('el__vault_door_unlock', st['N5'] + 0.2, -9)
    put('el__vault_door_swing', st['N5'] + 1.0, -8)
    put('el__dial_spin', st['S16'], -9)
    put('el__key_turn', st['S17'] + 0.1, -8)
    put('el__vault_door_swing', st['N8'], -10)
    put('el__vault_room_tone', st['N8'], -22, dur=total - st['N8'])
    put('el__box_forced_1', st['N9'] + 2.6, -6)
    for k, tt in enumerate(np.cumsum([0.0, 0.9, 0.7, 0.5, 0.35, 0.25, 0.2, 0.15, 0.12, 0.1, 0.1, 0.1, 0.1, 0.1])):
        put('el__box_forced_2' if k % 2 else 'el__box_door_open', st['N10'] + 0.3 + tt, -10 - k * 0.4)
    # music: the heist cue, ducked under VO
    bed = E.load_wav(os.path.join(MUS, 'ff_3.wav'))
    off = int(20.0 * SR)
    bed = bed[off:off + nS]
    if len(bed) < nS:
        bed = np.pad(bed, ((0, nS - len(bed)), (0, 0)))
    env = np.abs(vo_bus).max(1)
    k = int(0.25 * SR)
    env = np.convolve(env, np.ones(k) / k, mode='same')
    duck = 1.0 - 0.45 * np.clip(env / (env.max() * 0.25 + 1e-9), 0, 1)
    fade = np.ones(nS)
    fade[:int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
    fade[-int(1.5 * SR):] = np.linspace(1, 0, int(1.5 * SR))
    mix = vo_bus + fx + bed * (10 ** (-14 / 20)) * duck[:, None] * fade[:, None]
    mix = np.tanh(mix * 1.2) / 1.2
    wav = os.path.join(work, 'mix.wav')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', wav],
                         stdin=subprocess.PIPE)
    p.stdin.write(mix.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pic, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out],
                   check=True)
    print('[seq] wrote', out, flush=True)


def render_seg(e, path, n, preview):
    src = E.Source(e)
    if e['src_kind'] == 'CLIP_RAW' and src.mode == 'clip':
        src.e = dict(e, src_kind='RAW')
    rng = np.random.default_rng(abs(hash(e['id'])) % 1000)
    expo = (1.0, 1.0)
    smp = src.samples() if not getattr(src, 'placeholder', False) else []
    if smp:
        expo = E.shot_exposure(smp)
    label = E.overlay('O_LABEL') or E.label_fallback()
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{E.W}x{E.H}', '-r', str(E.FPS),
                            '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23' if preview else '16', '-pix_fmt', 'yuv420p',
                            path], stdin=subprocess.PIPE)
    if src.mode == 'clip':
        fr = src.clip_frames(n)[INOFF.get(e['id'], 0):]
        src.n_clip = len(fr)
        if len(fr) >= n:
            frames = (Image.fromarray(fr[j]) for j in range(n))
        else:                                   # gentle slow-down: blend neighbouring frames
            pos = np.linspace(0, len(fr) - 1, n)
            frames = (Image.fromarray(((1 - (p - int(p))) * fr[int(p)].astype(np.float32) +
                                       (p - int(p)) * fr[min(int(p) + 1, len(fr) - 1)].astype(np.float32)).astype(np.uint8))
                      for p in pos)
    else:
        frames = src.frame_iter(n)
    for i, im in enumerate(frames):
        im = E.grade(im, rng, expo).convert('RGBA')
        im = Image.alpha_composite(im, label)
        if e['id'] == 'S24' and src.mode == 'clip':
            o = E.field_lines('S24', 7 + INOFF.get('S24', 0) + min(i, getattr(src, 'n_clip', n) - 1), i, min(1.0, (i + 1) / 8))
            if o:
                im = Image.alpha_composite(im, o)
        if e['id'] == 'N10':
            ramp = min(1.0, i / max(1, n - int(1.0 * E.FPS)))
            v = 1 + int(108 * (ramp ** 2.2))
            o = E.find_value_png('O_COUNT', 'count_', f'{v:03d}')
            if o:
                im = Image.alpha_composite(im, o)
        enc.stdin.write(im.convert('RGB').tobytes())
    enc.stdin.close()
    enc.wait()


if __name__ == '__main__':
    main()
