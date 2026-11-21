"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { PRESETS, SHORT, TITLES, TRAITS, topThree } from "@/data/taste";

/* Re:Watch exhibit: a mini Taste DNA radar. Drag any of the ten axes (or use the arrow keys on a handle); the three closest
   titles from a small bundled set update live, in the browser. Demo data, labelled as such. */

const C = 180, R = 112, LBL = 142, N = TRAITS.length;
const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
const pt = (i: number, f: number) => [C + Math.cos(ang(i)) * R * f, C + Math.sin(ang(i)) * R * f] as const;

export default function TasteDNA() {
  const [vals, setVals] = useState<number[]>(PRESETS[0].v);
  const [active, setActive] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const top = useMemo(() => topThree(vals), [vals]);

  // FLIP: when the order of the three titles changes, slide the ones that stay instead of snapping
  const list = useRef<HTMLOListElement>(null);
  const prev = useRef<Map<string, number>>(new Map());
  const order = top.map((t) => t.title).join("|");
  useLayoutEffect(() => {
    const ul = list.current; if (!ul) return;
    const next = new Map<string, number>();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.querySelectorAll<HTMLElement>("li[data-t]").forEach((li) => {
      const k = li.dataset.t!, y = li.offsetTop; next.set(k, y);
      const was = prev.current.get(k);
      if (!reduce && was !== undefined && was !== y) li.animate([{ transform: `translateY(${was - y}px)` }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" });
      else if (!reduce && was === undefined && prev.current.size) li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    });
    prev.current = next;
  }, [order]);

  const set = (i: number, v: number) => setVals((p) => { const q = p.slice(); q[i] = Math.max(0, Math.min(9, Math.round(v * 10) / 10)); return q; });

  const fromEvent = (e: React.PointerEvent) => {
    const s = svg.current!, m = s.getScreenCTM(); if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { dx: p.x - C, dy: p.y - C };
  };
  const nearestAxis = (dx: number, dy: number) => {
    const a = Math.atan2(dy, dx); let best = 0, bd = 9;
    for (let i = 0; i < N; i++) { let d = Math.abs(a - ang(i)); d = Math.min(d, 2 * Math.PI - d); if (d < bd) { bd = d; best = i; } }
    return best;
  };
  const apply = (i: number, dx: number, dy: number) => { const u = [Math.cos(ang(i)), Math.sin(ang(i))]; set(i, ((dx * u[0] + dy * u[1]) / R) * 9); };
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = fromEvent(e); if (!p) return;
    const t = (e.target as Element).closest("[data-axis]") as HTMLElement | null;
    const i = t ? +t.dataset.axis! : nearestAxis(p.dx, p.dy);
    (e.currentTarget as Element).setPointerCapture(e.pointerId); setActive(i); apply(i, p.dx, p.dy);
  };
  const move = (e: React.PointerEvent) => { if (active === null) return; const p = fromEvent(e); if (p) apply(active, p.dx, p.dy); };
  const up = () => setActive(null);
  const key = (e: React.KeyboardEvent, i: number) => {
    const step = e.shiftKey ? 2 : 0.5;
    const d = e.key === "ArrowUp" || e.key === "ArrowRight" ? step : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -step : 0;
    if (d) { e.preventDefault(); set(i, vals[i] + d); }
    else if (e.key === "Home") { e.preventDefault(); set(i, 0); } else if (e.key === "End") { e.preventDefault(); set(i, 9); }
  };

  const poly = vals.map((v, i) => pt(i, v / 9).join(",")).join(" ");
  return (
    <div className="taste">
      <header className="taste-head">
        <p className="mono label-red">Re:Watch exhibit · demo data</p>
        <h3 className="pixel taste-title">Try the Taste DNA</h3>
        <p className="dim taste-sub">Drag the ten traits, or focus a dot and use the arrow keys. The three closest titles from a small sample set update as you go.</p>
      </header>
      <div className="taste-grid">
        <div className="taste-radar">
          <svg ref={svg} viewBox="0 0 360 360" role="group" aria-label="Taste DNA radar with ten adjustable traits" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            {[0.25, 0.5, 0.75, 1].map((f) => (<polygon key={f} className="rd-ring" points={Array.from({ length: N }, (_, i) => pt(i, f).join(",")).join(" ")} />))}
            {Array.from({ length: N }, (_, i) => (<line key={i} className="rd-axis" x1={C} y1={C} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} />))}
            <polygon className="rd-shape" points={poly} />
            {TRAITS.map((name, i) => {
              const [x, y] = pt(i, vals[i] / 9), [lx, ly] = [C + Math.cos(ang(i)) * LBL, C + Math.sin(ang(i)) * LBL];
              const anchor = Math.abs(lx - C) < 8 ? "middle" : lx > C ? "start" : "end";
              return (
                <g key={name}>
                  <text className={"rd-label mono" + (active === i ? " on" : "")} x={lx} y={ly + 3} textAnchor={anchor}>{SHORT[i]}</text>
                  <g data-axis={i} role="slider" tabIndex={0} aria-label={name} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={9} aria-valuenow={Math.round(vals[i] * 10) / 10}
                    className={"rd-handle" + (active === i ? " on" : "")} onKeyDown={(e) => key(e, i)}>
                    <circle className="rd-hit" cx={x} cy={y} r={17} />
                    <circle className="rd-dot" cx={x} cy={y} r={6} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="taste-side">
          <p className="mono taste-k">Closest three</p>
          <ol className="taste-list" ref={list} aria-live="polite">
            {top.length === 0 && <li className="dim">Raise at least one trait.</li>}
            {top.map((t, k) => (
              <li key={t.title} data-t={t.title}>
                <span className="taste-rank mono">{k + 1}</span>
                <span className="taste-name"><b>{t.title}</b><small className="mono dim">{t.kind}</small></span>
                <span className="taste-score mono">{Math.round(t.score * 100)}%</span>
              </li>
            ))}
          </ol>
          <div className="taste-presets" role="group" aria-label="Starting points">
            {PRESETS.map((p) => (<button key={p.label} type="button" className="role-chip mono" onClick={() => setVals(p.v)}>{p.label}</button>))}
          </div>
          <p className="taste-note dim">Demo data: {TITLES.length} sample titles with trait numbers I wrote for this demo, matched by cosine similarity. It is not Re:Watch's catalogue, and Re:Watch itself scores by summing per-trait contributions.</p>
        </div>
      </div>
    </div>
  );
}
