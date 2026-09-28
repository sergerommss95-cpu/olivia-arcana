import { getLocale, t } from './locale.js';
import { TAROT_CARDS, cardPageHref } from './deck-catalog.js';

/**
 * Symbols followed through the deck. The trails are generated from the card
 * academy (tools/sync-symbol-trails.mjs → symbol-trails-data.js) and served as
 * one JSON file per language, fetched the first time this view opens.
 */
export function findTrail(trails, id) {
  const trail = trails.find(item => item.id === id);
  if (!trail) throw new TypeError('Choose an available symbol trail.');
  return trail;
}

/** The artwork is 896 × 1536. */
const ASPECT = 1536 / 896;

/**
 * A magnified crop of one card, centred on a symbol, for a square frame:
 * `zoom` is the artwork's width as a multiple of the frame's width.
 */
export function loupeBackground({ x, y }, zoom = 3.2) {
  const clamp = value => Math.max(0, Math.min(100, value));
  const across = (0.5 - (x / 100) * zoom) / (1 - zoom);
  const down = (0.5 - (y / 100) * zoom * ASPECT) / (1 - zoom * ASPECT);
  return { size: `${Math.round(zoom * 100)}% auto`, position: `${clamp(across * 100).toFixed(1)}% ${clamp(down * 100).toFixed(1)}%` };
}

/** Ukrainian noun form for a count: 1 карту, 2 карти, 5 карт. */
const ukForm = (n, one, few, many) => {
  const tens = n % 100, units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  return units === 1 ? one : units >= 2 && units <= 4 ? few : many;
};

const COPY = {
  en: { title: 'The language of symbols', eyebrow: 'Look a little longer', introduction: (trails, cards) => `${trails} ${trails === 1 ? 'symbol' : 'symbols'} followed through ${cards} cards. Choose one, see where it appears, and notice how its meaning shifts from card to card.`, home: 'Home', deck: 'All 78 cards ↗', nav: 'Explore Olivia', choose: 'Choose a symbol', study: 'One card at a time', compare: 'See it change', seen: 'What you see', meaning: 'What it carries', how: 'How it changes', question: 'A question for you', follow: 'Follow it to', together: 'See it change across the cards →', all: n => `${n} cards in this trail`, count: n => `${n} cards`, scope: 'A study of the symbols carved into Olivia’s deck and what they have traditionally meant. Your own associations may differ, and they count.', begin: 'Bring a question to the cards ↗', open: 'Read the whole card ↗', missing: 'This artwork could not be loaded. The description is available below.', retry: 'Try the artwork again', image: name => `${name} — complete Olivia Arcana artwork`, position: (i, n) => `${i} of ${n}`, pin: name => `Where to look: ${name}`, loading: 'Opening the symbols…', failed: 'The symbols could not be loaded.', again: 'Try again' },
  uk: { title: 'Мова символів', eyebrow: 'Затримайте погляд', introduction: (trails, cards) => `${trails} ${ukForm(trails, 'символ, простежений', 'символи, простежені', 'символів, простежених')} через ${cards} ${ukForm(cards, 'карту', 'карти', 'карт')}. Оберіть символ, подивіться, де він з’являється, і помітьте, як його значення змінюється від карти до карти.`, home: 'Головна', deck: 'Усі 78 карт ↗', nav: 'Досліджуйте Olivia', choose: 'Оберіть символ', study: 'По одній карті', compare: 'Побачити зміну', seen: 'Що видно', meaning: 'Що це несе', how: 'Як він змінюється', question: 'Запитання для вас', follow: 'Далі:', together: 'Побачити, як він змінюється →', all: n => `Карт у цій стежці: ${n}`, count: n => `Карт: ${n}`, scope: 'Дослідження символів, вирізьблених у колоді Olivia, і того, що вони традиційно означали. Ваші власні асоціації можуть бути іншими, і вони теж важливі.', begin: 'Прийти до карт із запитанням ↗', open: 'Прочитати всю карту ↗', missing: 'Не вдалося завантажити зображення. Опис доступний нижче.', retry: 'Завантажити зображення знову', image: name => `${name} — повне зображення Olivia Arcana`, position: (i, n) => `${i} / ${n}`, pin: name => `Куди дивитися: ${name}`, loading: 'Відкриваємо символи…', failed: 'Не вдалося завантажити символи.', again: 'Спробувати знову' },
};

/**
 * Mounts into #symbols-view (or creates it alongside the other product views).
 * Integration: initSymbolTrails({assets, show:setView}).render(optionalTrailId, optionalCardId).
 * Routing and the hero remain the caller's responsibility. No private data is read.
 */
