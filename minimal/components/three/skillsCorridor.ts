import type * as T from "three";
import { disposeScene, yieldToMain, type SceneCtx, type SceneHandle } from "./runtime";
import { clamp, damp, HOVER, SETTLE, SLOW } from "./motion";
import { corridorPanels } from "@/data/corridor";

/* Skills corridor. Panels on four walls drift toward you; the camera looks around with the pointer (drag on touch).
   Walls by meaning: data on the left, backend on the right, frontend on the ceiling, tools on the floor.
   Hover: the panel pulls toward you, the logo takes its brand colour, the others dim, a card says where it was used.
   Click / tap: the camera eases to the panel and the drift pauses; click again or Esc to resume.
   Atmosphere: depth fog, a slow light sweep, a faint dust layer. The middle stays clear. */

export type Wall = "left" | "right" | "ceiling" | "floor";
export type Panel = { name: string; group: string; wall: Wall; usedIn: string | null; brand: { path: string; hex: string } | null; glyph: string | null };
export type CorridorProps = { card: HTMLElement; touch: boolean };

const PAPER = "#F1ECEC", RED = "#E0112B";
const W = 3.7, H = 2.35, SPAN = 34, NEAR = 2.5, PW = 2.7, PH = 1.68, TILT = 0.4;

function luminance(hex: string) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
const cssVar = (v: string, fb: string) => (getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb);

