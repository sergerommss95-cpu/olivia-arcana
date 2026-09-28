import {getLocale,t} from './locale.js';
import {loadRecords} from './core.js';
import {loadSpreadRecords} from './spread-core.js';
import {loadMetadata,getMetadata,saveMetadata,listRevisits,localDate} from './practice-core.js';
import {nextLunarCheckIns} from './lunar-checkin.js';
import {mountCheckInReminder} from './followup-reminder.js';

/**
 * Check-ins: the last step of the promise, "return to see what changed".
 * Once a reading is kept, one tap sets when to look at it again. When that day
 * comes, the reading asks how it turned out, and the Today links, the phone menu
 * and the question step say that a check-in is waiting. Everything lives in the
 * practice metadata on this device (revisitDate, outcome, reviewedAt). Nothing
 * is sent anywhere and nothing notifies.
 */

export const CHECK_IN_CHOICES = [['days3', 3], ['week', 7], ['month', 30]];

const COPY = {
 en: {
  chooseEyebrow: 'Return to see what changed',
  chooseTitle: 'Look at this again in…',
  choices: {days3: '3 days', week: 'A week', month: 'A month'},
  moon: {new: 'New moon', full: 'Full moon'},
  other: 'Another date',
  otherLabel: 'Choose a date',
  promise: 'It will wait for you in Today, where Olivia asks what changed. No notifications are sent.',
  yours: 'Your check-in',
  change: 'Change the date',
  keepDate: 'Keep this date',
  remove: 'No check-in',
  notNow: 'Not now',
  set: date => `Check-in set for ${date}.`,
  cleared: 'No check-in is set.',
  reviewed: date => `You came back on ${date}.`,
  again: 'Plan another check-in',
  dueEyebrow: date => `Your check-in · ${date}`,
  how: 'How did it turn out?',
  askedOn: date => `On ${date} you asked:`,
  readingFrom: date => `This reading is from ${date}.`,
  quote: text => `“${text}”`,
  step: 'Your next step:',
  label: 'What happened, and how do you see it now?',
  placeholder: 'What changed, what helped, how I see it now…',
  keep: 'Keep what changed',
  later: 'Not yet — ask me again in a week',
  required: 'Write a few words first, or choose “Not yet”.',
  kept: 'Kept with this reading.',
  keptNote: 'It’s in your almanac now, beside the cards. Only on this device.',
  newQuestion: 'Bring a new question',
  almanac: 'Open my almanac',
  next: date => `Your next check-in: ${date}.`,
  nextNote: 'It will be waiting in Today.',
  error: 'This could not be saved on this device. Nothing else was changed.',
  waiting: count => count === 1 ? '1 check-in waiting' : `${count} check-ins waiting`,
  notice: 'A check-in is waiting',
  from: date => `Reading from ${date}`,
 },
 uk: {
  chooseEyebrow: 'Поверніться, щоб побачити, що змінилося',
  chooseTitle: 'Погляньте на це знову через…',
  choices: {days3: '3 дні', week: 'Тиждень', month: 'Місяць'},
  moon: {new: 'Молодик', full: 'Повня'},
  other: 'Інша дата',
  otherLabel: 'Оберіть дату',
  promise: 'Читання чекатиме на вас у розділі «Сьогодні», де Olivia запитає, що змінилося. Сповіщення не надсилаються.',
  yours: 'Ваше повернення',
  change: 'Змінити дату',
  keepDate: 'Залишити цю дату',
  remove: 'Без повернення',
  notNow: 'Не зараз',
  set: date => `Повернення заплановано: ${date}.`,
  cleared: 'Повернення не заплановано.',
  reviewed: date => `Ви повернулися ${date}.`,
  again: 'Запланувати ще одне повернення',
  dueEyebrow: date => `Ваше повернення · ${date}`,
  how: 'Як усе склалося?',
  askedOn: date => `${date} ви запитали:`,
  readingFrom: date => `Це читання від ${date}.`,
  quote: text => `«${text}»`,
  step: 'Ваш наступний крок:',
  label: 'Що сталося і як ви бачите це тепер?',
  placeholder: 'Що змінилося, що допомогло, як я бачу це тепер…',
  keep: 'Зберегти, що змінилося',
  later: 'Ще ні — запитати знову за тиждень',
  required: 'Спершу напишіть кілька слів або оберіть «Ще ні».',
  kept: 'Збережено разом із цим читанням.',
  keptNote: 'Тепер це у вашому альманасі, поруч із картами. Лише на цьому пристрої.',
  newQuestion: 'Поставити нове запитання',
  almanac: 'Відкрити альманах',
  next: date => `Наступне повернення: ${date}.`,
  nextNote: 'Воно чекатиме на вас у розділі «Сьогодні».',
  error: 'Не вдалося зберегти на цьому пристрої. Нічого іншого не змінено.',
  waiting: count => {
   const form = new Intl.PluralRules('uk').select(count);
   return form === 'one' ? `на вас чекає ${count} повернення` : `на вас чекають ${count} ${form === 'many' ? 'повернень' : 'повернення'}`;
  },
  notice: 'На вас чекає повернення',
  from: date => `Читання від ${date}`,
 },
};

