/** Lightweight, explicitly labelled product examples. No draws or records are created here. */
const UK = {
  practiceKicker:'Особиста практика у трьох моментах', practiceTitle:'Залиште місце<br><em>для іншого погляду.</em>', begin:'Почніть зі свого запитання',
  yourQuestion:'ВАШЕ ЗАПИТАННЯ', exampleQuestion:'Що потребує моєї уваги,<br>поки я обмірковую зміни?', bringQuestion:'Принесіть запитання.', questionCaption:'Щось незавершене. Або просто те, як ви почуваєтеся сьогодні.',
  chooseCard:'Оберіть свою карту.', fullDeck:'78 карт. Ваш власний вибір.', cardCaption:'Відкрийте її. Прочитайте значення поруч зі своїм запитанням.',
  smallStep:'МАЛЕНЬКИЙ НАСТУПНИЙ КРОК', exampleStep:'Трохи простору,<br>перш ніж ухвалити рішення.', returnLater:'ЗБЕРЕГТИ · ПОВЕРНУТИСЯ · ПОМІТИТИ', keepDiscovery:'Збережіть помічене.', keepCaption:'Думку, наступний крок і місце, куди можна повернутися.',
  illustratedExample:'Ілюстровані приклади · ваше читання починається з вашого запитання та власного вибору карти.',
  spreadKicker:'Форма запитання', spreadTitle:'Трохи ясності.<br><em>Або ширший погляд.</em>', spreadIntro:'Дайте кожній частині запитання своє місце на столі.', spreadTabs:'Переглянути розклади різного розміру', cardsWord:'карти', cardsWordFive:'карт',
  positionSituation:'Ситуація', positionComplication:'Що ускладнює', positionStep:'Корисний наступний крок', tableHint:'Оберіть позицію карти, щоб побачити її запитання.', threePerspectives:'ОДНЕ ЗАПИТАННЯ · ТРИ ПЕРСПЕКТИВИ', clarity:'Трохи ясності', clarityDescription:'Ситуація, те, що її ускладнює, і один корисний крок уперед.', firstPosition:'01 / СИТУАЦІЯ', situationPrompt:'Який аспект ситуації потребує уваги?', exploreSpreads:'Дослідити розклади', freeThree:'Три карти — безкоштовно. П’ять і вісім — з членством.',
  sampleKicker:'Приклад, перш ніж почати', sampleTitle:'Одна карта.<br><em>Інший спосіб подивитися.</em>', exampleQuestionLabel:'ПРИКЛАД ЗАПИТАННЯ', sampleQuestion:'«Що потребує моєї уваги, поки я обмірковую зміни?»', hermitName:'IX / ВІДЛЮДНИК', hermitMeaning:'Трохи відстані від шуму. Відлюдник запрошує почути власні думки, перш ніж шукати ще одну пораду.', questionToKeep:'ЗАПИТАННЯ, ЯКЕ ВАРТО ЗБЕРЕГТИ', hermitPrompt:'Що ви вже знаєте, коли навколо тихо?', fullSample:'Прочитати приклад повністю', turnSample:'Відкрити карту-приклад', notYourDraw:'Приклад читання · це не ваша особиста карта.',
  hermitAlt:'Відлюдник — фігура кольору слонової кістки з ліхтарем на лазуритовому тлі', starAlt:'Зірка з колоди Olivia Arcana',
  memoryKicker:'Ваш альманах і жива колода', memoryTitle:'Читання завершується.<br><em>Значення зростає далі.</em>', memoryIntro:'Збережіть запитання. Запишіть, що сталося згодом. Нехай карта набуває значення, яке належить вам.', yourStory:'Ваша історія', livingDeck:'Ваша жива колода', sampleAlmanac:'ІЛЮСТРОВАНИЙ АЛЬМАНАХ · ПРИКЛАД ЗАПИСІВ', memoryTabs:'Переглянути, як змінюється приклад роздумів', dayOne:'День 01', daySeven:'День 07', dayTwentyOne:'День 21', theQuestion:'Запитання', aReturn:'Повернення', yourMeaning:'Ваше значення', keptReflection:'ЗБЕРЕЖЕНА ДУМКА', makingChange:'На порозі змін', memoryQuoteOne:'«Я весь час прошу поради. Можливо, спочатку варто почути себе».', memoryNextOne:'Тиха прогулянка. Без подкастів. Поки що без рішення.', localMemory:'Ваші власні записи зберігаються в цьому браузері на цьому пристрої.',
  lantern:'Ліхтар', veil:'Завіса', symbolsKicker:'Вчіться помічати', symbolsTitle:'Всередині зображення<br><em>є своя мова.</em>', symbolsIntro:'Ліхтар. Поріг. Відкрита долоня. Простежте символи в колоді й подивіться, що привертає вашу увагу.', exploreSymbols:'Дослідити мову символів',
  footerThought:'Давні символи.<br>Ваше власне значення.', footerNav:'Дослідити Olivia', drawCard:'Витягнути карту', guidedSpreads:'Розклади', dailyAlmanac:'Щоденний альманах', physicalCards:'Карти з вашої колоди', howWorks:'Як працює Olivia', membership:'Безкоштовно й з членством', backTop:'Повернутися до початку'
};

