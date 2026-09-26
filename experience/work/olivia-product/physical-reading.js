/** Record a card drawn by the visitor. No card selection, upload, or API request occurs here. */
import { createRecord, normalizeOrientation, ReadingError } from './core.js';
import { TAROT_CARDS } from './deck-catalog.js';
import { cardNotesForOrientation } from './content.js';
import { getLocale, t } from './locale.js';

const copy = {
  en: {
    eyebrow: 'From your physical deck', title: 'Your cards.\nYour own ritual.',
    introduction: 'Draw a card from your own deck, then bring it here. Keep its meaning, your question and what you notice in your almanac.',
    journal: 'My almanac ↗', card: 'Which card did you draw?', search: 'Find your card', placeholder: 'Try The Moon or Queen of Cups',
    select: 'Choose the card you drew', selected: 'Your selected card', noResults: 'No matching cards. Try another name.',
    resultCount: count => `${count} ${count === 1 ? 'card matches' : 'cards match'}`,
    allCards: 'Search by name, or browse all 78 cards below.', browse: 'Browse all 78 card names', examples: 'A few familiar faces', matches: 'Cards matching your search', selectedHint: 'Selected. Add your question, or save the card as it is.', addNote: 'Add a first impression', clearSearch: 'Clear search', orientation: 'How it landed', upright: 'Upright', reversed: 'Reversed',
    question: 'Your question', optional: '(optional)', questionPlaceholder: 'What was on your mind as you drew?',
    note: 'What did you notice?', notePlaceholder: 'Your first impression, a detail in the artwork, a connection…',
    action: 'Keep this reading ↗', pending: 'Keeping your reading…', chooseError: 'Choose the card you drew first.',
    failure: 'This reading could not be kept. Your entry is still here; please try again.',
    empty: 'The card you choose will appear here.', artwork: 'Olivia’s artwork represents your chosen card.',
    privacy: 'Your entry is kept in this browser, on this device. You can download a copy from your almanac.',
    source: 'Enter the card yourself. The reflection comes from Olivia’s prepared card library.',
  },
  uk: {
    eyebrow: 'З вашої фізичної колоди', title: 'Ваші карти.\nВаш власний ритуал.',
    introduction: 'Витягніть карту зі своєї колоди й додайте її сюди. Збережіть значення, своє запитання та спостереження в альманасі.',
    journal: 'Мій альманах ↗', card: 'Яку карту ви витягнули?', search: 'Знайдіть свою карту', placeholder: 'Наприклад, Місяць або Королева Кубків',
    select: 'Оберіть карту, яку ви витягнули', selected: 'Обрана вами карта', noResults: 'Карт із такою назвою не знайдено. Спробуйте іншу назву.',
    resultCount: count => `Знайдено карт: ${count}`,
    allCards: 'Шукайте за назвою або перегляньте всі 78 карт нижче.', browse: 'Переглянути назви всіх 78 карт', examples: 'Кілька знайомих образів', matches: 'Карти за вашим запитом', selectedHint: 'Карту обрано. Додайте запитання або збережіть її без нього.', addNote: 'Додати перше враження', clearSearch: 'Очистити пошук', orientation: 'Як вона лягла', upright: 'Пряма', reversed: 'Перевернута',
    question: 'Ваше запитання', optional: '(необов’язково)', questionPlaceholder: 'Про що ви думали, коли витягували карту?',
    note: 'Що ви помітили?', notePlaceholder: 'Перше враження, деталь зображення, зв’язок із вашою ситуацією…',
    action: 'Зберегти читання ↗', pending: 'Зберігаємо читання…', chooseError: 'Спочатку оберіть карту, яку ви витягнули.',
    failure: 'Не вдалося зберегти читання. Ваш запис залишається тут — спробуйте ще раз.',
    empty: 'Тут з’явиться обрана вами карта.', artwork: 'Зображення Olivia представляє обрану вами карту.',
    privacy: 'Запис зберігається в цьому браузері на цьому пристрої. Ви можете завантажити копію зі свого альманаху.',
    source: 'Вкажіть карту самостійно. Роздуми походять із підготовленої бібліотеки значень Olivia.',
  },
};

function readingId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) return [...globalThis.crypto.getRandomValues(new Uint32Array(4))].map(value => value.toString(16).padStart(8, '0')).join('');
  throw new ReadingError('ID_UNAVAILABLE', 'A reading identifier could not be created.');
}

