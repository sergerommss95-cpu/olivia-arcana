// Stable IDs also identify artwork and saved readings. Never reorder this deck.
const majorNames = ['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'];
const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
export const SUITS = Object.freeze(['Wands','Cups','Swords','Pentacles']);
export const TAROT_CARDS = Object.freeze([
  ...majorNames.map((name,number)=>Object.freeze({number,name,arcana:'major',suit:null,rank:number})),
  ...SUITS.flatMap((suit,s)=>ranks.map((rank,r)=>Object.freeze({number:22+s*14+r,name:`${rank} of ${suit}`,arcana:'minor',suit:suit.toLowerCase(),rank:r+1})))
]);
export const CARD_IDS = Object.freeze(TAROT_CARDS.map(card=>card.number));
export const CARD_COUNT = TAROT_CARDS.length;
/** The card's page in the website's card library (relative on the site, absolute in the portable copy). */
export function cardPageHref(id, locale = 'en') {
  const slug = TAROT_CARDS[id].name.toLowerCase().replace(/\s+/g, '-');
  const site = typeof window !== 'undefined' && (window.OLIVIA_NATIVE === true || new URLSearchParams(window.location.search).get('site') === '1');
  return `${site ? '' : 'https://oliviaarcana.com'}${locale === 'uk' ? '/uk' : ''}/cards/${slug}/`;
}
export function cardCaption(id) {
  const card=TAROT_CARDS[id];
  if(!card)throw new TypeError('Choose a card from the Olivia deck.');
  return card.arcana==='major'?`${String(id).padStart(2,'0')} / THE MAJOR ARCANA`:`${ranks[card.rank-1].toUpperCase()} OF ${card.suit.toUpperCase()} / MINOR ARCANA`;
}
