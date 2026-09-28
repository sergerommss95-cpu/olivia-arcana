const DECK_LIBRARY_COPY = {
  en: {
    home: 'Back to Olivia', library: 'The deck collection', title: 'Find a deck<br>that <em>feels like you.</em>',
    intro: 'The same 78 cards. A different world to enter. Choose the artwork you feel drawn to, and carry it into your reading.',
    browse: 'Explore the collection', current: 'Your current deck', choose: 'Use this deck', chosen: 'Selected', selecting: 'Choosing your deck…',
    begin: 'Begin a reading', artwork: 'The artwork', reverse: 'The reverse', artViews: 'Explore the artwork',
    previous: 'Previous card artwork', next: 'Next card artwork', cardBack: 'Card back',
    collection: 'A complete 78-card deck', detail: 'A closer look', saved: 'Your deck is ready for your next reading.',
    error: 'Your deck could not be changed. Please try again.',
    footTitle: 'Follow what draws you in.', foot: 'A deck changes the images, not the meaning of the cards. You can choose another whenever you like; the readings you have kept stay as they were.',
    see: 'Discover', of: 'of', selectedLabel: 'Selected deck', change: 'Choose a different deck',
  },
  uk: {
    home: 'До Olivia', library: 'Колекція колод', title: 'Знайдіть колоду,<br>що <em>відгукується вам.</em>',
    intro: 'Ті самі 78 карт. Інший світ образів. Оберіть мистецтво, яке вас приваблює, і запросіть його у своє читання.',
    browse: 'Дослідити колекцію', current: 'Ваша обрана колода', choose: 'Обрати цю колоду', chosen: 'Обрано', selecting: 'Обираємо вашу колоду…',
    begin: 'Почати читання', artwork: 'Образи карт', reverse: 'Зворот карти', artViews: 'Розглянути образи',
    previous: 'Попередня карта', next: 'Наступна карта', cardBack: 'Зворот карти',
    collection: 'Повна колода з 78 карт', detail: 'Придивіться ближче', saved: 'Ваша колода готова до наступного читання.',
    error: 'Не вдалося змінити колоду. Спробуйте ще раз.',
    footTitle: 'Довіртеся тому, що приваблює.', foot: 'Колода змінює образи, а не значення карт. Ви можете обрати іншу будь-коли; збережені читання залишаться такими, якими були.',
    see: 'Переглянути', of: 'із', selectedLabel: 'Обрана колода', change: 'Обрати іншу колоду',
  },
};

const escapeDeckText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

