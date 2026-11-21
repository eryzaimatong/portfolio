"use client";
import { useRef } from "react";
import { useThreeScene } from "./three/runtime";

/* The crystal layer behind the portrait. Decorative: if WebGL is missing it simply never appears. */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLElement | null>(null);
  useThreeScene(host, () => import("./three/heroCrystal"), {
    name: "hero",
    near: "0px",
    defer: true,
    get props() { photo.current = host.current?.parentElement?.querySelector(".ph") as HTMLElement; return { photo: photo.current! }; },
  });
  return <div ref={host} className="hero-3d" aria-hidden="true" />;
}
