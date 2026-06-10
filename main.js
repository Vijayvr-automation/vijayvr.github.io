/* ══════════════════════════════════════════════
   PORTFOLIO  –  MAIN.JS
   Full-page scroll snap, nav, interactions
══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── State ─── */
  const TOTAL   = 6;
  let current   = 0;
  let isAnimating = false;
  const ANIM_DUR  = 920; // ms — must match CSS transition

  /* ─── DOM refs ─── */
  const panels     = Array.from(document.querySelectorAll('.panel'));
  const railDots   = Array.from(document.querySelectorAll('.rail-dot'));
  const railProg   = document.getElementById('railProgress');
  const navbar     = document.getElementById('navbar');
  const navLinks   = document.getElementById('navLinks');
  const navToggle  = document.getElementById('navToggle');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[data-section]'));

  /* ─── Mobile detection ─── */
  const isMobile = () => window.innerWidth <= 600;

  /* ─── Light/dark panel map ─── */
  const isDark = [false, true, false, true, false, true]; // per panel

  /* ════════════════════════════════════════════
     CORE: go to panel N
  ════════════════════════════════════════════ */
  function goTo(idx, skipAnim) {
    if (idx < 0 || idx >= TOTAL) return;
    if (idx === current && !skipAnim) return;
    if (isAnimating && !skipAnim) return;

    isAnimating = true;
    const prev = current;
    current = idx;

    /* Position all panels:
       - panels before current: -100% (above, already gone)
       - current panel: 0
       - panels after current: 100% (below) */
    panels.forEach((p, i) => {
      const offset = i - current;
      p.style.transition = skipAnim
        ? 'none'
        : 'transform .85s cubic-bezier(.76,0,.24,1)';
      p.style.transform = `translateY(${offset * 100}%)`;
    });

    // Trigger reveal on incoming panel
    if (!skipAnim) {
      revealPanel(current);
    }

    // Update UI
    updateNav(current);
    updateRail(current);
    updateNavbar(current);

    // Close mobile nav if open
    navLinks.classList.remove('open');

    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  /* ════════════════════════════════════════════
     PANEL REVEAL ANIMATION
  ════════════════════════════════════════════ */
  function revealPanel(idx) {
    const panel = panels[idx];
    const items = panel.querySelectorAll('.panel-reveal');
    items.forEach(el => el.classList.remove('revealed'));
    // Trigger reflow, then add class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach(el => el.classList.add('revealed'));
      });
    });
  }

  /* ════════════════════════════════════════════
     NAV + RAIL UPDATES
  ════════════════════════════════════════════ */
  function updateNav(idx) {
    navAnchors.forEach(a => {
      a.classList.toggle('active', parseInt(a.dataset.section) === idx);
    });
  }

  function updateRail(idx) {
    railDots.forEach((d, i) => d.classList.toggle('active', i === idx));
    const pct = TOTAL > 1 ? (idx / (TOTAL - 1)) * 100 : 0;
    railProg.style.height = pct + '%';
  }

  function updateNavbar(idx) {
    const dark = isDark[idx];
    navbar.classList.toggle('on-dark',  dark);
    navbar.classList.toggle('on-light', !dark);
    // Rail contrast
    document.body.classList.toggle('rail-light', !dark);
  }

  /* ════════════════════════════════════════════
     INPUT: MOUSE WHEEL
  ════════════════════════════════════════════ */
  let wheelAccum = 0;
  const WHEEL_THRESHOLD = 60;

  window.addEventListener('wheel', (e) => {
    if (isMobile()) return;
    e.preventDefault();
    if (isAnimating) return;
    wheelAccum += e.deltaY;
    if (wheelAccum > WHEEL_THRESHOLD) {
      wheelAccum = 0;
      goTo(current + 1);
    } else if (wheelAccum < -WHEEL_THRESHOLD) {
      wheelAccum = 0;
      goTo(current - 1);
    }
  }, { passive: false });

  /* ════════════════════════════════════════════
     INPUT: TOUCH / SWIPE
  ════════════════════════════════════════════ */
  let touchStart = null;
  const SWIPE_THRESHOLD = 50;

  window.addEventListener('touchstart', (e) => {
    touchStart = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientY;
    touchStart = null;
    if (isMobile()) return;
    if (isAnimating) return;
    if (delta > SWIPE_THRESHOLD)       goTo(current + 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(current - 1);
  }, { passive: true });

  /* ════════════════════════════════════════════
     INPUT: KEYBOARD
  ════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1); }
  });

  /* ════════════════════════════════════════════
     RAIL DOTS
  ════════════════════════════════════════════ */
  railDots.forEach(dot => {
    dot.addEventListener('click', () => goTo(parseInt(dot.dataset.idx)));
  });

  /* ════════════════════════════════════════════
     NAV LINKS
  ════════════════════════════════════════════ */
  navAnchors.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(parseInt(a.dataset.section));
    });
  });

  /* Nav brand → home */
  document.querySelector('.nav-brand').addEventListener('click', (e) => {
    e.preventDefault();
    goTo(0);
  });

  /* Mobile toggle */
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  /* ════════════════════════════════════════════
     SCROLL-NEXT BUTTONS
  ════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.scroll-next');
    if (!btn) return;
    const next = parseInt(btn.dataset.next);
    if (!isNaN(next)) goTo(next);
  });

  /* ════════════════════════════════════════════
     BUTTON RIPPLE
  ════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
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

  /* ════════════════════════════════════════════
     CURSOR GLOW (desktop)
  ════════════════════════════════════════════ */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.getElementById('cursor-glow');
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function animGlow() {
      cx += (mx - cx) * 0.1;
      cy += (my - cy) * 0.1;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(animGlow);
    })();
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, .tech-card, .stat-card, .contact-card'))
        glow.classList.add('glow-expand');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, .tech-card, .stat-card, .contact-card'))
        glow.classList.remove('glow-expand');
    });
  }

  /* ════════════════════════════════════════════
     STAT COUNTER ANIMATION
  ════════════════════════════════════════════ */
  function animateCounter(el, target, duration) {
    const num = parseInt(target);
    if (isNaN(num)) return;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * num);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Fire when stats panel becomes active
  let statsAnimated = false;
  const origGoTo = goTo;

  /* ════════════════════════════════════════════
     CODE LINES BLINK
  ════════════════════════════════════════════ */
  const codeLines = document.querySelectorAll('.prof-code-line');
  if (codeLines.length) {
    setInterval(() => {
      const idx = Math.floor(Math.random() * codeLines.length);
      codeLines[idx].classList.add('blink');
      setTimeout(() => codeLines[idx].classList.remove('blink'), 380);
    }, 700);
  }

  /* ════════════════════════════════════════════
     TYPING EFFECT for hero eyebrow
  ════════════════════════════════════════════ */
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (eyebrow) {
    const text = eyebrow.textContent;
    eyebrow.textContent = '';
    eyebrow.style.opacity = 1;
    let i = 0;
    setTimeout(() => {
      const t = setInterval(() => {
        eyebrow.textContent += text[i++];
        if (i >= text.length) clearInterval(t);
      }, 52);
    }, 400);
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // Mark all reveal items
    panels.forEach(panel => {
      const children = panel.querySelectorAll(
        '.about-text > *, .about-visual, ' +
        '.tech-inner > *, .tech-card, ' +
        '.stats-left > *, .stat-card, ' +
        '.projects-inner > *, ' +
        '.contact-inner > *'
      );
      children.forEach(el => el.classList.add('panel-reveal'));
    });

    // Initial position (no animation)
    goTo(0, true);
    // Reveal home panel children immediately
    revealPanel(0);

    // Hook stat counter to panel-3 visit
    const _goTo = goTo;
    window.__goTo = function(idx, skip) {
      _goTo(idx, skip);
      if (idx === 3 && !statsAnimated) {
        statsAnimated = true;
        setTimeout(() => {
          document.querySelectorAll('.stat-number[data-target]').forEach(el => {
            animateCounter(el, el.dataset.target, 1400);
          });
        }, 350);
      }
    };
  });

  // Patch goTo calls to use the hooked version for stat counters
  // Re-wire all event listeners through a unified dispatcher
  function dispatch(idx, skip) {
    if (window.__goTo) window.__goTo(idx, skip);
    else goTo(idx, skip);
  }

  // Override rail dots
  railDots.forEach(dot => {
    dot.onclick = () => dispatch(parseInt(dot.dataset.idx));
  });
  // Override nav anchors
  navAnchors.forEach(a => {
    a.onclick = (e) => { e.preventDefault(); dispatch(parseInt(a.dataset.section)); };
  });
  // Scroll-next buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.scroll-next');
    if (!btn) return;
    const next = parseInt(btn.dataset.next);
    if (!isNaN(next)) dispatch(next);
  });
  // Wheel
  window.onwheel = null;
  window.addEventListener('wheel', (e) => {
    if (isMobile()) return;
    e.preventDefault();
    if (isAnimating) return;
    wheelAccum += e.deltaY;
    if (wheelAccum > WHEEL_THRESHOLD) { wheelAccum = 0; dispatch(current + 1); }
    else if (wheelAccum < -WHEEL_THRESHOLD) { wheelAccum = 0; dispatch(current - 1); }
  }, { passive: false });
  // Touch
  window.addEventListener('touchend', (e) => {
    if (touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientY;
    touchStart = null;
    if (isMobile()) return;
    if (isAnimating) return;
    if (delta > SWIPE_THRESHOLD)       dispatch(current + 1);
    else if (delta < -SWIPE_THRESHOLD) dispatch(current - 1);
  }, { passive: true });
  // Keys
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); dispatch(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); dispatch(current - 1); }
  });

})();
