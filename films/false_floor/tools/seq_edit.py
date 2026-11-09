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
CUTS = [('N1', 23, 'Saturday'), ('N2', 23, 'The#2'), ('N3', 24, 'Down'), ('S24', 24, 'a'), ('S18', 24, 'holding'),
        ('N5', 24, 'The'), ('S16', 25, 'Then'), ('S17', 25, 'Then#2'), ('N8', 27, 'Then'), ('N9', 27, 'They#2'),
        ('N10', 27, 'One')]
# first frame used inside each clip (after the 6-frame handle trim): start on the action
INOFF = {'N3': 24, 'S16': 168, 'N8': 14, 'N9': 0, 'S24': 0, 'S18': 70}
BEATS = [23, 24, 25, 27]
B25_END_WORD = 'key.'          # beat 25 is cut after "Then the key."
GAP = 0.32                     # silence between VO pieces
TAIL = 2.6


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
    allw = words_all = [w for w in words_on_vo_clock(VO)]
    for b in BEATS:
        bw = [w for w in words if w[0] == b]
        last = next(w for w in bw if w[1] == B25_END_WORD) if b == 25 else bw[-1]
        s0 = bw[0][2] - 0.06
        nxt = [w for w in allw if w[2] > last[3] + 0.01]
        s1 = min(last[3] + 0.22, (nxt[0][2] - 0.03) if nxt else last[3] + 0.22)
        prv = [w for w in allw if w[3] < bw[0][2] - 0.01]
        if prv:
            s0 = max(s0, prv[-1][3] + 0.03)
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
    seq['S18'] = {'id': 'S18', 'kind': 'CLIP', 'shot': 'magnetic plates, field lines (A2 macro)'}
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
        seg = vo[int(s0 * SR):int(s1 * SR)].copy()
        f = int(0.02 * SR)
        seg[:f] *= np.linspace(0, 1, f)[:, None]
        seg[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(at * SR)
        vo_bus[i:i + len(seg)] += seg[:max(0, nS - i)]
    fx = np.zeros((nS, 2), np.float32)

    def put(name, at, gain_db, dur=None, fin=0.0, fout=0.3):
        f = os.path.join(SFX, name + '.wav')
        if not os.path.exists(f):
            return
        a = E.load_wav(f)
        if dur:
            reps = int(np.ceil(dur * SR / len(a)))
            a = np.tile(a, (max(1, reps), 1))[:int(dur * SR)].copy()
        if fin > 0:
            k = min(len(a), int(fin * SR))
            a[:k] *= np.linspace(0, 1, k)[:, None]
        if fout > 0:
            k = min(len(a), int(fout * SR))
            a[-k:] *= np.linspace(1, 0, k)[:, None]
        i = max(0, int(at * SR))
        fx[i:i + len(a)] += a[:max(0, nS - i)] * 10 ** (gain_db / 20)

    st = {e['id']: e['t0'] for e in shots}
    # continuous beds, crossfaded
    put('el__city_dusk', 0.0, -21, dur=st['N2'] + 0.6, fin=0.3, fout=0.8)
    put('el__antechamber_fluoro', st['N2'] - 0.3, -24, dur=st['N8'] - st['N2'] + 0.9, fin=0.6, fout=0.8)
    put('el__vault_room_tone', st['N8'] - 0.4, -22, dur=total - st['N8'] + 0.4, fin=0.6, fout=1.6)
    # transitions: only where the picture jumps space
    put('whoosh__deep_air', st['N2'] - 0.35, -16)
    put('metal__resonant_whoosh_hit', st['N3'] - 0.15, -20)
    put('metal__resonant_whoosh_hit', st['N8'] - 0.15, -17)
    put('riser__trailer_short', st['N10'] - 1.2, -20)
    # action sounds on the picture
    put('el__plate_slide', st['S24'] + 0.4, -10)
    put('el__vault_door_unlock', st['N5'] + 0.2, -9)
    put('el__vault_door_swing', st['N5'] + 1.0, -8)
    put('el__dial_spin', st['S16'], -10)
    put('el__key_turn', st['S17'] + 0.1, -8)
    put('el__vault_door_swing', st['N8'], -11)
    put('el__box_forced_1', st['N9'] + 2.6, -6)
    cj = os.path.join(FF, 'notes', 'room_N10_counter.json')
    if os.path.exists(cj):                          # a snap for every door that opens in the cut, thinned when dense
        snaps = sorted(d['snap_frame'] for d in json.load(open(cj))['doors'])
        last_t = -1
        for k, sf in enumerate(snaps):
            t_ = st['N10'] + (sf - 7 - INOFF.get('N10', 0)) / E.FPS
            if t_ - last_t < 0.07 or t_ > total - 0.2:
                continue
            put('el__box_forced_2' if k % 2 else 'el__box_door_open', t_, -12 - min(8, k * 0.08))
            last_t = t_
    end_vo = pieces[-1][2] + (pieces[-1][1] - pieces[-1][0])
    put('boom__big_cinematic_impact', end_vo - 0.05, -9)
    # music: the heist cue, smooth sidechain duck (attack 80 ms, release 700 ms, -4.5 dB), long ending
    bed = E.load_wav(os.path.join(MUS, 'ff_3.wav'))
    off = int(12.0 * SR)
    bed = bed[off:off + nS]
    if len(bed) < nS:
        bed = np.pad(bed, ((0, nS - len(bed)), (0, 0)))
    lvl = np.abs(vo_bus).max(1)
    env = np.zeros(nS, np.float32)
    att, rel = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.7 * SR))
    e_ = 0.0
    thr = np.percentile(lvl[lvl > 1e-4], 60) if np.any(lvl > 1e-4) else 1.0
    for i in range(0, nS, 64):                       # envelope follower at 64-sample hops
        x = min(1.0, lvl[i:i + 64].max() / (thr + 1e-9))
        c = att if x > e_ else rel
        e_ = c * e_ + (1 - c) * x
        env[i:i + 64] = e_
    duck = 1.0 - (1 - 10 ** (-4.5 / 20)) * env
    fade = np.ones(nS, np.float32)
    fade[:int(0.6 * SR)] = np.linspace(0, 1, int(0.6 * SR))
    fl = int(2.2 * SR)
    fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
    mix = vo_bus + fx + bed * (10 ** (-15 / 20)) * duck[:, None] * fade[:, None]
    mix = np.tanh(mix * 1.1) / 1.1
    wav = os.path.join(work, 'mix.wav')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', wav],
                         stdin=subprocess.PIPE)
    p.stdin.write(mix.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    # broadcast loudness, two-pass LINEAR (constant gain: no riding / drop-outs)
    m = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
          f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pic, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', ln + ',aresample=48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out],
                   check=True)
    print('[seq] wrote', out, flush=True)