export function initSymbolTrails({ assets, show, locale = getLocale(), root = document.getElementById('symbols-view') } = {}) {
  if (!assets?.cards || typeof show !== 'function') throw new TypeError('Symbol trails need card artwork and navigation.');
  const language = locale === 'uk' ? 'uk' : 'en', c = COPY[language];
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const link = (text, href, className = 'st-text-link') => { const a = make('a', className, text); a.href = href; return a; };
  const button = (text, className, handler) => { const node = make('button', className, text); node.type = 'button'; node.addEventListener('click', handler); return node; };
  const name = id => t(TAROT_CARDS[id].name, language);
  const site = window.OLIVIA_NATIVE === true || new URLSearchParams(location.search).get('site') === '1';
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  let trails = null, trail = null, active = 0, mode = 'study', loading = null;
  if (!root) { root = make('main'); root.id = 'symbols-view'; document.body.append(root); }
  root.classList.add('product-page', 'st-page'); root.hidden = true; root.dataset.noTranslate = 'true'; root.setAttribute('aria-labelledby', 'symbols-title');
  const top = make('div', 'page-top'), brand = link('Olivia ', '#home', 'brand'); brand.append(make('span', '', 'ARCANA'));
  const nav = make('nav'); nav.setAttribute('aria-label', c.nav);
  const library = link(c.deck, `${site ? '' : 'https://oliviaarcana.com'}${language === 'uk' ? '/uk' : ''}/cards/`); if (site) library.target = '_top';
  nav.append(link(c.home, '#home'), library); top.append(brand, nav);
  const intro = make('header', 'st-intro'), title = make('h1', '', c.title); title.id = 'symbols-title'; title.tabIndex = -1;
  const introCopy = make('div'); introCopy.append(make('p', 'eyebrow', c.eyebrow), title); const introText = make('p', 'st-introduction'); intro.append(introCopy, introText);
  const index = make('nav', 'st-trail-index'); index.setAttribute('aria-label', c.choose);
  const content = make('div', 'st-content'), status = make('p', 'sr-only'); status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true');
  const footer = make('footer', 'st-footer'); footer.append(make('p', '', c.scope), link(c.begin, '#question'));
  root.replaceChildren(top, intro, index, content, status, footer);

  function loupe(entry, className = 'st-loupe') {
    const frame = make('span', className); frame.setAttribute('aria-hidden', 'true');
    const { size, position } = loupeBackground(entry);
    frame.style.backgroundImage = `url("${assets.cards[entry.cardId] || ''}")`;
    frame.style.backgroundSize = size; frame.style.backgroundPosition = position;
    return frame;
  }

  function artwork(entry) {
    const frame = make('div', 'st-artwork'), image = make('img');
    image.alt = c.image(name(entry.cardId)); image.width = 896; image.height = 1536; image.decoding = 'async';
    const lens = make('span', 'st-lens'); lens.setAttribute('aria-hidden', 'true');
    lens.style.setProperty('--lx', entry.x); lens.style.setProperty('--ly', entry.y);
    const pin = make('span', 'st-pin'); pin.style.left = `${entry.x}%`; pin.style.top = `${entry.y}%`; pin.setAttribute('role', 'img'); pin.setAttribute('aria-label', c.pin(entry.name));
    const failure = make('div', 'st-artwork-error'); failure.hidden = true; failure.append(make('p', '', c.missing));
    const retry = button(c.retry, 'st-text-link', () => { failure.hidden = true; image.hidden = false; image.src = assets.cards[entry.cardId] || ''; }); failure.append(retry);
    image.addEventListener('error', () => { image.hidden = true; lens.hidden = true; pin.hidden = true; failure.hidden = false; });
    image.addEventListener('load', () => { lens.hidden = false; pin.hidden = false; });
    image.src = assets.cards[entry.cardId] || ''; frame.append(image, lens, pin, failure); return frame;
  }

  function paintIndex() {
    const groups = [];
    for (const item of trails) {
      const label = item.group;
      let group = groups.find(g => g.label === label);
      if (!group) { group = { label, items: [] }; groups.push(group); }
      group.items.push(item);
    }
    index.replaceChildren(...groups.map(group => {
      const section = make('div', 'st-trail-group'), tiles = make('div', 'st-trail-tiles');
      section.append(make('p', 'st-trail-group-title', group.label), tiles);
      tiles.append(...group.items.map(tile));
      return section;
    }));
  }

  function tile(item) {
    const node = button('', 'st-trail-tile', () => {
      if (trail.id === item.id) return;
      trail = item; active = 0; mode = 'study';
      paintIndex(); paint();
      const heading = content.querySelector('#st-trail-title');
      heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' });
      status.textContent = item.title;
    });
    node.dataset.trail = item.id; node.setAttribute('aria-pressed', String(trail.id === item.id));
    const words = make('span', 'st-trail-words'); words.append(make('span', 'st-trail-name', item.name), make('span', 'st-trail-count', c.count(item.cards.length)));
    node.append(loupe(item.cards[0], 'st-loupe st-tile-loupe'), words); return node;
  }

  function modeControls() {
    const group = make('div', 'st-mode-controls'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', trail.name);
    for (const value of ['study', 'compare']) {
      const toggle = button(c[value], 'st-mode-button', () => {
        if (mode === value) return;
        mode = value; paint(); content.querySelector(`[data-mode="${value}"]`).focus();
        status.textContent = value === 'compare' ? c.how : name(trail.cards[active].cardId);
      });
      toggle.dataset.mode = value; toggle.setAttribute('aria-pressed', String(mode === value)); group.append(toggle);
    }
    return group;
  }

  function goTo(i, focusTitle = true) {
    active = i; mode = 'study'; paint();
    if (focusTitle) { const target = content.querySelector('#st-card-title'); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'center' }); }
    status.textContent = `${name(trail.cards[i].cardId)}. ${trail.cards[i].name}`;
  }

  function study() {
    const entry = trail.cards[active];
    const layout = make('article', 'st-study'), figure = make('figure', 'st-study-figure');
    figure.append(artwork(entry));
    const caption = make('figcaption'); caption.append(make('span', '', name(entry.cardId)), make('span', 'st-art-position', c.position(active + 1, trail.cards.length))); figure.append(caption);
    const copy = make('div', 'st-study-copy'), heading = make('h3', '', entry.name); heading.id = 'st-card-title'; heading.tabIndex = -1;
    copy.append(make('p', 'eyebrow', name(entry.cardId)), heading);
    const seen = make('section', 'st-observation'); seen.append(make('h4', '', c.seen), make('p', '', entry.seen));
    const meaning = make('section', 'st-reflection'); meaning.append(make('h4', '', c.meaning), make('p', '', entry.meaning));
    const nextEntry = trail.cards[active + 1];
    const continueButton = button(nextEntry ? `${c.follow} ${name(nextEntry.cardId)} →` : c.together, 'st-continue', () => {
      if (nextEntry) goTo(active + 1);
      else { mode = 'compare'; paint(); content.querySelector('[data-mode=compare]')?.focus(); status.textContent = c.how; }
    });
    const read = link(c.open, cardPageHref(entry.cardId, language)); if (site) read.target = '_top';
    copy.append(seen, meaning, continueButton, read);
    const selector = make('nav', 'st-card-nav'); selector.setAttribute('aria-label', c.all(trail.cards.length));
    trail.cards.forEach((card, i) => {
      const node = button('', 'st-card-choice', () => { if (active !== i) { goTo(i, false); content.querySelector(`[data-card-index="${i}"]`)?.focus(); } });
      node.dataset.cardIndex = i; node.setAttribute('aria-pressed', String(active === i));
      node.append(loupe(card, 'st-loupe st-choice-loupe'), make('span', '', name(card.cardId)), make('span', 'st-card-choice-arrow', '↗')); selector.append(node);
    });
    layout.append(selector, figure, copy); return layout;
  }

  function compare() {
    const section = make('section', 'st-comparison');
    const row = make('ol', 'st-loupe-row'); row.setAttribute('aria-label', c.all(trail.cards.length));
    trail.cards.forEach((entry, i) => {
      const item = make('li'), open = button('', 'st-loupe-card', () => goTo(i));
      open.append(loupe(entry, 'st-loupe st-compare-loupe'), make('span', 'st-loupe-card-name', name(entry.cardId)), make('span', 'st-loupe-symbol', entry.name));
      item.append(open, make('p', 'st-loupe-seen', entry.seen)); row.append(item);
    });
    const note = make('div', 'st-comparison-note'), how = make('div'), reflection = make('div');
    how.append(make('h3', 'eyebrow', c.how), make('p', '', trail.comparison));
    reflection.append(make('h3', 'eyebrow', c.question), make('p', '', trail.prompt)); note.append(how, reflection);
    section.append(row, note); return section;
  }

  function paint() {
    const header = make('div', 'st-trail-heading'), wording = make('div');
    const heading = make('h2', '', trail.title); heading.id = 'st-trail-title'; heading.tabIndex = -1;
    wording.append(make('p', 'eyebrow', trail.name), heading, make('p', '', trail.introduction));
    header.append(wording, modeControls()); content.replaceChildren(header, mode === 'study' ? study() : compare());
  }

  function load() {
    loading ||= fetch(assets.trails?.[language] || '')
      .then(response => { if (!response.ok) throw new Error(`Symbol trails: ${response.status}`); return response.json(); })
      .then(data => {
        trails = data; trail = trails[0];
        const cards = new Set(trails.flatMap(item => item.cards.map(entry => entry.cardId))).size;
        introText.textContent = c.introduction(trails.length, cards);
      })
      .catch(error => { loading = null; throw error; });
    return loading;
  }

  function waiting(failed, retry) {
    index.replaceChildren();
    const note = make('div', 'st-loading'); note.setAttribute('role', 'status');
    note.append(make('p', '', failed ? c.failed : c.loading));
    if (failed) note.append(button(c.again, 'st-text-link', retry));
    content.replaceChildren(note);
  }

  return {
    async render(trailId, cardId) {
      show('symbols'); title.focus({ preventScroll: true });
      if (!trails) {
        waiting(false);
        try { await load(); } catch { waiting(true, () => this.render(trailId, cardId)); return; }
      }
      let next = trail;
      if (trailId) { try { next = findTrail(trails, trailId); } catch { next = trails[0]; } }
      if (next !== trail) { trail = next; active = 0; mode = 'study'; }
      const at = cardId === undefined ? -1 : trail.cards.findIndex(entry => entry.cardId === Number(cardId));
      if (at >= 0) { active = at; mode = 'study'; }
      paintIndex(); paint();
    },
  };
}
