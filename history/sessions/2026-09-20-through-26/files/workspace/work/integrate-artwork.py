from pathlib import Path
p=Path('work/assemble.py');s=p.read_text();s=s.replace('import re','import re, base64');s=s.replace("template=(p/'template.html').read_text()", "artwork='const SCULPTURE_ATLAS=\\\"data:image/png;base64,'+base64.b64encode((p/'assets/sculpture-atlas.png').read_bytes()).decode()+'\\\";\\nconst SCULPTURE_SUN=\\\"data:image/png;base64,'+base64.b64encode((p/'assets/sun-sculpture.png').read_bytes()).decode()+'\\\";\\n'+(p/'art-surface.js').read_text()\ntemplate=(p/'template.html').read_text().replace('/*__ART__*/',artwork)")
p.write_text(s)
p=Path('work/art-surface.js');s=p.read_text().replace('ctx.drawImage(panel,51,131,922,1383)','ctx.drawImage(panel,135,185,754,1131)').replace('ctx.drawImage(panel,159,251,706,1059)','ctx.drawImage(panel,174,250,676,1014)');p.write_text(s)
p=Path('work/card-print.js');s=p.read_text();a=s.index('  // Margin engraving.');b=s.index('  // Title cartouche',a);s=s[:a]+s[b:];p.write_text(s)
p=Path('work/template.html');s=p.read_text().replace('/*__APP__*/','/*__ART__*/\n/*__APP__*/')
s=s.replace('background:radial-gradient(ellipse at 65% 45%,#343c31 0,#20281f 33%,#171a17 74%)','background:linear-gradient(125deg,#111310 8%,#272b23 67%,#181b16 100%)')
s=s.replace('top:17%;left:3.7%;margin:0;font-family:var(--serif);font-weight:400;font-size:25.9vw','top:11%;left:2.6%;margin:0;font-family:var(--serif);font-weight:400;font-size:33vw')
s=s.replace('top:calc(17% + 21.1vw);left:4.7%;font-size:12px','top:48%;left:4.4%;font-size:10px')
s=s.replace('.hero-note{position:absolute;', '.hero-note{display:none;position:absolute;')
s=s.replace('bottom:15.5%;max-width:340px','bottom:18%;max-width:350px')
s=s.replace('font-size:27.4vw;top:17%;left:2.6%','font-size:27.4vw;top:13%;left:2.6%')
s=s.replace('.arcana{top:29%;left:6%;', '.arcana{top:25%;left:6%;')
s=s.replace('.hero-bottom{bottom:16%;max-width:280px}.hero-bottom h2{font-size:39px', '.hero-bottom{bottom:14%;max-width:280px}.hero-bottom h2{font-size:34px')
p.write_text(s)
p=Path('work/app.js');s=p.read_text()
s=s.replace('scene,camera,keyLight,fillLight,lightTarget,envTarget,grainMap;','scene,camera,keyLight,fillLight,lightTarget,envTarget,grainMap,ground;')
s=s.replace('const ivoryColor=new THREE.Color(0xe9e3d6)','const ivoryColor=new THREE.Color(0xe9e1d1)')
s=s.replace('depth:.028,bevelEnabled:true,bevelThickness:.005','depth:.011,bevelEnabled:true,bevelThickness:.002')
s=s.replace('g.translate(0,0,.017);return registerGeometry(faceUV(g))','g.translate(0,0,.037);return registerGeometry(faceUV(g))')
s=s.replace('depth:.013,bevelEnabled:true,bevelThickness:.0015','depth:.005,bevelEnabled:true,bevelThickness:.001')
s=s.replace('g.translate(0,0,.018);return registerGeometry(g)','g.translate(0,0,.037);return registerGeometry(g)')
s=s.replace('renderer.shadowMap.type=THREE.PCFSoftShadowMap','renderer.shadowMap.type=THREE.VSMShadowMap')
s=s.replace('keyLight.shadow.radius=3','keyLight.shadow.radius=4;keyLight.shadow.blurSamples=8')
s=s.replace(' lightTarget=new THREE.Object3D();', ''' ground=new THREE.Mesh(registerGeometry(new THREE.PlaneGeometry(60,60)),registerMaterial(new THREE.ShadowMaterial({color:0x020302,opacity:.34,depthWrite:false})));ground.rotation.x=-Math.PI/2;ground.position.y=-.008;ground.receiveShadow=true;scene.add(ground);
 lightTarget=new THREE.Object3D();''')
s=s.replace('aoMap:contactMaps[r[4]],aoMapIntensity:.9','aoMapIntensity:0')
s=s.replace('  const labelMat=registerMaterial', '''  const faceMap=createSculptureFace(THREE,r[0],r[1],r[4]);surfaceTextures.add(faceMap);
  const face=new THREE.Mesh(backGeometry,registerMaterial(new THREE.MeshPhysicalMaterial({map:faceMap,bumpMap:faceMap,bumpScale:.004,roughness:.72,metalness:.015,envMapIntensity:.35,clearcoat:.06,clearcoatRoughness:.6,transparent:true})));face.position.z=.052;group.add(face);
  const labelMat=registerMaterial''')
