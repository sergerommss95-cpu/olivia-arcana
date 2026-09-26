from pathlib import Path
p=Path(__file__).parent/'hero.js'
s=p.read_text()
s=s.replace(",slider=$('#scrub')", "")
s=s.replace("const knots=[0,.16,.34,.55,.77,1],order=[18,19,17,...Array.from({length:22},(_,i)=>i).filter(i=>![18,19,17].includes(i))];", "const knots=[0,.23,.46,.70,1],order=[18,19,17,2,21,...Array.from({length:22},(_,i)=>i).filter(i=>![18,19,17,2,21].includes(i))];")
s=s.replace('atlas,detail,back,loc={}', 'atlas,details={},back,loc={}')
a=s.index('function makeTracks()')
b=s.index('function poseAt',a)
s=s[:a]+'''// Every resolved image is composed in screen space, then placed at real optical depth.
function anchor(sx,sy,height,z,rx=0,ry=0,rz=0,bend=.018){
 const vh=2*(10.4-z)*Math.tan(19*Math.PI/180);
 return [(sx-.5)*vh*w/h,(.5-sy)*vh,z,rx,ry,rz,height*vh/2,bend,0];
}
function makeTracks(){
 const portrait=w/h<.8,compact=w/h<1.25;
 tracks=order.map((id,i)=>{
  const u=i/21;
  const stack=anchor(portrait?.57:compact?.64:.66,portrait?.415:.47,portrait?.405:compact?.59:.67,1.8,-.12,-.38,-.14);
  stack[0]-=i*.011;stack[1]+=i*.005;stack[2]-=i*.024;stack[5]+=i*.0014;
  // Two banks separate at unequal depths, opening a passage between them.
  const left=i%2===0,j=Math.floor(i/2),v=j/10;
  const opening=left?
   anchor(portrait?.18:.225,portrait?.57:.56,portrait?.46:.67,2.4-j*.046,.10,.60+v*.16,-.26+v*.20):
   anchor(portrait?.80:.795,portrait?.36:.38,portrait?.32:.48,-1.9-j*.055,-.13,-.48-v*.14,.23-v*.14);
  opening[0]+=(left?-1:1)*j*.045;opening[1]+=j*.017;
  // An unequal field: a few large presences, the other cards folded into the distance.
  const fieldAnchors=portrait?[
    [.67,.49,.43,2.5,-.10,-.22,-.12],
    [.24,.27,.235,-1.8,.14,.30,.20],
    [.22,.73,.195,-3.3,-.17,-.40,-.20],
    [.82,.16,.125,-5.2,.08,-.66,-.05],
    [.85,.84,.14,-4,.14,.30,.12]
  ]:[
    [.67,.48,compact?.53:.64,2.5,-.10,-.22,-.12],
    [.23,.30,.30,-1.8,.14,.30,.20],
    [.27,.77,.235,-3.3,-.17,-.40,-.20],
    [.80,.135,.16,-5.2,.08,-.66,-.05],
    [.86,.82,.18,-4,.14,.30,.12]
  ];
  let field;
  if(i<5)field=anchor(...fieldAnchors[i]);
  else {const cluster=(i-5)%3,k=Math.floor((i-5)/3);const a=fieldAnchors[cluster+1];
   field=anchor(a[0]+(cluster===1?-.013:.015)*(k+1),a[1]-.014*(k+1),a[2]*(.89-k*.017),a[3]-.38*(k+1),a[4],a[5]+.10*(k+1),a[6]-.027*(k+1));}
  // A diagonal crossing recedes more than twelve world units through the scene.
  const t=Math.pow(u,.66),sx=mix(-.06,.90,t),sy=mix(.96,.17,t)-Math.sin(t*Math.PI)*.13;
  const crossing=anchor(sx,sy,(portrait?.57:.93)*Math.exp(-2.3*t),3.8-12*t,
   -.12+.22*Math.sin(t*5),i===0?2.85:(i%3===0?2.75:.20+Math.sin(i*1.4)*.65),-.24+.4*t,.018);
  // Resolve with a close Moon and restrained, asymmetric echoes.
  let end;
  if(i===0)end=anchor(portrait?.61:compact?.66:.68,portrait?.355:.475,portrait?.395:compact?.59:.69,2.4,-.07,-.23,-.115);
  else if(i===1)end=anchor(portrait?.18:.32,portrait?.19:.16,portrait?.14:.19,-4.4,.20,.40,.22);
  else if(i===2)end=anchor(portrait?.88:.93,portrait?.54:.79,portrait?.125:.20,-3.5,-.14,-.47,-.17);
  else if(i===3)end=anchor(portrait?.18:.45,portrait?.56:.87,portrait?.09:.13,-5.2,.13,2.7,.13);
  else if(i===4)end=anchor(portrait?.89:.90,portrait?.16:.23,portrait?.11:.15,-6,-.11,2.8,-.20);
  else {const k=i-5;const lead=anchor(portrait?.65:compact?.70:.72,portrait?.365:.48,portrait?.28:compact?.44:.49,-1-k*.07,-.12,-.62+k*.027,-.25+k*.012);
   lead[0]+=.009*k;lead[1]+=.018*k;end=lead;}
  const keys=[stack,opening,field,crossing,end];
  const tangents=keys.map((v,k)=>v.map((_,c)=>k===0||k===keys.length-1?0:.38*(keys[k+1][c]-keys[k-1][c])/(knots[k+1]-knots[k-1])));
  return {id,keys,tangents};
 });
}
''' + s[b:]
s=s.replace('float light=.87+.16*max(0.,dot(n,normalize(vec3(-.5,.8,2.5))));', 'float light=.60+.49*max(0.,dot(n,normalize(vec3(-.5,.8,2.5))));')
s=s.replace('vec3(.50,.49,.42)*edge*spec*.20','vec3(.60,.48,.29)*edge*spec*.30')
s=s.replace('col=vec3(.09,.10,.15)+vec3(.13,.13,.13)*max', 'col=vec3(.055,.059,.10)+vec3(.21,.18,.12)*max')
s=s.replace("const progress=quiet?.77:p,zoom=mobile?10.9:10.4", "const progress=quiet?1:p,zoom=10.4")
s=s.replace('progress/.16','progress/.23')
s=s.replace("gl.uniform1f(loc.uDetailed,id===18?1:0);gl.drawElements", "gl.uniform1f(loc.uDetailed,details[id]?1:0);if(details[id]){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,details[id]);}gl.drawElements")
a=s.index(" frames++;$('#line')")
b=s.index(' diagnostics.error=',a)
s=s[:a]+''' frames++;updateCopy(progress);
''' + s[b:]
a=s.index("function wake()")
s=s[:a]+'''const intro=$('#intro'),openingType=$('#opening-type'),intertitle=$('#intertitle'),closing=$('#closing');
const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)};
function updateCopy(progress){
 const opening=1-smooth(.025,.16,progress),middle=smooth(.29,.37,progress)*(1-smooth(.45,.53,progress)),end=smooth(.85,.965,progress);
 openingType.style.opacity=String(opening);openingType.style.transform=`translateY(${-progress*40}px)`;
 intro.style.opacity=String(opening);intro.style.transform=`translateY(${-20*(1-opening)}px)`;intro.setAttribute('aria-hidden',String(opening<.1));
 intertitle.style.opacity=String(middle*.70);intertitle.style.transform=`translateY(${(1-middle)*20}px)`;
 closing.style.opacity=String(end);closing.style.transform=`translateY(${(1-end)*18}px)`;closing.inert=end<.5;closing.setAttribute('aria-hidden',String(end<.5));
 $('#line').style.transform=`scaleX(${progress})`;$('#scroll-label').textContent=progress>.93?'A WORLD WITHIN YOU':'SCROLL TO UNFOLD';
}
''' + s[a:]
s=s.replace("slider.addEventListener('input',()=>{setProgress(+slider.value/1000);});\n", "")
a=s.index("$('#restart').addEventListener")
b=s.index("addEventListener('scroll'",a)
s=s[:a]+s[b:]
s=s.replace('[atlas,detail,back]','[atlas,...Object.values(details),back]')
s=s.replace("const images=await Promise.all([load(ATLAS_DATA),load(MOON_DATA)]);", "const ids=Object.keys(DETAIL_DATA),images=await Promise.all([load(ATLAS_DATA),...ids.map(id=>load(DETAIL_DATA[id]))]);")
s=s.replace('detail=texture(images[1],1,false);','details={};ids.forEach((id,i)=>{details[id]=texture(images[i+1],1,false)});')
s=s.replace("document.documentElement.classList.add('fallback');", "document.documentElement.classList.add('fallback');document.documentElement.classList.add('quiet');updateCopy(1);$('#motion').hidden=true;")
s=s.replace("window.motionStudy={setProgress", "window.motionStudy={setProgress")
p.write_text(s)
