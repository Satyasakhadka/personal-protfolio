/* ============================================================
   SATYASA KHADKA — PERSONAL WEBSITE · SCRIPT
   ============================================================ */

'use strict';

// ── Nav scroll effect ──
const header = document.getElementById('site-header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile menu toggle ──
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

toggle?.addEventListener('click', () => {
  menuOpen = !menuOpen;
  toggle.setAttribute('aria-expanded', menuOpen);
  mobileMenu.style.display = menuOpen ? 'block' : 'none';

  // Animate hamburger → X
  const spans = toggle.querySelectorAll('span');
  if (menuOpen) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity  = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close mobile menu on link click
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    mobileMenu.style.display = 'none';
    toggle.setAttribute('aria-expanded', false);
    const spans = toggle.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

// ── Active nav link highlight on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const activateLink = () => {
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 100;
    if (window.scrollY >= top) current = sec.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.style.color = link.getAttribute('href') === `#${current}`
      ? 'var(--text)'
      : '';
  });
};
window.addEventListener('scroll', activateLink, { passive: true });

// ── Scroll reveal ──
const revealEls = () => {
  document.querySelectorAll(
    '.section-title, .about-grid, .timeline-item, .exp-item, ' +
    '.award-card, .project-card, .skill-group, .cert-list li, ' +
    '.pub-card, .contact-item, .highlight-card'
  ).forEach(el => el.classList.add('reveal'));
};
revealEls();

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Stagger children in grids ──
['awards-grid', 'projects-grid', 'skills-grid', 'about-highlights'].forEach(cls => {
  document.querySelectorAll(`.${cls} .reveal`).forEach((el, i) => {
    el.style.transitionDelay = `${i * 80}ms`;
  });
});