export const checkInCopy = (locale = getLocale()) => COPY[locale === 'uk' ? 'uk' : 'en'];

/** Calendar arithmetic on YYYY-MM-DD dates, free of time zones and clock changes. */
export function addDays(date, days) {
 if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(days)) throw new TypeError('Use a YYYY-MM-DD date and a whole number of days.');
 const [year, month, day] = date.split('-').map(Number);
 const result = new Date(Date.UTC(year, month - 1, day + days));
 return `${String(result.getUTCFullYear()).padStart(4, '0')}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-${String(result.getUTCDate()).padStart(2, '0')}`;
}

/** 'none', 'upcoming', 'due' or 'reviewed' for one reading's practice metadata. */
export function checkInStatus(meta, today = localDate()) {
 if (meta?.reviewedAt) return 'reviewed';
 if (!meta?.revisitDate) return 'none';
 return meta.revisitDate <= today ? 'due' : 'upcoming';
}

/** Due, unreviewed check-ins whose reading is still kept, oldest first. */
export function dueCheckIns({metadata, singles = [], spreads = [], today = localDate()}) {
 const kept = new Map([...singles.map(record => [`single:${record.id}`, {kind: 'single', record}]), ...spreads.map(record => [`spread:${record.id}`, {kind: 'spread', record}])]);
 return listRevisits(metadata, today).due.filter(meta => kept.has(`${meta.kind}:${meta.id}`)).map(meta => ({...kept.get(`${meta.kind}:${meta.id}`), meta}));
}

const intlLocale = locale => locale === 'uk' ? 'uk-UA' : undefined;
const capital = text => text.charAt(0).toLocaleUpperCase() + text.slice(1);
/** "Saturday, 4 October" (with weekday) or "4 October", in the page's language. */
export function formatDay(date, locale = getLocale(), {weekday = false} = {}, format = intlLocale(locale)) {
 const day = new Date(`${date}T12:00:00`);
 // Some ICU versions put a Ukrainian weekday in the accusative («неділю») when it
 // precedes a date; a heading needs the stand-alone form («неділя, 4 жовтня»).
 if (weekday && locale === 'uk') return `${day.toLocaleDateString(format, {weekday: 'long'})}, ${day.toLocaleDateString(format, {day: 'numeric', month: 'long'})}`;
 return day.toLocaleDateString(format, weekday ? {weekday: 'long', day: 'numeric', month: 'long'} : {day: 'numeric', month: 'long'});
}
const moonDay = (date, locale) => new Intl.DateTimeFormat(locale === 'uk' ? 'uk-UA' : 'en-GB', {day: 'numeric', month: 'short'}).format(new Date(`${date}T12:00:00`));

