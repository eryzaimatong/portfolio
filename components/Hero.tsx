"use client";
import { useEffect, useRef } from "react";
import { profile } from "@/data/profile";
import { HeroShader } from "./HeroShader";
import { MagneticButton } from "./MagneticButton";
import { gsap, registerGsap, slamText, isReduced } from "@/lib/motion";
import { useMotion } from "@/lib/motion-context";
import { useGo } from "@/lib/useGo";

/* One choreographed moment: the name slams in on kinetic type. Everything else is still, plus cel-layer parallax. */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  const go = useGo();

  useEffect(() => {
    registerGsap();
    const el = root.current!;
    const words = el.querySelectorAll<HTMLElement>("[data-slam]");
    const splits: ReturnType<typeof slamText>[] = [];
    const ready = !document.documentElement.dataset.seen;               // wait out the opening sequence on first visit
    const start = ready && !reduced ? 2.0 : 0.1;
    words.forEach((w, i) => splits.push(slamText(w, { delay: start + i * 0.12, trigger: null })));
    const rest = el.querySelectorAll(".hero-rise");
    if (!reduced) gsap.fromTo(rest, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.08, delay: start + 0.55 });
    else gsap.set(rest, { opacity: 1 });

    // cel-layer parallax: four depths on pointer + scroll
    let off = () => {};
    if (!reduced && matchMedia("(pointer: fine)").matches) {
      const layers = el.querySelectorAll<HTMLElement>("[data-depth]");
      const fns = [...layers].map((l) => ({ x: gsap.quickTo(l, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(l, "y", { duration: 0.9, ease: "power3" }), d: parseFloat(l.dataset.depth!) }));
      const mv = (e: PointerEvent) => { const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5; fns.forEach((f) => { f.x(-nx * 40 * f.d); f.y(-ny * 28 * f.d); }); };
      addEventListener("pointermove", mv); off = () => removeEventListener("pointermove", mv);
    }
    if (!reduced) {
      gsap.to(".hero-kanji", { yPercent: 18, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-content", { yPercent: -8, opacity: 0.35, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true } });
    }
    return () => { off(); splits.forEach((s) => s?.revert?.()); };
  }, [reduced]);

  return (
    <section id="home" className="hero" ref={root} aria-label="Home">
      <div className="hero-bg" aria-hidden="true"><HeroShader /></div>
      <div className="hero-dots" aria-hidden="true" />
      <p className="hero-kanji" data-depth="0.4" aria-hidden="true">紅</p>
      <div className="hero-ring" data-depth="1.4" aria-hidden="true" />
      <div className="hero-content" data-depth="0.8">
        <p className="mono hero-kicker hero-rise">{profile.kicker}</p>
        <h1 className="hero-name" aria-label={profile.name}>
          <span className="mask" aria-hidden="true"><span data-slam className="slam">Eryza Mae</span></span>
          <span className="mask" aria-hidden="true"><span data-slam className="slam outline">Imatong</span></span>
        </h1>
        <p className="hero-intro hero-rise">{profile.intro}</p>
        <div className="hero-actions hero-rise">
          <MagneticButton as="a" href="#projects" className="pill" onClick={(e) => { e.preventDefault(); go("/#projects"); }}>See the work <span aria-hidden="true">↓</span></MagneticButton>
          <a className="ghost" href={`mailto:${profile.email}`}>Email me</a>
          <span className="avail"><i aria-hidden="true" />{profile.availability}</span>
        </div>
        <p className="hero-links hero-rise">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab">linkedin ↗</a>
        </p>
      </div>
      <p className="hero-scroll mono hero-rise" aria-hidden="true">Scroll</p>
    </section>
  );
}
