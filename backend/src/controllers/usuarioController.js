const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuarioModel');

async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const usuarioExiste = await usuarioModel.buscarPorEmail(email);
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Este e-mail já está em uso.' });
    }

    const saltos = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, saltos);

    const novoUsuario = await usuarioModel.salvar({
      nome,
      email,
      senha: senhaCriptografada
    });

    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await usuarioModel.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, nome: usuario.nome }, 
      process.env.JWT_SECRET,                  
      { expiresIn: '2h' }                      
    );

    res.cookie('norte_eventos_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000
    });

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function logout(req, res) {
  res.clearCookie('norte_eventos_token');
  return res.status(200).json({ mensagem: 'Logout realizado com sucesso!' });
}

async function obterUsuarioLogado(req, res) {
  if (!req.usuarioLogado) {
    return res.status(401).json({ erro: 'Não autorizado.' });
  }
  return res.status(200).json({ 
    id: req.usuarioLogado.id, 
    nome: req.usuarioLogado.nome, 
    email: req.usuarioLogado.email 
  });
}

module.exports = {
  cadastrar,
  login,
  logout,
  obterUsuarioLogado
};
