/* The EI chip as a Fourier series.
   The chip outline is sampled as a closed curve, treated as complex numbers x + iy and decomposed with a discrete
   Fourier transform. Any number of the strongest terms can be summed back into a curve: with few terms the outline is
   a soft blob, with many it is the chip. `EIFourier.samples(h, n)` returns that curve; the Contact scene draws the
   rotating circles (epicycles) that produce it, and the shared point space settles onto the same curve. */
(() => {
  /* the outline: an octagon with three pins on every side, as one closed contour in a -1..1 box */
  const C = .26, PIN = .2, HALF = .045, POS = [-.52, 0, .52];
  const corners = [[-1 + C, -1], [1 - C, -1], [1, -1 + C], [1, 1 - C], [1 - C, 1], [-1 + C, 1], [-1, 1 - C], [-1, -1 + C]];
  const sides = [  // [from, to, outward normal]  (clockwise, y down)
    [corners[0], corners[1], [0, -1]], [corners[1], corners[2], [.7071, -.7071]], [corners[2], corners[3], [1, 0]], [corners[3], corners[4], [.7071, .7071]],
    [corners[4], corners[5], [0, 1]], [corners[5], corners[6], [-.7071, .7071]], [corners[6], corners[7], [-1, 0]], [corners[7], corners[0], [-.7071, -.7071]]
  ];
  const poly = [];
  sides.forEach(([a, b, n], i) => {
    poly.push(a.slice());
    if (i % 2 === 0) {   // straight sides carry pins
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      POS.forEach(s => {
        const px = mx + ux * s * len / 2 * 1, py = my + uy * s * len / 2 * 1;
        const p0 = [px - ux * HALF, py - uy * HALF], p1 = [p0[0] + n[0] * PIN, p0[1] + n[1] * PIN], p2 = [p1[0] + ux * HALF * 2, p1[1] + uy * HALF * 2], p3 = [p0[0] + ux * HALF * 2, p0[1] + uy * HALF * 2];
        poly.push(p0, p1, p2, p3);
      });
    }
  });
  /* resample by arc length so the DFT sees evenly spaced points */
  const M = 256;
  const cum = [0]; for (let i = 1; i <= poly.length; i++) { const a = poly[i - 1], b = poly[i % poly.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = cum[cum.length - 1];
  const pts = [];
  for (let k = 0, j = 0; k < M; k++) {
    const d = total * k / M; while (cum[j + 1] < d) j++;
    const a = poly[j], b = poly[(j + 1) % poly.length], t = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  /* DFT: c_f = (1/M) sum z_k e^{-2 pi i f k / M}, frequencies -M/2 .. M/2-1 */
  const coef = [];
  for (let f = -M / 2; f < M / 2; f++) {
    let re = 0, im = 0;
    for (let k = 0; k < M; k++) { const ang = -6.283185307 * f * k / M, c = Math.cos(ang), s = Math.sin(ang); re += pts[k][0] * c - pts[k][1] * s; im += pts[k][0] * s + pts[k][1] * c; }
    coef.push({ f, re: re / M, im: im / M, amp: Math.hypot(re, im) / M });
  }
  coef.sort((a, b) => b.amp - a.amp);   // strongest terms first
  const MAXH = 90;
  const terms = h => coef.slice(0, Math.min(h, MAXH));
  function samples(h, n) {
    const T = terms(h), out = [];
    for (let i = 0; i < n; i++) {
      const t = i / n; let x = 0, y = 0;
      T.forEach(c => { const a = 6.283185307 * c.f * t, co = Math.cos(a), si = Math.sin(a); x += c.re * co - c.im * si; y += c.re * si + c.im * co; });
      out.push([x, y]);
    }
    return out;
  }
  /* epicycle chain at phase t (0..1): the circle centres and radii, strongest first, for drawing */
  function chain(h, t) {
    const T = terms(h); let x = 0, y = 0; const out = [];
    T.forEach(c => { const a = 6.283185307 * c.f * t, nx = x + c.re * Math.cos(a) - c.im * Math.sin(a), ny = y + c.re * Math.sin(a) + c.im * Math.cos(a); out.push({ x, y, r: c.amp, nx, ny }); x = nx; y = ny; });
    return out;
  }
  window.EIFourier = { samples, chain, MAXH, M };
})();

/* Contact scene: the epicycles and the harmonics control. */
(() => {
  const scene = document.getElementById('contact');
  if (!scene || !window.EIFourier) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => matchMedia('(max-width:860px)').matches;
  const cv = document.createElement('canvas'); cv.className = 'sig-cv'; cv.setAttribute('aria-hidden', 'true'); scene.insertBefore(cv, scene.querySelector('.content'));
  const ctx = cv.getContext('2d');
  const ctl = document.createElement('div'); ctl.className = 'space-ctl sig-ctl';
  ctl.innerHTML = '<label for="harmRange">Fourier terms <output id="harmOut">64</output></label><input id="harmRange" type="range" min="1" max="' + EIFourier.MAXH + '" step="1" value="64" aria-describedby="harmHelp"><span id="harmHelp" class="sr-only">The chip outline is rebuilt from this many rotating circles. Few terms give a soft blob, many give the chip.</span>';
  scene.appendChild(ctl);
  const rng = ctl.querySelector('#harmRange'), out = ctl.querySelector('#harmOut');
  let W = 0, H = 0, DPR = 1, h = 64, raf = 0, active = false, sweep = null;
  const fit = () => { const r = scene.getBoundingClientRect(); W = r.width; H = r.height; DPR = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); if (!raf) draw(performance.now() / 1000); };
  new ResizeObserver(fit).observe(scene);
  const setH = (v, fire) => { h = Math.round(v); rng.value = h; out.textContent = h; if (fire !== false) window.dispatchEvent(new CustomEvent('eiharmonics', { detail: h })); if (!raf) draw(performance.now() / 1000); };
  rng.addEventListener('input', () => { sweep = null; setH(+rng.value); });
  function map() { const S = Math.min(W * .24, H * .36), cx = small() ? W / 2 : W * .75, cy = H / 2 + (small() ? 20 : 12); return { k: S * .62, cx, cy }; }
  function draw(now) {
    ctx.clearRect(0, 0, W, H); if (!W) return;
    const m = map(), dark = !scene.classList.contains('light');
    const col = a => dark ? 'rgba(240,184,120,' + a + ')' : 'rgba(150,70,28,' + a + ')';
    // the reconstructed curve
    const pts = EIFourier.samples(h, 360);
    ctx.lineWidth = 1.4; ctx.strokeStyle = col(.5); ctx.beginPath();
    pts.forEach((p, i) => { const x = m.cx + p[0] * m.k, y = m.cy + p[1] * m.k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke();
    if (reduce) return;
    // the circles that draw it
    const t = (now * .075) % 1, ch = EIFourier.chain(h, t);
    ctx.lineWidth = .8;
    ch.forEach((c, i) => { if (c.r * m.k < 2.5 && i > 5) return; ctx.strokeStyle = col(Math.min(.32, .08 + c.r * .9)); ctx.beginPath(); ctx.arc(m.cx + c.x * m.k, m.cy + c.y * m.k, c.r * m.k, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = col(.4); ctx.beginPath(); ctx.moveTo(m.cx + c.x * m.k, m.cy + c.y * m.k); ctx.lineTo(m.cx + c.nx * m.k, m.cy + c.ny * m.k); ctx.stroke(); });
    const tip = ch[ch.length - 1]; if (tip) { ctx.fillStyle = col(.95); ctx.beginPath(); ctx.arc(m.cx + tip.nx * m.k, m.cy + tip.ny * m.k, 3.4, 0, 6.2832); ctx.fill(); }
  }
  function loop(t) {
    raf = requestAnimationFrame(loop); const now = t / 1000;
    if (sweep) { const e = Math.min(1, (now - sweep.t0) / 5.2), v = 2 + (64 - 2) * (1 - Math.pow(1 - e, 3)); if (Math.round(v) !== h) setH(v); if (e >= 1) sweep = null; }
    draw(now);
  }
  function enter(on) {
    active = on; cancelAnimationFrame(raf); raf = 0;
    if (!on) return;
    if (reduce) { setH(64); return; }
    sweep = { t0: performance.now() / 1000 }; setH(2); raf = requestAnimationFrame(loop);
  }
  document.addEventListener('scenechange', e => enter(e.detail.id === 'contact'));
  document.addEventListener('visibilitychange', () => { if (active && !document.hidden && !reduce && !raf) raf = requestAnimationFrame(loop); if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } });
  if (scene.classList.contains('active')) enter(true);
})();
