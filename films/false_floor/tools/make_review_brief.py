#!/usr/bin/env python3
"""Write the reviewer's brief for the full episode: every shot with its timecode, source, what it should show and the
narration over it; the timestamped script; the fact sheet for on-screen text; the cast sheet; what is intentional.

    python3 tools/make_review_brief.py [--out review/REVIEW_BRIEF_E02_v3.md] [--video out/FALSE_FLOOR_E02_v3_review.mp4]

Reads the same files the assembler joins (out/FALSE_FLOOR_COLD_v2.mp4, out/EP3_ch1..7.mp4 + their _map.json), George's
word timings, and out/qc/chapters_final_qc.txt (tools/chapter_qc.py output) for the jumps already found inside shots.
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_srt import words_on_vo_clock

FF = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(FF, 'out', 'vo', 'vo_george_v4_v01')
FPS = 24
PARTS = [('Cold open', 'out/FALSE_FLOOR_COLD_v3'), ('Chapter 1 · The Fortress', 'out/EP3_ch1'),
         ('Chapter 2 · The Tenant', 'out/EP3_ch2'), ('Chapter 3 · Lock and Key', 'out/EP3_ch3'),
         ('Chapter 4 · Two Places', 'out/EP3_ch4'), ('Chapter 5 · The Tenant Returns', 'out/EP3_ch5'),
         ('Chapter 6 · Two Stories', 'out/EP3_ch6'), ('Chapter 7 · Where Are the Diamonds?', 'out/EP3_ch7')]

# what each clip shows (written from the renders themselves) and anything the reviewer should know about it
D = {
    # --- 3D renders with the cast (cold open) ---
    'C1': ('3D', 'Cold grey morning in the diamond-district street: the camera travels low behind a man in a dark blazer walking toward the entrance; bollards, the lit police kiosk.', ''),
    'C2': ('3D', 'Cross-section of the building: the camera drops from street level through the cut floors to Level −2, where the vault glows orange-red.', ''),
    'C3': ('3D', 'Behind the guard (navy blazer) walking down the stairwell to Level −2; at the bottom the fluorescent tubes stutter on.', ''),
    'C4': ('3D', "Over the guard's shoulder in the antechamber: the 3-ton vault door stands wide open, the lit vault beyond.", ''),
    'C5': ('3D', 'Fast macro push onto the seismic sensor: a small grey unit with a cable, bolted to the door.', ''),
    'C6': ('3D', 'Vault ceiling corner: heat/motion detector, light sensor, CCTV camera; a quick push and pan across them.', ''),
    'C7': ('3D', "The guard's face, close, three-quarter front, slow push in.", ''),
    'C8': ('3D', 'The guard walks slowly into the vault aisle between walls of forced-open boxes, papers on the floor; the camera follows low behind him.', ''),
    'C9': ('3D', 'Floor-level macro dolly past emptied diamond papers, jewellery trays and torn envelopes.', ''),
    'C10': ('3D', 'Top-down slow crane over the sorted piles on the vault floor: paper parcels, boxes, passports, a few jewels.', ''),
    'C11': ('3D', 'Wide from inside the vault looking out: the guard small in the open doorway, a phone to his ear.', ''),
    'C12': ('3D', 'Cross-section in reverse: from the glowing vault the camera rises through the floors to an upper-floor office that lights up.', ''),
    'C13': ('3D', 'The Tenant at his office window, back to camera, slow push in; afternoon sun through the blinds.', ''),
    # --- 3D renders with the cast (the night) ---
    'N1': ('3D', 'The district street at night, wet, sodium light, empty; a fast low push toward the entrance.', ''),
    'N2': ('3D', 'Down the stairwell to Level −2 behind the crew, torch beams ahead.', ''),
    'N3': ('3D', 'Low tracking shot behind the four crew walking through the grate toward the vault door.', 'The Monster wears light grey-beige dungarees over a T-shirt; from behind they can read as bare skin at a glance. Say how it reads.'),
    'N5': ('3D', "Over the Monster's shoulder: the King of Keys (hat, suit) at the vault door, hauling the handle; torch light on the door.", ''),
    'N8': ('3D', 'From inside the dark vault: the door swings open, the crew silhouetted in the doorway, torch beams into the lens.', ''),
    'N9': ('3D', 'The Monster at the wall of boxes, turning a hand-cranked forcing device clamped on one box.', ''),
    'N10': ('3D', 'The camera rushes down the vault aisle as box doors burst open in sequence along both walls; a counter overlay climbs.', ''),
    # --- 3D renders, no people ---
    'S00': ('3D', 'Slow, dark push on the closed vault door; only the three-spoke handle and a thin line of warm light under the door are lit.', 'Very dark on purpose.'),
    'S01': ('3D', 'The 3-ton door standing open: door edge and bolts in the foreground, the lit vault through the opening.', ''),
    'S02': ('3D', 'The camera sinks down the wall of forced boxes to the floor: torn envelopes, an emptied blue velvet pouch, a ring.', ''),
    'S03': ('3D', 'Scale model of the building on black: floors and basement; the vault at Level −2 glows red and a thin red line links an upper office to it.', ''),
    'S10': ('3D', 'Point of view walking down the stairwell in low light toward a steel grate; the grate unlocks and swings open.', 'Dark on purpose.'),
    'S14': ('3D', 'The closed vault door head-on in the concrete antechamber, slow push; keypad box on the wall to its right.', ''),
    'S16': ('3D', 'Macro of the combination wheel (engraved 0–99) and the small viewing lens on top of the dial housing.', ''),
    'S17': ('3D', 'Macro of the long two-part key turning in the lock.', ''),
    'S18': ('3D', 'Macro of the two magnetic plates across the door seam; fine cream field lines are drawn over them.', 'The field lines are an overlay, intended.'),
    'S21': ('3D', 'The wall camera with its red LED; focus racks and pushes to the heat/motion sensor as a hair-spray mist drifts across it; back to the camera.', ''),
    'S22': ('3D', 'Macro of the magnetic plates: screw heads, a strip of tape holding the plates in place.', ''),
    'S24': ('3D', 'An aluminium plate slides over the two magnetic plates; the field lines hold.', 'The field lines are an overlay, intended.'),
    'S25': ('3D', 'On the vault door: the combination dial and the keyhole, then the three-spoke handle turns and the door starts to swing.', 'No hands are shown, by design.'),
    'S26': ('3D', 'The vault at night: a white polystyrene sheet glides in through the doorway and along the box wall, then the camera cranes up to the ceiling light sensor under a strip of black tape.', 'Nobody carries the sheet, by design (the Kling shot A_FOAM shows the carriers). Say whether the floating sheet reads as a mistake.'),
    'S27': ('3D', 'The vault at night: fluorescent tubes strike with a flicker, the crank device on one box turns, then box doors snap open in a wave down the wall.', 'The tube flicker in the first second is intended.'),
    'S31': ('3D', 'Night woods in fog: torn bags and scattered papers on the leaves, a faint glow between the trunks.', ''),
    'S34': ('3D', 'A torch beam sweeps the debris on the vault floor and finds the forced wall.', ''),
    'S52': ('3D', 'From the antechamber: the forced vault seen through the doorway as the heavy door swings shut, ending near-black with a thin line of light.', 'Ends very dark on purpose.'),
    # --- 3D stills with a slow push ---
    'S04': ('3D still', 'The district at dusk from across a wet road: office fronts, a row of steel bollards, the lit police kiosk.', ''),
    'S05': ('3D still', "A dealer's table: an opened diamond paper with loose stones, tweezers, a loupe, a pocket scale.", ''),
    'S08': ('3D still', 'The rented office through its open door: desk, precision scale, phone, lamp, blinds; a brass nameplate on the door.', 'The nameplate engraving is illegible on purpose.'),
    'S11': ('3D still', 'Macro of a canvas shoulder bag: a pinhole lens hidden in the stitching of the leather strap.', ''),
    'S20': ('3D still', 'The closed vault door in the dark antechamber, lit from above; the grate to one side.', ''),
    'S23': ('3D still', 'The district street at night: wet paving, bollards, the lit police kiosk, sodium lamps, nobody about.', ''),
    'S28': ('3D still', 'Low across the vault floor: passports, cards, rings, envelopes, emptied cases; the forced wall behind.', ''),
    'S33': ('3D still', 'Grey morning in the woods: leaf litter, trunks fading into fog.', ''),
    'S35': ('3D still', 'The torn bags in daylight on the leaves, papers and envelopes fanned out.', ''),
    'S38': ('3D still', 'The same office at dusk: blinds glowing blue, one warm desk lamp, the empty chair.', ''),
    'S41': ('3D still', 'The sealed vault before the heist: every box shut, clean floor, the door at the far end.', ''),
    'S45a': ('3D still', 'Looking up at the ceiling: the light sensor under black tape, a lit fluorescent tube beside it.', ''),
    'S45b': ('3D still', 'Top-down on the sorted loot on the lit vault floor: envelopes, passports, ring boxes, pouches.', ''),
    'S51': ('3D still', 'Wide on the forced vault: open boxes on both walls, papers across the floor.', ''),
    'P_S08_PLATE': ('3D still', 'Close crop of the office door: the brass nameplate.', 'Engraving illegible on purpose. A crop, so slightly softer.'),
    'P_S08_DESK': ('3D still', 'Close crop of the office desk: scale, phone, lamp, blinds.', 'A crop, so slightly softer.'),
    'P_S11_LENS': ('3D still', 'Close crop of the bag strap: the pinhole lens in the stitching.', 'A crop, so slightly softer.'),
    'P_S41_BOXES': ('3D still', 'Close crop of the wall of closed safe-deposit boxes.', 'A crop, so slightly softer.'),
    'P_S36': ('3D still', 'Macro on wet leaves: half a salami sandwich, a receipt, a torn envelope, loose stones; a torn bag behind.', ''),
    'P_S36_SANDWICH': ('3D still', 'Tighter crop on the half sandwich in the leaves.', 'A crop, so slightly softer.'),
    'P_KING': ('3D still', 'Portrait of the King of Keys on a dark background: old man, fedora, tan suit, striped tie.', ''),
    'P_SPEEDY': ('3D still', 'Portrait of Speedy on a dark background: striped shirt.', ''),
    'P_CREWDOOR': ('3D still', 'The four crew at the vault door in the antechamber (approved style frame).', 'A 1080p frame pushed in, so slightly softer.'),
    'P_INTERVIEW': ('3D still', 'The older Tenant from behind at the office window.', ''),
    # --- Kling AI clips (image-to-video from our own 3D stills, or text-to-video) ---
    'A_PARCEL': ('AI', 'Hands unfold a paper diamond parcel on a dark desk; a pile of polished stones inside.', "Contains Kling's own cut from the wide view to a close-up."),
    'A_HANDSHAKE': ('AI', 'Two men in suits shake hands over a desk with paper parcels; hands and forearms only.', ''),
    'A_LEASE': ('AI', 'The Tenant leans over his desk and signs a lease.', "Contains Kling's own cut to a close-up of the pen."),
    'A_RETURN': ('AI', 'The Tenant, seen from behind, walks down the wet district street past the police kiosk.', "Contains Kling's own cut from close behind him to a wide view."),
    'A_VAULT_VISIT': ('AI', 'The Tenant at the wall of safe-deposit boxes with a key, glancing around the room.', ''),
    'A_SPEEDY': ('AI', 'Speedy on a dark background: he turns his head, then a close-up of his anxious face.', "Contains Kling's own cut from the wide turn to the close-up."),
    'A_E19_NIGHT': ('AI', 'A car with its tail lights on, driving away down a tree-lined road at dusk.', 'It is a two-lane road, not a motorway (the narration says E19).'),
    'A_THROW': ('AI', 'Night woods, headlights behind: a man hurls a bag into the trees.', ''),
    'A_TEAR': ('AI', 'The bag lands among the trunks and bursts; papers fly and settle.', ''),
    'A_VANCAMP': ('AI', 'August Van Camp, an older man in a cap and dark jacket, walks through foggy woods looking at the ground.', "Contains Kling's own cut to a closer view."),
    'A_BAGS': ('AI', 'Van Camp stands over the torn bags in the leaves and bends down to them.', ''),
    'A_COURT': ('AI', 'An empty wood-panelled courtroom, slow push down the aisle.', ''),
    'A_KING_FOG': ('AI', 'The King of Keys walks away down the foggy night street.', ''),
    'A_INTERVIEW': ('AI', 'The older Tenant from behind at the office window; later in the clip, a voice recorder with a red light on the desk.', "Contains Kling's own cut to the recorder."),
    'A_BLUELIGHTS': ('AI', 'A car on a wet road at night; blue police lights sweep across it.', "Contains Kling's own cut to a closer view."),
    'A_MILAN_STOP': ('AI', 'A torch beam inside a car; a gloved hand finds a pouch of stones between the seats.', ''),
    'A_CDG': ('AI', 'An airport terminal at night: two figures seen from behind walk across the hall; travellers in the distance.', ''),
    'A_SPRAY': ('AI', 'Macro: a round wall sensor; an aerosol mist coats its grille.', "Contains Kling's own cut to a close-up of the grille."),
    'A_FOAM': ('AI', 'Two hooded figures hold white foam sheets in front of them in the vault, torch light glowing through.', "Contains Kling's own cut from in front of them to behind them."),
    # --- code-animated graphics (charcoal, Inter type, amber accent) ---
    'M_MAP_ANTWERP': ('Graphic', 'Map: Europe → Belgium → Antwerp → the diamond district beside the central station, outlined in amber, street labels.', 'Text to check: country/city/street labels; "© OpenStreetMap contributors".'),
    'M_CAMERAS': ('Graphic', 'Street plan of the district: camera icons with amber view cones, bollard rows, a police-post marker.', 'Text: HOVENIERSSTRAAT, RIJFSTRAAT, SCHUPSTRAAT, PELIKAANSTRAAT, CAMERAS, BOLLARDS, POLICE POST.'),
    'M_MAZAL': ('Graphic', 'The word "mazal" set large with an amber underline; small label "the word that closes a deal".', ''),
    'M_RULE': ('Graphic', 'Building section with the text: ONE RULE / NO BOX DOWNSTAIRS / UNLESS YOU\'RE A TENANT UPSTAIRS; an amber link from vault to office.', ''),
    'M_NAME_TENANT': ('Graphic', 'Name card over the Tenant\'s portrait: LEONARDO NOTARBARTOLO / tenant · Antwerp Diamond Centre · from 2000.', 'Carries a DRAMATIZATION tag.'),
    'M_MONTHS': ('Graphic', 'Lease calendar 2000–2002: month cells tick PAID in amber, the year counter rolls.', ''),
    'M_STOPWATCH': ('Graphic', 'A vault-door glyph labelled "the door", then a stopwatch dial and timeline with an amber sweep ("minutes downstairs").', 'No durations are stated, on purpose.'),
    'M_TURIN': ('Graphic', 'Map of north-west Italy: an abstract network of nodes gathers on Turin; pin and label "The School of Turin"; an arc to Antwerp.', ''),
    'M_CREW': ('Graphic', 'Dossier cards with cast portraits: THE GENIUS (alarms), THE MONSTER (locks · wiring · driving), THE KING OF KEYS (an old forger; real name: unknown).', 'Speedy has no card here; he follows as a separate shot.'),
    'M_LAYERS_A': ('Graphic', '"TEN LAYERS" stack with counter 1 / 10; callouts 3 TONS and 12 HOURS.', ''),
    'M_FIELD': ('Graphic', 'Technical drawing of the door seam: two magnetic plates with amber field lines; the door opens, the field snaps, a red signal runs to a box "OUTSIDE SECURITY FIRM"; then a keypad.', ''),
    'M_SENSORS': ('Graphic', 'Tilted plan of the vault room: camera cone, heat + motion cone, light sensor, radar rings, each labelled; "189 safe-deposit boxes".', 'Tagged SCHEMATIC — NOT TO SCALE.'),
    'M_17576': ('Graphic', 'Three letter wheels spin; counter runs to 17,576 (26 × 26 × 26), "combinations", then PER BOX.', ''),
    'M_LAYERS_B': ('Graphic', 'The ten-layer stack is struck through, counter 10 / 10; "beaten by" hair spray, tape, an aluminium plate, a sheet of foam.', ''),
    'M_BURNLIST': ('Graphic', '"THE PLAN: BURN EVERYTHING" with a list ticking on: TAPE, TOOLS, PACKAGING, FOOD; ember glow.', ''),
    'M_ROUTE_E19': ('Graphic', 'Map: an amber route from Antwerp down the E19 toward Brussels, "E19" tag, a marker "woods off the E19".', 'The woods marker is approximate on purpose (the exact place is not documented).'),
    'M_GHOSTS': ('Graphic', 'The four crew dossier cards fade to grey silhouettes stamped UNKNOWN.', ''),
    'M_EVIDENCE': ('Graphic', 'Evidence board: RECEIPTS, ENVELOPES, LOOSE STONES as flat illustrations with tags and amber string.', 'Carries a RECONSTRUCTION tag.'),
    'M_DNA': ('Graphic', 'A sandwich in an evidence bag → swab → DNA strand → stamp CASE FILE.', 'No percentages, on purpose.'),
    'M_LINK': ('Graphic', 'Five evidence icons with amber links converging on a building icon "Antwerp Diamond Centre / office"; ONE TENANT.', ''),
    'M_DATE_21FEB': ('Graphic', 'Date card: FRIDAY · 21 FEBRUARY 2003 / FIVE DAYS AFTER THE HEIST, with a week strip 15–21.', ''),
    'M_DETECTIVES': ('Graphic', 'Two name cards, no faces: AGIM DE BRUYCKER, PATRICK PEYS / DIAMOND SQUAD · ANTWERP POLICE.', ''),
    'M_SENTENCES': ('Graphic', '"2005 · APPEALS COURT, ANTWERP": the Tenant\'s card 10 YEARS; Speedy, the Monster, the Genius 5 YEARS each; the fifth card stays a blank silhouette.', ''),
    'M_NEVER': ('Graphic', 'KING OF KEYS — NEVER IDENTIFIED / THE DIAMONDS (almost all of them) — NEVER FOUND, in red.', ''),
    'M_CASECLOSED': ('Graphic', 'A CASE CLOSED stamp; "SIX YEARS LATER"; the year rolls 2003 → 2009.', ''),
    'M_WIRED': ('Graphic', 'Typographic citation: 2009 / Notarbartolo talks to the journalist Joshua Davis, for Wired.', 'No magazine logo, on purpose.'),
    'M_HISSTORY': ('Graphic', 'Split frame, left panel HIS STORY: "he wasn\'t the mastermind"; "a diamond dealer hired the crew to stage a robbery for the insurance". Right panel THE EVIDENCE waits, dim.', 'Rows 3 and 4 stay empty on purpose.'),
    'M_20vs100': ('Graphic', 'Two bars to scale: "20 MILLION" and "NOT 100"; small footnote with the source figures.', ''),
    'M_EVIDENCESTORY': ('Graphic', 'The split frame again: his claims dimmed; ONE PROBLEM; the right panel THE EVIDENCE lights up.', ''),
    'M_QUOTE': ('Graphic', 'Quote card: AGIM DE BRUYCKER · lead detective — "Not one detail of Leo\'s story can be confirmed by the facts in the investigation."', ''),
    'M_TWOPATHS': ('Graphic', 'A fork: SO WHY TELL IT? → IF IT\'S TRUE: the real crime happened inside the building → HE\'S THE FALL GUY; IF IT ISN\'T → A VERY CONVENIENT STORY for the one man who knows where the rest went.', 'Shown in two parts with a 3D shot between them.'),
    'M_MAP_MILAN': ('Graphic', 'Map: "Paroled · 2009" over Antwerp; an amber arc to Milan; pin and "2010".', ''),
    'M_MAP_PARIS': ('Graphic', 'Map: "Parole broken / European arrest warrant"; a dashed leg arrives at Paris; pin and "2013".', ''),
    'M_QUESTION': ('Graphic', 'End question: SO WHAT DO YOU THINK? / THE MASTERMIND or THE FALL GUY? / small "Tell us in the comments".', ''),
    # --- real photographs (Wikimedia Commons), graded, 2.5D push, credit bottom-left ---
    'E_DISTRICT': ('Photo', 'The district entrance: bollards across the street and a "Politie" booth. Credit: Thorsten1997, public domain.', 'One tiny distant pedestrian.'),
    'E_CENTRAAL': ('Photo', 'The great hall of Antwerp Central station, empty. Credit: T meltzer, CC BY-SA 4.0.', 'Two tiny seated figures were blurred.'),
    'E_ADC': ('Photo', 'Brick office fronts on Schupstraat with CCTV cameras and the street sign. Credit: Silver Dovelet, CC BY-SA 4.0.', 'Real Schupstraat, but not confirmed to be the Diamond Centre building; no caption names it.'),
    'E_WOODS': ('Photo', 'Beech trunks and leaf litter in a Belgian forest. Credit: Horst J. Meuter, CC BY-SA 4.0.', 'The Sonian Forest, used as generic woodland; not the real site.'),
    'E_MILAN': ('Photo', 'Milano Centrale station at night: the train sheds and tracks. Credit: Pjhooker, CC BY-SA 3.0.', ''),
}

# what each jump found by the automatic check is (looked at frame by frame)
WHY = {
    'C6': 'a fast pan across the ceiling corner',
    'C12': 'floor slabs wiping past the lens as the camera rises',
    'N1': 'a bollard passing close to the lens',
    'S26': 'the sheet crossing the light from the doorway',
    'S27': 'the fluorescent tubes striking (intended)',
    'A_TEAR': 'the bag flying through the frame',
    'A_COURT': 'a faint shimmer in the AI clip; check whether it is visible',
}

CAST = [
    ('The Tenant (Leonardo Notarbartolo)', 'about 50, olive skin, short grey-brown hair; dark suit, white shirt, striped tie. In 2009 scenes he is older and greyer and is only seen from behind.'),
    ('The Genius', 'about 45, tall and slim, light skin, short dark hair; dark casual suit, gloves.'),
    ('The Monster', 'about 40, very big and muscular, ruddy skin; beanie, light grey-beige work dungarees over a T-shirt.'),
    ('Speedy', 'about 55, shorter, olive skin, short greying hair; dark shirt with light and red stripes.'),
    ('The King of Keys', 'about 72, small and pale; fedora, tan-brown suit, striped tie.'),
    ('The guard', 'about 48, light skin, grey hair; navy uniform blazer and tie.'),
    ('August Van Camp', 'about 68, ruddy; cap or hat, dark green-grey jacket, a walking stick.'),
]

FACTS = [
    'The heist: the weekend of 15–16 February 2003, Antwerp Diamond Centre. Found on Monday 17 February 2003.',
    'The vault is two floors below ground ("Level −2").',
    '189 safe-deposit boxes; 109 were forced.',
    'Each box: a key lock plus a three-letter combination = 17,576 possibilities (26 × 26 × 26).',
    'The door: 3 tons of steel, rated for 12 hours of drilling; combination wheel 0–99, four numbers; a key about a foot long.',
    'Loss: at least $100 million (an estimate). He claims about €18–20 million.',
    'The tenant: Leonardo Notarbartolo. The crew: the Genius, the Monster, the King of Keys (never identified), Speedy. "The School of Turin".',
    'The landowner: August Van Camp. The detectives: Agim De Bruycker and Patrick Peys, diamond squad.',
    'Arrest: Friday 21 February 2003, five days after the heist.',
    'Sentences: 2005, Antwerp court of appeal: Notarbartolo 10 years; three others 5 years each.',
    '2009: paroled; interview with Joshua Davis for Wired. 2010: stopped in Milan with about a kilogram of diamonds. 2013: arrested in Paris on a layover.',
    'The quote: "Not one detail of Leo\'s story can be confirmed by the facts in the investigation." (Agim De Bruycker)',
    'Road: the E19 between Antwerp and Brussels.',
]


def arg(n, d=None):
    return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d


def nframes(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries',
                        'stream=nb_read_packets', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip()
    return int(r)


def tc(frame):
    s = frame / FPS
    return f'{int(s // 60):02d}:{s % 60:05.2f}'


def main():
    os.chdir(FF)
    out = arg('--out', 'review/REVIEW_BRIEF_E02_v3.md')
    video = arg('--video', 'out/FALSE_FLOOR_E02_v3_review.mp4')
    words = words_on_vo_clock(VO)
    shots, beats, parts, f0 = [], [], [], 0
    for title, stem in PARTS:
        mp = json.load(open(stem + '_map.json'))
        n = nframes(stem + '.mp4')
        parts.append((title, f0, n))
        # narration on this part's clock
        placed = []                                   # (part seconds, beat, word)
        for a, b, at in mp['pieces']:
            for bt, w, wa, we in words:
                if a - 0.01 <= wa < b:
                    placed.append((at + (wa - a), at + (we - a), bt, w))
        for bt in sorted({p[2] for p in placed}):
            ws = [p for p in placed if p[2] == bt]
            beats.append((bt, f0 + int(round(ws[0][0] * FPS)), f0 + int(round(ws[-1][1] * FPS)), ' '.join(p[3] for p in ws), title))
        c = 0
        for k, (sid, t0, d) in enumerate(mp['cuts']):
            nf = int(round(d * FPS))
            base, _, off = sid.partition('@')
            said = ' '.join(p[3] for p in placed if t0 + 0.06 <= p[0] < t0 + d + 0.06)
            shots.append(dict(part=title, sid=sid, base=base, off=off, f0=f0 + c, f1=f0 + c + nf - 1, nf=nf, said=said,
                              pframe=c, first=(k == 0)))
            c += nf
        f0 += n
    end0 = f0
    total = nframes(video) if os.path.exists(video) else end0 + 15 * FPS
    missing = sorted({s['base'] for s in shots} - set(D))
    if missing:
        raise SystemExit(f'no description for: {missing}')
    # jumps already found inside shots by tools/chapter_qc.py
    known = []
    qc = os.path.join(FF, 'out', 'qc', 'chapters_final_qc.txt')
    if os.path.exists(qc):
        for ln in open(qc):
            m = re.match(r'(\S+): \d+ frames', ln)
            if not m:
                continue
            stem = 'out/' + m.group(1)
            part = next((p for p in PARTS if p[1] == stem), None)
            if not part:
                continue
            pf0 = next(p[1] for p in parts if p[0] == part[0])
            fr = sorted({int(x) for seg in re.findall(r'(?:spikes off-cut|exposure jumps off-cut) \d+ \[(.*?)\]', ln)
                         for x in re.findall(r'\((\d+),', seg)})
            ev = []
            for x in fr:                              # consecutive frames = one event
                if ev and x - ev[-1][1] <= 3:
                    ev[-1][1] = x
                else:
                    ev.append([x, x])
            for a, b in ev:
                s = next((s for s in shots if s['part'] == part[0] and s['pframe'] <= a < s['pframe'] + s['nf']), None)
                if s:
                    known.append((pf0 + a, pf0 + b, s))
    kinds = {}
    for s in shots:
        k = D[s['base']][0]
        kinds.setdefault(k, [0, 0])
        kinds[k][0] += 1
        kinds[k][1] += s['nf']
    uses = {}
    for s in shots:
        uses.setdefault(s['base'], []).append(s)

    L = []
    w = L.append
    w('# FALSE FLOOR · Case No. 02 — review brief for the full episode (v3)')
    w('')
    w('You are reviewing a finished cut of a YouTube documentary episode before it is published. Watch the attached '
      'video and find everything that is wrong or looks bad: broken renders, animation mistakes, AI artefacts, wrong or '
      'unreadable text, cuts that miss the narration, picture that does not match what is being said, sound problems. '
      'This brief tells you what every shot is supposed to show, so you can tell a mistake from a choice.')
    w('')
    w('## 1. The video')
    w('')
    w(f'- File: `{os.path.basename(video)}`. 1920×1080, 24 fps, {tc(total)} long ({total} frames). Sound: stereo, −14 LUFS.')
    w('- This is a review encode (about 4 Mbps). Slight softness or banding in very dark areas may come from the encode; '
      'report it, and mark it "possibly encode".')
    w('- Subject: the 2003 Antwerp diamond heist. English narration (one male voice), score, sound effects. No on-camera interviews.')
    w('- It is mixed media: 3D renders with an original stylised cast, 3D stills with slow camera pushes, Kling AI clips, '
      'code-animated graphics and a few real photographs.')
    w('- Timecodes in this brief are `MM:SS.ss` from the first frame of the file. Frame numbers start at 0 (frame = seconds × 24).')
    w('')
    w('## 2. How to review')
    w('')
    w('1. Go through the shot list in section 7 in order. Most shots are 1–4 seconds long, so look at more than one frame per '
      'second: for every shot check at least its first, middle and last frame, and step through character shots more finely.')
    w('2. Compare each shot with its "should show" text and with the narration spoken over it.')
    w('3. Read every word of on-screen text and check it against the fact sheet (section 5) and the narration.')
    w('4. Listen to the whole track once for sound problems.')
    w('5. Report only what you actually see or hear at a timecode. If you are unsure, say so in the Confidence column; do not guess.')
    w('')
    w('### What to look for')
    w('')
    w('- **3D renders and stills (RENDER, ANIM):** limbs, hands or fingers bending wrongly; feet sliding or floating; bodies '
      'passing through clothes, props, doors or walls; clothing that pops or swims; faces that look broken or frozen; props not '
      'held properly; objects appearing or vanishing; flicker, noise or fireflies; texture crawl; a light that jumps; motion '
      'that stutters, freezes or pops for one frame; a frozen last frame at the end of a shot.')
    w('- **Kling AI clips (AI):** hands with wrong finger counts; faces or objects that morph; text-like gibberish; things '
      'melting into each other; physics that looks wrong; a character whose face or clothes differ from the cast sheet; '
      'identifiable real people.')
    w('- **Graphics (GFX, FACT):** spelling; wrong names, dates or numbers; text too small, cut off, overlapping or off-screen; '
      'an element that appears after the narration has moved on; animation that stops dead before the cut.')
    w('- **Photos (PHOTO):** any identifiable face; a missing or unreadable credit line; warping from the parallax effect '
      '(bent straight lines, smeared edges).')
    w('- **Edit (EDIT):** a cut that lands noticeably early or late against the word it belongs to; picture that contradicts the '
      'narration; a shot held too long or flashed too briefly to read; the same shot repeated too often (section 8 lists the repeats); '
      'a jarring jump between two shots.')
    w('- **Grade and labels (GRADE, LABEL):** a shot much darker or brighter than its neighbours; a colour cast; labels '
      'missing, doubled, or covering something important.')
    w('- **Sound (AUDIO):** dropouts, clicks, clipped or distorted speech; music or effects drowning the voice; an effect out of '
      'sync with the action; an abrupt music start or stop; narration that does not match the script in section 6.')
    w('')
    w('### Severity')
    w('')
    w('| Level | Meaning |')
    w('|---|---|')
    w('| S1 Blocker | Must be fixed before publishing: a wrong fact or name, a real person\'s face, a broken frame, a sound dropout, picture that contradicts the narration. |')
    w('| S2 Major | An ordinary viewer would notice it at normal speed. |')
    w('| S3 Minor | Visible on pause or to a trained eye. |')
    w('| S4 Note | Taste or a suggestion. |')
    w('')
    w('### Report format')
    w('')
    w('One table, in time order, then a short summary.')
    w('')
    w('| # | Timecode | Shot ID | Severity | Category | What is wrong | Confidence (high / medium / low) | Suggested fix |')
    w('|---|---|---|---|---|---|---|---|')
    w('| 1 | 03:27.50 | S25 | S2 | RENDER | (example) the door handle passes through the frame for 3 frames | high | re-render frames 80–83 |')
    w('')
    w('Then: the ten fixes that matter most; a score from 1 to 10 for each chapter (picture, edit, sound); and one paragraph '
      'on whether the episode is ready to publish.')
    w('')
    w('## 3. On screen throughout (intended)')
    w('')
    w('- Every 3D and AI shot carries two small labels: bottom-left `ILLUSTRATIVE RECONSTRUCTION`, bottom-right `FALSE FLOOR · CASE No. 02`.')
    w('- Graphics carry no such labels; some have their own corner tag (DRAMATIZATION, RECONSTRUCTION, SCHEMATIC).')
    w('- Real photographs carry a credit line bottom-left ("Photo: author, licence via Wikimedia Commons").')
    w('- Each chapter opens with a chapter card top-left (small label, title, amber line) for about 3.5 seconds over its first shot.')
    w('- The cold open has a date card (MONDAY 17 FEBRUARY 2003 / ANTWERP · DIAMOND DISTRICT), a "109" counter and the title.')
    w('- There are no burned-in subtitles.')
    w('- No real person\'s face may appear anywhere. The cast are original characters.')
    w('')
    w('### Intentional: do not report these')
    w('')
    w('- The stutter of the fluorescent tubes as they switch on (C3, S27).')
    w('- The hidden-camera look (scan lines, REC, timecode) on shot C3 in Chapter 2.')
    w('- Very dark shots S00, S10 and the end of S52.')
    w('- Cream field lines drawn over the magnetic plates (S18, S24).')
    w('- No hands in the lock macros (S16, S17, S25); no one carrying the foam sheet in S26.')
    w('- The illegible engraving on the brass nameplate.')
    w('- The cuts inside Kling clips that are listed in section 7 as "Kling\'s own cut".')
    w('- The end card\'s empty SUBSCRIBE circle and two empty WATCH NEXT frames (YouTube places its own elements there).')
    w('')
    w('### Known compromises: tell us how bad they read')
    w('')
    w('- **A_E19_NIGHT** shows a tree-lined two-lane road, while the narration says "E nineteen" (a motorway).')
    w('- **C1** (a man in a dark blazer walking into the district) was made for the cold open with the guard; it is reused in '
      'Chapters 1 and 5, where the narration is about dealers and the Tenant.')
    w('- **N3**: the Monster\'s pale dungarees can read as bare skin from behind.')
    w('- **S26**: the foam sheet moves with nobody carrying it.')
    w('- **Crops** (P_S08_PLATE, P_S08_DESK, P_S11_LENS, P_S41_BOXES, P_S36_SANDWICH, P_CREWDOOR) are enlargements and may look soft.')
    w('- **The end card** was made at 960×540 and scaled up; it may look soft.')
    w('- **Two type families:** the date card, chapter cards, corner labels and end card use a condensed typeface; the '
      'graphics use Inter. Say whether the mix is noticeable.')
    w('- **Real photographs** are only about 2% of the running time; say where a real photo would serve better than a reconstruction.')
    w('- Some clips are reused several times (section 8).')
    w('')
    w('## 4. Cast sheet (original characters)')
    w('')
    w('| Character | Look |')
    w('|---|---|')
    for n, d in CAST:
        w(f'| {n} | {d} |')
    w('')
    w('A character should look the same in every shot, including the Kling clips. Report any shot where one does not. '
      'A reference image of the crew is attached if provided (`D_cast_lineup.jpg`).')
    w('')
    w('## 5. Fact sheet for on-screen text')
    w('')
    for f in FACTS:
        w(f'- {f}')
    w('')
    w('## 6. Structure and narration with timecodes')
    w('')
    w('| Part | Starts | Ends | Length | Shots |')
    w('|---|---|---|---|---|')
    for title, pf0, n in parts:
        w(f'| {title} | {tc(pf0)} | {tc(pf0 + n)} | {n / FPS:.1f} s | {sum(1 for s in shots if s["part"] == title)} |')
    w(f'| End card | {tc(end0)} | {tc(total)} | {(total - end0) / FPS:.1f} s | 1 |')
    w('')
    w('The narration, beat by beat. The time is when the first word starts and when the last word ends.')
    w('')
    cur = None
    for bt, a, b, txt, title in beats:
        if title != cur:
            w(f'**{title}**')
            w('')
            cur = title
        w(f'- `{tc(a)}–{tc(b)}` (beat S{bt:02d}) {txt}')
    w('')
    w('## 7. Shot list')
    w('')
    w(f'{len(shots)} shots plus the end card. "Says" is the narration heard during the shot (cuts land about 0.1 s before a word). '
      '"@n" after a shot ID means the same clip is used again from frame n.')
    w('')
    num = 0
    cur = None
    for s in shots:
        if s['part'] != cur:
            cur = s['part']
            w(f'### {cur}')
            w('')
            w('| # | In | Out | Sec | Frames | Shot ID | Source | Should show | Says | Notes |')
            w('|---|---|---|---|---|---|---|---|---|---|')
        num += 1
        kind, desc, note = D[s['base']]
        notes = [note] if note else []
        if s['first'] and cur != 'Cold open':
            notes.append('Chapter card over the first 3.5 s.')
        if s['base'] == 'C3' and 'Chapter 2' in cur:
            notes.append('Hidden-camera look (scan lines, REC), intended.')
        if s['base'] == 'S26':
            notes.append('Darkened in the grade to read as night.')
        said = s['said'].replace('|', '/')
        w(f"| {num} | {tc(s['f0'])} | {tc(s['f1'] + 1)} | {s['nf'] / FPS:.1f} | {s['f0']}–{s['f1']} | {s['sid']} | {kind} | "
          f"{desc} | {said or '(no narration)'} | {' '.join(notes)} |")
        if s is shots[-1] or shots[shots.index(s) + 1]['part'] != cur:
            w('')
    w('### End card')
    w('')
    w('| # | In | Out | Sec | Frames | Shot ID | Source | Should show | Says | Notes |')
    w('|---|---|---|---|---|---|---|---|---|---|')
    w(f'| {num + 1} | {tc(end0)} | {tc(total)} | {(total - end0) / FPS:.1f} | {end0}–{total - 1} | END | Graphic | '
      'Channel end card: logo, FALSE FLOOR · THE STORY BENEATH; NEXT CASE / CASE No. 03 · COMING SOON; an empty SUBSCRIBE '
      'circle; two empty WATCH NEXT frames. | '
      '(no narration; the score continues and fades) | Made at 960×540 and scaled up. |')
    w('')
    w('## 8. Reused clips')
    w('')
    w('The same clip appears more than once at these timecodes. Judge whether any repeat is noticeable or tiring.')
    w('')
    w('| Clip | Times used | Where |')
    w('|---|---|---|')
    for base in sorted(uses, key=lambda b: -len(uses[b])):
        if len(uses[base]) > 1:
            w(f"| {base} | {len(uses[base])} | {', '.join(tc(s['f0']) for s in uses[base])} |")
    w('')
    w('## 9. Jumps already found inside shots')
    w('')
    w('An automatic check found these sudden picture changes that are not on an edit point. We believe each is either '
      'Kling\'s own cut inside its clip, an intended effect, or a graphic animating. Confirm each one, and report any that '
      'looks like a glitch instead.')
    w('')
    w('| Timecode | Frames | Shot ID | What we believe it is |')
    w('|---|---|---|---|')
    for a, b, s in known:
        kind, desc, note = D[s['base']]
        why = WHY.get(s['base']) or ("Kling's own cut inside the clip" if kind == 'AI' else
                                     'the graphic animating (a card, wipe or counter)' if kind == 'Graphic' else
                                     'fast camera or subject motion; please check')
        w(f"| {tc(a)} | {a}–{b} | {s['sid']} | {why} |")
    w('')
    w('## 10. Shot counts by source')
    w('')
    w('| Source | Shots | Seconds | Share |')
    w('|---|---|---|---|')
    tot = sum(v[1] for v in kinds.values())
    names = {'3D': '3D renders', '3D still': '3D stills and crops with a slow push', 'AI': 'Kling AI clips',
             'Graphic': 'Code-animated graphics', 'Photo': 'Real photographs (credited)'}
    for k in ('3D', 'Graphic', '3D still', 'AI', 'Photo'):
        if k in kinds:
            w(f'| {names[k]} | {kinds[k][0]} | {kinds[k][1] / FPS:.1f} | {100 * kinds[k][1] / tot:.0f}% |')
    w('')
    os.makedirs(os.path.dirname(os.path.join(FF, out)), exist_ok=True)
    open(os.path.join(FF, out), 'w').write('\n'.join(L) + '\n')
    print(f'wrote {out}: {len(shots)} shots, {len(beats)} beats, {len(known)} known jumps, {len(L)} lines, '
          f'{sum(len(x) for x in L) // 1000} kB; video {total} frames')


if __name__ == '__main__':
    main()
