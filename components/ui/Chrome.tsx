"use client";
import { useEffect, useState } from "react";
import { ROOM_NAMES, BUILT, roomStartVh, TOTAL_VH, type RoomName } from "@/lib/rooms";
import { useStore, set, S } from "@/lib/store";
import { profile } from "@/data/profile";

const LEFT: RoomName[] = ["Home", "About", "Projects"];
const RIGHT: RoomName[] = ["Skills", "Experience", "Leadership"];

/* Native, quick scroll to a room (about 0.6 s). Rooms not yet built in 3D open the Lite layout at that section. */
export function goRoom(room: RoomName) {
  const built = BUILT.includes(room);
  if (!built) { window.location.href = `/?tier=lite#${room.toLowerCase()}`; return; }
  const vh = roomStartVh(room) ?? 0;
  const top = (vh / 100) * window.innerHeight;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { window.scrollTo(0, top); return; }
  const from = window.scrollY, dist = top - from, t0 = performance.now(), dur = 600;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    window.scrollTo(0, from + dist * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function TopBar() {
  const room = useStore((s) => s.room);
  const [open, setOpen] = useState(false);
  const idx = ROOM_NAMES.indexOf(room) + 1;
  useEffect(() => { document.documentElement.classList.toggle("menu-open", open); }, [open]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  useEffect(() => { if (history.replaceState) history.replaceState(null, "", `#${room.toLowerCase()}`); }, [room]);

  const link = (r: RoomName) => (
    <button key={r} type="button" className={"tb-link" + (r === room ? " on" : "") + (BUILT.includes(r) ? "" : " lite")} aria-current={r === room ? "location" : undefined}
      onClick={() => { setOpen(false); goRoom(r); }}>{r}</button>
  );
  return (
    <>
      <header className="topbar">
        <nav className="tb-side" aria-label="Primary">{LEFT.map(link)}</nav>
        <a className="tb-mark" href="#home" onClick={(e) => { e.preventDefault(); goRoom("Home"); }}>{profile.name}</a>
        <div className="tb-side right">
          <nav aria-label="More sections">{RIGHT.map(link)}</nav>
          <button type="button" className="tb-pill" onClick={() => goRoom("Contact")}>Contact</button>
        </div>
        <button type="button" className="tb-burger" aria-expanded={open} aria-controls="directory" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Menu"}</button>
      </header>
      <p className="tb-where mono" aria-live="polite"><b>{String(idx).padStart(2, "0")}</b> / {String(ROOM_NAMES.length).padStart(2, "0")} · {room}</p>
      <div className="directory" id="directory" hidden={!open}>
        <ol>{ROOM_NAMES.map((r, i) => (<li key={r}><button type="button" onClick={() => { setOpen(false); goRoom(r); }}><small>{String(i + 1).padStart(2, "0")}</small>{r}</button></li>))}</ol>
      </div>
    </>
  );
}

export function ProgressLine() {
  const t = useStore((s) => s.t);
  return <i className="progress" style={{ transform: `scaleY(${t})` }} aria-hidden="true" />;
}

/* Home: name and identity, large, on the back wall of the hall. Fades and grows as you walk toward it. */
export function HomeOverlay() {
  const t = useStore((s) => s.t);
  const entered = useStore((s) => s.entered);
  const k = Math.min(1, (t * TOTAL_VH) / 70);       // fades over the first 70 screen-heights-percent of walking
  const enter = () => { try { sessionStorage.setItem("ca-entered", "1"); } catch {} set({ entered: true }); };
  const skip = () => { try { sessionStorage.setItem("ca-entered", "1"); } catch {} S.lights = 1; set({ entered: true }); };
  useEffect(() => {
    try { if (sessionStorage.getItem("ca-entered")) { S.lights = 1; set({ entered: true }); return; } } catch {}
    const first = () => { if (window.scrollY > 4) enter(); };
    addEventListener("scroll", first, { passive: true });
    return () => removeEventListener("scroll", first);
  }, []);
  return (
    <section className="home-overlay" aria-label="Home" style={{ opacity: 1 - k, transform: `translate(-50%, -50%) scale(${1 + k * 0.35})`, pointerEvents: k > 0.6 ? "none" : "auto" }}>
      <p className="mono kicker">{profile.kicker}</p>
      <h1 className="name">{profile.name}</h1>
      <p className="intro">{profile.intro}</p>
      <div className="home-actions">
        {!entered && <button type="button" className="btn solid" onClick={enter}>Enter</button>}
        {!entered && <button type="button" className="btn" onClick={skip}>Skip</button>}
        <a className="btn" href={`mailto:${profile.email}`}>Email</a>
      </div>
      <p className="mono cue" aria-hidden="true">Scroll to walk</p>
    </section>
  );
}

export const SCROLL_VH = TOTAL_VH;
