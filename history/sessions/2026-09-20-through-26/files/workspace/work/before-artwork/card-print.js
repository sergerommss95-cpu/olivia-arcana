/* Olivia Arcana — engraved card furniture.
   Call after document.fonts.ready. One transparent sRGB texture per identity.
   Canvas coordinates cover a 2.5 × 3.8 card, front-facing, with no baked lighting.
   API: buildCardPrint(THREE, numeral, title, archetype) => { ink: CanvasTexture }.
   archetype order: Fool, Magician, High Priestess, Moon, Star, Sun, World. */
function buildCardPrint(THREE, numeral, title, archetype = 0, density = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(1024*density); canvas.height = Math.round(1536*density);
  const c = canvas.getContext('2d'), W = 1024, H = 1536; c.scale(density,density);
  const ink = '#45443b', light = '#9c9581', metal = '#8c795b';
  c.lineCap = 'round'; c.lineJoin = 'round';
  const line = (points, width = 1.15, color = light, alpha = 1) => {
    c.save(); c.strokeStyle = color; c.lineWidth = width; c.globalAlpha = alpha;
    c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke(); c.restore();
  };
  const arc = (x,y,rx,ry,a,b,width=1,color=light,alpha=1) => {
    c.save(); c.strokeStyle=color; c.lineWidth=width; c.globalAlpha=alpha;
    c.beginPath(); c.ellipse(x,y,rx,ry,0,a,b); c.stroke(); c.restore();
  };
  function type(text, x, y, size, tracking=0, family='Cormorant Garamond', color=ink, weight=400) {
    c.save(); c.fillStyle=color; c.font=`${weight} ${size}px "${family}"`;
    c.textBaseline='alphabetic'; const letters=[...text];
    const width=letters.reduce((a,char)=>a+c.measureText(char).width,0)+Math.max(0,letters.length-1)*tracking;
    let left=x-width/2;
    letters.forEach(char=>{c.fillText(char,left,y);left+=c.measureText(char).width+tracking}); c.restore();
  }
  function hairDiamond(x,y,r,color=metal) { line([[x,y-r],[x+r*.6,y],[x,y+r],[x-r*.6,y],[x,y-r]],1.1,color); }
  // The clipped shoulder and small return replace generic crop-mark corners.
  // The top edge opens around the numeral; the lower rail opens around the imprint.
  function frame(inset, width, alpha) {
    const l=inset, r=W-inset, t=inset+4, b=H-inset-4, k=38;
    line([[390,t],[l+k,t],[l+k,t+9],[l+18,t+9],[l+18,t+24],[l,t+k],[l,b-k],[l+18,b-24],[l+18,b-9],[l+k,b-9],[l+k,b],[401,b]],width,metal,alpha);
    line([[634,t],[r-k,t],[r-k,t+9],[r-18,t+9],[r-18,t+24],[r,t+k],[r,b-k],[r-18,b-24],[r-18,b-9],[r-k,b-9],[r-k,b],[623,b]],width,metal,alpha);
  }
  frame(62,1.6,.82); frame(77,1,.48);
  // Delicate open brackets make the numeral a small, intentional engraved plate.
  line([[440,88],[427,88],[427,140],[440,140]],1.15,metal,.8);
  line([[584,88],[597,88],[597,140],[584,140]],1.15,metal,.8);
  type(String(numeral),512,132,47,1.5,'Cormorant Garamond',ink);
  type('OLIVIA ARCANA',512,200,13.5,4.4,'DM Sans','#817865');
  line([[442,227],[582,227]],1,metal,.65);
  hairDiamond(512,227,4.5);

  // Margin engraving. Deliberately small and light: the geometry owns the image.
  // Each family gets a different rhythm, avoiding a repeated circular medallion.
  c.save();
  c.beginPath(); c.rect(105,280,814,919); c.clip();
  const a=((Number(archetype)||0)%7+7)%7;
  if (a===0) {
    // A stepped open path: a rising sequence that dissolves into fine hatch.
    for(let i=0;i<10;i++) {
      const x=145+i*10, y=1000-i*37;
      line([[x,y+32],[x,y],[x+17,y]],.95,light,.68-i*.025);
    }
    for(let i=0;i<13;i++)line([[842,441+i*13],[858+(i%3)*4,436+i*13]],.9,light,.66);
    arc(470,681,369,397,3.8,4.69,1,light,.36);
  } else if(a===1) {
    // Two offset plumb marks around the Magician's vertical sculpture.
    line([[162,390],[162,754]],1,light,.65);
    line([[179,440],[179,754]],.7,light,.46);
    for(let i=0;i<16;i++)line([[151-i%3*3,411+i*20],[169,411+i*20]],.85,light,.63);
    line([[852,664],[852,1052]],1,light,.65);
    for(let i=0;i<13;i++)line([[845,718+i*20],[864+i%3*3,718+i*20]],.85,light,.63);
    hairDiamond(852,646,6);
  } else if(a===2) {
    // Architectural voussoirs, visible outside the threshold sculpture.
    for(let i=0;i<17;i++) {
      const angle=Math.PI*1.15+i*.043;
      line([[512+Math.cos(angle)*355,733+Math.sin(angle)*429],[512+Math.cos(angle)*372,733+Math.sin(angle)*449]],.85,light,.52);
    }
    line([[151,823],[151,1082],[245,1082]],1,light,.55);
    line([[873,823],[873,1082],[826,1082]],1,light,.55);
    line([[145,1095],[233,1095]],.8,light,.4);
  } else if(a===3) {
    // One interrupted nocturnal contour with engraving at its lower limb.
    arc(508,742,369,394,.05,.9,1.05,light,.58);
    arc(508,742,382,406,.08,.78,.7,light,.4);
    arc(508,742,369,394,3.30,4.12,1.05,light,.58);
    for(let i=0;i<21;i++) {
      const angle=.16+i*.025;
      line([[508+Math.cos(angle)*379,742+Math.sin(angle)*405],[508+Math.cos(angle)*390,742+Math.sin(angle)*416]],.9,light,.62);
    }
  } else if(a===4) {
    // Sparse etched constellation: hierarchy comes from spacing, never particles.
    line([[150,966],[181,864],[151,671]],.9,light,.54);
    line([[856,485],[878,631],[847,790]],.9,light,.54);
    [[150,966],[151,671],[856,485],[847,790]].forEach(([x,y])=>hairDiamond(x,y,3.8,light));
    for(let i=0;i<8;i++)line([[859+i*2.1,879+i*13],[867+i*2.1,881+i*13]],.85,light,.54);
  } else if(a===5) {
    // Sun: engraved rays just outside the cast relief, asymmetrically cropped.
    for(let i=0;i<34;i++) {
      const angle=-Math.PI*.97+i*.087;
      if((angle>-.4&&angle<.35)||(angle>1.27&&angle<1.95))continue;
      const radius=343, length=i%4===0?25:11;
      line([[512+Math.cos(angle)*radius,736+Math.sin(angle)*radius],[512+Math.cos(angle)*(radius+length),736+Math.sin(angle)*(radius+length)]],i%4===0?1.15:.85,light,.55);
    }
    // Parallel graver strokes on the quiet lower-left quadrant.
    for(let i=0;i<9;i++)line([[161+i*4,986+i*8],[174+i*4,977+i*8]],.8,light,.45);
  } else {
    // World: open meridian fragments, offset to leave the inner ellipse untouched.
    arc(519,726,363,408,2.67,3.73,1,light,.56);
    arc(519,726,378,421,2.78,3.58,.85,light,.4);
    arc(519,726,363,408,-.73,.35,1,light,.56);
    for(let i=0;i<13;i++) {
      const ang=2.84+i*.036;
      line([[519+Math.cos(ang)*370,726+Math.sin(ang)*416],[519+Math.cos(ang)*383,726+Math.sin(ang)*430]],.85,light,.6);
    }
  }
  c.restore();

  // Title cartouche is held between broken rules. The large serif identifies a
  // collectible object; the imprint is subordinate, legible only when approached.
  const name=String(title).replace(/^The\s+/i,'');
  line([[160,1248],[436,1248]],1.15,metal,.77);
  line([[588,1248],[864,1248]],1.15,metal,.77);
  line([[177,1256],[407,1256]],.7,light,.53);
  line([[617,1256],[847,1256]],.7,light,.53);
  type(/^The\s/i.test(title)?'THE':'',512,1255,13.5,4,'DM Sans',metal);
  let size=62;
  c.font=`400 ${size}px "Cormorant Garamond"`;
  while(c.measureText(name).width>720&&size>39){size--;c.font=`400 ${size}px "Cormorant Garamond"`;}
  type(name,512,1330,size,.4,'Cormorant Garamond',ink);
  line([[355,1363],[460,1363]],.85,metal,.68);
  line([[564,1363],[669,1363]],.85,metal,.68);
  hairDiamond(512,1363,5.5);
  type('MAJOR ARCANA',512,1427,12.5,3.5,'DM Sans','#88806d');
  type('OLIVIA',512,1476,15.5,4.2,'Cormorant Garamond','#756d5c');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.name = `Olivia / ${numeral} / ${title} / intaglio`;
  return { ink:texture };
}

