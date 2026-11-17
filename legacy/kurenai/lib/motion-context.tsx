"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Mode = "cinematic" | "calm";
type Ctx = { mode: Mode; reduced: boolean; setMode: (m: Mode) => void };
const MotionCtx = createContext<Ctx>({ mode: "cinematic", reduced: false, setMode: () => {} });

/* Reduced motion = the OS preference OR the visitor's "Calm" choice. Everything that animates reads `reduced`. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("cinematic");
  const [os, setOs] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setOs(mq.matches);
    const on = () => setOs(mq.matches);
    mq.addEventListener("change", on);
    try { const saved = localStorage.getItem("motion-mode"); if (saved === "calm" || saved === "cinematic") setModeState(saved); } catch {}
    return () => mq.removeEventListener("change", on);
  }, []);

  const reduced = os || mode === "calm";
  useEffect(() => { document.documentElement.dataset.motion = reduced ? "calm" : "cinematic"; }, [reduced]);

  const value = useMemo<Ctx>(() => ({
    mode, reduced,
    setMode: (m) => { setModeState(m); try { localStorage.setItem("motion-mode", m); } catch {} },
  }), [mode, reduced]);

  return <MotionCtx.Provider value={value}>{children}</MotionCtx.Provider>;
}
export const useMotion = () => useContext(MotionCtx);