const SPREAD_PREVIEWS = {
  3: {
    name:['A little clarity','Трохи ясності'], eyebrow:['ONE QUESTION · THREE PERSPECTIVES','ОДНЕ ЗАПИТАННЯ · ТРИ ПЕРСПЕКТИВИ'],
    description:['The situation, what complicates it, and one useful way forward.','Ситуація, те, що її ускладнює, і один корисний крок уперед.'],
    access:['Three cards, freely. Five and eight with membership.','Три карти — безкоштовно. П’ять і вісім — з членством.'],
    positions:[
      {label:['The situation','Ситуація'],question:['What aspect of the situation deserves attention?','Який аспект ситуації потребує уваги?'],x:19,y:48,r:-7},
      {label:['What complicates it','Що ускладнює'],question:['What tension or assumption deserves a closer look?','Яка напруга чи припущення потребує уважнішого погляду?'],x:50,y:41,r:0},
      {label:['A helpful next step','Корисний наступний крок'],question:['What small action could help you understand or respond?','Яка маленька дія допоможе краще зрозуміти ситуацію або відповісти на неї?'],x:81,y:48,r:7}
    ]
  },
  5: {
    name:['At a crossroads','На роздоріжжі'],eyebrow:['TWO POSSIBILITIES · ROOM TO CHOOSE','ДВІ МОЖЛИВОСТІ · ПРОСТІР ДЛЯ ВИБОРУ'],
    description:['Put two paths beside what matters to you. Notice what each asks, and what you want to understand before choosing.','Поставте два шляхи поруч із тим, що для вас важливе. Помітьте, чого вимагає кожен і що ви хочете зрозуміти перед вибором.'],
    access:['Five-card personal readings are included with membership.','Особисті розклади на п’ять карт доступні із членством.'],
    positions:[
      {label:['At the heart','У центрі'],question:['What value or need matters most in this choice?','Яка цінність чи потреба найважливіша в цьому виборі?'],x:50,y:50,r:0},
      {label:['Path A','Шлях А'],question:['What quality or demand could you explore in your first option?','Яку рису чи вимогу варто дослідити у першому варіанті?'],x:18,y:50,r:-5},
      {label:['Path B','Шлях Б'],question:['What quality or demand could you explore in your second option?','Яку рису чи вимогу варто дослідити у другому варіанті?'],x:82,y:50,r:5},
      {label:['What to look at again','На що подивитися знову'],question:['Which part of the choice would benefit from more attention?','Якій частині вибору варто приділити більше уваги?'],x:50,y:20,r:-2},
      {label:['A grounded next step','Практичний наступний крок'],question:['What can you do before committing to either path?','Що можна зробити, перш ніж обрати будь-який зі шляхів?'],x:50,y:80,r:2}
    ]
  },
  8: {
    name:['The inner compass','Внутрішній компас'],eyebrow:['A LAYERED QUESTION · A WIDER VIEW','БАГАТОШАРОВЕ ЗАПИТАННЯ · ШИРШИЙ ПОГЛЯД'],
    description:['Explore the roots, influences, tension and support around a situation. Bring the whole picture back to one manageable step.','Дослідіть коріння, впливи, напругу й підтримку навколо ситуації. Поверніть цілу картину до одного посильного кроку.'],
    access:['Eight-card personal readings are included with membership.','Особисті розклади на вісім карт доступні із членством.'],
    positions:[
      {label:['The situation','Ситуація'],question:['Which part of the whole deserves attention first?','Якій частині цілого варто приділити увагу спочатку?'],x:43,y:48,r:-2},
      {label:['At the root','У корені'],question:['What established pattern or assumption might be worth examining?','Яку звичну закономірність чи припущення варто розглянути?'],x:40,y:80,r:2},
      {label:['Your perspective','Ваш погляд'],question:['What are you bringing to the way you see this?','Що ви привносите у свій погляд на ситуацію?'],x:14,y:29,r:-5},
      {label:['Outer influences','Зовнішні впливи'],question:['What observable circumstances or relationships need consideration?','Які помітні обставини чи стосунки варто взяти до уваги?'],x:72,y:17,r:4},
      {label:['The tension','Напруга'],question:['Where do two needs or demands pull against each other?','Де дві потреби чи вимоги тягнуть у різні боки?'],x:14,y:70,r:-3},
      {label:['What supports you','Що вас підтримує'],question:['What resource, quality, or form of help could you make use of?','Яким ресурсом, рисою чи допомогою ви могли б скористатися?'],x:85,y:47,r:3},
      {label:['What to loosen','Що послабити'],question:['What expectation or repeated response could become less rigid?','Яке очікування чи звична реакція могли б стати гнучкішими?'],x:42,y:14,r:-3},
      {label:['Your next step','Ваш наступний крок'],question:['What manageable step follows from the whole picture?','Який посильний крок випливає з цілої картини?'],x:75,y:80,r:3}
    ]
  }
};
const MEMORIES = [
  {card:9,cardName:['IX / THE HERMIT','IX / ВІДЛЮДНИК'],label:['A KEPT REFLECTION','ЗБЕРЕЖЕНА ДУМКА'],title:['Making a change','На порозі змін'],quote:['“I keep asking for advice. Perhaps I need to hear what I think first.”','«Я весь час прошу поради. Можливо, спочатку варто почути себе».'],nextLabel:['A SMALL NEXT STEP','МАЛЕНЬКИЙ НАСТУПНИЙ КРОК'],next:['A quiet walk. No podcasts. No decision yet.','Тиха прогулянка. Без подкастів. Поки що без рішення.']},
  {card:17,cardName:['XVII / THE STAR','XVII / ЗІРКА'],label:['RETURNING TO THE QUESTION','ПОВЕРНЕННЯ ДО ЗАПИТАННЯ'],title:['A little more space','Трохи більше простору'],quote:['“The walk did not give me an answer. It helped me name what I am hoping for.”','«Прогулянка не дала відповіді. Вона допомогла назвати те, на що я сподіваюся».'],nextLabel:['WHAT HAPPENED NEXT','ЩО СТАЛОСЯ ЗГОДОМ'],next:['Write down the possibility I want to explore.','Записати можливість, яку я хочу дослідити.']},
  {card:9,cardName:['IX / THE HERMIT','IX / ВІДЛЮДНИК'],label:['A PERSONAL CARD MEANING','ОСОБИСТЕ ЗНАЧЕННЯ КАРТИ'],title:['The Hermit, for me','Відлюдник для мене'],quote:['“Solitude can be preparation. I can take my time without standing still.”','«Усамітнення може бути підготовкою. Я можу не поспішати й водночас рухатися».'],nextLabel:['A MEANING TO KEEP','ЗНАЧЕННЯ, ЯКЕ ВАРТО ЗБЕРЕГТИ'],next:['Linked to the original reading in a living deck.','Пов’язане з початковим читанням у живій колоді.']}
];

