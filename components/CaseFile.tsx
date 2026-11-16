"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Project } from "@/data/projects";
import { bySlug } from "@/data/projects";
import { gsap, registerGsap, slamText, isReduced, letterbox } from "@/lib/motion";
import { useGo } from "@/lib/useGo";
import { useMotion } from "@/lib/motion-context";
import { MagneticButton } from "./MagneticButton";

/* numeric part counts up on scroll; the text always ends exactly as written */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    registerGsap();
    const el = ref.current!;
    const m = value.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
    if (!m || reduced) { el.textContent = value; return; }
    const target = parseFloat(m[1].replace(/,/g, "")), dec = (m[1].split(".")[1] || "").length, comma = m[1].includes(",");
    const o = { v: 0 };
    const fmt = (n: number) => (comma ? n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec)) + m[2];
    el.textContent = fmt(0);
    const t = gsap.to(o, { v: target, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => { el.textContent = fmt(o.v); }, onComplete: () => { el.textContent = value; } });
    return () => { t.scrollTrigger?.kill(); t.kill(); };
  }, [value, reduced]);
  return <b ref={ref as React.RefObject<HTMLElement>}>{value}</b>;
}

/* Charts that draw themselves on scroll, using only the project's real numbers. */
function Chart({ p }: { p: Project }) {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    registerGsap();
    const svg = ref.current; if (!svg || reduced) return;
    const draws = svg.querySelectorAll<SVGGeometryElement>(".draw");
    draws.forEach((d) => { const len = d.getTotalLength?.() ?? 0; if (len) { d.style.strokeDasharray = String(len); d.style.strokeDashoffset = String(len); } });
    const bars = svg.querySelectorAll<SVGElement>(".bar-fill");
    gsap.set(bars, { scaleX: 0, transformOrigin: "0 50%" });
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 80%", once: true } });
    tl.to(draws, { strokeDashoffset: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" })
      .to(bars, { scaleX: 1, duration: 0.8, stagger: 0.12, ease: "followThrough" }, 0);
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [reduced, p.slug]);

  if (p.slug === "aura") {
    // three rows, each on its own labelled scale; the 5-point limit is drawn on the gap row
    const rows = [
      { label: "Held-out accuracy of the face-shape model", note: "839 images, 5 classes", v: 57.3, max: 100, text: "57.3%" },
      { label: "Usable images", note: "4,146 of 5,000 measured", v: 4146, max: 5000, text: "4,146 / 5,000" },
      { label: "Accuracy gap across skin-tone bands", note: "my launch limit is 5 points", v: 21.6, max: 25, text: "21.6 pts", limit: 5 },
    ];
    return (
      <svg ref={ref} className="chart" viewBox="0 0 640 300" role="img" aria-label="Three bars: 57.3 percent held-out accuracy, 4,146 of 5,000 images usable, and a 21.6 point accuracy gap against a 5 point limit.">
        {rows.map((r, i) => {
          const y = 30 + i * 92, w = 560;
          return (
            <g key={r.label} transform={`translate(40,${y})`}>
              <text className="c-lab" x="0" y="-10">{r.label}</text>
              <rect x="0" y="0" width={w} height="26" className="c-track" />
              <rect x="0" y="0" width={(r.v / r.max) * w} height="26" className={"c-bar bar-fill" + (r.limit ? " hot" : "")} />
              {r.limit && <g><line className="draw c-limit" x1={(r.limit / r.max) * w} x2={(r.limit / r.max) * w} y1="-6" y2="34" /><text className="c-lab" x={(r.limit / r.max) * w + 6} y="48">limit 5</text></g>}
              <text className="c-val" x={Math.min((r.v / r.max) * w + 10, w - 120)} y="19">{r.text}</text>
              <text className="c-note" x={w} y="-10" textAnchor="end">{r.note}</text>
            </g>
          );
        })}
      </svg>
    );
  }
  // Re:Watch: ten spokes for the ten taste traits (the count is real; the traits are not scored here)
  const spokes = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; return { x: 150 + Math.cos(a) * 110, y: 150 + Math.sin(a) * 110, a }; });
  return (
    <svg ref={ref} className="chart ring" viewBox="0 0 300 300" role="img" aria-label="A ring with ten spokes, one for each of the ten taste traits in every profile.">
      <circle className="draw c-limit" cx="150" cy="150" r="110" fill="none" />
      <circle className="draw c-limit" cx="150" cy="150" r="55" fill="none" />
      {spokes.map((s, i) => (<g key={i}><line className="draw c-spoke" x1="150" y1="150" x2={s.x} y2={s.y} /><circle className="draw c-dot" cx={s.x} cy={s.y} r="5" /></g>))}
      <text className="c-val" x="150" y="158" textAnchor="middle">10 traits</text>
    </svg>
  );
}

