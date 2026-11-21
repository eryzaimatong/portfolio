"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/* The thread is a separate chunk, loaded when the browser is idle, so it never competes with first paint. */
const RedThread = dynamic(() => import("./RedThread"), { ssr: false });

export function ThreadLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) { const id = w.requestIdleCallback(() => setReady(true), { timeout: 2000 }); return () => (window as unknown as { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(id); }
    const id = setTimeout(() => setReady(true), 800); return () => clearTimeout(id);
  }, []);
  return ready ? <RedThread /> : null;
}
