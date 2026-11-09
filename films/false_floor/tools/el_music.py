#!/usr/bin/env python3
"""Original score for the episode: one ElevenLabs Music cue per chapter, written to the cut's chapter lengths, sharing
one palette (sub pulse, muted felt-piano four-note motif = the combination, ticking metal, low strings) so the cues read
as one score. Key injected by the environment proxy.

python3 tools/el_music.py [--only COLD,3]   ->  ../tumbler/audio/music/ff_<chapter>.wav  (+ out/music/*.mp3 cache)
Then edit/music_plan.json points each chapter at its ff_ cue (offset 0).
"""
import json, os, subprocess, sys, time, urllib.request

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'music')
CACHE = os.path.join(FF, 'out', 'music')
PALETTE = ('Instrumental underscore for a cinematic true-crime documentary series. Shared palette: deep sub-bass pulse, '
           'a muted felt-piano motif of four notes, ticking metallic percussion like a combination lock, low strings, '
           'restrained modern synth textures. Dark, precise, expensive-sounding, clean mix that leaves space for a '
           'narrator. No vocals, no choir, no risers every bar.')
CUES = {   # chapter key: (seconds, brief)
    'COLD': (64, 'Cold open: eerie and suspended. Starts almost silent with a low drone and distant metallic resonance, '
                 'the four-note piano motif enters at 15 seconds, a slow heartbeat pulse joins at 30 seconds, tension '
                 'tightens and ends on a sudden cut to silence.'),
    '1': (68, 'The fortress: imposing, mechanical, controlled. Clockwork ticking percussion, low string ostinato in D '
              'minor at 90 BPM, metallic plucks, a steady pulse, cold and exact, no big climax.'),
    '2': (96, 'The tenant: sly, patient, investigative. Felt piano motif, pizzicato low strings, soft brushed percussion, '
              'a sense of careful planning over two years, minor key, 85 BPM, intimate.'),
    '3': (230, 'The heist mechanics, four minutes of building momentum: a taut 16th-note synth arpeggio at 96 BPM, '
               'staccato low strings, tight muted drums entering after one minute, each section adds one layer, '
               'controlled mid-level energy under narration, never fully resolves, short breath around 2:40 then it '
               'resumes.'),
    '4': (102, 'Two places cross-cut, the vault and foggy woods at dawn: cold atmospheric pads, distant piano motif, '
               'slow pulse at 70 BPM, airy wind-like textures, melancholic minor key, sparse.'),
    '5': (60, 'The tenant returns and is arrested: slow fateful build, low brass swell, ticking percussion getting '
              'closer, ending in an abrupt stop.'),
    '6': (96, 'Two stories that do not agree: reflective, ambiguous, soft piano and solo cello, unresolved harmony, quiet '
              'uncertainty, 72 BPM, documentary.'),
    '7': (88, 'Closing: the four-note piano motif returns over warm low strings, builds to a restrained, haunting final '
              'swell around 60 seconds, then a long resonant ending that can sit under an end card.'),
}


def compose(prompt, ms):
    body = {'prompt': prompt, 'music_length_ms': ms, 'force_instrumental': True}
    req = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', data=json.dumps(body).encode(),
                                 method='POST', headers={'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected',
                                                         'User-Agent': 'false-floor-production/1.0'})
    with urllib.request.urlopen(req, timeout=900) as r:
        return r.read()


def main():
    only = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else list(CUES)
    os.makedirs(CACHE, exist_ok=True)
    for k in only:
        secs, brief = CUES[k]
        mp3 = os.path.join(CACHE, f'ff_{k}.mp3')
        if not os.path.exists(mp3):
            for attempt in range(3):
                try:
                    t = time.time()
                    open(mp3, 'wb').write(compose(PALETTE + ' ' + brief, secs * 1000))
                    print(f'[music] {k} {secs}s in {time.time() - t:.0f}s', flush=True)
                    break
                except Exception as e:
                    print('retry', k, getattr(e, 'read', lambda: str(e))()[:300], flush=True)
                    time.sleep(8 * (attempt + 1))
            else:
                print('[music] FAILED', k, flush=True)
                continue
        wav = os.path.join(MUSIC, f'ff_{k}.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', wav], check=True)
        print('[music] wrote', wav, flush=True)


if __name__ == '__main__':
    main()
