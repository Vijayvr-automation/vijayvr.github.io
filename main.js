/* ══════════════════════════════════════════════
   PORTFOLIO  –  MAIN.JS
   Full-page scroll snap (desktop) + normal scroll (mobile)
══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Mobile breakpoint ─── */
  const MOBILE_BP = 600;
  const isMobile  = () => window.innerWidth <= MOBILE_BP;

  /* ─── State ─── */
  const TOTAL     = 6;
  let current     = 0;
  let isAnimating = false;
  const ANIM_DUR  = 920;

  /* ─── DOM refs ─── */
  const panels     = Array.from(document.querySelectorAll('.panel'));
  const railDots   = Array.from(document.querySelectorAll('.rail-dot'));
  const railProg   = document.getElementById('railProgress');
  const navbar     = document.getElementById('navbar');
  const navLinks   = document.getElementById('navLinks');
  const navToggle  = document.getElementById('navToggle');
  const navAnchors = Array.from(document.querySelectorAll('.nav-links a[data-section]'));

  /* ─── Light/dark panel map ─── */
  const isDark = [false, true, false, true, false, true];

  /* ════════════════════════════════════════════
     CORE: go to panel N  (desktop snap)
  ════════════════════════════════════════════ */
  function goTo(idx, skipAnim) {
    if (idx < 0 || idx >= TOTAL) return;
    if (idx === current && !skipAnim) return;
    if (isAnimating && !skipAnim) return;

    isAnimating = true;
    current     = idx;

    panels.forEach((p, i) => {
      const offset = i - current;
      p.style.transition = skipAnim ? 'none' : 'transform .85s cubic-bezier(.76,0,.24,1)';
      p.style.transform  = `translateY(${offset * 100}%)`;
    });

    if (!skipAnim) revealPanel(current);

    updateNav(current);
    updateRail(current);
    updateNavbar(current);
    navLinks.classList.remove('open');

    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  /* ════════════════════════════════════════════
     MOBILE: scroll to section by native scroll
  ════════════════════════════════════════════ */
  function mobileGoTo(idx) {
    const target = panels[idx];
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    current = idx;
    updateNav(idx);
    updateNavbar(idx);
    navLinks.classList.remove('open');
  }

  /* ════════════════════════════════════════════
     MOBILE: reset all panel transforms to none
  ════════════════════════════════════════════ */
  function resetPanelsForMobile() {
    panels.forEach(p => {
      p.style.transition = 'none';
      p.style.transform  = 'none';
    });
    document.body.style.overflow = 'auto';
  }

  /* ════════════════════════════════════════════
     MOBILE: track active section via IntersectionObserver
  ════════════════════════════════════════════ */
  let mobileObserver = null;

  function setupMobileObserver() {
    if (mobileObserver) mobileObserver.disconnect();
    mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.idx);
          if (!isNaN(idx)) {
            current = idx;
            updateNav(idx);
            updateRail(idx);
            updateNavbar(idx);
            if (idx === 3 && !statsAnimated) {
              statsAnimated = true;
              document.querySelectorAll('.stat-number[data-target]').forEach(el => {
                animateCounter(el, el.dataset.target, 1400);
              });
            }
          }
        }
      });
    }, { threshold: 0.45 });
    panels.forEach(p => mobileObserver.observe(p));
  }

  function teardownMobileObserver() {
    if (mobileObserver) { mobileObserver.disconnect(); mobileObserver = null; }
  }

  /* ════════════════════════════════════════════
     UNIFIED DISPATCH
  ════════════════════════════════════════════ */
  function dispatch(idx, skip) {
    if (isMobile()) {
      mobileGoTo(idx);
    } else {
      if (window.__goTo) window.__goTo(idx, skip);
      else goTo(idx, skip);
    }
  }

  /* ════════════════════════════════════════════
     PANEL REVEAL
  ════════════════════════════════════════════ */
  function revealPanel(idx) {
    const panel = panels[idx];
    const items = panel.querySelectorAll('.panel-reveal');
    items.forEach(el => el.classList.remove('revealed'));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        items.forEach(el => el.classList.add('revealed'));
      });
    });
  }

  /* ════════════════════════════════════════════
     NAV / RAIL / NAVBAR
  ════════════════════════════════════════════ */
  function updateNav(idx) {
    navAnchors.forEach(a =>
      a.classList.toggle('active', parseInt(a.dataset.section) === idx)
    );
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
    document.body.classList.toggle('rail-light', !dark);
  }

  /* ════════════════════════════════════════════
     INPUT: WHEEL (desktop only)
  ════════════════════════════════════════════ */
  let wheelAccum = 0;
  const WHEEL_THRESHOLD = 60;

  window.addEventListener('wheel', (e) => {
    if (isMobile()) return;
    e.preventDefault();
    if (isAnimating) return;
    wheelAccum += e.deltaY;
    if      (wheelAccum >  WHEEL_THRESHOLD) { wheelAccum = 0; dispatch(current + 1); }
    else if (wheelAccum < -WHEEL_THRESHOLD) { wheelAccum = 0; dispatch(current - 1); }
  }, { passive: false });

  /* ════════════════════════════════════════════
     INPUT: TOUCH / SWIPE (desktop snap only)
  ════════════════════════════════════════════ */
  let touchStart = null;
  const SWIPE_THRESHOLD = 50;

  window.addEventListener('touchstart', (e) => {
    if (isMobile()) return;
    touchStart = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (isMobile() || touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientY;
    touchStart = null;
    if (isAnimating) return;
    if      (delta >  SWIPE_THRESHOLD) dispatch(current + 1);
    else if (delta < -SWIPE_THRESHOLD) dispatch(current - 1);
  }, { passive: true });

  /* ════════════════════════════════════════════
     INPUT: KEYBOARD
  ════════════════════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); dispatch(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); dispatch(current - 1); }
  });

  /* ════════════════════════════════════════════
     RAIL DOTS
  ════════════════════════════════════════════ */
  railDots.forEach(dot => {
    dot.addEventListener('click', () => dispatch(parseInt(dot.dataset.idx)));
  });

  /* ════════════════════════════════════════════
     NAV LINKS
  ════════════════════════════════════════════ */
  navAnchors.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      dispatch(parseInt(a.dataset.section));
    });
  });

  document.querySelector('.nav-brand').addEventListener('click', (e) => {
    e.preventDefault();
    dispatch(0);
  });

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
    if (!isNaN(next)) dispatch(next);
  });

  /* ════════════════════════════════════════════
     BUTTON RIPPLE
  ════════════════════════════════════════════ */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const r    = document.createElement('span');
    r.className    = 'btn-ripple';
    r.style.left   = (e.clientX - rect.left) + 'px';
    r.style.top    = (e.clientY - rect.top)  + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });

  /* ════════════════════════════════════════════
     CURSOR GLOW (desktop pointer only)
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
  let statsAnimated = false;

  function animateCounter(el, target, duration) {
    const num = parseInt(target);
    if (isNaN(num)) return;
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p     = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * num);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

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
     RESIZE HANDLER
     Switch between mobile and desktop modes
  ════════════════════════════════════════════ */
  let lastMobile = isMobile();

  function handleResize() {
    const nowMobile = isMobile();
    if (nowMobile === lastMobile) return;
    lastMobile = nowMobile;

    if (nowMobile) {
      resetPanelsForMobile();
      setupMobileObserver();
    } else {
      teardownMobileObserver();
      document.body.style.overflow = '';
      goTo(current, true);
      revealPanel(current);
    }
  }

  window.addEventListener('resize', handleResize);

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    // Mark reveal targets
    panels.forEach(panel => {
      panel.querySelectorAll(
        '.about-text > *, .about-visual, ' +
        '.tech-inner > *, .tech-card, ' +
        '.stats-left > *, .stat-card, ' +
        '.projects-inner > *, ' +
        '.contact-inner > *'
      ).forEach(el => el.classList.add('panel-reveal'));
    });

    // Hook stat counter to panel-3 visit
    window.__goTo = function(idx, skip) {
      goTo(idx, skip);
      if (idx === 3 && !statsAnimated) {
        statsAnimated = true;
        setTimeout(() => {
          document.querySelectorAll('.stat-number[data-target]').forEach(el => {
            animateCounter(el, el.dataset.target, 1400);
          });
        }, 350);
      }
    };

    if (isMobile()) {
      // Mobile: normal page flow
      resetPanelsForMobile();
      setupMobileObserver();
      // Immediately show all panel content (no entrance animation)
      document.querySelectorAll('.panel-reveal').forEach(el => {
        el.classList.add('revealed');
      });
      // Fire stat counter if stats section visible on load
      updateNavbar(0);
    } else {
      // Desktop: full-page snap
      goTo(0, true);
      revealPanel(0);
    }
  });

})();
