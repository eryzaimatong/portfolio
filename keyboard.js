/* The keyboard. Every technology on the stack is a key, and so are the ways to reach me.
   A key is three layers (a dark well, a side wall, a dished cap) lit by the same lamp as the rest of the page. Pressing one
   drives --p from 0 to 1 with a fast spring (the cap sinks, its side wall and cast shadow shrink, the inner shadow deepens);
   releasing springs it back with a little overshoot. Clicking, tapping, pressing Enter or Space, or simply typing a letter
   presses a key and shows what it is on the display. All of it works from the keyboard; nothing depends on hover. */
(() => {
  const FX = window.FX || { on: false };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const board = $('#board'), lcd = $('#lcd');

  function bindKey(el) {
    if (!FX.on) return;
    const down = () => FX.press(el), up = () => FX.release(el);
    el.addEventListener('pointerdown', e => { if (e.button === 0 || e.pointerType !== 'mouse') down(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, up));
    el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) down(); });
    el.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') up(); });
    el.addEventListener('blur', up);
  }
  // size each keycap from its legend length so long names never spill over neighbours
  $$('.key').forEach(k => { const l = k.querySelector('.legend'); if (l) k.style.setProperty('--n', String(l.textContent.trim().length)); });
  $$('.key').forEach(bindKey);

  /* ---- the tech keys: pressing one lights it and reads it out ---- */
  if (board && lcd) {
    const k = $('.lcd-k', lcd), t = $('.lcd-t', lcd), keys = $$('.keys .key', board);
    const say = key => {
      const cat = key.closest('.krow').querySelector('.kmod').textContent.replace(/^\d+\s*/, '').trim();
      const proj = key.dataset.p, used = key.classList.contains('used');
      k.textContent = key.dataset.t;
      t.textContent = cat + '. ' + (proj ? 'Used in ' + proj + '.' : used ? 'Used in my projects.' : 'On my stack.');
    };
    // category keys: a category lights its rows and dims the rest (every key stays available)
    const ctl = $$('.key-ctl', board);
    ctl.forEach(c => c.addEventListener('click', () => {
      ctl.forEach(x => { const on = x === c; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      board.dataset.cat = c.dataset.cat;
      const nm = c.dataset.cat === 'all' ? null : c.textContent.trim();
      if (nm) { $('.lcd-k', lcd).textContent = nm; $('.lcd-t', lcd).textContent = 'Showing this category. Press any key for details.'; }
    }));
    // one tab stop for the whole keyboard; the arrow keys move between keys (Up and Down move between rows)
    keys.forEach((x, i) => { x.tabIndex = i === 0 ? 0 : -1; });
    board.addEventListener('keydown', e => {
      const kk = e.target.closest && e.target.closest('.keys .key'); if (!kk) return;
      const i = keys.indexOf(kk); let n = -1;
      if (e.key === 'ArrowRight') n = i + 1; else if (e.key === 'ArrowLeft') n = i - 1; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = keys.length - 1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const r = kk.getBoundingClientRect(), dir = e.key === 'ArrowDown' ? 1 : -1; let bd = 1e9;
        keys.forEach((o, j) => { const q = o.getBoundingClientRect(), dy = (q.top - r.top) * dir; if (dy > r.height * .4) { const d = dy + Math.abs((q.left + q.width / 2) - (r.left + r.width / 2)) * .6; if (d < bd) { bd = d; n = j; } } });
      }
      if (n >= 0 && n < keys.length) { e.preventDefault(); keys[i].tabIndex = -1; keys[n].tabIndex = 0; keys[n].focus(); }
    });
    keys.forEach(key => key.addEventListener('click', () => { keys.forEach(x => x.classList.remove('sel')); key.classList.add('sel'); say(key); }));
    // typing: a letter presses the next key whose name starts with it (a small discovery)
    let seen = false, last = { ch: '', i: -1 };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; }, { threshold: .25 }).observe(board);
    addEventListener('keydown', e => {
      if (!seen || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || /\s/.test(e.key)) return;
      const tg = e.target; if (tg && tg.closest && tg.closest('input,textarea,select,[contenteditable],.overlay.open')) return;
      const ch = e.key.toLowerCase(), hits = keys.filter(x => x.dataset.t.toLowerCase().startsWith(ch)); if (!hits.length) return;
      const from = last.ch === ch ? last.i + 1 : 0, key = hits[from % hits.length]; last = { ch, i: from % hits.length };
      keys.forEach(x => x.classList.remove('sel')); key.classList.add('sel'); say(key);
      if (FX.on) { FX.press(key); setTimeout(() => FX.release(key), 120); }
    });
  }

  /* ---- contact: copy the address ---- */
  const copy = $('#copyMail'), legend = $('#copyLegend');
  if (copy && legend) {
    const live = document.createElement('span'); live.className = 'sr-only'; live.setAttribute('role', 'status'); copy.parentNode.appendChild(live);
    let timer = 0;
    copy.addEventListener('click', async () => {
      const addr = 'imatongeryzamae@gmail.com'; let ok = false;
      try { await navigator.clipboard.writeText(addr); ok = true; } catch (e) {
        try { const ta = document.createElement('textarea'); ta.value = addr; ta.style.position = 'fixed'; ta.style.opacity = 0; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (e2) { }
      }
      legend.textContent = ok ? 'copied' : 'imatongeryzamae@gmail.com'; live.textContent = ok ? 'Email address copied' : 'Copy is not available here. The address is shown on the key.';
      clearTimeout(timer); timer = setTimeout(() => { legend.textContent = 'copy address'; live.textContent = ''; }, 1800);
    });
  }

})();
