const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarAutenticacao = require('../middlewares/authMiddleware');

router.post('/', usuarioController.cadastrar);
router.post('/login', usuarioController.login);
router.get('/me', verificarAutenticacao, usuarioController.obterUsuarioLogado);
router.put('/me', verificarAutenticacao, usuarioController.atualizarUsuario);
router.delete('/me', verificarAutenticacao, usuarioController.excluirConta);
router.post('/logout', usuarioController.logout);

module.exports = router;