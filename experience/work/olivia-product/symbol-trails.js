import { TAROT_CARDS } from './deck-catalog.js';
import { getLocale, t } from './locale.js';

const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};

/** These nine images were inspected directly. Replacing one requires a fresh visual review. */
export const SYMBOL_ARTWORK = freeze({
  9: { file: '09_the_hermit.webp', sha256: '8859d08e0e5fe45be8d2d833f1fb6acedaee61dd41213f92b92680ee4fe51d36' },
  17: { file: '17_the_star.webp', sha256: '98eb02a074a74196baa71d836f83e5ad411ea3fdd96bb3d086a75cee4b5dd01f' },
  19: { file: '19_the_sun.webp', sha256: 'c30ce34d7e8fec13e9f5fdea78180e55160a9e5c31edbedb7fa1caaf063bac4d' },
  14: { file: '14_temperance.webp', sha256: 'f74c6e92c068776b409e7a48ad5737ea63d74b9d15701eee082d6add70e204bc' },
  36: { file: '36_ace_of_cups.webp', sha256: '02faabd88f3be2f67f48cf2bb9dc3120f0ec3435e4a61832412f18fc1a6d5768' },
  55: { file: '55_six_of_swords.webp', sha256: '563d152d384f0bf5d20be390cc280e36b489214624cbf54655fa0665a926a079' },
  2: { file: '02_the_high_priestess.webp', sha256: '6979a3327715d1ddb156244c040020020a061b38d1847ad37830af85fc0dc5ed' },
  25: { file: '25_four_of_wands.webp', sha256: '478c4175c4fafac75d4039b96b78157eb6a7e445347ac28cf73fb61965b727bb' },
  18: { file: '18_the_moon.webp', sha256: 'fab0fdd4f1eb6c28c5ca813be2152bf412a8c6208c8fbcee29bd0313035076ba' },
});

