const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

// Todas essas rotas estarão protegidas pelo middleware verificarAutenticacao no server.js
// Rotas de Exploração e Inscrição (devem vir ANTES das rotas com :id para não conflitar)
router.get('/explorar', eventoController.listarExplorar);

// Rotas CRUD
router.get('/', eventoController.listar);
router.post('/', eventoController.criar);
router.put('/:id', eventoController.atualizar);
router.delete('/:id', eventoController.excluir);

// Rotas de Inscrição e Participantes
router.post('/:id/inscrever', eventoController.inscrever);
router.delete('/:id/inscrever', eventoController.cancelarInscricao);

router.get('/:id/participantes', eventoController.listarParticipantes);
router.post('/:id/participantes', eventoController.adicionarParticipante);
router.delete('/:id/participantes/:participanteId', eventoController.removerParticipante);

module.exports = router;
