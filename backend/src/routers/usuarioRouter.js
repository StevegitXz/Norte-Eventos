const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarAutenticacao = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');

const fs = require('fs');

// Rate Limiter apenas para rotas de autenticação (login/cadastro)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  message: { erro: 'Muitas tentativas de acesso. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../../frontend/uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/', authLimiter, usuarioController.cadastrar);
router.post('/login', authLimiter, usuarioController.login);
router.get('/me', verificarAutenticacao, usuarioController.obterUsuarioLogado);
router.put('/me', verificarAutenticacao, upload.single('foto_perfil'), usuarioController.atualizarUsuario);
router.delete('/me', verificarAutenticacao, usuarioController.excluirConta);
router.post('/logout', usuarioController.logout);

module.exports = router;