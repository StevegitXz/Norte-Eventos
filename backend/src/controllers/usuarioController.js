const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const usuarioModel = require('../models/usuarioModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_PROFILE_PATH_REGEX = /^\/uploads\/profiles\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i;

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
  };
}

function validarSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    return 'A senha não pode exceder 72 bytes.';
  }
  return null;
}

function removerArquivoUploadSeguro(relPath) {
  if (!relPath || !SAFE_PROFILE_PATH_REGEX.test(relPath)) return;
  const fullPath = path.join(__dirname, '../../../frontend', relPath);
  fs.unlink(fullPath, () => {});
}

async function cadastrar(req, res) {
  try {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    if (nome.length < 2 || nome.length > 100) {
      return res.status(400).json({ erro: 'O nome deve ter entre 2 e 100 caracteres.' });
    }

    if (email.length > 100 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ erro: 'Informe um endereço de e-mail válido.' });
    }

    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      return res.status(400).json({ erro: erroSenha });
    }

    const usuarioExiste = await usuarioModel.buscarPorEmail(email);
    if (usuarioExiste) {
      return res.status(400).json({ erro: 'Não foi possível concluir o cadastro com os dados informados.' });
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
      { expiresIn: '7d' }
    );

    res.cookie('norte_eventos_token', token, getCookieOptions());

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
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { senha } = req.body;

    if (!email || !senha || typeof senha !== 'string') {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    if (Buffer.byteLength(senha, 'utf8') > 72) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
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
      { expiresIn: '7d' }
    );

    res.cookie('norte_eventos_token', token, getCookieOptions());

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function logout(req, res) {
  res.clearCookie('norte_eventos_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
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
  const novaFotoPath = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;
  try {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { senhaAtual, novaSenha } = req.body;
    const usuarioId = req.usuarioLogado.id;

    if (!nome || !email) {
      if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });
    }

    if (nome.length < 2 || nome.length > 100) {
      if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
      return res.status(400).json({ erro: 'O nome deve ter entre 2 e 100 caracteres.' });
    }

    if (email.length > 100 || !EMAIL_REGEX.test(email)) {
      if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
      return res.status(400).json({ erro: 'Informe um endereço de e-mail válido.' });
    }

    const usuario = await usuarioModel.buscarPorId(usuarioId);
    if (!usuario) {
      if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    let senhaHash = undefined;

    if (senhaAtual || novaSenha) {
      if (!senhaAtual || !novaSenha) {
        if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
        return res.status(400).json({ erro: 'Informe a senha atual e a nova senha para alterá-la.' });
      }
      const erroNovaSenha = validarSenha(novaSenha);
      if (erroNovaSenha) {
        if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
        return res.status(400).json({ erro: erroNovaSenha });
      }
      if (typeof senhaAtual !== 'string' || Buffer.byteLength(senhaAtual, 'utf8') > 72) {
        if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
        return res.status(400).json({ erro: 'Senha atual incorreta.' });
      }
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaCorreta) {
        if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
        return res.status(400).json({ erro: 'Senha atual incorreta.' });
      }
      const saltos = await bcrypt.genSalt(10);
      senhaHash = await bcrypt.hash(novaSenha, saltos);
    }

    const sucesso = await usuarioModel.atualizar(usuarioId, nome, email, novaFotoPath, senhaHash);
    if (sucesso) {
      if (novaFotoPath && usuario.foto_perfil && usuario.foto_perfil !== novaFotoPath) {
        removerArquivoUploadSeguro(usuario.foto_perfil);
      }

      const token = jwt.sign(
        { id: usuarioId, email, nome },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('norte_eventos_token', token, getCookieOptions());

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
      if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
      return res.status(400).json({ erro: 'Não foi possível atualizar o perfil com os dados informados.' });
    }
  } catch (error) {
    if (novaFotoPath) removerArquivoUploadSeguro(novaFotoPath);
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function excluirConta(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const usuario = await usuarioModel.buscarPorId(usuarioId);
    await usuarioModel.excluir(usuarioId);

    if (usuario && usuario.foto_perfil) {
      removerArquivoUploadSeguro(usuario.foto_perfil);
    }

    res.clearCookie('norte_eventos_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
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
