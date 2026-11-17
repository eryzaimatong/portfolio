"use client";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useRef } from "react";
import { wipe, impactFrame, letterbox } from "./motion";
import { scrollToId, getLenis } from "./velocity";

/* Navigation with the panel-wipe transition. "/#about" style targets scroll on the home page and wipe across routes. */
export function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  path.current = pathname;

  return useCallback(async (href: string, opts: { impact?: boolean; origin?: { x: number; y: number } } = {}) => {
    const [to, hash] = href.split("#");
    const target = to || "/";
    if (target === path.current) { if (hash) scrollToId(hash); else getLenis()?.scrollTo(0); return; }
    if (opts.impact) await impactFrame(opts.origin);
    letterbox(true, 0.35);
    await wipe(async () => {
      router.push(target);
      const t0 = performance.now();
      while (window.location.pathname !== target && performance.now() - t0 < 2000) await new Promise((r) => setTimeout(r, 30));
      await new Promise((r) => setTimeout(r, 80));
      getLenis()?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      if (hash) setTimeout(() => scrollToId(hash), 50);
    });
    letterbox(false, 0.5);
  }, [router]);
}
