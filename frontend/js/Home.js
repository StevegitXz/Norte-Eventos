// ============================================
//   NORTE EVENTOS — HOME
//   home.js
// ============================================

// ---------- TABS: ESTADOS / CONTATOS ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active-tab'));
    this.classList.add('active-tab');
  });
});

// ---------- CONTADOR ANIMADO ----------
function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();
  const from = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (target - from) * ease);

    // Formatar com ponto para milhares
    el.textContent = value.toLocaleString('pt-BR') + suffix;

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Dispara quando a seção de stats entra na viewport
const statsSection = document.querySelector('.stats-numbers');
let animated = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !animated) {
      animated = true;
      const items = [
        { el: document.querySelectorAll('.stat-num')[0], value: 5284, suffix: '' },
        { el: document.querySelectorAll('.stat-num')[1], value: 98,   suffix: '%' },
        { el: document.querySelectorAll('.stat-num')[2], value: 86,   suffix: '%' },
      ];
      items.forEach(item => animateCounter(item.el, item.value, item.suffix));
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