const node = (tag, className, text) => {
 const element = document.createElement(tag);
 if (className) element.className = className;
 if (text !== undefined) element.textContent = text;
 return element;
};
const button = (className, text) => {
 const element = node('button', className, text);
 element.type = 'button';
 return element;
};
const glyph = (tag, text, className) => {
 const element = node(tag, className, text);
 element.setAttribute('aria-hidden', 'true');
 return element;
};
const resolve = storage => typeof storage === 'function' ? storage() : storage;
const readingName = entry => t(entry.kind === 'single' ? entry.record.cardName : entry.record.spreadName || '');
const createdDay = record => {
 const created = new Date(record?.createdAt);
 return Number.isFinite(created.getTime()) ? localDate(created) : null;
};

function announce(kind, id, meta) {
 dispatchEvent(new CustomEvent('olivia:check-in-change', {detail: {kind, id, meta}}));
 dispatchEvent(new Event('olivia:journal-change'));
}

// One live mount per role and kind: a new reading replaces the previous listeners.
const mounts = new Map();
function claim(key) {
 mounts.get(key)?.abort();
 const controller = new AbortController();
 mounts.set(key, controller);
 return controller.signal;
}

function context(kind, record, storage) {
 const get = () => resolve(storage);
 return {
  kept() {
   try { return (kind === 'single' ? loadRecords(get()) : loadSpreadRecords(get())).some(saved => saved.id === record.id); }
   catch { return false; }
  },
  read() {
   try { return getMetadata(loadMetadata(get()), kind, record.id); }
   catch { return null; }
  },
  write(fields) {
   const meta = saveMetadata(get(), {kind, id: record.id, ...fields});
   announce(kind, record.id, meta);
   return meta;
  },
 };
}

/**
 * After a reading is kept: one choice of when to look again (a few days, a week,
 * a month, the next new or full moon, or a date), then the chosen day with a way
 * to change it or add it to a calendar. Hidden until the reading is kept.
 */
