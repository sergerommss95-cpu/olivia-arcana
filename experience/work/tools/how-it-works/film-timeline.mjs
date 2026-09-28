// The cut for the cinematic film (film.html): shots, the footage each shot shows
// on the phone, the moments ("cues") the choreography follows, the snapshots of
// what pops out of the screen, and the words. Writes <footage>/film.json.
import fs from 'node:fs';
import path from 'node:path';

const [footageDir = 'footage-en'] = process.argv.slice(2);
const footage = JSON.parse(fs.readFileSync(path.join(footageDir, 'footage.json'), 'utf8'));
const {events, frames, lang} = footage;

const WORDS = {
 // Titles break where "\n" is.
 en: {
  open: ['For the questions', 'that stay with you.'],
  shots: {
   question: ['Bring a question.', 'Write what is on your mind, or simply arrive as you are.'],
   prepare: ['One card,\nor a spread.', 'Choose what your question needs.'],
   deck: ['Choose your card.', 'From the full 78-card deck.'],
   turn: ['Turn it when\nyou are ready.', 'A card is revealed once.'],
   read: ['Read what\nit suggests.', 'Reflections for your question, never predictions.'],
   keep: ['Keep what\nyou notice.', 'Then choose a day to look again.'],
   return: ['Return to see\nwhat changed.', 'When the day comes, Olivia asks how it turned out.'],
   almanac: ['Your almanac\nremembers.', 'Readings, notes and check-ins, kept on this device.'],
  },
  week: 'A week later',
  promise: ['Bring a question. Choose your cards.', 'Keep what you notice, and return to see what changed.'],
  site: 'oliviaarcana.com',
  saved: 'Saved',
 },
 uk: {
  open: ['Для запитань,', 'які залишаються з вами.'],
  shots: {
   question: ['Поставте\nзапитання.', 'Напишіть, що у вас на думці, або просто зупиніться на мить.'],
   prepare: ['Одна карта\nчи розклад.', 'Оберіть те, що потрібно вашому запитанню.'],
   deck: ['Оберіть\nсвою карту.', 'З повної колоди з 78 карт.'],
   turn: ['Переверніть,\nколи будете готові.', 'Карта відкривається один раз.'],
   read: ['Прочитайте,\nщо вона підказує.', 'Роздуми для вашого запитання, а не передбачення.'],
   keep: ['Збережіть те,\nщо помітили.', 'І оберіть день, щоб повернутися.'],
   return: ['Поверніться,\nщоб побачити,\nщо змінилося.', 'Коли настане цей день, Olivia запитає, як усе склалося.'],
   almanac: ['Ваш альманах\nпам’ятає.', 'Читання, нотатки й повернення зберігаються на цьому пристрої.'],
  },
  week: 'За тиждень',
  promise: ['Поставте запитання. Оберіть карти.', 'Збережіть те, що помітили, і поверніться, щоб побачити, що змінилося.'],
  site: 'oliviaarcana.com/uk',
  saved: 'Збережено',
 },
}[lang];

// Resolve "tap:draw", "tap:draw#2", "snap:home", "scene:read", "end" to capture times.
function at(ref) {
 if (ref === 'end') return events.find(e => e.type === 'end').t;
 const [kind, rest] = ref.split(':');
 const [label, nth = '1'] = rest.split('#');
 const found = events.filter(e => e.type === kind && (e.label === label || e.name === label))[Number(nth) - 1];
 if (!found) throw new Error(`No event ${ref}`);
 return found.t;
}
const clip = (from, fo, to, tOff, speed = 1) => ({src: [at(from) + fo, at(to) + tOff], speed});
const hold = (ref, offset, seconds) => ({src: [at(ref) + offset, at(ref) + offset], speed: 1, hold: seconds});