const escapeAttribute = text => String(text).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
/** Build-time localization of this authored region, so Ukrainian remains useful before JS runs. */
export function translateHomeMarkup(html,locale='uk') {
  if(locale!=='uk')return html;
  const start=html.indexOf('<div id="home-content"'), end=html.indexOf('<main id="reading-view"',start);
  if(start<0||end<0)return html;
  let home=html.slice(start,end);
  home=home.replace(/(<([a-z][\w:-]*)\b[^>]*\bdata-home-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/gi,(whole,open,tag,key,close)=>UK[key]?open+UK[key]+close:whole);
  home=home.replace(/<[a-z][\w:-]*\b[^>]*>/gi,tag=>{
    for(const [marker,attribute] of [['data-home-aria','aria-label'],['data-home-alt','alt']]){
      const match=tag.match(new RegExp(marker+'="([^"]+)"'));
      if(match&&UK[match[1]])tag=tag.replace(new RegExp(attribute+'="[^"]*"'),attribute+'="'+escapeAttribute(UK[match[1]].replace(/<[^>]+>/g,''))+'"');
    }
    return tag;
  });
  return html.slice(0,start)+home+html.slice(end);
}

export function initHomeShowcase({assets,locale='en',reduced=()=>false}={}) {
  const root=document.querySelector('#home-content.home-showcase');
  if(!root||root.dataset.homeReady==='true')return null;
  root.dataset.homeReady='true';
  const language=locale==='uk'?1:0, pick=value=>Array.isArray(value)?value[language]:value;
  const $=selector=>root.querySelector(selector);
  if(language){
    root.querySelectorAll('[data-home-copy]').forEach(node=>{if(UK[node.dataset.homeCopy])node.innerHTML=UK[node.dataset.homeCopy];});
    root.querySelectorAll('[data-home-aria]').forEach(node=>{if(UK[node.dataset.homeAria])node.setAttribute('aria-label',UK[node.dataset.homeAria].replace(/<[^>]+>/g,''));});
    root.querySelectorAll('[data-home-alt]').forEach(node=>{if(UK[node.dataset.homeAlt])node.alt=UK[node.dataset.homeAlt];});
  }
  root.querySelectorAll('[data-home-art]').forEach(img=>{const value=img.dataset.homeArt,src=value==='back'?assets?.back:assets?.cards?.[Number(value)];if(src)img.src=src;});
  const motionReduced=()=>typeof reduced==='function'?reduced():Boolean(reduced);
  const fades=node=>{if(!motionReduced()&&node.animate)node.animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'cubic-bezier(.2,.7,.2,1)'});};
  function wireTabKeys(buttons,onSelect){
    buttons.forEach((button,index)=>button.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%buttons.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+buttons.length-1)%buttons.length;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;
      event.preventDefault();onSelect(buttons[next]);buttons[next].focus({preventScroll:true});
    }));
  }
  let count=3,position=0;
  const spreadButtons=[...root.querySelectorAll('[data-home-spread]')],board=$('#home-spread-table');
  const sourceBack=assets?.back||root.querySelector('[data-home-art="back"]')?.getAttribute('src');
  function selectPosition(index){
    position=index;
    const current=SPREAD_PREVIEWS[count].positions[position];
    board.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===position)));
    $('#home-position-label').textContent=String(index+1).padStart(2,'0')+' / '+pick(current.label).toLocaleUpperCase(locale==='uk'?'uk-UA':'en');
    $('#home-position-question').textContent=pick(current.question);
  }
  function selectSpread(button,{animate=true}={}){
    count=Number(button.dataset.homeSpread);position=0;
    const spread=SPREAD_PREVIEWS[count];
    spreadButtons.forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    $('#home-spread-panel').setAttribute('aria-labelledby',button.id);
    $('#home-spread-name').textContent=pick(spread.name);$('#home-spread-eyebrow').textContent=pick(spread.eyebrow);
    $('#home-spread-description').textContent=pick(spread.description);$('#home-spread-access').textContent=pick(spread.access);
    board.dataset.count=String(count);board.replaceChildren();
    spread.positions.forEach((item,index)=>{
      const figure=document.createElement('figure');figure.className='home-table-card';
      figure.style.setProperty('--x',item.x+'%');figure.style.setProperty('--y',item.y+'%');figure.style.setProperty('--r',item.r+'deg');
      const card=document.createElement('button');card.type='button';card.setAttribute('aria-pressed','false');card.setAttribute('aria-label',(language?'Позиція ':'Position ')+(index+1)+': '+pick(item.label));
      const image=document.createElement('img');if(sourceBack)image.src=sourceBack;image.alt='';image.loading='lazy';card.append(image);
      const caption=document.createElement('figcaption'),ordinal=document.createElement('span'),label=document.createElement('span');ordinal.textContent=String(index+1).padStart(2,'0');label.textContent=pick(item.label);caption.append(ordinal,label);figure.append(card,caption);board.append(figure);
      card.addEventListener('click',()=>selectPosition(index));
    });
    selectPosition(0);if(animate)fades(board);
  }
  spreadButtons.forEach(button=>button.addEventListener('click',()=>selectSpread(button)));
  wireTabKeys(spreadButtons,selectSpread);selectSpread(spreadButtons[0],{animate:false});

  const sampleSection=$('.home-sample'),reveal=$('#home-sample-reveal'),insight=$('#home-sample-insight');
  sampleSection.dataset.enhanced='true';sampleSection.dataset.revealed='false';reveal.setAttribute('aria-expanded','false');insight.hidden=true;
  const sampleStatus=document.createElement('p');sampleStatus.className='sr-only';sampleStatus.setAttribute('role','status');sampleStatus.setAttribute('aria-live','polite');sampleSection.append(sampleStatus);
  reveal.addEventListener('click',()=>{
    const open=sampleSection.dataset.revealed!=='true';sampleSection.dataset.revealed=String(open);reveal.setAttribute('aria-expanded',String(open));insight.hidden=!open;
    $('#home-reveal-label').textContent=open?pick(['Turn it back','Перевернути назад']):pick(['Turn the sample card','Відкрити карту-приклад']);
    reveal.setAttribute('aria-label',open?pick(['Turn the sample card face down','Перевернути карту-приклад сорочкою догори']):pick(['Turn the sample card','Відкрити карту-приклад']));
    sampleStatus.textContent=open?pick(['Sample card: The Hermit. Its reflection is now available.','Карта-приклад: Відлюдник. Тепер можна прочитати роздуми.']):'';
    if(open)fades(insight);
  });

  const memoryButtons=[...root.querySelectorAll('[data-home-memory]')];
  function selectMemory(button){
    const index=Number(button.dataset.homeMemory),entry=MEMORIES[index];
    memoryButtons.forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    $('#home-memory-page').setAttribute('aria-labelledby',button.id);
    const img=$('#home-memory-image'),src=assets?.cards?.[entry.card];if(src)img.src=src;img.alt=pick(entry.cardName);
    for(const [id,key] of [['cardname','cardName'],['label','label'],['topic','title'],['quote','quote'],['next-label','nextLabel'],['next-copy','next']])$('#home-memory-'+id).textContent=pick(entry[key]);
    fades($('.home-memory-writing'));
  }
  memoryButtons.forEach(button=>button.addEventListener('click',()=>selectMemory(button)));wireTabKeys(memoryButtons,selectMemory);
  if(language)$('#home-memory-image').alt='Відлюдник';
  return {selectSpread(count){const button=spreadButtons.find(item=>Number(item.dataset.homeSpread)===count);if(button)selectSpread(button);},selectMemory(index){if(memoryButtons[index])selectMemory(memoryButtons[index]);}};
}
