require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const usuarioRouter = require('./src/routers/usuarioRouter');
const verificarAutenticacao = require('./src/middlewares/authMiddleware');

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api/usuarios', usuarioRouter); 

// Rota da página Inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Rota da página de Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Rota da página de Cadastro 
app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/cadastroUser.html'));
});

// Rota protegida da Dashboard 
app.get('/dashboard', verificarAutenticacao, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});


const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado na porta http://localhost:${PORT}`);
});