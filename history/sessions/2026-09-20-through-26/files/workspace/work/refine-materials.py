from pathlib import Path
p=Path('work/app.js')
s=p.read_text()
s=s.replace('const ivoryColor=new THREE.Color(0xddd7c5),opticalColor=new THREE.Color(0xb6beb1);','const ivoryColor=new THREE.Color(0xe9e3d6),opticalColor=new THREE.Color(0x5b6156);\nconst surfaceTextures=new Set();let contactMaps=[],roughnessMap;')
start=s.index('function plate()')
end=s.index('function labelTexture(',start)
s=s[:start]+'''function faceUV(g){const p=g.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+1.25)/2.5;uv[i*2+1]=(p.getY(i)+1.9)/3.8}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g}
function plate(){const g=new THREE.ExtrudeGeometry(rounded(2.5,3.8,.10),{depth:.028,bevelEnabled:true,bevelThickness:.005,bevelSize:.007,bevelSegments:4,curveSegments:10});g.translate(0,0,.017);return registerGeometry(faceUV(g))}
function rimPlate(){const s=rounded(2.509,3.809,.105),hole=rounded(2.483,3.783,.095);s.holes.push(new THREE.Path(hole.getPoints(10).reverse()));const g=new THREE.ExtrudeGeometry(s,{depth:.013,bevelEnabled:true,bevelThickness:.0015,bevelSize:.002,bevelSegments:2,curveSegments:10});g.translate(0,0,.018);return registerGeometry(g)}
function makeGrain(){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),pixels=ctx.createImageData(512,512);let seed=27183;
 for(let i=0;i<pixels.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;let v=126+(seed>>>0)%5;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,3);surfaceTextures.add(t);return t;
}
function makeEnvironment(){
 // Large studio softboxes: reflected light defines curvature without painted highlights.
 const es=new THREE.Scene();es.background=new THREE.Color(0x111510);const geometry=new THREE.PlaneGeometry(1,1);
 const c=document.createElement('canvas');c.width=64;c.height=256;const cx=c.getContext('2d'),g=cx.createLinearGradient(0,0,64,0);g.addColorStop(0,'#111111');g.addColorStop(.22,'#dddddd');g.addColorStop(.6,'#ffffff');g.addColorStop(1,'#222222');cx.fillStyle=g;cx.fillRect(0,0,64,256);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 [[-5,4.5,6,6,9,0xf5f0e5,6],[7,1,4,2,11,0xdfe6ed,5],[0,7,-1,8,3,0xe8e4db,3.5],[-3,-4,4,4,2,0xa29b86,1.1]].forEach(([x,y,z,w,h,col,int])=>{const m=new THREE.MeshBasicMaterial({color:col,map});m.color.multiplyScalar(int);const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);o.lookAt(0,0,0);es.add(o)});
 const gen=new THREE.PMREMGenerator(renderer);envTarget=gen.fromScene(es,.02,.1,80);scene.environment=envTarget.texture;gen.dispose();es.traverse(o=>{if(o.material)o.material.dispose()});geometry.dispose();map.dispose();
}
function contactTexture(asset){
 // A very shallow, baked contact occlusion keeps fine carving grounded in its face.
 const mask=document.createElement('canvas');mask.width=512;mask.height=768;const ctx=mask.getContext('2d');ctx.fillStyle='#000';
 for(const part of asset){const g=part.geometry,p=g.attributes.position,idx=g.index;ctx.beginPath();const n=idx?idx.count:p.count;for(let i=0;i<n;i+=3){for(let j=0;j<3;j++){const v=idx?idx.getX(i+j):i+j,x=(p.getX(v)/2.5+.5)*512,y=(.5-p.getY(v)/3.8)*768;j?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}ctx.fill()}
 const c=document.createElement('canvas');c.width=512;c.height=768;const out=c.getContext('2d');out.fillStyle='#fff';out.fillRect(0,0,512,768);out.globalAlpha=.42;out.filter='blur(3px)';out.drawImage(mask,0,0);out.filter='blur(9px)';out.globalAlpha=.15;out.drawImage(mask,0,0);const texture=new THREE.CanvasTexture(c);surfaceTextures.add(texture);return texture;
}
''' +s[end:]
s=s.replace('renderer.toneMappingExposure=1.03','renderer.toneMappingExposure=.97')
s=s.replace('new THREE.HemisphereLight(0xe7eadc,0x222a20,.85)','new THREE.HemisphereLight(0xe9e9e3,0x161b13,.35)')
s=s.replace('new THREE.DirectionalLight(0xffeed2,3.7)','new THREE.DirectionalLight(0xf4f0e7,2.4)')
s=s.replace('keyLight.shadow.bias=-.00013;keyLight.shadow.normalBias=.006;keyLight.shadow.radius=2','keyLight.shadow.bias=-.00006;keyLight.shadow.normalBias=.0008;keyLight.shadow.radius=3')
s=s.replace('new THREE.DirectionalLight(0xd1ded8,.65)','new THREE.DirectionalLight(0xe0e9ed,.9)')
s=s.replace('new THREE.MeshStandardMaterial({color:0xe0d9c7,metalness:.04,roughness:.54,envMapIntensity:.27,bumpMap:grainMap,bumpScale:.008,transparent:true})','new THREE.MeshPhysicalMaterial({color:0xe9e3d6,metalness:0,roughness:.38,envMapIntensity:.7,clearcoat:.25,clearcoatRoughness:.36,bumpMap:grainMap,bumpScale:.0008,transparent:true})')
s=s.replace('new THREE.MeshStandardMaterial({color:0xb8b6a7,metalness:.92,roughness:.31,envMapIntensity:.85,transparent:true})','new THREE.MeshStandardMaterial({color:0xa8a397,metalness:1,roughness:.24,envMapIntensity:1.1,transparent:true})')
s=s.replace('new THREE.MeshStandardMaterial({color:0xac8b54,metalness:.83,roughness:.29,envMapIntensity:.65,transparent:true})','new THREE.MeshStandardMaterial({color:0xb9a574,metalness:1,roughness:.23,envMapIntensity:1.0,transparent:true})')
s=s.replace(' reliefAssets=buildReliefAssets(THREE);for(const asset of reliefAssets)for(const part of asset)registerGeometry(part.geometry);',' reliefAssets=buildReliefAssets(THREE);for(const asset of reliefAssets)for(const part of asset)registerGeometry(part.geometry);contactMaps=reliefAssets.map(contactTexture);')
start=s.index('  const bm=registerMaterial(')
end=s.index('  const rm=registerMaterial(',start)
s=s[:start]+'''  const bm=registerMaterial(new THREE.MeshPhysicalMaterial({emissive:0x000000,color:ivoryColor,metalness:0,roughness:.4,envMapIntensity:.7,clearcoat:.16,clearcoatRoughness:.4,bumpMap:grainMap,bumpScale:.0012,aoMap:contactMaps[r[4]],aoMapIntensity:.9,transparent:true,side:THREE.FrontSide}));
''' +s[end:]
s=s.replace('edge.position.z=-.02','edge.position.z=0')
s=s.replace('const m=registerMaterial(MAT[materialKey].clone());reliefMats.push(m);const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;','const m=registerMaterial(MAT[materialKey].clone());m.vertexColors=!!geometry.attributes.color;reliefMats.push(m);const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=false;mesh.receiveShadow=false;')
s=s.replace('label.position.z=.048','label.position.z=.051')
s=s.replace('new THREE.Vector3(0,0,.92-i*.108)','new THREE.Vector3(0,0,.5-i*.047)')
s=s.replace('hy=mobile?.04:-.43,hs=mobile?.64:1.09','hy=mobile?.04:-.33,hs=mobile?.68:1.18')
s=s.replace('const lightZ=mix(0,-24,ramp(.16,.9,p));keyLight.position.set(-4.8,6.8,4.8+lightZ);lightTarget.position.set(.3,0,lightZ);fillLight.position.set(5.5,1.5,5+lightZ);keyLight.intensity=mix(3.7,4.3,glass);','''const lightZ=mix(0,-24,ramp(.16,.9,p));
 const lightX=mix(1.4,.4,ramp(.15,.35,p));keyLight.position.set(-2.7,5.8,7.0+lightZ);lightTarget.position.set(lightX,0,lightZ);fillLight.position.set(5.5,1.5,5+lightZ);keyLight.intensity=mix(2.4,1.3,glass);
 const span=mix(3.5,6,ramp(.16,.34,p));if(Math.abs(keyLight.shadow.camera.right-span)>.002){keyLight.shadow.camera.left=-span;keyLight.shadow.camera.right=span;keyLight.shadow.camera.top=span*1.2;keyLight.shadow.camera.bottom=-span*1.2;keyLight.shadow.camera.updateProjectionMatrix()}''')
