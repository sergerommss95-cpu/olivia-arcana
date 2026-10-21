/** Routes with authored EN/UK editions own their language, irrespective of tab preferences. */
export function routeLocale(pathname: string | null): 'en' | 'uk' | null {
  if (pathname === '/uk' || pathname?.startsWith('/uk/')) return 'uk';
  if (pathname === '/' || /^\/(?:astrology|cards|decks|ask|learn)(?:\/|$)/.test(pathname || '')) return 'en';
  return null;
}

export function localizedRoute(pathname: string, locale: 'en' | 'uk'): string | null {
  const unprefixed = pathname.replace(/^\/uk(?=\/|$)/, '') || '/';
  if (routeLocale(unprefixed) !== 'en') return null;
  return locale === 'uk' ? '/uk' + (unprefixed === '/' ? '/' : unprefixed) : unprefixed;
}
