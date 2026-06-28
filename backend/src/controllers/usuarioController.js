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

    const token = jwt.sign(
      { id: novoUsuario.id, email: novoUsuario.email, nome: novoUsuario.nome }, 
      process.env.JWT_SECRET,                  
      { expiresIn: '30d' }                      
    );

    res.cookie('norte_eventos_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    });

    return res.status(201).json({
      mensagem: 'Usuário criado e logado com sucesso!',
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
      { expiresIn: '30d' }                      
    );

    res.cookie('norte_eventos_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
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
  try {
    const usuario = await usuarioModel.buscarPorId(req.usuarioLogado.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.status(200).json({ 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email,
      foto_perfil: usuario.foto_perfil 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function atualizarUsuario(req, res) {
  try {
    const { nome, email, senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuarioLogado.id;
    let foto_perfil = undefined;

    if (req.file) {
      foto_perfil = `/uploads/profiles/${req.file.filename}`;
    }

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });
    }

    let senhaHash = undefined;

    if (senhaAtual && novaSenha) {
      const usuario = await usuarioModel.buscarPorId(usuarioId);
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaCorreta) {
        return res.status(400).json({ erro: 'Senha atual incorreta.' });
      }
      const saltos = await bcrypt.genSalt(10);
      senhaHash = await bcrypt.hash(novaSenha, saltos);
    }

    const sucesso = await usuarioModel.atualizar(usuarioId, nome, email, foto_perfil, senhaHash);
    if (sucesso) {
      // Re-assinar o JWT com os novos dados
      const token = jwt.sign(
        { id: usuarioId, email, nome }, 
        process.env.JWT_SECRET,                  
        { expiresIn: '30d' }                      
      );
  
      res.cookie('norte_eventos_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      // Buscar usuário atualizado para retornar foto_perfil
      const usuarioAtualizado = await usuarioModel.buscarPorId(usuarioId);

      return res.status(200).json({ 
        mensagem: 'Perfil atualizado com sucesso!',
        usuario: {
          id: usuarioAtualizado.id,
          nome: usuarioAtualizado.nome,
          email: usuarioAtualizado.email,
          foto_perfil: usuarioAtualizado.foto_perfil
        }
      });
    } else {
      return res.status(400).json({ erro: 'Erro ao atualizar perfil ou e-mail já em uso.' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function excluirConta(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    await usuarioModel.excluir(usuarioId);
    
    res.clearCookie('norte_eventos_token');
    return res.status(200).json({ mensagem: 'Sua conta foi excluída permanentemente.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno ao excluir conta.' });
  }
}

module.exports = {
  cadastrar,
  login,
  logout,
  obterUsuarioLogado,
  atualizarUsuario,
  excluirConta
};
