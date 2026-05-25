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