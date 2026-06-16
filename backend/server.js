require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const usuarioRouter = require('./src/routers/usuarioRouter');
const verificarAutenticacao = require('./src/middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const app = express();

// Configuração do Rate Limit para rotas de autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Limita a 15 requisições por IP a cada 15 minutos
  message: { erro: 'Muitas tentativas de acesso. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do CORS para permitir cookies cruzados em dev local
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Permite qualquer origem em desenvolvimento
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Aplica o limiter APENAS nas rotas de usuario (login/cadastro)
app.use('/api/usuarios', authLimiter, usuarioRouter); 

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

// Filtro de segurança para extensões de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: fileFilter
});

// Rota de Upload
app.post('/api/upload', verificarAutenticacao, (req, res) => {
  upload.single('imagem')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Erro do Multer (ex: tamanho do arquivo excedido)
      return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
    } else if (err) {
      // Erro personalizado (ex: tipo de arquivo inválido)
      return res.status(400).json({ erro: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma imagem válida foi enviada.' });
    }
    
    // Retorna o caminho relativo que será salvo no banco e lido pelo frontend
    res.status(200).json({ url: `/uploads/${req.file.filename}` });
  });
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