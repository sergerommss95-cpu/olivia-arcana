(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('scene-canvas');
  const source = document.getElementById('scene-image');
  const toggle = document.getElementById('motion-toggle');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    en: {skip:'Skip to content',almanac:'The almanac',oracleNav:'The oracle',dailyNav:'Daily card',eyebrow:'A personal almanac',description:'Astrology and tarot, shaped by your birth chart and the question you bring.',ask:'Ask the oracle',daily:'Draw your daily card',trust:'Clarity first. No noise.',caption:'I. The sanctuary',captionSub:'Between the known & the possible',footer:'Astrology & tarot, made personal',footerCenter:'A little stillness. A little clarity.',pause:'Pause motion',play:'Play motion',heading:'<span>Your stars,</span><span>translated</span><span><em>clearly.</em></span>'},
    uk: {skip:'Перейти до вмісту',almanac:'Альманах',oracleNav:'Оракул',dailyNav:'Карта дня',eyebrow:'Персональний альманах',description:'Астрологія й таро на основі вашої натальної карти та запитання, з яким ви прийшли.',ask:'Запитати Оракула',daily:'Карта дня',trust:'Спершу ясність. Без шуму.',caption:'I. Святилище',captionSub:'Між відомим і можливим',footer:'Астрологія й таро — для вас',footerCenter:'Трохи тиші. Трохи ясності.',pause:'Зупинити рух',play:'Увімкнути рух',heading:'<span>Ваші зірки —</span><span>людською</span><span><em>мовою.</em></span>'}
  };
  let locale = 'en';
  // Reduced motion always starts still. The user can explicitly opt into motion.
  let motion = !media.matches, inView = true, raf = 0, last = 0, elapsed = 0;
  let gl, program, uniforms, ready = false;
  function renderLabels() {
    hero.classList.toggle('is-paused', !motion);
    toggle.setAttribute('aria-pressed', String(motion));
    document.getElementById('motion-label').textContent = copy[locale][motion ? 'pause' : 'play'];
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    locale = button.dataset.language;
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[locale][el.dataset.i18n]; });
    document.getElementById('hero-title').innerHTML = copy[locale].heading;
    document.querySelectorAll('[data-language]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.language === locale)));
    document.querySelector('.navigation').setAttribute('aria-label', locale === 'uk' ? 'Головна навігація' : 'Main navigation');
    document.querySelector('.languages').setAttribute('aria-label', locale === 'uk' ? 'Мова' : 'Language');
    document.querySelector('.brand').setAttribute('aria-label', locale === 'uk' ? 'Olivia Arcana — головна' : 'Olivia Arcana — home');
    renderLabels();
  }));
  function visible(){ return inView && !document.hidden; }
  function syncMotion(){
    renderLabels();
    cancelAnimationFrame(raf); raf = 0; last = 0;
    hero.classList.toggle('is-hidden', !visible());
    if(ready && motion && visible()) raf = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => {motion = !motion;hero.classList.toggle('motion-opt-in',motion && media.matches);syncMotion();});
  media.addEventListener('change', event => {motion = !event.matches;hero.classList.remove('motion-opt-in');syncMotion();});
  document.addEventListener('visibilitychange', syncMotion);
  new IntersectionObserver(entries => {inView = entries[0].isIntersecting;syncMotion();}, {threshold:0}).observe(hero);
  const vertex = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform vec2 uResolution;
    uniform vec2 uImageSize;
    uniform float uTime;
    uniform float uPositionX;
    void main(){
      float canvasRatio = uResolution.x/uResolution.y;
      float imageRatio = uImageSize.x/uImageSize.y;
      vec2 fit = vec2(1.);
      if(canvasRatio < imageRatio) fit.x = canvasRatio/imageRatio;
      else fit.y = imageRatio/canvasRatio;
      vec2 uv = vec2((vUv.x-.5)*fit.x+.5+(uPositionX-.5)*(1.-fit.x),(vUv.y-.5)*fit.y+.5);
      vec2 sampleUv = uv;
      // The real shoreline is y=.29 from the bottom. Freeze it; animate only water below.
      float water = 1.-smoothstep(.235,.29,uv.y);
      float depth = clamp((.29-uv.y)/.29,0.,1.);
      float a = sin(uv.y*215. + uTime*1.12 + sin(uv.x*18.+uTime*.21));
      float b = sin(uv.y*390. - uTime*.85 + uv.x*23.);
      sampleUv.x += water*(.0005+.0025*depth)*(a*.65+b*.35);
      sampleUv.y += water*.00055*sin(uv.x*42.+uv.y*110.+uTime*.78)*depth;
      // Soft cloud mask stays ABOVE the roof and excludes stone, shore and human.
      float cloud = smoothstep(.52,.63,uv.x)*(1.-smoothstep(.96,1.,uv.x))*smoothstep(.68,.74,uv.y)*(1.-smoothstep(.94,1.,uv.y));
      sampleUv.x += cloud*.0028*sin(uTime*.24 + uv.y*9.);
      sampleUv.y += cloud*.0018*sin(uTime*.18 + uv.x*12.);
      vec3 color = texture2D(uImage,clamp(sampleUv,.001,.999)).rgb;
      float glint = water*depth*.011*sin(uv.y*320. + sin(uv.x*34. + uTime*.17) - uTime*.7);
      color += vec3(glint*.7,glint*.8,glint);
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, code){
    const result = gl.createShader(type);gl.shaderSource(result,code);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){gl.deleteShader(result);throw new Error('Scene shader did not compile');}
    return result;
  }
  function resize(){
    if(!ready)return;
    const rect=canvas.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
    gl.uniform1f(uniforms.uPositionX,window.innerWidth<=700?.78:.5);
    draw();
  }
  function draw(){if(!ready)return;gl.uniform1f(uniforms.uTime,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);}
  function tick(now){
    if(!motion||!visible()||!ready)return;
    if(!last)last=now;
    const delta=now-last;
    // Cap at approximately 30fps: the scene is slow, not an interactive game.
    if(delta>=32){elapsed+=Math.min(delta,100)/1000;last=now;draw();}
    raf=requestAnimationFrame(tick);
  }
  function initialize(){
    if(ready)return;
    try{
      gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power',preserveDrawingBuffer:false});
      if(!gl)return;
      program=gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene program did not link');
      gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      uniforms={};['uTime','uResolution','uImageSize','uImage','uPositionX'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
      gl.uniform1i(uniforms.uImage,0);gl.uniform2f(uniforms.uImageSize,source.naturalWidth,source.naturalHeight);
      ready=true;resize();canvas.classList.add('is-ready');syncMotion();
    }catch(error){
      // The original picture and CSS mist are a complete fallback; content never depends on WebGL.
      ready=false;canvas.classList.remove('is-ready');
    }
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;cancelAnimationFrame(raf);canvas.classList.remove('is-ready');});
  canvas.addEventListener('webglcontextrestored',initialize);
  new ResizeObserver(resize).observe(canvas);
  renderLabels();
  if(source.complete && source.naturalWidth)initialize();else source.addEventListener('load',initialize,{once:true});
})();
