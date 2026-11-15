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
      eyebrow: 'Project 01 // Recommender · Web app', title: 'Re:Watch',
      lead: 'Finds movies, TV, anime and K-drama by how you want to feel. Match scores come from a taste model I built, and every score lists the reasons that add up to it.',
      facts: [['Role', 'Solo project'], ['Timeline', 'Jul 2026 to present'], ['Status', 'Deployed']],
      buttons: [['View on GitHub', 'https://github.com/eryzaimatong/rewatch'], ['Live demo', 'https://rewatch-stories.vercel.app']],
      note: 'The free-tier backend sleeps when idle, so the first load can take a couple of minutes.',
      results: [['10', 'taste traits in every profile'], ['3', 'hosted services: Vercel, Render and Neon'], ['200', 'randomized trials in the test that checks every score equals the sum of its reasons']],
      problem: 'Recommenders usually rank by genre and popularity, so two titles with the same tag can feel nothing alike. Re:Watch is for people who scroll longer than they watch, and for groups choosing something together.',
      built: "Each title and each person is a ten-trait vector (family, nostalgia, pacing, humor, comfort and others). A title's vector is derived from TMDB genres and a keyword lexicon I wrote by hand. A person's profile is rebuilt by replaying their rating history, and a match score is the sum of per-trait contributions, so the reasons always add up to the number shown. Movie Night lets friends answer five questions on their own phones and ranks titles so agreement beats one strong veto.",
      decisions: [
        'Replay, not mutation: rebuilding the profile from the rating log makes re-rating and lexicon changes safe, and produces the taste-evolution timeline for free.',
        'Fixed scoring constants: a title shows the same percentage everywhere and does not drift when other titles are added.',
        'Contributions can go negative, so "tensions" are real, and rounding keeps the printed parts summing to the whole.',
        'Backend: Spring Boot, stateless JWT, Flyway migrations. Checks: JUnit, Playwright and axe-core accessibility audits, run in CI.'
      ],
      limits: 'Built and deployed: everything described above. Limits: the keyword lexicon is hand-written, not learned. Not done yet: an offline evaluation of the recommendations against held-out ratings, so I make no accuracy claim.',
      stack: ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'Flyway', 'Playwright', 'Vercel', 'Render', 'Neon', 'Claude (coding assistant)'],
      gallery: [['assets/rewatch-home.jpg', 'Re:Watch home with a match score'], ['assets/rewatch-match.jpg', 'A match explained trait by trait'], ['assets/rewatch-profile.jpg', 'Taste DNA profile and evolution'], ['assets/rewatch-night.jpg', 'Movie Night group results']],
      galleryNote: 'Screens from the running app. Poster art is a generated placeholder.',
      next: 'aura'
    },
    aura: {
      eyebrow: 'Project 02 // Mobile · In development', title: 'AURA',
      lead: 'A mobile app (in development) that reads a selfie on your phone to estimate face shape and colour season, then suggests makeup and outfits from your own wardrobe.',
      facts: [['Role', 'Personal project'], ['Timeline', 'Oct 2026 to present'], ['Status', 'In development, launch not cleared']],
      buttons: [['View on GitHub', 'https://github.com/eryzaimatong/aura']],
      results: [['57.3%', 'held-out accuracy of the face-shape model (839 images, 5 classes)'], ['21.6 pts', 'accuracy gap across skin-tone bands, against my 5-point limit'], ['4,146', 'usable images out of 5,000 measured']],
      problem: 'Online style advice is generic, and many apps send your photo to a server. AURA works from your own features and keeps the selfie on the device.',
      built: 'MediaPipe runs on the phone and reduces the selfie to a few numbers: five face ratios, colour values, a skin-tone band and a lighting score. Only those numbers reach a FastAPI backend, which stores them in Supabase with row-level security. A scikit-learn random forest estimates face shape, and the code includes a CLIP-based garment tagger for the wardrobe. The React app is wrapped for Android with Capacitor.',
      decisions: [
        'Privacy by design: there is no image column, the API rejects extra fields, and consent is logged before the camera opens.',
        'Fairness gate: the model is blocked from launch until accuracy is within 5 points across skin-tone bands. It currently fails, and I report that.',
        'Honest outputs: confidence is always shown, and low colour confidence leads to a short quiz instead of a guess.'
      ],
      limits: 'Built in code: the scan pipeline, wardrobe, outfits and wear log. In development: improving the face-shape model so it passes the fairness gate. Not done: the Google Play launch.',
      stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Capacitor', 'FastAPI', 'Python', 'scikit-learn', 'MediaPipe', 'Supabase', 'Figma'],
      next: 'examguard'
    },
    examguard: {
      eyebrow: 'Project 03 // Desktop · Electron', title: 'PUP ExamGuard',
      lead: 'Secure exam mode for Google Forms, built for the Polytechnic University of the Philippines.',
      facts: [['Role', 'Developer'], ['Platform', 'Windows (macOS works too)'], ['Status', 'Working app']],
      buttons: [['View on GitHub', 'https://github.com/eryzaimatong/pup-examguard']],
      problem: "A Google Form on its own can't stop a student from switching to other apps or websites during an exam. ExamGuard adds a locked exam window around it.",
      built: 'Students take the form inside a full-screen window. While the exam is open, it closes other browsers and AI apps, blocks every site except the form, counts strikes, and submits automatically when time or the strike limit runs out. Teachers set a title, form link, duration and exit password, and share one exam key. Events are logged on the computer and, optionally, to a Google Sheet.',
      decisions: [
        "The proctor's exit password is stored only as a salted scrypt hash.",
        'A teacher can export one exam file and copy it to the other lab computers.'
      ],
      stack: ['Electron', 'JavaScript', 'Node.js', 'Google Apps Script'],
      next: 'rewatch'
    }
  };
  const ov = document.getElementById('projectOverlay');
  const body = document.getElementById('pdBody');
  function openProject(key) {
    const p = projects[key], o = projects[p.next];
    const sec = (h4, h3, inner) => `<section><h4>${h4}</h4>${h3 ? `<h3>${h3}</h3>` : ''}${inner}</section>`;
    body.innerHTML = `<div class="pd">
      <p class="eyebrow">${p.eyebrow}</p><h2 id="pdTitle">${p.title}</h2><p class="lead">${p.lead}</p>
      <div class="facts">${p.facts.map(f => `<div><p>${f[0]}</p><p class="org">${f[1]}</p></div>`).join('')}</div>
      <div class="btns">${p.buttons.map((b, i) => `<a class="btn ${i ? 'btn-ghost' : 'btn-primary'}" href="${b[1]}" target="_blank" rel="noopener">${b[0]}</a>`).join('')}</div>
      ${p.note ? `<p class="demo-note">${p.note}</p>` : ''}
      ${p.results ? sec('Results', '', `<div class="results">${p.results.map(r => `<div><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>`) : ''}
      ${sec('The problem', 'Why it exists', `<p class="lead">${p.problem}</p>`)}
      ${sec('What I built', 'How it works', `<p class="lead">${p.built}</p>`)}
      ${p.decisions ? sec('Technical decisions', '', `<ul class="decisions">${p.decisions.map(d => `<li>${d}</li>`).join('')}</ul>`) : ''}
      ${p.limits ? sec('Status and limits', '', `<p class="lead">${p.limits}</p>`) : ''}
      ${sec('Built with', '', `<div class="chips">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>`)}
      ${p.gallery ? sec('Gallery', '', `<div class="gal">${p.gallery.map(g => `<figure><img src="${g[0]}" alt="${g[1]}" loading="lazy"><figcaption>${g[1]}</figcaption></figure>`).join('')}</div><p class="demo-note">${p.galleryNote}</p>`) : ''}
      <button class="btn btn-ghost" id="pdOther">Next project &nbsp;→&nbsp; ${o.title}</button></div>`;
    ov.classList.add('open'); ov.setAttribute('aria-hidden', 'false');
    ov.querySelector('.sheet').scrollTop = 0;
    document.getElementById('pdOther').onclick = () => openProject(p.next);
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

  // ---------- Leadership: click-to-reveal deliverables, one organization at a time ----------
  const orgs = {
    cisco: {
      org: 'Cisco NetConnect · PUP – Manila', role: 'Graphic Designer, Creatives Department', logo: 'assets/logo-netconnect.png',
      tiles: [
        { tag: 'Social graphics', title: 'Event recap posts', text: 'Post-event graphics that recap each activity for the community on Facebook.', chips: ['Visual design', 'Figma'] },
        { tag: 'Page graphics', title: 'Designed to match each event', text: "Other graphics for the organization's page, built around each event's theme." }
      ]
    },
    ibits: {
      org: 'IBITS · Program and Activities Department', role: 'Logistics & Resource Operations Member', logo: 'assets/logo-ibits.png',
      tiles: [
        { tag: 'Program support', title: 'Logistics and resources', text: 'Coordinating what a program day needs, where it is needed, and when.', chips: ['Logistics', 'Resource management'] },
        { tag: 'Activities', title: 'Event planning', text: 'Helping plan and run the department\'s programs and activities.', chips: ['Event planning'] }
      ]
    }
  };
  const oo = document.getElementById('orgOverlay');
  let lastCard = null;
  function openOrg(key, card) {
    const o = orgs[key]; lastCard = card;
    document.getElementById('orgBody').innerHTML = `
      <div class="org-head"><img class="inv-logo" src="${o.logo}" alt="">
        <div><p class="eyebrow">${o.org}</p><h2 id="orgTitle">${o.role}</h2></div></div>
      <p class="eyebrow" style="margin:18px 0 10px">Deliverables</p>
      <div class="org-tiles">${o.tiles.map(t => `<article class="tile glass"><p class="eyebrow">${t.tag}</p><h3>${t.title}</h3>
        <p class="detail">${t.text}</p>${t.chips ? `<div class="chips">${t.chips.map(c => `<span>${c}</span>`).join('')}</div>` : ''}</article>`).join('')}</div>`;
    oo.classList.add('open'); oo.setAttribute('aria-hidden', 'false');
    document.getElementById('orgClose').focus();
    oo.querySelectorAll('.tile').forEach(el => el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }
  document.querySelectorAll('.inv-btn').forEach(card => {
    card.addEventListener('click', () => openOrg(card.dataset.org, card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOrg(card.dataset.org, card); } });
  });
  const closeOrg = () => { oo.classList.remove('open'); oo.setAttribute('aria-hidden', 'true'); if (lastCard) lastCard.focus(); };
  document.getElementById('orgClose').addEventListener('click', closeOrg);
  document.getElementById('orgBack').addEventListener('click', closeOrg);
  oo.addEventListener('click', e => { if (e.target === oo) closeOrg(); });

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
    document.querySelectorAll('.overlay').forEach(o => { o.classList.remove('open'); o.setAttribute('aria-hidden', 'true'); }); if (typeof lastCard !== 'undefined' && lastCard) lastCard.focus();
  }

  // CV placeholders (résumé not yet linked)
  document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  // pointer-reactive warm glow on bento tiles and skill cards (mouse only, skipped for reduced motion)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.bento .tile, .skill').forEach(el => el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  // hero ring leans gently toward the pointer (mouse only, skipped for reduced motion)
  const stage = document.querySelector('.cine-stage');
  if (stage && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById('home').addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      stage.style.setProperty('--px', ((e.clientX / innerWidth) - 0.5).toFixed(3));
      stage.style.setProperty('--py', ((e.clientY / innerHeight) - 0.5).toFixed(3));
    });
  }

  // start
  const start = scenes.findIndex(s => '#' + s.id === location.hash);
  go(start >= 0 ? start : 0, false);
})();
