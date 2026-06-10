/* ══════════════════════════════════════════════
   PORTFOLIO  –  MAIN.JS
   Desktop: full-page JS snap
   Mobile (≤600px): native scroll, no JS interference
══════════════════════════════════════════════ */
(function () {
  'use strict';

  const MOBILE_BP     = 600;
  const TOTAL         = 6;
  const ANIM_DUR      = 920;
  const WHEEL_THRESH  = 60;
  const SWIPE_THRESH  = 50;

  let current     = 0;
  let isAnimating = false;
  let statsAnimated = false;
  let touchStartY = null;
  let wheelAccum  = 0;

  /* ── DOM ── */
  const panels     = Array.from(document.querySelectorAll('.panel'));
  const railDots   = Array.from(document.querySelectorAll('.rail-dot'));
  const railProg   = document.getElementById('railProgress');
  const navbar     = document.getElementById('navbar');
  const navLinks   = document.getElementById('navLinks');
  const navToggle  = document.getElementById('navToggle');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[data-section]'));
  const isDark     = [false, true, false, true, false, true];

  const mob = () => window.innerWidth <= MOBILE_BP;

  /* ══════════════════════════════════════════
     DESKTOP SNAP
  ══════════════════════════════════════════ */
  function goTo(idx, instant) {
    if (idx < 0 || idx >= TOTAL) return;
    if (idx === current && !instant) return;
    if (isAnimating && !instant) return;
    isAnimating = true;
    current = idx;
    panels.forEach((p, i) => {
      p.style.transition = instant ? 'none' : 'transform .85s cubic-bezier(.76,0,.24,1)';
      p.style.transform  = `translateY(${(i - current) * 100}%)`;
    });
    if (!instant) revealPanel(current);
    syncUI(current);
    navLinks.classList.remove('open');
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
    if (idx === 3) fireStats();
  }

  /* ══════════════════════════════════════════
     MOBILE NATIVE SCROLL
  ══════════════════════════════════════════ */
  function mobilePrepare() {
    /* Unlock the body and scroll-container */
    document.body.style.overflow        = '';
    document.body.style.height          = '';
    const sc = document.getElementById('scrollContainer');
    sc.style.position  = 'static';
    sc.style.overflow  = 'visible';
    sc.style.height    = 'auto';
    /* Clear every JS transform — CSS @media also does this but belt+braces */
    panels.forEach(p => {
      p.style.transition = 'none';
      p.style.transform  = 'none';
      p.style.position   = 'relative';
      p.style.height     = 'auto';
      p.style.minHeight  = '100svh';
      p.style.overflow   = 'visible';
    });
    /* Show all content immediately (no reveal animation on mobile) */
    document.querySelectorAll('.panel-reveal').forEach(el => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
      el.style.transition= 'none';
      el.classList.add('revealed');
    });
    syncUI(0);
    /* IntersectionObserver for nav highlight + stat counter */
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = parseInt(e.target.dataset.idx);
        if (isNaN(i)) return;
        current = i;
        syncUI(i);
        if (i === 3) fireStats();
      });
    }, { threshold: 0.4 });
    panels.forEach(p => obs.observe(p));
  }

  function mobileGoTo(idx) {
    const target = panels[idx];
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '56');
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    navLinks.classList.remove('open');
  }

  /* ══════════════════════════════════════════
     SHARED UI SYNC
  ══════════════════════════════════════════ */
  function syncUI(idx) {
    navAnchors.forEach(a => a.classList.toggle('active', parseInt(a.dataset.section) === idx));
    railDots.forEach((d, i) => d.classList.toggle('active', i === idx));
    railProg.style.height = (TOTAL > 1 ? (idx / (TOTAL - 1)) * 100 : 0) + '%';
    navbar.classList.toggle('on-dark',  isDark[idx]);
    navbar.classList.toggle('on-light', !isDark[idx]);
    document.body.classList.toggle('rail-light', !isDark[idx]);
  }

  function revealPanel(idx) {
    const items = panels[idx].querySelectorAll('.panel-reveal');
    items.forEach(el => el.classList.remove('revealed'));
    requestAnimationFrame(() => requestAnimationFrame(() =>
      items.forEach(el => el.classList.add('revealed'))
    ));
  }

  function fireStats() {
    if (statsAnimated) return;
    statsAnimated = true;
    setTimeout(() => {
      document.querySelectorAll('.stat-number[data-target]').forEach(el => {
        const num = parseInt(el.dataset.target);
        if (isNaN(num)) return;
        let start = null;
        const step = ts => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / 1400, 1);
          el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * num);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, 350);
  }

  /* ══════════════════════════════════════════
     DISPATCH (nav/button clicks)
  ══════════════════════════════════════════ */
  function dispatch(idx) {
    if (mob()) mobileGoTo(idx);
    else goTo(idx);
  }

  /* ══════════════════════════════════════════
     DESKTOP: WHEEL  (registered non-passive
     only when NOT mobile, to avoid killing
     mobile touch-scroll)
  ══════════════════════════════════════════ */
  function onWheel(e) {
    if (mob()) return;          /* safety guard */
    e.preventDefault();
    if (isAnimating) return;
    wheelAccum += e.deltaY;
    if      (wheelAccum >  WHEEL_THRESH) { wheelAccum = 0; goTo(current + 1); }
    else if (wheelAccum < -WHEEL_THRESH) { wheelAccum = 0; goTo(current - 1); }
  }

  /* ══════════════════════════════════════════
     DESKTOP: SWIPE
  ══════════════════════════════════════════ */
  window.addEventListener('touchstart', e => {
    if (mob()) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', e => {
    if (mob() || touchStartY === null) return;
    const delta = touchStartY - e.changedTouches[0].clientY;
    touchStartY = null;
    if (isAnimating) return;
    if      (delta >  SWIPE_THRESH) goTo(current + 1);
    else if (delta < -SWIPE_THRESH) goTo(current - 1);
  }, { passive: true });

  /* ══════════════════════════════════════════
     KEYBOARD
  ══════════════════════════════════════════ */
  window.addEventListener('keydown', e => {
    if (mob()) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  /* ══════════════════════════════════════════
     NAV / BUTTONS
  ══════════════════════════════════════════ */
  railDots.forEach(d => d.addEventListener('click', () => dispatch(parseInt(d.dataset.idx))));
  navAnchors.forEach(a => a.addEventListener('click', e => { e.preventDefault(); dispatch(parseInt(a.dataset.section)); }));
  document.querySelector('.nav-brand').addEventListener('click', e => { e.preventDefault(); dispatch(0); });
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

  document.addEventListener('click', e => {
    const btn = e.target.closest('.scroll-next');
    if (btn) dispatch(parseInt(btn.dataset.next));
  });

  /* Ripple */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'btn-ripple';
    r.style.left = (e.clientX - rect.left) + 'px';
    r.style.top  = (e.clientY - rect.top)  + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });

  /* ══════════════════════════════════════════
     CURSOR GLOW
  ══════════════════════════════════════════ */
  if (window.matchMedia('(pointer:fine)').matches) {
    const glow = document.getElementById('cursor-glow');
    let mx=0,my=0,cx=0,cy=0;
    window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; }, { passive:true });
    (function tick() { cx+=(mx-cx)*.1; cy+=(my-cy)*.1; glow.style.transform=`translate(${cx}px,${cy}px)`; requestAnimationFrame(tick); })();
    document.addEventListener('mouseover', e => { if(e.target.closest('a,button,.tech-card,.stat-card,.contact-card')) glow.classList.add('glow-expand'); });
    document.addEventListener('mouseout',  e => { if(e.target.closest('a,button,.tech-card,.stat-card,.contact-card')) glow.classList.remove('glow-expand'); });
  }

  /* ══════════════════════════════════════════
     CODE LINE BLINK  +  TYPING EFFECT
  ══════════════════════════════════════════ */
  const codeLines = document.querySelectorAll('.prof-code-line');
  if (codeLines.length) setInterval(() => {
    const i = Math.floor(Math.random()*codeLines.length);
    codeLines[i].classList.add('blink');
    setTimeout(() => codeLines[i].classList.remove('blink'), 380);
  }, 700);

  const eyebrow = document.querySelector('.hero-eyebrow');
  if (eyebrow) {
    const txt = eyebrow.textContent; eyebrow.textContent=''; eyebrow.style.opacity=1; let i=0;
    setTimeout(() => { const t=setInterval(()=>{ eyebrow.textContent+=txt[i++]; if(i>=txt.length)clearInterval(t); },52); }, 400);
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    /* Mark reveal elements */
    panels.forEach(p => p.querySelectorAll(
      '.about-text>*,.about-visual,.tech-inner>*,.tech-card,' +
      '.stats-left>*,.stat-card,.projects-inner>*,.contact-inner>*'
    ).forEach(el => el.classList.add('panel-reveal')));

    if (mob()) {
      /* ── MOBILE path ── */
      mobilePrepare();
    } else {
      /* ── DESKTOP path ── */
      /* Register wheel as non-passive ONLY on desktop */
      window.addEventListener('wheel', onWheel, { passive: false });
      goTo(0, true);
      revealPanel(0);
    }
  });

})();
