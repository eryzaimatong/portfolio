"use client";
import { useEffect, useRef } from "react";
import { tickVelocity } from "@/lib/velocity";
import { useMotion } from "@/lib/motion-context";

/* Streaks at the screen edges, brightness and length driven by scroll / drag velocity. Idle = nothing drawn. */
export function SpeedLines() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    const c = ref.current;
    if (!c || reduced) return;
    const ctx = c.getContext("2d")!;
    let w = 0, h = 0, raf = 0, drawn = false, visible = true;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const size = () => { w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const lines = Array.from({ length: 46 }, () => ({ a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 0.7, s: 0.5 + Math.random() }));
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const v = tickVelocity();
      if (v < 0.6) { if (drawn) { ctx.clearRect(0, 0, w, h); drawn = false; } return; }
      drawn = true;
      ctx.clearRect(0, 0, w, h);
      const k = Math.min(v / 30, 1);
      const cx = w / 2, cy = h / 2, R = Math.hypot(cx, cy);
      ctx.lineWidth = 1.2;
      for (const l of lines) {
        const inner = R * (0.55 + 0.25 * (1 - l.r)), len = R * (0.12 + 0.3 * k) * l.s;
        ctx.strokeStyle = `rgba(224,30,55,${0.1 + 0.4 * k * l.s})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(l.a) * inner, cy + Math.sin(l.a) * inner);
        ctx.lineTo(cx + Math.cos(l.a) * (inner + len), cy + Math.sin(l.a) * (inner + len));
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(frame);
    const vis = () => { visible = !document.hidden; };
    document.addEventListener("visibilitychange", vis);
    addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", vis); removeEventListener("resize", size); };
  }, [reduced]);
  return <canvas ref={ref} className="speedlines" aria-hidden="true" />;
}
