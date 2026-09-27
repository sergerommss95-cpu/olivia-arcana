// Embedded original artwork is decoded once before the scene's first frame.
const CARD_ARCHETYPES=[{name:'Fool',tile:6},{name:'Magician',tile:4},{name:'High Priestess',tile:1},{name:'Moon',tile:2},{name:'Star',tile:3},{name:'Sun',tile:0},{name:'World',tile:5}];
let sculptureImages=null;
async function loadSculptureImages(){
 const decode=async src=>{const img=new Image();img.src=src;await img.decode();return img};
 const images=await Promise.all([decode(SCULPTURE_ATLAS),decode(SCULPTURE_SUN)]);
 sculptureImages={atlas:images[0],sun:images[1]};
}
function createSculptureFace(THREE,numeral,title,archetype,density=1){
 const size=mobile?512:768,c=document.createElement('canvas');c.width=size;c.height=size*1.5;
 const ctx=c.getContext('2d');ctx.scale(size/1024,size/1024);
 // The seven authored families share a quiet ivory stock and individual titles.
 ctx.fillStyle='#e9e1d1';ctx.fillRect(0,0,1024,1536);
 const tile=CARD_ARCHETYPES[archetype].tile,atlas=sculptureImages.atlas;
 const sx=(tile%4)*atlas.width/4+3,sy=Math.floor(tile/4)*atlas.height/2+3,sw=atlas.width/4-6,sh=atlas.height/2-6;
 const panel=document.createElement('canvas');panel.width=768;panel.height=1152;const pc=panel.getContext('2d');
 if(archetype===5){const sun=sculptureImages.sun;pc.drawImage(sun,0,0,sun.width,sun.height,0,0,768,1152)}
 else pc.drawImage(atlas,sx,sy,sw,sh,0,0,768,1152);
 // Feather only the quiet paper perimeter; the sculpture remains crisp.
 pc.globalCompositeOperation='destination-in';const grad=pc.createLinearGradient(0,0,0,1152);grad.addColorStop(0,'transparent');grad.addColorStop(.075,'#fff');grad.addColorStop(.90,'#fff');grad.addColorStop(1,'transparent');pc.fillStyle=grad;pc.fillRect(0,0,768,1152);
 const side=pc.createLinearGradient(0,0,768,0);side.addColorStop(0,'transparent');side.addColorStop(.08,'#fff');side.addColorStop(.92,'#fff');side.addColorStop(1,'transparent');pc.fillStyle=side;pc.fillRect(0,0,768,1152);
 if(archetype===5)ctx.drawImage(panel,135,185,754,1131);else ctx.drawImage(panel,174,250,676,1014);
 const print=buildCardPrint(THREE,numeral,title,archetype,1);ctx.drawImage(print.ink.image,0,0,1024,1536);print.ink.dispose();
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 return texture;
}
