"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/* The radar is its own chunk. It loads when the exhibit is about to scroll into view, into a slot whose size is already reserved. */
const TasteDNA = dynamic(() => import("./TasteDNA"), { ssr: false });

export function TasteLoader() {
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setReady(true); io.disconnect(); } }, { rootMargin: "600px 0px" });
    if (slot.current) io.observe(slot.current);
    return () => io.disconnect();
  }, []);
  return <div ref={slot} className="taste-slot rv">{ready ? <TasteDNA /> : null}</div>;
}
