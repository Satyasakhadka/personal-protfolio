'use strict';

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const whenVisible = (el, fn, threshold = 0.15) => {
  if (!el) return;
  new IntersectionObserver(([e]) => fn(e.isIntersecting), { threshold }).observe(el);
};

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  try { localStorage.setItem('sk-theme', theme); } catch (e) {}
  window.dispatchEvent(new Event('themechange'));
};

$('#theme-toggle')?.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => window.dispatchEvent(new Event('themechange')));

const header   = $('#site-header');
const progress = $('#progress');
const intro    = $('#about');

const onScroll = () => {
  const y = window.scrollY;
  const pastIntro = !intro || y > intro.offsetHeight - 140;
  header.classList.toggle('at-top', !pastIntro && !menuOpen);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
};
window.addEventListener('scroll', onScroll, { passive: true });

const navToggle  = $('#nav-toggle');
const mobileMenu = $('#mobile-menu');
let menuOpen = false;

const setMenu = (open) => {
  menuOpen = open;
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
  onScroll();
};
navToggle?.addEventListener('click', () => setMenu(!menuOpen));
$$('.mob-link').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
document.addEventListener('click', e => {
  if (menuOpen && !mobileMenu.contains(e.target) && !navToggle.contains(e.target)) setMenu(false);
});

const navLinks = $$('.nav-link');
const tracked  = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

