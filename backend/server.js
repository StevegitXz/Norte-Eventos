const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

// HOME
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// CADASTRO
app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/cadastro.html'));
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado!`);
    console.log(`http://localhost:${PORT}`);
});