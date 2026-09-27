from pathlib import Path
p=Path('work/art-surface.js');s=p.read_text();s=s.replace('let sculptureImages=null;', '''const CARD_ARCHETYPES=[{name:'Fool',tile:6},{name:'Magician',tile:4},{name:'High Priestess',tile:1},{name:'Moon',tile:2},{name:'Star',tile:3},{name:'Sun',tile:0},{name:'World',tile:5}];
let sculptureImages=null;''');s=s.replace('const tileByArchetype=[6,4,1,2,3,0,5],tile=tileByArchetype[archetype],atlas=sculptureImages.atlas;','const tile=CARD_ARCHETYPES[archetype].tile,atlas=sculptureImages.atlas;');p.write_text(s)
p=Path('work/app.js');s=p.read_text();s=s.replace('reliefAssets','archetypeAssets').replace('const surfaceTextures=new Set();let contactMaps=[];','const surfaceTextures=new Set();');s=s.replace('const materialSet=new Set(),geometrySet=new Set(),labelCache=new Map();','const materialSet=new Set(),geometrySet=new Set();')
a=s.index('function contactTexture(');b=s.index('function buildScene()',a);s=s[:a]+s[b:]
s=s.replace('new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.055,150)','new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.18,100)')
s=s.replace('opacity:.34,depthWrite:false','opacity:.24,depthWrite:false')
a=s.index(' MAT.ivory=');b=s.index(' MAT.platinum=',a);s=s[:a]+s[b:]
a=s.index(' MAT.gold=');b=s.index(' const bodyGeometry=',a);s=s[:a]+''' archetypeAssets=CARD_ARCHETYPES;
''' +s[b:]
s=s.replace('const bodyGeometry=plate(),rimGeometry=rimPlate(),labelGeometry=registerGeometry(new THREE.PlaneGeometry(2.5,3.8));','const bodyGeometry=plate(),rimGeometry=rimPlate();')
a=s.index('  const relief=new THREE.Group();');b=s.index('  const faceMap=',a);s=s[:a]+s[b:]
a=s.index('  const labelMat=');b=s.index('  const back=new THREE.Mesh',a);s=s[:a]+s[b:]
s=s.replace('clearcoatRoughness:.6,transparent:true','clearcoatRoughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,transparent:true')
s=s.replace('clearcoatRoughness:.38,transparent:true','clearcoatRoughness:.38,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,transparent:true')
s=s.replace('group.userData={body,edge,relief,reliefMats,label,wire,back,face,cardNumber:','group.userData={body,edge,wire,back,face,cardNumber:')
s=s.replace('mix(12,5.8,liftLight)','mix(18.5,5.8,liftLight)')
s=s.replace('ground.material.opacity=.34*','ground.material.opacity=.24*')
s=s.replace('  d.relief.visible=false;d.label.visible=false;const printOpacity=','  const printOpacity=')
s=s.replace('  d.label.material.opacity=printOpacity;for(let j=0;j<d.reliefMats.length;j++)d.reliefMats[j].opacity=Math.min(1,artOpacity);','')
s=s.replace('labelCache.forEach(t=>t.dispose());','')
s=s.replace(' try{\n  const canvas=', ' try{\n  await loadSculptureImages();updateFallbackArt(drawn>=0?readings[drawn]:readings[19]);\n  const canvas=')
s=s.replace('  await loadSculptureImages();renderer=new THREE.WebGLRenderer','  renderer=new THREE.WebGLRenderer')
s=s.replace('function updateFallbackArt(r){\n const motifs=', '''function updateFallbackArt(r){
 if(sculptureImages){const texture=createSculptureFace(THREE,r[0],r[1],r[4]);const img=document.createElement('img');img.alt='';img.src=texture.image.toDataURL('image/webp',.92);$('fallback-art').replaceChildren(img);$('fallback-art').dataset.card=r[1];$('fallback-art').dataset.number=r[0];texture.dispose();return}
 const motifs=''')
p.write_text(s)
p=Path('work/template.html');s=p.read_text().replace('.fallback-art svg{width:80%;height:80%}', '.fallback-art svg{width:80%;height:80%}.fallback-art img{width:100%;height:100%;object-fit:cover;border-radius:inherit}');p.write_text(s)
p=Path('work/assemble.py');s=p.read_text().replace("(p/'reliefs.js').read_text()+'\\n'+(p/'card-print.js').read_text()", "(p/'card-print.js').read_text()");p.write_text(s)
