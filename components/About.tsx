"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { about, experience, leadership, credentials, ciscoOrg, type Panel } from "@/data/profile";
import { gsap, registerGsap, slamText, isReduced, SplitText } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";
import { Modal } from "./Modal";
import { SectionStrip } from "./SectionStrip";

function Badge({ b }: { b: NonNullable<Panel["badge"]> }) {
  return (
    <span className={"badge" + (b.round ? " round" : "") + (b.wide ? " wide" : "") + (b.light ? " light" : "")}>
      <Image src={b.src} alt={b.alt} width={b.wide ? 120 : 64} height={64} />
    </span>
  );
}

function Panels({ items, start, onOrg, onCert }: { items: Panel[]; start: number; onOrg?: (k: string) => void; onCert?: (c: { src: string; alt: string }) => void }) {
  return (
    /* Episode cards: each one sticks while the next slides over it, so the whole list reads as a deck you can scan top to bottom. */
    <ol className="stack">
      {items.map((it, i) => {
        const n = start + i + 1;
        return (
          <li className="ep" key={it.title} style={{ "--i": i } as React.CSSProperties}>
            <div className="ep-card panel">
              <span className="ep-no" aria-hidden="true">{String(n).padStart(2, "0")}</span>
              <div className="ep-main">
                <p className="mono ep-date">{it.date}</p>
                <h4 className="ep-title">{it.titleHref ? <a href={it.titleHref} target="_blank" rel="noopener">{it.title}</a> : it.title}</h4>
                {it.org && <p className="ep-org">{it.org}</p>}
                {it.detail && <p className="ep-detail">{it.detail}</p>}
                {it.chips && <ul className="chips">{it.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
                <div className="panel-actions">
                  {it.orgKey && onOrg && <button type="button" className="ghost sm" onClick={() => onOrg(it.orgKey!)} aria-haspopup="dialog">View deliverables →</button>}
                  {it.link && <a className="ghost sm" href={it.link.href} target="_blank" rel="noopener">{it.link.label} →</a>}
                  {it.cert && onCert && <button type="button" className="ghost sm" onClick={() => onCert(it.cert!)} aria-haspopup="dialog">View certificate →</button>}
                </div>
              </div>
              {it.badge && <Badge b={it.badge} />}
              <i className="panel-edge" aria-hidden="true" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function About() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  const [orgOpen, setOrgOpen] = useState(false);
  const [cert, setCert] = useState<{ src: string; alt: string } | null>(null);
  useEffect(() => {
    registerGsap();
    const el = root.current!;
    const h = el.querySelector("[data-slam]"); if (h) slamText(h);
    if (isReduced()) return;
    // each panel wipes in on a diagonal with a hard red edge that travels across
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".ep-card").forEach((p) => {
        const edge = p.querySelector(".panel-edge");
        const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: "top 88%", once: true } });
        tl.fromTo(p, { clipPath: "polygon(0 0,0 0,-12% 100%,0 100%)" }, { clipPath: "polygon(0 0,112% 0,100% 100%,0 100%)", duration: 0.6, ease: "power3.out", clearProps: "clipPath" })
          .fromTo(edge, { left: "0%", opacity: 1 }, { left: "108%", opacity: 0, duration: 0.6, ease: "power3.out" }, 0);
      });
      // a card recedes (smaller, dimmer) as the next one slides over it
      gsap.utils.toArray<HTMLElement>(".stack").forEach((st) => {
        const eps = gsap.utils.toArray<HTMLElement>(".ep", st);
        eps.slice(0, -1).forEach((ep, i) => {
          gsap.to(ep.querySelector(".ep-card"), { scale: 0.93, filter: "brightness(.55)", ease: "none", transformOrigin: "50% 0",
            scrollTrigger: { trigger: eps[i + 1], start: "top 90%", end: "top 28%", scrub: true } });
        });
      });
      // the bio lights up word by word as it scrolls past; everything stays readable
      gsap.utils.toArray<HTMLElement>(".about-bio").forEach((p) => {
        const sp = SplitText.create(p, { type: "words" });
        gsap.fromTo(sp.words, { opacity: 0.28 }, { opacity: 1, stagger: 0.04, ease: "none", scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 52%", scrub: true } });
      });
      gsap.from(".fields > div", { opacity: 0, y: 14, duration: 0.45, stagger: 0.06, ease: "power3.out", scrollTrigger: { trigger: ".fields", start: "top 88%", once: true } });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id="about" className="about" ref={root} aria-labelledby="aboutTitle">
      <SectionStrip word="About" />
      <div className="about-grid">
        <figure className="about-photo">
          <div className="photo-frame"><Image src={about.photo.src} alt={about.photo.alt} width={420} height={420} sizes="(max-width: 860px) 70vw, 28vw" /><i aria-hidden="true" className="photo-dots" /></div>
          <figcaption className="mono">Eryza Mae Imatong</figcaption>
        </figure>
        <div className="about-copy">
          <p className="mono label">About</p>
          <h2 id="aboutTitle" className="h2 slam" data-slam>{about.heading}</h2>
          <p className="about-lead">{about.lead}</p>
          {about.bio.map((b) => <p key={b} className="about-bio">{b}</p>)}
          <dl className="fields">
            {about.fields.map(([k, v]) => (<div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </div>
      </div>

      <div className="timeline" id="experience">
        <header className="tl-head"><p className="mono label">Experience</p><h3 className="h3">{experience.heading}</h3><p className="tl-sub">{experience.sub}</p></header>
        <Panels items={experience.items} start={0} />
        <header className="tl-head"><p className="mono label">{leadership.label}</p><h3 className="h3">{leadership.heading}</h3><p className="tl-sub">{leadership.sub}</p></header>
        <Panels items={leadership.items} start={3} onOrg={() => setOrgOpen(true)} />
        <header className="tl-head"><p className="mono label">{credentials.label}</p><h3 className="h3">{credentials.heading}</h3></header>
        <Panels items={credentials.items} start={6} onCert={setCert} />
      </div>

      <Modal open={orgOpen} onClose={() => setOrgOpen(false)} label="Cisco NetConnect deliverables">
        <div className="org-head"><Image src="/assets/logo-netconnect.png" alt="Cisco NetConnect logo" width={64} height={64} /><div><p className="mono label">{ciscoOrg.org}</p><h3 className="h3">{ciscoOrg.role}</h3></div></div>
        <p className="mono label">Deliverables</p>
        <div className="org-tiles">
          {ciscoOrg.tiles.map((t) => (
            <article key={t.title} className="tile">
              <p className="mono label">{t.tag}</p><h4>{t.title}</h4><p>{t.text}</p>
              {"chips" in t && t.chips && <ul className="chips">{t.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
              {"link" in t && t.link && <a className="tile-link" href={t.link.href} target="_blank" rel="noopener">{t.link.label} →</a>}
            </article>
          ))}
        </div>
      </Modal>
      <Modal open={!!cert} onClose={() => setCert(null)} label="Certificate">
        {cert && <img className="cert-img" src={cert.src} alt={cert.alt} />}
      </Modal>
    </section>
  );
}
