"use client";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";

/* Dot + ring. On interactive elements the ring becomes a diagonal slash; a click leaves a brief burst. Mouse only. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    if (reduced || !matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!, r = ring.current!;
    document.documentElement.classList.add("has-cursor");
    const dx = gsap.quickTo(d, "x", { duration: 0.05 }), dy = gsap.quickTo(d, "y", { duration: 0.05 });
    const rx = gsap.quickTo(r, "x", { duration: 0.25, ease: "power3" }), ry = gsap.quickTo(r, "y", { duration: 0.25, ease: "power3" });
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      gsap.set([d, r], { opacity: 1 });
      const hot = (e.target as Element)?.closest?.("a,button,[role=button],input,[data-hot]");
      r.classList.toggle("slash", !!hot);
    };
    const down = (e: PointerEvent) => { if (e.pointerType === "mouse") gsap.fromTo(r, { scale: 1.6 }, { scale: 1, duration: 0.35, ease: "power3.out" }); };
    addEventListener("pointermove", move); addEventListener("pointerdown", down);
    return () => { document.documentElement.classList.remove("has-cursor"); removeEventListener("pointermove", move); removeEventListener("pointerdown", down); };
  }, [reduced]);
  return (<><div ref={ring} className="cursor-ring" aria-hidden="true" /><div ref={dot} className="cursor-dot" aria-hidden="true" /></>);
}
