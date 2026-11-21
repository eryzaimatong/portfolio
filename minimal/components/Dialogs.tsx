"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Native <dialog>: focus trap, Esc and an inert background for free; focus returns to the opener. */
export function Dialog({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { opener.current = document.activeElement; d.showModal(); document.documentElement.classList.add("locked"); }
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    const on = () => { document.documentElement.classList.remove("locked"); (opener.current as HTMLElement | null)?.focus?.(); onClose(); };
    d.addEventListener("close", on);
    return () => d.removeEventListener("close", on);
  }, [onClose]);
  return (
    <dialog ref={ref} className="dlg" aria-label={label} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg-sheet">
        <button type="button" className="dlg-close mono" onClick={onClose} aria-label={`Close ${label}`}>close ✕</button>
        {children}
      </div>
    </dialog>
  );
}

export function CertButton({ src, alt, title }: { src: string; alt: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="link mono" onClick={() => setOpen(true)} aria-haspopup="dialog">View certificate →</button>
      <Dialog open={open} onClose={() => setOpen(false)} label={title}>
        <h3 className="dlg-title pixel">{title}</h3>
        <img className="dlg-img" src={src} alt={alt} loading="lazy" decoding="async" />
      </Dialog>
    </>
  );
}

export type Tile = { tag: string; title: string; text: string; chips?: string[]; link?: { label: string; href: string } };
export function OrgButton({ org, role, tiles }: { org: string; role: string; tiles: Tile[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="link mono" onClick={() => setOpen(true)} aria-haspopup="dialog">View deliverables →</button>
      <Dialog open={open} onClose={() => setOpen(false)} label={`${org} deliverables`}>
        <p className="mono label-red">{org}</p>
        <h3 className="dlg-title pixel">{role}</h3>
        <p className="mono dim">Deliverables</p>
        <div className="tiles">
          {tiles.map((t) => (
            <article key={t.title} className="tile">
              <p className="mono label-red">{t.tag}</p><h4>{t.title}</h4><p className="dim">{t.text}</p>
              {t.chips && <ul className="chips">{t.chips.map((c) => <li key={c}>{c}</li>)}</ul>}
              {t.link && <a className="link mono" href={t.link.href} target="_blank" rel="noopener">{t.link.label} →</a>}
            </article>
          ))}
        </div>
      </Dialog>
    </>
  );
}
