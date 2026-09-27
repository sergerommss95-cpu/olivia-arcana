# V11 optional card-to-card shadow pass

`lighting.inc.js` is a bounded renderer add-on. Paste its source inside the existing hero IIFE **after** `lookAt`/`mul` have been declared. It uses existing `gl`, `program`, `buf`, `indexBuf`, `meshCount`, `canvas`, `mobile`, `back` and `diagnostics`. No other files are changed by this subtask.

## Lifecycle and main-pass bindings

1. Call `initializeShadows()` after the main mesh, attribute pointers and textures are ready. Failure returns `false`; do **not** throw or change `ready`/fallback state. It compiles/allocates at most one additional program, RGBA texture, DEPTH_COMPONENT16 renderbuffer and framebuffer. It restores all initialization bindings it changes.
2. Add these main-program locations to `loc`: `uLightVP`, `uShadowMap`, `uShadowEnabled`, `uShadowTexel`, `uKeyPosition`.
3. Add `disposeShadows()` to the beginning of the existing `dispose()` while `gl` is still valid. Reinitialization disposes the previous shadow resources automatically. Never bind an old map after context restoration.
4. Compute world layers from `ribbon(progress)` + `sceneFrame(progress)` before filtering by the camera; pass **all** world layers to `renderShadows(worldLayers)` before the main draw loop. Off-camera cards may cast visible shadows. The current renderer is the only owner of GL state; renderShadows restores its main pass to null framebuffer, canvas viewport, main program/mesh, LEQUAL depth, depth/color writes on, blending/culling/scissor/polygon-offset off, transparent clear color. It does not alter vertex attribute pointers or texture bindings/active unit. Both programs explicitly use the same attribute locations.
5. Main pass clear can happen immediately **after** `renderShadows` or before it (its framebuffer is separate). Bind main uniforms after the shadow call:

```js
const shadow=shadowBindings();
gl.uniformMatrix4fv(loc.uLightVP,false,shadow.vp);
gl.uniform1i(loc.uShadowMap,3);
gl.uniform1f(loc.uShadowEnabled,shadow.enabled);
gl.uniform1f(loc.uShadowTexel,shadow.texel);
gl.uniform3f(loc.uKeyPosition,...shadow.key);
gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D,shadow.texture);
// Continue normal per-card drawing on texture unit 1.
```

The 512/1024 choice is made at initialization, matching the existing detail-texture mobile decision. A resize does not allocate resources on the animation path. Include `shadow.size`, `shadow.drawCalls`, and `diagnostics.shadowFailure` in diagnostics if useful. At 1024 the extra GPU allocations total about 6 MiB; at 512 about 1.5 MiB. No mipmaps/post-processing/particles.

## Vertex shader additions

Declare:

```glsl
uniform mat4 uLightVP;
varying vec4 vLightClip;
```

Immediately after computing the existing `vec4 world`:

```glsl
vLightClip=uLightVP*world;
```

Current cards are rigid: `uBend=uTwist=0`. The shadow program exactly matches that geometry, the same perimeter mesh and the same rounded silhouette discard. If nonzero bending is introduced later, the shadow vertex stage needs the same deformation before `uModel`.

## Fragment shader additions

Prefer this precision declaration (the map is disabled gracefully on devices without useful fragment high precision):

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
```

Declare below the existing varyings/uniforms:

```glsl
varying vec4 vLightClip;
uniform sampler2D uShadowMap;
uniform float uShadowEnabled,uShadowTexel;
uniform vec3 uKeyPosition;
float shadowDepth(vec2 uv){
 return dot(texture2D(uShadowMap,uv),vec4(.000000059604644775390625,.0000152587890625,.00390625,1.));
}
float cardVisibility(vec3 normal,vec3 lightDirection){
 if(uShadowEnabled<.5)return 1.;
 vec3 c=vLightClip.xyz/vLightClip.w*.5+.5;
 if(c.x<=.002||c.x>=.998||c.y<=.002||c.y>=.998||c.z<=0.||c.z>=1.)return 1.;
 // The light spans 60 world units in depth: this is a 0.027–0.099
 // world-unit slope-aware offset. abs(dot) handles the two-sided sheet.
 float bias=.00045+.0012*(1.-abs(dot(normal,lightDirection)));
 float result=0.;
 // Nine discreet depth comparisons; NEAREST on the packed map is essential.
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  float depth=shadowDepth(c.xy+vec2(float(x),float(y))*uShadowTexel*1.35);
  result+=step(c.z-bias,depth);
 }
 return result/9.;
}
```

Replace the current camera-relative key direction and flat white light block with:

```glsl
vec3 key=normalize(uKeyPosition-vWorld);
vec3 view=normalize(uEye-vWorld);
float visibility=cardVisibility(n,key);
float incidence=max(0.,dot(n,key));
vec3 illumination=vec3(.40,.445,.515)+vec3(.78,.73,.64)*incidence*visibility;
vec3 col=pow(tex,vec3(2.2))*illumination*uPresence;
```

Multiply the existing gold/edge sheen by `visibility`; this prevents a lit reflection appearing inside another card's cast shadow. Keep the very small material response; do not add emission, halo or trail. For the side/perimeter replace its standalone lighting with:

```glsl
if(vSide>.5)col=vec3(.034,.043,.061)+vec3(.21,.18,.12)*incidence*visibility;
```

Keep existing restrained depth fog and final linear→sRGB conversion. The blue ambient preserves legibility even in cast shadows, while the warm key gives ivory and the actual card overlap depth. The key, map projection and light direction must remain linked: using a camera-relative diffuse key with the fixed shadow camera produces visibly incorrect shadows.

## Validation performed here / remaining integration check

- `node --check work/hero-v11/lighting.inc.js` passed.
- Shader code and resource/state restoration reviewed against the current v11 native-WebGL pipeline.
- Actual GLSL compile/framebuffer and visual quality need the root's integrated browser run; this isolated add-on does not claim runtime/render verification.
- Failure cleanup frees each partially allocated resource and the temporary shader handles. The main renderer stays usable. The disabled sampler points at the already-existing back texture solely to retain sampler completeness; it returns visibility 1 before sampling.
