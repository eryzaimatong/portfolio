"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGo } from "@/lib/useGo";
import { useMotion } from "@/lib/motion-context";
import { projects } from "@/data/projects";
import { profile } from "@/data/profile";

type Item = { id: string; group: string; label: string; hint?: string; run: () => void };

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const go = useGo();
  const { mode, setMode } = useMotion();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);
  const [note, setNote] = useState("");

  const items = useMemo<Item[]>(() => {
    const close = (fn: () => void) => () => { setOpen(false); fn(); };
    return [
      ...[["home", "Home"], ["projects", "Projects"], ["about", "About"], ["experience", "Experience"], ["skills", "Skills"], ["contact", "Contact"]].map(([id, l]) => (
        { id: "s-" + id, group: "Go to", label: l, run: close(() => go(id === "home" ? "/" : `/#${id}`)) })),
      ...projects.map((p) => ({ id: "p-" + p.slug, group: "Projects", label: p.title, hint: p.eyebrow.split("//")[1]?.trim(), run: close(() => go(`/projects/${p.slug}`, { impact: true })) })),
      { id: "a-motion", group: "Actions", label: mode === "calm" ? "Switch to Cinematic motion" : "Switch to Calm (reduced motion)", run: close(() => setMode(mode === "calm" ? "cinematic" : "calm")) },
      { id: "a-mail", group: "Actions", label: "Copy email address", hint: profile.email, run: () => { navigator.clipboard?.writeText(profile.email).then(() => setNote("Email copied"), () => setNote("Copy failed")); } },
      { id: "a-gh", group: "Actions", label: "Open GitHub", run: close(() => window.open(profile.github, "_blank", "noopener")) },
      { id: "a-li", group: "Actions", label: "Open LinkedIn", run: close(() => window.open(profile.linkedin, "_blank", "noopener")) },
    ];
  }, [go, mode, setMode, setOpen]);

  const shown = items.filter((i) => (i.label + " " + i.group).toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(!open); }
      else if (e.key === "Escape" && open) setOpen(false);
    };
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) { opener.current = document.activeElement; setQ(""); setSel(0); setNote(""); setTimeout(() => input.current?.focus(), 20); }
    else (opener.current as HTMLElement | null)?.focus?.();
  }, [open]);

  if (!open) return null;
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); shown[sel]?.run(); }
    else if (e.key === "Tab") { e.preventDefault(); input.current?.focus(); }
  };
  let last = "";
  return (
    <div className="palette-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}>
        <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Jump to a project or section…" aria-label="Search commands"
          role="combobox" aria-expanded="true" aria-controls="pal-list" aria-activedescendant={shown[sel] ? "pal-" + shown[sel].id : undefined} />
        <ul id="pal-list" role="listbox">
          {shown.length === 0 && <li className="pal-empty">No match</li>}
          {shown.map((it, i) => {
            const head = it.group !== last; last = it.group;
            return (
              <li key={it.id} role="presentation">
                {head && <p className="pal-group mono">{it.group}</p>}
                <button id={"pal-" + it.id} role="option" aria-selected={i === sel} className={i === sel ? "on" : ""} onMouseMove={() => setSel(i)} onClick={it.run} tabIndex={-1}>
                  <span>{it.label}</span>{it.hint && <em className="mono">{it.hint}</em>}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="pal-foot mono" role="status">{note || "↑↓ move · Enter select · Esc close"}</p>
      </div>
    </div>
  );
}
