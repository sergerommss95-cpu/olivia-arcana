/* Olivia inside Telegram: runs in <head> after telegram-web-app.js and before
   the reading app. It turns Telegram's launch hash into the app's own route,
   paints Telegram's chrome in the site's lapis, drives the Back button, and
   sends links that leave the Mini App to the browser (other pages refuse to be
   framed by Telegram Web). */
var OLIVIA_UK_PAGES = ['/cards/', '/astrology/', '/learn/', '/about/', '/contact/', '/ask/', '/decks/'];

function oliviaTelegramLink(href, origin, language) {
  var url;
  try { url = new URL(href, origin + '/tg/' + language + '/'); } catch (error) { return { type: 'block' }; }
  if (url.protocol === 'tel:' || url.protocol === 'mailto:' || url.protocol === 'blob:') return { type: 'ignore' };
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { type: 'block' };
  if (url.hostname === 't.me' || url.hostname === 'telegram.me') return { type: 'telegram', url: url.href };
  var site = url.origin === origin || url.hostname === 'oliviaarcana.com' || url.hostname === 'www.oliviaarcana.com';
  if (site && url.pathname.indexOf('/tg/') === 0) {
    var asked = url.searchParams.get('lang');
    if ((asked === 'uk' || asked === 'en') && asked !== language) return { type: 'language', language: asked, route: (url.hash || '').replace(/^#/, '') || 'today' };
    return { type: 'ignore' };
  }
  if (site && (url.pathname === '/' || url.pathname === '/uk' || url.pathname === '/uk/')) {
    var target = url.pathname.indexOf('/uk') === 0 ? 'uk' : 'en';
    var route = (url.hash || '').replace(/^#/, '') || url.searchParams.get('experience') || 'today';
    if (route === 'home') route = 'today';
    return target === language ? { type: 'route', route: route } : { type: 'language', language: target, route: route };
  }
  if (site && language === 'uk' && url.pathname.indexOf('/uk/') !== 0) {
    for (var i = 0; i < OLIVIA_UK_PAGES.length; i++) {
      if (url.pathname.indexOf(OLIVIA_UK_PAGES[i]) === 0) { url.pathname = '/uk' + url.pathname; break; }
    }
  }
  return { type: 'external', url: url.href };
}
if (typeof module !== 'undefined') module.exports = { oliviaTelegramLink: oliviaTelegramLink };

(function () {
  if (typeof window === 'undefined') return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var language = document.documentElement.lang === 'uk' ? 'uk' : 'en';
  var at = function (version) { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(version)); };
  var inTelegram = at('6.1'); // outside Telegram the SDK reports version 6.0 and its methods fall back to plain browser behaviour
  var attempt = function (run) { try { run(); } catch (error) { /* an older client without this method */ } };

  // Each history entry carries its step in the Mini App, so Back knows when it is at the first screen.
  var nativeReplace = history.replaceState.bind(history);
  var step = function () { return history.state && typeof history.state.tgStep === 'number' ? history.state.tgStep : null; };
  var lastStep = 0;
  history.replaceState = function (state, title, url) {
    var current = step();
    var merged = state && typeof state === 'object' ? state : {};
    merged.tgStep = current === null ? lastStep : current;
    return nativeReplace(merged, title, url);
  };

  var query = new URLSearchParams(location.search);
  var first = (query.get('r') || 'today').replace(/[^a-z0-9/_-]/gi, '') || 'today';
  var launching = !location.hash || location.hash.indexOf('#tgWebApp') === 0;
  nativeReplace({ tgStep: step() || 0 }, '', location.pathname + location.search + (launching ? '#' + first : location.hash));
  lastStep = step();

  window.OLIVIA_TELEGRAM = true;
  document.documentElement.setAttribute('data-telegram', 'true');
  // Home on the site is the cinematic arrival, left out here: Today is home. The
  // coach link hands the question over through this webview's session storage,
  // which the external browser cannot read.
  var style = document.createElement('style');
  style.textContent = '[data-telegram] .mobile-dock{grid-template-columns:repeat(3,1fr)}'
    + '[data-telegram] .mobile-dock a[href="#home"]{display:none}'
    + '[data-telegram] body[data-view=home] #hero-region,[data-telegram] body[data-view=home] #home-content{visibility:hidden}'
    + '[data-telegram] a[href$="/ask/"]{display:none}';
  document.head.appendChild(style);

  var ground = '#0b192a';
  if (inTelegram) {
    attempt(function () { tg.setHeaderColor(at('6.9') ? ground : 'bg_color'); });
    attempt(function () { tg.setBackgroundColor(ground); });
    if (at('7.10')) attempt(function () { tg.setBottomBarColor(ground); });
    if (at('7.7')) attempt(function () { tg.disableVerticalSwipes(); });
    attempt(function () { tg.expand(); });
  }

  var synthetic = false;
  var refresh = function () { synthetic = true; window.dispatchEvent(new HashChangeEvent('hashchange')); synthetic = false; };
  var go = function (route) { if (location.hash === '#' + route) refresh(); else location.hash = route; };
  var atRoot = function () { var view = document.body && document.body.dataset.view; return !view || view === 'today' || view === 'home'; };
  var syncBack = function () { if (!inTelegram) return; if (atRoot()) tg.BackButton.hide(); else tg.BackButton.show(); };
  if (inTelegram) tg.BackButton.onClick(function () { if ((step() || 0) > 0) history.back(); else go('today'); });

  window.addEventListener('hashchange', function () {
    if (!synthetic && step() === null) { lastStep += 1; nativeReplace({ tgStep: lastStep }, '', location.href); }
    else if (step() !== null) lastStep = step();
    if (location.hash === '#home' || location.hash === '#') { history.replaceState(null, '', location.pathname + location.search + '#today'); refresh(); }
  });
  window.addEventListener('popstate', function () { if (step() !== null) lastStep = step(); });

  // Bubble phase: the app's own click handlers run first, and a preventDefault there is respected.
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    var action = oliviaTelegramLink(link.getAttribute('href'), location.origin, language);
    if (action.type === 'ignore') return;
    event.preventDefault();
    if (action.type === 'block') return;
    if (action.type === 'route') go(action.route);
    else if (action.type === 'language') {
      attempt(function () { localStorage.setItem('olivia-tg-language', action.language); });
      location.replace('/tg/' + action.language + '/?r=' + encodeURIComponent(action.route));
    }
    else if (action.type === 'telegram' && inTelegram) tg.openTelegramLink(action.url);
    else if (inTelegram) tg.openLink(action.url);
    else window.open(action.url, '_blank', 'noopener,noreferrer');
  });

  document.addEventListener('DOMContentLoaded', function () {
    // The deferred app has routed by now; a route it could not honour lands on home.
    if (document.body.dataset.view === 'home') go('today');
    new MutationObserver(function () {
      if (document.body.dataset.view === 'home') go('today');
      syncBack();
    }).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
    syncBack();
    requestAnimationFrame(function () { if (inTelegram) tg.ready(); });
  });
})();
