// One shared, optional shadow pass. Insert inside the renderer IIFE, after the
// math helpers and before initialize(). No second canvas or external assets.
// This renderer uses rigid cards (uBend/uTwist === 0) in both passes.
let shadowState=null;
const SHADOW_KEY=[-7,10,12];
const SHADOW_LIGHT_VP=(()=>{
 const radius=12,near=.1,far=60;
 const projection=new Float32Array([1/radius,0,0,0,0,1/radius,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]);
 return mul(projection,lookAt(SHADOW_KEY,[0,0,-2],0));
})();
const shadowVertexSource=`
attribute vec3 aPos;
uniform mat4 uModel,uLightVP;
void main(){gl_Position=uLightVP*uModel*vec4(aPos,1.);}`;
const shadowFragmentSource=`
precision highp float;
vec4 encodeDepth(float depth){
 vec4 digits=fract(depth*vec4(16777216.,65536.,256.,1.));
 return digits-digits.xxyz*vec4(0.,.00390625,.00390625,.00390625);
}
void main(){gl_FragColor=encodeDepth(gl_FragCoord.z);}`;
function disposeShadows(){
 if(!shadowState||!gl)return;
 const old=shadowState;shadowState=null;
 if(old.texture)gl.deleteTexture(old.texture);
 if(old.depth)gl.deleteRenderbuffer(old.depth);
 if(old.framebuffer)gl.deleteFramebuffer(old.framebuffer);
 if(old.program)gl.deleteProgram(old.program);
}
function initializeShadows(){
 disposeShadows();
 const previous={
  active:gl.getParameter(gl.ACTIVE_TEXTURE),framebuffer:gl.getParameter(gl.FRAMEBUFFER_BINDING),
  renderbuffer:gl.getParameter(gl.RENDERBUFFER_BINDING),program:gl.getParameter(gl.CURRENT_PROGRAM)
 };
 gl.activeTexture(gl.TEXTURE3);previous.texture=gl.getParameter(gl.TEXTURE_BINDING_2D);
 const shaders=[];
 try{
  const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
  if(!precision||precision.precision<16)throw Error('Fragment high precision unavailable');
  const size=Math.min(mobile?512:1024,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
  if(size<256)throw Error('Shadow buffer size unavailable');
  const s=shadowState={size,drawCalls:0,program:gl.createProgram()};
  if(!s.program)throw Error('Shadow program allocation failed');
  for(const [type,source] of [[gl.VERTEX_SHADER,shadowVertexSource],[gl.FRAGMENT_SHADER,shadowFragmentSource]]){
   const shader=gl.createShader(type);if(!shader)throw Error('Shadow shader allocation failed');
   shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'Shadow shader compile failed');
   gl.attachShader(s.program,shader);
  }
  // Reusing the main program's locations means no attribute or VAO mutation
  // is needed during a frame. Both passes use the exact same interleaved mesh.
  for(const name of ['aPos','aNormal','aUV']){
   const location=gl.getAttribLocation(program,name);
   if(location<0)throw Error('Main mesh attribute unavailable: '+name);
   gl.bindAttribLocation(s.program,location,name);
  }
  gl.linkProgram(s.program);
  if(!gl.getProgramParameter(s.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(s.program)||'Shadow program link failed');
  s.uModel=gl.getUniformLocation(s.program,'uModel');s.uLightVP=gl.getUniformLocation(s.program,'uLightVP');
  s.texture=gl.createTexture();s.depth=gl.createRenderbuffer();s.framebuffer=gl.createFramebuffer();
  if(!s.texture||!s.depth||!s.framebuffer)throw Error('Shadow buffer allocation failed');
  gl.bindTexture(gl.TEXTURE_2D,s.texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  // Packed channels must never be interpolated before decoding.
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindRenderbuffer(gl.RENDERBUFFER,s.depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
  gl.bindFramebuffer(gl.FRAMEBUFFER,s.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,s.texture,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,s.depth);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Shadow framebuffer incomplete');
  gl.useProgram(s.program);gl.uniformMatrix4fv(s.uLightVP,false,SHADOW_LIGHT_VP);
  diagnostics.shadowFailure=null;
  return true;
 }catch(error){
  disposeShadows();diagnostics.shadowFailure=String(error);return false;
 }finally{
  shaders.forEach(shader=>gl.deleteShader(shader));
  gl.bindFramebuffer(gl.FRAMEBUFFER,previous.framebuffer);gl.bindRenderbuffer(gl.RENDERBUFFER,previous.renderbuffer);
  gl.bindTexture(gl.TEXTURE_2D,previous.texture);gl.activeTexture(previous.active);gl.useProgram(previous.program);
 }
}
function renderShadows(worldLayers){
 const s=shadowState;if(!s)return 0;
 try{
  gl.disable(gl.DITHER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,s.framebuffer);gl.viewport(0,0,s.size,s.size);
  gl.useProgram(s.program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(true,true,true,true);
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.POLYGON_OFFSET_FILL);
  // A white cleared texel decodes beyond the far plane, hence fully lit.
  gl.clearColor(1,1,1,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  s.drawCalls=0;
  for(const layer of worldLayers){
   gl.uniformMatrix4fv(s.uModel,false,layer.matrix);gl.drawElements(gl.TRIANGLES,meshCount,gl.UNSIGNED_SHORT,0);s.drawCalls++;
  }
  return s.drawCalls;
 }catch(error){
  diagnostics.shadowFailure=String(error);disposeShadows();return 0;
 }finally{
  // Explicit restoration of this renderer's main-pass state avoids synchronous
  // getParameter reads every frame. Textures and vertex pointers never change.
  gl.enable(gl.DITHER);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(true,true,true,true);
  gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.clearColor(0,0,0,0);gl.clearDepth(1);
 }
}
function shadowBindings(){
 const s=shadowState;
 // Binding the existing back texture when disabled keeps sampler completeness
 // valid without allocating a fallback texture. The shader returns before use.
 return {texture:s?s.texture:back,enabled:s?1:0,texel:s?1/s.size:1,vp:SHADOW_LIGHT_VP,key:SHADOW_KEY,size:s?s.size:0,drawCalls:s?s.drawCalls:0};
}

