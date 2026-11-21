"use client";
import { useRef } from "react";
import { useThreeScene } from "./three/runtime";

/* The skills corridor. Its panels (icons included) are built inside the lazily loaded scene chunk, not sent with the page. The stage is decorative for assistive tech (aria-hidden); the full skills list right after it is
   the accessible version, visually hidden while the corridor runs and shown as-is if WebGL is unavailable. */
export function SkillsScene() {
  const host = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  useThreeScene(host, () => import("./three/skillsCorridor"), {
    name: "skills",
    get props() { return { card: card.current!, touch: matchMedia("(pointer: coarse)").matches }; },
    onFail: () => host.current?.closest(".sk3d")?.classList.add("no-gl"),
  });
  return (
    <div ref={host} className="sk-stage rv" aria-hidden="true">
      <div className="sk-poster"><i className="w l" /><i className="w r" /><i className="w t" /><i className="w b" /></div>
      <div className="sk-vig" />
      <p className="sk-hint mono"><span className="h-fine">move to look around · click a panel to focus</span><span className="h-touch">drag to look · tap a panel</span></p>
      <div ref={card} className="sk-card"><p className="skc-cat mono" /><p className="skc-name" /><p className="skc-used mono" /></div>
    </div>
  );
}
