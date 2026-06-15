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
const eventoRouter = require('./src/routers/eventoRouter');
app.use('/api/eventos', verificarAutenticacao, eventoRouter);

const multer = require('multer');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../frontend/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Rota de Upload
app.post('/api/upload', verificarAutenticacao, upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Nenhuma imagem foi enviada.' });
  }
  // Retorna o caminho relativo que será salvo no banco e lido pelo frontend
  res.status(200).json({ url: `/uploads/${req.file.filename}` });
});

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