/** Prepared question lenses. This module never sends a question or generates AI copy. */
export const QUESTION_LIMIT = 1600;
export const QUESTION_PLAN_VERSION = 1;
const POSITION_IDS = Object.freeze(['situation', 'complication', 'next-step']);
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const QUESTION_DIRECTIONS = freeze({
  en: {
    understand: {
      label: 'Understand', name: 'A little clarity', description: 'See the situation with a little more room.',
      suggestion: 'What do I need to understand about this situation before I act?',
      ritual: {
        gesture: 'Let the picture become clearer.',
        invitation: 'Begin with what you can observe. Make room for an assumption worth checking, then a small step toward understanding.',
        arrival: 'Three ways to look at the situation. Turn the first card when you are ready.',
        chapters: ['The situation and its tension', 'A way forward'],
      },
      positions: [
        { id: 'situation', label: 'What is here', prompt: 'What can I actually observe in this situation?' },
        { id: 'complication', label: 'What needs a closer look', prompt: 'What assumption or tension could change how I see it?' },
        { id: 'next-step', label: 'A way forward', prompt: 'What small step would help me understand more?' },
      ],
    },
    decision: {
      label: 'Make a choice', name: 'Room for a decision', description: 'Explore what matters before choosing.',
      suggestion: 'What matters most to me in this choice, and what do I still need to understand?',
      ritual: {
        gesture: 'Room before a decision.',
        invitation: 'Look at the choice, what makes it difficult, and what you could explore before committing. The decision stays with you.',
        arrival: 'Three perspectives on your choice. Turn the first card when you are ready.',
        chapters: ['What shapes the choice', 'Before you decide'],
      },
      positions: [
        { id: 'situation', label: 'The choice before you', prompt: 'What value or need matters in the choice I am facing?' },
        { id: 'complication', label: 'What makes it difficult', prompt: 'What uncertainty, pressure or assumption complicates my choice?' },
        { id: 'next-step', label: 'Before you decide', prompt: 'What could I check, ask or try before committing?' },
      ],
    },
    conversation: {
      label: 'Have a conversation', name: 'Before the conversation', description: 'Find your words, and leave room to listen.',
      suggestion: 'What do I want to express, and how could I begin this conversation with care?',
      ritual: {
        gesture: 'Before you find the words.',
        invitation: 'Make room for your experience, what may make listening harder, and a thoughtful way to begin.',
        arrival: 'A little space before the conversation. Turn the first card when you are ready.',
        chapters: ['What you bring to the conversation', 'A considered beginning'],
      },
      positions: [
        { id: 'situation', label: 'What you bring', prompt: 'What do I want to express about my own experience?' },
        { id: 'complication', label: 'What may get in the way', prompt: 'What assumption or reaction could make listening harder?' },
        { id: 'next-step', label: 'A considered beginning', prompt: 'What could I say or ask to open the conversation with care?' },
      ],
    },
    original: {
      label: 'My own question', name: 'A little clarity', description: 'Keep your own words and an open perspective.',
      suggestion: '',
      ritual: {
        gesture: 'A little room to see.',
        invitation: 'Give your question a little room. See what is present, what complicates it, and where you could begin.',
        arrival: 'Three perspectives, held together. Turn the first card when you are ready.',
        chapters: ['Where the question opens', 'One way to begin'],
      },
      positions: [
        { id: 'situation', label: 'The situation', prompt: 'What aspect of the situation deserves attention?' },
        { id: 'complication', label: 'What complicates it', prompt: 'What tension or assumption deserves a closer look?' },
        { id: 'next-step', label: 'A helpful next step', prompt: 'What small action could help you understand or respond?' },
      ],
    },
  },
  uk: {
    understand: {
      label: 'Зрозуміти', name: 'Трохи ясності', description: 'Подивіться на ситуацію з ширшої перспективи.',
      suggestion: 'Що мені варто зрозуміти в цій ситуації, перш ніж діяти?',
      ritual: {
        gesture: 'Дайте ситуації прояснитися.',
        invitation: 'Почніть із того, що можете спостерігати. Придивіться до припущення, яке варто перевірити, а потім — до невеликого кроку до розуміння.',
        arrival: 'Три погляди на ситуацію. Відкрийте першу карту, коли будете готові.',
        chapters: ['Ситуація та її напруга', 'Шлях уперед'],
      },
      positions: [
        { id: 'situation', label: 'Що є зараз', prompt: 'Що я можу безпосередньо спостерігати в цій ситуації?' },
        { id: 'complication', label: 'Що потребує уваги', prompt: 'Яке припущення чи напруга можуть змінити мій погляд?' },
        { id: 'next-step', label: 'Шлях уперед', prompt: 'Який невеликий крок допоможе мені зрозуміти більше?' },
      ],
    },
    decision: {
      label: 'Зробити вибір', name: 'Простір для рішення', description: 'З’ясуйте, що важливо, перш ніж обирати.',
      suggestion: 'Що для мене найважливіше в цьому виборі й що ще варто з’ясувати?',
      ritual: {
        gesture: 'Простір перед рішенням.',
        invitation: 'Погляньте на свій вибір, на те, що його ускладнює, і на те, що можна з’ясувати перед рішенням. Сам вибір залишається за вами.',
        arrival: 'Три погляди на ваш вибір. Відкрийте першу карту, коли будете готові.',
        chapters: ['Що впливає на вибір', 'Перш ніж вирішити'],
      },
      positions: [
        { id: 'situation', label: 'Вибір перед вами', prompt: 'Яка цінність або потреба важлива у виборі, перед яким я стою?' },
        { id: 'complication', label: 'Що ускладнює вибір', prompt: 'Яка невизначеність, тиск чи припущення ускладнюють мій вибір?' },
        { id: 'next-step', label: 'Перш ніж вирішити', prompt: 'Що я можу перевірити, запитати чи спробувати перед рішенням?' },
      ],
    },
    conversation: {
      label: 'Підготувати розмову', name: 'Перед розмовою', description: 'Знайдіть свої слова й залиште місце для слухання.',
      suggestion: 'Що я хочу висловити й як можу почати цю розмову з турботою?',
      ritual: {
        gesture: 'Перш ніж знайти слова.',
        invitation: 'Приділіть увагу своєму досвіду, тому, що може завадити слухати, і дбайливому способу почати розмову.',
        arrival: 'Трохи простору перед розмовою. Відкрийте першу карту, коли будете готові.',
        chapters: ['З чим ви приходите до розмови', 'Уважний початок'],
      },
      positions: [
        { id: 'situation', label: 'З чим ви приходите', prompt: 'Що я хочу висловити про власний досвід?' },
        { id: 'complication', label: 'Що може завадити', prompt: 'Яке припущення чи реакція можуть завадити слухати?' },
        { id: 'next-step', label: 'Уважний початок', prompt: 'Що я можу сказати чи запитати, щоб дбайливо почати розмову?' },
      ],
    },
    original: {
      label: 'Моє запитання', name: 'Трохи ясності', description: 'Залиште свої слова й відкритість до нового погляду.',
      suggestion: '',
      ritual: {
        gesture: 'Трохи простору, щоб побачити.',
        invitation: 'Дайте своєму запитанню трохи простору. Подивіться, що є зараз, що це ускладнює і з чого можна почати.',
        arrival: 'Три погляди, поєднані разом. Відкрийте першу карту, коли будете готові.',
        chapters: ['З чого відкривається запитання', 'Один спосіб почати'],
      },
      positions: [
        { id: 'situation', label: 'Ситуація', prompt: 'Яка частина ситуації заслуговує на увагу?' },
        { id: 'complication', label: 'Що її ускладнює', prompt: 'Яку напругу чи припущення варто розглянути уважніше?' },
        { id: 'next-step', label: 'Корисний наступний крок', prompt: 'Яка невелика дія допоможе зрозуміти ситуацію або відповісти на неї?' },
      ],
    },
  },
});

