const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');

async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    // 1. Validação simples
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    // 2. Verificar se e-mail já existe chamando o Model
    const usuarioExiste = await usuarioModel.buscarPorEmail(email);
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
    }

    // 3. Criptografia de senha
    const saltos = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, saltos);

    // 4. Salvar usando o Model
    const novoUsuario = await usuarioModel.salvar({
      nome,
      email,
      senha: senhaCriptografada
    });

    // 5. Retornar sucesso (escondendo a senha)
    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

module.exports = {
  cadastrar
};