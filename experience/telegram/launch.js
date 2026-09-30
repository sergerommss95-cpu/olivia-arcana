/* The Mini App's entry (/tg/): pick the language and the first screen, then
   open the right page. Telegram's launch data stays in the hash so the SDK on
   that page can read it. Runs inline, before anything else loads. */
function oliviaLaunchTarget(search, hash, storedLanguage) {
  var query = new URLSearchParams(search || '');
  var launch = new URLSearchParams((hash || '').replace(/^#/, ''));
  var language = storedLanguage === 'uk' || storedLanguage === 'en' ? storedLanguage : null;
  if (!language) {
    var code = '';
    try { code = JSON.parse(new URLSearchParams(launch.get('tgWebAppData') || '').get('user') || '{}').language_code || ''; } catch (error) { code = ''; }
    language = /^uk\b/i.test(code) ? 'uk' : 'en';
  }
  var start = (query.get('tgWebAppStartParam') || query.get('startapp') || '').slice(0, 64);
  var screens = { today: 'today', question: 'question', spreads: 'spreads', journal: 'journal', sample: 'sample', symbols: 'symbols' };
  var route = Object.prototype.hasOwnProperty.call(screens, start) ? screens[start] : 'today';
  var card = /^card_(\d{1,2})$/.exec(start);
  if (card && Number(card[1]) < 78) route = 'spreads/card-' + Number(card[1]);
  return '/tg/' + language + '/?r=' + encodeURIComponent(route) + (hash || '');
}
if (typeof module !== 'undefined') module.exports = { oliviaLaunchTarget: oliviaLaunchTarget };
