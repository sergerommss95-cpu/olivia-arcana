# FALSE FLOOR — Case No. 02 "The Tenant Upstairs": production plan

15:00 YouTube episode on the 2003 Antwerp Diamond Centre heist, built with the TUMBLER system: procedural Python
→ headless Blender (Cycles) for every 3D image, code-built motion graphics in the locked False Floor brand, edit +
grade + mix in code. Hybrid format: about a quarter animated 3D, a third 3D stills with camera moves, the rest
motion graphics.

- Script: `script/EPISODE_02_SCRIPT.md` (VO + visual per beat)
- Facts and sources: `script/FACTS.md` (every VO line traces to a numbered row)
- Shot tables: `script/PLAN_TABLES.md` (generated from `tools/plan_data.py`)
- Timeline chart: `stills/plan_timeline.jpg`

## 1. Story in nine chapters

| Time | Chapter | Job in the story | Re-hook that carries the viewer on |
|---|---|---|---|
| 0:00 | Cold open | Vault standing open, 109 of 189, the locked 26-word line | "…walking past this door every week for two years" |
| 0:45 | 1 The Square Mile | Where we are, what's at stake | "How do you rob a vault you're allowed into?" |
| 2:00 | 2 The Tenant | Notarbartolo rents the office, two years of watching; the crew's nicknames | "Remember Speedy." |
| 3:30 | 3 Ten Layers | The vault as an impossible machine (the big 3D chapter) | "Every layer was a problem they'd already solved." |
| 6:00 | 4 The Weekend | How each layer fell, 109 boxes | "All they had to do now was throw away the evidence." |
| 8:00 | 5 Monday Morning | Discovery; at least $100m (estimate) | — |
| 8:45 | 6 Trash in the Woods | E19 dump, Van Camp, the salami sandwich, DNA | "The thing that couldn't be wiped clean was lunch." |
| 10:15 | 7 The Tenant Returns | Arrest on 21 Feb, sentences, King of Keys never found | "Six years later, he told his side." |
| 11:30 | 8 Two Stories | His WIRED account vs. the detectives (attributed, contested) | "Which is the story beneath?" |
| 13:30 | 9 Where Are the Diamonds? | Parole, Milan, Paris arrest, loot never found | Ends on a question for the comments |

## 2. Visual system

| Type | Share | What it is | How it's made |
|---|---|---|---|
| Animated 3D | 3:55 (26%) · 20 shots · 5,640 frames | The set pieces: vault door, dial, key, plates, sensors, boxes snapping open, torch on the debris | Blender Cycles, procedural; rendered on a rented GPU |
| 3D still + camera move | 4:44 (32%) · 11 shots | Office, dealer's table, woods tableau, emptied vault, long pushes | One high-res render plus depth pass → push / parallax / drifting dust and fog in post |
| Motion graphics | 6:11 (41%) · 20 shots | Building section (brand planes), timelines, maps, name cards, quote card, his-story/evidence split, money/DNA type | Code: Blender for the 3D planes, numpy/Pillow for type and maps; Barlow Condensed + Arial; type builds and settles |
| Photo | 0:10 (1%) | Hoveniersstraat 2009, public domain, dated and credited | Graded into the palette, no people |

Guardrails from the handoff, applied everywhere: no HUD chrome, no stickers or warped grids, no diamond or jewellery
stock, orange only for a newly exposed connection (`$`, BREACH, MATCH), cream lips and dark mouths on forced boxes,
**ILLUSTRATIVE RECONSTRUCTION** on every 3D frame, no people, no 2003 press or police photos, 109/189, no DNA %.

## 3. What we need to build

### 3D sets (procedural Blender)
| Set | On screen | Contents | Reuse from TUMBLER |
|---|---|---|---|
| S1 Vault antechamber + door | ~3:25 | Rectangular 3-ton door, 0–99 wheel with top lens, two-part long key, magnetic plates + keypad, steel grate, stairwell to −2 | Combination dial, door metals, wet concrete, fluorescent strips, door-swing rig |
| S2 Vault room, 189 boxes | ~3:20 | 189 boxes (key + 3-letter wheels), 109 forced with bent doors and dark mouths, floor debris (envelopes, pouches, passports, cards), heat/light/motion sensors, camera | Deposit-wall builder (wave-open rig from shot 3B), cash bricks, motes |
| S3 Building section | ~1:30 (as MG) | Diamond Centre as offset concrete planes, tenant floor, vault at −2, planes separating to orange | Concrete materials |
| S4 Tenant's office | ~0:55 | Desk, blinds, scale, loupe, diamond papers, phone, shoulder bag with hidden lens | — (new) |
| S5 Woods off the E19 | ~1:00 | Trunks, wet leaf litter, fog, torn bin bags, receipts, envelopes, loose stones, half a salami sandwich; night + morning | — (new) |
| S6 District at night | ~0:12 (as MG) | Empty street, bollards, police post, sodium light | Act IV city kit |