/** Curated visual observations, not a universal symbol dictionary or a reading. */
export const SYMBOL_TRAILS = freeze([
  {
    id: 'light',
    en: { name: 'Light', title: 'A light to follow.', introduction: 'A small lantern. A star above water. A sun filling the sky. Follow how the light changes its place and scale.', comparison: 'The lantern is held close to a single figure. The star sits above an open scene. The sun spreads its rays over everyone below.', prompt: 'Which kind of light feels useful to you today: something close, something to aim toward, or something shared?' },
    uk: { name: 'Світло', title: 'Світло, за яким іти.', introduction: 'Маленький ліхтар. Зірка над водою. Сонце в небі. Простежте, як змінюються місце й масштаб світла.', comparison: 'Ліхтар — поруч із самотньою постаттю. Зірка — над відкритим краєвидом. Сонячні промені охоплюють усіх унизу.', prompt: 'Яке світло вам потрібне сьогодні: те, що поруч, те, до якого прагнете, чи те, яким можна поділитися?' },
    cards: [
      { cardId: 9,
        en: { title: 'Held in one hand.', location: 'The lantern, below the centre', observation: 'A small gold star sits inside an ivory lantern. The Hermit holds it ahead of his body, beside the narrow mountain ledge. Most of the sky remains dark.', reflection: 'What is close enough for you to see clearly, even if the whole path is not?', detail: 'The light is small enough to carry.' },
        uk: { title: 'У долоні.', location: 'Ліхтар нижче центру', observation: 'У ліхтарі кольору слонової кістки — маленька золота зірка. Відлюдник тримає його перед собою біля вузького гірського уступу. Більшість неба залишається темною.', reflection: 'Що ви вже можете розгледіти зблизька, навіть якщо весь шлях ще не видно?', detail: 'Це світло можна нести із собою.' } },
      { cardId: 17,
        en: { title: 'Above the open water.', location: 'The gold star, above the figure', observation: 'A large gold star hangs between two blue columns. Smaller pale stars surround it; below, the kneeling figure pours water from two jugs.', reflection: 'What gives you a sense of direction while you attend to ordinary things?', detail: 'The light is above the figure, beyond her hands.' },
        uk: { title: 'Над відкритою водою.', location: 'Золота зірка над постаттю', observation: 'Велика золота зірка висить між двома синіми колонами. Навколо — менші бліді зірки; внизу постать навколішки ллє воду з двох глечиків.', reflection: 'Що дає вам відчуття напряму, поки ви займаєтеся повсякденними справами?', detail: 'Світло — над постаттю, поза межами її рук.' } },
      { cardId: 19,
        en: { title: 'Enough to fill the sky.', location: 'The sun, in the upper half', observation: 'The sun is a large gold face, surrounded by alternating straight and curved rays. Far below it, an ivory child lifts both arms while riding a pale horse.', reflection: 'Where could you let a little more of yourself be seen?', detail: 'The gold disc dominates the space above the child.' },
        uk: { title: 'На ціле небо.', location: 'Сонце у верхній половині', observation: 'Сонце — велике золоте обличчя, оточене прямими й хвилястими променями. Значно нижче дитина кольору слонової кістки піднімає обидві руки, сидячи на світлому коні.', reflection: 'Де ви могли б дозволити собі бути трохи помітнішими?', detail: 'Золотий диск панує у просторі над дитиною.' } },
    ],
  },
  {
    id: 'water',
    en: { name: 'Water', title: 'Follow the water.', introduction: 'Water can be poured, overflow a vessel, or carry a boat. Look at what the figures do in relation to it.', comparison: 'Temperance directs a stream between two cups. The Ace of Cups spills into a pool. In the Six of Swords, water surrounds and carries the boat.', prompt: 'Where in your life are you directing the flow, allowing more space, or moving through a change?' },
    uk: { name: 'Вода', title: 'Стежте за водою.', introduction: 'Воду можна переливати, вона може переповнювати посудину або нести човен. Подивіться, як із нею взаємодіють постаті.', comparison: 'Помірність спрямовує струмінь між двома чашами. Туз Кубків переливається у водойму. У Шістці Мечів вода оточує й несе човен.', prompt: 'Де у своєму житті ви спрямовуєте потік, даєте більше простору або рухаєтеся крізь зміни?' },
    cards: [
      { cardId: 14,
        en: { title: 'One cup to another.', location: 'The stream, between the hands', observation: 'A narrow pale stream curves from the raised cup into the lower cup. The winged figure stands at the water’s edge, with small ripples around the hem of the robe.', reflection: 'What would benefit from a slower, more deliberate exchange?', detail: 'Two vessels give the stream a beginning and an end.' },
        uk: { title: 'З однієї чаші в іншу.', location: 'Струмінь між руками', observation: 'Вузький світлий струмінь вигинається від піднятої чаші до нижньої. Крилата постать стоїть біля краю води; навколо подолу розходяться дрібні брижі.', reflection: 'Чому допоміг би повільніший, уважніший обмін?', detail: 'Дві посудини позначають початок і кінець струменя.' } },
      { cardId: 36,
        en: { title: 'More than a cup can hold.', location: 'The streams on either side of the cup', observation: 'Water arches over the rim of a large ivory cup and falls toward a pool of water lilies. A hand supports the cup; a pale bird descends above it.', reflection: 'What needs room to be expressed, rather than kept inside?', detail: 'The water moves beyond its vessel into a wider pool.' },
        uk: { title: 'Більше, ніж уміщує чаша.', location: 'Струмені обабіч чаші', observation: 'Вода дугами переливається через край великої чаші кольору слонової кістки й падає у водойму з лататтям. Рука підтримує чашу; над нею спускається світлий птах.', reflection: 'Що потребує простору для вираження, замість залишатися всередині?', detail: 'Вода виходить за межі посудини у ширшу водойму.' } },
      { cardId: 55,
        en: { title: 'A passage across.', location: 'The water beneath the boat', observation: 'Dark waves gather under an ivory boat. A standing figure holds a long pole, while a seated adult and child travel with upright swords. The water near the distant shore looks flatter.', reflection: 'What support would make a transition easier to travel through?', detail: 'The figures travel on the water instead of holding it.' },
        uk: { title: 'Переправа.', location: 'Вода під човном', observation: 'Темні хвилі збираються під човном кольору слонової кістки. Постать стоячи тримає довгу жердину, а доросла людина й дитина сидять поруч із вертикальними мечами. Біля далекого берега вода здається рівнішою.', reflection: 'Яка підтримка полегшила б перехід крізь зміни?', detail: 'Постаті подорожують водою, а не тримають її.' } },
    ],
  },
  {
    id: 'thresholds',
    en: { name: 'Thresholds', title: 'What lies between.', introduction: 'Columns, tall wands, and distant towers give a scene its edges. Notice whether the space between them is covered, shared, or open.', comparison: 'A patterned veil closes the space behind the High Priestess. Garlands frame the dancers in the Four of Wands. The Moon’s winding path continues between distant towers.', prompt: 'Which threshold feels familiar: a boundary to respect, a place to belong, or a path still unfolding?' },
    uk: { name: 'Пороги', title: 'Те, що поміж.', introduction: 'Колони, високі жезли й далекі вежі окреслюють простір. Помітьте, чи те, що між ними, приховане, спільне або відкрите.', comparison: 'Візерункова завіса закриває простір за Верховною Жрицею. Гірлянди обрамляють танцівників Четвірки Жезлів. Звивиста стежка Місяця веде між далекими вежами.', prompt: 'Який поріг вам знайомий: межа, яку варто поважати, місце, де ви свої, чи шлях, який ще відкривається?' },
    cards: [
      { cardId: 2,
        en: { title: 'Behind the veil.', location: 'The fabric between the columns', observation: 'Two blue columns flank a seated ivory figure. A veil patterned with fruit and stems is stretched behind her, covering the space below the arch.', reflection: 'What would you like to approach with patience, rather than an immediate answer?', detail: 'The boundary is visible, but what is behind it is not.' },
        uk: { title: 'За завісою.', location: 'Тканина між колонами', observation: 'Дві сині колони стоять обабіч сидячої постаті кольору слонової кістки. За нею натягнута завіса з візерунком плодів і стебел, що закриває простір під аркою.', reflection: 'До чого ви хотіли б підійти терпляче, не вимагаючи негайної відповіді?', detail: 'Межу видно, а те, що за нею, — ні.' } },
      { cardId: 25,
        en: { title: 'A place to gather.', location: 'The garlands above the dancers', observation: 'Four tall leafy wands support draped garlands. Two ivory figures dance beneath them, with a blue castle and small gathered figures in the distance.', reflection: 'What helps a place, or a relationship, feel welcoming to you?', detail: 'The frame leaves space for people to move together.' },
        uk: { title: 'Місце для зустрічі.', location: 'Гірлянди над танцівниками', observation: 'Чотири високі жезли з листям підтримують гірлянди. Під ними танцюють дві постаті кольору слонової кістки; вдалині видно синій замок і маленькі постаті людей.', reflection: 'Що робить місце або стосунки привітними для вас?', detail: 'Обрамлення залишає простір для спільного руху.' } },
      { cardId: 18,
        en: { title: 'The path continues.', location: 'The gold path in the lower half', observation: 'A narrow gold path winds away from the water, between two animals and then between distant blue towers. It keeps going toward the mountains beneath the enormous moon.', reflection: 'What is one step you could explore without needing to know the entire route?', detail: 'The opening leads onward, beyond the nearest figures.' },
        uk: { title: 'Шлях триває.', location: 'Золота стежка в нижній половині', observation: 'Вузька золота стежка звивається від води, між двома тваринами, а далі — між далекими синіми вежами. Вона прямує до гір під величезним місяцем.', reflection: 'Який один крок ви могли б дослідити, не знаючи всього маршруту?', detail: 'Прохід веде далі, за межі найближчих постатей.' } },
    ],
  },
]);

