document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            document.cookie = `norte_eventos_token=${dados.token}; path=/; max-age=7200`;

            alert('Logado com sucesso!');
            window.location.href = '/dashboard';
        } else {
            alert('Erro no login: ' + dados.erro);
        }
    } catch (erro) {
        alert('Não foi possível conectar ao servidor.');
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

document.getElementById('btnCadastro').addEventListener('click', () => {
  window.location.href = 'index.html';
});

document.getElementById('btnLogin').addEventListener('click', () => {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert('Por favor, preencha e-mail e senha.');
    return;
  }

  console.log('Login enviado:', { email });
  alert('Login realizado com sucesso!');
});

document.getElementById('btnGoogle').addEventListener('click', () => {
  console.log('Entrar com Google');
  alert('Redirecionando para o Google...');
});

document.getElementById('btnFacebook').addEventListener('click', () => {
  console.log('Entrar com Facebook');
  alert('Redirecionando para o Facebook...');
});