s=s.replace('back.position.z=.010','back.position.z=.034')
s=s.replace('group.userData={body,edge,relief,reliefMats,label,wire,back,cardNumber:', 'group.userData={body,edge,relief,reliefMats,label,wire,back,face,cardNumber:')
s=s.replace('const heroQuaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.26,-.36,-.42));','const heroQuaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,-.14));')
a=s.index('  const layer=new THREE.Vector3(',s.index('function configurePoses()'));b=s.index('  const f=field[i].slice()',a)
s=s[:a]+'''  const hs=mobile?(innerHeight<650?.67:.83):1.28,hx=mobile?.10:2.22,hz=mobile?-.08:.15;
  const layer=new THREE.Vector3(0,0,(21-i)*.021-.035).multiplyScalar(hs).applyQuaternion(heroQuaternion);
  const h=pose(hx+layer.x,layer.y,hz+layer.z,-Math.PI/2,0,-.14,hs);
  const lift=[.72,.49,.31,.17,.07][i]||0;
  const o=pose(h.p.x,h.p.y+lift,h.p.z,-Math.PI/2,0,-.14,hs);
  const side=i%2===0?-1:1;
  const corridor=pose(side*(mobile?1.9:3.0),1.1+((i%3)-1)*.22,-i*.55,-.12,side*.48,side*.08,mobile?.72:1.0);
''' +s[b:]
a=s.index(' const cam=[',s.index('function configurePoses()'));b=s.index(' cameraCurve=',a)
s=s[:a]+''' const cam=[new THREE.Vector3(0,13,9.5),new THREE.Vector3(.2,11,9.2),new THREE.Vector3(.45,2.2,5.8),new THREE.Vector3(.1,.3,-3.2),new THREE.Vector3(-.1,.1,-7.7),new THREE.Vector3(0,0,-11.6),new THREE.Vector3(0,0,-11.7)];
 const look=[new THREE.Vector3(0,.3,0),new THREE.Vector3(.35,.65,.1),new THREE.Vector3(.55,1.1,-3.3),new THREE.Vector3(.1,.1,-14),new THREE.Vector3(0,0,-20),new THREE.Vector3(0,0,-24),new THREE.Vector3(0,0,-24)];
''' +s[b:]
s=s.replace(' const u=curveTime(p);cameraCurve.getPoint(u,camPos);',' const fov=mix(26,35,ramp(.15,.285,p));if(Math.abs(camera.fov-fov)>.002){camera.fov=fov;camera.updateProjectionMatrix()}\n const u=curveTime(p);cameraCurve.getPoint(u,camPos);')
s=s.replace('if(mobile){camPos.z+=1.9;camLook.y=-.1}','if(mobile){camPos.z+=mix(0,1.9,ramp(.15,.285,p));camLook.y=mix(camLook.y,-.1,ramp(.15,.285,p))}')
s=s.replace('camPos.x+=pointer.x*.16;camPos.y-=pointer.y*.10','camPos.x+=pointer.x*.16*ramp(.15,.3,p);camPos.y-=pointer.y*.10*ramp(.15,.3,p)')
a=s.index(' const lightX=mix(');b=s.index(' for(let i=0;i<cards.length;i++){',a)
s=s[:a]+''' const liftLight=ramp(.15,.33,p);keyLight.position.set(mix(-5,-2.7,liftLight),mix(12,5.8,liftLight),mix(-5,7+lightZ,liftLight));lightTarget.position.set(mix(2,.4,liftLight),mix(.25,0,liftLight),lightZ);fillLight.position.set(6,mix(5,1.5,liftLight),mix(9,5+lightZ,liftLight));keyLight.intensity=mix(2.4,1.3,glass);
 ground.material.opacity=.34*(1-ramp(.14,.29,p));ground.visible=ground.material.opacity>.001;
 const span=mix(4.5,6,ramp(.16,.34,p));if(Math.abs(keyLight.shadow.camera.right-span)>.002){keyLight.shadow.camera.left=-span;keyLight.shadow.camera.right=span;keyLight.shadow.camera.top=span*1.2;keyLight.shadow.camera.bottom=-span*1.2;keyLight.shadow.camera.updateProjectionMatrix()}
''' +s[b:]
s=s.replace('d.body.material.aoMapIntensity=(1-g)*.9','d.body.material.aoMapIntensity=0')
s=s.replace('  d.relief.visible=artOpacity>.007;const printOpacity=Math.max(Math.min(1,artOpacity)*.96,g*.40);d.label.visible=printOpacity>.007;', '''  d.relief.visible=false;d.label.visible=false;const printOpacity=Math.max(Math.min(1,artOpacity),g*.62);
  d.face.visible=printOpacity>.007;d.face.material.opacity=printOpacity*quietEcho;d.face.material.depthWrite=quietEcho>.5;d.face.material.metalness=mix(.015,.38,g);d.face.material.roughness=mix(.72,.31,g);d.face.material.envMapIntensity=mix(.35,.65,g);''')
s=s.replace('  renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,stencil:false,powerPreference:\'high-performance\'});buildScene();','  await loadSculptureImages();renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,stencil:false,powerPreference:\'high-performance\'});buildScene();')
s=s.replace('if(!quiet){c.position.y+=Math.sin(elapsed*.22+i*.51)*.012*open;','if(!quiet){c.position.y+=Math.sin(elapsed*.22+i*.51)*.012*ramp(.24,.4,p);')
p.write_text(s)
