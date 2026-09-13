"use client";

/**
 * Liquid Night — the site's living ground.
 *
 * A slow silk-water field in the house ultramarines: deep currents,
 * moonstone filaments, one faint gilt breath. Raw WebGL, no deps;
 * sits fixed under everything (stars and content above). Falls back
 * to the flat night — the fallback is the design's floor, never a bug.
 */

import { useEffect, useRef } from "react";

const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FS = `precision mediump float;varying vec2 v;uniform vec2 R;uniform float T;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.55;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(11.7,7.3);a*=.5;}return s;}
void main(){
 vec2 uv=v;uv.x*=R.x/R.y;
 float t=T*.028;
 vec2 q=uv*1.35+vec2(0.,-t*.5);
 float w=fbm(q+vec2(t*.7,-t*.4));
 float silk=fbm(q*1.7+vec2(w*1.9,-w*1.4)-vec2(t*.5,t*.3));
 float vein=fbm(q*3.1+vec2(-w*1.2,w*.9)+vec2(t*.2,-t*.6));
 vec3 col=vec3(.039,.051,.22);
 col=mix(col,vec3(.094,.114,.478),smoothstep(.32,.78,silk));
 col=mix(col,vec3(.125,.153,.608),smoothstep(.62,.95,silk)*.55);
 float fil=pow(smoothstep(.55,.98,vein),3.);
 col+=vec3(.62,.66,.94)*fil*.10;
 float breath=.5+.5*sin(T*.07);
 float lobe=exp(-pow(length((v-vec2(.24,.30))*vec2(R.x/R.y,1.))/.5,2.));
 col+=vec3(.878,.718,.408)*lobe*pow(silk,4.)*.045*breath;
 col*=1.-.38*pow(length((v-.5)*vec2(1.15,1.)),1.7);
 float g=(h(floor(v*R))-.5)*.012*(1.-silk*.5);
 gl_FragColor=vec4(col+g,1.);}`;

export default function LiquidNight({ position = "fixed" }: { position?: "fixed" | "absolute" }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const RM = matchMedia("(prefers-reduced-motion: reduce)");
    let gl: WebGLRenderingContext | null = null;
    let raf = 0, last = 0, ok = false, seen = true;
    let R: WebGLUniformLocation | null = null, T: WebGLUniformLocation | null = null;
    const t0 = performance.now();

    const mk = (ty: number, src: string) => {
      const s = gl!.createShader(ty)!;
      gl!.shaderSource(s, src); gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw Error("liquid");
      return s;
    };
    const draw = () => { gl!.uniform1f(T, (performance.now() - t0) / 1000); gl!.drawArrays(gl!.TRIANGLES, 0, 6); };
    const size = () => {
      if (!ok) return;
      const d = Math.min(devicePixelRatio || 1, 1.25);
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(1, (r.width * d) | 0);
      cv.height = Math.max(1, (r.height * d) | 0);
      gl!.viewport(0, 0, cv.width, cv.height);
      gl!.uniform2f(R, cv.width, cv.height);
      draw();
    };
    const loop = (now: number) => {
      raf = 0;
      if (!ok || !seen || document.hidden || RM.matches) return;
      if (now - last > 40) { last = now; draw(); }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => { if (ok && seen && !raf && !document.hidden) raf = requestAnimationFrame(loop); };

    try {
      gl = cv.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
      if (gl) {
        const prog = gl.createProgram()!;
        gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error("link");
        gl.useProgram(prog);
        const b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const at = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(at);
        gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
        R = gl.getUniformLocation(prog, "R");
        T = gl.getUniformLocation(prog, "T");
        ok = true; size(); cv.style.opacity = "1"; wake();
      }
    } catch { ok = false; }

    const onVis = () => wake();
    const onRM = () => { if (RM.matches) { cancelAnimationFrame(raf); raf = 0; if (ok) draw(); } else wake(); };
    addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVis);
    RM.addEventListener("change", onRM);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVis);
      RM.removeEventListener("change", onRM);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position,
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 1.2s cubic-bezier(0.16,1,0.3,1)",
      }}
    />
  );
}