export function mountCheckInChooser({kind, record, after, storage = () => localStorage, locale = getLocale(), today = () => localDate(), now = () => new Date()}) {
 const signal = claim('chooser:' + kind);
 document.querySelector(`.check-in-next[data-kind="${kind}"]`)?.remove();
 if (!record?.id || !after?.isConnected) return null;
 const c = checkInCopy(locale), data = context(kind, record, storage), titleId = `check-in-next-title-${kind}`;
 const section = node('section', 'check-in-next');
 section.dataset.kind = kind;
 section.dataset.noTranslate = 'true';
 section.setAttribute('aria-labelledby', titleId);
 const content = node('div', 'check-in-content'), status = node('p', 'check-in-status sr-only');
 status.setAttribute('role', 'status');
 section.append(content, status);
 after.after(section);
 let editing = false;

 function choose(date) {
  editing = false;
  try {
   const meta = data.write(date ? {revisitDate: date, reviewedAt: null} : {revisitDate: ''});
   status.textContent = meta.revisitDate ? c.set(formatDay(meta.revisitDate, locale, {weekday: true})) : c.cleared;
  } catch { status.textContent = c.error; }
  paint();
  section.querySelector('h3')?.focus({preventScroll: true});
 }

 function chooser(meta) {
  const title = node('h3', '', c.chooseTitle);
  title.id = titleId;
  title.tabIndex = -1;
  const choices = node('div', 'check-in-choices');
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-labelledby', titleId);
  const day = today();
  for (const [id, days] of CHECK_IN_CHOICES) {
   const choice = button('check-in-choice', c.choices[id]);
   choice.dataset.days = String(days);
   choice.addEventListener('click', () => choose(addDays(day, days)));
   choices.append(choice);
  }
  let moons = [];
  try { moons = nextLunarCheckIns(now()); } catch {}
  for (const moon of moons) {
   if (moon.date <= day) continue;
   const choice = button('check-in-choice check-in-moon');
   const disc = node('span', `lunar-disc ${moon.phase}`);
   disc.setAttribute('aria-hidden', 'true');
   choice.append(disc, document.createTextNode(`${c.moon[moon.phase]} · ${moonDay(moon.date, locale)}`));
   choice.dataset.date = moon.date;
   choice.addEventListener('click', () => choose(moon.date));
   choices.append(choice);
  }
  const other = button('check-in-choice check-in-other', c.other);
  other.setAttribute('aria-expanded', 'false');
  choices.append(other);
  const picker = node('label', 'check-in-date');
  picker.hidden = true;
  const input = node('input');
  input.type = 'date';
  input.min = addDays(day, 1);
  input.max = addDays(day, 730);
  if (meta.revisitDate > day) input.value = meta.revisitDate;
  picker.append(node('span', '', c.otherLabel), input);
  other.addEventListener('click', () => {
   picker.hidden = !picker.hidden;
   other.setAttribute('aria-expanded', String(!picker.hidden));
   if (!picker.hidden) input.focus();
  });
  input.addEventListener('change', () => {
   if (input.value && input.value >= input.min && input.value <= input.max) choose(input.value);
  });
  content.append(node('p', 'eyebrow', c.chooseEyebrow), title, choices, picker);
  if (editing && (meta.revisitDate || meta.reviewedAt)) {
   const reviewed = checkInStatus(meta, day) === 'reviewed';
   const actions = node('div', 'check-in-actions'), keep = button('check-in-link', reviewed ? c.notNow : c.keepDate);
   keep.addEventListener('click', () => { editing = false; paint(); section.querySelector('h3')?.focus({preventScroll: true}); });
   actions.append(keep);
   if (!reviewed) {
    const remove = button('check-in-link', c.remove);
    remove.addEventListener('click', () => choose(''));
    actions.append(remove);
   }
   content.append(actions);
  }
  content.append(node('p', 'check-in-note', c.promise));
 }

 function chosen(meta, state) {
  const title = node('h3', '', state === 'reviewed' ? c.reviewed(formatDay(localDate(new Date(meta.reviewedAt)), locale)) : capital(formatDay(meta.revisitDate, locale, {weekday: true})));
  title.id = titleId;
  title.tabIndex = -1;
  const actions = node('div', 'check-in-actions'), change = button('check-in-link', state === 'reviewed' ? c.again : c.change);
  change.addEventListener('click', () => { editing = true; paint(); section.querySelector('.check-in-choice')?.focus({preventScroll: true}); });
  actions.append(change);
  content.append(node('p', 'eyebrow', c.yours), title);
  if (state !== 'reviewed') content.append(node('p', 'check-in-note', c.promise));
  content.append(actions);
  if (state !== 'reviewed') {
   const host = node('div', 'checkin-reminder-host');
   content.append(host);
   try { mountCheckInReminder(host, {date: meta.revisitDate, kind, id: record.id, locale: locale === 'uk' ? 'uk' : 'en'}); } catch { host.remove(); }
  }
 }

 function paint() {
  content.replaceChildren();
  const meta = data.kept() ? data.read() : null;
  section.hidden = !meta;
  if (!meta) return;
  const state = checkInStatus(meta, today());
  section.dataset.state = editing ? 'choosing' : state;
  if (editing || state === 'none') chooser(meta);
  else chosen(meta, state);
 }

 for (const type of ['olivia:journal-change', 'olivia:practice-save', 'olivia:check-in-change']) addEventListener(type, () => { if (section.isConnected) paint(); }, {signal});
 paint();
 return section;
}

/**
 * On a reading whose check-in has come: "How did it turn out?", with the
 * question, the next step the visitor wrote, and room to keep what changed.
 */
