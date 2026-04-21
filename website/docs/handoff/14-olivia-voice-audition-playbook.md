# Olivia — voice audition playbook

Tactical guide for picking the winning ElevenLabs take. Use this when
you're sitting in front of ElevenLabs with 5–8 generated takes and
need to choose.

---

## Before you start

1. **Headphones only.** Speakers hide HF artifacts; headphones expose them.
2. **Quiet room.** You're listening for absence of breath / presence of
   consonant crispness. Background noise hides both.
3. **No screen.** Close your eyes. If you can tell it's AI within 3
   seconds of closing your eyes, reject the take.
4. **Play each take twice.** First pass gut reaction, second pass
   scoring with the sheet below.

---

## The scoring sheet

Copy this into a notepad. One sheet per take. Score 0–3 per line.

```
TAKE #__

[ ] Breath intake audible somewhere in the take        / 3
[ ] "I'm Olivia" — softness on L, no crisp attack     / 3
[ ] "fifteen years" — tiny emphasis, not presenter-y / 3
[ ] "calculated in real time" — specific, certain    / 3
[ ] "not drawn from a template" — earns credibility  / 3
[ ] "Astrology isn't entertainment." — FLAT delivery / 3
[ ] Phrase-end on "entertainment" softens / drops    / 3
[ ] "what would you like to know?" warm curl upward  / 3
[ ] Some phrase variation in speed (not metronomic)  / 3
[ ] Mouth sounds / micro-noises present              / 3

TOTAL: __/30
DISQUALIFIERS:
[ ] Upspeak anywhere?                   (reject if yes)
[ ] Theatrical / witchy affect?         (reject if yes)
[ ] ASMR whisper territory?             (reject if yes)
[ ] "Smile voice" whole way through?    (reject if yes)
[ ] Identical pace on every sentence?   (reject if yes)
```

Anything below 20/30 is not a winner. Anything with a disqualifier
checked is out regardless of score.

---

## Landmark moments — these are where takes fail

Focus your listening on these five bits. If a take survives all five,
it's a candidate.

### Landmark 1 — "Hello. I'm Olivia."

**What should happen:**
- Slight warm lean on "Hello"
- 400–800ms pause after
- "I'm Olivia" arrives like an introduction, not a reading

**What fails:**
- "Hellolivia" (no pause, rushed)
- Performative "HELlo" with extra inflection
- Voice fry on "Olivia" — rejects, this is a greeting, not a groan

### Landmark 2 — "fifteen years"

The credibility claim. Needs to land with specificity.

**What should happen:**
- Slight tiny lift on "fifteen"
- "years" arrives grounded, certain

**What fails:**
- Generic reading with no emphasis (throwaway)
- Over-emphasized like a sales pitch (theater)

### Landmark 3 — "calculated in real time, not drawn from a template"

**The product differentiator.** If this sentence doesn't land, the take fails.

**What should happen:**
- Lean on "real time" — slight slowing
- Comma pause 200ms
- "not drawn from a template" — deliberate, almost challenging

**What fails:**
- Rushed through both clauses
- "real time" inflected like a question
- "template" punched hard like a TED talk

### Landmark 4 — "Astrology isn't entertainment."

**The hardest line.** Must land flat, confident, not preachy.

**What should happen:**
- Voice drops into chest register
- "isn't" lands on the *n't* with slight emphasis
- "entertainment" softens at the end, 600ms pause after

**What fails:**
- Preachy "AH-STROL-OGY" rising pitch
- "Entertainment" with finality theater
- Comedic sing-song

### Landmark 5 — "So — what would you like to know?"

The opening, not the close. Must curl upward warmly.

**What should happen:**
- "So —" as a sigh / invitation, not declaration
- Upward curl on "know"
- Voice ends softer than it started

**What fails:**
- "know?" as a crisp question mark (robotic)
- Same pitch as the preceding line (flat)
- Demanding tone ("what do you want, already?")

---

## Green flags that mean you found the one

When ALL of these are true, stop auditioning and save the take:

1. You hear **a breath** before a longer phrase.
2. You notice **natural pause variation** — not every comma is 200ms.
3. **"Astrology isn't entertainment"** lands like a stated fact, not a
   sermon.
4. **"what would you like to know?"** makes you want to answer it.
5. The voice **doesn't make you reach to skip** within the first 10s.
6. You can close your eyes and picture a specific person, not "an AI
   voice." Even if the picture doesn't match the portrait —
   ambiguity is fine, consistency with humanity is what matters.
7. You hear **at least one imperfection** — a catch, a slight rasp,
   an unexpected soft consonant, a micro-stumble.

---

## Red flags that are disqualifiers

Any one of these = reject the take, regardless of score.

- **Upspeak.** Rising pitch at end of statements. Rejects even on a
  30/30 otherwise.
- **Audiobook cadence.** Metronomic, even pace throughout.
- **Breathing is silent.** No audible inhalation in 27s.
- **Consonant crispness is uniform.** Every T, S, K hits identical
  attack. This is the single strongest AI marker.
- **Smile voice throughout.** Can hear a smile on every phrase.
- **ASMR-adjacent.** Close-mic breath-heavy whisper. This is the
  cousin AI tries to sell as "intimate" — it's artificial intimacy.
- **The "witchy" affect.** Soft, mysterious, performed mystical tone.
  Rejects Olivia's editorial brief.

---

## How to generate takes efficiently

**Cost budget.** Each take at ~870 chars = 870 credits. Target: 8 takes
per session = ~7,000 credits (within Creator tier's monthly cap).

**Prompt variation strategy.** If the first 3 takes all read similarly
bad, don't generate 5 more — tweak the prompt. Common adjustments:

| Problem | Adjustment |
|---|---|
| All takes too polished | Add "very slight creaky voice at phrase ends" |
| All takes too fast | Change "conversational pace" to "slow conversational pace, like someone thinking aloud" |
| All takes too breathy | Remove "breathy" language, add "measured and grounded" |
| Voice reads too old | Change "mid-thirties" to "early thirties" |
| Voice reads too young | Change "mid-thirties" to "thirty-eight" |
| Accent too strong | Weaken "Edinburgh accent" → "soft neutral British with a slight Edinburgh lilt" |
| Accent too weak | Strengthen with "clear Edinburgh intonation, educated but unmistakable" |

**If you've generated 10 takes and none are winners**, the voice is
fighting the prompt. Try a completely different voice seed —
regenerate from scratch.

---

## After picking the winner — the full pipeline

1. **Download** the winning take as an MP3 from ElevenLabs.
2. **Run `scripts/deai/voice.sh`** on the MP3.
3. **Optionally mix in room tone** (see doc 13 for the ffmpeg command
   or use `scripts/deai/make_room_tone.py` to generate one).
4. **Save** to `/Users/macbookpro/olivia-arcana/website/public/audio/olivia/intro-voice.mp3`
   (or similar).
5. **Re-generate the HeyGen video** using the processed MP3 as the
   uploaded audio (HeyGen lip-syncs to uploaded audio — this bypasses
   ElevenLabs's HF sheen that HeyGen can't clean).
6. **Run the new HeyGen output** through `scripts/deai/video_per_frame.py`.
7. **Drop** into `/public/videos/olivia-intro.mp4`.
8. **Commit + push** to deploy.

---

## When to rerun the full pipeline

- Every new Olivia video (daily card, oracle response, etc.).
- When the prompt evolves (we learn more about what works).
- When a user flags "this voice sounds AI" — that's the most honest
  feedback. Act on it immediately with another audition session.

The goal is a voice that, over 100 listeners, 0 of them ask "is this
AI?" If even one does, the voice is underperforming.
