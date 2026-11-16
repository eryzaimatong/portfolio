/* NEO//FRAME: scene choreography.
   GSAP + ScrollTrigger drive everything that follows the scroll (the opening, parallax, the bands between scenes, the timeline);
   Motion (fx.js) drives the components (keys, dialogs). Scrolling itself is always native: nothing here pins a scene, blocks the wheel
   or makes anyone wait. With reduced motion there is no opening, no parallax and no scrubbed transitions; everything is simply shown. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const small = () => matchMedia('(max-width:860px)').matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const hasG = !!(G && ST);
  if (hasG) G.registerPlugin(ST);
  let introTl = null;
  setTimeout(() => { root.classList.add('js-ready'); if (introTl) introTl.progress(1); }, 3500);   // never leave the opening cover or hidden copy on screen

  /* ---------- the availability chip (a disclosure) ---------- */
  const statusBtn = $('.status'), statusPop = $('#statusPop');
  if (statusBtn && statusPop) {
    const isOpen = () => statusBtn.getAttribute('aria-expanded') === 'true';
    const setOpen = o => statusBtn.setAttribute('aria-expanded', String(o));
    statusBtn.addEventListener('click', () => setOpen(!isOpen()));
    document.addEventListener('click', e => { if (isOpen() && !e.target.closest('.avail')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setOpen(false); statusBtn.focus(); } });
    statusPop.addEventListener('focusout', e => { if (isOpen() && !(e.relatedTarget && e.relatedTarget.closest('.avail'))) setOpen(false); });
  }

  /* ---------- the city index (full-screen section list) ---------- */
  const idxBtn = $('#idxBtn'), idx = $('#cityIndex');
  const setIdx = open => {
    idx.classList.toggle('open', open); idx.hidden = false; idxBtn.setAttribute('aria-expanded', String(open));
    $('.idx-tx', idxBtn).textContent = open ? 'Close' : 'Index';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('a', idx).focus({ preventScroll: true }), 120); else idxBtn.focus({ preventScroll: true });
  };
  idxBtn.addEventListener('click', () => setIdx(!idx.classList.contains('open')));
  idx.addEventListener('click', e => { if (e.target.closest('a')) { setIdx(false); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && idx.classList.contains('open')) setIdx(false); });

  /* ---------- the project archive, built from the same data the case-study dialogs use ---------- */
  const archive = $('#archive'), PD = window.ProjectData;
  if (archive && PD) {
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    archive.innerHTML = ['rewatch', 'aura'].map((k, i) => {
      const p = PD[k], phone = k === 'aura';
      const shots = (phone ? p.gallery : p.gallery.slice(0, 3)).map((g, n) => '<button class="shot' + (!phone && n === 0 ? ' first' : '') + '" type="button" data-open-project="' + k + '" aria-haspopup="dialog" aria-label="Open the ' + esc(p.title) + ' case study: ' + esc(g[1]) + '"><img src="' + esc(g[0]) + '" alt="' + esc(p.title) + ': ' + esc(g[1]) + '" loading="lazy" decoding="async" width="' + (phone ? 390 : 1000) + '" height="' + (phone ? 844 : 625) + '"><span class="cap" aria-hidden="true">' + esc(g[1]) + '</span></button>').join('');
      return '<article class="op" data-p="' + k + '" aria-labelledby="op-' + k + '">' +
        '<header class="op-head"><span class="op-idx" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><h3 class="op-title" id="op-' + k + '">' + esc(p.title) + '</h3><p class="op-meta mono">' + esc(p.eyebrow) + '</p></header>' +
        '<div class="op-vis ' + (phone ? 'devices' : 'reel') + '">' + shots + '</div>' +
        '<div class="op-body"><div><p class="op-lead">' + esc(p.lead) + '</p><dl class="op-facts">' + p.facts.map(f => '<div><dt class="mono">' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') + '</dl></div>' +
        '<div><div class="op-cols"><section><h4 class="mono">The problem</h4><p>' + esc(p.problem) + '</p></section><section><h4 class="mono">What I built</h4><p>' + esc(p.built) + '</p></section></div><ul class="chips">' + p.stack.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></div>' +
        '<div class="op-actions"><button class="btn" type="button" data-open-project="' + k + '" aria-haspopup="dialog">Open the case study <span aria-hidden="true">→</span></button></div></div></article>';
    }).join('');
  }

  /* ---------- about: profile fields and the portrait ---------- */
  const card = $('#portraitCard'), fields = $$('#fields > div'), aboutGrid = $('.about-grid');
  if (card && fields.length) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:2';
    const path = document.createElementNS(NS, 'path'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#E51B36'); path.setAttribute('stroke-width', '2'); path.style.filter = 'drop-shadow(0 0 4px rgba(229,27,54,.8))'; path.setAttribute('pathLength', '1'); path.style.strokeDasharray = '1'; path.style.strokeDashoffset = '1';
    svg.appendChild(path); aboutGrid.style.position = 'relative'; aboutGrid.appendChild(svg);
    const show = f => {
      fields.forEach(x => x.classList.toggle('on', x === f)); card.classList.add('alt');
      const g = aboutGrid.getBoundingClientRect(), a = f.getBoundingClientRect(), c = $('.pf', card).getBoundingClientRect();
      const x1 = a.left - g.left, y1 = a.top - g.top + 22, x2 = c.right - g.left, y2 = c.top - g.top + c.height * .42, mx = (x1 + x2) / 2;
      path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' H' + (mx + 18) + ' L' + (mx - 6) + ' ' + y2 + ' H' + x2);
      if (hasG && !reduce) { G.killTweensOf(path); G.to(path, { strokeDashoffset: 0, duration: .5, ease: 'power2.out' }); } else path.style.strokeDashoffset = 0;
    };
    const hide = () => { fields.forEach(x => x.classList.remove('on')); card.classList.remove('alt'); if (hasG && !reduce) { G.killTweensOf(path); G.to(path, { strokeDashoffset: 1, duration: .3 }); } else path.style.strokeDashoffset = 1; };
    fields.forEach(f => { f.addEventListener('pointerenter', () => show(f)); f.addEventListener('pointerleave', hide); f.addEventListener('focus', () => show(f)); f.addEventListener('blur', hide); });
  }

  /* ---------- the city rain: a light canvas, drawn only while a city is on screen ---------- */
  const rain = $('.rain');
  if (rain && !reduce) {
    const ctx = rain.getContext('2d'); let W = 0, H = 0, drops = [], run = false, raf = 0, last = 0;
    const size = () => { W = rain.width = rain.clientWidth; H = rain.height = rain.clientHeight; drops = Array.from({ length: small() ? 50 : 110 }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 10 + Math.random() * 18, v: 520 + Math.random() * 380 })); };
    const tick = t => {
      if (!run) return; raf = requestAnimationFrame(tick); const dt = Math.min(.05, (t - last) / 1000); last = t;
      ctx.clearRect(0, 0, W, H); ctx.strokeStyle = 'rgba(200,205,220,.32)'; ctx.lineWidth = 1; ctx.beginPath();
      drops.forEach(d => { d.y += d.v * dt; d.x -= d.v * dt * .12; if (d.y > H) { d.y = -d.l; d.x = Math.random() * (W + 80); } ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * .12, d.y + d.l); });
      ctx.stroke();
    };
    size(); addEventListener('resize', size, { passive: true });
    new IntersectionObserver(es => { const on = es[0].isIntersecting && !document.hidden; if (on && !run) { run = true; last = performance.now(); raf = requestAnimationFrame(tick); } else if (!on) { run = false; cancelAnimationFrame(raf); } }, { threshold: 0 }).observe($('.hero'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) { run = false; cancelAnimationFrame(raf); } });
  }

  if (!hasG) { root.classList.add('js-ready'); return; }

  /* ---------- 01 the opening: the city awakens (about two seconds, and it can be skipped by scrolling) ---------- */
  const lyrs = $$('.hero .lyr');
  if (!reduce) {
    const tl = G.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => root.classList.add('js-ready') });
    tl.set('.blackout', { opacity: 1 }).set('.hero .char-wrap', { clipPath: 'inset(0 100% 0 0)' })
      .to('.blackout', { opacity: 0, duration: .8, ease: 'power1.inOut' }, .2)
      .fromTo(lyrs, { filter: 'brightness(.15)' }, { filter: 'brightness(1)', duration: 1.1, stagger: .1 }, .25)
      .fromTo('.sweep', { xPercent: -130 }, { xPercent: 130, duration: 1.3, ease: 'power2.inOut' }, .6)
      .to('.hero .char-wrap', { clipPath: 'inset(0 0% 0 0)', duration: .95, ease: 'power3.inOut' }, .85)
      .fromTo('.hero .char', { xPercent: -5, scale: 1.05 }, { xPercent: 0, scale: 1, duration: 1.2 }, .85)
      .from('.hero .name .w', { yPercent: 115, duration: .7, stagger: .07 }, 1.0)
      .from('.hero .kicker, .hero .intro, .hero .hero-meta, .hero .scroll-cue', { opacity: 0, y: 16, duration: .6, stagger: .09 }, 1.35);
    introTl = tl;
    const skip = () => { if (tl.progress() < 1) tl.progress(1); };
    addEventListener('wheel', skip, { once: true, passive: true }); addEventListener('touchstart', skip, { once: true, passive: true }); addEventListener('keydown', skip, { once: true });
    // idle life: the character breathes, very slightly
    G.to('.hero .char', { y: -7, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    // pointer parallax: each layer moves by its own depth
    if (matchMedia('(pointer:fine)').matches) {
      const q = (sel, k) => ({ x: G.quickTo(sel, 'x', { duration: .9, ease: 'power3.out' }), y: G.quickTo(sel, 'y', { duration: .9, ease: 'power3.out' }), k });
      const L = [q('.hero .lyr.far', 6), q('.hero .lyr.mid', 14), q('.hero .lyr.near', 28), q('.hero .char-wrap', -12)];
      $('.hero').addEventListener('pointermove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; L.forEach(l => { l.x(nx * l.k * -2); l.y(ny * l.k * -1); }); });
    }
  } else root.classList.add('js-ready');

  /* ---------- section state: current link, indicator, scene numbers ---------- */
  const NAMES = { home: ['01', 'Home'], about: ['02', 'About'], projects: ['03', 'Projects'], experience: ['04', 'Experience'], skills: ['05', 'Tech Stack'], contact: ['06', 'Contact'] };
  const links = $$('#links a'), ind = $('#ind'); let current = '';
  const moveInd = (a, instant) => { if (!a || small()) return; const lr = $('#links').getBoundingClientRect(), r = a.getBoundingClientRect(); G.to(ind, { x: r.left - lr.left, width: r.width, opacity: 1, duration: instant || reduce ? 0 : .5, ease: 'power3.out' }); };
  const setCurrent = id => {
    if (id === current) return; current = id;
    links.forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); if (on) moveInd(a); });
    if (!links.some(a => a.classList.contains('active'))) G.to(ind, { opacity: 0, duration: .2 });
    const n = NAMES[id]; if (n) { $('#siNum').textContent = n[0]; $('#siName').textContent = n[1]; }
    if (location.hash !== '#' + id && history.replaceState && spy) history.replaceState(null, '', '#' + id);
  };
  let spy = !location.hash;
  $$('main > .scene').forEach(s => ST.create({ trigger: s, start: 'top 45%', end: 'bottom 45%', onToggle: self => { if (self.isActive) setCurrent(s.id); } }));
  addEventListener('resize', () => { const a = links.find(x => x.classList.contains('active')); if (a) moveInd(a, true); }, { passive: true });
  if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); addEventListener('load', () => { if (t) t.scrollIntoView({ behavior: 'auto' }); spy = true; ST.refresh(); }); }

  if (reduce) { $$('.ms').forEach(m => m.classList.add('on')); $('.rail .fill').style.transform = 'scaleY(1)'; $$('.xfer').forEach(x => x.style.display = 'none'); return; }

  /* ---------- hero to about: the city darkens, the character slips out of focus ---------- */
  G.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero .dim', { opacity: .88, ease: 'none' }, 0)
    .to('.hero .char', { filter: 'blur(10px)', ease: 'none' }, 0)
    .to('.hero .char-wrap', { opacity: .35, yPercent: 6, ease: 'none' }, 0)
    .to('.hero .lyr.near', { yPercent: 8, ease: 'none' }, 0);

  /* ---------- about: the profile arrives in readable groups ---------- */
  G.from('.portrait-card', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power3.inOut', scrollTrigger: { trigger: '.about', start: 'top 60%', once: true } });
  G.from('.about .label, .about .h-big, .about .lead-line', { opacity: 0, y: 24, duration: .7, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.about', start: 'top 60%', once: true } });
  G.from('.bio .grp span', { opacity: 0, y: 18, duration: .6, stagger: .16, ease: 'power3.out', scrollTrigger: { trigger: '.bio', start: 'top 82%', once: true } });
  G.from('#fields > div', { opacity: 0, y: 16, duration: .5, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '#fields', start: 'top 88%', once: true } });

  /* ---------- the bands between scenes (scrubbed; they never block scrolling) ---------- */
  const band = (sel, build) => { const el = $(sel); if (!el) return; const tl = G.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .6 } }); build(tl, el); };
  band('.xf-panels', (tl, el) => { const p = $$('i', el); tl.to(p, { xPercent: 0, stagger: .08, ease: 'none', duration: .5 }).to(p, { xPercent: 102, stagger: .08, ease: 'none', duration: .5 }); });
  band('.xf-lines', (tl, el) => { const r = $$('i', el).slice(0, 4), line = $('i:nth-child(5)', el); G.set(r, { transformOrigin: '50% 50%' }); G.set(line, { transformOrigin: '50% 0', scaleY: 0 }); tl.to(r, { scaleY: .02, ease: 'none', stagger: .05 }, 0).to(r, { opacity: 0, ease: 'none' }, .6).to(line, { scaleY: 1, ease: 'none' }, .3); });
  band('.xf-grid', (tl, el) => { const ps = $$('path', el); ps.forEach(p => { const l = p.getTotalLength ? p.getTotalLength() : 4000; p.style.strokeDasharray = l; p.style.strokeDashoffset = l; }); tl.to(ps, { strokeDashoffset: 0, ease: 'none' }, 0); });

  /* ---------- projects: each operation is struck onto the archive as it arrives ---------- */
  $$('.op').forEach(op => {
    G.from($$('.op-head > *', op), { opacity: 0, y: 30, duration: .7, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: op, start: 'top 75%', once: true } });
    G.from($$('.shot', op), { clipPath: 'inset(0 100% 0 0)', duration: .9, stagger: .12, ease: 'power3.inOut', scrollTrigger: { trigger: $('.op-vis', op), start: 'top 80%', once: true } });
    G.from($$('.op-body > *', op), { opacity: 0, y: 24, duration: .6, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: $('.op-body', op), start: 'top 82%', once: true } });
  });

  /* ---------- experience: the timeline draws as you scroll; milestones light up as you reach them ---------- */
  G.to('.rail .fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 70%', end: 'bottom 70%', scrub: .4 } });
  $$('.ms').forEach(m => ST.create({ trigger: m, start: 'top 72%', onEnter: () => m.classList.add('on'), onLeaveBack: () => m.classList.remove('on') }));

  /* ---------- tech stack: the keys settle in, and the keyboard recedes as you move on ---------- */
  G.from('.board .key', { opacity: 0, y: 14, duration: .4, stagger: { each: .012, from: 'start' }, ease: 'power2.out', scrollTrigger: { trigger: '.board', start: 'top 78%', once: true } });
  G.to('.board', { scale: .94, opacity: .3, y: -40, ease: 'none', scrollTrigger: { trigger: '.board', start: 'bottom 62%', end: 'bottom top', scrub: true } });

  /* ---------- contact: the lights dim, a red line traces to the address ---------- */
  G.to('.city.dusk', { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 85%', end: 'top 20%', scrub: true } });
  G.fromTo('.contact .lyr', { filter: 'brightness(1)' }, { filter: 'brightness(.35)', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top 50%', end: 'bottom bottom', scrub: true } });
  const tp = $('.trace path'); if (tp) { tp.setAttribute('pathLength', '1'); tp.style.strokeDasharray = '1'; tp.style.strokeDashoffset = '1'; G.to(tp, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', scrollTrigger: { trigger: '.contact-keys', start: 'top 85%', once: true } }); }
  G.from('.contact .h-huge', { opacity: 0, y: 40, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.contact', start: 'top 55%', once: true } });
  G.from('.contact .char-wrap', { clipPath: 'inset(100% 0 0 0)', duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: '.contact', start: 'top 55%', once: true } });
})();
