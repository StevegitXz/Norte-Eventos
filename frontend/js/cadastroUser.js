document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('http://localhost:3000/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = '/login';
        } else {
            alert('Erro: ' + dados.erro);
        }
    } catch (erro) {
        alert('Não foi possível conectar ao servidor.');
    }
});