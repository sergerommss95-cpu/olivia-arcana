/** A quiet, indeterminate preparation state. It never claims a percentage or AI stage. */
export function createReadingLoader({locale='en'}={}){
 const element=document.createElement('div');
 element.className='reading-loader';element.hidden=true;
 element.setAttribute('role','status');element.setAttribute('aria-live','polite');
 element.setAttribute('aria-atomic','true');element.setAttribute('aria-busy','false');
 element.dataset.state='idle';

 const status=document.createElement('span');status.className='reading-loader-status';
 status.textContent=locale==='uk'?'Готуємо ваше особисте читання':'Preparing your personal reading';
 const signature=document.createElement('div');signature.className='reading-loader-signature';
 signature.setAttribute('aria-hidden','true');
 const name=document.createElement('span');name.className='reading-loader-name';
 for(const [index,letter] of [...'Olivia'].entries()){
  const glyph=document.createElement('span');glyph.textContent=letter;
  glyph.style.setProperty('--loader-letter',index);name.append(glyph);
 }
 const arcana=document.createElement('span');arcana.className='reading-loader-arcana';arcana.textContent='ARCANA';
 signature.append(name,arcana);
 const track=document.createElement('span');track.className='reading-loader-track';track.setAttribute('aria-hidden','true');
 const light=document.createElement('span');light.className='reading-loader-light';track.append(light);
 element.append(status,signature,track);

 let completionTimer=null,resolveCompletion=null,completion=null;
 function cancelCompletion(){
  if(completionTimer!==null){clearTimeout(completionTimer);completionTimer=null;}
  if(resolveCompletion){const resolve=resolveCompletion;resolveCompletion=null;completion=null;resolve(false);}
 }
 function stop(){
  cancelCompletion();element.hidden=true;element.dataset.state='idle';element.setAttribute('aria-busy','false');
 }
 function start(){
  cancelCompletion();element.dataset.state='working';element.setAttribute('aria-busy','true');element.hidden=false;
 }
 function finish(){
  if(completion)return completion;
  if(element.hidden)return Promise.resolve(false);
  element.dataset.state='complete';element.setAttribute('aria-busy','false');
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true||new URLSearchParams(globalThis.location?.search||'').get('motion')==='reduce';
  if(reduced||!element.isConnected){element.hidden=true;return Promise.resolve(true);}
  completion=new Promise(resolve=>{
   resolveCompletion=resolve;
   completionTimer=setTimeout(()=>{
    completionTimer=null;resolveCompletion=null;completion=null;element.hidden=true;resolve(true);
   },360);
  });
  return completion;
 }
 return {element,start,finish,stop};
}
