# Olivia — ElevenLabs Voice Design prompt (anti-AI revision)

Paste into ElevenLabs → Voice Design → prompt field. Use the intro
script as the sample text. Generate 5–8 takes. Save the winner to
your voice library as **"Olivia Arcana — primary"** and connect it
to HeyGen.

---

## Why this version is different

The previous prompt generated a voice that sounded *good* — but sounded
**like AI**: perfect consonants, even cadence, zero breath, zero
imperfection. That's the single biggest giveaway that this is a
synthesised voice, not a human being.

This revision explicitly requests the *imperfections* that make a human
voice read as human: breath, vocal fry, micro-pauses, off-mic texture,
room acoustics. It specifies what to **reject** as much as what to produce.

**Generate 5–8 takes, not 3.** ElevenLabs Voice Design variance is wide,
and you're now fishing for a take with genuine texture — that's rarer
than a clean one.

---

## Primary prompt (anti-AI · conversational · soft · deep)

Paste this exactly:

```
Soft, deep female voice, mid-thirties. Low contralto register with warm
chest resonance. Soft Edinburgh accent — educated, gentle, never heavy.
Recorded in a small room at home, not a studio — faint room tone, soft
ambient air, slightly close microphone. Intimate conversational pace,
as if speaking quietly across a small table to one person.

Human imperfections are essential: audible breath intakes before longer
phrases, occasional soft mouth sounds, a touch of vocal fry at the ends
of sentences, slight rasp in the lower register, micro-pauses where
thought catches before a word. Phrase endings should soften and drop,
not land crisp. Occasionally a tiny lip-movement sound between words.

Reject: broadcast clarity, presenter polish, even cadence, pristine
studio air, audiobook performance, ASMR whisper, upward intonation on
statements, theatrical mysticism, any sense of "reading aloud."

Deliver like a thoughtful friend speaking at the end of a long day —
warm, a little tired, certain about what she believes, unhurried,
unperformed. Real. Slightly imperfect on purpose.
```

**~870 characters.** Longer than before because anti-AI direction needs
explicit inclusion/exclusion lists. The length is the point.

---

## Alternative direction — even more degraded ("voice note to a friend")

If the primary still reads too produced. Trades some clarity for
humanity. Good for casual placements, daily cards, chat replies.

```
Low female voice, mid-thirties, recorded informally on a phone or small
condenser microphone in a home room. Audible room air, no noise gate,
faint traffic or refrigerator in the background is acceptable. Edinburgh
accent, gentle. Slightly tired and close — like a voice note sent at
eleven at night. Natural imperfections throughout: breath, a small
throat-clear at the start, mid-sentence hesitation, uneven vowel
length, vocal fry at phrase ends, occasional slight mispronunciation
or softened consonant. Warm, honest, certain but unhurried. Reject
anything that sounds like a performance.
```

---

## Sample text (what the voice reads)

The intro script. Keeps the same landing beats as the broadcast version,
but the voice should take liberties with pauses and phrasing.

```
Hello. I'm Olivia.

[small breath]

I've read charts by hand for fifteen years. Ask me a question, and
I'll answer using your actual birth chart — calculated in real time,
not drawn from a template.

[tiny pause]

If the chart has nothing specific to say, I'll tell you. Astrology
isn't entertainment.

[soft exhale]

So — what would you like to know?
```

The bracketed cues are for *you*, the listener, when you're picking a
take. ElevenLabs will occasionally produce these naturally when the
prompt asks for breath. If a take includes them, weight it higher.

---

## AI-tells to reject (any one = reject the take)

Listen with eyes closed. If any of these are true, the take is AI:

1. **Consonants are too crisp.** Every "t" and "s" has identical
   microsecond-precise attack. A human slurs, softens, varies.
2. **Inter-word spacing is mechanical.** Gap between every word is
   the same duration. A human clusters some words, pauses at others.
3. **Zero breath.** No inhalation anywhere. A human breathes mid-paragraph.
4. **Zero mouth-sound.** No tiny click between phrases. A human has
   saliva and lip friction.
5. **Phrase endings land crisp.** "Know." arrives like a hammered
   period. A human softens the final vowel, lets the consonant drift.
6. **No vocal fry.** The end of "Olivia" is clean, not slightly creaky.
   Humans use fry on sentence ends, especially low voices.
7. **Emotion is consistent.** Every sentence has the same warmth level.
   A human warms up, cools down, occasionally loses energy mid-phrase.
