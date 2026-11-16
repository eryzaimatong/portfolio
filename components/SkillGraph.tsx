"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, type SimulationNodeDatum } from "d3";
import { skillGroups, skillNote } from "@/data/skills";
import { projects } from "@/data/projects";
import { slamText, registerGsap } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";
import { useGo } from "@/lib/useGo";
import { SectionStrip } from "./SectionStrip";

type Kind = "group" | "skill" | "project";
type GNode = SimulationNodeDatum & { id: string; kind: Kind; label: string; used?: boolean; group?: string; projects?: string[]; r: number };
type GLink = { source: string | GNode; target: string | GNode };
const W = 1000, H = 640;

/* Force-directed skill graph. Hover or focus a skill (or its chip) to light the project(s) that use it; click a project to open its case file. */
export function SkillGraph() {
  const { reduced } = useMotion();
  const go = useGo();
  const [sel, setSel] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, [number, number]>>({});
  const svg = useRef<SVGSVGElement>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: GNode[] = [], links: GLink[] = [];
    projects.forEach((p) => nodes.push({ id: "p:" + p.slug, kind: "project", label: p.title, r: 34 }));
    skillGroups.forEach((g) => {
      nodes.push({ id: "g:" + g.id, kind: "group", label: g.name, r: 20 });
      g.skills.forEach((s) => {
        const id = "s:" + s.name;
        nodes.push({ id, kind: "skill", label: s.name, used: s.used, group: g.name, projects: s.projects, r: s.used ? 7 : 5 });
        links.push({ source: id, target: "g:" + g.id });
        s.projects?.forEach((slug) => links.push({ source: id, target: "p:" + slug }));
      });
    });
    return { nodes, links };
  }, []);

  useEffect(() => {
    const sim = forceSimulation<GNode>(nodes.map((n) => ({ ...n })))
      .force("link", forceLink<GNode, GLink>(links.map((l) => ({ ...l }))).id((d) => d.id).distance((l) => ((l.target as GNode).kind === "project" ? 230 : 95)).strength(0.35))
      .force("charge", forceManyBody<GNode>().strength((d) => (d.kind === "skill" ? -170 : d.kind === "project" ? -1400 : -1000)))
      .force("center", forceCenter(W / 2, H / 2))
      .force("x", forceX(W / 2).strength(0.015)).force("y", forceY(H / 2).strength(0.03))
      .force("collide", forceCollide<GNode>().radius((d) => d.r + (d.kind === "skill" ? 20 : 30)));
    const write = () => {
      const o: Record<string, [number, number]> = {};
      sim.nodes().forEach((n) => { o[n.id] = [Math.max(40, Math.min(W - 40, n.x ?? 0)), Math.max(30, Math.min(H - 30, n.y ?? 0))]; });
      setPos(o);
    };
    if (reduced) { sim.stop(); for (let i = 0; i < 300; i++) sim.tick(); write(); return () => { sim.stop(); }; }
    let frame = 0;
    sim.on("tick", () => { if (++frame % 2 === 0) write(); }).on("end", write);
    const el = svg.current; let io: IntersectionObserver | undefined;
    if (el) { io = new IntersectionObserver(([e]) => { if (e.isIntersecting) sim.restart(); else sim.stop(); }); io.observe(el); }
    return () => { sim.stop(); io?.disconnect(); };
  }, [nodes, links, reduced]);

  useEffect(() => { registerGsap(); const h = document.getElementById("skillsTitle"); if (h) slamText(h); }, []);

  // everything connected to the selection
  const lit = useMemo(() => {
    const s = new Set<string>();
    if (!sel) return s;
    s.add(sel);
    links.forEach((l) => { const a = l.source as string, b = l.target as string; if (a === sel) s.add(b); if (b === sel) s.add(a); });
    // a project lights every skill linked to it, a group lights its skills
    return s;
  }, [sel, links]);

  const info = (() => {
    const n = nodes.find((x) => x.id === sel);
    if (!n) return { k: "Pick a skill", t: "Every technology on my stack is a node. Hover, tap, or tab through the list." };
    if (n.kind === "project") return { k: n.label, t: "Open the case file to see how it was built." };
    if (n.kind === "group") return { k: n.label, t: "Technologies in this group." };
    const pn = (n.projects || []).map((s) => projects.find((p) => p.slug === s)!.title);
    const used = pn.length ? `Used in ${pn.join(" and ")}.` : n.used ? "Used in my projects." : "On my stack.";
    return { k: n.label, t: `${n.group}. ${used}` };
  })();

  const P = (id: string) => pos[id] ?? [W / 2, H / 2];
  const dim = (id: string) => (sel && !lit.has(id) ? " dim" : "");

  return (
    <section id="skills" className="skills" aria-labelledby="skillsTitle">
      <SectionStrip word="Skills" />
      <header className="sec-head">
        <p className="mono label">Skills</p>
        <h2 id="skillsTitle" className="h2 slam">Tech Stack</h2>
        <p className="wall-sub">What I work with across data and software, plus the tools I use to build and collaborate.</p>
      </header>

      <div className="lcd" role="status" aria-live="polite"><span className="mono lcd-k">{info.k}</span><span className="lcd-t">{info.t}</span></div>

      <svg ref={svg} className="graph" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" onPointerLeave={() => setSel(null)}>
        <g className="g-links">
          {links.map((l, i) => {
            const a = l.source as string, b = l.target as string; const [x1, y1] = P(a), [x2, y2] = P(b);
            const on = sel && lit.has(a) && lit.has(b);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={"g-link" + (b.startsWith("p:") ? " proj" : "") + (on ? " on" : sel ? " dim" : "")} />;
          })}
        </g>
        {nodes.map((n) => {
          const [x, y] = P(n.id);
          const common = { onPointerEnter: () => setSel(n.id), transform: `translate(${x},${y})` };
          if (n.kind === "project")
            return (<g key={n.id} {...common} className={"g-node project" + dim(n.id)} role="presentation" onClick={() => go(`/projects/${n.id.slice(2)}`, { impact: true })} data-hot>
              <circle r={n.r} /><text className="g-proj" y="5" textAnchor="middle">{n.label}</text></g>);
          if (n.kind === "group")
            return (<g key={n.id} {...common} className={"g-node group" + dim(n.id)}><circle r={n.r} /><text y={-n.r - 8} textAnchor="middle">{n.label}</text></g>);
          const showLabel = n.used || lit.has(n.id);      // unlit names live in the index below; the graph stays legible
          return (<g key={n.id} {...common} className={"g-node skill" + (n.used ? " used" : "") + dim(n.id)}><circle r={n.r} />{showLabel && <text y={n.r + 14} textAnchor="middle">{n.label}</text>}</g>);
        })}
      </svg>

      {/* The same data as a keyboard- and touch-friendly index; the graph above is a visual companion. */}
      <div className="skill-index">
        {skillGroups.map((g) => (
          <div key={g.id} className="skill-group">
            <h3 className="mono">{g.name}</h3>
            <ul>
              {g.skills.map((s) => (
                <li key={s.name}>
                  <button type="button" className={"chip" + (s.used ? " used" : "") + (sel === "s:" + s.name ? " sel" : "")} aria-pressed={sel === "s:" + s.name}
                    onClick={() => setSel(sel === "s:" + s.name ? null : "s:" + s.name)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel("s:" + s.name); }}>
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="stk-note"><i className="led" aria-hidden="true" /> {skillNote}</p>
    </section>
  );
}
