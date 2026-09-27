/** A question crosses pages in this tab only, never in a URL or analytics event. */
export const QUESTION_HANDOFF_KEY='olivia-question-handoff-v1';
export function consumeQuestionHandoff(storage,now=Date.now()){
 let raw;try{raw=storage.getItem(QUESTION_HANDOFF_KEY);if(raw!==null)storage.removeItem(QUESTION_HANDOFF_KEY);}catch{return null;}
 if(raw===null)return null;
 try{const value=JSON.parse(raw);
  if(value.schemaVersion!==1||typeof value.question!=='string'||!value.question.trim()||value.question.length>1600||!Number.isFinite(value.createdAt)||value.createdAt>now||now-value.createdAt>30*60*1000)return null;
  return value.question.trim();
 }catch{return null;}
}
