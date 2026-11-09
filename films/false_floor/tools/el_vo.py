#!/usr/bin/env python3
"""George voice-over (ElevenLabs TTS, key injected by the environment proxy) from the locked script, beat by beat.

python3 tools/el_vo.py script/EPISODE_02_SCRIPT_v2.md out/vo/vo_george_v01 [--voice JBFqnCBsd6RMkjVDRZzb]
Each beat is one request; [pause Xs] becomes <break time="Xs" />; previous/next beat text is sent as context so the read
flows. Writes <out>.wav + <out>.json with the same timing format as make_temp_vo.py (the episode editor uses either).
"""
import json, os, re, subprocess, sys, tempfile, time, urllib.request
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_temp_vo import parse, norm, SR, GAP_BEAT, GAP_CHAPTER

VOICE = 'JBFqnCBsd6RMkjVDRZzb'     # George - Warm, Captivating Storyteller (premade)
MODEL = 'eleven_multilingual_v2'


def beat_text(b):
    parts = []
    for text, pause in b['segs']:
        if text:
            parts.append(text)
        if pause:
            parts.append(f'<break time="{min(3.0, pause):.1f}s" />')
    return ' '.join(parts)


def tts(text, prev, nxt, voice):
    body = {'text': text, 'model_id': MODEL, 'previous_text': prev or None, 'next_text': nxt or None,
            'voice_settings': {'stability': 0.48, 'similarity_boost': 0.8, 'style': 0.18, 'use_speaker_boost': True, 'speed': 0.97}}
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_192',
                                 data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected',
                                          'User-Agent': 'false-floor-production/1.0'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def decode(mp3):
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
        f.write(mp3)
        p = f.name
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True,
                         check=True).stdout
    os.remove(p)
    a = np.frombuffer(raw, np.float32)
    idx = np.where(np.abs(a) > 0.008)[0]
    if len(idx):
        a = a[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.08 * SR)]
    return a


def main():
    src, outp = sys.argv[1], sys.argv[2]
    voice = sys.argv[sys.argv.index('--voice') + 1] if '--voice' in sys.argv else VOICE
    beats = parse(src)
    cache_dir = outp + '_beats'
    os.makedirs(cache_dir, exist_ok=True)
    texts = [beat_text(b) for b in beats]
    plain = [' '.join(t for t, _ in b['segs'] if t) for b in beats]
    track, t, prev_ch, timing = [], 0.0, None, []
    for i, b in enumerate(beats):
        cp = os.path.join(cache_dir, f'{i:02d}.mp3')
        if not os.path.exists(cp):
            for attempt in range(3):
                try:
                    mp3 = tts(texts[i], plain[i - 1] if i else '', plain[i + 1] if i + 1 < len(beats) else '', voice)
                    open(cp, 'wb').write(mp3)
                    break
                except Exception as e:
                    print('retry', i, e, flush=True)
                    time.sleep(4 * (attempt + 1))
            else:
                raise SystemExit(f'beat {i} failed')
        a = decode(open(cp, 'rb').read())
        if prev_ch is not None:
            gap = GAP_CHAPTER if b['chapter'] != prev_ch else GAP_BEAT
            track.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        prev_ch = b['chapter']
        start = t
        track.append(a)
        t += len(a) / SR
        timing.append({'beat': b['beat'], 'chapter': b['chapter'], 'tc_script': b['tc_script'], 'tag': b['tag'], 'shot': b['shot'],
                       'text': plain[i], 'start': round(start, 3), 'end': round(t, 3)})
        print(f'[george] {i:02d} {start:7.2f}-{t:7.2f}', flush=True)
    y = np.concatenate(track)
    y = y / (np.abs(y).max() + 1e-9) * 0.8
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2',
                          '-c:a', 'pcm_s24le', outp + '.wav'], stdin=subprocess.PIPE)
    p.stdin.write(y.astype(np.float32).tobytes())
    p.stdin.close()
    p.wait()
    json.dump({'source': os.path.basename(src), 'voice': 'George (ElevenLabs premade)', 'model': MODEL, 'duration': round(t, 3),
               'beats': timing}, open(outp + '.json', 'w'), indent=1)
    print(f'[george] wrote {outp}.wav {t / 60:.0f}:{t % 60:04.1f}')


if __name__ == '__main__':
    main()
