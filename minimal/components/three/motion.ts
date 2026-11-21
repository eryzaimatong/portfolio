/* One motion system for all three scenes (and the CSS around them, see --ease / --t-* in globals.css).
   Everything eases out; hover-type transitions settle in about 450 ms; nothing bounces. */

export const DUR = { micro: 200, hover: 450, layout: 600 } as const;

/* Frame-rate independent approach to a target. With HOVER this settles in ~450 ms, with SLOW in ~1 s. */
export const HOVER = 9, SLOW = 4, SETTLE = 6;
export const damp = (from: number, to: number, lambda: number, dt: number) => from + (to - from) * (1 - Math.exp(-lambda * dt));

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
