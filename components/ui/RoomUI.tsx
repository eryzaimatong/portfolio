"use client";
import { useEffect, useRef, useState } from "react";
import { experience, credentials, leadership, ciscoOrg, contact, profile } from "@/data/profile";
import { useStore, set, S } from "@/lib/store";

/* ---------- Experience and Leadership: a bottom bar to pick what the camera turns to, with keyboard and touch ---------- */
const FOCUS = {
  Experience: { key: "expSel" as const, items: () => experience.items.map((i) => ({ k: i.date, t: i.title, o: i.org })), open: (i: number) => set({ panel: { kind: "exp", index: i } }), count: 3,
    items3: () => [experience.items[0], experience.items[1], credentials.items[0]] },
  Leadership: { key: "leadSel" as const, items: () => leadership.items.map((i) => ({ k: i.date, t: i.title, o: "" })), open: (i: number) => set({ panel: { kind: "org", index: i } }), count: 3 },
};

export function FocusBar() {
  const room = useStore((s) => s.room);
  const panel = useStore((s) => s.panel);
  const expSel = useStore((s) => s.expSel);
  const leadSel = useStore((s) => s.leadSel);
  const active = (room === "Experience" || room === "Leadership") && panel === null;
  const cfg = room === "Experience" ? FOCUS.Experience : room === "Leadership" ? FOCUS.Leadership : null;
  const sel = room === "Experience" ? expSel : leadSel;

  useEffect(() => {
    if (!cfg || panel !== null) return;
    const mv = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX / innerWidth * 2 - 1;
      const i = x < -0.33 ? 0 : x > 0.33 ? 2 : 1;
      if (S[cfg.key] !== i) set({ [cfg.key]: i } as any);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") set({ [cfg.key]: Math.max(0, S[cfg.key] - 1) } as any);
      else if (e.key === "ArrowRight") set({ [cfg.key]: Math.min(2, S[cfg.key] + 1) } as any);
    };
    let x0 = 0, y0 = 0;
    const td = (e: TouchEvent) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; };
    const tu = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) set({ [cfg.key]: dx < 0 ? Math.min(2, S[cfg.key] + 1) : Math.max(0, S[cfg.key] - 1) } as any);
    };
    addEventListener("pointermove", mv); addEventListener("keydown", key);
    addEventListener("touchstart", td, { passive: true }); addEventListener("touchend", tu, { passive: true });
    return () => { removeEventListener("pointermove", mv); removeEventListener("keydown", key); removeEventListener("touchstart", td); removeEventListener("touchend", tu); };
  }, [cfg, panel]);

  const list = room === "Experience"
    ? [{ k: experience.items[0].date, t: experience.items[0].title, o: experience.items[0].org ?? "" }, { k: "Scholarship and programme", t: `${experience.items[1].title} · ${experience.items[2].title}`, o: "" }, { k: credentials.label, t: credentials.heading, o: "" }]
    : leadership.items.map((i) => ({ k: i.date, t: i.title, o: "" }));
  const cur = list[sel] ?? list[0];
  const label = room === "Experience" ? ["School", "Scholarship and programme", "Credentials"] : leadership.items.map((i) => i.date.split(" · ")[0]);
  return (
    <div className={"pbar" + (active ? " show" : "")} aria-hidden={!active}>
      <p className="mono pb-no">{String(sel + 1).padStart(2, "0")}</p>
      <div className="pb-main">
        <h2 className="pb-name">{label[sel]}</h2>
        <p className="pb-line">{cur.t}</p>
      </div>
      <div className="pb-actions">
        <button type="button" className="btn" onClick={() => cfg && set({ [cfg.key]: Math.max(0, sel - 1) } as any)} disabled={sel === 0} aria-label="Previous">←</button>
        <button type="button" className="btn solid" tabIndex={active ? 0 : -1} onClick={() => {
          if (room === "Experience") set({ panel: sel === 2 ? { kind: "cert", index: 0 } : { kind: "exp", index: sel === 0 ? 0 : 1 } });
          else set({ panel: { kind: "org", index: sel } });
        }}>{room === "Experience" ? (sel === 2 ? "View certificates" : "Details") : "Details"}</button>
        <button type="button" className="btn" onClick={() => cfg && set({ [cfg.key]: Math.min(2, sel + 1) } as any)} disabled={sel === 2} aria-label="Next">→</button>
      </div>
    </div>
  );
}