const activateLink = () => {
  let current = '';
  tracked.forEach(sec => {
    if (sec.getBoundingClientRect().top < window.innerHeight * 0.4) current = sec.id;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    current = tracked[tracked.length - 1]?.id || current;
  }
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', activateLink, { passive: true });

onScroll();
activateLink();

(() => {
  const canvas = $('#intro-net');
  const host   = $('#about');
  if (!canvas || !host) return;
  const ctx = canvas.getContext('2d');
  const mouse = { x: 0, y: 0, active: false };
  let w = 0, h = 0, colors = {}, raf = 0, running = false;

  const readColors = () => {
    const cs = getComputedStyle(root);
    colors = { ink: cs.getPropertyValue('--ink').trim(), accent: cs.getPropertyValue('--accent').trim() };
  };

  const LINK = 140;
  const REACH = 190;
  let nodes = [];

  const build = () => {
    const count = Math.min(90, Math.round((w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.globalAlpha = (1 - d / LINK) * 0.16;
          ctx.strokeStyle = colors.ink;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (mouse.active) {
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < REACH) {
          ctx.globalAlpha = (1 - d / REACH) * 0.55;
          ctx.strokeStyle = colors.accent;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      const near = mouse.active && Math.hypot(n.x - mouse.x, n.y - mouse.y) < REACH;
      ctx.globalAlpha = near ? 0.9 : 0.3;
      ctx.fillStyle = near ? colors.accent : colors.ink;
      ctx.beginPath(); ctx.arc(n.x, n.y, near ? 2.2 : 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const step = () => {
    for (const n of nodes) {
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
        if (d < REACH && d > 40) { n.vx += (dx / d) * 0.008; n.vy += (dy / d) * 0.008; }
      }
      const sp = Math.hypot(n.vx, n.vy) || 0.01;
      const k = sp > 0.7 ? 0.7 / sp : sp < 0.15 ? 0.15 / sp : 1;
      n.vx *= k; n.vy *= k;
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    draw();
  };

  const resize = () => {
    if (host.clientWidth === w && Math.abs(host.clientHeight - h) < 120) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = host.clientWidth; h = host.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    draw();
  };

  const loop = () => { step(); if (running) raf = requestAnimationFrame(loop); };

  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    mouse.active = true;
  });
  host.addEventListener('pointerleave', () => { mouse.active = false; });

  readColors();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('themechange', () => { readColors(); draw(); });

  if (reduceMotion) return;
  whenVisible(host, visible => {
    running = visible;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  }, 0);
})();

(() => {
  const grid = $('#glyph-grid');
  if (!grid) return;
  const CONJ = ['क्ष','त्र','ज्ञ','श्र','द्ध','द्व','ह्म','ह्न','क्त','क्र','प्र','ग्र',
                'स्त','स्न','न्त','न्द','ष्ट','ष्ठ','द्य','ट्ट','त्त','ङ्क','ञ्ज','स्व'];
  grid.innerHTML = CONJ.map(c => `<span>${c}</span>`).join('');
  const cells = $$('span', grid);
  let timer;

  const shuffle = () => {
    cells.forEach(c => c.classList.remove('on'));
    for (let k = 0; k < 3; k++) {
      const c = cells[(Math.random() * cells.length) | 0];
      c.dataset.p = (0.88 + Math.random() * 0.11).toFixed(2);
      c.classList.add('on');
    }
  };
  shuffle();
  if (reduceMotion) return;
  whenVisible(grid, v => { clearInterval(timer); if (v) timer = setInterval(shuffle, 1100); });
})();

(() => {
  const vis = $('.vis-plate');
  if (!vis) return;
  let timer;
  vis.classList.add('detect');
  if (reduceMotion) return;
  whenVisible(vis, v => {
    clearInterval(timer);
    if (v) timer = setInterval(() => {
      vis.classList.remove('detect');
      setTimeout(() => vis.classList.add('detect'), 500);
    }, 3200);
  });
})();

(() => {
  const textEl  = $('#type-text');
  const suggest = $('#type-suggest');
  if (!textEl) return;

  const DEMO = [
    { start: 'आज मौसम', steps: [
      [['राम्रो', .58], ['धेरै', .21], ['चिसो', .11]],
      [['छ', .83], ['थियो', .09], ['छैन', .04]],
    ]},
    { start: 'नेपाल एक', steps: [
      [['सुन्दर', .47], ['सानो', .22], ['हिमाली', .14]],
      [['देश', .88], ['ठाउँ', .06], ['राष्ट्र', .03]],
      [['हो', .71], ['छ', .24], ['थियो', .02]],
    ]},
    { start: 'म भोलि', steps: [
      [['घर', .44], ['काठमाडौं', .26], ['विद्यालय', .17]],
      [['जान्छु', .79], ['आउँछु', .12], ['फर्कन्छु', .05]],
    ]},
  ];

  const showSuggest = (items) => {
    suggest.innerHTML = items.map(([w, p]) => `<li>${w}<small>${p.toFixed(2)}</small></li>`).join('');
  };
  const render = (words, fresh) => {
    textEl.innerHTML = words.map((w, k) => (k === words.length - 1 && fresh) ? `<span class="w-new">${w}</span>` : w).join(' ');
  };

  if (reduceMotion) { textEl.textContent = DEMO[0].start; showSuggest(DEMO[0].steps[0]); return; }

  let i = 0, timer, active = false;
  const wait = (ms) => new Promise(r => { timer = setTimeout(r, ms); });

  const run = async () => {
    while (active) {
      const { start, steps } = DEMO[i];
      suggest.innerHTML = '';
      const chars = Array.from(start);
      for (let n = 1; n <= chars.length && active; n++) {
        textEl.textContent = chars.slice(0, n).join('');
        await wait(110);
      }
      const words = start.split(' ');
      for (const items of steps) {
        if (!active) return;
        await wait(350);
        showSuggest(items);
        await wait(1500);
        suggest.firstElementChild?.classList.add('tap');
        await wait(350);
        words.push(items[0][0]);
        render(words, true);
        suggest.innerHTML = '';
      }
      textEl.innerHTML = words.join(' ') + '।';
      await wait(1800);
      textEl.textContent = '';
      await wait(400);
      i = (i + 1) % DEMO.length;
    }
  };

  whenVisible(textEl.closest('.work-visual'), v => {
    if (v === active) return;
    active = v;
    clearTimeout(timer);
    if (v) run();
  });
})();

(() => {
  const bars  = $('#bars');
  const label = $('#sort-label');
  if (!bars) return;
  const N = 26;
  let vals = [], els = [], gen, timer;

  const reset = () => {
    vals = Array.from({ length: N }, () => 8 + Math.random() * 92);
    bars.innerHTML = vals.map(v => `<i style="height:${v}%"></i>`).join('');
    els = $$('i', bars);
    gen = bubble();
  };

  function* bubble() {
    for (let pass = 0; pass < N - 1; pass++) {
      label.textContent = `bubble sort · pass ${pass + 1}`;
      for (let j = 0; j < N - 1 - pass; j++) {
        yield [j, j + 1];
        if (vals[j] > vals[j + 1]) {
          [vals[j], vals[j + 1]] = [vals[j + 1], vals[j]];
          els[j].style.height = `${vals[j]}%`;
          els[j + 1].style.height = `${vals[j + 1]}%`;
        }
      }
      els[N - 1 - pass].classList.add('done');
    }
    els[0].classList.add('done');
    label.textContent = 'bubble sort · sorted ✓';
  }

  const tick = () => {
    els.forEach(e => e.classList.remove('cmp'));
    const { value, done } = gen.next();
    if (done) { clearInterval(timer); timer = setTimeout(() => { reset(); start(); }, 2200); return; }
    value.forEach(k => els[k].classList.add('cmp'));
  };
  const start = () => { clearInterval(timer); timer = setInterval(tick, 28); };

  reset();
  if (reduceMotion) return;
  whenVisible(bars, v => { if (v) start(); else { clearInterval(timer); clearTimeout(timer); } });
})();

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

const GALLERY_PHOTOS = [
  { src: '77143EB9-E158-4E66-8CE0-BFEDA7D0A60E.jpg', caption: 'LOCUS 2025 Executive Committee',          wide: true, focus: '50% 40%' },
  { src: '1708441854908.jpeg',                       caption: 'Hult Prize 1st Runner-Up · Team Hawkeye', focus: '50% 70%' },
  { src: 'IMG_9209.jpg',                             caption: 'Best Project Certificate · IOE Pulchowk', focus: '50% 45%' },
  { src: 'IMG_8609.jpg',                             caption: 'Girls to Code · LOCUS 2025',               focus: '50% 40%' },
  { src: '2.jpg',                                    caption: 'Samsung Innovation Campus · AI Course',    focus: '50% 40%' },
];

(() => {
  const bento = $('#bento');
  if (!bento) return;
  const lightbox = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCap = $('#lightbox-cap');
  const lbCount = $('#lightbox-count');
  const pad = (n) => String(n).padStart(2, '0');
  const total = GALLERY_PHOTOS.length;
  let current = 0;

  GALLERY_PHOTOS.forEach(({ src, caption, wide, focus = '50% 50%' }, i) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile reveal' + (wide ? ' wide' : '');
    tile.setAttribute('aria-label', `Open photo: ${caption}`);
    tile.innerHTML = `
      <img src="assets/Gallery/${src}" alt="${caption}" loading="lazy" style="object-position:${focus}">
      <span class="tile-cap"><span>${pad(i + 1)}/${pad(total)}</span>${caption}</span>`;
    tile.addEventListener('click', () => open(i));
    bento.appendChild(tile);
  });

  const show = (i) => {
    current = (i + total) % total;
    const { src, caption } = GALLERY_PHOTOS[current];
    lbImg.src = `assets/Gallery/${src}`;
    lbImg.alt = caption;
    lbCap.textContent = caption;
    lbCount.textContent = `${pad(current + 1)} / ${pad(total)}`;
  };
  const open = (i) => { show(i); lightbox.showModal(); };

  $('#lightbox-prev')?.addEventListener('click', () => show(current - 1));
  $('#lightbox-next')?.addEventListener('click', () => show(current + 1));
  $('#lightbox-close')?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
  lightbox?.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  let startX = 0;
  lightbox?.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  lightbox?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
  });
})();

(() => {
  ['.work-grid', '.awards', '.toolkit', '.certs', '.pubs', '.bento'].forEach(sel => {
    $$(`${sel} .reveal`).forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; });
  });

  const targets = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('visible');
      io.unobserve(el);
      const delay = parseFloat(el.style.transitionDelay) || 0;
      if (el.id === 'portrait') return;
      setTimeout(() => { el.classList.remove('reveal', 'visible'); el.style.transitionDelay = ''; }, 1000 + delay);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(el => io.observe(el));
})();
