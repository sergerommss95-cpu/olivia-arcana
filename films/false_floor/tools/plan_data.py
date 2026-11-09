"""Single source of truth for the episode plan: chapters, shots (type, seconds, set), used to write PLAN tables + chart.
Types: 3D = animated procedural Blender shot; 3DS = high-res 3D still moved in post (push/parallax);
MG = motion graphic in brand; PH = cleared, dated photograph."""
CH = [
 ('COLD OPEN', 'Hook + title', [
   ('3DS', 10, 'S1', 'Hairline of warm light under the vault door, push in'),
   ('3D', 12, 'S2', 'Drift across the forced box wall, 109 OF 189 builds'),
   ('3D', 8, 'S2', 'Descent to the floor debris: jewels, passport, cards'),
   ('MG', 10, 'S3', 'Building section: planes separate, vault at -2 revealed'),
   ('MG', 5, '-', 'FALSE FLOOR ident + sound logo, CASE No. 02')]),
 ('1 THE SQUARE MILE', 'Place + stakes', [
   ('PH', 10, '-', 'Hoveniersstraat 2009 (public domain), graded, dated'),
   ('3DS', 13, 'S4', "Dealer's table: diamond paper, loupe, tweezers"),
   ('MG', 17, 'S3', 'Diamond Centre elevation, floors labelled, vault edge'),
   ('3DS', 15, 'S1', 'Lateral dolly on the vault door in its antechamber'),
   ('MG', 20, '-', 'Re-hook card: HOW DO YOU ROB A VAULT YOU ARE ALLOWED INTO?')]),
 ('2 THE TENANT', 'Inside man', [
   ('3DS', 15, 'S4', 'The rented office, empty chair, blinds'),
   ('MG', 20, '-', 'Calendar strip ~2 years -> 15 Feb 2003'),
   ('3D', 15, 'S1', 'POV down the stairwell to -2, grate unlocks'),
   ('3DS', 15, 'S4', 'Shoulder bag with a hidden lens (macro)'),
   ('MG', 20, '-', 'Crew alias cards: GENIUS / MONSTER / KING OF KEYS / SPEEDY'),
   ('3DS', 5, 'S2', 'Re-hook still: the closed vault')]),
 ('3 TEN LAYERS', 'The impossible vault', [
   ('3DS', 10, 'S1', 'Door head-on, LAYER counter begins'),
   ('3D', 15, 'S1', 'Combination wheel 0-99, digit through the top lens'),
   ('3DS', 15, 'S1', 'Drill bit approaches the door edge, freeze'),
   ('3D', 18, 'S1', 'Magnetic plates across the seam, field lines hold'),
   ('3D', 12, 'S1', 'The long two-part key turning (macro)'),
   ('3D', 25, 'S2', 'Dark vault room: heat, light, motion sensors, camera'),
   ('MG', 15, 'S3', 'Ten layers as offset planes sliding apart'),
   ('3DS', 40, 'S1', 'Long push on the closed door, light goes to night')]),
 ('4 THE WEEKEND', 'How it was done', [
   ('MG', 12, 'S6', 'SATURDAY 15 FEBRUARY 2003 over the empty night district'),
   ('3D', 16, 'S2', 'Hair-spray mist settling on the heat sensor'),
   ('3D', 20, 'S1', 'Loosened screws, tape, aluminium plate slides over'),
   ('3D', 14, 'S2', 'Polystyrene shield moves through the room; tape on light sensor; lights on'),
   ('3D', 20, 'S1', 'Dial, key, the door swings (TUMBLER 2C rebuilt)'),
   ('3D', 23, 'S2', 'Hand-cranked tool; box doors snap open in a wave'),
   ('3DS', 15, 'S2', 'The emptied room at dawn')]),
 ('5 MONDAY MORNING', 'Discovery', [
   ('3D', 20, 'S2', "Guard's torch finds the open door; floor of debris"),
   ('MG', 25, '-', 'AT LEAST $100,000,000 (estimate, disputed)')]),
 ('6 TRASH IN THE WOODS', 'The mistake', [
   ('MG', 15, '-', 'Schematic map Antwerp -> E19 -> Brussels'),
   ('3DS', 20, 'S5', 'Night woods: fog, torn bags, papers on wet leaves'),
   ('3DS', 18, 'S5', "Morning woods, the landowner's path"),
   ('3DS', 20, 'S5', 'Macro tableau: receipts, envelope, stones, half a salami sandwich'),
   ('MG', 17, '-', 'DNA -> MATCH (orange, never a %)')]),
 ('7 THE TENANT RETURNS', 'Arrest + verdict', [
   ('3DS', 13, 'S4', 'The office at dusk, chair still empty'),
   ('MG', 17, '-', 'FRIDAY 21 FEBRUARY 2003 + detective name cards'),
   ('MG', 30, '-', 'Court timeline: 10 years / 5 years / King of Keys blank'),
   ('3DS', 15, 'S2', 'Re-hook: the sealed vault')]),
 ('8 TWO STORIES', 'The twist', [
   ('MG', 15, '-', 'Split frame HIS STORY / THE EVIDENCE'),
   ('MG', 30, '-', 'His claims typeset, attributed ("he says")'),
   ('3DS', 25, 'S2', 'Counter-evidence inserts: tape on the light sensor, bags sorted on the floor'),
   ('MG', 15, '-', 'De Bruycker quote card'),
   ('MG', 35, 'S3', 'Panels slide apart: the false floor reveal')]),
 ('9 WHERE ARE THE DIAMONDS?', 'Open ending', [
   ('MG', 25, '-', 'Timeline 2009 / 2010 Milan / 2011 / 2013 Paris / 2017'),
   ('MG', 20, '-', 'Map line Turin -> Paris CDG'),
   ('3DS', 20, 'S2', 'Pull back from the forced wall into darkness'),
   ('3D', 17, 'S1', 'Door closes to a hairline of warm light (mirrors the open)'),
   ('MG', 8, '-', 'End card + next case + end-screen zone')]),
]
SETS = {
 'S1': ('Vault antechamber + door', 'Rectangular 3-ton door, 0-99 wheel with top lens, long two-part key, magnetic plates + keypad, steel grate, stairwell. REUSES TUMBLER dial, door metals, concrete, fluorescent strips.'),
 'S2': ('Vault room, 189 boxes', '189 boxes with key + 3-letter wheels; 109 forced (bent doors, dark mouths, cream rim light); floor debris; heat/light/motion sensors, camera. REUSES TUMBLER deposit-wall builder, cash bricks.'),
 'S3': ('Building section (brand motif)', 'Diamond Centre as offset concrete planes; tenant floor; vault at -2; planes separate to reveal orange. NEW, simple geometry, fast renders.'),
 'S4': ("Tenant's office", 'Desk, blinds, scale, loupe, diamond papers, phone, shoulder bag with hidden lens. NEW.'),
 'S5': ('Woods off the E19', 'Trunks, wet leaf litter, fog, torn bin bags, receipts, envelopes, loose stones, half a salami sandwich; night and morning light. NEW.'),
 'S6': ('Diamond district at night', 'Empty street, bollards, police post, sodium light. REUSES TUMBLER Act IV city kit.'),
}
