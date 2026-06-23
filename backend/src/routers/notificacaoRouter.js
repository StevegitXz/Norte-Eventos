const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

// Todas as rotas de notificações passam pelo verificarAutenticacao no server.js
router.get('/', notificacaoController.listar);
router.put('/:id/lida', notificacaoController.marcarLida);
router.delete('/', notificacaoController.limpar);

module.exports = router;
