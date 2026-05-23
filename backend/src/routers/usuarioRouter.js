const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Define que quando chegar um POST em '/', vai para o método cadastrar do controller
router.post('/', usuarioController.cadastrar);

module.exports = router;