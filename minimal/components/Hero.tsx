"use client";
import { useEffect, useRef } from "react";
import { profile, about } from "@/data/profile";

/* The portrait is turned into a blood-red halftone: dots grow with darkness, and appear from the centre outward. */
function Halftone() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const SIZE = 360, CELL = 6, N = SIZE / CELL;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = c.height = SIZE * dpr; ctx.scale(dpr, dpr);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const img = new Image(); img.src = about.photo.src;
    let raf = 0, dead = false;
    img.onload = () => {
      const o = document.createElement("canvas"); o.width = o.height = N; const octx = o.getContext("2d")!;
      octx.drawImage(img, 0, 0, N, N);
      const d = octx.getImageData(0, 0, N, N).data;
      const t0 = performance.now();
      const draw = (p: number) => {
        ctx.clearRect(0, 0, SIZE, SIZE);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const i = (y * N + x) * 4;
          const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
          const dark = Math.pow(1 - lum, 1.25);                          // the light backdrop drops away, the subject stays
          const dist = Math.hypot(x - N / 2, y - N / 2) / (N * 0.72);
          const reveal = Math.min(1, Math.max(0, p * 1.5 - dist));
          const r = dark * (CELL * 0.62) * reveal;
          if (r < 0.35) continue;
          ctx.fillStyle = dark > 0.55 ? "#E0112B" : "#B3001B";
          ctx.beginPath(); ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, r, 0, Math.PI * 2); ctx.fill();
        }
      };
      if (reduce) { draw(1); return; }
      const tick = (t: number) => { if (dead) return; const p = Math.min(1, (t - t0) / 1700); draw(1 - Math.pow(1 - p, 3)); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      setTimeout(() => { if (!dead) draw(1); }, 2600);          // a backgrounded tab never ticks: make sure the portrait still lands
    };
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} className="halftone" width={360} height={360} role="img" aria-label={about.photo.alt} />;
}

export function Hero() {
  return (
    <section id="home" className="hero" aria-label="Home">
      <div className="hero-copy">
        <h1 className="hero-name pixel">{profile.name}<i className="caret" aria-hidden="true" /></h1>
        <p className="mono hero-kicker">{profile.kicker}</p>
        <p className="hero-intro">
          <span className="chip">BSIT student</span> at <span className="chip">PUP Manila</span>, specializing in <span className="chip">Data Science</span>.
          {" "}Looking for <span className="chip">data science, analytics and technical internships</span>. Based in <em className="serif">Manila, Philippines.</em>
        </p>
        <p className="hero-links mono">
          <a href={profile.github} target="_blank" rel="noopener" aria-label="github, opens in a new tab">github ↗</a>
          <a href={profile.linkedin} target="_blank" rel="noopener" aria-label="linkedin, opens in a new tab">linkedin ↗</a>
          <a href={`mailto:${profile.email}`} aria-label="email, opens your mail app">email ↗</a>
        </p>
      </div>
      <figure className="hero-portrait">
        <div className="frame"><Halftone /><i className="scan" aria-hidden="true" /></div>
        <figcaption className="mono">{profile.name}</figcaption>
      </figure>
    </section>
  );
}