export function mountCheckInReturn({kind, record, before, storage = () => localStorage, locale = getLocale(), today = () => localDate(), now = () => new Date()}) {
 const signal = claim('return:' + kind);
 document.querySelector(`.check-in-return[data-kind="${kind}"]`)?.remove();
 if (!record?.id || !before?.isConnected) return null;
 const c = checkInCopy(locale), data = context(kind, record, storage), titleId = `check-in-return-title-${kind}`;
 const section = node('section', 'check-in-return');
 section.dataset.kind = kind;
 section.dataset.noTranslate = 'true';
 section.setAttribute('aria-labelledby', titleId);
 section.hidden = true;
 const content = node('div', 'check-in-content'), status = node('p', 'check-in-status');
 status.setAttribute('role', 'status');
 section.append(content, status);
 before.before(section);
 let settled = null, draft = null;

 const heading = text => {
  const title = node('h2', '', text);
  title.id = titleId;
  title.tabIndex = -1;
  return title;
 };

 function paint() {
  content.replaceChildren();
  const meta = data.kept() ? data.read() : null;
  if (!meta || (!settled && checkInStatus(meta, today()) !== 'due')) {
   section.hidden = true;
   return;
  }
  section.hidden = false;
  if (settled) {
   const done = settled.kind === 'kept';
   content.append(node('p', 'eyebrow', c.dueEyebrow(formatDay(settled.date, locale))), heading(done ? c.kept : c.next(capital(formatDay(meta.revisitDate, locale, {weekday: true})))), node('p', 'check-in-note', done ? c.keptNote : c.nextNote));
   if (done) {
    const actions = node('div', 'check-in-actions'), ask = node('a', 'solid-action'), almanac = node('a', 'check-in-link', c.almanac);
    ask.href = '#question';
    ask.append(document.createTextNode(c.newQuestion + ' '), glyph('span', '↗'));
    almanac.href = '#journal';
    actions.append(ask, almanac);
    content.append(actions);
   }
   return;
  }
  content.append(node('p', 'eyebrow', c.dueEyebrow(formatDay(meta.revisitDate, locale))), heading(c.how));
  const asked = createdDay(record), question = (record.question || '').trim();
  if (asked && question) content.append(node('p', 'check-in-context', c.askedOn(formatDay(asked, locale))), node('p', 'check-in-question', c.quote(question)));
  else if (asked) content.append(node('p', 'check-in-context', c.readingFrom(formatDay(asked, locale))));
  if (meta.nextStep.trim()) {
   const step = node('p', 'check-in-step');
   step.append(node('span', '', c.step + ' '), document.createTextNode(c.quote(meta.nextStep.trim())));
   content.append(step);
  }
  const form = node('form', 'check-in-form'), label = node('label', '', c.label), field = node('textarea');
  field.id = `check-in-outcome-${kind}`;
  label.htmlFor = field.id;
  field.rows = 4;
  field.maxLength = 2000;
  field.placeholder = c.placeholder;
  field.value = draft ?? meta.outcome;
  field.addEventListener('input', () => { draft = field.value; status.textContent = ''; });
  const actions = node('div', 'check-in-actions'), keep = node('button', 'solid-action'), later = button('check-in-link', c.later);
  keep.type = 'submit';
  keep.append(document.createTextNode(c.keep + ' '), glyph('span', '↗'));
  actions.append(keep, later);
  form.append(label, field, actions);
  content.append(form);
  form.addEventListener('submit', event => {
   event.preventDefault();
   if (!field.value.trim()) { status.textContent = c.required; field.focus(); return; }
   const date = meta.revisitDate;
   try {
    settled = {kind: 'kept', date};
    data.write({outcome: field.value, reviewedAt: now().toISOString()});
    draft = null;
    status.textContent = '';
   } catch { settled = null; status.textContent = c.error; }
   paint();
   section.querySelector('h2')?.focus({preventScroll: true});
  });
  later.addEventListener('click', () => {
   const date = meta.revisitDate;
   try {
    settled = {kind: 'later', date};
    data.write({revisitDate: addDays(today(), 7), outcome: field.value});
    draft = null;
    status.textContent = '';
   } catch { settled = null; status.textContent = c.error; }
   paint();
   section.querySelector('h2')?.focus({preventScroll: true});
  });
 }

 for (const type of ['olivia:journal-change', 'olivia:check-in-change']) addEventListener(type, () => { if (section.isConnected) paint(); }, {signal});
 paint();
 return section;
}

