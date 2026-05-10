const express = require('express');
const path = require('path');

const app = express();

// 1. Configura para ler JSON
app.use(express.json());

// 2. Configura a pasta de arquivos estáticos (CSS, Imagens)
// O '../frontend' sobe uma pasta para sair de 'backend' e entrar em 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. Rota para entregar a sua página index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor iniciado com sucesso!`);
    console.log(`🔗 Acesse em: http://localhost:${PORT}`);
});