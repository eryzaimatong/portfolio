/* Interactive explanations inside the two project dialogs. Every number and name comes from the projects themselves.
   Re:Watch: the real scoring model from the public repository (ScoringService.java), with its real constants, run on a
   sample title. The title's vector is illustrative; the arithmetic is the project's.
   AURA: the privacy pipeline as the project describes it, and the fairness gate with its real figures. */
(() => {
  const body = document.getElementById('pdBody');
  if (!body) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------------------------------------------------------- Re:Watch: the trait mixer */
  const TRAITS = [['family', 'Found Family'], ['nostalgia', 'Nostalgia & Memory'], ['growth', 'Character Growth'], ['pacing', 'Slow Burn Pacing'], ['humor', 'Humor & Lightheartedness'],
    ['romance', 'Romance'], ['intensity', 'Emotional Intensity'], ['hope', 'Hopeful Payoff'], ['bitter', 'Bittersweet Drama'], ['comfort', 'Comfort & Warmth']];
  const TITLE = [.7, .45, .6, .35, .55, .3, .65, .7, .4, .6];                       // a sample title, not a real film
  const PRESETS = { 'No preferences': Array(10).fill(.5), Cozy: [.8, .7, .5, .6, .7, .5, .3, .7, .3, .9], Intense: [.4, .3, .8, .7, .2, .5, .9, .4, .8, .2] };
  function rewatchScore(u) {
    // ScoringService.score(), additive and SHAP-style: salience -> weight -> share; affinity; signed contribution; absolute calibration
    const FLOOR = .15, GAMMA = 1.3, MID = 50, MIN = 5, MAX = 99, ANCHOR = .8, SLOPE = 440;
    const w = u.map(x => FLOOR + (1 - FLOOR) * Math.pow(Math.min(1, 2 * Math.abs(x - .5)), GAMMA)), tw = w.reduce((a, b) => a + b, 0);
    const share = w.map(x => x / tw), aff = u.map((x, i) => 1 - Math.abs(x - TITLE[i]));
    const wa = share.reduce((a, s, i) => a + s * aff[i], 0), unc = MID + SLOPE * (wa - ANCHOR), sc = Math.max(MIN, Math.min(MAX, unc));
    const den = unc - MID, shrink = Math.abs(den) < 1e-9 ? 1 : (sc - MID) / den;       // the clamp is absorbed proportionally
    const c = share.map((s, i) => SLOPE * s * (aff[i] - ANCHOR) * shrink);
    // largest-remainder rounding so the printed parts add up exactly to the printed score
    const T = Math.round((Math.round(sc * 10) / 10 - MID) * 10), fl = c.map(x => Math.floor(x * 10));
    let def = T - fl.reduce((a, b) => a + b, 0);
    const rem = c.map((x, i) => [x * 10 - fl[i], i]);
    rem.sort((a, b) => def > 0 ? b[0] - a[0] : a[0] - b[0]);
    for (let k = 0; def !== 0 && k < rem.length * 3; k++, def += def > 0 ? -1 : 1) fl[rem[k % rem.length][1]] += def > 0 ? 1 : -1;
    return { score: Math.round(sc * 10) / 10, parts: fl.map(x => x / 10) };
  }
  window.RewatchModel = { rewatchScore, TRAITS, TITLE, PRESETS };
  const fmt = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);
  function mountMixer(host) {
    host.innerHTML = '<div class="mix"><div class="mix-head"><div class="mix-score"><b id="mxScore">50.0</b><span>match</span></div><p class="mix-eq" id="mxEq" aria-live="polite"></p></div>' +
      '<p class="mix-sub">Your taste, ten traits. Move a slider and watch each trait’s contribution to the score of one sample title.</p><div class="mix-rows">' +
      TRAITS.map((t, i) => '<div class="mix-row"><label for="mx' + i + '">' + esc(t[1]) + '</label><input id="mx' + i + '" type="range" min="0" max="1" step="0.01" value="0.5"><div class="mix-bar" aria-hidden="true"><i></i></div><output id="mo' + i + '">+0.0</output></div>').join('') +
      '</div><div class="mix-pre"><span>Try</span>' + Object.keys(PRESETS).map(k => '<button type="button" data-p="' + k + '">' + k + '</button>').join('') + '</div>' +
      '<p class="demo-note">The scoring arithmetic is the real model from the repository: weights, signed contributions, a calibrated slope and anchor, and rounding that makes the parts add up. The sample title’s trait values are made up for this demo. It assumes a fully calibrated profile (every trait has full confidence) and leaves out the model’s quality prior.</p></div>';
    const ins = [...host.querySelectorAll('input')], bars = [...host.querySelectorAll('.mix-bar i')], outs = [...host.querySelectorAll('output')];
    function update() {
      const r = rewatchScore(ins.map(i => +i.value)), mx = Math.max(8, ...r.parts.map(Math.abs));
      r.parts.forEach((v, i) => { outs[i].textContent = fmt(v); const p = Math.min(50, Math.abs(v) / mx * 50); bars[i].style.width = p + '%'; bars[i].style.left = v >= 0 ? '50%' : (50 - p) + '%'; bars[i].className = v >= 0 ? 'pos' : 'neg'; });
      const sum = r.parts.reduce((a, b) => a + b, 0);
      $('#mxScore', host).textContent = r.score.toFixed(1);
      $('#mxEq', host).textContent = '50.0 base ' + (sum >= 0 ? '+ ' : '− ') + Math.abs(sum).toFixed(1) + ' from the ten traits = ' + r.score.toFixed(1);
    }
    ins.forEach(i => i.addEventListener('input', update));
    host.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { PRESETS[b.dataset.p].forEach((v, i) => ins[i].value = v); update(); }));
    update();
  }

  /* ---------------------------------------------------------------- AURA: pipeline and fairness gate */
  const STAGES = [
    ['Selfie', 'The photo is taken on the phone. There is no image column in the database, and consent is logged before the camera opens.'],
    ['MediaPipe', 'MediaPipe runs on the phone and reduces the selfie to a few numbers.'],
    ['Numbers', 'Five face ratios, colour values, a skin-tone band and a lighting score.'],
    ['FastAPI', 'Only those numbers reach a FastAPI backend, which rejects extra fields and stores them in Supabase with row-level security.'],
    ['Random forest', 'A scikit-learn random forest estimates face shape. Confidence is always shown, and low colour confidence leads to a short quiz instead of a guess.']
  ];
  function mountAura(host) {
    host.innerHTML = '<div class="pipe"><p class="pipe-k">What happens to a selfie</p><div class="pipe-row"><div class="pipe-side"><span>on the phone</span></div>' +
      STAGES.map((s, i) => '<button type="button" class="pipe-st' + (i === 0 ? ' on' : '') + '" data-i="' + i + '"><i>' + (i + 1) + '</i><b>' + s[0] + '</b></button>' + (i === 2 ? '<div class="pipe-wire"><span>numbers only</span></div>' : (i < 4 ? '<em aria-hidden="true"></em>' : ''))).join('') +
      '<div class="pipe-side pipe-side-r"><span>on the server</span></div></div><div class="pipe-flow" aria-hidden="true"><u class="pf-photo"></u><u class="pf-n pf-n1"></u><u class="pf-n pf-n2"></u><u class="pf-n pf-n3"></u><u class="pf-n pf-n4"></u></div>' +
      '<p class="pipe-cap" id="pipeCap" aria-live="polite"></p><button type="button" class="pipe-replay">Replay</button></div>' +
      '<div class="gate"><p class="pipe-k">The fairness gate</p><div class="gate-track" aria-hidden="true"><i class="gate-fill"></i><span class="gate-lim"><b>limit</b></span><span class="gate-now"><b>now 21.6</b></span></div>' +
      '<label class="gate-l" for="gateRange">Allowed accuracy gap across skin-tone bands: <output id="gateOut">5</output> points</label><input id="gateRange" type="range" min="0" max="30" step="0.5" value="5"><p class="gate-msg" id="gateMsg" aria-live="polite"></p>' +
      '<div class="gate-acc"><div><b>57.3%</b><span>held-out accuracy, 839 images, 5 classes</span></div><div><b>20%</b><span>what picking at random among five classes would give</span></div></div>' +
      '<p class="demo-note">The figures are the ones in this project’s results. The limit is 5 points and the gap is 21.6, so the gate is closed and the model is not cleared for launch. Move the limit to see where it would open; the real limit stays at 5.</p></div>';
    const cap = $('#pipeCap', host), btns = [...host.querySelectorAll('.pipe-st')];
    const show = i => { btns.forEach((b, k) => b.classList.toggle('on', k === i)); cap.textContent = STAGES[i][1]; };
    btns.forEach((b, i) => { b.addEventListener('click', () => show(i)); b.addEventListener('mouseenter', () => show(i)); b.addEventListener('focus', () => show(i)); });
    show(0);
    const flow = $('.pipe-flow', host);
    const replay = () => { flow.classList.remove('run'); void flow.offsetWidth; if (!reduce) flow.classList.add('run'); };
    $('.pipe-replay', host).addEventListener('click', replay); replay();
    const NOW = 21.6, rg = $('#gateRange', host), lim = $('.gate-lim', host), now = $('.gate-now', host), fill = $('.gate-fill', host), msg = $('#gateMsg', host), out = $('#gateOut', host);
    function gate() {
      const l = +rg.value; out.textContent = l % 1 ? l.toFixed(1) : l; lim.style.left = (l / 30 * 100) + '%'; now.style.left = (NOW / 30 * 100) + '%'; fill.style.width = (NOW / 30 * 100) + '%';
      const open = NOW <= l; host.querySelector('.gate').classList.toggle('open', open);
      msg.textContent = open ? 'At a limit this loose the gate would open. The real limit is 5, so it stays closed.' : 'Closed. The gap is 21.6 points against a limit of ' + out.textContent + ', so the model is blocked from launch.';
    }
    rg.addEventListener('input', gate); gate();
  }

  /* ---------------------------------------------------------------- mount after each render of the dialog */
  function mount() {
    const pd = $('.pd', body); if (!pd || pd.querySelector('.pviz')) return;
    const title = ($('#pdTitle', pd) || {}).textContent; if (title !== 'Re:Watch' && title !== 'AURA') return;
    const anchor = [...pd.querySelectorAll('section')].find(s => (s.querySelector('h4') || {}).textContent === 'The problem'); if (!anchor) return;
    const sec = document.createElement('section'); sec.className = 'pviz';
    sec.innerHTML = '<h4>See it work</h4><h3>' + (title === 'Re:Watch' ? 'Why a match score adds up' : 'What leaves the phone, and why it is not cleared') + '</h3><div class="pviz-body"></div>';
    anchor.parentNode.insertBefore(sec, anchor);
    (title === 'Re:Watch' ? mountMixer : mountAura)($('.pviz-body', sec));
  }
  new MutationObserver(mount).observe(body, { childList: true });
  mount();
})();
