/* A finite transition between two real artworks. Neither source image is edited. */
const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position;
  gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_back;
uniform sampler2D u_front;
uniform float u_progress;
uniform float u_reversed;
uniform vec2 u_origin;
uniform vec2 u_pointer;
varying vec2 v_uv;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),
             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
}
float silk(vec2 p) {
  float f = .57 * noise(p);
  p = mat2(.80,.60,-.60,.80) * p * 2.12 + 7.3;
  f += .28 * noise(p);
  p = mat2(.80,.60,-.60,.80) * p * 2.08 + 3.7;
  return f + .15 * noise(p);
}
float luminance(vec3 c) { return dot(c,vec3(.299,.587,.114)); }
float gaussian(float x) { return exp(-(x*x)); }
vec4 faceAt(vec2 uv) {
  return texture2D(u_front, mix(uv, vec2(1.0)-uv, u_reversed));
}
void main() {
  vec2 uv = v_uv;
  vec4 back = texture2D(u_back,uv);
  vec4 front = faceAt(uv);
  // The first and final frames are the original artwork, with no light overlay.
  if (u_progress <= 0.0) { gl_FragColor = vec4(back.rgb*back.a,back.a); return; }
  if (u_progress >= 1.0) { gl_FragColor = vec4(front.rgb*front.a,front.a); return; }

  // A seam grows along the grain, then two unequal folds part. The tips taper
  // continuously: there are no horizontal caps or rectangular aperture corners.
  // Finish the material passage early enough to leave a quiet full-art hold.
  float t = min(1.0,u_progress/.88);
  vec2 contact = clamp(u_origin,vec2(.025),vec2(.975));
  float along = uv.y-contact.y;
  float opening = smoothstep(.045,1.0,t);
  float reach = .008 + 1.65*pow(t,.72);
  float tip = pow(max(0.0,1.0-(along/reach)*(along/reach)),.78);
  float release = smoothstep(.71,1.0,t);
  float life = smoothstep(0.0,.08,t)*(1.0-release);
  // The hand bends the broad fold itself; it never paints a spot onto the card.
  float hand = exp(-((uv.y-u_pointer.y)*(uv.y-u_pointer.y))*12.0);
  float pull = clamp(u_pointer.x-contact.x,-.45,.45)*hand*life;
  float stem = contact.x + sin(along*5.2)*.072*life + pull*.16;
  float leftWidth = (contact.x+.26)*pow(opening,1.62)*tip;
  float rightWidth = (1.0-contact.x+.26)*pow(opening,1.82)*tip;
  // A little extra fullness at opposite heights gives each side its own weight.
  leftWidth *= 1.0 + sin(along*4.6)*.12*life;
  rightWidth *= 1.0 - sin(along*5.4+.6)*.13*life;
  float left = stem-leftWidth;
  float right = stem+rightWidth;
  float side = uv.x<stem ? -1.0 : 1.0;
  float edge = uv.x<stem ? left : right;
  float distance = (uv.x-edge)*side;
  float material = silk(uv*vec2(4.0,7.0));
  // Microscopic grain belongs to the material, not to the silhouette.
  float grain = (material-.5)*.0025*life;
  distance += grain;
  float aperture = (1.0-smoothstep(-.0028,.0028,distance))*step(abs(along),reach);
  float foldWidth = (.014+.021*sin(t*3.14159265))*life;
  float fold = gaussian(distance/max(.001,foldWidth));
  float lip = gaussian((distance-.010)/max(.003,foldWidth*.52));
  float shadow = gaussian((distance+.023)/.029)*life;
  // Compression near the edge makes the actual carving turn away as a fold.
  // Outside that narrow band both illustrations retain their original detail.
  float gathered = (1.0-smoothstep(0.0,.28,max(0.0,distance)))*life;
  float tension = min(.12,opening*.25);
  vec2 displacement = vec2(side*tension,side*.006)*gathered;
  displacement += vec2(side*.016,0.0)*fold*life;
  vec2 backUV = clamp(uv-displacement,0.0,1.0);
  vec4 foldedBack = texture2D(u_back,backUV);
  float carving = smoothstep(.20,.73,luminance(foldedBack.rgb));
  foldedBack.rgb *= 1.0-.32*fold*life;
  foldedBack.rgb += foldedBack.rgb*lip*life*(.18+carving*.24);
  vec4 revealedFront = front;
  revealedFront.rgb *= 1.0-shadow*.29;
  vec4 art = mix(foldedBack,revealedFront,aperture);
  // Clear the final corner remnants and any shading before the still hold.
  art = mix(art,front,smoothstep(.93,1.0,t));
  gl_FragColor = vec4(art.rgb*art.a,art.a);
}`;

const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const noop = () => {};
const empty = () => ({reveal: async () => false,touch: noop,cancel: noop,destroy: noop});

/**
 * Render one 4.2 second material opening from `image` to the already-loaded
 * `front` image. A completed canvas stays in place until cancel(), allowing the
 * caller to replace its image/rotation first without flashing the old back.
 * `onStart` may return a promise (for the camera approach); it is awaited before
 * the reveal clock starts. A cancellation during that wait cannot restart it.
 */
export function mountCardUnveiling(container, {
  image = container?.querySelector('img'),
  reduced = false
} = {}) {
  if (!container || !image || image.parentElement !== container) return empty();
  const doc = container.ownerDocument, win = doc.defaultView;
  const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const canvas = doc.createElement('canvas');
  canvas.className = 'card-unveiling';
  canvas.setAttribute('aria-hidden','true');
  canvas.hidden = true;
  // Inline fundamentals keep an unavailable stylesheet from becoming a large
  // layout element. The dedicated stylesheet supplies motion/accessibility rules.
  Object.assign(canvas.style,{position:'absolute',pointerEvents:'none',zIndex:'3',margin:'0',maxWidth:'none'});
  const previousPosition = container.style.position;
  const positioned = win.getComputedStyle(container).position === 'static';
  if (positioned) container.style.position = 'relative';
  container.append(canvas);

  let gl = null, program = null, buffer = null, backTexture = null, frontTexture = null, uniforms = null;
  let failed = false, lost = false, destroyed = false, frame = 0, serial = 0, job = null;
  let pointer = [.46,.62], pointerTarget = [...pointer];
  const motionReduced = () => media?.matches || Boolean(typeof reduced === 'function' ? reduced() : reduced);
  const stop = () => { if (frame) win.cancelAnimationFrame(frame); frame = 0; };

  function cancel() {
    serial++;
    stop();
    canvas.hidden = true;
    if (job) {
      const resolve = job.resolve;
      job = null;
      resolve(false);
    }
  }
  function releaseGPU() {
    if (!gl || lost) return;
    if (backTexture) gl.deleteTexture(backTexture);
    if (frontTexture) gl.deleteTexture(frontTexture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    backTexture = frontTexture = buffer = program = uniforms = null;
  }
  function fail() { failed = true; cancel(); releaseGPU(); }
  function shader(type,source) {
    const result = gl.createShader(type);
    if (!result) throw new Error('Unveiling shader unavailable');
    gl.shaderSource(result,source); gl.compileShader(result);
    if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) {
      gl.deleteShader(result); throw new Error('Unveiling shader unavailable');
    }
    return result;
  }
  function texture(unit) {
    const result = gl.createTexture();
    if (!result) throw new Error('Unveiling texture unavailable');
    gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D,result);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    return result;
  }
  function createGPU() {
    if (gl && program) return true;
    if (failed || lost || destroyed) return false;
    let vertex = null, fragment = null;
    try {
      gl = canvas.getContext('webgl',{
        alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,
        preserveDrawingBuffer:false,powerPreference:'low-power'
      });
      if (!gl) return false;
      vertex = shader(gl.VERTEX_SHADER,VERTEX); fragment = shader(gl.FRAGMENT_SHADER,FRAGMENT);
      program = gl.createProgram();
      if (!program) throw new Error('Unveiling program unavailable');
      gl.attachShader(program,vertex); gl.attachShader(program,fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Unveiling program unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Unveiling buffer unavailable');
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program,'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      backTexture = texture(gl.TEXTURE0); frontTexture = texture(gl.TEXTURE1);
      uniforms = Object.fromEntries(['back','front','progress','reversed','origin','pointer'].map(name=>[name,gl.getUniformLocation(program,`u_${name}`)]));
      gl.uniform1i(uniforms.back,0); gl.uniform1i(uniforms.front,1);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      return true;
    } catch { fail(); return false; }
    finally {
      if (vertex) gl?.deleteShader(vertex);
      if (fragment) gl?.deleteShader(fragment);
    }
  }
  function fit() {
    const width = image.offsetWidth, height = image.offsetHeight;
    if (!width || !height) return false;
    const style = win.getComputedStyle(image);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    Object.assign(canvas.style,{
      left:`${image.offsetLeft}px`,top:`${image.offsetTop}px`,width:`${width}px`,height:`${height}px`,
      borderRadius:style.borderRadius,transform:style.transform,transformOrigin:style.transformOrigin,rotate:style.rotate
    });
    const scale = Math.min(win.devicePixelRatio || 1,2,900/width,1540/height);
    const w = Math.max(1,Math.round(width*scale)), h = Math.max(1,Math.round(height*scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
    return true;
  }
  function upload(source,target,unit) {
    // Small screens never upload a full print-resolution artwork to the GPU.
    const maximum = Math.min(1536,Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 1536);
    const ratio = Math.min(1,maximum/source.naturalWidth,maximum/source.naturalHeight);
    // Safari can corrupt a displayed/reused WebP when its decoded image surface
    // is uploaded directly. Copy both artworks to explicit, tightly packed RGBA
    // pixels, including images already below the size limit. This happens only
    // once per face, before animation; no pixel readback occurs during frames.
    const bitmap = doc.createElement('canvas');
    bitmap.width = Math.max(1,Math.round(source.naturalWidth*ratio));
    bitmap.height = Math.max(1,Math.round(source.naturalHeight*ratio));
    const context = bitmap.getContext('2d');
    if (!context) throw new Error('Unveiling artwork unavailable');
    context.drawImage(source,0,0,bitmap.width,bitmap.height);
    const pixels = context.getImageData(0,0,bitmap.width,bitmap.height);
    gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D,target);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bitmap.width,bitmap.height,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels.data);
    if (gl.getError() !== gl.NO_ERROR) throw new Error('Unveiling artwork unavailable');
  }
  function draw(progress) {
    if (!gl || !program || lost) return false;
    try {
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform1f(uniforms.progress,progress);
      gl.uniform2f(uniforms.pointer,pointer[0],pointer[1]);
      gl.drawArrays(gl.TRIANGLES,0,6);
      return true;
    } catch { fail(); return false; }
  }
  function schedule() {
    if (frame || !job?.started || doc.hidden || destroyed || lost) return;
    frame=win.requestAnimationFrame(tick);
  }
  function tick(time) {
    frame=0;
    const current=job;
    if (!current || destroyed || lost) return;
    if (motionReduced()) { cancel(); return; }
    if (doc.hidden) { current.lastTime=null; return; }
    const delta=current.lastTime===null?16:Math.max(0,time-current.lastTime);
    if (current.lastTime!==null) current.elapsed+=delta;
    current.lastTime=time;
    const follow=1-Math.exp(-Math.min(delta,80)/145);
    pointer[0]+=(pointerTarget[0]-pointer[0])*follow;
    pointer[1]+=(pointerTarget[1]-pointer[1])*follow;
    const progress=clamp(current.elapsed/current.duration,0,1);
    if (!draw(progress)) return;
    canvas.hidden=false;
    if (current.onProgress && (progress===1 || progress-current.lastReported>=.025)) {
      current.lastReported=progress;
      try { current.onProgress(progress); } catch { /* A display callback cannot break the artwork. */ }
    }
    if (job!==current) return;
    if (progress>=1) {
      job=null;
      current.resolve(true);
      return; // The final artwork remains, but there is no idle animation frame.
    }
    schedule();
  }
  function reveal({front,duration=4200,orientation='upright',onStart,onProgress}={}) {
    cancel();
    if (destroyed || failed || lost || motionReduced() || !front?.complete || !front.naturalWidth ||
        !front.naturalHeight || !image.complete || !image.naturalWidth || !image.naturalHeight) return Promise.resolve(false);
    if (!fit() || !createGPU()) return Promise.resolve(false);
    const token=serial;
    try {
      upload(image,backTexture,gl.TEXTURE0); upload(front,frontTexture,gl.TEXTURE1);
      gl.uniform1f(uniforms.reversed,orientation==='reversed'?1:0);
      pointer=[...pointerTarget];
      gl.uniform2f(uniforms.origin,pointer[0],pointer[1]);
      if (!draw(0)) return Promise.resolve(false);
    } catch { fail(); return Promise.resolve(false); }
    canvas.hidden=false;
    return new Promise(resolve=>{
      const current={resolve,duration:clamp(Number(duration)||4200,800,12000),elapsed:0,lastTime:null,lastReported:0,
        onProgress,started:false,backURL:image.currentSrc||image.src};
      job=current;
      // The camera approaches an intact card. Only then does its surface open.
      Promise.resolve().then(()=>{
        if (token!==serial || job!==current || destroyed) return;
        return onStart?.();
      }).then(()=>{
        if (token!==serial || job!==current || destroyed) return;
        if (motionReduced()) { cancel(); return; }
        current.started=true;
        schedule();
      }).catch(()=>{ if (job===current) cancel(); });
    });
  }
  function touch(x,y) {
    if (Number.isFinite(x) && Number.isFinite(y)) pointerTarget=[clamp(x,0,1),clamp(y,0,1)];
  }
  function visibility() {
    if (!job) return;
    stop(); job.lastTime=null;
    if (!doc.hidden) schedule();
  }
  function changedMotion() { if (motionReduced()) cancel(); }
  function changedImage() {
    if (job && (image.currentSrc||image.src)!==job.backURL) cancel();
  }
  function lostContext(event) { event.preventDefault(); lost=true; cancel(); }
  function restoredContext() {
    // Re-create lazily for a later turn; a cancelled reveal never resumes itself.
    gl=program=buffer=backTexture=frontTexture=uniforms=null;
    lost=false; failed=false;
  }
  const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>{
    if (!job) return;
    if (!fit()) { cancel(); return; }
    draw(clamp(job.elapsed/job.duration,0,1));
  }):null;
  resize?.observe(image);
  doc.addEventListener('visibilitychange',visibility);
  image.addEventListener('load',changedImage);
  canvas.addEventListener('webglcontextlost',lostContext);
  canvas.addEventListener('webglcontextrestored',restoredContext);
  media?.addEventListener?.('change',changedMotion);
  function destroy() {
    if (destroyed) return;
    cancel(); destroyed=true;
    resize?.disconnect();
    doc.removeEventListener('visibilitychange',visibility);
    image.removeEventListener('load',changedImage);
    canvas.removeEventListener('webglcontextlost',lostContext);
    canvas.removeEventListener('webglcontextrestored',restoredContext);
    media?.removeEventListener?.('change',changedMotion);
    releaseGPU();
    canvas.remove();
    if (positioned) container.style.position=previousPosition;
  }
  return {reveal,touch,cancel,destroy};
}