const TODAY_LINKS = '.mobile-dock a[data-mobile-route="today"], a.today-nav, .page-top nav a[href="#today"]';

function mark(element, count, label) {
 const dot = element.querySelector(':scope > .check-in-dot'), hidden = element.querySelector(':scope > .check-in-sr');
 if (!count) {
  dot?.remove();
  hidden?.remove();
  delete element.dataset.checkIns;
  return;
 }
 element.dataset.checkIns = String(count);
 if (!dot) element.append(glyph('span', undefined, 'check-in-dot'));
 const text = ', ' + label;
 if (hidden) hidden.textContent = text;
 else element.append(node('span', 'check-in-sr sr-only', text));
}

/**
 * A quiet sign that a check-in has come: a gold dot on Today (dock, menu,
 * navigation), a line in the phone menu, and one row on the question step that
 * opens the reading. Nothing changes for a first visit.
 */
export function initCheckInAwareness({open, storage = () => localStorage, locale = getLocale(), today = () => localDate()} = {}) {
 const c = checkInCopy(locale);
 function due() {
  try {
   const store = resolve(storage);
   return dueCheckIns({metadata: loadMetadata(store), singles: loadRecords(store), spreads: loadSpreadRecords(store), today: today()});
  } catch { return []; }
 }
 function paint() {
  const list = due(), count = list.length, label = c.waiting(count);
  document.documentElement.dataset.checkInsDue = String(count);
  document.querySelectorAll(TODAY_LINKS).forEach(link => mark(link, count, label));
  const menu = document.querySelector('.mobile-masthead .mobile-menu-toggle');
  if (menu) {
   menu.dataset.baseLabel ??= menu.getAttribute('aria-label') || '';
   menu.setAttribute('aria-label', count ? `${menu.dataset.baseLabel}, ${label}` : menu.dataset.baseLabel);
   const dot = menu.querySelector(':scope > .check-in-dot');
   if (count && !dot) menu.append(glyph('span', undefined, 'check-in-dot'));
   if (!count) dot?.remove();
  }
  const note = document.querySelector('.mobile-explore a[href="#today"] small');
  if (note) {
   note.dataset.baseNote ??= note.textContent;
   note.textContent = count ? capital(label) : note.dataset.baseNote;
  }
  const form = document.querySelector('#question-form');
  let row = document.querySelector('.check-in-waiting');
  if (!count || !form) { row?.remove(); return; }
  const first = list[0], asked = createdDay(first.record);
  if (!row) {
   row = button('check-in-waiting');
   row.dataset.noTranslate = 'true';
   row.addEventListener('click', () => { const entry = row.entry; if (entry) open?.(entry); });
  }
  // Phones: below Continue (built when the question step first opens), so the new question keeps the first place.
  const next = form.querySelector('.mobile-question-next');
  if (next) { if (row.previousElementSibling !== next) next.after(row); }
  else if (row.nextElementSibling !== form) form.before(row);
  row.entry = first;
  const copy = node('span', 'check-in-waiting-copy');
  copy.append(node('span', 'eyebrow', count > 1 ? `${c.notice} · ${count}` : c.notice), node('strong', '', readingName(first)));
  if (asked) copy.append(node('small', '', c.from(formatDay(asked, locale))));
  row.replaceChildren(copy, glyph('i', '↗'));
 }
 for (const type of ['olivia:journal-change', 'olivia:check-in-change', 'olivia:shell-ready', 'hashchange', 'pageshow']) addEventListener(type, paint);
 document.addEventListener('visibilitychange', () => { if (!document.hidden) paint(); });
 // The phone shell (olivia:shell-ready) and the product pages may be built after this runs.
 requestAnimationFrame(paint);
 return {refresh: paint};
}
