function makeMesh(){
 const verts=[],indices=[],radius=.045,bevel=.0035,segments=10;
 // All surfaces share one rounded footprint. The faces sit on the real top
 // and bottom planes; a small rolled bevel meets the continuous cut edge.
 function outline(inset){
  const r=radius-inset,hx=CARD_W/2-inset,hy=CARD_H/2-inset,points=[];
  for(const [cx,cy,start] of [[hx-r,hy-r,0],[-hx+r,hy-r,90],[-hx+r,-hy+r,180],[hx-r,-hy+r,270]]){
   for(let j=0;j<=segments;j++){
    const a=(start+j*90/segments)*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
    points.push([cx+r*dx,cy+r*dy,dx,dy]);
   }
  }
  return points;
 }
 function vertex(x,y,z,nx,ny,nz){verts.push(x,y,z,nx,ny,nz,x/CARD_W+.5,y/CARD_H+.5);return verts.length/8-1;}
 const face=outline(bevel),count=face.length;
 for(const side of [1,-1]){
  const center=vertex(0,0,side*CARD_T/2,0,0,side),base=verts.length/8;
  for(const [x,y] of face)vertex(x,y,side*CARD_T/2,0,0,side);
  for(let i=0;i<count;i++){
   const a=base+i,b=base+(i+1)%count;
   if(side>0)indices.push(center,a,b);else indices.push(center,b,a);
  }
 }
 const profiles=[
  [bevel,CARD_T/2,.05,Math.sqrt(1-.05*.05)],
  [bevel*(1-Math.SQRT1_2),CARD_T/2-bevel*(1-Math.SQRT1_2),Math.SQRT1_2,Math.SQRT1_2],
  [0,CARD_T/2-bevel,1,0],
  [0,-CARD_T/2+bevel,1,0],
  [bevel*(1-Math.SQRT1_2),-CARD_T/2+bevel*(1-Math.SQRT1_2),Math.SQRT1_2,-Math.SQRT1_2],
  [bevel,-CARD_T/2,.05,-Math.sqrt(1-.05*.05)]
 ];
 const rimBase=verts.length/8;
 for(const [inset,z,radial,nz] of profiles)for(const [x,y,dx,dy] of outline(inset))vertex(x,y,z,dx*radial,dy*radial,nz);
 for(let j=0;j<profiles.length-1;j++)for(let i=0;i<count;i++){
  const a=rimBase+j*count+i,b=rimBase+j*count+(i+1)%count,c=a+count,d=b+count;
  indices.push(a,c,b,b,c,d);
 }
 return {v:new Float32Array(verts),i:new Uint16Array(indices)};
}