### Motion-graphic templates (built once, reused)
Chapter card · lower third + persistent reconstruction label · type build/settle for numbers (`109 OF 189`,
`$100,000,000`) · calendar/timeline strip · name cards (no faces) · schematic map (Antwerp–E19–Brussels,
Turin–Milan–Paris) · split frame HIS STORY / THE EVIDENCE · quote card · ident + end card (existing brand kit and sound logo).

### Audio
- VO: your ElevenLabs "George" reading `EPISODE_02_SCRIPT.md` (~1,900 words, about 13½–14 min at a documentary read). I cut picture to it.
- Sound design: tactile foley per the style guide (steel, latches, paper, room tones). Mixkit library already wired
  into the mixer; your v7 ElevenLabs stems slot in as beds. No continuous trailer booms.
- Score: a restrained low pulse under chapters 3–4 and 8, silence around the reveals. Track to be chosen with you.
- Mix: about −14 LUFS integrated for YouTube, true peak −1 dBTP.

## 4. How we work (approval gates, from your handoff lessons)

| Step | What you get | Your decision |
|---|---|---|
| 0 Now | This plan + script + facts | Approve the story and chapter 8 (the attributed "two stories" act) |
| 1 Look | 3 style-frame stills: forced box wall (S2), woods tableau (S5), building section (S3) | Pick and adjust the look |
| 2 Sets | One review still per set as each is built | Fix per set |
| 3 VO | You record George from the locked script | Locks the timeline |
| 4 Render | GPU rental, chapter by chapter; each chapter delivered as a rough cut | One pass per named note |
| 5 Finish | Graded, mixed 1080p master (4K optional), thumbnail render, chapters for YouTube | Publish |

Outputs are versioned (`_v01`, `_v02`…), never overwritten.

## 5. Rendering budget

| Item | Frames / renders | On a rented RTX 4090 | Cost |
|---|---|---|---|
| Animated 3D | 5,640 frames at 1920×1080, ~64 samples | ~8–12 h | ~$3–11 |
| 3D stills | ~40 renders (+ depth passes) at 2560 px | ~1 h | <$1 |
| Re-renders after notes (×2) | | ~10–20 h | ~$5–20 |
| **Total** | | **~20–35 GPU hours** | **~$10–30** |

Prices: RTX 4090 ~$0.34–0.89/hr on RunPod / Vast.ai. Style frames and set previews render on this cloud box; the
animated shots go to the GPU once you approve the look.

## 6. What I need from you
1. A yes on the story, especially chapter 8.
2. When we reach step 4: a RunPod (or Vast.ai) account with a little credit. I'll ask for the API key through the
   secure form so I never see it.
3. VO recorded with George once the script is locked.

## 7. Look lock and quality bar

- **9 Nov 2026: SF1 (forced box wall, `stills/SF1_vault_v01.jpg`) approved by Collin** as the look reference for every
  3D shot. **SF3 (building section) approved** ("good") as the reference for the section/motion-graphic look. SF2 (woods) accepted "as is for now" — sandwich reads a bit weird; refine in S36 (bread pores, salami, real leaf outlines) and redo if Collin asks.
- Collin's rule: **everything must be cinematic and well made.** In practice, every shot must have:
  - a clear focal subject and depth layers (soft foreground, sharp subject, background falling into darkness or haze);
  - motivated light only (practicals, fluorescent tubes, a doorway, daylight), mostly in shadow, small bright highlights,
    lips and edges catching light instead of flat fills;
  - real-world scale, bevelled edges, material variation (paint wear, grime, roughness breakup), no toy or cardboard look;
  - a motivated camera (slow push, drift, rack focus, or a decisive move on a beat), shallow depth of field on close-ups,
    motion blur on movement;
  - the brand grade (charcoal black point, cream highlights, muted natural colour, grain), type that builds and settles,
    the reconstruction label;
  - a QC still reviewed by the lead before any animation renders; anything that reads as stock, HUD, sticker, or
    "AI slop" goes back.
