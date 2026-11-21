import type * as T from "three";
import { disposeScene, type SceneCtx, type SceneHandle } from "./runtime";
import { damp, easeInOutCubic, HOVER, SLOW } from "./motion";

/* Project objects. Each project is its own object built from its real screenshots:
   - Re:Watch: a deck of screen panels that fans out like a swatch book (a rising spiral) on hover / press-and-hold
   - AURA: translucent phone-screen layers with a face-scan outline, which explode into depth while a scan line sweeps
   Idle: slow turn, gentle float, soft red ground glow. Click: the object rushes toward the camera, then the case file opens. */

export type ProjectProps = { kind: "deck" | "scan"; shots: string[]; logo: string; logoBg: string };
export type ProjectHandle = SceneHandle & { hover(on: boolean): void; zoom(): Promise<void>; reset(): void };

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });

function rounded(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export async function createScene({ THREE, renderer, reduce, low, invalidate }: SceneCtx, props: ProjectProps): Promise<ProjectHandle> {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const deck = props.kind === "deck";

  const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };

  // a screenshot with rounded corners and a hairline frame (and, for AURA, a faint scan texture)
  const shotTex = (img: HTMLImageElement, cw: number, ch: number, front: boolean) => {
    const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d")!;
    const r = Math.round(cw * (deck ? 0.025 : 0.08));
    g.save(); rounded(g, 0, 0, cw, ch, r); g.clip(); g.drawImage(img, 0, 0, cw, ch);
    if (!deck) {                                      // scan look: dark wash, fine horizontal lines
      g.fillStyle = "rgba(10,5,6,0.18)"; g.fillRect(0, 0, cw, ch);
      g.fillStyle = "rgba(255,59,48,0.07)"; for (let y = 0; y < ch; y += 6) g.fillRect(0, y, cw, 1);
    }
    g.restore();
    g.lineWidth = Math.max(2, cw * 0.004); g.strokeStyle = front ? "rgba(224,17,43,0.9)" : "rgba(224,17,43,0.45)";
    rounded(g, g.lineWidth / 2, g.lineWidth / 2, cw - g.lineWidth, ch - g.lineWidth, r); g.stroke();
    if (!deck && front) {                             // the face-scan outline: an oval and five landmark points
      g.strokeStyle = "rgba(255,90,80,0.85)"; g.lineWidth = 2.5;
      const ox = cw / 2, oy = ch * 0.36, ex = cw * 0.24, ey = ch * 0.15;
      g.beginPath(); g.ellipse(ox, oy, ex, ey, 0, 0, Math.PI * 2); g.stroke();
      g.setLineDash([8, 10]); g.beginPath(); g.moveTo(ox - ex, oy); g.lineTo(ox + ex, oy); g.moveTo(ox - ex * 0.75, oy + ey * 0.62); g.lineTo(ox + ex * 0.75, oy + ey * 0.62); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#ff3b30"; for (const [x, y] of [[-1, 0], [1, 0], [-0.75, 0.62], [0.75, 0.62], [0, 1]]) { g.beginPath(); g.arc(ox + x * ex, oy + y * ey, 5, 0, Math.PI * 2); g.fill(); }
    }
    return tex(c);
  };
  const backTex = (logo: HTMLImageElement | null, cw: number, ch: number) => {
    const c = document.createElement("canvas"); c.width = cw; c.height = ch; const g = c.getContext("2d")!;
    const r = Math.round(cw * (deck ? 0.025 : 0.08));
    rounded(g, 0, 0, cw, ch, r); g.fillStyle = "#150a0b"; g.fill();
    g.lineWidth = 2; g.strokeStyle = "rgba(224,17,43,0.35)"; g.stroke();
    if (logo) { const s = Math.min(cw, ch) * 0.28; g.globalAlpha = 0.85; g.drawImage(logo, cw / 2 - s / 2, ch / 2 - s / 2, s, s); g.globalAlpha = 1; }
    return tex(c);
  };
  const glowTex = () => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,59,48,0.55)"); gr.addColorStop(0.45, "rgba(140,10,18,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return tex(c);
  };

  const [imgs, logo] = await Promise.all([Promise.all(props.shots.map(loadImg)), loadImg(props.logo).catch(() => null)]);

  /* ---- build the layers ---- */
  const N = imgs.length;
  const PW = deck ? 3.2 : 1.32, PH = deck ? 2.0 : 2.86, DEPTH = 0.022;
  const TW = low ? (deck ? 768 : 320) : deck ? 1024 : 420, TH = Math.round((TW * PH) / PW);
  const geo = new THREE.BoxGeometry(PW, PH, DEPTH);
  const edge = new THREE.MeshBasicMaterial({ color: 0x2a1214 });
  const back = new THREE.MeshBasicMaterial({ map: backTex(logo, Math.round(TW / 2), Math.round(TH / 2)) });
  const root = new THREE.Group(); scene.add(root);
  const obj = new THREE.Group(); root.add(obj);
  type L = { pivot: T.Object3D; mesh: T.Mesh; mat: T.MeshBasicMaterial; k: number; jitter: number };
  const layers: L[] = [];
  for (let i = 0; i < N; i++) {
    // the front-most layer shows the cover (first screenshot)
    const front = i === N - 1;
    const mat = new THREE.MeshBasicMaterial({ map: shotTex(imgs[N - 1 - i], TW, TH, front), transparent: !deck, opacity: deck ? 1 : front ? 0.97 : 0.42 + 0.3 * (i / Math.max(1, N - 1)) });
    const mesh = new THREE.Mesh(geo, [edge, edge, edge, edge, mat, back]);
    const pivot = new THREE.Object3D();
    if (deck) { pivot.position.x = -PW / 2; mesh.position.x = PW / 2; }     // swatch-book hinge on the left edge
    pivot.add(mesh); obj.add(pivot);
    layers.push({ pivot, mesh, mat, k: N > 1 ? i / (N - 1) : 0, jitter: (Math.sin(i * 12.9898) * 0.5) * 0.03 });
  }

  // a scan line that sweeps through AURA's layers while it is open
  const scanMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.5, 0.02), scanMat);
  if (!deck) obj.add(scan);

  // soft red ground glow
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = -PH * 0.78; glow.scale.set(PW * 2.4, PW * 1.6, 1); root.add(glow);

  /* ---- state ---- */
  let fan = 0, fanTarget = 0, spin = 0, zoomT = 0, zoomFrom = 0, zoomTo = 0, zoomStart = 0, zoomDur = 1, zoomResolve: (() => void) | null = null;
  const baseZ = deck ? 6.9 : 7.1;

  const resize = (w: number, h: number) => {
    cam.aspect = w / h;
    cam.position.set(0, deck ? 2.1 : 1.4, baseZ * (w / h < 1.15 ? 1.18 : 1));
    cam.lookAt(0, deck ? 0.1 : 0.05, 0); cam.updateProjectionMatrix();
  };

  const frame = (t: number, dt: number) => {
    fan = reduce ? fanTarget : damp(fan, fanTarget, HOVER * 0.8, dt);
    if (!reduce) spin += dt * (0.22 + fan * 0.1);
    root.rotation.y = deck ? (reduce ? -0.35 : Math.sin(spin) * 0.55 - 0.2) : (reduce ? 0.5 : spin);
    root.position.y = (reduce ? 0 : Math.sin(t * 1.1) * 0.06) + fan * 0.1;
    root.rotation.x = deck ? 0.16 : 0.06;

    for (const l of layers) {
      const c = l.k - 0.5;                               // -0.5 (back) .. 0.5 (front)
      if (deck) {
        l.pivot.position.z = c * (0.12 + fan * 0.5);
        l.pivot.position.y = c * fan * 0.55;             // rises into a spiral
        l.pivot.rotation.y = fan * (l.k * 1.15) + l.jitter * (1 - fan);
        l.mesh.rotation.z = l.jitter * (1 - fan);
      } else {
        l.pivot.position.z = c * (0.36 + fan * 2.4);     // explodes into depth
        l.pivot.position.x = c * fan * 0.5;
        l.pivot.rotation.y = c * fan * 0.35;
        l.pivot.position.y = c * fan * 0.25;
      }
    }
    if (!deck) {
      const sweep = ((t * 0.45) % 1);
      scan.position.set(0, (0.5 - sweep) * PH, 0); scan.scale.set(1 + fan * 1.6, 1, 1);
      scanMat.opacity = fan * 0.85;
    }
    glowMat.opacity = 0.55 + fan * 0.35 + (reduce ? 0 : Math.sin(t * 1.3) * 0.06);

    // click: rush toward the camera
    if (zoomResolve || zoomT) {
      const p = Math.min(1, (performance.now() - zoomStart) / zoomDur), e = easeInOutCubic(p);
      zoomT = zoomFrom + (zoomTo - zoomFrom) * e;
      if (p >= 1 && zoomResolve) { const r = zoomResolve; zoomResolve = null; r(); }
    }
    obj.position.z = zoomT * 3.2; obj.scale.setScalar(1 + zoomT * 0.12);
    renderer.render(scene, cam);
  };

  const startZoom = (to: number, ms: number) => new Promise<void>((res) => {
    zoomFrom = zoomT; zoomTo = to; zoomStart = performance.now(); zoomDur = ms; zoomResolve = res; invalidate(ms + 100);
  });

  return {
    frame, resize,
    animating: () => !reduce || fan !== fanTarget || !!zoomResolve,
    hover(on) { fanTarget = on ? 1 : 0; invalidate(900); },
    zoom() { return reduce ? Promise.resolve() : startZoom(1, 300); },
    reset() { if (reduce) { zoomT = 0; invalidate(50); return; } startZoom(0, 450); },
    dispose() { disposeScene(scene); geo.dispose(); },
  };
}
