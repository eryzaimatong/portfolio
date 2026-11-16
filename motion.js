/* Data-science motion layer.
   Four small, real computations rendered as motion, one per place they fit:
     Home        k-means clustering discovers three groups in a diffuse cloud of points
     Skills      "trace a project": a path runs through the technologies that project used
     Experience  a signal travels the timeline and lights each milestone in turn
     Contact     gradient descent fits a regression line to scattered points (click to add one)
   Everything is plain canvas / SVG / CSS. Loops run only while their scene is on screen and the tab is visible,
   and with reduced motion each piece draws its finished state once. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => matchMedia('(max-width:860px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const COPPER = [217, 138, 86], BRONZE = [207, 160, 95], AMBER = [240, 184, 120], NEUTRAL = [232, 208, 174];
  const PAL = [COPPER, BRONZE, AMBER];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  root.classList.add('js-motion');

  /* ---------- a canvas layer that sizes itself and runs only while its scene is active ---------- */
  const layers = [];
  function makeLayer(scene, cls) {
    const c = document.createElement('canvas');
    c.className = 'field ' + cls;
    c.setAttribute('aria-hidden', 'true');
    scene.insertBefore(c, scene.querySelector('.content'));
    const L = { scene, c, ctx: c.getContext('2d'), w: 0, h: 0, raf: 0, stopTimer: 0, tick() {}, resize() {}, enter() {}, draw() {} };
    const fit = () => {
      const r = scene.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      L.w = r.width; L.h = r.height;
      c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr));
      L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      L.resize();
      if (!L.raf) L.draw();
    };
    new ResizeObserver(fit).observe(scene);
    fit();
    layers.push(L);
    return L;
  }
  function start(L) {
    clearTimeout(L.stopTimer);
    if (L.raf || reduce) return;
    let last = performance.now();
    const f = t => { L.raf = requestAnimationFrame(f); const dt = Math.min(.05, (t - last) / 1000); last = t; L.tick(dt, t / 1000); };
    L.raf = requestAnimationFrame(f);
  }
  function stop(L) { cancelAnimationFrame(L.raf); L.raf = 0; }
  function sync(entering) {
    layers.forEach(L => {
      const on = L.scene.classList.contains('active') && !document.hidden;
      if (on) { if (entering && L.scene.id === entering) L.enter(); start(L); L.draw(); }
      else if (L.raf) { clearTimeout(L.stopTimer); L.stopTimer = setTimeout(() => { if (!L.scene.classList.contains('active') || document.hidden) stop(L); }, 900); }
    });
  }

  /* =====================================================================
     HOME: k-means discovers structure
     Points are drawn around three hidden centres, but start so diffuse that the groups overlap. Lloyd's algorithm
     runs for real on their current positions: assign each point to the nearest centre, move each centre to the mean
     of its points. Points take the colour of their current group, so you watch the grouping settle, and the cloud
     tightens as the algorithm becomes sure. The pointer pushes points aside; a settled group names what it stands for.
     ===================================================================== */
  function heroField() {
    const scene = $('#home');
    if (!scene) return;
    const L = makeLayer(scene, 'field-hero');
    const tip = document.createElement('div');
    tip.className = 'field-tip'; tip.setAttribute('aria-hidden', 'true');
    scene.appendChild(tip);
    const SEEDS = [
      { x: .17, y: .24, name: 'data', label: 'Data', text: 'Python, SQL, R, Power BI' },
      { x: .44, y: .74, name: 'build', label: 'Build', text: 'Re:Watch and AURA' },
      { x: .6, y: .2, name: 'team', label: 'Team', text: 'NetConnect, IBITS, GDG on Campus' }
    ];
    const K = 3;
    let pts = [], cents = [], edges = [], t0 = 0, lastStep = 0, steps = 0, stable = 0, settled = 0, focus = -1, ptr = null, tipName = '';
    const unit = () => Math.min(L.w, L.h) * .082;
    const sigmaAt = t => 1 + 1.7 * (1 - ease(clamp((t - .9) / 4.6, 0, 1)));   // 2.7 -> 1 as the grouping firms up
    const target = (p, t) => { const s = SEEDS[p.s], u = unit() * sigmaAt(t); return [s.x * L.w + p.ox * u, s.y * L.h + p.oy * u]; };

    function build() {
      const n = small() ? 110 : 230;
      pts = Array.from({ length: n }, (_, i) => ({ s: i % K, ox: gauss(), oy: gauss(), x: 0, y: 0, vx: 0, vy: 0, col: NEUTRAL.slice(), c: -1, ph: Math.random() * 6.28, r: .9 + Math.random() * .9 }));
      reset(true);
    }
    function reset(snap) {
      t0 = performance.now() / 1000; steps = 0; stable = 0; settled = 0; lastStep = 0; cents = []; edges = []; tipName = ''; tip.classList.remove('on');
      pts.forEach(p => { p.c = -1; p.col = NEUTRAL.slice(); const g = target(p, 0); p.x = g[0]; p.y = g[1]; p.vx = p.vy = 0; });
    }
    function initCentres() {                       // k-means++ seeding: spread the first guesses apart
      cents = [];
      const first = pts[(Math.random() * pts.length) | 0];
      cents.push({ x: first.x, y: first.y, tx: first.x, ty: first.y });
      while (cents.length < K) {
        let best = null, bd = -1;
        pts.forEach(p => { const d = Math.min(...cents.map(c => (c.x - p.x) ** 2 + (c.y - p.y) ** 2)); if (d > bd) { bd = d; best = p; } });
        cents.push({ x: best.x, y: best.y, tx: best.x, ty: best.y });
      }
    }
    function lloyd() {
      let changed = 0;
      pts.forEach(p => {
        let bi = 0, bd = 1e18;
        cents.forEach((c, i) => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; bi = i; } });
        if (p.c !== bi) { p.c = bi; changed++; }
      });
      const sum = cents.map(() => [0, 0, 0]);
      pts.forEach(p => { const s = sum[p.c]; s[0] += p.x; s[1] += p.y; s[2]++; });
      cents.forEach((c, i) => { if (sum[i][2]) { c.tx = sum[i][0] / sum[i][2]; c.ty = sum[i][1] / sum[i][2]; } });
      steps++;
      stable = changed === 0 ? stable + 1 : 0;
      if (stable >= 2 && !settled) settled = performance.now() / 1000;
      // name each centre after the hidden centre it landed on, so the label stays truthful
      cents.forEach(c => { let bi = 0, bd = 1e18; SEEDS.forEach((s, i) => { const d = (s.x * L.w - c.tx) ** 2 + (s.y * L.h - c.ty) ** 2; if (d < bd) { bd = d; bi = i; } }); c.seed = bi; });
      links();
    }
    function links() {                             // each point to its two nearest neighbours in the same group
      edges = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]; let b1 = -1, d1 = 1e18, b2 = -1, d2 = 1e18;
        for (let j = 0; j < pts.length; j++) {
          if (i === j || pts[j].c !== a.c) continue;
          const d = (pts[j].x - a.x) ** 2 + (pts[j].y - a.y) ** 2;
          if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; } else if (d < d2) { d2 = d; b2 = j; }
        }
        if (b1 > i) edges.push([i, b1]); if (b2 > i) edges.push([i, b2]);
      }
    }
    function tick(dt, now) {
      const t = now - t0;
      if (t > .7 && !cents.length) { initCentres(); lloyd(); lastStep = now; }
      if (cents.length && now - lastStep > (settled ? 1.6 : .55)) { lloyd(); lastStep = now; }
      cents.forEach(c => { if (c.tx !== undefined) { c.x += (c.tx - c.x) * Math.min(1, dt * 7); c.y += (c.ty - c.y) * Math.min(1, dt * 7); } });
      const R = 120;
      pts.forEach(p => {
        const g = target(p, t);
        const wob = 2.2;
        g[0] += Math.sin(now * .5 + p.ph) * wob; g[1] += Math.cos(now * .43 + p.ph * 1.3) * wob;
        p.vx += (g[0] - p.x) * 60 * dt; p.vy += (g[1] - p.y) * 60 * dt;
        if (ptr) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
          if (d < R && d > .1) { const f = (1 - d / R) ** 2 * 9000 * dt; p.vx += dx / d * f; p.vy += dy / d * f; }
        }
        const damp = Math.pow(.00005, dt);
        p.vx *= damp; p.vy *= damp; p.x += p.vx * dt; p.y += p.vy * dt;
        const tc = p.c >= 0 ? PAL[p.c] : NEUTRAL, k = Math.min(1, dt * 5);
        for (let i = 0; i < 3; i++) p.col[i] += (tc[i] - p.col[i]) * k;
      });
      draw(now - t0);
    }
    function draw(t) {
      const ctx = L.ctx; ctx.clearRect(0, 0, L.w, L.h);
      const fadeIn = clamp(t / 1.1, 0, 1), conf = settled ? clamp((performance.now() / 1000 - settled) / 1.8, 0, 1) : 0;
      // links between neighbours appear as the grouping becomes certain
      if (edges.length && conf > 0) {
        ctx.lineWidth = .7;
        edges.forEach(e => {
          const a = pts[e[0]], b = pts[e[1]]; const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 64) return;
          const f = focus < 0 || a.c === focus ? 1 : .35;
          ctx.strokeStyle = rgba(PAL[a.c], (1 - d / 64) * .3 * conf * f * fadeIn);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
      }
      pts.forEach(p => {
        let a = (p.c >= 0 ? .78 : .38) * fadeIn, r = p.r * (small() ? 1.05 : 1.3);
        if (focus >= 0) { if (p.c === focus) { a = .95 * fadeIn; r *= 1.35; } else a *= .45; }
        if (ptr) { const d = Math.hypot(p.x - ptr.x, p.y - ptr.y); if (d < 90) { a = Math.min(1, a + (1 - d / 90) * .4); r *= 1 + (1 - d / 90) * .5; } }
        ctx.fillStyle = rgba(p.col, a);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
      });
      // centres: a small cross while the algorithm is still working, fading once it has settled
      if (cents.length && conf < 1) {
        cents.forEach((c, i) => {
          const a = (1 - conf) * .8 * fadeIn;
          ctx.strokeStyle = rgba(PAL[i], a); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(c.x - 7, c.y); ctx.lineTo(c.x + 7, c.y); ctx.moveTo(c.x, c.y - 7); ctx.lineTo(c.x, c.y + 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, 6.2832); ctx.stroke();
        });
      }
    }
    // the finished state, for reduced motion and for the first paint after a resize
    function finish() {
      if (!pts.length) return;
      t0 = performance.now() / 1000 - 10;
      pts.forEach(p => { const g = target(p, 10); p.x = g[0]; p.y = g[1]; });
      initCentres(); for (let i = 0; i < 14; i++) { lloyd(); cents.forEach(c => { c.x = c.tx; c.y = c.ty; }); }
      pts.forEach(p => p.col = PAL[p.c].slice());
      settled = performance.now() / 1000 - 5;
    }
    L.tick = tick;
    L.resize = () => { if (!pts.length) return; if (reduce) { finish(); } else { pts.forEach(p => { const g = target(p, performance.now() / 1000 - t0); p.x = g[0]; p.y = g[1]; p.vx = p.vy = 0; }); } };
    L.draw = () => { if (reduce) { if (!pts.length) build(); finish(); } draw(performance.now() / 1000 - t0); };
    L.enter = () => { if (!pts.length) build(); else reset(); };

    // pointer: repel nearby points; hover (or tap) a settled group to read what it stands for
    const toLocal = e => { const r = scene.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const showTip = () => {
      if (!ptr || !settled || !cents.length) { if (tipName) { tipName = ''; tip.classList.remove('on'); } return; }
      let best = null, bd = 1e18;
      cents.forEach(c => { const d = Math.hypot(c.x - ptr.x, c.y - ptr.y); if (d < bd) { bd = d; best = c; } });
      const rad = unit() * 2.1;
      if (best && bd < rad) {
        const s = SEEDS[best.seed];
        if (tipName !== s.name) { tipName = s.name; tip.innerHTML = '<b>' + s.label + '</b><span>' + s.text + '</span>'; tip.classList.add('on'); }
        tip.style.transform = 'translate(' + Math.round(best.x + 14) + 'px,' + Math.round(best.y - 12) + 'px)';
        focus = best.c;
      } else { if (tipName) { tipName = ''; tip.classList.remove('on'); } if (!circuitFocus) focus = -1; }
    };
    scene.addEventListener('pointermove', e => { if (reduce) return; ptr = toLocal(e); showTip(); }, { passive: true });
    scene.addEventListener('pointerdown', e => { if (reduce || e.pointerType !== 'touch') return; ptr = toLocal(e); showTip(); setTimeout(() => { ptr = null; showTip(); }, 900); }, { passive: true });
    scene.addEventListener('pointerleave', () => { ptr = null; showTip(); });

    // the circuit chip and the field describe the same three things: selecting a node brings its group forward
    let circuitFocus = false;
    const circ = $('#circuit');
    if (circ) new MutationObserver(() => {
      const n = circ.dataset.active; const si = SEEDS.findIndex(s => s.name === n);
      const c = cents.find(c => c.seed === si);
      circuitFocus = !!(c && si >= 0); focus = circuitFocus ? c.c : -1;
    }).observe(circ, { attributes: true, attributeFilter: ['data-active'] });

    build();
  }

  /* =====================================================================
     CONTACT: gradient descent fits a line
     Observations scatter around a hidden trend. A line starts out wrong and descends the squared-error surface step
     by step; thin residual segments show the remaining error and fade as it converges. Click to add a point and
     watch the fit settle again. The equation and r-squared in the corner are computed from the points shown.
     ===================================================================== */
  function contactFit() {
    const scene = $('#contact');
    if (!scene) return;
    const L = makeLayer(scene, 'field-contact');
    const cap = document.createElement('p');
    cap.className = 'field-cap'; cap.setAttribute('aria-hidden', 'true');
    scene.appendChild(cap);
    let pts = [], m = 0, b = 0, loss0 = 1, loss = 1, accum = 0, born = 0, lastCap = 0;
    const TM = -.17, TB = .85;                          // hidden trend in screen space (y grows downward); kept low so it never crosses the text
    const mkPoint = (u, v) => ({ u, v, t: performance.now() / 1000 });
    function build() {
      const n = small() ? 56 : 110;
      pts = Array.from({ length: n }, () => { const u = .06 + Math.random() * .88; return mkPoint(u, TM * u + TB + gauss() * .017); });
      restart();
    }
    function restart() { m = .2; b = .62; accum = 0; born = performance.now() / 1000; loss0 = mse(); }
    function mse() { let s = 0; pts.forEach(p => { const e = m * p.u + b - p.v; s += e * e; }); return s / pts.length; }
    function step() {
      let gm = 0, gb = 0; pts.forEach(p => { const e = m * p.u + b - p.v; gm += e * p.u; gb += e; });
      const n = pts.length; m -= .7 * 2 * gm / n; b -= .7 * 2 * gb / n;
    }
    function stats() {
      const n = pts.length; let su = 0, sv = 0; pts.forEach(p => { su += p.u; sv += p.v; });
      const mu = su / n, mv = sv / n; let suv = 0, suu = 0, svv = 0;
      pts.forEach(p => { suv += (p.u - mu) * (p.v - mv); suu += (p.u - mu) ** 2; svv += (p.v - mv) ** 2; });
      const ls = suv / suu; return { r2: suv * suv / (suu * svv), ls, lb: mv - ls * mu };
    }
    function fitNow() {                           // reduced motion: show the converged line without the descent
      m = .2; b = .62; loss0 = mse(); const s = stats(); m = s.ls; b = s.lb; born = 0;
    }
    function draw() {
      const ctx = L.ctx, w = L.w, h = L.h; ctx.clearRect(0, 0, w, h);
      const now = performance.now() / 1000, k = clamp((now - born) / .9, 0, 1);
      loss = mse(); const conv = clamp(1 - loss / loss0, 0, 1);       // 0 while wrong, ~1 once the fit has settled
      const X = u => u * w, Y = v => v * h;
      ctx.lineWidth = .8;
      pts.forEach(p => {
        const age = clamp((now - p.t) / .6, 0, 1);
        const ly = m * p.u + b, res = Math.abs(ly - p.v);
        const ra = (1 - conv) * .55 * Math.min(1, res * 30) * k * age;
        if (ra > .01) { ctx.strokeStyle = rgba(AMBER, ra); ctx.beginPath(); ctx.moveTo(X(p.u), Y(p.v)); ctx.lineTo(X(p.u), Y(ly)); ctx.stroke(); }
        ctx.fillStyle = rgba(conv > .9 ? COPPER : NEUTRAL, (.3 + .4 * conv) * k * age);
        ctx.beginPath(); ctx.arc(X(p.u), Y(p.v), 1.5 + (1 - age) * 3, 0, 6.2832); ctx.fill();
      });
      const g = ctx.createLinearGradient(X(0), 0, X(1), 0);
      g.addColorStop(0, rgba(AMBER, 0)); g.addColorStop(.18, rgba(AMBER, .85)); g.addColorStop(.82, rgba(AMBER, .85)); g.addColorStop(1, rgba(AMBER, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 1.6 + conv * .8; ctx.globalAlpha = (.35 + .5 * conv) * k;
      ctx.shadowColor = rgba(AMBER, .7); ctx.shadowBlur = 10 * conv;
      ctx.beginPath(); ctx.moveTo(X(0), Y(b)); ctx.lineTo(X(1), Y(m + b)); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      if (now - lastCap > .12) {
        lastCap = now; const s = stats();
        const sl = -m, ic = 1 - b;                                   // y up, for reading
        cap.textContent = 'y = ' + sl.toFixed(2) + 'x ' + (ic < 0 ? '- ' : '+ ') + Math.abs(ic).toFixed(2) + '   r² = ' + s.r2.toFixed(2) + '   n = ' + pts.length;
      }
    }
    L.tick = dt => {
      accum += dt; while (accum > .035) { step(); accum -= .035; }
      draw();
    };
    L.draw = () => { if (!pts.length) build(); if (reduce) fitNow(); draw(); };
    L.enter = () => { if (!pts.length) build(); else { pts = pts.slice(0, small() ? 56 : 110); restart(); } };
    scene.addEventListener('pointerdown', e => {
      if (e.target.closest('a,button')) return;
      const r = scene.getBoundingClientRect(); const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return;
      pts.push(mkPoint(u, v)); if (pts.length > 260) pts.shift();
      if (reduce) L.draw(); else loss0 = Math.max(mse(), loss0 * .6);
    });
    build();
  }

  /* =====================================================================
     EXPERIENCE: a signal travels the timeline
     ===================================================================== */
  function timeline() {
    const scene = $('#experience'), tl = $('#experience .timeline');
    if (!scene || !tl) return;
    const cards = [...tl.querySelectorAll('.tl-card')];
    const pulse = document.createElement('i'); pulse.className = 'tl-pulse'; pulse.setAttribute('aria-hidden', 'true'); tl.appendChild(pulse);
    let timers = [];
    function play() {
      timers.forEach(clearTimeout); timers = [];
      if (reduce) { cards.forEach(c => c.classList.add('lit')); return; }
      cards.forEach(c => c.classList.remove('lit'));
      tl.classList.remove('run'); void tl.offsetWidth;
      const H = tl.getBoundingClientRect().height, dur = 1900;
      tl.style.setProperty('--run', dur + 'ms');
      tl.classList.add('run');
      // light each milestone as the signal passes its dot
      cards.forEach(c => {
        const y = c.offsetTop + c.offsetHeight / 2;
        timers.push(setTimeout(() => c.classList.add('lit'), 650 + dur * clamp(y / H, 0, 1) * .9));
      });
    }
    let was = false;
    new MutationObserver(() => { const on = scene.classList.contains('active'); if (on && !was) play(); was = on; }).observe(scene, { attributes: true, attributeFilter: ['class'] });
    if (reduce) cards.forEach(c => c.classList.add('lit'));
  }

  /* =====================================================================
     SKILLS: trace a project through the stack
     Only the pairings the page already states: Re:Watch uses Java, Spring Boot, PostgreSQL, React;
     AURA uses Python, scikit-learn, NumPy, FastAPI.
     ===================================================================== */
  function lens() {
    const stack = $('#skills .stack');
    if (!stack) return;
    const USE = { rw: ['Java', 'Spring Boot', 'PostgreSQL', 'React'], au: ['Python', 'scikit-learn', 'NumPy', 'FastAPI'] };
    const NAME = { rw: 'Re:Watch', au: 'AURA' };
    const items = [...stack.querySelectorAll('.stk-items li')];
    const bar = document.createElement('div');
    bar.className = 'stk-lens'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Trace a project through the stack');
    bar.innerHTML = '<span class="lens-k">Trace a project</span>' + Object.keys(USE).map(k => '<button type="button" aria-pressed="false" data-lens="' + k + '">' + NAME[k] + '</button>').join('');
    stack.appendChild(bar);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'lens-svg'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(NS, 'path'); path.setAttribute('pathLength', '1'); svg.appendChild(path); stack.appendChild(svg);
    let active = '';
    function trace() {
      items.forEach(li => li.classList.remove('lens-on'));
      stack.classList.toggle('lensing', !!active);
      path.classList.remove('draw');
      if (!active) { path.setAttribute('d', ''); return; }
      const hit = USE[active].map(n => items.find(li => li.textContent.trim() === n)).filter(Boolean).sort((a, b) => items.indexOf(a) - items.indexOf(b));   // read top to bottom, so the path flows down the page
      const sr = stack.getBoundingClientRect();
      const P = hit.map(li => { const r = li.getBoundingClientRect(); return [r.left - sr.left + r.width / 2, r.top - sr.top + r.height + 1]; });
      hit.forEach((li, i) => { li.style.setProperty('--d', (reduce ? 0 : 160 + i * 260) + 'ms'); li.classList.add('lens-on'); });
      if (P.length > 1) {
        let d = 'M' + P[0][0] + ' ' + P[0][1];
        for (let i = 0; i < P.length - 1; i++) {
          const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
          d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6) + ' ' + p2[0] + ' ' + p2[1];
        }
        path.setAttribute('d', d); void path.getBoundingClientRect(); path.classList.add('draw');
      }
    }
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      active = active === b.dataset.lens ? '' : b.dataset.lens;
      bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.lens === active)));
      trace();
    });
    addEventListener('resize', () => { if (active) trace(); });
    new MutationObserver(() => { if (!$('#skills').classList.contains('active') && active) { active = ''; bar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false')); trace(); } }).observe($('#skills'), { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- wire up ---------- */
  heroField(); contactFit(); timeline(); lens();
  document.addEventListener('scenechange', e => sync(e.detail && e.detail.id));
  document.addEventListener('visibilitychange', () => sync());
  const first = $('.scene.active');
  sync(first && first.id);
})();