/** An art-led collection. Deck selection and reading navigation belong to the app. */
export function initDeckLibrary({ decks = [], getSelectedId, onSelect, onBegin, locale = 'en' }) {
  const c = DECK_LIBRARY_COPY[locale === 'uk' ? 'uk' : 'en'];
  const otherLocale = locale === 'uk' ? 'en' : 'uk';
  const languageUrl = new URL(window.location.href);
  if (window.OLIVIA_NATIVE) {
    languageUrl.pathname = otherLocale === 'uk' ? '/uk/decks/' : '/decks/';
    languageUrl.search = '';
    languageUrl.hash = '';
  } else {
    // Hosted previews have separate localized documents; portable HTML uses ?lang=.
    if (/index(?:\.uk)?\.html$/.test(languageUrl.pathname)) languageUrl.pathname = languageUrl.pathname.replace(/index(?:\.uk)?\.html$/, otherLocale === 'uk' ? 'index.uk.html' : 'index.html');
    languageUrl.searchParams.set('lang', otherLocale);
    languageUrl.hash = 'decks';
  }
  const languageLink = className => `<a class="dl-language ${className}" href="${escapeDeckText(languageUrl.href)}" lang="${otherLocale}" hreflang="${otherLocale}">${otherLocale === 'uk' ? 'Українська' : 'English'}</a>`;
  const element = document.createElement('section');
  element.id = 'decks-view';
  element.className = 'dl-page';
  element.hidden = true;
  element.dataset.noTranslate = 'true';
  element.setAttribute('aria-labelledby', 'decks-title');
  const views = new Map(decks.map(deck => [deck.id, { index: 0, reverse: false }]));
  let busy = false;
  let statusTimer;

  element.innerHTML = `
    <header class="dl-header"><a class="dl-brand" href="#home" aria-label="Olivia Arcana — ${escapeDeckText(c.home)}">Olivia <span>ARCANA</span></a><div class="dl-header-links">${languageLink('dl-desktop-language')}<a class="dl-home" href="#home"><span aria-hidden="true">←</span> ${escapeDeckText(c.home)}</a></div></header>
    <div class="dl-intro"><div><div class="dl-intro-overline"><p class="dl-kicker">${escapeDeckText(c.library)}</p>${languageLink('dl-mobile-language')}</div><h1 id="decks-title" tabindex="-1">${c.title}</h1></div><div class="dl-intro-copy"><p>${escapeDeckText(c.intro)}</p><div class="dl-collection-links" aria-label="${escapeDeckText(c.browse)}">${decks.map((deck, i) => `<button type="button" class="dl-jump" data-deck-jump="${escapeDeckText(deck.id)}"><span class="dl-jump-number">0${i + 1}</span><span>${escapeDeckText(deck.name)}</span><i aria-hidden="true">↓</i></button>`).join('')}</div></div></div>
    <div class="dl-collection">${decks.map((deck, i) => {
      const previews = deck.previews || [];
      const first = previews[0] || { src: deck.back, name: c.cardBack };
      const second = previews[1] || first;
      const third = previews[2] || first;
      return `<article class="dl-deck" id="deck-edition-${i}" data-deck-id="${escapeDeckText(deck.id)}" data-tone="${i % 2 ? 'velvet' : 'lapis'}" aria-labelledby="deck-name-${i}">
        <div class="dl-art-column"><div class="dl-scene" data-show="artwork" aria-label="${escapeDeckText(deck.name)} — ${escapeDeckText(c.artViews)}">
          <div class="dl-scene-light" aria-hidden="true"></div>
          <img class="dl-card dl-card-reverse" src="${escapeDeckText(deck.back)}" alt="" loading="lazy" decoding="async" width="958" height="1642">
          <img class="dl-card dl-card-left" src="${escapeDeckText(second.src)}" alt="" loading="lazy" decoding="async" width="958" height="1642">
          <img class="dl-card dl-card-right" src="${escapeDeckText(third.src)}" alt="" loading="lazy" decoding="async" width="958" height="1642">
          <img class="dl-card dl-card-main" src="${escapeDeckText(first.src)}" alt="${escapeDeckText(first.name)} — ${escapeDeckText(deck.name)}" loading="lazy" decoding="async" width="958" height="1642">
        </div>
        <div class="dl-art-controls"><div class="dl-face-switch" role="group" aria-label="${escapeDeckText(c.artViews)}"><button type="button" data-deck-view="artwork" aria-pressed="true">${escapeDeckText(c.artwork)}</button><button type="button" data-deck-view="reverse" aria-pressed="false">${escapeDeckText(c.reverse)}</button></div><div class="dl-card-pager"><button type="button" data-deck-step="-1" aria-label="${escapeDeckText(c.previous)}"><span aria-hidden="true">←</span></button><span class="dl-card-caption" aria-live="polite" aria-atomic="true"><span class="dl-card-count">1 / ${previews.length || 1}</span><span class="dl-card-name">${escapeDeckText(first.name)}</span></span><button type="button" data-deck-step="1" aria-label="${escapeDeckText(c.next)}"><span aria-hidden="true">→</span></button></div></div></div>
        <div class="dl-deck-copy"><div class="dl-edition-line"><span class="dl-edition-number">0${i + 1}</span><span class="dl-current" hidden><i aria-hidden="true">✓</i>${escapeDeckText(c.current)}</span></div><p class="dl-kicker dl-deck-subtitle">${escapeDeckText(deck.subtitle)}</p><h2 id="deck-name-${i}">${escapeDeckText(deck.name)}</h2><p class="dl-description">${escapeDeckText(deck.description)}</p><p class="dl-material">${escapeDeckText(deck.material)}</p><ul class="dl-tags" aria-label="${escapeDeckText(c.detail)}">${(deck.tags || []).map(tag => `<li>${escapeDeckText(tag)}</li>`).join('')}</ul><div class="dl-deck-actions"><button class="dl-primary" type="button" data-deck-select><span>${escapeDeckText(c.choose)}</span><i aria-hidden="true">↗</i></button><button class="dl-begin" type="button" data-deck-begin><span>${escapeDeckText(c.begin)}</span><i aria-hidden="true">→</i></button></div><p class="dl-complete"><span aria-hidden="true">✦</span>${escapeDeckText(c.collection)}</p></div>
      </article>`;
    }).join('')}</div>
    <footer class="dl-footer"><span class="dl-footer-mark" aria-hidden="true">✧</span><h2>${escapeDeckText(c.footTitle)}</h2><p>${escapeDeckText(c.foot)}</p></footer><p class="dl-status" role="status" aria-live="polite"></p>`;

  const anchor = document.querySelector('#journal-view');
  if (anchor) anchor.before(element); else document.body.append(element);

  const findDeck = id => decks.find(deck => deck.id === id);
  const status = element.querySelector('.dl-status');
  const articles = [...element.querySelectorAll('.dl-deck')];

  function refresh() {
    const selected = getSelectedId?.();
    for (const article of articles) {
      const isSelected = article.dataset.deckId === selected;
      article.dataset.selected = String(isSelected);
      article.querySelector('.dl-current').hidden = !isSelected;
      const select = article.querySelector('[data-deck-select]');
      select.disabled = busy || isSelected;
      select.setAttribute('aria-pressed', String(isSelected));
      select.querySelector('span').textContent = isSelected ? c.chosen : c.choose;
      select.querySelector('i').textContent = isSelected ? '✓' : '↗';
      article.querySelector('[data-deck-begin]').disabled = busy;
      element.querySelector(`[data-deck-jump="${CSS.escape(article.dataset.deckId)}"]`)?.setAttribute('data-selected', String(isSelected));
    }
  }

  function updateArtwork(article) {
    const deck = findDeck(article.dataset.deckId), view = views.get(deck.id);
    const previews = deck.previews || [];
    if (!previews.length) return;
    const front = previews[view.index];
    const scene = article.querySelector('.dl-scene');
    const main = scene.querySelector('.dl-card-main');
    main.src = view.reverse ? deck.back : front.src;
    main.alt = `${view.reverse ? c.cardBack : front.name} — ${deck.name}`;
    scene.querySelector('.dl-card-left').src = previews[(view.index + 1) % previews.length].src;
    scene.querySelector('.dl-card-right').src = previews[(view.index + 2) % previews.length].src;
    scene.querySelector('.dl-card-reverse').src = view.reverse ? front.src : deck.back;
    scene.dataset.show = view.reverse ? 'reverse' : 'artwork';
    article.querySelector('.dl-card-name').textContent = view.reverse ? c.cardBack : front.name;
    article.querySelector('.dl-card-count').textContent = view.reverse ? deck.name : `${view.index + 1} / ${previews.length}`;
    for (const button of article.querySelectorAll('[data-deck-view]')) button.setAttribute('aria-pressed', String((button.dataset.deckView === 'reverse') === view.reverse));
    for (const button of article.querySelectorAll('[data-deck-step]')) button.disabled = view.reverse || previews.length < 2;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && main.animate) main.animate([{ opacity: .4, filter: 'brightness(.85)' }, { opacity: 1, filter: 'brightness(1)' }], { duration: 300, easing: 'ease-out' });
  }

  element.addEventListener('click', async event => {
    const jump = event.target.closest('[data-deck-jump]');
    if (jump) {
      const target = articles.find(article => article.dataset.deckId === jump.dataset.deckJump);
      target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      return;
    }
    const article = event.target.closest('.dl-deck');
    if (!article) return;
    const id = article.dataset.deckId, view = views.get(id);
    const face = event.target.closest('[data-deck-view]');
    if (face) { view.reverse = face.dataset.deckView === 'reverse'; updateArtwork(article); return; }
    const step = event.target.closest('[data-deck-step]');
    if (step) {
      const length = findDeck(id).previews.length;
      view.index = (view.index + Number(step.dataset.deckStep) + length) % length;
      updateArtwork(article);
      return;
    }
    const select = event.target.closest('[data-deck-select]'), begin = event.target.closest('[data-deck-begin]');
    if ((!select && !begin) || busy) return;
    busy = true;
    clearTimeout(statusTimer);
    status.textContent = c.selecting;
    refresh();
    try {
      const result = begin ? await onBegin?.(id) : await onSelect?.(id);
      status.textContent = result === false ? c.error : c.saved;
      if (result !== false) statusTimer = setTimeout(() => { status.textContent = ''; }, 4500);
    } catch {
      status.textContent = c.error;
    } finally {
      busy = false;
      refresh();
    }
  });

  refresh();
  return {
    element,
    refresh,
    render({ focus = true } = {}) {
      element.hidden = false;
      clearTimeout(statusTimer);
      status.textContent = '';
      refresh();
      if (focus) element.querySelector('#decks-title').focus({ preventScroll: true });
    },
  };
}
