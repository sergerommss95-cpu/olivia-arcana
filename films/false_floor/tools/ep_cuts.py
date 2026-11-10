"""Episode v3 chapters for seq_edit.py (script/EP_v3_PLAN.md): every cut lands on one of George's words.

(clip id, VO beat, first word of the shot's phrase). '#n' = the n-th occurrence of that word inside the beat.
Clip ids: C/N/S = 3D renders (6-frame handles), A_ = Kling clips (no handles), M_/E_ = motion graphics and evidence
photo moves (12-frame handles, never graded or labelled), P_ = stills (png in out/clips, slow push).
Missing clips render as a slate, so a chapter can be cut and judged before every source exists.
"""

CH = {
    'ch1': dict(floor=('el__city_dusk', -30), title=('CHAPTER ONE', 'THE FORTRESS'), beats=[4, 5, 6, 7], music=('ff_1', 0.0, -17), tail=1.8,
                beds=[('el__city_dusk', 'M_MAP_ANTWERP', 'A_PARCEL', -20), ('el__office_room', 'A_PARCEL', 'E_ADC', -24),
                      ('el__vault_room_tone', 'C2', 'M_RULE', -23)],
                cuts=[('M_MAP_ANTWERP', 4, 'If'), ('E_DISTRICT', 4, 'A'), ('E_CENTRAAL', 4, "Antwerp's"),
                      ('S04', 4, 'Steel'), ('M_CAMERAS', 4, 'Cameras'),
                      ('A_PARCEL', 5, 'Inside'), ('A_HANDSHAKE', 5, 'and'), ('M_MAZAL', 5, 'one'), ('C1', 5, 'Because'),
                      ('S20', 5, 'security'), ('A_HANDSHAKE@48', 5, "It's"),
                      ('E_ADC', 6, 'At'), ('S03', 6, 'Offices'), ('C2', 6, 'the#3'), ('S41', 6, 'they'), ('M_RULE', 6, 'And'),
                      ('C12', 7, 'Which'), ('A_LEASE@30', 7, 'You')],
                inoff={'C1': 30, 'C12': 2, 'S03': 40}),
    'ch2': dict(floor=('el__office_room', -30), title=('CHAPTER TWO', 'THE TENANT'), beats=[8, 9, 10, 11, 12, 13], music=('ff_2', 0.0, -17), tail=1.8,
                beds=[('el__office_room', 'C13', 'S41', -24), ('el__vault_room_tone', 'S41', 'M_STOPWATCH', -22)],
                cuts=[('C13', 8, 'More'), ('S08', 8, 'an'), ('P_S08_PLATE', 8, 'Brass'), ('P_S08_DESK', 8, 'A'),
                      ('S05', 8, 'Small'), ('M_NAME_TENANT', 8, 'His'),
                      ('M_MONTHS', 9, 'He'), ('A_RETURN', 9, 'Month'), ('S41', 9, 'And'), ('A_VAULT_VISIT', 9, 'his#2'),
                      ('S10@150', 10, 'Every'), ('A_VAULT_VISIT@60', 10, 'And'), ('S21', 10, "he's"), ('M_STOPWATCH', 10, 'The#2'),
                      ('S11', 11, 'According'), ('C3', 11, 'he'), ('P_S11_LENS', 11, 'inside'),
                      ('N3', 12, 'He'), ('M_TURIN', 12, 'Police'), ('P_CREWDOOR', 12, 'men'), ('M_CREW', 12, 'The'),
                      ('A_SPEEDY', 12, 'And'), ('P_SPEEDY', 12, 'Keep'), ('S00', 13, 'Because')],
                inoff={'N3': 10, 'S00': 20}, vhs=['C3']),
    'ch3': dict(floor=('el__vault_room_tone', -27), title=('CHAPTER THREE', 'LOCK AND KEY'), beats=list(range(14, 30)), music=('ff_3', 0.0, -16), tail=2.0,
                beds=[('el__vault_room_tone', 'S41', 'N1', -23), ('el__vault_room_tone', 'N2', None, -22)],
                cuts=[('S41', 14, "Here's"), ('S14', 14, 'Start'), ('M_LAYERS_A', 14, 'Three'),
                      ('S14@50', 15, 'Not'), ('C5', 15, 'a'), ('S20', 15, 'that#2'),
                      ('S16', 16, 'Then'), ('S25', 16, 'four'), ('S16@100', 16, 'and'), ('S25@40', 16, 'so'),
                      ('S17', 17, 'Then'), ('P_KING', 17, 'built'), ('S25@120', 17, 'You'),
                      ('S18', 18, 'Across'), ('M_FIELD', 18, 'Open'), ('S10@120', 18, 'To'),
                      ('M_SENSORS', 19, 'Inside'), ('C6', 19, 'radar'), ('S21', 19, 'feeding'), ('S41@1', 19, 'And'),
                      ('P_S41_BOXES', 19, 'each'), ('M_17576', 19, 'Seventeen'),
                      ('N1', 20, 'At'), ('S03@60', 20, 'The'), ('S10@1', 20, 'During'),
                      ('A_VAULT_VISIT', 21, 'So'), ('S21@1', 21, 'with'), ('A_SPRAY', 21, 'the#5'), ('C7', 21, 'One'),
                      ('S21@110', 21, 'and'), ('S21@190', 21, 'Nobody'),
                      ('S22', 22, 'That'), ('S18@100', 22, 'The'),
                      ('S23', 23, 'Saturday'), ('N2', 23, 'The#2'),
                      ('N3', 24, 'Down'), ('S18@40', 24, 'a'), ('S24', 24, 'holding'), ('N5', 24, 'The'),
                      ('S16@168', 25, 'Then'), ('S17@24', 25, 'Then#2'), ('S01@120', 25, 'And'), ('S16@40', 25, 'How'),
                      ('P_S11_LENS', 25, 'came'), ('S51', 25, 'Investigators'),
                      ('S26', 26, 'Inside'), ('A_FOAM', 26, 'hides'), ('S26@125', 26, 'A'), ('S27', 26, 'And'),
                      ('N8', 27, 'Then'), ('N9', 27, 'They#2'), ('N10', 27, 'One'),
                      ('S45b', 28, 'They'), ('C9', 28, 'diamonds'), ('C10', 28, 'securities'), ('M_LAYERS_B', 28, 'Ten'),
                      ('C8', 29, 'The'), ('S02@60', 29, 'All'), ('C10@100', 29, 'get')],
                inoff={'S18': 40, 'S24': 16, 'N3': 24, 'S10': 1, 'S26': 1, 'S27': 1, 'S22': 1, 'S16': 1, 'S25': 1},
                dim={'S26': 0.62}),
    'ch4': dict(floor=('el__vault_room_tone', -32), title=('CHAPTER FOUR', 'TWO PLACES'), beats=list(range(30, 39)), music=('ff_4', 0.0, -16), tail=1.8,
                beds=[('el__woods_night', 'A_E19_NIGHT', 'C8', -20), ('el__vault_room_tone', 'C8', 'E_WOODS', -23),
                      ('el__woods_morning', 'E_WOODS', 'S34', -20), ('el__vault_room_tone', 'S34', 'A_BAGS', -23),
                      ('el__woods_morning', 'A_BAGS', 'S08', -20)],
                cuts=[('C13', 30, 'According'), ('M_BURNLIST', 30, 'the'),
                      ('M_ROUTE_E19', 31, 'Instead'), ('A_E19_NIGHT', 31, 'two'), ('A_SPEEDY@53', 31, 'And'),
                      ('A_E19_NIGHT@46', 31, 'No'), ('A_THROW', 31, 'The'), ('A_TEAR', 31, 'torn'), ('S31@150', 31, 'scattered'),
                      ('C8', 32, 'In'), ('M_GHOSTS', 32, 'To'),
                      ('E_WOODS', 33, 'But'), ('A_VANCAMP', 33, 'And'), ('S33', 33, 'looking'),
                      ('S34', 34, 'In'), ('A_BAGS', 35, 'In'), ('S35', 35, 'litter'),
                      ('M_EVIDENCE', 36, 'Receipts'), ('S08', 36, 'Paperwork'), ('P_S36', 36, 'And'),
                      ('M_DNA', 37, 'Investigators'), ('S27@60', 37, 'Ten'), ('P_S36_SANDWICH', 37, 'and#2'),
                      ('M_LINK', 38, 'And'), ('S38', 38, 'Who')],
                inoff={'C13': 0}, dim={'S34': 0.72}),
    'ch5': dict(floor=('el__city_dusk', -32), title=('CHAPTER FIVE', 'THE TENANT RETURNS'), beats=[39, 40, 41, 42], music=('ff_5', 0.0, -16), tail=2.0,
                beds=[('el__city_dusk', 'C1', 'M_DETECTIVES', -21)],
                cuts=[('C1', 39, 'If'), ('E_CENTRAAL@30', 39, 'you'), ('M_DATE_21FEB', 39, 'So'), ('A_RETURN', 39, 'Leonardo'),
                      ('M_DETECTIVES', 39, 'Detectives'),
                      ('A_COURT', 40, 'In'), ('M_SENTENCES', 40, 'sentences'), ('A_COURT@72', 40, 'get'),
                      ('A_KING_FOG', 41, 'But'), ('N5', 41, 'Police'), ('M_NEVER', 41, 'And'),
                      ('M_CASECLOSED', 42, 'Case'), ('P_INTERVIEW', 42, 'the')],
                inoff={'C1': 24}),
    'ch6': dict(floor=('el__office_room', -32), title=('CHAPTER SIX', 'TWO STORIES'), beats=[43, 44, 45, 46, 47, 48], music=('ff_6', 0.0, -16), tail=1.8,
                beds=[('el__office_room', 'A_INTERVIEW', 'S51', -24), ('el__vault_room_tone', 'S27', 'M_QUOTE', -23)],
                cuts=[('M_WIRED', 43, 'In'), ('A_INTERVIEW', 43, 'And'), ('S51', 43, 'It'),
                      ('M_HISSTORY', 44, 'He'), ('N3', 44, 'He#3'), ('S26@20', 44, 'so'), ('S02@124', 44, 'And'),
                      ('S41', 44, 'the#6'), ('M_20vs100', 44, 'Twenty'),
                      ('C13', 45, "It's"), ('A_INTERVIEW@70', 45, 'books'), ('M_EVIDENCESTORY', 45, "There's"),
                      ('S27', 45, 'The#2'), ('S45a', 45, 'there'), ('C10@20', 45, 'And'), ('S28', 45, 'with'),
                      ('M_QUOTE', 46, 'As'), ('M_TWOPATHS', 47, 'So'), ('S27@150', 47, 'If#2'), ('M_TWOPATHS@276', 47, 'is'),
                      ('S23', 48, 'And'), ('A_BLUELIGHTS', 48, 'he')],
                inoff={'N3': 6, 'C13': 0, 'S27': 1}, dim={'S26': 0.62}),
    'ch7': dict(floor=('el__vault_room_tone', -30), title=('CHAPTER SEVEN', 'WHERE ARE THE DIAMONDS?'), beats=[49, 50, 51, 52], music=('ff_7', 0.0, -15), tail=3.2,
                beds=[('el__vault_room_tone', 'S41', 'S01@120', -23)],
                cuts=[('M_MAP_MILAN', 49, 'Paroled'), ('E_MILAN', 49, 'In'), ('A_MILAN_STOP', 49, 'find'), ('S05', 49, 'He'),
                      ('A_PARCEL@36', 49, 'Belgian'),
                      ('S51', 50, 'He'), ('M_MAP_PARIS', 50, 'He#2'), ('A_CDG', 50, 'on'), ('S20', 50, 'He#3'),
                      ('S41', 51, 'More'), ('S52@20', 51, 'And'),
                      ('S01@120', 52, 'Ten'), ('S21@100', 52, 'beaten'), ('S22@60', 52, 'tape'), ('S26@60', 52, 'foam'),
                      ('A_VANCAMP@30', 52, 'undone'), ('P_S36', 52, 'and#3'), ('M_QUESTION', 52, 'So')],
                inoff={}, dim={'S26': 0.62}),
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
