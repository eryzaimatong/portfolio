/* Page-level motion that lives in the DOM.
     Skills      "trace a project": a path runs through the technologies that project used
     Experience  a signal travels the timeline and lights each milestone in turn
   The point space (Home, About, Skills graph, timeline, Contact) lives in space.js. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  root.classList.add('js-motion');

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
  timeline(); lens();
})();
