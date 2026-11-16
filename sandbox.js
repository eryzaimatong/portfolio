/* The Tech Stack sandbox.
   Seven cast-metal tokens drop into a tray and behave like heavy objects: they fall, collide, tumble, and can be picked up
   and thrown. Each has its own shape and metal, so they weigh, bounce and slide differently (gold is dense and lively, champagne is
   light and bouncy, bronze is heavy and dull). The lamp that lights the page lights them too: the highlight on each token
   faces the lamp and its shadow falls on the wall away from it.
   Physics is Matter.js (2D rigid bodies), loaded only when this section comes near the screen. The full stack list is plain text below. */
(() => {
  const box = document.getElementById('sandbox'), cv = document.getElementById('sandboxCv'), hint = document.getElementById('sbHint'), sec = document.getElementById('skills');
  if (!box || !cv) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => matchMedia('(max-width:860px)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ctx = cv.getContext('2d');
  let M = null, engine, world, bodies = [], statics = [], W = 0, H = 0, DPR = 1, raf = 0, running = false, started = false, acc = 0, last = 0, drag = null, touchId = null, ptr = null, spawnTimers = [];

  const METAL = {
    copper:   { hi: '#f4b684', mid: '#b8673a', lo: '#5a2a12', ink: '#2a1408', e: .22, d: .0026, f: .5 },
    brass:    { hi: '#f8e0a0', mid: '#c9a14a', lo: '#6b5120', ink: '#3a2a0a', e: .30, d: .0022, f: .4 },
    bronze:   { hi: '#e6b98a', mid: '#9c6a3f', lo: '#4a2e18', ink: '#24150a', e: .16, d: .0032, f: .7 },
    gold:     { hi: '#fff2c0', mid: '#d6ad48', lo: '#7a5a18', ink: '#3a2806', e: .42, d: .0034, f: .3 },
    champagne:{ hi: '#fff5e0', mid: '#e4cfa4', lo: '#8d7a58', ink: '#3d3220', e: .58, d: .0011, f: .25 },
    orange:   { hi: '#ffd6aa', mid: '#f0a867', lo: '#a85a22', ink: '#3a1c08', e: .50, d: .0014, f: .3 },
    choc:     { hi: '#7a5642', mid: '#3a2013', lo: '#1a0d07', ink: '#f0c88c', e: .30, d: .0021, f: .45 }
  };
  const SPEC = [
    { n: 'Python', shape: 'hex', metal: 'brass' }, { n: 'R', shape: 'disc', metal: 'copper' }, { n: 'SQL', shape: 'slab', metal: 'bronze' },
    { n: 'Power BI', shape: 'bar', metal: 'gold' }, { n: 'React', shape: 'oct', metal: 'champagne' }, { n: 'Figma', shape: 'pill', metal: 'orange' }, { n: 'Java', shape: 'rrect', metal: 'choc' }
  ];

  function loadMatter(cb) {
    if (window.Matter) { M = window.Matter; return cb(); }
    const s = document.createElement('script'); s.src = 'assets/vendor/matter.min.js'; s.onload = () => { M = window.Matter; cb(); }; s.onerror = () => { box.hidden = true; }; document.head.appendChild(s);
  }
  function size() {
    const r = box.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function walls() {
    const { Bodies, World } = M; statics.forEach(b => World.remove(world, b)); statics = [];
    const t = 500, o = { isStatic: true, friction: .6, restitution: .25 };
    statics.push(Bodies.rectangle(W / 2, H + t / 2 - 14, W + 2 * t, t, o));            // floor
    statics.push(Bodies.rectangle(-t / 2 + 2, H / 2, t, H * 6, o), Bodies.rectangle(W + t / 2 - 2, H / 2, t, H * 6, o));
    statics.push(Bodies.rectangle(W / 2, -t / 2 - 520, W + 2 * t, t, o));              // a high ceiling, so a hard throw returns
    const w = Math.min(W * .16, 150);                                                   // two shallow wedges so nothing wedges in a corner
    statics.push(Bodies.fromVertices(w * .55, H - 14 - w * .22, [[{ x: 0, y: w * .45 }, { x: w * 1.1, y: w * .45 }, { x: w * 1.1, y: 0 }]], o));
    statics.push(Bodies.fromVertices(W - w * .55, H - 14 - w * .22, [[{ x: 0, y: w * .45 }, { x: 0, y: 0 }, { x: w * 1.1, y: w * .45 }]], o));
    World.add(world, statics);
  }
  function make(spec, x, y) {
    const { Bodies, Body } = M, m = METAL[spec.metal], s = small() ? clamp(W * .17, 56, 86) : clamp(W * .075, 66, 112);
    const o = { restitution: m.e, density: m.d, friction: m.f, frictionAir: .004, sleepThreshold: 70, slop: .04 };
    let b;
    switch (spec.shape) {
      case 'hex': b = Bodies.polygon(x, y, 6, s * .62, o); break;
      case 'disc': b = Bodies.circle(x, y, s * .54, o); break;
      case 'slab': b = Bodies.rectangle(x, y, s * 1.5, s * .8, Object.assign({ chamfer: { radius: 12 } }, o)); break;
      case 'bar': b = Bodies.rectangle(x, y, s * .7, s * 1.3, Object.assign({ chamfer: { radius: 12 } }, o)); break;
      case 'oct': b = Bodies.polygon(x, y, 8, s * .62, o); break;
      case 'pill': b = Bodies.rectangle(x, y, s * 1.4, s * .62, Object.assign({ chamfer: { radius: s * .29 } }, o)); break;
      default: b = Bodies.rectangle(x, y, s * .95, s * .95, Object.assign({ chamfer: { radius: 14 } }, o));
    }
    b.tok = { spec, m, s, label: spec.n };
    Body.setAngle(b, (Math.random() - .5) * 1.4); Body.setAngularVelocity(b, (Math.random() - .5) * .14);
    return b;
  }
  function spawnAll() {
    spawnTimers.forEach(clearTimeout); spawnTimers = [];
    SPEC.forEach((sp, i) => {
      const drop = () => { const b = make(sp, W * (.16 + .68 * Math.random()), -90 - Math.random() * 60); bodies.push(b); M.World.add(world, b); };
      if (reduce) { const b = make(sp, W * (.12 + .76 * (i + .5) / SPEC.length), H * .5 + (i % 2) * 30); bodies.push(b); M.World.add(world, b); }
      else spawnTimers.push(setTimeout(drop, 350 + i * 330));
    });
    if (reduce) for (let k = 0; k < 300; k++) M.Engine.update(engine, 1000 / 60);
  }
  function init() {
    if (started) return; started = true;
    const { Engine, Events } = M; size();
    engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 6 }); engine.gravity.y = 1.15; world = engine.world;
    walls(); spawnAll(); bind(); update();
    new ResizeObserver(() => { const ow = W, oh = H; size(); if (world) { walls(); bodies.forEach(b => { if (b.position.x > W - 20 || b.position.y > H) M.Body.setPosition(b, { x: clamp(b.position.x, 40, W - 40), y: Math.min(b.position.y, H - 60) }); }); } draw(); }).observe(box);
  }
  /* ---------- drawing ---------- */
  function lampPos() { const r = cv.getBoundingClientRect(), L = window.Lamp; return L ? [L.x - r.left, L.y - r.top] : [W * .5, -200]; }
  function pathOf(vs, cx, cy, k) { ctx.beginPath(); vs.forEach((v, i) => { const x = cx + (v.x - cx) * k, y = cy + (v.y - cy) * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
  function draw() {
    if (!W) return; ctx.clearRect(0, 0, W, H);
    const [lx, ly] = lampPos();
    // soft shadows on the wall, offset away from the lamp
    bodies.forEach(b => {
      const dx = b.position.x - lx, dy = b.position.y - ly, d = Math.hypot(dx, dy) || 1, off = clamp(7000 / (d + 160), 10, 46);
      ctx.save(); ctx.translate(dx / d * off, dy / d * off); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.fillStyle = 'rgba(0,0,0,.42)'; pathOf(b.vertices, b.position.x, b.position.y, 1); ctx.fill(); ctx.restore();
    });
    bodies.forEach(b => {
      const t = b.tok, m = t.m, cx = b.position.x, cy = b.position.y, dx = lx - cx, dy = ly - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, r = t.s * .62;
      const g = ctx.createLinearGradient(cx + ux * r, cy + uy * r, cx - ux * r, cy - uy * r);
      g.addColorStop(0, m.hi); g.addColorStop(.5, m.mid); g.addColorStop(1, m.lo);
      pathOf(b.vertices, cx, cy, 1); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,236,200,.38)'; ctx.stroke();
      // a dished face: the same shape, a little smaller, lit from the other side
      const g2 = ctx.createLinearGradient(cx - ux * r, cy - uy * r, cx + ux * r, cy + uy * r);
      g2.addColorStop(0, m.hi); g2.addColorStop(1, m.lo);
      pathOf(b.vertices, cx, cy, .84); ctx.globalAlpha = .55; ctx.fillStyle = g2; ctx.fill(); ctx.globalAlpha = 1;
      // specular spot on the lamp side
      const sp = ctx.createRadialGradient(cx + ux * r * .5, cy + uy * r * .5, 0, cx + ux * r * .5, cy + uy * r * .5, r * .75);
      sp.addColorStop(0, 'rgba(255,248,230,.55)'); sp.addColorStop(1, 'rgba(255,248,230,0)');
      pathOf(b.vertices, cx, cy, .96); ctx.fillStyle = sp; ctx.fill();
      // engraved name: a light edge on the lamp side, the ink, and the token's own rotation
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(b.angle);
      let fs = t.s * (t.label.length > 5 ? .2 : t.label.length > 2 ? .25 : .42); ctx.font = '700 ' + fs + 'px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const maxW = t.s * (t.spec.shape === 'bar' ? .52 : .78); while (ctx.measureText(t.label).width > maxW && fs > 9) { fs -= 1; ctx.font = '700 ' + fs + 'px Cinzel, Georgia, serif'; }
      const lx2 = Math.cos(-b.angle) * ux - Math.sin(-b.angle) * uy, ly2 = Math.sin(-b.angle) * ux + Math.cos(-b.angle) * uy;
      ctx.fillStyle = 'rgba(255,240,210,.5)'; ctx.fillText(t.label, -lx2 * 1.3, -ly2 * 1.3 + 1);
      ctx.fillStyle = m.ink; ctx.fillText(t.label, lx2 * .6, ly2 * .6);
      ctx.restore();
    });
  }
  /* ---------- loop ---------- */
  function update() {
    if (running) return; running = true; last = performance.now();
    const f = now => {
      if (!running) return; raf = requestAnimationFrame(f);
      const dt = Math.min(50, now - last); last = now; acc += dt;
      while (acc >= 1000 / 60) { nudge(); M.Engine.update(engine, 1000 / 60); acc -= 1000 / 60; }
      draw();
    };
    raf = requestAnimationFrame(f);
  }
  function halt() { running = false; cancelAnimationFrame(raf); }
  function nudge() {   // the pointer, passing over, pushes tokens gently away
    if (!ptr || drag) return;
    bodies.forEach(b => { const dx = b.position.x - ptr.x, dy = b.position.y - ptr.y, d = Math.hypot(dx, dy); if (d < 110 && d > 1) { M.Sleeping.set(b, false); const f = (1 - d / 110) * .00055 * b.mass; M.Body.applyForce(b, b.position, { x: dx / d * f, y: dy / d * f - f * .35 }); } });
  }
  /* ---------- picking things up ---------- */
  function at(x, y) { for (let i = bodies.length - 1; i >= 0; i--) if (M.Vertices.contains(bodies[i].vertices, { x, y })) return bodies[i]; return null; }
  function grab(x, y) {
    const hit = at(x, y); if (!hit) return null;
    M.Sleeping.set(hit, false);
    const a = -hit.angle, dx = x - hit.position.x, dy = y - hit.position.y;
    const c = M.Constraint.create({ pointA: { x, y }, bodyB: hit, pointB: { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }, stiffness: .2, damping: .14, length: 0 });
    M.World.add(world, c); cv.classList.add('drag'); hint.classList.add('gone');
    return { c, hit };
  }
  function move(x, y) { if (drag) drag.c.pointA = { x, y }; }
  function release() {
    if (!drag) return;
    M.World.remove(world, drag.c); const v = drag.hit.velocity, sp = Math.hypot(v.x, v.y); if (sp > 34) M.Body.setVelocity(drag.hit, { x: v.x / sp * 34, y: v.y / sp * 34 });
    drag = null; cv.classList.remove('drag');
  }
  const local = (cx, cy) => { const r = cv.getBoundingClientRect(); return [cx - r.left, cy - r.top]; };
  function bind() {
    cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; const [x, y] = local(e.clientX, e.clientY); drag = grab(x, y); if (drag) { cv.setPointerCapture(e.pointerId); e.preventDefault(); } });
    cv.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const [x, y] = local(e.clientX, e.clientY); ptr = { x, y }; if (drag) move(x, y); else cv.style.cursor = at(x, y) ? 'grab' : ''; });
    cv.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') release(); });
    cv.addEventListener('pointercancel', () => release());
    cv.addEventListener('pointerleave', () => { ptr = null; });
    // touch: a gesture that begins on a token is ours (and does not scroll the page); anywhere else it scrolls as usual
    cv.addEventListener('touchstart', e => {
      const t = e.changedTouches[0], [x, y] = local(t.clientX, t.clientY), g = grab(x, y);
      if (g) { drag = g; touchId = t.identifier; e.preventDefault(); }
    }, { passive: false });
    cv.addEventListener('touchmove', e => { if (!drag) return; for (const t of e.changedTouches) if (t.identifier === touchId) { const [x, y] = local(t.clientX, t.clientY); move(x, y); e.preventDefault(); } }, { passive: false });
    const tend = e => { if (!drag) return; for (const t of e.changedTouches) if (t.identifier === touchId) { release(); touchId = null; } };
    cv.addEventListener('touchend', tend); cv.addEventListener('touchcancel', tend);
    setTimeout(() => hint.classList.add('gone'), 14000);
  }
  /* ---------- only while it is on (or near) the screen ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { loadMatter(() => { init(); if (started && !running && !document.hidden) update(); }); }
    else if (started) halt();
  }), { rootMargin: '300px 0px' });
  io.observe(box);
  document.addEventListener('visibilitychange', () => { if (document.hidden) halt(); else if (started) { const r = box.getBoundingClientRect(); if (r.bottom > -300 && r.top < innerHeight + 300) update(); } });
})();
