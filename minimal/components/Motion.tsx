"use client";
import { useEffect } from "react";

/* One small observer: anything marked .rv fades up once as it enters; reduced motion shows everything at once. */
export function Motion() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>(".rv")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    // pause decorative loops (hologram, blink, pulse) in sections that are off screen
    const secs = [...document.querySelectorAll<HTMLElement>(".hero, .section")];
    const pv = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle("off", !e.isIntersecting); }, { rootMargin: "80px 0px" });
    secs.forEach((e) => pv.observe(e));
    return () => { io.disconnect(); pv.disconnect(); };
  }, []);
  return null;
}
