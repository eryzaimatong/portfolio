"use client";
import { useRef, useState } from "react";

/* A red scan line sweeps down once on load and the photo develops behind it, from dark to clear. Hovering runs it again. */
export function PhotoScan({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState(0);
  const last = useRef(0);
  const again = () => {
    const now = Date.now();
    if (now - last.current < 2200) return;   // let a sweep finish before another can start
    last.current = now;
    setRun((r) => r + 1);
  };
  return (
    <div className="ph" onMouseEnter={again}>
      {children}
      <i key={"d" + run} className={"ph-dev" + (run ? " again" : "")} aria-hidden="true" />
      <i key={"s" + run} className={"ph-scan" + (run ? " again" : "")} aria-hidden="true" />
    </div>
  );
}
