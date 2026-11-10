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
import ep_cuts

FF = E.FF
VO = os.path.join(FF, 'out', 'vo', 'vo_george_v4_v01')
SFX = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'sfx')
MUS = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'music')

# Sequences: (shot, beat, first word of the shot's VO phrase) — a shot starts when that word starts (minus a lead);
# INOFF = first frame used inside each clip (after the 6-frame handle trim): start on the action.
SEQS = {
    'night': dict(
        plan='SEQ_NIGHT.json', beats=[23, 24, 25, 27], end_word={25: 'key.'}, music=('ff_3', 12.0, -15), tail=2.6,
        cuts=[('N1', 23, 'Saturday'), ('N2', 23, 'The#2'), ('N3', 24, 'Down'), ('S18', 24, 'a'), ('S24', 24, 'holding'),
              ('N5', 24, 'The'), ('S16', 25, 'Then'), ('S17', 25, 'Then#2'), ('N8', 27, 'Then'), ('N9', 27, 'They#2'),
              ('N10', 27, 'One')],
        inoff={'N3': 24, 'S16': 168, 'N8': 14, 'N9': 0, 'S24': 16, 'S18': 40}),
    'cold': dict(
        plan='SEQ_COLD.json', beats=[0, 1, 2, 3], end_word={}, music=('ff_COLD', 0.0, -9), tail=3.0,
        cuts=[('C1', 0, 'Monday'), ('C2', 0, 'Two'), ('C3', 0, 'a'), ('C4', 0, 'and'), ('S01', 1, 'Three'),
              ('C5', 1, 'A'), ('S18', 1, 'A#2'), ('C6', 1, 'Heat'), ('C7', 1, 'motion'), ('C8', 2, 'A'),
              ('C9', 2, 'Diamonds'), ('C10', 2, 'And'), ('C11', 3, 'Police'), ('C12', 3, 'But'), ('C13', 3, 'two#2')],
        inoff={'S01': 96, 'S18': 40},
        speed={'C6': 2.0},                       # whip through the sensor pan (frame skipping, never blending)
        post={'C10': (1.16, 3.5)}),              # slow push + turn on the top-down so it never sits still
}
CFG = None
CUTS, INOFF, BEATS = [], {}, []
GAP = 0.32                     # silence between VO pieces


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def main():
    global CFG, CUTS, INOFF, BEATS
    name = arg('--seq', 'night')
    CFG = SEQS[name] if name in SEQS else ep_cuts.CH[name]
    CFG.setdefault('end_word', {})
    CUTS, INOFF, BEATS = CFG['cuts'], CFG['inoff'], CFG['beats']
    TAIL = CFG['tail']
    preview = '--preview' in sys.argv
    if preview:
        E.set_size(960, 540)
    out = os.path.join(FF, arg('--out', f"out/FALSE_FLOOR_{arg('--seq', 'night').upper()}.mp4"))
    vo = E.load_wav(VO + '.wav')
    beats = {b['beat']: b for b in json.load(open(VO + '.json'))['beats']}
    words = [w for w in words_on_vo_clock(VO) if w[0] in BEATS]
    # VO pieces on the output clock
    pieces, t = [], 0.4
    wpos = {}                                   # (beat, word#n) -> output time of the word start
    allw = words_all = [w for w in words_on_vo_clock(VO)]
    for b in BEATS:
        bw = [w for w in words if w[0] == b]
        last = next(w for w in bw if w[1] == CFG['end_word'][b]) if b in CFG['end_word'] else bw[-1]
        s0 = max(0.0, bw[0][2] - 0.06)
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
    seq = ({s['id']: s for s in json.load(open(os.path.join(FF, 'script', CFG['plan'])))['shots']} if CFG.get('plan')
           else {})
    for sid, _b, _w in CUTS:
        seq.setdefault(sid, dict(seq.get(sid.split('@')[0], {'id': sid, 'kind': '3D', 'shot': sid}), id=sid))
    seq.setdefault('S18', {'id': 'S18', 'kind': 'CLIP', 'shot': 'magnetic plates, field lines (A2 macro)'})
    seq.setdefault('S01', {'id': 'S01', 'kind': 'CLIP', 'shot': 'the open door (A1 reveal)'})
    for i, (sid, b, w) in enumerate(CUTS):
        t0 = starts[i]
        t1 = starts[i + 1] if i + 1 < len(CUTS) else total
        kind = seq[sid]['kind']
        e = {'id': sid, 'kind': '3D' if kind == '3D' else '3D', 'src_kind': '3D', 'shot': seq[sid]['shot'], 't0': t0, 'dur': t1 - t0,
             'chapter': '3', 'vo_src': None}
        if sid == 'S17':
            e['src_kind'] = 'CLIP_RAW'          # rendered without handles (frames 60-130)
        if '@' in sid:                          # 'C4@40': the same clip again, from another in-point
            base, off = sid.split('@')
            e['clip'] = base
            INOFF[sid] = int(off)
        k = ep_cuts.kind_of(e.get('clip', sid))
        e['ep_kind'] = k
        if k in ('AI', 'GFX'):
            e['src_kind'] = 'RAW'
        if k == 'GFX':
            INOFF.setdefault(sid, 12)          # skip the graphic's lead-in handle
        e['first'] = (i == 0)
        shots.append(e)
    print(f'[seq] {total:.1f}s, {len(shots)} shots: ' + ' '.join(f"{e['id']}={e['dur']:.1f}" for e in shots), flush=True)
    if '--plan' in sys.argv:                    # timing check only: shot length vs the source's usable length
        for e in shots:
            cid = e.get('clip', e['id'])
            src = None
            for ext in ('.mkv', '.mp4', '.png'):
                q = os.path.join(FF, 'out', 'clips', cid + ext)
                if os.path.exists(q):
                    src = q
                    break
            if src is None:
                have = None
            elif src.endswith('.png'):
                have = 99.0
            else:
                d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                                          src], capture_output=True, text=True).stdout.strip() or 0)
                hand = 12 if e['ep_kind'] == 'GFX' else (6 if e['ep_kind'] == '3D' else 0)
                have = (d * E.FPS - INOFF.get(e['id'], 0) - hand) / E.FPS / CFG.get('speed', {}).get(e['id'], 1.0)
            flag = ('MISSING' if have is None else 'SHORT %.1f' % have if e['dur'] > have + 0.3 else '') + \
                   (' <1.2s' if e['dur'] < 1.2 else '') + (' >7s' if e['dur'] > 7.0 and e['ep_kind'] != 'GFX' else '')
            print(f"  {e['t0']:6.1f} {e['id']:16s} {e['dur']:5.1f}s  {flag}")
        if '--out' in sys.argv:                 # map only (for subtitles of a sequence rendered earlier)
            json.dump({'name': name, 'total': total, 'pieces': [[a, b, at] for a, b, at in pieces],
                       'cuts': [[e['id'], e['t0'], e['dur']] for e in shots]},
                      open(os.path.splitext(out)[0] + '_map.json', 'w'), indent=1)
        return
    # picture
    work = os.path.join(FF, 'out', 'seq_segments', name)
    os.makedirs(work, exist_ok=True)
    segs = []
    for e in shots:
        p = os.path.join(work, e['id'] + '.mp4')
        n = int(round(e['dur'] * E.FPS))
        if not ('--reuse' in sys.argv and os.path.exists(p)):
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
        f = min(int(0.02 * SR), len(seg) // 2)
        if f > 0:
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
    end_vo = pieces[-1][2] + (pieces[-1][1] - pieces[-1][0])
    if name == 'night':
        sfx_night(put, st, total, end_vo)
    elif name == 'cold':
        sfx_cold(put, st, total, end_vo, shots)
    else:
        sfx_chapter(put, shots, total, CFG)
    # music: the heist cue, smooth sidechain duck (attack 80 ms, release 700 ms, -4.5 dB), long ending
    trk, moff, mgain = CFG['music']
    bed = E.load_wav(os.path.join(MUS, trk + '.wav'))
    off = int(moff * SR)
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
    mix = vo_bus + fx + bed * (10 ** (mgain / 20)) * duck[:, None] * fade[:, None]
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
    # VO piece map on this sequence's clock (for episode subtitles)
    json.dump({'name': name, 'total': total, 'pieces': [[a, b, at] for a, b, at in pieces],
               'cuts': [[e['id'], e['t0'], e['dur']] for e in shots]},
              open(os.path.splitext(out)[0] + '_map.json', 'w'), indent=1)
    print('[seq] wrote', out, flush=True)


def _luma_stats(im):
    a = np.asarray(im.resize((160, 90), Image.BILINEAR)).astype(np.float32) / 255.0
    Y = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    return float(np.percentile(Y, 99.0)), Y


def sfx_night(put, st, total, end_vo):
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
    put('boom__big_cinematic_impact', end_vo - 0.05, -9)


def sfx_chapter(put, shots, total, cfg):
    """Episode chapters: ambience beds between named cuts, a soft air whoosh when the picture changes medium
    (3D/AI <-> graphics), a low knock under the chapter card."""
    first = {}
    for e in shots:
        first.setdefault(e['id'], e['t0'])
    put('boom__sub_knock', 0.15, -16)
    for name, a, b, gain in cfg.get('beds', []):
        t0 = first.get(a, 0.0) if a else 0.0
        t1 = first.get(b, total) if b else total
        if t1 > t0 + 0.5:
            put(name, t0 - 0.2, gain, dur=t1 - t0 + 0.6, fin=0.6, fout=0.8)
    prev = None
    for e in shots:
        k = 'G' if e.get('ep_kind') == 'GFX' else 'P'
        if prev is not None and k != prev:
            put('whoosh__deep_air', e['t0'] - 0.25, -21)
        prev = k


def chapter_card(i, lines):
    """Chapter header, top-left: small tracked label + chapter name, builds on with a short slide, fades by 3.6 s."""
    from PIL import ImageFont
    W, H = E.W, E.H
    k = H / 1080
    if 'ch_big' not in _FONT:
        _FONT['ch_big'] = ImageFont.truetype(os.path.join(FF, 'fonts', 'BarlowCondensed-SemiBold.ttf'), int(58 * k))
        _FONT['ch_small'] = ImageFont.truetype(os.path.join(FF, 'fonts', 'BarlowCondensed-Medium.ttf'), int(26 * k))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    out = max(0.0, min(1.0, (i - 74) / 14))
    for j, (txt, f) in enumerate(((lines[0], _FONT['ch_small']), (lines[1], _FONT['ch_big']))):
        t = max(0.0, min(1.0, (i - 4 - j * 5) / 12))
        a = int(255 * (t * t * (3 - 2 * t)) * (1 - out))
        y = int((96 if j == 0 else 128) * k + (1 - t) * 12 * k)
        d.text((int(100 * k), y), txt, font=f, fill=(236, 232, 223, a))
    if i > 6:
        t = max(0.0, min(1.0, (i - 6) / 14))
        a = int(255 * t * (1 - out))
        d.rectangle([int(100 * k), int(84 * k), int(100 * k + 64 * k * t), int(86 * k)], fill=(232, 163, 61, a))
    return lay


def vhs(im, i):
    """Hidden-camera look: soft, chroma-shifted, scanlines, REC dot + running timecode."""
    from PIL import ImageFilter
    W, H = im.size
    im = im.convert('RGB').resize((W // 3, H // 3), Image.BILINEAR).resize((W, H), Image.BILINEAR)
    r, g, b = im.split()
    r = r.transform(im.size, Image.AFFINE, (1, 0, 3, 0, 1, 0))
    im = Image.merge('RGB', (r, g, b))
    a = np.asarray(im).astype(np.float32)
    a[::3] *= 0.86
    a = a * 0.92 + 10
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    d = ImageDraw.Draw(im)
    from PIL import ImageFont
    f = ImageFont.truetype(os.path.join(FF, 'fonts', 'BarlowCondensed-Medium.ttf'), int(34 * H / 1080))
    if (i // 12) % 2 == 0:
        d.ellipse([int(90 * W / 1920), int(80 * H / 1080), int(112 * W / 1920), int(102 * H / 1080)], fill=(220, 40, 30, 255))
    d.text((int(124 * W / 1920), int(74 * H / 1080)), 'REC', font=f, fill=(235, 235, 235, 255))
    sec = 41 + i // 24
    d.text((W - int(100 * W / 1920), H - int(90 * H / 1080)), f'00:12:{sec:02d}:{i % 24:02d}', font=f,
           fill=(235, 235, 235, 255), anchor='rs')
    return im


def sfx_cold(put, st, total, end_vo, shots):
    """Cold open: Monday morning street -> stairwell -> lights flicker on -> the reveal; sensor montage on hits;
    vault tone; a low boom on 'the heist of the century'; the sound logo under the title."""
    put('el__city_dusk', 0.0, -17, dur=st['C3'] + 0.5, fin=0.6, fout=0.8)
    put('whoosh__deep_air', st['C2'] - 0.3, -15)
    put('el__antechamber_fluoro', st['C3'] + 1.2, -18, dur=st['C8'] - st['C3'], fin=0.2, fout=0.8)
    put('elec__hum_low', st['C3'] + 1.2, -24, dur=st['C8'] - st['C3'], fin=0.3, fout=0.8)
    put('el__fluoro_flicker_on', st['C3'] + 1.0, -10)
    put('boom__bass_hit_short', st['C4'] + 0.6, -10)
    put('metal__slam_heavy_door_mixkit', st['S01'] - 0.05, -18)
    for k in ('C5', 'S18', 'C6'):
        put('mech__gear_lock_metallic', st[k] - 0.02, -16)
    put('riser__suspense_swell', st['C7'] - 0.2, -20)
    put('el__vault_room_tone', st['C8'] - 0.3, -16, dur=st['C12'] - st['C8'] + 0.6, fin=0.5, fout=0.9)
    put('paper__rustle', st['C9'] + 0.2, -16)
    put('paper__slide', st['C10'] + 1.0, -18)
    put('boom__blockbuster_deep_drum', st['C11'] + 0.1, -11)
    put('whoosh__deep_air', st['C12'] - 0.2, -14)
    put('hit__trailer_logo_impact', st['C13'] + 0.5, -10)
    put('ff__sound_logo', st['C13'] + 0.6, -12)


_FONT = {}


def date_card(i, lines):
    """Lower-left editorial date card: cream Barlow Condensed, builds up with a short slide, holds."""
    from PIL import ImageFont
    W, H = E.W, E.H
    k = H / 1080
    if 'big' not in _FONT:
        _FONT['big'] = ImageFont.truetype(os.path.join(FF, 'fonts', 'BarlowCondensed-SemiBold.ttf'), int(64 * k))
        _FONT['small'] = ImageFont.truetype(os.path.join(FF, 'fonts', 'BarlowCondensed-Medium.ttf'), int(30 * k))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for j, (txt, f) in enumerate(((lines[0], _FONT['big']), (lines[1], _FONT['small']))):
        t = max(0.0, min(1.0, (i - 6 - j * 5) / 12))
        a = int(255 * (t * t * (3 - 2 * t)))
        y = int((H - (300 if j == 0 else 236) * k) + (1 - t) * 14 * k)
        d.text((int(100 * k), y), txt, font=f, fill=(236, 232, 223, a))
    if i > 8:
        t = max(0.0, min(1.0, (i - 8) / 14))
        d.rectangle([int(100 * k), int(H - 196 * k), int(100 * k + 90 * k * t), int(H - 192 * k)], fill=(228, 68, 46, 255))
    return lay


def render_seg(e, path, n, preview):
    """One shot: clip frames from the in-point (hold the last frame if short; never blend frames), exposure balanced
    PER FRAME and smoothed over ~1 s so light changes inside a shot read naturally, label and overlays on top."""
    src = E.Source(dict(e, id=e.get('clip', e['id'])) if e.get('clip') else e)
    if e['src_kind'] == 'CLIP_RAW' and src.mode == 'clip':
        src.e = dict(e, src_kind='RAW')
    rng = np.random.default_rng(abs(hash(e['id'])) % 1000)
    if src.mode == 'clip':
        fr = src.clip_frames(n)[INOFF.get(e['id'], 0):]
        sp = CFG.get('speed', {}).get(e['id'], 1.0)
        if sp != 1.0:
            fr = fr[np.round(np.arange(0, len(fr), sp)).astype(int).clip(0, len(fr) - 1)]
        src.n_clip = len(fr)
        frames = [Image.fromarray(fr[i]) for i in range(min(n, len(fr)))]
        if n > len(fr):                      # past the clip's end: a slow push on the last frame (never a dead freeze)
            last = Image.fromarray(fr[-1])
            extra = n - len(fr)
            frames += [E.kb(last, (j + 1) / extra * 0.3, 7) for j in range(extra)]
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
            gain = float(np.clip(0.82 / max(hi, 1e-3), 0.8, 2.6))     # also tames washed-out frames
            mm = min(1.0, m * gain)
            gamma = float(np.clip(np.log(0.26) / np.log(max(mm, 1e-3)), 0.62, 1.0)) if mm < 0.26 else 1.0
            expos.append((gain, gamma))
    else:
        frames = list(src.frame_iter(n))
        smp = src.samples() if not getattr(src, 'placeholder', False) else []
        expos = [E.shot_exposure(smp) if smp else (1.0, 1.0)] * n
    label = E.overlay('O_LABEL') or E.label_fallback()
    gfx = e.get('ep_kind') == 'GFX'
    counter = None
    if e['id'] == 'N10' and os.path.exists(os.path.join(FF, 'notes', 'room_N10_counter.json')):
        cj = json.load(open(os.path.join(FF, 'notes', 'room_N10_counter.json')))
        snaps = sorted(d['snap_frame'] for d in cj['doors'])
        counter = (snaps, cj['cut'][0])
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{E.W}x{E.H}', '-r', str(E.FPS),
                            '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23' if preview else '16', '-pix_fmt', 'yuv420p',
                            path], stdin=subprocess.PIPE)
    post = CFG.get('post', {}).get(e['id'])
    for i, im in enumerate(frames):
        if post:                             # 2D push-in + slight turn over the shot (keeps a still crane alive)
            z, rdeg = post
            u = i / max(1, n - 1)
            u = u * u * (3 - 2 * u)
            zz = 1.0 + (z - 1.0) * u
            im = im.rotate(rdeg * u, resample=Image.BICUBIC, expand=False)
            w_, h_ = im.size
            cw, ch = w_ / (zz * 1.06), h_ / (zz * 1.06)
            im = im.resize((w_, h_), Image.BICUBIC, box=((w_ - cw) / 2, (h_ - ch) / 2, (w_ + cw) / 2, (h_ + ch) / 2))
        if gfx:
            im = im.convert('RGBA')
            if im.size != (E.W, E.H):
                im = im.resize((E.W, E.H), Image.LANCZOS)
        else:
            im = E.grade(im, rng, expos[i]).convert('RGBA')
            dim = CFG.get('dim', {}).get(e.get('clip', e['id']))
            if dim:                              # night shots rendered too bright: lower + deepen the mids
                a_ = np.asarray(im).astype(np.float32)
                a_[..., :3] = 255.0 * (a_[..., :3] / 255.0) ** 1.25 * dim
                im = Image.fromarray(np.clip(a_, 0, 255).astype(np.uint8), 'RGBA')
            if e['id'] in CFG.get('vhs', []):
                im = vhs(im, i)
            im = Image.alpha_composite(im, label)
        if e.get('first') and CFG.get('title'):
            im = Image.alpha_composite(im, chapter_card(i, CFG['title']))
        base_id = e.get('clip', e['id'])
        if base_id in ('S24', 'S18') and src.mode == 'clip':
            cf = 7 + INOFF.get(e['id'], 0) + min(i, src.n_clip - 1)
            o = E.field_lines(base_id, cf, i, min(1.0, (i + 1) / 10) if base_id == 'S18' else 1.0)
            if o:
                im = Image.alpha_composite(im, o)
        if e['id'] == 'C1' and arg('--seq', 'night') == 'cold':
            o = date_card(i, ['MONDAY 17 FEBRUARY 2003', 'ANTWERP · DIAMOND DISTRICT'])
            im = Image.alpha_composite(im, o)
        if e['id'] == 'C8' and arg('--seq', 'night') == 'cold':
            o = E.overlay('O_109', min(i, 251))
            if o:
                im = Image.alpha_composite(im, o)
        if e['id'] == 'C13' and arg('--seq', 'night') == 'cold':
            o = E.overlay('O_TITLE', min(max(0, i - 10), 71))
            if o and i >= 10:
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
