"use client";
import { useEffect, useRef } from "react";
import { gsap, registerGsap, isReduced } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";

/* A giant outlined section word behind the heading. It drifts sideways as you scroll and leans with scroll speed. Decorative only. */
export function SectionStrip({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  useEffect(() => {
    registerGsap();
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el || reduced || isReduced()) return;
    const host = ref.current!.parentElement!;
    const skew = gsap.quickTo(el, "skewX", { duration: 0.4, ease: "power3" });
    const tw = gsap.fromTo(el, { xPercent: 4 }, { xPercent: -38, ease: "none",
      scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: 0.6, onUpdate: (self) => skew(gsap.utils.clamp(-12, 12, -self.getVelocity() / 260)) } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, [reduced]);
  return <div ref={ref} className="strip" aria-hidden="true"><span>{word} · {word} · {word}</span></div>;
}
