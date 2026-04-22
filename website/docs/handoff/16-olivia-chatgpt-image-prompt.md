# Olivia — ChatGPT Image 2.0 prompt

Purpose: A/B test ChatGPT's new image model against Flux for Olivia's
portrait. Goal is to see if ChatGPT 2.0 beats Flux on realism + can
render Olivia's established identity without the AI tells we
spent this sprint erasing in post.

If ChatGPT 2.0 nails it in-camera, we skip the de-AI post pipeline
entirely for future portraits. If it doesn't, Flux + post stays.

---

## Primary prompt — copy-paste into ChatGPT

```
A photograph of a 35-year-old woman named Olivia. She is an astrologer
— warm, intelligent, quietly self-possessed. Direct gaze into camera.
Neutral expression, the very faintest knowing smile, closed mouth.
NOT smiling broadly.

Facial features — asymmetric and real, not AI-symmetric:
— Dark brunette hair, shoulder-length, slightly wavy, parted
  naturally off-centre, with a few loose strands falling across the
  forehead and one small flyaway on the left
— One eyebrow sits one millimetre higher than the other
— A single small mole on the left cheekbone
— Fine crow's-feet at the outer corners of her eyes, only visible on
  close inspection
— Visible skin pores and natural texture. NO airbrushing. NO
  smoothed skin. Slight redness at the sides of the nose where skin
  naturally flushes
— Eyebrows have natural thin hairs at the edges, not stencilled
— Lips are a soft natural red-brown, slightly cracked texture, no
  gloss, no perfect cupid's bow
— Teeth are not visible (mouth closed). Eyes are hazel-brown with
  naturally uneven pupils, one iris catches the key light more than
  the other

Wardrobe:
— Deep aubergine-purple turtleneck, fine merino knit, shows slight
  natural fabric weave and a tiny pill of lint on one shoulder
— A thin gold chain necklace with a simple gold zodiac coin pendant
  (Libra glyph), sitting against the turtleneck
— A second, finer gold chain above the first

Framing + pose:
— Waist-up composition, shoulders square to camera, head tilted
  one degree. She leans very slightly forward — engaged, not stiff
— Aspect ratio 4:5 (portrait / Instagram portrait)

Lighting:
— Soft key light from camera-left at 45 degrees, like a single
  large softbox or a north-facing window
— Subtle warm rim light on the right side of the hair, not glowing
  or haloed — just a hint of shape separation
— No fill on the right side — the right side of the face sits in
  gentle shadow. Moody but readable
— Light feels natural, not cinematic. No coloured gels. No hard
  rim glare

Background:
— Solid deep black-brown velvet wall, receding into pure darkness
— No cosmic effects. No nebula. No stars. No bokeh shapes. No
  coloured spotlights. Just clean dark atmosphere with subtle
  luminance variation, like a painted studio backdrop
— A faint warm spill from the key light catches the left edge of
  the background, fading off to pure black on the right

Camera + film:
— Shot on a medium-format film camera (Pentax 67 or Mamiya RZ67)
  with a 105mm f/2.4 lens, wide open
— Shallow depth of field — face tack-sharp, hair tips softening
  into focus, background completely out of focus
— Kodak Portra 400 film palette: warm skin midtones, slightly
  cool shadows, rolled highlights (never blown to pure white),
  lifted blacks (never crushed to pure black)
— Visible organic film grain, especially in the shadows
— Slight warm halation around the brightest skin highlights,
  characteristic of halation-layer film
— Barely perceptible chromatic aberration at the frame edges

Post:
— No Photoshop smoothing. No frequency separation. No AI touch-up
— Contrast is natural and filmic, not punched or teal-and-orange
— Overall mood: editorial, quiet, trustworthy. Think Peter
  Lindbergh's black-and-white documentary portraits, but in subdued
  warm colour. Or Paolo Roversi's intimate film portraits

Explicitly avoid:
— AI sheen, plastic skin, flawless symmetry, over-smoothed
  complexion, uncanny-valley teeth, glass-bead eyes, perfect
  makeup, glamour-magazine lighting, cinematic rim-light halos,
  digital starfield backgrounds, fantasy / witchy / mystic props,
  tarot cards, crystals, incense
— Stock-photo "astrologer" clichés

She is a serious editorial portrait, not a brand mascot.
```

**~580 words.** Dense, specific, hardened against the AI tells we
know this model defaults to.

---

## Variant A — tighter headshot (shoulders only)

