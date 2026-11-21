"use client";
import { useEffect } from "react";

/* A short intro, once per visit: the EI mark assembles, a red ring draws round it, speed lines flash, the count runs
   to 100, then a two-panel curtain lifts. About 1.6 s, all CSS (transform and opacity). Click or any key skips it.
   It only shows when an inline script in <head> armed it (JavaScript on, first visit this session, no reduced motion),
   so the page itself is rendered underneath from the first paint. */
const E = ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"], I = ["XXX", ".X.", ".X.", ".X.", ".X.", ".X.", "XXX"];
const cells: { x: number; y: number; red?: boolean }[] = [];
E.forEach((r, y) => [...r].forEach((c, x) => c === "X" && cells.push({ x, y })));
I.forEach((r, y) => [...r].forEach((c, x) => c === "X" && cells.push({ x: x + 6, y })));
cells.push({ x: 10, y: 6, red: true }, { x: 11, y: 6, red: true });

export function Intro() {
  useEffect(() => {
    const d = document.documentElement;
    if (!d.classList.contains("intro")) return;
    const end = () => { d.classList.add("intro-done"); setTimeout(() => d.classList.remove("intro", "intro-done"), 450); };
    const t = setTimeout(end, 1900);
    const skip = () => { clearTimeout(t); end(); };
    addEventListener("pointerdown", skip, { once: true }); addEventListener("keydown", skip, { once: true });
    return () => { clearTimeout(t); removeEventListener("pointerdown", skip); removeEventListener("keydown", skip); };
  }, []);
  return (
    <div className="intro-ov" aria-hidden="true">
      <i className="cur a" /><i className="cur b" />
      <div className="intro-lines">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--r": `${i * 25.7}deg`, "--d": `${(i % 5) * 40}ms` } as React.CSSProperties} />)}</div>
      <div className="intro-core">
        <svg className="intro-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" pathLength="100" /></svg>
        <svg className="intro-mark" viewBox="0 0 48 28">
          {cells.map((c, k) => <rect key={k} x={c.x * 4} y={c.y * 4} width="4" height="4" className={c.red ? "r" : ""} style={{ "--k": `${k * 14}ms` } as React.CSSProperties} />)}
        </svg>
      </div>
      <p className="intro-count mono"><span className="intro-k">loading</span><b /></p>
    </div>
  );
}
