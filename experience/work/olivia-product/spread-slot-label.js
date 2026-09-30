/** An unrevealed selection is present, but its identity stays private. */
export function spreadSlotLabel(index,label,selected=false,locale='en'){
 const state=locale==='uk'?(selected?'Карту обрано, сорочкою догори.':'Очікує на карту.'):(selected?'Selected card, face down.':'Waiting for a card.');
 return `${index+1}. ${label}. ${state}`;
}
