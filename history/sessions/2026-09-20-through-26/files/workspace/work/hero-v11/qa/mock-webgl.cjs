'use strict';
// Narrow stateful WebGL mock. Tracks allocation, binding, and draw pass state;
// does not compile GLSL, rasterize, or validate browser/GPU implementation limits.
module.exports=function makeMockGL(options={}){
 const constants=['ACTIVE_TEXTURE','FRAMEBUFFER_BINDING','RENDERBUFFER_BINDING','CURRENT_PROGRAM','TEXTURE_BINDING_2D','MAX_TEXTURE_SIZE','MAX_RENDERBUFFER_SIZE','FRAMEBUFFER','RENDERBUFFER','TEXTURE_2D','VERTEX_SHADER','FRAGMENT_SHADER','HIGH_FLOAT','LINK_STATUS','COMPILE_STATUS','RGBA','UNSIGNED_BYTE','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','NEAREST','TEXTURE_WRAP_S','TEXTURE_WRAP_T','CLAMP_TO_EDGE','DEPTH_COMPONENT16','COLOR_ATTACHMENT0','DEPTH_ATTACHMENT','FRAMEBUFFER_COMPLETE','ARRAY_BUFFER','ELEMENT_ARRAY_BUFFER','DEPTH_TEST','LEQUAL','BLEND','CULL_FACE','SCISSOR_TEST','POLYGON_OFFSET_FILL','DITHER','TRIANGLES','UNSIGNED_SHORT','FLOAT','STATIC_DRAW','COLOR_BUFFER_BIT','DEPTH_BUFFER_BIT'];
 const gl=Object.fromEntries(constants.map((x,i)=>[x,i+1]));gl.TEXTURE0=100;gl.TEXTURE1=101;gl.TEXTURE2=102;gl.TEXTURE3=103;
 const state={active:gl.TEXTURE0,framebuffer:null,renderbuffer:null,program:null,textures:{},buffers:{},viewport:[0,0,1,1],enabled:new Set([gl.DITHER]),depthMask:true,colorMask:[true,true,true,true],clearColor:[0,0,0,0],clearDepth:1,depthFunc:gl.LEQUAL};
 const calls=[],resources=[],deletes=[],draws=[],vertexPointers=[];let serial=0;
 const create=type=>{if(options['failCreate'+type])return null;const resource={type,id:++serial};resources.push(resource);return resource;};
 const remove=resource=>{if(resource)deletes.push(resource);};
 for(const type of ['Program','Buffer','Texture','Renderbuffer','Framebuffer','Shader']){gl['create'+type]=()=>create(type);gl['delete'+type]=remove;}
 gl.getParameter=x=>({[gl.ACTIVE_TEXTURE]:state.active,[gl.FRAMEBUFFER_BINDING]:state.framebuffer,[gl.RENDERBUFFER_BINDING]:state.renderbuffer,[gl.CURRENT_PROGRAM]:state.program,[gl.TEXTURE_BINDING_2D]:state.textures[state.active]??null,[gl.MAX_TEXTURE_SIZE]:options.maxTextureSize??4096,[gl.MAX_RENDERBUFFER_SIZE]:options.maxRenderbufferSize??4096})[x];
 gl.getShaderPrecisionFormat=()=>({precision:options.highPrecision===false?0:23});
 gl.getShaderParameter=()=>!options.failCompile;gl.getProgramParameter=()=>!options.failLink;
 gl.getShaderInfoLog=()=>options.failCompile?'simulated shader compile failure':'';gl.getProgramInfoLog=()=>options.failLink?'simulated program link failure':'';
 gl.getAttribLocation=(_,name)=>({aPos:0,aNormal:1,aUV:2})[name]??-1;gl.getUniformLocation=(program,name)=>({program,name});
 gl.checkFramebufferStatus=()=>options.failFramebuffer?0:gl.FRAMEBUFFER_COMPLETE;
 gl.activeTexture=value=>state.active=value;gl.bindTexture=(_,value)=>state.textures[state.active]=value;
 gl.bindFramebuffer=(_,value)=>state.framebuffer=value;gl.bindRenderbuffer=(_,value)=>state.renderbuffer=value;
 gl.useProgram=value=>state.program=value;gl.bindBuffer=(type,value)=>state.buffers[type]=value;
 gl.viewport=(...args)=>state.viewport=args;gl.enable=value=>state.enabled.add(value);gl.disable=value=>state.enabled.delete(value);
 gl.depthMask=value=>state.depthMask=value;gl.colorMask=(...args)=>state.colorMask=args;gl.clearColor=(...args)=>state.clearColor=args;gl.clearDepth=value=>state.clearDepth=value;gl.depthFunc=value=>state.depthFunc=value;
 gl.vertexAttribPointer=(...args)=>vertexPointers.push(args);
 gl.drawElements=(...args)=>{if(options.failDraw)throw Error('simulated shadow draw failure');draws.push({args,framebuffer:state.framebuffer,program:state.program,viewport:[...state.viewport],dither:state.enabled.has(gl.DITHER)});};
 for(const name of ['shaderSource','compileShader','attachShader','bindAttribLocation','linkProgram','texImage2D','texParameteri','renderbufferStorage','framebufferTexture2D','framebufferRenderbuffer','uniformMatrix4fv','uniform1i','uniform1f','uniform2f','uniform3f','clear','bufferData','enableVertexAttribArray'])gl[name]=(...args)=>calls.push([name,...args]);
 return {gl,state,resources,deletes,draws,calls,vertexPointers,options};
};
