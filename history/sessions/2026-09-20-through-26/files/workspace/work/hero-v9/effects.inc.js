// One texture-free, depth-tested light pass. Insert inside the hero IIFE.
// Geometry lives in world space; the card pass supplies its existing depth buffer.
let magic=null;
function initializeMagic(){
 disposeMagic();
 const vertSource=`
 attribute vec3 aPosition;attribute vec2 aLightUV;attribute vec4 aLightColor;attribute float aKind;
 uniform mat4 uVP;varying vec2 vUV;varying vec4 vColor;varying float vKind;
 void main(){vUV=aLightUV;vColor=aLightColor;vKind=aKind;gl_Position=uVP*vec4(aPosition,1.);}`;
 const fragSource=`
 precision mediump float;varying vec2 vUV;varying vec4 vColor;varying float vKind;
 void main(){
  float light;
  if(vKind>0.5&&vKind<1.5){
   float r=length(vUV);if(r>1.)discard;
   light=exp(-r*r*5.)*.19+exp(-r*r*38.)*.88;
  }else{
   float d=abs(vUV.y);if(d>1.)discard;
   light=exp(-d*d*4.5)*.19+pow(max(0.,1.-d),12.)*.81;
   if(vKind>2.5)light=exp(-d*d*5.)*.65*pow(max(0.,sin(vUV.x*3.14159265)),.5);
   else if(vKind>1.5)light*=pow(max(0.,sin(vUV.x*3.14159265)),.68);
  }
  float a=vColor.a*light;if(a<.001)discard;
  gl_FragColor=vec4(vColor.rgb,a);
 }`;
 let lightProgram=null,lightBuffer=null;const shaders=[];
 try{
  lightProgram=gl.createProgram();
  for(const [type,source]of[[gl.VERTEX_SHADER,vertSource],[gl.FRAGMENT_SHADER,fragSource]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Magic shader: '+gl.getShaderInfoLog(shader));
   gl.attachShader(lightProgram,shader);
  }
  gl.linkProgram(lightProgram);
  if(!gl.getProgramParameter(lightProgram,gl.LINK_STATUS))throw Error('Magic program: '+gl.getProgramInfoLog(lightProgram));
  for(const shader of shaders)gl.deleteShader(shader);shaders.length=0;
  lightBuffer=gl.createBuffer();
  if(!lightBuffer)throw Error('Magic buffer unavailable');
  const capacity=1100*6*10,data=new Float32Array(capacity);
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBuffer);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);
  const attrs=[['aPosition',3,0],['aLightUV',2,12],['aLightColor',4,20],['aKind',1,36]].map(([name,size,offset])=>({loc:gl.getAttribLocation(lightProgram,name),size,offset}));
  const mainAttrs=[['aPos',3,0],['aNormal',3,12],['aUV',2,24]].map(([name,size,offset])=>({loc:gl.getAttribLocation(program,name),size,offset}));
  // Four genuinely rounded corners, with a long uninterrupted cut between them.
  const outline=[],radius=.037,x=CARD_W/2-.008,y=CARD_H/2-.008;
  for(let corner=0;corner<4;corner++){
   const cx=(corner===0||corner===3?1:-1)*(x-radius),cy=(corner<2?1:-1)*(y-radius);
   for(let k=0;k<4;k++){const a=(corner*Math.PI/2)+(k/3)*Math.PI/2;outline.push([cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,0]);}
  }
  magic={program:lightProgram,buffer:lightBuffer,data,attrs,mainAttrs,outline,uVP:gl.getUniformLocation(lightProgram,'uVP'),used:0,quads:0};
  restoreMagicBindings();return true;
 }catch(error){
  for(const shader of shaders)gl.deleteShader(shader);
  if(lightBuffer)gl.deleteBuffer(lightBuffer);if(lightProgram)gl.deleteProgram(lightProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  diagnostics.magicFailure=String(error);return false;
 }
}
function restoreMagicBindings(){
 if(!magic)return;
 for(const attribute of magic.attrs)if(attribute.loc>=0)gl.disableVertexAttribArray(attribute.loc);
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuf);
 for(const attribute of magic.mainAttrs)if(attribute.loc>=0){gl.enableVertexAttribArray(attribute.loc);gl.vertexAttribPointer(attribute.loc,attribute.size,gl.FLOAT,false,32,attribute.offset);}
 gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
}
function drawMagic(progress,camera,layers,previousLayers=[]){
 if(!magic)return;
 const state=magic,data=state.data,clock=quiet||freezeTime?progress*24:time;
 const event=ramp(.045,.25,progress)*(1-.62*ramp(.88,1,progress)),strength=quiet?.27:.30+.70*event;
 const previous=new Map(previousLayers.map(pose=>[pose.index,pose]));
 const warm=[1,.76,.39],ivory=[1,.94,.77],blue=[.30,.55,.83];
 state.used=0;state.quads=0;
 function point(matrix,x,y,z=0){return[matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]];}
 function vertex(position,u,v,color,alpha,kind){let n=state.used;data[n++]=position[0];data[n++]=position[1];data[n++]=position[2];data[n++]=u;data[n++]=v;data[n++]=color[0];data[n++]=color[1];data[n++]=color[2];data[n++]=alpha;data[n++]=kind;state.used=n;}
 function quad(a,b,c,d,u0,u1,color,alpha0,alpha1,kind){
  if(state.used+60>data.length)return;
  vertex(a,u0,-1,color,alpha0,kind);vertex(b,u0,1,color,alpha0,kind);vertex(c,u1,-1,color,alpha1,kind);
  vertex(c,u1,-1,color,alpha1,kind);vertex(b,u0,1,color,alpha0,kind);vertex(d,u1,1,color,alpha1,kind);state.quads++;
 }
 function strip(a,b,width,color,alpha0,alpha1,kind=0,u0=0,u1=1){
  const direction=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],toward=[camera.eye[0]-(a[0]+b[0])*.5,camera.eye[1]-(a[1]+b[1])*.5,camera.eye[2]-(a[2]+b[2])*.5];
  const side=norm(cross(direction,toward)),offset=scale(side,width);
  quad(add(a,scale(offset,-1)),add(a,offset),add(b,scale(offset,-1)),add(b,offset),u0,u1,color,alpha0,alpha1,kind);
 }
 const cameraRight=[camera.view[0],camera.view[4],camera.view[8]],cameraUp=[camera.view[1],camera.view[5],camera.view[9]];
 for(const pose of layers){
  const m=pose.matrix,s=Math.hypot(m[0],m[1],m[2]),index=pose.index;
  const centre=[m[12],m[13],m[14]],distance=Math.hypot(...centre.map((v,i)=>v-camera.eye[i]));
  const atmospheric=clamp(1-(distance-9)*.024,.30,1);
  const openingWeight=mix(1/(1+index*1.6),1,ramp(.03,.18,progress));
  const closingWeight=mix(1,1/(1+(COUNT-1-index)*1.6),ramp(.875,.98,progress));
  const weight=strength*atmospheric*openingWeight*closingWeight;
  // A tiny bias towards the viewer prevents z-fighting at the physical cut.
  // The existing card depths still hide light belonging to occluded cards.
  const forward=scale(norm(camera.eye.map((v,i)=>v-centre[i])),.007*s);
  const perimeter=state.outline.map(p=>add(point(m,...p),forward));
  const phase=index*2.39996+clock*.19;
  for(let j=0;j<perimeter.length;j++){
   const next=(j+1)%perimeter.length;
   const energy=k=>.14+.63*Math.pow(.5+.5*Math.cos(k/perimeter.length*Math.PI*2-phase),5);
   const color=(j+index)%13===0?ivory:((j+index)%19===0?blue:warm);
   if(j%4===3)strip(perimeter[j],perimeter[next],s*.19,warm,weight*energy(j)*.66,weight*energy(next)*.66,3);
   strip(perimeter[j],perimeter[next],s*.047,color,weight*energy(j)*1.22,weight*energy(next)*1.22);
  }
  if(quiet)continue;
  // At most two tiny motes per card. They originate at cut edges rather than
  // filling the screen with unrelated stars; a cycle takes over ten seconds.
  for(let spark=0;spark<2;spark++){
   const seed=index*.61803398875+spark*.381966,life=(clock*.087+seed)%1;
   const envelope=Math.sin(life*Math.PI),side=(index+spark)%2?1:-1;
   const localX=side*(CARD_W*.5+.025+life*.16),localY=mix(-.68,.80,life)+Math.sin(index*1.7)*.1;
   const location=add(point(m,localX,localY,.025+Math.sin(life*Math.PI)*.10),forward);
   const radius=s*(.016+.013*envelope),right=scale(cameraRight,radius),up=scale(cameraUp,radius);
   const color=spark===0?warm:ivory,alpha=weight*envelope*(.48+.45*event);
   quad(add(add(location,scale(right,-1)),scale(up,-1)),add(add(location,scale(right,-1)),up),add(add(location,right),scale(up,-1)),add(add(location,right),up),-1,1,color,alpha,alpha,1);
  }
  // Only a few cards draw a filament. It starts at a corner and remembers the
  // authored path a little way behind it, so the trail belongs to the gesture.
  const trailEvent=ramp(.11,.25,progress)*(1-ramp(.87,.97,progress));
  if(index%4!==1||trailEvent<.001)continue;
  const prior=previous.get(index),corner=index%8<4?-1:1;
  const head=add(point(m,corner*CARD_W*.5,.86,.018),forward);
  let movement=prior?head.map((v,i)=>v-point(prior.matrix,corner*CARD_W*.5,.86,.018)[i]):[0,0,0];
  const movementLength=Math.hypot(...movement);
  if(movementLength>.00001)movement=scale(movement,Math.min(s*1.8,movementLength*3.8)/movementLength);
  const curl=rotate(m,[corner*.42,-.62,.18]),tail=add(head,add(scale(movement,-1),curl));
  const bow=rotate(m,[corner*.14,Math.sin(clock*.23+index)*.055,.13]);
  let a=head;
  for(let segment=0;segment<8;segment++){
   const t=(segment+1)/8,b=head.map((v,i)=>mix(v,tail[i],t)+bow[i]*Math.sin(t*Math.PI));
   const alpha=weight*trailEvent*.76,width=s*mix(.030,.065,t);
   strip(a,b,width,index%8===1?ivory:warm,alpha,alpha,2,segment/8,t);a=b;
  }
 }
 if(!state.used){diagnostics.magicQuads=0;return;}
 gl.useProgram(state.program);gl.bindBuffer(gl.ARRAY_BUFFER,state.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,data.subarray(0,state.used));
 for(const attribute of state.attrs)if(attribute.loc>=0){gl.enableVertexAttribArray(attribute.loc);gl.vertexAttribPointer(attribute.loc,attribute.size,gl.FLOAT,false,40,attribute.offset);}
 gl.uniformMatrix4fv(state.uVP,false,camera.vp);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
 gl.drawArrays(gl.TRIANGLES,0,state.used/10);
 diagnostics.magicQuads=state.quads;diagnostics.magicDrawCalls=1;
 restoreMagicBindings();
}
function disposeMagic(){
 if(!magic)return;
 if(gl){gl.deleteBuffer(magic.buffer);gl.deleteProgram(magic.program);}
 magic=null;
}
