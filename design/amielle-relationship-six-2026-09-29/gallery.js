(() => {
  'use strict';
  const records = JSON.parse(document.getElementById('reading-data').textContent);
  const words = {
    en: {skip:'Skip to the six cards',edition:'THE AMIELLE STUDIES · 01',deckOf:'A DECK FOR THE WAYS WE LOVE',subtitle:'Six studies in <em>connection.</em>',intro:'The courage to come closer. The space to remain yourself. Six familiar cards, seen through the intimate language of relationships.',material:'Aubergine velvet · Carved ivory marble · Antique gold',explore:'Explore the six cards',personal:'A PERSONAL DETAIL',preferenceTitle:'A reflection of <em>your connection.</em>',preferenceDescription:'Choose the couple artwork that feels right for you. The meanings stay the same.',preferenceNote:'Changes three couple cards. You can change this anytime.',coupleArtwork:'Couple artwork',womanMan:'Woman & man',twoMen:'Two men',twoWomen:'Two women',backCollection:'Back to collection',fullArt:'View full artwork',upright:'Upright',reversed:'Reversed',takeWithYou:'A QUESTION TO TAKE WITH YOU',insideArtwork:'Inside the artwork',previous:'Previous card',next:'Next card',sixCards:'Six cards. <em>Six kinds of closeness.</em>',cardsHint:'Open a card to discover its reading.',footer:'Six concept studies for Olivia Arcana. Artwork and readings for review.',backTop:'Back to top',read:'Read this card',open:'Explore',of:'OF',study:'STUDY',changed:'Couple artwork updated. Other cards and meanings stay the same.'},
    uk: {skip:'До шести карт',edition:'ЕТЮДИ AMIELLE · 01',deckOf:'КОЛОДА ПРО ТЕ, ЯК МИ ЛЮБИМО',subtitle:'Шість етюдів <em>про близькість.</em>',intro:'Сміливість наблизитися. Простір залишатися собою. Шість знайомих карт, побачених крізь інтимну мову стосунків.',material:'Баклажановий оксамит · Різьблений мармур · Старовинне золото',explore:'Відкрити шість карт',personal:'ОСОБИСТА ДЕТАЛЬ',preferenceTitle:'Відображення <em>вашої близькості.</em>',preferenceDescription:'Оберіть зображення пари, яке вам відгукується. Значення карт залишаються незмінними.',preferenceNote:'Змінює три карти з парами. Вибір можна змінити будь-коли.',coupleArtwork:'Зображення пари',womanMan:'Жінка й чоловік',twoMen:'Двоє чоловіків',twoWomen:'Дві жінки',backCollection:'До колекції',fullArt:'Відкрити зображення',upright:'Пряме положення',reversed:'Перевернуте',takeWithYou:'ЗАПИТАННЯ, ЯКЕ ЗАЛИШИТЬСЯ З ВАМИ',insideArtwork:'Усередині зображення',previous:'Попередня карта',next:'Наступна карта',sixCards:'Шість карт. <em>Шість відтінків близькості.</em>',cardsHint:'Відкрийте карту, щоб прочитати її послання.',footer:'Шість концептуальних етюдів для Olivia Arcana. Зображення й тлумачення для перегляду.',backTop:'Нагору',read:'Прочитати карту',open:'Відкрити',of:'З',study:'ЕТЮД',changed:'Зображення пар оновлено. Інші карти та значення залишаються незмінними.'}
  };
  const storage = {get(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
  let language = storage.get('amielle-study-language','en');
  if (!words[language]) language = 'en';
  let artwork = storage.get('amielle-study-artwork','original');
  if (!['original','men','women'].includes(artwork)) artwork = 'original';
  let selected = null;
  let orientation = 'upright';
  let returnFocus = null;
  const $ = selector => document.querySelector(selector);
  const coupleCards = new Set([6,15,25]);
  const artworkPath = card => `assets/${String(card.id).padStart(2,'0')}-${card.slug}${coupleCards.has(card.id)&&artwork!=='original'?`-${artwork}`:''}.webp`;
  const make = (tag,className,text) => {const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;};
  function translate() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-copy]').forEach(el => {const key=el.dataset.copy;const value=words[language][key];if(value!==undefined){if(['sixCards','preferenceTitle'].includes(key))el.innerHTML=value;else el.textContent=value;}});
    $('#collection-title>span').innerHTML = words[language].subtitle;
    document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===language)));
    $('.orientation').setAttribute('aria-label',language==='en'?'Reading orientation':'Положення карти');
    $('.study-navigation').setAttribute('aria-label',language==='en'?'Explore another card':'Відкрити іншу карту');
    $('.language').setAttribute('aria-label',language==='en'?'Language':'Мова');
    document.title = language==='en'?'Amielle — Six studies in connection':'Amielle — Шість етюдів про близькість';
    renderCollection();
    if(selected!==null) renderStudy();
  }
  function renderCollection(){
    const grid=$('#card-grid');
    grid.replaceChildren();
    records.forEach(card=>{
      const article=make('article','card-study');
      const imageButton=make('button','card-picture');imageButton.type='button';imageButton.dataset.cardId=card.id;imageButton.setAttribute('aria-label',`${words[language].open} ${card.title[language]}`);
      const image=make('img');image.src=artworkPath(card);image.width=768;image.height=1316;image.alt=card.title[language];image.loading='lazy';image.dataset.cardImage=card.id;
      const corner=make('span','picture-corner','↗');corner.setAttribute('aria-hidden','true');imageButton.append(image,corner);
      imageButton.addEventListener('click',()=>openStudy(card.id,imageButton));
      const meta=make('div','card-meta');meta.append(make('span','card-number',card.number||card.roman||''),make('h3','',card.title[language]));
      const theme=make('p','card-theme',card.theme[language]);
      const open=make('button','button button-dark card-open');open.type='button';open.dataset.openCard=card.id;open.append(make('span','',words[language].read));const arrow=make('span','','↗');arrow.setAttribute('aria-hidden','true');open.append(arrow);open.addEventListener('click',()=>openStudy(card.id,open));
      article.append(imageButton,meta,theme,open);grid.append(article);
    });
  }
  function renderStudy(){
    const card=records.find(item=>item.id===selected);if(!card)return;
    const index=records.indexOf(card);
    $('#study-count').textContent=`${words[language].study} ${String(index+1).padStart(2,'0')} ${words[language].of} 06`;
    $('#study-number').textContent=card.number||card.roman||'';
    $('#study-title').textContent=card.title[language];
    $('#study-theme').textContent=card.theme[language];
    $('#study-image').src=artworkPath(card);$('#study-image').alt=card.title[language];$('#study-image').dataset.cardImage=card.id;
    $('#full-art').href=artworkPath(card);$('#full-art').title=words[language].fullArt;
    $('#reading-text').textContent=card[orientation][language];
    $('#reflection-question').textContent=card.question[language];
    $('#scene-text').textContent=card.scene[language];
    $('#upright').setAttribute('aria-pressed',String(orientation==='upright'));$('#reversed').setAttribute('aria-pressed',String(orientation==='reversed'));
  }
  function openStudy(id,trigger){
    selected=id;orientation='upright';if(trigger)returnFocus={id,kind:trigger.classList.contains('card-picture')?'picture':'button'};
    $('#study').hidden=false;$('.scene-note').open=false;renderStudy();
    $('#study-title').focus({preventScroll:true});
    $('#study').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
  function closeStudy(){
    $('#study').hidden=true;selected=null;
    const target=returnFocus?$(returnFocus.kind==='picture'?`.card-picture[data-card-id="${returnFocus.id}"]`:`[data-open-card="${returnFocus.id}"]`):$('#cards-heading');
    if(target) { target.focus({preventScroll:true});target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'}); }
  }
  $('#close-study').addEventListener('click',closeStudy);
  ['upright','reversed'].forEach(value=>$('#'+value).addEventListener('click',()=>{orientation=value;renderStudy();}));
  [-1,1].forEach(direction=>$(direction<0?'#previous-card':'#next-card').addEventListener('click',()=>{const index=records.findIndex(card=>card.id===selected);const card=records[(index+direction+records.length)%records.length];openStudy(card.id);}));
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.language;storage.set('amielle-study-language',language);translate();}));
  document.querySelectorAll('input[name="artwork"]').forEach(input=>{input.checked=input.value===artwork;input.addEventListener('change',()=>{artwork=input.value;storage.set('amielle-study-artwork',artwork);document.querySelectorAll('[data-card-image]').forEach(image=>{const card=records.find(item=>item.id===Number(image.dataset.cardImage));image.src=artworkPath(card);});if(selected!==null)$('#full-art').href=artworkPath(records.find(card=>card.id===selected));$('#art-status').textContent=words[language].changed;});});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&selected!==null)closeStudy();});
  translate();
})();