/* ---------- the detail panel (school, scholarship, programme, certificates, organizations) ---------- */
export function DetailPanel() {
  const panel = useStore((s) => s.panel);
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const [cert, setCert] = useState(0);
  useEffect(() => {
    if (!panel) { document.documentElement.classList.remove("locked"); (opener.current as HTMLElement | null)?.focus?.(); return; }
    opener.current = document.activeElement; setCert(panel.kind === "cert" ? panel.index : 0);
    document.documentElement.classList.add("locked");
    setTimeout(() => close.current?.focus(), 30);
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") set({ panel: null }); };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [panel]);
  if (!panel) return null;

  let head = "", title = "", org: string | undefined, date = "", detail: string | undefined, chips: string[] | undefined, link: { href: string; label: string } | undefined, titleHref: string | undefined, tiles: typeof ciscoOrg.tiles | undefined;
  if (panel.kind === "exp") { const i = experience.items[panel.index]; head = "Experience"; title = i.title; org = i.org; date = i.date; detail = i.detail; titleHref = i.titleHref; }
  if (panel.kind === "org") { const i = leadership.items[panel.index]; head = "Leadership"; title = i.title; date = i.date; detail = i.detail; chips = i.chips; link = i.link; if (i.orgKey === "cisco") tiles = ciscoOrg.tiles; }
  const c = credentials.items[cert];
  return (
    <aside className="inspect" role="dialog" aria-modal="true" aria-label={panel.kind === "cert" ? "Certificates" : title}>
      <div className="insp-head"><p className="mono">{panel.kind === "cert" ? credentials.label : head}</p><button ref={close} type="button" className="btn" onClick={() => set({ panel: null })}>Close</button></div>
      {panel.kind === "cert" ? (
        <>
          <h2 className="insp-title">{credentials.heading}</h2>
          <figure className="insp-fig"><img src={c.cert!.src} alt={c.cert!.alt} /><figcaption><span>{c.title}</span><span className="mono">{cert + 1} / {credentials.items.length}</span></figcaption>
            <div className="insp-nav"><button type="button" className="btn" disabled={cert === 0} onClick={() => setCert(cert - 1)} aria-label="Previous certificate">←</button><button type="button" className="btn" disabled={cert === credentials.items.length - 1} onClick={() => setCert(cert + 1)} aria-label="Next certificate">→</button></div></figure>
          <p className="mono ep-date">{c.date}</p>
        </>
      ) : (
        <>
          <h2 className="insp-title">{titleHref ? <a href={titleHref} target="_blank" rel="noopener">{title}</a> : title}</h2>
          <p className="mono ep-date">{date}</p>
          {org && <p className="lead">{org}</p>}
          {detail && <p>{detail}</p>}
          {chips && <ul className="chips" style={{ marginTop: 12 }}>{chips.map((x) => <li key={x}>{x}</li>)}</ul>}
          {tiles && (<div className="tabpanel" style={{ marginTop: 18 }}><h3 className="mono">Deliverables</h3>{tiles.map((t) => (<div key={t.title}><p className="mono ep-date">{t.tag}</p><h4 style={{ font: "500 1.1rem var(--mono)" }}>{t.title}</h4><p className="note">{t.text}</p>{"link" in t && t.link && <a className="btn" style={{ marginTop: 8 }} href={t.link.href} target="_blank" rel="noopener">{t.link.label}</a>}</div>))}</div>)}
          {link && <div className="insp-links"><a className="btn solid" href={link.href} target="_blank" rel="noopener">{link.label}</a></div>}
        </>
      )}
    </aside>
  );
}

/* ---------- Contact: the closing copy, links and sign-off ---------- */
export function ContactOverlay() {
  const room = useStore((s) => s.room);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(profile.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  return (
    <section className={"contact-ov" + (room === "Contact" ? " show" : "")} aria-hidden={room !== "Contact"} aria-label="Contact">
      <p className="mono kicker">Contact</p>
      <h2 className="co-title">{contact.heading}</h2>
      <p className="co-lead">{contact.lead}</p>
      <div className="co-links">
        <a className="btn solid" href={`mailto:${profile.email}`} tabIndex={room === "Contact" ? 0 : -1}>{profile.email}</a>
        <a className="btn" href={profile.github} target="_blank" rel="noopener" tabIndex={room === "Contact" ? 0 : -1}>GitHub ↗</a>
        <a className="btn" href={profile.linkedin} target="_blank" rel="noopener" tabIndex={room === "Contact" ? 0 : -1}>LinkedIn ↗</a>
        <button type="button" className="btn" onClick={copy} tabIndex={room === "Contact" ? 0 : -1}>{copied ? "Copied" : "Copy address"}</button>
      </div>
      <p className="mono co-foot">{contact.footer}</p>
    </section>
  );
}
