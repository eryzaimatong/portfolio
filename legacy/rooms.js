/* Rooms: navigation, scroll-linked scenes, the hero's pressable letters, the project viewer, and the small interactions.
   Scrolling is native; nothing here intercepts the wheel, touch or keys. Scroll position only drives CSS variables.
   All timing and springs come from FX (fx.js). */
(() => {
  const root = document.documentElement, body = document.body, FX = window.FX || { on: false, reduce: true };
  const reduce = FX.reduce;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const small = () => matchMedia('(max-width:860px)').matches;
  const raf = (() => { let q = null; return fn => { q = fn; requestAnimationFrame(() => { if (q) { const f = q; q = null; f(); } }); }; })();

  /* ---------- menu ---------- */
  const links = $('#links'), menuBtn = $('#menuBtn');
  const setMenu = open => { links.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); };
  menuBtn.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- availability chip (a disclosure) ---------- */
  const statusBtn = $('.status'), statusPop = $('#statusPop');
  if (statusBtn && statusPop) {
    const isOpen = () => statusBtn.getAttribute('aria-expanded') === 'true';
    const setOpen = o => statusBtn.setAttribute('aria-expanded', String(o));
    statusBtn.addEventListener('click', () => setOpen(!isOpen()));
    document.addEventListener('click', e => { if (isOpen() && !e.target.closest('.avail')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { setOpen(false); statusBtn.focus(); } });
    statusPop.addEventListener('focusout', e => { if (isOpen() && !(e.relatedTarget && e.relatedTarget.closest('.avail'))) setOpen(false); });
  }

  /* ---------- sections: mood, current link, indicator, address bar ---------- */
  const sections = $$('main > section'), navLinks = $$('a', links), ind = $('#ind');
  let current = '', spyReady = !location.hash;
  function moveInd(a, instant) {
    if (!ind || !a || small()) return;
    const lr = links.getBoundingClientRect(), r = a.getBoundingClientRect(), x = r.left - lr.left + 2, w = r.width - 4;
    if (FX.on && !instant && ind.style.opacity === '1') FX.animate(ind, { x, width: w }, FX.spring.lift);
    else { ind.style.transform = 'translateX(' + x + 'px)'; ind.style.width = w + 'px'; ind.style.opacity = 1; }
  }
  function setCurrent(id) {
    if (id === current) return; current = id;
    body.dataset.tone = ({ home: 'dark', about: 'paper', projects: 'copper', skills: 'dark', experience: 'paper2', leadership: 'ochre', contact: 'copper' })[id] || 'dark';
    navLinks.forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); if (on) moveInd(a); });
    if (spyReady && history.replaceState && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }
  addEventListener('resize', () => { const a = navLinks.find(x => x.classList.contains('active')); if (a) moveInd(a, true); }, { passive: true });

  /* ---------- scroll-linked variables ---------- */
  const home = $('#home'), contact = $('#contact');
  function spy() { const vh = innerHeight; let id = sections[0].id; sections.forEach(s => { if (s.getBoundingClientRect().top <= vh * .4) id = s.id; }); setCurrent(id); }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; spy(); }); } }, { passive: true });
  if (FX.on) {
    FX.scroll(p => root.style.setProperty('--gp', p.toFixed(4)));
    FX.scroll(p => root.style.setProperty('--hp', p.toFixed(4)), { target: home, offset: ['start start', 'end end'] });
    FX.scroll(p => root.style.setProperty('--dawn', ease(clamp(p, 0, 1)).toFixed(3)), { target: contact, offset: ['start end', 'end end'] });
    $$('.plate.portrait').forEach(el => FX.scroll(p => el.style.setProperty('--py', ((p - .5) * -70).toFixed(1)), { target: el, offset: ['start end', 'end start'] }));
  } else {
    root.style.setProperty('--dawn', '.7');
    addEventListener('scroll', () => root.style.setProperty('--gp', (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4)), { passive: true });
  }
  spy();
  if (location.hash) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    addEventListener('load', () => { if (t) t.scrollIntoView({ behavior: 'auto' }); spyReady = true; spy(); });
  }

  /* ---------- the hero: a name of pressable letters ---------- */
  const letters = [];
  $$('[data-split]').forEach(el => {
    const t = el.textContent; el.textContent = '';
    [...t].forEach(ch => { if (ch === ' ') el.append(' '); else { const s = document.createElement('span'); s.className = 'hl'; s.textContent = ch; s.dataset.ch = ch.toLowerCase(); el.append(s); letters.push(s); } });
  });
  if (FX.on && letters.length) {
    // the lamp comes up, then the letters are struck into the surface one after another
    FX.animate(letters, { opacity: [0, 1], transform: ['translateY(-.5em) scale(1.12)', 'translateY(0em) scale(1)'] }, { delay: FX.stagger(.055, { startDelay: .55 }), ...FX.spring.land, opacity: { duration: .22 } })
      .finished.then(() => letters.forEach(l => { l.style.transform = ''; l.style.opacity = 1; }));
  }
  const heroHint = $('.hero-hint');
  const heroVisible = () => (parseFloat(getComputedStyle(root).getPropertyValue('--hp')) || 0) < .55;
  function tap(l) { if (!FX.on) return; FX.press(l); setTimeout(() => FX.release(l), 130); if (navigator.vibrate) { try { navigator.vibrate(6); } catch (e) { } } if (heroHint) heroHint.style.display = 'none'; }
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || !letters.length || !heroVisible()) return;
    raf(() => letters.forEach(l => { const r = l.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); l.style.setProperty('--q', (Math.max(0, 1 - d / 230) * .75).toFixed(2)); }));
  }, { passive: true });
  home.addEventListener('pointerleave', () => letters.forEach(l => l.style.setProperty('--q', 0)));
  home.addEventListener('pointerdown', e => { const l = document.elementFromPoint(e.clientX, e.clientY); if (l && l.classList && l.classList.contains('hl')) tap(l); });
  addEventListener('keydown', e => {   // a small discovery: type a letter of the name and it is pressed
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || !heroVisible()) return;
    const t = e.target; if (t && (t.closest && t.closest('input,textarea,select,[contenteditable],.overlay.open'))) return;
    const hit = letters.filter(l => l.dataset.ch === e.key.toLowerCase()); hit.forEach(tap);
  });

  /* ---------- plates and the portrait lean toward the pointer ---------- */
  if (FX.on) {
    $$('[data-tilt]').forEach(el => {
      const deep = el.classList.contains('portrait') ? 1.4 : 1;
      el.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return; const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        FX.animate(el, { transform: 'perspective(1000px) rotateX(' + (-y * 5 * deep).toFixed(2) + 'deg) rotateY(' + (x * 6 * deep).toFixed(2) + 'deg)' }, FX.spring.lift);
      });
      el.addEventListener('pointerleave', () => FX.animate(el, { transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' }, FX.spring.release));
    });
    $$('.btn-lamp').forEach(b => FX.magnet(b, 5));
    FX.magnet($('.key-enter'), 5);
    // tags swing once as they arrive; seals turn into place
    FX.inView('.tags', () => { $$('.tag').forEach((t, i) => FX.animate(t, { rotate: [0, 3.4, -2.2, 1.2, 0] }, { duration: 1.7, delay: .25 + i * .13, ease: 'easeOut' })); }, { amount: .5 });
    $$('.seal-card').forEach(c => FX.inView(c, () => { const t = $('.seal svg>text', c); if (t) FX.animate(t, { transform: ['rotate(-200deg)', 'rotate(0deg)'] }, { ...FX.spring.settle, delay: .2 }); }, { amount: .5 }));
  }

  /* ---------- projects: an index and a viewer ---------- */
  const viewer = $('#viewer');
  if (viewer) {
    const tabs = $$('.v-item', viewer), panels = $$('.v-panel', viewer);
    let cur = 'rewatch', paused = false, pauseUntil = 0, busy = false;
    const panelOf = k => panels.find(p => p.dataset.p === k);
    $$('.v-frame', viewer).forEach(f => { f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-haspopup', 'dialog'); f.setAttribute('aria-label', 'Open ' + (f.dataset.open === 'aura' ? 'AURA' : 'Re:Watch') + ' project details');
      const open = () => window.Dialogs && Dialogs.openProject(f.dataset.open, f);
      f.addEventListener('click', open); f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }); });
    function select(k, focus) {
      if (k === cur || busy) return; busy = true;
      const oldP = panelOf(cur), newP = panelOf(k); cur = k;
      tabs.forEach(t => { const on = t.dataset.p === k; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
      const swap = () => {
        oldP.hidden = true; newP.hidden = false; oldP.style.opacity = oldP.style.transform = '';
        $$('.shots img', newP).forEach(i => { i.loading = 'eager'; });
        if (FX.on) { FX.animate(newP, { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] }, { duration: .55, ease: FX.ease.out }).finished.then(() => { newP.style.transform = ''; busy = false; }); const top = $('.shots img.top', newP); if (top) FX.wipe(top, null, 'right'); }
        else busy = false;
      };
      if (FX.on) FX.animate(oldP, { opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-14px)'] }, { duration: .24, ease: FX.ease.inOut }).finished.then(swap); else swap();
    }
    tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.p)));
    viewer.querySelector('.v-list').addEventListener('keydown', e => {
      const i = tabs.findIndex(t => t.dataset.p === cur); let n = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length; else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = tabs.length - 1;
      if (n >= 0) { e.preventDefault(); select(tabs[n].dataset.p, true); }
    });
    // screens inside a project: a mask wipes the next one in
    panels.forEach(p => {
      const imgs = $$('.shots img', p), dots = $$('.v-dots button', p), cap = $('.v-cap', p);
      let idx = 0, moving = false;
      p._show = (n, manual) => {
        n = (n + imgs.length) % imgs.length; if (n === idx || moving) return; moving = true;
        if (manual) pauseUntil = performance.now() + 12000;
        const from = imgs[idx], to = imgs[n]; to.loading = 'eager'; to.classList.add('next');
        dots.forEach((d, k) => { d.classList.toggle('on', k === n); d.setAttribute('aria-current', k === n ? 'true' : 'false'); }); cap.textContent = dots[n].getAttribute('aria-label');
        const run = () => FX.wipe(to, () => { from.classList.remove('top'); to.classList.remove('next'); to.classList.add('top'); idx = n; moving = false; }, n > idx ? 'right' : 'down');
        if (to.complete && to.naturalWidth) run(); else { to.onload = run; to.onerror = run; }
      };
      p._next = () => p._show(idx + 1, false);
      dots.forEach((d, k) => d.addEventListener('click', () => p._show(k, true)));
    });
    viewer.addEventListener('pointerenter', () => { paused = true; }); viewer.addEventListener('pointerleave', () => { paused = false; });
    viewer.addEventListener('focusin', () => { paused = true; }); viewer.addEventListener('focusout', () => { paused = false; });
    let inV = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inV = es[0].isIntersecting; }, { threshold: .35 }).observe(viewer);
    if (!reduce) setInterval(() => { if (inV && !paused && !document.hidden && performance.now() > pauseUntil && !(window.Dialogs && Dialogs.isOpen())) { const p = panelOf(cur); if (p && p._next) p._next(); } }, 4800);
  }
})();
