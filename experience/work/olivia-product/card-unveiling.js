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

  // An opening begins at the actual touch. Two winding fissures travel away
  // from that point through the artwork, then open sideways like soft folds.
  // The contour is a branching aperture, never an expanding circular rim.
  vec2 contact = clamp(u_origin,vec2(.025),vec2(.975));
  vec2 fromContact = uv-contact;
  float along = fromContact.y;
  float stem = contact.x + sin(along*5.8)*.065;
  float branch = stem + sin(along*4.2)*.155;
  vec2 river = vec2(uv.x+sin(along*5.8)*.08,uv.y);
  float warp = silk(river*vec2(3.2,5.5)+contact*3.0);
  float tributaries = silk(vec2(river.x*8.0+warp*2.5,river.y*11.0));
  float away = smoothstep(0.0,.22,length(fromContact));
  float ivory = smoothstep(.23,.69,luminance(back.rgb));
  float transverse = min(abs(uv.x-stem),abs(uv.x-branch));
  transverse += ((warp-.5)*.065+(tributaries-.5)*.025-ivory*.018)*away;
  float longitudinal = abs(along) + (warp-.5)*.028*away;
  // Visible response starts immediately. The fissure travels before it widens,
  // leaving time to see the emerging scene rather than holding then rushing.
  float t = pow(u_progress,.88);
  float reach = (max(contact.y,1.0-contact.y)+.055)*min(1.0,t*2.3);
  float opening = (max(contact.x,1.0-contact.x)+.105)*pow(t,1.06);
  float distance = max(longitudinal-reach,transverse-opening);
  // Touch bows the existing fold toward the finger; there is no pointer halo.
  vec2 touchDistance = (uv-u_pointer)*vec2(1.35,1.0);
  float touchPull = exp(-dot(touchDistance,touchDistance)*7.5);
  float touchEnvelope = smoothstep(0.0,.10,u_progress)*(1.0-smoothstep(.90,1.0,u_progress));
  distance -= touchPull*.075*touchEnvelope;
  float aperture = 1.0 - smoothstep(-.014,.014,distance);
  float seam = gaussian(distance/.023);
  float thread = gaussian(distance/.0045);
  float envelope = smoothstep(.035,.15,u_progress) * (1.0-smoothstep(.85,.98,u_progress));
  seam *= envelope;
  thread *= envelope;

  // The last sliver of the back curls over the opening. Refraction stays at this
  // narrow moving fold; the illustration on either side remains perfectly still.
  vec2 curl = vec2(.013 * sin(uv.y*14.0 + warp*4.0), -.018);
  curl *= seam * (1.0 + clamp(length(u_pointer-.5),0.0,.7)*.16);
  vec4 foldedBack = texture2D(u_back,clamp(uv+curl,0.0,1.0));
  vec4 revealedFront = faceAt(clamp(uv-curl*.23,0.0,1.0));
  vec4 art = mix(foldedBack,revealedFront,aperture);
  // A thin dark lip lends the crossing physical depth. No blanket colour wash.
  float shadow = gaussian((distance+.024)/.026) * envelope;
  art.rgb *= 1.0 - shadow * .24;
  float carving = max(smoothstep(.25,.68,luminance(foldedBack.rgb)),
                      smoothstep(.25,.68,luminance(revealedFront.rgb)));
  vec3 ivoryLight = vec3(.97,.88,.68);
  vec3 sourceLight = min(mix(foldedBack.rgb,revealedFront.rgb,.50) * 1.45 + vec3(.08,.055,.025),vec3(1.0));
  vec3 rim = mix(sourceLight,ivoryLight,.54);
  // A hairline edge can cross velvet; the wider grazing light belongs only to
  // pale relief. This is finite light at the opening, never a glowing rectangle.
  art.rgb = mix(art.rgb,rim,thread*.66 + seam*carving*.17);
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
