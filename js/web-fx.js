/**
 * L'Amour Atelier — Luxury Web Interaction FX Engine
 * - Hiệu ứng gợn sáng vàng hồng & hạt bụi ánh kim nhẹ khi click bất kỳ nút / thẻ nào
 * - Hiệu ứng nghiêng 3D + vệt ánh sáng champagne khi rê chuột qua poster mẫu & thẻ giá
 * - Hiệu ứng xuất hiện mượt mà theo cuộn (Scroll Reveal Stagger)
 */

let fxInitialized = false;

function spawnClickSparkles(x, y) {
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
  const cards = root.querySelectorAll('.poster-card, .price-card');
  cards.forEach(card => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';

    card.addEventListener('pointermove', e => {
      if (window.innerWidth < 820) return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 7;
      card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-6px)`;
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
  if (!items.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('is-shown');
          obs.unobserve(ent.target);
        }
      });
    },
    { threshold: 0.08 }
  );
  items.forEach((el, idx) => {
    el.style.transitionDelay = `${Math.min(idx % 5, 4) * 65}ms`;
    obs.observe(el);
  });
}
