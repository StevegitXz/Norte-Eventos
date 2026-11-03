require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const verificarAutenticacao = require('./src/middlewares/authMiddleware');

const usuarioRouter = require('./src/routers/usuarioRouter');
const eventoRouter = require('./src/routers/eventoRouter');
const notificacaoRouter = require('./src/routers/notificacaoRouter');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres).');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

// Cabeçalhos HTTP de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// Configuração restritiva de CORS com lista de origens permitidas
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições da mesma origem (sem header Origin) ou origens na whitelist
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pela política de CORS.'));
  },
  credentials: true
}));

// Limite de tamanho de payload JSON para mitigar DoS
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate Limit global para a API e específico para uploads
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { erro: 'Muitas requisições deste IP. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Limite de uploads atingido. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Servir apenas diretórios públicos estáticos (NÃO expor /pages diretamente)
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  next();
}, express.static(path.join(__dirname, '../frontend/uploads')));

// Rotas da API
app.use('/api', apiLimiter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/eventos', verificarAutenticacao, eventoRouter);
app.use('/api/notificacoes', verificarAutenticacao, notificacaoRouter);

// Mapa seguro de MIME types para extensão
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

// Configuração do Multer para upload de imagens de eventos
const uploadDir = path.join(__dirname, '../frontend/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

// Filtro de segurança para extensões e MIME types de arquivo
const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpeg|jpg|png|webp)$/i;
  const extnameValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetypeValid = Boolean(MIME_TO_EXT[file.mimetype]);

  if (extnameValid && mimetypeValid) {
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
app.post('/api/upload', verificarAutenticacao, uploadLimiter, (req, res) => {
  upload.single('imagem')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ erro: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma imagem válida foi enviada.' });
    }
    
    res.status(200).json({ url: `/uploads/${req.file.filename}` });
  });
});

// Rota da página Inicial
app.get(['/', '/home'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Home.html'));
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
