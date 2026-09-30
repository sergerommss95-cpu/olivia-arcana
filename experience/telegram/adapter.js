/* Olivia inside Telegram: runs in <head> after telegram-web-app.js and before
   the reading app. It turns Telegram's launch hash into the app's own route,
   paints Telegram's chrome in the site's lapis, drives the Back button, and
   sends links that leave the Mini App to the browser (other pages refuse to be
   framed by Telegram Web). */
function oliviaTelegramLink(href, origin, language) {
  var url;
  try { url = new URL(href, origin + '/tg/' + language + '/'); } catch (error) { return { type: 'ignore' }; }
  if (url.protocol === 'tel:' || url.protocol === 'mailto:') return { type: 'ignore' };
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { type: 'ignore' };
  if (url.hostname === 't.me' || url.hostname === 'telegram.me') return { type: 'telegram', url: url.href };
  var site = url.origin === origin || url.hostname === 'oliviaarcana.com' || url.hostname === 'www.oliviaarcana.com';
  if (site && url.pathname.indexOf('/tg/') === 0) return { type: 'ignore' };
  if (site && (url.pathname === '/' || url.pathname === '/uk' || url.pathname === '/uk/')) {
    var target = url.pathname.indexOf('/uk') === 0 ? 'uk' : 'en';
    var experience = url.searchParams.get('experience');
    var route = (url.hash || '').replace(/^#/, '') || experience || 'today';
    if (route === 'home') route = 'today';
    return target === language ? { type: 'route', route: route } : { type: 'language', language: target, route: route };
  }
  return { type: 'external', url: url.href };
}
if (typeof module !== 'undefined') module.exports = { oliviaTelegramLink: oliviaTelegramLink };

(function () {
  if (typeof window === 'undefined') return;
  var tg = window.Telegram && window.Telegram.WebApp;
  var language = document.documentElement.lang === 'uk' ? 'uk' : 'en';
  var query = new URLSearchParams(location.search);
  var first = (query.get('r') || 'today').replace(/[^a-z0-9/_-]/gi, '') || 'today';
  if (!location.hash || location.hash.indexOf('#tgWebApp') === 0) history.replaceState(null, '', location.pathname + location.search + '#' + first);
  window.OLIVIA_TELEGRAM = true;
  document.documentElement.setAttribute('data-telegram', 'true');
  // Home on the site is the cinematic arrival, left out here; Today is home.
  var style = document.createElement('style');
  style.textContent = '[data-telegram] .mobile-dock{grid-template-columns:repeat(3,1fr)}[data-telegram] .mobile-dock a[href="#home"]{display:none}';
  document.head.appendChild(style);

  var at = function (version) { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(version)); };
  var ground = '#0b192a';
  if (tg) {
    try {
      if (at('6.1')) { tg.setHeaderColor(ground); tg.setBackgroundColor(ground); }
      if (at('7.10')) tg.setBottomBarColor(ground);
      tg.expand();
      if (at('7.7')) tg.disableVerticalSwipes();
    } catch (error) { /* older clients: keep Telegram's defaults */ }
  }

  var depth = 0, goingBack = false, synthetic = false;
  var refresh = function () { synthetic = true; window.dispatchEvent(new HashChangeEvent('hashchange')); synthetic = false; };
  var go = function (route) {
    if (location.hash === '#' + route) refresh();
    else location.hash = route;
  };
  var root = function () { var view = location.hash.replace(/^#/, '').split(/[/?]/)[0]; return view === '' || view === 'today'; };
  var syncBack = function () { if (!at('6.1')) return; if (root()) tg.BackButton.hide(); else tg.BackButton.show(); };
  if (at('6.1')) tg.BackButton.onClick(function () {
    if (depth > 0) { goingBack = true; history.back(); } else go('today');
  });
  window.addEventListener('hashchange', function () {
    if (!synthetic) { if (goingBack) { depth = Math.max(0, depth - 1); goingBack = false; } else depth += 1; }
    if (location.hash === '#home' || location.hash === '#') { history.replaceState(null, '', location.pathname + location.search + '#today'); refresh(); return; }
    syncBack();
  });

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest && event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    var action = oliviaTelegramLink(link.getAttribute('href'), location.origin, language);
    if (action.type === 'ignore') return;
    event.preventDefault();
    if (action.type === 'route') go(action.route);
    else if (action.type === 'language') { try { localStorage.setItem('olivia-tg-language', action.language); } catch (error) { /* ignore */ } location.replace('/tg/' + action.language + '/?r=' + encodeURIComponent(action.route)); }
    else if (action.type === 'telegram' && tg) tg.openTelegramLink(action.url);
    else if (tg) tg.openLink(action.url);
    else window.open(action.url, '_blank', 'noopener');
  }, true);

  // The site's own home is the cinematic arrival, which this build leaves out: Today is home here.
  document.addEventListener('DOMContentLoaded', function () {
    new MutationObserver(function () { if (document.body.dataset.view === 'home') go('today'); }).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
    syncBack();
    requestAnimationFrame(function () { if (tg) tg.ready(); });
  });
})();
