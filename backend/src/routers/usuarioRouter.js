const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarAutenticacao = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Rate Limiter para rotas de autenticação (login/cadastro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  message: { erro: 'Muitas tentativas de acesso. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter para atualização de perfil/senha (mitiga brute-force de senhaAtual)
const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  message: { erro: 'Muitas tentativas de atualização de perfil. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../frontend/uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.(jpeg|jpg|png|webp)$/i;
  const extnameValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetypeValid = Boolean(MIME_TO_EXT[file.mimetype]);

  if (extnameValid && mimetypeValid) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas para a foto de perfil!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite de 2MB para foto de perfil
  fileFilter: fileFilter
});

function uploadFotoPerfilMiddleware(req, res, next) {
  upload.single('foto_perfil')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ erro: `Erro no upload da foto: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ erro: err.message });
    }
    next();
  });
}

router.post('/', authLimiter, usuarioController.cadastrar);
router.post('/login', authLimiter, usuarioController.login);
router.get('/me', verificarAutenticacao, usuarioController.obterUsuarioLogado);
router.put('/me', verificarAutenticacao, profileUpdateLimiter, uploadFotoPerfilMiddleware, usuarioController.atualizarUsuario);
router.delete('/me', verificarAutenticacao, usuarioController.excluirConta);
router.post('/logout', usuarioController.logout);

module.exports = router;
