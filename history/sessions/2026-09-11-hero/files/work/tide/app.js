(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sequence=$('#sequence'),stage=$('#stage'),canvas=$('#world-canvas'),reading=$('#reading'),intro=$('#intro');
const images=['original','plate','matte','sanctuary'].map(id=>$('#'+id));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const text={
 en:{eyebrow:'A personal almanac',ask:'Ask the Oracle',dailyNav:'Daily card',description:'Astrology and tarot, shaped by your birth chart and the question you bring.',begin:'Begin the journey',direct:'Go to the reading',signature:'Clarity first. No noise.',act2:'II. The tide opens',threshold:'A little stillness.<br><em>A different perspective.</em>',act3:'III. On the other side',passage:'Bring what is<br><em>on your mind.</em>',oracle:'The Oracle',arrival:'Your question.<br><em>A new perspective.</em>',skip:'Skip the opening ↗',skipLink:'Skip to the reading entrance',chapter1:'01 — Approach',chapter2:'02 — Open',chapter3:'03 — Enter',readingEyebrow:'On the other side of a question',readingTitle:'What would you like<br>to see <em>more clearly?</em>',readingDescription:'Choose a starting point. Make room for a new perspective.',intent0:'A decision',intent1:'A relationship',intent2:'My next step',questionLabel:'A question to begin with',continue:'Continue to the Oracle',daily:'Draw your daily card',replay:'↶ Replay the opening',heading:'Your stars,<br>translated<br><em>clearly.</em>',pause:'Pause motion',play:'Play motion',scroll1:'Scroll to draw closer',scroll2:'Keep scrolling — the tide opens',scroll3:'Scroll through to your reading',scroll4:'Your reading begins below',questions:['What should I consider before I choose?','What could help me understand this connection?','What deserves my attention now?']},
 uk:{eyebrow:'Персональний альманах',ask:'Запитати Оракула',dailyNav:'Карта дня',description:'Астрологія й таро на основі вашої натальної карти та запитання, з яким ви прийшли.',begin:'Почати подорож',direct:'Перейти до читання',signature:'Спершу ясність. Без шуму.',act2:'II. Приплив відкриває шлях',threshold:'Трохи тиші.<br><em>Інший погляд.</em>',act3:'III. По той бік',passage:'Почніть із того,<br><em>що вас хвилює.</em>',oracle:'Оракул',arrival:'Ваше запитання.<br><em>Новий погляд.</em>',skip:'Пропустити вступ ↗',skipLink:'Перейти до початку читання',chapter1:'01 — Назустріч',chapter2:'02 — Відкриття',chapter3:'03 — Вхід',readingEyebrow:'По той бік запитання',readingTitle:'Що ви хочете<br>побачити <em>ясніше?</em>',readingDescription:'Оберіть тему. Погляньте на неї по-новому.',intent0:'Рішення',intent1:'Стосунки',intent2:'Мій наступний крок',questionLabel:'Запитання для початку',continue:'Перейти до Оракула',daily:'Витягнути карту дня',replay:'↶ Переглянути вступ ще раз',heading:'Ваші зірки —<br>людською<br><em>мовою.</em>',pause:'Зупинити рух',play:'Увімкнути рух',scroll1:'Гортайте, щоб наблизитися',scroll2:'Гортайте — приплив відкриває шлях',scroll3:'Гортайте до свого читання',scroll4:'Ваше читання починається нижче',questions:['Що варто врахувати, перш ніж зробити вибір?','Що допоможе мені краще зрозуміти ці стосунки?','На що мені зараз варто звернути увагу?']}
};
let locale='en',intent=0,paused=false,ready=false,intersecting=true,gl,program,u,raf=0,last=0,time=0,p=0,target=0,range=0,w=1,h=1;
let auto=null,debug=false,observedReduced=reduced.matches;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const quint=t=>t*t*t*(t*(t*6-15)+10);
function updateCopy(){
 document.documentElement.lang=locale;
 const htmlKeys=['threshold','passage','arrival','readingTitle'];
 $$('[data-copy]').forEach(el=>{const value=text[locale][el.dataset.copy];if(htmlKeys.includes(el.dataset.copy))el.innerHTML=value;else el.textContent=value;});
 $('#hero-title').innerHTML=text[locale].heading;
 $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===locale)));
 $('.languages').setAttribute('aria-label',locale==='uk'?'Мова':'Language');
 $('nav').setAttribute('aria-label',locale==='uk'?'Головна навігація':'Main navigation');
 $('.intent-group').setAttribute('aria-label',locale==='uk'?'Оберіть тему':'Choose a starting point');
 $('#suggested-question').textContent=text[locale].questions[intent];labels();
}
function labels(){
 const stopped=paused||reduced.matches;
 $('#motion').setAttribute('aria-pressed',String(!stopped));
 $('#motion').setAttribute('aria-label',locale==='uk'?'Рух у сцені':'Scene motion');
 $('#motion-label').textContent=reduced.matches?(locale==='uk'?'Без анімації':'Still mode'):text[locale][stopped?'play':'pause'];
 $('#motion').disabled=reduced.matches;
 $('.motion-symbol').textContent=stopped?'▷':'Ⅱ';
 $('#scroll-caption').textContent=text[locale][p>.96?'scroll4':p>.65?'scroll3':p>.34?'scroll2':'scroll1'];
}
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{locale=b.dataset.lang;updateCopy();}));
$$('[data-intent]').forEach(b=>b.addEventListener('click',()=>{intent=Number(b.dataset.intent);$$('[data-intent]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#suggested-question').textContent=text[locale].questions[intent];}));
function measure(){
 const active=ready&&!reduced.matches;
 sequence.classList.toggle('enhanced',active);
 range=active?innerHeight*(innerWidth<=700?2.5:3.2):0;
 sequence.style.height=active?(stage.offsetHeight+range)+'px':'auto';
 const r=canvas.getBoundingClientRect();w=r.width;h=r.height;
 if(ready){const dpr=Math.min(devicePixelRatio||1,innerWidth<=700?1.5:1.35);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.uResolution,canvas.width,canvas.height);}
 if(!active){p=target=0;auto=null;}onScroll();paint();
}
function onScroll(){target=range?clamp((scrollY-sequence.offsetTop)/range):0;start();}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function canRun(){return ready&&!paused&&!reduced.matches&&!document.hidden&&intersecting&&!debug;}
function start(){if(!raf&&canRun())raf=requestAnimationFrame(tick);}
function paint(){
 const approach=quint(clamp((p-.015)/.455));
 const fade=smooth(.16,.35,p);
 stage.style.setProperty('--intro',String(1-fade));stage.style.setProperty('--intro-shift',String(-48*fade));
 const threshold=smooth(.28,.39,p)*(1-smooth(.48,.57,p));
 stage.style.setProperty('--threshold',String(threshold));stage.style.setProperty('--threshold-shift',String(24*(1-smooth(.28,.39,p))));
 const passage=smooth(.565,.625,p)*(1-smooth(.705,.78,p));
 stage.style.setProperty('--passage',String(passage));stage.style.setProperty('--passage-shift',String(-30*smooth(.70,.79,p)));
 stage.style.setProperty('--arrival',String(smooth(.86,.98,p)));stage.style.setProperty('--shade',String(1-smooth(.40,.66,p)));
 intro.inert=fade>.97;intro.setAttribute('aria-hidden',String(fade>.97));
 const act=p<.34?0:p<.65?1:2;$$('.chapter').forEach((el,i)=>el.classList.toggle('active',i===act));
 $('#progress-fill').style.transform='scaleX('+p+')';
 stage.dataset.progress=p.toFixed(5);stage.dataset.act=String(act+1);labels();
 if(!ready)return;
 const mobile=innerWidth<=700;
 const ratio=w/h,ir=1672/941,fitX=Math.min(1,ratio/ir),fitY=Math.min(1,ir/ratio);
 const positionX=mobile?.63:.5;
 const imageOrigin=.5+(positionX-.5)*(1-fitX);
 const px=x=>(x-imageOrigin)/fitX+.5,py=y=>(y-.5)/fitY+.5;
 const baseHeight=234/941/fitY;
 const scale=Math.min(1/(1-.545*approach),mobile?.40/baseHeight:2.2);
 const figureH=baseHeight*scale;
 const horizon=py(1-698/941),baseFoot=py(1-756/941);
 // Phone composition keeps her contact point clear of the fixed progress controls.
 const footY=mobile?.185-.025*approach:horizon+(baseFoot-horizon)*scale;
 const originX=px(1060/1672);
 const centerX=mobile?.70:originX+.024*approach;
 const figureW=figureH*(186/234)/ratio;
 const left=centerX-figureW*(89/186);
 const bottom=footY-figureH*(5/234);
 gl.uniform4f(u.uFigure,left,bottom,figureW,figureH);
 gl.uniform1f(u.uTime,time);gl.uniform1f(u.uProgress,p);gl.uniform1f(u.uApproach,approach);gl.uniform1f(u.uPositionX,positionX);
 gl.drawArrays(gl.TRIANGLES,0,6);stage.dataset.figureScale=scale.toFixed(4);
}
function tick(now){
 raf=0;if(!canRun())return;
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;
 if(auto){const t=clamp((now-auto.start)/auto.duration);const value=auto.from+(auto.to-auto.from)*t;scrollTo(0,sequence.offsetTop+value*range);target=value;if(t>=1)auto=null;}
 p+=(target-p)*(1-Math.exp(-dt*8));if(Math.abs(target-p)<.000025)p=target;
 paint();start();
}
function goReading(){auto=null;p=target=1;paint();reading.scrollIntoView({behavior:'instant'});reading.focus({preventScroll:true});}
$('#skip').addEventListener('click',goReading);
$('.skip-link').addEventListener('click',e=>{e.preventDefault();goReading();});
$('#begin').addEventListener('click',()=>{if(!ready||reduced.matches){goReading();return;}paused=false;debug=false;auto={from:p,to:.98,start:performance.now(),duration:12500*(.98-p)};labels();start();});
$('#replay').addEventListener('click',()=>{auto=null;debug=false;p=target=0;paused=false;scrollTo({top:sequence.offsetTop,behavior:'instant'});paint();$('#begin').focus({preventScroll:true});start();});
$('#motion').addEventListener('click',()=>{if(reduced.matches){goReading();return;}paused=!paused;auto=null;if(paused)stop();else start();labels();});
['wheel','touchstart','pointerdown'].forEach(evt=>addEventListener(evt,e=>{if(evt==='pointerdown'&&e.target.closest&&e.target.closest('#begin'))return;auto=null;},{passive:true}));
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))auto=null;});
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new IntersectionObserver(e=>{intersecting=e[0].isIntersecting;if(intersecting)start();else stop();}).observe(stage);
function syncPreference(){if(observedReduced===reduced.matches)return;observedReduced=reduced.matches;stop();measure();labels();start();}
reduced.addEventListener('change',syncPreference);
// A low-frequency fallback also catches preference updates while the render loop is paused.
setInterval(syncPreference,500);
const vertex='attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}';
const fragment=/*FRAGMENT*/;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function fallback(){stop();ready=false;canvas.classList.remove('ready');sequence.classList.remove('enhanced');sequence.style.height='auto';range=0;p=target=0;paint();stage.dataset.renderer='static';$('.motion-controls').hidden=true;$('#begin').textContent=text[locale].direct;}
function initialize(){
 try{
  if(images.some(i=>!i.naturalWidth))throw Error('A scene image did not load');
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const at=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
  u={};['uOriginal','uPlate','uMatte','uSanctuary','uResolution','uSanctuarySize','uFigure','uTime','uProgress','uApproach','uPositionX'].forEach(n=>u[n]=gl.getUniformLocation(program,n));
  images.forEach((img,i)=>{const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1i(u[['uOriginal','uPlate','uMatte','uSanctuary'][i]],i);});
  gl.uniform2f(u.uSanctuarySize,images[3].naturalWidth,images[3].naturalHeight);ready=true;stage.dataset.renderer='webgl';measure();
  const atProgress=location.hash.match(/(?:^#|&)p=([\d.]+)/);if(atProgress){debug=true;p=target=clamp(Number(atProgress[1]));time=3;paint();}
  canvas.classList.add('ready');start();
 }catch(error){console.warn('Olivia: static fallback.',error.message);fallback();}
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});canvas.addEventListener('webglcontextrestored',initialize);
const loaded=img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});});
updateCopy();Promise.all(images.map(loaded)).then(initialize);
// Deterministic inspection of the real renderer. No assets or markup are swapped for previews.
window.tidePreview={seek(value,atTime=3){debug=true;stop();p=target=clamp(value);time=atTime;paint();},resume(){debug=false;onScroll();start();},state(){return {progress:p,target,ready,paused,reduced:reduced.matches,range,time};}};
})();
