const notificacaoModel = require('../models/notificacaoModel');

async function listar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const notificacoes = await notificacaoModel.listarPorUsuario(usuarioId);
    return res.status(200).json(notificacoes);
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return res.status(500).json({ erro: 'Erro interno ao carregar notificações.' });
  }
}

async function marcarLida(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    await notificacaoModel.marcarComoLida(id, usuarioId);
    return res.status(200).json({ mensagem: 'Notificação lida.' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

async function limpar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    await notificacaoModel.limparTodas(usuarioId);
    return res.status(200).json({ mensagem: 'Todas as notificações foram limpas.' });
  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

module.exports = {
  listar,
  marcarLida,
  limpar
};
