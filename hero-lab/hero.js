(() => {
  'use strict';
  const track = document.getElementById('track');
  const hero = document.getElementById('main');
  const world = document.getElementById('world');
  const canvas = document.getElementById('water-canvas');
  const source = document.getElementById('scene-image');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');

  const copy = {
    en: {skip:'Skip to content',almanac:'The almanac',oracleNav:'The oracle',dailyNav:'The daily card',eyebrow:'A personal almanac',description:'Astrology and tarot, shaped by your birth chart and the question you bring.',ask:'Ask the oracle',daily:'Draw your daily card',trust:'Clarity first. No noise.',caption:'I. The moonlit sea',captionSub:'Between the known & the possible',caption2:'II. She draws near',captionSub2:'The oracle comes to meet you',footer:'Astrology & tarot, made personal',footerCenter:'A little stillness. A little clarity.',hint:'Descend',approach:'The approach',afterKicker:'She has arrived',afterTitle:'Now, ask.',afterNote:'The almanac opens below.',heading:'<span>Your stars,</span><span>translated</span><span><em>clearly.</em></span>'},
    uk: {skip:'Перейти до вмісту',almanac:'Альманах',oracleNav:'Оракул',dailyNav:'Карта дня',eyebrow:'Персональний альманах',description:'Астрологія й таро на основі вашої натальної карти та запитання, з яким ви прийшли.',ask:'Запитати Оракула',daily:'Витягнути карту дня',trust:'Спершу ясність. Без шуму.',caption:'I. Море під місяцем',captionSub:'Між відомим і можливим',caption2:'II. Вона наближається',captionSub2:'Оракул виходить назустріч',footer:'Астрологія й таро — особисто для вас',footerCenter:'Трохи тиші. Трохи ясності.',hint:'Спуск',approach:'Наближення',afterKicker:'Вона прийшла',afterTitle:'Тепер — питайте.',afterNote:'Альманах відкривається нижче.',heading:'<span>Ваші зірки —</span><span>людською</span><span><em>мовою.</em></span>'}
  };
  let locale = 'en';
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    locale = button.dataset.language;
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = copy[locale][el.dataset.i18n]; });
    document.getElementById('hero-title').innerHTML = copy[locale].heading;
    document.querySelectorAll('[data-language]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.language === locale)));
    document.querySelector('.navigation').setAttribute('aria-label', locale === 'uk' ? 'Головна навігація' : 'Main navigation');
    document.querySelector('.languages').setAttribute('aria-label', locale === 'uk' ? 'Мова' : 'Language');
    document.querySelector('.brand').setAttribute('aria-label', locale === 'uk' ? 'Olivia Arcana — головна' : 'Olivia Arcana — home');
  }));

  // ————————————————————————— The approach —————————————————————————
  // Three zones on the raw pin: a still breath, the approach, the arrival.
  const HOLD = 0.08, LAND = 0.85;
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const quintic = t => t * t * t * (t * (t * 6 - 15) + 10);        // slow start, slow settle
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  let actState = 0;
  const pose = { fx: 0, fy: 0, fz: 1, adv: 0 }; // read by the water shader for her wake
  function apply(p) {
    const t = clamp01((p - HOLD) / (LAND - HOLD));
    const s = quintic(t);                                          // the walk
    const arrive = smooth(LAND, 1, p);                             // the last beat
    const fz = (1 / (1 - 0.545 * s)) * (1 + arrive * 0.02);        // true dolly: accelerates like a real approach
    const glow = smooth(0.55, 1, p);                               // gilt blooms only in the final third
    // caption hysteresis — no flicker when the reader hovers at the threshold
    if (s > 0.52) actState = 1; else if (s < 0.46) actState = 0;
    pose.fx = s * 3.5; pose.fy = s * 3.2; pose.fz = fz; pose.adv = s;
    const st = track.style;
    st.setProperty('--raw', p.toFixed(4));
    st.setProperty('--adv', s.toFixed(4));
    st.setProperty('--wz', (1 + easeOutCubic(t) * 0.10).toFixed(4));
    st.setProperty('--fz', fz.toFixed(4));
    st.setProperty('--fx', (s * 3.5).toFixed(3));
    st.setProperty('--fy', (s * 3.2).toFixed(3));                  // her feet come down past the far waterline
    st.setProperty('--glow', glow.toFixed(4));
    st.setProperty('--mist', (1 - smooth(0.15, 0.65, p)).toFixed(4));
    st.setProperty('--act', actState);
  }

  // ————————————————— Living water (the ripples move) —————————————————
  // The scene plate is frozen above the horizon; below it, the sea breathes.
  // WebGL displaces only the water rows of the same image the page already shows.
  let gl, program, uniforms, ready = false, waterRaf = 0, last = 0, elapsed = 0, inView = true;
  const vertex = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform float uTime;
    uniform vec2 uFeet;   // where she stands, uv from bottom-left
    uniform float uReach; // her scale — the wake widens as she nears
    uniform float uWake;  // wake strength
    void main(){
      vec2 uv = vUv;
      // Horizon sits at y=600 of 941 → 0.3624 from the bottom. Above it: stone still.
      float water = 1. - smoothstep(.335, .3624, uv.y);
      float depth = clamp((.3624 - uv.y) / .3624, 0., 1.);
      float a = sin(uv.y*190. + uTime*1.05 + sin(uv.x*15. + uTime*.19));
      float b = sin(uv.y*360. - uTime*.8 + uv.x*21.);
      vec2 sampleUv = uv;
      sampleUv.x += water*(.0006+.0028*depth)*(a*.65 + b*.35);
      sampleUv.y += water*.0006*sin(uv.x*38. + uv.y*120. + uTime*.72)*depth;
      // Her wake: slow rings spreading from her hem, displacing the real sea
      vec2 d = vec2((uv.x - uFeet.x)*1.7769, uv.y - uFeet.y);
      float r = length(d);
      float ring = sin(r*70./uReach - uTime*1.9);
      float att = exp(-r/(.065*uReach)) * smoothstep(.004, .022, r);
      float wake = ring * att * uWake * water;
      sampleUv += normalize(vec2(uv.x - uFeet.x, uv.y - uFeet.y) + 1e-5) * wake * .0038;
      vec3 color = texture2D(uImage, clamp(sampleUv, .001, .999)).rgb;
      float glint = water*depth*.013*sin(uv.y*300. + sin(uv.x*30. + uTime*.16) - uTime*.66);
      color += vec3(glint*.7, glint*.8, glint);
      color += vec3(.55,.62,.85) * wake * .05 * depth;
      gl_FragColor = vec4(color, 1.);
    }`;
  function shader(type, code){
    const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ gl.deleteShader(s); throw new Error('water shader'); }
    return s;
  }
  function waterResize(){
    if(!ready) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    waterDraw();
  }
  function waterDraw(){
    if(!ready) return;
    gl.uniform1f(uniforms.uTime, elapsed);
    // her feet in bottom-up uv: crop anchor 64.29% / 80.98%, shifted by the drift
    gl.uniform2f(uniforms.uFeet, 0.6429 + (pose.fx/100)*0.19139, 1 - (0.8098 + (pose.fy/100)*0.3294));
    gl.uniform1f(uniforms.uReach, pose.fz);
    gl.uniform1f(uniforms.uWake, 0.5 + 0.5*pose.adv);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function waterTick(now){
    if(!inView || !ready || document.hidden) { waterRaf = 0; return; }
    if(!last) last = now;
    const delta = now - last;
    if(delta >= 32){ elapsed += Math.min(delta, 100) / 1000; last = now; waterDraw(); }
    waterRaf = requestAnimationFrame(waterTick);
  }
  function waterWake(){ if(ready && inView && !document.hidden && !waterRaf){ last = 0; waterRaf = requestAnimationFrame(waterTick); } }
  function waterInit(){
    if(ready || media.matches) return;
    try{
      gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, powerPreference:'low-power'});
      if(!gl) return;
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('water link');
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      uniforms = {}; ['uTime','uImage','uFeet','uReach','uWake'].forEach(n => uniforms[n] = gl.getUniformLocation(program, n));
      gl.uniform1i(uniforms.uImage, 0);
      ready = true; waterResize(); canvas.classList.add('is-ready'); waterWake();
    }catch(e){ ready = false; canvas.classList.remove('is-ready'); }
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; cancelAnimationFrame(waterRaf); waterRaf = 0; canvas.classList.remove('is-ready'); });
  canvas.addEventListener('webglcontextrestored', waterInit);
  new ResizeObserver(waterResize).observe(canvas);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; waterWake(); }, {threshold: 0}).observe(hero);
  document.addEventListener('visibilitychange', waterWake);
  if (source.complete && source.naturalWidth) waterInit(); else source.addEventListener('load', waterInit, {once: true});

  // ————————————————————— Scroll driver —————————————————————
  if (media.matches) { apply(0); return; } // reduced motion: still page, still water

  function rawProgress() {
    const rect = track.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    if (span <= 0) return 0;
    return clamp01(-rect.top / span);
  }
  // #p=0.6 freezes the act at that progress — screenshot harness only
  const dbg = location.hash.match(/p=([\d.]+)/);
  if (dbg) { apply(Math.min(1, parseFloat(dbg[1]))); return; }

  // Time-corrected exponential follower: the same grace at 60Hz and 120Hz.
  let current = rawProgress(), raf = 0, lastT = 0;
  const K = 3.2; // s⁻¹ → ~215ms half-life
  function frame(now) {
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
    const target = rawProgress();
    const delta = target - current;
    if (Math.abs(delta) < 0.0004) { current = target; apply(current); raf = 0; lastT = 0; return; }
    current += delta * (1 - Math.exp(-K * dt));
    apply(current);
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake);
  apply(current); wake();
})();
