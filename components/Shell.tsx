"use client";
import { useState, type ReactNode } from "react";
import { MotionProvider } from "@/lib/motion-context";
import { SmoothScroll } from "./SmoothScroll";
import { SpeedLines } from "./SpeedLines";
import { Cursor } from "./Cursor";
import { Marquee } from "./Marquee";
import { Nav } from "./Nav";
import { Preloader } from "./Preloader";
import { CommandPalette } from "./CommandPalette";

/* Fixed layers (grain, speed lines, impact, wipe, letterbox, cursor) live outside #stage so shakes and wipes never move them. */
export function Shell({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState(false);
  return (
    <MotionProvider>
      <SmoothScroll />
      <Marquee />
      <Nav onPalette={() => setPalette(true)} />
      <div id="stage">{children}</div>
      <SpeedLines />
      <div className="grain" aria-hidden="true" />
      <div id="letterbox" aria-hidden="true"><i className="bar top" /><i className="bar bottom" /></div>
      <div id="impact" aria-hidden="true"><i className="impact-wash" /><i className="impact-burst" /></div>
      <div id="wipe" aria-hidden="true"><i className="wipe-edge" /></div>
      <Preloader />
      <CommandPalette open={palette} setOpen={setPalette} />
      <Cursor />
    </MotionProvider>
  );
}