export function getSymbolTrail(id) {
  const trail = SYMBOL_TRAILS.find(item => item.id === id);
  if (!trail) throw new TypeError('Choose an available symbol trail.');
  return trail;
}

/** Preserve trail order and reject unrelated or repeated artwork in a comparison. */
export function comparisonCards(trailId, selectedIds) {
  const trail = getSymbolTrail(trailId);
  if (!Array.isArray(selectedIds) || selectedIds.length < 2 || selectedIds.length > 3 || new Set(selectedIds).size !== selectedIds.length || selectedIds.some(id => !trail.cards.some(card => card.cardId === id))) {
    throw new TypeError('Compare two or three different cards from the same trail.');
  }
  return trail.cards.filter(card => selectedIds.includes(card.cardId));
}

const COPY = {
  en: { title: 'Symbol trails', eyebrow: 'Look a little longer', introduction: 'Three visual trails through nine cards. Notice a detail, follow it into another image, and see what changes.', home: 'Home', deck: 'My living deck ↗', nav: 'Explore Olivia', choose: 'Choose a visual trail', study: 'One at a time', compare: 'Compare the cards', compareLabel: 'Choose two or three cards', comparison: 'See what changes', question: 'A question for you', observation: 'Look closely', detail: 'Where to look', card: 'Study this card', next: 'Next card', follow: 'Follow this detail', together: 'See the three cards together →', previous: 'Previous card', selected: 'Selected', all: 'Three cards in this trail', minimum: 'Keep at least two cards in your comparison.', count: n => `${n} cards in your comparison.`, swipe: 'Scroll sideways to compare the full cards →', scope: 'A curated study of Olivia’s artwork. These questions are invitations to reflect; your own associations may differ.', begin: 'Bring a question to the cards ↗', open: 'Explore this card ↗', missing: 'This artwork could not be loaded. The visual observation is available below.', retry: 'Try the artwork again', back: 'Return to one card', image: name => `${name} — complete Olivia Arcana artwork`, position: (i, n) => `${i} of ${n}` },
  uk: { title: 'Стежками символів', eyebrow: 'Затримайте погляд', introduction: 'Три візуальні стежки через дев’ять карт. Помітьте деталь, знайдіть її в іншому зображенні й подивіться, що змінюється.', home: 'Головна', deck: 'Моя жива колода ↗', nav: 'Досліджуйте Olivia', choose: 'Оберіть візуальну стежку', study: 'По одній', compare: 'Порівняти карти', compareLabel: 'Оберіть дві або три карти', comparison: 'Побачте, що змінюється', question: 'Запитання для вас', observation: 'Придивіться', detail: 'Куди дивитися', card: 'Розглянути карту', next: 'Наступна карта', follow: 'Простежити цю деталь', together: 'Побачити три карти разом →', previous: 'Попередня карта', selected: 'Обрано', all: 'Три карти цієї стежки', minimum: 'Залиште щонайменше дві карти для порівняння.', count: n => `Карт у порівнянні: ${n}.`, swipe: 'Гортайте вбік, щоб порівняти карти повністю →', scope: 'Вибране дослідження зображень Olivia. Ці запитання запрошують до роздумів; ваші власні асоціації можуть бути іншими.', begin: 'Прийти до карт із запитанням ↗', open: 'Дослідити карту ↗', missing: 'Не вдалося завантажити зображення. Опис деталей доступний нижче.', retry: 'Завантажити зображення знову', back: 'Повернутися до однієї карти', image: name => `${name} — повне зображення Olivia Arcana`, position: (i, n) => `${i} з ${n}` },
};

