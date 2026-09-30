"use client";

/**
 * TheArrival — THE TIDE OPENS (site port of the approved prototype).
 *
 * One WebGL pass: the original sea plate, Olivia (HD remaster, registered
 * to her true contact point), the tide-wall opening born in the clouds,
 * and the sanctuary on the other side. Native scroll drives it (3.2
 * viewports desktop / 2.5 mobile); Begin offers an assisted ride; every
 * control from the verified prototype survives. The reading entrance
 * follows on a Liquid Night ground.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STARS, CONSTELLATIONS, lst, project } from "@/lib/star-chart";

const VERT = "attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}";
const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uPlate,uSanctuary,uFigureHD,uMask,uArrival,uSkyMap;
uniform vec2 uResolution,uPointer;
uniform vec4 uFigure;
uniform float uTime,uProgress,uApproach,uPositionX,uEnter;
const float PI=3.14159265359;
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
vec2 cover(vec2 q,float imageAspect,float anchor){
 float aspect=uResolution.x/uResolution.y;vec2 fit=vec2(1.);
 if(aspect<imageAspect)fit.x=aspect/imageAspect;else fit.y=imageAspect/aspect;
 return vec2((q.x-.5)*fit.x+.5+(anchor-.5)*(1.-fit.x),(q.y-.5)*fit.y+.5);
}
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
 float open=ramp(.33,.62,p);
 float pass=ramp(.62,.97,p);
 float figVis=1.-ramp(.40,.49,p);
 vec2 photoUV=cover(vUv,1672./941.,uPositionX);
 float dolly=1.+uApproach*.045;
 vec2 bgUV=(photoUV-vec2(.62,.27))/dolly+vec2(.62,.27);
 // ENTRANCE BREATH — the plate settles from a whisper closer on load.
 bgUV=(bgUV-vec2(.5,.45))/(1.+.022*(1.-uEnter))+vec2(.5,.45);
 // DEPTH — the pointer tilts the scene: plate drifts, sanctuary lags deeper.
 bgUV-=uPointer*vec2(.0042,.0028)*(1.-pass);
 // THE PASSAGE — the camera dollies into the painted arch itself. The mask
 // lives in plate space, so the aperture, its clouds and the sanctuary all
 // travel together under one zoom.
 vec2 apC=vec2(.4282,.6185);
 // Ease-in-out dolly: visibly moving through the whole passage act,
 // no dead stretch. K registers the arrival plate to this same motion.
 float Zt=pass*pass*(3.-2.*pass);
 float Z=1.+1.06*Zt;
 bgUV=(bgUV-apC)/Z+apC;
 float water=1.-ramp(.242,.267,bgUV.y);
 float depth=clamp((.267-bgUV.y)/.267,0.,1.);
 vec2 foot=vec2(uFigure.x+uFigure.z*(89./186.),uFigure.y+uFigure.w*(5./234.));
 vec2 wakePlane=(vUv-foot)*vec2(aspect,5.6);
 float d=length(wakePlane);
 float spread=uFigure.w*.59;
 float envelope=exp(-d/(spread+.014))*ramp(.004,.028,d);
 envelope*=.2+.8*figVis;
 float wAng=atan(wakePlane.y,wakePlane.x);
 envelope*=.55+.45*(.5+.5*sin(wAng*2.3+1.7));
 float wavePhase=d/(spread+.01)*22.-uTime*1.3+.9*sin(wAng*3.1);
 float wake=sin(wavePhase)*envelope*water;
 vec2 sampleUV=bgUV;
 sampleUV.x+=water*(.0004+.0017*depth)*sin(bgUV.y*430.+uTime*.8+sin(bgUV.x*20.+uTime*.15));
 sampleUV.y+=water*.00055*sin(bgUV.x*75.+bgUV.y*270.-uTime*.6);
 sampleUV+=vec2(wake*.0016*sin(wavePhase*.3),wake*.00095);
 float cloud=ramp(.28,.4,bgUV.y)*(1.-ramp(.67,.78,bgUV.y));
 sampleUV.x+=cloud*.0007*sin(bgUV.y*11.+uTime*.16);
 sampleUV+=vec2(sin(bgUV.y*6.+uTime*.05),cos(bgUV.x*5.-uTime*.04))*.0012*cloud;
 vec3 base=texture2D(uPlate,clamp(sampleUV,.001,.999)).rgb;
 float baseLum=dot(base,vec3(.299,.587,.114));
 // LIVING PLATE — stars breathe in the deep sky; gilt kisses drift along
 // the moonlit cloud rims. Both are whispers, never effects.
 float darkSky=smoothstep(.16,.05,baseLum)*(1.-water);
 float twc=hash(floor(bgUV*vec2(760.,420.)));
 float tw=step(.986,twc)*pow(.5+.5*sin(uTime*(.7+twc)+twc*6.28),9.);
 base+=vec3(.92,.88,.72)*tw*darkSky*.5;
 float rimGlow=smoothstep(.52,.78,baseLum)*(1.-water);
 base+=vec3(.55,.42,.18)*rimGlow*(.5+.5*sin(uTime*.37+bgUV.x*6.3))*.035;
 // Her reflected figure is sampled from the same original pixels and distorted in the sea.
 float below=(foot.y-vUv.y)/(uFigure.w*.85);
 vec2 rq=vec2((vUv.x-uFigure.x)/uFigure.z,below);
 float rAmp=.6+.4*sin(vUv.y*53.+vUv.x*17.+uTime*.21);
 rq.x+=(.005+.022*max(below,0.))*rAmp*sin(vUv.y*530.+uTime*1.1+vUv.x*10.);
 rq.x+=.005*rAmp*sin(vUv.y*910.-uTime*.7);
 rq.y+=.004*sin(vUv.y*200.+vUv.x*35.+uTime*.5);
 vec4 reflected=figure(rq);
 float ra=reflected.a*.46*exp(-max(below,0.)*2.8)*ramp(0.,.02,below)*(1.-ramp(.62,.95,below));
 ra*=1.-ramp(foot.y-.001,foot.y+.001,vUv.y);
 ra*=figVis;
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
 // As the mist takes her she lifts a breath and breaks up hem-first —
 // an erosion into wisps, never a uniform ghost.
 float diss=1.-figVis;
 q.y-=diss*.035;
 vec4 fg=figure(q);
 fg.a*=ramp(.012,.03,q.y+.0015*sin(q.x*45.+uTime*.65));
 // Smooth value-noise erosion: she breaks into organic wisps, hem-first —
 // never rectangular cells.
 vec2 nq=q*vec2(9.,14.);
 vec2 ni=floor(nq),nf=fract(nq);nf=nf*nf*(3.-2.*nf);
 float vn=mix(mix(hash(ni),hash(ni+vec2(1.,0.)),nf.x),mix(hash(ni+vec2(0.,1.)),hash(ni+vec2(1.,1.)),nf.x),nf.y);
 float fn=.06+.94*(vn*.7+q.y*.3);
 fg.a*=1.-ramp(fn-.08,fn+.14,diss);
 float aR=figure(q-vec2(.014,0.)).a;
 float rimEdge=clamp(fg.a-aR,0.,1.);
 fg.rgb+=vec3(.75,.82,1.)*rimEdge*(.32*uApproach+.55*diss*fg.a);
 float lum=dot(fg.rgb,vec3(.299,.587,.114));
 float bead=step(.76,q.x)*step(q.x,.92)*step(.18,q.y)*step(q.y,.68)*step(.7,lum);
 fg.rgb+=vec3(.9,.95,1.)*bead*pow(.5+.5*sin(uTime*3.+q.y*60.),6.)*.45;
 float hemContact=exp(-pow((q.y-.05)/.055,2.))*fg.a;
 fg.rgb+=vec3(.6,.68,1.)*hemContact*(.10+.14*abs(wake));
 vec3 outside=base;
 // A quiet darkening keeps the arch the brightest form as it opens.
 outside*=1.-open*.16;
 // THE ARCH IS THE PORTAL. The painted matte marks the sky the clouds
 // enclose; the reveal grows from the arch heart and can only ever end
 // on the painted cloud boundary — no procedural ring exists.
 float m=texture2D(uMask,clamp(bgUV,.001,.999)).r;
 // The matte is thresholded so no encoder noise can ever leak the reveal.
 m=ramp(.08,.92,m);
 float gate=ramp(.33,.40,p);
 vec2 pl=(bgUV-apC)*vec2(1672./941.,1.);
 float r=length(pl);
 float discR=mix(.015,.34,open);
 float disc=1.-ramp(discR-.06,discR+.015,r);
 float aperture=m*disc*gate;
 // A travelling frontier of parting mist, and a breathing cloud edge.
 float frontier=m*ramp(discR-.10,discR-.03,r)*(1.-ramp(discR-.01,discR+.04,r));
 float rim=m*(1.-m)*4.;
 // The sanctuary shares the plate's own frame space — same UV, a breath
 // deeper, so the reveal is seamless and the dolly carries both.
 vec2 innerUV=(bgUV-apC)/mix(.94,1.,pass)+apC;
 innerUV-=uPointer*vec2(.0021,.0014);
 float innerWater=1.-ramp(.235,.30,innerUV.y);
 innerUV.x+=innerWater*.0013*sin(innerUV.y*410.+uTime*.66);
 innerUV.y+=innerWater*.00035*sin(innerUV.x*70.-uTime*.5);
 vec3 inner=texture2D(uSanctuary,clamp(innerUV,.001,.999)).rgb;
 inner+=vec3(.55,.62,1.)*innerWater*.03*(.5+.5*sin(uTime*.5));
 // The candle owns the interior: a warm thrown pool with a living flicker.
 vec2 cRel=(innerUV-vec2(.4115,.470))*vec2(1.78,1.);
 float cGlow=exp(-dot(cRel,cRel)/.012)*(.88+.12*sin(uTime*7.)*sin(uTime*3.1+1.7));
 inner+=vec3(1.,.72,.4)*cGlow*.16*ramp(.36,.52,p);
 // Before the cut, the interior leans toward the arrival plate's warmth.
 inner*=mix(vec3(1.),vec3(1.05,.99,.90),ramp(.78,.88,p));
 // Light arrives WITH the opening — the interior never reads colder
 // or deeper than the sky around it.
 float resolveT=ramp(.35,.52,p);
 // TONIGHT'S SKY: the real constellations above the reader, computed for
 // this hour, engraved in gilt into the break's own dark sky.
 vec4 skyTex=texture2D(uSkyMap,clamp(bgUV,.001,.999));
 float skyMap=skyTex.r+max(0.,skyTex.g-skyTex.r);
 float innerDark=smoothstep(.30,.10,dot(inner,vec3(.333)));
 inner+=vec3(.86,.72,.45)*skyMap*innerDark*resolveT;
 vec3 revealed=inner*(.38+.62*resolveT)+vec3(.075,.06,.045)*(1.-resolveT);
 vec3 color=mix(outside,revealed,aperture);
 // Warm candle-family edges — never a cool cutout fringe.
 color+=vec3(.92,.84,.66)*frontier*gate*(1.-open*.85)*.24;
 color+=vec3(.88,.80,.62)*rim*open*.09;
 // The herald is a STAR — warm, fine diffraction spikes — and it hands
 // its light to the candle instead of dying into darkness.
 float herald=ramp(.29,.35,p)*(1.-ramp(.36,.46,p));
 color+=vec3(1.,.85,.55)*herald*exp(-dot(pl,pl)/.00004)*2.4;
 color+=vec3(1.,.87,.60)*herald*(exp(-pow(pl.x/.0011,2.))*exp(-pow(pl.y/.030,2.))+exp(-pow(pl.y/.0011,2.))*exp(-pow(pl.x/.030,2.)))*.4;
 // Her weight sits on the water: a soft contact shade under the hem.
 float contact=exp(-pow((vUv.x-foot.x)*aspect/(uFigure.z*.42),2.))*exp(-pow((vUv.y-foot.y)/.007,2.));
 color*=1.-contact*.30*figVis;
 // She dissolves into the parting mist before the camera passes through.
 color=mix(color,fg.rgb,fg.a*figVis);
 // MATTE CUT — the parked final frame is its own native-resolution plate;
 // the fade lands while the camera still drifts, so it reads as focus
 // arriving rather than an image swap.
 float land=ramp(.86,.95,p);
 land=ramp(.2,.8,land);
 // MATCH CUT — the arrival plate rides the SAME dolly: registered so its
 // colonnade lands exactly on the sanctuary's, only the grade changes.
 // 2.0514 = Z*innerZoom at the endpoint the arrival art reproduces (p=.93).
 float K=2.0514/(Z*mix(.94,1.,pass));
 vec2 aUV=apC+(cover(vUv,1672./941.,.5)-apC)*K;
 // The parked painting keeps living: slow frame drift, candle flicker,
 // starlight breathing, the same pointer depth.
 aUV=(aUV-.5)/(1.+.004*sin(uTime*.05))+.5;
 aUV+=vec2(sin(uTime*.11)*.0014,cos(uTime*.083)*.0009)*land;
 aUV-=uPointer*vec2(.0032,.0021)*land;
 // Outside its own bounds the plate contributes nothing — no edge smear.
 float inb=step(abs(aUV.x-.5),.499)*step(abs(aUV.y-.5),.499);
 vec3 landPlate=texture2D(uArrival,clamp(aUV,.001,.999)).rgb;
 vec2 lcRel=(aUV-vec2(.390,.297))*vec2(1.78,1.);
 float lcGlow=exp(-dot(lcRel,lcRel)/.010)*(.88+.12*sin(uTime*7.)*sin(uTime*3.1+1.7));
 landPlate+=vec3(1.,.72,.4)*lcGlow*.14;
 float landLum=dot(landPlate,vec3(.299,.587,.114));
 float landDark=smoothstep(.15,.05,landLum);
 float ltc=hash(floor(aUV*vec2(820.,460.)));
 float ltw=step(.986,ltc)*pow(.5+.5*sin(uTime*(.6+ltc)+ltc*6.28),9.);
 landPlate+=vec3(.92,.88,.72)*ltw*landDark*.45;
 // Stars stay; the NAMES retire entirely as the arrival text takes the
 // frame — present or gone, never a half-faded residue.
 vec4 lskyTex=texture2D(uSkyMap,clamp(aUV,.001,.999));
 float lsky=lskyTex.r+max(0.,lskyTex.g-lskyTex.r)*(1.-ramp(.86,.93,p));
 landPlate+=vec3(.86,.72,.45)*lsky*smoothstep(.30,.10,landLum);
 color=mix(color,landPlate,land*inb);
 // The cut breathes through real cloud shadow — fast in, slow out.
 float dipT=sin(land*PI);
 color*=1.-.40*pow(dipT,1.3)*(1.-.35*land);
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
}`;

type Props = {
  locale: string;
  kicker: string;
  titleLines: string[];
  subtitle: string;
  trust: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  captionMain?: string;
  captionSub?: string;
};

const T = {
  en: {
    begin: "Watch the opening", read: "Begin a reading", threshold1: "A little stillness.", threshold2: "The tide is turning.",
    passage: "Bring what is on your mind.", arrival1: "Your question.", arrival2: "A new perspective.",
    ch1: "01 — Approach", ch2: "02 — Open", ch3: "03 — Enter",
    skip: "Skip the opening", pause: "Pause motion", play: "Play motion", still: "Still mode",
    hint: "Keep scrolling — the tide opens", hintEnd: "Scroll through to your reading",
    rKicker: "On the other side of a question", rTitleA: "What would you like", rTitleB: "to see ", rTitleEm: "more clearly?",
    rDesc: "Choose a starting point. Make room for a new perspective.",
    qLabel: "A question to begin with",
    intents: [
      { n: "I", label: "A decision", q: "What should I consider before I choose?" },
      { n: "II", label: "A relationship", q: "What could help me understand this connection?" },
      { n: "III", label: "My next step", q: "What deserves my attention now?" },
    ],
    oracle: "Continue to the Oracle", daily: "Draw your daily card",
  },
  uk: {
    begin: "Дивитись відкриття", read: "Почати читання", threshold1: "Трохи тиші.", threshold2: "Приплив повертається.",
    passage: "Почніть із того, що вас хвилює.", arrival1: "Ваше запитання.", arrival2: "Нова перспектива.",
    ch1: "01 — Наближення", ch2: "02 — Відкриття", ch3: "03 — Вхід",
    skip: "Пропустити вступ", pause: "Зупинити рух", play: "Увімкнути рух", still: "Режим тиші",
    hint: "Гортайте — приплив відкривається", hintEnd: "Гортайте далі до вашого читання",
    rKicker: "По той бік запитання", rTitleA: "Що ви хочете", rTitleB: "побачити ", rTitleEm: "ясніше?",
    rDesc: "Оберіть відправну точку. Звільніть місце для нового погляду.",
    qLabel: "Запитання для початку",
    intents: [
      { n: "I", label: "Рішення", q: "Що варто врахувати, перш ніж зробити вибір?" },
      { n: "II", label: "Стосунки", q: "Що допоможе мені краще зрозуміти ці стосунки?" },
      { n: "III", label: "Мій наступний крок", q: "На що мені зараз варто звернути увагу?" },
    ],
    oracle: "Перейти до Оракула", daily: "Витягнути карту дня",
  },
};

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const quint = (t: number) => 1 - Math.pow(1 - clamp(t), 5);

export default function TheArrival(p: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [intent, setIntent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);
  const [edition, setEdition] = useState("");
  const [skyCap, setSkyCap] = useState("");

  useEffect(() => {
    const now = new Date();
    const day = Math.floor((now.getTime() - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    setEdition(String(day));
    const months = p.locale === "uk"
      ? ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hh = String(now.getHours()).padStart(2, "0"), mm = String(now.getMinutes()).padStart(2, "0");
    setSkyCap(p.locale === "uk"
      ? `Сьогоднішнє небо над Києвом\n${now.getDate()} ${months[now.getMonth()]} · ${hh}:${mm} — обчислено для цієї години`
      : `Tonight's sky over Kyiv\n${now.getDate()} ${months[now.getMonth()]} · ${hh}:${mm} — computed for this hour`);
  }, [p.locale]);

  const t = p.locale === "uk" ? T.uk : T.en;

  useEffect(() => {
    const root = rootRef.current!;
    const seq = root.querySelector<HTMLElement>(".tide-seq")!;
    const stage = root.querySelector<HTMLElement>(".tide-stage")!;
    const canvas = root.querySelector<HTMLCanvasElement>(".tide-canvas")!;
    const poster = root.querySelector<HTMLImageElement>(".tide-poster")!;
    const plate = root.querySelector<HTMLImageElement>("#tide-plate")!;
    const sanct = root.querySelector<HTMLImageElement>("#tide-sanctuary")!;
    const olivia = root.querySelector<HTMLImageElement>("#tide-olivia")!;
    const mask = root.querySelector<HTMLImageElement>("#tide-mask")!;
    const arrival = root.querySelector<HTMLImageElement>("#tide-arrival")!;
    const landing = () => (document.getElementById("plates") ?? seq.nextElementSibling) as HTMLElement | null;
    const chapters = Array.from(root.querySelectorAll<HTMLButtonElement>(".tide-chapter"));
    const fill = root.querySelector<HTMLElement>(".tide-fill")!;
    const hint = root.querySelector<HTMLElement>(".tide-hint");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let gl: WebGLRenderingContext | null = null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    let ready = false, inView = true, raf = 0, last = 0, time = 3;
    let pv = 0, target = 0, range = 0, w = 1, h = 1;
    // Pointer depth (lerped) and the entrance clock.
    let ptrX = 0, ptrY = 0, ptrTX = 0, ptrTY = 0;
    let enterV = 0, enterStart = 0;
    let auto: { from: number; to: number; start: number; duration: number } | null = null;
    let debug = false;
    const D: Array<() => void> = [];

    const isPaused = () => stage.dataset.paused === "1";

    function measure() {
      const enabled = ready && !reduced.matches;
      seq.classList.toggle("enhanced", enabled);
      range = enabled ? innerHeight * (innerWidth <= 700 ? 2.5 : 3.2) : 0;
      seq.style.height = enabled ? stage.offsetHeight + range + "px" : "auto";
      if (!enabled) { target = pv = reduced.matches ? 0 : pv; }
      resize(); onScroll();
    }
    function onScroll() {
      if (!ready || debug) return;
      const r = seq.getBoundingClientRect();
      target = range ? clamp(-r.top / range) : 0;
      if (target > 0.03) stage.classList.add("is-scrolled");
      start();
    }
    const visible = () => inView && !document.hidden;
    function start() { if (!raf && ready && visible() && !isPaused()) raf = requestAnimationFrame(tick); }
    function compile(ty: number, src: string) {
      const s = gl!.createShader(ty)!;
      gl!.shaderSource(s, src); gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw Error(gl!.getShaderInfoLog(s) || "tide shader");
      return s;
    }
    /**
     * TONIGHT'S SKY — the almanac's one unfakeable signature. The break
     * in the clouds opens onto the real constellations above the reader,
     * computed for this hour from the star catalog and engraved into the
     * plate's own frame space (so the dolly and the match cut carry it).
     */
    function drawTonightSky(): HTMLCanvasElement {
      const cv = document.createElement("canvas");
      cv.width = 3344; cv.height = 1882;               // 2x — crisp at retina
      const ctx = cv.getContext("2d")!;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 3344, 1882);
      const now = new Date();
      const lstH = lst(now, 30.52), lat = 50.45;       // the edition's home sky
      const cx = 1494, cy = 680, S = 600;              // window into the break (2x)
      const pt = (i: number) => {
        const s = STARS[i];
        const q = project(s.ra, s.dec, lstH, lat);
        return { x: cx + q.x * S, y: cy + q.y * S, alt: q.alt, mag: s.mag, name: s.name };
      };
      // The caption band is reserved plate ground: no star may land in it.
      const band = { x: 1180, y: 500, w: 400, h: 120 };
      const inBand = (x: number, y: number) => x > band.x && x < band.x + band.w && y > band.y && y < band.y + band.h;
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 9]);
      for (const c of CONSTELLATIONS) for (const run of c.lines) {
        for (let i = 1; i < run.length; i++) {
          const a = pt(run[i - 1]), b = pt(run[i]);
          if (a.alt < 8 && b.alt < 8) continue;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.fillStyle = "#fff";
      const drawn = new Set<number>();
      for (const c of CONSTELLATIONS) for (const run of c.lines) for (const i of run) {
        if (drawn.has(i)) continue; drawn.add(i);
        const s = pt(i);
        if (s.alt < 8 || inBand(s.x, s.y)) continue;
        const r = Math.max(1.8, (3.1 - s.mag * 0.85) * 2);
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
        if (s.mag < 1.0) {
          ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(s.x - r * 3.4, s.y); ctx.lineTo(s.x + r * 3.4, s.y);
          ctx.moveTo(s.x, s.y - r * 3.4); ctx.lineTo(s.x, s.y + r * 3.4);
          ctx.stroke();
          if (s.name && !inBand(s.x + 14, s.y - 12)) {
            ctx.font = "italic 22px Georgia, serif";
            ctx.fillStyle = "rgba(0,255,0,.62)";       // label channel
            ctx.fillText(s.name, s.x + 14, s.y - 12);
            ctx.fillStyle = "#fff";
          }
        }
      }
      return cv;
    }
    function texture(img: HTMLImageElement | HTMLCanvasElement, unit: number, name: string) {
      const tex = gl!.createTexture();
      gl!.activeTexture(gl!.TEXTURE0 + unit); gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
      gl!.uniform1i(u[name], unit);
    }
    function resize() {
      if (!ready) return;
      const r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
      const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 700 ? 1.5 : 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(u.uResolution, canvas.width, canvas.height);
      paint();
    }
    function paint() {
      seq.style.setProperty("--progress", pv.toFixed(5));
      // The masthead lives over the painting and yields to the passage.
      document.documentElement.style.setProperty("--tide-progress", pv.toFixed(4));
      const deep = pv > 0.42 ? "1" : "0";
      if (document.documentElement.dataset.tideDeep !== deep) document.documentElement.dataset.tideDeep = deep;
      // Growth distributed across the whole approach — no wheel-touch lurch.
      const approach = smooth(0.02, 0.42, pv);
      const fade = smooth(0.16, 0.35, pv);
      stage.style.setProperty("--intro", String(1 - fade));
      stage.style.setProperty("--intro-shift", String(-48 * fade));
      // Act II leaves before the reveal brightens — never a lingering ghost.
      const threshold = smooth(0.35, 0.46, pv) * (1 - smooth(0.47, 0.53, pv));
      stage.style.setProperty("--threshold", String(threshold));
      const passage = smooth(0.565, 0.625, pv) * (1 - smooth(0.705, 0.78, pv));
      stage.style.setProperty("--passage", String(passage));
      const arrival = smooth(0.86, 0.98, pv);
      stage.style.setProperty("--arrival", String(arrival));
      // Staggered ink-in inside each act: the kicker leads, the serif follows.
      stage.style.setProperty("--thr-k", String(smooth(0.345, 0.43, pv) * (1 - smooth(0.46, 0.52, pv))));
      stage.style.setProperty("--thr-t", String(smooth(0.37, 0.475, pv) * (1 - smooth(0.47, 0.53, pv))));
      stage.style.setProperty("--arr-k", String(smooth(0.855, 0.945, pv)));
      stage.style.setProperty("--arr-t", String(smooth(0.878, 0.985, pv)));
      stage.style.setProperty("--skycap", String(smooth(0.50, 0.58, pv) * (1 - smooth(0.68, 0.76, pv))));
      stage.style.setProperty("--shade", String(1 - smooth(0.4, 0.66, pv)));
      const act = pv < 0.34 ? 0 : pv < 0.65 ? 1 : 2;
      chapters.forEach((el, i) => {
        el.classList.toggle("active", i === act);
        if (i === act) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
      });
      fill.style.transform = "scaleX(" + (pv + (1 - pv) * smooth(0.9, 0.975, pv)) + ")";
      if (hint) {
        const late = pv > 0.75 ? "1" : "0";
        if (hint.dataset.late !== late) { hint.dataset.late = late; hint.textContent = late === "1" ? t.hintEnd : t.hint; }
      }
      stage.classList.toggle("is-arrived", pv > 0.9);
      stage.dataset.progress = pv.toFixed(4);
      if (!ready) return;
      const mobile = innerWidth <= 700;
      const ratio = w / h, ir = 1672 / 941;
      const fitX = Math.min(1, ratio / ir), fitY = Math.min(1, ir / ratio);
      // The phone's crop starts on Olivia (right) and pans to the cloud
      // break (left of centre) as it opens — she has dissolved by then.
      const positionX = mobile ? 0.63 - 0.19 * smooth(0.33, 0.62, pv) : 0.5;
      const imageOrigin = 0.5 + (positionX - 0.5) * (1 - fitX);
      const px = (x: number) => (x - imageOrigin) / fitX + 0.5;
      const py = (y: number) => (y - 0.5) / fitY + 0.5;
      const baseHeight = 234 / 941 / fitY;
      const scale = Math.min(1 / (1 - 0.545 * approach), mobile ? 0.4 / baseHeight : 2.2);
      const figureH = baseHeight * scale;
      const horizon = py(1 - 698 / 941), baseFoot = py(1 - 756 / 941);
      const footY = mobile ? 0.185 - 0.025 * approach : horizon + (baseFoot - horizon) * scale;
      const originX = px(1060 / 1672);
      const centerX = mobile ? 0.7 : originX + 0.024 * approach;
      const figureW = figureH * (186 / 234) / ratio;
      const left = centerX - figureW * (89 / 186) + ptrX * 0.006;
      const bottom = footY - figureH * (5 / 234) - ptrY * 0.004;
      gl!.uniform4f(u.uFigure, left, bottom, figureW, figureH);
      gl!.uniform2f(u.uPointer, ptrX, ptrY);
      gl!.uniform1f(u.uEnter, enterV);
      gl!.uniform1f(u.uTime, time);
      gl!.uniform1f(u.uProgress, pv);
      gl!.uniform1f(u.uApproach, approach);
      gl!.uniform1f(u.uPositionX, positionX);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function tick(now: number) {
      raf = 0;
      if (!ready || !visible() || isPaused()) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now; time += dt;
      const k = 1 - Math.exp(-dt * 4.5);
      ptrX += (ptrTX - ptrX) * k; ptrY += (ptrTY - ptrY) * k;
      if (enterStart) enterV = quint(Math.min(1, (now - enterStart) / 1900));
      if (auto) {
        const tt = clamp((now - auto.start) / auto.duration);
        const te = tt * tt * (3 - 2 * tt);
        const value = auto.from + (auto.to - auto.from) * te;
        scrollTo(0, seq.offsetTop + value * range);
        target = value;
        if (tt >= 1) { auto = null; landing()?.focus?.({ preventScroll: true }); }
      }
      pv += (target - pv) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - pv) < 0.000025) pv = target;
      paint(); start();
    }
    function goReading() {
      auto = null; pv = target = 1; paint();
      landing()?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      landing()?.focus?.({ preventScroll: true });
    }
    function initialize() {
      if (ready) return;
      try {
        if ([plate, sanct, olivia, mask, arrival].some(i => !i.naturalWidth)) throw Error("tide image missing");
        gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
        if (!gl) return;
        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error("tide link");
        gl.useProgram(prog);
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const at = gl.getAttribLocation(prog, "aPosition");
        gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
        u = {};
        ["uPlate", "uSanctuary", "uFigureHD", "uMask", "uArrival", "uSkyMap", "uResolution", "uPointer", "uFigure", "uTime", "uProgress", "uApproach", "uPositionX", "uEnter"]
          .forEach(n => { u[n] = gl!.getUniformLocation(prog, n); });
        texture(plate, 0, "uPlate"); texture(sanct, 1, "uSanctuary"); texture(olivia, 2, "uFigureHD"); texture(mask, 3, "uMask"); texture(arrival, 4, "uArrival"); texture(drawTonightSky(), 5, "uSkyMap");
        ready = true; stage.dataset.renderer = "webgl";
        const at2 = location.hash.match(/(?:^#|&)p=([\d.]+)/);
        if (at2) { debug = true; pv = target = clamp(Number(at2[1])); time = 6; enterV = 1; }
        else enterStart = performance.now();
        measure(); canvas.classList.add("ready"); start();
        requestAnimationFrame(() => stage.classList.add("is-entered"));
      } catch {
        ready = false; canvas.classList.remove("ready");
        seq.classList.remove("enhanced"); seq.style.height = "auto";
        stage.dataset.renderer = "static";
        stage.classList.add("is-entered");
      }
    }

    // controls
    const begin = root.querySelector<HTMLButtonElement>(".tide-watch");
    const onBegin = () => {
      if (reduced.matches || !ready) { goReading(); return; }
      auto = { from: pv, to: 0.98, start: performance.now(), duration: 14000 * (0.98 - pv) };
      start();
    };
    begin?.addEventListener("click", onBegin); D.push(() => begin?.removeEventListener("click", onBegin));

    const skipBtn = root.querySelector<HTMLButtonElement>(".tide-skip");
    skipBtn?.addEventListener("click", goReading); D.push(() => skipBtn?.removeEventListener("click", goReading));

    const anchors = [0, 0.42, 0.74];
    chapters.forEach((el, i) => {
      const fn = () => { auto = { from: pv, to: anchors[i], start: performance.now(), duration: 400 + 2200 * Math.abs(anchors[i] - pv) }; start(); };
      el.addEventListener("click", fn); D.push(() => el.removeEventListener("click", fn));
    });

    // Arm the entrance (CSS hides the intro until the canvas breathes in);
    // pointer depth only on fine pointers.
    stage.dataset.armed = "1";
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const onPointer = (e: PointerEvent) => {
      if (!fine.matches) return;
      ptrTX = (e.clientX / innerWidth - 0.5) * 2;
      ptrTY = (e.clientY / innerHeight - 0.5) * 2;
      start();
    };
    addEventListener("pointermove", onPointer, { passive: true });
    D.push(() => removeEventListener("pointermove", onPointer));
    // If WebGL never arrives, the words must not stay hidden.
    const enterFallback = setTimeout(() => stage.classList.add("is-entered"), 2600);
    D.push(() => clearTimeout(enterFallback));

    const cancelEvents: Array<[string, (e: Event) => void]> = [];
    ["wheel", "touchstart", "pointerdown"].forEach(evt => {
      const fn = (e: Event) => {
        if (evt === "pointerdown" && (e.target as Element)?.closest?.(".tide-begin")) return;
        auto = null;
        if (debug) { debug = false; onScroll(); }
      };
      addEventListener(evt, fn, { passive: true }); cancelEvents.push([evt, fn]);
    });
    D.push(() => cancelEvents.forEach(([e, f]) => removeEventListener(e, f)));
    const onKey = (e: KeyboardEvent) => { if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) auto = null; };
    addEventListener("keydown", onKey); D.push(() => removeEventListener("keydown", onKey));

    addEventListener("scroll", onScroll, { passive: true }); D.push(() => removeEventListener("scroll", onScroll));
    addEventListener("resize", measure); D.push(() => removeEventListener("resize", measure));
    const io = new IntersectionObserver(es => { inView = es[0].isIntersecting; last = 0; start(); }, { threshold: 0 });
    io.observe(stage); D.push(() => io.disconnect());
    const vis = () => { last = 0; start(); };
    document.addEventListener("visibilitychange", vis); D.push(() => document.removeEventListener("visibilitychange", vis));
    const onRM = () => { measure(); };
    reduced.addEventListener("change", onRM); D.push(() => reduced.removeEventListener("change", onRM));
    const onLost = (e: Event) => { e.preventDefault(); ready = false; cancelAnimationFrame(raf); raf = 0; canvas.classList.remove("ready"); seq.classList.remove("enhanced"); seq.style.height = "auto"; };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", initialize);
    D.push(() => { canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", initialize); });

    // pause bridge from React state
    const mo = new MutationObserver(() => { if (!isPaused()) { last = 0; start(); } });
    mo.observe(stage, { attributes: true, attributeFilter: ["data-paused"] });
    D.push(() => mo.disconnect());

    const settled = (img: HTMLImageElement) =>
      img.complete && img.naturalWidth ? Promise.resolve() : new Promise<void>(r => {
        img.addEventListener("load", () => r(), { once: true });
        img.addEventListener("error", () => r(), { once: true });
      });
    let alive = true;
    Promise.all([plate, sanct, olivia, mask, arrival].map(settled)).then(() => {
      if (!alive) return;
      Promise.race([
        Promise.all([plate, sanct, olivia, mask, arrival].map(i => i.decode().catch(() => {}))),
        new Promise(r => setTimeout(r, 800)),
      ]).then(() => { if (alive) initialize(); });
    });
    D.push(() => { alive = false; cancelAnimationFrame(raf); });
    void poster;
    return () => D.forEach(f => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.locale]);

  return (
    <div ref={rootRef}>
      <section className="tide-seq" aria-labelledby="hero-headline">
        <div className="tide-stage" data-paused={paused ? "1" : "0"}>
          <div className="tide-world" aria-hidden>
            {/* Phones pull the 828w plates (~70K each) instead of the
                1672w originals — the shader samples in normalized UV,
                so the smaller textures change nothing but the bill. */}
            <img
              className="tide-poster"
              src="/arrival/scene-1672.webp"
              srcSet="/arrival/scene-828.webp 828w, /arrival/scene-1672.webp 1672w, /arrival/scene.webp 3344w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
            <img
              className="tide-src"
              id="tide-plate"
              src="/arrival/plate-1672.webp"
              srcSet="/arrival/plate-828.webp 828w, /arrival/plate-1672.webp 1672w, /arrival/plate.webp 3344w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <img
              className="tide-src"
              id="tide-sanctuary"
              src="/arrival/sanctuary-1672.webp"
              srcSet="/arrival/sanctuary-828.webp 828w, /arrival/sanctuary-1672.webp 1672w, /arrival/sanctuary.webp 3344w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <img className="tide-src" id="tide-olivia" src="/arrival/olivia-hd.webp" alt="" />
            <img
              className="tide-src"
              id="tide-mask"
              src="/arrival/arch-mask.webp"
              srcSet="/arrival/arch-mask-828.webp 828w, /arrival/arch-mask.webp 1672w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <img
              className="tide-src"
              id="tide-arrival"
              src="/arrival/arrival-1672.webp"
              srcSet="/arrival/arrival-828.webp 828w, /arrival/arrival-1672.webp 1672w, /arrival/arrival.webp 3344w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <canvas className="tide-canvas" />
          </div>
          <div className="tide-shade" aria-hidden />
          <div className="tide-seam" aria-hidden />

          {/* THE PLATE — the hero is not a fullscreen website; it is
              Plate I of the edition, framed and captioned like an
              engraved frontispiece. */}
          <div className="tide-plate-frame" aria-hidden>
            <i className="pf pf-t" /><i className="pf pf-b" /><i className="pf pf-l" /><i className="pf pf-r" />
            <i className="pf pf-t i2" /><i className="pf pf-b i2" /><i className="pf pf-l i2" /><i className="pf pf-r i2" />
            <span className="pf-title">{p.locale === "uk" ? "Гравюра I — Приплив відкривається" : "Plate I — The tide opens"}</span>
            <span className="pf-ed">No. {edition || "—"} · MMXXVI</span>
            <span className="pf-note">{p.locale === "uk" ? "У розриві — сьогоднішнє небо, обчислене для цієї години" : "The break opens on tonight's sky, computed for this hour"}</span>
            {/* The reveal's self-caption: screen-set like a museum label,
                scrimmed so no cloud can strike it. */}
            <span className="pf-sky">{skyCap.split("\n").map((l, i) => <span key={i} style={{ display: "block" }}>{l}</span>)}</span>
          </div>

          <div className="tide-intro">
            <p className="tide-kicker">{p.locale === "uk"
              ? `Гравюра I — Приплив відкривається · No. ${edition || "—"} · MMXXVI`
              : `Plate I — The tide opens · No. ${edition || "—"} · MMXXVI`}</p>
            <h1 id="hero-headline" className="tide-title">
              {p.titleLines.map((l, i) => (
                <span key={i} className={i === p.titleLines.length - 1 ? "em" : undefined}>{l}</span>
              ))}
            </h1>
            <p className="tide-sub">{p.subtitle}</p>
            <div className="tide-actions">
              {/* The first viewport offers the READING, not just the ride. */}
              <Link href={p.primaryHref} className="tide-begin">{t.read}<span aria-hidden> →</span></Link>
              <button type="button" className="tide-watch">{t.begin}<span aria-hidden> →</span></button>
            </div>
          </div>

          <div className="tide-line tide-threshold" aria-hidden>
            <p className="tide-line-k">II. {p.locale === "uk" ? "Приплив відкривається" : "The tide opens"}</p>
            <p className="tide-line-t">{t.threshold1}<br /><em>{t.threshold2}</em></p>
          </div>
          <div className="tide-line tide-passage" aria-hidden>
            <p className="tide-line-t"><em>{t.passage}</em></p>
          </div>
          {/* The spectacle resolves into an action: the arrival act carries
              a live door into the reading. */}
          <div className="tide-line tide-arrival">
            <p className="tide-line-k">{p.locale === "uk" ? "Оракул" : "The Oracle"}</p>
            <p className="tide-line-t">{t.arrival1}<br /><em>{t.arrival2}</em></p>
            <Link href={p.primaryHref} className="tide-arr-cta">{t.read}<span aria-hidden> →</span></Link>
          </div>

          <div className="tide-controls">
            <button type="button" className="tide-skip">{t.skip} →</button>
            <div className="tide-rail" aria-hidden>
              <div className="tide-chapters">
                <button type="button" className="tide-chapter">{t.ch1}</button>
                <button type="button" className="tide-chapter">{t.ch2}</button>
                <button type="button" className="tide-chapter">{t.ch3}</button>
              </div>
              <div className="tide-track"><span className="tide-fill" /></div>
              <p className="tide-hint">{t.hint}</p>
            </div>
            <button type="button" className="tide-pause" onClick={() => { setPaused(v => !v); setStill(false); }}>
              <span className="tide-pause-i" aria-hidden>{paused ? "▷" : "II"}</span>
              {still ? t.still : paused ? t.play : t.pause}
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .tide-seq { position: relative; background: var(--lg-night, #0b192a); }
        .tide-stage { position: relative; height: 100svh; min-height: 700px; overflow: hidden; isolation: isolate; background: #132a46; }
        :global(.tide-seq.enhanced) .tide-stage { position: sticky; top: 0; }
        .tide-world, .tide-shade { position: absolute; inset: 0; }
        .tide-poster, .tide-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; }
        .tide-canvas { opacity: 0; transition: opacity 0.7s var(--lg-ease); }
        :global(.tide-canvas.ready) { opacity: 1; }
        .tide-src { display: none; }
        .tide-seam { position: absolute; left: 0; right: 0; bottom: 0; height: 30%; pointer-events: none;
          background: linear-gradient(0deg, #0b192a 0%, rgba(11, 25, 42, 0.82) 34%, rgba(11, 25, 42, 0.3) 68%, transparent 100%);
          opacity: calc(var(--progress, 0)); }
        .tide-shade { pointer-events: none; opacity: var(--shade, 1); background:
          linear-gradient(90deg, rgba(10, 24, 39, 0.55), rgba(13, 30, 48, 0.30) 30%, rgba(15, 34, 55, 0.10) 45%, transparent 55%),
          linear-gradient(180deg, rgba(8, 18, 30, 0.45), transparent 22%); }
        /* ── THE PLATE FRAME — double hairline, engraved furniture ── */
        .tide-plate-frame { position: absolute; inset: 0; z-index: 2; pointer-events: none;
          --pfi: clamp(14px, 1.8vw, 26px); }
        .tide-plate-frame .pf { position: absolute; background: rgba(232, 233, 255, 0.26); }
        .pf-t, .pf-b { left: var(--pfi); right: var(--pfi); height: 1px; transform: scaleX(0); transform-origin: left;
          transition: transform 1100ms var(--lg-ease, cubic-bezier(0.625, 0.05, 0, 1)) 120ms; }
        .pf-l, .pf-r { top: var(--pfi); bottom: var(--pfi); width: 1px; transform: scaleY(0); transform-origin: top;
          transition: transform 1100ms var(--lg-ease, cubic-bezier(0.625, 0.05, 0, 1)) 260ms; }
        .pf-t { top: var(--pfi); } .pf-b { bottom: var(--pfi); transform-origin: right; }
        .pf-l { left: var(--pfi); } .pf-r { right: var(--pfi); transform-origin: bottom; }
        .tide-plate-frame .i2 { background: rgba(232, 233, 255, 0.11); }
        .pf-t.i2 { top: calc(var(--pfi) + 5px); } .pf-b.i2 { bottom: calc(var(--pfi) + 5px); }
        .pf-l.i2 { left: calc(var(--pfi) + 5px); } .pf-r.i2 { right: calc(var(--pfi) + 5px); }
        :global(.tide-stage.is-entered) .pf-t, :global(.tide-stage.is-entered) .pf-b { transform: none; }
        :global(.tide-stage.is-entered) .pf-l, :global(.tide-stage.is-entered) .pf-r { transform: none; }
        .pf-title, .pf-ed, .pf-note { position: absolute; font-family: var(--font-mono), monospace;
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(183, 188, 233, 0.66);
          opacity: 0; transition: opacity 900ms var(--lg-ease) 900ms; }
        :global(.tide-stage.is-entered) .pf-title, :global(.tide-stage.is-entered) .pf-ed,
        :global(.tide-stage.is-entered) .pf-note { opacity: 1; }
        /* The top captions belong to the plate, not the masthead: they
           surface only as the masthead yields to the tide. */
        .pf-title { top: calc(var(--pfi) - 4px); left: calc(var(--pfi) + 18px); transform: translateY(-50%);
          padding: 0 10px; background: rgba(7, 15, 25, 0.85);
          opacity: clamp(0, (var(--tide-progress, 0) - 0.32) * 4, 1) !important; }
        .pf-ed { top: calc(var(--pfi) - 4px); right: calc(var(--pfi) + 18px); transform: translateY(-50%);
          padding: 0 10px; background: rgba(7, 15, 25, 0.85);
          opacity: clamp(0, (var(--tide-progress, 0) - 0.32) * 4, 1) !important; }
        /* The reveal's self-caption — gilt letterpress with its own pool of
           night behind it, so the painting can never strike the claim. */
        .pf-sky { position: absolute; left: 30.5%; top: 21.5%; padding: 8px 2px;
          font-size: 9.5px; letter-spacing: 0.2em; line-height: 2.1; text-align: left;
          color: rgba(228, 195, 128, 0.98);
          text-shadow: 0 1px 3px rgba(7, 15, 25, 0.95), 0 0 14px rgba(7, 15, 25, 0.9), 0 0 30px rgba(7, 15, 25, 0.7);
          border-top: 1px solid rgba(214, 178, 118, 0.5);
          border-bottom: 1px solid rgba(214, 178, 118, 0.5);
          opacity: var(--skycap, 0) !important; transition: none;
          transform: translateY(calc((1 - var(--skycap, 0)) * 8px)); }
        .pf-sky::before { content: ""; position: absolute; inset: -34% -18%; z-index: -1;
          background: radial-gradient(70% 80% at 50% 50%, rgba(7, 15, 25, 0.78), rgba(7, 15, 25, 0.35) 62%, transparent 82%); }
        /* The margin inscription runs vertically along the left rule,
           the way engraved plates sign their method. */
        .pf-note { left: calc(var(--pfi) - 4px); top: 50%;
          transform: translate(-50%, -50%) rotate(180deg); writing-mode: vertical-rl;
          padding: 12px 0; background: rgba(7, 15, 25, 0.85); font-size: 8px; letter-spacing: 0.26em; }
        @media (max-width: 900px) {
          .pf-note { display: none; } .pf-title { font-size: 8px; } .pf-ed { font-size: 8px; }
        }
        .tide-intro { position: absolute; z-index: 2; left: clamp(24px, 5.25vw, 104px); top: clamp(120px, 17vh, 190px);
          max-width: 560px; width: 46%; opacity: var(--intro, 1);
          transform: translateY(calc(var(--intro-shift, 0) * 1px)); }
        /* The intro's eyebrow IS the plate caption — the conceit is claimed
           from the first frame, in engraved caption voice. */
        .tide-kicker { margin: 0 0 26px;
          font-family: var(--font-mono), monospace; font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(232, 233, 255, 0.88); }
        .tide-title { margin: 0 0 26px; font-family: var(--font-heading), serif; font-weight: 400;
          font-size: clamp(60px, 6.8vw, 118px); line-height: 0.92; letter-spacing: -0.05em; color: #e8e9ff; }
        .tide-title span { display: block; }
        .tide-title .em { font-style: italic; }
        .tide-sub { max-width: 330px; margin: 0 0 30px; font-size: 15px; line-height: 1.75; color: rgba(232, 233, 255, 0.82); }
        .tide-actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        /* The primary speaks the engraved language: a gilt hairline pill,
           tracked uppercase mono — the same voice as the masthead's CTA —
           and it opens the READING. The ride is the quiet second action. */
        .tide-actions :global(.tide-begin) { display: inline-flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 26px;
          border: 1px solid rgba(224, 183, 104, 0.85); border-radius: 999px; cursor: pointer;
          background: rgba(224, 183, 104, 0.06); color: #e0b768; text-decoration: none;
          font-family: var(--font-mono), monospace; font-size: 11px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase;
          transition: background 0.3s var(--lg-ease), border-color 0.3s var(--lg-ease), color 0.3s var(--lg-ease); }
        .tide-actions :global(.tide-begin:hover) { background: rgba(224, 183, 104, 0.16); border-color: #e0b768; color: #edca8b; }
        .tide-watch { display: inline-flex; min-height: 48px; align-items: center; gap: 8px;
          border: 0; padding: 0; background: none; cursor: pointer; color: #e8e9ff;
          font-family: var(--font-body), sans-serif; font-size: 14px;
          border-bottom: 1px solid rgba(232, 233, 255, 0.5); transition: border-color 0.3s; }
        .tide-watch:hover { border-color: #e8e9ff; }
        .tide-actions :global(.tide-secondary) { display: inline-flex; min-height: 48px; align-items: center;
          color: #e8e9ff; font-size: 14px; text-decoration: none; border-bottom: 1px solid rgba(232, 233, 255, 0.5);
          transition: border-color 0.3s; }
        .tide-actions :global(.tide-secondary:hover) { border-color: #e8e9ff; }
        .tide-trust { display: flex; align-items: center; gap: 12px; margin: 22px 0 0;
          font-family: var(--font-heading), serif; font-style: italic;
          font-size: 14px; color: rgba(189, 197, 239, 0.85); }
        .tide-trust::before { content: ""; width: 20px; height: 1px; background: rgba(183, 188, 233, 0.6); }
        /* ── ENTRANCE — the almanac inks itself in while the plate settles ── */
        :global(.tide-stage[data-armed="1"] .tide-kicker),
        :global(.tide-stage[data-armed="1"] .tide-title span),
        :global(.tide-stage[data-armed="1"] .tide-sub),
        :global(.tide-stage[data-armed="1"] .tide-actions),
        :global(.tide-stage[data-armed="1"] .tide-trust) {
          opacity: 0; transform: translateY(14px);
          transition: opacity 950ms var(--lg-ease, cubic-bezier(0.625, 0.05, 0, 1)) var(--en-d, 0ms),
            transform 950ms var(--lg-ease, cubic-bezier(0.625, 0.05, 0, 1)) var(--en-d, 0ms); }
        :global(.tide-stage[data-armed="1"] .tide-kicker) { --en-d: 140ms; }
        :global(.tide-stage[data-armed="1"] .tide-title span:nth-child(1)) { --en-d: 300ms; }
        :global(.tide-stage[data-armed="1"] .tide-title span:nth-child(2)) { --en-d: 400ms; }
        :global(.tide-stage[data-armed="1"] .tide-title span:nth-child(3)) { --en-d: 500ms; }
        :global(.tide-stage[data-armed="1"] .tide-sub) { --en-d: 640ms; }
        :global(.tide-stage[data-armed="1"] .tide-actions) { --en-d: 780ms; }
        :global(.tide-stage[data-armed="1"] .tide-trust) { --en-d: 920ms; }
        :global(.tide-stage[data-armed="1"] .tide-kicker::before) {
          transform: scaleX(0); transform-origin: left;
          transition: transform 900ms var(--lg-ease, cubic-bezier(0.625, 0.05, 0, 1)) 60ms; }
        :global(.tide-stage.is-entered .tide-kicker),
        :global(.tide-stage.is-entered .tide-title span),
        :global(.tide-stage.is-entered .tide-sub),
        :global(.tide-stage.is-entered .tide-actions),
        :global(.tide-stage.is-entered .tide-trust) { opacity: 1; transform: none; }
        :global(.tide-stage.is-entered .tide-kicker::before) { transform: none; }
        .tide-line { position: absolute; z-index: 2; left: clamp(24px, 5.25vw, 104px); top: 27%; max-width: 460px;
          opacity: 0; pointer-events: none;
          text-shadow: 0 1px 4px rgba(7, 21, 34, 0.9), 0 0 26px rgba(7, 21, 34, 0.8), 0 0 60px rgba(7, 21, 34, 0.6); }
        .tide-line::before { content: ""; position: absolute; inset: -12% -18%; z-index: -1;
          background: radial-gradient(60% 55% at 40% 45%, rgba(7, 21, 34, 0.55), transparent 75%); }
        .tide-threshold { opacity: var(--threshold, 0); }
        .tide-passage { opacity: var(--passage, 0); top: 34%; }
        .tide-arrival { opacity: var(--arrival, 0); left: 46%; top: 33%; transform: translateX(-50%); text-align: center; }
        /* The closing words own their dark sky pocket — no painted star may
           punctuate them. */
        .tide-arrival::before { inset: -18% -24%;
          background: radial-gradient(62% 58% at 50% 46%, rgba(7, 21, 34, 0.72), transparent 78%); }
        .tide-arrival :global(.tide-arr-cta) { display: inline-flex; align-items: center; gap: 10px;
          margin-top: 26px; min-height: 46px; padding: 0 24px;
          border: 1px solid rgba(224, 183, 104, 0.85); border-radius: 999px;
          background: rgba(7, 21, 34, 0.62); color: #e0b768; text-decoration: none;
          font-family: var(--font-mono), monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
          opacity: var(--arr-t, 0); pointer-events: none;
          transition: background 0.3s var(--lg-ease), color 0.3s var(--lg-ease); }
        .tide-arrival :global(.tide-arr-cta:hover) { background: rgba(224, 183, 104, 0.16); color: #edca8b; }
        :global(.tide-stage.is-arrived) .tide-arrival { pointer-events: auto; }
        :global(.tide-stage.is-arrived .tide-arr-cta) { pointer-events: auto; }
        .tide-line-k { margin: 0 0 14px; font-family: var(--font-mono), monospace; font-size: 11px;
          letter-spacing: 0.24em; text-transform: uppercase; color: #b7bce9; }
        .tide-line-t { margin: 0; font-family: var(--font-heading), serif; font-weight: 400;
          font-size: clamp(38px, 4vw, 68px); line-height: 1.06; letter-spacing: -0.02em; color: #e8e9ff; }
        /* Inside each act the kicker leads and the serif follows, rising as it inks. */
        .tide-threshold .tide-line-k { opacity: var(--thr-k, 0);
          transform: translateY(calc((1 - var(--thr-k, 0)) * 10px)); }
        .tide-threshold .tide-line-t { opacity: var(--thr-t, 0);
          transform: translateY(calc((1 - var(--thr-t, 0)) * 18px)); }
        .tide-passage .tide-line-t { transform: translateY(calc((1 - var(--passage, 0)) * 18px)); }
        .tide-arrival .tide-line-k { opacity: var(--arr-k, 0);
          transform: translateY(calc((1 - var(--arr-k, 0)) * 10px)); }
        .tide-arrival .tide-line-t { opacity: var(--arr-t, 0);
          transform: translateY(calc((1 - var(--arr-t, 0)) * 18px)); }
        /* The passage line keeps the edition's one text column. */
        .tide-controls { position: absolute; z-index: 3; left: 0; right: 0; bottom: 0;
          display: grid; grid-template-columns: 1fr minmax(300px, 430px) 1fr; align-items: end; gap: 30px;
          padding: 22px clamp(24px, 5.25vw, 104px) 20px;
          background: linear-gradient(0deg, rgba(7, 21, 34, 0.5), rgba(7, 21, 34, 0.14) 60%, transparent 88%);
          font-family: var(--font-mono), monospace; }
        :global(.tide-stage.is-scrolled) .tide-hint { opacity: 0; transition: opacity 600ms var(--lg-ease); }
        /* At arrival the frame concedes: one voice — the door. */
        :global(.tide-stage.is-arrived) .tide-skip { opacity: 0; pointer-events: none; transition: opacity 500ms var(--lg-ease); }
        :global(.tide-stage.is-arrived) .tide-hint { display: none; }
        :global(.tide-stage.is-arrived) .tide-chapters { opacity: 0; pointer-events: none; transition: opacity 500ms var(--lg-ease); }
        .tide-skip, .tide-pause, .tide-chapter { background: none; border: 0; cursor: pointer; color: #b7bce9;
          font-family: var(--font-mono), monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
          padding: 8px 0; transition: color 0.3s var(--lg-ease); }
        .tide-skip:hover, .tide-pause:hover, .tide-chapter:hover { color: #e8e9ff; }
        .tide-pause { justify-self: end; display: inline-flex; align-items: center; gap: 10px; }
        .tide-pause-i { display: grid; place-items: center; width: 26px; height: 26px;
          border: 1px solid rgba(183, 188, 233, 0.5); border-radius: 50%; font-size: 9px; }
        .tide-chapters { display: flex; justify-content: space-between; gap: 12px; }
        .tide-chapter.active { color: #e0b768; }
        .tide-chapter.active::before { content: "✦ "; }
        .tide-track { height: 1px; margin: 10px 0 8px; background: rgba(232, 233, 255, 0.22); }
        .tide-fill { display: block; height: 100%; background: #e0b768; transform: scaleX(0); transform-origin: left; }
        .tide-hint { margin: 0; text-align: center; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(183, 188, 233, 0.8); padding: 0 10px; background: rgba(7, 15, 25, 0.85);
          width: fit-content; margin-inline: auto; }
        .tide-reading { position: relative; overflow: hidden; min-height: 88svh; background: transparent;
          display: grid; grid-template-columns: 1fr 1fr; gap: 55px;
          padding: 110px clamp(24px, 5.25vw, 104px) 90px; }
        .tide-reading::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 44vh;
          z-index: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(41, 78, 122, 0.6) 0%, rgba(28, 54, 85, 0.34) 34%, rgba(18, 40, 61, 0.16) 62%, transparent 100%); }
        /* The watermark stays out of the grid flow — one accidental
           'position: relative' here once seated it as a giant first
           cell and shoved the whole room diagonal. */
        .tide-reading > :not(.tide-watermark) { position: relative; z-index: 1; }
        .tide-reading :global(canvas) { z-index: 0; }
        .tide-watermark { position: absolute; left: -4%; top: 4%; z-index: 0; font-size: 44vh; line-height: 1;
          color: rgba(183, 188, 233, 0.05); pointer-events: none; }
        .tide-watermark :global(svg) { width: 1em; height: 1em; display: block; opacity: 0.13; }
        /* The ephemeris — a marginal note in the almanac's own frame. */
        .tide-eph { display: grid; grid-template-columns: 44px 1fr; gap: 18px; align-items: center;
          margin: 6px 0 34px; padding: 16px 18px;
          border: 1px solid rgba(232, 233, 255, 0.16);
          outline: 1px solid rgba(232, 233, 255, 0.07); outline-offset: 4px; }
        .tide-eph-moon { display: grid; place-items: center; width: 44px; height: 44px;
          color: #e8e9ff; font-size: 26px; line-height: 1; }
        .tide-eph-moon :global(svg) { width: 44px; height: 44px; display: block; opacity: 0.85; }
        .tide-eph-k { margin: 0 0 7px; font-family: var(--font-mono), monospace; font-size: 10px;
          letter-spacing: 0.22em; text-transform: uppercase; color: #b7bce9; }
        .tide-eph-line { margin: 0; font-family: var(--font-mono), monospace; font-size: 11px;
          line-height: 1.7; letter-spacing: 0.06em; color: rgba(183, 188, 233, 0.78); }
        .tide-r-title { margin: 0 0 26px; font-family: var(--font-heading), serif; font-weight: 400;
          font-size: clamp(42px, 4.4vw, 70px); line-height: 1.05; letter-spacing: -0.03em; color: #e8e9ff; }
        .tide-r-title em { font-style: italic; }
        .tide-r-desc { max-width: 380px; font-size: 15px; line-height: 1.75; color: rgba(206, 210, 245, 0.85); }
        .tide-intents { position: relative; }
        .tide-intents::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: rgba(232, 233, 255, 0.25); transform: scaleX(0); transform-origin: left;
          transition: transform 700ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)) 180ms; }
        .tide-intent { position: relative; display: grid; grid-template-columns: 44px 1fr auto; align-items: center; width: 100%;
          padding: 24px 4px; background: none; border: 0;
          cursor: pointer; text-align: left; }
        /* the row's rule is drawn, not painted — it inks in on arrival */
        .tide-intent::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: rgba(232, 233, 255, 0.25); transform: scaleX(0); transform-origin: left;
          transition: transform 700ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)) calc(280ms + var(--ii, 0) * 60ms),
            background 0.3s var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)); }
        .tide-intent:hover::after { background: rgba(232, 233, 255, 0.5); }
        /* ── ink-in: the room rises 8px and settles, 60ms steps ── */
        .tide-r-head .tide-kicker, .tide-r-title, .tide-r-desc, .tide-eph,
        .tide-intent, .tide-q-label, .tide-q, .tide-r-actions {
          opacity: 0; transform: translateY(8px);
          transition: opacity 650ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)) var(--ink-d, 0ms),
            transform 650ms var(--lg-ease, cubic-bezier(0.16, 1, 0.3, 1)) var(--ink-d, 0ms); }
        .tide-r-title { --ink-d: 80ms; }
        .tide-r-desc { --ink-d: 160ms; }
        .tide-eph { --ink-d: 140ms; }
        .tide-intent { --ink-d: calc(240ms + var(--ii, 0) * 60ms); }
        .tide-q-label { --ink-d: 480ms; }
        .tide-q { --ink-d: 540ms; }
        .tide-r-actions { --ink-d: 620ms; }
        :global(.tide-reading.is-inked) .tide-r-head .tide-kicker,
        :global(.tide-reading.is-inked) .tide-r-title,
        :global(.tide-reading.is-inked) .tide-r-desc,
        :global(.tide-reading.is-inked) .tide-eph,
        :global(.tide-reading.is-inked) .tide-intent,
        :global(.tide-reading.is-inked) .tide-q-label,
        :global(.tide-reading.is-inked) .tide-q,
        :global(.tide-reading.is-inked) .tide-r-actions { opacity: 1; transform: none; }
        :global(.tide-reading.is-inked) .tide-intents::before,
        :global(.tide-reading.is-inked) .tide-intent::after { transform: none; }
        .tide-intent-n { font-family: var(--font-mono), monospace; font-size: 11px; letter-spacing: 0.18em;
          color: #b7bce9; }
        .tide-intent-l { font-family: var(--font-heading), serif; font-size: clamp(26px, 2.2vw, 34px);
          color: #e8e9ff; transition: color 0.3s var(--lg-ease); }
        .tide-intent-a { color: #e0b768; opacity: 0; transform: translateX(-8px);
          transition: opacity 0.3s var(--lg-ease), transform 0.3s var(--lg-ease); }
        .tide-intent.on .tide-intent-l { color: #e0b768; }
        .tide-intent.on .tide-intent-a { opacity: 1; transform: none; }
        .tide-q-label { margin: 34px 0 12px; font-family: var(--font-mono), monospace; font-size: 10.5px;
          letter-spacing: 0.22em; text-transform: uppercase; color: #b7bce9; }
        .tide-q { margin: 0 0 34px; font-family: var(--font-heading), serif; font-size: 26px; color: #e8e9ff; }
        .tide-r-actions { display: flex; align-items: center; gap: 26px; flex-wrap: wrap; }
        .tide-r-actions :global(.tide-oracle) { display: inline-flex; align-items: center; gap: 14px;
          min-height: 54px; padding: 0 24px; border-radius: 2px; background: #e0b768; color: #183043;
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: background 0.3s var(--lg-ease), transform 0.3s var(--lg-ease); }
        .tide-r-actions :global(.tide-oracle:hover) { background: #edca8b; transform: translateY(-2px); }
        .tide-r-actions :global(.tide-daily) { color: #e8e9ff; font-size: 14px; text-decoration: none;
          border-bottom: 1px solid rgba(232, 233, 255, 0.5); padding-bottom: 2px; transition: border-color 0.3s; }
        .tide-r-actions :global(.tide-daily:hover) { border-color: #e8e9ff; }
        @media (max-width: 900px) {
          .tide-intro { width: calc(100% - 48px); padding-right: 0; top: 96px; }
          .tide-arrival { left: 50%; top: 24%; width: 88vw; max-width: none; }
          .tide-threshold { top: 22%; }
          .tide-title { font-size: clamp(44px, 12vw, 84px); }
          .tide-controls { grid-template-columns: auto 1fr auto; gap: 14px; padding: 16px 24px 14px; }
          .tide-hint { display: none; }
          .tide-reading { grid-template-columns: 1fr; gap: 34px; padding: 80px 24px 70px; }
        }
        @media (max-width: 640px) {
          /* The phone's stage keeps one quiet row: skip · progress · pause.
             Chapter names return on wider decks. */
          .tide-chapters { display: none; }
          .tide-skip { white-space: nowrap; font-size: 9.5px; }
          .tide-pause { font-size: 0; gap: 0; }
          .tide-pause .tide-pause-i { font-size: 9px; }
          .tide-track { margin: 12px 0 6px; }
          .tide-sub { font-size: 15px; }
          .tide-watermark { font-size: 34vh; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tide-canvas { display: none; }
          .tide-line, .tide-controls .tide-rail { display: none; }
          :global(.tide-stage[data-armed="1"] .tide-kicker),
          :global(.tide-stage[data-armed="1"] .tide-title span),
          :global(.tide-stage[data-armed="1"] .tide-sub),
          :global(.tide-stage[data-armed="1"] .tide-actions),
          :global(.tide-stage[data-armed="1"] .tide-trust) { opacity: 1; transform: none; transition: none; }
          :global(.tide-stage[data-armed="1"] .tide-kicker::before) { transform: none; transition: none; }
          .tide-r-head .tide-kicker, .tide-r-title, .tide-r-desc, .tide-eph,
          .tide-intent, .tide-q-label, .tide-q, .tide-r-actions {
            opacity: 1; transform: none; transition: none; }
          .tide-intents::before, .tide-intent::after { transform: none; transition: none; }
        }
      `}</style>
    </div>
  );
}
