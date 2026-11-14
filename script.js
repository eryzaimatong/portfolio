(() => {
  const scenes = [...document.querySelectorAll('.scene')];
  const links = [...document.querySelectorAll('.links a')];
  const seg = document.getElementById('segments');
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');
  const mobile = () => matchMedia('(max-width:860px)').matches;
  let cur = -1, locked = false;

  // progress segments
  scenes.forEach((s, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to ' + s.dataset.title);
    b.addEventListener('click', () => go(i));
    seg.appendChild(b);
  });

  // mobile menu
  menu.innerHTML = scenes.map((s, i) => `<a href="#${s.id}" data-go="${i}">${s.dataset.title}</a>`).join('');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // fireflies
  document.querySelectorAll('.fireflies').forEach(f => {
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.top = 35 + Math.random() * 50 + '%';
      d.style.animationDelay = -Math.random() * 6 + 's';
      d.style.animationDuration = 5 + Math.random() * 5 + 's';
      f.appendChild(d);
    }
  });

  function go(i, push = true) {
    if (i < 0 || i >= scenes.length || i === cur) return;
    const prev = cur;
    if (prev >= 0) {
      scenes[prev].classList.remove('active');
      scenes[prev].classList.add('leaving');
      const p = scenes[prev];
      setTimeout(() => p.classList.remove('leaving'), 700);
    }
    cur = i;
    document.body.classList.toggle('on-light', scenes[i].classList.contains('light'));
    scenes[i].scrollTop = 0;
    scenes[i].classList.add('active');
    [...seg.children].forEach((b, k) => b.classList.toggle('active', k === i));
    links.forEach((a, k) => a.classList.toggle('active', k === i));
    menu.querySelectorAll('a').forEach((a, k) => a.classList.toggle('active', k === i));
    document.getElementById('prev').disabled = i === 0;
    document.getElementById('next').disabled = i === scenes.length - 1;
    document.getElementById('prev').style.opacity = i === 0 ? .35 : 1;
    document.getElementById('next').style.opacity = i === scenes.length - 1 ? .35 : 1;
    if (push) history.replaceState(null, '', '#' + scenes[i].id);
    document.title = (i ? scenes[i].dataset.title + ' — ' : '') + 'Eryza Mae C. Imatong';
    setMenu(false);
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go]');
    if (t) { e.preventDefault(); go(+t.dataset.go); }
  });
  document.getElementById('prev').addEventListener('click', () => go(cur - 1));
  document.getElementById('next').addEventListener('click', () => go(cur + 1));

  const overlayOpen = () => document.querySelector('.overlay.open');

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeOverlays(); setMenu(false); return; }
    if (overlayOpen()) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  });

  // wheel (desktop only)
  addEventListener('wheel', e => {
    if (mobile() || locked || overlayOpen() || Math.abs(e.deltaY) < 30) return;
    locked = true; setTimeout(() => locked = false, 900);
    go(cur + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  // swipe (desktop touch / tablets)
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', e => {
    if (tx === null || mobile() || overlayOpen()) { tx = null; return; }
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 70) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // ---------- Projects ----------
  const projects = {
    rewatch: {
      eyebrow: 'Project 01 // Full-stack · Recommender', title: 'Re:Watch',
      lead: 'A recommendation app that picks movies, shows, and anime by how you feel, using a taste profile that updates as you rate.',
      facts: [['Role', 'Solo project'], ['Timeline', 'Aug 2026 to present'], ['Team', 'Team of 1']],
      buttons: [['View on GitHub', 'https://github.com/eryzaimatong'], ['Live demo', null]],
      results: [['10', "taste dimensions in each user's profile"], ['6,000', 'titles in the catalog'], ['3', 'services in the deployment (Vercel, Render, Neon)']],
      problem: 'Picking something to watch takes longer than watching it, and most apps recommend by genre instead of mood.',
      built: "I modeled each user's taste as ten dimensions, like comfort, slow-burn pacing, and found family. Onboarding choices and ratings update the profile live, and it drives the feed and the Similar Taste community view.",
      stack: ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'Vercel', 'Render', 'Neon', 'Claude (coding assistant)'],
      gallery: ['Home feed with mood shelves', 'TasteDNA radar profile', 'Your taste evolved chart'], other: 'aura'
    },
    aura: {
      eyebrow: 'Project 02 // Mobile app · AI styling · In progress', title: 'AURA',
      lead: 'A mobile app that gives style and appearance guidance, like face shape, makeup, and wardrobe suggestions, based on your own features.',
      facts: [['Role', 'Personal project'], ['Timeline', 'Sep 2026 to present'], ['Team', 'Team of 1']],
      buttons: [['View on GitHub', 'https://github.com/eryzaimatong']],
      results: [['4', 'core features planned (face shape, makeup, wardrobe, glow-up)']],
      problem: 'Online style advice is generic and rarely starts from your own features.',
      built: "I started with the design in Figma, then began building a React and Tailwind app wrapped for Android with Capacitor, with a FastAPI backend and Supabase for data. I'm adding the analysis features one at a time.",
      stack: ['React', 'Vite', 'Tailwind CSS', 'Capacitor', 'FastAPI', 'Supabase', 'Figma'],
      gallery: ['Home screen', 'Analysis result', 'Wardrobe suggestions'], other: 'rewatch'
    }
  };
  const ov = document.getElementById('projectOverlay');
  const body = document.getElementById('pdBody');
  function openProject(key) {
    const p = projects[key], o = projects[p.other];
    body.innerHTML = `<div class="pd">
      <p class="eyebrow">${p.eyebrow}</p><h2 id="pdTitle">${p.title}</h2><p class="lead">${p.lead}</p>
      <div class="facts">${p.facts.map(f => `<div><p>${f[0]}</p><p class="org">${f[1]}</p></div>`).join('')}</div>
      <div class="btns">${p.buttons.map((b, i) => b[1]
        ? `<a class="btn ${i ? 'btn-ghost' : 'btn-primary'}" href="${b[1]}" target="_blank" rel="noopener">${b[0]}</a>`
        : `<span class="btn btn-ghost" aria-disabled="true">${b[0]} · coming soon</span>`).join('')}</div>
      <section><h4>Results</h4><div class="results">${p.results.map(r => `<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div></section>
      <section><h4>The problem</h4><h3>Why it mattered</h3><p class="lead">${p.problem}</p></section>
      <section><h4>What I built</h4><h3>How I approached it</h3><p class="lead">${p.built}</p></section>
      <section><h4>Built with</h4><div class="chips">${p.stack.map(s => `<span>${s}</span>`).join('')}</div></section>
      <section><h4>Gallery</h4><div class="results">${p.gallery.map(g => `<div class="ph">${g}</div>`).join('')}</div></section>
      <button class="btn btn-ghost" id="pdOther">Other project &nbsp;→&nbsp; ${o.title}</button></div>`;
    ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false');
    ov.querySelector('.sheet').scrollTop = 0;
    document.getElementById('pdOther').onclick = () => openProject(p.other);
  }
  document.getElementById('pdBack').addEventListener('click', closeOverlays);
  ov.addEventListener('click', e => { if (e.target === ov) closeOverlays(); });

  const cards = [...document.querySelectorAll('.pcard')];
  cards.forEach(c => {
    const activate = () => {
      if (c.classList.contains('focus') || mobile()) openProject(c.dataset.project);
      else { cards.forEach(x => x.classList.toggle('focus', x === c)); }
    };
    c.addEventListener('click', activate);
    c.addEventListener('keydown', e => { if (e.key === 'Enter') activate(); });
  });

  // ---------- Certificates ----------
  const co = document.getElementById('certOverlay');
  const certs = {
    datacamp: ['assets/cert-datacamp.png', 'DataCamp Associate Data Analyst certificate'],
    cisco: ['assets/cert-cisco.png', 'Cisco Networking Academy Data Analytics Essentials certificate'],
    sql: ['assets/cert-sql.png', 'DataCamp Associate Data Analyst in SQL certificate']
  };
  document.querySelectorAll('[data-cert]').forEach(b => b.addEventListener('click', () => {
    const [src, alt] = certs[b.dataset.cert];
    const img = document.getElementById('certImg'); img.src = src; img.alt = alt;
    co.classList.add('open'); co.setAttribute('aria-hidden', 'false');
  }));
  document.getElementById('certClose').addEventListener('click', closeOverlays);
  co.addEventListener('click', e => { if (e.target === co) closeOverlays(); });

  function closeOverlays() {
    document.querySelectorAll('.overlay').forEach(o => { o.classList.remove('open'); o.setAttribute('aria-hidden', 'true'); });
  }

  // CV placeholders (résumé not yet linked)
  document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  // start
  const start = scenes.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
