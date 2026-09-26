const CARD_W=1.1667,CARD_H=2,CARD_T=.011,COUNT=14;
const qstep=t=>{t=clamp(t);return t*t*t*(10+t*(-15+6*t));};
const ramp=(a,b,t)=>qstep((t-a)/(b-a));
const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s);
function rotate(m,v){return [m[0]*v[0]+m[4]*v[1]+m[8]*v[2],m[1]*v[0]+m[5]*v[1]+m[9]*v[2],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]];}
function makeTracks(){tracks=order.map((id,i)=>({id,i}));}
// One ordered, arc-length ribbon. Cards never interpolate between unrelated positions.
// Local axes start at U=X, H=Y, N=Z: this makes the closed packet a real normal stack.
function ribbon(progress){
 const t=progress,open=ramp(.015,.31,t)*(1-ramp(.80,1,t));
 const q=open,theta=Math.PI/2*q,kappa=q/(5*CARD_W),hw=CARD_W/2,hh=CARD_H/2,ht=CARD_T/2;
 const a=hw*Math.sin(theta)+ht*Math.cos(theta);
 const b=Math.hypot(hw*Math.cos(theta)+ht*Math.sin(theta),hh);
 const pitch=(2*a+mix(.001,.045,q)*CARD_W)/(1-kappa*b);
 const portrait=w/h<.8,small=h<650;
 const root=model([0,0,0,mix(-.12,.72,q),mix(-.34,-1.53,q),mix(-.13,portrait?1.08:-.40,q)+Math.sin(Math.PI*t)*.06,1]);
 const poses=[],centres=[];
 for(let i=0;i<COUNT;i++){
  const s=((COUNT-1)/2-i)*pitch,phi=kappa*s;
  const C=kappa>1e-8?[(1-Math.cos(phi))/kappa,0,Math.sin(phi)/kappa]:[0,0,s];
  const T=[Math.sin(phi),0,Math.cos(phi)],B=[Math.cos(phi),0,-Math.sin(phi)],V=[0,1,0];
  // A single controlled half-turn travels down the fully separated ribbon, then returns.
  const psi=Math.PI*(ramp(.34+i*.0115,.43+i*.0115,t)-ramp(.63+(COUNT-1-i)*.006,.71+(COUNT-1-i)*.006,t));
  const Bs=add(scale(B,Math.cos(psi)),scale(V,Math.sin(psi)));
  const Vs=add(scale(B,-Math.sin(psi)),scale(V,Math.cos(psi)));
  const U=add(scale(Bs,Math.cos(theta)),scale(T,-Math.sin(theta)));
  const N=add(scale(T,Math.cos(theta)),scale(Bs,Math.sin(theta)));
  const centre=rotate(root,C);centres.push(centre);
  poses.push({id:order[i],centre,U:rotate(root,U),H:rotate(root,Vs),N:rotate(root,N)});
 }
 // Fit a conservative swept envelope, independent of each card's turnover angle.
 // The framing therefore stays steady while the turnover propagates.
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const c of centres)for(let j=0;j<3;j++){min[j]=Math.min(min[j],c[j]);max[j]=Math.max(max[j],c[j]);}
 const mid=min.map((v,i)=>(v+max[i])/2),radius=Math.hypot(hw,hh,ht),tan=Math.tan(19*Math.PI/180),aspect=w/h;
 const sx=mix(portrait?.57:.65,.51,q),sy=mix(portrait?(small?.35:.40):.45,.49,q);
 const offset=[(sx-.5)*20.8*tan*aspect,(.5-sy)*20.8*tan,0];
 const desired=mix(portrait?(small?.33:.38):.46,.19,q)*10.4*tan;
 const left=mix(portrait?.10:.36,.07,q),right=.93,top=.125,bottom=mix(portrait?.63:.79,.86,q);
 function fits(k){for(const c of centres)for(const ex of [-1,1])for(const ey of [-1,1])for(const ez of [-1,1]){
  const x=(c[0]-mid[0]+ex*radius)*k+offset[0],y=(c[1]-mid[1]+ey*radius)*k+offset[1],z=(c[2]-mid[2]+ez*radius)*k;
  const px=.5+x/(2*(10.4-z)*tan*aspect),py=.5-y/(2*(10.4-z)*tan);
  if(px<left||px>right||py<top||py>bottom)return false;
 }return true;}
 let lo=0,hi=desired;for(let n=0;n<14;n++){const k=(lo+hi)/2;if(fits(k))lo=k;else hi=k;}
 const k=lo;
 const lift=!quiet&&!freezeTime?Math.sin(time*.33)*.018:0;
 for(const v of poses){const c=v.centre.map((x,j)=>(x-mid[j])*k+offset[j]);c[0]+=ptr[0]*.045;c[1]+=lift-ptr[1]*.035;
  v.matrix=new Float32Array([...v.U.map(x=>x*k),0,...v.H.map(x=>x*k),0,...v.N.map(x=>x*k),0,...c,1]);}
 diagnostics.clearance={q,pitch,curvature:kappa,sector:2*Math.atan(kappa*a/(1-kappa*b)),angularPitch:kappa*pitch,scale:k};
 return poses;
}
