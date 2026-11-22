"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/profile";
import { Mark } from "./Mark";
import { SoundToggle } from "./Soundtrack";

/* Live-site section names, in the live site's order. */
const NAV = ["Home", "About", "Projects", "Skills", "Experience", "Leadership", "Contact"] as const;

export function Sidebar() {
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // a chapter card each time the reader crosses into a new section (not on load, not with reduced motion)
  const [chapter, setChapter] = useState<{ n: number; k: number } | null>(null);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (prev.current !== null && prev.current !== active && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const n = NAV.findIndex((x) => x.toLowerCase() === active);
      if (n > 0) setChapter((c) => ({ n, k: (c?.k ?? 0) + 1 }));
    }
    prev.current = active;
  }, [active]);

  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.toLowerCase())).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("menu-open", open); }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);

  const copy = async () => { try { await navigator.clipboard.writeText(profile.email); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} };

  return (
    <>
      {chapter && (<div key={chapter.k} className="chapter" aria-hidden="true" onAnimationEnd={(e) => { if (e.animationName === "chapter") setChapter(null); }}><b className="pixel">{String(chapter.n).padStart(2, "0")}</b><span className="mono">{NAV[chapter.n].toLowerCase()}</span><i /></div>)}
    <aside className="side">
      <div className="side-top">
        <a className="side-name" href="#home" aria-label="Eryza Mae Imatong, back to the top" onClick={() => setOpen(false)}><Mark size={26} /><span className="pixel">{profile.name}</span></a>
        <SoundToggle />
        <button type="button" className="side-burger mono" aria-expanded={open} aria-controls="sidenav" onClick={() => setOpen((o) => !o)}>{open ? "close" : "menu"}</button>
      </div>
      <nav id="sidenav" className={"side-nav" + (open ? " open" : "")} aria-label="Primary">
        <ul>
          {NAV.map((n, i) => (
            <li key={n}>
              <a href={`#${n.toLowerCase()}`} className={active === n.toLowerCase() ? "on" : ""} aria-current={active === n.toLowerCase() ? "location" : undefined} onClick={() => setOpen(false)}>
                <span className="num mono" aria-hidden="true">{String(i).padStart(2, "0")}</span>{n}
              </a>
            </li>
          ))}
        </ul>
        <div className="side-foot">
          <p className="side-status"><i aria-hidden="true" />{profile.availability}</p>
          <p className="side-mail-label mono">reach me at</p>
          <a className="side-mail mono" href={`mailto:${profile.email}`}>{profile.email}</a>
          <button type="button" className="side-copy mono" onClick={copy}>{copied ? "copied" : "copy address"}</button>
        </div>
      </nav>
    </aside>
    </>
  );
}
