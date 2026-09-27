// Cut the captured footage into the film: clips (source range and speed),
// captions per step, the taps that fall inside clips, the "a week later"
// interlude, an intro and an outro. Writes <footage>/timeline.json.
import fs from 'node:fs';
import path from 'node:path';

const [footageDir = 'footage-en'] = process.argv.slice(2);
const footage = JSON.parse(fs.readFileSync(path.join(footageDir, 'footage.json'), 'utf8'));
const {events, frames, lang} = footage;

const COPY = {
 en: {
  intro: 'How it works',
  week: 'A week later',
  promise: ['Bring a question. Choose your cards.', 'Keep what you notice, and return to see what changed.'],
  site: 'oliviaarcana.com',
  steps: [
   ['Bring a question.', 'Write what is on your mind, or simply arrive as you are.'],
   ['Choose how to read.', 'One card for a fresh perspective, or a spread when a question has several sides.'],
   ['Choose your card.', 'From the full 78-card deck. Turn it when you are ready.'],
   ['Read what it suggests.', 'Reflections for your question, never predictions. You decide what fits.'],
   ['Keep what you notice.', 'Your almanac stays on this device. Choose a day to look again.'],
   ['Return to see what changed.', 'When the day comes, Olivia asks how it turned out.'],
  ],
 },
 uk: {
  intro: 'Як це працює',
  week: 'За тиждень',
  promise: ['Поставте запитання. Оберіть карти.', 'Збережіть те, що помітили, і поверніться, щоб побачити, що змінилося.'],
  site: 'oliviaarcana.com/uk',
  steps: [
   ['Поставте запитання.', 'Напишіть, що у вас на думці, або просто зупиніться на мить.'],
   ['Оберіть, як читати.', 'Одна карта — для свіжого погляду, розклад — коли запитання має кілька сторін.'],
   ['Оберіть свою карту.', 'З повної колоди з 78 карт. Переверніть її, коли будете готові.'],
   ['Прочитайте, що вона підказує.', 'Роздуми для вашого запитання, а не передбачення. Що вам підходить, вирішуєте ви.'],
   ['Збережіть те, що помітили.', 'Альманах залишається на вашому пристрої. Оберіть день, щоб повернутися.'],
   ['Поверніться, щоб побачити, що змінилося.', 'Коли настане цей день, Olivia запитає, як усе склалося.'],
  ],
 },
}[lang];

// Resolve "scene:arrive", "tap:draw", "tap:draw#2", "type#2", "end" to capture times.
function at(ref) {
 const [kind, rest = ''] = ref.split(':');
 const [label, nth = '1'] = rest.split('#');
 if (kind === 'end') return events.find(e => e.type === 'end').t;
 if (kind === 'type') return events.filter(e => e.type === 'type')[Number(label || 1) - 1].t;
 const list = events.filter(e => e.type === kind && (e.label === label || e.name === label));
 const found = list[Number(nth) - 1];
 if (!found) throw new Error(`No event ${ref}`);
 return found.t;
}
const clip = (from, fromOffset, to, toOffset, speed = 1) => ({src: [at(from) + fromOffset, at(to) + toOffset], speed});

// step index -> clips. Offsets are seconds around the logged moments.
const plan = [
 [0, [clip('scene:arrive', .15, 'scene:arrive', 4.2), clip('tap:draw', -.45, 'tap:draw', 1.35), clip('tap:field', -.4, 'tap:continue', .1, 1.25)]],
 [1, [clip('tap:continue', .15, 'tap:choose', .55)]],
 [2, [clip('scene:choose', .2, 'scene:choose', 3.4), clip('tap:card', -.5, 'tap:card', 1.3), clip('tap:reveal', -.35, 'tap:reveal', 2.9)]],
 [3, [clip('tap:reveal', 2.9, 'tap:reveal', 4.2), clip('scene:read', 0, 'scene:keep', 0, 1.25)]],
 [4, [clip('scene:keep', 0, 'tap:week', 1.9, 1.2)]],
 ['week'],
 [5, [clip('tap:menu', -1.8, 'tap:menu', 1.7), clip('tap:draw#2', -.3, 'tap:draw#2', 1.6), clip('tap:waiting', -.6, 'tap:waiting', .9), clip('tap:outcome', -.8, 'tap:kept', 1.6, 1.5), clip('tap:almanac', -.2, 'tap:almanac', 2.4)]],
];

const FADE = .3, INTRO = 2.6, WEEK = 1.6, OUTRO = 4.2;
const clips = [], captions = [], taps = [];
let t = INTRO, week = null;
for (const [step, list] of plan) {
 if (step === 'week') { week = [t, t + WEEK]; t += WEEK; continue; }
 const start = t;
 for (const c of list) {
  const duration = (c.src[1] - c.src[0]) / c.speed;
  clips.push({step, out: [t, t + duration], src: c.src, speed: c.speed});
  for (const tap of events.filter(e => e.type === 'tap' && e.t >= c.src[0] && e.t <= c.src[1])) {
   taps.push({label: tap.label, x: tap.x, y: tap.y, t: t + (tap.t - c.src[0]) / c.speed});
  }
  t += duration + FADE;
 }
 captions.push({step, out: [start, t - FADE]});
}
const outroStart = t - FADE;
const duration = outroStart + OUTRO;

// Each clip's frames: the file shown at source time s is the last repaint at or before s.
const used = new Set();
for (const c of clips) {
 c.frames = [];
 for (const f of frames) if (f.t >= c.src[0] - 1 && f.t <= c.src[1]) c.frames.push([f.t, f.file]);
 const before = frames.filter(f => f.t <= c.src[0]).at(-1);
 if (before && !c.frames.some(([time]) => time === before.t)) c.frames.unshift([before.t, before.file]);
 c.frames.forEach(([, file]) => used.add(file));
}
const timeline = {lang, fps: 30, duration, fade: FADE, intro: INTRO, week, outro: [outroStart, duration], viewport: footage.viewport, copy: COPY, clips, captions, taps};
fs.writeFileSync(path.join(footageDir, 'timeline.json'), JSON.stringify(timeline));
console.log(`${lang}: ${duration.toFixed(1)} s, ${clips.length} clips, ${taps.length} taps, ${used.size} frames used`);
for (const c of captions) console.log(`  step ${c.step + 1}: ${c.out[0].toFixed(1)}–${c.out[1].toFixed(1)} s  ${COPY.steps[c.step][0]}`);
