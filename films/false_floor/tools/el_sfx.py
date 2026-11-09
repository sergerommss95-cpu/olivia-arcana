#!/usr/bin/env python3
"""Generate the episode's foley stems with ElevenLabs sound generation (key injected by the environment proxy).

python3 tools/el_sfx.py [--only key1,key2] [--force]
Writes films/tumbler/audio/sfx/el__<key>.wav (48 kHz stereo) so the episode mixer finds them, plus a manifest at
films/false_floor/audio/el_manifest.json. Generated audio is not committed (out of the repo's audio folders).
"""
import json, os, subprocess, sys, time, urllib.request

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'sfx')
RAW = os.path.join(os.path.dirname(FF), 'tumbler', 'audio', 'raw')
STYLE = ' Realistic documentary foley, isolated, dry, no music, no voices.'
PROMPTS = {
 'vault_room_tone': (20, 'Quiet underground bank vault room tone, very soft ventilation and distant building resonance in a dry concrete room, no beeps.'),
 'antechamber_fluoro': (15, 'Fluorescent tube lights buzzing softly in an empty concrete basement corridor, low steady electrical hum.'),
 'fluoro_flicker_on': (4, 'Old fluorescent tube lights flickering on in a concrete room: starter clicks, a few ticks, then a steady hum.'),
 'vault_door_unlock': (4, 'Heavy steel bank vault door bolts retracting: deep mechanical clunk, metal sliding, a heavy latch releasing, close.'),
 'vault_door_swing': (6, 'A three-ton steel vault door swinging open slowly on heavy hinges, low metallic groan, in a concrete room.'),
 'vault_door_shut': (4, 'A massive steel vault door closing and sealing with a deep heavy thud and a latch, short natural decay, no boom.'),
 'dial_spin': (3, 'A combination safe dial spinning quickly with fine mechanical ticking clicks, then stopping, close-up.'),
 'dial_click': (1.5, 'A single precise click of a safe combination dial landing on a number, close macro.'),
 'key_turn': (3, 'A long heavy key turning slowly in a large steel lock, internal tumblers grinding and clicking, close.'),
 'plate_slide': (3, 'A thin aluminium plate sliding over steel with a faint scrape, then settling, close.'),
 'tape_strip': (2, 'A strip of adhesive tape pulled off a roll and pressed onto metal, close, quiet room.'),
 'hairspray': (1.5, 'One short burst of an aerosol spray can, quiet room.'),
 'foam_slide': (3, 'A large sheet of polystyrene foam sliding, light squeak and rub, quiet room.'),
 'box_forced_1': (2.5, 'A metal safe deposit box door forced with a hand-cranked tool: ratchet clicks, metal bending, a sharp snap.'),
 'box_forced_2': (2, 'A steel locker door pried open: strained metal creak, then the sharp pop of a lock giving way.'),
 'box_door_open': (1.5, 'A small metal deposit box door swinging open and knocking against its neighbour, metallic clatter.'),
 'grate_buzz': (2.5, 'An electric door lock buzzing, then a steel grate gate unlocking and swinging open in a concrete stairwell.'),
 'woods_night': (20, 'Cold winter woods at night, light wind through bare trees, faint distant motorway traffic hiss, no animals.'),
 'woods_morning': (20, 'Grey winter morning in a forest, soft wind, a few distant crows, damp quiet.'),
 'bags_throw': (4, 'Heavy black plastic garbage bags thrown onto wet leaves, plastic tearing, paper and small objects spilling.'),
 'paper_leaves': (4, 'Damp paper and wet leaves rustling gently on a forest floor, close.'),
 'torch_click': (1, 'A flashlight switch clicking on, close.'),
 'city_dusk': (15, 'Quiet city street at dusk, distant traffic, soft wind between stone buildings, no footsteps.'),
 'office_room': (15, 'Quiet small office in the afternoon, faint clock ticking, distant street through a window.'),
 'drill_approach': (3, 'A metal drill bit spinning up close to a steel surface, then cutting out abruptly to silence.'),
 'slab_slide': (3, 'A heavy concrete slab sliding slowly with low grinding friction, then settling with a soft thud.'),
}


def gen(key, dur, text):
    body = json.dumps({'text': text + STYLE, 'duration_seconds': dur, 'prompt_influence': 0.45}).encode()
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation', data=body, method='POST',
                                 headers={'Content-Type': 'application/json', 'xi-api-key': 'proxy-injected',
                                          'User-Agent': 'false-floor-production/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main():
    os.makedirs(SFX, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    man_p = os.path.join(FF, 'audio', 'el_manifest.json')
    os.makedirs(os.path.dirname(man_p), exist_ok=True)
    man = json.load(open(man_p)) if os.path.exists(man_p) else {}
    for key, (dur, text) in PROMPTS.items():
        if only and key not in only:
            continue
        wav = os.path.join(SFX, f'el__{key}.wav')
        if os.path.exists(wav) and '--force' not in sys.argv:
            continue
        for attempt in range(3):
            try:
                mp3 = gen(key, dur, text)
                break
            except Exception as e:
                print('retry', key, e, flush=True)
                time.sleep(3 * (attempt + 1))
        else:
            print('FAILED', key, flush=True)
            continue
        rawp = os.path.join(RAW, f'el__{key}.mp3')
        open(rawp, 'wb').write(mp3)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', rawp, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s24le', wav], check=True)
        man[key] = {'file': f'el__{key}.wav', 'duration_s': dur, 'prompt': text + STYLE, 'source': 'ElevenLabs sound generation',
                    'account': "Collin's ElevenLabs (Creator)", 'generated': time.strftime('%Y-%m-%d %H:%M')}
        json.dump(man, open(man_p, 'w'), indent=1)
        print('ok', key, f'{len(mp3) / 1e3:.0f} kB', flush=True)


if __name__ == '__main__':
    main()
