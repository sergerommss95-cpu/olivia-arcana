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
import TrueMoon from "@/components/sky/TrueMoon";
import { moonState, moonDegreesSince } from "@/lib/sky/live";

const VERT = "attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}";
const FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uPlate,uSanctuary,uFigureHD;
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
    begin: "Begin the journey", threshold1: "A little stillness.", threshold2: "A different perspective.",
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
    begin: "Почати подорож", threshold1: "Трохи тиші.", threshold2: "Інший погляд.",
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
  /* LUNA VERA — the reading's watermark is the real Moon tonight,
     and the almanac remembers how far she has travelled since the
     visitor last stood here. Client-only (Date-dependent). */
  const [luna, setLuna] = useState<{ phaseDeg: number; line: string } | null>(null);

  useEffect(() => {
    try {
      const m = moonState();
      const isUk = p.locale === "uk";
      const KEY = "oa-almanac-memory";
      let rec: { t: number; lon: number } | null = null;
      try {
        rec = JSON.parse(localStorage.getItem(KEY) ?? "null");
      } catch {}
      const nowMs = Date.now();
      let line: string;
      if (rec && typeof rec.t === "number" && typeof rec.lon === "number" && nowMs - rec.t > 6 * 3600_000) {
        const deg = moonDegreesSince(rec.lon, rec.t);
        line = isUk
          ? `Відколи ви були тут, Місяць пройшов ${deg}° неба. Сьогодні — ${m.nameUk.toLowerCase()}.`
          : `Since you last came, the Moon has travelled ${deg}° of sky. Tonight — ${m.nameEn.toLowerCase()}.`;
      } else {
        const pct = Math.round(m.illum * 100);
        line = isUk
          ? `Місяць над вами зараз — ${m.nameUk.toLowerCase()}, освітлено ${pct}%. Водяний знак намальовано правдиво.`
          : `The Moon above you now — ${m.nameEn.toLowerCase()}, ${pct}% lit. The watermark is drawn true.`;
      }
      if (!rec || nowMs - rec.t > 3600_000) {
        try {
          localStorage.setItem(KEY, JSON.stringify({ t: nowMs, lon: m.eclipticLon }));
        } catch {}
      }
      setLuna({ phaseDeg: m.phaseDeg, line });
    } catch {}
  }, [p.locale]);
  const t = p.locale === "uk" ? T.uk : T.en;

  /* The reading room inks itself in as it arrives: head lines rise,
     the intent borders draw, 60ms apart — once, then it stays set. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reading = root.querySelector<HTMLElement>(".tide-reading");
    if (!reading) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reading.classList.add("is-inked");
      return;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          reading.classList.add("is-inked");
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(reading);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current!;
    const seq = root.querySelector<HTMLElement>(".tide-seq")!;
    const stage = root.querySelector<HTMLElement>(".tide-stage")!;
    const canvas = root.querySelector<HTMLCanvasElement>(".tide-canvas")!;
    const poster = root.querySelector<HTMLImageElement>(".tide-poster")!;
    const plate = root.querySelector<HTMLImageElement>("#tide-plate")!;
    const sanct = root.querySelector<HTMLImageElement>("#tide-sanctuary")!;
    const olivia = root.querySelector<HTMLImageElement>("#tide-olivia")!;
    const reading = root.querySelector<HTMLElement>(".tide-reading")!;
    const chapters = Array.from(root.querySelectorAll<HTMLButtonElement>(".tide-chapter"));
    const fill = root.querySelector<HTMLElement>(".tide-fill")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    let gl: WebGLRenderingContext | null = null;
    let u: Record<string, WebGLUniformLocation | null> = {};
    let ready = false, inView = true, raf = 0, last = 0, time = 3;
    let pv = 0, target = 0, range = 0, w = 1, h = 1;
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
    function texture(img: HTMLImageElement, unit: number, name: string) {
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
      const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 700 ? 1.5 : 1.6);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(u.uResolution, canvas.width, canvas.height);
      paint();
    }
    function paint() {
      seq.style.setProperty("--progress", pv.toFixed(5));
      const approach = quint(clamp((pv - 0.015) / 0.455));
      const fade = smooth(0.16, 0.35, pv);
      stage.style.setProperty("--intro", String(1 - fade));
      stage.style.setProperty("--intro-shift", String(-48 * fade));
      const threshold = smooth(0.35, 0.46, pv) * (1 - smooth(0.5, 0.59, pv));
      stage.style.setProperty("--threshold", String(threshold));
      const passage = smooth(0.565, 0.625, pv) * (1 - smooth(0.705, 0.78, pv));
      stage.style.setProperty("--passage", String(passage));
      const arrival = smooth(0.86, 0.98, pv);
      stage.style.setProperty("--arrival", String(arrival));
      stage.style.setProperty("--shade", String(1 - smooth(0.4, 0.66, pv)));
      const act = pv < 0.34 ? 0 : pv < 0.65 ? 1 : 2;
      chapters.forEach((el, i) => {
        el.classList.toggle("active", i === act);
        if (i === act) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
      });
      fill.style.transform = "scaleX(" + pv + ")";
      stage.dataset.progress = pv.toFixed(4);
      if (!ready) return;
      const mobile = innerWidth <= 700;
      const ratio = w / h, ir = 1672 / 941;
      const fitX = Math.min(1, ratio / ir), fitY = Math.min(1, ir / ratio);
      const positionX = mobile ? 0.63 : 0.5;
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
      const left = centerX - figureW * (89 / 186);
      const bottom = footY - figureH * (5 / 234);
      gl!.uniform4f(u.uFigure, left, bottom, figureW, figureH);
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
      if (auto) {
        const tt = clamp((now - auto.start) / auto.duration);
        const value = auto.from + (auto.to - auto.from) * tt;
        scrollTo(0, seq.offsetTop + value * range);
        target = value;
        if (tt >= 1) { auto = null; reading.focus({ preventScroll: true }); }
      }
      pv += (target - pv) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - pv) < 0.000025) pv = target;
      paint(); start();
    }
    function goReading() {
      auto = null; pv = target = 1; paint();
      reading.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      reading.focus({ preventScroll: true });
    }
    function initialize() {
      if (ready) return;
      try {
        if ([plate, sanct, olivia].some(i => !i.naturalWidth)) throw Error("tide image missing");
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
        ["uPlate", "uSanctuary", "uFigureHD", "uResolution", "uSanctuarySize", "uFigure", "uTime", "uProgress", "uApproach", "uPositionX"]
          .forEach(n => { u[n] = gl!.getUniformLocation(prog, n); });
        texture(plate, 0, "uPlate"); texture(sanct, 1, "uSanctuary"); texture(olivia, 2, "uFigureHD");
        gl.uniform2f(u.uSanctuarySize, sanct.naturalWidth, sanct.naturalHeight);
        ready = true; stage.dataset.renderer = "webgl";
        const at2 = location.hash.match(/(?:^#|&)p=([\d.]+)/);
        if (at2) { debug = true; pv = target = clamp(Number(at2[1])); time = 6; }
        measure(); canvas.classList.add("ready"); start();
      } catch {
        ready = false; canvas.classList.remove("ready");
        seq.classList.remove("enhanced"); seq.style.height = "auto";
        stage.dataset.renderer = "static";
      }
    }

    // controls
    const begin = root.querySelector<HTMLButtonElement>(".tide-begin");
    const onBegin = () => {
      if (reduced.matches || !ready) { goReading(); return; }
      auto = { from: pv, to: 0.98, start: performance.now(), duration: 12500 * (0.98 - pv) };
      start();
    };
    begin?.addEventListener("click", onBegin); D.push(() => begin?.removeEventListener("click", onBegin));

    const skipBtn = root.querySelector<HTMLButtonElement>(".tide-skip");
    skipBtn?.addEventListener("click", goReading); D.push(() => skipBtn?.removeEventListener("click", goReading));

    const anchors = [0, 0.42, 0.7];
    chapters.forEach((el, i) => {
      const fn = () => { auto = { from: pv, to: anchors[i], start: performance.now(), duration: 900 }; start(); };
      el.addEventListener("click", fn); D.push(() => el.removeEventListener("click", fn));
    });

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
    Promise.all([plate, sanct, olivia].map(settled)).then(() => {
      if (!alive) return;
      Promise.race([
        Promise.all([plate, sanct, olivia].map(i => i.decode().catch(() => {}))),
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
              src="/arrival/scene.webp"
              srcSet="/arrival/scene-828.webp 828w, /arrival/scene.webp 1672w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
            <img
              className="tide-src"
              id="tide-plate"
              src="/arrival/plate.webp"
              srcSet="/arrival/plate-828.webp 828w, /arrival/plate.webp 1672w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <img
              className="tide-src"
              id="tide-sanctuary"
              src="/arrival/sanctuary.webp"
              srcSet="/arrival/sanctuary-828.webp 828w, /arrival/sanctuary.webp 1672w"
              sizes="(max-width: 767px) 50vw, 100vw"
              alt=""
            />
            <img className="tide-src" id="tide-olivia" src="/arrival/olivia-hd.webp" alt="" />
            <canvas className="tide-canvas" />
          </div>
          <div className="tide-shade" aria-hidden />
          <div className="tide-seam" aria-hidden />

          <div className="tide-intro">
            <p className="tide-kicker">{p.kicker}</p>
            <h1 id="hero-headline" className="tide-title">
              {p.titleLines.map((l, i) => (
                <span key={i} className={i === p.titleLines.length - 1 ? "em" : undefined}>{l}</span>
              ))}
            </h1>
            <p className="tide-sub">{p.subtitle}</p>
            <div className="tide-actions">
              <button type="button" className="tide-begin">{t.begin}<span aria-hidden> ↗</span></button>
              <Link href={p.secondaryHref} className="tide-secondary">{p.secondaryLabel}</Link>
            </div>
            <p className="tide-trust">{p.trust}</p>
          </div>

          <div className="tide-line tide-threshold" aria-hidden>
            <p className="tide-line-k">II. {p.locale === "uk" ? "Приплив відкривається" : "The tide opens"}</p>
            <p className="tide-line-t">{t.threshold1}<br /><em>{t.threshold2}</em></p>
          </div>
          <div className="tide-line tide-passage" aria-hidden>
            <p className="tide-line-t"><em>{t.passage}</em></p>
          </div>
          <div className="tide-line tide-arrival" aria-hidden>
            <p className="tide-line-k">{p.locale === "uk" ? "Оракул" : "The Oracle"}</p>
            <p className="tide-line-t">{t.arrival1}<br /><em>{t.arrival2}</em></p>
          </div>

          <div className="tide-controls">
            <button type="button" className="tide-skip">{t.skip} ↗</button>
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

      <section className="tide-reading" id="reading" tabIndex={-1} aria-labelledby="reading-title">
        <div className="tide-watermark" aria-hidden>
          {luna ? <TrueMoon phaseDeg={luna.phaseDeg} /> : "☾"}
        </div>
        <div className="tide-r-head">
          <p className="tide-kicker">{t.rKicker}</p>
          <h2 id="reading-title" className="tide-r-title">
            {t.rTitleA}<br />{t.rTitleB}<em>{t.rTitleEm}</em>
          </h2>
          <p className="tide-r-desc">{t.rDesc}</p>
        </div>
        <div className="tide-r-side">
          {/* The ephemeris — tonight's true Moon set as a marginal note
              above the intents, so the column opens with a living line. */}
          <aside className="tide-eph">
            <span className="tide-eph-moon" aria-hidden>
              {luna ? <TrueMoon phaseDeg={luna.phaseDeg} /> : "☽"}
            </span>
            <div className="tide-eph-txt">
              <p className="tide-eph-k">{p.locale === "uk" ? "Ефемерида — цієї ночі" : "Ephemeris — tonight"}</p>
              <p className="tide-eph-line">{luna ? luna.line : "…"}</p>
            </div>
          </aside>
          <div className="tide-intents" role="radiogroup" aria-label={t.rKicker}>
            {t.intents.map((it, i) => (
              <button
                key={it.n}
                type="button"
                role="radio"
                aria-checked={intent === i}
                className={"tide-intent" + (intent === i ? " on" : "")}
                style={{ "--ii": i } as React.CSSProperties}
                onClick={() => setIntent(i)}
              >
                <span className="tide-intent-n">{it.n}</span>
                <span className="tide-intent-l">{it.label}</span>
                <span className="tide-intent-a" aria-hidden>↗</span>
              </button>
            ))}
          </div>
          <p className="tide-q-label">{t.qLabel}</p>
          <p className="tide-q" aria-live="polite"><em>{t.intents[intent].q}</em></p>
          <div className="tide-r-actions">
            <Link href={p.primaryHref} className="tide-oracle">{t.oracle}<span aria-hidden> ↗</span></Link>
            <Link href="/daily" className="tide-daily">{t.daily}</Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .tide-seq { position: relative; background: var(--lg-night, #10134d); }
        .tide-stage { position: relative; height: 100svh; min-height: 700px; overflow: hidden; isolation: isolate; background: #131b76; }
        :global(.tide-seq.enhanced) .tide-stage { position: sticky; top: 0; }
        .tide-world, .tide-shade { position: absolute; inset: 0; }
        .tide-poster, .tide-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; }
        .tide-canvas { opacity: 0; transition: opacity 0.7s var(--lg-ease); }
        :global(.tide-canvas.ready) { opacity: 1; }
        .tide-src { display: none; }
        .tide-seam { position: absolute; left: 0; right: 0; bottom: 0; height: 30%; pointer-events: none;
          background: linear-gradient(0deg, #10134d 0%, rgba(16, 19, 77, 0.82) 34%, rgba(16, 19, 77, 0.3) 68%, transparent 100%);
          opacity: calc(var(--progress, 0)); }
        .tide-shade { pointer-events: none; opacity: var(--shade, 1); background:
          linear-gradient(90deg, rgba(8, 15, 71, 0.78), rgba(12, 20, 82, 0.55) 30%, rgba(14, 24, 90, 0.16) 52%, transparent 70%),
          linear-gradient(180deg, rgba(6, 12, 58, 0.6), transparent 26%); }
        .tide-intro { position: absolute; z-index: 2; left: clamp(24px, 5.25vw, 104px); top: clamp(120px, 17vh, 190px);
          max-width: 560px; width: 46%; opacity: var(--intro, 1);
          transform: translateY(calc(var(--intro-shift, 0) * 1px)); }
        .tide-kicker { display: flex; align-items: center; gap: 13px; margin: 0 0 26px;
          font-family: var(--font-mono), monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--lg-text-soft, rgba(232, 233, 255, 0.8)); }
        .tide-kicker::before { content: ""; width: 28px; height: 1px; background: #b7bce9; }
        .tide-title { margin: 0 0 26px; font-family: var(--font-heading), serif; font-weight: 400;
          font-size: clamp(60px, 6.8vw, 118px); line-height: 0.92; letter-spacing: -0.05em; color: #e8e9ff; }
        .tide-title span { display: block; }
        .tide-title .em { font-style: italic; }
        .tide-sub { max-width: 330px; margin: 0 0 30px; font-size: 15px; line-height: 1.75; color: rgba(232, 233, 255, 0.82); }
        .tide-actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .tide-begin { display: inline-flex; align-items: center; gap: 14px; min-height: 52px; padding: 0 22px;
          border: 0; border-radius: 2px; cursor: pointer; background: #e0b768; color: #15174c;
          font-family: var(--font-body), sans-serif; font-size: 14px; font-weight: 500;
          transition: background 0.3s var(--lg-ease), transform 0.3s var(--lg-ease); }
        .tide-begin:hover { background: #edca8b; transform: translateY(-2px); }
        .tide-actions :global(.tide-secondary) { display: inline-flex; min-height: 48px; align-items: center;
          color: #e8e9ff; font-size: 14px; text-decoration: none; border-bottom: 1px solid rgba(232, 233, 255, 0.5);
          transition: border-color 0.3s; }
        .tide-actions :global(.tide-secondary:hover) { border-color: #e8e9ff; }
        .tide-trust { margin: 20px 0 0; font-family: var(--font-heading), serif; font-style: italic;
          font-size: 18px; color: #bdc5ef; }
        .tide-line { position: absolute; z-index: 2; left: clamp(24px, 5.25vw, 104px); top: 27%; max-width: 460px;
          opacity: 0; pointer-events: none;
          text-shadow: 0 1px 4px rgba(10, 13, 56, 0.9), 0 0 26px rgba(10, 13, 56, 0.8), 0 0 60px rgba(10, 13, 56, 0.6); }
        .tide-line::before { content: ""; position: absolute; inset: -12% -18%; z-index: -1;
          background: radial-gradient(60% 55% at 40% 45%, rgba(10, 13, 56, 0.55), transparent 75%); }
        .tide-threshold { opacity: var(--threshold, 0); }
        .tide-passage { opacity: var(--passage, 0); top: 34%; }
        .tide-arrival { opacity: var(--arrival, 0); left: 50%; top: 30%; transform: translateX(-50%); text-align: center; }
        .tide-line-k { margin: 0 0 14px; font-family: var(--font-mono), monospace; font-size: 11px;
          letter-spacing: 0.24em; text-transform: uppercase; color: #b7bce9; }
        .tide-line-t { margin: 0; font-family: var(--font-heading), serif; font-weight: 400;
          font-size: clamp(38px, 4vw, 68px); line-height: 1.06; color: #e8e9ff; }
        @media (min-width: 1051px) { .tide-passage { margin-left: max(-7vw, calc(28px - clamp(24px, 5.25vw, 104px))); } }
        .tide-controls { position: absolute; z-index: 3; left: 0; right: 0; bottom: 0;
          display: grid; grid-template-columns: 1fr minmax(300px, 430px) 1fr; align-items: end; gap: 30px;
          padding: 22px clamp(24px, 5.25vw, 104px) 20px;
          background: linear-gradient(0deg, rgba(10, 13, 56, 0.78), rgba(10, 13, 56, 0.25) 70%, transparent);
          font-family: var(--font-mono), monospace; }
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
          color: rgba(183, 188, 233, 0.8); }
        .tide-reading { position: relative; overflow: hidden; min-height: 88svh; background: transparent;
          display: grid; grid-template-columns: 1fr 1fr; gap: 55px;
          padding: 110px clamp(24px, 5.25vw, 104px) 90px; }
        .tide-reading::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 44vh;
          z-index: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(52, 62, 176, 0.6) 0%, rgba(31, 38, 140, 0.34) 34%, rgba(24, 29, 122, 0.16) 62%, transparent 100%); }
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
          min-height: 54px; padding: 0 24px; border-radius: 2px; background: #e0b768; color: #15174c;
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: background 0.3s var(--lg-ease), transform 0.3s var(--lg-ease); }
        .tide-r-actions :global(.tide-oracle:hover) { background: #edca8b; transform: translateY(-2px); }
        .tide-r-actions :global(.tide-daily) { color: #e8e9ff; font-size: 14px; text-decoration: none;
          border-bottom: 1px solid rgba(232, 233, 255, 0.5); padding-bottom: 2px; transition: border-color 0.3s; }
        .tide-r-actions :global(.tide-daily:hover) { border-color: #e8e9ff; }
        @media (max-width: 900px) {
          .tide-intro { width: calc(100% - 48px); padding-right: 0; top: 96px; }
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
          .tide-r-head .tide-kicker, .tide-r-title, .tide-r-desc, .tide-eph,
          .tide-intent, .tide-q-label, .tide-q, .tide-r-actions {
            opacity: 1; transform: none; transition: none; }
          .tide-intents::before, .tide-intent::after { transform: none; transition: none; }
        }
      `}</style>
    </div>
  );
}
