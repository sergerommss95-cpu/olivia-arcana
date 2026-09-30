import test from 'node:test';
import assert from 'node:assert/strict';
import { routeLocale, localizedRoute } from './i18n/route-locale.ts';

test('authored English and Ukrainian routes override a saved language preference', () => {
  for (const path of ['/', '/astrology/', '/astrology/birth-chart/', '/cards/the-moon/', '/decks/', '/ask/', '/learn/']) {
    assert.equal(routeLocale(path), 'en');
    const uk = localizedRoute(path, 'uk');
    assert.equal(routeLocale(uk), 'uk');
    assert.equal(localizedRoute(uk, 'en'), path);
  }
  assert.equal(routeLocale('/uk'), 'uk');
});

test('language links preserve the authored page rather than dropping astrology visitors on home', () => {
  assert.equal(localizedRoute('/astrology/birth-chart/', 'uk'), '/uk/astrology/birth-chart/');
  assert.equal(localizedRoute('/uk/astrology/', 'en'), '/astrology/');
  assert.equal(routeLocale('/academy/'), null);
  assert.equal(routeLocale('/astrology-not-a-route/'), null);
  assert.equal(localizedRoute('/about/', 'uk'), null);
});
