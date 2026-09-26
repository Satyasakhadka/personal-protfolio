'use strict';

/* ── Theme toggle ── */
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('sk-theme', theme);
};

(() => {
  const saved = localStorage.getItem('sk-theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  }
  // no attribute = follow system via CSS media query
})();

themeBtn?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ── Nav: scroll effect ── */
const header = document.getElementById('site-header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Nav: mobile menu toggle ── */
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

const closeMenu = () => {
  menuOpen = false;
  toggle.setAttribute('aria-expanded', 'false');
  mobileMenu.style.display = 'none';
  const spans = toggle.querySelectorAll('span');
  spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
};

toggle?.addEventListener('click', () => {
  menuOpen = !menuOpen;
  toggle.setAttribute('aria-expanded', String(menuOpen));
  mobileMenu.style.display = menuOpen ? 'block' : 'none';

  const spans = toggle.querySelectorAll('span');
  if (menuOpen) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    closeMenu();
  }
});

document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

/* ── Nav: active link on scroll ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const activateLink = () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === `#${current}`);
  });
};
window.addEventListener('scroll', activateLink, { passive: true });
activateLink();

/* ── Profile photo: show when loaded ── */
const profileImg = document.getElementById('profile-img');
const heroPhoto = document.getElementById('hero-photo');
if (profileImg && heroPhoto) {
  const tryLoad = () => {
    if (profileImg.complete && profileImg.naturalWidth > 0) {
      heroPhoto.classList.add('loaded');
    }
  };
  profileImg.addEventListener('load', () => heroPhoto.classList.add('loaded'));
  profileImg.addEventListener('error', () => { /* fallback already shown */ });
  tryLoad();
}


/* ── Gallery ──
   To add a photo: drop it in assets/Gallery/ then add one line below.
   Format: { src: 'filename.jpg', caption: 'Event name' }
   ─────────────────────────────────────────────────────────────── */
const GALLERY_PHOTOS = [
  { src: 'IMG_9209.jpg',                             caption: 'Best Project Certificate · IOE Pulchowk' },
  { src: '1708441854908.jpeg',                       caption: 'Hult Prize 1st Runner-Up · Team Hawkeye' },
  { src: '77143EB9-E158-4E66-8CE0-BFEDA7D0A60E.jpg', caption: 'LOCUS 2025 Executive Committee'          },
  { src: 'IMG_8609.jpg',                             caption: 'Girls to Code · LOCUS 2025'               },
  { src: '2.jpg',                                    caption: 'Samsung Innovation Campus · AI Course'    },
];

/* ── Photo slider ── */
const buildGallery = () => {
  const wrap  = document.getElementById('slider-wrap');
  const track = document.getElementById('slider-track');
  const dotsEl = document.getElementById('slider-dots');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const empty  = document.getElementById('gallery-empty');

  if (!track) return;

  if (!GALLERY_PHOTOS.length) {
    if (wrap) wrap.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  let current = 0;
  let timer;
  const total = GALLERY_PHOTOS.length;

  // Build slides
  GALLERY_PHOTOS.forEach(({ src, caption }) => {
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = `
      <img src="assets/Gallery/${src}" alt="${caption}" loading="lazy">
      <span class="slide-caption">${caption}</span>
    `;
    track.appendChild(slide);
  });

  // Build dots
  const dots = GALLERY_PHOTOS.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
    return dot;
  });

  const goTo = (idx) => {
    current = (idx + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  const startAuto = () => { timer = setInterval(next, 4000); };
  const stopAuto  = () => clearInterval(timer);

  nextBtn?.addEventListener('click', () => { next(); stopAuto(); startAuto(); });
  prevBtn?.addEventListener('click', () => { prev(); stopAuto(); startAuto(); });

  wrap?.addEventListener('mouseenter', stopAuto);
  wrap?.addEventListener('mouseleave', startAuto);

  // Swipe support
  let touchStartX = 0;
  wrap?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  wrap?.addEventListener('touchend',   (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); stopAuto(); startAuto(); }
  });

  startAuto();
};

buildGallery();

/* ── Scroll reveal ── */
const targets = document.querySelectorAll(
  '.section-title, .about-grid, .timeline-item, .exp-item, ' +
  '.award-card, .project-card, .skill-group, .cert-item, .pub-card'
);

targets.forEach(el => el.classList.add('reveal'));

/* Stagger children in grids */
['awards-grid', 'projects-grid', 'skills-wrap', 'cert-list'].forEach(cls => {
  document.querySelectorAll(`.${cls} .reveal`).forEach((el, i) => {
    el.style.transitionDelay = `${i * 70}ms`;
  });
});

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
