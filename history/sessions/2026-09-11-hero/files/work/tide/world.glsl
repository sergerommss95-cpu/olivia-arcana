precision highp float;
varying vec2 vUv;
uniform sampler2D uOriginal,uPlate,uMatte,uSanctuary;
uniform vec2 uResolution,uSanctuarySize;
uniform vec4 uFigure;
uniform float uTime,uProgress,uApproach,uPositionX;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
vec2 cover(vec2 q,float imageAspect,float anchor){
 float aspect=uResolution.x/uResolution.y;vec2 fit=vec2(1.);
 if(aspect<imageAspect)fit.x=aspect/imageAspect;else fit.y=imageAspect/aspect;
 return vec2((q.x-.5)*fit.x+.5+(anchor-.5)*(1.-fit.x),(q.y-.5)*fit.y+.5);
}
// Original pixels throughout. The matte contains geometry only, never replacement RGB.
vec4 figure(vec2 q){
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);
 vec2 sourcePx=vec2(971.+186.*q.x,761.-234.*q.y);
 vec2 maskUV=vec2((sourcePx.x-930.)/320.,1.-(sourcePx.y-480.)/310.);
 vec3 rgb=texture2D(uOriginal,vec2(sourcePx.x/1672.,1.-sourcePx.y/941.)).rgb;
 float alpha=texture2D(uMatte,maskUV).a;
 if(sourcePx.y<602.&&(sourcePx.x>1074.||sourcePx.y<550.))alpha=ramp(.77,.98,alpha);
 return vec4(rgb,alpha);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float flow(vec2 q){return noise(q)*.57+noise(q*2.07+3.1)*.28+noise(q*4.19-7.2)*.15;}
