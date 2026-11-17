"use client";
import { useSyncExternalStore } from "react";
import type { RoomName } from "./rooms";

/* Tiny shared store (no extra dependency). The render loop reads `S` directly; React reads through useStore. */
export type Tier = "high" | "balanced" | "lite" | "pending";
/* A detail panel is open for: a school/scholarship/cert item (experience), an organization (leadership) or a certificate. */
export type Panel = { kind: "exp" | "org" | "cert"; index: number } | null;
type State = {
  tier: Tier;
  room: RoomName;
  t: number;               // scroll fraction through the museum, 0..1
  selected: number;        // project index under the spotlight
  expSel: number;          // alcove the camera is turned toward
  leadSel: number;         // cube the camera is turned toward
  inspect: number | null;  // project index being inspected
  panel: Panel;
  lights: number;          // 0..1, eased up by the entrance
  entered: boolean;
  ready: boolean;          // shaders for every room are compiled; the first frame can be shown
};
export const S: State = { tier: "pending", room: "Home", t: 0, selected: 0, expSel: 0, leadSel: 0, inspect: null, panel: null, lights: 0, entered: false, ready: false };

const subs = new Set<() => void>();
let snap = { ...S };
export function set(p: Partial<State>) {
  let changed = false;
  for (const k of Object.keys(p) as (keyof State)[]) { if (S[k] !== p[k]) { (S as any)[k] = p[k]; changed = true; } }
  if (changed) { snap = { ...S }; subs.forEach((f) => f()); }
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => sel(snap),
    () => sel(snap),
  );
}
