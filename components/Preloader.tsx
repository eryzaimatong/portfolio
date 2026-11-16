"use client";
import { useEffect, useRef } from "react";
import { gsap, registerGsap, letterbox } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";
import { profile } from "@/data/profile";

/* Opening sequence: hairline draws, letterbox opens, name slams in, counter, panel wipe to the hero.
   About 2.2s, skippable, once per session. */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  const done = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();
    let seen = false;
    try { seen = !!sessionStorage.getItem("kn-seen"); } catch {}
    const finish = () => {
      if (done.current) return; done.current = true;
      try { sessionStorage.setItem("kn-seen", "1"); } catch {}
      document.documentElement.dataset.seen = "1";
      letterbox(false, 0.4);
    };
    if (seen || reduced) { finish(); return; }

    const name = el.querySelector(".pre-name")!;
    const count = el.querySelector<HTMLElement>(".pre-count")!;
    const line = el.querySelector(".pre-line")!;
    const n = { v: 0 };
    letterbox(true, 0.4);
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power4.out" })
      .fromTo(name.querySelectorAll(".ch"), { yPercent: 120 }, { yPercent: 0, duration: 0.45, ease: "followThrough", stagger: 0.025 }, 0.2)
      .to(n, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(3, "0"); } }, 0.2)
      .to(name, { duration: 0.2 })                                        // hold frame
      .fromTo(el, { clipPath: "polygon(0% 0%,100% 0%,100% 100%,0% 100%)" }, { clipPath: "polygon(100% 0%,100% 0%,100% 100%,100% 100%)", duration: 0.5, ease: "power3.in" })
      .set(el, { display: "none" });
    (el as any)._tl = tl;
    return () => { tl.kill(); };
  }, [reduced]);

  const skip = () => {
    const el = root.current as any;
    el?._tl?.progress(1);
    done.current = false; // allow finish to run if the timeline already completed
    try { sessionStorage.setItem("kn-seen", "1"); } catch {}
    document.documentElement.dataset.seen = "1";
    letterbox(false, 0.2);
  };

  return (
    <div className="preloader" ref={root} role="status" aria-label="Loading">
      <div className="pre-line" aria-hidden="true" />
      <p className="pre-name" aria-hidden="true">
        {profile.name.toUpperCase().split("").map((c, i) => (<span key={i} className="mask">{c === " " ? <span className="ch">&nbsp;</span> : <span className="ch">{c}</span>}</span>))}
      </p>
      <p className="pre-meta mono"><span>NOW LOADING</span><span className="pre-count">000</span></p>
      <button type="button" className="pre-skip" onClick={skip}>Skip</button>
    </div>
  );
}
