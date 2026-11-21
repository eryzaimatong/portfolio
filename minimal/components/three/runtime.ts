"use client";
import { useEffect, type MutableRefObject, type RefObject } from "react";
import type * as THREE_NS from "three";

/* Shared lifecycle for every 3D scene on the page:
   - Three.js and the scene module are imported only when the section comes within `near` of the viewport
   - one requestAnimationFrame loop for all scenes; a scene renders only while it is on screen (and the tab is visible)
   - pixel ratio capped at 1.75 (1.25 on low-power devices), antialias off on low-power devices
   - prefers-reduced-motion: scenes get `reduce` and render a still frame (plus short bursts while you interact)
   - no WebGL, or any error while starting: the canvas is never added and the static layout underneath stays
   - unmount: the scene, its renderer and its GPU context are disposed */

export type Three = typeof THREE_NS;
export type SceneCtx = {
  THREE: Three;
  renderer: THREE_NS.WebGLRenderer;
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  reduce: boolean;
  low: boolean;
  /** keep rendering for `ms` (interaction in reduced-motion mode, or a one-off animation) */
  invalidate: (ms?: number) => void;
};
export type SceneHandle = {
  frame(t: number, dt: number): void;
  resize(w: number, h: number): void;
  dispose(): void;
  /** false = nothing is moving, skip rendering until invalidate() */
  animating?(): boolean;
};
export type SceneModule<P> = { createScene(ctx: SceneCtx, props: P): SceneHandle | Promise<SceneHandle> };

/* ---- the one loop ---- */
const subs = new Set<(t: number) => void>();
let raf = 0;
const loop = (t: number) => { raf = 0; subs.forEach((f) => f(t)); if (subs.size) raf = requestAnimationFrame(loop); };
const subscribe = (f: (t: number) => void) => { subs.add(f); if (!raf) raf = requestAnimationFrame(loop); return () => { subs.delete(f); }; };

export function webglOK(): boolean {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
export function lowPower(): boolean {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency || 8) <= 4 || (n.deviceMemory || 8) <= 4 || matchMedia("(pointer: coarse)").matches;
}

export function useThreeScene<P>(
  host: RefObject<HTMLElement | null>,
  load: () => Promise<SceneModule<P>>,
  opts: { props: P; name?: string; near?: string; defer?: boolean; onLive?: () => void; onFail?: () => void; handleRef?: MutableRefObject<SceneHandle | null> },
) {
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let dead = false, handle: SceneHandle | null = null, renderer: THREE_NS.WebGLRenderer | null = null, canvas: HTMLCanvasElement | null = null;
    let unsub: (() => void) | null = null, visible = false, keepUntil = 0, needOne = true, last = 0;
    let near: IntersectionObserver | null = null, vis: IntersectionObserver | null = null, ro: ResizeObserver | null = null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const low = lowPower() || new URLSearchParams(location.search).has("low");
    // ?perf records how long each frame of this scene takes on the main thread (window.__sceneMs[name])
    const perf: number[] | null = new URLSearchParams(location.search).has("perf") ? (((window as unknown as { __sceneMs: Record<string, number[]> }).__sceneMs ??= {})[opts.name ?? "scene"] = []) : null;
    const fail = () => { if (!dead) opts.onFail?.(); };

    const invalidate = (ms = 0) => { keepUntil = Math.max(keepUntil, performance.now() + ms); needOne = true; };
    const tick = (t: number) => {
      if (!handle || !visible) return;
      const moving = (!reduce && (handle.animating ? handle.animating() : true)) || performance.now() < keepUntil;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
      if (!moving && !needOne) return;
      needOne = false;
      if (perf) {
        const a = performance.now(); handle.frame(t / 1000, dt); perf.push(performance.now() - a); if (perf.length > 600) perf.shift();
        if (perf.length % 30 === 0) { const q = [...perf].sort((x, y) => x - y); el.dataset.perf = `n=${q.length} median=${q[q.length >> 1].toFixed(2)}ms p95=${q[Math.floor(q.length * 0.95)].toFixed(2)}ms max=${q[q.length - 1].toFixed(2)}ms`; }
      }
      else handle.frame(t / 1000, dt);
    };
    const size = () => {
      if (!handle || !renderer) return;
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); handle.resize(w, h); invalidate();
    };

    const start = async () => {
      if (!webglOK()) return fail();
      if (opts.defer) await afterLoadIdle();                   // e.g. the hero: never compete with the first paint
      if (dead) return;
      try {
        const [THREE, mod] = await Promise.all([import("three"), load()]);
        if (dead) return;
        canvas = document.createElement("canvas");
        canvas.className = "three-canvas";
        canvas.setAttribute("aria-hidden", "true");
        renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.25 : 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        el.appendChild(canvas);
        handle = await mod.createScene({ THREE, renderer, canvas, host: el, reduce, low, invalidate }, opts.props);
        if (dead) { handle.dispose(); return; }
        if (opts.handleRef) opts.handleRef.current = handle;
        ro = new ResizeObserver(size); ro.observe(el); size();
        handle.frame(0, 0.016);                                 // a finished first frame before anything is shown
        vis = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible && !unsub) { last = 0; unsub = subscribe(tick); } else if (!visible && unsub) { unsub(); unsub = null; }
        });
        vis.observe(el);
        requestAnimationFrame(() => { if (!dead) { el.classList.add("is-live"); opts.onLive?.(); } });
      } catch {
        canvas?.remove(); canvas = null; fail();
      }
    };

    near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near?.disconnect(); start(); } }, { rootMargin: opts.near ?? "600px 0px" });
    near.observe(el);

    return () => {
      dead = true;
      near?.disconnect(); vis?.disconnect(); ro?.disconnect(); unsub?.();
      if (opts.handleRef) opts.handleRef.current = null;
      try { handle?.dispose(); } catch {}
      try { renderer?.dispose(); renderer?.forceContextLoss(); } catch {}
      canvas?.remove(); el.classList.remove("is-live");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function afterLoadIdle() {
  return new Promise<void>((res) => {
    const idle = () => { const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }; if (w.requestIdleCallback) w.requestIdleCallback(() => res(), { timeout: 1200 }); else setTimeout(res, 200); };
    if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
  });
}

/* Free everything a scene created. */
export function disposeScene(root: THREE_NS.Object3D) {
  root.traverse((o) => {
    const m = o as THREE_NS.Mesh;
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v && typeof v === "object" && "isTexture" in v) (v as THREE_NS.Texture).dispose();
      mat.dispose();
    }
  });
}
