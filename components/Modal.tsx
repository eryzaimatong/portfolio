"use client";
import { useEffect, useRef, type ReactNode } from "react";

/* Native <dialog>: focus trap, Esc and inert background for free. Click on the backdrop closes it. */
export function Modal({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { opener.current = document.activeElement; d.showModal(); document.documentElement.classList.add("modal-open"); }
    if (!open && d.open) { d.close(); }
  }, [open]);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    const on = () => { document.documentElement.classList.remove("modal-open"); (opener.current as HTMLElement | null)?.focus?.(); onClose(); };
    d.addEventListener("close", on);
    return () => d.removeEventListener("close", on);
  }, [onClose]);
  return (
    <dialog ref={ref} className="modal" aria-label={label} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-sheet">
        <button type="button" className="modal-close" onClick={onClose} aria-label={`Close ${label}`}>✕</button>
        {children}
      </div>
    </dialog>
  );
}