/** The explicit ID and orientation are validated against the same journal schema as digital draws. */
export function createPhysicalRecord({ cardId, orientation = 'upright', question = '', note = '', intention = 'open' } = {}, { id = readingId(), now = new Date().toISOString() } = {}) {
  if (!Number.isInteger(cardId) || !TAROT_CARDS[cardId]) throw new ReadingError('VALIDATION', 'Choose one of the 78 tarot cards.');
  const direction = normalizeOrientation(orientation), card = TAROT_CARDS[cardId];
  const session = {
    id, createdAt: now, question, intention,
    deck: [cardId], deckOrientations: [direction], reversals: direction === 'reversed',
    selectedSlot: 0, cardId, orientation: direction,
  };
  const record = createRecord(session, card, cardNotesForOrientation(cardId, direction), note);
  return { ...record, source: 'physical' };
}

const normalized = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[’'`]/g, '').trim();
export function filterPhysicalCards(query = '', locale = 'en') {
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  return TAROT_CARDS.filter(card => {
    const names = normalized(`${card.name} ${t(card.name, locale)}`);
    return terms.every(term => names.includes(term));
  });
}

export function initPhysicalReading({ assets, show, onComplete, locale = getLocale() } = {}) {
  if (!assets?.cards || typeof show !== 'function' || typeof onComplete !== 'function') throw new TypeError('Physical readings need artwork, navigation and a save callback.');
  const language = locale === 'uk' ? 'uk' : 'en', c = copy[language];
  const make = (tag, className, content) => { const node = document.createElement(tag); if (className) node.className = className; if (content !== undefined) node.textContent = content; return node; };
  const root = make('main', 'product-page physical-page'); root.id = 'physical-view'; root.hidden = true; root.dataset.noTranslate = 'true'; root.setAttribute('aria-labelledby', 'physical-title');
  const top = make('div', 'page-top'), brand = make('a', 'brand', 'Olivia '); brand.href = '#home'; brand.append(make('span', '', 'ARCANA'));
  const journal = make('a', 'quiet-link', c.journal); journal.href = '#journal'; top.append(brand, journal); root.append(top);
  const layout = make('div', 'physical-layout'), introduction = make('div', 'physical-introduction');
  const heading = make('h1', '', c.title); heading.id = 'physical-title'; heading.tabIndex = -1;
  introduction.append(make('p', 'eyebrow', c.eyebrow), heading, make('p', 'physical-lede', c.introduction));
  const figure = make('figure', 'physical-card-preview'), image = make('img'); image.src = assets.back; image.alt = ''; image.width = 280; image.height = 480;
  const caption = make('figcaption', '', c.empty); figure.append(image, caption); introduction.append(figure);
  const form = make('form', 'physical-form'); form.noValidate = true;
  const cardLabel = make('label', 'physical-card-label', c.card); cardLabel.htmlFor = 'physical-card';
  const searchLabel = make('label', 'sr-only', c.search); searchLabel.htmlFor = 'physical-search';
  const search = make('input', 'physical-search'); search.id = searchLabel.htmlFor; search.type = 'search'; search.autocomplete = 'off'; search.placeholder = c.placeholder; search.maxLength = 120;
  const select = make('select', 'physical-card-select'); select.id = cardLabel.htmlFor; select.required = true; select.setAttribute('aria-describedby', 'physical-search-status');
  const searchStatus = make('p', 'physical-search-status', c.allCards); searchStatus.id = 'physical-search-status'; searchStatus.setAttribute('role', 'status');
  const results = make('div', 'physical-card-results'); results.setAttribute('aria-label', c.examples);
  const browse = make('details', 'physical-browse'); browse.append(make('summary', '', c.browse), select);
  const choiceStatus = make('p', 'physical-choice-status'); choiceStatus.setAttribute('role', 'status');
  form.append(cardLabel, searchLabel, search, searchStatus, results, browse, choiceStatus);
  const orientation = make('fieldset', 'physical-orientation'); orientation.append(make('legend', '', c.orientation));
  for (const value of ['upright', 'reversed']) {
    const label = make('label'), radio = make('input'); radio.type = 'radio'; radio.name = 'physical-orientation'; radio.value = value; radio.defaultChecked = value === 'upright'; radio.checked = value === 'upright';
    label.append(radio, make('span', '', c[value])); orientation.append(label);
  }
  form.append(orientation);
  function textField(id, labelText, placeholder, maxLength, rows) {
    const label = make('label', '', labelText + ' '); label.htmlFor = id; label.append(make('span', '', c.optional));
    const field = make('textarea'); field.id = id; field.maxLength = maxLength; field.rows = rows; field.placeholder = placeholder; form.append(label, field); return field;
  }
  const question = textField('physical-question', c.question, c.questionPlaceholder, 1600, 3);
  const note = textField('physical-note', c.note, c.notePlaceholder, 4000, 3);
  const noteDetails = make('details', 'physical-note-details'), noteLabel = note.previousElementSibling; noteDetails.append(make('summary', '', c.addNote), noteLabel, note); form.append(noteDetails);
  const save = make('button', 'solid-action', c.action); save.type = 'submit';
  const status = make('p', 'physical-save-status'); status.setAttribute('role', 'status');
  form.append(save, status, make('p', 'privacy-note', c.privacy), make('p', 'physical-source', c.source)); layout.append(introduction, form); root.append(layout);
  document.querySelector('#journal-view').before(root);
  let selectedId = null, busy = false;
  function renderOptions() {
    const matches = filterPhysicalCards(search.value, language); select.replaceChildren();
    const placeholder = make('option', '', c.select); placeholder.value = ''; select.append(placeholder);
        for (const card of TAROT_CARDS) { const option = make('option', '', t(card.name, language)); option.value = String(card.number); select.append(option); }
    select.value = selectedId === null ? '' : String(selectedId);
    searchStatus.textContent = !search.value.trim() ? c.allCards : matches.length ? c.resultCount(matches.length) : c.noResults;
    results.replaceChildren(); results.classList.toggle('is-searching', !!search.value.trim()); results.setAttribute('aria-label', search.value.trim() ? c.matches : c.examples);
    const shown = search.value.trim() ? matches : [18, 19, 17, 9, 2, 48].map(id => TAROT_CARDS[id]);
    for (const card of shown) {
      const button = make('button', 'physical-card-result'); button.type = 'button'; button.dataset.cardId = card.number; button.setAttribute('aria-pressed', String(selectedId === card.number));
      const thumbnail = make('img'); thumbnail.src = assets.cards[card.number]; thumbnail.alt = ''; thumbnail.width = 70; thumbnail.height = 120; thumbnail.loading = 'lazy';
      button.append(thumbnail, make('span', '', t(card.name, language)));
      button.addEventListener('click', () => { selectedId = card.number; select.value = String(selectedId); status.textContent = ''; renderCard(); }); results.append(button);
    }
    if (search.value.trim() && !matches.length) { const clear = make('button', 'quiet-link', c.clearSearch); clear.type = 'button'; clear.addEventListener('click', () => { search.value = ''; renderOptions(); search.focus(); }); results.append(clear); }
  }
  function renderCard() {
    const card = selectedId === null ? null : TAROT_CARDS[selectedId], direction = form.querySelector('[name="physical-orientation"]:checked')?.value || 'upright';
    image.src = card ? assets.cards[card.number] : assets.back;
    image.dataset.orientation = card ? direction : 'upright'; image.alt = card ? t(card.name, language) : '';
    figure.classList.toggle('is-selected', !!card); caption.textContent = card ? `${t(card.name, language)} · ${c[direction]}` : c.empty;
    caption.title = card ? c.artwork : '';
    choiceStatus.textContent = card ? `${t(card.name, language)} · ${c.selectedHint}` : '';
    results.querySelectorAll('button[data-card-id]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.cardId) === selectedId)));
  }
  search.addEventListener('input', renderOptions);
  select.addEventListener('change', () => { selectedId = select.value === '' ? null : Number(select.value); status.textContent = ''; renderCard(); });
  orientation.addEventListener('change', renderCard);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    if (selectedId === null) { status.textContent = c.chooseError; search.focus(); return; }
    busy = true; save.disabled = true; save.textContent = c.pending; status.textContent = '';
    try {
      const record = createPhysicalRecord({ cardId: selectedId, orientation: new FormData(form).get('physical-orientation'), question: question.value, note: note.value });
      for (const control of form.elements) control.disabled = true;
      await onComplete(record);
      form.reset(); selectedId = null; noteDetails.open = false; browse.open = false; renderOptions(); renderCard();
    } catch { status.textContent = c.failure; }
    finally { busy = false; for (const control of form.elements) control.disabled = false; save.textContent = c.action; }
  });
  renderOptions();
  return {
    element: root,
    render() { renderOptions(); renderCard(); show('physical'); root.hidden = false; heading.focus({ preventScroll: true }); },
  };
}
