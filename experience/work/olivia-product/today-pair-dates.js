/* Dates for the Today pair: which earlier daily card to read beside today's, and how to name its day. */
const DAY = 86400000;
// Follows «витягнули», so в/у alternate for euphony: «у» only before «вівторок».
const WEEKDAY_UK = ['в неділю', 'в понеділок', 'у вівторок', 'в середу', 'в четвер', 'в п’ятницю', 'в суботу'];

const dayNumber = date => Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / DAY;

/** The latest earlier daily card (within 30 days) that differs from today's, or null. */
export function previousDaily(entries, today, cardId) {
  const now = dayNumber(today);
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i], gap = now - dayNumber(entry.date);
    if (gap <= 0) continue;
    if (gap > 30) return null;
    if (entry.record.cardId !== cardId) return { ...entry, gap };
  }
  return null;
}

/** When the earlier card was drawn, phrased to follow "drew …". */
export function whenLabel(date, gap, language) {
  if (gap === 1) return language === 'uk' ? 'вчора' : 'yesterday';
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)));
  if (gap < 7) return language === 'uk' ? WEEKDAY_UK[d.getUTCDay()] : `on ${d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })}`;
  return language === 'uk' ? d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : `on ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })}`;
}

/** The same day as a caption under the card: "Yesterday", "Tuesday", "12 September". */
export function dayCaption(date, gap, language) {
  const uk = language === 'uk';
  if (gap === 1) return uk ? 'Учора' : 'Yesterday';
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)));
  const text = d.toLocaleDateString(uk ? 'uk-UA' : 'en-GB', gap < 7 ? { weekday: 'long', timeZone: 'UTC' } : { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return text.charAt(0).toLocaleUpperCase(uk ? 'uk' : 'en') + text.slice(1);
}
