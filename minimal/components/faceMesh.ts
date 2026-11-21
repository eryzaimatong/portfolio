/* The portrait scan: animates landmarks that were precomputed once (scripts/make-landmarks.py) with MediaPipe.
   No ML runs in the browser. Loaded lazily, one rAF loop that ends when the scan ends. */

export type Mesh = { x1: Float32Array; y1: Float32Array; x2: Float32Array; y2: Float32Array; ym: Float32Array };
let cache: Promise<Mesh> | null = null;

export function loadMesh(): Promise<Mesh> {
  return (cache ??= fetch("/assets/hero-landmarks.json").then((r) => r.json()).then((d: { points: number[][]; edges: number[][] }) => {
    const e = d.edges.map(([a, b]) => ({ a: d.points[a], b: d.points[b], ym: (d.points[a][1] + d.points[b][1]) / 2 })).sort((p, q) => p.ym - q.ym);
    return {
      x1: Float32Array.from(e, (v) => v.a[0]), y1: Float32Array.from(e, (v) => v.a[1]),
      x2: Float32Array.from(e, (v) => v.b[0]), y2: Float32Array.from(e, (v) => v.b[1]), ym: Float32Array.from(e, (v) => v.ym),
    };
  }));
}

/* the same curve as the CSS (.45, 0, .25, 1), so the mesh and the sweeping line never drift apart */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t, Y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => { let t = x; for (let i = 0; i < 8; i++) { const d = X(t) - x; if (Math.abs(d) < 1e-4) break; const s = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(s) < 1e-6) break; t -= d / s; } return Y(Math.max(0, Math.min(1, t))); };
}
const curve = bezier(0.45, 0, 0.25, 1);

const lowerBound = (a: Float32Array, v: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < v) lo = m + 1; else hi = m; } return lo; };
const LEVELS = [0.95, 0.7, 0.45, 0.22];

/* Draws the mesh only in a band behind the scan line, so it reads as the line "reading" the face. Returns a cancel function. */
export function runMesh(cv: HTMLCanvasElement, mesh: Mesh, delayMs: number, durMs: number, done: () => void): () => void {
  const ctx = cv.getContext("2d")!;
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  const W = cv.clientWidth, H = cv.clientHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const band = 0.5, FADE = 380;
  const start = performance.now() + delayMs;
  let raf = 0, stopped = false;

  const frame = (now: number) => {
    raf = 0; if (stopped) return;
    const t = (now - start) / durMs, p = curve(Math.max(0, Math.min(1, t)));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const after = t > 1 ? 1 - Math.min(1, ((t - 1) * durMs) / FADE) : 1;   // after the sweep the last bit fades out
    if (t >= 0 && after > 0) {
      const lead = 0.03, lo = lowerBound(mesh.ym, p - band), hi = lowerBound(mesh.ym, p - lead);   // trails the line, never leads it
      const paths = LEVELS.map(() => new Path2D());
      for (let i = lo; i < hi; i++) {
        const k = (p - lead - mesh.ym[i]) / band;                               // 0 at the line, 1 at the trailing end of the band
        const lv = k < 0.15 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
        paths[lv].moveTo(mesh.x1[i] * W, mesh.y1[i] * H); paths[lv].lineTo(mesh.x2[i] * W, mesh.y2[i] * H);
      }
      ctx.lineWidth = 0.7; ctx.strokeStyle = "#FF6B79";
      paths.forEach((pa, i) => { ctx.globalAlpha = LEVELS[i] * after; ctx.stroke(pa); });
      ctx.globalAlpha = 1;
    }
    if (t >= 1 + FADE / durMs) { ctx.clearRect(0, 0, W, H); done(); return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; if (raf) cancelAnimationFrame(raf); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); };
}
