/* Sculpted intaglio / low relief. Order: Fool, Magician, Priestess, Moon, Star,
   Sun, World. All artwork lives inside the engraved central field of a 2.5×3.8
   card. Surfaces rise continuously from z=.052, never above z=.15.
   Each asset contains merged {geometry, materialKey} meshes. Ivory additionally
   carries a subtle linear vertex-color cavity gradient; other materials do not. */
function buildReliefAssets(THREE) {
  const Z=.052, PI=Math.PI, TAU=PI*2, assets=[];
  let pieces;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
  const vec=(x,y,z=0)=>new THREE.Vector3(x,y,z);
  function begin(){pieces={ivory:[],platinum:[],gold:[],dark:[]};}
  function add(key,g){pieces[key].push(g);}
  function geometry(positions,indices){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  }
  // A soft, convex cross-section between two authored boundaries. There are no
  // vertical extrusion walls: all edges meet the face at a grazing tangent.
  function surface(boundaryA,boundaryB,height,steps=56,cross=10){
    const positions=[],indices=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,a=boundaryA(t),b=boundaryB(t),h=typeof height==='function'?height(t):height;
      for(let j=0;j<=cross;j++){
        const v=j/cross,cap=Math.pow(Math.max(0,Math.sin(PI*v)),1.45);
        positions.push(a.x+(b.x-a.x)*v,a.y+(b.y-a.y)*v,Z+a.z+(b.z-a.z)*v+h*cap);
      }
    }
    for(let i=0;i<steps;i++)for(let j=0;j<cross;j++){
      const a=i*(cross+1)+j,b=a+cross+1;indices.push(a,b,b+1,a,b+1,a+1);
    }
    return geometry(positions,indices);
  }
  // Swept ribbons taper in plan and in height; they read as carved surfaces.
  function sweep(path,width,height,key='ivory',steps=48,cross=10){
    function edge(t,side){
      const p=path(t),a=path(Math.max(0,t-.0002)),b=path(Math.min(1,t+.0002));
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const w=typeof width==='function'?width(t):width;
      return vec(p.x-dy/len*w*side,p.y+dx/len*w*side,p.z);
    }
    // Right boundary first preserves upward-facing triangle winding.
    add(key,surface(t=>edge(t,-1),t=>edge(t,1),height,steps,cross));
  }
  function catmull(points){const c=new THREE.CatmullRomCurve3(points.map(p=>vec(...p)),false,'centripetal');return t=>c.getPoint(t);}
  function arc(cx,cy,rx,ry,a,b,depth=.001,rotation=0){
    return t=>{const q=a+(b-a)*t,x=rx*Math.cos(q),y=ry*Math.sin(q);return vec(cx+x*Math.cos(rotation)-y*Math.sin(rotation),cy+x*Math.sin(rotation)+y*Math.cos(rotation),depth)};
  }
  function taper(t,power=.7){return Math.pow(Math.max(.0001,Math.sin(PI*t)),power);}
  function inlay(path,key='platinum',width=.0026,steps=48){sweep(path,t=>width*(.35+.65*taper(t,.35)),.0022,key,steps,4);}
  // A radial height field supplies the dome and the continuous eight-point star.
  function radial(cx,cy,outline,height,key='ivory',around=112,rings=18){
    const positions=[cx,cy,Z+height(0,0)],indices=[];
    for(let r=1;r<=rings;r++)for(let i=0;i<=around;i++){
      const a=i/around*TAU,t=r/rings,R=outline(a)*t;
      positions.push(cx+Math.cos(a)*R,cy+Math.sin(a)*R,Z+height(t,a));
    }
    for(let i=0;i<around;i++)indices.push(0,1+i,2+i);
    for(let r=0;r<rings-1;r++)for(let i=0;i<around;i++){
      const a=1+r*(around+1)+i,b=a+around+1;indices.push(a,b,b+1,a,b+1,a+1);
    }
    const g=geometry(positions,indices);g.attributes.normal.setXYZ(0,0,0,1);add(key,g);
  }
  function merge(list,key){
    const all=list.map(g=>g.index?g.toNonIndexed():g),count=all.reduce((s,g)=>s+g.attributes.position.count,0),out=new THREE.BufferGeometry();
    for(const name of ['position','normal']){
      const values=new Float32Array(count*3);let offset=0;
      for(const g of all){values.set(g.attributes[name].array,offset);offset+=g.attributes.position.count*3;}
      out.setAttribute(name,new THREE.BufferAttribute(values,3));
    }
    out.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(count*2),2));
    if(key==='ivory'){
      const colors=new Float32Array(count*3),positions=out.attributes.position.array;
      for(let i=0;i<count;i++){
        // Linear-space multiplier: only the foot of the sculpture is shaded.
        const value=.74+.26*ease((positions[i*3+2]-Z)/.047);
        colors[i*3]=colors[i*3+1]=colors[i*3+2]=value;
      }
      out.setAttribute('color',new THREE.BufferAttribute(colors,3));
    }
    out.computeBoundingBox();out.computeBoundingSphere();
    list.forEach((g,i)=>{g.dispose();if(g!==all[i])all[i].dispose()});return out;
  }
  function end(){assets.push(Object.entries(pieces).filter(([,gs])=>gs.length).map(([materialKey,gs])=>({geometry:merge(gs,materialKey),materialKey})));}

  // THE FOOL — one unfinished porcelain gesture, released into open space.
  begin();
  const journey=catmull([[-.53,-.89,.001],[-.67,-.39,.001],[-.62,.21,.001],[-.35,.72,.001],[.16,.88,.001],[.55,.63,.001],[.60,.19,.001],[.39,-.03,.001]]);
  sweep(journey,t=>.055*taper(t,.65)*(1+.40*Math.sin(PI*t)),t=>.041*taper(t,.50),'ivory',76,12);
  inlay(t=>{const p=journey(.09+t*.80);p.x-=.018;p.z=.012+.027*Math.sin(PI*(.09+t*.8));return p},'platinum',.0024,58);
  // Three small curving steps are engraved suggestions, rather than blocks.
  for(let j=0;j<3;j++){
    const p=catmull([[-.29+j*.15,-.73+j*.22,.001],[.00+j*.15,-.66+j*.22,.001],[.19+j*.15,-.57+j*.22,.001]]);
    sweep(p,t=>.013*taper(t),t=>.012*taper(t),'ivory',26,6);
  }
  inlay(arc(.37,.89,.075,.045,.1,2.8,.003,-.38),'gold',.003,24);
  end();

  // THE MAGICIAN — a tapered staff crossing a single, softly carved vesica.
  begin();
  const stem=t=>vec(-.018+.021*Math.sin(PI*t),-1.04+2.10*t,.001);
  sweep(stem,t=>.022*taper(t,.48),t=>.030*taper(t,.50),'ivory',58,10);
  inlay(t=>{const p=stem(.05+t*.9);p.x+=.009;p.z=.010+.016*taper(t,.55);return p},'gold',.0023,48);
  const vesica=t=>{
    const a=t*TAU;
    return vec(.46*Math.sin(a),.09+.57*Math.cos(a),.001);
  };
  sweep(vesica,t=>.024+.020*Math.pow(Math.abs(Math.sin(TAU*t)),.65),t=>.041+.013*Math.pow(Math.abs(Math.sin(TAU*t)),.65),'ivory',88,12);
  inlay(arc(0,.09,.412,.525,-.94,2.31,.006),'platinum',.0027,46);
  end();

  // THE HIGH PRIESTESS — reeded architectural stone, continuous around the arch.
  begin();
  function portal(radius,bottom,shoulder){
    const rise=shoulder-bottom,arch=PI*radius,total=rise*2+arch;
    return t=>{const distance=t*total;
      if(distance<rise)return vec(-radius,bottom+distance,.001);
      if(distance<rise+arch){const a=PI-(distance-rise)/radius;return vec(radius*Math.cos(a),shoulder+radius*Math.sin(a),.001)}
      return vec(radius,shoulder-(distance-rise-arch),.001);
    };
  }
  const outer=portal(.575,-.91,.36);
  sweep(outer,t=>.068*(.35+.65*taper(t,.30)),t=>.052*taper(t,.28),'ivory',100,16);
  const inner=portal(.354,-.87,.265);
  sweep(inner,t=>.028*(.35+.65*taper(t,.30)),t=>.026*taper(t,.28),'ivory',80,10);
  inlay(portal(.455,-.89,.302),'platinum',.0027,88);
  // One light cut follows the crest of each broad reeded pier and vault.
  inlay(t=>{const p=outer(.035+.93*t);p.z=.028+.021*taper(t,.28);return p},'gold',.0022,88);
  end();

  // THE MOON — a single uninterrupted crescent, modelled like a carved cameo.
  begin();
  const R=.755,r=.699,d=.328;
  const intersect=(R*R-r*r+d*d)/(2*d),iy=Math.sqrt(R*R-intersect*intersect);
  const ao=Math.atan2(iy,intersect),ai=Math.atan2(iy,intersect-d),rot=-.19;
  function moonPoint(t,inner){
    const a=inner?ai+(TAU-2*ai)*t:ao+(TAU-2*ao)*t;
    const x=(inner?d:0)+(inner?r:R)*Math.cos(a),y=(inner?r:R)*Math.sin(a);
    return vec(x*Math.cos(rot)-y*Math.sin(rot)-.015,x*Math.sin(rot)+y*Math.cos(rot)+.075,.001);
  }
  // Outer edge first, inner edge second gives a counterclockwise visible face.
  add('ivory',surface(t=>moonPoint(t,false),t=>moonPoint(t,true),t=>.076*taper(t,.35),76,18));
  inlay(t=>{
    const u=.045+t*.91,a=moonPoint(u,false),b=moonPoint(u,true),v=.81;
    return vec(a.x+(b.x-a.x)*v,a.y+(b.y-a.y)*v,.001+.076*taper(u,.35)*Math.pow(Math.sin(PI*v),1.45)+.001);
  },'platinum',.0025,70);
  inlay(arc(.07,-.84,.32,.10,PI*.06,PI*.91,.002,-.06),'gold',.0023,30);
  end();

  // THE STAR — a single soft eight-point intaglio with a narrow polished ridge.
  begin();
  const starRadius=a=>.112+.716*(.82+.18*Math.cos(4*a))*Math.pow(Math.abs(Math.cos(4*a)),5.6);
  radial(0,.045,starRadius,(t,a)=>.002+.075*Math.pow(Math.max(0,1-t*t),1.85),'ivory',192,22);
  // Hairline seams follow two rays; no faceted metallic wedges.
  for(const [a,key] of [[PI/2,'platinum'],[PI/4,'gold']]){
    const length=starRadius(a)*.86;
    inlay(t=>{const d=.035+(length-.035)*t,u=d/starRadius(a);return vec(Math.cos(a)*d,Math.sin(a)*d+.045,.002+.075*Math.pow(1-u*u,1.85)+.001)},key,.0022,36);
  }
  end();

  // THE SUN — a shallow ivory cabochon held by twenty curved, tapering flames.
  // Every flame is a continuous convex surface; there are no extruded ray blocks.
  begin();
  const sy=.055;
  radial(-.018,sy+.012,()=>.283,(t)=>.002+.073*Math.pow(Math.max(0,1-t*t),1.62),'ivory',96,22);
  for(let i=0;i<20;i++){
    const a=i*TAU/20+.027,outer=i%2===0?.823:.736;
    const flame=t=>{
      const radius=.338+(outer-.338)*t,angle=a+.14*Math.sin(PI*t)-.025*t;
      return vec(Math.cos(angle)*radius,sy+Math.sin(angle)*radius,.001);
    };
    sweep(flame,t=>.0305*taper(t,.79)*(1-.34*t),t=>.038*taper(t,.64),'ivory',34,10);
    // Four fine vein accents tie the rays to the metal setting without glare.
    if(i%5===1)inlay(t=>{
      const u=.15+t*.58,p=flame(u);p.z=.001+.038*taper(u,.64)+.001;return p;
    },i===6?'gold':'platinum',.0019,26);
  }
  // A single incomplete champagne setting leaves the dome visibly porcelain.
  inlay(arc(-.018,sy+.012,.298,.298,-.54,PI*1.58,.002),'gold',.0032,64);
  inlay(arc(-.018,sy+.012,.323,.323,PI*.15,PI*.82,.001),'platinum',.0021,28);
  end();

  // THE WORLD — two tapering, interleaved oval contours with an open lower seam.
  begin();
  const worldOuter=arc(0,.005,.635,.990,-.74,PI*1.36,.001,-.095);
  const worldInner=arc(.024,.005,.463,.793,-.60,PI*1.29,.001,-.095);
  sweep(worldOuter,t=>.036*taper(t,.48)*(.72+.28*Math.sin(PI*t)),t=>.045*taper(t,.40),'ivory',92,12);
  sweep(worldInner,t=>.024*taper(t,.54),t=>.027*taper(t,.48),'ivory',84,10);
  inlay(t=>{const u=.055+t*.85,p=worldOuter(u);p.z=.001+.045*taper(u,.4)+.001;return p},'platinum',.0023,78);
  inlay(t=>{const u=.13+t*.65,p=worldInner(u);p.z=.001+.027*taper(u,.48)+.001;return p},'gold',.0022,60);
  end();
  return assets;
}
