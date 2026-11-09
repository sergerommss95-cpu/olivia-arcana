# FALSE FLOOR · Case No. 02 — v3 plan: characters, speed, moving camera

Collin, 9 Nov: v1 = 2/10 ("not the level of top YouTube heist videos… need speed, intensity, moving camera into the
scene… proposed people characters"). Approved since: stylized 3D cast (stills/v2/), process = test sequence first.
Same approved VO (George v4, 12:25), same facts table, same score. Everything below is a proposal until the test
sequence "The Night" (script/SEQ_NIGHT.json) is judged.

## Rules for every shot
- **2–4 s per shot** (cold open and heist chapters ~2.5 s; explanations ~3.5 s). Cut on George's words.
- **Camera always travelling into the scene**: push-ins, FPV dives, dolly-throughs, whip transitions. No static frame
  longer than 1.5 s except a deliberate silence drop.
- **People do the beat**: every story beat has a character doing it (proposed faces, labelled DRAMATIZATION).
- **Readable on a phone**: lights on where the facts allow (they were on during the break-in), exposure-balanced grade.
- **Sound on the cut**: impact/whoosh on hard cuts, the score's heist cue under chapters 3–4.
- Graphics only where they carry information (maps, the 109 counter, the two-stories split) — built fast, never
  more than ~25% of the runtime.

## Cast (lib/cast.py)
the Tenant (Notarbartolo) · the Genius · the Monster · Speedy · the King of Keys · the guard · August Van Camp ·
(new) two detectives (De Bruycker, Peys — suits/raincoats) · (new) a journalist (2009 interview, seen from behind).
All original faces; no likeness of real people; no faces of real people ever shown.

## Chapter by chapter (beat numbers = VO beats)

| Ch | Beats | Scenes (characters · camera) | ~shots |
|---|---|---|---|
| Cold open | 00–03 | Monday 7:30: the guard walks down the stairwell (FPV behind him) → fluorescents flicker on → the open 3-ton door (S01 reveal) → sensors (fast macro montage) → the guard's POV down the aisle of 109 forced boxes → building X-ray dive up two floors to the Tenant's office, chair turns — title | 18 |
| 1 Fortress | 04–07 | Drone through the district at dusk, police post, cameras tracking; dealers' hands with paper parcels ("mazal"); X-ray section of the Diamond Centre; "you start with a lease" — the Tenant signs, nameplate | 16 |
| 2 Tenant | 08–13 | The Tenant moves in (carries the scale), chats in corridors (guard nods), walks the vault with his box key — POV from the shoulder-bag camera (hidden lens, VHS-ish overlay), sensors noted; the crew introduction: each member walks into frame and freezes with a name card (Genius · Monster · King of Keys · Speedy, nervous); "a plan is only as calm as its most nervous man" — Speedy close-up | 24 |
| 3 Lock & key | 14–29 | Ten layers counted on screen; daylight sabotage: hair spray on the sensor while the guard looks away (cross-cut to the guard's monitor); screws + tape; **The Night** (test sequence, beats 23–27); polystyrene shield crossing the room, tape on the light sensor, lights switch on; sorting the haul on the floor (crew kneeling, diamonds, gold) | 70 |
| 4 Two places | 30–38 | Car on the E19 at night, Speedy panics, the throw (style frame C, animated); Monday cross-cut: guard finds the vault / Van Camp walks his land with a stick; he finds the bags; the sandwich; DNA | 30 |
| 5 Returns | 39–42 | The Tenant walks back into the lobby (Friday), detectives waiting; arrest; court (2005) — stylized courtroom; King of Keys walks away into fog (never identified) | 16 |
| 6 Two stories | 43–48 | 2009 interview (journalist, the Tenant older); split-screen: HIS STORY (dark, replica vault rehearsal) vs THE EVIDENCE (lights on, tape, sorted loot); De Bruycker quote card | 22 |
| 7 Diamonds? | 49–52 | Milan 2010 traffic stop (police torch on car seats, diamonds); Paris CDG 2013 arrest in the terminal; the empty vault today, slow push; final callback: the woods, the sandwich, the door closing — end card | 20 |

**~216 shots, ~12:25.** About 60% character/action 3D, 15% lock/mechanism macros (most already rendered), 25%
graphics/X-ray.

## Render budget (measured on RunPod A40/A6000/5090 with this pipeline)
- Character shots: 8–15 s/frame at 40 spp → we'll drop to 28 spp + OIDN and limit haze to hero shots: ~6–9 s/frame.
- ~7,500 3D frames (incl. handles) × ~7 s ≈ 15 GPU-hours ≈ $9–12 at $0.59–0.89/h. Within the remaining ~$23.
- Wall time with 4–5 GPUs: ~3–4 h of rendering, built and rendered chapter by chapter so you see each chapter as it lands.

## Order of work after the test is approved
1. Cold open (the hook) → you check → 2. Chapter 3 (the heist, biggest) → 3. Chapters 4–5 → 4. Chapters 1–2 →
5. Chapters 6–7 → full cut, mix, subtitles, thumbnails (new: characters in the thumbnail).
