"use client";
import { useRef, useState } from "react";

/* The photo starts in black and white. A red scan line sweeps down once on load and full colour develops behind it. Hovering runs the scan again. */
export function PhotoScan({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(0);
  const last = useRef(0);
  const again = () => {
    const now = Date.now();
    if (now - last.current < 2200) return;   // let a sweep finish before another can start
    last.current = now;
    setRun((r) => r + 1);
  };
  const cls = run ? " again" : "";
  return (
    <div className="ph" onMouseEnter={again}>
      {children}
      <div key={"r" + run} className={"ph-rev" + cls} aria-hidden="true">
        <img className="ph-color" alt="" width={960} height={1200} decoding="async" fetchPriority="low"
          src="/assets/hero-c-960.webp" srcSet="/assets/hero-c-640.webp 640w, /assets/hero-c-960.webp 960w, /assets/hero-c-1280.webp 1280w" sizes="(max-width: 900px) 80vw, 340px" />
      </div>
      <i key={"s" + run} className={"ph-scan" + cls} aria-hidden="true" />
    </div>
  );
}
