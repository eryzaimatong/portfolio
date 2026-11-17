"use client";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/data/projects";
import { useStore, set, S } from "@/lib/store";

/* Bottom bar while you are in Projects: catalogue number, name, one line from the site, Inspect exhibit. */
export function ProjectBar() {
  const room = useStore((s) => s.room);
  const sel = useStore((s) => s.selected);
  const inspect = useStore((s) => s.inspect);
  const p = projects[sel];
  const show = room === "Projects" && inspect === null;
  useEffect(() => {
    if (room !== "Projects" || inspect !== null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") set({ selected: Math.max(0, S.selected - 1) });
      else if (e.key === "ArrowRight") set({ selected: Math.min(projects.length - 1, S.selected + 1) });
      else if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "BODY") set({ inspect: S.selected });
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [room, inspect]);

  // cursor steering: toward the left or right edge moves the selection; the centre keeps it
  useEffect(() => {
    if (room !== "Projects" || inspect !== null) return;
    const mv = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX / innerWidth * 2 - 1;
      if (x < -0.28 && S.selected !== 0) set({ selected: 0 });
      else if (x > 0.28 && S.selected !== projects.length - 1) set({ selected: projects.length - 1 });
    };
    addEventListener("pointermove", mv);
    return () => removeEventListener("pointermove", mv);
  }, [room, inspect]);

  // touch: horizontal swipe changes the work; vertical drags still scroll
  useEffect(() => {
    if (room !== "Projects") return;
    let x0 = 0, y0 = 0;
    const down = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const up = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) set({ selected: dx < 0 ? Math.min(projects.length - 1, S.selected + 1) : Math.max(0, S.selected - 1) });
    };
    addEventListener("touchstart", down, { passive: true }); addEventListener("touchend", up, { passive: true });
    return () => { removeEventListener("touchstart", down); removeEventListener("touchend", up); };
  }, [room]);

  return (
    <div className={"pbar" + (show ? " show" : "")} aria-hidden={!show}>
      <p className="mono pb-no">{String(sel + 1).padStart(2, "0")}</p>
      <div className="pb-main">
        <h2 className="pb-name">{p.title}</h2>
        <p className="pb-line">{p.tagline}</p>
      </div>
      <div className="pb-actions">
        <button type="button" className="btn" onClick={() => set({ selected: Math.max(0, sel - 1) })} disabled={sel === 0} aria-label="Previous exhibit">←</button>
        <button type="button" className="btn solid" onClick={() => set({ inspect: sel })} tabIndex={show ? 0 : -1}>Inspect exhibit</button>
        <button type="button" className="btn" onClick={() => set({ selected: Math.min(projects.length - 1, sel + 1) })} disabled={sel === projects.length - 1} aria-label="Next exhibit">→</button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{`Selected: ${p.title}`}</p>
    </div>
  );
}

const TABS = ["Overview", "How it works", "Stack and contribution", "Status and limits"] as const;

/* Inspection panel: pictures first, then at most four tabs, all text from the live site. */
export function InspectPanel() {
  const inspect = useStore((s) => s.inspect);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [img, setImg] = useState(0);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const p = inspect === null ? null : projects[inspect];

  useEffect(() => {
    if (inspect === null) { document.documentElement.classList.remove("locked"); (opener.current as HTMLElement | null)?.focus?.(); return; }
    opener.current = document.activeElement; setTab("Overview"); setImg(0);
    document.documentElement.classList.add("locked");
    setTimeout(() => close.current?.focus(), 30);
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") set({ inspect: null });
      else if (e.key === "ArrowRight") setImg((i) => Math.min(i + 1, projects[inspect].gallery.length - 1));
      else if (e.key === "ArrowLeft") setImg((i) => Math.max(i - 1, 0));
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [inspect]);

  if (!p) return null;
  const g = p.gallery[img];
  return (
    <aside className="inspect" role="dialog" aria-modal="true" aria-label={`${p.title}, exhibit details`}>
      <div className="insp-head">
        <p className="mono">{p.eyebrow}</p>
        <button ref={close} type="button" className="btn" onClick={() => set({ inspect: null })}>Close</button>
      </div>
      <h2 className="insp-title">{p.title}</h2>
      <figure className="insp-fig">
        <img src={g.src} alt={g.caption} width={p.galleryRatio[0]} height={p.galleryRatio[1]} className={p.slug} />
        <figcaption><span>{g.caption}</span><span className="mono">{img + 1} / {p.gallery.length}</span></figcaption>
        <div className="insp-nav">
          <button type="button" className="btn" onClick={() => setImg(Math.max(0, img - 1))} disabled={img === 0} aria-label="Previous picture">←</button>
          <button type="button" className="btn" onClick={() => setImg(Math.min(p.gallery.length - 1, img + 1))} disabled={img === p.gallery.length - 1} aria-label="Next picture">→</button>
        </div>
      </figure>
      <div className="tabs" role="tablist" aria-label="Exhibit details">
        {TABS.map((t) => (<button key={t} role="tab" type="button" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>))}
      </div>
      <div className="tabpanel" role="tabpanel">
        {tab === "Overview" && (<>
          <p className="lead">{p.tagline}</p>
          <dl className="facts"><div><dt className="mono">Role</dt><dd>{p.role}</dd></div><div><dt className="mono">Timeline</dt><dd>{p.timeline}</dd></div><div><dt className="mono">Status</dt><dd>{p.status}</dd></div></dl>
          {p.metrics && <ul className="results">{p.metrics.map((m) => (<li key={m.label}><b>{m.value}</b><span>{m.label}</span></li>))}</ul>}
          <h3 className="mono">The problem</h3><p>{p.body.problem}</p>
          {p.note && <p className="note">{p.note}</p>}
        </>)}
        {tab === "How it works" && (<><p>{p.body.approach}</p><h3 className="mono">Technical decisions</h3><ul className="decisions">{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul></>)}
        {tab === "Stack and contribution" && (<><p className="mono">Role: {p.role}</p><ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul></>)}
        {tab === "Status and limits" && <p>{p.body.outcome}</p>}
      </div>
      <div className="insp-links">
        {p.links?.github && <a className="btn solid" href={p.links.github} target="_blank" rel="noopener">View on GitHub</a>}
        {p.links?.demo && <a className="btn" href={p.links.demo} target="_blank" rel="noopener">Live demo</a>}
      </div>
    </aside>
  );
}
