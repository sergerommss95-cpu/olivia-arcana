/** Progressive phone composition, using the same form and consent as desktop. */
export function initMobileQuestion({locale='en'}={}) {
 const form=document.querySelector('#question-form'),input=document.querySelector('#question'),title=document.querySelector('#question-title'),view=document.querySelector('#question-view');
 if(!form||!input||!title)return;
 const mq=matchMedia('(max-width:700px)'),uk=locale==='uk',originalTitle=title.innerHTML;
 const recommendation=form.querySelector('.reading-recommendation'),choice=form.querySelector('.reading-size-choice'),originalOpen=choice.open;
 const label=form.querySelector('label[for=question]'),examples=form.querySelector('.question-examples'),submit=form.querySelector('button[type=submit]'),extras=form.querySelector('.question-entry-extras'),consent=form.querySelector('.guidance-choice')?.parentElement;
 const exampleAnchor=document.createComment('question examples');examples.before(exampleAnchor);
 const next=document.createElement('button');next.type='button';next.className='solid-action mobile-question-next';next.dataset.noTranslate='true';next.textContent=uk?'Продовжити →':'Continue →';input.after(next);
 const preview=document.createElement('div');preview.className='mobile-question-preview';preview.dataset.noTranslate='true';const quote=document.createElement('p'),edit=document.createElement('button');edit.type='button';edit.textContent=uk?'Змінити':'Edit';preview.append(quote,edit);recommendation.before(preview);
 const back=document.createElement('button');back.type='button';back.className='mobile-question-back';back.dataset.noTranslate='true';back.textContent=uk?'← Запитання':'← Your question';view.prepend(back);
 const compose=[label,input,examples,next],prepare=[preview,recommendation,consent,submit,extras];
 const initial=new Map([...compose,...prepare,back].filter(Boolean).map(node=>[node,node.hidden]));
 let phase='compose',previousView=document.body.dataset.view;
 function render(){
  if(!mq.matches){delete view.dataset.mobileQuestion;for(const [node,hidden] of initial)node.hidden=hidden;next.hidden=preview.hidden=back.hidden=true;title.innerHTML=originalTitle;choice.open=originalOpen;exampleAnchor.after(examples);if(view.contains(document.activeElement)&&!document.activeElement.getClientRects().length)title.focus({preventScroll:true});return;}
  view.dataset.mobileQuestion=phase;input.after(examples);examples.after(next);
  compose.filter(Boolean).forEach(node=>node.hidden=phase!=='compose');prepare.filter(Boolean).forEach(node=>node.hidden=phase!=='prepare');back.hidden=phase!=='prepare';choice.open=true;
  title.innerHTML=phase==='compose'?originalTitle:(uk?'Яку форму<br><em>оберемо?</em>':'How shall<br><em>we read?</em>');
  quote.textContent=input.value.trim()||(uk?'Я відкрита до того, що покажуть карти.':'I’m open to what the cards have to say.');
  if(view.contains(document.activeElement)&&!document.activeElement.getClientRects().length)title.focus({preventScroll:true});
 }
 function change(nextPhase,{focus=true}={}){phase=nextPhase;render();if(focus){input.blur();view.scrollIntoView({block:'start',behavior:'instant'});(phase==='compose'?input:title).focus({preventScroll:true});}}
 next.addEventListener('click',()=>change('prepare'));edit.addEventListener('click',()=>change('compose'));back.addEventListener('click',()=>change('compose'));
 form.addEventListener('submit',event=>{if(mq.matches&&phase==='compose'){event.preventDefault();event.stopImmediatePropagation();change('prepare');}},{capture:true});
 const observer=new MutationObserver(()=>{const current=document.body.dataset.view;if(current==='question'&&previousView!=='question')change('compose',{focus:false});previousView=current;});observer.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 mq.addEventListener('change',render);render();
 return {getPhase:()=>phase};
}
