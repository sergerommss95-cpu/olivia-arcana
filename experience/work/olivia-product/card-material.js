/*
 * Light belongs to the carved artwork, rather than to a pane over the card.
 * The original image stays visible. This canvas contains transparent light and
 * shadow only: no resampling, displacement, colour replacement or idle motion.
 */
const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position;
  gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D u_art;
uniform vec2 u_texel;
uniform vec2 u_pointer;
uniform float u_velvet;
uniform float u_strength;
uniform float u_awaken;
varying vec2 v_uv;
float luminance(vec3 c) { return dot(c, vec3(.299, .587, .114)); }
float heightAt(vec2 uv) {
  // Read the broader carving. Fine velvet grain is colour, not metallic relief.
  vec2 d = u_texel * 2.6;
  float h = luminance(texture2D(u_art, uv).rgb) * .40;
  h += luminance(texture2D(u_art, uv + vec2(d.x, 0.0)).rgb) * .15;
  h += luminance(texture2D(u_art, uv - vec2(d.x, 0.0)).rgb) * .15;
  h += luminance(texture2D(u_art, uv + vec2(0.0, d.y)).rgb) * .15;
  h += luminance(texture2D(u_art, uv - vec2(0.0, d.y)).rgb) * .15;
  return h;
}
void main() {
  vec2 uv = v_uv;
  vec4 source = texture2D(u_art, uv);
  vec3 c = source.rgb;
  float lum = luminance(c);
  float warm = smoothstep(-.018, .065, c.r - c.b);
  float carving = smoothstep(.25, .64, lum) * warm;
  float metal = smoothstep(.075, .20, c.r - c.b) * smoothstep(.012, .09, c.r - c.g);
  metal *= smoothstep(.18, .38, lum) * (1.0 - smoothstep(.68, .88, lum));
  vec2 d = u_texel * 4.0;
  vec2 slope = vec2(heightAt(uv - vec2(d.x,0.0)) - heightAt(uv + vec2(d.x,0.0)),
                    heightAt(uv - vec2(0.0,d.y)) - heightAt(uv + vec2(0.0,d.y)));
  vec3 normal = normalize(vec3(slope * 1.25, 1.0));
  vec3 lamp = normalize(vec3((u_pointer - .5) * vec2(1.3,1.0), .95));
  vec3 halfLight = normalize(lamp + vec3(0.0,0.0,1.0));
  float carvingLight = dot(normal,lamp) - lamp.z;
  float softSpecular = pow(max(dot(normal,halfLight),0.0),12.0) - pow(halfLight.z,12.0);
  float material = max(carving, metal * .8);
  float response = (carvingLight * .28 + softSpecular * .045) * material;
  // One warm sweep crosses the actual pale carving, leaving velvet unlit.
  // The dark spaces between leaves stay dark: there is no luminous rectangle.
  float sweepAt = mix(-.18, 1.42, clamp(u_awaken,0.0,1.0));
  float sweepDistance = (uv.y + uv.x * .20 - sweepAt) / .095;
  float sweep = exp(-sweepDistance * sweepDistance);
  float envelope = smoothstep(0.0,.12,u_awaken) * (1.0-smoothstep(.86,1.0,u_awaken));
  response += sweep * envelope * (.34 * carving + .40 * metal);
  response *= mix(1.0,.85,u_velvet);
  // Keep the original colour. Even the strongest glint cannot bleach the card.
  float positive = clamp(response,0.0,.32);
  float negative = clamp(-response,0.0,.055);
  float opacity = (positive + negative) * u_strength * source.a;
  vec3 light = min(c * 1.32 + vec3(.09,.075,.045) * material, vec3(1.0));
  vec3 shade = c * .38;
  vec3 colour = response >= 0.0 ? light : shade;
  // Explicit premultiplication keeps compositing consistent through 3D transforms.
  gl_FragColor = vec4(colour * opacity, opacity);
}`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const valueOf = value => typeof value === 'function' ? value() : value;
const noop = () => {};

/**
 * Mount on the artwork's immediate wrapper, without taking over its transform.
 * `image` is the original HTMLImageElement; `getDeckId` returns a stable deck ID.
 * `reduced` / `enabled` accept a boolean or a function. `setActive` is a lifecycle
 * gate, not a hover trigger. `touch(x,y,active)` uses normalised card coordinates.
 * Call refresh after changing artwork/deck; image loads and resizes also refresh.
 */
export function mountCardMaterial(container, {
  image = container?.querySelector('img'),
  getDeckId = () => 'olivia',
  reduced = false,
  enabled = true
} = {}) {
  if (!container || !image || image.parentElement !== container) {
    return {refresh: noop, setActive: noop, touch: noop, awaken: noop, destroy: noop};
  }
  const doc = container.ownerDocument;
  const win = doc.defaultView;
  const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const canvas = doc.createElement('canvas');
  canvas.className = 'card-material-light';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  const addedHostClass = !container.classList.contains('card-material-host');
  const previousPosition = container.style.position;
  const positioned = win.getComputedStyle(container).position === 'static';
  if (positioned) container.style.position = 'relative';
  container.classList.add('card-material-host');
  container.append(canvas);

  let gl = null, program = null, buffer = null, texture = null, uniforms = null;
  let destroyed = false, failed = false, lost = false, ready = false, active = true;
  let intersecting = true, pointerInside = false, generation = 0, frame = 0, lastTime = 0;
  let currentSource = '', requestedSource = '', uploadedSource = '', blockedSource = '', pendingImage = null;
  let deck = 0, strength = 0, x = .5, y = .5, tx = .5, ty = .5;
  let imageWidth = 0, imageHeight = 0, awakening = false, awakenStart = 0, awakenProgress = -1;

  const allowed = () => !destroyed && !failed && !lost && active && !doc.hidden &&
    intersecting && !media?.matches && !valueOf(reduced) && valueOf(enabled) !== false;
  const sourceURL = () => image.currentSrc || image.src || '';
  const stopFrame = () => { if (frame) win.cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
  const hide = () => { stopFrame(); strength = 0; awakening = false; awakenStart = 0; awakenProgress = -1; canvas.hidden = true; };
  function cancelPending() {
    if (!pendingImage) return;
    pendingImage.onload = pendingImage.onerror = null;
    pendingImage.removeAttribute('src');
    pendingImage = null;
  }
  function releaseGPU() {
    if (!gl || lost) return;
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    texture = buffer = program = uniforms = null;
  }
  function fail() {
    failed = true; ready = false; generation++; cancelPending(); hide(); releaseGPU();
  }
  function shader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('No shader');
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader); throw new Error('Material shader unavailable');
    }
    return shader;
  }
  function createGPU() {
    if (gl && program) return true;
    if (failed || lost || destroyed) return false;
    let vertex = null, fragment = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: true, antialias: false,
        depth: false, stencil: false, preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });
      if (!gl) { fail(); return false; }
      vertex = shader(gl.VERTEX_SHADER, VERTEX);
      fragment = shader(gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!program) throw new Error('No material program');
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('No material program');
      gl.useProgram(program);
      buffer = gl.createBuffer(); texture = gl.createTexture();
      if (!buffer || !texture) throw new Error('No material resources');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      uniforms = Object.fromEntries(['art','texel','pointer','velvet','strength','awaken'].map(name => [name, gl.getUniformLocation(program, `u_${name}`)]));
      gl.uniform1i(uniforms.art, 0);
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
    if (!width || !height) { hide(); return false; }
    const style = win.getComputedStyle(image);
    if (style.visibility === 'hidden' || style.display === 'none') { hide(); return false; }
    canvas.style.left = `${image.offsetLeft}px`; canvas.style.top = `${image.offsetTop}px`;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    canvas.style.borderRadius = style.borderRadius;
    canvas.style.rotate = style.rotate;
    canvas.style.transform = style.transform;
    canvas.style.transformOrigin = style.transformOrigin;
    // A bounded surface, independent of device pixel ratio or the hero renderer.
    const scale = Math.min(2, 560 / width, 960 / height);
    const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    imageWidth = width; imageHeight = height;
    return true;
  }
  function draw() {
    if (!ready || !gl || !program || !allowed()) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, x, y);
    gl.uniform1f(uniforms.velvet, deck);
    gl.uniform1f(uniforms.strength, strength);
    gl.uniform1f(uniforms.awaken, awakenProgress);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    canvas.hidden = strength < .001;
  }
  function tick(time) {
    frame = 0;
    if (!allowed() || !ready) { hide(); return; }
    const dt = lastTime ? Math.min(48, time - lastTime) : 16;
    lastTime = time;
    if (awakening) {
      if (!awakenStart) awakenStart = time;
      awakenProgress = Math.min(1, (time - awakenStart) / 3200);
      if (awakenProgress >= 1) awakening = false;
    }
    const target = pointerInside || awakening ? 1 : 0;
    const follow = 1 - Math.exp(-dt / 130), fade = 1 - Math.exp(-dt / (target ? 190 : 260));
    x += (tx - x) * follow; y += (ty - y) * follow;
    strength += (target - strength) * fade;
    const moving = Math.abs(tx - x) + Math.abs(ty - y) > .0008;
    const fading = Math.abs(target - strength) > .002;
    if (!moving && !fading) { x = tx; y = ty; strength = target; }
    draw();
    if (moving || fading || awakening) frame = win.requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function schedule() {
    if (frame || !ready || !allowed()) return;
    frame = win.requestAnimationFrame(tick);
  }
  function upload(source, url, token) {
    if (destroyed || token !== generation || url !== requestedSource || !allowed()) return;
    try {
      if (!createGPU()) return;
      // Upload a bounded copy only for calculating light. The visible art remains
      // the untouched, full-resolution HTML image. A tainted copy fails closed.
      const width = source.naturalWidth, height = source.naturalHeight;
      if (!width || !height) return;
      const scale = Math.min(1, 768 / width, 1317 / height);
      const map = doc.createElement('canvas');
      map.width = Math.max(1, Math.round(width * scale)); map.height = Math.max(1, Math.round(height * scale));
      const context = map.getContext('2d');
      if (!context) { fail(); return; }
      context.drawImage(source, 0, 0, map.width, map.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map);
      if (gl.getError() !== gl.NO_ERROR) { fail(); return; }
      gl.uniform2f(uniforms.texel, 1 / map.width, 1 / map.height);
      uploadedSource = url; ready = true;
      if (fit()) schedule();
    } catch (error) {
      if (error?.name === 'SecurityError') { blockedSource = url; ready = false; hide(); }
      else fail();
    }
  }
  function loadTexture(url) {
    const token = generation;
    let sameOrigin = false;
    try {
      const parsed = new URL(url, doc.baseURI);
      sameOrigin = parsed.origin === win.location.origin || ['data:', 'blob:', 'file:'].includes(parsed.protocol);
    } catch { return; }
    // Never change crossOrigin on the visible image or issue an opaque fetch.
    // Remote images are retried anonymously; servers without CORS keep the art.
    if (sameOrigin && image.complete && image.naturalWidth) { upload(image, url, token); return; }
    pendingImage = new win.Image();
    const copy = pendingImage;
    if (!sameOrigin) copy.crossOrigin = 'anonymous';
    copy.onload = () => {
      if (copy !== pendingImage) return;
      pendingImage = null;
      copy.onload = copy.onerror = null;
      upload(copy, url, token);
    };
    copy.onerror = () => {
      if (copy !== pendingImage) return;
      pendingImage = null; copy.onload = copy.onerror = null;
      blockedSource = url; ready = false; hide();
    };
    copy.src = url;
  }
  function refresh() {
    if (destroyed) return;
    const url = sourceURL();
    deck = ['space-between', 'amielle'].includes(getDeckId?.()) ? 1 : 0;
    if (url !== currentSource) {
      currentSource = url; requestedSource = ''; uploadedSource = ''; blockedSource = '';
      generation++; cancelPending(); ready = false; hide();
    }
    if (!allowed() || !url) { hide(); return; }
    if (!fit()) return;
    if (url === blockedSource) return;
    if (url === uploadedSource && gl && program) { ready = true; schedule(); return; }
    if (url === requestedSource && pendingImage) return;
    requestedSource = url;
    loadTexture(url);
  }
  function touch(nextX, nextY, pressed = true) {
    if (destroyed) return;
    pointerInside = !!pressed;
    if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
      tx = clamp(nextX, 0, 1); ty = clamp(nextY, 0, 1);
    }
    if (!allowed()) { hide(); return; }
    if (!ready) refresh();
    schedule();
  }
  function pointer(event) {
    if (event.isPrimary === false) return;
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let px = (event.clientX - rect.left) / rect.width, py = (event.clientY - rect.top) / rect.height;
    // The card wrapper may be tilted; getBoxQuads is used where supported.
    // The regular DOMRect remains a stable approximation on other browsers.
    const corners = image.getBoxQuads?.()[0];
    if (corners) {
      const ax = corners.p2.x - corners.p1.x, ay = corners.p2.y - corners.p1.y;
      const bx = corners.p4.x - corners.p1.x, by = corners.p4.y - corners.p1.y;
      const det = ax * by - ay * bx;
      if (Math.abs(det) > .001) {
        const dx = event.clientX - corners.p1.x, dy = event.clientY - corners.p1.y;
        px = (dx * by - dy * bx) / det; py = (dy * ax - dx * ay) / det;
      }
    } else if (canvas.style.rotate === '180deg') { px = 1 - px; py = 1 - py; }
    touch(px, py, true);
  }
  const leave = () => touch(tx, ty, false);
  const up = event => { if (event.pointerType !== 'mouse') leave(); };
  const visibility = () => { if (doc.hidden) { pointerInside = false; hide(); } else refresh(); };
  const preference = () => { pointerInside = false; refresh(); };
  const contextLost = event => {
    event.preventDefault(); lost = true; ready = false; generation++; cancelPending();
    uploadedSource = requestedSource = ''; hide();
  };
  const contextRestored = () => {
    lost = false; gl = program = texture = buffer = uniforms = null;
    failed = false; refresh();
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  container.addEventListener('pointerenter', pointer, {passive: true});
  container.addEventListener('pointermove', pointer, {passive: true});
  container.addEventListener('pointerdown', pointer, {passive: true});
  container.addEventListener('pointerleave', leave, {passive: true});
  container.addEventListener('pointercancel', leave, {passive: true});
  container.addEventListener('pointerup', up, {passive: true});
  image.addEventListener('load', refresh);
  image.addEventListener('error', leave);
  doc.addEventListener('visibilitychange', visibility);
  media?.addEventListener?.('change', preference);
  const resize = win.ResizeObserver ? new win.ResizeObserver(() => {
    if (image.offsetWidth !== imageWidth || image.offsetHeight !== imageHeight) refresh();
  }) : null;
  resize?.observe(image);
  const mutation = win.MutationObserver ? new win.MutationObserver(refresh) : null;
  mutation?.observe(image, {attributes: true, attributeFilter: ['src', 'srcset', 'sizes', 'style', 'class', 'data-orientation']});
  const intersection = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    intersecting = entries[0]?.isIntersecting !== false;
    if (intersecting) refresh(); else { pointerInside = false; hide(); }
  }, {rootMargin: '40px'}) : null;
  intersection?.observe(container);
  refresh();

  return {
    refresh,
    touch,
    awaken() {
      if (!allowed()) return;
      if (!ready) refresh();
      awakening = true; awakenStart = 0; awakenProgress = 0;
      schedule();
    },
    setActive(next) {
      active = !!next;
      if (!active) { pointerInside = false; generation++; cancelPending(); hide(); }
      else refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; generation++; cancelPending(); hide();
      resize?.disconnect(); mutation?.disconnect(); intersection?.disconnect();
      container.removeEventListener('pointerenter', pointer);
      container.removeEventListener('pointermove', pointer);
      container.removeEventListener('pointerdown', pointer);
      container.removeEventListener('pointerleave', leave);
      container.removeEventListener('pointercancel', leave);
      container.removeEventListener('pointerup', up);
      image.removeEventListener('load', refresh); image.removeEventListener('error', leave);
      doc.removeEventListener('visibilitychange', visibility);
      media?.removeEventListener?.('change', preference);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      releaseGPU();
      // Release the context too; route changes must not exhaust Safari's limit.
      try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* Already lost. */ }
      gl = null; canvas.remove();
      if (addedHostClass) container.classList.remove('card-material-host');
      if (positioned && container.style.position === 'relative') container.style.position = previousPosition;
    }
  };
}
