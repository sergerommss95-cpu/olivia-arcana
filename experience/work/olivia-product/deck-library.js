/** One artwork identity per reading. Preferences never rewrite reading history. */
export const DEFAULT_DECK_ID='olivia';
export const DECK_PREFERENCE_KEY='olivia-preferred-deck-v1';
export const DECK_IDS=Object.freeze(['olivia','space-between']);
export function resolveDeckId(id){return DECK_IDS.includes(id)?id:DEFAULT_DECK_ID;}
export function createDeckController({original,collections={},storage}){
 const registry={olivia:original,...collections};
 const complete=id=>registry[id]?.back&&Array.from({length:78},(_,i)=>registry[id].cards?.[i]).every(Boolean);
 let preferred=DEFAULT_DECK_ID;
 try{const saved=storage?.getItem(DECK_PREFERENCE_KEY);if(DECK_IDS.includes(saved)&&complete(saved))preferred=saved;}catch{}
 let active=preferred;
 const get=id=>registry[resolveDeckId(id)]||original;
 const assets={get back(){return get(active).back;},get cards(){return get(active).cards;},get deckId(){return active;},forRecord(record){return get(record?.deckId);}};
 return {assets,original,get,getSelectedId:()=>preferred,getActiveId:()=>active,
  availableIds:()=>DECK_IDS.filter(complete),
  use(id){active=complete(resolveDeckId(id))?resolveDeckId(id):DEFAULT_DECK_ID;return get(active);},
  select(id){if(!DECK_IDS.includes(id)||!complete(id))return false;preferred=id;active=id;try{storage?.setItem(DECK_PREFERENCE_KEY,id);}catch{}return true;}
 };
}
export function deckInfo(id,locale='en'){
 const uk=locale==='uk';
 if(id==='space-between')return {id,name:uk?'Простір між нами':'The Space Between',subtitle:uk?'Для близькості та стосунків':'For connection & relationships',description:uk?'Близькість, відстань і все невисловлене між ними. Скульптурні жести та м’який оксамит запрошують уважніше прислухатися до себе й інших.':'Closeness, distance, and everything left unsaid. Sculpted gestures and soft velvet invite a closer look at how we relate to others—and ourselves.',material:uk?'Сливовий оксамит · мармур · золота олива':'Aubergine velvet · marble · golden olive',tags:uk?['Стосунки','Близькість','Власні межі']:['Relationships','Intimacy','Boundaries'],count:78};
 return {id:'olivia',name:'Olivia',subtitle:uk?'Ваша щоденна колода':'Your everyday deck',description:uk?'Для запитань, які залишаються з вами. Знайома мова Таро в лазуриті, теплій слоновій кістці та оливковому плетиві — для роботи, змін і повсякденного життя.':'For the questions that stay with you. The familiar language of tarot in lapis, warm ivory, and woven olive branches—for work, change, and everyday life.',material:uk?'Лазурит · слонова кістка · античне золото':'Lapis · ivory · antique gold',tags:uk?['Щодня','Робота','Зміни']:['Everyday','Work','Change'],count:78};
}
export function deckLibraryItems(controller,locale='en'){
 return controller.availableIds().map(id=>{const art=controller.get(id),info=deckInfo(id,locale);const previewIds=id==='olivia'?[18,9,17]:[6,37,14];const labels=locale==='uk'?{18:'Місяць',9:'Відлюдник',17:'Зірка',6:'Закохані',37:'Двійка Кубків',14:'Помірність'}:{18:'The Moon',9:'The Hermit',17:'The Star',6:'The Lovers',37:'Two of Cups',14:'Temperance'};return {...info,back:art.back,previews:previewIds.map(n=>({src:art.cards[n],name:labels[n]}))};});
}
