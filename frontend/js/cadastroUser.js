document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            showToast('Cadastro realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showToast('Erro: ' + dados.erro, 'error');
        }
    } catch (erro) {
        showToast('Não foi possível conectar ao servidor.', 'error');
    }
});


//ANIMAÇÃO DE ENTRADA
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

const phoneInput = document.getElementById('phone');

phoneInput.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');

  if (v.length > 11) v = v.slice(0, 11);

  if (v.length > 6) {
    v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 2) {
    v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else if (v.length > 0) {
    v = `(${v}`;
  }

  e.target.value = v;
});

document.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', function () {
    this.style.transform = 'scale(0.97)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
  });
});