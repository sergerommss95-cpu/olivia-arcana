import {restoreSpreadSession} from './spread-core.js';
import {validateFirstImpressions} from './first-impression.js';
export const SPREAD_DRAFT_KEY='olivia-arcana-spread-draft-v1';
function normalize(value){
 if(value?.schemaVersion!==1)throw new TypeError('The interrupted spread format is unsupported.');
 const session=restoreSpreadSession(value.session);
 const note=value.note??'';
 if(typeof note!=='string'||note.length>4000)throw new TypeError('The interrupted reflection is invalid.');
 return {schemaVersion:1,session,note,firstImpressions:validateFirstImpressions(value.firstImpressions??[],session.cardIds)};
}
/** Draft writes are separate from the saved almanac and never replace its entries. */
export function saveSpreadDraft(storage,{session,note='',firstImpressions=[]}){
 const draft=normalize({schemaVersion:1,session,note,firstImpressions});
 storage.setItem(SPREAD_DRAFT_KEY,JSON.stringify(draft));return draft;
}
export function loadSpreadDraft(storage){
 const raw=storage.getItem(SPREAD_DRAFT_KEY);return raw===null?null:normalize(JSON.parse(raw));
}
export function discardSpreadDraft(storage){storage.removeItem(SPREAD_DRAFT_KEY);}
