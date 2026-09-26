/* Collectible porcelain bas-reliefs, built entirely from shared Three.js geometry.
   Order: Fool, Magician, High Priestess, Moon, Star, Sun, World.
   Card size 2.5 × 3.8; front z=.052. Geometry reaches at most .20 above the face.
   API: buildReliefAssets(THREE) => Array<Array<{geometry, materialKey}>>. */
function buildReliefAssets(THREE) {
  const Z = 0.052, TAU = Math.PI * 2;
  const result = [];
  let pieces;
  function add(key, geometry, x = 0, y = 0, z = Z, rotation = 0) {
    geometry.rotateZ(rotation);
    geometry.translate(x, y, z);
    pieces[key].push(geometry);
  }
  function polygon(points) {
    const s = new THREE.Shape();
    points.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
    s.closePath();
    return s;
  }
  function extrude(shape, depth, bevel = .012) {
    return new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments: 16,
      bevelEnabled: bevel > 0, bevelSize: bevel,
      bevelThickness: bevel * .75, bevelSegments: 2
    });
  }
  function rect(x, y, w, h, depth, key, z = Z, rotation = 0, bevel = .009) {
    add(key, extrude(polygon([[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]),depth,bevel), x,y,z,rotation);
  }
  function disc(x, y, r, depth, key, z = Z, rTop = r) {
    const g = new THREE.CylinderGeometry(rTop,r,depth,64,1);
    g.rotateX(Math.PI / 2);
    add(key,g,x,y,z + depth/2);
  }
  function ribbon(x, y, rx, ry, width, depth, a, b, key, z = Z, rotation = 0) {
    const count = Math.max(10,Math.ceil(Math.abs(b-a)*14));
    const points = [];
    for(let j=0;j<=count;j++) { const t=a+(b-a)*j/count; points.push([Math.cos(t)*rx,Math.sin(t)*ry]); }
    for(let j=count;j>=0;j--) { const t=a+(b-a)*j/count; points.push([Math.cos(t)*(rx-width),Math.sin(t)*(ry-width)]); }
    add(key,extrude(polygon(points),depth,Math.min(.009,width*.12)),x,y,z,rotation);
  }
  function curveInlay(points, radius, key, z = Z) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2]??0)));
    add(key,new THREE.TubeGeometry(curve,Math.max(12,points.length*3),radius,5,false),0,0,z);
  }
  function archShape(w,h,t) {
    const left=-w/2, right=w/2, bottom=-h/2, shoulder=h/2-w/2;
    const s=new THREE.Shape();
    s.moveTo(left,bottom); s.lineTo(left,shoulder);
    s.absarc(0,shoulder,w/2,Math.PI,0,true);
    s.lineTo(right,bottom); s.lineTo(right-t,bottom);
    s.lineTo(right-t,shoulder);
    s.absarc(0,shoulder,w/2-t,0,Math.PI,false);
    s.lineTo(left+t,bottom); s.closePath();
    return s;
  }
  function squareFrame(size, thickness, depth) {
    const outer=polygon([[-size/2,-size/2],[size/2,-size/2],[size/2,size/2],[-size/2,size/2]]);
    const r=size/2-thickness;
    const hole=new THREE.Path();
    hole.moveTo(-r,-r);hole.lineTo(-r,r);hole.lineTo(r,r);hole.lineTo(r,-r);hole.closePath();
    outer.holes.push(hole);
    return extrude(outer,depth,.008);
  }
  function crescentShape(radius, cutRadius, offset) {
    const ix=(radius*radius-cutRadius*cutRadius+offset*offset)/(2*offset);
    const iy=Math.sqrt(radius*radius-ix*ix);
    const outerAngle=Math.atan2(iy,ix), innerAngle=Math.atan2(iy,ix-offset);
    const points=[];
    for(let j=0;j<=56;j++){const a=outerAngle+(TAU-2*outerAngle)*j/56;points.push([radius*Math.cos(a),radius*Math.sin(a)]);}
    for(let j=0;j<=40;j++){const a=TAU-innerAngle-(TAU-2*innerAngle)*j/40;points.push([offset+cutRadius*Math.cos(a),cutRadius*Math.sin(a)]);}
    return polygon(points);
  }
  function merge(parts) {
    const source=parts.map(g=>g.index?g.toNonIndexed():g);
    const count=source.reduce((n,g)=>n+g.attributes.position.count,0);
    const merged=new THREE.BufferGeometry();
    for(const [name,size] of [['position',3],['normal',3],['uv',2]]) {
      const array=new Float32Array(count*size); let offset=0;
      for(const g of source) {if(g.attributes[name]) array.set(g.attributes[name].array,offset);offset+=g.attributes.position.count*size;}
      merged.setAttribute(name,new THREE.BufferAttribute(array,size));
    }
    merged.computeBoundingBox();merged.computeBoundingSphere();
    parts.forEach((g,i)=>{g.dispose();if(source[i]!==g)source[i].dispose();});
    return merged;
  }
  function begin(){pieces={ivory:[],platinum:[],gold:[],dark:[]};}
  function end(){result.push(Object.entries(pieces).filter(([,g])=>g.length).map(([materialKey,g])=>({geometry:merge(g),materialKey})));}

  // THE FOOL — an asymmetric stair ascending into an unfinished arch.
  begin();
  const stair=[[-.85,-1.12],[.73,-1.12],[.73,.09],[.42,.09],[.42,-.19],[.10,-.19],[.10,-.47],[-.22,-.47],[-.22,-.75],[-.54,-.75],[-.54,-.94],[-.85,-.94]];
  add('ivory',extrude(polygon(stair),.105,.017),0,0,Z);
  // Quiet tread inlays follow the actual steps, with no floating decorative dots.
  for(const [x,y,w] of [[-.695,-.94,.30],[-.38,-.75,.30],[-.06,-.47,.30],[.26,-.19,.30],[.575,.09,.29]])
    rect(x,y,w,.011,.008,'platinum',Z+.119,0,.001);
  ribbon(-.10,.29,.84,.86,.115,.067,.11,Math.PI*1.03,'ivory',Z+.010,-.10);
  ribbon(-.10,.29,.85,.87,.010,.006,.11,Math.PI*.91,'gold',Z+.087,-.10);
  rect(.81,.60,.26,.07,.115,'gold',Z+.003,-.25,.005);
  rect(-.07,-1.30,1.44,.006,.004,'platinum',Z+.002,0,.0005);
  end();

  // THE MAGICIAN — a precise staff through a stepped, diamond-shaped aperture.
  begin();
  rect(0,.05,.11,2.54,.064,'ivory',Z,0,.009);
  rect(0,.05,.018,2.66,.014,'gold',Z+.078,0,.002);
  add('ivory',squareFrame(1.16,.115,.050),0,.17,Z+.012,Math.PI/4);
  add('ivory',squareFrame(.91,.093,.075),0,.17,Z+.061,Math.PI/4);
  add('platinum',squareFrame(.706,.013,.008),0,.17,Z+.146,Math.PI/4);
  add('ivory',squareFrame(.655,.07,.029),0,.17,Z+.124,Math.PI/4);
  add('gold',extrude(polygon([[0,.17],[.095,0],[0,-.17],[-.095,0]]),.043,.005),0,1.22,Z+.019);
  rect(0,-1.32,.68,.061,.056,'ivory',Z,0,.008);
  rect(0,-1.36,.92,.009,.010,'platinum',Z+.023,0,.001);
  end();

  // THE HIGH PRIESTESS — a monumental double portal, with fluted stone piers.
  begin();
  add('ivory',extrude(archShape(1.72,2.55,.225),.118,.019),0,.10,Z+.006);
  add('ivory',extrude(archShape(1.10,2.08,.120),.064,.012),0,-.025,Z+.008);
  add('platinum',extrude(archShape(1.29,2.265,.012),.007,.001),0,.003,Z+.019);
  // The fluting sits on the piers, exposing the depth without overdecorating them.
  for(const x of [-.765,-.693,.693,.765]) rect(x,-.39,.010,1.29,.005,'platinum',Z+.139,0,.001);
  rect(0,-1.245,1.90,.116,.065,'ivory',Z,0,.010);
  rect(0,-1.337,1.66,.045,.037,'ivory',Z,0,.007);
  rect(0,-1.30,1.89,.011,.006,'gold',Z+.076,0,.001);
  rect(0,.09,.025,1.48,.012,'gold',Z+.014,0,.002);
  end();

  // THE MOON — a sculpted crescent with a satin metal inner edge.
  begin();
  add('ivory',extrude(crescentShape(.91,.81,.37),.137,.024),-.025,.24,Z+.004,-.19);
  // A second shallow terrace reads as carved porcelain on the convex side.
  const crescentTerrace=extrude(crescentShape(.78,.71,.29),.024,.012);
  add('ivory',crescentTerrace,-.112,.24,Z+.154,-.19);
  const moonInner=[];
  const r=.81, d=.37, intersect=(.91*.91-r*r+d*d)/(2*d), a=Math.acos((intersect-d)/r);
  for(let j=0;j<=34;j++) {const angle=a+(TAU-2*a)*j/34;const x=d+r*Math.cos(angle),y=r*Math.sin(angle);moonInner.push([x*Math.cos(-.19)-y*Math.sin(-.19)-.025,x*Math.sin(-.19)+y*Math.cos(-.19)+.24,.155]);}
  curveInlay(moonInner,.0055,'platinum');
  // One narrow metal wedge echoes the missing light, below the crescent.
  add('gold',extrude(polygon([[-.09,-.18],[.07,.21],[.12,-.18]]),.018,.003),.47,-.83,Z+.017,-.25);
  rect(-.30,-1.30,1.01,.009,.007,'platinum',Z+.006,-.045,.001);
  rect(.55,-1.34,.38,.009,.007,'platinum',Z+.006,-.045,.001);
  end();

  // THE STAR — folded, faceted porcelain. Each ridge catches a different light.
  begin();
  const starPositions={ivory:[],platinum:[],gold:[]};
  const center=[0,.19,.175], bottomZ=.006, valleyR=.355;
  function tri(key,a,b,c){starPositions[key].push(...a,...b,...c);}
  const tips=[], valleys=[];
  for(let i=0;i<8;i++) {
    const a=Math.PI/2+i*TAU/8, r=i%2===0?1.02:.80;
    tips.push([Math.cos(a)*r,Math.sin(a)*r*1.10+.19,.073]);
    valleys.push([Math.cos(a+Math.PI/8)*valleyR,Math.sin(a+Math.PI/8)*valleyR+.19,.035]);
  }
  for(let i=0;i<8;i++) {
    const tip=tips[i],v=valleys[i],next=tips[(i+1)%8];
    tri(i===2?'platinum':'ivory',center,tip,v);
    tri(i===6?'gold':'ivory',center,v,next);
    const tb=[tip[0],tip[1],bottomZ],vb=[v[0],v[1],bottomZ],nb=[next[0],next[1],bottomZ];
    tri('ivory',tip,tb,v);tri('ivory',v,tb,vb);tri('ivory',v,vb,next);tri('ivory',next,vb,nb);
    tri('ivory',[0,.19,bottomZ],vb,tb);tri('ivory',[0,.19,bottomZ],nb,vb);
  }
  for(const key of Object.keys(starPositions)) {
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(starPositions[key],3));g.computeVertexNormals();add(key,g);
  }
  rect(0,-1.265,1.32,.010,.007,'platinum',Z+.006,0,.001);
  rect(0,-1.35,.54,.005,.006,'gold',Z+.007,0,.001);
  end();

  // THE SUN — a stepped porcelain sunburst surrounding an offset polished disc.
  begin();
  const sunX=0, sunY=.22;
  disc(sunX,sunY,.565,.052,'ivory',Z,.540);
  disc(sunX,sunY,.455,.048,'ivory',Z+.057,.437);
  // Broad architectural rays alternate in length; each has a second raised tier.
  for(let i=0;i<16;i++) {
    const a=i*TAU/16, inner=.545, outer=i%2===0?1.065:.94;
    const spread=i%2===0?.089:.075;
    const ray=polygon([[inner*Math.cos(a-spread),inner*Math.sin(a-spread)],
      [outer*Math.cos(a-spread*.74),outer*Math.sin(a-spread*.74)],
      [outer*Math.cos(a+spread*.74),outer*Math.sin(a+spread*.74)],
      [inner*Math.cos(a+spread),inner*Math.sin(a+spread)]]);
    add('ivory',extrude(ray,i%2===0?.102:.069,.009),sunX,sunY,Z+.004);
    const mid=.78, end=outer-.048, half=.031;
    const tier=polygon([[mid*Math.cos(a-half),mid*Math.sin(a-half)],[end*Math.cos(a-half),end*Math.sin(a-half)],
      [end*Math.cos(a+half),end*Math.sin(a+half)],[mid*Math.cos(a+half),mid*Math.sin(a+half)]]);
    add(i%4===0?'platinum':'ivory',extrude(tier,.024,.004),sunX,sunY,Z+(i%2===0?.114:.081));
  }
  // One deliberately offset metal lens, set into a shallow porcelain ledge.
  disc(-.055,sunY+.048,.323,.032,'platinum',Z+.108,.312);
  disc(-.073,sunY+.062,.272,.014,'gold',Z+.141,.269);
  ribbon(-.055,sunY+.048,.342,.342,.011,.009,0,TAU-.001,'platinum',Z+.118);
  rect(0,-1.27,1.56,.010,.010,'platinum',Z+.011,.028,.001);
  rect(0,-1.365,.84,.036,.041,'ivory',Z,.028,.006);
  end();

  // THE WORLD — interrupted nested ellipses, opening like a layered threshold.
  begin();
  ribbon(0,.03,.90,1.36,.143,.104,-.98,Math.PI*1.38,'ivory',Z+.007,-.11);
  ribbon(0,.03,.689,1.11,.105,.077,-.87,Math.PI*1.33,'ivory',Z+.021,-.11);
  ribbon(0,.03,.533,.904,.053,.111,-.79,Math.PI*1.29,'ivory',Z+.012,-.11);
  ribbon(0,.03,.918,1.378,.012,.012,-.99,Math.PI*1.38,'platinum',Z+.069,-.11);
  ribbon(0,.03,.695,1.116,.012,.010,-.87,Math.PI*1.33,'gold',Z+.102,-.11);
  ribbon(0,.03,.536,.907,.010,.010,-.79,Math.PI*1.29,'platinum',Z+.133,-.11);
  // The displaced closing fragment makes the interruption intentional.
  add('ivory',extrude(polygon([[-.19,-.085],[.19,-.085],[.12,.085],[-.22,.085]]),.115,.012),.47,-1.125,Z+.010,-.28);
  rect(.45,-1.128,.33,.010,.010,'gold',Z+.140,-.28,.001);
  end();

  return result;
}
