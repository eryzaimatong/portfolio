"use client";
import { useSyncExternalStore } from "react";
import type { RoomName } from "./rooms";

/* Tiny shared store (no extra dependency). `frame` values are read directly by the render loop through `S`; React reads through useStore. */
export type Tier = "high" | "balanced" | "lite" | "pending";
type State = {
  tier: Tier;
  room: RoomName;
  t: number;               // scroll fraction through the museum, 0..1
  selected: number;        // project index under the spotlight
  inspect: number | null;  // project index being inspected
  lights: number;          // 0..1, eased up by the entrance
  entered: boolean;
};
export const S: State = { tier: "pending", room: "Home", t: 0, selected: 0, inspect: null, lights: 0, entered: false };

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