start=s.index('  const g=glass*(1-take),faceOpacity=')
end=s.index('  // In the compressed deck',start)
s=s[:start]+'''  const g=glass*(1-take),faceOpacity=1-cel*(i%6===0?.02:.18);
  const quietEcho=mobile&&reading>0&&take===0?1-reading*.9:1;
  d.body.material.opacity=faceOpacity*quietEcho;d.body.material.emissiveIntensity=0;d.body.material.roughness=mix(.4,.2,g);d.body.material.metalness=mix(0,.94,g);d.body.material.envMapIntensity=mix(.7,1.1,g);d.body.material.color.lerpColors(ivoryColor,opticalColor,g);d.body.material.clearcoat=mix(.16,.55,g);d.body.material.aoMapIntensity=(1-g)*.9;d.body.material.iridescence=0;d.body.material.depthWrite=quietEcho>.5;
  d.edge.material.opacity=quietEcho;d.edge.material.emissiveIntensity=0;d.edge.material.depthWrite=quietEcho>.5;
''' +s[end:]
s=s.replace('  d.body.castShadow=g<.3;d.body.receiveShadow=g<.3;','  d.body.castShadow=true;d.body.receiveShadow=true;')
s=s.replace(' renderer.shadowMap.enabled=glass<.35||reading>0;',' renderer.shadowMap.enabled=true;')
s=s.replace('grainMap?.dispose();envTarget?.dispose();','surfaceTextures.forEach(t=>t.dispose());envTarget?.dispose();')
p.write_text(s)
