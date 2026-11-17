"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projects, type Project } from "@/data/projects";
import { Dialog } from "./Dialogs";

const TABS = ["Overview", "How it works", "Stack and contribution", "Status and limits"] as const;

/* Case file: pictures first, then at most four tabs, all text from the existing site. */
function CaseFile({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [img, setImg] = useState(0);
  useEffect(() => { setTab("Overview"); setImg(0); }, [project]);
  const p = project ?? projects[0];
  const g = p.gallery[Math.min(img, p.gallery.length - 1)];
  return (
    <Dialog open={!!project} onClose={onClose} label={`${p.title} case file`}>
      <p className="mono label-red">{p.eyebrow}</p>
      <h3 className="dlg-title pixel">{p.title}</h3>
      <figure className="cf-fig">
        <img src={g.src} alt={g.caption} className={p.slug} />
        <figcaption><span>{g.caption}</span><span className="mono">{img + 1} / {p.gallery.length}</span></figcaption>
        <div className="cf-nav">
          <button type="button" className="btn" onClick={() => setImg(Math.max(0, img - 1))} disabled={img === 0} aria-label="Previous picture">←</button>
          <button type="button" className="btn" onClick={() => setImg(Math.min(p.gallery.length - 1, img + 1))} disabled={img === p.gallery.length - 1} aria-label="Next picture">→</button>
        </div>
      </figure>
      <div className="tabs" role="tablist" aria-label="Case file">
        {TABS.map((t) => (<button key={t} role="tab" type="button" aria-selected={tab === t} className={tab === t ? "on mono" : "mono"} onClick={() => setTab(t)}>{t}</button>))}
      </div>
      <div className="tabpanel" role="tabpanel">
        {tab === "Overview" && (<>
          <p className="lead">{p.tagline}</p>
          <dl className="facts small"><div><dt className="mono">Role</dt><dd>{p.role}</dd></div><div><dt className="mono">Timeline</dt><dd>{p.timeline}</dd></div><div><dt className="mono">Status</dt><dd>{p.status}</dd></div></dl>
          {p.metrics && <ul className="results">{p.metrics.map((m) => (<li key={m.label}><b className="pixel">{m.value}</b><span>{m.label}</span></li>))}</ul>}
          <h4 className="mono label-red">The problem</h4><p>{p.body.problem}</p>
          {p.note && <p className="dim">{p.note}</p>}
        </>)}
        {tab === "How it works" && (<><p>{p.body.approach}</p><h4 className="mono label-red">Technical decisions</h4><ul className="decisions">{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul></>)}
        {tab === "Stack and contribution" && (<><p className="mono">Role: {p.role}</p><ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul></>)}
        {tab === "Status and limits" && <p>{p.body.outcome}</p>}
      </div>
      <div className="dlg-actions">
        {p.links?.github && <a className="btn solid" href={p.links.github} target="_blank" rel="noopener">View on GitHub</a>}
        {p.links?.demo && <a className="btn" href={p.links.demo} target="_blank" rel="noopener">Live demo</a>}
      </div>
    </Dialog>
  );
}

/* Projects: every real screen from both projects floats in a row. Scroll, drag, use the arrows or the arrow keys;
   the one in the middle is projected as a hologram, the others stay as faint wireframes. */
export function HoloCarousel() {
  const N = projects.length;
  const track = useRef<HTMLUListElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<Project | null>(null);
  const inView = useRef(false);
  const section = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const reduce = useMemo(() => (typeof window !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false), []);

  const update = useCallback(() => {
    const t = track.current; if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0, bd = Infinity;
    items.current.forEach((el, i) => {
      if (!el) return;
      const w = el.offsetWidth + 28;
      const d = (el.offsetLeft + el.offsetWidth / 2 - mid) / w;
      el.style.setProperty("--d", d.toFixed(3));
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
    });
    setActive((a) => (a === best ? a : best));
  }, []);

  const goTo = useCallback((i: number) => {
    const t = track.current, el = items.current[Math.max(0, Math.min(N - 1, i))]; if (!t || !el) return;
    t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [N, reduce]);

  useEffect(() => {
    const t = track.current!;
    const on = () => update();          // cheap (a few items), so no frame throttling: it must keep up even if frames are paused
    t.addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    update();
    return () => { t.removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [update]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { inView.current = e.isIntersecting; }, { threshold: 0.35 });
    if (section.current) io.observe(section.current);
    const key = (e: KeyboardEvent) => {
      if (!inView.current || document.documentElement.classList.contains("locked")) return;
      if ((e.target as HTMLElement)?.closest?.("input,textarea,select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
    };
    addEventListener("keydown", key);
    return () => { io.disconnect(); removeEventListener("keydown", key); };
  }, [active, goTo]);

  // mouse drag (touch and trackpads already scroll natively)
  const down = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; const t = track.current!; drag.current = { x: e.clientX, left: t.scrollLeft, moved: false }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, t = track.current; if (!d || !t) return;
    const dx = e.clientX - d.x; if (Math.abs(dx) > 4) { d.moved = true; t.style.scrollSnapType = "none"; t.classList.add("drag"); }
    if (d.moved) t.scrollLeft = d.left - dx;
  };
  const up = () => {
    const d = drag.current, t = track.current; drag.current = null; if (!t) return;
    if (d?.moved) { t.classList.remove("drag"); goTo(active); setTimeout(() => { t.style.scrollSnapType = ""; }, 400); }
  };

  const p = projects[active];
  return (
    <section id="projects" className="section holo" ref={section} aria-labelledby="proj-h">
      <header className="sec rv">
        <h2 id="proj-h" className="pixel"><span className="n">02</span> — projects</h2>
        <a className="sec-link mono" href="https://github.com/eryzaimatong" target="_blank" rel="noopener">all projects on github →</a>
        <i className="bleed" aria-hidden="true" />
      </header>
      <p className="about-sub rv">Two public projects, each built around a real problem.</p>

      <div className="stage rv" role="group" aria-roledescription="carousel" aria-label="Projects. Scroll sideways, drag, or use the left and right arrow keys; press Enter on the middle one to open its case file.">
        <i className="beam" aria-hidden="true" /><i className="base" aria-hidden="true" />
        <ul className="track" ref={track} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
          {projects.map((pr, i) => {
            const on = i === active;
            return (
              <li key={pr.slug} ref={(el) => { items.current[i] = el; }} className={"hi" + (on ? " is-on" : "")} style={{ "--d": i - active } as React.CSSProperties} aria-roledescription="slide" aria-label={`${i + 1} of ${N}`}>
                <button type="button" tabIndex={on ? 0 : -1} className="hbtn" aria-label={on ? `Open the ${pr.title} case file` : `Show ${pr.title}`}
                  onClick={() => { if (drag.current?.moved) return; if (on) setOpen(pr); else goTo(i); }}>
                  <span className="hfig">
                    <img src={pr.cover} alt="" draggable={false} className={pr.slug} />
                    <i className="tint" /><i className="scanl" /><i className="band" />
                    <b className="br tl" /><b className="br tr" /><b className="br bl" /><b className="br rb" />
                    <span className="tag mono">project {String(i + 1).padStart(2, "0")}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="holo-nav">
          <button type="button" className="btn" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous project">←</button>
          <span className="mono dim" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
          <button type="button" className="btn" onClick={() => goTo(active + 1)} disabled={active === N - 1} aria-label="Next project">→</button>
        </div>
      </div>

      <div className="holo-info rv" aria-live="polite">
        <p className="mono label-red">{p.eyebrow}</p>
        <h3 className="pixel holo-title">{p.title}</h3>
        <p className="holo-actions"><button type="button" className="btn solid" onClick={() => setOpen(p)}>Open the case file</button></p>
      </div>
      <CaseFile project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
