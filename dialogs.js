/* Dialogs: the project, organization and certificate overlays. Content is unchanged from the previous version of the site;
   only the way they are opened changed (any element with data-project / data-org / data-cert). */
(() => {
  const overlayOpen = () => document.querySelector('.overlay.open');
  const mobile = () => matchMedia('(max-width:860px)').matches;
  /* ---------- overlays: one accessible modal manager ---------- */
  let opener = null;
  const inertTargets = () => ['nav', 'main', 'footer'].map(id => document.getElementById(id)).filter(Boolean);
  const focusable = root => [...root.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),input,select,textarea')].filter(n => n.offsetParent !== null);
  function openOverlay(el, from, focusEl) {
    opener = from || document.activeElement;
    inertTargets().forEach(n => n.setAttribute('inert', ''));
    el.setAttribute('aria-hidden', 'false');
    el.querySelector('.sheet').scrollTop = 0;
    if (window.FX) FX.openDialog(el, from, null); else el.classList.add('open');
    (focusEl || focusable(el)[0] || el).focus({ preventScroll: true });
  }
  let closing = false;
  function closeOverlay() {
    const open = overlayOpen();
    if (!open || closing) return;
    const finish = () => {
      document.querySelectorAll('.overlay').forEach(o => { o.classList.remove('open'); o.setAttribute('aria-hidden', 'true'); });
      inertTargets().forEach(n => n.removeAttribute('inert'));
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      opener = null; closing = false;
    };
    if (window.FX && FX.on) { closing = true; FX.closeDialog(open, finish); } else finish();
  }
  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) closeOverlay(); }));
  document.addEventListener('keydown', e => {          // keep Tab inside the open dialog
    const open = overlayOpen();
    if (!open || e.key !== 'Tab') return;
    const items = focusable(open);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  ['pdBack', 'orgClose', 'orgBack', 'certClose'].forEach(id => document.getElementById(id).addEventListener('click', closeOverlay));

  /* ---------- projects ---------- */
  const projects = {
    rewatch: {
      eyebrow: 'Project 01 // Recommender · Web app', title: 'Re:Watch',
      logo: ['assets/projects/rewatch-logo.png', 'Re:Watch logo', '#101b33'],
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
      stack: ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'Flyway', 'Playwright', 'Vercel', 'Render', 'Neon'],
      gallery: [
        ['assets/projects/rewatch-01-home.jpg', 'Home with a match score'],
        ['assets/projects/rewatch-02-moods.jpg', 'Mood picker'],
        ['assets/projects/rewatch-03-match.jpg', 'A match explained trait by trait'],
        ['assets/projects/rewatch-04-taste-dna.jpg', 'Taste DNA profile'],
        ['assets/projects/rewatch-05-movie-night.jpg', 'Movie Night group results'],
        ['assets/projects/rewatch-06-community.jpg', 'Community and similar taste']
      ],
      galleryNote: 'Screens from the running app. Poster art is a generated placeholder.',
      next: 'aura'
    },
    aura: {
      eyebrow: 'Project 02 // Mobile · In development', title: 'AURA',
      logo: ['assets/projects/aura-logo.png', 'AURA logo: Mira, the mirror ghost', '#fdf6ec'],
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
      gallery: [
        ['assets/projects/aura-01-welcome.png', 'Welcome'],
        ['assets/projects/aura-02-card.png', 'Your Aura Card'],
        ['assets/projects/aura-03-for-you.png', 'Makeup picks'],
        ['assets/projects/aura-04-closet.png', 'The Closet'],
        ['assets/projects/aura-05-privacy.png', 'Data and privacy']
      ],
      galleryClass: 'phone', galleryDims: [390, 844],
      galleryNote: 'Design mock-ups of the screens from the AURA repository. The app is still in development.',
      next: 'rewatch'
    }
  };
  window.ProjectData = projects;
  const ov = document.getElementById('projectOverlay');
  const body = document.getElementById('pdBody');
  const sec = (h4, h3, inner) => `<section><h4>${h4}</h4>${h3 ? `<h3>${h3}</h3>` : ''}${inner}</section>`;
  function renderProject(key) {
    const p = projects[key], o = projects[p.next];
    body.innerHTML = `<div class="pd">
      <img class="pd-logo" src="${p.logo[0]}" alt="${p.logo[1]}" style="background:${p.logo[2]}">
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
      ${p.gallery ? sec('Gallery', '', `<div class="gal ${p.galleryClass || ''}">${p.gallery.map(g => `<figure><div class="shot"><img src="${g[0]}" alt="${g[1]}" width="${(p.galleryDims || [1000, 625])[0]}" height="${(p.galleryDims || [1000, 625])[1]}" decoding="async"></div><figcaption>${g[1]}</figcaption></figure>`).join('')}</div><p class="demo-note">${p.galleryNote}</p>`) : ''}
      <button class="btn btn-ghost" id="pdOther">Next project &nbsp;→&nbsp; ${o.title}</button></div>`;
    document.getElementById('pdOther').onclick = () => { renderProject(p.next); ov.querySelector('.sheet').scrollTop = 0; document.getElementById('pdOther').focus(); };
  }
  function openProject(key, from) { renderProject(key); openOverlay(ov, from, document.getElementById('pdBack')); }

  /* ---------- leadership: deliverables open in a modal (only for organizations that have some) ---------- */
  const orgs = {
    cisco: {
      org: 'Cisco NetConnect · PUP – Manila', role: 'Graphic Designer, Creatives Department', logo: 'assets/logo-netconnect.png', logoAlt: 'Cisco NetConnect logo',
      tiles: [
        { tag: 'Social graphics', title: 'Event recap posts', text: 'Post-event graphics that recap each activity for the community on Facebook.', chips: ['Visual design', 'Figma'],
          link: ['View a published post on Facebook', 'https://www.facebook.com/share/p/1DscWrfCUx/'] },
        { tag: 'Page graphics', title: 'Designed to match each event', text: "Other graphics for the organization's page, built around each event's theme." }
      ]
    }
  };
  const oo = document.getElementById('orgOverlay');
  const tileGlow = el => el.addEventListener('pointermove', e => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  function openOrg(key, card) {
    const o = orgs[key];
    document.getElementById('orgBody').innerHTML = `
      <div class="org-head"><img class="inv-logo" src="${o.logo}" alt="${o.logoAlt}">
        <div><p class="eyebrow">${o.org}</p><h2 id="orgTitle">${o.role}</h2></div></div>
      <p class="eyebrow" style="margin:18px 0 10px">Deliverables</p>
      <div class="org-tiles">${o.tiles.map(t => `<article class="tile glass"><p class="eyebrow">${t.tag}</p><h3>${t.title}</h3>
        <p class="detail">${t.text}</p>${t.chips ? `<div class="chips">${t.chips.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
        ${t.link ? `<a class="tile-link" href="${t.link[1]}" target="_blank" rel="noopener">${t.link[0]} <span aria-hidden="true">→</span></a>` : ''}</article>`).join('')}</div>`;
    oo.querySelectorAll('.tile').forEach(tileGlow);
    openOverlay(oo, card, document.getElementById('orgClose'));
  }
  /* ---------- certificates ---------- */
  const co = document.getElementById('certOverlay');
  const certs = {
    datacamp: ['assets/cert-datacamp.png', 'DataCamp Associate Data Analyst certificate'],
    cisco: ['assets/cert-cisco.png', 'Cisco Networking Academy Data Analytics Essentials certificate'],
    sql: ['assets/cert-sql.png', 'DataCamp Associate Data Analyst in SQL certificate']
  };
  document.querySelectorAll('[data-cert]').forEach(b => b.addEventListener('click', () => {
    const [src, alt] = certs[b.dataset.cert];
    const img = document.getElementById('certImg'); img.src = src; img.alt = alt;
    openOverlay(co, b, document.getElementById('certClose'));
  }));
  /* anything with data-project / data-org opens its dialog (keyboard and pointer) */
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-open-project]'); if (p) { e.preventDefault(); openProject(p.dataset.openProject, p); return; }
    const o = e.target.closest('[data-org]'); if (o) { e.preventDefault(); openOrg(o.dataset.org, o); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlayOpen()) closeOverlay(); });
  window.Dialogs = { openProject, openOrg, close: closeOverlay, isOpen: () => !!overlayOpen() };
})();