const copy = {
  en: {
    open: 'Help me shape my question', sub: 'Optional', close: 'Close question guide',
    title: 'What would help you?', lead: 'Pick an angle. You can keep your own words.',
    label: 'Your wording', original: 'Restore my question', use: 'Use as a starting point',
    wording: 'Explore another wording', suggestion: 'An angle to consider', context: 'Keep the people, choices and timing that matter to you. Let this angle sharpen your own words.', positions: 'How this shapes a three-card reading',
    approve: 'Use this direction', approveQuestion: 'Use this question', approveOriginal: 'Keep my question',
    skip: 'Close without changes', source: 'Prepared prompts. Nothing is sent during this step.',
    changed: 'You changed the question above. Keep this wording, or bring in your latest words.', sync: 'Use my latest question',
    invalid: 'Keep your question within 1,600 characters.', saved: 'Your chosen direction', starting: 'Your starting point',
    fixed: 'You chose these positions before drawing the cards.', optional: 'Write in whatever way feels natural.',
    applied: 'Applied · edit', resetDirection: 'Keep it open',
    choices: { understand: 'Understand a situation', decision: 'Think through a decision', conversation: 'Prepare for a conversation' },
  },
  uk: {
    open: 'Допоможіть сформулювати запитання', sub: 'За бажанням', close: 'Закрити підказки до запитання',
    title: 'Що допомогло б вам?', lead: 'Оберіть напрям. Ваші слова можуть залишитися без змін.',
    label: 'Ваше формулювання', original: 'Відновити моє запитання', use: 'Взяти за основу',
    wording: 'Спробувати інше формулювання', suggestion: 'Можливий напрям', context: 'Збережіть людей, варіанти й терміни, важливі для вас. Цей напрям може допомогти уточнити ваші власні слова.', positions: 'Як це спрямовує розклад із трьох карт',
    approve: 'Обрати цей напрям', approveQuestion: 'Використати це запитання', approveOriginal: 'Залишити моє запитання',
    skip: 'Закрити без змін', source: 'Підготовлені підказки. На цьому кроці нічого не надсилається.',
    changed: 'Ви змінили запитання вище. Залиште це формулювання або додайте оновлені слова.', sync: 'Взяти оновлене запитання',
    invalid: 'Запитання має містити не більше 1 600 символів.', saved: 'Обраний вами напрям', starting: 'З чого ви почали',
    fixed: 'Ви обрали ці позиції до того, як витягнули карти.', optional: 'Пишіть так, як вам зручно.',
    applied: 'Застосовано · змінити', resetDirection: 'Залишити відкритим',
    choices: { understand: 'Зрозуміти ситуацію', decision: 'Обміркувати рішення', conversation: 'Підготуватися до розмови' },
  },
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function text(value, name, limit, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) throw new TypeError(`Invalid ${name}.`);
  return value;
}

