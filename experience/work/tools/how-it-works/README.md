# "How it works" film

A silent film of about a minute that walks through the product on a phone. It is made from real footage of the site: the arrival, a question, the choice of a card, the reveal, the reading, keeping it, a check-in, and the return a week later. Captions are set in Olivia's type and colours.

There are two languages (EN and UK) and two layouts:
- landscape 1920×1080, for desktop;
- portrait 1080×1350, for phones and sharing, with a 720×900 web cut.

Run everything from the repository root. The tools import `playwright` from `experience/work/tools/node_modules` (see `SESSION_HANDOFF.md`) and need `ffmpeg` with libx264 and libvpx-vp9 (`apt-get install -y ffmpeg`).

```sh
cd experience/work/tools/how-it-works
# 1. Film the static export on a phone. Seed 17 draws Temperance in both languages.
node capture.mjs ../../../../website/out footage-en en 17
node capture.mjs ../../../../website/out footage-uk uk 17
# 2. Cut: clips, captions, taps, intro and outro.
node timeline.mjs footage-en && node timeline.mjs footage-uk
# 3. Check a few moments, then render the near-lossless masters (about 3.5 minutes each).
node render.mjs footage-en landscape stills --stills 4,14,21,28,36,46,52,58
mkdir -p masters
for lang in en uk; do for layout in landscape portrait; do node render.mjs footage-$lang $layout masters/$lang-$layout.mp4; done; done
# 4. Web files: MP4 (H.264) and WebM (VP9), no audio, with posters.
bash encode.sh masters deliver
```

How it is made:
- **`capture.mjs`** films with Chrome's screencast. It saves every repaint with its timestamp, about 60 frames a second while anything moves. It logs scenes and taps on the same clock.
  - The film starts on a lapis page, as a visitor's previous page would.
  - A due check-in is made by moving the saved check-in date to today, standing in for "a week later".
  - `seeded.js` makes the shuffle repeatable, for filming only.
- **`timeline.mjs`** holds the edit, the step captions (EN and UK) and the timing constants. Clips are named by logged moments, for example `clip('tap:card', -.5, 'tap:card', 1.3)`. If the product's flow changes, adjust the offsets there.
- **`stage.html`** draws any moment of the film from the time alone:
  - the phone, with the footage cross-faded between cuts;
  - a soft light where each tap lands;
  - the captions and the step rail;
  - "A week later", the intro and the outro.
  - The layout comes from `?layout=landscape|portrait`.
- **`render.mjs`** renders frame by frame at 30 fps into a near-lossless master, so the result is the same on every run.
- **`encode.sh`** makes the web files: H.264 (CRF 25, fast start) and VP9 (CRF 36), plus a WebP poster from the revealed card.

Footage, masters and deliverables are not committed (`.gitignore`); rebuild them with the steps above.
