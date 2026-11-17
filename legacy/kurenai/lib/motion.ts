"use client";
/* Motion primitives: the "anime language" every section shares.
   snap easing, kinetic type, velocity smear, impact frame, panel wipe, letterbox, hold frames. */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { CustomEase } from "gsap/CustomEase";

let ready = false;
export function registerGsap() {
  if (ready || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, CustomEase);
  // fast in, small pull-back first
  CustomEase.create("anticipate", "M0,0 C0.08,-0.14 0.16,-0.14 0.26,-0.02 0.42,0.3 0.6,1.08 0.78,1.05 0.88,1.03 0.94,1 1,1");
  // fast move, tiny overshoot, settle
  CustomEase.create("followThrough", "M0,0 C0.12,0 0.2,0.5 0.42,0.92 0.55,1.1 0.7,1.05 0.82,1.01 0.9,0.995 0.95,1 1,1");
  ready = true;
  return gsap;
}

export const SNAP_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
export const D = { fast: 0.35, base: 0.55, slow: 0.7, hold: 0.2 } as const;

export const isReduced = () =>
  typeof document !== "undefined" && document.documentElement.dataset.motion === "calm";

/* ---------- kinetic typography: masked slam-in with a one-frame chromatic split ---------- */
export function slamText(el: Element, opts: { delay?: number; trigger?: Element | null; chars?: boolean } = {}) {
  registerGsap();
  if (isReduced()) { gsap.set(el, { opacity: 1 }); return null; }
  const split = SplitText.create(el, { type: opts.chars === false ? "words" : "chars,words", mask: opts.chars === false ? "words" : "chars", autoSplit: true,
    onSplit(self) {
      const targets = opts.chars === false ? self.words : self.chars;
      gsap.set(el, { opacity: 1 });
      return gsap.from(targets, {
        yPercent: 115, rotate: 4, duration: D.base, ease: "followThrough", stagger: 0.02, delay: opts.delay ?? 0,
        scrollTrigger: opts.trigger === null ? undefined : { trigger: opts.trigger ?? el, start: "top 85%", once: true },
        onStart: () => aberrate(el),
      });
    },
  });
  return split;
}

/* one frame of red/cyan split, then settle */
export function aberrate(el: Element) {
  if (isReduced() || el.querySelector(".outline") || (el as HTMLElement).classList.contains("outline")) return;   // text-shadow would fill outlined type
  const h = el as HTMLElement;
  h.style.textShadow = "2px 0 rgba(224,30,55,.6), -2px 0 rgba(60,220,255,.3)";
  gsap.to(h, { duration: 0.18, delay: 0.1, onComplete: () => { h.style.textShadow = ""; } });
}

/* ---------- impact frame: soft red wash, tiny decaying shake, radial burst. Rate-limited for photosensitivity. ---------- */
let lastImpact = 0;
export function impactFrame(origin?: { x: number; y: number }): Promise<void> {
  registerGsap();
  const el = document.getElementById("impact");
  const now = performance.now();
  if (!el || isReduced() || now - lastImpact < 400) return Promise.resolve();   // max ~2.5 per second
  lastImpact = now;
  const burst = el.querySelector<HTMLElement>(".impact-burst")!;
  const wash = el.querySelector<HTMLElement>(".impact-wash")!;
  if (origin) burst.style.transformOrigin = `${origin.x}px ${origin.y}px`;
  burst.style.left = origin ? `${origin.x}px` : "50%";
  burst.style.top = origin ? `${origin.y}px` : "50%";
  const page = document.getElementById("stage");
  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: () => { gsap.set(el, { display: "none" }); if (page) gsap.set(page, { x: 0, y: 0 }); resolve(); } });
    tl.set(el, { display: "block" })
      .fromTo(wash, { opacity: 0 }, { opacity: 0.5, duration: 0.04 })           // soft red wash, never a white strobe
      .fromTo(burst, { scale: 0.1, opacity: 0.9 }, { scale: 3.2, opacity: 0, duration: 0.3, ease: "power3.out" }, 0)
      .to(wash, { opacity: 0, duration: 0.14 }, 0.05);
    if (page) tl.fromTo(page, { x: 3, y: -2 }, { x: 0, y: 0, duration: 0.2, ease: "elastic.out(1,0.2)" }, 0);
  });
}

/* ---------- letterbox bars ---------- */
export function letterbox(show: boolean, dur = 0.5) {
  registerGsap();
  const bars = gsap.utils.toArray<HTMLElement>("#letterbox .bar");
  if (!bars.length) return gsap.timeline();
  if (isReduced()) { gsap.set(bars, { scaleY: show ? 1 : 0 }); return gsap.timeline(); }
  return gsap.timeline().to(bars, { scaleY: show ? 1 : 0, duration: dur, ease: "power4.out" });
}

/* ---------- manga-panel wipe: a diagonal clip-path with a hard red edge that travels across ---------- */
const SLANT = 30; // vh of horizontal offset between top and bottom of the diagonal
function wipeClip(p: number, leaving: boolean) {
  const x = `calc(${p} * (100% + ${SLANT}vh))`;
  return leaving
    ? `polygon(${x} 0, 100% 0, 100% 100%, calc(${x} - ${SLANT}vh) 100%)`
    : `polygon(0 0, ${x} 0, calc(${x} - ${SLANT}vh) 100%, 0 100%)`;
}
export function wipe(onCovered?: () => void | Promise<void>) {
  registerGsap();
  const el = document.getElementById("wipe") as HTMLElement | null;
  const edge = el?.querySelector<HTMLElement>(".wipe-edge");
  if (!el || !edge || isReduced()) {
    return Promise.resolve(onCovered?.()).then(() => undefined);
  }
  const s = { p: 0 };
  const draw = (leaving: boolean) => {
    el.style.clipPath = wipeClip(s.p, leaving);
    edge.style.left = `calc(${s.p} * (100% + ${SLANT}vh))`;
  };
  return new Promise<void>((resolve) => {
    gsap.set(el, { display: "block" });
    gsap.set(edge, { opacity: 1 });
    const tl = gsap.timeline({ onComplete: () => { gsap.set(el, { display: "none" }); resolve(); } });
    tl.to(s, { p: 1, duration: 0.5, ease: "power3.in", onUpdate: () => draw(false) })
      .add(async () => { tl.pause(); await onCovered?.(); tl.resume(); })
      .add(() => { s.p = 0; })
      .to(s, { p: 1, duration: 0.55, ease: "power3.out", delay: D.hold / 2, onUpdate: () => draw(true) });
  });
}

/* ---------- velocity smear: skew and stretch along the motion, then settle elastically ---------- */
export function smear(el: Element, velocity: number, axis: "x" | "y" = "x", max = 14) {
  if (isReduced()) return;
  const v = gsap.utils.clamp(-max, max, velocity);
  gsap.to(el, {
    [axis === "x" ? "skewX" : "skewY"]: -v * 0.6,
    [axis === "x" ? "scaleX" : "scaleY"]: 1 + Math.abs(v) * 0.004,
    duration: 0.12, overwrite: "auto", ease: "power2.out",
  });
}
export function settle(el: Element) {
  gsap.to(el, { skewX: 0, skewY: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1,0.4)", overwrite: "auto" });
}

/* ---------- hold frame: deliberate stillness after a big move ---------- */
export const hold = (s: number = D.hold) => new Promise<void>((r) => setTimeout(r, s * 1000));

export { gsap, ScrollTrigger, SplitText, Flip, Draggable, InertiaPlugin, CustomEase };
