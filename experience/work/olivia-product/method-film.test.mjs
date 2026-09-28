import test from 'node:test';
import assert from 'node:assert/strict';
import {FILM_LABELS, filmSources, mountMethodFilm} from './method-film.js';

const FILM = {
 en: {phone: {webm: 'assets/film-en-phone.1.webm', mp4: 'assets/film-en-phone.2.mp4', poster: 'assets/film-en-phone-poster.1.webp'}, wide: {webm: 'assets/film-en-wide.1.webm', mp4: 'assets/film-en-wide.2.mp4', poster: 'assets/film-en-wide-poster.1.webp'}},
 uk: {phone: {webm: 'assets/film-uk-phone.1.webm', mp4: 'assets/film-uk-phone.2.mp4', poster: 'assets/film-uk-phone-poster.1.webp'}, wide: {webm: 'assets/film-uk-wide.1.webm', mp4: 'assets/film-uk-wide.2.mp4', poster: 'assets/film-uk-wide-poster.1.webp'}},
};

class Events {
 constructor() { this.listeners = []; }
 addEventListener(type, fn, options) { this.listeners.push({type, fn, once: options?.once}); }
 dispatch(type) { for (const entry of [...this.listeners]) if (entry.type === type) { if (entry.once) this.listeners.splice(this.listeners.indexOf(entry), 1); entry.fn({type}); } }
}
class Video extends Events {
 constructor() { super(); Object.assign(this, {paused: true, ended: false, currentTime: 0, poster: '', preload: 'none', muted: false, playsInline: false, children: [], plays: 0}); }
 play() { this.plays++; this.paused = false; this.ended = false; this.dispatch('play'); return Promise.resolve(); }
 pause() { this.paused = true; this.dispatch('pause'); }
 load() { this.paused = true; this.currentTime = 0; this.dispatch('emptied'); }
 replaceChildren(...nodes) { this.children = nodes; }
 finish() { this.paused = true; this.ended = true; this.dispatch('ended'); }
}
class Button extends Events {
 constructor() { super(); this.dataset = {}; this.attributes = {}; }
 setAttribute(name, value) { this.attributes[name] = value; }
 click() { this.dispatch('click'); }
}

function setup({locale = 'en', phone = false, calm = false, saveData = false, film = FILM, observers = true} = {}) {
 const video = new Video(), button = new Button(), details = Object.assign(new Events(), {open: true});
 const figure = {dataset: {}, querySelector: s => ({video, '.method-film-toggle': button})[s]};
 const item = {hidden: true, querySelector: s => ({'.method-film': figure, details})[s]};
 const queries = {};
 const matchMedia = query => (queries[query] ??= Object.assign(new Events(), {matches: query.includes('reduced-motion') ? calm : phone}));
 const document = Object.assign(new Events(), {hidden: false, createElement: tag => ({tag})});
 const made = [];
 class IntersectionObserver { constructor(callback, options) { made.push({callback, options}); } observe() {} }
 const win = {matchMedia, document, navigator: {connection: {saveData}}, ...(observers ? {IntersectionObserver} : {})};
 const player = mountMethodFilm(item, film, {locale, win});
 const near = () => made[0].callback([{isIntersecting: true}]);
 const view = ratio => made[1].callback([{isIntersecting: ratio > 0, intersectionRatio: ratio}]);
 const media = query => queries[query];
 return {player, item, figure, video, button, details, document, near, view, media};
}

test('each language has its own cut, the phone cut on phones, WebM before MP4', () => {
 assert.deepEqual(filmSources(FILM, 'uk', true), {poster: FILM.uk.phone.poster, sources: [{src: FILM.uk.phone.webm, type: 'video/webm'}, {src: FILM.uk.phone.mp4, type: 'video/mp4'}]});
 assert.deepEqual(filmSources({en: {wide: {mp4: 'a.mp4'}}}, 'en', false), {poster: '', sources: [{src: 'a.mp4', type: 'video/mp4'}]});
 assert.deepEqual(filmSources(FILM, 'en', false).sources, [{src: FILM.en.wide.webm, type: 'video/webm'}, {src: FILM.en.wide.mp4, type: 'video/mp4'}]);
 assert.equal(filmSources(FILM, 'de', false), null);
 assert.equal(filmSources(undefined, 'en', false), null);
});

