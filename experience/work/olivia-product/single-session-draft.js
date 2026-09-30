import {restoreSingleSession} from './core.js';
export const SINGLE_SESSION_DRAFT_KEY='olivia-arcana-single-session-v1';
export function saveSingleSessionDraft(storage,session){
 const validated=restoreSingleSession(session);storage.setItem(SINGLE_SESSION_DRAFT_KEY,JSON.stringify({schemaVersion:1,session:validated}));return validated;
}
export function loadSingleSessionDraft(storage){
 const raw=storage.getItem(SINGLE_SESSION_DRAFT_KEY);if(raw===null)return null;
 const value=JSON.parse(raw);if(value?.schemaVersion!==1)throw new TypeError('The interrupted reading format is unsupported.');
 return restoreSingleSession(value.session);
}
export function discardSingleSessionDraft(storage){storage.removeItem(SINGLE_SESSION_DRAFT_KEY);}
