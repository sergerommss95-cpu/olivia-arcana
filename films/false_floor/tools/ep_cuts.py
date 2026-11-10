"""Episode v3 chapters for seq_edit.py (script/EP_v3_PLAN.md): every cut lands on one of George's words.

(clip id, VO beat, first word of the shot's phrase). '#n' = the n-th occurrence of that word inside the beat.
Clip ids: C/N/S = 3D renders (6-frame handles), A_ = Kling clips (no handles), M_/E_ = motion graphics and evidence
photo moves (12-frame handles, never graded or labelled), P_ = stills (png in out/clips, slow push).
Missing clips render as a slate, so a chapter can be cut and judged before every source exists.
"""

CH = {
    'ch1': dict(title=('CHAPTER ONE', 'THE FORTRESS'), beats=[4, 5, 6, 7], music=('ff_1', 0.0, -17), tail=1.8,
                beds=[('el__city_dusk', 'M_MAP_ANTWERP', 'A_PARCEL', -20), ('el__office_room', 'A_PARCEL', None, -24)],
                cuts=[('M_MAP_ANTWERP', 4, 'If'), ('E_DISTRICT', 4, 'A'), ('E_CENTRAAL', 4, "Antwerp's"),
                      ('M_CAMERAS', 4, 'Steel'), ('A_PARCEL', 5, 'Inside'), ('A_HANDSHAKE', 5, 'and'),
                      ('M_MAZAL', 5, 'one'), ('C1', 5, 'Because'), ('E_ADC', 6, 'At'), ('C2', 6, 'Offices'),
                      ('M_RULE', 6, 'And'), ('C12', 7, 'Which'), ('A_LEASE', 7, 'You')],
                inoff={'C1': 30, 'C12': 20}),
    'ch2': dict(title=('CHAPTER TWO', 'THE TENANT'), beats=[8, 9, 10, 11, 12, 13], music=('ff_2', 0.0, -17), tail=1.8,
                beds=[('el__office_room', 'C13', 'A_VAULT_VISIT', -24), ('el__vault_room_tone', 'A_VAULT_VISIT', 'M_TURIN', -22)],
                cuts=[('C13', 8, 'More'), ('M_NAME_TENANT', 8, 'His'), ('M_MONTHS', 9, 'He'), ('A_RETURN', 9, 'Month'),
                      ('C2', 9, 'And'), ('A_VAULT_VISIT', 10, 'Every'), ('C6', 10, 'The'), ('S01', 10, 'The#2'),
                      ('M_STOPWATCH', 10, 'How'), ('C3', 11, 'According'), ('M_TURIN', 12, 'He'),
                      ('M_CREW', 12, 'The'), ('P_SPEEDY', 13, 'Because')],
                inoff={'C2': 30, 'S01': 120, 'C3': 10}, vhs=['C3']),
    'ch3': dict(title=('CHAPTER THREE', 'LOCK AND KEY'), beats=list(range(14, 30)), music=('ff_3', 0.0, -16), tail=2.0,
                beds=[('el__antechamber_fluoro', 'C4', 'C6', -24), ('el__vault_room_tone', 'C6', 'N1', -23),
                      ('el__vault_room_tone', 'N3', None, -22)],
                cuts=[('C4', 14, "Here's"), ('S01', 14, 'Start'), ('M_LAYERS_A', 14, 'Three'), ('C5', 15, 'Not'),
                      ('S16', 16, 'Then'), ('S17', 17, 'Then'), ('S18', 18, 'Across'), ('M_FIELD', 18, 'Open'),
                      ('C6', 19, 'Inside'), ('M_SENSORS', 19, 'heat'), ('M_17576', 19, 'And'),
                      ('N1', 20, 'At'), ('C12', 20, 'The'), ('C3', 20, 'During'),
                      ('A_VAULT_VISIT', 21, 'So'), ('C7', 21, 'feed'), ('A_SPRAY', 21, 'heat-and-motion'),
                      ('C6', 21, 'One'), ('S22', 22, 'That'),
                      ('N1', 23, 'Saturday'), ('N2', 23, 'The#2'), ('N3', 24, 'Down'), ('S18', 24, 'a'),
                      ('S24', 24, 'holding'), ('N5', 24, 'The'), ('S16', 25, 'Then'), ('S17', 25, 'Then#2'),
                      ('C4', 25, 'And'), ('A_FOAM', 26, 'Inside'), ('C6', 26, 'A'), ('C3', 26, 'And'),
                      ('N8', 27, 'Then'), ('N9', 27, 'They#2'), ('N10', 27, 'One'),
                      ('C9', 28, 'They'), ('C10', 28, 'and'), ('M_LAYERS_B', 28, 'Ten'), ('C8', 29, 'The')],
                inoff={'S01': 96, 'S18': 40, 'S16': 168, 'S24': 16, 'N3': 24, 'N8': 14, 'C3': 30, 'C12': 50},
                speed={'C6': 1.6}),
    'ch4': dict(title=('CHAPTER FOUR', 'TWO PLACES'), beats=list(range(30, 39)), music=('ff_4', 0.0, -16), tail=1.8,
                beds=[('el__woods_night', 'A_E19_NIGHT', 'C8', -20), ('el__vault_room_tone', 'C8', 'E_WOODS', -23),
                      ('el__woods_morning', 'E_WOODS', 'C10', -20), ('el__woods_morning', 'A_BAGS', 'M_DNA', -20)],
                cuts=[('M_BURNLIST', 30, 'According'), ('M_ROUTE_E19', 31, 'Instead'), ('A_E19_NIGHT', 31, 'two'),
                      ('S31', 31, 'And'), ('A_THROW', 31, 'No'), ('A_TEAR', 31, 'torn'),
                      ('C8', 32, 'In'), ('M_GHOSTS', 32, 'To'), ('E_WOODS', 33, 'But'), ('A_VANCAMP', 33, 'And'),
                      ('C10', 34, 'In'), ('A_BAGS', 35, 'In'), ('P_S36', 36, 'Receipts'), ('M_EVIDENCE', 36, 'Paperwork'),
                      ('M_DNA', 37, 'Investigators'), ('P_S35', 37, 'Ten'), ('M_LINK', 38, 'And'), ('C13', 38, 'Who')],
                inoff={'S31': 60, 'C10': 60}),
    'ch5': dict(title=('CHAPTER FIVE', 'THE TENANT RETURNS'), beats=[39, 40, 41, 42], music=('ff_5', 0.0, -16), tail=2.0,
                beds=[('el__city_dusk', 'A_RETURN', 'A_COURT', -21)],
                cuts=[('A_RETURN', 39, 'If'), ('M_DETECTIVES', 39, 'Detectives'), ('A_COURT', 40, 'In'),
                      ('M_SENTENCES', 40, 'Three'), ('A_KING_FOG', 41, 'But'), ('M_NEVER', 41, 'And'),
                      ('M_CASECLOSED', 42, 'Case')],
                inoff={}),
    'ch6': dict(title=('CHAPTER SIX', 'TWO STORIES'), beats=[43, 44, 45, 46, 47, 48], music=('ff_6', 0.0, -16), tail=1.8,
                beds=[('el__office_room', 'A_INTERVIEW', 'M_HISSTORY', -24)],
                cuts=[('M_WIRED', 43, 'In'), ('A_INTERVIEW', 43, 'And'), ('M_HISSTORY', 44, 'He'), ('N3', 44, 'He#3'),
                      ('M_20vs100', 44, 'Twenty'), ('A_INTERVIEW', 45, "It's"), ('M_EVIDENCESTORY', 45, "There's"),
                      ('C3', 45, 'The#2'), ('C9', 45, 'And'), ('M_QUOTE', 46, 'As'), ('M_TWOPATHS', 47, 'So'),
                      ('A_BLUELIGHTS', 48, 'And')],
                inoff={'N3': 10, 'C3': 30}),
    'ch7': dict(title=('CHAPTER SEVEN', 'WHERE ARE THE DIAMONDS?'), beats=[49, 50, 51, 52], music=('ff_7', 0.0, -15), tail=3.2,
                beds=[('el__vault_room_tone', 'C8', 'S01', -23)],
                cuts=[('M_MAP_MILAN', 49, 'Paroled'), ('A_MILAN_STOP', 49, 'In'), ('E_MILAN', 49, 'Belgian'),
                      ('M_MAP_PARIS', 50, 'He'), ('A_CDG', 50, 'And'), ('C8', 51, 'More'), ('E_ADC', 51, 'And'),
                      ('S01', 52, 'Ten'), ('A_SPRAY', 52, 'hair'), ('S22', 52, 'tape'), ('A_FOAM', 52, 'foam'),
                      ('A_VANCAMP', 52, 'undone'), ('P_S36', 52, 'half'), ('M_QUESTION', 52, 'So')],
                inoff={'S01': 120, 'C8': 20}),
}


def kind_of(cid):
    """'3D' (6-frame handles, graded, labelled) | 'AI' (no handles, graded, labelled) |
    'GFX' (12-frame handles, untouched) | 'STILL' (png, slow push, graded, labelled)"""
    if cid.startswith(('M_', 'E_')):
        return 'GFX'
    if cid.startswith('A_'):
        return 'AI'
    if cid.startswith('P_'):
        return 'STILL'
    return '3D'
