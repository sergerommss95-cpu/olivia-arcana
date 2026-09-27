(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const sequence=$('#sequence'),stage=$('#stage'),canvas=$('#world-canvas'),reading=$('#reading'),intro=$('#intro');
const thresholdCopy=$('#threshold-copy'),passageCopy=$('#passage-copy'),arrivalPeek=$('#arrival-peek');
const images=['original','plate','matte','sanctuary','oliviahd'].map(id=>$('#'+id));
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
let langTimer=0,langInTimer=0,pendingLocale=null;
$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>{
 const next=b.dataset.lang;if(next===(pendingLocale??locale))return;
 pendingLocale=next;clearTimeout(langTimer);clearTimeout(langInTimer);
 document.body.classList.remove('lang-in');document.body.classList.add('lang-fade');
 langTimer=setTimeout(()=>{
  locale=pendingLocale;pendingLocale=null;updateCopy();
  document.body.classList.remove('lang-fade');document.body.classList.add('lang-in');
  langInTimer=setTimeout(()=>document.body.classList.remove('lang-in'),120);
 },100);
}));
$$('[data-intent]').forEach(b=>b.addEventListener('click',()=>{intent=Number(b.dataset.intent);$$('[data-intent]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#suggested-question').textContent=text[locale].questions[intent];}));
function measure(){
 const active=ready&&!reduced.matches;
 sequence.classList.toggle('enhanced',active);
 range=active?innerHeight*(innerWidth<=700?2.5:3.2):0;
 sequence.style.height=active?(stage.offsetHeight+range)+'px':'auto';
 const r=canvas.getBoundingClientRect();w=r.width;h=r.height;
 if(ready){const dpr=Math.min(devicePixelRatio||1,innerWidth<=700?1.5:1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(u.uResolution,canvas.width,canvas.height);}
 if(!active){p=target=0;auto=null;}onScroll();paint();
}
function onScroll(){target=range?clamp((scrollY-sequence.offsetTop)/range):0;start();}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function canRun(){return ready&&!paused&&!reduced.matches&&!document.hidden&&intersecting&&!debug;}
function start(){if(!raf&&canRun())raf=requestAnimationFrame(tick);}
function paint(){
 sequence.style.setProperty('--progress',p.toFixed(5));
 const approach=quint(clamp((p-.015)/.455));
 const fade=smooth(.16,.35,p);
 stage.style.setProperty('--intro',String(1-fade));stage.style.setProperty('--intro-shift',String(-48*fade));
 const threshold=smooth(.35,.46,p)*(1-smooth(.50,.59,p));
 stage.style.setProperty('--threshold',String(threshold));stage.style.setProperty('--threshold-shift',String(24*(1-smooth(.28,.39,p))));
 const passage=smooth(.565,.625,p)*(1-smooth(.705,.78,p));
 stage.style.setProperty('--passage',String(passage));stage.style.setProperty('--passage-shift',String(-30*smooth(.70,.79,p)));
 const arrival=smooth(.86,.98,p);
 stage.style.setProperty('--arrival',String(arrival));stage.style.setProperty('--shade',String(1-smooth(.40,.66,p)));
 thresholdCopy.classList.toggle('line-in',threshold>.001);passageCopy.classList.toggle('line-in',passage>.001);arrivalPeek.classList.toggle('line-in',arrival>.001);
 intro.inert=fade>.97;intro.setAttribute('aria-hidden',String(fade>.97));
 const act=p<.34?0:p<.65?1:2;$$('.chapter').forEach((el,i)=>{el.classList.toggle('active',i===act);if(i===act)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
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
 if(auto){const t=clamp((now-auto.start)/auto.duration);const value=auto.from+(auto.to-auto.from)*t;scrollTo(0,sequence.offsetTop+value*range);target=value;if(t>=1){auto=null;reading.focus({preventScroll:true});}}
 p+=(target-p)*(1-Math.exp(-dt*8));if(Math.abs(target-p)<.000025)p=target;
 paint();start();
}
function goReading(){auto=null;p=target=1;paint();reading.scrollIntoView({behavior:'instant'});reading.focus({preventScroll:true});}
$('#skip').addEventListener('click',goReading);
$('.skip-link').addEventListener('click',e=>{e.preventDefault();goReading();});
let floodTimer=0;
function inkFlood(){
 const r=stage.getBoundingClientRect(),b=$('#begin').getBoundingClientRect();
 stage.style.setProperty('--ink-x',((b.left+b.width/2-r.left)/r.width*100).toFixed(2)+'%');
 stage.style.setProperty('--ink-y',((b.top+b.height/2-r.top)/r.height*100).toFixed(2)+'%');
 stage.classList.remove('ink-flood');void stage.offsetWidth;stage.classList.add('ink-flood');
 clearTimeout(floodTimer);floodTimer=setTimeout(()=>stage.classList.remove('ink-flood'),1100);
}
stage.addEventListener('animationend',e=>{if(e.animationName==='ink-flood')stage.classList.remove('ink-flood');});
$('#begin').addEventListener('click',()=>{if(!ready||reduced.matches){goReading();return;}inkFlood();paused=false;debug=false;auto={from:p,to:.98,start:performance.now(),duration:12500*(.98-p)};labels();start();});
$('#replay').addEventListener('click',()=>{auto=null;debug=false;p=target=0;paused=false;scrollTo({top:sequence.offsetTop,behavior:'instant'});paint();$('#begin').focus({preventScroll:true});start();});
$('#motion').addEventListener('click',()=>{if(reduced.matches){goReading();return;}paused=!paused;auto=null;if(paused)stop();else start();labels();});
// Chapter labels ride the same eased-target mechanism as Begin (real buttons for keyboard access).
const chapterAnchors=[0,.42,.70];
$$('.chapter').forEach((el,i)=>{
 const b=document.createElement('button');
 b.type='button';b.className=el.className;b.dataset.copy=el.dataset.copy;b.textContent=el.textContent;
 el.replaceWith(b);
 b.addEventListener('click',()=>{
  if(!range)return;
  paused=false;debug=false;
  auto={from:p,to:chapterAnchors[i],start:performance.now(),duration:Math.max(650,3200*Math.abs(chapterAnchors[i]-p))};
  labels();start();
 });
});
['wheel','touchstart','pointerdown'].forEach(evt=>addEventListener(evt,e=>{if(evt==='pointerdown'&&e.target.closest&&e.target.closest('#begin'))return;auto=null;if(debug){debug=false;onScroll();}},{passive:true}));
addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))auto=null;});
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
new IntersectionObserver(e=>{intersecting=e[0].isIntersecting;if(intersecting)start();else stop();}).observe(stage);
function syncPreference(){if(observedReduced===reduced.matches)return;observedReduced=reduced.matches;stop();measure();labels();start();}
reduced.addEventListener('change',syncPreference);
// A low-frequency fallback also catches preference updates while the render loop is paused.
setInterval(syncPreference,500);
const vertex='attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}';
const fragment="precision highp float;\nvarying vec2 vUv;\nuniform sampler2D uOriginal,uPlate,uMatte,uSanctuary,uFigureHD;\nuniform vec2 uResolution,uSanctuarySize;\nuniform vec4 uFigure;\nuniform float uTime,uProgress,uApproach,uPositionX;\nconst float PI=3.14159265359;\nfloat ramp(float a,float b,float x){return smoothstep(a,b,x);}\nvec2 cover(vec2 q,float imageAspect,float anchor){\n float aspect=uResolution.x/uResolution.y;vec2 fit=vec2(1.);\n if(aspect<imageAspect)fit.x=aspect/imageAspect;else fit.y=imageAspect/aspect;\n return vec2((q.x-.5)*fit.x+.5+(anchor-.5)*(1.-fit.x),(q.y-.5)*fit.y+.5);\n}\n// This layer is sampled from the ORIGINAL photograph, never from a remastered person.\n// Raw matte crop = [930,480,320,310]; occupied source bounds [971,527,1157,761].\nvec4 figure(vec2 q){\n // HD remaster sprite (2048x1984, bbox [281,274]-[1352,1828], foot at x-frac .511 of bbox,\n // contact row y=1828), registered to the photo's contact anchor and physical scale:\n // 234 photo px of figure height = 1554 HD px  ->  6.641 HD px per photo px.\n vec2 photoOff=vec2(971.+186.*q.x-1060.,761.-234.*q.y-761.);\n vec2 hdPx=vec2(828.3,1828.)+photoOff*6.641;\n if(hdPx.x<40.||hdPx.x>2008.||hdPx.y<40.||hdPx.y>1944.)return vec4(0.);\n vec2 hdUV=vec2(hdPx.x/2048.,1.-hdPx.y/1984.);\n vec4 c=texture2D(uFigureHD,hdUV);\n return vec4(c.rgb,c.a);\n}\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nvoid main(){\n float aspect=uResolution.x/uResolution.y;\n float p=uProgress;\n float open=ramp(.33,.65,p);\n float pass=ramp(.64,.97,p);\n vec2 photoUV=cover(vUv,1672./941.,uPositionX);\n float dolly=1.+uApproach*.045;\n vec2 bgUV=(photoUV-vec2(.62,.27))/dolly+vec2(.62,.27);\n float water=1.-ramp(.242,.267,bgUV.y);\n float depth=clamp((.267-bgUV.y)/.267,0.,1.);\n vec2 foot=vec2(uFigure.x+uFigure.z*(89./186.),uFigure.y+uFigure.w*(5./234.));\n vec2 wakePlane=(vUv-foot)*vec2(aspect,5.6);\n float d=length(wakePlane);\n float spread=uFigure.w*.59;\n float envelope=exp(-d/(spread+.014))*ramp(.004,.028,d);\n float wavePhase=d/(spread+.01)*22.-uTime*1.3;\n float wake=sin(wavePhase)*envelope*water;\n vec2 sampleUV=bgUV;\n sampleUV.x+=water*(.0004+.0017*depth)*sin(bgUV.y*430.+uTime*.8+sin(bgUV.x*20.+uTime*.15));\n sampleUV.y+=water*.00055*sin(bgUV.x*75.+bgUV.y*270.-uTime*.6);\n sampleUV+=vec2(wake*.0016*sin(wavePhase*.3),wake*.00095);\n float cloud=ramp(.28,.4,bgUV.y)*(1.-ramp(.67,.78,bgUV.y));\n sampleUV.x+=cloud*.0007*sin(bgUV.y*11.+uTime*.16);\n sampleUV+=vec2(sin(bgUV.y*6.+uTime*.05),cos(bgUV.x*5.-uTime*.04))*.0012*cloud;\n vec3 base=texture2D(uPlate,clamp(sampleUV,.001,.999)).rgb;\n // Her reflected figure is sampled from the same original pixels and distorted in the sea.\n float below=(foot.y-vUv.y)/(uFigure.w*.85);\n vec2 rq=vec2((vUv.x-uFigure.x)/uFigure.z,below);\n rq.x+=(.007+.033*max(below,0.))*sin(vUv.y*530.+uTime*1.1+vUv.x*10.);\n rq.x+=.008*sin(vUv.y*910.-uTime*.7);\n rq.y+=.006*sin(vUv.y*200.+vUv.x*35.+uTime*.5);\n vec4 reflected=figure(rq);\n float ra=reflected.a*.62*exp(-max(below,0.)*2.)*ramp(0.,.02,below)*(1.-ramp(.68,1.,below));\n ra*=1.-ramp(foot.y-.001,foot.y+.001,vUv.y);\n base=mix(base,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra);\n base+=vec3(.57,.65,1.)*wake*.052;\n float wake2=sin(wavePhase*.6+2.1)*envelope*water;\n base+=vec3(.5,.6,.95)*wake2*.028;\n float crestSpark=step(.995,hash(floor(vUv*uResolution*.35)+floor(uTime*2.)))*envelope*water;\n base+=vec3(.85,.9,1.)*crestSpark*.35;\n base+=vec3(.63,.72,1.)*pow(max(0.,cos(wavePhase)),19.)*envelope*water*.18;\n vec2 q=(vUv-uFigure.xy)/uFigure.zw;\n float hem=1.-ramp(.07,.6,q.y);\n q.x+=hem*.0035*sin(q.y*10.+uTime*.65)*ramp(.04,.45,abs(q.x-.50)*2.);\n vec4 fg=figure(q);\n fg.a*=ramp(.012,.03,q.y+.0015*sin(q.x*45.+uTime*.65));\n float aR=figure(q-vec2(.014,0.)).a;\n float rimEdge=clamp(fg.a-aR,0.,1.);\n fg.rgb+=vec3(.75,.82,1.)*rimEdge*.32*uApproach;\n float lum=dot(fg.rgb,vec3(.299,.587,.114));\n float bead=step(.76,q.x)*step(q.x,.92)*step(.18,q.y)*step(q.y,.68)*step(.7,lum);\n fg.rgb+=vec3(.9,.95,1.)*bead*pow(.5+.5*sin(uTime*3.+q.y*60.),6.)*.45;\n float hemContact=exp(-pow((q.y-.05)/.055,2.))*fg.a;\n fg.rgb+=vec3(.6,.68,1.)*hemContact*(.10+.14*abs(wake));\n vec3 outside=base;\n // A small darkening makes the rising silver-water surface read as a physical threshold.\n outside*=1.-open*.27;\n // A ripple begins in the same water plane as her feet, then rises and rolls toward the viewer.\n float rise=ramp(.38,.67,p);\n // The opening is born IN the clouds at the heart of the sky and blooms outward.\n vec2 center=mix(vec2(.46,.60),vec2(.5,.50),rise);\n center=mix(center,vec2(.5,.5),pass);\n float radius=mix(.035,.355,open)+pass*pass*2.25;\n float squash=mix(.82,1.,rise);\n vec2 plane=(vUv-center)*vec2(aspect,1./squash);\n float radial=length(plane);\n float angle=atan(plane.y,plane.x);\n float turbulence=sin(angle*15.+uTime*.30+sin(angle*7.-uTime*.22))*.0013;\n turbulence+=sin(angle*39.-uTime*.6)*.00065;\n float edge=radial-radius+turbulence*open;\n float gate=ramp(.335,.42,p);\n float herald=ramp(.29,.335,p)*(1.-gate);\n vec2 hrel=(vUv-vec2(.46,.60))*vec2(aspect,1.);\n outside+=vec3(.95,.87,.66)*herald*exp(-dot(hrel,hrel)/.00003)*2.6;\n outside+=vec3(.65,.72,1.)*herald*exp(-dot(hrel,hrel)/.0035)*.5;\n outside+=vec3(.95,.87,.66)*herald*exp(-pow(hrel.x/.0015,2.))*exp(-pow(hrel.y/.03,2.))*.5;\n float aperture=(1.-ramp(-.004,.004,edge))*gate;\n // Inside the opening: a distinct sanctuary, with slow parallax and a low reflective water plane.\n float innerZoom=mix(.5,.90,open);innerZoom=mix(innerZoom,1.045,pass);\n vec2 innerScreen=(vUv-center)/innerZoom+vec2(.5,.26+.24*open);\n vec2 innerUV=cover(innerScreen,uSanctuarySize.x/uSanctuarySize.y,.5);\n float innerWater=1.-ramp(.235,.30,innerUV.y);\n innerUV.x+=innerWater*.0013*sin(innerUV.y*410.+uTime*.66);\n innerUV.y+=innerWater*.00035*sin(innerUV.x*70.-uTime*.5);\n vec3 inner=texture2D(uSanctuary,clamp(innerUV,.001,.999)).rgb;\n inner=mix(vec3(.04,.05,.22),inner,step(abs(innerScreen.y-.5),.5)*step(abs(innerScreen.x-.5),.5));\n // Dark central exposure keeps the reading invitation legible without a floating UI panel.\n float centerShade=exp(-pow((vUv.x-.5)*2.5,2.))*exp(-pow((vUv.y-.49)*1.9,2.));\n inner*=1.-centerShade*.42;\n // the newborn opening glows — light arrives before the view resolves\n inner+=vec3(.5,.6,1.)*(1.-open)*.22;\n inner+=vec3(.55,.62,1.)*innerWater*.045*(.5+.5*sin(uTime*.5));\n float archKiss=exp(-pow((innerUV.y-.68)/.07,2.))*exp(-pow((innerUV.x-.5)/.24,2.));\n inner+=vec3(.88,.72,.42)*archKiss*.09*pass;\n vec3 color=mix(outside,inner,aperture);\n // The rim is a refracting band of water, with multiple asymmetric moonlit crests.\n float rimWidth=.016+.048*open+.02*pass;\n float band=exp(-pow(edge/rimWidth,2.));\n float arcLight=.42+.58*pow(.5+.5*sin(angle+1.15),2.);\n float massLow=.55+.45*ramp(-.6,.35,plane.y/max(radius,.001));\n vec2 rn=normalize(plane+vec2(.00001));\n vec2 refractUV=cover(vUv+rn*band*(.026+.02*open),1672./941.,uPositionX);\n vec3 tideWater=texture2D(uPlate,clamp(refractUV,.001,.999)).rgb;\n float streak=pow(.5+.5*sin(angle*90.+radial*260.+uTime*2.1),6.);\n float lift=pow(.5+.5*sin(edge*300.-uTime*1.9+sin(angle*6.)*1.2),5.);\n tideWater*=.72+.5*lift*arcLight;\n tideWater+=vec3(.62,.70,1.)*streak*.16*arcLight;\n color=mix(color,tideWater,band*gate*(.62+.25*open)*massLow);\n float crestOuter=exp(-pow((edge-rimWidth*.55)/(rimWidth*.16),2.));\n float crestInner=exp(-pow((edge+rimWidth*.5)/(rimWidth*.2),2.));\n float foamTex=.55+.45*sin(angle*48.+uTime*.9+radial*130.);\n color+=vec3(.87,.90,1.)*(crestOuter*.5+crestInner*.3)*gate*arcLight*foamTex;\n float sprayZone=ramp(0.,rimWidth*2.6,edge)*(1.-ramp(rimWidth*2.6,rimWidth*6.,edge));\n float droplets=step(.985,hash(floor((vUv+vec2(0.,uTime*.02))*uResolution*.5)));\n color+=vec3(.8,.86,1.)*droplets*sprayZone*gate*.5;\n color+=vec3(.40,.48,.83)*exp(-abs(edge)*30.)*gate*.10;\n // Engraved marks appear in the water itself as the circle becomes upright.\n float engraved=ramp(.49,.60,p)*(1.-ramp(.76,.91,p));\n float tick=pow(max(0.,cos(angle*72.)),22.);\n float tickRing=ramp(radius+.025,radius+.029,radial)*(1.-ramp(radius+.037,radius+.039,radial));\n float outerRing=exp(-pow((radial-radius-.053)/.0008,2.));\n color+=vec3(.70,.62,.44)*(tick*tickRing*.5+outerRing*.18)*engraved;\n float rush=pass*(1.-pass)*4.;\n vec3 rushTap=texture2D(uPlate,clamp(bgUV+rn*.018*rush,.001,.999)).rgb;\n color=mix(color,rushTap,rush*.16*(1.-aperture));\n color*=1.-rush*.12*pow(length((vUv-.5)*vec2(aspect,1.)),2.);\n // Olivia remains in front of the rising portal until mist absorbs her as we pass through.\n float figureVisibility=1.-ramp(.665,.79,p);\n color=mix(color,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra*figureVisibility*aperture*.8);\n color+=vec3(.57,.65,1.)*wake*.03*figureVisibility*aperture;\n color=mix(color,fg.rgb,fg.a*figureVisibility);\n float sCycle=floor(uTime/13.);float sT=fract(uTime/13.)*3.;\n vec2 sA=vec2(.12+.55*hash(vec2(sCycle,7.3)),.08+.14*hash(vec2(sCycle,3.1)));\n vec2 sDir=normalize(vec2(.82,.3));vec2 sPos=sA+sDir*sT*.45;\n vec2 srel=(vUv-sPos)*vec2(aspect,1.);\n float along=dot(srel,sDir);float perp=dot(srel,vec2(-sDir.y,sDir.x));\n float shoot=exp(-perp*perp/.0000035)*exp(-along*along/.0016)*step(along,0.)*step(-.055,along)*step(sT,1.);\n color+=vec3(.9,.94,1.)*shoot*.7*(1.-ramp(.18,.28,p));\n // Film texture, stable in screen space, ties the procedural water to the supplied artwork.\n vec3 tc=clamp(color,0.,1.);\n vec3 graded=mix(tc,tc*tc*(3.-2.*tc),.42);\n float grain=(hash(floor(vUv*uResolution))-.5)*.006*(1.-dot(graded,vec3(.3333)));\n gl_FragColor=vec4(max(graded+grain,vec3(0.)),1.);\n}\n";
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function fallback(){stop();ready=false;canvas.classList.remove('ready');sequence.classList.remove('enhanced');sequence.style.height='auto';range=0;p=target=0;paint();stage.dataset.renderer='static';$('.motion-controls').hidden=true;$('#begin').textContent=text[locale].direct;}
function initialize(){
 try{
  if(images.some(i=>!i.naturalWidth))throw Error('A scene image did not load');
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const at=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
  u={};['uOriginal','uPlate','uMatte','uSanctuary','uFigureHD','uResolution','uSanctuarySize','uFigure','uTime','uProgress','uApproach','uPositionX'].forEach(n=>u[n]=gl.getUniformLocation(program,n));
  images.forEach((img,i)=>{const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1i(u[['uOriginal','uPlate','uMatte','uSanctuary','uFigureHD'][i]],i);});
  gl.uniform2f(u.uSanctuarySize,images[3].naturalWidth,images[3].naturalHeight);ready=true;stage.dataset.renderer='webgl';$('.motion-controls').hidden=false;const bg=$('#begin');if(!bg.querySelector('[data-copy]')){bg.innerHTML='<span data-copy="begin"></span><span aria-hidden="true">\u2197</span>';updateCopy();}measure();
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

/* ── Liquid Night: slow silk-water ground under the reading ─────────── */
(()=>{
 const cv=document.getElementById('liquid-night');if(!cv)return;
 const RM=matchMedia('(prefers-reduced-motion: reduce)');
 let gl2,prog,uu={},raf2=0,t0=performance.now(),seen=false,ok=false,last2=0;
 const VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
 const FS=`precision mediump float;varying vec2 v;uniform vec2 R;uniform float T;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.55;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(11.7,7.3);a*=.5;}return s;}
void main(){
 vec2 uv=v;uv.x*=R.x/R.y;
 float t=T*.028;
 vec2 q=uv*1.35+vec2(0.,-t*.5);
 float w=fbm(q+vec2(t*.7,-t*.4));
 float silk=fbm(q*1.7+vec2(w*1.9,-w*1.4)-vec2(t*.5,t*.3));
 float vein=fbm(q*3.1+vec2(-w*1.2,w*.9)+vec2(t*.2,-t*.6));
 vec3 col=vec3(.039,.051,.22);
 col=mix(col,vec3(.094,.114,.478),smoothstep(.32,.78,silk));
 col=mix(col,vec3(.125,.153,.608),smoothstep(.62,.95,silk)*.55);
 float fil=pow(smoothstep(.55,.98,vein),3.);
 col+=vec3(.62,.66,.94)*fil*.10;
 float breath=.5+.5*sin(T*.07);
 float lobe=exp(-pow(length((v-vec2(.24,.30))*vec2(R.x/R.y,1.))/.5,2.));
 col+=vec3(.878,.718,.408)*lobe*pow(silk,4.)*.045*breath;
 col*=1.-.38*pow(length((v-.5)*vec2(1.15,1.)),1.7);
 col=mix(col,vec3(.039,.051,.22),smoothstep(.92,1.,v.y));
 float g=(h(floor(v*R))-.5)*.012*(1.-silk*.5);
 gl_FragColor=vec4(col+g,1.);}`;
 function mk(ty,src){const s=gl2.createShader(ty);gl2.shaderSource(s,src);gl2.compileShader(s);
  if(!gl2.getShaderParameter(s,gl2.COMPILE_STATUS))throw Error('liquid shader');return s;}
 function size(){if(!ok)return;const r=cv.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,1.25);
  cv.width=Math.max(1,r.width*d|0);cv.height=Math.max(1,r.height*d|0);gl2.viewport(0,0,cv.width,cv.height);
  gl2.uniform2f(uu.R,cv.width,cv.height);draw();}
 function draw(){gl2.uniform1f(uu.T,(performance.now()-t0)/1000);gl2.drawArrays(gl2.TRIANGLES,0,6);}
 function loop(now){raf2=0;if(!ok||!seen||document.hidden||RM.matches)return;
  if(now-last2>40){last2=now;draw();}raf2=requestAnimationFrame(loop);}
 function wake(){if(ok&&seen&&!raf2&&!document.hidden)raf2=requestAnimationFrame(loop);}
 function boot(){
  try{
   gl2=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
   if(!gl2)return;
   prog=gl2.createProgram();gl2.attachShader(prog,mk(gl2.VERTEX_SHADER,VS));gl2.attachShader(prog,mk(gl2.FRAGMENT_SHADER,FS));
   gl2.linkProgram(prog);if(!gl2.getProgramParameter(prog,gl2.LINK_STATUS))throw Error('liquid link');
   gl2.useProgram(prog);
   const b=gl2.createBuffer();gl2.bindBuffer(gl2.ARRAY_BUFFER,b);
   gl2.bufferData(gl2.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl2.STATIC_DRAW);
   const at=gl2.getAttribLocation(prog,'p');gl2.enableVertexAttribArray(at);gl2.vertexAttribPointer(at,2,gl2.FLOAT,false,0,0);
   uu.R=gl2.getUniformLocation(prog,'R');uu.T=gl2.getUniformLocation(prog,'T');
   ok=true;size();cv.classList.add('ready');wake();
  }catch(e){/* flat night stays — the fallback IS the design's floor */}
 }
 new ResizeObserver(size).observe(cv);
 new IntersectionObserver(es=>{seen=es.some(x=>x.isIntersecting);wake();},{rootMargin:'160px'}).observe(cv);
 document.addEventListener('visibilitychange',wake);
 RM.addEventListener('change',()=>{if(RM.matches){cancelAnimationFrame(raf2);raf2=0;draw();}else wake();});
 boot();
})();
