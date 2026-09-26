/** A reader's own first observation, separate from the prepared/AI interpretation. */
export function validateFirstImpressions(values,cardIds){
 if(!Array.isArray(values)||values.length>cardIds.length)throw new Error('Invalid first impressions.');
 const seen=new Set();return values.map(v=>{
  if(!v||!cardIds.includes(v.cardId)||seen.has(v.cardId)||typeof v.text!=='string'||!v.text.trim()||v.text.length>1200||typeof v.createdAt!=='string'||!Number.isFinite(Date.parse(v.createdAt))||new Date(v.createdAt).toISOString()!==v.createdAt)throw new Error('Invalid first impression.');
  seen.add(v.cardId);return {cardId:v.cardId,text:v.text,createdAt:v.createdAt};
 });
}
export function mergeFirstImpressions(previous=[],incoming=[],cardIds){
 const result=validateFirstImpressions(previous,cardIds);
 for(const item of validateFirstImpressions(incoming,cardIds)){
  const prior=result.find(v=>v.cardId===item.cardId);
  if(prior&&JSON.stringify(prior)!==JSON.stringify(item))throw new Error('Your first impression is already kept. Add a later reflection instead.');
  if(!prior)result.push(item);
 }return result;
}
export function mountFirstImpression(container,{cardId,entry,locale='en',pending=false,onSave=()=>{},onContinue=()=>{}}){
 const uk=locale==='uk',box=document.createElement('section');box.className='first-impression';box.dataset.noTranslate='true';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 box.append(el('p',uk?'ВАШ ПЕРШИЙ ПОГЛЯД':'YOUR FIRST IMPRESSION','eyebrow'));
 if(entry){box.append(el('blockquote',entry.text),el('small',uk?'Ваші слова, до наступних роздумів.':'Your own words, kept before later reflections.'));container.append(box);return box;}
 const label=el('label',uk?'Що впадає вам в око?':'What catches your eye?'),input=document.createElement('textarea');input.rows=2;input.maxLength=1200;input.placeholder=uk?'Образ, відчуття, маленька деталь…':'An image, a feeling, one small detail…';label.append(input);
 const help=el('p',pending?(uk?'Нотатка залишається у відкритому розкладі. Завершіть і збережіть розклад, щоб зберегти її.':'This note stays in the open spread. Complete and save the spread to keep it.'):(uk?'Необов’язково. Спершу дайте місце власному погляду.':'Optional. A little space for your own response first.'),'first-impression-help');
 const actions=el('div','','save-actions'),keep=el('button',uk?'Зберегти мій погляд':'Keep my impression','text-action'),skip=el('button',uk?'Перейти до тлумачення ↗':'Continue to the interpretation ↗','quiet-link'),status=el('p','','first-impression-status');status.setAttribute('role','status');keep.type=skip.type='button';keep.disabled=true;
 input.oninput=()=>{keep.disabled=!input.value.trim();};
 keep.onclick=()=>{const value={cardId,text:input.value.trim(),createdAt:new Date().toISOString()};try{const persisted=onSave(value)!==false;box.replaceChildren(el('p',uk?'ВАШ ПЕРШИЙ ПОГЛЯД':'YOUR FIRST IMPRESSION','eyebrow'),el('blockquote',value.text),el('small',persisted?(uk?'Збережено з цим читанням.':'Kept with this reading.'):(uk?'Завершіть і збережіть розклад, щоб зберегти цю нотатку.':'Complete and save the spread to keep this note.')));onContinue();}catch{status.textContent=uk?'Не вдалося зберегти. Ваш текст залишається тут.':'Could not save. Your writing is still here.';}};
 skip.onclick=()=>{box.remove();onContinue();};actions.append(keep,skip);box.append(label,help,actions,status);container.append(box);return box;
}
