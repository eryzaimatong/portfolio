"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const DUR = 1600, DELAY = 600;

/* The portrait starts in black and white. An "AURA // scanning" pass reads the face with a landmark mesh (precomputed once,
   not run in your browser), a red line sweeps down, and full colour develops behind it. About 1.8 s, skippable, runs again on hover.
   Nothing blocks paint: the photo is a plain image first; the mesh and its data load afterwards. */
export function PhotoScan({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(0);
  const [go, setGo] = useState(false);          // the animations are armed only once the mesh is ready (or a short fallback passed)
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const last = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const meshReady = useRef<Awaited<ReturnType<typeof import("./faceMesh").loadMesh>> | null>(null);
  const cancel = useRef<() => void>(() => {});
  const timer = useRef(0);
  const reduce = useRef(false);

  // prepare: wait until the portrait is on screen, load the mesh chunk and data, then arm
  useEffect(() => {
    reduce.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) { setGo(true); return; }
    let dead = false, armed = false;
    const arm = () => { if (!dead && !armed) { armed = true; setGo(true); } };
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const fb = window.setTimeout(arm, 1400);                // never wait longer than this: the scan then runs without the mesh
      import("./faceMesh").then((m) => m.loadMesh()).then((m) => { meshReady.current = m; }).catch(() => {}).finally(() => { clearTimeout(fb); arm(); });
    }, { threshold: 0.2 });
    if (box.current) io.observe(box.current);
    return () => { dead = true; io.disconnect(); };
  }, []);

  const finish = useCallback(() => { setBusy(false); }, []);

  // each run: start the mesh in step with the CSS animations
  useEffect(() => {
    if (!go || reduce.current) return;
    setBusy(true); setSkipped(false);
    const delay = run ? 0 : DELAY;
    cancel.current();
    const m = meshReady.current, c = cv.current;
    if (m && c) {
      import("./faceMesh").then(({ runMesh }) => { cancel.current = runMesh(c, m, delay, DUR, () => {}); });
    }
    clearTimeout(timer.current); timer.current = window.setTimeout(finish, delay + DUR + 450);
    return () => { cancel.current(); clearTimeout(timer.current); };
  }, [go, run, finish]);

  const again = () => {
    if (!go || reduce.current) return;
    const now = Date.now();
    if (now - last.current < 2200) return;   // let a sweep finish before another can start
    last.current = now; setRun((r) => r + 1);
  };
  const skip = useCallback(() => { cancel.current(); setSkipped(true); clearTimeout(timer.current); timer.current = window.setTimeout(finish, 60); }, [finish]);
  useEffect(() => {
    if (!busy) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [busy, skip]);

  const cls = run ? " again" : "";
  return (
    <div ref={box} className={"ph" + (go ? " go" : "") + (skipped ? " skip" : "")} onMouseEnter={again}>
      {children}
      <div key={"r" + run} className={"ph-rev" + cls} aria-hidden="true">
        <img className="ph-color" alt="" width={960} height={1200} decoding="async" fetchPriority="low"
          src="/assets/hero-c-960.webp" srcSet="/assets/hero-c-640.webp 640w, /assets/hero-c-960.webp 960w, /assets/hero-c-1280.webp 1280w" sizes="(max-width: 900px) 80vw, 340px" />
      </div>
      <canvas ref={cv} className="ph-mesh" aria-hidden="true" />
      <i key={"s" + run} className={"ph-scan" + cls} aria-hidden="true" />
      <span key={"t" + run} className={"ph-tag mono" + cls} aria-hidden="true">AURA // scanning</span>
      {busy && <button type="button" className="ph-skip mono" onClick={skip} aria-label="Skip the scan animation">skip</button>}
    </div>
  );
}
