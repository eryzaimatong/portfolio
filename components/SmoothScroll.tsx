"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/motion";
import { setLenis, pushVelocity } from "@/lib/velocity";
import { useMotion } from "@/lib/motion-context";

/* Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger stays in sync. Off in Calm mode (native scrolling). */
export function SmoothScroll() {
  const { reduced } = useMotion();
  useEffect(() => {
    registerGsap();
    if (reduced) { setLenis(null); return; }
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    setLenis(lenis);
    lenis.on("scroll", (l: Lenis) => { ScrollTrigger.update(); pushVelocity(l.velocity); });
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); setLenis(null); };
  }, [reduced]);
  return null;
}
