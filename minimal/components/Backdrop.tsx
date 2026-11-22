"use client";
import { useEffect, useRef } from "react";

/* The page backdrop: a faint data grid, a soft red glow that follows the pointer (and drifts on its own when idle or on touch),
   and a slow scan band. Transform and opacity only, one rAF while the pointer moves. */
export function Backdrop() {
  const glow = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const g = glow.current, root = fx.current; if (!g || !root) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = innerWidth * 0.7, y = innerHeight * 0.3, tx = x, ty = y, raf = 0, idle = 0;
    const tick = () => {
      raf = 0;
      x += (tx - x) * (reduce ? 1 : 0.14); y += (ty - y) * (reduce ? 1 : 0.14);
      g.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY; root.classList.remove("idle");
      clearTimeout(idle); idle = window.setTimeout(() => root.classList.add("idle"), 4000);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    g.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (matchMedia("(pointer: coarse)").matches) root.classList.add("idle");
    addEventListener("pointermove", move, { passive: true });
    return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); clearTimeout(idle); };
  }, []);
  return (
    <div ref={fx} className="bg-fx" aria-hidden="true">
      <div ref={glow} className="bg-glow"><i /></div>
      <div className="bg-grid" />
      <div className="bg-scan" />
    </div>
  );
}
