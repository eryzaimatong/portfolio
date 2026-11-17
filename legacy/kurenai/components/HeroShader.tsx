"use client";
import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { useMotion } from "@/lib/motion-context";

const vert = `attribute vec2 position; attribute vec2 uv; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,0.,1.); }`;
/* red ink flow field: domain-warped noise, brightened around the cursor. Mostly black, red only on the ridges. */
const frag = `precision highp float; varying vec2 vUv; uniform float uTime; uniform vec2 uMouse; uniform vec2 uRes;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return v; }
void main(){
  vec2 uv = vUv; vec2 p = (uv - .5) * vec2(uRes.x/uRes.y, 1.) * 2.2;
  float t = uTime * .06;
  vec2 m = (uMouse - .5) * vec2(uRes.x/uRes.y, 1.) * 2.2;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t));
  vec2 r = vec2(fbm(p + 3.*q + vec2(1.7,9.2) + t*1.3), fbm(p + 3.*q + vec2(8.3,2.8) - t));
  float d = length(p - m);
  r += (p - m) * exp(-d*2.2) * .35;
  float f = fbm(p + 3.*r);
  float ridge = smoothstep(.58, .8, f) * (1. - smoothstep(.8,.96,f)*.4);
  float glow = exp(-d*1.8) * .3;
  vec3 ink = vec3(.039,.024,.031);
  vec3 blood = vec3(.478,.059,.118), crimson = vec3(.878,.118,.216);
  // red stays a signal: thin ridges plus a lift near the cursor, never a wash
  vec3 col = ink + blood * ridge * .5 + crimson * pow(ridge,3.) * .16 + crimson * glow * ridge;
  col += blood * .03 * smoothstep(.2,1.,f);
  float vig = smoothstep(1.5, .3, length(uv-.5)*1.6);
  gl_FragColor = vec4(col * (.35 + .65*vig), 1.);
}`;

/* Falls back to a CSS gradient (set by the parent) when WebGL is unavailable or motion is reduced. Pauses off-screen / hidden. */
export function HeroShader() {
  const wrap = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    const host = wrap.current;
    if (!host || reduced) return;
    let renderer: Renderer;
    try { renderer = new Renderer({ dpr: Math.min(devicePixelRatio || 1, 1.5), alpha: false, antialias: false }); } catch { return; }
    const gl = renderer.gl;
    if (!gl) return;
    gl.canvas.setAttribute("aria-hidden", "true");
    host.appendChild(gl.canvas);
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms: { uTime: { value: 0 }, uMouse: { value: [0.5, 0.5] }, uRes: { value: [1, 1] } } });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const size = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h); program.uniforms.uRes.value = [w, h]; };
    size();
    const ro = new ResizeObserver(size); ro.observe(host);
    const target = [0.5, 0.5], cur = [0.5, 0.5];
    const move = (e: PointerEvent) => { const r = host.getBoundingClientRect(); target[0] = (e.clientX - r.left) / r.width; target[1] = 1 - (e.clientY - r.top) / r.height; };
    addEventListener("pointermove", move);
    let raf = 0, onscreen = true;
    const io = new IntersectionObserver(([e]) => { onscreen = e.isIntersecting; }, { threshold: 0 }); io.observe(host);
    const t0 = performance.now();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!onscreen || document.hidden) return;
      cur[0] += (target[0] - cur[0]) * 0.06; cur[1] += (target[1] - cur[1]) * 0.06;
      program.uniforms.uMouse.value = cur;
      program.uniforms.uTime.value = (performance.now() - t0) / 1000;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(frame);
    host.dataset.live = "1";
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener("pointermove", move);
      gl.canvas.remove(); delete host.dataset.live; gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduced]);
  return <div ref={wrap} className="hero-shader" aria-hidden="true" />;
}
