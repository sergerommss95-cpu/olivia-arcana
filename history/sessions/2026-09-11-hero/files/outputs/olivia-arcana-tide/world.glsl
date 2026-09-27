precision highp float;
varying vec2 vUv;
uniform sampler2D uOriginal,uPlate,uMatte,uSanctuary,uFigureHD;
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
 // HD remaster sprite (2048x1984, bbox [281,274]-[1352,1828], foot at x-frac .511 of bbox,
 // contact row y=1828), registered to the photo's contact anchor and physical scale:
 // 234 photo px of figure height = 1554 HD px  ->  6.641 HD px per photo px.
 vec2 photoOff=vec2(971.+186.*q.x-1060.,761.-234.*q.y-761.);
 vec2 hdPx=vec2(828.3,1828.)+photoOff*6.641;
 if(hdPx.x<40.||hdPx.x>2008.||hdPx.y<40.||hdPx.y>1944.)return vec4(0.);
 vec2 hdUV=vec2(hdPx.x/2048.,1.-hdPx.y/1984.);
 vec4 c=texture2D(uFigureHD,hdUV);
 return vec4(c.rgb,c.a);
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
 sampleUV+=vec2(sin(bgUV.y*6.+uTime*.05),cos(bgUV.x*5.-uTime*.04))*.0012*cloud;
 vec3 base=texture2D(uPlate,clamp(sampleUV,.001,.999)).rgb;
 // Her reflected figure is sampled from the same original pixels and distorted in the sea.
 float below=(foot.y-vUv.y)/(uFigure.w*.85);
 vec2 rq=vec2((vUv.x-uFigure.x)/uFigure.z,below);
 rq.x+=(.007+.033*max(below,0.))*sin(vUv.y*530.+uTime*1.1+vUv.x*10.);
 rq.x+=.008*sin(vUv.y*910.-uTime*.7);
 rq.y+=.006*sin(vUv.y*200.+vUv.x*35.+uTime*.5);
 vec4 reflected=figure(rq);
 float ra=reflected.a*.62*exp(-max(below,0.)*2.)*ramp(0.,.02,below)*(1.-ramp(.68,1.,below));
 ra*=1.-ramp(foot.y-.001,foot.y+.001,vUv.y);
 base=mix(base,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra);
 base+=vec3(.57,.65,1.)*wake*.052;
 float wake2=sin(wavePhase*.6+2.1)*envelope*water;
 base+=vec3(.5,.6,.95)*wake2*.028;
 float crestSpark=step(.995,hash(floor(vUv*uResolution*.35)+floor(uTime*2.)))*envelope*water;
 base+=vec3(.85,.9,1.)*crestSpark*.35;
 base+=vec3(.63,.72,1.)*pow(max(0.,cos(wavePhase)),19.)*envelope*water*.18;
 vec2 q=(vUv-uFigure.xy)/uFigure.zw;
 float hem=1.-ramp(.07,.6,q.y);
 q.x+=hem*.0035*sin(q.y*10.+uTime*.65)*ramp(.04,.45,abs(q.x-.50)*2.);
 vec4 fg=figure(q);
 fg.a*=ramp(.012,.03,q.y+.0015*sin(q.x*45.+uTime*.65));
 float aR=figure(q-vec2(.014,0.)).a;
 float rimEdge=clamp(fg.a-aR,0.,1.);
 fg.rgb+=vec3(.75,.82,1.)*rimEdge*.32*uApproach;
 float lum=dot(fg.rgb,vec3(.299,.587,.114));
 float bead=step(.76,q.x)*step(q.x,.92)*step(.18,q.y)*step(q.y,.68)*step(.7,lum);
 fg.rgb+=vec3(.9,.95,1.)*bead*pow(.5+.5*sin(uTime*3.+q.y*60.),6.)*.45;
 float hemContact=exp(-pow((q.y-.05)/.055,2.))*fg.a;
 fg.rgb+=vec3(.6,.68,1.)*hemContact*(.10+.14*abs(wake));
 vec3 outside=base;
 // A small darkening makes the rising silver-water surface read as a physical threshold.
 outside*=1.-open*.27;
 // A ripple begins in the same water plane as her feet, then rises and rolls toward the viewer.
 float rise=ramp(.38,.67,p);
 // The opening is born IN the clouds at the heart of the sky and blooms outward.
 vec2 center=mix(vec2(.46,.60),vec2(.5,.50),rise);
 center=mix(center,vec2(.5,.5),pass);
 float radius=mix(.035,.355,open)+pass*pass*2.25;
 float squash=mix(.82,1.,rise);
 vec2 plane=(vUv-center)*vec2(aspect,1./squash);
 float radial=length(plane);
 float angle=atan(plane.y,plane.x);
 float turbulence=sin(angle*15.+uTime*.30+sin(angle*7.-uTime*.22))*.0013;
 turbulence+=sin(angle*39.-uTime*.6)*.00065;
 float edge=radial-radius+turbulence*open;
 float gate=ramp(.335,.42,p);
 float herald=ramp(.29,.335,p)*(1.-gate);
 vec2 hrel=(vUv-vec2(.46,.60))*vec2(aspect,1.);
 outside+=vec3(.95,.87,.66)*herald*exp(-dot(hrel,hrel)/.00003)*2.6;
 outside+=vec3(.65,.72,1.)*herald*exp(-dot(hrel,hrel)/.0035)*.5;
 outside+=vec3(.95,.87,.66)*herald*exp(-pow(hrel.x/.0015,2.))*exp(-pow(hrel.y/.03,2.))*.5;
 float aperture=(1.-ramp(-.004,.004,edge))*gate;
 // Inside the opening: a distinct sanctuary, with slow parallax and a low reflective water plane.
 float innerZoom=mix(.5,.90,open);innerZoom=mix(innerZoom,1.045,pass);
 vec2 innerScreen=(vUv-center)/innerZoom+vec2(.5,.26+.24*open);
 vec2 innerUV=cover(innerScreen,uSanctuarySize.x/uSanctuarySize.y,.5);
 float innerWater=1.-ramp(.235,.30,innerUV.y);
 innerUV.x+=innerWater*.0013*sin(innerUV.y*410.+uTime*.66);
 innerUV.y+=innerWater*.00035*sin(innerUV.x*70.-uTime*.5);
 vec3 inner=texture2D(uSanctuary,clamp(innerUV,.001,.999)).rgb;
 inner=mix(vec3(.04,.05,.22),inner,step(abs(innerScreen.y-.5),.5)*step(abs(innerScreen.x-.5),.5));
 // Dark central exposure keeps the reading invitation legible without a floating UI panel.
 float centerShade=exp(-pow((vUv.x-.5)*2.5,2.))*exp(-pow((vUv.y-.49)*1.9,2.));
 inner*=1.-centerShade*.42;
 // the newborn opening glows — light arrives before the view resolves
 inner+=vec3(.5,.6,1.)*(1.-open)*.22;
 inner+=vec3(.55,.62,1.)*innerWater*.045*(.5+.5*sin(uTime*.5));
 float archKiss=exp(-pow((innerUV.y-.68)/.07,2.))*exp(-pow((innerUV.x-.5)/.24,2.));
 inner+=vec3(.88,.72,.42)*archKiss*.09*pass;
 vec3 color=mix(outside,inner,aperture);
 // The rim is a refracting band of water, with multiple asymmetric moonlit crests.
 float rimWidth=.016+.048*open+.02*pass;
 float band=exp(-pow(edge/rimWidth,2.));
 float arcLight=.42+.58*pow(.5+.5*sin(angle+1.15),2.);
 float massLow=.55+.45*ramp(-.6,.35,plane.y/max(radius,.001));
 vec2 rn=normalize(plane+vec2(.00001));
 vec2 refractUV=cover(vUv+rn*band*(.026+.02*open),1672./941.,uPositionX);
 vec3 tideWater=texture2D(uPlate,clamp(refractUV,.001,.999)).rgb;
 float streak=pow(.5+.5*sin(angle*90.+radial*260.+uTime*2.1),6.);
 float lift=pow(.5+.5*sin(edge*300.-uTime*1.9+sin(angle*6.)*1.2),5.);
 tideWater*=.72+.5*lift*arcLight;
 tideWater+=vec3(.62,.70,1.)*streak*.16*arcLight;
 color=mix(color,tideWater,band*gate*(.62+.25*open)*massLow);
 float crestOuter=exp(-pow((edge-rimWidth*.55)/(rimWidth*.16),2.));
 float crestInner=exp(-pow((edge+rimWidth*.5)/(rimWidth*.2),2.));
 float foamTex=.55+.45*sin(angle*48.+uTime*.9+radial*130.);
 color+=vec3(.87,.90,1.)*(crestOuter*.5+crestInner*.3)*gate*arcLight*foamTex;
 float sprayZone=ramp(0.,rimWidth*2.6,edge)*(1.-ramp(rimWidth*2.6,rimWidth*6.,edge));
 float droplets=step(.985,hash(floor((vUv+vec2(0.,uTime*.02))*uResolution*.5)));
 color+=vec3(.8,.86,1.)*droplets*sprayZone*gate*.5;
 color+=vec3(.40,.48,.83)*exp(-abs(edge)*30.)*gate*.10;
 // Engraved marks appear in the water itself as the circle becomes upright.
 float engraved=ramp(.49,.60,p)*(1.-ramp(.76,.91,p));
 float tick=pow(max(0.,cos(angle*72.)),22.);
 float tickRing=ramp(radius+.025,radius+.029,radial)*(1.-ramp(radius+.037,radius+.039,radial));
 float outerRing=exp(-pow((radial-radius-.053)/.0008,2.));
 color+=vec3(.70,.62,.44)*(tick*tickRing*.5+outerRing*.18)*engraved;
 float rush=pass*(1.-pass)*4.;
 vec3 rushTap=texture2D(uPlate,clamp(bgUV+rn*.018*rush,.001,.999)).rgb;
 color=mix(color,rushTap,rush*.16*(1.-aperture));
 color*=1.-rush*.12*pow(length((vUv-.5)*vec2(aspect,1.)),2.);
 // Olivia remains in front of the rising portal until mist absorbs her as we pass through.
 float figureVisibility=1.-ramp(.665,.79,p);
 color=mix(color,mix(reflected.rgb,vec3(.05,.08,.35),.28),ra*figureVisibility*aperture*.8);
 color+=vec3(.57,.65,1.)*wake*.03*figureVisibility*aperture;
 color=mix(color,fg.rgb,fg.a*figureVisibility);
 float sCycle=floor(uTime/13.);float sT=fract(uTime/13.)*3.;
 vec2 sA=vec2(.12+.55*hash(vec2(sCycle,7.3)),.08+.14*hash(vec2(sCycle,3.1)));
 vec2 sDir=normalize(vec2(.82,.3));vec2 sPos=sA+sDir*sT*.45;
 vec2 srel=(vUv-sPos)*vec2(aspect,1.);
 float along=dot(srel,sDir);float perp=dot(srel,vec2(-sDir.y,sDir.x));
 float shoot=exp(-perp*perp/.0000035)*exp(-along*along/.0016)*step(along,0.)*step(-.055,along)*step(sT,1.);
 color+=vec3(.9,.94,1.)*shoot*.7*(1.-ramp(.18,.28,p));
 // Film texture, stable in screen space, ties the procedural water to the supplied artwork.
 vec3 tc=clamp(color,0.,1.);
 vec3 graded=mix(tc,tc*tc*(3.-2.*tc),.42);
 float grain=(hash(floor(vUv*uResolution))-.5)*.006*(1.-dot(graded,vec3(.3333)));
 gl_FragColor=vec4(max(graded+grain,vec3(0.)),1.);
}
