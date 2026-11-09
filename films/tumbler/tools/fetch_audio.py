#!/usr/bin/env python3
"""Download every sound in audio/manifest.json and convert to 48 kHz stereo WAV (audio/sfx/<key>.wav, audio/music/<key>.wav)."""
import json, os, subprocess, urllib.request
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man = json.load(open(os.path.join(FILM, 'audio', 'manifest.json')))
raw = os.path.join(FILM, 'audio', 'raw'); os.makedirs(raw, exist_ok=True)
for kind in ('sfx', 'music'):
    os.makedirs(os.path.join(FILM, 'audio', kind), exist_ok=True)
    for it in man.get(kind, []):
        if not it.get('url'):
            continue
        dst = os.path.join(FILM, 'audio', kind, it['key'] + '.wav')
        if os.path.exists(dst):
            continue
        ext = os.path.splitext(it['url'])[1] or '.bin'
        src = os.path.join(raw, it['key'] + ext)
        if not os.path.exists(src):
            try:
                req = urllib.request.Request(it['url'], headers={'User-Agent': 'tumbler-film-fetch/1.0'})
                with urllib.request.urlopen(req, timeout=60) as r, open(src, 'wb') as f:
                    f.write(r.read())
            except Exception as e:
                print('FAILED', kind, it['key'], it['url'], e)
                continue
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', dst], check=True)
        print('ok', kind, it['key'])
