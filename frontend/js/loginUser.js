document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        // Usar a URL absoluta do backend local para evitar problemas se usar Live Server
        const resposta = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Necessário para enviar e receber cookies entre 127.0.0.1 e localhost
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            showToast('Logado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'http://localhost:3000/dashboard';
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

document.getElementById('btnCadastro').addEventListener('click', () => {
  window.location.href = 'index.html';
});



document.getElementById('btnGoogle').addEventListener('click', () => {
  console.log('Entrar com Google');
  alert('Redirecionando para o Google...');
});

document.getElementById('btnFacebook').addEventListener('click', () => {
  console.log('Entrar com Facebook');
  alert('Redirecionando para o Facebook...');
});