export async function createScene({ THREE, renderer, host, reduce, low, invalidate }: SceneCtx, { card, touch }: CorridorProps): Promise<SceneHandle> {
  const panels = corridorPanels();
  const sans = cssVar("--font-geist-sans", "system-ui, sans-serif"), mono = cssVar("--font-geist-mono", "ui-monospace, monospace");
  try { await Promise.all([document.fonts.load(`600 40px ${sans}`), document.fonts.load(`500 18px ${mono}`)]); } catch {}

  const BG = 0x0a0506;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 7, SPAN * 0.62);
  const cam = new THREE.PerspectiveCamera(62, 1, 0.1, 80);
  cam.position.set(0, 0, 3);
  const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

  /* ---- textures: the panel (name, category) and the logo (white, tinted per frame) ---- */
  const TW = low ? 384 : 512, TH = Math.round((TW * PH) / PW), S = TW / 512;
  const panelTex = (p: Panel) => {
    const c = document.createElement("canvas"); c.width = TW; c.height = TH; const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, TW, TH); gr.addColorStop(0, "#26131a"); gr.addColorStop(1, "#110809");
    g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
    g.strokeStyle = "rgba(241,236,236,0.06)"; g.lineWidth = 1;
    for (let y = 40 * S; y < TH; y += 40 * S) { g.beginPath(); g.moveTo(0, y); g.lineTo(TW, y); g.stroke(); }
    g.strokeStyle = "rgba(224,17,43,0.7)"; g.lineWidth = 3 * S; g.strokeRect(6 * S, 6 * S, TW - 12 * S, TH - 12 * S);
    // name (second), auto-fitted
    let fs = 44 * S; g.font = `600 ${fs}px ${sans}`;
    while (g.measureText(p.name).width > TW - 64 * S && fs > 20 * S) { fs -= 2 * S; g.font = `600 ${fs}px ${sans}`; }
    g.fillStyle = PAPER; g.textBaseline = "alphabetic"; g.fillText(p.name, 32 * S, TH - 72 * S);
    // category (third)
    g.font = `500 ${17 * S}px ${mono}`; g.fillStyle = "#FF6B79";
    g.fillText(p.group.toUpperCase(), 32 * S, TH - 36 * S);
    return tex(c);
  };
  const logoTex = (p: Panel) => {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
    g.translate(16, 16); g.scale(4, 4);                 // 24-unit icon -> 96 px, centred in 128
    if (p.brand) { g.fillStyle = "#ffffff"; g.fill(new Path2D(p.brand.path)); }
    else if (p.glyph) { g.strokeStyle = "#ffffff"; g.lineWidth = 1.7; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(new Path2D(p.glyph)); }
    return tex(c);
  };

  /* ---- panels on the walls ---- */
  type Slot = { p: Panel; bg: T.Mesh; logo: T.Mesh; bgMat: T.MeshBasicMaterial; logoMat: T.MeshBasicMaterial; z0: number; normal: T.Vector3; base: T.Vector3; pull: number; brand: T.Color; dimmed: number };
  const plane = new THREE.PlaneGeometry(PW, PH), logoPlane = new THREE.PlaneGeometry(0.6, 0.6);
  const texCache = new Map<string, { bg: T.Texture; logo: T.Texture }>();
  const slots: Slot[] = [];
  const byWall: Record<Wall, Panel[]> = { left: [], right: [], ceiling: [], floor: [] };
  panels.forEach((p) => byWall[p.wall].push(p));
  for (const wall of Object.keys(byWall) as Wall[]) {
    const list = byWall[wall]; if (!list.length) continue;
    const reps = Math.max(1, Math.ceil(8 / list.length)), seq = Array.from({ length: list.length * reps }, (_, i) => list[i % list.length]);
    const step = SPAN / seq.length;
    for (let k = 0; k < seq.length; k++) {
      const p = seq[k];
      if (!texCache.has(p.name)) { if (texCache.size % 4 === 3) await yieldToMain(); }
      if (!texCache.has(p.name)) texCache.set(p.name, { bg: panelTex(p), logo: logoTex(p) });
      const t = texCache.get(p.name)!;
      const bgMat = new THREE.MeshBasicMaterial({ map: t.bg, transparent: true });
      const logoMat = new THREE.MeshBasicMaterial({ map: t.logo, transparent: true, color: new THREE.Color(PAPER) });
      const bg = new THREE.Mesh(plane, bgMat), logo = new THREE.Mesh(logoPlane, logoMat);
      logo.position.set(-PW / 2 + 0.52, PH / 2 - 0.46, 0.004); bg.add(logo);
      const alt = k % 2 ? 1 : -1, base = new THREE.Vector3(), normal = new THREE.Vector3();
      if (wall === "left") { bg.rotation.y = Math.PI / 2 - TILT; base.set(-W + 0.25, alt * 0.98, 0); normal.set(1, 0, 0); }      // angled a little toward the viewer, like a display mount
      if (wall === "right") { bg.rotation.y = -Math.PI / 2 + TILT; base.set(W - 0.25, alt * 0.98, 0); normal.set(-1, 0, 0); }
      if (wall === "ceiling") { bg.rotation.x = Math.PI / 2 - TILT; base.set(alt * 1.5, H - 0.2, 0); normal.set(0, -1, 0); }
      if (wall === "floor") { bg.rotation.x = -Math.PI / 2 + TILT; base.set(alt * 1.5, -H + 0.2, 0); normal.set(0, 1, 0); }
      const hex = p.brand ? (luminance(p.brand.hex) < 0.12 ? PAPER : p.brand.hex) : RED;
      scene.add(bg);
      slots.push({ p, bg, logo, bgMat, logoMat, z0: -(k * step + (wall === "right" || wall === "ceiling" ? step / 2 : 0)), normal, base, pull: 0, brand: new THREE.Color(hex), dimmed: 1 });
    }
  }
  const paper = new THREE.Color(PAPER);

  /* ---- frame rings and corner rails ---- */
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4a1a1d, transparent: true, opacity: 0.9 });
  const ringGeo = new THREE.BufferGeometry().setFromPoints([[-W, -H], [W, -H], [W, H], [-W, H], [-W, -H]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const rings: { l: T.Line; z0: number }[] = [];
  for (let k = 0; k < 11; k++) { const l = new THREE.Line(ringGeo, lineMat); scene.add(l); rings.push({ l, z0: -(k * SPAN) / 11 }); }
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([[-W, -H], [W, -H], [W, H], [-W, H]].flatMap(([x, y]) => [new THREE.Vector3(x, y, 4), new THREE.Vector3(x, y, -SPAN)])), lineMat));

  /* ---- dust: two copies of one particle box, slid along z so it loops seamlessly ---- */
  const DN = low ? 110 : 260, dpos = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dpos[i * 3] = (Math.random() * 2 - 1) * W * 0.92; dpos[i * 3 + 1] = (Math.random() * 2 - 1) * H * 0.92; dpos[i * 3 + 2] = -Math.random() * SPAN; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
  const dmat = new THREE.PointsMaterial({ color: 0xff7a70, size: 0.035, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const dustA = new THREE.Points(dgeo, dmat), dustB = new THREE.Points(dgeo, dmat); scene.add(dustA, dustB);

  /* ---- interaction state ---- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let Wpx = 1, Hpx = 1, mx = 0, my = 0, pointerIn = false, moved = true, yaw = 0, pitch = 0, yawT = 0, pitchT = 0;
  let hovered: Slot | null = null, focused: Slot | null = null, drift = 0, hoverAll = 0;
  const camPos = new THREE.Vector3(0, 0, 3), camLook = new THREE.Vector3(0, 0, -6), lookTarget = new THREE.Vector3(), posTarget = new THREE.Vector3();
  const speed = touch ? 0.16 : 0.32;
  const meshes = slots.map((s) => s.bg);
  const slotOf = new Map(meshes.map((m, i) => [m, slots[i]]));

  const pick = (): Slot | null => {
    ndc.set((mx / Wpx) * 2 - 1, -(my / Hpx) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(meshes, false).find((h) => (h.object as T.Mesh<T.BufferGeometry, T.MeshBasicMaterial>).material.opacity > 0.4);
    return hit ? slotOf.get(hit.object as T.Mesh) ?? null : null;
  };
  const showCard = (s: Slot | null) => {
    if (!s) { card.classList.remove("on"); return; }
    card.querySelector(".skc-cat")!.textContent = s.p.group;
    card.querySelector(".skc-name")!.textContent = s.p.name;
    const used = card.querySelector(".skc-used") as HTMLElement;
    used.textContent = s.p.usedIn ? `Used in ${s.p.usedIn}` : ""; used.hidden = !s.p.usedIn;
    card.classList.add("on");
  };
  const setHover = (s: Slot | null) => { if (s === hovered) return; hovered = s; showCard(focused ?? s); host.style.cursor = s ? "pointer" : touch ? "grab" : "default"; };

  const focus = (s: Slot | null) => { focused = s; showCard(s ?? hovered); host.classList.toggle("is-focused", !!s); invalidate(1600); };

  const rel = (e: PointerEvent) => { const r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  let drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  const onMove = (e: PointerEvent) => {
    rel(e); pointerIn = true; moved = true;
    if (e.pointerType === "mouse") { yawT = -((mx / Wpx) * 2 - 1) * 0.32; pitchT = -((my / Hpx) * 2 - 1) * 0.2; }
    else if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 6) drag.moved = true;
      yawT = clamp(drag.yaw + dx * 0.004, -0.6, 0.6); pitchT = clamp(drag.pitch + dy * 0.003, -0.35, 0.35);
    }
    invalidate(700);
  };
  const onDown = (e: PointerEvent) => { rel(e); if (e.pointerType !== "mouse") drag = { x: e.clientX, y: e.clientY, yaw: yawT, pitch: pitchT, moved: false }; };
  const onUp = (e: PointerEvent) => {
    rel(e);
    const wasDrag = drag?.moved; drag = null;
    if (wasDrag) return;
    if (focused) { focus(null); return; }                      // click again anywhere: resume
    const s = pick(); if (s) focus(s);
  };
  const onLeave = (e: PointerEvent) => { if (e.pointerType === "mouse") { pointerIn = false; yawT = 0; pitchT = 0; setHover(null); invalidate(700); } };
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && focused) focus(null); };
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerdown", onDown, { passive: true });
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("pointercancel", () => { drag = null; });
  addEventListener("keydown", onKey);

  const resize = (w: number, h: number) => { Wpx = w; Hpx = h; cam.aspect = w / h; cam.fov = w / h < 0.9 ? 74 : 62; cam.updateProjectionMatrix(); moved = true; };

  const tmp = new THREE.Vector3();
  const frame = (t: number, dt: number) => {
    if (!reduce && !focused) drift += dt * speed;
    const zOf = (z0: number) => (((z0 + drift) % SPAN) + SPAN) % SPAN - SPAN + NEAR;

    // hover picking once per frame, only when the pointer or the corridor moved
    if (!touch && pointerIn && !focused && (moved || !reduce)) { setHover(pick()); moved = false; }
    hoverAll = damp(hoverAll, hovered || focused ? 1 : 0, HOVER, dt);
    const sweepZ = NEAR - ((t * 2.6) % (SPAN + 8));          // a slow band of light that travels down the corridor

    for (const s of slots) {
      const z = zOf(s.z0), on = s === hovered || s === focused;
      s.pull = damp(s.pull, on ? 1 : 0, HOVER, dt);
      tmp.copy(s.base).addScaledVector(s.normal, s.pull * 0.45); tmp.z = z;
      s.bg.position.copy(tmp); s.bg.scale.setScalar(1 + s.pull * 0.06);
      const fade = clamp((NEAR - z) / 1.8, 0, 1);
      const sweep = reduce ? 0 : 0.28 * Math.exp(-((z - sweepZ) ** 2) / 5);
      s.dimmed = damp(s.dimmed, on ? 1 : 1 - hoverAll * 0.45, HOVER, dt);
      const b = (0.78 + sweep) * s.dimmed + s.pull * 0.22;
      s.bgMat.color.setScalar(b); s.bgMat.opacity = fade;
      s.logoMat.color.copy(paper).lerp(s.brand, s.pull).multiplyScalar(Math.min(1.2, b + 0.1)); s.logoMat.opacity = fade;
    }
    for (const r of rings) r.l.position.z = zOf(r.z0);
    const dz = ((drift % SPAN) + SPAN) % SPAN; dustA.position.z = dz; dustB.position.z = dz - SPAN;
    if (!reduce) dmat.opacity = 0.38 + 0.08 * Math.sin(t * 0.7);

    // camera: look around, or ease toward the focused panel
    yaw = damp(yaw, focused ? 0 : yawT, SLOW, dt); pitch = damp(pitch, focused ? 0 : pitchT, SLOW, dt);
    if (focused) { lookTarget.copy(focused.bg.position); posTarget.copy(focused.bg.position).addScaledVector(focused.normal, Wpx / Hpx < 0.9 ? 3.2 : 2.3); }
    else { posTarget.set(Math.sin(yaw) * 0.6, pitch * 1.2, 3); lookTarget.set(Math.sin(yaw) * 6, Math.sin(pitch) * 4, -6); }
    camPos.x = damp(camPos.x, posTarget.x, SETTLE * 0.7, dt); camPos.y = damp(camPos.y, posTarget.y, SETTLE * 0.7, dt); camPos.z = damp(camPos.z, posTarget.z, SETTLE * 0.7, dt);
    camLook.x = damp(camLook.x, lookTarget.x, SETTLE * 0.7, dt); camLook.y = damp(camLook.y, lookTarget.y, SETTLE * 0.7, dt); camLook.z = damp(camLook.z, lookTarget.z, SETTLE * 0.7, dt);
    cam.position.copy(camPos); cam.lookAt(camLook);

    // the detail card follows the panel it describes
    const cs = focused ?? hovered;
    if (focused) card.style.transform = `translate(${Wpx / 2}px, ${Hpx - 34}px)`;                       // focused: parked under the panel, never over it
    else if (cs) { tmp.copy(cs.bg.position).project(cam); card.style.transform = `translate(${clamp((tmp.x * 0.5 + 0.5) * Wpx, 90, Wpx - 90)}px, ${clamp((-tmp.y * 0.5 + 0.5) * Hpx, 70, Hpx - 70)}px)`; }
    renderer.render(scene, cam);
  };

  await renderer.compileAsync(scene, cam);
  return {
    frame, resize,
    animating: () => !reduce,
    dispose() {
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerdown", onDown); host.removeEventListener("pointerup", onUp); host.removeEventListener("pointerleave", onLeave);
      removeEventListener("keydown", onKey);
      disposeScene(scene); plane.dispose(); logoPlane.dispose(); ringGeo.dispose(); dgeo.dispose();
      texCache.forEach((t) => { t.bg.dispose(); t.logo.dispose(); });
    },
  };
}
