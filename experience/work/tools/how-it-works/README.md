# "How it works" films

Two silent films of about a minute, both made from real footage of the site on a phone:
- **The product film** (`film.html`), the one to publish. The phone moves in 3D and the product's own surfaces lift out of the screen: the question, the two ways to read, the date chips, the check-in and the almanac entry. It also has a deck that fans out, a card that turns once and lands in the reading, kinetic headlines, "A week later" as a date roll, and an end card.
- **The walkthrough** (`stage.html`): the same journey shown plainly on a phone, with step captions. Keep it for the How Olivia works page if a calmer version is wanted.

There are two languages (EN and UK) and two layouts:
- landscape 1920×1080, for desktop;
- portrait 1080×1350, for phones and sharing, with a 720×900 web cut.

Run everything from this folder. The tools import `playwright` from `experience/work/tools/node_modules` (see `SESSION_HANDOFF.md`) and need `ffmpeg` with libx264 and libvpx-vp9 (`apt-get install -y ffmpeg`).

```sh
cd experience/work/tools/how-it-works
# 1. Film the static export on a phone. Seed 17 draws Temperance in both languages.
node capture.mjs ../../../../website/out footage-en en 17
node capture.mjs ../../../../website/out footage-uk uk 17
# 2. Cut: shots, clips, cues, snapshots and words.
node film-timeline.mjs footage-en && node film-timeline.mjs footage-uk
# 3. Check a few moments, then render the near-lossless masters (5 to 7 minutes each).
node render.mjs footage-en landscape stills --stills 3,10.6,12.8,15.3,20.8,28,34.2,36.6,39.9,45,53.8,57.3,61
mkdir -p masters
for lang in en uk; do for layout in landscape portrait; do node render.mjs footage-$lang $layout masters/$lang-$layout.mp4; done; done
# 4. Web files: MP4 (H.264) and WebM (VP9), no audio, with posters.
bash encode.sh masters deliver
```

For the walkthrough, cut with `node timeline.mjs footage-en` and add `--page stage.html` to each `render.mjs` command.

How it is made:
- **`capture.mjs`** films with Chrome's screencast. It saves every repaint with its timestamp, about 60 frames a second while anything moves.
  - It logs scenes and taps on the same clock.
  - It takes snapshots: the position and text of what the film lifts out of the screen.
  - The film starts on a lapis page, as a visitor's previous page would.
  - "A week later" is filmed by moving the page's calendar a week ahead from the next page load. Only `Date` moves; timers and animations run as usual. The saved check-in is then due, and every date on screen is the real one.
  - `seeded.js` makes the shuffle repeatable, for filming only.
- **`film-timeline.mjs`** holds the cut and the words (EN and UK). It writes `film.json` into the footage folder.
  - Clips are named by logged moments, for example `clip('tap:field', -.35, 'snap:question', .1, 1.3)`. If the product's flow changes, adjust the offsets there.
  - Titles break where the words have `\n`.
- **`film.html`** draws any moment of the film from the time alone.
  - Each movement is a list of keyframes tied to the cut's moments (`K.phone`, `K.fanCards`, `K.quote`, and so on in `build()`), so a change in the footage moves the choreography with it.
  - The layout comes from `?layout=landscape|portrait`.
  - A 3D card fades its faces rather than itself: opacity, or `will-change`, on the card would flatten it and show its back through its face.
  - The deck shows Temperance (`card-face.webp`, mapped in `render.mjs`). If a capture draws another card, point it at that card.
- **`render.mjs`** renders frame by frame at 30 fps into a near-lossless master, so the result is the same on every run.
- **`encode.sh`** makes the web files: H.264 (CRF 25, fast start) and VP9 (CRF 36). The WebP poster is the card turned face up.

Footage, masters and deliverables are not committed (`.gitignore`); rebuild them with the steps above.
