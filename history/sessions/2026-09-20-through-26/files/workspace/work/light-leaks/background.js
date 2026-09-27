import { createShader } from 'shaders/js';

import { preset } from './preset.js';

const root=document.documentElement, stage=document.querySelector('#stage');
const canvas=document.querySelector('#atmosphere');
const mq=matchMedia('(prefers-reduced-motion: reduce)'), params=new URLSearchParams(location.search);
let shader=null, gone=false, suspended=false, resizeFrame=0, stillFrame=0, drawGeneration=0;
let booting=true, failed=false, startupGeneration=0;
function paused(){return mq.matches||params.get('motion')==='reduce'||root.classList.contains('quiet')||document.querySelector('#motion').getAttribute('aria-pressed')==='true';}
function state(){canvas.dataset.state=failed?'fallback':booting?'loading':document.hidden||suspended?'suspended':paused()?'still':'animated';}
function sync(){
  state();document.querySelectorAll('[data-frame]').forEach(b=>b.disabled=root.classList.contains('fallback'));
  if(!shader||gone)return;
  if(document.hidden||suspended||(!booting&&paused()))shader.pause();else shader.resume();
}
function dimensions(){
  const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
  const budget=w<700?650000:1100000;
  const scale=Math.min(1,Math.sqrt(budget/(Math.max(1,w*h)*dpr*dpr)));
  return [Math.max(1,Math.floor(w*scale)),Math.max(1,Math.floor(h*scale))];
}
function fit(){
  if(!shader||gone)return;
  shader.resize(...dimensions());canvas.style.width='100%';canvas.style.height='100%';
  canvas.dataset.buffer=`${canvas.width}×${canvas.height}`;
}
// A paused GPU needs one frame to show a palette or size change, then stops.
function redrawStill(){
  if(!shader||gone||document.hidden||suspended)return;
  const generation=++drawGeneration;cancelAnimationFrame(stillFrame);
  shader.resume();stillFrame=requestAnimationFrame(()=>{stillFrame=requestAnimationFrame(()=>{stillFrame=0;if(generation===drawGeneration)sync();});});
}
document.querySelectorAll('[data-frame]').forEach(b=>b.addEventListener('click',()=>{
  window.motionStudy.setProgress(Number(b.dataset.frame));
  document.querySelectorAll('[data-frame]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
}));
document.querySelector('#journey').addEventListener('click',()=>document.querySelectorAll('[data-frame]').forEach(b=>b.setAttribute('aria-pressed','false')));
addEventListener('scroll',()=>{
  if(root.classList.contains('quiet'))return;
  const progress=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
  document.querySelectorAll('[data-frame][aria-pressed="true"]').forEach(b=>{
    if(Math.abs(progress-Number(b.dataset.frame))>.0002)b.setAttribute('aria-pressed','false');
  });
},{passive:true});
document.querySelector('#background-toggle').addEventListener('click',e=>{
  const hidden=stage.classList.toggle('cards-hidden');e.currentTarget.textContent=hidden?'Show cards':'Background only';e.currentTarget.setAttribute('aria-pressed',String(hidden));
});
const observer=new MutationObserver(sync);observer.observe(document.querySelector('#motion'),{attributes:true,attributeFilter:['aria-pressed']});observer.observe(root,{attributes:true,attributeFilter:['class']});
mq.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;fit();if(paused())redrawStill();});});
addEventListener('pagehide',e=>{
  suspended=true;sync();cancelAnimationFrame(resizeFrame);cancelAnimationFrame(stillFrame);
  startupGeneration++;drawGeneration++;shader?.destroy();shader=null;
  if(!e.persisted){gone=true;observer.disconnect();mq.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);}
});
addEventListener('pageshow',e=>{suspended=false;if(e.persisted&&!gone)start();else sync();});
window.motionStudy.setProgress(0);
async function start(){
  const generation=++startupGeneration;booting=true;failed=false;canvas.classList.remove('loaded');root.classList.remove('atmosphere-fallback');document.querySelector('#render-note').textContent='';state();
  if(params.get('background')==='static'||!navigator.gpu){fallback();return;}
  const [w,h]=dimensions();canvas.style.width=w+'px';canvas.style.height=h+'px';
  try{
    const instance=await createShader(canvas,preset,{observeElement:false,disableTelemetry:true,
      onReady(){if(gone||generation!==startupGeneration)return;booting=false;canvas.classList.add('loaded');if(shader){fit();if(paused())redrawStill();else sync();}else sync();},
      onError(){if(generation===startupGeneration&&shader?.getFailureReason())fallback();}
    });
    if(gone||suspended||generation!==startupGeneration){instance.destroy();return;}
    shader=instance;
    if(instance.getFailureReason()){fallback();return;}
    fit();sync();
  }catch(error){if(gone||generation!==startupGeneration)return;fallback();console.warn('Atmosphere preview unavailable; static palette retained.',error);}
}
function fallback(){
  failed=true;booting=false;canvas.classList.remove('loaded');shader?.destroy();shader=null;
  root.classList.add('atmosphere-fallback');canvas.dataset.state='fallback';
  document.querySelector('#render-note').textContent='Static preview — animated atmosphere is unavailable in this browser.';
}
start();
