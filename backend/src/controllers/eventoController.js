const eventoModel = require('../models/eventoModel');

async function listar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const eventos = await eventoModel.listarPorUsuario(usuarioId);
    return res.status(200).json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar eventos.' });
  }
}

async function criar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, inscritos } = req.body;

    if (!nome || !categoria || !capacidade || !data || !hora || !local) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const novoEvento = await eventoModel.criar({
      nome, categoria, capacidade, data, hora, local, descricao, bannerClass, inscritos
    }, usuarioId);

    return res.status(201).json({
      mensagem: 'Evento criado com sucesso!',
      evento: novoEvento
    });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao criar evento.' });
  }
}

async function atualizar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    const dadosEvento = req.body;

    if (!dadosEvento.nome || !dadosEvento.categoria || !dadosEvento.capacidade || !dadosEvento.data || !dadosEvento.hora || !dadosEvento.local) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const atualizado = await eventoModel.atualizar(id, dadosEvento, usuarioId);

    if (atualizado) {
      return res.status(200).json({ mensagem: 'Evento atualizado com sucesso!' });
    } else {
      return res.status(404).json({ erro: 'Evento não encontrado ou você não tem permissão para editá-lo.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao atualizar evento.' });
  }
}

async function excluir(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;

    const excluido = await eventoModel.excluir(id, usuarioId);

    if (excluido) {
      return res.status(200).json({ mensagem: 'Evento excluído com sucesso!' });
    } else {
      return res.status(404).json({ erro: 'Evento não encontrado ou você não tem permissão para excluí-lo.' });
    }
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao excluir evento.' });
  }
}

module.exports = {
  listar,
  criar,
  atualizar,
  excluir
};