/** A serializable, immutable snapshot. Old saved prompts are preserved, not regenerated. */
export function validateQuestionPlan(value) {
  if (!isObject(value) || value.schemaVersion !== QUESTION_PLAN_VERSION || value.source !== 'editorial' || !['en', 'uk'].includes(value.locale) || !Object.hasOwn(QUESTION_DIRECTIONS.en, value.direction) || value.spreadId !== 'clarity3') throw new TypeError('Invalid question plan.');
  if (typeof value.approvedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.approvedAt) || !Number.isFinite(Date.parse(value.approvedAt)) || new Date(value.approvedAt).toISOString() !== value.approvedAt) throw new TypeError('Invalid question plan approval date.');
  if (!Array.isArray(value.positions) || value.positions.length !== 3 || value.positions.some((position, index) => !isObject(position) || position.id !== POSITION_IDS[index])) throw new TypeError('Question plan positions must retain their original order.');
  return freeze({
    schemaVersion: QUESTION_PLAN_VERSION, source: 'editorial', locale: value.locale, direction: value.direction,
    originalQuestion: text(value.originalQuestion, 'original question', QUESTION_LIMIT),
    question: text(value.question, 'approved question', QUESTION_LIMIT),
    spreadId: 'clarity3', spreadName: text(value.spreadName, 'spread name', 160, true), approvedAt: value.approvedAt,
    positions: value.positions.map(position => ({ id: position.id, label: text(position.label, 'position label', 160, true), prompt: text(position.prompt, 'position prompt', 2000, true) })),
  });
}

export function createQuestionPlan({ originalQuestion = '', question = originalQuestion, direction = 'original', locale = 'en', approvedAt = new Date().toISOString() } = {}) {
  if (!['en', 'uk'].includes(locale) || !Object.hasOwn(QUESTION_DIRECTIONS[locale], direction)) throw new TypeError('Choose a supported question direction.');
  const definition = QUESTION_DIRECTIONS[locale][direction];
  return validateQuestionPlan({ schemaVersion: QUESTION_PLAN_VERSION, source: 'editorial', locale, originalQuestion, question, direction, spreadId: 'clarity3', spreadName: definition.name, positions: definition.positions, approvedAt });
}

/** The drawing layout and stable position IDs remain those of the canonical spread. */
export function applyQuestionPlan(spread, plan) {
  const snapshot = validateQuestionPlan(plan);
  if (spread?.id !== snapshot.spreadId || spread.count !== 3 || spread.positions?.some((position, index) => position.id !== POSITION_IDS[index]) || spread.positions?.length !== 3) throw new TypeError('This question plan belongs to the three-card clarity spread.');
  return { ...spread, name: snapshot.spreadName, readingPlan: snapshot, questionEditorial: QUESTION_DIRECTIONS[snapshot.locale][snapshot.direction].ritual, positions: spread.positions.map((position, index) => ({ ...position, ...snapshot.positions[index] })) };
}

