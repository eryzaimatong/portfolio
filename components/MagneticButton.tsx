"use client";
import { useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import { gsap } from "@/lib/motion";

type Props<T extends ElementType> = { as?: T; strength?: number } & Omit<ComponentPropsWithoutRef<T>, "as">;

/* Pulls toward the cursor inside an 80px field, springs back on leave. Mouse only. */
export function MagneticButton<T extends ElementType = "a">({ as, strength = 0.35, children, ...rest }: Props<T>) {
  const Tag = (as || "a") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current; if (!el || e.pointerType !== "mouse" || document.documentElement.dataset.motion === "calm") return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3, ease: "power3.out" });
  };
  const reset = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" });
  // the wrapper is larger than the button, so the pull starts ~80px out
  return (
    <span className="magnet" onPointerMove={onMove} onPointerLeave={reset}>
      <Tag ref={ref} {...(rest as object)}>{children}</Tag>
    </span>
  );
}
