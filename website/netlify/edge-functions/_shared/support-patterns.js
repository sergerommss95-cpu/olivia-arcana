// Copy of the safety patterns in experience/work/olivia-product/support-note.js,
// kept inside website/ so the edge function bundles on its own. A test fails
// if this copy and the product's drift apart.
const PATTERNS = [
  /\b(suicid\w*|kill(ing)? myself|end(ing)? my (own )?life|take my (own )?life|want(ed)? to die|wish (that )?i (was|were) dead|better off dead|(don't|do not) want to (live|be alive|exist)|no reason to (live|go on)|self[- ]?harm\w*|(hurt|hurting|harm|harming) myself|cut(ting)? myself(?! off)|overdos\w*|(i am|i'm|i feel) not safe|(i am|i'm) in danger)\b/i,
  /(суїцид|самогубств|покінч[а-яіїєґ]* (з|із) собою|наклас[а-яіїєґ]* на себе руки|(вб|уб)(ити|’ю|'ю) себе|не хочу (більше )?жити|(хочу|хотів|хотіла|хочеться) померти|краще б мене не було|самоушкодж|(заподі|завда)[а-яіїєґ’']* собі (шкод|бол|біль)|ріжу себе|мені небезпечно|я в небезпеці)/i,
  /(суицид|самоубийств|поконч[а-яё]* с собой|(убить|убью) себя|не хочу (больше )?жить|(хочу|хотел|хотела|хочется) умереть|налож[а-яё]* на себя руки|причин[а-яё]* себе (вред|боль)|режу себя)/i,
];

export function needsSupport(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const value = text.normalize('NFC').replace(/[’ʼ`]/g, "'");
  return PATTERNS.some(pattern => pattern.test(value));
}
