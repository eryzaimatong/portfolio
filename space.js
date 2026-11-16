/* One dataset, many projections.
   The portfolio is a single dataset of real items (technologies, projects, organizations, credentials, milestones,
   interests) plus a field of unlabeled "dust". Every scene is a different projection of the same points: they glide from
   one layout to the next instead of being redrawn. Positions and links are hand-assigned from the site's own content,
   not learned by a model, and each item says where it comes from.
   Rendering is one WebGL layer behind the page (soft point sprites with depth blur, plus a line pass). Positions are
   morphed on the CPU, which is cheaper than it sounds at ~450 points and lets labels follow the same numbers. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => matchMedia('(max-width:860px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = rng(20260);
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };

  /* ---------------------------------------------------------------- data */
  const ITEMS = [], IDX = {};
  function it(id, label, kind, dom, o) { const n = Object.assign({ id, label, kind, dom, i: ITEMS.length, note: '' }, o); ITEMS.push(n); IDX[id] = n; return n; }
  ['Python', 'SQL', 'R', 'Pandas', 'NumPy', 'scikit-learn', 'Excel', 'Power BI', 'Data cleaning', 'Exploratory data analysis', 'Data visualization', 'Machine learning', 'Statistical analysis', 'MediaPipe'].forEach(l => it(l, l, 'technology', 0));
  ['Java', 'COBOL', 'HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Spring Boot', 'FastAPI', 'REST APIs', 'PostgreSQL', 'MySQL', 'Database design', 'Relational database management', 'Flyway', 'Playwright', 'Vercel', 'Render', 'Neon', 'Supabase', 'Capacitor', 'Git', 'GitHub', 'VS Code', 'Figma', 'Cisco Packet Tracer', 'Workato', 'Claude', 'ChatGPT', 'Claude Code', 'AI-assisted development', 'Prompt engineering'].forEach(l => it(l, l, 'technology', 1));
  ['Slack', 'Notion', 'Discord', 'Microsoft Teams'].forEach(l => it(l, l, 'technology', 2));
  it('Re:Watch', 'Re:Watch', 'project', 1, { note: 'A taste-based recommender whose match scores list the reasons behind them. Jul 2026 to present.', date: 2026.5, dateText: 'Jul 2026' });
  it('AURA', 'AURA', 'project', 1, { note: 'A mobile app in development that reads a selfie on the phone and sends only numbers to the server. Oct 2026 to present.', date: 2026.75, dateText: 'Oct 2026' });
  it('Cisco NetConnect', 'Cisco NetConnect', 'organization', 2, { note: 'PUP Manila. Graphic Designer, Creatives Department.' });
  it('IBITS', 'IBITS', 'organization', 2, { note: 'Logistics and Resource Operations Member, Program and Activities Department.' });
  it('GDG on Campus PUP', 'GDG on Campus PUP', 'organization', 2, { note: 'Strategy and Insights Associate, 2026 to 2027.', date: 2026.0, dateText: '2026', end: 2027.9 });
  it('cred-ada', 'DataCamp: Associate Data Analyst', 'credential', 0, { note: 'DataCamp certification, Aug 2026.', date: 2026.6, dateText: 'Aug 2026' });
  it('cred-dae', 'Cisco: Data Analytics Essentials', 'credential', 0, { note: 'Cisco Networking Academy course, Aug 2026.', date: 2026.6, dateText: 'Aug 2026' });
  it('cred-sql', 'DataCamp: Associate Data Analyst in SQL', 'credential', 0, { note: 'DataCamp career track, 39 hours, Aug 2026.', date: 2026.6, dateText: 'Aug 2026' });
  it('BSIT', 'BS Information Technology, PUP', 'milestone', 2, { note: 'Polytechnic University of the Philippines, Manila. Data Science. 2024 to 2028 (expected).', date: 2024.0, dateText: '2024', end: 2028.5 });
  it('DOST', 'DOST-SEI Merit Scholar', 'milestone', 2, { note: 'Merit scholarship from the DOST Science Education Institute, 2024 cohort.', date: 2024.0, dateText: '2024', end: 2026.88 });
  it('GCI', 'GCI program, University of Tokyo', 'milestone', 2, { note: 'Online program with the Matsuo-Iwasawa Lab. Sep to Dec 2026, in progress.', date: 2026.7, dateText: 'Sep 2026', end: 2026.95 });
  const INTEREST = {
    'Data science': 'BSIT student at PUP Manila, specializing in Data Science.',
    'Analytics': 'Working out what a dataset can honestly say.',
    'Honest uncertainty': 'How sure we can be. AURA always shows its confidence.',
    'Explainable models': 'Re:Watch lists the reasons behind every match score.',
    'Fairness checks': 'AURA is held back from launch until accuracy is within 5 points across skin-tone bands. It currently fails, and I report that.',
    'Privacy by design': 'AURA keeps the selfie on the device. Only numbers reach the server.',
    'Building software': 'So analysis can become tools people use.',
    'Accessibility': 'Re:Watch runs axe-core accessibility audits in CI.',
    'Testing': 'JUnit, Playwright, and a randomized test that every Re:Watch score equals the sum of its reasons.'
  };
  Object.keys(INTEREST).forEach(l => it(l, l, 'interest', 0, { note: INTEREST[l] }));
  const N_ITEMS = ITEMS.length;

  const EDGES = [];
  const link = (a, b, t) => { if (IDX[a] && IDX[b]) EDGES.push({ a: IDX[a].i, b: IDX[b].i, t: t || 'use' }); };
  ['React', 'Java', 'Spring Boot', 'PostgreSQL', 'Flyway', 'Playwright', 'Vercel', 'Render', 'Neon'].forEach(x => link('Re:Watch', x));
  ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Capacitor', 'FastAPI', 'Python', 'scikit-learn', 'MediaPipe', 'Supabase', 'Figma', 'NumPy'].forEach(x => link('AURA', x));
  [['Pandas', 'Python'], ['NumPy', 'Python'], ['scikit-learn', 'Python'], ['FastAPI', 'Python'], ['Spring Boot', 'Java'], ['React', 'JavaScript'], ['PostgreSQL', 'SQL'], ['MySQL', 'SQL'], ['Flyway', 'PostgreSQL']].forEach(p => link(p[0], p[1], 'family'));
  link('Cisco NetConnect', 'Figma'); link('cred-sql', 'SQL'); link('DOST', 'BSIT');
  [['Explainable models', 'Re:Watch'], ['Fairness checks', 'AURA'], ['Privacy by design', 'AURA'], ['Accessibility', 'Re:Watch'], ['Testing', 'Re:Watch'], ['Honest uncertainty', 'Fairness checks'], ['Honest uncertainty', 'Data science'],
    ['Data science', 'Analytics'], ['Analytics', 'GDG on Campus PUP'], ['Data science', 'Python'], ['Building software', 'Re:Watch'], ['Building software', 'AURA'], ['Fairness checks', 'Machine learning'], ['Explainable models', 'Machine learning']].forEach(p => link(p[0], p[1], 'about'));
  const NB = ITEMS.map(() => []); EDGES.forEach(e => { NB[e.a].push(e); NB[e.b].push(e); });
  ITEMS.forEach(n => {   // notes for technologies come from the links above
    if (n.kind === 'technology') { const used = NB[n.i].filter(e => e.t === 'use').map(e => ITEMS[e.a === n.i ? e.b : e.a].label); n.note = used.length ? 'Used in ' + used.join(' and ') + '.' : 'On my stack list. Not yet used in the two public projects.'; }
  });
  const kindWord = n => n.kind === 'technology' ? ['data', 'build', 'collaborate'][n.dom] : n.kind;

  /* ---------------------------------------------------------------- layouts */
  const N_DUST = () => small() ? 130 : 320, N = () => N_ITEMS + N_DUST();
  let P = [], LAY = {}, nTotal = 0;
  const CEN = [[-.66, -.5, .1], [-.1, .45, -.12], [.22, -.58, .05]];
  function force(ids, edges, fixed, iters, box) {
    const pos = {}; ids.forEach((id, k) => { const a = k * 2.399963; pos[id] = fixed[id] ? fixed[id].slice() : [Math.cos(a) * (.2 + .5 * ((k * 7919 % 100) / 100)), Math.sin(a) * (.2 + .5 * ((k * 104729 % 100) / 100))]; });
    for (let it_ = 0; it_ < iters; it_++) {
      const f = {}; ids.forEach(id => f[id] = [0, 0]);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]], b = pos[ids[j]]; let dx = a[0] - b[0], dy = a[1] - b[1], d2 = dx * dx + dy * dy + .002, d = Math.sqrt(d2), r = .0085 / d2;
        f[ids[i]][0] += dx / d * r; f[ids[i]][1] += dy / d * r; f[ids[j]][0] -= dx / d * r; f[ids[j]][1] -= dy / d * r;
      }
      edges.forEach(e => {
        const a = pos[e.a], b = pos[e.b]; let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) + 1e-6, k = (d - .13) * .12;
        f[e.a][0] += dx / d * k; f[e.a][1] += dy / d * k; f[e.b][0] -= dx / d * k; f[e.b][1] -= dy / d * k;
      });
      ids.forEach(id => { if (fixed[id]) return; f[id][0] -= pos[id][0] * .022; f[id][1] -= pos[id][1] * .03; pos[id][0] = clamp(pos[id][0] + clamp(f[id][0], -.05, .05), -box[0], box[0]); pos[id][1] = clamp(pos[id][1] + clamp(f[id][1], -.05, .05), -box[1], box[1]); });
    }
    return pos;
  }
  function buildLayouts() {
    const nd = N_DUST(), n = N_ITEMS + nd; nTotal = n;
    const mk = () => ({ pos: new Float32Array(n * 3), vis: new Float32Array(n), lab: new Uint8Array(n) });
    const L = { scatter: mk(), cloud: mk(), graph: mk(), about: mk(), time: mk(), chip: mk() };
    const rr = rng(99), rg = () => { let u = 0, v = 0; while (!u) u = rr(); while (!v) v = rr(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
    const set = (v, i, x, y, z, vis, lab) => { L[v].pos[i * 3] = x; L[v].pos[i * 3 + 1] = y; L[v].pos[i * 3 + 2] = z; L[v].vis[i] = vis; L[v].lab[i] = lab ? 1 : 0; };
    // scatter and cloud
    for (let i = 0; i < n; i++) {
      set('scatter', i, (rr() * 2 - 1) * 1.05, (rr() * 2 - 1) * .95, rr() * 2 - 1, 1, 0);
      let cx, cy, cz, sg;
      if (i < N_ITEMS) { const c = CEN[ITEMS[i].dom]; sg = .15; cx = c[0] + rg() * sg * .9; cy = c[1] + rg() * sg * .75; cz = c[2] + rg() * .2; }
      else if (rr() < .78) { const c = CEN[(rr() * 3) | 0]; sg = .2; cx = c[0] + rg() * sg; cy = c[1] + rg() * sg * .8; cz = c[2] + rg() * .25; }
      else { cx = (rr() * 2 - 1) * 1.05; cy = (rr() * 2 - 1) * .95; cz = rr() * 2 - 1; }
      set('cloud', i, cx, cy, cz, 1, 0);
    }
    // graph: linked technologies and projects, force layout; unlinked technologies on a quiet outer ring
    const gIds = [], used = new Set(); EDGES.forEach(e => { if (e.t !== 'about') { used.add(e.a); used.add(e.b); } });
    ITEMS.forEach(m => { if ((m.kind === 'technology' || m.kind === 'project') && used.has(m.i)) gIds.push(m.i); });
    const gE = EDGES.filter(e => e.t !== 'about' && gIds.includes(e.a) && gIds.includes(e.b));
    const gp = force(gIds, gE, { [IDX['Re:Watch'].i]: [-.3, 0], [IDX['AURA'].i]: [.3, 0] }, 520, [.95, .78]);
    const ring = ITEMS.filter(m => m.kind === 'technology' && !gIds.includes(m.i));
    for (let i = 0; i < n; i++) {
      if (gp[i]) set('graph', i, gp[i][0] * 1.0, gp[i][1], 0, 1, 1);
      else { const k = ring.findIndex(m => m.i === i); if (k >= 0) { const a = k / ring.length * 6.2832 + .3; set('graph', i, Math.cos(a) * .98, Math.sin(a) * .8, 0, .5, 0); } else set('graph', i, (rr() * 2 - 1) * 1.0, (rr() * 2 - 1) * .85, (rr() * 2 - 1) * .5, i < N_ITEMS ? 0 : .22, 0); }
    }
    // about: interests and what they connect to
    const aE = EDGES.filter(e => e.t === 'about'), aIds = []; aE.forEach(e => { if (!aIds.includes(e.a)) aIds.push(e.a); if (!aIds.includes(e.b)) aIds.push(e.b); });
    const ap = force(aIds, aE, {}, 520, [.9, .72]);
    for (let i = 0; i < n; i++) { if (ap[i]) set('about', i, ap[i][0], ap[i][1], 0, 1, 1); else set('about', i, (rr() * 2 - 1) * 1.0, (rr() * 2 - 1) * .85, (rr() * 2 - 1) * .5, i < N_ITEMS ? 0 : .22, 0); }
    // time: x is the date, lanes by kind
    const lane = { milestone: -.5, credential: -.12, project: .26, organization: .62 }, laneN = {};
    for (let i = 0; i < n; i++) {
      const m = ITEMS[i];
      if (m && m.date) { const x = (m.date - 2023.6) / 5.4 * 2 - 1; laneN[m.kind] = (laneN[m.kind] || 0) + 1; const jy = ((laneN[m.kind] - 1) % 3 - 1) * .11; set('time', i, clamp(x, -.95, .95), (lane[m.kind] || 0) + jy, 0, 1, 1); }
      else set('time', i, (rr() * 2 - 1) * 1.0, .88 + rr() * .06, (rr() * 2 - 1) * .4, i < N_ITEMS ? 0 : .2, 0);
    }
    for (let i = 0; i < n; i++) { L.chip.vis[i] = i < N_ITEMS ? .9 : 1; L.chip.lab[i] = 0; }
    LAY = L;
  }
  function chipTargets(h) {
    const s = window.EIFourier ? EIFourier.samples(h, 360) : [], c = LAY.chip.pos;
    for (let i = 0; i < nTotal; i++) { const q = s[(i * 7) % (s.length || 1)] || [0, 0]; c[i * 3] = q[0] * .62; c[i * 3 + 1] = q[1] * .62; c[i * 3 + 2] = ((i * 13) % 17 - 8) * .01; }
  }

  /* ---------------------------------------------------------------- renderer */
  const cv = document.createElement('canvas');
  cv.id = 'space'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;   // no WebGL: the page keeps its static background, every view's DOM content is unaffected
  document.body.insertBefore(cv, document.body.firstChild);
  const labelsEl = document.createElement('div'); labelsEl.id = 'space-labels'; labelsEl.setAttribute('aria-hidden', 'true'); document.body.appendChild(labelsEl);
  const mkShader = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
  const mkProg = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, mkShader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mkShader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; };
  const pointP = mkProg(
    'attribute vec2 aPos;attribute vec4 aCol;attribute vec2 aSB;uniform vec2 uRes;varying vec4 vCol;varying float vBlur;void main(){vec2 c=(aPos/uRes)*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);gl_PointSize=aSB.x;vCol=aCol;vBlur=aSB.y;}',
    'precision mediump float;varying vec4 vCol;varying float vBlur;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float core=smoothstep(1.,.2+vBlur*.5,r);float glow=exp(-r*r*(3.4-vBlur*2.3));float a=mix(core,glow,.28+vBlur*.35);gl_FragColor=vec4(vCol.rgb*vCol.a*a,vCol.a*a);}');
  const lineP = mkProg(
    'attribute vec3 aP;uniform vec2 uRes;varying float vA;void main(){vec2 c=(aP.xy/uRes)*2.-1.;gl_Position=vec4(c.x,-c.y,0.,1.);vA=aP.z;}',
    'precision mediump float;uniform vec3 uC;varying float vA;void main(){gl_FragColor=vec4(uC*vA,vA);}');
  const pBuf = gl.createBuffer(), lBuf = gl.createBuffer();
  const loc = (p, n) => gl.getAttribLocation(p, n);
  let pData = new Float32Array(0), lData = new Float32Array(900 * 3), W = 0, H = 0, DPR = 1;
  function fit() {
    DPR = Math.min(devicePixelRatio || 1, small() ? 1.5 : 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; gl.viewport(0, 0, cv.width, cv.height);
    pending = true;
  }

  /* ---------------------------------------------------------------- state */
  const PAL_DARK = [[222, 112, 80], [236, 184, 92], [244, 220, 178], [196, 103, 58], [210, 160, 110], [168, 120, 74]], PAL_LIGHT = [[170, 62, 30], [150, 104, 28], [110, 70, 44], [120, 52, 22], [160, 110, 70], [110, 74, 44]];
  const RAW_D = [232, 208, 174], RAW_L = [120, 84, 56];
  const SCENES = ['home', 'about', 'projects', 'skills', 'experience', 'leadership', 'contact'];
  const AMBIENT = { home: { yaw: 0, a: 1 }, about: { yaw: .5, a: .62 }, projects: { yaw: -.45, a: .55 }, skills: { yaw: .9, a: .55 }, experience: { yaw: -.9, a: .55 }, leadership: { yaw: .3, a: .62 }, contact: { yaw: 0, a: .9 } };
  const MODES = {
    about: { view: 'about', btn: 'View as a map', title: 'What I care about', desc: 'Nine ideas from this site and the real things each one touches. Pick one.' },
    skills: { view: 'graph', btn: 'View as a graph', title: 'The stack as a graph', desc: 'Bright lines are technologies a project used. Faint lines are the same family. Outer dots are on my list but not yet used in the two public projects.' },
    experience: { view: 'time', btn: 'View as a timeline', title: 'Dated milestones', desc: 'Only items with a date on this site. Drag the date and watch what exists by then.' }
  };
  let view = 'scatter', sceneId = 'home', exploring = false, started = false, boot = 0, bootT0 = 0, focusDom = -1, harm = 64, scrub = 2029;
  let sel = -1, hov = -1, spot = -1, ptr = null, pending = true, running = false, last = 0, kK = 3, lastK = 0, kc = [], lastClick = 0;
  let cam = { yaw: 0, pitch: 0, ty: 0, tp: 0, yawBase: 0 }, frame = { sx: 1, sy: 1, cy: 0, a: 1, ax: 0 }, tFrame = { sx: 1, sy: 1, cy: 0, a: 1 }, theme = 0, tTheme = 0;
  let trans = { t: 1, dur: 1.15 };

  function build() {
    buildLayouts();
    P = [];
    for (let i = 0; i < nTotal; i++) {
      const isItem = i < N_ITEMS, p = { i, x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0, d: 0, vis: 0, fv: 0, tv: 0, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0, dep: 0, r: isItem ? (ITEMS[i].kind === 'project' ? 4.2 : 3) : .9 + R() * 1.1, col: [232, 208, 174], cl: -1, ph: R() * 6.28, lab: 0, item: isItem };
      p.x = LAY.scatter.pos[i * 3]; p.y = LAY.scatter.pos[i * 3 + 1]; p.z = LAY.scatter.pos[i * 3 + 2]; p.vis = 0;
      P.push(p);
    }
    pData = new Float32Array(nTotal * 8);
    const gp = gl.getAttribLocation(pointP, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferData(gl.ARRAY_BUFFER, pData.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, lBuf); gl.bufferData(gl.ARRAY_BUFFER, lData.byteLength, gl.DYNAMIC_DRAW);
  }
  function setView(v, instant, keepDelays) {
    view = v; const L = LAY[v];
    P.forEach(p => {
      p.fx = p.x; p.fy = p.y; p.fz = p.z; p.fv = p.vis;
      p.tx = L.pos[p.i * 3]; p.ty = L.pos[p.i * 3 + 1]; p.tz = L.pos[p.i * 3 + 2]; p.tv = L.vis[p.i]; p.lab = L.lab[p.i];
      p.d = instant ? 0 : (clamp((p.tx + 1) / 2, 0, 1) * .38 + (p.i % 9) * .012);
    });
    trans.t = instant || reduce ? 1 : 0; trans.dur = 1.15;
    if (instant || reduce) P.forEach(p => { p.x = p.tx; p.y = p.ty; p.z = p.tz; p.vis = p.tv; });
    pending = true;
  }
  function snapFrame() { Object.assign(frame, tFrame); frame.ax = tFrame.cx || 0; }
  function frameFor() {
    if (view === 'cloud' || view === 'scatter') return { sx: W * .54, sy: H * .52, cy: 0, cx: 0 };
    if (view === 'chip') return { sx: Math.min(W * .24, H * .36), sy: Math.min(W * .24, H * .36), cy: 0, cx: small() ? 0 : W * .25 };
    const bw = small() ? W * .44 : Math.min(W * .4, H * .72), bh = small() ? H * .36 : H * .36; return { sx: bw, sy: bh, cy: small() ? 20 : 12 };
  }

  /* ---------------------------------------------------------------- k-means on the cloud (Home) */
  function kmeans() {
    const pts = P; if (!pts.length) return;
    if (!kc.length || kc.length !== kK) {   // k-means++ seeding
      kc = [pts[(R() * pts.length) | 0]].map(p => [p.x, p.y, p.z]);
      while (kc.length < kK) { let best = null, bd = -1; pts.forEach(p => { let m = 1e9; kc.forEach(c => { const d = (c[0] - p.x) ** 2 + (c[1] - p.y) ** 2 + (c[2] - p.z) ** 2; if (d < m) m = d; }); if (m > bd) { bd = m; best = p; } }); kc.push([best.x, best.y, best.z]); }
    }
    const sum = kc.map(() => [0, 0, 0, 0]);
    pts.forEach(p => { let bi = 0, bd = 1e9; kc.forEach((c, i) => { const d = (c[0] - p.x) ** 2 + (c[1] - p.y) ** 2 + (c[2] - p.z) ** 2; if (d < bd) { bd = d; bi = i; } }); p.cl = bi; const s = sum[bi]; s[0] += p.x; s[1] += p.y; s[2] += p.z; s[3]++; });
    kc.forEach((c, i) => { if (sum[i][3]) { c[0] = sum[i][0] / sum[i][3]; c[1] = sum[i][1] / sum[i][3]; c[2] = sum[i][2] / sum[i][3]; } });
    // order clusters left to right so colours stay put when k changes
    const ord = kc.map((c, i) => [c[0], i]).sort((a, b) => a[0] - b[0]).map(x => x[1]); const rank = []; ord.forEach((o, r) => rank[o] = r);
    pts.forEach(p => p.cl = rank[p.cl]);
  }

  /* ---------------------------------------------------------------- frame update + draw */
  const labPool = []; let labUsed = 0;
  function label(txt, x, y, cls, sub) {
    let e = labPool[labUsed]; if (!e) { e = document.createElement('div'); e.className = 'sl'; labelsEl.appendChild(e); labPool.push(e); }
    labUsed++; if (e._t !== txt + (sub || '') + cls) { e._t = txt + (sub || '') + cls; e.className = 'sl ' + cls; e.innerHTML = '<b></b>' + (sub ? '<i></i>' : ''); e.firstChild.textContent = txt; if (sub) e.lastChild.textContent = sub; }
    e.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; e.style.display = 'block';
  }
  function step(dt, now) {
    // transition progress
    if (trans.t < 1) trans.t = Math.min(1, trans.t + dt / trans.dur);
    P.forEach(p => {
      const e = ease(clamp((trans.t * (trans.dur + .5) - p.d) / trans.dur, 0, 1));
      p.x = p.fx + (p.tx - p.fx) * e; p.y = p.fy + (p.ty - p.fy) * e; p.z = p.fz + (p.tz - p.fz) * e; p.vis = p.fv + (p.tv - p.fv) * e;
    });
    // camera: slow breathing and a little pointer parallax
    const tyaw = cam.yawBase + (ptr && !small() ? (ptr.x / W - .5) * .22 : 0) + Math.sin(now * .15) * .03, tp = ptr && !small() ? (ptr.y / H - .5) * -.14 : 0;
    cam.yaw += (tyaw - cam.yaw) * Math.min(1, dt * 2.4); cam.pitch += (tp - cam.pitch) * Math.min(1, dt * 2.4);
    ['sx', 'sy', 'cy', 'a'].forEach(k => { frame[k] += (tFrame[k] - frame[k]) * Math.min(1, dt * 3.2); });
    frame.ax += ((tFrame.cx || 0) - frame.ax) * Math.min(1, dt * 3.2);
    theme += (tTheme - theme) * Math.min(1, dt * 3);
    if (view === 'cloud' && sceneId === 'home' && now - lastK > .5) { lastK = now; if (boot > 1 || reduce) kmeans(); }
  }
  function colorOf(p, t) {
    const pal = theme > .5 ? PAL_LIGHT : PAL_DARK, raw = theme > .5 ? RAW_L : RAW_D;
    let c;
    if (view === 'cloud' && p.cl >= 0 && (boot > 1 || reduce)) c = pal[p.cl % pal.length]; else if (view !== 'cloud' && view !== 'scatter') c = pal[(p.item ? ITEMS[p.i].dom : 0) % 3]; else c = raw;
    for (let k = 0; k < 3; k++) p.col[k] += (c[k] - p.col[k]) * t;
  }
  function draw(now, dt) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const fxx = frame.sx, fyy = frame.sy, deep = view === 'cloud' || view === 'scatter';
    const cx0 = W / 2 + frame.ax, cy0 = H / 2 + frame.cy;
    const nbr = new Set(); let focusI = sel >= 0 ? sel : (spot >= 0 ? spot : hov);
    if (focusI >= 0) { NB[focusI].forEach(e => { nbr.add(e.a === focusI ? e.b : e.a); }); }
    const boost = sceneId === 'home' ? 1 : (exploring ? 1 : frame.a);
    for (let k = 0; k < nTotal; k++) {
      const p = P[k];
      let x = p.x, y = p.y, z = p.z;
      { const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; x = x1; y = y1; z = z2; }
      const persp = 1 / (1 - z * .34);
      p.sx = cx0 + x * fxx * persp + p.ox; p.sy = cy0 + y * fyy * persp + p.oy; p.dep = z;
      // pointer: a soft push, springing back
      if (ptr && !small()) { const dx = p.sx - ptr.x, dy = p.sy - ptr.y, d = Math.hypot(dx, dy), Rr = 130; if (d < Rr && d > .5) { const f = Math.pow(1 - d / Rr, 2) * 7; p.vx += dx / d * f; p.vy += dy / d * f; } }
      p.vx += -p.ox * .06; p.vy += -p.oy * .06; p.vx *= .86; p.vy *= .86; p.ox += p.vx; p.oy += p.vy;
      colorOf(p, Math.min(1, dt * 4));
      // alpha
      let a = p.vis * boost;
      if (view === 'cloud' && sceneId === 'home') { a *= clamp((now - bootT0) / .9, 0, 1) * (p.item ? .95 : .7); if (focusDom >= 0) a *= p.item ? (ITEMS[p.i].dom === focusDom ? 1.2 : .4) : (p.cl === focusDom ? 1 : .5); }
      else if (!p.item) a *= .8;
      if (view === 'time' && p.item && ITEMS[p.i].date) a *= ITEMS[p.i].date > scrub ? .1 : 1;
      if (focusI >= 0 && p.item && exploring) a *= (p.i === focusI || nbr.has(p.i)) ? 1.15 : .35;
      if (p.i === focusI) a = Math.max(a, .95);
      const blur = clamp(Math.abs(z - .1) * (deep ? .75 : .15), 0, 1);
      const size = (p.r * (p.item ? (exploring ? 1.9 : 1.5) : 1.15)) * persp * (1 + (p.i === focusI ? .55 : 0)) * DPR * (small() ? .95 : 1) * (1 + blur * (p.item ? .35 : .9));
      const o = k * 8; pData[o] = p.sx * DPR; pData[o + 1] = p.sy * DPR; pData[o + 2] = p.col[0] / 255; pData[o + 3] = p.col[1] / 255; pData[o + 4] = p.col[2] / 255; pData[o + 5] = clamp(a, 0, 1) * (1 - blur * .32); pData[o + 6] = Math.max(1.6, size * 1.75); pData[o + 7] = blur;
    }
    // edges
    let ln = 0;
    const pushE = (a, b, al) => { if (ln + 2 > 880) return; const A = P[a], B = P[b]; lData[ln * 3] = A.sx * DPR; lData[ln * 3 + 1] = A.sy * DPR; lData[ln * 3 + 2] = al * Math.min(A.vis, B.vis); ln++; lData[ln * 3] = B.sx * DPR; lData[ln * 3 + 1] = B.sy * DPR; lData[ln * 3 + 2] = al * Math.min(A.vis, B.vis); ln++; };
    if (exploring && (view === 'graph' || view === 'about')) EDGES.forEach(e => { if ((view === 'graph' && e.t === 'about') || (view === 'about' && e.t !== 'about')) return; const lit = focusI >= 0 && (e.a === focusI || e.b === focusI); pushE(e.a, e.b, lit ? .95 : (focusI >= 0 ? .08 : (e.t === 'family' ? .16 : .42))); });
    else if (sel >= 0 && !exploring) NB[sel].forEach(e => pushE(e.a, e.b, .8));
    if (view === 'time' && exploring) P.forEach(p => { const m = ITEMS[p.i]; if (!p.item || !m.end || m.date > scrub) return; const xe = cx0 + ((Math.min(m.end, scrub) - 2023.6) / 5.4 * 2 - 1) * frame.sx; if (ln + 2 > 880) return; lData[ln * 3] = p.sx * DPR; lData[ln * 3 + 1] = p.sy * DPR; lData[ln * 3 + 2] = .5; ln++; lData[ln * 3] = xe * DPR; lData[ln * 3 + 1] = p.sy * DPR; lData[ln * 3 + 2] = .5; ln++; });
    if (view === 'time' && exploring) { const x0 = cx0 + (-1) * frame.sx, x1 = cx0 + frame.sx, yy = cy0 + frame.sy * .78; lData[ln * 3] = x0 * DPR; lData[ln * 3 + 1] = yy * DPR; lData[ln * 3 + 2] = .35; ln++; lData[ln * 3] = x1 * DPR; lData[ln * 3 + 1] = yy * DPR; lData[ln * 3 + 2] = .35; ln++; const sx = cx0 + ((scrub - 2023.6) / 5.4 * 2 - 1) * frame.sx; lData[ln * 3] = sx * DPR; lData[ln * 3 + 1] = (cy0 - frame.sy * .78) * DPR; lData[ln * 3 + 2] = .55; ln++; lData[ln * 3] = sx * DPR; lData[ln * 3 + 1] = yy * DPR; lData[ln * 3 + 2] = .55; ln++; }
    // draw
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (ln) {
      gl.useProgram(lineP); gl.uniform2f(gl.getUniformLocation(lineP, 'uRes'), cv.width, cv.height);
      const lc = theme > .5 ? [.55, .27, .1] : [.94, .72, .47]; gl.uniform3f(gl.getUniformLocation(lineP, 'uC'), lc[0], lc[1], lc[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, lBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, lData.subarray(0, ln * 3));
      const a = loc(lineP, 'aP'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 12, 0); gl.lineWidth(1); gl.drawArrays(gl.LINES, 0, ln); gl.disableVertexAttribArray(a);
    }
    gl.useProgram(pointP); gl.uniform2f(gl.getUniformLocation(pointP, 'uRes'), cv.width, cv.height);
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pData);
    const a0 = loc(pointP, 'aPos'), a1 = loc(pointP, 'aCol'), a2 = loc(pointP, 'aSB');
    gl.enableVertexAttribArray(a0); gl.vertexAttribPointer(a0, 2, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(a1); gl.vertexAttribPointer(a1, 4, gl.FLOAT, false, 32, 8);
    gl.enableVertexAttribArray(a2); gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 32, 24);
    gl.drawArrays(gl.POINTS, 0, nTotal);
    gl.disableVertexAttribArray(a0); gl.disableVertexAttribArray(a1); gl.disableVertexAttribArray(a2);
    labels(focusI, nbr);
  }
  function labels(focusI, nbr) {
    labUsed = 0;
    const showAll = exploring && (view === 'graph' || view === 'about' || view === 'time');
    if (showAll) {
      P.forEach(p => {
        if (!p.item || !p.lab || p.vis < .5) return;
        const m = ITEMS[p.i]; if (view === 'time' && m.date > scrub) return;
        const lit = focusI < 0 || p.i === focusI || nbr.has(p.i);
        label(m.label, p.sx + 8, p.sy - 8, (m.kind === 'project' ? 'sl-key ' : '') + (lit ? '' : 'sl-dim ') + (p.i === focusI ? 'sl-on' : ''), view === 'time' ? m.dateText : '');
      });
      if (view === 'time') for (let y = 2024; y <= 2028; y++) { const x = W / 2 + frame.ax + ((y - 2023.6) / 5.4 * 2 - 1) * frame.sx, yy = H / 2 + frame.cy + frame.sy * .78; label(String(y), x - 14, yy + 6, 'sl-axis'); }
    }
    const hi = focusI >= 0 ? P[focusI] : null;
    if (hi && hi.item && (!showAll || !hi.lab) && hi.vis > .3) label(ITEMS[hi.i].label, hi.sx + 10, hi.sy - 10, 'sl-on', kindWord(ITEMS[hi.i]));
    if (sel >= 0 && !exploring) NB[sel].forEach(e => { const o = P[e.a === sel ? e.b : e.a]; if (o.item) label(ITEMS[o.i].label, o.sx + 8, o.sy - 8, 'sl-dim'); });
    for (let i = labUsed; i < labPool.length; i++) labPool[i].style.display = 'none';
  }

  /* ---------------------------------------------------------------- loop, activation */
  function tick(t) {
    if (!running) return;
    requestAnimationFrame(tick);
    const now = t / 1000, dt = Math.min(.05, now - last || .016); last = now;
    if (!started) return;
    boot = bootT0 ? now - bootT0 : 0;
    if (view === 'scatter' && sceneId === 'home' && boot > 1.1 && !reduce) setView('cloud');
    step(dt, now); draw(now, dt); pending = false;
  }
  function renderOnce() { if (!P.length) return; const now = performance.now() / 1000; step(.016, now); draw(now, .016); }
  function runState() {
    const should = started && !document.hidden && !reduce && !(sceneId === 'projects' && false);
    if (should && !running) { running = true; last = performance.now() / 1000; requestAnimationFrame(tick); }
    if (!should && running) running = false;
  }

  /* scene logic */
  function applyScene(id, fromScene) {
    sceneId = id; exploring = false; document.body.classList.remove('space-explore'); sel = -1; hov = -1; focusDom = -1;
    const A = AMBIENT[id] || AMBIENT.home, light = !!$('#' + id + '.light');
    tTheme = light ? 1 : 0; cam.yawBase = A.yaw; tFrame.a = A.a;
    if (id === 'home') {
      if (reduce) { setView('cloud', true); kc = []; for (let i = 0; i < 9; i++) kmeans(); }
      else { bootT0 = performance.now() / 1000; boot = 0; P.forEach(p => { p.cl = -1; }); kc = []; setView('scatter', !fromScene); }
    }
    else if (id === 'contact') { chipTargets(harm); setView('chip'); }
    else setView('cloud');
    const f = frameFor(); Object.assign(tFrame, { sx: f.sx, sy: f.sy, cy: f.cy, cx: f.cx || 0 }); if (!started || reduce) snapFrame();
    const m = MODES[id]; viewBtn.hidden = !m; if (m) viewBtn.textContent = m.btn; viewBtn.setAttribute('aria-pressed', 'false');
    info.hidden = true; ctl.hidden = id !== 'home';
    pending = true; if (!running) renderOnce();
  }
  function setExplore(on) {
    const m = MODES[sceneId]; if (!m) return; exploring = on; sel = -1; hov = -1;
    document.body.classList.toggle('space-explore', on);
    viewBtn.setAttribute('aria-pressed', String(on)); viewBtn.textContent = on ? 'Back to the page' : m.btn;
    if (on) { setView(m.view); const f = frameFor(); Object.assign(tFrame, { sx: f.sx, sy: f.sy, cy: f.cy, cx: 0, a: 1 }); tTheme = $('#' + sceneId + '.light') ? 1 : 0; cam.yawBase = 0; }
    else { setView('cloud'); cam.yawBase = (AMBIENT[sceneId] || AMBIENT.home).yaw; tFrame.a = (AMBIENT[sceneId] || AMBIENT.home).a; const f = frameFor(); Object.assign(tFrame, { sx: f.sx, sy: f.sy, cy: f.cy, cx: 0 }); }
    if (reduce) snapFrame();
    renderInfo(); if (!running) renderOnce();
  }

  /* ---------------------------------------------------------------- UI: explore button, info panel, k control, scrubber */
  const viewBtn = document.createElement('button'); viewBtn.type = 'button'; viewBtn.className = 'view-btn'; viewBtn.hidden = true; viewBtn.setAttribute('aria-pressed', 'false');
  $('#nav').appendChild(viewBtn);
  const ui = document.createElement('div'); ui.className = 'space-ui'; document.body.appendChild(ui);
  const info = document.createElement('div'); info.className = 'space-info'; info.hidden = true; info.setAttribute('role', 'status'); info.setAttribute('aria-live', 'polite'); ui.appendChild(info);
  const ctl = document.createElement('div'); ctl.className = 'space-ctl'; ctl.hidden = true;
  ctl.innerHTML = '<label for="kRange">k-means, k = <output id="kOut">3</output></label><input id="kRange" type="range" min="2" max="6" step="1" value="3" aria-describedby="kHelp"><span id="kHelp" class="sr-only">Number of clusters the algorithm looks for. The data was built around three groups.</span>';
  ui.appendChild(ctl);
  function renderInfo() {
    const m = MODES[sceneId]; if (!exploring || !m) { info.hidden = true; return; }
    info.hidden = false;
    const n = sel >= 0 ? ITEMS[sel] : null;
    let h = '<p class="si-k"></p><p class="si-t"></p>';
    if (view === 'time') h += '<label class="si-s" for="dateRange">As of <output id="dateOut"></output></label><input id="dateRange" type="range" min="2023.6" max="2029" step="0.05" aria-label="Date">';
    info.innerHTML = h;
    info.firstChild.textContent = n ? kindWord(n) : m.title;
    info.children[1].textContent = n ? n.label + (n.note ? ' — ' + n.note : '') : m.desc;
    if (view === 'time') {
      const r = $('#dateRange'), o = $('#dateOut'); r.value = scrub; const fmt = v => { const y = Math.floor(v), mo = Math.min(11, Math.floor((v - y) * 12)); return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo] + ' ' + y; };
      o.textContent = fmt(scrub); r.addEventListener('input', () => { scrub = +r.value; o.textContent = fmt(scrub); if (!running) renderOnce(); });
    }
  }
  viewBtn.addEventListener('click', () => setExplore(!exploring));
  addEventListener('keydown', e => { if (e.key === 'Escape' && exploring) { setExplore(false); viewBtn.focus(); } });
  ctl.querySelector('#kRange').addEventListener('input', e => { kK = +e.target.value; $('#kOut').textContent = kK; kc = []; lastK = 0; kmeans(); if (!running) renderOnce(); });

  /* pointer: hover names the nearest real item; a click pins it and shows what it connects to */
  const canProbe = () => sceneId === 'home' || exploring;
  const nearest = (x, y, max) => { let bi = -1, bd = max * max; P.forEach(p => { if (!p.item || p.vis < .35) return; if (exploring && p.lab === 0 && view !== 'cloud') { /* unlabeled ring dots stay probe-able */ } const d = (p.sx - x) ** 2 + (p.sy - y) ** 2; if (d < bd) { bd = d; bi = p.i; } }); return bi; };
  addEventListener('pointermove', e => {
    ptr = { x: e.clientX, y: e.clientY };
    if (canProbe()) { const h = nearest(e.clientX, e.clientY, 34); if (h !== hov) { hov = h; document.body.classList.toggle('space-hot', h >= 0); if (!running) renderOnce(); } } else if (hov >= 0) { hov = -1; document.body.classList.remove('space-hot'); }
  }, { passive: true });
  addEventListener('pointerleave', () => { ptr = null; hov = -1; }, { passive: true });
  document.addEventListener('click', e => {
    if (!canProbe()) return;
    if (e.target.closest('a,button,input,label,[role=button],.glass,.status-pop,.nd,.space-info,.space-ctl')) return;
    const h = nearest(e.clientX, e.clientY, small() ? 40 : 34);
    sel = h >= 0 && h !== sel ? h : -1; if (exploring) renderInfo(); else showHomePin();
    if (!running) renderOnce();
  });
  function showHomePin() {
    if (sel < 0) { info.hidden = true; return; }
    const n = ITEMS[sel]; info.hidden = false; info.innerHTML = '<p class="si-k"></p><p class="si-t"></p>'; info.firstChild.textContent = kindWord(n); info.lastChild.textContent = n.label + (n.note ? ' — ' + n.note : '');
  }
  // the circuit chip and the field describe the same three things
  const circ = $('#circuit');
  if (circ) new MutationObserver(() => { const n = circ.dataset.active; focusDom = ({ data: 0, build: 1, team: 2 })[n] ?? -1; if (!running) renderOnce(); }).observe(circ, { attributes: true, attributeFilter: ['data-active'] });
  // Contact: harmonics drive both the epicycles (signature.js) and where the points settle
  addEventListener('eiharmonics', e => { harm = e.detail; if (sceneId === 'contact') { chipTargets(harm); P.forEach(p => { p.fx = p.x; p.fy = p.y; p.fz = p.z; p.tx = LAY.chip.pos[p.i * 3]; p.ty = LAY.chip.pos[p.i * 3 + 1]; p.tz = LAY.chip.pos[p.i * 3 + 2]; p.d = 0; }); trans.t = reduce ? 1 : 0; trans.dur = .55; if (reduce) P.forEach(p => { p.x = p.tx; p.y = p.ty; p.z = p.tz; }); if (!running) renderOnce(); } });

  /* ---------------------------------------------------------------- boot and wiring */
  function init() {
    build(); fit();
    new ResizeObserver(() => { fit(); const f = frameFor(); Object.assign(tFrame, { sx: f.sx, sy: f.sy, cy: f.cy, cx: f.cx || 0 }); snapFrame(); if (!running) renderOnce(); }).observe(document.documentElement);
    started = true; linkContent();
    const act = $('.scene.active'); applyScene(act ? act.id : 'home', false); snapFrame(); if (!running) renderOnce();
    runState();
    document.addEventListener('scenechange', ev => { applyScene(ev.detail.id, true); runState(); });
    document.addEventListener('visibilitychange', runState);
  }
  /* content and the point layer point at each other: hovering a card, a skill or a milestone shows the point it stands for */
  function linkContent() {
    const idFor = el => {
      let m;
      if ((m = el.closest('.inv'))) return ['Cisco NetConnect', 'IBITS', 'GDG on Campus PUP'][[...m.parentNode.children].indexOf(m)];
      if ((m = el.closest('.tl-card'))) return ['BSIT', 'DOST', 'GCI'][[...m.parentNode.children].indexOf(m)];
      if ((m = el.closest('.pcard'))) return m.dataset.project === 'rewatch' ? 'Re:Watch' : 'AURA';
      if ((m = el.closest('.cred'))) return ({ datacamp: 'cred-ada', cisco: 'cred-dae', sql: 'cred-sql' })[m.dataset.cert];
      if ((m = el.closest('.stk-items li'))) return IDX[m.textContent.trim()] ? m.textContent.trim() : null;
      return null;
    };
    const set = id => { const k = id && IDX[id] ? IDX[id].i : -1; if (k !== spot) { spot = k; if (!running) renderOnce(); } };
    const stage = $('#stage');
    stage.addEventListener('pointerover', e => { if (!exploring) set(idFor(e.target)); }, { passive: true });
    stage.addEventListener('pointerout', e => { if (!e.relatedTarget || !idFor(e.relatedTarget)) set(null); }, { passive: true });
    stage.addEventListener('focusin', e => { if (!exploring) set(idFor(e.target)); });
    stage.addEventListener('focusout', () => set(null));
  }
  window.Space = { items: ITEMS, edges: EDGES, setExplore, get exploring() { return exploring; } };
  if (document.readyState === 'complete') requestAnimationFrame(init); else addEventListener('load', () => requestAnimationFrame(init));
})();
