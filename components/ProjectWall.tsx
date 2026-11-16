"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { scenes, projects } from "@/data/projects";
import { gsap, registerGsap, Draggable, InertiaPlugin, smear, settle, impactFrame, slamText } from "@/lib/motion";
import { pushVelocity } from "@/lib/velocity";
import { useMotion } from "@/lib/motion-context";
import { useGo } from "@/lib/useGo";
import { MagneticButton } from "./MagneticButton";

/* The Project Wall: a 3D perspective carousel. Each card is one real screen ("scene") from a project, in order.
   curve "wall": cards grow and angle toward the screen edges, like a concave wall. "tunnel" inverts the depth. */
const CURVE: "wall" | "tunnel" = "wall";
const N = scenes.length;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function ProjectWall() {
  const { reduced } = useMotion();
  const go = useGo();
  const wall = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ p: 0, active: 0, spacing: 240, maxRot: 18, w: 0 });
  const proxy = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const render = useCallback(() => {
    const s = state.current;
    cards.current.forEach((c, idx) => {
      if (!c) return;
      const i = idx - s.p, a = Math.abs(i);
      if (a > 3.6) { c.style.visibility = "hidden"; return; }
      c.style.visibility = "visible";
      const rot = clamp(i * -s.maxRot, -s.maxRot * 3.3, s.maxRot * 3.3);
      const z = (CURVE === "wall" ? 1 : -1) * a * 70;
      const sc = CURVE === "wall" ? 0.9 + Math.min(a, 3) * 0.1 : 1 - Math.min(a, 3) * 0.1;
      const x = i * s.spacing * (CURVE === "wall" ? 1 : 0.92);
      c.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${rot}deg) scale(${sc})`;
      c.style.opacity = String(clamp(1 - Math.max(a - 0.5, 0) * 0.22, 0, 1));
      c.style.filter = `blur(${Math.min(a, 3) * 0.6}px)`;
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.setProperty("--dim", String(clamp(a, 0, 1)));
    });
    const next = clamp(Math.round(s.p), 0, N - 1);
    if (next !== s.active) { s.active = next; setActive(next); }
  }, []);

  const measure = useCallback(() => {
    const el = wall.current; if (!el) return;
    const cw = cards.current[0]?.offsetWidth || 260;
    const mobile = innerWidth < 760;
    state.current.spacing = cw * (mobile ? 0.78 : 0.86);
    state.current.maxRot = mobile ? 9 : 18;           // max 30deg of tilt on touch screens
    state.current.w = state.current.spacing;
    render();
  }, [render]);

  const goTo = useCallback((idx: number, instant = false) => {
    const t = clamp(idx, 0, N - 1), s = state.current;
    if (proxy.current) gsap.set(proxy.current, { x: -t * s.w });
    Draggable.get(proxy.current!)?.update?.();
    if (instant || reduced) { s.p = t; render(); return; }
    const from = s.p;
    pushVelocity(Math.abs(t - from) * 6);
    gsap.to(s, { p: t, duration: 0.75, ease: "followThrough", overwrite: true, onUpdate: () => { render(); if (track.current) smear(track.current, (t - from) * (1 - 0) * 2.4); }, onComplete: () => { if (track.current) settle(track.current); } });
  }, [render, reduced]);

  // drag with inertia and snap-to-card
  useEffect(() => {
    registerGsap();
    measure();
    const ro = new ResizeObserver(measure); ro.observe(wall.current!);
    if (reduced || !proxy.current) return () => ro.disconnect();
    const s = state.current;
    const d = Draggable.create(proxy.current, {
      type: "x", trigger: wall.current!, inertia: true, minimumMovement: 4, allowContextMenu: true,
      bounds: { minX: -(N - 1) * s.w, maxX: 0 },
      snap: { x: (v: number) => Math.round(v / s.w) * s.w },
      onPress() { gsap.killTweensOf(s); },
      onDrag() { s.p = -this.x / s.w; render(); const v = InertiaPlugin.getVelocity(proxy.current!, "x") / 120; pushVelocity(v); if (track.current) smear(track.current, v); },
      onThrowUpdate() { s.p = -this.x / s.w; render(); const v = InertiaPlugin.getVelocity(proxy.current!, "x") / 120; pushVelocity(v); if (track.current) smear(track.current, v); },
      onThrowComplete() { if (track.current) settle(track.current); },
      onRelease() { if (track.current && !this.isThrowing) settle(track.current); },
    })[0];
    // refresh bounds when spacing changes
    const rb = new ResizeObserver(() => { d.applyBounds({ minX: -(N - 1) * s.w, maxX: 0 }); gsap.set(proxy.current!, { x: -Math.round(s.p) * s.w }); d.update(); });
    rb.observe(wall.current!);
    return () => { d.kill(); ro.disconnect(); rb.disconnect(); };
  }, [measure, render, reduced]);

  // trackpad / horizontal wheel only; vertical wheel keeps scrolling the page
  useEffect(() => {
    const el = wall.current; if (!el || reduced) return;
    let lock = 0;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2 || Math.abs(e.deltaX) < 20) return;
      e.preventDefault();
      const now = performance.now(); if (now - lock < 380) return; lock = now;
      goTo(state.current.active + Math.sign(e.deltaX));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [goTo, reduced]);

  // hover tilt + pointer-following edge glow on the centre card
  useEffect(() => {
    if (reduced || !matchMedia("(pointer: fine)").matches) return;
    const el = cards.current[active]; if (!el) return;
    const inner = el.querySelector<HTMLElement>(".card-inner")!;
    const rx = gsap.quickTo(inner, "rotationX", { duration: 0.4 }), ry = gsap.quickTo(inner, "rotationY", { duration: 0.4 });
    const mv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 12); rx(-(y - 0.5) * 12);
      el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`);
    };
    const lv = () => { rx(0); ry(0); };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerleave", lv);
    return () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerleave", lv); lv(); };
  }, [active, reduced]);

  useEffect(() => {
    const h = document.getElementById("projTitle"); if (h) slamText(h);
  }, []);

  const open = async (slug: string, el?: Element | null) => {
    const r = el?.getBoundingClientRect();
    go(`/projects/${slug}`, { impact: true, origin: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(state.current.active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(state.current.active - 1); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(N - 1); }
    else if (e.key === "Enter" && e.target === e.currentTarget) { e.preventDefault(); open(scenes[state.current.active].project.slug, cards.current[state.current.active]); }
  };

  const sc = scenes[active];
  const proj = sc.project;
  return (
    <section id="projects" className="wall-section" aria-labelledby="projTitle">
      <div className="wall-head">
        <p className="mono label">Projects</p>
        <h2 id="projTitle" className="h2 slam">Selected Work</h2>
        <p className="wall-sub">Two public projects, each built around a real problem.</p>
      </div>

      <div className="wall" ref={wall} tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Project scenes. Use the arrow keys to move, Enter to open the case file." onKeyDown={onKey}>
        <div className="wall-glow" aria-hidden="true" />
        <div className="wall-track" ref={track}>
          {scenes.map((s, idx) => (
            <button key={idx} ref={(el) => { cards.current[idx] = el; }} type="button" tabIndex={-1} className={"card" + (idx === active ? " is-active" : "")}
              style={{ "--ratio": "3/4" } as React.CSSProperties}
              aria-roledescription="slide" aria-label={idx === active ? `Open the ${s.project.title} case file` : `Scene ${s.n}: ${s.project.title}, ${s.caption}`}
              onClick={() => { if (Math.abs(state.current.p - idx) > 0.15) goTo(idx); else open(s.project.slug, cards.current[idx]); }}>
              <span className="card-inner">
                <Image src={s.src} alt="" fill sizes="(max-width: 760px) 62vw, 24vw" priority={idx < 2} className={"card-img " + (s.project.slug)} />
                <span className="card-tint" aria-hidden="true" />
                <span className="card-edge" aria-hidden="true" />
                <span className="card-tag mono" aria-hidden="true">SCENE {String(s.n).padStart(2, "0")}</span>
              </span>
            </button>
          ))}
        </div>
        <div ref={proxy} className="wall-proxy" aria-hidden="true" />
      </div>

      <div className="wall-info">
        <p className="wall-live" role="status" aria-live="polite">Scene {sc.n} of {N}: {proj.title}, {sc.caption}</p>
        <p className="mono scene-no" aria-hidden="true">SCENE {String(sc.n).padStart(2, "0")} <i>/ {String(N).padStart(2, "0")}</i></p>
        <h3 className="wall-title">{proj.title}</h3>
        <p className="wall-cap">{sc.caption}</p>
        <p className="wall-tagline">{proj.tagline}</p>
        <ul className="chips" aria-label="Stack">{proj.stack.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="wall-cta">
          <MagneticButton as="a" href={`/projects/${proj.slug}`} className="pill" onClick={(e: React.MouseEvent) => { e.preventDefault(); open(proj.slug, cards.current[active]); }}>Open the case file</MagneticButton>
          {proj.links?.github && <a className="ghost" href={proj.links.github} target="_blank" rel="noopener">View on GitHub ↗</a>}
        </div>
        <div className="wall-nav">
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous scene">←</button>
          <span className="mono" aria-hidden="true">{projects.map((p) => p.title).join(" · ")}</span>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === N - 1} aria-label="Next scene">→</button>
        </div>
      </div>
      <p className="gh-line">All projects on GitHub &nbsp;→&nbsp; <a href="https://github.com/eryzaimatong" target="_blank" rel="noopener">github.com/eryzaimatong</a></p>
    </section>
  );
}