// Shots in order. A shot with "length" is built from brand assets and may hold one frame.
const plan = [
 ['open', {length: 5.0, clips: [hold('snap:home', 0, 5.0)]}],
 ['question', {clips: [hold('snap:home', 0, .5), clip('tap:draw', -.45, 'tap:draw', 1.2), clip('tap:field', -.35, 'snap:question', .1, 1.3), clip('snap:question', .1, 'tap:continue', .35)]}],
 ['prepare', {clips: [clip('tap:continue', .2, 'tap:choose', .45)]}],
 ['deck', {length: 4.6, clips: [hold('tap:choose', .45, 4.6)]}],
 ['turn', {length: 4.6, clips: [hold('snap:reading', 0, 4.6)]}],
 ['read', {clips: [hold('snap:reading', 0, .4), clip('scene:read', 0, 'snap:prompt', .5, 1.35), hold('snap:prompt', .5, 2.4)]}],
 ['keep', {clips: [clip('scene:keep', .2, 'snap:chooser', .1, 1.25), clip('snap:chooser', .1, 'snap:chosen', .3), hold('snap:chosen', .3, 1.6)]}],
 ['week', {length: 2.6, clips: [hold('snap:dot', -.2, 2.6)]}],
 ['return', {clips: [clip('snap:dot', -.2, 'tap:menu', -.05), clip('tap:draw#2', -.3, 'tap:draw#2', .5), clip('snap:waiting', -1.2, 'tap:waiting', .75), clip('snap:return', -.3, 'snap:outcome', .05, 1.5), clip('snap:outcome', .05, 'snap:kept', .5), hold('snap:kept', .5, .9)]}],
 ['almanac', {clips: [clip('tap:almanac', -.1, 'snap:almanac', 1.0), hold('snap:almanac', 1.0, 1.8)]}],
 ['end', {length: 4.8, clips: [hold('snap:almanac', 1.0, 4.8)]}],
];

const FADE = .22;
const shots = [], clips = [], cues = {};
let t = 0;
for (const [id, spec] of plan) {
 const start = t;
 spec.clips.forEach((c, i) => {
  const duration = c.hold ?? (c.src[1] - c.src[0]) / c.speed;
  clips.push({shot: id, out: [t, t + duration], src: c.src, speed: c.hold ? 0 : c.speed});
  for (const e of events.filter(e => e.type !== 'end' && e.t >= c.src[0] - 1e-6 && e.t <= c.src[1] + 1e-6)) {
   const key = e.type === 'tap' ? `tap:${e.label}` : e.type === 'snap' ? `snap:${e.name}` : e.type === 'scene' ? `scene:${e.name}` : e.type;
   const when = t + (c.hold ? 0 : (e.t - c.src[0]) / c.speed);
   (cues[key] ??= []).push(when);
  }
  t += duration + (i < spec.clips.length - 1 ? FADE : 0);
 });
 if (spec.length) t = Math.max(t, start + spec.length);
 shots.push({id, start, end: t});
}
const duration = t;
// Taps shown as light on the phone: those inside clips that play.
const taps = [];
for (const c of clips) if (c.speed) for (const e of events.filter(e => e.type === 'tap' && e.t >= c.src[0] && e.t <= c.src[1])) taps.push({label: e.label, x: e.x, y: e.y, t: c.out[0] + (e.t - c.src[0]) / c.speed});
for (const c of clips) {
 c.frames = frames.filter(f => f.t >= c.src[0] - 1 && f.t <= c.src[1]).map(f => [f.t, f.file]);
 const before = frames.filter(f => f.t <= c.src[0]).at(-1);
 if (before && !c.frames.some(([time]) => time === before.t)) c.frames.unshift([before.t, before.file]);
}
const snaps = Object.fromEntries(events.filter(e => e.type === 'snap').map(e => [e.name, e.data]));

// "A week later": the day of the reading rolls to the chosen day, as the product writes them.
const captured = new Date(events[0].t * 1000);
const weekday = date => lang === 'uk'
 ? (s => s[0].toLocaleUpperCase() + s.slice(1))(`${date.toLocaleDateString('uk-UA', {weekday: 'long'})}, ${date.toLocaleDateString('uk-UA', {day: 'numeric', month: 'long'})}`)
 : date.toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
const roll = [weekday(captured), snaps.chosen.title[0].text];

fs.writeFileSync(path.join(footageDir, 'film.json'), JSON.stringify({lang, fps: 30, duration, fade: FADE, viewport: footage.viewport, words: WORDS, roll, shots, clips, cues, taps, snaps}));
console.log(`${lang}: ${duration.toFixed(1)} s, ${shots.length} shots, ${clips.length} clips`);
for (const s of shots) console.log(`  ${s.id.padEnd(9)} ${s.start.toFixed(1).padStart(5)}–${s.end.toFixed(1).padStart(5)} s`);
console.log('  roll:', roll.join(' → '));