8. **Recording is too dry.** No room reflection at all. Studios kill
   reflection; bedrooms don't.
9. **No false start / restart.** Every sentence is perfect on the
   first try. A human occasionally says "I've been read—" and re-starts.
10. **Speed is too even.** Identical words-per-second throughout. A
    human speeds up on throwaway phrases, slows on key points.

---

## Green flags (signals the take has broken AI)

- **Audible inhalation** before "I've read charts by hand."
- **Slight rasp** in the low end — voice sounds like she's had coffee.
- **Phrase-end drop** on "entertainment." — the word collapses slightly.
- **Micro-hesitation** between "So —" and "what would you like to know?"
- **Different warmth** on "Hello. I'm Olivia." vs "astrology isn't
  entertainment" — the first is softer, the second flatter.
- **Tiny mouth noise** between phrases.
- **Irregular room sound** — not constant, not zero, not the same
  between takes.

---

## Post-processing the winning take (extra de-AI)

Even the best ElevenLabs take will sound slightly synthetic. Process
the MP3 before uploading to HeyGen:

**Recommended ffmpeg chain:**

```bash
ffmpeg -i olivia-voice.mp3 \
  -af "highpass=f=85,lowpass=f=13500,
       acompressor=threshold=-19dB:ratio=2.2:attack=6:release=140,
       aecho=0.38:0.6:32:0.13,
       adeclick,
       volume=1.02" \
  -ar 44100 -b:a 192k \
  olivia-voice-processed.mp3
```

- `highpass=85` + `lowpass=13500`: strips the top-octave "digital
  sheen" that AI voices have. Real voice recordings have less ultra-HF.
- `acompressor`: gentle compression, mimics the transfer function of
  a real analog compressor in a home studio.
- `aecho=0.38:0.6:32:0.13`: faint 32ms early reflection — 13% wet —
  adds room tone without sounding reverberant.
- `volume=1.02`: nudges perceived loudness.

Optional manual additions that help further:
- **Add a 4–8 second bed of low-level room tone** at -42 dB under the
  whole track. Record a quiet room for ten seconds on a phone, use
  that. Having some non-zero background is the single fastest way to
  stop a voice reading "synthesised."
- **Pan slightly off-center** (L −2 or R +2): perfectly centered vocals
  are a studio signal. Real recordings drift.

---

## After picking the winner

1. **Save the voice in ElevenLabs** as `Olivia Arcana — primary`
2. **Tag it private** (don't publish to the marketplace)
3. **Description field**: *Anti-AI · soft contralto · Edinburgh · conversational bedroom register*
4. **Run the ffmpeg post-process** on every generation before uploading
   to HeyGen. The prompt alone isn't enough; post-processing closes
   the remaining gap.
5. **Connect ElevenLabs → HeyGen** via HeyGen's Voice Library integration
6. **Set it as the default voice** on Olivia's Photo Avatar in HeyGen

---

## Cost notes

Anti-AI prompt at ~870 chars ≈ 870 credits per take. At 8 takes per
attempt: ~7,000 credits. Creator tier (100k/mo) supports ~14 full
voice-hunt sessions per month.

Once the voice is saved, TTS runs at ~1 credit per output character.
The 53-word intro script is ~300 chars ≈ 300 credits per generation.

---

## Legacy prompts (reference only — do not use)

These were the earlier iterations. Kept for context; they all read too
AI and are superseded by the anti-AI prompt above.

### Original — measured literary presenter

```
Warm female voice, mid-thirties. Low mezzo-soprano register with
chest resonance. Soft Edinburgh accent — educated, not heavy brogue.
Unhurried measured pace with thoughtful pauses. Grounded literary
tone, like a late-night BBC Radio 3 presenter who reads poetry.
Precise articulation with gentle warmth. Never theatrical. Perfect
studio audio, no effects.
```

### Revised — soft / deep / conversational (still too AI)

```
Soft, deep female voice, mid-thirties. Low contralto register with
warm chest resonance. Soft Edinburgh accent — educated, gentle,
never heavy. Conversational pace, like speaking quietly across a
small table. Natural rhythm with thoughtful pauses. Intimate and
grounded, like a close friend explaining something complicated, or
a late-night podcast host. Relaxed warm articulation. Never
presenting, never theatrical. Perfect studio audio, no effects.
```

Both of the above produced clean, warm, but recognisably-synthetic
voices. The anti-AI prompt above is the one to use going forward.
