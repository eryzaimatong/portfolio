"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ROLE_IDS, type RoleKey } from "@/data/roles";

/* The role is mirrored on <html data-role> (set by an inline script before first paint), so every CSS rule that
   depends on it is already right on the first frame. React state exists only for the parts that need logic. */
type Ctx = { role: RoleKey; setRole: (r: RoleKey) => void };
const RoleCtx = createContext<Ctx>({ role: "all", setRole: () => {} });
export const useRole = () => useContext(RoleCtx);

const fromUrl = (): RoleKey => {
  const r = new URLSearchParams(location.search).get("role");
  return (ROLE_IDS as string[]).includes(r ?? "") ? (r as RoleKey) : "all";
};

type VT = { startViewTransition?: (cb: () => void) => unknown };

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setR] = useState<RoleKey>("all");

  useEffect(() => {
    setR(fromUrl());
    const pop = () => { const r = fromUrl(); document.documentElement.dataset.role = r; setR(r); };
    addEventListener("popstate", pop);
    return () => removeEventListener("popstate", pop);
  }, []);

  const setRole = useCallback((next: RoleKey) => {
    if (next === role) return;
    const commit = () => {
      document.documentElement.dataset.role = next;
      flushSync(() => setR(next));
      const u = new URL(location.href);
      if (next === "all") u.searchParams.delete("role"); else u.searchParams.set("role", next);
      history.replaceState(null, "", u);
    };
    const vt = (document as unknown as VT).startViewTransition;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (vt && !reduce) vt.call(document, commit); else commit();   // View Transitions where supported, an instant swap otherwise
  }, [role]);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}
