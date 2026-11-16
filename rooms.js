/* Rooms: navigation, scroll-linked scenes, and the two project instruments.
   Scrolling is native; nothing here intercepts the wheel, touch or keys. Scroll position only drives CSS variables. */
(() => {
  const root = document.documentElement, body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);

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

  /* ---------- sections: mood, current link, address bar ---------- */
  const sections = $$('main > section');
  const navLinks = $$('a', links);
  let current = '', spyReady = !location.hash;
  function setCurrent(id) {
    if (id === current) return; current = id;
    body.className = body.className.replace(/\bmood-\S+/g, '').trim() + ' mood-' + id;
    navLinks.forEach(a => { const on = a.getAttribute('href') === '#' + id; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
    if (spyReady && history.replaceState && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }

  /* ---------- entrances that happen once: plates are struck, tags swing, seals turn ---------- */
  const once = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); once.unobserve(e.target); } }), { threshold: .3 });
  $$('.strike,.tags,.seal-card').forEach(el => once.observe(el));

  /* ---------- scroll-linked variables (one rAF-throttled listener) ---------- */
  const home = $('#home'), contact = $('#contact'), aura = $('#auraStage'), instr = $('#rwInstrument');
  let ticking = false;
  function scrollFrame() {
    ticking = false;
    const sy = scrollY, vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh);
    root.style.setProperty('--gp', (sy / max).toFixed(4));
    if (reduce) return;
    root.style.setProperty('--hp', clamp(sy / Math.max(1, home.offsetHeight - vh), 0, 1).toFixed(4));
    const cr = contact.getBoundingClientRect();
    root.style.setProperty('--dawn', ease(clamp((vh - cr.top) / (cr.height * .9), 0, 1)).toFixed(3));
    if (aura) { const r = aura.getBoundingClientRect(); aura.style.setProperty('--scan', clamp((vh * .9 - r.top) / (vh * .5), 0, 1).toFixed(3)); }
    if (instr) { const r = instr.getBoundingClientRect(); instr.style.setProperty('--pi', ease(clamp((vh - r.top) / (vh * .55), 0, 1)).toFixed(3)); }
    // current section: the last one whose top has passed 40% of the viewport
    let id = sections[0].id; sections.forEach(s => { if (s.getBoundingClientRect().top <= vh * .4) id = s.id; }); setCurrent(id);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(scrollFrame); } }, { passive: true });
  addEventListener('resize', () => { if (!ticking) { ticking = true; requestAnimationFrame(scrollFrame); } }, { passive: true });
  if (reduce) { root.style.setProperty('--dawn', '.7'); if (aura) aura.style.setProperty('--scan', '1'); if (instr) instr.style.setProperty('--pi', '1'); }
  scrollFrame();
  // a link with a hash (#about) lands on that room; only then does the address bar start following the scroll
  if (location.hash) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    addEventListener('load', () => { if (t) t.scrollIntoView({ behavior: 'auto' }); spyReady = true; scrollFrame(); });
  }

  /* ---------- Re:Watch instrument: ten dials, the project's real scoring arithmetic ---------- */
  function rewatch() {
    const M = window.RewatchModel, host = $('#rwDials');
    if (!M || !host) return;
    const start = M.PRESETS['Cozy'].slice();
    const vals = start.slice();
    host.innerHTML = M.TRAITS.map((t, i) => '<div class="dial" role="slider" tabindex="0" aria-label="' + t[1] + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(vals[i] * 100) + '" data-i="' + i + '"><span class="face"><i class="needle"></i><i class="hub"></i></span><b>' + t[1] + '</b><output>+0.0</output></div>').join('');
    const dials = $$('.dial', host), scoreEl = $('#rwScore');
    const fmt = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);
    function paint() {
      const r = M.rewatchScore(vals);
      scoreEl.textContent = r.score.toFixed(1);
      dials.forEach((d, i) => { d.style.setProperty('--v', vals[i]); d.setAttribute('aria-valuenow', String(Math.round(vals[i] * 100))); d.setAttribute('aria-valuetext', Math.round(vals[i] * 100) + ' percent, contributing ' + fmt(r.parts[i])); const o = $('output', d); o.textContent = fmt(r.parts[i]); o.classList.toggle('neg', r.parts[i] < 0); });
    }
    dials.forEach((d, i) => {
      let sx = 0, sy = 0, sv = 0, drag = false;
      d.addEventListener('pointerdown', e => { drag = true; sx = e.clientX; sy = e.clientY; sv = vals[i]; d.setPointerCapture(e.pointerId); d.focus({ preventScroll: true }); });
      d.addEventListener('pointermove', e => { if (!drag) return; vals[i] = clamp(sv + ((e.clientX - sx) - (e.clientY - sy)) / 170, 0, 1); paint(); });
      const end = () => { drag = false; };
      d.addEventListener('pointerup', end); d.addEventListener('pointercancel', end);
      d.addEventListener('keydown', e => {
        const k = e.key, s = e.shiftKey ? .1 : .03;
        if (k === 'ArrowRight' || k === 'ArrowUp') vals[i] = clamp(vals[i] + s, 0, 1);
        else if (k === 'ArrowLeft' || k === 'ArrowDown') vals[i] = clamp(vals[i] - s, 0, 1);
        else if (k === 'Home') vals[i] = 0; else if (k === 'End') vals[i] = 1; else return;
        e.preventDefault(); paint();
      });
    });
    paint();
  }
  rewatch();
})();