let coachId = 0;
/** Optional help beside a question. Only explicit approval passes a plan to the caller. */
export function initQuestionCoach({ container, input, locale = globalThis.OLIVIA_LOCALE || 'en', onApprove = () => {}, onSkip = () => {} } = {}) {
  if (!container || !input) throw new TypeError('The question guide needs a container and an input.');
  const language = locale === 'uk' ? 'uk' : 'en', c = copy[language], definitions = QUESTION_DIRECTIONS[language];
  const make = (tag, className, content) => { const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; };
  const button = (className, content, action) => { const node = make('button', className, content); node.type = 'button'; node.addEventListener('click', action); return node; };
  const uid = `question-coach-${++coachId}`;
  input.maxLength = QUESTION_LIMIT;
  const root = make('details', 'question-coach'); root.dataset.noTranslate = 'true';
  const summary = make('summary', 'question-coach-summary'), summaryCopy = make('span'), summaryHint = make('small', '', c.sub);
  summaryCopy.append(make('span', 'question-coach-title', c.open), summaryHint);
  const mark = make('span', 'question-coach-mark', '+'); mark.setAttribute('aria-hidden', 'true'); summary.append(summaryCopy, mark); root.append(summary);
  const body = make('div', 'question-coach-body'), heading = make('h3', '', c.title); heading.tabIndex = -1;
  body.append(heading, make('p', 'question-coach-lead', c.lead));
  const directions = make('div', 'question-coach-directions'); directions.setAttribute('role', 'group'); directions.setAttribute('aria-label', c.title);
  let direction = 'original', approvedDirection = 'original', lastSource = input.value, edited = false;
  const buttons = new Map();
  for (const key of ['understand', 'decision', 'conversation']) {
    const choice = button('', '', () => { direction = direction === key ? 'original' : key; summaryHint.textContent = c.sub; renderDirection(); });
    choice.append(make('span', '', c.choices[key]), make('small', '', definitions[key].description));
    choice.setAttribute('aria-pressed', 'false'); directions.append(choice); buttons.set(key, choice);
  }
  body.append(directions);
  const wording = make('details', 'question-coach-wording'), wordingSummary = make('summary', '', c.wording);
  const label = make('label', 'question-coach-label', c.label); label.htmlFor = `${uid}-question`;
  const focus = make('textarea', 'question-coach-question'); focus.id = label.htmlFor; focus.rows = 2; focus.maxLength = QUESTION_LIMIT; focus.value = input.value; focus.placeholder = c.optional;
  const count = make('span', 'question-coach-count'); count.id = `${uid}-count`; focus.setAttribute('aria-describedby', count.id);
  const syncSource = () => { focus.value = input.value; lastSource = input.value; edited = false; updateCount(); updateChanged(); };
  const original = button('quiet-link', c.original, syncSource);
  const editTools = make('div', 'question-coach-edit-tools'); editTools.append(original, count);
  const suggested = make('div', 'question-coach-suggestion'), suggestionText = make('p');
  const use = button('quiet-link', c.use + ' ↗', () => { focus.value = definitions[direction].suggestion; edited = focus.value !== input.value; lastSource = input.value; updateCount(); updateChanged(); focus.focus({ preventScroll: true }); });
  const contextHint=make('p','question-coach-context',c.context);
  suggested.append(make('span', 'eyebrow', c.suggestion), suggestionText, contextHint, use);
  const changed = make('div', 'question-coach-changed'), changedText = make('p', '', c.changed);
  changed.append(changedText, button('quiet-link', c.sync, syncSource)); changed.hidden = true;
  wording.append(wordingSummary, suggested, label, focus, editTools, changed); body.append(wording);
  const preview = make('details', 'question-coach-plan'), planSummary = make('summary', '', c.positions);
  const list = make('ol', 'question-coach-positions'); preview.append(planSummary, list); body.append(preview);
  const status = make('p', 'question-coach-status'); status.setAttribute('role', 'status');
  const approve = button('solid-action question-coach-approve', c.approveOriginal, () => {
    try {
      const plan = createQuestionPlan({ originalQuestion: input.value, question: focus.value, direction, locale: language });
      status.textContent = ''; onApprove(plan); approvedDirection = direction; if (input.value === plan.question) syncSource(); summaryHint.textContent = c.applied; root.open = false;
    } catch (error) { status.textContent = error instanceof TypeError ? c.invalid : error.message; }
  });
  const skip = button('quiet-link question-coach-skip', c.skip, () => { root.open = false; direction = approvedDirection; syncSource(); renderDirection(); onSkip(); });
  const actions = make('div', 'question-coach-actions'); actions.append(approve, skip);
  body.append(actions, status, make('p', 'privacy-note', c.source)); root.append(body); container.append(root);
  function updateCount() {
    use.hidden=!!(input.value.trim()||focus.value.trim());contextHint.hidden=!use.hidden;
    const numberLocale = language === 'uk' ? 'uk-UA' : 'en-US';
    count.textContent = `${focus.value.length.toLocaleString(numberLocale)} / ${QUESTION_LIMIT.toLocaleString(numberLocale)}`;
    approve.disabled = focus.value.length > QUESTION_LIMIT || input.value.length > QUESTION_LIMIT;
    approve.textContent = edited ? c.approveQuestion : direction === 'original' ? c.approveOriginal : c.approve;
    original.hidden = !edited;
  }
  function updateChanged() { changed.hidden = !edited || input.value === lastSource; }
  function renderDirection() {
    const item = definitions[direction];
    for (const [key, choice] of buttons) choice.setAttribute('aria-pressed', String(key === direction));
    suggestionText.textContent = item.suggestion; suggested.hidden = !item.suggestion;
    list.replaceChildren();
    item.positions.forEach((position, index) => {
      const li = make('li'), text = make('div'); text.append(make('strong', '', position.label), make('p', '', position.prompt));
      li.append(make('span', 'question-coach-position-number', String(index + 1).padStart(2, '0')), text); list.append(li);
    });
    updateCount(); updateChanged();
  }
  const onInput = () => { if (!edited) { focus.value = input.value; lastSource = input.value; } summaryHint.textContent = c.sub; updateCount(); updateChanged(); };
  focus.addEventListener('input', () => { edited = focus.value !== input.value; if (!edited) lastSource = input.value; updateCount(); updateChanged(); });
  input.addEventListener('input', onInput);
  root.addEventListener('toggle', () => { summary.setAttribute('aria-label', root.open ? c.close : c.open); if (root.open) { onInput(); if (edited) wording.open = true; } });
  renderDirection();
  return {
    element: root,
    open() { root.open = true; onInput(); heading.focus({ preventScroll: true }); },
    close() { root.open = false; },
    reset() { direction = approvedDirection = 'original'; syncSource(); renderDirection(); root.open = false; wording.open = false; preview.open = false; summaryHint.textContent = c.sub; },
    restore(value) { const plan = validateQuestionPlan(value); direction = approvedDirection = plan.direction; syncSource(); renderDirection(); root.open = true; wording.open = false; preview.open = false; },
    getPlan() { return createQuestionPlan({ originalQuestion: input.value, question: focus.value, direction, locale: language }); },
    destroy() { input.removeEventListener('input', onInput); root.remove(); },
  };
}

