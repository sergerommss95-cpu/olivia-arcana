# FALSE FLOOR · Case No. 02 — full episode v3 (Fern-style mixed media)

Collin, 10 Nov 00:45: "15 min of footage overall, or at least what narration covers — a mix of rendered and upcoming
renders, AI stills/footage, real evidence and code animation on top, close to what the Fern channel does."
Decisions (his answers): **evidence = free-licensed only** (Wikimedia/CC/PD, OpenStreetMap, public facts; credited on
screen; key evidence recreated as labelled reconstructions) · **Kling AI ≤ ~1,000 credits** · **length = the existing
narration** (George v4, out/vo/vo_george_v4_v01, beats S00–S52, ≈12:25 + 15 s end card).

## Look (all sources must cut together)
- 1920x1080, 24 fps, dark cinematic: charcoal/near-black base, warm practical light, one accent colour **amber
  #E8A33D** (routes, highlights, counters), secondary **cold white #DCE3EA**; red #D9493B only for alarms/"never found".
- Type: **Inter** (installed: /usr/share/fonts/opentype/inter/) — Inter Display SemiBold for titles, Inter Regular for
  labels, tracking +2–4 % caps for small labels. No other fonts.
- Every motion graphic MOVES: slow camera drift / push (never a static frame > 1.5 s), eased (cubic in-out), elements
  animate in over 6–12 frames. Subtle film grain (σ≈2–3 /255) and a soft vignette baked in, like the 3D renders.
- Photos (evidence) get the Fern treatment: graded to the film (slightly desaturated, warm mids), 2.5D push/parallax
  (foreground/background split or depth-map displacement), never a flat Ken Burns only; small credit line bottom-left
  "Photo: <author>, <licence> via Wikimedia Commons" in Inter 18 px, 70 % white.
- People: **no faces of real people, ever** (not in photos, not generated). Our cast (lib/cast.py) are proposed,
  original faces → "DRAMATIZATION" label already handled by the editor.
- Reconstructions of evidence (the bags, the sandwich, documents) are labelled "RECONSTRUCTION".

## Clip naming (all deliverables go to false_floor/out/clips/<ID>.mkv, x264 crf ≤ 12, yuv420p or 444, 24 fps)
- `C*`, `N*`, `S*` existing 3D · `H*` new 3D character shots · `A_*` AI (Kling) · `E_*` evidence photo moves ·
  `M_*` code-animated motion graphics. Length = the duration listed + 12 frames of handle at each end where possible.
- Manifest: false_floor/out/clips/manifest_v3.json — {id: {src, dur_s, beat, credit?, note}}.

## Beat-by-beat coverage (t = episode clock; cuts land on George's words, 2–4 s per shot)

### Ch 0 · Cold open S00–S03 (0:00–0:58) — DONE (seq 'cold', C1–C13)

