"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useGo } from "@/lib/useGo";
import { useMotion } from "@/lib/motion-context";
import { gsap } from "@/lib/motion";

export const NAV = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

export function Nav({ onPalette }: { onPalette: () => void }) {
  const go = useGo();
  const pathname = usePathname();
  const { mode, setMode, reduced } = useMotion();
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const onHome = pathname === "/";

  useEffect(() => {
    if (!onHome) return;
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: "-45% 0px -50% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [onHome, pathname]);

  useEffect(() => {
    const m = menu.current;
    if (!m) return;
    if (reduced) { m.style.clipPath = open ? "none" : "polygon(0 0,0 0,0 0,0 0)"; return; }
    gsap.to(m, { clipPath: open ? "polygon(0 0,100% 0,100% 100%,0 100%)" : "polygon(0 0,0 0,-30vh 100%,0 100%)", duration: 0.55, ease: "power3.inOut" });
  }, [open, reduced]);
  useEffect(() => { document.documentElement.classList.toggle("menu-open", open); }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);

  const goto = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); setOpen(false); go(id === "home" ? "/" : `/#${id}`); };

  return (
    <header className="nav" id="nav">
      <a className="nav-mark" href="/" onClick={goto("home")} aria-label="Eryza Mae Imatong, back to the start"><span>紅</span> Eryza<b>.</b></a>
      <nav className="nav-grid" aria-label="Primary">
        {NAV.map((n, i) => (
          <a key={n.id} href={n.id === "home" ? "/" : `/#${n.id}`} onClick={goto(n.id)} className={onHome && active === n.id ? "on" : ""} aria-current={onHome && active === n.id ? "location" : undefined}>
            <small aria-hidden="true">0{i + 1}</small>{n.label}
          </a>
        ))}
      </nav>
      <div className="nav-tools">
        <button type="button" className="tool" onClick={onPalette} aria-label="Open command palette"><kbd>Ctrl K</kbd></button>
        <button type="button" className="tool motion-toggle" aria-pressed={mode === "calm"} onClick={() => setMode(mode === "calm" ? "cinematic" : "calm")}
          title="Switch between full motion and reduced motion">
          <span className={mode === "cinematic" ? "on" : ""}>Cinematic</span><span className={mode === "calm" ? "on" : ""}>Calm</span>
        </button>
        <button type="button" className="tool burger" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
      </div>
      <div className="menu" id="menu" ref={menu} role="dialog" aria-label="Menu" aria-hidden={!open} {...(open ? {} : { inert: true })}>
        <ol>
          {NAV.map((n, i) => (
            <li key={n.id}><a href={n.id === "home" ? "/" : `/#${n.id}`} onClick={goto(n.id)}><small>0{i + 1}</small>{n.label}</a></li>
          ))}
        </ol>
      </div>
    </header>
  );
}
