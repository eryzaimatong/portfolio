"use client";
import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { getGPUTier } from "detect-gpu";
import { useStore, set, S, type Tier } from "@/lib/store";
import { TOTAL_VH } from "@/lib/rooms";
import { TopBar, ProgressLine, HomeOverlay } from "@/components/ui/Chrome";
import { ProjectBar, InspectPanel } from "@/components/ui/ProjectUI";
import { FocusBar, DetailPanel, ContactOverlay } from "@/components/ui/RoomUI";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

function webgl() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/* Chooses a tier (High, Balanced, Lite) from the device, `?tier=` for testing, and the footer choice. The 3D bundle loads after first paint. */
export function Museum({ lite }: { lite: ReactNode }) {
  const tier = useStore((s) => s.tier);
  const ready = useStore((s) => s.ready);
  useEffect(() => {
    let alive = true;
    (async () => {
      const q = new URLSearchParams(location.search).get("tier") as Tier | null;
      let pref: string | null = null;
      try { pref = localStorage.getItem("tier-pref"); } catch {}
      let t: Tier;
      if (q && ["high", "balanced", "lite"].includes(q)) t = q;
      else if (matchMedia("(prefers-reduced-motion: reduce)").matches || !webgl()) t = "lite";
      else if (pref && ["high", "balanced", "lite"].includes(pref)) t = pref as Tier;
      else {
        try {
          const g = await getGPUTier();
          t = g.tier >= 3 ? "high" : g.tier === 2 ? "balanced" : g.isMobile && g.tier >= 1 ? "balanced" : g.tier >= 1 ? "balanced" : "lite";
        } catch { t = "balanced"; }
      }
      if (alive) set({ tier: t });
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    try { const y = sessionStorage.getItem("ca-scroll"); if (y && tier !== "lite" && tier !== "pending") requestAnimationFrame(() => window.scrollTo(0, +y)); } catch {}
    const save = () => { try { sessionStorage.setItem("ca-scroll", String(Math.round(window.scrollY))); } catch {} };
    addEventListener("scroll", save, { passive: true });
    return () => removeEventListener("scroll", save);
  }, [tier]);

  const is3d = tier === "high" || tier === "balanced";
  const choose = (t: Tier) => { try { localStorage.setItem("tier-pref", t); } catch {} location.href = `${location.pathname}?tier=${t}`; };
  return (
    <>
      {is3d && <Scene />}
      {is3d && !ready && <div className="veil" role="status"><p className="mono">Preparing the museum</p><i aria-hidden="true" /></div>}
      {is3d && (
        <>
          <TopBar />
          <ProgressLine />
          <HomeOverlay />
          <ProjectBar />
          <FocusBar />
          <ContactOverlay />
          <InspectPanel />
          <DetailPanel />
          {/* the museum is one long native scroll: this spacer sets its length */}
          <div className="spacer" style={{ height: `${TOTAL_VH + 100}vh` }} aria-hidden="true" />
        </>
      )}
      <div className={is3d ? "lite sr-only-wrap" : "lite-on"}>{lite}</div>
      <footer className="tierbar mono">
        <span>View</span>
        {(["high", "balanced", "lite"] as const).map((t) => (<button key={t} type="button" aria-pressed={tier === t} onClick={() => choose(t)}>{t === "lite" ? "Lite (no 3D)" : t === "high" ? "3D high" : "3D balanced"}</button>))}
      </footer>
    </>
  );
}
