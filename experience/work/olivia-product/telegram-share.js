import {TAROT_CARDS} from './deck-catalog.js';
import {t} from './locale.js';

/* Inside the Telegram Mini App a card is shared through Telegram's own share
   sheet. The message names only the card, never the question, notes or a
   personal reading; the link opens that card's three questions in the Mini App. */
export const TELEGRAM_BOT_LINK='https://t.me/OliviaArcanaBot';

export function telegramShareText(cardId,{locale='en',today=false}={}){
 if(!Number.isInteger(cardId)||!TAROT_CARDS[cardId])throw new TypeError('Choose a card from the Olivia deck.');
 const name=t(TAROT_CARDS[cardId].name,locale);
 return locale==='uk'?`${today?'Моя карта дня':'Моя карта'} — ${name}. Olivia перетворює кожну карту на три запитання.`:`${today?'My card today':'My card'}: ${name}. Olivia turns each card into three questions.`;
}

export function telegramShareUrl(cardId,options){
 const text=telegramShareText(cardId,options);
 return 'https://t.me/share/url?url='+encodeURIComponent(`${TELEGRAM_BOT_LINK}?startapp=card_${cardId}`)+'&text='+encodeURIComponent(text);
}

/** True only inside the Mini App on a client that can open t.me links natively. */
export function canShareInTelegram(win=globalThis.window){
 try{return win?.OLIVIA_TELEGRAM===true&&!!win.Telegram?.WebApp?.isVersionAtLeast?.('6.1');}catch{return false;}
}