void main(){
 float aspect=uResolution.x/uResolution.y,p=uProgress;
 float opening=ramp(.32,.83,p),settle=ramp(.76,.97,p);
 vec2 photoUV=cover(vUv,1672./941.,uPositionX);
 vec2 bgUV=(photoUV-vec2(.63,.26))/(1.+uApproach*.018)+vec2(.63,.26);
 float water=1.-ramp(.243,.267,bgUV.y);
 float depth=clamp((.267-bgUV.y)/.267,0.,1.);
 vec2 foot=vec2(uFigure.x+uFigure.z*(89./186.),uFigure.y+uFigure.w*(5./234.));
 // A physically flat wake with irregular crests and a reflection rooted at the hem.
 vec2 wakePlane=(vUv-foot)*vec2(aspect,6.8);
 float d=length(wakePlane),spread=uFigure.w*.60;
 float envelope=exp(-d/(spread+.014))*ramp(.005,.025,d);
 float wavePhase=d/(spread+.01)*25.-uTime*1.05;
 float wake=sin(wavePhase+sin(vUv.x*47.)*.22)*envelope*water;
 vec2 sampleUV=bgUV;
 sampleUV.x+=water*(.0004+.0018*depth)*sin(bgUV.y*430.+uTime*.65+sin(bgUV.x*20.+uTime*.15));
 sampleUV.y+=water*.0005*sin(bgUV.x*75.+bgUV.y*270.-uTime*.6);
 sampleUV+=vec2(wake*.0015,wake*.0009);
 float cloud=ramp(.28,.4,bgUV.y)*(1.-ramp(.67,.78,bgUV.y));
 sampleUV.x+=cloud*.0006*sin(bgUV.y*11.+uTime*.12);
 vec3 base=texture2D(uPlate,clamp(sampleUV,.001,.999)).rgb;
 float below=(foot.y-vUv.y)/(uFigure.w*.85);
 vec2 rq=vec2((vUv.x-uFigure.x)/uFigure.z,below);
 rq.x+=(.007+.037*max(below,0.))*sin(vUv.y*530.+uTime*.9+vUv.x*10.)+.008*sin(vUv.y*910.-uTime*.7);
 rq.y+=.006*sin(vUv.y*200.+vUv.x*35.+uTime*.5);
 vec4 reflected=figure(rq);
 float ra=reflected.a*.55*exp(-max(below,0.)*2.)*ramp(0.,.02,below)*(1.-ramp(.68,1.,below));
 ra*=1.-ramp(foot.y-.001,foot.y+.001,vUv.y);
 base=mix(base,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra);
 base+=vec3(.48,.57,.91)*wake*.036;
 base+=vec3(.54,.64,.95)*pow(max(0.,cos(wavePhase)),18.)*envelope*water*.105;
 vec2 q=(vUv-uFigure.xy)/uFigure.zw;
 q.x+=(1.-ramp(.07,.6,q.y))*.0023*sin(q.y*10.+uTime*.55);
 vec4 fg=figure(q);
 fg.a*=ramp(.012,.031,q.y+.002*sin(q.x*45.+uTime*.65));
 base=mix(base,fg.rgb,fg.a);
 // The tide stays in the water plane: its near edge passes beneath the viewer,
 // its distant edge broadens across the horizon. It never stands up as a ring.
 vec2 origin=foot+vec2(-.012,-.014);
 float rx=.12+opening*opening*5.8;
 float ry=.019+opening*opening*1.65;
 vec2 rel=vUv-origin;
 float nx=rel.x*aspect/rx;
 float front=origin.y+ry*sqrt(max(.0,1.-nx*nx));
 float lateral=1.-ramp(.98,1.02,abs(nx));
 float n=flow(vec2(vUv.x*5.5,vUv.y*9.-uTime*.13));
 float folds=(n-.5)*(.007+.022*opening)*(1.-settle);
 float edge=vUv.y-front+folds;
 float available=ramp(.32,.355,p)*lateral;
 float wet=(1.-ramp(-.014,.009,edge))*available;
 // Broad refractive lip: displaced photographic water and stretched highlights.
 float band=exp(-pow(edge/(.016+.042*opening),2.))*available*(1.-settle);
 float trailing=exp(-pow((edge+.045)/.025,2.))*available*(1.-settle);
 vec2 current=vec2((n-.5)*.035,sin(vUv.x*17.+uTime*.23)*.008+.07);
 vec2 warpedScreen=vUv+current*band;
 vec2 innerUV=cover((warpedScreen-.5)/(1.025-.025*settle)+.5,uSanctuarySize.x/uSanctuarySize.y,aspect<.85?.63:.5);
 float innerWater=1.-ramp(.278,.312,innerUV.y);
 innerUV.x+=innerWater*.0016*sin(innerUV.y*390.+uTime*.7);
 innerUV.y+=innerWater*.0005*sin(innerUV.x*87.-uTime*.45);
 vec3 inner=texture2D(uSanctuary,clamp(innerUV,.001,.999)).rgb;
 inner*=vec3(.72,.75,.86);
 // The same source sea remains visible in the rolling surface at the boundary.
 vec2 seaUV=cover(vec2(vUv.x+current.x*band,.15+(vUv.y-front)*.19),1672./941.,uPositionX);
 seaUV.y=clamp(.13+(seaUV.y-.13)*.4,.02,.25);
 seaUV.x+=sin(vUv.x*13.+uTime*.2)*band*.018;
 vec3 lip=texture2D(uPlate,clamp(seaUV,.001,.999)).rgb;
 vec3 color=mix(base,inner,wet);
 color=mix(color,lip,band*.64);
 // Narrow broken silver catches, with a dark trough, not a luminous outline.
 float grainWave=flow(vec2(vUv.x*43.,vUv.y*160.+uTime*.23));
 float catchlight=exp(-pow((edge+.005)/.0035,2.))*(.13+.44*grainWave);
 color*=1.-band*.12;
 color+=vec3(.52,.61,.79)*catchlight*available*(1.-settle)*.35;
 color+=vec3(.25,.34,.52)*trailing*.065;
 float vignette=pow(length((vUv-.5)*vec2(.72,1.)),1.6);
 color*=1.-vignette*.24;
 float grain=(hash(floor(vUv*uResolution))-.5)*.006;
 gl_FragColor=vec4(max(color+grain,vec3(0.)),1.);
}
