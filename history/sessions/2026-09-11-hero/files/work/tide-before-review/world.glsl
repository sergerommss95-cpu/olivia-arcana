precision highp float;
varying vec2 vUv;
uniform sampler2D uOriginal,uPlate,uMatte,uSanctuary;
uniform vec2 uResolution,uSanctuarySize;
uniform vec4 uFigure;
uniform float uTime,uProgress,uApproach,uPositionX;
const float PI=3.14159265359;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
vec2 cover(vec2 q,float imageAspect,float anchor){
 float aspect=uResolution.x/uResolution.y;vec2 fit=vec2(1.);
 if(aspect<imageAspect)fit.x=aspect/imageAspect;else fit.y=imageAspect/aspect;
 return vec2((q.x-.5)*fit.x+.5+(anchor-.5)*(1.-fit.x),(q.y-.5)*fit.y+.5);
}
// This layer is sampled from the ORIGINAL photograph, never from a remastered person.
// Raw matte crop = [930,480,320,310]; occupied source bounds [971,527,1157,761].
vec4 figure(vec2 q){
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec4(0.);
 vec2 sourcePx=vec2(971.+186.*q.x,761.-234.*q.y);
 vec2 maskUV=vec2((sourcePx.x-930.)/320.,1.-(sourcePx.y-480.)/310.);
 vec2 photoUV=vec2(sourcePx.x/1672.,1.-sourcePx.y/941.);
 vec3 rgb=texture2D(uOriginal,photoUV).rgb;
 float alpha=texture2D(uMatte,maskUV).a;
 // Remove the old matte's attached cloud wedge inside the crescent, not any face pixels.
 if(sourcePx.y<602.&&(sourcePx.x>1074.||sourcePx.y<550.))alpha=ramp(.77,.98,alpha);
 return vec4(rgb,alpha);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 float aspect=uResolution.x/uResolution.y;
 float p=uProgress;
 float open=ramp(.33,.65,p);
 float pass=ramp(.64,.97,p);
 vec2 photoUV=cover(vUv,1672./941.,uPositionX);
 float dolly=1.+uApproach*.045;
 vec2 bgUV=(photoUV-vec2(.62,.27))/dolly+vec2(.62,.27);
 float water=1.-ramp(.242,.267,bgUV.y);
 float depth=clamp((.267-bgUV.y)/.267,0.,1.);
 vec2 foot=vec2(uFigure.x+uFigure.z*(89./186.),uFigure.y+uFigure.w*(5./234.));
 vec2 wakePlane=(vUv-foot)*vec2(aspect,5.6);
 float d=length(wakePlane);
 float spread=uFigure.w*.59;
 float envelope=exp(-d/(spread+.014))*ramp(.004,.028,d);
 float wavePhase=d/(spread+.01)*22.-uTime*1.3;
 float wake=sin(wavePhase)*envelope*water;
 vec2 sampleUV=bgUV;
 sampleUV.x+=water*(.0004+.0017*depth)*sin(bgUV.y*430.+uTime*.8+sin(bgUV.x*20.+uTime*.15));
 sampleUV.y+=water*.00055*sin(bgUV.x*75.+bgUV.y*270.-uTime*.6);
 sampleUV+=vec2(wake*.0016*sin(wavePhase*.3),wake*.00095);
 float cloud=ramp(.28,.4,bgUV.y)*(1.-ramp(.67,.78,bgUV.y));
 sampleUV.x+=cloud*.0007*sin(bgUV.y*11.+uTime*.16);
 vec3 base=texture2D(uPlate,clamp(sampleUV,.001,.999)).rgb;
 // Her reflected figure is sampled from the same original pixels and distorted in the sea.
 float below=(foot.y-vUv.y)/(uFigure.w*.85);
 vec2 rq=vec2((vUv.x-uFigure.x)/uFigure.z,below);
 rq.x+=(.007+.033*max(below,0.))*sin(vUv.y*530.+uTime*1.1+vUv.x*10.);
 rq.x+=.008*sin(vUv.y*910.-uTime*.7);
 rq.y+=.006*sin(vUv.y*200.+vUv.x*35.+uTime*.5);
 vec4 reflected=figure(rq);
 float ra=reflected.a*.56*exp(-max(below,0.)*2.)*ramp(0.,.02,below)*(1.-ramp(.68,1.,below));
 ra*=1.-ramp(foot.y-.001,foot.y+.001,vUv.y);
 base=mix(base,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra);
 base+=vec3(.57,.65,1.)*wake*.052;
 base+=vec3(.63,.72,1.)*pow(max(0.,cos(wavePhase)),19.)*envelope*water*.18;
 vec2 q=(vUv-uFigure.xy)/uFigure.zw;
 float hem=1.-ramp(.07,.6,q.y);
 q.x+=hem*.0035*sin(q.y*10.+uTime*.65)*ramp(.04,.45,abs(q.x-.50)*2.);
 vec4 fg=figure(q);
 fg.a*=ramp(.012,.03,q.y+.0015*sin(q.x*45.+uTime*.65));
 vec3 outside=base;
 // A small darkening makes the rising silver-water surface read as a physical threshold.
 outside*=1.-open*.27;
 // A ripple begins in the same water plane as her feet, then rises and rolls toward the viewer.
 float rise=ramp(.38,.67,p);
 vec2 center=mix(foot,vec2(.54,.49),rise);
 center=mix(center,vec2(.5,.5),pass);
 float radius=mix(.13,.355,open)+pass*pass*2.25;
 float squash=mix(.115,1.,rise);
 vec2 plane=(vUv-center)*vec2(aspect,1./squash);
 float radial=length(plane);
 float angle=atan(plane.y,plane.x);
 float turbulence=sin(angle*15.+uTime*.30+sin(angle*7.-uTime*.22))*.0013;
 turbulence+=sin(angle*39.-uTime*.6)*.00065;
 float edge=radial-radius+turbulence*open;
 float gate=ramp(.335,.42,p);
 float aperture=(1.-ramp(-.004,.004,edge))*gate;
 // Inside the opening: a distinct sanctuary, with slow parallax and a low reflective water plane.
 vec2 innerScreen=(vUv-.5)/mix(.90,1.045,pass)+.5;
 vec2 innerUV=cover(innerScreen,uSanctuarySize.x/uSanctuarySize.y,.5);
 float innerWater=1.-ramp(.235,.30,innerUV.y);
 innerUV.x+=innerWater*.0013*sin(innerUV.y*410.+uTime*.66);
 innerUV.y+=innerWater*.00035*sin(innerUV.x*70.-uTime*.5);
 vec3 inner=texture2D(uSanctuary,clamp(innerUV,.001,.999)).rgb;
 // Dark central exposure keeps the reading invitation legible without a floating UI panel.
 float centerShade=exp(-pow((vUv.x-.5)*2.5,2.))*exp(-pow((vUv.y-.49)*1.9,2.));
 inner*=1.-centerShade*.28;
 vec3 color=mix(outside,inner,aperture);
 // The rim is a refracting band of water, with multiple asymmetric moonlit crests.
 float rimWidth=.0055+.011*open;
 float band=exp(-pow(edge/rimWidth,2.));
 float rippleCrest=pow(.5+.5*sin(edge*920.-uTime*.7+sin(angle*8.)*1.3),4.);
 float arcLight=.55+.45*pow(.5+.5*sin(angle+1.1),2.);
 vec2 refractUV=cover(vUv+normalize(plane+vec2(.00001))*band*.012,1672./941.,uPositionX);
 vec3 refracted=texture2D(uPlate,clamp(refractUV,.001,.999)).rgb;
 color=mix(color,refracted,band*gate*.48);
 color+=vec3(.48,.59,.94)*band*gate*(.18+rippleCrest*.65)*arcLight;
 color+=vec3(.76,.83,1.)*exp(-pow(edge/.0022,2.))*gate*.61*arcLight;
 color+=vec3(.40,.48,.83)*exp(-abs(edge)*48.)*gate*.11;
 // Engraved marks appear in the water itself as the circle becomes upright.
 float engraved=ramp(.49,.60,p)*(1.-ramp(.76,.91,p));
 float tick=pow(max(0.,cos(angle*72.)),22.);
 float tickRing=ramp(radius+.025,radius+.029,radial)*(1.-ramp(radius+.037,radius+.039,radial));
 float outerRing=exp(-pow((radial-radius-.053)/.0008,2.));
 color+=vec3(.70,.62,.44)*(tick*tickRing*.72+outerRing*.30)*engraved;
 // Olivia remains in front of the rising portal until mist absorbs her as we pass through.
 float figureVisibility=1.-ramp(.665,.79,p);
 color=mix(color,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra*figureVisibility*aperture*.8);
 color+=vec3(.57,.65,1.)*wake*.03*figureVisibility*aperture;
 color=mix(color,fg.rgb,fg.a*figureVisibility);
 // Film texture, stable in screen space, ties the procedural water to the supplied artwork.
 float grain=(hash(floor(vUv*uResolution))-.5)*.004;
 gl_FragColor=vec4(max(color+grain,vec3(0.)),1.);
}
