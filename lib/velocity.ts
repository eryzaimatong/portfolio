"use client";
/* One shared "how fast is the page moving" signal, fed by Lenis scroll and by carousel drags.
   Speed lines read it; the Project Wall adds to it. It decays on its own. */
let v = 0;
let target = 0;
export const pushVelocity = (n: number) => { target = Math.max(target, Math.min(Math.abs(n), 60)); };
export const readVelocity = () => v;
export function tickVelocity() { target *= 0.9; v += (target - v) * 0.25; if (v < 0.01) v = 0; return v; }

let lenis: import("lenis").default | null = null;
export const setLenis = (l: import("lenis").default | null) => { lenis = l; };
export const getLenis = () => lenis;
export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.1 });
  else el.scrollIntoView({ behavior: "auto", block: "start" });
}
