const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

// Todas essas rotas estarão protegidas pelo middleware verificarAutenticacao no server.js
router.get('/', eventoController.listar);
router.post('/', eventoController.criar);
router.put('/:id', eventoController.atualizar);
router.delete('/:id', eventoController.excluir);

module.exports = router;
