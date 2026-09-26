import {t} from './locale.js';

/* One vocabulary for keeping a reading, shared by one-card readings and spreads.
 * A reading that was never kept is a first keep, even when a personal reading has
 * just arrived; only a kept record can have an update waiting. `saved` confirms
 * that nothing is waiting, so it is marked done rather than invited again. */
const LABELS = {
 reading:{keep:'Keep this reading',update:'Save updated reading',reflection:'Save reflection',saved:'Saved'},
 spread:{keep:'Keep this spread',update:'Save updated reading',reflection:'Save reflection',saved:'Saved'},
};

export function saveLabel(state,kind='reading'){
 const labels=LABELS[kind]||LABELS.reading;
 return labels[state]||labels.keep;
}

export function setSaveState(button,state,{kind='reading',locale}={}){
 if(!button)return;
 const known=['keep','update','reflection','saved'].includes(state)?state:'keep';
 const mark=document.createElement('span');mark.setAttribute('aria-hidden','true');mark.className='save-mark';
 mark.textContent=known==='saved'?'✓':'↗';
 button.replaceChildren(document.createTextNode(t(saveLabel(known,kind),locale)+' '),mark);
 button.dataset.saveState=known;
}

/** State after a personal reading arrives. Null: the kept copy already holds it. */
export function guidanceSaveState(keptRecord,guidance){
 if(!keptRecord)return 'keep';
 const kept=keptRecord.guidance;
 if(kept&&guidance&&kept.source===guidance.source&&kept.locale===guidance.locale&&kept.synthesis===guidance.synthesis)return null;
 return 'update';
}

/** Ask the browser to keep the almanac under storage pressure (granted silently by most). */
export function requestDurableStorage(storage=globalThis.navigator?.storage){
 try{if(storage?.persist&&storage?.persisted)storage.persisted().then(done=>done||storage.persist()).catch(()=>{});}catch{}
}

/** Safari on iPhone and iPad clears a site's storage after about a week without a visit, unless it runs from the Home Screen. */
export function safariMayClear({nav=globalThis.navigator,match=globalThis.matchMedia}={}){
 const agent=nav?.userAgent||'';
 const ios=/iP(hone|ad|od)/.test(agent)||(nav?.platform==='MacIntel'&&nav?.maxTouchPoints>1);
 let standalone=nav?.standalone===true;
 try{standalone||=!!match?.('(display-mode: standalone)')?.matches;}catch{}
 return ios&&!standalone;
}

export const SAFARI_STORAGE_NOTE={
 en:'On iPhone and iPad, Safari may also clear them after about a week without a visit. Add Olivia to your Home Screen, or download your almanac from time to time.',
 uk:'На iPhone та iPad Safari може також видалити їх, якщо ви не відкривали сайт близько тижня. Додайте Olivia на початковий екран або час від часу завантажуйте свій альманах.',
};
