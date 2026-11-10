#!/usr/bin/env python3
"""Assemble False Floor Case No. 02 (v3) from its sequences, in order, + the end card; one final two-pass linear
loudnorm (-14 LUFS / -1.5 dBTP) over the whole programme; subtitles from George's word timings on the new clock.

    python3 tools/ep_assemble.py [--out out/FALSE_FLOOR_E02_v3.mp4]
Inputs: out/FALSE_FLOOR_COLD_v2.mp4 (+ _map.json if present), out/EP3_ch1.mp4 ... out/EP3_ch7.mp4 (+ _map.json).
"""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_srt import words_on_vo_clock

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(FF, 'out', 'vo', 'vo_george_v4_v01')
PARTS = ['out/FALSE_FLOOR_COLD_v2.mp4'] + [f'out/EP3_ch{i}.mp4' for i in range(1, 8)]


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                                capture_output=True, text=True).stdout.strip())


def ts(t):
    h, r = divmod(t, 3600)
    m, s_ = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s_):02d},{int(round((s_ - int(s_)) * 1000)):03d}'.replace(',1000', ',999')


def main():
    os.chdir(FF)
    out = arg('--out', 'out/FALSE_FLOOR_E02_v3.mp4')
    crf = arg('--crf', '18')
    parts = [p for p in PARTS if os.path.exists(p)]
    missing = [p for p in PARTS if not os.path.exists(p)]
    if missing:
        print('[asm] missing:', missing, flush=True)
    end = os.path.join(FF, 'out', 'edit_segments', 'END.mp4')
    if os.path.exists(end):
        parts.append(end)
    # one decode of every part through the concat filter (no intermediate copies on disk): 1080p24 yuv420p + 48k stereo
    offs, t, inputs, vf, af = [], 0.0, [], [], []
    for i, p in enumerate(parts):
        d = dur(p)
        has_audio = 'audio' in subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type', '-of',
                                               'csv=p=0', p], capture_output=True, text=True).stdout
        inputs += ['-i', p]
        vf.append(f'[{i}:v]scale=1920:1080:flags=lanczos,fps=24,format=yuv420p,setsar=1[v{i}]')
        af.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo[a{i}]' if has_audio else
                  f'aevalsrc=0:d={d:.3f}:s=48000:c=stereo[a{i}]')
        offs.append((p, t))
        print(f'[asm] {os.path.basename(p)} at {t:.2f}s ({d:.2f}s)', flush=True)
        t += d
    n = len(parts)
    acat = (''.join(f'[a{i}]' for i in range(n)) + f'concat=n={n}:v=0:a=1,'
            'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[aout]')
    m = subprocess.run(['ffmpeg', '-hide_banner', *inputs, '-filter_complex', ';'.join(af + [acat]), '-map', '[aout]',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    if '{' not in m:
        raise SystemExit('[asm] loudness pass failed:\n' + m[-2000:])
    js = json.loads(m[m.rindex('{'):m.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,"
          f"alimiter=limit=0.83:attack=1:release=60:level=false,aresample=48000")
    cat = ''.join(f'[v{i}][a{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=1[vc][ac]'
    fc = ';'.join(vf + af + [cat, f'[ac]{ln}[aout]'])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', fc, '-map', '[vc]', '-map', '[aout]',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k',
                    '-movflags', '+faststart', out], check=True)
    # subtitles: every word of George's VO, placed through each part's piece map
    words = words_on_vo_clock(VO)
    cues = []
    for p, t0 in offs:
        mp = os.path.splitext(p)[0] + '_map.json'
        if not os.path.exists(mp):
            continue
        for a, b, at in json.load(open(mp))['pieces']:
            ws = [w for w in words if a - 0.01 <= w[2] < b]
            line, ls = [], None
            for _bt, w, wa, we in ws:
                st = t0 + at + (wa - a)
                en = t0 + at + (we - a)
                if ls is None:
                    ls = st
                line.append(w)
                if w.endswith(('.', '?', '!', ':')) or len(' '.join(line)) > 38:
                    cues.append((ls, en + 0.15, ' '.join(line)))
                    line, ls = [], None
            if line:
                cues.append((ls, t0 + at + (b - a), ' '.join(line)))
    srt = os.path.splitext(out)[0] + '.srt'
    with open(srt, 'w') as f:
        for i, (a, b, txt) in enumerate(cues, 1):
            f.write(f'{i}\n{ts(a)} --> {ts(max(b, a + 0.8))}\n{txt}\n\n')
    print(f'[asm] wrote {out} ({dur(out):.1f}s), {srt} ({len(cues)} cues)', flush=True)


if __name__ == '__main__':
    main()
