/** One artwork identity per reading. Preferences never rewrite reading history. */
export const DEFAULT_DECK_ID='olivia';
export const DECK_PREFERENCE_KEY='olivia-preferred-deck-v1';
export const DECK_IDS=Object.freeze(['olivia','space-between']);
export function resolveDeckId(id){return DECK_IDS.includes(id)?id:DEFAULT_DECK_ID;}
export const AMIELLE_EDITION='amielle-relationships-v2';
export const AMIELLE_LEGACY_EDITION='amielle-relationships-v1';
export const ARTWORK_PREFERENCE_KEY='olivia-amielle-artwork-v1';
export const ARTWORK_CHOICES=Object.freeze(['woman-man','men','women']);
export function createDeckController({original,collections={},storage}){
 const registry={olivia:original,...collections};
 const complete=id=>registry[id]?.back&&Array.from({length:78},(_,i)=>registry[id].cards?.[i]).every(Boolean);
 let preferred=DEFAULT_DECK_ID,artwork='woman-man';
 try{const saved=storage?.getItem(DECK_PREFERENCE_KEY);if(DECK_IDS.includes(saved)&&complete(saved))preferred=saved;const choice=storage?.getItem(ARTWORK_PREFERENCE_KEY);if(ARTWORK_CHOICES.includes(choice))artwork=choice;}catch{}
 const currentEdition=()=>complete(AMIELLE_EDITION)?AMIELLE_EDITION:AMIELLE_LEGACY_EDITION;
 const choiceFor=id=>({deckId:resolveDeckId(id),...(id==='space-between'&&complete(currentEdition())?{artworkEdition:currentEdition(),artworkVariant:artwork}:{})});
 const forRecord=record=>{const id=resolveDeckId(record?.deckId),base=registry[id]||original;
  if(id!=='space-between'||![AMIELLE_EDITION,AMIELLE_LEGACY_EDITION].includes(record?.artworkEdition)||!complete(record.artworkEdition))return base;
  const edition=registry[record.artworkEdition],variant=ARTWORK_CHOICES.includes(record?.artworkVariant)?record.artworkVariant:'woman-man';
  return variant==='woman-man'?edition:{...edition,cards:{...edition.cards,...edition.variants?.[variant]}};
 };
 let active=choiceFor(preferred);
 const get=id=>forRecord(choiceFor(id));
 const assets={...original,get back(){return forRecord(active).back;},get cards(){return forRecord(active).cards;},get deckId(){return active.deckId;},forRecord};
 return {assets,original,get,getSelectedId:()=>preferred,getActiveId:()=>active.deckId,getArtworkChoice:()=>artwork,getChoice:()=>({...choiceFor(preferred)}),availableIds:()=>DECK_IDS.filter(complete),
  artworkChoices(id='space-between'){if(id!=='space-between'||!complete(currentEdition()))return [];const edition=registry[currentEdition()];return ARTWORK_CHOICES.map(value=>({value,src:value==='woman-man'?edition.cards[6]:edition.variants?.[value]?.[6]})).filter(choice=>choice.src);},
  use(value){active=typeof value==='object'&&value!==null?{...value,deckId:resolveDeckId(value.deckId)}:choiceFor(complete(resolveDeckId(value))?resolveDeckId(value):DEFAULT_DECK_ID);return forRecord(active);},
  select(id){if(!DECK_IDS.includes(id)||!complete(id))return false;preferred=id;active=choiceFor(id);try{storage?.setItem(DECK_PREFERENCE_KEY,id);}catch{}return true;},
  selectArtwork(value){if(!ARTWORK_CHOICES.includes(value)||!complete(currentEdition()))return false;artwork=value;active=choiceFor(preferred);try{storage?.setItem(ARTWORK_PREFERENCE_KEY,value);}catch{}return true;}
 };
}
export function deckInfo(id,locale='en'){
 const uk=locale==='uk';
 if(id==='space-between')return {id,name:'Amielle',subtitle:uk?'Для близькості та стосунків':'For connection & relationships',description:uk?'Близькість, відстань і все невисловлене між ними. Скульптурні жести та м’який оксамит запрошують уважніше прислухатися до себе й інших.':'Closeness, distance, and everything left unsaid. Sculpted gestures and soft velvet invite a closer look at how we relate to others—and ourselves.',material:uk?'Сливовий оксамит · мармур · золота олива':'Aubergine velvet · marble · golden olive',tags:uk?['Стосунки','Близькість','Власні межі']:['Relationships','Intimacy','Boundaries'],count:78};
 return {id:'olivia',name:'Olivia',subtitle:uk?'Ваша щоденна колода':'Your everyday deck',description:uk?'Для запитань, які залишаються з вами. Знайома мова Таро в лазуриті, теплій слоновій кістці та оливковому плетиві — для роботи, змін і повсякденного життя.':'For the questions that stay with you. The familiar language of tarot in lapis, warm ivory, and woven olive branches—for work, change, and everyday life.',material:uk?'Лазурит · слонова кістка · античне золото':'Lapis · ivory · antique gold',tags:uk?['Щодня','Робота','Зміни']:['Everyday','Work','Change'],count:78};
}
export function deckLibraryItems(controller,locale='en'){
 return controller.availableIds().map(id=>{const art=controller.get(id),info=deckInfo(id,locale);const previewIds=id==='olivia'?[18,9,17]:[6,9,25];const labels=locale==='uk'?{18:'Місяць',9:'Відлюдник',17:'Зірка',6:'Закохані',37:'Двійка Кубків',14:'Помірність',25:'Четвірка Жезлів'}:{18:'The Moon',9:'The Hermit',17:'The Star',6:'The Lovers',37:'Two of Cups',14:'Temperance',25:'Four of Wands'};return {...info,artworkChoices:controller.artworkChoices(id),back:art.back,previews:previewIds.map(n=>({src:art.cards[n],name:labels[n]}))};});
}
