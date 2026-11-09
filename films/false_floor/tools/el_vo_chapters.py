#!/usr/bin/env python3
"""VO voiced one CHAPTER per request (natural phrasing across sentences) on a modern ElevenLabs model; beat boundaries
recovered from ElevenLabs' character timestamps. Same output format as make_temp_vo.py / el_vo.py.

python3 tools/el_vo_chapters.py script/EPISODE_02_SCRIPT_v2.md out/vo/vo_<name> --voice VOICE_ID [--model eleven_v4]
       [--stability 0.5]
Pauses: [pause Xs] -> "…" (natural pause on v3/v4); the edit adds the remaining silence between beats.
"""
import base64, json, os, subprocess, sys, tempfile, time, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_temp_vo import parse, SR, GAP_CHAPTER


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def beat_text(b):
    out = ''
    for text, pause in b['segs']:
        if text:
            out += (' ' if out else '') + text
        if pause >= 0.6:
            out += ' …'
        elif pause > 0:
            out += ' —' if not out.endswith(('.', '?', '!', ':')) else ''
    return out.strip()


def tts(text, voice, model, stability):
    body = {'text': text, 'model_id': model, 'voice_settings': {'stability': stability, 'similarity_boost': 0.8}}
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_192',
                                 data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected',
                                          'User-Agent': 'false-floor-production/1.0'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def decode(mp3):
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
        f.write(mp3)
        p = f.name
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True,
                         check=True).stdout
    os.remove(p)
    return np.frombuffer(raw, np.float32)


def main():
    src, outp = sys.argv[1], sys.argv[2]
    voice, model, stab = arg('--voice'), arg('--model', 'eleven_v4'), float(arg('--stability', 0.5))
    beats = parse(src)
    chapters = []          # (chapter name, beats) chunks of <= MAXC characters, split at beat boundaries
    MAXC = int(arg('--max-chars', 1800))
    for b in beats:
        if (not chapters or chapters[-1][0] != b['chapter'] or
                sum(len(beat_text(x)) + 2 for x in chapters[-1][1]) + len(beat_text(b)) > MAXC):
            chapters.append((b['chapter'], []))
        chapters[-1][1].append(b)
    cache = outp + '_chapters'
    os.makedirs(cache, exist_ok=True)
    track, t, timing = [], 0.0, []
    for ci, (ch, bs) in enumerate(chapters):
        texts = [beat_text(b) for b in bs]
        full, spans = '', []
        for tx in texts:
            if full:
                full += '\n\n'
            spans.append((len(full), len(full) + len(tx)))
            full += tx
        cp = os.path.join(cache, f'{ci:02d}.json')
        if not os.path.exists(cp):
            for attempt in range(3):
                try:
                    res = tts(full, voice, model, stab)
                    json.dump(res, open(cp, 'w'))
                    break
                except Exception as e:
                    print('retry', ci, getattr(e, 'read', lambda: str(e))(), flush=True)
                    time.sleep(5 * (attempt + 1))
            else:
                raise SystemExit(f'chapter {ci} failed')
        res = json.load(open(cp))
        a = decode(base64.b64decode(res['audio_base64']))
        al = res.get('normalized_alignment') or res['alignment']
        st, en = al['character_start_times_seconds'], al['character_end_times_seconds']
        nchar = len(st)
        if ci:
            gap = GAP_CHAPTER if ch != chapters[ci - 1][0] else 0.35
            track.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        base = t
        for (s0, s1), b, tx in zip(spans, bs, texts):
            i0 = min(s0, nchar - 1)
            i1 = min(max(s1 - 1, i0), nchar - 1)
            bt0 = max(0.0, st[i0] - 0.05)
            bt1 = min(len(a) / SR, en[i1] + 0.12)
            timing.append({'beat': b['beat'], 'chapter': ch, 'tc_script': b['tc_script'], 'tag': b['tag'], 'shot': b['shot'],
                           'text': tx, 'start': round(base + bt0, 3), 'end': round(base + bt1, 3)})
        track.append(a)
        t += len(a) / SR
        print(f'[vo] chapter {ci} {ch[:28]:28s} {len(a) / SR:6.1f}s', flush=True)
    y = np.concatenate(track)
    y = y / (np.abs(y).max() + 1e-9) * 0.8
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2',
                          '-c:a', 'pcm_s24le', outp + '.wav'], stdin=subprocess.PIPE)
    p.stdin.write(y.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({'source': os.path.basename(src), 'voice': voice, 'model': model, 'duration': round(t, 3), 'beats': timing},
              open(outp + '.json', 'w'), indent=1)
    print(f'[vo] wrote {outp}.wav {t / 60:.0f}:{t % 60:04.1f}')


if __name__ == '__main__':
    main()
