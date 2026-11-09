#!/usr/bin/env python3
"""Temporary (scratch) VO for the animatic, from the approved script, with a per-beat timing map.

Uses Piper TTS (offline). Not for publishing: the final VO is Collin's ElevenLabs "George" read of the same script.
  PIPER_PY=/path/to/venv/bin/python PIPER_VOICE=/path/en_US-ryan-high.onnx \
    python3 tools/make_temp_vo.py script/EPISODE_02_SCRIPT_v2.md out/vo/vo_temp_v01
Writes <out>.wav (48 kHz stereo) and <out>.json: [{beat, chapter, tc_script, tag, shot, text, start, end}].
[pause Xs] in the script becomes exact silence; [DROP] is a music cue (no silence by itself).
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np

SR = 48000
GAP_BEAT = 0.45        # breath between beats
GAP_CHAPTER = 1.2      # between chapters
LENGTH_SCALE = os.environ.get('VO_LENGTH_SCALE', '1.2')


def norm(t):
    t = re.sub(r'\[(?:\d+|V)(?:\]\[(?:\d+|V))*\]', '', t)          # fact refs [3][4]
    t = re.sub(r'\[\d+(?:,\s*\d+)*\]', '', t)
    t = t.replace('[DROP]', '')
    t = t.replace('**', '').replace('*', '')
    t = t.replace('WIRED', 'Wired').replace('E19', 'E nineteen').replace('—', ', ').replace(' - ', ', ')
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'\s+([,.;:!?])', r'\1', t).replace(', ,', ',').replace(',,', ',')
    return t.strip(' ,')


def parse(path):
    beats, chapter, cur = [], None, None
    for line in open(path):
        line = line.rstrip('\n')
        m = re.match(r'^## (.+)', line)
        if m:
            chapter = m.group(1).split('—')[0].strip()
            continue
        m = re.match(r'^\*\*\[(\d+:\d\d)\]\s*([^*]*)\*\*\s*(?:\*[^*]*\*)?\s*—?\s*(.*)', line)
        if m:
            cur = {'chapter': chapter, 'tc_script': m.group(1), 'tag': m.group(2).strip(), 'shot': m.group(3).strip(), 'vo': []}
            beats.append(cur)
            continue
        if line.startswith('> ') and cur is not None:
            cur['vo'].append(line[2:])
    out = []
    for i, b in enumerate(beats):
        raw = ' '.join(b['vo'])
        parts = re.split(r'\[pause ([0-9.]+)s\]', raw)
        segs = []
        for k in range(0, len(parts), 2):
            text = norm(parts[k])
            pause = float(parts[k + 1]) if k + 1 < len(parts) else 0.0
            if text or pause:
                segs.append((text, pause))
        if segs:
            out.append({**{k: v for k, v in b.items() if k != 'vo'}, 'beat': len(out), 'segs': segs})
    return out


def tts(text, py, voice):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wav = f.name
    subprocess.run([py, '-m', 'piper', '-m', voice, '-f', wav, '--length-scale', LENGTH_SCALE, '--sentence-silence', '0.22'],
                   input=text, text=True, capture_output=True, check=True)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    os.remove(wav)
    a = np.frombuffer(raw, np.float32)
    # trim leading/trailing silence (keep 30 ms)
    idx = np.where(np.abs(a) > 0.01)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.06 * SR)]
    return a


def main():
    src, outp = sys.argv[1], sys.argv[2]
    py = os.environ['PIPER_PY']
    voice = os.environ['PIPER_VOICE']
    beats = parse(src)
    track, t, prev_ch, timing = [], 0.0, None, []
    for b in beats:
        if prev_ch is not None:
            gap = GAP_CHAPTER if b['chapter'] != prev_ch else GAP_BEAT
            track.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        prev_ch = b['chapter']
        start = t
        texts = []
        for text, pause in b['segs']:
            if text:
                a = tts(text, py, voice)
                track.append(a)
                t += len(a) / SR
                texts.append(text)
            if pause:
                track.append(np.zeros(int(pause * SR), np.float32))
                t += pause
        timing.append({'beat': b['beat'], 'chapter': b['chapter'], 'tc_script': b['tc_script'], 'tag': b['tag'],
                       'shot': b['shot'], 'text': ' '.join(texts), 'start': round(start, 3), 'end': round(t, 3)})
        print(f"[vo] {b['beat']:02d} {b['chapter'][:22]:22s} {start:7.2f}-{t:7.2f}  {b['tag']}", flush=True)
    y = np.concatenate(track)
    y = y / (np.abs(y).max() + 1e-9) * 0.7
    os.makedirs(os.path.dirname(outp), exist_ok=True)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2',
                          '-c:a', 'pcm_s24le', outp + '.wav'], stdin=subprocess.PIPE)
    p.stdin.write(y.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({'source': os.path.basename(src), 'voice': os.path.basename(voice), 'length_scale': LENGTH_SCALE,
               'duration': round(t, 3), 'beats': timing}, open(outp + '.json', 'w'), indent=1)
    print(f'[vo] wrote {outp}.wav  {t / 60:.0f}:{t % 60:04.1f}  ({len(timing)} beats)')


if __name__ == '__main__':
    main()
