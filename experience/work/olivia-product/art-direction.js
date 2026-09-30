/** The opening art is real HTML: usable without WebGL, decorative motion stays optional. */
export function initArtDirection(){
 const fan=document.getElementById('art-fan');if(!fan)return;
 const toggle=()=>fan.setAttribute('aria-expanded',String(fan.getAttribute('aria-expanded')!=='true'));
 fan.addEventListener('click',toggle);
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.getElementById('motion')?.getAttribute('aria-pressed')==='true';
 if(!reduced()){
  const images=[...fan.querySelectorAll('img')];const animations=images.map((image,index)=>image.animate([{opacity:0,translate:`${(1-index)*26}px 32px`},{opacity:1,translate:'0 0'}],{duration:1100+index*130,delay:180,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}));
  const cancel=()=>animations.forEach(animation=>animation.cancel());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();},{once:true});
  window.addEventListener('pagehide',cancel,{once:true});
  document.getElementById('motion')?.addEventListener('click',cancel,{once:true});
 }
}
