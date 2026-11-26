// ============================================
//   NORTE EVENTOS — HOME
//   Home.js
// ============================================

// ---------- TABS: ESTADOS / CONTATOS ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', function () {
    const targetTab = this.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('active-tab');
      b.setAttribute('aria-selected', 'false');
    });
    this.classList.add('active-tab');
    this.setAttribute('aria-selected', 'true');

    if (targetTab) {
      document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        if (panel.dataset.tabPanel === targetTab) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    }
  });
});

// ---------- CONTADOR ANIMADO ----------
function animateCounter(el, target, suffix = '') {
  if (!el) return;
  const duration = 1800;
  const start = performance.now();
  const from = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (target - from) * ease);

    el.textContent = value.toLocaleString('pt-BR') + suffix;

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Dispara quando a seção de stats entra na viewport
const statsSection = document.querySelector('.stats-numbers');
let animated = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !animated) {
      animated = true;
      const statNums = document.querySelectorAll('.stat-num');
      const items = [
        { el: statNums[0], value: 5284, suffix: '' },
        { el: statNums[1], value: 98, suffix: '%' },
        { el: statNums[2], value: 86, suffix: '%' },
      ];
      items.forEach((item) => animateCounter(item.el, item.value, item.suffix));
    }
  });
}, { threshold: 0.3 });

if (statsSection) observer.observe(statsSection);

// ---------- LINK: MINHA CONTA ----------
const btnConta = document.querySelector('.btn-minha-conta');
if (btnConta) {
  btnConta.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/login';
  });
}
