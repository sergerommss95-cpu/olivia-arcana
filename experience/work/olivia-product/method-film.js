// The How Olivia works film (made with work/tools/how-it-works), in the page's
// language: a portrait cut on phones and a landscape cut otherwise. Both cuts
// share one timeline, so switching layout keeps the moment.
// Nothing loads until the film nears the screen. It plays muted while it is in
// view and its answer is open. With reduced motion or data saving it waits for
// the play button, and after the visitor pauses it stays paused until they play.
import {getLocale} from './locale.js';

export const FILM_PHONE = '(max-width:700px)';
export const FILM_LABELS = {play: 'Play the film', pause: 'Pause the film', again: 'Play the film again'};

/** The cut for a language and layout: its poster and sources, best format first. */
export function filmSources(film, locale, phone) {
 const cut = film?.[locale]?.[phone ? 'phone' : 'wide'];
 if (!cut?.mp4) return null;
 return {poster: cut.poster || '', sources: [['webm', 'video/webm'], ['mp4', 'video/mp4']].filter(([kind]) => cut[kind]).map(([kind, type]) => ({src: cut[kind], type}))};
}

/** The button's state for a video: play, pause, or play again once it has ended. */
export const filmState = video => video.ended ? 'again' : video.paused ? 'play' : 'pause';

export function mountMethodFilm(item, film, {locale = getLocale(), win = window} = {}) {
 const figure = item?.querySelector('.method-film'), video = figure?.querySelector('video'), button = figure?.querySelector('.method-film-toggle'), details = item?.querySelector('details');
 if (!video || !button || !details || !filmSources(film, locale, false) || !filmSources(film, locale, true)) return null;
 item.hidden = false;
 // Autoplay needs a muted, inline video (iOS Safari reads the property).
 video.muted = true;
 video.playsInline = true;
 const phone = win.matchMedia(FILM_PHONE), calm = win.matchMedia('(prefers-reduced-motion: reduce)');
 const saving = () => Boolean(win.navigator?.connection?.saveData);
 let layout = null, near = false, inView = false, held = false;

 function show() {
  const state = filmState(video);
  button.dataset.state = state;
  button.setAttribute('aria-label', FILM_LABELS[state]);
 }
 function play() {
  const attempt = video.play();
  if (attempt?.catch) attempt.catch(show);
 }
 // Sources, and the poster, go in only when the film is near: a visit that never
 // scrolls here downloads nothing.
 function load() {
  const next = phone.matches;
  if (layout === next) return;
  const resume = layout !== null && !video.paused, at = layout !== null ? video.currentTime : 0, cut = filmSources(film, locale, next);
  layout = next;
  figure.dataset.layout = next ? 'phone' : 'wide';
  video.poster = cut.poster;
  video.preload = 'metadata';
  video.replaceChildren(...cut.sources.map(({src, type}) => Object.assign(win.document.createElement('source'), {src, type})));
  video.load();
  if (at) video.addEventListener('loadedmetadata', () => { video.currentTime = at; }, {once: true});
  if (resume) play();
 }
 function update() {
  if (!near) return;
  load();
  const watched = inView && details.open && !win.document.hidden;
  if (!watched) { if (!video.paused) video.pause(); return; }
  if (video.paused && !video.ended && !held && !calm.matches && !saving()) play();
 }
 function toggle() {
  if (!video.paused) { held = true; video.pause(); return; }
  held = false;
  if (!near) { near = true; load(); }
  if (video.ended) video.currentTime = 0;
  play();
 }

 button.addEventListener('click', toggle);
 video.addEventListener('click', toggle);
 for (const type of ['play', 'playing', 'pause', 'ended', 'emptied']) video.addEventListener(type, show);
 details.addEventListener('toggle', update);
 win.document.addEventListener('visibilitychange', update);
 phone.addEventListener?.('change', update);
 calm.addEventListener?.('change', update);
 const Observer = win.IntersectionObserver;
 if (Observer) {
  new Observer(entries => { if (entries.some(entry => entry.isIntersecting)) { near = true; update(); } }, {rootMargin: '400px 0px'}).observe(figure);
  new Observer(entries => { inView = entries.at(-1).intersectionRatio >= .4; update(); }, {threshold: [0, .4, .8]}).observe(figure);
 } else {
  // Without observers, show the poster and wait for the play button.
  near = true;
  held = true;
  update();
 }
 show();
 return {update, toggle, get layout() { return layout; }};
}
