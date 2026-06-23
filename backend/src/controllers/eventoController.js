const eventoModel = require('../models/eventoModel');
const notificacaoModel = require('../models/notificacaoModel');

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

async function listarExplorar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const eventos = await eventoModel.listarExplorar(usuarioId);
    return res.status(200).json(eventos);
  } catch (error) {
    console.error('Erro ao explorar eventos:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao explorar eventos.' });
  }
}

async function inscrever(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const nomeInscrito = req.usuarioLogado.nome; // Vem do JWT
    const { id } = req.params;
    
    const resultado = await eventoModel.inscrever(usuarioId, id);
    
    // Dispara notificação se sucesso e não for o próprio dono
    if (resultado.sucesso && resultado.dono_evento_id && resultado.dono_evento_id !== usuarioId) {
      await notificacaoModel.criar(
        resultado.dono_evento_id, 
        `${nomeInscrito} acabou de se inscrever no seu evento!`
      );
    }

    return res.status(200).json({ mensagem: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao inscrever-se:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao realizar inscrição.' });
  }
}

async function cancelarInscricao(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    await eventoModel.cancelarInscricao(usuarioId, id);
    return res.status(200).json({ mensagem: 'Inscrição cancelada com sucesso!' });
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao cancelar inscrição.' });
  }
}

async function criar(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url, inscritos } = req.body;

    if (!nome || !categoria || !capacidade || !data || !hora || !local) {
      return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const novoEvento = await eventoModel.criar({
      nome, categoria, capacidade, data, hora, local, descricao, bannerClass, imagem_url, inscritos
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

// -----------------------------------------------------
// GERENCIAMENTO DE PARTICIPANTES (ORGANIZADOR)
// -----------------------------------------------------

async function listarParticipantes(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params; // ID do evento
    const participantes = await eventoModel.listarParticipantes(id, usuarioId);
    return res.status(200).json(participantes);
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para ver os participantes deste evento.' });
    }
    console.error('Erro ao listar participantes:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao listar participantes.' });
  }
}

async function removerParticipante(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id, participanteId } = req.params;
    
    await eventoModel.removerParticipante(id, participanteId, usuarioId);
    return res.status(200).json({ mensagem: 'Participante removido com sucesso.' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para remover participantes deste evento.' });
    }
    console.error('Erro ao remover participante:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao remover participante.' });
  }
}

async function adicionarParticipante(req, res) {
  try {
    const usuarioId = req.usuarioLogado.id;
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: 'O e-mail do participante é obrigatório.' });
    }

    await eventoModel.adicionarParticipante(id, email, usuarioId);
    return res.status(201).json({ mensagem: 'Participante adicionado com sucesso!' });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      return res.status(403).json({ erro: 'Você não tem permissão para adicionar participantes neste evento.' });
    }
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ erro: 'Nenhum usuário encontrado com este e-mail no sistema.' });
    }
    if (error.message === 'ALREADY_SUBSCRIBED') {
      return res.status(400).json({ erro: 'Este usuário já está inscrito no evento.' });
    }
    console.error('Erro ao adicionar participante:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor ao adicionar participante.' });
  }
}

module.exports = {
  listar,
  listarExplorar,
  inscrever,
  cancelarInscricao,
  criar,
  atualizar,
  excluir,
  listarParticipantes,
  removerParticipante,
  adicionarParticipante
};