### Ch 1 · The fortress S04–S07 (0:58–2:00)
| beat | visuals (in order) |
|---|---|
| S04 hardest place on earth; streets by Centraal; bollards; cameras; police post | M_MAP_ANTWERP (Europe → Belgium → Antwerp → the diamond district beside Antwerpen-Centraal, OSM, 6 s) · E_CENTRAAL (station photo, 3 s) · E_DISTRICT (Hoveniersstraat/Schupstraat street, bollards, 3 s) · S04 (3D street, 3 s) · M_CAMERAS (street map with camera cones + police post icon, 3 s) |
| S05 stones in paper envelopes; handshake; mazal | A_PARCEL (paper parcel unfolds, loose stones, loupe — hands only, 5 s) · E_DIAMONDS (CC photo of rough/polished stones, 3 s) · A_HANDSHAKE (two dealers' hands, 4 s) · M_MAZAL (the word "mazal" typographic, 2.5 s) |
| S06 the Antwerp Diamond Centre; offices above; vault two floors below; tenants-only rule | E_ADC (building, 3 s) · C2 (3D section down to the vault, reuse) · M_RULE ("NO OFFICE UPSTAIRS — NO BOX DOWNSTAIRS", 4 s) |
| S07 you start with a lease | H_LEASE / A_LEASE (the Tenant signs a lease at a desk, 5 s) |

### Ch 2 · The tenant S08–S13 (2:00–3:30)
| S08 office, nameplate, desk, scale; "Leonardo Notarbartolo" | A_TENANT_OFFICE (from stills/v2/B_tenant_office) · S08 (3D office) · M_NAME_TENANT (name card over a slow push, DRAMATIZATION) |
| S09 rent on time; corridors; ordinary face; his own box | M_MONTHS (lease calendar flipping 2000→2002) · A_CORRIDOR (tenant + guard nod) · S10 (vault visit, 3D) |
| S10 minutes downstairs; looks at sensors, door, guard buzz | S10 · C5 · C6 (sensor macros, reuse) · M_STOPWATCH (guard buzz-in timing graphic) |
| S11 hidden camera in a bag | S11 (3D bag) · E/M VHS POV (C8 walk with camcorder overlay, "REC" + timecode) |
| S12 School of Turin; Genius / Monster / King of Keys / Speedy | M_TURIN (map pin Turin → Antwerp line) · M_CREW (4 dossier cards with cast portraits, nickname + role) |
| S13 only as calm as its most nervous man | H_SPEEDY (Speedy close-up, slow push, nervous glance) |

### Ch 3 · Lock and key S14–S29 (3:30–7:15) — mostly existing 3D + the Night
| S14 door, 3 tons, 12 h drilling | S14 · C4 · M_LAYERS (the ten layers, counter "1 / 10" starts) |
| S15 seismic sensor | C5 · S15 |
| S16 combination, lens | S16 |
| S17 key | S17 |
| S18 magnetic plates, outside security firm, keypad | S18 · M_FIELD (magnetic field lines break → alarm route to outside firm) |
| S19 heat/motion, light, radar, camera; 189 boxes; 17,576 per box | C6 · M_SENSORS (room plan with sensor cones) · M_17576 (counter 26×26×26) |
| S20 nobody patrols at night; daylight weakness | S20 · A_GUARD_MONITOR (guard station monitor glow, no face) |
| S21 hair spray on the sensor in daylight | S21 · H_SPRAY (close: aerosol mist on the sensor) |
| S22 screws loosened, tape | S22 |
| S23–S27 the Night | seq 'night' (N1–N10, S16–S18, S24) + S26 (polystyrene/tape/lights) |
| S28 sort the haul; ten layers beaten | S28 · C9 · M_LAYERS (all ten struck through) |
| S29 get rid of the rubbish | C10 (top-down, slow) |

### Ch 4 · Two places S30–S38 (7:15–8:50)
| S30 burn everything: tape, tools, packaging, food | M_BURNLIST (four items tick off, ember glow) |
| S31 off the E19, Speedy panics, bags into the trees | M_ROUTE_E19 (map Antwerp → Brussels, E19, the woods) · A_E19_NIGHT (car on a night motorway, tail lights, no faces) · A_THROW (from stills/v2/C_the_throw) · S31 (3D woods) |
| S32 vault found Monday; crew are ghosts | C8 · M_GHOSTS (four dossier cards fade to "UNKNOWN") |
| S33 the woods belong to August Van Camp | E_WOODS (CC Belgian woodland) · H_VANCAMP (Van Camp walks his land with a stick) |
| S34 investigators count the damage | C10 |
| S35 Van Camp finds the litter, calls police | S35 (3D bags in leaves) |
| S36 receipts, envelopes, loose stones, paperwork, half a salami sandwich | S36 · M_EVIDENCE (evidence-board reconstruction, items labelled) |
| S37 DNA from the sandwich into the case file | M_DNA (evidence bag → swab → case file stamp) |
| S38 the paperwork points to one tenant | M_LINK (lines from evidence to the office) · C13 |

### Ch 5 · The tenant returns S39–S42 (8:50–9:45)
| S39 five days later he walks back in; De Bruycker and Peys waiting | H_RETURN / A_RETURN (tenant enters lobby) · M_DETECTIVES (two name cards, no faces) |
| S40 2005 appeals court: 10 years; three others 5 years | A_COURT (empty Belgian courtroom) · M_SENTENCES |
| S41 King of Keys never identified; diamonds never found | H_KING_FOG (King walks away into fog) · M_NEVER (counter: identified 4/5, recovered ~0 %) |
| S42 case closed… six years later | M_CASECLOSED (stamp → year rolls 2003 → 2009) |

### Ch 6 · Two stories S43–S48 (9:45–11:17)
| S43 2009, Wired, Joshua Davis | M_WIRED (typographic citation, no logo) · A_INTERVIEW (older tenant from behind, recorder on the table) |
| S44 insurance job; replica vault; nearly empty bags; 20 M not 100 M | M_HISSTORY (split panel "HIS STORY") · A_REPLICA (dark replica vault rehearsal) · M_20vs100 |
| S45 the crime scene says otherwise: lights on, tape, loot sorted | M_EVIDENCESTORY ("THE EVIDENCE") · N8 · C9 · S26 |
| S46 De Bruycker quote | M_QUOTE |
| S47 fall guy or convenient story | M_TWOPATHS |
| S48 a year later he got pulled over | A_BLUELIGHTS (police lights on a wet car at night) |

### Ch 7 · Where are the diamonds? S49–S52 (11:17–12:40)
| S49 Milan 2010, ~1 kg of diamonds between the seats | M_MAP_MILAN · A_MILAN_STOP (torch on the car seats, stones) · E_MILAN |
| S50 parole broken; Paris 2013 layover; European warrant | M_MAP_PARIS · A_CDG (terminal, no faces) · E_CDG |
| S51 vault repaired; most never seen again | S51 · C8 |
| S52 recap + the question | callbacks (S01, S21, S22, S26, H_VANCAMP, S36) · M_QUESTION · END |

## Work split
- **Evidence (agent):** find + download free-licensed photos for every E_* above (+ spares), licence-checked, credits.
- **Motion graphics (agent):** all M_* and the E_* photo moves, from FACTS.md, this file and the style above.
- **Lead:** H_* 3D character shots (GPU), A_* Kling clips (≤ ~1,000 credits), the editor (chapters on George's
  words), QC frame by frame, mix, delivery chapter by chapter.

## Licences / accuracy notes for the YouTube package (from the evidence + maps agents)
- Photos: assets/evidence/credits.json + README.md (credit line per file). 24 of 38 files are CC BY-SA → the graded /
  displaced versions are offered under the same licence; say so in the description, list every credit used in the cut.
- Maps: Natural Earth (public domain) and OpenStreetMap (ODbL, "© OpenStreetMap contributors" is on screen).
- E_ADC is a real Schupstraat photo (CCTV, offices), not verified as the Diamond Centre building: never caption it as the ADC.
- E_WOODS is the Sonian Forest (Zoniënwoud) near Brussels, not the dump site: generic Belgian woodland, never captioned.
- Camera / bollard positions in M_CAMERAS are as mapped today (stated on screen).