Swap the framing section:

```
Framing + pose:
— Tight shoulder-up portrait, head fills the upper two-thirds of
  the frame, tops of the collarbones visible at the bottom
— Aspect ratio 4:5
— Slight three-quarter angle — her body is turned 8 degrees from
  camera, head rotated back to face us square. Classic editorial
  stance
```

Use if the waist-up composition renders the hands or hands-visible
area awkwardly. Hands are one of the remaining AI tells that a
tighter crop sidesteps entirely.

---

## Variant B — Lindbergh documentary direction

If the primary renders too "studio" / too polished, swap the
lighting + post blocks:

```
Lighting:
— Single overhead natural light from above-left — like afternoon
  window light filtered through a sheer curtain
— Hard-ish transition between lit and shadow sides of the face,
  dramatic but not harsh
— No fill. Right side of face drops into deep shadow at the jawline

Background:
— Raw dark concrete wall or unfinished plaster, very slightly
  textured, completely out of focus. Industrial, not theatrical.
  Uneven lighting across the wall — left side catches the key,
  right fades to near-black

Post:
— Shot on Ilford HP5 black-and-white film, then very gently tinted
  warm — a barely-colour image, closer to B&W than colour
— Heavy organic grain, especially shadows
— Low saturation throughout. Skin reads warm but muted
— Think: Peter Lindbergh's Vogue editorials circa 1995
```

---

## Delivery notes to ChatGPT

Paste these as a follow-up message after the first generation:

1. **If the face is too symmetric**: "Regenerate. The face is too
   symmetric — make her features noticeably asymmetric, specifically:
   left eye slightly smaller, left eyebrow higher, nose not
   centred."

2. **If the skin is too smooth**: "Regenerate with more visible skin
   texture — pores, fine lines around the eyes, slight unevenness
   in complexion. She's 35, not 25."

3. **If there's a cosmic / nebula background**: "Regenerate with
   a SOLID DARK BACKGROUND. No stars, no nebula, no cosmic effects.
   Just a plain dark-brown or black studio backdrop."

4. **If teeth show**: "Her mouth is closed — no teeth visible at all."

5. **If the hair is too perfect**: "Regenerate with more natural hair
   — loose strands, a flyaway or two, one side slightly messier
   than the other. Real hair, not salon hair."

---

## What to compare against

Generate 3–5 takes, then A/B against the current shipped portrait
at `public/olivia/portrait.jpg` (Flux + 7-stage post pipeline).
Winners of the comparison:

- **ChatGPT wins** → use ChatGPT for future portraits, skip post
- **Flux+post wins** → stay on current pipeline, this was an experiment
- **Tie** → ChatGPT becomes the primary (one step vs many), Flux becomes
  fallback

---

## Cost

- ChatGPT Plus: image generation is included in the Plus plan up to
  daily limits. Free for this test.
- 5 takes costs nothing extra.
- If you end up regenerating daily cards etc. via ChatGPT, you'll
  hit the daily limit — in that case move to API billing.

---

## After picking the winner

1. Download the winning PNG/JPG at highest resolution available
2. Save as `/tmp/olivia-chatgpt-raw.png`
3. Run through `scripts/deai/portrait.py` ONLY IF the output still
   reads AI. If ChatGPT 2.0 delivers a genuinely film-like result
   out of the box, skip the post entirely:

   ```bash
   # skip post, straight to deploy
   cp /tmp/olivia-chatgpt-raw.png public/olivia/portrait.jpg
   # or convert to jpg if it came out as png
   ffmpeg -i /tmp/olivia-chatgpt-raw.png -q:v 2 public/olivia/portrait.jpg
   ```

4. If it doesn't land the film look alone, run `portrait.py` on it.
   The script starts from whatever is at
   `/tmp/portrait-pre-degrade.jpg` — just replace that file and run.

---

## Reminder — what made Flux + post work

So you know what to match or beat:

- Near-black Avedon background (no cosmic noise)
- Portra-400 warm-mid, cool-shadow split tone
- Visible skin pore texture + chroma noise (breaks plastic skin)
- Lifted blacks (~3.8%) + rolled highlights (~38% above 0.86)
- Dual-frequency grain, shadow-weighted
- Warm halation around brights
- Subtle chromatic aberration at corners
- No rim-light halo around hair
- Asymmetric, slightly imperfect features

If ChatGPT 2.0 gives all of these without the script, it wins.
