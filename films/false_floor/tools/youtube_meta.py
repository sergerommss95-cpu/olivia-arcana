#!/usr/bin/env python3
"""Write the YouTube package (title, description with chapters from the real edit timeline, sources, credits, tags).

python3 tools/youtube_meta.py   ->  out/YOUTUBE.md   (reads out/timeline.json written by episode_edit.py)
"""
import json, os
FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH_TITLES = {'COLD OPEN': 'The impossible', '1': 'The fortress', '2': 'The tenant', '3': 'Lock and key', '4': 'Two places',
             '5': 'The tenant returns', '6': 'Two stories', '7': 'Where are the diamonds?'}


def mmss(t):
    return f'{int(t // 60)}:{int(t % 60):02d}'


def main():
    js = json.load(open(os.path.join(FF, 'out', 'timeline.json')))
    tl, total = js['timeline'], js['total']
    end = next((e for e in tl if e['id'] == 'END'), None)
    chapters, seen = [], set()
    for e in tl:
        if e['id'] == 'END':
            continue
        key = e['chapter'].split(' ')[0] if e['chapter'][0].isdigit() else 'COLD OPEN'
        if key not in seen:
            seen.add(key)
            chapters.append((0.0 if not chapters else e['t0'], CH_TITLES.get(key, key)))
    chap = '\n'.join(f'{mmss(t)} {name}' for t, name in chapters)
    endnote = (f'End card runs {mmss(end["t0"])}–{mmss(total)} (15 s). In YouTube Studio add: two video elements over the WATCH '
               f'NEXT boxes (right side, top and bottom) and a Subscribe element over the circle (left). Start them at '
               f'{mmss(end["t0"] + 0.5)}.') if end else 'No end card in this cut.'
    md = f"""# YouTube package — FALSE FLOOR · Case No. 02

## Title (pick one)
1. The $100,000,000 Heist Ruined by a Sandwich
2. They Beat 10 Layers of Security. A Sandwich Beat Them.
3. The Vault No One Could Open

## Description
In February 2003, thieves emptied 109 of 189 safe-deposit boxes two floors beneath Antwerp's diamond district —
the biggest diamond heist on record, at least $100 million by police estimate. They beat ten layers of security.
Then the evidence turned up in the woods.

This is the story beneath the heist of the century: the tenant upstairs, the vault, the sandwich, and the two
versions of the truth that still don't agree.

All 3D images are illustrative reconstructions, not footage or photographs of the real vault. Disputed claims are
attributed to the people who made them.

{chap}

Sources
- Joshua Davis, "The Untold Story of the World's Biggest Diamond Heist", WIRED, 12 March 2009
- Columbia Journalism Review on the WIRED account and the investigators' response
- Scott Andrew Selby & Greg Campbell, *Flawless* (2010) (via Salon's review)
- The Guardian, Andrew Osborn, 1 March 2003
- Wikipedia: Antwerp diamond heist (cross-check)

Credits
- Narration: ElevenLabs ("George"), from the False Floor script
- Sound design: ElevenLabs sound effects; Mixkit sound effects (Mixkit Sound Effects Free License)
- Music: original score for False Floor, composed with ElevenLabs Music
- 3D, graphics and edit: built procedurally in Blender + Python for False Floor

#truecrime #heist #documentary

## Thumbnails (out/thumbs/, 1280x720) — A/B test with YouTube "Test & compare"
- T1_vault.jpg — "10 LAYERS. 0 ALARMS." (pairs with title 1 or 3)
- T2_sandwich.jpg — "THE $100M MISTAKE" (pairs with title 2)
- T3_tenant.jpg — "HE RENTED THE OFFICE UPSTAIRS" (pairs with title 3)

## End screen
{endnote}

## Pinned comment
Investigators and Notarbartolo still tell two different stories about that weekend. Which version do you believe — and
which case should we open next?

## Tags
antwerp diamond heist, diamond heist, heist documentary, notarbartolo, antwerp diamond centre, true crime, biggest heist,
vault heist, school of turin, false floor
"""
    out = os.path.join(FF, 'out', 'YOUTUBE.md')
    open(out, 'w').write(md)
    print(out)
    print(chap)


if __name__ == '__main__':
    main()
