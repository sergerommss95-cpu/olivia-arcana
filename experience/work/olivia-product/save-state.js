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
