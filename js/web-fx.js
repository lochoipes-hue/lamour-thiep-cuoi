/**
 * DaiLo Wedding — Luxury Web Interaction FX Engine (v16)
 * - Hiệu ứng gợn sáng vàng hồng & hạt bụi ánh kim nhẹ khi click
 * - Hiệu ứng nghiêng 3D + vệt ánh sáng champagne khi rê chuột qua poster mẫu, thẻ giá & thẻ hiệu ứng
 * - Thanh tiến trình đọc + độ nổi kính mờ thanh điều hướng + thanh Dock nổi tự động đánh dấu mục đang xem
 * - Hiệu ứng xuất hiện mượt mà theo cuộn (Scroll Reveal Stagger)
 */

let fxInitialized = false;
let activeScrollCleanup = null;

function spawnClickSparkles(x, y) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const ripple = document.createElement('span');
  ripple.className = 'fx-click-ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  setTimeout(() => ripple.remove(), 680);

  const count = 7;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = i % 2 === 0 ? 'fx-click-sparkle' : 'fx-click-petal';
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = 22 + Math.random() * 28;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
    dot.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist - 8)}px`);
    dot.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 180)}deg`);
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 720);
  }
}

export function initGlobalWebFx() {
  if (fxInitialized) return;
  fxInitialized = true;

  document.addEventListener('pointerdown', e => {
    if (e.button && e.button !== 0) return;
    if (e.target.closest('input, textarea, select')) return;
    spawnClickSparkles(e.clientX, e.clientY);
  }, { passive: true });
}

export function bindInteractiveTiltCards(root = document) {
  const cards = root.querySelectorAll('.poster-card, .price-card, .fx-showcase-card, .hero-trust-tile');
  cards.forEach(card => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';

    card.addEventListener('pointermove', e => {
      if (window.innerWidth < 820) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const maxTilt = card.classList.contains('hero-trust-tile') ? 4.5 : 6.5;
      const rx = (0.5 - py) * maxTilt;
      const ry = (px - 0.5) * maxTilt;
      card.style.transform = `perspective(960px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
      card.style.setProperty('--mx', `${Math.round(px * 100)}%`);
      card.style.setProperty('--my', `${Math.round(py * 100)}%`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

export function bindScrollStagger(root = document) {
  const items = root.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-shown'));
    return;
  }
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-shown');
          obs.unobserve(ent.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
  );
  items.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx % 5, 4) * 65}ms`;
    obs.observe(el);
  });
}

export function bindSiteScrollProgress(root = document) {
  if (typeof activeScrollCleanup === 'function') {
    activeScrollCleanup();
    activeScrollCleanup = null;
  }
  const progressBar = root.querySelector('[data-site-scroll-bar]');
  const topNav = root.querySelector('.top-nav');
  const dock = root.querySelector('[data-site-dock]');
  const dockLinks = Array.from(root.querySelectorAll('[data-site-jump]'));

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100))}%`;
    }
    if (topNav) {
      topNav.classList.toggle('is-scrolled', scrollTop > 18);
    }
    if (dock) {
      dock.classList.toggle('is-visible', scrollTop > 220);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  let dockObs = null;
  if (dockLinks.length && 'IntersectionObserver' in window) {
    const targets = dockLinks
      .map(btn => root.querySelector(btn.dataset.siteJump))
      .filter(Boolean);
    dockObs = new IntersectionObserver(
      entries => {
        const best = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best || !best.target.id) return;
        const hash = `#${best.target.id}`;
        dockLinks.forEach(btn => btn.classList.toggle('is-active', btn.dataset.siteJump === hash));
      },
      { rootMargin: '-22% 0px -48% 0px', threshold: [0.08, 0.3] }
    );
    targets.forEach(t => dockObs.observe(t));
  }

  dockLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = root.querySelector(btn.dataset.siteJump);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  root.querySelector('[data-site-top]')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  activeScrollCleanup = () => {
    window.removeEventListener('scroll', onScroll);
    if (dockObs) dockObs.disconnect();
  };
  return activeScrollCleanup;
}