/**
 * Mounts into #symbols-view (or creates it alongside the other product views).
 * Integration: initSymbolTrails({assets, show:setView}).render(optionalTrailId).
 * Routing and the hero remain the caller's responsibility. No private data is read.
 */
export function initSymbolTrails({ assets, show, locale = getLocale(), root = document.getElementById('symbols-view') } = {}) {
  if (!assets?.cards || typeof show !== 'function') throw new TypeError('Symbol trails need card artwork and navigation.');
  const language = locale === 'uk' ? 'uk' : 'en', c = COPY[language];
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const link = (text, href, className = 'st-text-link') => { const a = make('a', className, text); a.href = href; return a; };
  const button = (text, className, handler) => { const node = make('button', className, text); node.type = 'button'; node.addEventListener('click', handler); return node; };
  const name = id => t(TAROT_CARDS[id].name, language);
  let trail = SYMBOL_TRAILS[0], activeCard = trail.cards[0].cardId, mode = 'study', selected = trail.cards.map(card => card.cardId);
  if (!root) { root = make('main'); root.id = 'symbols-view'; document.body.append(root); }
  root.classList.add('product-page', 'st-page'); root.hidden = true; root.dataset.noTranslate = 'true'; root.setAttribute('aria-labelledby', 'symbols-title');
  const top = make('div', 'page-top'), brand = link('Olivia ', '#home', 'brand'); brand.append(make('span', '', 'ARCANA'));
  const nav = make('nav'); nav.setAttribute('aria-label', c.nav); nav.append(link(c.home, '#home'), link(c.deck, '#my-deck')); top.append(brand, nav);
  const intro = make('header', 'st-intro'), title = make('h1', '', c.title); title.id = 'symbols-title'; title.tabIndex = -1;
  const introCopy = make('div'); introCopy.append(make('p', 'eyebrow', c.eyebrow), title); intro.append(introCopy, make('p', 'st-introduction', c.introduction));
  const trails = make('nav', 'st-trail-nav'); trails.setAttribute('aria-label', c.choose);
  const content = make('div', 'st-content'), status = make('p', 'sr-only'); status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true');
  const footer = make('footer', 'st-footer'); footer.append(make('p', '', c.scope), link(c.begin, '#question'));
  root.replaceChildren(top, intro, trails, content, status, footer);

  function artwork(cardId, className) {
    const frame = make('div', `st-artwork ${className || ''}`), image = make('img');
    image.alt = c.image(name(cardId)); image.width = 896; image.height = 1536; image.decoding = 'async';
    const failure = make('div', 'st-artwork-error'); failure.hidden = true; failure.append(make('p', '', c.missing));
    const retry = button(c.retry, 'st-text-link', () => { failure.hidden = true; image.hidden = false; image.src = assets.cards[cardId] || ''; }); failure.append(retry);
    image.addEventListener('error', () => { image.hidden = true; failure.hidden = false; });
    image.src = assets.cards[cardId] || ''; frame.append(image, failure); return frame;
  }

  function paintTrails() {
    trails.replaceChildren(...SYMBOL_TRAILS.map((item, index) => {
      const node = button('', 'st-trail-tab', () => {
        if (trail.id === item.id) return;
        trail = item; activeCard = item.cards[0].cardId; selected = item.cards.map(card => card.cardId); mode = 'study';
        paintTrails(); paint(); trails.querySelector(`[data-trail="${item.id}"]`).focus(); status.textContent = item[language].title;
      });
      node.dataset.trail = item.id; node.setAttribute('aria-pressed', String(trail.id === item.id));
      node.append(make('span', 'st-trail-number', `0${index + 1}`), make('span', '', item[language].name)); return node;
    }));
  }

  function modeControls() {
    const group = make('div', 'st-mode-controls'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', c.title);
    for (const value of ['study', 'compare']) {
      const toggle = button(c[value], 'st-mode-button', () => {
        if (mode === value) return;
        mode = value; paint(); content.querySelector(`[data-mode="${value}"]`).focus();
        status.textContent = value === 'compare' ? c.count(selected.length) : name(activeCard);
      });
      toggle.dataset.mode = value; toggle.setAttribute('aria-pressed', String(mode === value)); group.append(toggle);
    }
    return group;
  }

  function study() {
    const entry = trail.cards.find(card => card.cardId === activeCard), e = entry[language], index = trail.cards.indexOf(entry);
    const layout = make('article', 'st-study'), figure = make('figure', 'st-study-figure');
    figure.append(artwork(activeCard));
    const caption = make('figcaption'); caption.append(make('span', '', name(activeCard)), make('span', 'st-art-position', c.position(index + 1, trail.cards.length))); figure.append(caption);
    const copy = make('div', 'st-study-copy'), heading = make('h3', '', e.title); heading.id = 'st-card-title';
    copy.append(make('p', 'eyebrow', name(activeCard)), heading);
    const observation = make('section', 'st-observation'); observation.append(make('h4', '', c.observation), make('p', '', e.observation));
    const location = make('p', 'st-detail-location'); location.append(make('span', '', `${c.detail} / `), document.createTextNode(e.location)); observation.append(location);
    const reflection = make('section', 'st-reflection'); reflection.append(make('h4', '', c.question), make('p', '', e.reflection));
    const nextEntry = trail.cards[index + 1];
    const continueButton = button(nextEntry ? `${c.follow}: ${name(nextEntry.cardId)} →` : c.together, 'st-continue', () => {
      if (nextEntry) activeCard = nextEntry.cardId; else mode = 'compare';
      paint(); const target = nextEntry ? content.querySelector('#st-card-title') : content.querySelector('[data-mode=compare]');
      if (target) { if (nextEntry) target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'center' }); }
      status.textContent = nextEntry ? `${name(activeCard)}. ${nextEntry[language].title}` : c.count(selected.length);
    });
    copy.append(observation, reflection, continueButton, link(c.open, `#my-deck/${activeCard}`));
    const selector = make('nav', 'st-card-nav'); selector.setAttribute('aria-label', c.all);
    trail.cards.forEach((card, i) => {
      const node = button('', 'st-card-choice', () => {
        if (activeCard === card.cardId) return;
        activeCard = card.cardId; paint(); content.querySelector(`[data-card="${activeCard}"]`).focus(); status.textContent = `${name(activeCard)}. ${card[language].title}`;
      });
      node.dataset.card = card.cardId; node.setAttribute('aria-pressed', String(activeCard === card.cardId));
      node.append(make('span', 'st-card-choice-number', `0${i + 1}`), make('span', '', name(card.cardId)), make('span', 'st-card-choice-arrow', '↗')); selector.append(node);
    });
    layout.append(selector, figure, copy); return layout;
  }

  function compare() {
    const section = make('section', 'st-comparison');
    const controls = make('fieldset', 'st-compare-choices'); controls.append(make('legend', '', c.compareLabel));
    for (const entry of trail.cards) {
      const label = make('label'), input = make('input'); input.type = 'checkbox'; input.value = entry.cardId; input.checked = selected.includes(entry.cardId); input.dataset.compare = entry.cardId;
      input.addEventListener('change', () => {
        const next = input.checked ? [...selected, entry.cardId] : selected.filter(id => id !== entry.cardId);
        try { comparisonCards(trail.id, next); } catch { input.checked = true; status.textContent = c.minimum; return; }
        selected = next; paint(); content.querySelector(`[data-compare="${entry.cardId}"]`).focus(); status.textContent = c.count(selected.length);
      });
      label.append(input, document.createTextNode(name(entry.cardId))); controls.append(label);
    }
    section.append(controls, make('p', 'st-swipe-hint', c.swipe));
    const gallery = make('div', 'st-compare-gallery'); gallery.dataset.count = selected.length; gallery.tabIndex = 0; gallery.setAttribute('role', 'region'); gallery.setAttribute('aria-label', c.compare);
    for (const entry of comparisonCards(trail.id, selected)) {
      const figure = make('figure', 'st-compare-figure'), e = entry[language]; figure.append(artwork(entry.cardId));
      const caption = make('figcaption'); caption.append(make('h3', '', name(entry.cardId)), make('p', 'st-compare-detail', e.detail), make('p', 'st-compare-observation', e.observation), link(c.open, `#my-deck/${entry.cardId}`)); figure.append(caption); gallery.append(figure);
    }
    const note = make('div', 'st-comparison-note'), observation = make('div'), reflection = make('div');
    const comparison = selected.length === 3 ? trail[language].comparison : comparisonCards(trail.id, selected).map(entry => `${name(entry.cardId)} — ${entry[language].detail}`).join(' ');
    observation.append(make('h3', 'eyebrow', c.comparison), make('p', '', comparison));
    reflection.append(make('h3', 'eyebrow', c.question), make('p', '', trail[language].prompt)); note.append(observation, reflection);
    section.append(gallery, note); return section;
  }

  function paint() {
    const header = make('div', 'st-trail-heading'), wording = make('div');
    wording.append(make('h2', '', trail[language].title), make('p', '', trail[language].introduction));
    header.append(wording, modeControls()); content.replaceChildren(header, mode === 'study' ? study() : compare());
  }

  return {
    render(trailId) {
      if (trailId !== undefined) {
        const next = getSymbolTrail(trailId);
        if (next !== trail) { trail = next; activeCard = next.cards[0].cardId; selected = next.cards.map(card => card.cardId); mode = 'study'; }
      }
      paintTrails(); paint(); show('symbols'); title.focus({ preventScroll: true });
    },
  };
}
