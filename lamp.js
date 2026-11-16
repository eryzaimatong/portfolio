/* The lamp. One warm light that follows the pointer (or a finger) and drifts on its own when nobody is steering.
   It writes three kinds of CSS variables:
     --lx / --ly           the lamp position, for the wall, the veil and the glow
     --rx / --ry / --rl    per engraved element: the direction to the lamp and how near it is (drives highlight, shadow, warmth)
     --rmx / --rmy         per lit surface: where the lamp falls inside it, in percent
   Text never depends on the lamp to be readable; the lamp only adds relief. With reduced motion the lamp does not drift or
   ignite, and follows the pointer without easing. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let W = innerWidth, H = innerHeight;
  const lamp = { x: W * .5, y: H * .34, tx: W * .5, ty: H * .34 };
  let lastInput = -1e9, last = performance.now(), ignite = reduce ? 1 : 0, dirty = true, raf = 0;
  const vis = new Set();
  const els = [...document.querySelectorAll('[data-relief],[data-lit]')];
  const io = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); }), { rootMargin: '10% 0px' });
  els.forEach(e => io.observe(e));
  const surfaces = [...document.querySelectorAll('.portrait')];

  addEventListener('resize', () => { W = innerWidth; H = innerHeight; dirty = true; }, { passive: true });
  addEventListener('scroll', () => { dirty = true; kick(); }, { passive: true });
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    lamp.tx = e.clientX; lamp.ty = e.clientY; lastInput = performance.now(); kick();
  }, { passive: true });
  // touch: the lamp goes where the finger goes, and stays there a moment
  const touch = e => { const t = e.touches[0]; if (!t) return; lamp.tx = t.clientX; lamp.ty = t.clientY; lastInput = performance.now(); kick(); };
  addEventListener('touchstart', touch, { passive: true });
  addEventListener('touchmove', touch, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  function idleTarget(t) {
    // a slow figure-of-eight around the upper middle of the screen
    return [W * (.5 + .26 * Math.sin(t * .00023)), H * (.36 + .2 * Math.sin(t * .00046 + 1))];
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (ignite < 1) ignite = Math.min(1, ignite + dt / 1.9);
    if (!reduce && now - lastInput > 3200) { const p = idleTarget(now); lamp.tx = p[0]; lamp.ty = p[1]; }
    const k = reduce ? 1 : 1 - Math.pow(.0009, dt);
    const nx = lamp.x + (lamp.tx - lamp.x) * k, ny = lamp.y + (lamp.ty - lamp.y) * k;
    const moved = Math.abs(nx - lamp.x) + Math.abs(ny - lamp.y) > .05;
    lamp.x = nx; lamp.y = ny;
    // ignition: a candle-like flicker as the darkness lifts
    const flick = ignite < 1 ? (Math.sin(now * .05) * Math.sin(now * .013) * .06) * (1 - ignite) : 0;
    root.style.setProperty('--vd', (.26 + (1 - ignite) * .5 + flick).toFixed(3));
    if (moved || dirty || ignite < 1) {
      root.style.setProperty('--lx', lamp.x.toFixed(1) + 'px'); root.style.setProperty('--ly', lamp.y.toFixed(1) + 'px');
      vis.forEach(el => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = lamp.x - cx, dy = lamp.y - cy, d = Math.hypot(dx, dy) || 1;
        el.style.setProperty('--rx', (dx / d).toFixed(2)); el.style.setProperty('--ry', (dy / d).toFixed(2));
        el.style.setProperty('--rl', clamp(1 - d / (Math.max(W, H) * .85), .1, 1).toFixed(2));
      });
      surfaces.forEach(el => { const r = el.getBoundingClientRect(); el.style.setProperty('--rmx', clamp((lamp.x - r.left) / r.width * 100, -20, 120).toFixed(0) + '%'); el.style.setProperty('--rmy', clamp((lamp.y - r.top) / r.height * 100, -20, 120).toFixed(0) + '%'); });
      dirty = false;
    }
    if (!reduce || moved || ignite < 1 || dirty) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  window.Lamp = { get x() { return lamp.x; }, get y() { return lamp.y; }, kick };
  // the first frame
  lamp.x = lamp.tx; lamp.y = lamp.ty; kick();
})();