def _luma_stats(im):
    a = np.asarray(im.resize((160, 90), Image.BILINEAR)).astype(np.float32) / 255.0
    Y = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    return float(np.percentile(Y, 99.0)), Y


def render_seg(e, path, n, preview):
    """One shot: clip frames from the in-point (hold the last frame if short; never blend frames), exposure balanced
    PER FRAME and smoothed over ~1 s so light changes inside a shot read naturally, label and overlays on top."""
    src = E.Source(e)
    if e['src_kind'] == 'CLIP_RAW' and src.mode == 'clip':
        src.e = dict(e, src_kind='RAW')
    rng = np.random.default_rng(abs(hash(e['id'])) % 1000)
    if src.mode == 'clip':
        fr = src.clip_frames(n)[INOFF.get(e['id'], 0):]
        src.n_clip = len(fr)
        idx = [min(i, len(fr) - 1) for i in range(n)]
        frames = [Image.fromarray(fr[j]) for j in idx]
        # per-frame exposure from smoothed stats
        his, means = [], []
        for im in frames:
            hi, Y = _luma_stats(im)
            his.append(hi)
            means.append(float(Y.mean()))
        k = min(len(frames), 25)
        ker = np.ones(k) / k
        pad = lambda v: np.convolve(np.pad(np.array(v), (k // 2, k - 1 - k // 2), mode='edge'), ker, mode='valid')
        his_s, means_s = pad(his), pad(means)
        expos = []
        for hi, m in zip(his_s, means_s):
            gain = float(np.clip(0.82 / max(hi, 1e-3), 1.0, 2.6))
            mm = min(1.0, m * gain)
            gamma = float(np.clip(np.log(0.26) / np.log(max(mm, 1e-3)), 0.62, 1.0)) if mm < 0.26 else 1.0
            expos.append((gain, gamma))
    else:
        frames = list(src.frame_iter(n))
        smp = src.samples() if not getattr(src, 'placeholder', False) else []
        expos = [E.shot_exposure(smp) if smp else (1.0, 1.0)] * n
    label = E.overlay('O_LABEL') or E.label_fallback()
    counter = None
    if e['id'] == 'N10' and os.path.exists(os.path.join(FF, 'notes', 'room_N10_counter.json')):
        cj = json.load(open(os.path.join(FF, 'notes', 'room_N10_counter.json')))
        snaps = sorted(d['snap_frame'] for d in cj['doors'])
        counter = (snaps, cj['cut'][0])
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{E.W}x{E.H}', '-r', str(E.FPS),
                            '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23' if preview else '16', '-pix_fmt', 'yuv420p',
                            path], stdin=subprocess.PIPE)
    for i, im in enumerate(frames):
        im = E.grade(im, rng, expos[i]).convert('RGBA')
        im = Image.alpha_composite(im, label)
        if e['id'] in ('S24', 'S18') and src.mode == 'clip':
            cf = 7 + INOFF.get(e['id'], 0) + min(i, src.n_clip - 1)
            o = E.field_lines(e['id'], cf, i, min(1.0, (i + 1) / 8) if e['id'] == 'S24' else 1.0)
            if o:
                im = Image.alpha_composite(im, o)
        if counter:
            snaps, c0 = counter
            render_f = c0 + INOFF.get('N10', 0) + min(i, getattr(src, 'n_clip', n) - 1)
            v = max(1, sum(1 for sf in snaps if sf <= render_f))
            o = E.find_value_png('O_COUNT', 'count_', f'{v:03d}')
            if o:
                im = Image.alpha_composite(im, o)
        enc.stdin.write(im.convert('RGB').tobytes())
    enc.stdin.close()
    enc.wait()


if __name__ == '__main__':
    main()
