(() => {
 'use strict';
 const hero=document.querySelector('.hero'), sequence=document.querySelector('.scroll-sequence');
 const canvas=document.querySelector('#scene-canvas'), original=document.querySelector('#scene-image');
 const plate=document.querySelector('#clean-plate'), woman=document.querySelector('#woman-image');
 const toggle=document.querySelector('#motion-toggle'), media=matchMedia('(prefers-reduced-motion: reduce)');
 const hint=document.querySelector('#scroll-label'), progressBar=document.querySelector('.scroll-progress-fill');
 const copy={
 en:{skip:'Skip to content',almanac:'The almanac',oracleNav:'The oracle',dailyNav:'Daily card',eyebrow:'A personal almanac',description:'Astrology and tarot, shaped by your birth chart and the question you bring.',ask:'Ask the oracle',daily:'Draw your daily card',trust:'Clarity first. No noise.',caption:'I. The arrival',captionSub:'Between the known & the possible',footer:'Astrology & tarot, made personal',pause:'Pause motion',play:'Play motion',scroll:'Scroll to draw closer',return:'Scroll back to return',skipAnimation:'Skip animation',heading:'<span>Your stars,</span><span>translated</span><span><em>clearly.</em></span>'},
 uk:{skip:'Перейти до вмісту',almanac:'Альманах',oracleNav:'Оракул',dailyNav:'Карта дня',eyebrow:'Персональний альманах',description:'Астрологія й таро на основі вашої натальної карти та запитання, з яким ви прийшли.',ask:'Запитати Оракула',daily:'Карта дня',trust:'Спершу ясність. Без шуму.',caption:'I. Наближення',captionSub:'Між відомим і можливим',footer:'Астрологія й таро — для вас',pause:'Зупинити рух',play:'Увімкнути рух',scroll:'Гортайте, щоб наблизитися',return:'Гортайте назад, щоб повернутися',skipAnimation:'Пропустити анімацію',heading:'<span>Ваші зірки —</span><span>людською</span><span><em>мовою.</em></span>'}
 };
 let locale='en', motion=!media.matches, inView=true, ready=false, contextLost=false;
 let gl,program,uniforms,raf=0,last=0,lastDraw=0,time=0,current=0,target=0,scrollRange=1;
 let canvasWidth=1,canvasHeight=1, foregroundBounds={"aspect":0.6677482154445166,"uv":[0.14453125,0.08215725806451613,0.50244140625,0.7767137096774194],"bbox":{"x0":296,"y0":280,"x1":1324,"y1":1820},"imageWidth":2048,"imageHeight":1984};
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
 function labels(){
   hero.classList.toggle('is-paused',!motion);
   toggle.setAttribute('aria-pressed',String(motion));
   document.querySelector('#motion-label').textContent=copy[locale][motion?'pause':'play'];
   hint.textContent=copy[locale][current>.96?'return':'scroll'];
 }
 document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{
   locale=b.dataset.language;document.documentElement.lang=locale;
   document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=copy[locale][e.dataset.i18n]);
   document.querySelector('#hero-title').innerHTML=copy[locale].heading;
   document.querySelectorAll('[data-language]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.language===locale)));
   document.querySelector('.languages').setAttribute('aria-label',locale==='uk'?'Мова':'Language');
   document.querySelector('.navigation').setAttribute('aria-label',locale==='uk'?'Головна навігація':'Main navigation');labels();
 }));
 function measure(){
   const enabled=ready && (!media.matches || hero.classList.contains('motion-opt-in'));
   sequence.classList.toggle('is-scrollable',enabled);
   scrollRange=enabled?innerHeight*(innerWidth<=700?1.15:1.75):0;
   sequence.style.height=enabled?(hero.offsetHeight+scrollRange)+'px':'auto';
   if(!enabled){target=current=0;}
   resize();onScroll();
 }
 function onScroll(){
   if(!ready)return;
   const r=sequence.getBoundingClientRect();
   target=scrollRange?clamp(-r.top/scrollRange):0;
   start();
 }
 function visible(){return inView&&!document.hidden;}
 function start(){if(!raf&&ready&&motion&&visible())raf=requestAnimationFrame(tick);}
 function syncMotion(){
   labels();cancelAnimationFrame(raf);raf=0;last=0;lastDraw=0;
   hero.classList.toggle('is-hidden',!visible());start();
 }
 toggle.addEventListener('click',()=>{
   motion=!motion;hero.classList.toggle('motion-opt-in',motion&&media.matches);
   if(media.matches)measure();syncMotion();
 });
 media.addEventListener('change',e=>{motion=!e.matches;hero.classList.remove('motion-opt-in');measure();syncMotion();});
 document.addEventListener('visibilitychange',syncMotion);
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncMotion();},{threshold:0}).observe(hero);
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',measure);
 document.querySelector('#skip-animation').addEventListener('click',()=>{
   if(!scrollRange)return;
   current=target=1;draw();
   window.scrollTo({top:window.scrollY+sequence.getBoundingClientRect().top+scrollRange,behavior:'instant'});
 });
 const vertex=`attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
 const fragment=`
 precision highp float;
 varying vec2 vUv;
 uniform sampler2D uOriginal,uPlate,uWoman;
 uniform vec2 uResolution,uImageSize;
 uniform vec4 uWomanBox,uWomanCrop;
 uniform float uTime,uProgress,uApproach,uPositionX;
 vec4 figure(vec2 q){
   if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);
   vec2 tex=uWomanCrop.xy+q*uWomanCrop.zw;
   vec4 c=texture2D(uWoman,tex);
   // The prepared green screen is keyed at render time, including soft hair and halo edges.
   float excess=c.g-max(c.r,c.b);
   float alpha=clamp(1.-excess,0.,1.);
   alpha=smoothstep(.035,.995,alpha);
   vec3 keyed=(c.rgb-vec3(0.,1.,0.)*(1.-alpha))/max(alpha,.01);
   keyed.g=min(keyed.g,keyed.r*.78+keyed.b*.22);
   return vec4(clamp(keyed,0.,1.),alpha*c.a);
 }
 void main(){
   float aspect=uResolution.x/uResolution.y;
   float ir=uImageSize.x/uImageSize.y;
   vec2 fit=vec2(1.);
   if(aspect<ir)fit.x=aspect/ir;else fit.y=ir/aspect;
   vec2 uv=vec2((vUv.x-.5)*fit.x+.5+(uPositionX-.5)*(1.-fit.x),(vUv.y-.5)*fit.y+.5);
   float blend=smoothstep(.0,.075,uProgress);
   float camera=1.+.025*uApproach;
   vec2 bgUv=(uv-vec2(.62,.27))/camera+vec2(.62,.27);
   float water=1.-smoothstep(.23,.267,bgUv.y);
   float depth=clamp((.267-bgUv.y)/.267,0.,1.);
   vec2 foot=vec2(uWomanBox.x+uWomanBox.z*.50,uWomanBox.y);
   // Ripples live in the water plane: elliptical, strongest near the moving contact point.
   vec2 local=(vUv-foot)*vec2(aspect,5.8);
   float d=length(local);
   float spread=uWomanBox.w*.46;
   float ringEnvelope=exp(-d/(spread+.015))*smoothstep(.008,.035,d);
   float phase=d/(spread+.01)*24.-uTime*1.15;
   float rings=sin(phase)*ringEnvelope;
   float nearWater=water;
   vec2 trail=(vUv-foot-vec2(-.007,.022*uApproach))*vec2(aspect,6.6);
   float td=length(trail);
   float trailing=sin(td/(spread+.016)*21.-uTime*.94)*exp(-td/(spread*.78+.01));
   float wake=(rings*.8+trailing*.2*uApproach)*nearWater*blend;
   vec2 sampleUv=bgUv;
   sampleUv.x+=water*(.00035+.0014*depth)*sin(bgUv.y*390.+uTime*.9+sin(bgUv.x*22.+uTime*.19));
   sampleUv.y+=water*.00045*sin(bgUv.x*80.+bgUv.y*420.-uTime*.75);
   sampleUv.x+=wake*.0015*sin(phase*.48);
   sampleUv.y+=wake*.0012;
   // Atmospheric change is soft and low-amplitude. Star chart lines remain fixed.
   float cloud=smoothstep(.29,.40,bgUv.y)*(1.-smoothstep(.62,.73,bgUv.y));
   sampleUv.x+=cloud*.0007*sin(bgUv.y*10.+uTime*.14);
   vec3 base=texture2D(uPlate,clamp(sampleUv,.001,.999)).rgb;
   vec3 inputImage=texture2D(uOriginal,clamp(uv,.001,.999)).rgb;
   // Reflection samples the same moving figure, then breaks it through flowing water.
   float below=(foot.y-vUv.y)/(uWomanBox.w*.72);
   vec2 rq=vec2((vUv.x-uWomanBox.x)/uWomanBox.z,below);
   rq.x+=(.006+.028*max(below,0.))*sin(vUv.y*530.+uTime*1.2+vUv.x*12.);
   rq.x+=.01*sin(vUv.y*930.-uTime*.7);
   rq.y+=.006*sin(vUv.y*200.+vUv.x*40.+uTime*.6);
   vec4 reflection=figure(rq);
   float reflectionAlpha=reflection.a*.52*exp(-max(below,0.)*2.1)*smoothstep(0.,.014,below)*(1.-smoothstep(.68,1.,below));
   reflectionAlpha*=1.-smoothstep(foot.y-.0001,foot.y+.001,vUv.y);
   vec3 reflectedColor=mix(reflection.rgb,vec3(.08,.13,.5),.34);
   base=mix(base,reflectedColor,reflectionAlpha);
   // A broad low contrast wake changes the water itself, with thin moonlit crests.
   base+=vec3(.65,.74,1.)*wake*.045;
   float gleam=pow(max(0.,cos(phase)),16.)*ringEnvelope*nearWater*blend;
   base+=vec3(.65,.73,1.)*gleam*.15;
   // Fabric moves by fractions of a pixel at the shoulder, more at loose hems.
   vec2 q=(vUv-uWomanBox.xy)/uWomanBox.zw;
   float hem=1.-smoothstep(.08,.67,q.y);
   float edge=abs(q.x-.53)*2.;
   q.x+=hem*.004*sin(q.y*12.+uTime*.7)*smoothstep(.04,.48,edge);
   q.x+=.0017*sin(uTime*.38+q.y*3.2)*smoothstep(.40,.86,q.y);
   vec4 fg=figure(q);
   // Feather the last few waterline pixels; avoid a hard flat cutout edge.
   float contact=smoothstep(-.004,.018,q.y+.002*sin(q.x*50.+uTime*.7));
   fg.a*=contact;
   fg.rgb=mix(fg.rgb,base,.035+.09*(1.-uApproach));
   base=mix(base,fg.rgb,fg.a);
   float drip=exp(-pow((q.x-.971)/.004,2.))*pow(max(0.,sin(q.y*95.+uTime*3.1)),14.);
   drip*=smoothstep(.01,.045,q.y)*(1.-smoothstep(.19,.255,q.y));
   base+=vec3(.6,.72,1.)*drip*.23;
   // The untouched user picture is the exact starting frame.
   gl_FragColor=vec4(mix(inputImage,base,blend),1.);
 }`;
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 function texture(img,unit,name){
   const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1i(uniforms[name],unit);
 }
 function resize(){
   if(!ready)return;
   const r=canvas.getBoundingClientRect();canvasWidth=r.width;canvasHeight=r.height;
   const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
   gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);draw();
 }
 function draw(){
   if(!ready)return;
   const mobile=innerWidth<=700;
   const imageRatio=original.naturalWidth/original.naturalHeight,viewportRatio=canvasWidth/canvasHeight;
   const fitX=Math.min(1,viewportRatio/imageRatio),fitY=Math.min(1,imageRatio/viewportRatio);
   const positionX=mobile?.63:.5;
   const approach=smooth(.08,.95,current);
   const perspective=1/(1-.66*approach);
   const imageOrigin=.5+(positionX-.5)*(1-fitX);
   const projectX=x=>(x-imageOrigin)/fitX+.5;
   const projectY=y=>(y-.5)/fitY+.5;
   // Original waterline: y=698, figure contact y=758.5, halo top y=530 on a 1672×941 image (real-Olivia sprite).
   const baseHeight=(228.5/941)/fitY;
   const maxHeight=mobile?.43:.73;
   const height=Math.min(baseHeight*perspective,maxHeight);
   const actualScale=height/baseHeight;
   const horizon=projectY(1-698/941);
   const baseFoot=projectY(1-758.5/941);
   const foot=horizon+(baseFoot-horizon)*actualScale;
   const originX=projectX(1060/1672);
   const centerX=originX+(mobile?.025:.06)*approach;
   const spriteAspect=foregroundBounds.aspect;
   const width=height*spriteAspect/viewportRatio;
   const left=centerX-width*.50;
   gl.uniform4f(uniforms.uWomanBox,left,foot,width,height);
   gl.uniform4f(uniforms.uWomanCrop,...foregroundBounds.uv);
   gl.uniform1f(uniforms.uTime,time);gl.uniform1f(uniforms.uProgress,current);gl.uniform1f(uniforms.uApproach,approach);gl.uniform1f(uniforms.uPositionX,positionX);
   gl.drawArrays(gl.TRIANGLES,0,6);
   hero.style.setProperty('--approach',approach.toFixed(4));
   progressBar.style.transform=`scaleX(${current})`;
   hero.dataset.progress=current.toFixed(4);hero.dataset.figureScale=actualScale.toFixed(3);
   hint.textContent=copy[locale][current>.96?'return':'scroll'];
 }
 function tick(now){
   raf=0;if(!motion||!ready||!visible())return;
   if(!last)last=now;
   const dt=Math.min((now-last)/1000,.06);last=now;time+=dt;
   current+=(target-current)*(1-Math.exp(-dt*6.5));
   if(Math.abs(target-current)<.0001)current=target;
   if(now-lastDraw>30){draw();lastDraw=now;}
   start();
 }
 function initialize(){
   if(ready)return;
   try{
     gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)return;
     program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Scene program link error');gl.useProgram(program);
     const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
     const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
     uniforms={};['uOriginal','uPlate','uWoman','uResolution','uImageSize','uWomanBox','uWomanCrop','uTime','uProgress','uApproach','uPositionX'].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
     texture(original,0,'uOriginal');texture(plate,1,'uPlate');texture(woman,2,'uWoman');gl.uniform2f(uniforms.uImageSize,original.naturalWidth,original.naturalHeight);
     ready=true;contextLost=false;canvas.classList.add('is-ready');hero.classList.add('scene-ready');measure();syncMotion();const dbg=location.hash.match(/p=([\d.]+)/);if(dbg){motion=false;current=target=Math.min(1,parseFloat(dbg[1]));time=6;draw();}
   }catch(error){console.warn('Olivia scene: static image fallback.',error);ready=false;canvas.classList.remove('is-ready');sequence.classList.remove('is-scrollable');sequence.style.height='auto';}
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;ready=false;cancelAnimationFrame(raf);raf=0;canvas.classList.remove('is-ready');hero.classList.remove('scene-ready');sequence.classList.remove('is-scrollable');sequence.style.height='auto';});
 canvas.addEventListener('webglcontextrestored',initialize);
 new ResizeObserver(resize).observe(canvas);
 labels();
 // decode() can hang forever on large data: URIs (and silently on hidden tabs) — never gate on it.
 const settled=img=>(img.complete&&img.naturalWidth)?Promise.resolve():new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});});
 Promise.all([original,plate,woman].map(settled)).then(()=>{
   Promise.race([Promise.all([original,plate,woman].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,800))]).then(initialize);
 });
})();
