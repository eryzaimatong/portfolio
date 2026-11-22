"use client";
import { useEffect, useRef, useState } from "react";

/* The photo starts in black and white. When it comes into view (not on page load, when nobody can see it), a red scan
   line sweeps down, full colour develops behind it, and three facts are pinned to the photo as the line passes them.
   Hovering runs the scan again. */
const TAGS = [
  { text: "BSIT · Data Science", at: 0.2, side: "l" },
  { text: "PUP Manila", at: 0.5, side: "r" },
  { text: "Open to internships", at: 0.78, side: "l" },
];

export function PhotoScan({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(0);
  const [go, setGo] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect(); } }, { threshold: 0.45 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);
  const again = () => {
    const now = Date.now();
    if (!go || now - last.current < 2200) return;   // let a sweep finish before another can start
    last.current = now;
    setRun((r) => r + 1);
  };
  const cls = run ? " again" : "";
  return (
    <div ref={box} className={"ph" + (go ? " go" : "")} onMouseEnter={again}>
      {children}
      <img key={"c" + run} className={"ph-color" + cls} aria-hidden="true" alt="" width={960} height={1200} decoding="async" fetchPriority="low"
        src="/assets/hero-c-960.webp" srcSet="/assets/hero-c-640.webp 640w, /assets/hero-c-960.webp 960w, /assets/hero-c-1280.webp 1280w" sizes="(max-width: 900px) 80vw, 340px" />
      <i key={"s" + run} className={"ph-scan" + cls} aria-hidden="true" />
      {TAGS.map((t) => (
        <span key={t.text + run} className={`ph-fact ${t.side}` + cls} style={{ top: `${t.at * 100}%`, "--at": t.at } as React.CSSProperties} aria-hidden="true">{t.text}</span>
      ))}
    </div>
  );
}
