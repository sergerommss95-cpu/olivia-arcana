/** Shared tab-local handoff; astrology context never contains birth details. */
import {QUESTION_HANDOFF_KEY,readQuestionHandoff,clearQuestionHandoff} from '../../../website/src/lib/question-handoff.ts';
export {QUESTION_HANDOFF_KEY,readQuestionHandoffOrigin,writeQuestionHandoff} from '../../../website/src/lib/question-handoff.ts';
export function consumeQuestionHandoff(storage,now=Date.now()){
 const question=readQuestionHandoff(storage,now);
 try{clearQuestionHandoff(storage);}catch{return null;}
 return question?.trim()||null;
}