/** Reading provenance, including the visitor's unmodified starting point. */
export function mountQuestionPlan(container, value, locale = globalThis.OLIVIA_LOCALE || 'en') {
  container.replaceChildren();
  if (!value) return;
  const plan = validateQuestionPlan(value), c = copy[locale === 'uk' ? 'uk' : 'en'];
  const details = document.createElement('details'); details.className = 'question-plan-snapshot'; details.dataset.noTranslate = 'true';
  const summary = document.createElement('summary'); summary.textContent = `${c.saved} · ${QUESTION_DIRECTIONS[plan.locale][plan.direction].label}`; details.append(summary);
  const body = document.createElement('div');
  if (plan.originalQuestion && plan.originalQuestion !== plan.question) {
    const label = document.createElement('p'); label.className = 'eyebrow'; label.textContent = c.starting;
    const source = document.createElement('p'); source.className = 'question-plan-original'; source.textContent = plan.originalQuestion; body.append(label, source);
  }
  const fixed = document.createElement('p'); fixed.textContent = c.fixed; body.append(fixed);
  const roles = document.createElement('ol');
  for (const position of plan.positions) { const li = document.createElement('li'); li.textContent = `${position.label} — ${position.prompt}`; roles.append(li); }
  body.append(roles); details.append(body); container.append(details);
}
