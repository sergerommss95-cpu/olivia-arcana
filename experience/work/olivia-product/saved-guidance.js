/** Saved AI copy stays separately labelled from the prepared card interpretation. */
export function validateGuidance(value){
 if(value===undefined)return undefined;
 if(!value||typeof value!=='object'||Array.isArray(value)||value.source!=='ai'||!['en','uk'].includes(value.locale)||typeof value.synthesis!=='string'||!value.synthesis.trim()||value.synthesis.length>16000||typeof value.createdAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value.createdAt)||!Number.isFinite(Date.parse(value.createdAt))||new Date(value.createdAt).toISOString()!==value.createdAt)throw new TypeError('This saved AI interpretation is not valid.');
 return {source:'ai',locale:value.locale,synthesis:value.synthesis,createdAt:value.createdAt};
}
