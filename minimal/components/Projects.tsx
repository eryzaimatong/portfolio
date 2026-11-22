"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { projects, type Project } from "@/data/projects";
import { Dialog } from "./Dialogs";
import { useThreeScene, type SceneHandle } from "./three/runtime";
import type { ProjectHandle, ProjectProps } from "./three/projectObjects";

const TABS = ["Overview", "How it works", "Stack and contribution", "Status and limits"] as const;

/* Case file: pictures first, then at most four tabs, all text from the existing site. (Unchanged.) */
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
        <img src={g.src} alt={g.caption} className={p.slug} decoding="async" />
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

/* One project card: its screenshot at first paint, then the 3D object fades in over it.
   Mouse: hover to fan, click to open. Touch: press and hold to fan, tap to open. Keyboard: the button. */
function ProjectCard({ p, n, onOpen }: { p: Project; n: number; onOpen: (p: Project, stage: HTMLElement, h: ProjectHandle | null) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const handle = useRef<SceneHandle | null>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const press = useRef<{ x: number; y: number; t: number; timer: number; held: boolean } | null>(null);
  const lastType = useRef("mouse");
  const props: ProjectProps = { kind: p.slug === "aura" ? "scan" : "deck", shots: p.gallery.map((g) => g.src), logo: p.logo.src, logoBg: p.logo.bg };
  useThreeScene(stage, () => import("./three/projectObjects"), { props, name: p.slug, handleRef: handle });
  const h = () => handle.current as ProjectHandle | null;

  const open = () => onOpen(p, stage.current!, h());
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !tag.current || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    tag.current.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
  };
  const down = (e: React.PointerEvent) => {
    lastType.current = e.pointerType;
    if (e.pointerType === "mouse") return;
    const s = { x: e.clientX, y: e.clientY, t: performance.now(), held: false, timer: 0 };
    s.timer = window.setTimeout(() => { s.held = true; h()?.hover(true); }, 220);   // press and hold: fan out
    press.current = s;
  };
  const up = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const s = press.current; press.current = null; if (!s) return;
    clearTimeout(s.timer);
    if (s.held) { h()?.hover(false); return; }
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 10) open();                // a tap opens
  };
  const cancel = () => { const s = press.current; press.current = null; if (s) { clearTimeout(s.timer); if (s.held) h()?.hover(false); } };

  return (
    <article className="pcard rv">
      <div ref={stage} className="pstage" aria-hidden="true"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") h()?.hover(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") h()?.hover(false); cancel(); }}
        onPointerMove={move} onPointerDown={down} onPointerUp={up} onPointerCancel={cancel}
        onClick={() => { if (lastType.current !== "touch" && lastType.current !== "pen") open(); }}
        onContextMenu={(e) => e.preventDefault()}>
        <img className={"pstage-poster " + p.slug} src={p.cover} alt="" width={p.galleryRatio[0]} height={p.galleryRatio[1]} loading="lazy" decoding="async" />
        <span className="pstage-no mono">project {String(n).padStart(2, "0")}</span>
        <span ref={tag} className="cursor-tag mono">open</span>
      </div>
      <div className="pmeta">
        <p className="mono label-red">{p.eyebrow}</p>
        <h3 className="pixel ptitle">{p.title}</h3>
        <Proof p={p} />
        <button type="button" className="btn solid" onClick={open}>Open the case file</button>
      </div>
    </article>
  );
}

/* One real number per project, drawn when the card arrives, so the proof is visible without opening anything. */
function Proof({ p }: { p: Project }) {
  if (p.slug === "aura") {
    const m = p.metrics?.find((x) => x.value.includes("pts"));
    if (!m) return null;
    const gap = parseFloat(m.value), limit = 5, max = 25;
    return (
      <figure className="proof">
        <p className="proof-n"><b className="pixel">{m.value}</b><span className="mono">accuracy gap across skin-tone bands</span></p>
        <div className="proof-bar" role="img" aria-label={`Accuracy gap ${gap} points against a ${limit}-point launch limit`}>
          <i className="proof-fill" style={{ "--v": gap / max } as React.CSSProperties} />
          <i className="proof-limit" style={{ left: `${(limit / max) * 100}%` }}><span className="mono">{limit}-pt limit</span></i>
        </div>
        <figcaption className="mono">held back from launch by my own fairness gate until it passes</figcaption>
      </figure>
    );
  }
  const m = p.metrics?.find((x) => /trials/.test(x.label));
  if (!m) return null;
  return (
    <figure className="proof">
      <p className="proof-n"><b className="pixel">{m.value}</b><span className="mono">randomized trials</span></p>
      <div className="proof-bar ticks" role="img" aria-label={m.label}><i className="proof-fill" style={{ "--v": 1 } as React.CSSProperties} /></div>
      <figcaption className="mono">in the test that checks every score equals the sum of its reasons</figcaption>
    </figure>
  );
}

type VT = { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null);
  const from = useRef<{ stage: HTMLElement; h: ProjectHandle | null } | null>(null);

  /* click: the object rushes toward you, then the card morphs into the case file (View Transitions where supported) */
  const openCase = useCallback(async (p: Project, stage: HTMLElement, h: ProjectHandle | null) => {
    from.current = { stage, h };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vt = (document as unknown as VT).startViewTransition;
    if (reduce || !vt) { setOpen(p); return; }
    await h?.zoom();
    stage.style.viewTransitionName = "case-shot";
    vt.call(document, () => { stage.style.viewTransitionName = ""; flushSync(() => setOpen(p)); }).finished.finally(() => h?.reset());
  }, []);

  const closeCase = useCallback(() => {
    const f = from.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vt = (document as unknown as VT).startViewTransition;
    if (!f || reduce || !vt || !document.querySelector("dialog.dlg[open] .cf-fig")) { setOpen(null); f?.h?.reset(); return; }
    vt.call(document, () => { flushSync(() => setOpen(null)); f.stage.style.viewTransitionName = "case-shot"; }).finished.finally(() => { f.stage.style.viewTransitionName = ""; });
  }, []);

  return (
    <section id="projects" className="section projects" aria-labelledby="proj-h">
      <header className="sec rv">
        <h2 id="proj-h" className="pixel"><span className="n">02</span> — projects</h2>
        <a className="sec-link mono" href="https://github.com/eryzaimatong" target="_blank" rel="noopener">all projects on github →</a>
        <i className="bleed" aria-hidden="true" />
      </header>
      <p className="about-sub rv">Two public projects, each built around a real problem.</p>
      <div className="pgrid">
        {projects.map((p, i) => <ProjectCard key={p.slug} p={p} n={i + 1} onOpen={openCase} />)}
      </div>
      <CaseFile project={open} onClose={closeCase} />
    </section>
  );
}
