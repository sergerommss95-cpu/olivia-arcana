/* Look closer: the carved details of the card in a reading, one at a time,
   described as they are seen before anything is said about meaning. */
import {loadLazy} from './lazy-json.js';

const COPY = {
  en: { open: 'Look closer at the carving', next: 'Next detail →', close: 'Close', of: (i, n) => `Detail ${i} of ${n}`, pin: name => `Detail: ${name}` },
  uk: { open: 'Роздивитися різьблення', next: 'Наступна деталь →', close: 'Закрити', of: (i, n) => `Деталь ${i} з ${n}`, pin: name => `Деталь: ${name}` },
};

/** Pin positions in percent of the artwork; a reversed card is shown turned, so its pins turn with it. */
export function pinPosition({ x, y }, orientation) {
  return orientation === 'reversed' ? { x: 100 - x, y: 100 - y } : { x, y };
}

export function mountPinWalk({ art, holder, cardId, orientation = 'upright', locale = 'en' }) {
  art.querySelector('.pin-walk-toggle')?.remove(); art.querySelector('.pin-walk-panel')?.remove(); holder.querySelector('.pin-walk-layer')?.remove();
  const language = locale === 'uk' ? 'uk' : 'en', c = COPY[language];
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const toggle = make('button', 'quiet-link pin-walk-toggle', `${c.open} ↗`); toggle.type = 'button'; toggle.setAttribute('aria-expanded', 'false');
  const layer = make('div', 'pin-walk-layer'); layer.hidden = true;
  const panel = make('section', 'pin-walk-panel'); panel.hidden = true; panel.dataset.noTranslate = 'true'; panel.setAttribute('aria-live', 'polite');
  holder.append(layer); art.append(toggle, panel);
  let pins = [], index = 0;
  function show(i) {
    index = i; const pin = pins[i];
    layer.replaceChildren(...pins.slice(0, i + 1).map((p, n) => {
      const dot = make('button', 'pin-walk-dot', String(n + 1)); dot.type = 'button'; dot.setAttribute('aria-label', c.pin(p.name));
      const { x, y } = pinPosition(p, orientation); dot.style.left = `${x}%`; dot.style.top = `${y}%`;
      if (n === i) dot.dataset.current = 'true';
      dot.addEventListener('click', () => show(n));
      return dot;
    }));
    const next = make('button', 'text-action', c.next); next.type = 'button'; next.hidden = i === pins.length - 1;
    next.addEventListener('click', () => { show(i + 1); panel.querySelector(i + 1 === pins.length - 1 ? '.quiet-link' : '.text-action')?.focus({ preventScroll: true }); });
    const close = make('button', 'quiet-link', c.close); close.type = 'button'; close.addEventListener('click', () => setOpen(false));
    const actions = make('div', 'pin-walk-actions'); actions.append(next, close);
    panel.replaceChildren(make('p', 'eyebrow', c.of(i + 1, pins.length)), make('h3', '', pin.name), make('p', '', pin.seen), actions);
  }
  async function setOpen(open) {
    if (open && !pins.length) {
      try { pins = (await loadLazy('pins', language))[cardId] || []; } catch { pins = []; }
      if (!pins.length) { toggle.hidden = true; return; }
    }
    toggle.setAttribute('aria-expanded', String(open)); toggle.hidden = open; layer.hidden = panel.hidden = !open;
    if (open) { show(0); panel.querySelector('h3')?.setAttribute('tabindex', '-1'); panel.querySelector('h3')?.focus({ preventScroll: true }); }
    else { layer.replaceChildren(); toggle.focus({ preventScroll: true }); }
  }
  toggle.addEventListener('click', () => setOpen(true));
  return { close: () => setOpen(false) };
}
