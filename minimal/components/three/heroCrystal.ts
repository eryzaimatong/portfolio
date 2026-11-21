import type * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { disposeScene, type SceneCtx, type SceneHandle } from "./runtime";
import { clamp, damp, SLOW } from "./motion";

/* Hero crystal: a dark faceted crystal behind the portrait, wrapped by orbiting fragments.
   The fragments are pushed away by the pointer (or touch point) and spring back. The crystal turns slowly and leans toward
   the pointer. Dark metal with a soft red rim, red veins on some edges, a faint inner glow. Far fragments sink into fog. */

type Props = { photo: HTMLElement };
const BG = 0x0a0506;

function glowTexture(THREE: SceneCtx["THREE"]) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,60,48,0.55)"); gr.addColorStop(0.35, "rgba(200,16,30,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createScene({ THREE, renderer, host, reduce, low }: SceneCtx, { photo }: Props): SceneHandle {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 10.5, 15.5);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  cam.position.set(0, 0, 12);

  // reflections for the metal: a neutral studio environment, kept faint
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;

  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const key = new THREE.DirectionalLight(0xffffff, 0.38); key.position.set(-3, 4, 5); scene.add(key);
  const red = new THREE.PointLight(0xff2a2a, 0.85, 0, 0); red.position.set(3, -1.6, 3); scene.add(red);
  const rimL = new THREE.PointLight(0xff4a3a, 0.65, 0, 0); rimL.position.set(-3, 2.6, -3); scene.add(rimL);

  /* ---- the crystal ---- */
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = 1 + 0.2 * Math.sin(x * 2.3 + y * 1.7) * Math.cos(z * 2.9 - x * 1.1) + 0.1 * Math.sin(y * 4.1 + z * 3.3);
    pos.setXYZ(i, x * n, y * n * 1.12, z * n);
  }
  geo.computeVertexNormals();

  const rimU = { value: new THREE.Color(0xff2a2a).multiplyScalar(0.42) };
  const metal = new THREE.MeshStandardMaterial({ color: 0x0c0607, metalness: 0.9, roughness: 0.34, flatShading: true, envMapIntensity: 0.12 });
  metal.onBeforeCompile = (sh) => {                     // a soft red rim, strongest on facets that turn away from you
    sh.uniforms.uRim = rimU;
    sh.fragmentShader = sh.fragmentShader
      .replace("void main() {", "uniform vec3 uRim;\nvoid main() {")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  float rimF = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6);\n  totalEmissiveRadiance += uRim * rimF;");
  };
  const group = new THREE.Group(); scene.add(group);
  const core = new THREE.Mesh(geo, metal); group.add(core);

  // red veins on only some edges
  const eg = new THREE.EdgesGeometry(geo, 8), ea = eg.attributes.position.array as Float32Array, keep: number[] = [];
  for (let i = 0; i < ea.length; i += 6) { const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; if (h > 0.5) for (let k = 0; k < 6; k++) keep.push(ea[i + k]); }
  eg.dispose();
  const vg = new THREE.BufferGeometry(); vg.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
  const veinMat = new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const veins = new THREE.LineSegments(vg, veinMat); veins.scale.setScalar(1.006); core.add(veins);

  // faint inner glow behind the crystal
  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(THREE), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5, fog: false });
  const glow = new THREE.Sprite(glowMat); glow.position.z = -0.6; group.add(glow);

  /* ---- fragments (instanced: three shapes in dark metal, one in red) ---- */
  const COUNT = low ? 36 : 70;
  const shapes = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.DodecahedronGeometry(1)];
  const redMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  type F = { mesh: number; slot: number; r: number; phi: number; a: number; sp: number; s: number; sy: number; rx: number; ry: number; rz: number; vr: number[]; ox: number; oy: number; oz: number; vx: number; vy: number; vz: number };
  const frags: F[] = [], perMesh = [0, 0, 0, 0];
  for (let i = 0; i < COUNT; i++) {
    const m = i % 14 === 0 ? 3 : i % 3;
    const s = 0.03 + Math.pow(Math.random(), 2.4) * 0.15;
    frags.push({ mesh: m, slot: perMesh[m]++, r: 0.85 + Math.random() * 0.5, phi: 0.35 + Math.random() * 2.4, a: Math.random() * Math.PI * 2,
      sp: (0.08 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1), s, sy: 0.6 + Math.random() * 0.8,
      rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6, vr: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5].map((v) => v * 0.9),
      ox: 0, oy: 0, oz: 0, vx: 0, vy: 0, vz: 0 });
  }
  const inst = [0, 1, 2, 3].map((m) => {
    const im = new THREE.InstancedMesh(m === 3 ? shapes[0] : shapes[m], m === 3 ? redMat : metal, Math.max(1, perMesh[m]));
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; scene.add(im); return im;
  });
  const dummy = new THREE.Object3D();

  /* ---- layout: everything is placed around the photo, in pixels converted to world units ---- */
  let W = 1, H = 1, u = 0.01, cx = 0, cy = 0, rx = 2, ry = 2, crystalR = 1, docL = 0, docT = 0;
  const resize = (w: number, h: number) => {
    W = w; H = h; cam.aspect = w / h; cam.updateProjectionMatrix();
    u = (2 * cam.position.z * Math.tan((cam.fov * Math.PI) / 360)) / h;       // world units per pixel on the z = 0 plane
    const hr = host.getBoundingClientRect(), pr = photo.getBoundingClientRect();
    docL = hr.left + scrollX; docT = hr.top + scrollY;                       // cached: no layout reads per frame
    const pcx = pr.left - hr.left + pr.width / 2, pcy = pr.top - hr.top + pr.height / 2;
    // the crystal sits behind the photo, a little up and to the right, so it peeks out around the frame
    cx = (pcx + pr.width * 0.16 - w / 2) * u; cy = -(pcy - pr.height * 0.1 - h / 2) * u;
    crystalR = Math.max(pr.width, pr.height) * 0.44 * u;
    group.position.set(cx, cy, 0); core.scale.setScalar(crystalR); glow.scale.setScalar(crystalR * 3.4);
    rx = pr.width * 0.74 * u; ry = pr.height * 0.68 * u;
  };

  /* ---- pointer: mouse anywhere, or the touch point (never blocks scrolling) ---- */
  let px = -1e4, py = -1e4, pIn = false, nx = 0, ny = 0;
  const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; pIn = true; };
  const onLeave = () => { pIn = false; };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  let rotY = 0, rotX = 0, spin = 0;
  const frame = (t: number, dt: number) => {
    const lx = px - (docL - scrollX), ly = py - (docT - scrollY);
    const inside = pIn && lx > -40 && ly > -40 && lx < W + 40 && ly < H + 40;
    const wx = (lx - W / 2) * u, wy = -(ly - H / 2) * u;                         // pointer on the z = 0 plane
    nx = damp(nx, inside ? clamp((wx - cx) / (crystalR * 3), -1, 1) : 0, SLOW, dt);
    ny = damp(ny, inside ? clamp((wy - cy) / (crystalR * 3), -1, 1) : 0, SLOW, dt);
    if (!reduce) spin += dt * 0.16;
    rotY = damp(rotY, spin + nx * 0.55, SLOW, dt); rotX = damp(rotX, -ny * 0.35, SLOW, dt);
    group.rotation.set(rotX, rotY, 0);

    const pulse = reduce ? 0.8 : 0.72 + 0.18 * Math.sin(t * 1.3);
    veinMat.opacity = pulse; glowMat.opacity = 0.32 + 0.12 * (reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.9));
    red.position.x = 3 + (reduce ? 0 : Math.sin(t * 0.6) * 1.2);

    const repel = crystalR * 0.9, k = Math.min(1, dt * 60);
    for (const f of frags) {
      if (!reduce) f.a += f.sp * dt * 0.7;
      const bx = cx + Math.sin(f.phi) * Math.cos(f.a) * rx * f.r, by = cy + Math.cos(f.phi) * ry * f.r, bz = Math.sin(f.phi) * Math.sin(f.a) * rx * 0.9 * f.r;
      if (inside && !reduce) {
        const dx = bx + f.ox - wx, dy = by + f.oy - wy, d = Math.hypot(dx, dy);
        if (d < repel) { const q = ((repel - d) / repel) * 0.06 * k; f.vx += (dx / (d || 1)) * q; f.vy += (dy / (d || 1)) * q; f.vz += (Math.random() - 0.5) * q * 0.5; }
      }
      // spring back home, with damping
      f.vx = (f.vx - f.ox * 0.035 * k) * Math.pow(0.9, k); f.vy = (f.vy - f.oy * 0.035 * k) * Math.pow(0.9, k); f.vz = (f.vz - f.oz * 0.035 * k) * Math.pow(0.9, k);
      f.ox += f.vx; f.oy += f.vy; f.oz += f.vz;
      const sp = Math.hypot(f.vx, f.vy);
      if (!reduce) { f.rx += (f.vr[0] + sp * 6) * dt; f.ry += f.vr[1] * dt; f.rz += f.vr[2] * dt; }
      dummy.position.set(bx + f.ox, by + f.oy, bz + f.oz);
      dummy.rotation.set(f.rx, f.ry, f.rz);
      const s = f.s * crystalR * (f.mesh === 3 ? 0.32 : 0.5); dummy.scale.set(s, s * f.sy, s);
      dummy.updateMatrix();
      inst[f.mesh].setMatrixAt(f.slot, dummy.matrix);
    }
    for (const im of inst) im.instanceMatrix.needsUpdate = true;
    renderer.render(scene, cam);
  };

  return {
    frame, resize,
    dispose() {
      removeEventListener("pointermove", onMove); removeEventListener("pointerdown", onMove); document.removeEventListener("pointerleave", onLeave);
      disposeScene(scene); shapes.forEach((s) => s.dispose()); env.dispose();
    },
  };
}
