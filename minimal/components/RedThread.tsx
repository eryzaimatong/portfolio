"use client";
import { useEffect, useRef } from "react";
import { EV_LABEL, evidenceFor } from "@/data/evidence";

/* The red thread. Hover (or tap, or focus) a skill: a thread swings out from it, sags, and pins to the project,
   organization or credential where I used it. One canvas, one rAF loop that only runs while a thread exists,
   anchor positions measured once per activation (and again on resize or content change), at most 3 threads. */

const N = 12, SLACK = 1.1, G = 2400, ITER = 6, IN_MS = 440, OUT_MS = 180, MAX = 3;
type P = { x: number; y: number; px: number; py: number };
type Th = { ev: string; label: string; el: HTMLElement; sx: number; sy: number; tx: number; ty: number; pts: P[]; t: number; goal: 0 | 1; off: number };
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function RedThread() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, W = 0, H = 0, raf = 0, last = 0;
    let threads: Th[] = [], src: HTMLElement | null = null, dirty = false;

    const size = () => {
      dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };

    /* document-space anchor points (so scrolling needs no re-measuring) */
    const srcPoint = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 + scrollX, y: r.bottom - 2 + scrollY }; };
    const evPoint = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return el.classList.contains("hi") ? { x: r.left + r.width / 2 + scrollX, y: r.top + r.height / 2 + scrollY } : { x: r.left + scrollX, y: r.top + 20 + scrollY };
    };
    const measure = () => {
      dirty = false;
      if (!src) return;
      const s = srcPoint(src);
      for (const th of threads) { th.sx = s.x; th.sy = s.y; const p = evPoint(th.el); th.tx = p.x; th.ty = p.y; }
    };

    const step = (th: Th, dt: number): number => {
      const sx = th.sx - scrollX, sy = th.sy - scrollY;
      let tx = th.tx - scrollX, ty = th.ty - scrollY;
      th.off = ty < 26 ? -1 : ty > H - 26 ? 1 : 0;
      ty = Math.max(26, Math.min(H - 26, ty)); tx = Math.max(12, Math.min(W - 12, tx));
      const e = ease(th.t), p = th.pts;
      const rest = (Math.hypot(tx - sx, ty - sy) * SLACK) / (N - 1);
      p[0].x = p[0].px = sx; p[0].y = p[0].py = sy;
      const fx = sx + (tx - sx) * e, fy = sy + (ty - sy) * e;
      p[N - 1].x = p[N - 1].px = fx; p[N - 1].y = p[N - 1].py = fy;
      let energy = 0;
      for (let i = 1; i < N - 1; i++) {                       // verlet: inertia, damping, gravity
        const q = p[i], vx = (q.x - q.px) * 0.985, vy = (q.y - q.py) * 0.985;
        energy += Math.abs(vx) + Math.abs(vy);
        q.px = q.x; q.py = q.y; q.x += vx; q.y += vy + G * dt * dt;
      }
      for (let k = 0; k < ITER; k++) {                        // keep every link at its rest length
        for (let i = 0; i < N - 1; i++) {
          const a = p[i], b = p[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-4, diff = (d - rest) / d;
          const wa = i === 0 ? 0 : 0.5, wb = i + 1 === N - 1 ? 0 : 0.5, w = wa + wb; if (!w) continue;
          a.x += dx * diff * (wa / w); a.y += dy * diff * (wa / w); b.x -= dx * diff * (wb / w); b.y -= dy * diff * (wb / w);
        }
      }
      return energy;
    };

    const draw = (th: Th) => {
      const p = th.pts, e = ease(th.t);
      ctx.strokeStyle = "#E0112B"; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 0.95;
      const len = Math.hypot(p[N - 1].x - p[0].x, p[N - 1].y - p[0].y) * SLACK + 20;
      if (th.t < 1) { ctx.setLineDash([len, len]); ctx.lineDashOffset = len * (1 - e); } else ctx.setLineDash([]);   // thread-draw on the way in, retract on the way out
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < N - 1; i++) ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
      ctx.lineTo(p[N - 1].x, p[N - 1].y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#E0112B"; ctx.beginPath(); ctx.arc(p[0].x, p[0].y, 2.6, 0, 6.2832); ctx.fill();
      if (th.t > 0.9) {
        const q = p[N - 1];
        ctx.beginPath(); ctx.arc(q.x, q.y, 3.4, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(q.x, q.y, 7.5, 0, 6.2832); ctx.stroke(); ctx.globalAlpha = 0.95;
        if (th.off) {                                         // the evidence is off screen: say where it is
          const txt = `${th.off < 0 ? "↑" : "↓"} ${th.label}`;
          ctx.font = "500 11px ui-monospace, Menlo, Consolas, monospace";
          const w = ctx.measureText(txt).width + 16, x = Math.max(8, Math.min(W - w - 8, q.x - w / 2)), y = th.off < 0 ? q.y + 12 : q.y - 32;
          ctx.fillStyle = "#120809"; ctx.strokeStyle = "#B3001B"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x, y, w, 20, 5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#FF6B79"; ctx.fillText(txt, x + 8, y + 14);
        }
      }
    };

    let prevBox: [number, number, number, number] | null = null, lastScroll = -1, lastScrollX = -1;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.034, (now - last) / 1000 || 0.016); last = now;
      if (dirty) measure();
      const scrolled = scrollY !== lastScroll || scrollX !== lastScrollX; lastScroll = scrollY; lastScrollX = scrollX;
      let moving = scrolled, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      threads = threads.filter((th) => {
        th.t = th.goal ? Math.min(1, th.t + (dt * 1000) / IN_MS) : Math.max(0, th.t - (dt * 1000) / OUT_MS);
        if (!th.goal && th.t <= 0) { moving = true; return false; }
        if (th.t > 0 && th.t < 1) moving = true;
        if (step(th, dt) > 0.35) moving = true;
        for (const q of th.pts) { if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; }
        return true;
      });
      // repaint only when something moved, and clear only the rectangle the rope touched (plus room for a label)
      if (moving || prevBox) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const cur: [number, number, number, number] | null = threads.length ? [x0 - 24, y0 - 24, x1 + 24 + 200, y1 + 24 + 40] : null;
        const u = prevBox && cur ? [Math.min(prevBox[0], cur[0]), Math.min(prevBox[1], cur[1]), Math.max(prevBox[2], cur[2]), Math.max(prevBox[3], cur[3])] : (prevBox || cur);
        if (u) ctx.clearRect(u[0], u[1], u[2] - u[0], u[3] - u[1]);
        if (moving) for (const th of threads) draw(th);
        else if (threads.length) for (const th of threads) draw(th);
        prevBox = cur;
      }
      if (threads.length && (moving || threads.some((t) => t.t < 1))) raf = requestAnimationFrame(frame);   // settled ropes cost nothing: the loop sleeps
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const clearMarks = () => { document.querySelectorAll(".thread-lit,.thread-src").forEach((n) => n.classList.remove("thread-lit", "thread-src")); };
    const deactivate = () => { src = null; clearMarks(); threads.forEach((th) => (th.goal = 0)); start(); };
    const activate = (li: HTMLElement) => {
      if (src === li) return;
      clearMarks(); threads.forEach((th) => (th.goal = 0));
      src = li; li.classList.add("thread-src");
      const s = srcPoint(li);
      for (const ev of evidenceFor(li.dataset.skill || "").slice(0, MAX)) {
        const el = document.querySelector<HTMLElement>(`[data-ev="${ev}"]`); if (!el) continue;
        const t = evPoint(el);
        const pts = Array.from({ length: N }, () => ({ x: s.x - scrollX, y: s.y - scrollY, px: s.x - scrollX, py: s.y - scrollY }));
        const th: Th = { ev, label: EV_LABEL[ev] || ev, el, sx: s.x, sy: s.y, tx: t.x, ty: t.y, pts, t: reduce ? 1 : 0, goal: 1, off: 0 };
        if (reduce) for (let k = 0; k < 40; k++) step(th, 0.016);
        el.classList.add("thread-lit"); threads.push(th);
      }
      start();
    };

    const skillOf = (n: EventTarget | null) => ((n as Element | null)?.closest?.("li[data-skill]") as HTMLElement | null);
    const needs = (li: HTMLElement | null) => !!li && evidenceFor(li.dataset.skill || "").length > 0;
    let hotTimer = 0;
    const setHot = (slug: string | null) => { if (slug) document.documentElement.dataset.hot = slug; else delete document.documentElement.dataset.hot; };
    const slugOf = (n: EventTarget | null) => ((n as Element | null)?.closest?.('.hi[data-ev^="project-"]') as HTMLElement | null)?.dataset.ev?.slice(8) ?? null;

    const over = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const li = skillOf(e.target); if (needs(li)) activate(li!);
      const s = slugOf(e.target); if (s) setHot(s);
    };
    const out = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const li = skillOf(e.target); if (li && li === src && !li.contains(e.relatedTarget as Node)) deactivate();
      if (slugOf(e.target) && !slugOf(e.relatedTarget)) setHot(null);
    };
    const down = (e: PointerEvent) => {                       // touch: tap a skill to toggle its thread, tap anywhere else to clear
      if (e.pointerType !== "touch") return;
      const li = skillOf(e.target);
      if (li && needs(li)) { if (src === li) deactivate(); else activate(li); }
      else if (src) deactivate();
      const s = slugOf(e.target); if (s) { setHot(s); clearTimeout(hotTimer); hotTimer = window.setTimeout(() => setHot(null), 2600); }
    };
    const fin = (e: FocusEvent) => { const li = skillOf(e.target); if (needs(li)) activate(li!); };
    const fout = (e: FocusEvent) => { if (skillOf(e.target) === src) deactivate(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && src) deactivate(); };

    let rz = 0;
    const onResize = () => { size(); dirty = true; if (threads.length) start(); };
    const ro = new ResizeObserver(() => { if (!rz) rz = requestAnimationFrame(() => { rz = 0; dirty = true; if (threads.length) start(); }); });
    ro.observe(document.body);
    const mo = new MutationObserver(() => { dirty = true; });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-role"] });

    size();
    document.addEventListener("pointerover", over, { passive: true }); document.addEventListener("pointerout", out, { passive: true });
    document.addEventListener("pointerdown", down, { passive: true }); document.addEventListener("focusin", fin); document.addEventListener("focusout", fout);
    const onScroll = () => { if (threads.length) start(); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("keydown", key); addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); clearMarks(); setHot(null);
      document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out); document.removeEventListener("pointerdown", down);
      document.removeEventListener("focusin", fin); document.removeEventListener("focusout", fout); removeEventListener("keydown", key); removeEventListener("resize", onResize); removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={ref} className="thread-canvas" aria-hidden="true" />;
}
