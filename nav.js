/* ═══════════════════════════════════════════════
   SHARED ANIMATIONS & INTERACTIONS
   Used by all pages: index, about, projects, contact
═══════════════════════════════════════════════ */

/* ── 1. PAGE TRANSITION OVERLAY ── */
(function () {
  // Create overlay element once
  const overlay = document.createElement('div');
  overlay.id = 'page-overlay';
  document.body.appendChild(overlay);

  // Fade-in on load (overlay fades OUT)
  window.addEventListener('DOMContentLoaded', () => {
    overlay.classList.add('overlay-out');
  });

  // Intercept all internal links → fade OUT before navigating
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    // Only internal .html links or root links, not mailto/tel/#
    if (!href || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('#') || href.startsWith('http')) return;
    e.preventDefault();
    overlay.classList.remove('overlay-out');
    overlay.classList.add('overlay-in');
    setTimeout(() => { window.location.href = href; }, 480);
  });
})();


/* ── 2. MOBILE NAV TOGGLE ── */
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.classList.toggle('open');
  });
}


/* ── 3. NAVBAR SCROLL SHADOW ── */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar-scrolled', window.scrollY > 10);
  }, { passive: true });
}


/* ── 4. SCROLL-REVEAL (Intersection Observer) ── */
function initScrollReveal() {
  const items = document.querySelectorAll(
    '.tech-card, .stat-card, .contact-card, .about-hero-text > *, .stats-intro > *, .section-title, .section-eyebrow, .prof-illustration'
  );
  items.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', initScrollReveal);


/* ── 5. CURSOR GLOW (desktop only) ── */
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  let mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function animateCursor() {
    cx += (mx - cx) * 0.10;
    cy += (my - cy) * 0.10;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Expand on interactive elements
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, .tech-card, .stat-card, .contact-card')) {
      glow.classList.add('glow-expand');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, .tech-card, .stat-card, .contact-card')) {
      glow.classList.remove('glow-expand');
    }
  });
}


/* ── 6. STAT COUNTER ANIMATION ── */
function animateCounter(el, target, duration = 1400) {
  const isSymbol = isNaN(parseInt(target));
  if (isSymbol) return;
  const num = parseInt(target);
  const suffix = target.replace(/[0-9]/g, '');
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * num) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', () => {
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statNumbers.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.textContent.trim();
        animateCounter(el, target);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(el => obs.observe(el));
});


/* ── 7. TYPING EFFECT on hero eyebrow (index page only) ── */
document.addEventListener('DOMContentLoaded', () => {
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (!eyebrow) return;
  const text = eyebrow.textContent;
  eyebrow.textContent = '';
  eyebrow.style.opacity = 1;
  let i = 0;
  const timer = setInterval(() => {
    eyebrow.textContent += text[i++];
    if (i >= text.length) clearInterval(timer);
  }, 55);
});


/* ── 8. BUTTON RIPPLE ── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top  = `${e.clientY - rect.top}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});


/* ── 9. CODE LINES BLINK in prof illustration ── */
document.addEventListener('DOMContentLoaded', () => {
  const lines = document.querySelectorAll('.prof-code-line');
  if (!lines.length) return;
  setInterval(() => {
    const idx = Math.floor(Math.random() * lines.length);
    lines[idx].classList.add('blink');
    setTimeout(() => lines[idx].classList.remove('blink'), 400);
  }, 700);
});