test('without a film (the portable file) the answer stays out of the page', () => {
 const {player, item} = setup({film: null});
 assert.equal(player, null);
 assert.equal(item.hidden, true);
});

test('nothing loads until the film nears the screen; then it plays muted in view', () => {
 const {item, video, button, near, view} = setup();
 assert.equal(item.hidden, false);
 assert.equal(video.muted, true);
 assert.equal(video.playsInline, true);
 view(.6);
 assert.equal(video.children.length, 0);
 assert.equal(video.poster, '');
 near();
 assert.deepEqual(video.children.map(source => source.src), [FILM.en.wide.webm, FILM.en.wide.mp4]);
 assert.equal(video.poster, FILM.en.wide.poster);
 assert.equal(video.paused, false);
 assert.equal(button.dataset.state, 'pause');
 assert.equal(button.attributes['aria-label'], FILM_LABELS.pause);
});

test('phones get the portrait cut in their language', () => {
 const {figure, video, near, view} = setup({locale: 'uk', phone: true});
 near(); view(.5);
 assert.deepEqual(video.children.map(source => source.src), [FILM.uk.phone.webm, FILM.uk.phone.mp4]);
 assert.equal(video.poster, FILM.uk.phone.poster);
 assert.equal(figure.dataset.layout, 'phone');
});

test('with reduced motion or data saving it shows the poster and waits for the play button', () => {
 for (const options of [{calm: true}, {saveData: true}]) {
  const {video, button, near, view} = setup(options);
  near(); view(.9);
  assert.equal(video.poster, FILM.en.wide.poster);
  assert.equal(video.paused, true);
  assert.equal(button.attributes['aria-label'], FILM_LABELS.play);
  button.click();
  assert.equal(video.paused, false);
 }
});

test('it pauses out of view, when its answer closes and in a hidden tab, and resumes after', () => {
 const {video, details, document, near, view} = setup();
 near(); view(.6);
 view(.2);
 assert.equal(video.paused, true);
 view(.6);
 assert.equal(video.paused, false);
 details.open = false; details.dispatch('toggle');
 assert.equal(video.paused, true);
 details.open = true; details.dispatch('toggle');
 assert.equal(video.paused, false);
 document.hidden = true; document.dispatch('visibilitychange');
 assert.equal(video.paused, true);
 document.hidden = false; document.dispatch('visibilitychange');
 assert.equal(video.paused, false);
});

test('once the visitor pauses, scrolling back does not start it again', () => {
 const {video, button, near, view} = setup();
 near(); view(.6);
 button.click();
 assert.equal(video.paused, true);
 assert.equal(button.attributes['aria-label'], FILM_LABELS.play);
 view(0); view(.7);
 assert.equal(video.paused, true);
 button.click();
 assert.equal(video.paused, false);
});

test('at the end it offers to play again from the start, and does not loop by itself', () => {
 const {video, button, near, view} = setup();
 near(); view(.6);
 video.currentTime = 63.7; video.finish();
 assert.equal(button.dataset.state, 'again');
 assert.equal(button.attributes['aria-label'], FILM_LABELS.again);
 const plays = video.plays;
 view(0); view(.7);
 assert.equal(video.plays, plays);
 button.click();
 assert.equal(video.currentTime, 0);
 assert.equal(video.paused, false);
});

test('turning a tablet swaps the cut and keeps the moment', () => {
 const {video, figure, near, view, media} = setup();
 near(); view(.6);
 video.currentTime = 21.5;
 media('(max-width:700px)').matches = true;
 media('(max-width:700px)').dispatch('change');
 assert.equal(figure.dataset.layout, 'phone');
 assert.deepEqual(video.children.map(source => source.src), [FILM.en.phone.webm, FILM.en.phone.mp4]);
 video.dispatch('loadedmetadata');
 assert.equal(video.currentTime, 21.5);
 assert.equal(video.paused, false);
});

test('without observers it shows the poster and never plays by itself', () => {
 const {video, button} = setup({observers: false});
 assert.equal(video.poster, FILM.en.wide.poster);
 assert.equal(video.paused, true);
 button.click();
 assert.equal(video.paused, false);
});
