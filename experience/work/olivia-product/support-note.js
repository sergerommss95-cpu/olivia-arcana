/* A safety net that does not depend on the AI service. When a question speaks
   of self-harm or not being safe, the reading shows where to find people who can
   help, in both prepared and personal readings. Patterns are deliberately narrow:
   the note must not appear on ordinary questions about change or endings. */
const PATTERNS = [
  /\b(suicid\w*|kill(ing)? myself|end(ing)? my (own )?life|take my (own )?life|want(ed)? to die|wish (that )?i (was|were) dead|better off dead|(don't|do not) want to (live|be alive|exist)|no reason to (live|go on)|self[- ]?harm\w*|(hurt|hurting|harm|harming) myself|cut(ting)? myself(?! off)|overdos\w*|(i am|i'm|i feel) not safe|(i am|i'm) in danger)\b/i,
  /(суїцид|самогубств|покінч[а-яіїєґ]* (з|із) собою|наклас[а-яіїєґ]* на себе руки|(вб|уб)(ити|’ю|'ю) себе|не хочу (більше )?жити|(хочу|хотів|хотіла|хочеться) померти|краще б мене не було|самоушкодж|(заподі|завда)[а-яіїєґ’']* собі (шкод|бол|біль)|ріжу себе|мені небезпечно|я в небезпеці)/i,
  /(суицид|самоубийств|поконч[а-яё]* с собой|(убить|убью) себя|не хочу (больше )?жить|(хочу|хотел|хотела|хочется) умереть|налож[а-яё]* на себя руки|причин[а-яё]* себе (вред|боль)|режу себя)/i,
];

export function needsSupport(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const value = text.normalize('NFC').replace(/[’ʼ`]/g, "'");
  return PATTERNS.some(pattern => pattern.test(value));
}

const COPY = {
  en: {
    title: 'You don’t have to hold this alone',
    body: 'If you are thinking about harming yourself, or you are not safe, please reach out to someone now. The cards can wait.',
    lines: [
      ['Emergency', [['112', '112'], ['911', '911'], ['999', '999']], '112 in Europe and Ukraine, 911 in the US and Canada, 999 in the UK'],
      ['Lifeline Ukraine', [['7333', '7333']], 'free, day and night'],
      ['Samaritans, UK and Ireland', [['116 123', '116123']], 'free, day and night'],
      ['US and Canada', [['988', '988']], 'call or text'],
    ],
    elsewhere: 'Other countries:',
  },
  uk: {
    title: 'Вам не треба нести це наодинці',
    body: 'Якщо ви думаєте про те, щоб заподіяти собі шкоду, або вам загрожує небезпека, будь ласка, зверніться до когось просто зараз. Карти можуть зачекати.',
    lines: [
      ['Екстрена допомога', [['112', '112']], 'в Україні та Європі'],
      ['Lifeline Ukraine', [['7333', '7333']], 'цілодобово й безкоштовно'],
    ],
    elsewhere: 'Інші країни:',
  },
};

function build(locale) {
  const copy = COPY[locale] || COPY.en;
  const note = document.createElement('aside');
  note.className = 'support-note';
  note.setAttribute('role', 'note');
  note.dataset.noTranslate = 'true';
  note.lang = locale === 'uk' ? 'uk' : 'en';
  const title = document.createElement('p');
  title.className = 'support-note-title';
  title.textContent = copy.title;
  const body = document.createElement('p');
  body.textContent = copy.body;
  const list = document.createElement('ul');
  for (const [label, numbers, detail] of copy.lines) {
    const item = document.createElement('li');
    item.append(document.createTextNode(label + ': '));
    numbers.forEach(([shown, dial], index) => {
      if (index) item.append(document.createTextNode(' · '));
      const link = document.createElement('a');
      link.href = 'tel:' + dial;
      link.textContent = shown;
      item.append(link);
    });
    item.append(document.createTextNode(' — ' + detail));
    list.append(item);
  }
  const elsewhere = document.createElement('p');
  const directory = document.createElement('a');
  directory.href = 'https://findahelpline.com';
  directory.target = '_blank';
  directory.rel = 'noopener noreferrer';
  directory.textContent = 'findahelpline.com';
  elsewhere.append(document.createTextNode(copy.elsewhere + ' '), directory);
  note.append(title, body, list, elsewhere);
  return note;
}

/** Show or remove the note directly after `anchor`, according to the question. */
export function syncSupportNote(anchor, question, locale = 'en') {
  if (!anchor?.parentNode) return null;
  const next = anchor.nextElementSibling;
  const existing = next?.classList?.contains('support-note') ? next : null;
  if (!needsSupport(question)) { existing?.remove(); return null; }
  if (existing && existing.lang === (locale === 'uk' ? 'uk' : 'en')) return existing;
  existing?.remove();
  const note = build(locale);
  anchor.after(note);
  return note;
}
