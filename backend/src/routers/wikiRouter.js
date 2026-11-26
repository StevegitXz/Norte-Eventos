const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');

// Rotas públicas da Central de Documentação (Wiki)
router.get('/indice', wikiController.obterIndice);
router.get('/pagina', wikiController.obterPagina);

module.exports = router;
