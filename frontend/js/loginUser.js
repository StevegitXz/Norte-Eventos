document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            showToast('Logado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showToast('Erro no login: ' + dados.erro, 'error');
        }
    } catch (erro) {
        showToast('Não foi possível conectar ao servidor.', 'error');
    }
});

window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

document.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', function () {
    this.style.transform = 'scale(0.97)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
  });
});

const btnCadastro = document.getElementById('btnCadastro');
if (btnCadastro) {
  btnCadastro.addEventListener('click', () => {
    window.location.href = '/cadastro';
  });
}

const btnGoogle = document.getElementById('btnGoogle');
if (btnGoogle) {
  btnGoogle.addEventListener('click', () => {
    alert('Redirecionando para o Google...');
  });
}

const btnFacebook = document.getElementById('btnFacebook');
if (btnFacebook) {
  btnFacebook.addEventListener('click', () => {
    alert('Redirecionando para o Facebook...');
  });
}
