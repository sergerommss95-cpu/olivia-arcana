#!/usr/bin/env python3
"""English subtitles for the cut, word-timed from ElevenLabs' character timestamps.

python3 tools/make_srt.py [--vo out/vo/vo_george_v4_v01]   -> out/FALSE_FLOOR_E02.srt
Needs out/timeline.json from episode_edit.py (vo_at / vo_src per shot) and the chapter cache written by
el_vo_chapters.py. Cues: <= 2 lines x 42 chars, break at sentence ends, 1.0–6.0 s on screen.
"""
import base64, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from el_vo_chapters import beat_text, decode, parse, SR, GAP_CHAPTER

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAXL, MAXD, MIND = 42, 6.0, 1.0


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def words_on_vo_clock(vo_base):
    """[(beat, word, t0, t1)] with times on the VO track clock (same clock as the VO json start/end)."""
    beats = parse(os.path.join(FF, 'script', 'EPISODE_02_SCRIPT_v2.md'))
    chapters, MAXC = [], 1800
    for b in beats:
        if (not chapters or chapters[-1][0] != b['chapter'] or
                sum(len(beat_text(x)) + 2 for x in chapters[-1][1]) + len(beat_text(b)) > MAXC):
            chapters.append((b['chapter'], []))
        chapters[-1][1].append(b)
    out, t = [], 0.0
    for ci, (ch, bs) in enumerate(chapters):
        res = json.load(open(os.path.join(vo_base + '_chapters', f'{ci:02d}.json')))
        al = res.get('normalized_alignment') or res['alignment']
        st, en = al['character_start_times_seconds'], al['character_end_times_seconds']
        alen = len(decode(base64.b64decode(res['audio_base64']))) / SR
        if ci:
            t += GAP_CHAPTER if ch != chapters[ci - 1][0] else 0.35
        full, pos = '', 0
        for b in bs:
            tx = beat_text(b)
            if full:
                full += '\n\n'
            s0 = len(full)
            full += tx
            for m in re.finditer(r"[^\s…—]+", tx):
                i0, i1 = min(s0 + m.start(), len(st) - 1), min(s0 + m.end() - 1, len(en) - 1)
                out.append((b['beat'], m.group(0), t + st[i0], t + en[i1]))
        t += alen
    return out


def main():
    vo_base = os.path.join(FF, arg('--vo', 'out/vo/vo_george_v4_v01'))
    import episode_edit     # same timeline the editor builds (no render)
    tl, _ = episode_edit.build_timeline(json.load(open(os.path.join(FF, 'script', 'SHOTS_v2.json')))['shots'],
                                        json.load(open(vo_base + '.json')))
    shot_of = {int(e['id'][1:]): e for e in tl if e['id'][1:].isdigit() and e.get('vo_src')}
    words = []
    for beat, w, a, b in words_on_vo_clock(vo_base):
        e = shot_of.get(beat)
        if not e:
            continue
        s0, s1 = e['vo_src']
        a, b = max(a, s0), min(b, s1)
        words.append((w, e['vo_at'] + a - s0, e['vo_at'] + b - s0, beat))
    cues, cur = [], []

    def flush():
        if cur:
            cues.append([cur[0][1], cur[-1][2], ' '.join(x[0] for x in cur)])
            cur.clear()

    for i, wd in enumerate(words):
        text = ' '.join(x[0] for x in cur + [wd])
        if cur and (len(text) > 2 * MAXL or wd[2] - cur[0][1] > MAXD or wd[3] != cur[-1][3] or wd[1] - cur[-1][2] > 0.9):
            flush()
        cur.append(wd)
        if re.search(r'[.?!]["’”]?$', wd[0]) and (wd[2] - cur[0][1]) >= MIND:
            flush()
    flush()
    for k, c in enumerate(cues):     # minimum duration without overlapping the next cue
        nxt = cues[k + 1][0] if k + 1 < len(cues) else c[1] + 2
        c[1] = min(max(c[1] + 0.25, c[0] + MIND), nxt - 0.04)

    def ts(t):
        ms = int(round(t * 1000))
        return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'

    def wrap(s):
        if len(s) <= MAXL:
            return s
        ws, best = s.split(), None
        for j in range(1, len(ws)):
            a, b = ' '.join(ws[:j]), ' '.join(ws[j:])
            score = max(len(a), len(b))
            if best is None or score < best[0]:
                best = (score, a + '\n' + b)
        return best[1]

    p = os.path.join(FF, 'out', 'FALSE_FLOOR_E02.srt')
    with open(p, 'w') as f:
        for k, (a, b, s) in enumerate(cues, 1):
            f.write(f'{k}\n{ts(a)} --> {ts(b)}\n{wrap(s)}\n\n')
    print(p, len(cues), 'cues')


if __name__ == '__main__':
    main()