/* Shared reverse print. Transparent champagne intaglio for graphite satin.
   Two seven-strand elliptic ribbons alternate over/under at their crossings;
   the interruptions are geometry, so there are no opaque patches or highlights.
   API: buildCardBack(THREE) => { ink: CanvasTexture }. */
function buildCardBack(THREE) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
  const c=canvas.getContext('2d'),TAU=Math.PI*2;
  c.lineCap='round';c.lineJoin='round';
  const champagne='#cbb587', quiet='#b5a07c';
  const stroke=(points,width=1,color=champagne,alpha=.7)=>{
    c.save();c.strokeStyle=color;c.lineWidth=width;c.globalAlpha=alpha;c.beginPath();
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
  };
  // A restrained printer's frame, related to the front's clipped shoulders.
  [62,77].forEach((inset,i)=>{
    const l=inset,r=1024-inset,t=inset+4,b=1536-inset-4,k=38;
    stroke([[454,t],[l+k,t],[l+k,t+9],[l+18,t+9],[l+18,t+24],[l,t+k],[l,b-k],[l+18,b-24],[l+18,b-9],[l+k,b-9],[l+k,b],[454,b]],i?1:1.7,champagne,i?.30:.56);
    stroke([[570,t],[r-k,t],[r-k,t+9],[r-18,t+9],[r-18,t+24],[r,t+k],[r,b-k],[r-18,b-24],[r-18,b-9],[r-k,b-9],[r-k,b],[570,b]],i?1:1.7,champagne,i?.30:.56);
  });
  function lozenge(x,y,r,width=1.25,alpha=.7){stroke([[x,y-r],[x+r*.53,y],[x,y+r],[x-r*.53,y],[x,y-r]],width,champagne,alpha)}
  lozenge(512,73,12,1.35,.7);lozenge(512,1463,12,1.35,.7);
  stroke([[484,73],[463,73]],1,quiet,.48);stroke([[540,73],[561,73]],1,quiet,.48);
  stroke([[484,1463],[463,1463]],1,quiet,.48);stroke([[540,1463],[561,1463]],1,quiet,.48);

  // Outer silhouette: a narrow, pointed cartouche with generous quiet margins.
  for(let i=0;i<2;i++) {
    const v=i*13;c.save();c.strokeStyle=champagne;c.globalAlpha=i?.27:.47;c.lineWidth=i?.9:1.5;
    c.beginPath();c.moveTo(512,208-v);c.bezierCurveTo(718+v,424,836+v,616,836+v,768);
    c.bezierCurveTo(836+v,920,718+v,1112,512,1328+v);
    c.bezierCurveTo(306-v,1112,188-v,920,188-v,768);
    c.bezierCurveTo(188-v,616,306-v,424,512,208-v);c.stroke();c.restore();
  }
  // Exact parametric crossings, with an alternate strand passing underneath.
  function ribbon(theta,underVertical) {
    for(let strand=0;strand<7;strand++) {
      const rx=181+strand*7.2,ry=420+strand*7.2,co=Math.cos(theta),si=Math.sin(theta);
      const crossing=underVertical?Math.atan2(rx*co,ry*si):Math.atan2(-rx*si,ry*co);
      const gap=underVertical?.039:.066;
      c.save();c.strokeStyle=champagne;c.globalAlpha=strand===0||strand===6?.75:.34;
      c.lineWidth=strand===0||strand===6?1.65:1.1;c.beginPath();let started=false;
      for(let i=0;i<=800;i++) {
        const t=i/800*TAU;
        const d=Math.abs(Math.atan2(Math.sin(2*(t-crossing)),Math.cos(2*(t-crossing))))*.5;
        if(d<gap){started=false;continue;}
        const x=512+rx*Math.cos(t)*co-ry*Math.sin(t)*si;
        const y=768+rx*Math.cos(t)*si+ry*Math.sin(t)*co;
        if(started)c.lineTo(x,y);else{c.moveTo(x,y);started=true;}
      }
      c.stroke();c.restore();
    }
  }
  ribbon(.36,false);ribbon(-.36,true);
  // Tiny pierced endpoints give the engraving an authored finish.
  lozenge(512,252,9,1.25,.55);lozenge(512,1284,9,1.25,.55);
  [[171,768],[853,768]].forEach(([x,y])=>{
    lozenge(x,y,7,1.2,.65);stroke([[x,y-28],[x,y-15]],.8,quiet,.45);stroke([[x,y+15],[x,y+28]],.8,quiet,.45);
  });
  // The monogram sits in the ribbons' open centre, never on a painted medallion.
  c.save();c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle=champagne;c.globalAlpha=.83;
  c.font='400 103px "Cormorant Garamond"';c.fillText('O',488,792);c.fillText('A',532,811);
  c.globalAlpha=.51;c.font='400 12.5px "DM Sans"';const word='ARCANA',tracking=4.1;
  let total=[...word].reduce((n,ch)=>n+c.measureText(ch).width,0)+(word.length-1)*tracking;
  let x=512-total/2;c.textAlign='left';for(const ch of word){c.fillText(ch,x,852);x+=c.measureText(ch).width+tracking}c.restore();
  stroke([[474,687],[496,687]],.85,quiet,.54);stroke([[528,687],[550,687]],.85,quiet,.54);lozenge(512,687,4.5,1,.65);
  stroke([[490,881],[534,881]],.85,quiet,.45);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.generateMipmaps=true;texture.anisotropy=4;texture.name='Olivia / shared reverse / woven intaglio';
  return {ink:texture};
}
