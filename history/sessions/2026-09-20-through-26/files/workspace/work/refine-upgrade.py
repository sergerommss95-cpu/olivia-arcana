from pathlib import Path
p=Path('work/app.js');s=p.read_text()
s=s.replace('[-8.4,-5,-28,.22,.7,.6,.61]', '[-12.4,-7.3,-28,.22,.7,.6,.61]')
s=s.replace("const f=field[i].slice();if(mobile){f[0]*=.37;f[1]*=.85;f[6]*=.58;if(i===0){f[0]=.65;f[1]=-.42;f[6]=.63}if(i===2){f[0]=1.3;f[1]=-3.8;f[6]=.4}}",'''const f=field[i].slice();if(mobile){
   const arranged=[[.70,-.36,.66],[3.1,1.15,.46],[2.25,-4.0,.38],[-2.8,-2.0,.35],[3.9,4.8,.35],[2.1,5.3,.35],[-4.4,4.8,.3]];
   if(i<7){f[0]=arranged[i][0];f[1]=arranged[i][1];f[6]=arranged[i][2]}
   else{f[0]=(i%2?-1:1)*(5.3+(i%3)*1.6);f[1]=((i%5)-2)*4.1;f[6]=.35}
  }''')
s=s.replace('const a=-1.24+i/21*5.64+angleOffsets[i]*3;', 'const a=[-1.25,-1.12,-1.00,-.78,-.55,-.39,-.2,.14,.24,.35,.71,1.11,1.33,1.4,1.5,1.91,2.29,2.75,3.11,3.8,4.18,4.35][i];')
s=s.replace('-.38+Math.sin(a)*.6,mobile?', 'a-.15,mobile?')
s=s.replace("const bm=registerMaterial(new THREE.MeshPhysicalMaterial({color:ivoryColor", "const bm=registerMaterial(new THREE.MeshPhysicalMaterial({emissive:0x8d9c8c,emissiveIntensity:0,color:ivoryColor")
s=s.replace('const rm=registerMaterial(MAT.platinum.clone());', 'const rm=registerMaterial(MAT.platinum.clone());rm.emissive.setHex(0xa6b6a3);')
s=s.replace('const g=glass*(1-take),faceOpacity=mix(1-cel*.68,.15+.04*Math.sin(i*2.1),g);', 'const g=glass*(1-take),faceOpacity=mix(1-cel*(i%6===0?.22:.82),.32+.12*Math.sin(i*2.1),g);')
s=s.replace('d.body.material.opacity=faceOpacity*quietEcho;', 'd.body.material.opacity=faceOpacity*quietEcho;d.body.material.emissiveIntensity=g*.7;')
s=s.replace('d.edge.material.opacity=mix(1,.72,g)*quietEcho;', 'd.edge.material.opacity=mix(1,.90,g)*quietEcho;d.edge.material.emissiveIntensity=g*.65;')
s=s.replace('const artOpacity=interior*(1-ramp(.56,.70,p))*(1-glass)+take;', 'const artOpacity=interior*Math.max(1-ramp(.56,.70,p),i%6===0?cel*.75:0)*(1-glass)+take;')
s=s.replace('(.57+.06*Math.sin(theta*2))*sz','(.49+.045*Math.sin(theta*2))*sz')
p.write_text(s)