export function CaseFile({ project: p }: { project: Project }) {
  const root = useRef<HTMLElement>(null);
  const go = useGo();
  const next = bySlug(p.next)!;

  useEffect(() => {
    registerGsap();
    const el = root.current!;
    const h = el.querySelector("[data-slam]"); if (h) slamText(h, { trigger: null, delay: 0.1 });
    if (!isReduced()) {
      gsap.from(el.querySelectorAll(".cf-rise"), { opacity: 0, y: 24, duration: 0.55, ease: "power3.out", stagger: 0.07, delay: 0.25 });
      gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".cf-sec")).forEach((s) =>
        gsap.from(s, { clipPath: "polygon(0 0,0 0,0 100%,0 100%)", duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%", once: true }, clearProps: "clipPath" }));
    }
    letterbox(false, 0.3);
  }, [p.slug]);

  return (
    <article className="cf" ref={root} id="main">
      <header className="cf-head">
        <button type="button" className="cf-back" onClick={() => go("/#projects")}>← Back to projects</button>
        <p className="mono cf-eyebrow cf-rise">{p.eyebrow}</p>
        <h1 className="cf-title"><span className="mask"><span data-slam className="slam">{p.title}</span></span></h1>
        <p className="cf-lead cf-rise">{p.tagline}</p>
        <dl className="cf-facts cf-rise">
          <div><dt className="mono">Role</dt><dd>{p.role}</dd></div>
          <div><dt className="mono">Timeline</dt><dd>{p.timeline}</dd></div>
          <div><dt className="mono">Status</dt><dd>{p.status}</dd></div>
        </dl>
        <div className="cf-actions cf-rise">
          {p.links?.github && <MagneticButton as="a" className="pill" href={p.links.github} target="_blank" rel="noopener">View on GitHub</MagneticButton>}
          {p.links?.demo && <a className="ghost" href={p.links.demo} target="_blank" rel="noopener">Live demo</a>}
        </div>
        {p.note && <p className="cf-note cf-rise">{p.note}</p>}
        <Image className="cf-logo cf-rise" src={p.logo.src} alt={p.logo.alt} width={72} height={72} style={{ background: p.logo.bg }} />
      </header>

      {p.metrics && (
        <section className="cf-sec" aria-labelledby="cf-res">
          <h2 className="mono cf-h" id="cf-res">Results</h2>
          <div className="cf-metrics">
            <ul>{p.metrics.map((m) => (<li key={m.label}><CountUp value={m.value} /><span>{m.label}</span></li>))}</ul>
            <Chart p={p} />
          </div>
        </section>
      )}

      <section className="cf-sec"><h2 className="mono cf-h">The problem</h2><p className="cf-body">{p.body.problem}</p></section>
      <section className="cf-sec"><h2 className="mono cf-h">What I built</h2><p className="cf-body">{p.body.approach}</p></section>
      <section className="cf-sec"><h2 className="mono cf-h">Technical decisions</h2><ul className="cf-decisions">{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul></section>
      <section className="cf-sec"><h2 className="mono cf-h">Status and limits</h2><p className="cf-body">{p.body.outcome}</p></section>
      <section className="cf-sec"><h2 className="mono cf-h">Built with</h2><ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul></section>
      <section className="cf-sec" aria-labelledby="cf-gal">
        <h2 className="mono cf-h" id="cf-gal">Gallery</h2>
        <div className={"cf-gal " + p.slug}>
          {p.gallery.map((g) => (
            <figure key={g.src}>
              <div className="shot"><Image src={g.src} alt={g.caption} width={p.galleryRatio[0]} height={p.galleryRatio[1]} sizes="(max-width: 760px) 80vw, 30vw" /></div>
              <figcaption>{g.caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="cf-note">{p.galleryNote}</p>
      </section>
      <footer className="cf-foot">
        <button type="button" className="ghost" onClick={() => go(`/projects/${next.slug}`, { impact: true })}>Next project &nbsp;→&nbsp; {next.title}</button>
        <button type="button" className="ghost" onClick={() => go("/#projects")}>← Back to projects</button>
      </footer>
    </article>
  );
}
