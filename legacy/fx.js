/* The motion system. One vocabulary for the whole site, built on Motion (vanilla build).

   The verb is PRESS: things are struck into a surface, lifted toward the lamp, pressed down, and released.
     STRIKE   an element arrives: a short fall that lands and settles          (entrances)
     LIFT     the pointer is over it: it rises a little toward the light         (hover)
     PRESS    it is pressed: it sinks, shadows tighten, the inner shadow deepens (active)
     RELEASE  it springs back, with a little give                                (release)

   Timing rules
     micro   .16s   color, small state changes
     ui      .35s   most interface changes
     scene   .8s    whole-section reveals and image wipes
   Easing: out [.22,1,.36,1] for arrivals, inOut [.65,0,.35,1] for wipes. Springs: settle (100/20) for things that land,
   lift (300/26) for hover, press (520/30) and release (380/17) for keys and buttons.
   With reduced motion nothing animates: elements are shown in their final state and wipes are cuts. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion;
  if (!M || reduce) {                       // no library, or no motion wanted: show everything at once
    root.classList.add('fx-off');
    window.FX = { reduce: true, on: false, press() {}, release() {}, strike() {}, wipe: (el, done) => { done && done(); }, openDialog(ov, from, ready) { ov.classList.add('open'); ready && ready(); }, closeDialog(ov, done) { done(); }, tokens: {} };
    return;
  }
  const { animate, inView, scroll, stagger } = M;
  const ease = { out: [.22, 1, .36, 1], inOut: [.65, 0, .35, 1] };
  const dur = { micro: .16, ui: .35, scene: .8 };
  const spring = {
    settle: { type: 'spring', stiffness: 100, damping: 20 },
    land: { type: 'spring', stiffness: 150, damping: 17 },
    lift: { type: 'spring', stiffness: 300, damping: 26 },
    press: { type: 'spring', stiffness: 520, damping: 30 },
    release: { type: 'spring', stiffness: 380, damping: 17 }
  };
  root.classList.add('fx-on');

  /* ---- press / release: drives a --p variable (0 = resting, 1 = fully pressed) that the CSS turns into depth ---- */
  const pressing = new WeakMap();
  function setP(el, v) { el.style.setProperty('--p', v.toFixed(3)); }
  function press(el) {
    const cur = pressing.get(el); if (cur) cur.stop();
    const from = parseFloat(el.style.getPropertyValue('--p')) || 0;
    pressing.set(el, animate(from, 1, { ...spring.press, onUpdate: v => setP(el, v) }));
  }
  function release(el) {
    const cur = pressing.get(el); if (cur) cur.stop();
    const from = parseFloat(el.style.getPropertyValue('--p')) || 0;
    pressing.set(el, animate(from, 0, { ...spring.release, onUpdate: v => setP(el, Math.max(-.12, v)), onComplete: () => setP(el, 0) }));
  }

  /* ---- strike: arrival of an element (or a list, staggered) ---- */
  function strike(targets, opts) {
    const o = Object.assign({ y: 36, scale: 1.05, delay: 0, gap: .08, rotate: 0 }, opts);
    const els = typeof targets === 'string' ? [...document.querySelectorAll(targets)] : [].concat(targets);
    els.forEach(el => el.style.willChange = 'transform,opacity');
    return animate(els, { opacity: [0, 1], transform: ['translateY(' + o.y + 'px) scale(' + o.scale + ') rotate(' + o.rotate + 'deg)', 'translateY(0) scale(1) rotate(0deg)'] },
      { delay: stagger(o.gap, { startDelay: o.delay }), ...spring.land, opacity: { duration: .25 } }).finished.then(() => els.forEach(el => { el.style.willChange = ''; el.style.transform = ''; }));
  }

  /* ---- wipe: an image is revealed through a moving mask while it settles from slightly larger ---- */
  function wipe(el, done, dir) {
    const from = dir === 'down' ? 'inset(0 0 100% 0)' : dir === 'up' ? 'inset(100% 0 0 0)' : 'inset(0 100% 0 0)';
    animate(el, { clipPath: [from, 'inset(0 0 0 0)'], scale: [1.14, 1] }, { duration: dur.scene, ease: ease.inOut }).finished.then(() => { el.style.clipPath = ''; el.style.transform = ''; done && done(); });
  }

  /* ---- declarative reveals: data-fx="strike | rise | wipe" on any element, optional data-fx-delay ---- */
  function reveals() {
    document.querySelectorAll('[data-fx]').forEach(el => {
      const kind = el.dataset.fx, delay = parseFloat(el.dataset.fxDelay || 0);
      inView(el, () => {
        if (kind === 'wipe') { const img = el.querySelector('img') || el; el.style.opacity = 1; wipe(img, null, el.dataset.fxDir); animate(el, { opacity: [0, 1] }, { duration: .3 }); }
        else if (kind === 'rise') animate(el, { opacity: [0, 1], transform: ['translateY(26px)', 'translateY(0)'] }, { duration: dur.scene, delay, ease: ease.out }).finished.then(() => { el.style.transform = ''; });
        else strike(el, { delay });
      }, { amount: .25 });
    });
  }

  /* ---- magnetic pull: the element leans a few pixels toward the pointer while it is near ---- */
  function magnet(el, strength) {
    const s = strength || 8; let on = false;
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return; const r = el.getBoundingClientRect(); on = true;
      const x = ((e.clientX - r.left) / r.width - .5) * s * 2, y = ((e.clientY - r.top) / r.height - .5) * s * 2;
      animate(el, { transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)' }, spring.lift);
    });
    el.addEventListener('pointerleave', () => { if (on) animate(el, { transform: 'translate(0px,0px)' }, spring.release); on = false; });
  }

  /* ---- dialogs: the sheet opens out of the thing that was pressed, over a backdrop that clears and blurs ---- */
  function openDialog(ov, from, ready) {
    const sheet = ov.querySelector('.sheet');
    ov.classList.add('open'); ov.style.opacity = 0; ov.style.backdropFilter = 'blur(0px)'; ov.style.webkitBackdropFilter = 'blur(0px)';
    if (ready) ready();
    const s = sheet.getBoundingClientRect(), f = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null;
    animate(ov, { opacity: [0, 1] }, { duration: dur.ui, ease: ease.out });
    animate(0, 8, { duration: .5, ease: ease.out, onUpdate: v => { const b = 'blur(' + v.toFixed(1) + 'px)'; ov.style.backdropFilter = b; ov.style.webkitBackdropFilter = b; } });
    if (f && s.width) {
      const t = Math.max(0, f.top - s.top), r = Math.max(0, s.right - f.right), b = Math.max(0, s.bottom - f.bottom), l = Math.max(0, f.left - s.left);
      sheet.style.transformOrigin = ((f.left + f.width / 2 - s.left) / s.width * 100).toFixed(0) + '% ' + ((f.top + f.height / 2 - s.top) / s.height * 100).toFixed(0) + '%';
      animate(sheet, { clipPath: ['inset(' + t + 'px ' + r + 'px ' + b + 'px ' + l + 'px round 22px)', 'inset(0px 0px 0px 0px round 24px)'], transform: ['scale(.94)', 'scale(1)'], opacity: [.2, 1] }, { duration: .65, ease: ease.out }).finished.then(() => { sheet.style.clipPath = ''; sheet.style.transform = ''; });
    } else animate(sheet, { transform: ['translateY(24px) scale(.97)', 'none'], opacity: [0, 1] }, { duration: .5, ease: ease.out });
  }
  function closeDialog(ov, done) {
    const sheet = ov.querySelector('.sheet');
    animate(sheet, { transform: ['scale(1)', 'scale(.96)'], opacity: [1, 0] }, { duration: .26, ease: ease.inOut });
    animate(0, 8, { duration: .3, onUpdate: v => { const b = 'blur(' + (8 - v).toFixed(1) + 'px)'; ov.style.backdropFilter = b; ov.style.webkitBackdropFilter = b; } });
    animate(ov, { opacity: [1, 0] }, { duration: .3, ease: ease.inOut }).finished.then(() => { ov.style.opacity = ''; ov.style.backdropFilter = ''; ov.style.webkitBackdropFilter = ''; sheet.style.transform = ''; sheet.style.opacity = ''; done(); });
  }

  window.FX = { reduce: false, on: true, M, animate, inView, scroll, stagger, ease, dur, spring, press, release, strike, wipe, magnet, openDialog, closeDialog, reveals, tokens: { ease, dur, spring } };
  window.addEventListener('DOMContentLoaded', reveals);
  if (document.readyState !== 'loading') reveals();
  // if anything stalls, never leave content hidden
  setTimeout(() => root.classList.add('fx-ready'), 2500);
})();
